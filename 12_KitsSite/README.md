# The Property Record Series — consumer product pages

**Status: built, NOT deployed, NOT publicly reachable.** No Vercel project is
linked to this directory. Nothing here is live.

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

## Blockers before this page can be published

### 1. Purchase URL — unresolved

The CTA in `index.html` points at the literal placeholder token
`GUMROAD_URL_PENDING`. The Gumroad URL for *this* product was not found
anywhere in the repository. The only Gumroad links present are:

- `gumroad.com/l/Wholeclaim-Workbook`
- `gumroad.com/l/Claim-documentation-guide`

Both are **different products**. Neither was substituted and no URL was
invented. The button is rendered inert (`pointer-events: none`) so it cannot be
clicked through to a wrong or missing destination.

### 2. Release authorisation — all open as of 2026-08-16

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

## Before any public launch

1. Replace `GUMROAD_URL_PENDING` with the real product URL and remove the
   `is-disabled` class and `aria-disabled` attribute from the CTA.
2. Delete the `.prepub` banner from `index.html` and the `.prepub` rule from
   `style.css`.
3. Confirm the release gates above, per their own owners.
4. Decide hosting. This directory is deliberately unlinked to any Vercel
   project; `.vercelignore` already fences this README and local tooling files
   in case that changes.
5. Re-check that `noindex, nofollow` is still wanted before going public — it
   is currently set on `index.html`.

## Local preview

```
cd 12_KitsSite && python -m http.server 8080   # then visit localhost:8080
```
