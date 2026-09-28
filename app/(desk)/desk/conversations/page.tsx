import type { InboxFilter } from "@/lib/desk/conversations";
import { InboxShell } from "./InboxShell";

export const dynamic = "force-dynamic";

export default async function ConversationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const filter = ((await searchParams).filter ?? "all") as InboxFilter;

  return (
    <InboxShell filter={filter}>
      <div className="flex flex-1 items-center justify-center px-6">
        <p className="text-sm text-slate">Select a conversation.</p>
      </div>
    </InboxShell>
  );
}
