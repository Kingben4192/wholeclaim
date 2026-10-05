import Link from "next/link";

const SUPPORT_EMAIL = "support@getwholeclaim.com";

const LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/cookies" },
  { label: "Refund Policy", href: "/refund-policy" },
  { label: "AI Disclaimer", href: "/ai-disclaimer" },
  { label: "Help", href: "/help" },
  { label: "Free Guide", href: "/free-book?p=site-footer" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10 bg-paper">
      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <span className="font-display font-extrabold uppercase tracking-[0.06em] text-sm">
            Whole<span className="text-ledger">Claim</span>
          </span>
          <p className="font-mono text-xs text-ink/60 leading-relaxed">
            © 2026 WholeClaim LLC · Atlanta, GA ·{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="underline underline-offset-2">
              {SUPPORT_EMAIL}
            </a>
            {" "}· Holomark is a trademark of WholeClaim LLC.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-ledger">
          {LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="underline underline-offset-2">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}