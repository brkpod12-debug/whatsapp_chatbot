"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { browserClient } from "@/lib/desk/supabase-browser";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/desk";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    const { error } = await browserClient().auth.signInWithPassword({
      email: String(data.get("email")),
      password: String(data.get("password")),
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block">
        <span className="stamp text-slate">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-1 w-full border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-champagne"
        />
      </label>
      <label className="block">
        <span className="stamp text-slate">Password</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full border border-ink/15 bg-paper px-3 py-2 text-sm outline-none focus:border-champagne"
        />
      </label>
      {error ? <p className="text-sm text-wax">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full bg-ink px-4 py-2.5 text-sm text-paper disabled:opacity-50"
      >
        {busy ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
