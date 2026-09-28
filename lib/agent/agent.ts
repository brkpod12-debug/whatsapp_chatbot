import "server-only";
import { serviceClient } from "@/lib/desk/supabase";
import { escalate } from "@/lib/desk/escalate";
import { assembleContext } from "./context";
import { chat, groqModel, type ChatMessage } from "./groq";
import { checkDraft, RETRY_INSTRUCTION, SAFE_FALLBACK } from "./guardrail";
import { runTool, TOOL_SCHEMAS, type ToolContext } from "./tools";

export type Reply = {
  body: string;
  /** Shown on /desk/audit: tools called, guardrail blocks, model used. */
  audit?: Record<string, unknown>;
};

/** How many times the model may call tools before it has to answer. */
const MAX_TOOL_ROUNDS = 3;
/** Guardrail retries before the safe fallback is sent instead. */
const MAX_REGENERATIONS = 2;

export async function generateReply(conversationId: string): Promise<Reply | null> {
  const db = serviceClient();

  const context = await assembleContext(conversationId);
  if (!context) return null;

  const ctx: ToolContext = {
    conversationId,
    customerId: context.customerId,
    leadId: context.lead?.id ?? null,
  };

  const messages: ChatMessage[] = [...context.messages];
  const toolsUsed: string[] = [];
  const blocks: { rule: string; evidence: string; draft: string }[] = [];

  // Anything a tool returned is quotable too: a price the model read out of
  // search_properties is a real price, and the guardrail must not reject it.
  let quotable = context.quotable;
  let escalated = false;

  let draft: string | null = null;

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
    const completion = await chat(messages, {
      tools: round < MAX_TOOL_ROUNDS ? TOOL_SCHEMAS : undefined,
      temperature: 0.3,
      maxTokens: 400,
    });

    if (completion.toolCalls.length === 0) {
      draft = (completion.content ?? "").trim();
      break;
    }

    messages.push({ role: "assistant", content: completion.content, tool_calls: completion.toolCalls });

    for (const call of completion.toolCalls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
      } catch {
        // A malformed tool call is the model's problem to recover from; tell it
        // rather than throwing away the turn.
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({ error: "Arguments were not valid JSON." }),
        });
        continue;
      }

      const outcome = await runTool(call.function.name, args, ctx);
      toolsUsed.push(call.function.name);
      if (outcome.quotable) quotable += `\n${outcome.quotable}`;
      if (outcome.escalated) escalated = true;

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(outcome.result).slice(0, 4000),
      });
    }
  }

  if (!draft) {
    await db.from("audit_log").insert({
      conversation_id: conversationId,
      event: "guardrail_block",
      actor: "system",
      detail: { rule: "no_draft", toolsUsed },
    });
    return null;
  }

  // Guardrail. Generate, check, and on a block tell the model exactly which
  // rule it broke rather than asking it to try again and hope.
  for (let attempt = 0; attempt <= MAX_REGENERATIONS; attempt += 1) {
    const verdict = checkDraft(draft, { quotableText: quotable, internalNotes: context.internalNotes });
    if (verdict.ok) {
      return {
        body: draft,
        audit: {
          model: groqModel(),
          toolsUsed,
          blocks,
          escalated,
          regenerations: attempt,
        },
      };
    }

    blocks.push({ rule: verdict.rule, evidence: verdict.evidence, draft });

    await db.from("audit_log").insert({
      conversation_id: conversationId,
      event: "guardrail_block",
      actor: "ai",
      detail: { rule: verdict.rule, evidence: verdict.evidence, draft, attempt },
    });

    if (attempt === MAX_REGENERATIONS) break;

    messages.push({ role: "assistant", content: draft });
    messages.push({ role: "user", content: RETRY_INSTRUCTION[verdict.rule] });

    const retry = await chat(messages, { temperature: 0.2, maxTokens: 400 });
    draft = (retry.content ?? "").trim();
    if (!draft) break;
  }

  // Three drafts, three blocks. Say nothing and get a human on it.
  await escalate(conversationId, "agent_stuck", {
    note: `Guardrail blocked ${blocks.length} drafts: ${blocks.map((b) => b.rule).join(", ")}`,
  });

  return {
    body: SAFE_FALLBACK,
    audit: { model: groqModel(), toolsUsed, blocks, fallback: true, escalated: true },
  };
}
