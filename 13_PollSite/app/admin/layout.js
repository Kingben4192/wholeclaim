// =============================================================================
// Layout for everything under /admin. `robots: { index: false, follow:
// false }` keeps this out of search engines -- a courtesy layer, NOT the
// security mechanism. The actual gate is middleware.js (primary) plus a
// second server-side session check inside app/admin/page.js itself
// (defense in depth). This layout deliberately does no auth check of its
// own, since it also wraps /admin/login, which must render without a
// session by definition.
// =============================================================================

export const metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }) {
  return <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>{children}</div>;
}
