"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderOpen, PlusCircle } from "lucide-react";

// Decision #67 — fixed bottom tab navigation for primary mobile nav.
// Composed manually into the same pages AccountMenu.tsx already covers
// (account, claim list, claim workspace, claim wizard) -- not the root
// layout, for the same reason AccountMenu isn't there either (the public
// homepage has its own bespoke header). No auth check of its own: every
// page this is placed on is already behind middleware auth protection
// (src/lib/supabase/middleware.ts PROTECTED_PREFIXES), so this is pure
// client-side nav chrome, not a second gate.
//
// Three tabs, not the spec's suggested four -- confirmed via a full route
// audit that no "Documents" route or global cross-claim evidence view
// exists anywhere (all evidence content lives inside one claim's own
// workspace), and "/account" already combines dashboard+settings with no
// separate route to give a fourth tab its own destination. The decision's
// own guardrail ("navigation must never imply unsupported capability")
// rules out pointing a tab at something that doesn't exist -- "New Claim"
// fills the fourth slot honestly instead, a real, distinct, high-frequency
// destination. See Decision #67.
const TABS = [
  { href: "/account", label: "Home", icon: Home, match: (path: string) => path === "/account" },
  { href: "/claim", label: "Claims", icon: FolderOpen, match: (path: string) => path === "/claim" || path.startsWith("/claim/") && path !== "/claim/new" && !path.startsWith("/claim/new/") },
  { href: "/claim/new", label: "New Claim", icon: PlusCircle, match: (path: string) => path.startsWith("/claim/new") },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="sm:hidden fixed bottom-0 inset-x-0 z-20 bg-paper border-t border-ink/10 flex items-stretch"
    >
      {TABS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold ${
              active ? "text-ledger" : "text-ink/50"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
