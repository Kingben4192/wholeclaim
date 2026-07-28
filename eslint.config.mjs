import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Legacy prototype/reference .jsx files (2026-07-25) — planning and
    // design-reference material in the numbered doc folders, not part of
    // the shipped app. Confirmed nothing under src/ imports either
    // directory. Excluding them here (a config-scope fix) rather than
    // fixing their lint findings (which would be pointless churn on code
    // that's never built or deployed) is what was actually broken: CI was
    // blocking on stale prototype code, not on anything real.
    "03_Design/**",
    "04_Engineering/**",
    // Standalone Node build script for the First-72-Hours ebook PDF
    // (01_Brand/Lead-Magnets/first-72-hours/) -- run directly via
    // `node generate.js`, never imported by src/, no reason to hold it to
    // the app's ESM/import-style rules.
    "01_Brand/**",
  ]),
]);

export default eslintConfig;
