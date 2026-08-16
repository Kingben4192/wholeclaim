# The Property Record Series — consumer product pages

**Status: DEPLOYED AND PUBLICLY REACHABLE at
`https://property-record-poll.vercel.app`.**

Deployed 2026-08-16 to the Vercel project **`property-record-poll`** — a new,
standalone project. It is **not** `wholeclaim` and **not**
`property-evidence-research`; both were verified unchanged before and after
(newest deployments `2026-08-14 11:28:32` and `2026-08-15 19:46:49`
respectively, identical either side of this deploy). The `wholeclaim` team
scope was used because this Vercel login rejects the personal account as a
scope — that was flagged and confirmed before deploying.

Both pages carry `noindex, nofollow`. Verified live: `/README.md`,
`/.vercelignore`, `/.env.local`, `/.vercel/project.json` and `/.gitignore` all
return 404.

> **Comments are stripped from all served files, deliberately.** `index.html`,
> `poll.html` and `style.css` originally carried explanatory comments naming
> WholeClaim, the government line, Formspree, and the Supabase tables `leads`
> and `analytics_events`. HTML and CSS comments ship in view-source and
> **cannot be fenced by `.vercelignore`** — only `README.md` can. They were
> removed before deploy. Keep internal context in this file, never in a served
> file.

## What this is, and what it is not

This is the **consumer** line — WholeClaim's homeowner products, per the brand
architecture confirmed in Decision #125 (*consumer brand WholeClaim serves
homeowners; institutional brand The Documentation Center covers the
government/nonprofit/business doors*).

**It is not `11_GovSite/`.** That directory is The Documentation Center, a
separate government product line with its own five kits, live at
`propertyevidenceresearch.org`. The two lines number their kits independently:

| | Consumer (this directory) | Government (`11_GovSite/`) |
|---|---|---|
| Kit 1 | The Homeowner's Property Record Kit | Property Documentation Kit |
| Kit 5 | Incident & Loss Record Kit | Project & Capital Improvement Kit |

Same numbers, different products. Do not merge, cross-reference, or reconcile
them — Decision #113 settled that kit numbering is not load-bearing and that
gates anchor to kit *names*.

## Scope of this build

Kit 1 only. Decision-authorised scope covers the website/Kits-page presentation
for **The Homeowner's Property Record Kit** and nothing else. Kits 2, 3 and 5
are not presented here and are not authorised for publication, sale, packaging
or deployment.

## Source artifact

All copy on `index.html` is drawn from the verified Kit 1 PDF. Nothing is
invented.

```
homeowners-property-record-kit_1.pdf
SHA-256 1edad650d7d45f7e6aef18475be44857bf73f197be7166df2e65d4e2aae1ef4f
size    159,338 bytes
pages   61
```

Publisher line verified as the resolved, entity-free form
(`(c) 2026. All rights reserved. For personal, single-household use.`) with no
occurrence of `WholeClaim LLC` anywhere in the document. A byte-identical copy
exists in Google Drive (`1ATkjwKP0sJJXEm-mv0gs14vU88OvzRji`).

**Do not substitute the 173,209-byte / 61-page PDF.** That is the
pre-resolution source and still carries the unresolved publisher line. Drive
holds both under the same filename — check the hash, not the name.

## `index.html` — Kit 1 landing page

### Design system — extracted from the PDF, not invented

The Pine / Paper / Stamp Red / Brass system was read out of the approved
artifact by parsing its colour operators, not chosen by eye:

| Role | Hex | Uses in PDF |
|---|---|---|
| Brass | `#8A6D2F` | 406 |
| Ink | `#14231C` | 360 |
| Brass tint | `#C9B98F` | 178 |
| Pine | `#1E4636` | 159 |
| Paper | `#F2F0EB` | 30 |
| Stamp Red | `#A32C1C` | 22 |
| Pine mid / muted / tint | `#2A5A47` `#4A5A50` `#6B7A70` `#E4EAE7` | — |

The kit's monospace field labels are echoed in eyebrows, stat labels, step
clocks and the QR caption, so the page reads as the same object buyers receive.

**Accessibility, measured per Decision #13 rather than assumed.** Brass on
paper is **4.28:1** — below AA for body text. Brass is therefore restricted to
large numerals, rules, borders and white-on-brass (4.87:1). Reading text uses
ink (14.33:1) or muted `#4A5A50` (6.43:1). All other tested pairs pass AA.

**`index.html` uses `kit1.css`; `poll.html` still uses `style.css`.** They were
deliberately kept separate so the Kit 1 product identity and the poll's
identity cannot drift into each other. `style.css` still contains vestigial
Kit 1 rules that are no longer referenced — harmless, worth trimming when
convenient.

### Page previews — real pages, hash-gated

`img/kit1-*.png` are rendered directly from the approved PDF at ~144 dpi. The
render script **verifies the source SHA-256 against the approved artifact and
aborts on mismatch**, so the pre-resolution 173,209-byte PDF cannot be used by
accident.

| Image | Source page |
|---|---|
| `kit1-cover.png` | p1 |
| `kit1-property-profile.png` | p7 — Section 01 Property Identity |
| `kit1-home-inventory.png` | p14 — Section 03 inventory register |
| `kit1-systems-register.png` | p29 — Section 04 systems |
| `kit1-repair-history.png` | p44 — Section 08 repair log |
| `kit1-annual-review.png` | p59 — Section 12 annual checklist |

Nothing is a mockup and no sample content was invented. The "60-minute
baseline" step copy is likewise verbatim from page 5.

