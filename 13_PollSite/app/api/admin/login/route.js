import { NextResponse } from "next/server";
import { checkAdminPassword, createSessionValue, ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS } from "@/lib/adminAuth";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch (e) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { password } = body || {};
  if (typeof password !== "string" || !(await checkAdminPassword(password))) {
    // Deliberately generic error -- don't confirm/deny whether a password
    // was "close," and don't distinguish "wrong password" from any other
    // failure mode in the response.
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, await createSessionValue(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
  return res;
}
