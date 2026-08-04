"use client";

import { useState } from "react";
import Link from "next/link";
import type { Checklist } from "@/lib/checklists";

// Client-side category filter for the Resource Library list (Decision
// #96). Deliberately simple -- a plain useState toggle over a static
// prop list, no URL state, no server round-trip. Matches the spec's own
// "simple filterable list" scope, not the parked interactive-Academy
// concept (no accounts, no progress tracking, no quizzes).
export function ResourceFilter({ checklists }: { checklists: Checklist[] }) {
  const categories = ["All", ...checklists.map((c) => c.eventType)];
  const [active, setActive] = useState("All");

  const visible =
    active === "All" ? checklists : checklists.filter((c) => c.eventType === active);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActive(cat)}
            className={`text-xs font-mono border rounded-full px-3.5 py-1.5 transition-colors ${
              active === cat
                ? "bg-hp-pine border-hp-pine text-white"
                : "border-hp-line bg-white hover:border-hp-pine hover:text-hp-pine"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {visible.map((c) => (
          <Link
            key={c.slug}
            href={`/resources/${c.slug}`}
            className="border border-ink/15 rounded-sm px-4 py-4 hover:border-ledger transition-colors"
          >
            <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-wider text-ledger">
              {c.eventType}
            </span>
            <p className="font-display font-bold text-sm mt-1 mb-1">{c.title}</p>
            <p className="text-sm text-ink/70 leading-relaxed">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
