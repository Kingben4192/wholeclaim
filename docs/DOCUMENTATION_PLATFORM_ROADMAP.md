# Documentation Platform — Five-Stage Roadmap
## INTERNAL STRATEGY ARTIFACT · NOT SITE COPY · NOT AUTHORIZED FOR BUILD

**What this is:** A roadmap showing where the documentation-kit line could eventually go — Learn → Assess → Document → Test → Deploy — across three audiences (Government, Nonprofit, Business). Captured so the thinking isn't lost, explicitly fenced so it never becomes a build task or public copy without its own decision.

**What this is not:** Authorization for anything. Every stage below requires its own separately logged decision before any of it is built, and most require validation work (research, pilots) that hasn't happened yet.

---

## The five stages, and why each is gated separately

| Stage | What it means | Status tonight | Gate to open it |
|---|---|---|---|
| **Learn** | Educational content — failure patterns, research findings, plain-English explanation | ✅ Live for Government, past the v0.2 site described earlier here: a dedicated `government.html` shipped, plus the sample record artifact and Documentation Health panel (Phase 2) and the Before/After, role, "not a CMMS" and evidence sections (Phase 3). Evidence copy follows Decision #123 (Option C). Nonprofit/Business still framed as research-stage with no content, and closed to expansion by #124 | Nonprofit/Business: requires the org-type replication research (parked, gated on Federal Audit Clearinghouse corpus actually being mined) — **and now also a separate decision under #124**, which restricts the active line to Government |
| **Assess** | Public scored/graded self-assessment instrument | ❌ Explicitly NOT authorized — this is the public grader | Own logged decision; validated scoring reliability; open-records/discovery-exposure legal review actually completed (not just flagged) |
| **Document** | A purchasable kit exists for that audience | ✅ Government (5 kits, outline parity); ❌ Nonprofit/Business — zero kits exist | Nonprofit/Business: kits would need their own build cycle after research validates the failure shapes actually replicate |
| **Test** | A named buyer pilots the system | Government: gated on Decision #110 (named program owner requesting a pilot quote) — not yet met | Same gate, all audiences — a real buyer asking, not us offering |
| **Deploy** | Logged-in, staff-enters-data SaaS — organization-wide documentation system | ❌ Not started in any form — no prototype, no data model, no scoping | Its own multi-month build decision, entirely separate from the kit/site work; would need its own security, data-retention, and multi-tenant-access design |

---

## Fencing

This file is an internal strategy artifact. Per the instruction under which it
was added:

- It is **not** linked from, referenced by, or reachable through any page in
  `11_GovSite/`.
- It is **not** in that site's serve path — `11_GovSite/` is served as a flat
  static directory, and this file lives in `docs/`, outside it.
- It is **not** authorization for any build. Every stage above needs its own
  logged decision first.
