"use client";

import { useTransition } from "react";
import { setAiEnabled } from "./actions";

/**
 * Meta's policy requires a clear path from automation to a human. This is it,
 * and it is one click with no confirmation dialog on purpose: when a customer
 * is annoyed the owner should not have to answer a modal first.
 */
export function TakeOver({
  conversationId,
  aiEnabled,
}: {
  conversationId: string;
  aiEnabled: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => void setAiEnabled(conversationId, !aiEnabled))}
      className={`px-3 py-1.5 text-sm disabled:opacity-50 ${
        aiEnabled ? "bg-ink text-paper" : "border border-champagne text-champagne"
      }`}
    >
      {pending ? "…" : aiEnabled ? "Take over" : "Give back to AI"}
    </button>
  );
}
