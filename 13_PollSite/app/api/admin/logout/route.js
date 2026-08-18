import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/adminAuth";

export async function POST(req) {
  // The logout button is a plain HTML form POST (not a fetch() call), so
  // the browser navigates directly to whatever this route returns.
  // Returning JSON here previously left the operator staring at raw JSON
  // output instead of landing back on the login page. A 303 redirect is
  // the correct response for a POST that should result in a GET
  // navigation afterward.
  const res = NextResponse.redirect(new URL("/admin/login", req.url), { status: 303 });
  res.cookies.set(ADMIN_SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return res;
}
