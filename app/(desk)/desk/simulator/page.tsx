import { notFound } from "next/navigation";
import { deskClient } from "@/lib/desk/supabase";
import { simulatorEnabled } from "@/lib/desk/simulator";
import { isLive } from "@/lib/whatsapp/send";
import { SimulatorForm } from "./SimulatorForm";

export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  if (!simulatorEnabled()) notFound();

  const supabase = await deskClient();
  const { data: recent } = await supabase
    .from("messages")
    .select("id, direction, sender, msg_type, body, status, created_at")
    .order("created_at", { ascending: false })
    .limit(12);

  return (
    <div className="px-6 py-10">
      <h1 className="font-display text-4xl">Simulator</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate">
        Posts a signed, Meta-shaped payload at the live webhook. Signature check, deduplication,
        persistence, debounce and the agent all run for real. Only the sender is fake.
      </p>

      {isLive() ? (
        <p className="mt-4 border-l-2 border-wax bg-stone px-3 py-2 text-sm text-wax">
          Meta credentials are configured. Replies sent from here will reach the real number.
        </p>
      ) : null}

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <div className="border border-ink/15 outline outline-1 outline-ink/10 outline-offset-[3px] bg-stone p-6">
          <SimulatorForm />
        </div>

        <div>
          <p className="stamp text-slate">Last 12 messages</p>
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {(recent ?? []).map((m) => (
              <li key={m.id as string} className="flex gap-4 py-2.5 text-sm">
                <span className="stamp w-16 shrink-0 pt-1 text-slate">{m.sender as string}</span>
                <span className="flex-1 text-ink">
                  {(m.body as string | null) ?? `[${m.msg_type as string}]`}
                </span>
                <span className="stamp shrink-0 pt-1 text-slate">
                  {new Date(m.created_at as string).toLocaleTimeString()}
                </span>
              </li>
            ))}
            {(recent ?? []).length === 0 ? (
              <li className="py-3 text-sm text-slate">Nothing yet.</li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
