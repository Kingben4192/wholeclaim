# UI components — wiring notes

Five real component files in this folder, extracted verbatim from the
current artifact source (`artifact-source-reference.jsx`, also in this
folder as the full reference) — not reconstructed from memory:

- `shared.js` — `fmtPct`, `maxCountFor`, `TallyMark`, `LoadingLine`, `ErrorLine`, `TRENDING_THRESHOLD`
- `FeaturedCard.js` — the 🔥 Today's Question homepage card
- `HomeView.js` — homepage: hero, featured card, "People are answering," "Most answered," category grid, `SectionLabel`
- `CategoryView.js` — per-category poll list with trending badges
- `PollView.js` — the actual voting UI: choices, hero percentage post-vote, share, next-poll

Split into separate files deliberately (rather than one combined dump) so
each is small and self-contained — a single large file previously arrived
truncated in transit twice.

## What's already wired vs. what needs a name check

Each file's imports assume `lib/polls.js` exports `CATEGORIES`,
`getCategoryMeta`, `getLivePollsByCategory`, and (per Claude Code's own
report on building that file) `getFeaturedPoll()` with a
featured → evergreen → first-live fallback. If any of those names differ
from what's actually exported, fix the import line only — the component
bodies themselves are unchanged from the artifact and shouldn't need
logic edits for a naming mismatch.

`votingService` is imported from `@/lib/votingService` as a ready-to-use
singleton in every file. `lib/votingService.supabase.js` currently exports
`createSupabaseVotingAdapter({ supabase, pollsById })` as a factory, not a
pre-built singleton — if `lib/votingService.js` (no `.supabase`) doesn't
already exist as the place that instantiates and re-exports one, that's a
real small piece still needed: a one-time `export const votingService =
createSupabaseVotingAdapter({...})` somewhere central, so every component
can import the same instance rather than each building its own.

`pollUrl()` / hash-routing helpers referenced in the original `PollView`
are prototype-only (`#/poll/p7`). Replace any remaining use of them with
the real `/poll/${pollId}` path now that `app/poll/[pollId]/page.js`
exists as a true route.

## What NOT to change while wiring

Mark each file `"use client"` (already done) since all of them use
`useState`/`useEffect`, and `PollView` additionally uses
`navigator.share`/`navigator.clipboard`. Beyond that: this is a mechanical
port — swap the data source and voting backend, keep every visual and
interaction decision exactly as-is. Don't add new `POLLS` data or new
visual behavior while doing this. If something about a component doesn't
cleanly map to `lib/polls.js`'s actual shape, flag it back rather than
quietly changing product behavior to fit.
