"use client";

import { useActionState, useTransition } from "react";
import { saveSettings, setAiGloballyEnabled, type SettingsState } from "./actions";

const INITIAL: SettingsState = { ok: false, message: "" };

const FIELD =
  "mt-1 w-full border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-champagne";

export type Settings = {
  businessName: string;
  toneInstructions: string | null;
  greeting: string | null;
  afterHours: string | null;
  escalationWaId: string | null;
  escalationEmail: string | null;
  hotThreshold: number;
  warmThreshold: number;
  aiGloballyEnabled: boolean;
};

export function KillSwitch({ enabled }: { enabled: boolean }) {
  const [pending, start] = useTransition();

  return (
    <div
      className={`border p-5 ${enabled ? "border-ink/15 bg-stone" : "border-wax bg-stone"}`}
    >
      <p className="stamp text-slate">Automatic replies</p>
      <p className="mt-2 font-display text-2xl">
        {enabled ? "The desk is answering" : "The desk is silent"}
      </p>
      <p className="mt-1 text-sm text-slate">
        {enabled
          ? "Switching this off stops every automatic reply immediately, across all threads. Messages still arrive and are stored."
          : "No automatic replies are being sent. Inbound messages are still received and stored, and the concierge can reply by hand."}
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => void setAiGloballyEnabled(!enabled))}
        className={`mt-4 px-4 py-2.5 text-sm disabled:opacity-50 ${
          enabled ? "bg-wax text-paper" : "bg-ink text-paper"
        }`}
      >
        {pending ? "…" : enabled ? "Stop all automatic replies" : "Resume automatic replies"}
      </button>
    </div>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(saveSettings, INITIAL);

  return (
    <form action={action} className="space-y-5">
      <label className="block">
        <span className="stamp text-slate">Business name</span>
        <input name="businessName" defaultValue={settings.businessName} className={FIELD} />
      </label>

      <label className="block">
        <span className="stamp text-slate">House notes on voice</span>
        <textarea
          name="toneInstructions"
          rows={4}
          defaultValue={settings.toneInstructions ?? ""}
          placeholder="Added to the desk's instructions. It can refine the voice; it cannot lift a prohibition."
          className={FIELD}
        />
      </label>

      <label className="block">
        <span className="stamp text-slate">Opening line</span>
        <input name="greeting" defaultValue={settings.greeting ?? ""} className={FIELD} />
      </label>

      <label className="block">
        <span className="stamp text-slate">After-hours note</span>
        <input name="afterHours" defaultValue={settings.afterHours ?? ""} className={FIELD} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="stamp text-slate">Concierge WhatsApp (E.164, no +)</span>
          <input
            name="escalationWaId"
            defaultValue={settings.escalationWaId ?? ""}
            placeholder="919000000000"
            className={`${FIELD} font-mono text-xs`}
          />
        </label>
        <label className="block">
          <span className="stamp text-slate">Concierge email</span>
          <input
            type="email"
            name="escalationEmail"
            defaultValue={settings.escalationEmail ?? ""}
            className={FIELD}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="stamp text-slate">Hot at or above</span>
          <input
            type="number"
            name="hotThreshold"
            min={1}
            max={100}
            defaultValue={settings.hotThreshold}
            className={FIELD}
          />
        </label>
        <label className="block">
          <span className="stamp text-slate">Warm at or above</span>
          <input
            type="number"
            name="warmThreshold"
            min={0}
            max={99}
            defaultValue={settings.warmThreshold}
            className={FIELD}
          />
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="bg-ink px-4 py-2.5 text-sm text-paper disabled:opacity-50"
        >
          {pending ? "Saving" : "Save settings"}
        </button>
        {state.message ? (
          <span className={`text-sm ${state.ok ? "text-slate" : "text-wax"}`}>{state.message}</span>
        ) : null}
      </div>
    </form>
  );
}
