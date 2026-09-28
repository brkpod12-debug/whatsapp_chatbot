"use client";

import { useTransition } from "react";
import { runSync, setBotVisible, setInternalNote } from "./actions";

export function SyncButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => void runSync())}
      className="bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50"
    >
      {pending ? "Syncing" : "Sync from Sanity"}
    </button>
  );
}

export function BotVisibleToggle({ id, visible }: { id: string; visible: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => void setBotVisible(id, !visible))}
      className={`stamp px-1.5 py-0.5 disabled:opacity-50 ${
        visible ? "border border-ink/15 text-slate" : "bg-wax text-paper"
      }`}
      title={visible ? "The bot may offer this holding" : "Hidden from the bot"}
    >
      {visible ? "bot: on" : "bot: off"}
    </button>
  );
}

export function InternalNote({ id, note }: { id: string; note: string | null }) {
  return (
    <form action={setInternalNote} className="mt-2 flex gap-2">
      <input type="hidden" name="propertyId" value={id} />
      <input
        name="internalNote"
        defaultValue={note ?? ""}
        placeholder="Internal note, never sent to a customer"
        className="flex-1 border border-ink/15 bg-paper px-2 py-1 text-xs outline-none focus:border-champagne"
      />
      <button type="submit" className="stamp text-champagne hover:text-ink">
        Save
      </button>
    </form>
  );
}
