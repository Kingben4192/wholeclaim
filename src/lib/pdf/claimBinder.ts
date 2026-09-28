import { jsPDF } from "jspdf";
import type { DocumentationScoreClientView } from "@/lib/scoring/documentationScore";
import { UNIVERSAL_DISCLAIMER } from "@/lib/anthropic/outputFilter";

// Claim binder PDF, v1 (Claim Grade A-Action-Center, approved 2026-08-01).
// A structured index/cover document -- not the raw files themselves (the
// existing account-wide ZIP export already carries those; embedding
// actual photos/documents as pages is explicitly out of scope for v1,
// per the founder's own framing). This is the organized summary a
// homeowner could print or hand to an adjuster/attorney alongside their
// evidence, not a replacement for the evidence itself.
//
// jsPDF works in a plain Node server context for text-based PDFs with no
// DOM/canvas dependency -- confirmed directly before building this.

export type ClaimBinderInput = {
  claim: {
    // Resolved display title -- callers must use getClaimDisplayTitle()
    // (Decision #75, src/lib/claimDisplay.ts), not raw claim.label, so
    // this stays in sync with every other surface that names a claim.
    title: string;
    carrier: string | null;
    claimNumber: string | null;
    policyNumber: string | null;
    dateOfLoss: string | null;
    damageCategory: string | null;
    status: string;
  };
  score: DocumentationScoreClientView;
  evidenceItems: { label: string; checked: boolean; file_id: string | null }[];
  files: { original_name: string; kind: string; uploaded_at: string; storage_path?: string; thumbnailDataUrl?: string | null; thumbnailFormat?: "JPEG" | "PNG" }[];
  entries: { type: string; date: string; summary: string | null }[];
  deadlines: { title: string; due_date: string }[];
  promisedItems: { description: string; promised_by: string | null; target_date: string | null; file_id: string | null }[];
};

const PAGE_MARGIN = 15;
const PAGE_HEIGHT = 297; // A4 mm
const LINE_HEIGHT = 6;

function statusLabel(status: DocumentationScoreClientView["categories"][number]["status"]): string {
  return { strong: "Strong", solid: "Solid", needs_attention: "Needs attention", critical_gap: "Critical gap" }[status];
}

export function buildClaimBinderPdf(input: ClaimBinderInput): ArrayBuffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = PAGE_MARGIN;

  function ensureRoom(lines = 1) {
    if (y + lines * LINE_HEIGHT > PAGE_HEIGHT - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  }

  function heading(text: string) {
    ensureRoom(2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(text, PAGE_MARGIN, y);
    y += LINE_HEIGHT + 1;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  }

  function line(text: string) {
    const wrapped = doc.splitTextToSize(text, 180) as string[];
    for (const w of wrapped) {
      ensureRoom();
      doc.text(w, PAGE_MARGIN, y);
      y += LINE_HEIGHT;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Claim Binder", PAGE_MARGIN, y);
  y += 9;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, PAGE_MARGIN, y);
  y += 10;

  heading(input.claim.title);
  line(`Carrier: ${input.claim.carrier ?? "Not set"}`);
  line(`Claim number: ${input.claim.claimNumber ?? "Not set"}`);
  line(`Policy number: ${input.claim.policyNumber ?? "Not set"}`);
  line(`Date of loss: ${input.claim.dateOfLoss ?? "Not set"}`);
  line(`Category: ${input.claim.damageCategory ?? "Not set"}`);
  line(`Status: ${input.claim.status}`);
  y += 4;

  heading("Documentation Score");
  line(`Grade: ${input.score.grade} (${input.score.total}/100)`);
  for (const cat of input.score.categories) {
    line(`- ${cat.label}: ${statusLabel(cat.status)}`);
  }
  y += 4;

  heading("Evidence checklist");
  if (input.evidenceItems.length === 0) line("Nothing tracked yet.");
  for (const item of input.evidenceItems) {
    line(`${item.file_id ? "[x]" : item.checked ? "[~]" : "[ ]"} ${item.label}`);
  }
  y += 4;

  heading("Evidence index");
  const photoFiles = input.files.filter((file) => file.kind === "photo");
  if (photoFiles.length === 0) {
    line("No photo evidence uploaded yet.");
  } else {
    const thumbWidth = 40;
    const thumbHeight = 30;
    for (let index = 0; index < photoFiles.length; index += 2) {
      ensureRoom(8);
      const row = photoFiles.slice(index, index + 2);
      row.forEach((file, column) => {
        const x = PAGE_MARGIN + column * 90;
        const imageY = y;
        doc.setDrawColor(180);
        doc.rect(x, imageY, thumbWidth, thumbHeight);
        if (file.thumbnailDataUrl) {
          try {
            doc.addImage(file.thumbnailDataUrl, file.thumbnailFormat ?? "JPEG", x + 1, imageY + 1, thumbWidth - 2, thumbHeight - 2);
          } catch {
            doc.setFontSize(8);
            doc.text("Photo preview", x + 4, imageY + 16);
          }
        } else {
          doc.setFontSize(8);
          doc.text("Photo preview", x + 4, imageY + 16);
        }
        doc.setFontSize(8);
        const nameLines = doc.splitTextToSize(file.original_name, 36) as string[];
        let labelY = imageY + thumbHeight + 5;
        for (const nameLine of nameLines.slice(0, 2)) {
          doc.text(nameLine, x, labelY);
          labelY += 4.5;
        }
        doc.text(new Date(file.uploaded_at).toLocaleDateString(), x, labelY + 1);
      });
      y += thumbHeight + 20;
    }
  }
  y += 4;

  heading("Receipts & documents");
  const otherFiles = input.files.filter((file) => file.kind !== "photo");
  if (otherFiles.length === 0) line("No receipts or PDFs uploaded yet.");
  for (const file of otherFiles) {
    line(`${file.original_name} — ${file.kind}, uploaded ${new Date(file.uploaded_at).toLocaleDateString()}`);
  }
  y += 4;

  heading("Timeline");
  if (input.entries.length === 0) line("No timeline entries yet.");
  for (const e of input.entries) {
    line(`${new Date(e.date).toLocaleDateString()} — ${e.type}${e.summary ? ": " + e.summary : ""}`);
  }
  y += 4;

  heading("Deadlines");
  if (input.deadlines.length === 0) line("No deadlines tracked.");
  for (const d of input.deadlines) {
    line(`${new Date(d.due_date).toLocaleDateString()} — ${d.title}`);
  }
  y += 4;

  heading("Promised documents");
  if (input.promisedItems.length === 0) line("Nothing tracked yet.");
  for (const p of input.promisedItems) {
    const status = p.file_id ? "Received" : p.target_date && new Date(p.target_date) < new Date() ? "Overdue" : "Promised";
    line(`[${status}] ${p.description}${p.promised_by ? " — from " + p.promised_by : ""}`);
  }
  y += 6;

  doc.setFontSize(8);
  doc.setTextColor(120);
  line(UNIVERSAL_DISCLAIMER);

  return doc.output("arraybuffer");
}
