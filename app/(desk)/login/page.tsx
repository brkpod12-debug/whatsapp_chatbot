import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-sm border border-ink/15 outline outline-1 outline-ink/10 outline-offset-[3px] bg-stone p-8">
        <p className="eyebrow text-champagne">Josh Properties</p>
        <h1 className="mt-2 font-display text-3xl">The desk</h1>
        <p className="mt-1 text-sm text-slate">Staff access only.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
