"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/desk/supabase-browser";

/**
 * Supabase Realtime on `messages` and `conversations`. On any change the server
 * components re-render with fresh data - no client-side message store to keep
 * in sync with the database, and no polling.
 *
 * Requires migration 0003, which adds both tables to the realtime publication.
 */
export function LiveRefresh() {
  const router = useRouter();

  useEffect(() => {
    const client = browserClient();
    const channel = client
      .channel("desk-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () =>
        router.refresh()
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () =>
        router.refresh()
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [router]);

  return null;
}
