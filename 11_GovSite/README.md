# The Documentation Center — informational site

**Status: DEPLOYED AND PUBLICLY REACHABLE at `propertyevidenceresearch.org`.**

Corrected 2026-08-15. This file previously read *"built, NOT deployed, NOT
publicly reachable"* — that was true when written and is no longer true. The
site is live on the Vercel project **`property-evidence-research`** (linked via
`.vercel/project.json`). Anyone with the URL can read every page.

Public deployment is authorized by **Decision #121** — informational site only.
It is **not** authorized by #124, which is the Nonprofit/Business row and
prohibits *expansion* into those markets; do not cite #124 as the deployment
authority.

**Verified live 2026-08-15** by direct request, not inferred from source:

- all six pages return `<meta name="robots" content="noindex, nofollow">`
- no downloadable file of any kind is linked or present — no PDF, DOCX, ZIP
- no form, no script, no input field; contact is a plain `mailto:`
- `/README.md`, `/.env.local`, `/.gitignore`, `/.vercelignore` and
  `/.vercel/project.json` all return **404** — the `.vercelignore` fences held

**Unresolved:** whether this Vercel project is git-connected or deploys only by
CLI. That determines whether an ordinary `git push` can change the live site,
and it is not answerable from inside this repository. Confirm in the Vercel
project settings before assuming a push here is inert.

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

**Six** static pages, no build step, no framework, no JavaScript. (This table
said five and omitted `government.html`, which shipped at `b98fbaf`; corrected
2026-08-15 along with the status line above.)

| File | Page |
|---|---|
| `index.html` | Home — three-door org split, then hero, problem, who it's for, evidence, from-finding-to-record, how it works, what you get, is/isn't, pilot, research methodology |
| `government.html` | Government — the one door with kit references; card states, CTA buttons, role sections |
| `kits.html` | The Kits — kit-by-kit reference, Kit 4 gated |
| `nonprofit.html` | Nonprofit — research-stage only, no kit references |
| `business.html` | Business — research-stage only, no kit references |
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

- **Working name applied** — "The Documentation Center" replaced the
  `[Kit Series Name]` placeholder (19 occurrences). See the WORKING NAME
  caveat below: this is **not** cleared branding. No consumer-brand name
  appears in any served file (HTML or CSS), including in comments, which ship
  to the browser and are visible in view-source. Each page carries a visible
  "working name" badge.
- **No grader, no scored instrument, no assessment.** Zero references to the
  internal Property Documentation Readiness Check, which stays internal per its
  own §9 fencing.
- **No data collection.** Contact is a plain `mailto:` — no form, no input, no
  script anywhere on the site.
- **No outreach.** The site existing is not a marketing push; the outreach gate
  held since #110 is untouched.
- **Language guardrails.** No letter grades. Zero occurrences of "audit-ready",
  "compliant", or "certified". The word "guarantee" appears only inside the
  required footer disclaimer (5 pages × 1).
- **No editorial annotations leaked into the site** — the draft's internal
  notes (OPEN DECISION, Option A/B, "corrected — see note", DRAFT/INTERNAL
  headers) are all absent from the built pages. Verified by explicit search.
- `noindex, nofollow` on all 6 pages — **re-verified against the live site**
  2026-08-15, not only against source.
- **Nonprofit / Business doors are research-stage only** — no kit references
  (their nav deliberately omits "The Kits"), no pilot language, no findings,
  no assessment link, no Document/Test/Deploy framing.

## Open items

**Go-live already happened** — this section was written as a pre-launch list and
is retitled accordingly. Items 3 and 4 were resolved by the deployment itself;
item 6 is new and is live on the public site right now.

1. ~~**Evidence section — Option A vs Option B**~~ — **RESOLVED by Decision
   #123 (2026-08-14): Evidence Option C, specific but anonymized.** Real
   sample size and real quoted findings, with generic geographic attribution
   instead of naming counties. Neither A nor B was adopted. See #123 for the
   binding evidence constraint on the copy, and
   `02_Product/Evidence-Public-Claim-Traceability.md` for the private
   claim-to-source mapping.
