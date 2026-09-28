"use server";

import { revalidatePath } from "next/cache";
import { deskClient } from "@/lib/desk/supabase";
import { syncProperties } from "@/lib/desk/sync";

async function requireUser() {
  const supabase = await deskClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return supabase;
}

/**
 * The two fields the website does not have. Both live only in the mirror and
 * the Sanity sync never writes them, so an owner edit here is permanent.
 */
export async function setBotVisible(propertyId: string, visible: boolean): Promise<void> {
  const supabase = await requireUser();
  await supabase.from("properties").update({ bot_visible: visible }).eq("id", propertyId);
  revalidatePath("/desk/properties");
}

export async function setInternalNote(form: FormData): Promise<void> {
  const supabase = await requireUser();
  const id = String(form.get("propertyId") ?? "");
  const note = String(form.get("internalNote") ?? "").trim();
  if (!id) return;
  await supabase.from("properties").update({ internal_note: note || null }).eq("id", id);
  revalidatePath("/desk/properties");
}

export async function runSync(): Promise<void> {
  await requireUser();
  await syncProperties();
  revalidatePath("/desk/properties");
}