### QR code

`img/kit1-qr.svg`, 2.4 KB, encodes exactly
`https://hammondson6.gumroad.com/l/woisbe`. Generated **offline** with `segno`
— no third-party QR service, no tracking pixel. Error correction level H (~30%
damage tolerance, suitable for print). Single colour `#1E4636` on white. Its
only `http` string is the `xmlns` XML namespace, which browsers never fetch.

Before wiring it in, the encoded payload was compared against the actual `href`
in the page — a wrong URL is the realistic failure mode, not a library bug.

### Price

**$19 USD**, shown in exactly two places: the hero note and the purchase band.
No sale price, discount, subscription, trial, refund or guarantee language.
Gumroad remains the authoritative source and the only purchase destination.

### Build-time dependencies — installed, used, removed

`pymupdf` (page rendering) and `segno` (QR) were installed locally, used to
produce the static assets above, and **uninstalled afterwards**. Nothing at
runtime or in production depends on either. To re-render, reinstall
temporarily and remove again.

## `poll.html` — concept poll

A two-question poll testing which kit concept gets built next, linked from
`index.html`. Free, no account. The primary action is answering; the Kit 1
purchase CTA appears only *after* submission, so the page functions as an
acquisition funnel rather than a purchase page.

### Responses are NOT recorded

**There is no submission backend, by decision, not by oversight.** The page
contains no `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`,
`EventSource`, dynamic `import()` or form `action` — verified against the
executable JavaScript with comments stripped. Submitting advances the view
locally and stores nothing. Nothing leaves the browser. Formspree is not used
and must not be reintroduced.

What was inspected before reaching that conclusion (2026-08-16):

| Candidate | Verdict |
|---|---|
| `leads` (`0006_grader.sql`) | **Unusable.** `name`, `email`, `grade`, `score` are all `NOT NULL`. The poll has no name/grade/score and email is *optional*. Writing to it would mean fabricating values. |
| `analytics_events` | Server-side event telemetry, not form capture. |
| Poll/survey table | Does not exist. |
| This directory | Static, no server — cannot store a submission without a third party. |

Capture requires a deliberate decision, most likely a new Supabase table plus
a server action in the Next.js app, with the migration pasted manually (the
repo has no migration runner). **That decision has not been made.**

### Before enabling capture

The banner on `poll.html` states that responses are not recorded. **Do not
remove it while `CAPTURE_ENABLED` is `false`** — the confirmation screen would
then imply a response was received when it was discarded. Wire capture first,
flip the constant, then remove the banner.

### Product boundary

The poll names three *concepts* only — Renovation, Inventory, Maintenance —
with no described contents, page counts or features. No content is invented
for Kits 2–5. Note that two of the three already exist as built PDFs
(`kit2-renovation-record.pdf`, `kit3-maintenance-systems-record.pdf`); built
is not published, so "first access when it ships" remains accurate.

## Open items

### 1. Purchase URL — RESOLVED 2026-08-16

Both CTAs point to the live Kit 1 product:

```
https://hammondson6.gumroad.com/l/woisbe
```

Founder-supplied and verified before wiring: HTTP 200, Gumroad returning the
product name `The Homeowner's Property Record Kit`. This is the **only**
external link on the site, and the sale happens entirely on Gumroad — no
checkout, payment system, Stripe flow or alternate purchase mechanism exists
here.

**Do not substitute `gumroad.com/l/Wholeclaim-Workbook` or
`gumroad.com/l/Claim-documentation-guide`** — those are different products and
were the reason a placeholder was used until the real URL arrived.

### 2. Release authorisation — all still open as of 2026-08-16

| Gate | Status |
|---|---|
| #17 name clearance | **Open** — USPTO + WorldClaim proximity outstanding |
| Refund Policy | Unreviewed draft, marked do-not-publish |
| Terms of Service | Unreviewed draft, not live |
| Privacy Policy | Unreviewed draft, not live |

The `Pre-Launch-Legal-Review-Request-DRAFT.md` cover letter has not been sent,
so none of these gates has an active clock on it.

Nothing on the page asserts trademark clearance or legal approval. No
trademark, registered-mark or service-mark symbol appears anywhere in this
directory. Decision #129's default-closed
publication rule applies unchanged: **a page existing is not authorisation to
publish it.**

## Live now — what is still outstanding

The site is public. The release gates above are **not** closed, and nothing on
the page claims otherwise. What remains:

1. **Capture backend.** Responses are discarded. Until that changes, the
   `.prepub` banner on `poll.html` must stay up — it is the only thing telling
   participants their answer is not recorded, and the confirmation screen would
   otherwise imply receipt. Wire capture, flip `CAPTURE_ENABLED`, **then**
   remove the banner. Never the other way round.
2. **Results view.** The stated purpose includes letting participants see what
   others think. That needs stored responses first and does not exist yet.
3. **Release gates.** #17, refund policy, Terms, Privacy — all open, none with
   an active clock.
4. **Indexing.** `noindex, nofollow` is set on both pages. Remove only when the
   gates above are settled.
5. **Redeploying.** `vercel --prod` from this directory ships to
   `property-record-poll`. It is a manual step; nothing here auto-deploys, and
   pushing to git does not publish this site.

## Local preview vs. deployed

`python -m http.server` serves **every** file in this directory, including
`README.md`. That is a limitation of the preview server, not a leak —
`.vercelignore` fences it on Vercel, verified 404 on the live site.

## Local preview

```
cd 12_KitsSite && python -m http.server 8080   # then visit localhost:8080
```
