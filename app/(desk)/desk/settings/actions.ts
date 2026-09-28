"use server";

import { revalidatePath } from "next/cache";
import { deskClient } from "@/lib/desk/supabase";

export type SettingsState = { ok: boolean; message: string };

async function requireUser() {
  const supabase = await deskClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, user };
}

function number(form: FormData, key: string, fallback: number): number {
  const n = Number(form.get(key));
  return Number.isFinite(n) ? n : fallback;
}

export async function saveSettings(
  _prev: SettingsState,
  form: FormData
): Promise<SettingsState> {
  const { supabase } = await requireUser();

  const hot = number(form, "hotThreshold", 75);
  const warm = number(form, "warmThreshold", 45);

  // A warm threshold above hot would make HOT unreachable, and the mistake is
  // invisible until a week of leads has been misfiled.
  if (warm >= hot) {
    return { ok: false, message: "The warm threshold has to be below the hot one." };
  }

  const { error } = await supabase
    .from("agent_settings")
    .update({
      business_name: String(form.get("businessName") ?? "").trim() || "Josh Properties",
      tone_instructions: String(form.get("toneInstructions") ?? "").trim() || null,
      greeting_en: String(form.get("greeting") ?? "").trim() || null,
      after_hours_note: String(form.get("afterHours") ?? "").trim() || null,
      escalation_wa_id: String(form.get("escalationWaId") ?? "").trim() || null,
      escalation_email: String(form.get("escalationEmail") ?? "").trim() || null,
      hot_threshold: hot,
      warm_threshold: warm,
    })
    .eq("id", 1);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/desk/settings");
  return { ok: true, message: "Saved. New thresholds apply from the next message." };
}

/**
 * The kill switch. `processTurn` reads this before every reply, so flipping it
 * stops the desk mid-conversation rather than at the end of one. The owner
 * needs to know they can stop it; that is most of why they trust it running.
 */
export async function setAiGloballyEnabled(enabled: boolean): Promise<void> {
  const { supabase, user } = await requireUser();

  await supabase.from("agent_settings").update({ ai_globally_enabled: enabled }).eq("id", 1);

  await supabase.from("audit_log").insert({
    event: enabled ? "ai_resumed" : "kill_switch",
    actor: user.email ?? user.id,
    detail: { ai_globally_enabled: enabled },
  });

  revalidatePath("/desk/settings");
  revalidatePath("/desk");
}
