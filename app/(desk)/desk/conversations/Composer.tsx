"use client";

import { useActionState, useRef } from "react";
import { sendHumanMessage, sendHumanTemplate, type ComposerState } from "./actions";

const INITIAL: ComposerState = { ok: false, message: "" };

/** The three Utility/Marketing templates submitted to Meta on day one. */
const TEMPLATES = ["dossier_ready", "viewing_confirmation", "concierge_followup"] as const;

export function Composer({
  conversationId,
  windowOpen,
  aiEnabled,
}: {
  conversationId: string;
  windowOpen: boolean;
  aiEnabled: boolean;
}) {
  const [state, action, pending] = useActionState(sendHumanMessage, INITIAL);
  const [templateState, templateAction, templatePending] = useActionState(
    sendHumanTemplate,
    INITIAL
  );
  const formRef = useRef<HTMLFormElement>(null);

  if (!windowOpen) {
    return (
      <div className="border-t border-line bg-stone px-5 py-4">
        <p className="stamp text-wax">24-hour window closed</p>
        <p className="mt-1 text-sm text-slate">
          Free text will be rejected by Meta. Re-open the thread with an approved template.
        </p>
        <form
          ref={formRef}
          action={templateAction}
          className="mt-3 flex flex-wrap items-center gap-3"
        >
          <input type="hidden" name="conversationId" value={conversationId} />
          <select
            name="template"
            defaultValue={TEMPLATES[2]}
            className="border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-champagne"
          >
            {TEMPLATES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={templatePending}
            className="bg-ink px-4 py-2 text-sm text-paper disabled:opacity-50"
          >
            {templatePending ? "Sending" : "Send template"}
          </button>
          {templateState.message ? (
            <span className={`text-sm ${templateState.ok ? "text-slate" : "text-wax"}`}>
              {templateState.message}
            </span>
          ) : null}
        </form>
      </div>
    );
  }

  return (
    <div className="border-t border-line bg-stone px-5 py-4">
      {aiEnabled ? (
        <p className="stamp mb-2 text-champagne">
          The AI is answering this thread. Take over to stop it replying.
        </p>
      ) : null}
      <form ref={formRef} action={action} className="flex items-end gap-3">
        <input type="hidden" name="conversationId" value={conversationId} />
        <textarea
          name="body"
          rows={2}
          required
          placeholder="Reply as the concierge"
          className="flex-1 resize-none border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-champagne"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-ink px-4 py-2.5 text-sm text-paper disabled:opacity-50"
        >
          {pending ? "Sending" : "Send"}
        </button>
      </form>
      {state.message ? (
        <p className={`mt-2 text-sm ${state.ok ? "text-slate" : "text-wax"}`}>{state.message}</p>
      ) : null}
    </div>
  );
}
