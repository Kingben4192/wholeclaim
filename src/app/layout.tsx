import type { Metadata, Viewport } from "next";
import { Archivo, Bricolage_Grotesque, Public_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "./ServiceWorkerRegister";

const archivo = Archivo({
  variable: "--font-archivo",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

// Homepage v2 only (docs/wholeclaim_spec_homepage_and_roadmap.md, Part 1.1) —
// additive, not a replacement for Archivo, which every other page's
// font-display utility still resolves to. Kept separate so this redesign
// can't shift heading typography anywhere outside the homepage.
const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage",
  weight: ["500", "700", "800"],
  subsets: ["latin"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WholeClaim — The Insurance Claim Workspace for Homeowners",
  description:
    "WholeClaim turns scattered photos, letters, and phone calls into an organized, deadline-tracked claim file — with AI analysis you review and control.",
  appleWebApp: {
    capable: true,
    title: "WholeClaim",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#1E4B3C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${bricolageGrotesque.variable} ${publicSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink font-sans">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
