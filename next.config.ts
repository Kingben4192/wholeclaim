import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// Decision #42 (2026-07-23). org/project/authToken deliberately omitted --
// no SENTRY_AUTH_TOKEN exists yet (that's a separate credential from the
// DSN, only needed for source-map upload). All three are optional per the
// SDK's own SentryBuildOptions type; without them the build still succeeds,
// it just skips uploading source maps -- errors still report correctly,
// stack traces are just minified until a token is added later.
export default withSentryConfig(nextConfig, {
  silent: true,
});
