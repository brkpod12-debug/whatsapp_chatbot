import "server-only";
import { serviceClient } from "@/lib/desk/supabase";
import { ensureLead, type LeadRow } from "@/lib/desk/lead";
import { buildSystemPrompt } from "./prompt";
import { internalNotes, retrieveKnowledge, searchProperties, type MirrorProperty } from "./retrieve";
import type { ChatMessage } from "./groq";

/**
 * Prompt assembly. Order matters: models weight the start and the end of a
 * prompt most heavily, so the rules go first and the customer's actual message
 * goes last, with the retrieved facts in between.
 *
 * Budgets from the spec, roughly: system ~900 tokens, pinned knowledge ~300,
 * retrieved knowledge ~600, properties ~500, customer memory ~200, summary
 * ~250, last ten turns ~800.
 */

const HISTORY_TURNS = 10;

export type AssembledContext = {
  messages: ChatMessage[];
  lead: LeadRow | null;
  customerId: string;
  /** Everything the reply is permitted to quote a rupee figure from. */
  quotable: string;
  internalNotes: string[];
  isFirstMessage: boolean;
  latestInbound: string;
};

function renderProperties(properties: MirrorProperty[]): string {
  if (properties.length === 0) return "";
  return properties
    .map((p) =>
      [
        `${p.folio ? `[${p.folio}] ` : ""}${p.name}`,
        `  type: ${p.assetClass}${p.locality ? `, ${p.locality}` : ""}`,
        `  price: ${p.priceDisplay ?? "not published"}`,
        `  area: ${p.areaDisplay ?? "not published"}`,
        p.bhk ? `  config: ${p.bhk} BHK` : null,
        `  status: ${p.status}`,
        p.holdingNote ? `  holding: ${p.holdingNote}` : null,
        p.publicSummary ? `  summary: ${p.publicSummary}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n\n");
}

export async function assembleContext(conversationId: string): Promise<AssembledContext | null> {
  const db = serviceClient();

  const { data: conversation } = await db
    .from("conversations")
    .select("id, customer_id, summary, summary_upto_message_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) return null;
  const customerId = conversation.customer_id as string;

  const [{ data: history }, { data: memory }, { data: settings }] = await Promise.all([
    db
      .from("messages")
      .select("id, direction, sender, body, transcript, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(HISTORY_TURNS),
    db.from("customer_memory").select("key, value").eq("customer_id", customerId).limit(30),
    db.from("agent_settings").select("tone_instructions").eq("id", 1).maybeSingle(),
  ]);

  const turns = (history ?? []).slice().reverse();
  const inbound = turns.filter((m) => m.direction === "inbound");
  const latestInbound =
    ((inbound.at(-1)?.body ?? inbound.at(-1)?.transcript) as string | null) ?? "";

  if (!latestInbound.trim()) return null;

  const lead = await ensureLead(conversationId, customerId);

  // Knowledge and holdings are both scoped by what is already known about the
  // requirement, so an apartment conversation is not handed farmland notes.
  const [knowledge, properties, notes] = await Promise.all([
    retrieveKnowledge(latestInbound, {
      assetClass: lead?.asset_class ?? null,
      locality: lead?.locality ?? null,
    }),
    searchProperties({
      assetClass: lead?.asset_class ?? null,
      locality: lead?.locality ?? null,
      budgetMax: lead?.budget_max ?? null,
      limit: 4,
    }),
    internalNotes(),
  ]);

  const knowledgeBlock = [...knowledge.pinned, ...knowledge.matched]
    .map((e) => `## ${e.title}\n${e.content}`)
    .join("\n\n");

  const propertiesBlock = renderProperties(properties);

  const memoryBlock = (memory ?? [])
    .map((m) => `- ${m.key as string}: ${m.value as string}`)
    .join("\n");

  const system = buildSystemPrompt({
    knowledge: knowledgeBlock,
    properties: propertiesBlock,
    customerMemory: memoryBlock,
    summary: (conversation.summary as string | null) ?? "",
    // A thread with a single inbound message and nothing sent back has not been
    // greeted yet, so the verification note belongs on this reply.
    isFirstMessage: turns.filter((m) => m.direction === "outbound").length === 0,
    toneInstructions: (settings?.tone_instructions as string | null) ?? null,
  });

  const messages: ChatMessage[] = [{ role: "system", content: system }];

  for (const turn of turns) {
    const text = ((turn.body ?? turn.transcript) as string | null)?.trim();
    if (!text) continue;
    messages.push(
      turn.direction === "inbound"
        ? { role: "user", content: text }
        : { role: "assistant", content: text }
    );
  }

  return {
    messages,
    lead,
    customerId,
    // The guardrail compares every rupee figure in the draft against this.
    quotable: [knowledgeBlock, propertiesBlock].join("\n"),
    internalNotes: notes,
    isFirstMessage: turns.filter((m) => m.direction === "outbound").length === 0,
    latestInbound,
  };
}
