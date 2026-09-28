"use server";

import { revalidatePath } from "next/cache";
import { deskClient } from "@/lib/desk/supabase";

async function requireUser() {
  const supabase = await deskClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, user };
}

/**
 * Stage is the one lead field a human owns outright. The agent never writes it
 * past `qualifying`, so moving a lead to `offer` or `lost` is always a decision
 * somebody made, and the audit row records who.
 */
export async function setStage(leadId: string, stage: string): Promise<void> {
  const { supabase, user } = await requireUser();

  const { data: before } = await supabase
    .from("leads")
    .select("stage, conversation_id")
    .eq("id", leadId)
    .maybeSingle();

  await supabase.from("leads").update({ stage }).eq("id", leadId);

  await supabase.from("audit_log").insert({
    conversation_id: (before?.conversation_id as string | null) ?? null,
    event: "stage_change",
    actor: user.email ?? user.id,
    detail: { from: before?.stage ?? null, to: stage },
  });

  revalidatePath(`/desk/leads/${leadId}`);
  revalidatePath("/desk/leads");
}

export async function setNextAction(form: FormData): Promise<void> {
  const { supabase } = await requireUser();

  const leadId = String(form.get("leadId") ?? "");
  if (!leadId) return;

  const action = String(form.get("nextAction") ?? "").trim();
  const due = String(form.get("nextActionDue") ?? "").trim();

  await supabase
    .from("leads")
    .update({ next_action: action || null, next_action_due: due || null })
    .eq("id", leadId);

  revalidatePath(`/desk/leads/${leadId}`);
}
