"use client";

import { useTransition } from "react";
import { setNextAction, setStage } from "./actions";

export function StageControl({
  leadId,
  stage,
  stages,
}: {
  leadId: string;
  stage: string;
  stages: string[];
}) {
  const [pending, start] = useTransition();

  return (
    <ol className="mt-3 divide-y divide-line border-t border-line">
      {stages.map((s) => {
        const active = s === stage;
        return (
          <li key={s}>
            <button
              type="button"
              disabled={pending || active}
              onClick={() => start(() => void setStage(leadId, s))}
              className={`flex w-full items-center gap-3 py-2 text-left text-sm disabled:opacity-100 ${
                active ? "text-ink" : "text-slate hover:text-ink"
              }`}
            >
              <span
                className={`size-2 shrink-0 ${active ? "bg-emerald" : "border border-ink/20"}`}
                aria-hidden
              />
              {s.replace(/_/g, " ")}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function NextActionForm({
  leadId,
  nextAction,
  nextActionDue,
}: {
  leadId: string;
  nextAction: string | null;
  nextActionDue: string | null;
}) {
  return (
    <form action={setNextAction} className="mt-3 space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <input
        name="nextAction"
        defaultValue={nextAction ?? ""}
        placeholder="e.g. send the Chevella dossier"
        className="w-full border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-champagne"
      />
      <div className="flex gap-3">
        {/* Native date input: a picker library for one field is not worth it. */}
        <input
          type="date"
          name="nextActionDue"
          defaultValue={nextActionDue ?? ""}
          className="flex-1 border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-champagne"
        />
        <button type="submit" className="bg-ink px-4 py-2 text-sm text-paper">
          Save
        </button>
      </div>
    </form>
  );
}
