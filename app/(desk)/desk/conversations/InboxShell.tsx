import Link from "next/link";
import { listConversations, type InboxFilter, type Temperature } from "@/lib/desk/conversations";
import { Countdown } from "@/components/desk/Countdown";
import { LiveRefresh } from "@/components/desk/LiveRefresh";

const FILTERS: { key: InboxFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "needs_reply", label: "Needs reply" },
  { key: "hot", label: "Hot" },
  { key: "warm", label: "Warm" },
  { key: "cold", label: "Cold" },
  { key: "human", label: "Human" },
];

const TEMP_TONE: Record<Temperature, string> = {
  HOT: "text-wax",
  WARM: "text-champagne",
  COLD: "text-slate",
};

/**
 * The two-pane inbox. Rendered by both `/conversations` and
 * `/conversations/[id]` rather than by a layout, because a layout cannot read
 * `searchParams` and the filter lives there.
 */
export async function InboxShell({
  filter,
  activeId,
  children,
}: {
  filter: InboxFilter;
  activeId?: string;
  children: React.ReactNode;
}) {
  const conversations = await listConversations(filter);

  return (
    <div className="flex min-h-[calc(100dvh-3.25rem)]">
      <LiveRefresh />

      <aside className="flex w-full max-w-sm shrink-0 flex-col border-r border-line bg-stone">
        <nav className="flex flex-wrap gap-x-4 gap-y-1 border-b border-line px-5 py-3">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === "all" ? "/desk/conversations" : `/desk/conversations?filter=${f.key}`}
              className={`stamp ${filter === f.key ? "text-ink" : "text-slate hover:text-ink"}`}
            >
              {f.label}
            </Link>
          ))}
        </nav>

        <ul className="flex-1 overflow-y-auto">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/desk/conversations/${c.id}${filter === "all" ? "" : `?filter=${filter}`}`}
                className={`block border-b border-line px-5 py-4 hover:bg-paper ${
                  c.id === activeId ? "bg-paper" : ""
                }`}
              >
                <div className="flex items-baseline gap-2">
                  {c.unread ? <span className="size-1.5 shrink-0 bg-wax" aria-label="unread" /> : null}
                  <span className="truncate text-sm text-ink">{c.name}</span>
                  {c.temperature ? (
                    <span className={`stamp ml-auto shrink-0 ${TEMP_TONE[c.temperature]}`}>
                      {c.temperature}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-sm text-slate">
                  {c.previewSender && c.previewSender !== "customer" ? "· " : ""}
                  {c.preview ?? "No messages"}
                </p>
                <div className="mt-1.5 flex items-center gap-3">
                  <Countdown lastInboundAt={c.lastInboundAt} />
                  {c.interest ? <span className="stamp text-slate">{c.interest}</span> : null}
                  {!c.aiEnabled ? <span className="stamp text-champagne">human</span> : null}
                </div>
              </Link>
            </li>
          ))}

          {conversations.length === 0 ? (
            <li className="px-5 py-8 text-sm text-slate">
              Nothing here yet. Send yourself a message from the simulator.
            </li>
          ) : null}
        </ul>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">{children}</section>
    </div>
  );
}
