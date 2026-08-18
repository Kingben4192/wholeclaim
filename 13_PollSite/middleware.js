// =============================================================================
// Gates every /admin* route (except /admin/login and the login API route)
// behind a valid signed session cookie. This runs before the page/server
// component renders, so an invalid or missing session never reaches the
// dashboard's data-fetching code at all -- "hiding the URL" is never the
// security mechanism here, this check is.
// =============================================================================

import { NextResponse } from "next/server";
// Relative import, not the "@/lib/..." alias. The alias resolves correctly
// everywhere under app/, but this file sits at the project root and Vercel's
// Edge Function bundler failed to resolve it here -- deploy aborted with
// 'referencing unsupported modules: @/lib/adminAuth', i.e. the specifier was
// never mapped to a file. Relative path sidesteps alias resolution entirely.
import { ADMIN_SESSION_COOKIE, isValidSession } from "./lib/adminAuth";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Both surfaces must be checked separately. The previous version tested
  // `pathname.startsWith("/admin")` and treated a false result as "not an
  // admin route" -- but "/api/admin/..." does NOT start with "/admin", so
  // every admin API route except the login endpoint fell straight through
  // the gate unauthenticated. Confirmed in production: an anonymous POST to
  // /api/admin/top-story/decide reached the handler and queried the database.
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname === "/api/admin" || pathname.startsWith("/api/admin/");
  const isLoginRoute = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";

  // Not an admin surface at all -- nothing to gate.
  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }
  // The two endpoints that must be reachable without a session, by definition.
  if (isLoginRoute || isLoginApi) {
    return NextResponse.next();
  }

  const session = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await isValidSession(session))) {
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
