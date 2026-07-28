// Generates The-First-72-Hours.pdf. Content is verbatim from the founder's
// approved copy (2026-07-27) -- do not paraphrase if editing; only the
// closing copyright line was intentionally changed from the source's
// "© WholeClaim" to the founder's personal name, per Decisions #17/#18
// (no LLC exists yet to hold IP -- see project_wholeclaim_entity_and_ip_status
// memory). Re-run with `node generate.js` from this directory after any edit.
// Fonts are the same weights loaded in src/app/layout.tsx, fetched once from
// Google Fonts (OFL-licensed, redistributable) and committed to fonts/ so
// this script has no network dependency. Colors are the hp-* tokens from
// src/app/globals.css (Paper/Pine/Stamp), not re-derived.
const fs = require("fs");
const path = require("path");
const C = require("./build.js");

const {
  doc,
  PAGE_W,
  PAGE_H,
  MARGIN_X,
  CONTENT_W,
  setColor,
  newPage,
  ensureSpace,
  sectionEyebrow,
  body,
  label,
  bulletList,
  checkmarkList,
  exampleBlock,
  checklistGroup,
  tabSealB64,
} = C;

// =======================================================================
// COVER
// =======================================================================
newPage("cover");
setColor("setFillColor", "pine");
doc.rect(0, 0, PAGE_W, PAGE_H, "F");

// Tab Seal mark (public/icons/icon-512-maskable.png -- pine background,
// paper glyph, so it sits flush against the cover with no visible edge).
const sealSize = 108;
doc.addImage(tabSealB64, "PNG", MARGIN_X, 84, sealSize, sealSize);

doc.setFont("Archivo", "bold");
doc.setFontSize(10);
setColor("setTextColor", "sage");
doc.text("A FREE RESOURCE FROM WHOLECLAIM", MARGIN_X, 84 + sealSize + 40);

doc.setFont("Bricolage", "extrabold");
doc.setFontSize(38);
setColor("setTextColor", "paper");
let ty = 84 + sealSize + 78;
for (const line of ["THE FIRST", "72 HOURS"]) {
  doc.text(line, MARGIN_X, ty);
  ty += 44;
}

doc.setFont("PublicSans", "normal");
doc.setFontSize(13);
setColor("setTextColor", "sage");
const subLines = doc.splitTextToSize(
  "A Homeowner's Guide to Documenting Property Damage Before Details Get Lost",
  CONTENT_W - 40,
);
let sy = ty + 18;
for (const l of subLines) {
  doc.text(l, MARGIN_X, sy);
  sy += 19;
}

setColor("setDrawColor", "pineDeep");
doc.setLineWidth(1);
doc.line(MARGIN_X, PAGE_H - 70, PAGE_W - MARGIN_X, PAGE_H - 70);
doc.setFont("Archivo", "bold");
doc.setFontSize(9);
setColor("setTextColor", "sage");
doc.text("WHOLECLAIM", MARGIN_X, PAGE_H - 48);
doc.text("getwholeclaim.com", PAGE_W - MARGIN_X, PAGE_H - 48, { align: "right" });

// =======================================================================
// INTRO
// =======================================================================
C.sectionTag = "INTRO";
newPage("paper");
C.y = C.TOP_Y + 8;

doc.setFont("Bricolage", "bold");
doc.setFontSize(22);
setColor("setTextColor", "pine");
doc.text("When property damage happens,", MARGIN_X, C.y);
C.y += 28;
doc.text("the first few hours can feel overwhelming.", MARGIN_X, C.y);
C.y += 34;

body("Water damage. Storm damage. Fire. Theft. Unexpected repairs.", { emphasis: true });
body("In the middle of the stress, important details can disappear quickly:");
bulletList([
  "When the damage was discovered",
  "What areas were affected",
  "What items were damaged",
  "What repairs were performed",
  "What expenses occurred",
  "What conversations happened",
]);
body("Good documentation helps you keep a clear record of what happened.");
body("This guide helps you organize the information you may need after property damage occurs.");

// =======================================================================
// TABLE OF CONTENTS
// =======================================================================
C.sectionTag = "CONTENTS";
newPage("paper");
C.y = C.TOP_Y + 8;
doc.setFont("Bricolage", "bold");
doc.setFontSize(22);
setColor("setTextColor", "pine");
doc.text("Table of Contents", MARGIN_X, C.y);
C.y += 40;

const toc = [
  "The First Priority: Preserve the Scene and Record Details",
  "Create Your Loss Timeline",
  "Capture Photos and Videos Correctly",
  "Document Damaged Property",
  "Save Repair and Expense Records",
  "Organize Communication Records",
  "Create a Central Documentation System",
  "The First 72 Hours Checklist",
];
toc.forEach((t, i) => {
  const num = String(i + 1).padStart(2, "0");
  ensureSpace(30);
  doc.setFont("PlexMono", "medium");
  doc.setFontSize(11);
  setColor("setTextColor", "stamp");
  doc.text(num, MARGIN_X, C.y);
  doc.setFont("PublicSans", "semibold");
  doc.setFontSize(12);
  setColor("setTextColor", "ink");
  const lines = doc.splitTextToSize(t, CONTENT_W - 44);
  lines.forEach((l, li) => doc.text(l, MARGIN_X + 44, C.y + li * 15));
  C.y += Math.max(1, lines.length) * 15 + 14;
});

