"use client";

import { useRouter } from "next/navigation";
import { browserClient } from "@/lib/desk/supabase-browser";

export function SignOut() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await browserClient().auth.signOut();
        router.replace("/login");
        router.refresh();
      }}
      className="stamp text-slate hover:text-ink"
    >
      Sign out
    </button>
  );
}