2. ~~**Final brand name**~~ — **RESOLVED as a gate by Decision #122
   (2026-08-14), by accepted risk, not by clearance.** See the WORKING NAME
   section below: the name may now be used publicly as a *working* name.
   Anna's opinion is still outstanding and the name is still not cleared —
   what changed is that Benjamin explicitly accepted that risk for this line.
   This unblocks brand/name only; items 1, 3, 4 and 5 are untouched.
3. ~~**Contact address**~~ — **RESOLVED.** All three pages carrying a contact
   line now use `research@propertyevidenceresearch.org`, on the line's own
   domain rather than the consumer alias. **Deliverability of that mailbox is
   not verified here** — the consumer alias failed on exactly this point, so
   send a live test before relying on it.
4. ~~**Hosting / domain**~~ — **RESOLVED by the deployment.** The site is on
   `propertyevidenceresearch.org`, its own neutral domain, not the consumer
   domain. That is the outcome this item asked for.
5. **Kit 4 legal review** — unchanged, pending counsel. The "In development /
   pending legal review" framing on `kits.html` remains the only public Kit 4
   language authorized.
6. **⚠ LIVE ISSUE — `kits.html` implies four finished kits. None exist.**
   Kit 4 carries an "In development" label; Kits 1, 2, 3 and 5 carry none.
   Against that contrast the unlabeled four read as *available*, and the page
   opens by inviting the reader to "pick the one that matches your
   department's gap." **Actual build state as of 2026-08-15:** Kits 2, 3, 4
   and 5 are outlines whose own headers read *"No content written, no layout,
   no visual pass"*; Kit 1 has a vertical-slice prototype marked **"Not for
   distribution."** Zero kits are complete.

   Nothing is downloadable, so the gap cannot be discovered by clicking — only
   by a reader emailing to ask for one. That is an overclaim under #121's
   guardrails and it is public now. Two ways to close it: label the other four
   the way Kit 4 already is, or build the kits and leave the copy standing.
   **Neither has been done. No site copy has been changed — this item is a
   record of the problem, not a fix, and the choice is the founder's.**

---

## ⚠ WORKING NAME — "The Documentation Center"

**This is a working name under accepted risk. It is NOT cleared branding.**

Those are two different things and the difference is the whole point of this
section. The name has had a **lightweight name/domain screen only — two
searches.** That is **not** a trademark clearance, a knockout search, or a legal
opinion. It is the same caveat status as the earlier Dwellmark self-screen.

**What changed — Decision #122 (2026-08-14).** Benjamin explicitly accepted the
risk of using this name publicly for this line, **with knowledge of the
neighbouring 1992 "DOCUMENT CENTER" trademark and the broader
descriptive-saturation finding.** #122 is the **"(b)" branch** #121's amendment
named: a further explicit decision accepting the self-screen as sufficient here.

So the brand/name gate is **resolved by accepted risk** — not by clearance,
not by an opinion, and not by anything a lawyer has looked at. Anyone reading
this later should not upgrade "accepted risk" into "approved."

**What #122 does NOT change:**

- **The name is still not cleared, registered, or legally approved.** Describe
  it internally as a *working name under accepted risk* — never as "cleared."
- **The name-clearance gate (#17/#18) is untouched.** #122 consciously accepts
  risk *around* it for this line only; it does not satisfy it.
- **No ™, ®, or ℠ symbol may appear anywhere near the name, on any page.**
  Asserting a mark Benjamin knows is neither cleared nor registered would turn
  an accepted risk into a false claim — the one thing this decision must not be
  allowed to become. Verified zero occurrences across all 5 pages, `style.css`
  and this file; **re-verify before any deployment.**
- **No new visible disclaimer is required.** The existing footer disclaimer and
  the per-page "working name" badge stand as-is — the provisional status stays
  legible on the page itself, not only in this file.
- **#122 authorises no deployment.** Domain, hosting, contact address and the
  Evidence Option A/B question remain open exactly as before.

**If the name changes**, substitution touches 6 files (5 HTML incl. `<title>`
tags, plus the CSS header comment) — 19 occurrences at last count.
