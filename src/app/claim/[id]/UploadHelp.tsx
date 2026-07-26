import { UPLOAD_HELP_ITEMS } from "@/lib/uploadHelpCopy";

// Inline contextual help rendered where the 25-file limit is actually
// enforced (the Evidence Vault section), not only in /help -- a user
// hitting the limit shouldn't have to leave the claim page to understand
// why. Native <details>/<summary>, no new modal/overlay system. Lives
// inside the already-authenticated claim detail page, so there's no
// separate context-blind surface to keep in sync the way /help was.
export function UploadHelp() {
  return (
    <div className="border border-ink/15 rounded-sm mt-3">
      {UPLOAD_HELP_ITEMS.map((item) => (
        <details key={item.q} className="group border-t border-ink/10 first:border-t-0">
          <summary className="px-3 py-2 text-xs font-semibold text-ink/70 cursor-pointer list-none flex items-center justify-between">
            {item.q}
            <span className="text-ink/40 group-open:rotate-180 transition-transform">▾</span>
          </summary>
          <p className="px-3 pb-2.5 text-xs text-ink/60 leading-relaxed">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
