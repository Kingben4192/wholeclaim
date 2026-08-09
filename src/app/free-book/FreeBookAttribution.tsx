"use client";

import { useEffect } from "react";
import { captureFirstTouch } from "@/lib/attribution";

// Same first-touch-wins capture already live on /grade (GraderQuiz.tsx) --
// reused as-is, not reimplemented. /free-book is a server component (same
// pattern as Disaster Response Center / Resource Library), so this one
// client-only sliver exists just to fire the effect on mount.
export function FreeBookAttribution() {
  useEffect(() => {
    captureFirstTouch();
  }, []);

  return null;
}
