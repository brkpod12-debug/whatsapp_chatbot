import Link from "next/link";
import { getDeskStats, getNeedsAttention, getUpcomingViewings } from "@/lib/desk/stats";
import { BarList, HourColumns, Sparkline } from "@/components/desk/Chart";
import { Countdown } from "@/components/desk/Countdown";
import { LiveRefresh } from "@/components/desk/LiveRefresh";

export const dynamic = "force-dynamic";

function greeting(): string {
  const istHour = new Date(new Date().getTime() + 5.5 * 3_600_000).getUTCHours();
  if (istHour < 12) return "Good morning";
  if (istHour < 17) return "Good afternoon";
  return "Good evening";
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-ink/15 outline outline-1 outline-ink/10 outline-offset-[3px] bg-stone p-5">
      {children}
    </div>
  );
}

function Tile({ value, label, tone }: { value: number; label: string; tone?: "hot" | "quiet" }) {
  return (
    <Card>
      <p className="stamp text-slate">{label}</p>
      <p
        className={`mt-2 font-display text-4xl tabular-nums ${
          tone === "hot" && value > 0 ? "text-wax" : ""
        }`}
      >
        {value}
      </p>
    </Card>
  );
}

export default async function DeskPage() {
  const [stats, attention, viewings] = await Promise.all([
    getDeskStats(),
    getNeedsAttention(),
    getUpcomingViewings(),
  ]);

  const { today } = stats;

  return (
    <div className="px-6 py-10">
      <LiveRefresh />

      <h1 className="font-display text-4xl">{greeting()}</h1>
      <p className="mt-1 text-sm text-slate">Here is what needs you today.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile value={today.needsReply} label="Needs reply" tone="hot" />
        <Tile value={today.hot} label="Hot leads" tone="hot" />
        <Tile value={today.windowClosing} label="Window closing" tone="hot" />
        <Tile value={today.viewings} label="Booked today" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile value={today.messages} label="Messages today" />
        <Tile value={today.uniqueCustomers} label="People today" />
        <Tile value={today.newLeads} label="New leads" />
        <Tile value={today.qualifiedLeads} label="Qualified" />
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-2">
        <section>
          <h2 className="stamp text-champagne">Needs reply</h2>
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {attention.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/desk/conversations/${item.id}`}
                  className="flex gap-4 py-3 hover:bg-stone"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">
                      {item.name}
                      {item.temperature ? (
                        <span className="stamp ml-2 text-champagne">{item.temperature}</span>
                      ) : null}
                    </p>
                    <p className="truncate text-sm text-slate">{item.preview ?? "No messages"}</p>
                  </div>
                  <Countdown lastInboundAt={item.lastInboundAt} />
                </Link>
              </li>
            ))}
            {attention.length === 0 ? (
              <li className="py-4 text-sm text-slate">Nothing waiting. Every thread is answered.</li>
            ) : null}
          </ul>
        </section>

        <section>
          <h2 className="stamp text-champagne">This week</h2>
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {viewings.map((v) => (
              <li key={v.id} className="flex items-baseline gap-4 py-3 text-sm">
                <span className="stamp w-24 shrink-0 text-slate">{v.kind.replace("_", " ")}</span>
                <span className="flex-1 truncate">
                  {v.name ?? "Unknown"}
                  {v.property ? <span className="text-slate"> · {v.property}</span> : null}
                </span>
                <span className="stamp shrink-0 text-slate">
                  {v.scheduledAt ? new Date(v.scheduledAt).toLocaleString() : "unscheduled"}
                </span>
              </li>
            ))}
            {viewings.length === 0 ? (
              <li className="py-4 text-sm text-slate">No calls or viewings booked in the next week.</li>
            ) : null}
          </ul>
        </section>
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-3">
        <Card>
          <h2 className="stamp text-champagne">Messages by hour</h2>
          <HourColumns points={stats.messagesByHour} />
          <p className="stamp mt-3 text-slate">
            {today.aiReplies} desk replies · {today.humanReplies} concierge replies
          </p>
        </Card>

        <Card>
          <h2 className="stamp text-champagne">Pipeline</h2>
          <BarList
            points={[
              { label: "HOT", value: today.hot },
              { label: "WARM", value: today.warm },
              { label: "COLD", value: today.cold },
            ]}
          />
          <h2 className="stamp mt-6 text-champagne">By asset class</h2>
          <BarList points={stats.leadsByAssetClass} empty="No requirement captured yet." />
        </Card>

        <Card>
          <h2 className="stamp text-champagne">Where enquiries come from</h2>
          <BarList points={stats.leadsBySource} />
          <div className="mt-6 space-y-5">
            <Sparkline points={stats.enquiriesByDay} label="Enquiries" />
            <Sparkline points={stats.callsBookedByDay} label="Calls booked" />
          </div>
        </Card>
      </div>

      <p className="stamp mt-8 text-slate">
        {stats.guardrailBlocks} guardrail block{stats.guardrailBlocks === 1 ? "" : "s"} today ·{" "}
        <Link href="/desk/audit" className="text-champagne hover:text-ink">
          see what was stopped
        </Link>
      </p>
    </div>
  );
}
