// =============================================================================
// Minimal owner-only auth for /admin. Deliberately simple: one operator, one
// shared password (ADMIN_PASSWORD env var), a signed session cookie. Not a
// user-account system -- there is no signup, no per-person login, no user
// table. That's intentional; this is an internal tool, not a product
// feature (see the Phase 1 product scope section of the handoff -- no
// profiles/accounts anywhere in this build).
//
// Uses the Web Crypto API (crypto.subtle / globalThis.crypto) rather than
// Node's `crypto` module. This is deliberate: middleware.js runs on the
// Edge runtime by default, where Node built-ins like createHmac,
// timingSafeEqual, and Buffer do not exist. Web Crypto is a standard
// browser/Edge/Node-compatible API, so this file works correctly wherever
// it's imported from, without requiring a runtime declaration.
//
// Session revocation: sessions are stateless (no server-side session
// store), so there is no per-session revoke. To invalidate ALL existing
// sessions at once (e.g. if the password may have leaked), rotate
// ADMIN_SESSION_SECRET in the environment and redeploy -- every
// previously-issued session cookie will fail signature verification
// immediately. This is a real, if coarse, revocation mechanism -- document
// it as the answer if "can I kick out an active session" comes up, rather
// than treating the lack of per-session revoke as unaddressed.
// =============================================================================

const SESSION_COOKIE = "wdpt_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set -- required for admin auth.");
  }
  return secret;
}

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return bytesToHex(digest);
}

async function hmacSha256Hex(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToHex(sig);
}

// Constant-time comparison of two equal-length hex strings (both are fixed
// -length SHA-256 hex digests, so there is no length to leak in the first
// place -- this compares every character regardless of where a mismatch
// occurs, rather than short-circuiting on the first difference).
function constantTimeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function checkAdminPassword(candidate) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) {
    throw new Error("ADMIN_PASSWORD is not set -- required for admin auth.");
  }
  // Hash both sides to a fixed-length digest BEFORE comparing, so there is
  // no early-exit on a length mismatch between the raw candidate and real
  // password -- the previous version's `if (a.length !== b.length) return
  // false` leaked the real password's length via response timing. Hashing
  // first means both values being compared are always the same length
  // (32-byte SHA-256 digests), regardless of how long the actual password
  // or the guess was.
  const [candidateHash, realHash] = await Promise.all([sha256Hex(String(candidate)), sha256Hex(real)]);
  return constantTimeEqualHex(candidateHash, realHash);
}

export async function createSessionValue() {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${expiresAt}`;
  const sig = await hmacSha256Hex(getSecret(), payload);
  return `${payload}.${sig}`;
}

export async function isValidSession(cookieValue) {
  if (!cookieValue) return false;
  const [payload, sig] = cookieValue.split(".");
  if (!payload || !sig) return false;
  const expected = await hmacSha256Hex(getSecret(), payload);
  if (!constantTimeEqualHex(sig, expected)) return false;
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  return true;
}

export const ADMIN_SESSION_COOKIE = SESSION_COOKIE;
export const ADMIN_SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_SECONDS;
