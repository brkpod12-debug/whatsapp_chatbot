import { deskClient } from "@/lib/desk/supabase";
import { isLive } from "@/lib/whatsapp/send";
import { groqModel } from "@/lib/agent/groq";
import { KillSwitch, SettingsForm, type Settings } from "./SettingsForm";

export const dynamic = "force-dynamic";

/** Shows what is wired without ever printing a key. Presence only. */
function Wiring() {
  const rows: [string, boolean, string][] = [
    ["Supabase", Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), "database and sign-in"],
    ["Groq", Boolean(process.env.GROQ_API_KEY), `replies, ${groqModel()}`],
    ["WhatsApp Cloud API", isLive(), "sends are simulated until this is set"],
    ["Webhook signature", Boolean(process.env.WHATSAPP_APP_SECRET), "inbound is rejected without it"],
    ["Concierge number", Boolean(process.env.CONCIERGE_WA_ID), "escalation alerts"],
  ];

  return (
    <ul className="mt-3 divide-y divide-line border-t border-line">
      {rows.map(([label, ok, note]) => (
        <li key={label} className="flex items-baseline gap-3 py-2.5 text-sm">
          <span className={`size-2 shrink-0 ${ok ? "bg-emerald" : "bg-wax"}`} aria-hidden />
          <span>{label}</span>
          <span className="stamp ml-auto text-right text-slate">{note}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function SettingsPage() {
  const supabase = await deskClient();

  const { data, error } = await supabase
    .from("agent_settings")
    .select(
      "business_name, tone_instructions, greeting_en, after_hours_note, escalation_wa_id, escalation_email, hot_threshold, warm_threshold, ai_globally_enabled"
    )
    .eq("id", 1)
    .maybeSingle();

  const settings: Settings = {
    businessName: (data?.business_name as string) ?? "Josh Properties",
    toneInstructions: (data?.tone_instructions as string | null) ?? null,
    greeting: (data?.greeting_en as string | null) ?? null,
    afterHours: (data?.after_hours_note as string | null) ?? null,
    escalationWaId: (data?.escalation_wa_id as string | null) ?? null,
    escalationEmail: (data?.escalation_email as string | null) ?? null,
    hotThreshold: (data?.hot_threshold as number) ?? 75,
    warmThreshold: (data?.warm_threshold as number) ?? 45,
    aiGloballyEnabled: data?.ai_globally_enabled !== false,
  };

  return (
    <div className="px-6 py-10">
      <h1 className="font-display text-4xl">Settings</h1>

      {error ? <p className="mt-4 text-sm text-wax">{error.message}</p> : null}

      <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="border border-ink/15 outline outline-1 outline-ink/10 outline-offset-[3px] bg-stone p-6">
          <SettingsForm settings={settings} />
        </div>

        <aside className="space-y-8">
          <KillSwitch enabled={settings.aiGloballyEnabled} />

          <section>
            <h2 className="stamp text-champagne">What is wired</h2>
            <Wiring />
          </section>
        </aside>
      </div>
    </div>
  );
}
