import "server-only";

/**
 * Groq's chat-completions endpoint is OpenAI-compatible, which is one JSON POST.
 * The `openai` SDK would add a few megabytes to do the same thing, so this is a
 * `fetch`.
 *
 * One model does routing, extraction and the customer-facing reply. Swapping it
 * is an env edit: `llama-3.3-70b-versatile` was deprecated in June 2026, so the
 * default is the current production model. See
 * https://console.groq.com/docs/models
 */

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";

export type ToolSchema = {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type Completion = {
  content: string | null;
  toolCalls: ToolCall[];
  finishReason: string;
};

export class GroqError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "GroqError";
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function groqModel(): string {
  return process.env.GROQ_MODEL || DEFAULT_MODEL;
}

export async function chat(
  messages: ChatMessage[],
  options: { tools?: ToolSchema[]; temperature?: number; maxTokens?: number } = {}
): Promise<Completion> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new GroqError("GROQ_API_KEY is not set", 0);

  const body = JSON.stringify({
    model: groqModel(),
    messages,
    ...(options.tools?.length ? { tools: options.tools, tool_choice: "auto" } : {}),
    temperature: options.temperature ?? 0.3,
    max_completion_tokens: options.maxTokens ?? 500,
  });

  // Rate limits and transient 5xx are normal on a shared inference endpoint,
  // and this runs after the response has already gone back to Meta, so waiting
  // costs nobody anything.
  let lastError: GroqError | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body,
    });

    if (res.ok) {
      const json = (await res.json()) as {
        choices?: { message?: { content?: string | null; tool_calls?: ToolCall[] }; finish_reason?: string }[];
      };
      const choice = json.choices?.[0];
      return {
        content: choice?.message?.content ?? null,
        toolCalls: choice?.message?.tool_calls ?? [],
        finishReason: choice?.finish_reason ?? "stop",
      };
    }

    const detail = await res.text().catch(() => "");
    lastError = new GroqError(`Groq ${res.status}: ${detail.slice(0, 300)}`, res.status);

    // 4xx other than 429 is a bad request; retrying sends the same bad request.
    if (res.status !== 429 && res.status < 500) throw lastError;

    const retryAfter = Number(res.headers.get("retry-after"));
    await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 600 * 2 ** attempt);
  }

  throw lastError ?? new GroqError("Groq request failed", 0);
}
