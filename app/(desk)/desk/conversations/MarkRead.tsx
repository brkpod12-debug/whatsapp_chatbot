"use client";

import { useEffect } from "react";
import { markThreadRead } from "./actions";

/** Opening a thread is what clears its unread dot. Fire and forget. */
export function MarkRead({ conversationId, unread }: { conversationId: string; unread: boolean }) {
  useEffect(() => {
    if (unread) void markThreadRead(conversationId);
  }, [conversationId, unread]);

  return null;
}
