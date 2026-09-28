import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * The signed-in desk user. Respects RLS, so a request without a session sees
 * nothing. Use this in every `app/(desk)/` page and server action.
 */
export async function deskClient() {
  const store = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        // Called from a Server Component render, where cookies are read-only.
        // The middleware/route-handler path refreshes the session instead.
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          /* read-only render */
        }
      },
    },
  });
}

/**
 * Bypasses RLS. Only the WhatsApp webhook, the turn processor and the Sanity
 * sync use this - paths with no signed-in user. `server-only` above is what
 * keeps the key out of the client bundle, the same guard `sanity/client.ts`
 * already uses.
 */
export function serviceClient() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