// =======================================================================
// SECTION 1
// =======================================================================
C.sectionTag = "1 / 8";
newPage("paper");
sectionEyebrow("01", "The First Priority: Preserve the Scene and Record Details");
body("After discovering damage, your first step is safety.");
body("Before documenting anything:");
bulletList([
  "Address immediate safety concerns",
  "Prevent additional damage when reasonable",
  "Avoid unnecessary changes to damaged areas until you have recorded what happened",
]);
body("Start creating a record as soon as possible.");
body("Write down:");
bulletList([
  "Date damage was discovered",
  "Approximate time discovered",
  "Location of damage",
  "What you observed",
  "Actions already taken",
]);
body("Small details become harder to remember as time passes.", { emphasis: true });

// =======================================================================
// SECTION 2
// =======================================================================
C.sectionTag = "2 / 8";
newPage("paper");
sectionEyebrow("02", "Create Your Loss Timeline");
body("A timeline helps organize events in the order they happened.");
body("Start with the first known event.");
label("Example");
exampleBlock([
  ["Date", "June 15"],
  ["Event", "Water noticed in basement"],
  ["Observation", "Flooring and drywall showed visible damage"],
  ["Action Taken", "Shut off water supply and contacted plumber"],
]);
body("Continue adding:");
bulletList(["Inspections", "Repairs", "Contractor visits", "Purchases", "Important communications"]);
body("Keep the timeline factual.");
body("Record what happened, when it happened, and what actions were taken.");

// =======================================================================
// SECTION 3
// =======================================================================
C.sectionTag = "3 / 8";
newPage("paper");
sectionEyebrow("03", "Capture Photos and Videos Correctly");
body("Photos and videos provide a visual record of damage.");
body("Helpful documentation practices:");
label("Take wide photos first");
body("Show:");
bulletList(["The room", "The location", "Surrounding areas"]);
body("Then take closer photos showing:");
bulletList(["Specific damage", "Materials affected", "Visible conditions"]);
label("Include context");
body("A close-up photo may show damage, but a wider photo helps show where the damage occurred.");
label("Keep original files");
body("Avoid editing or compressing photos when possible.");
body("Keep:");
bulletList(["Original photos", "Original videos", "Dates and file information"]);

// =======================================================================
// SECTION 4
// =======================================================================
C.sectionTag = "4 / 8";
newPage("paper");
sectionEyebrow("04", "Document Damaged Property");
body("Create a list of affected items.");
body("Include:");
bulletList([
  "Item description",
  "Location",
  "Approximate age",
  "Purchase information if available",
  "Photos if available",
]);
label("Example");
exampleBlock([
  ["Item", "Living room sofa"],
  ["Location", "Main floor"],
  ["Approximate age", "3 years"],
  ["Documentation", "Purchase receipt saved"],
]);
body("Do not rely only on memory.");
body("A written inventory helps preserve details.", { emphasis: true });

// =======================================================================
// SECTION 5
// =======================================================================
C.sectionTag = "5 / 8";
newPage("paper");
sectionEyebrow("05", "Save Repair and Expense Records");
body("Keep records related to the damage.");
body("Examples:");
bulletList([
  "Contractor estimates",
  "Invoices",
  "Receipts",
  "Emergency service records",
  "Materials purchased",
  "Inspection reports",
]);
body("For each document, record:");
bulletList(["Date", "Company/person involved", "Description", "Amount paid (if applicable)"]);
body("A complete record makes it easier to understand the history of the event.");

// =======================================================================
// SECTION 6
// =======================================================================
C.sectionTag = "6 / 8";
newPage("paper");
sectionEyebrow("06", "Organize Communication Records");
body("Important information can be spread across:");
bulletList(["Emails", "Text messages", "Phone calls", "Written notices"]);
body("Create a communication log.");
label("Example");
exampleBlock([
  ["Date", "June 18"],
  ["Contact", "Plumbing company"],
  ["Purpose", "Emergency repair discussion"],
  ["Notes", "Technician scheduled visit"],
]);
body("Keeping communication organized prevents important details from getting lost.");

