"use server";

import { revalidatePath } from "next/cache";
import { deskClient } from "@/lib/desk/supabase";

export type KnowledgeState = { ok: boolean; message: string };

async function requireUser() {
  const supabase = await deskClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, user };
}

function readForm(form: FormData) {
  const priority = Number(form.get("priority") ?? 100);

  return {
    category: String(form.get("category") ?? "").trim() || "faq",
    title: String(form.get("title") ?? "").trim(),
    content: String(form.get("content") ?? "").trim(),
    keywords: String(form.get("keywords") ?? "")
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean),
    priority: Number.isFinite(priority) ? priority : 100,
    scope: String(form.get("scope") ?? "global").trim() || "global",
    scope_value: String(form.get("scopeValue") ?? "").trim() || null,
    expires_at: String(form.get("expiresAt") ?? "").trim() || null,
  };
}

/**
 * An owner edit here changes what the bot says on the next message. The
 * `kb_bump` trigger in migration 0001 bumps `system_state.knowledge_version`,
 * so nothing has to be redeployed and nothing serves a stale prompt.
 */
export async function saveEntry(_prev: KnowledgeState, form: FormData): Promise<KnowledgeState> {
  const { supabase, user } = await requireUser();

  const id = String(form.get("id") ?? "").trim();
  const values = readForm(form);

  if (!values.title || !values.content) {
    return { ok: false, message: "A title and an answer are both required." };
  }

  const row = {
    ...values,
    pinned: values.priority >= 900,
    active: true,
    source: "manual",
    created_by: user.id,
  };

  const { error } = id
    ? await supabase.from("knowledge_entries").update(row).eq("id", id)
    : await supabase.from("knowledge_entries").insert(row);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/desk/knowledge");
  return { ok: true, message: id ? "Updated." : "Added." };
}

/**
 * Retires an entry instead of deleting it. History matters here: when the bot
 * said something odd three weeks ago, the answer it was working from should
 * still be readable.
 */
export async function retireEntry(id: string): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("knowledge_entries").update({ active: false }).eq("id", id);
  revalidatePath("/desk/knowledge");
}

export async function restoreEntry(id: string): Promise<void> {
  const { supabase } = await requireUser();
  await supabase.from("knowledge_entries").update({ active: true }).eq("id", id);
  revalidatePath("/desk/knowledge");
}
