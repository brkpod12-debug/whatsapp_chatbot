"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client for the inbox's Realtime subscriptions and the login form.
 * Anon key only - RLS is what gates the data.
 */
export function browserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
