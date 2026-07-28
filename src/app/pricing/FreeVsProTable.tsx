import { FEATURE_COMPARISON } from "@/lib/pricing";

// Renders src/lib/pricing.ts's shared FEATURE_COMPARISON constant -- same
// data as the homepage's own table (src/app/page.tsx), styled with this
// app's ink/ledger/paper tokens rather than the homepage's separate hp-*
// set. Before this, /pricing (the page literally named for this) disclosed
// nothing about what the free plan actually includes -- only the two paid
// options.
export function FreeVsProTable() {
  return (
    <div className="max-w-2xl mx-auto mb-16">
      <h2 className="text-center font-display text-lg font-bold mb-5">
        What&apos;s included
      </h2>
      <div className="border border-ink/15 rounded-sm overflow-hidden bg-white">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-2.5 bg-paper text-[0.62rem] font-mono font-semibold uppercase tracking-wider text-ink/50">
          <span>Feature</span>
          <span className="text-right w-24 sm:w-32">Free</span>
          <span className="text-right w-24 sm:w-32">Pro</span>
        </div>
        {FEATURE_COMPARISON.map((row, i) => (
          <div
            key={row.feature}
            className={`grid grid-cols-[1fr_auto_auto] gap-x-4 px-4 py-3 text-sm ${
              i > 0 ? "border-t border-ink/10" : ""
            }`}
          >
            <span className="text-ink">{row.feature}</span>
            <span className="text-right w-24 sm:w-32 text-ink/60">{row.free}</span>
            <span className="text-right w-24 sm:w-32 text-ledger font-semibold">{row.pro}</span>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-ink/50 mt-3">
        Individual file uploads are limited to 15MB.
      </p>
    </div>
  );
}
