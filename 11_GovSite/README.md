# [Kit Series Name] — informational site

**Status: built, NOT deployed, NOT publicly reachable.**

Built from **Public Site Copy DRAFT v0.2**, which supersedes v0.1.
Authorized by **Decision #121** (2026-08-14), committed as `f53814c`.

## Why it lives here and not in `src/app/`

This directory is deliberately **outside** `src/app/**` and `public/**`, the only
two paths the Next.js app builds routes or static files from. That means:

- the consumer app cannot serve these pages, even if someone runs `vercel --prod`
- an unrelated production deploy **cannot accidentally publish this site**

That isolation is the point. Putting these files under `public/` would have made
them reachable on the very next deploy of anything.

It also keeps the lines separate as #121 requires: a distinct,
institutional-positioned product line, not a page of the consumer product.

## What this is

Three static pages, no build step, no framework, no JavaScript:

| File | Page |
|---|---|
| `index.html` | Home — hero, problem, who it's for, evidence, from-finding-to-record, how it works, what you get, is/isn't, pilot, research methodology |
| `kits.html` | The Kits — kit-by-kit reference, Kit 4 gated |
| `contact.html` | Contact — plain mailto |
| `style.css` | Shared styling |

Preview locally:

```
cd 11_GovSite && python -m http.server 8080   # then visit localhost:8080
```

### v0.1 → v0.2 changes applied

- **Home restructured** into the ten-section layout above.
- **"Why Documentation" page removed** — v0.2's site map is three pages; that
  content now lives on Home as *What the public record is telling us* and
  *Research methodology*. Nav updated on every page.
- **"How It Works" reframed.** v0.1's source workflow ended
  Retrieve → Package, which describes *software* that finds and assembles
  evidence. This is paper and templates, so the final step is now
  *Organize for retrieval* — what the structure lets a person do, not what a
  system does. The section is explicitly prefaced "not software."
- **Contact copy updated** to ask for role, jurisdiction, and problem.

## Fences held (Decision #121) — verified after build

- **Placeholder branding throughout** — `[Kit Series Name]` ×12, never a real
  name. No consumer-brand name appears in any served file (HTML or CSS),
  including in comments, which ship to the browser and are visible in
  view-source.
- **No grader, no scored instrument, no assessment.** Zero references to the
  internal Property Documentation Readiness Check, which stays internal per its
  own §9 fencing.
- **No data collection.** Contact is a plain `mailto:` — no form, no input, no
  script anywhere on the site.
- **No outreach.** The site existing is not a marketing push; the outreach gate
  held since #110 is untouched.
- **Language guardrails.** No letter grades. Zero occurrences of "audit-ready",
  "compliant", or "certified". The word "guarantee" appears only inside the
  required footer disclaimer (3 pages × 1).
- **No editorial annotations leaked into the site** — the draft's internal
  notes (OPEN DECISION, Option A/B, "corrected — see note", DRAFT/INTERNAL
  headers) are all absent from the built pages. Verified by explicit search.
- `noindex, nofollow` on all 3 pages.

## Open items before go-live

1. **Evidence section — Option A vs Option B. NOT RESOLVED; Benjamin's call.**
   The site currently ships **Option A** (the draft's stated default): general
   research language, **no jurisdictions named and no specific findings
   quoted**. Option B would name the counties studied and walk 2–3 specific
   findings — more persuasive, and materially more exposed, since it means a
   jurisdiction's own audit failures being read by people who recognise them.
   Switching to B is a copy change to Home plus a replacement of the
   *From documented failure to standardized record* section with named case
   studies. **No option was chosen here.**
2. **Final brand name** — pending Anna's trademark opinion, then substitute
   `[Kit Series Name]` throughout (4 files, including `<title>` tags).
3. **Contact address** — `contact.html` carries a literal `[address]`
   placeholder in both link text and `mailto:` target. **No address was
   invented.** The existing consumer support alias is disqualified twice over:
   wrong product line, and confirmed non-deliverable.
4. **Hosting / domain.** Flagged in the v0.2 draft and worth keeping visible:
   serving this under the consumer domain would brand it as that product's
   offering, cutting directly against the neutral, separate positioning #121
   requires. Needs its own decision before go-live.
5. **Kit 4 legal review** — unchanged, pending counsel. The "In development /
   pending legal review" framing on `kits.html` remains the only public Kit 4
   language authorized.
