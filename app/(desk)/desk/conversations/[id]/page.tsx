import { notFound } from "next/navigation";
import { getThread, type InboxFilter } from "@/lib/desk/conversations";
import { windowOpen } from "@/lib/agent/turn";
import { Countdown } from "@/components/desk/Countdown";
import { InboxShell } from "../InboxShell";
import { Composer } from "../Composer";
import { TakeOver } from "../TakeOver";
import { MarkRead } from "../MarkRead";

export const dynamic = "force-dynamic";

const SENDER_LABEL: Record<string, string> = {
  customer: "Customer",
  ai: "Desk AI",
  human: "Concierge",
};

function Rail({ lead }: { lead: NonNullable<Awaited<ReturnType<typeof getThread>>>["lead"] }) {
  const rows: [string, string | null][] = [
    ["Intent", lead?.intent ?? null],
    ["Asset class", lead?.assetClass ?? null],
    ["Locality", lead?.locality ?? null],
    ["Budget", lead?.budgetBand ?? null],
    ["Timeline", lead?.timelineMonths ? `${lead.timelineMonths} months` : null],
    ["Purpose", lead?.purpose ?? null],
    ["Stage", lead?.stage ?? null],
    ["Next action", lead?.nextAction ?? null],
  ];

  return (
    <aside className="hidden w-72 shrink-0 border-l border-line bg-stone px-5 py-6 xl:block">
      <p className="stamp text-slate">Requirement</p>

      {lead ? (
        <p className="mt-2 font-display text-3xl">
          {lead.score ?? 0}
          <span className="ml-2 align-middle text-sm text-slate">{lead.temperature ?? "COLD"}</span>
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate">Nothing extracted yet.</p>
      )}

      <dl className="mt-5 space-y-2.5">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt className="stamp text-slate">{label}</dt>
              <dd className="text-sm text-ink">{value}</dd>
            </div>
          ))}
      </dl>

      {lead?.tags.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {lead.tags.map((tag) => (
            <span key={tag} className="stamp border border-ink/15 px-1.5 py-0.5 text-champagne">
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { id } = await params;
  const filter = ((await searchParams).filter ?? "all") as InboxFilter;

  const thread = await getThread(id);
  if (!thread) notFound();

  const { conversation, messages, lead } = thread;
  const open = windowOpen(conversation.lastInboundAt);

  return (
    <InboxShell filter={filter} activeId={id}>
      <MarkRead conversationId={id} unread={conversation.unread} />

      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-ink">{conversation.name}</p>
          <p className="stamp text-slate">+{conversation.waId}</p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Countdown lastInboundAt={conversation.lastInboundAt} />
          <TakeOver conversationId={id} aiEnabled={conversation.aiEnabled} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <ol className="flex-1 space-y-4 overflow-y-auto px-5 py-6">
            {messages.map((m) => {
              const inbound = m.direction === "inbound";
              return (
                <li key={m.id} className={inbound ? "" : "flex justify-end"}>
                  <div className={`max-w-[38rem] ${inbound ? "" : "text-right"}`}>
                    <p className="stamp text-slate">
                      {SENDER_LABEL[m.sender] ?? m.sender}
                      {m.status ? ` · ${m.status}` : ""}
                      {` · ${new Date(m.createdAt).toLocaleString()}`}
                    </p>
                    <div
                      className={`mt-1 border px-3 py-2 text-sm ${
                        inbound
                          ? "border-ink/15 bg-stone text-ink"
                          : m.sender === "ai"
                            ? "border-champagne/40 bg-paper text-ink"
                            : "border-ink/15 bg-ink text-paper"
                      }`}
                    >
                      {m.body ?? m.transcript ?? `[${m.msgType}]`}
                    </div>
                  </div>
                </li>
              );
            })}

            {messages.length === 0 ? (
              <li className="text-sm text-slate">No messages in this thread.</li>
            ) : null}
          </ol>

          <Composer
            conversationId={id}
            windowOpen={open}
            aiEnabled={conversation.aiEnabled}
          />
        </div>

        <Rail lead={lead} />
      </div>
    </InboxShell>
  );
}
