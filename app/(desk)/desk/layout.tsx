import Link from "next/link";
import { redirect } from "next/navigation";
import { deskClient } from "@/lib/desk/supabase";
import { simulatorEnabled } from "@/lib/desk/simulator";
import { SignOut } from "./SignOut";

// `proxy.ts` already bounces anonymous requests. This is the second lock:
// proxy runs at the edge and can be bypassed by a misconfigured matcher, and
// pages need the user object anyway.
// Nav grows one line per phase, as each section lands.
const NAV = [
  { href: "/desk", label: "Desk" },
  { href: "/desk/conversations", label: "Conversations" },
  { href: "/desk/leads", label: "Leads" },
  { href: "/desk/properties", label: "Holdings" },
  { href: "/desk/knowledge", label: "Memory" },
  { href: "/desk/audit", label: "Audit" },
  { href: "/desk/settings", label: "Settings" },
];

export default async function DeskShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await deskClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Dev-only, and only while it is switched on.
  const nav = simulatorEnabled()
    ? [...NAV, { href: "/desk/simulator", label: "Simulator" }]
    : NAV;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-6 border-b border-line bg-stone px-6 py-3">
        <Link href="/desk" className="eyebrow text-champagne">
          Josh Properties Desk
        </Link>
        <nav className="flex gap-5 text-sm">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="text-slate hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <span className="stamp text-slate">{user.email}</span>
          <SignOut />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
