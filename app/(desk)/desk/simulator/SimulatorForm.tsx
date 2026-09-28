"use client";

import { useActionState, useState } from "react";
import { simulateInbound, type SimulateState } from "./actions";

const INITIAL: SimulateState = { ok: false, message: "" };

const FIELD =
  "mt-1 w-full border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-champagne";

export function SimulatorForm() {
  const [state, action, pending] = useActionState(simulateInbound, INITIAL);
  // Held so the last id can be pasted back to prove a redelivery makes no
  // second row and triggers no second reply.
  const [lastId, setLastId] = useState("");

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="stamp text-slate">WhatsApp number</span>
          <input name="waId" defaultValue="919000000001" className={FIELD} />
        </label>
        <label className="block">
          <span className="stamp text-slate">Profile name</span>
          <input name="name" defaultValue="Simulator" className={FIELD} />
        </label>
      </div>

      <label className="block">
        <span className="stamp text-slate">Message</span>
        <textarea name="text" rows={3} required className={FIELD} />
      </label>

      <label className="block">
        <span className="stamp text-slate">Message id (blank generates one)</span>
        <input
          name="waMessageId"
          value={lastId}
          onChange={(e) => setLastId(e.target.value)}
          placeholder="paste a previous id to test duplicate delivery"
          className={`${FIELD} font-mono text-xs`}
        />
      </label>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-ink px-4 py-2.5 text-sm text-paper disabled:opacity-50"
        >
          {pending ? "Delivering" : "Deliver to webhook"}
        </button>
        {state.waMessageId ? (
          <button
            type="button"
            onClick={() => setLastId(state.waMessageId ?? "")}
            className="stamp text-champagne hover:text-ink"
          >
            Reuse last id
          </button>
        ) : null}
      </div>

      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-slate" : "text-wax"}`}>{state.message}</p>
      ) : null}
    </form>
  );
}
