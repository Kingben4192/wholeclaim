# [Kit Series Name] — informational site

**Status: built, NOT deployed, NOT publicly reachable.**

Authorized by **Decision #121** (2026-08-14): informational site only.

## Why it lives here and not in `src/app/`

This directory is deliberately **outside** `src/app/**` and `public/**`, the only
two paths the Next.js app builds routes or static files from. That means:

- the WholeClaim app cannot serve these pages, even if someone runs `vercel --prod`
- an unrelated production deploy **cannot accidentally publish this site**

That isolation is the point. Putting these files under `public/` would have made
them reachable at `getwholeclaim.com/...` on the very next deploy of anything.

It also keeps the lines separate in the way #121 requires: this is a distinct,
institutional-positioned product line, not a WholeClaim page.

## What this is

Four static pages, no build step, no framework, no JavaScript:

| File | Page |
|---|---|
| `index.html` | Home |
| `kits.html` | The Kits |
| `why-documentation.html` | Why Documentation |
| `contact.html` | Contact |
| `style.css` | Shared styling |

Preview locally by opening `index.html` in a browser, or:

```
cd 11_GovSite && python -m http.server 8080   # then visit localhost:8080
```

## Fences held (Decision #121)

- **Placeholder branding throughout** — `[Kit Series Name]`, never a real name.
  No consumer-brand name appears in any served file (HTML or CSS), including
  in comments, which ship to the browser and are visible in view-source.
- **No grader, no scored instrument, no assessment of any kind.** No link to the
  internal Property Documentation Readiness Check, which stays internal per its
  own §9 fencing.
- **No data collection.** Contact is a plain `mailto:` link — no form, no fields,
  no storage, nothing to retain or secure.
- **No outreach.** The site existing is not a marketing push; the outreach gate
  held since #110 is untouched.
- `noindex, nofollow` on every page, so it stays out of search indexes even if
  it is later hosted before branding resolves.

## Copy discipline

Copy is verbatim from the approved draft. The language guardrails were carried
through unchanged: **no letter grades**, and none of "audit-ready", "compliant",
or "certified" appear anywhere. The provisional-research honesty note on *Why
Documentation* is reproduced as written and must not be softened.

## Open items before this can go live

1. **Final brand name** — Anna's trademark opinion, then substitute
   `[Kit Series Name]` throughout (5 files, including `<title>` tags).
2. **Contact address** — `contact.html` currently has a literal `[address]`
   placeholder in both the link text and the `mailto:` target. **No real
   address was invented.** Note that `support@getwholeclaim.com` is both
   WholeClaim-branded (wrong line) and confirmed non-deliverable, so it is not
   a candidate.
3. **Hosting decision** — where this is served from, and under what domain.
4. **Kit 4 legal review** — the "In development / pending legal review" framing
   on `kits.html` is the only public Kit 4 language authorized so far.
