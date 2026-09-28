import Link from "next/link";
import { notFound } from "next/navigation";
import { deskClient } from "@/lib/desk/supabase";
import { STAGES } from "@/lib/desk/leads";
import { calculateLeadScore } from "@/lib/desk/score";
import { StageControl, NextActionForm } from "./LeadControls";

export const dynamic = "force-dynamic";

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await deskClient();

  const { data: lead } = await supabase
    .from("leads")
    .select(
      `id, conversation_id, intent, asset_class, locality, budget_min, budget_max, budget_band,
       timeline_months, purpose, dossier_requested, dossier_sent_at, call_booked_at,
       viewing_requested, score, temperature, stage, tags, source, campaign,
       next_action, next_action_due, owner_notified_at, created_at, updated_at,
       customers ( id, full_name, display_name, wa_id, email, is_nri, country_hint ),
       properties ( name, folio )`
    )
    .eq("id", id)
    .maybeSingle();

  if (!lead) notFound();

  const person = lead.customers as unknown as {
    full_name: string | null;
    display_name: string | null;
    wa_id: string;
    email: string | null;
    is_nri: boolean;
    country_hint: string | null;
  } | null;

  const property = lead.properties as unknown as { name: string; folio: string | null } | null;

  const { data: viewings } = await supabase
    .from("viewings")
    .select("id, kind, scheduled_at, status, notes")
    .eq("lead_id", id)
    .order("scheduled_at", { ascending: true });

  // Recomputed here purely to show which signals produced the stored score.
  const breakdown = calculateLeadScore({
    callBookedAt: lead.call_booked_at as string | null,
    viewingRequested: lead.viewing_requested as boolean,
    dossierRequested: lead.dossier_requested as boolean,
    propertyOfInterest: property ? "set" : null,
    budgetBand: lead.budget_band as string | null,
    timelineMonths: lead.timeline_months as number | null,
    assetClass: lead.asset_class as string | null,
    tags: (lead.tags as string[] | null) ?? [],
  });

  const facts: [string, string | null][] = [
    ["WhatsApp", person ? `+${person.wa_id}` : null],
    ["Email", person?.email ?? null],
    ["Based", person?.is_nri ? (person.country_hint ?? "outside India") : "India"],
    ["Intent", lead.intent as string | null],
    ["Asset class", lead.asset_class as string | null],
    ["Locality", lead.locality as string | null],
    [
      "Budget",
      lead.budget_max
        ? `up to ₹${inr.format(lead.budget_max as number)}`
        : ((lead.budget_band as string | null)?.replace(/_/g, " ") ?? null),
    ],
    ["Timeline", lead.timeline_months ? `${lead.timeline_months} months` : null],
    ["Purpose", lead.purpose as string | null],
    ["Holding of interest", property ? `${property.name}${property.folio ? ` (${property.folio})` : ""}` : null],
    ["Dossier", lead.dossier_requested ? (lead.dossier_sent_at ? "sent" : "requested") : null],
    ["Source", [lead.source, lead.campaign].filter(Boolean).join(" · ") || null],
    [
      "Concierge notified",
      lead.owner_notified_at ? new Date(lead.owner_notified_at as string).toLocaleString() : null,
    ],
  ];

  return (
    <div className="px-6 py-10">
      <Link href="/desk/leads" className="stamp text-slate hover:text-ink">
        Back to leads
      </Link>

      <div className="mt-3 flex flex-wrap items-baseline gap-4">
        <h1 className="font-display text-4xl">
          {person?.full_name ?? person?.display_name ?? person?.wa_id ?? "Unknown"}
        </h1>
        <p className="font-display text-3xl tabular-nums">
          {lead.score as number}
          <span className="ml-2 align-middle text-sm text-slate">{lead.temperature as string}</span>
        </p>
        {lead.conversation_id ? (
          <Link
            href={`/desk/conversations/${lead.conversation_id as string}`}
            className="ml-auto border border-ink/15 px-4 py-2 text-sm hover:border-champagne"
          >
            Open thread
          </Link>
        ) : null}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-8">
          <section className="border border-ink/15 outline outline-1 outline-ink/10 outline-offset-[3px] bg-stone p-5">
            <h2 className="stamp text-champagne">Requirement</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {facts
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="stamp text-slate">{label}</dt>
                    <dd className="text-sm">{value}</dd>
                  </div>
                ))}
            </dl>

            {(lead.tags as string[] | null)?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {(lead.tags as string[]).map((tag) => (
                  <span key={tag} className="stamp border border-ink/15 px-1.5 py-0.5 text-champagne">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <section>
            <h2 className="stamp text-champagne">Calls and viewings</h2>
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {(viewings ?? []).map((v) => (
                <li key={v.id as string} className="flex items-baseline gap-4 py-3 text-sm">
                  <span className="stamp w-24 shrink-0 text-slate">
                    {(v.kind as string).replace(/_/g, " ")}
                  </span>
                  <span className="flex-1">
                    {v.scheduled_at
                      ? new Date(v.scheduled_at as string).toLocaleString()
                      : "unscheduled"}
                    {v.notes ? <span className="text-slate"> · {v.notes as string}</span> : null}
                  </span>
                  <span className="stamp text-slate">{v.status as string}</span>
                </li>
              ))}
              {(viewings ?? []).length === 0 ? (
                <li className="py-3 text-sm text-slate">Nothing booked.</li>
              ) : null}
            </ul>
          </section>
        </div>

        <aside className="space-y-8">
          <section>
            <h2 className="stamp text-champagne">Stage</h2>
            <StageControl leadId={id} stage={lead.stage as string} stages={[...STAGES]} />
          </section>

          <section>
            <h2 className="stamp text-champagne">Next action</h2>
            <NextActionForm
              leadId={id}
              nextAction={lead.next_action as string | null}
              nextActionDue={lead.next_action_due as string | null}
            />
          </section>

          <section>
            <h2 className="stamp text-champagne">Why this score</h2>
            <ul className="mt-3 divide-y divide-line border-t border-line">
              {breakdown.signals.map((s) => (
                <li key={s.label} className="flex justify-between py-2 text-sm">
                  <span>{s.label}</span>
                  <span className={`tabular-nums ${s.points < 0 ? "text-wax" : "text-slate"}`}>
                    {s.points > 0 ? "+" : ""}
                    {s.points}
                  </span>
                </li>
              ))}
              {breakdown.signals.length === 0 ? (
                <li className="py-2 text-sm text-slate">Nothing has fired yet.</li>
              ) : null}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
