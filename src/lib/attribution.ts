// Source Attribution, Phase 1 Beta Instrumentation (?p= half only --
// self-report was cut from this build). First-touch-wins: once a slug is
// stored, later visits (with or without ?p=) never overwrite it. No
// expiry -- sticks to the browser until a grade is submitted and consumes
// it via getStoredAttribution().
const STORAGE_KEY = "wc_attribution";

type StoredAttribution = {
  partnerSlug: string;
  firstTouchAt: string;
};

export function captureFirstTouch(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(STORAGE_KEY)) return; // already captured -- first touch wins

  const slug = new URLSearchParams(window.location.search).get("p");
  if (!slug) return;

  const value: StoredAttribution = { partnerSlug: slug, firstTouchAt: new Date().toISOString() };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function getStoredAttribution(): StoredAttribution | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAttribution;
  } catch {
    return null;
  }
}