// =======================================================================
// SECTION 7
// =======================================================================
C.sectionTag = "7 / 8";
newPage("paper");
sectionEyebrow("07", "Create a Central Documentation System");
body("Many homeowners store information in different places:");
bulletList(["Phone photos", "Email attachments", "Paper receipts", "Text messages", "Computer folders"]);
body("A central system helps keep everything together.");
body("Your documentation system should include:");
checkmarkList([
  "Timeline",
  "Photos and videos",
  "Property inventory",
  "Receipts",
  "Repair records",
  "Communication records",
]);
body("The goal is simple:");
ensureSpace(24);
doc.setFont("Bricolage", "bold");
doc.setFontSize(15);
setColor("setTextColor", "pine");
doc.text("Create one organized record of what happened.", MARGIN_X, C.y);
C.y += 24;

// =======================================================================
// SECTION 8 -- CHECKLIST
// =======================================================================
C.sectionTag = "8 / 8";
newPage("checklist");
sectionEyebrow("08", "The First 72 Hours Checklist");
checklistGroup("Immediate Actions", [
  "Confirm safety concerns are addressed",
  "Record the date and time damage was discovered",
  "Take photos and videos",
  "Write down initial observations",
  "Document temporary actions taken",
]);
checklistGroup("Documentation", [
  "Create a timeline",
  "List damaged areas",
  "Record damaged items",
  "Save receipts and invoices",
  "Save contractor information",
]);
checklistGroup("Organization", [
  "Store photos in one location",
  "Keep documents together",
  "Track important communications",
  "Update records as new information becomes available",
]);

// =======================================================================
// FINAL THOUGHTS + CTA
// =======================================================================
newPage("cta");
setColor("setFillColor", "pine");
doc.rect(0, 0, PAGE_W, PAGE_H, "F");

let cy = 100;
doc.setFont("Archivo", "bold");
doc.setFontSize(10);
setColor("setTextColor", "sage");
doc.text("FINAL THOUGHTS", MARGIN_X, cy);
cy += 34;

doc.setFont("PublicSans", "normal");
doc.setFontSize(13);
setColor("setTextColor", "paper");
const finalLines = [
  "Property damage can create confusion quickly.",
  "A clear record helps you remember important details and keep your information organized.",
  "The best time to create documentation is before details are forgotten.",
];
for (const t of finalLines) {
  const ls = doc.splitTextToSize(t, CONTENT_W - 20);
  for (const l of ls) {
    doc.text(l, MARGIN_X, cy);
    cy += 20;
  }
  cy += 8;
}

cy += 20;
setColor("setDrawColor", "pineDeep");
doc.setLineWidth(1);
doc.line(MARGIN_X, cy, PAGE_W - MARGIN_X, cy);
cy += 40;

doc.setFont("Bricolage", "bold");
doc.setFontSize(18);
setColor("setTextColor", "paper");
const ctaHead = doc.splitTextToSize(
  "WholeClaim helps homeowners organize their claim documentation in one place",
  CONTENT_W - 20,
);
for (const l of ctaHead) {
  doc.text(l, MARGIN_X, cy);
  cy += 24;
}
cy += 4;
doc.setFont("PublicSans", "normal");
doc.setFontSize(12);
setColor("setTextColor", "sage");
const ctaBody = doc.splitTextToSize(
  "with tools designed to keep records, evidence, and important information together.",
  CONTENT_W - 20,
);
for (const l of ctaBody) {
  doc.text(l, MARGIN_X, cy);
  cy += 18;
}

cy += 30;
// CTA "button" treatment -- Stamp fill, no live link (delivery flow not built yet).
const btnH = 44;
setColor("setFillColor", "stamp");
doc.roundedRect(MARGIN_X, cy, 300, btnH, 3, 3, "F");
doc.setFont("PublicSans", "semibold");
doc.setFontSize(11.5);
setColor("setTextColor", "paper");
doc.text("Learn more about organizing your", MARGIN_X + 18, cy + 18);
doc.text("documentation with WholeClaim", MARGIN_X + 18, cy + 33);

// Tab Seal + corrected copyright line, bottom of page.
const smallSeal = 30;
doc.addImage(tabSealB64, "PNG", MARGIN_X, PAGE_H - 88, smallSeal, smallSeal);
doc.setFont("Archivo", "bold");
doc.setFontSize(9);
setColor("setTextColor", "sage");
doc.text("getwholeclaim.com", MARGIN_X + smallSeal + 14, PAGE_H - 68);
doc.setFont("PublicSans", "normal");
doc.setFontSize(8.5);
setColor("setTextColor", "sage");
doc.text("© 2026 Benjamin Hammonds. All rights reserved.", MARGIN_X + smallSeal + 14, PAGE_H - 54);
doc.setFontSize(7.5);
doc.text(
  "WholeClaim is a self-help documentation tool, not legal or insurance advice.",
  MARGIN_X + smallSeal + 14,
  PAGE_H - 42,
);

// =======================================================================
const outPath = path.join(__dirname, "The-First-72-Hours.pdf");
const buf = Buffer.from(doc.output("arraybuffer"));
fs.writeFileSync(outPath, buf);
console.log("wrote", buf.length, "bytes,", C.pageNum, "pages ->", outPath);
