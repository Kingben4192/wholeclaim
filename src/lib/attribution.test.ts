import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { captureFirstTouch, getStoredAttribution } from "./attribution";

// No existing test coverage for this module before this file, despite
// captureFirstTouch() already being live on /grade (GraderQuiz.tsx) and
// now also wired into /free-book (FreeBookAttribution.tsx). vitest.config.ts
// runs in the default Node environment (no jsdom) -- window/localStorage
// are stubbed manually per test rather than pulling in a DOM test env,
// matching this suite's existing pure-function-unit-test style.
function makeLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  } as Storage;
}

describe("attribution", () => {
  let originalWindow: unknown;

  beforeEach(() => {
    originalWindow = (globalThis as unknown as { window?: unknown }).window;
  });

  afterEach(() => {
    (globalThis as unknown as { window?: unknown }).window = originalWindow;
  });

  it("does nothing server-side (window undefined)", () => {
    delete (globalThis as unknown as { window?: unknown }).window;
    expect(() => captureFirstTouch()).not.toThrow();
  });

  it("captures ?p= on first touch", () => {
    (globalThis as unknown as { window: unknown }).window = {
      location: { search: "?p=fthbc" },
      localStorage: makeLocalStorage(),
    };
    captureFirstTouch();
    expect(getStoredAttribution()?.partnerSlug).toBe("fthbc");
  });

  it("does not capture when ?p= is absent", () => {
    (globalThis as unknown as { window: unknown }).window = {
      location: { search: "" },
      localStorage: makeLocalStorage(),
    };
    captureFirstTouch();
    expect(getStoredAttribution()).toBeNull();
  });

  it("first touch wins -- a later visit with a different ?p= does not overwrite", () => {
    const storage = makeLocalStorage();
    (globalThis as unknown as { window: unknown }).window = {
      location: { search: "?p=fthbc" },
      localStorage: storage,
    };
    captureFirstTouch();

    (globalThis as unknown as { window: unknown }).window = {
      location: { search: "?p=someone-else" },
      localStorage: storage,
    };
    captureFirstTouch();

    expect(getStoredAttribution()?.partnerSlug).toBe("fthbc");
  });
});
