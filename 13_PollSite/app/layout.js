// =============================================================================
// Root layout. Required by the App Router -- every route in this app renders
// inside it, including /admin (which adds its own noindex metadata on top).
//
// FONTS: Fraunces (questions), Inter (UI), JetBrains Mono (percentages and
// counts) are loaded with next/font/google, so they are self-hosted at build
// time -- no request to fonts.googleapis.com at runtime, and no layout shift
// from a late-arriving font file.
//
// The components set their fonts inline with the literal names the artifact
// used -- fontFamily: "'Fraunces', serif", "'JetBrains Mono', monospace",
// "Inter, system-ui, sans-serif" -- rather than via the CSS variables below.
// That works: verified against a running dev server, next/font in this
// version emits
//
//     --font-fraunces: "Fraunces", "Fraunces Fallback"
//
// i.e. it registers @font-face under the font's REAL family name and only
// hashes the CSS-module class it attaches to <html>. So a literal
// `'Fraunces'` lookup resolves to the self-hosted file, and the components
// need no edits to pick up the brand fonts.
//
// The variables are still exposed on <html> because they carry next/font's
// size-adjusted fallback metrics ("Fraunces Fallback"), which the bare
// literal does not. Prefer var(--font-fraunces) in any NEW markup; the
// existing inline literals are correct as-is and should be left alone.
// =============================================================================

import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const OG_IMAGE = `${SITE_URL}/og-default.png`;
const DESCRIPTION =
  "Vote and see what real people think. Not a scientific poll — just an honest, voluntary count.";

export const metadata = {
  // metadataBase lets Next resolve any relative metadata URL against the real
  // origin instead of emitting a bare path Facebook can't fetch.
  metadataBase: new URL(SITE_URL),

  // Per-route metadata (app/page.js, app/poll/[pollId]/page.js) overrides the
  // title; this template gives everything else a consistent suffix.
  title: {
    default: "What Do People Think?",
    template: "%s — What Do People Think?",
  },
  description: DESCRIPTION,

  // Default Open Graph tags for EVERY route. Previously only
  // app/poll/[pollId]/page.js declared og:*, so the homepage -- the URL most
  // likely to be shared first -- shipped with no og tags at all, and
  // Facebook's Sharing Debugger reported og:image as not explicitly provided.
  // og:image is set here to the real, built 1200x630 asset rather than left
  // for Facebook to infer from page content.
  openGraph: {
    title: "What Do People Think?",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "What Do People Think?",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "What Do People Think?" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "What Do People Think?",
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export const viewport = {
  themeColor: "#FBFAF7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
