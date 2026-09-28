"use client";

import { useActionState, useState, useTransition } from "react";
import { restoreEntry, retireEntry, saveEntry, type KnowledgeState } from "./actions";

const INITIAL: KnowledgeState = { ok: false, message: "" };

const FIELD =
  "mt-1 w-full border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-champagne";

export type Entry = {
  id: string;
  category: string;
  title: string;
  content: string;
  keywords: string[];
  priority: number;
  scope: string;
  scopeValue: string | null;
  expiresAt: string | null;
  active: boolean;
};

export function EntryForm({ entry }: { entry?: Entry }) {
  const [state, action, pending] = useActionState(saveEntry, INITIAL);

  return (
    <form action={action} className="space-y-4">
      {entry ? <input type="hidden" name="id" value={entry.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="stamp text-slate">Category</span>
          <input name="category" defaultValue={entry?.category ?? "faq"} className={FIELD} />
        </label>
        <label className="block">
          <span className="stamp text-slate">Priority (900+ is always injected)</span>
          <input
            name="priority"
            type="number"
            defaultValue={entry?.priority ?? 100}
            className={FIELD}
          />
        </label>
      </div>

      <label className="block">
        <span className="stamp text-slate">Question or title</span>
        <input name="title" required defaultValue={entry?.title ?? ""} className={FIELD} />
      </label>

      <label className="block">
        <span className="stamp text-slate">Answer the desk may quote</span>
        <textarea
          name="content"
          rows={5}
          required
          defaultValue={entry?.content ?? ""}
          className={FIELD}
        />
      </label>

      <label className="block">
        <span className="stamp text-slate">Keywords, comma separated</span>
        <input
          name="keywords"
          defaultValue={entry?.keywords.join(", ") ?? ""}
          placeholder="the words a customer would actually use"
          className={FIELD}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="stamp text-slate">Scope</span>
          <select name="scope" defaultValue={entry?.scope ?? "global"} className={FIELD}>
            <option value="global">global</option>
            <option value="asset_class">asset_class</option>
            <option value="locality">locality</option>
          </select>
        </label>
        <label className="block">
          <span className="stamp text-slate">Scope value</span>
          <input name="scopeValue" defaultValue={entry?.scopeValue ?? ""} className={FIELD} />
        </label>
        <label className="block">
          <span className="stamp text-slate">Expires</span>
          <input type="date" name="expiresAt" defaultValue={entry?.expiresAt ?? ""} className={FIELD} />
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-ink px-4 py-2.5 text-sm text-paper disabled:opacity-50"
        >
          {pending ? "Saving" : entry ? "Save changes" : "Add entry"}
        </button>
        {state.message ? (
          <span className={`text-sm ${state.ok ? "text-slate" : "text-wax"}`}>{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}

export function EntryRow({ entry }: { entry: Entry }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="stamp w-24 shrink-0 text-slate">{entry.category}</span>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="text-left text-sm hover:text-champagne"
        >
          {entry.title}
        </button>
        {entry.priority >= 900 ? <span className="stamp text-champagne">always</span> : null}
        {entry.scope !== "global" ? (
          <span className="stamp text-slate">
            {entry.scope}: {entry.scopeValue}
          </span>
        ) : null}
        {!entry.active ? <span className="stamp text-wax">retired</span> : null}

        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(() => void (entry.active ? retireEntry(entry.id) : restoreEntry(entry.id)))
          }
          className="stamp ml-auto text-slate hover:text-ink disabled:opacity-50"
        >
          {entry.active ? "retire" : "restore"}
        </button>
      </div>

      {editing ? (
        <div className="mt-4 border border-ink/15 bg-stone p-5">
          <EntryForm entry={entry} />
        </div>
      ) : (
        <p className="mt-1 line-clamp-2 text-sm text-slate">{entry.content}</p>
      )}
    </li>
  );
}
