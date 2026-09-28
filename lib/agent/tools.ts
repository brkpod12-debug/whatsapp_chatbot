import "server-only";
import { serviceClient } from "@/lib/desk/supabase";
import { applyLeadFields, type LeadPatch } from "@/lib/desk/lead";
import { escalate, type EscalationReason } from "@/lib/desk/escalate";
import { retrieveKnowledge, searchProperties } from "./retrieve";
import type { ToolSchema } from "./groq";

/**
 * What the agent is allowed to do to the world. Everything it learns and every
 * commitment it makes goes through one of these, so the audit trail is complete
 * and nothing depends on the model remembering to mention something in prose.
 */

export type ToolContext = {
  conversationId: string;
  customerId: string;
  leadId: string | null;
};

const CRORE = 10_000_000;

/** Budget bands are what scoring and the dashboard group by. Derived, not asked. */
export function budgetBand(maxInr: number | null | undefined): string | null {
  if (!maxInr) return null;
  if (maxInr < 1 * CRORE) return "under_1cr";
  if (maxInr < 3 * CRORE) return "1_3cr";
  if (maxInr < 6 * CRORE) return "3_6cr";
  return "6cr_plus";
}

export const TOOL_SCHEMAS: ToolSchema[] = [
  {
    type: "function",
    function: {
      name: "search_properties",
      description:
        "Find holdings the firm currently has. Call this before naming or describing any property. Returns only holdings the desk has cleared for the bot.",
      parameters: {
        type: "object",
        properties: {
          asset_class: { type: "string", enum: ["villa", "apartment", "farmland"] },
          locality: { type: "string", description: "e.g. Shankarpally, Nizampet, Kokapet" },
          budget_max: {
            type: "number",
            description: "Upper budget in rupees, e.g. 15000000 for 1.5 Cr",
          },
          bhk: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_property",
      description: "Full detail for one holding, by its folio.",
      parameters: {
        type: "object",
        properties: { folio: { type: "string" } },
        required: ["folio"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_lead_fields",
      description:
        "Record what you have learned about this requirement. Call it as soon as you learn anything, before replying. Omit whatever you do not know; never guess.",
      parameters: {
        type: "object",
        properties: {
          intent: { type: "string", enum: ["buy", "sell", "rent", "invest", "unknown"] },
          asset_class: { type: "string", enum: ["villa", "apartment", "farmland"] },
          locality: { type: "string" },
          budget_min: { type: "number", description: "In rupees" },
          budget_max: { type: "number", description: "In rupees" },
          timeline_months: { type: "number" },
          purpose: {
            type: "string",
            enum: ["enduse", "investment", "farmhouse", "nri_parking"],
          },
          property_folio: {
            type: "string",
            description: "Folio of the holding they are interested in",
          },
          tags: {
            type: "array",
            items: {
              type: "string",
              enum: ["NRI", "SELLER", "BROKER", "REPEAT", "PRICE_FISHING", "OUT_OF_AREA"],
            },
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "request_dossier",
      description:
        "The person asked for the private dossier. Flags it for the concierge to prepare.",
      parameters: {
        type: "object",
        properties: { property_folio: { type: "string" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_call_slot",
      description:
        "The person agreed to a first call or a site visit at a specific time. Only call this once they have named a time.",
      parameters: {
        type: "object",
        properties: {
          when_iso: {
            type: "string",
            description: "ISO 8601 datetime in IST, e.g. 2026-09-20T11:00:00+05:30",
          },
          kind: { type: "string", enum: ["call", "site_visit", "video_call", "drone_pass"] },
          property_folio: { type: "string" },
          notes: { type: "string" },
        },
        required: ["when_iso", "kind"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalate",
      description:
        "Hand the conversation to the concierge and stop replying. Use for a human request, a seller, a broker, anything legal, anything above 5 Cr, or when you are stuck.",
      parameters: {
        type: "object",
        properties: {
          reason: {
            type: "string",
            enum: [
              "customer_asked_for_human",
              "seller",
              "broker",
              "legal_or_complaint",
              "high_value",
              "agent_stuck",
            ],
          },
          note: { type: "string", description: "One line for the concierge" },
        },
        required: ["reason"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "answer_from_knowledge",
      description:
        "Look up a firm fact, policy or FAQ answer. Use before saying you do not know something.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
];

async function folioToId(folio: string): Promise<string | null> {
  const db = serviceClient();
  const { data } = await db
    .from("properties")
    .select("id")
    .eq("folio", folio)
    .eq("bot_visible", true)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

export type ToolOutcome = {
  result: unknown;
  /** Property facts the reply may quote; fed to the guardrail as context. */
  quotable?: string;
  escalated?: boolean;
};

export async function runTool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext
): Promise<ToolOutcome> {
  const db = serviceClient();

  switch (name) {
    case "search_properties": {
      const matches = await searchProperties({
        assetClass: (args.asset_class as string) ?? null,
        locality: (args.locality as string) ?? null,
        budgetMax: (args.budget_max as number) ?? null,
        bhk: (args.bhk as number) ?? null,
      });
      return { result: matches, quotable: JSON.stringify(matches) };
    }

    case "get_property": {
      const matches = await searchProperties({ limit: 50 });
      const one = matches.find((p) => p.folio === args.folio) ?? null;
      return {
        result: one ?? { error: "No such holding is available." },
        quotable: JSON.stringify(one),
      };
    }

    case "save_lead_fields": {
      if (!ctx.leadId) return { result: { saved: false } };

      const budgetMax = (args.budget_max as number) ?? null;
      const patch: LeadPatch = {
        intent: (args.intent as string) ?? undefined,
        asset_class: (args.asset_class as string) ?? undefined,
        locality: (args.locality as string) ?? undefined,
        budget_min: (args.budget_min as number) ?? undefined,
        budget_max: budgetMax ?? undefined,
        budget_band: budgetBand(budgetMax) ?? undefined,
        timeline_months: (args.timeline_months as number) ?? undefined,
        purpose: (args.purpose as string) ?? undefined,
        addTags: (args.tags as string[]) ?? [],
      };

      if (args.property_folio) {
        const id = await folioToId(String(args.property_folio));
        if (id) patch.property_of_interest = id;
      }

      const update = await applyLeadFields(ctx.leadId, patch);

      // Crossing into HOT is itself an escalation trigger. The debounce inside
      // `escalate` keeps this from firing again on every later turn.
      if (update?.becameHot) {
        await escalate(ctx.conversationId, "became_hot", { stopAi: false });
      }

      return {
        result: { saved: true, score: update?.score, temperature: update?.temperature },
      };
    }

    case "request_dossier": {
      if (!ctx.leadId) return { result: { flagged: false } };
      const patch: LeadPatch = { dossier_requested: true, stage: "qualifying" };
      if (args.property_folio) {
        const id = await folioToId(String(args.property_folio));
        if (id) patch.property_of_interest = id;
      }
      const update = await applyLeadFields(ctx.leadId, patch);
      if (update?.becameHot) await escalate(ctx.conversationId, "became_hot", { stopAi: false });
      return { result: { flagged: true, temperature: update?.temperature } };
    }

    case "propose_call_slot": {
      if (!ctx.leadId) return { result: { booked: false } };

      const propertyId = args.property_folio ? await folioToId(String(args.property_folio)) : null;
      const kind = (args.kind as string) ?? "call";

      const { error } = await db.from("viewings").insert({
        lead_id: ctx.leadId,
        property_id: propertyId,
        kind,
        scheduled_at: args.when_iso as string,
        status: "proposed",
        notes: (args.notes as string) ?? null,
      });
      if (error) return { result: { booked: false, error: error.message } };

      const update = await applyLeadFields(ctx.leadId, {
        stage: kind === "call" ? "call_booked" : "viewing",
        call_booked_at: kind === "call" ? new Date().toISOString() : undefined,
        viewing_requested: kind === "call" ? undefined : true,
      });

      if (update?.becameHot) await escalate(ctx.conversationId, "became_hot", { stopAi: false });
      return { result: { booked: true, when: args.when_iso, kind } };
    }

    case "escalate": {
      const reason = (args.reason as EscalationReason) ?? "agent_stuck";
      if (ctx.leadId && (reason === "seller" || reason === "broker")) {
        await applyLeadFields(ctx.leadId, { addTags: [reason.toUpperCase()] });
      }
      const outcome = await escalate(ctx.conversationId, reason, {
        note: (args.note as string) ?? undefined,
      });
      return { result: outcome, escalated: true };
    }

    case "answer_from_knowledge": {
      const { pinned, matched } = await retrieveKnowledge(String(args.query ?? ""));
      const entries = [...pinned, ...matched].map((e) => ({
        title: e.title,
        content: e.content,
      }));
      return { result: entries, quotable: JSON.stringify(entries) };
    }

    default:
      return { result: { error: `Unknown tool ${name}` } };
  }
}
