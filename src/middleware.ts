import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { bucketReferrer } from "@/lib/acquisitionSource";

const ATTRIBUTION_COOKIE = "wc_attribution";

// First-touch acquisition capture (Decision #45) -- cookie only, no DB
// call, so this stays cheap on every request. Gated on "cookie not already
// set" so it only ever fires once per visitor; src/app/account/actions.ts's
// saveSignupIntent reads and persists it later, at signup.
function captureAttribution(request: NextRequest, response: NextResponse) {
  if (request.cookies.get(ATTRIBUTION_COOKIE)) return;

  const referer = request.headers.get("referer");
  let refererHost: string | null = null;
  try {
    refererHost = referer ? new URL(referer).hostname : null;
  } catch {
    refererHost = null;
  }
  const utmSource = request.nextUrl.searchParams.get("utm_source");
  const utmCampaign = request.nextUrl.searchParams.get("utm_campaign");
  const source = bucketReferrer(refererHost, utmSource);

  response.cookies.set(
    ATTRIBUTION_COOKIE,
    JSON.stringify({ source, campaign: utmCampaign, landingPath: request.nextUrl.pathname }),
    { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 },
  );
}

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  captureAttribution(request, response);
  return response;
}

export const config = {
  runtime: "nodejs",
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
