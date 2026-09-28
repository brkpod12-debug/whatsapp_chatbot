import { deskClient } from "@/lib/desk/supabase";
import { EntryForm, EntryRow, type Entry } from "./KnowledgeEditor";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const supabase = await deskClient();

  const { data, error } = await supabase
    .from("knowledge_entries")
    .select("id, category, title, content, keywords, priority, scope, scope_value, expires_at, active")
    .order("active", { ascending: false })
    .order("priority", { ascending: false })
    .order("category")
    .limit(300);

  const entries: Entry[] = (data ?? []).map((row) => ({
    id: row.id as string,
    category: row.category as string,
    title: row.title as string,
    content: row.content as string,
    keywords: (row.keywords as string[] | null) ?? [],
    priority: (row.priority as number | null) ?? 100,
    scope: (row.scope as string | null) ?? "global",
    scopeValue: row.scope_value as string | null,
    expiresAt: row.expires_at as string | null,
    active: Boolean(row.active),
  }));

  return (
    <div className="px-6 py-10">
      <h1 className="font-display text-4xl">Company memory</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate">
        What the desk is allowed to say. Editing here changes the next reply, with no deploy. Bulk
        authoring lives in the repository at <code className="font-mono text-xs">knowledge/</code> and
        is loaded with <code className="font-mono text-xs">npm run seed:knowledge</code>.
      </p>

      {error ? <p className="mt-6 text-sm text-wax">{error.message}</p> : null}

      <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div>
          <h2 className="stamp text-champagne">{entries.length} entries</h2>
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {entries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
            {entries.length === 0 && !error ? (
              <li className="py-6 text-sm text-slate">
                Nothing yet. Run the seed, or add the first entry on the right.
              </li>
            ) : null}
          </ul>
        </div>

        <aside className="border border-ink/15 outline outline-1 outline-ink/10 outline-offset-[3px] bg-stone p-5">
          <h2 className="stamp text-champagne">Add an entry</h2>
          <div className="mt-4">
            <EntryForm />
          </div>
        </aside>
      </div>
    </div>
  );
}
