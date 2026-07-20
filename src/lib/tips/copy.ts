// Approved 2026-07-19 (Consent, Unsubscribe, and Tips Email System, Phase 4).
// Plain-text only, matching the grader's results email — no HTML build exists
// yet, so these render as-is via Resend's `text` field. Do not edit wording
// here without a fresh copy approval; this file is the source of truth for
// what actually sends.

export type TipStage = 0 | 1 | 2 | 3;

export type TipTemplate = {
  subject: string;
  body: (vars: { name: string; claimFileLink: string; unsubscribeLink: string }) => string;
};

const FOOTER = (unsubscribeLink: string) => `

---
WholeClaim is a self-help documentation tool, not legal or insurance advice.

You're receiving this because you agreed to receive claim documentation tips when you graded your claim. Unsubscribe anytime: ${unsubscribeLink}`;

export const TIP_TEMPLATES: Record<TipStage, TipTemplate> = {
  0: {
    subject: "Your Claim Grade, and the one thing to fix first",
    body: ({ name, claimFileLink, unsubscribeLink }) => `${name}, here's a quick follow-up to your Claim Grade.

If there's one habit that separates a well-documented claim from a weak one, it's this: photograph everything before anything gets repaired, cleaned up, or thrown away. Every room, every angle, close-ups and wide shots, before any work starts.

It sounds obvious. It's also the single most common gap we see — repairs start, and the "before" picture of the damage is gone for good.

If you haven't already, this is worth doing this week, even if repairs are already underway on some of it. Photograph whatever is still standing today.

Continue building your file: ${claimFileLink}

— WholeClaim${FOOTER(unsubscribeLink)}`,
  },
  1: {
    subject: "Why a paper trail beats a good memory",
    body: ({ name, claimFileLink, unsubscribeLink }) => `${name}, quick one today: your memory is not your claim file. A carrier's records are.

Every time you talk to your carrier — a call, a voicemail, an email — write down four things right after: the date, who you spoke with, what they said, and what you agreed to do next. Takes under a minute.

Then go one step further: if it was a phone call, send a short follow-up email the same day confirming what was discussed. "Following up on our call today — you said X, I'll send Y by Friday." Now there's a written record on both sides, not just your memory of a conversation.

This one habit is what turns "I think they told me..." into "here's exactly what they told me, and when."

Continue building your file: ${claimFileLink}

— WholeClaim${FOOTER(unsubscribeLink)}`,
  },
  2: {
    subject: "What a complete evidence file actually contains",
    body: ({ name, claimFileLink, unsubscribeLink }) => `${name}, today's tip is short: what does "thorough documentation" actually mean for a property claim?

At minimum, a complete file usually includes:
- Photos and video of the damage, before and during repairs
- Your policy documents — declarations page, forms, endorsements
- Every estimate you've received, from your carrier and from any contractor
- Receipts and invoices for anything you've paid for already
- Copies of every letter, email, and written notice from your carrier

If any of these are missing from your file right now, that's the gap to close first — not because any one document guarantees anything, but because a carrier's file is complete, and yours should be too.

Continue building your file: ${claimFileLink}

— WholeClaim${FOOTER(unsubscribeLink)}`,
  },
  3: {
    subject: "The deadline most homeowners never hear about",
    body: ({ name, claimFileLink, unsubscribeLink }) => `${name}, last tip in this series: check your policy for a suit limitation clause.

Most homeowners policies set a deadline — often one or two years from the date of loss — after which you lose the right to take legal action over the claim, even if it's still open. The exact timeframe depends on your policy and your state, so this isn't something we can tell you the number for — but it's worth finding the actual date in your own policy and writing it down now, not later.

If you're not sure where to look, it's usually in the "Conditions" section of your policy, sometimes labeled "Suit Against Us" or similar.

That's the last tip in this series — you'll still hear from us about your account and any deadlines you've tracked in WholeClaim, but this is the end of the documentation-tips sequence unless you come back for more.

Continue building your file: ${claimFileLink}

— WholeClaim${FOOTER(unsubscribeLink)}`,
  },
};

// Day offset from the anchor timestamp at which each stage becomes eligible
// to send. Stage 0 anchors off the lead's created_at (grading date); stages
// 1-3 anchor off last_tip_sent_at (when the previous tip actually went out).
// Day 1 / Day 4 / Day 8 / Day 12 as approved -> gaps of 1, 3, 4, 4 days.
export const TIP_STAGE_DELAY_DAYS: Record<TipStage, number> = {
  0: 1,
  1: 3,
  2: 4,
  3: 4,
};
