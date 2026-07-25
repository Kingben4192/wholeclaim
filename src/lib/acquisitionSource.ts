// Acquisition-channel taxonomy (Decision #45). Deliberately separate from
// claimCategories.ts's dispute-type taxonomy -- this describes how someone
// found WholeClaim, not what they're dealing with.
export const ACQUISITION_SOURCES = [
  "Google",
  "Social media",
  "Direct visit",
  "Contractor referral",
  "Personal referral",
  "Other",
] as const;

export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number];

export function isAcquisitionSource(value: unknown): value is AcquisitionSource {
  return typeof value === "string" && (ACQUISITION_SOURCES as readonly string[]).includes(value);
}

const SOCIAL_HOSTS = [
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "reddit.com",
];

// Best-effort automatic bucketing from technical signals only. "Contractor
// referral" / "Personal referral" can never be produced here -- nothing in
// a Referer header or UTM param distinguishes word-of-mouth from a generic
// direct visit, and building trackable referral links is out of scope
// (Decision #45). Those two values are reachable only via the signup
// screen's self-correct dropdown.
export function bucketReferrer(refererHost: string | null, utmSource: string | null): AcquisitionSource {
  const source = utmSource?.toLowerCase() ?? "";
  const host = refererHost?.toLowerCase() ?? "";

  if (source.includes("google") || host.includes("google.")) return "Google";
  if (
    SOCIAL_HOSTS.some((h) => source.includes(h.split(".")[0]) || host.includes(h))
  ) {
    return "Social media";
  }
  if (!refererHost && !utmSource) return "Direct visit";
  return "Other";
}
