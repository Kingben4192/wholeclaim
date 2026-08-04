// Generates the 4 Emergency Checklist PDFs (Decision #96, spec section 2)
// into public/checklists/, so they're served as static files at
// /checklists/<file>.pdf. Content is read directly from
// src/lib/checklistsData.json -- the same source src/lib/checklists.ts
// exposes to the in-app checklist pages -- so the PDF and the in-app
// version can't drift into two different lists of steps for the same
// event. Re-run with `node generate.js` from this directory after any
// content edit.
//
// One page per checklist, by design (spec: "each checklist = one-page
// PDF, checkbox format"), so this doesn't need the multi-page pagination
// machinery the-first-72-hours/build.js built for an 8-section ebook --
// simpler, purpose-built layout instead. Fonts and the Tab Seal image are
// reused directly from that existing lead magnet rather than duplicated
// into a second copy.
const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");

const ROOT = path.join(__dirname, "..", "..");
const FONTS_DIR = path.join(__dirname, "..", "Lead-Magnets", "first-72-hours", "fonts");
const OUT_DIR = path.join(ROOT, "public", "checklists");
const DATA_PATH = path.join(ROOT, "src", "lib", "checklistsData.json");

const COLOR = {
  paper: [242, 240, 235],
  ink: [20, 32, 26],
  inkSoft: [67, 81, 74],
  pine: [30, 70, 54],
  pineDeep: [21, 53, 40],
  sage: [227, 233, 226],
  line: [216, 211, 198],
  stamp: [138, 47, 35],
};

const DISCLAIMER =
  "WholeClaim helps organize documentation. It does not provide insurance advice, guarantee claim approval, or determine claim outcomes.";

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_X = 64;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

function loadFont(doc, file, name, style) {
  const ttf = fs.readFileSync(path.join(FONTS_DIR, file));
  doc.addFileToVFS(file, ttf.toString("base64"));
  doc.addFont(file, name, style);
}

const tabSealB64 = fs
  .readFileSync(path.join(ROOT, "public", "icons", "icon-512-maskable.png"))
  .toString("base64");

const checklists = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

for (const checklist of checklists) {
  const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
  loadFont(doc, "bricolage-800.ttf", "Bricolage", "extrabold");
  loadFont(doc, "bricolage-700.ttf", "Bricolage", "bold");
  loadFont(doc, "archivo-700.ttf", "Archivo", "bold");
  loadFont(doc, "pubsans-400.ttf", "PublicSans", "normal");
  loadFont(doc, "pubsans-600.ttf", "PublicSans", "semibold");
  loadFont(doc, "plexmono-500.ttf", "PlexMono", "medium");

  const setColor = (setter, key) => {
    const c = COLOR[key];
    doc[setter](c[0], c[1], c[2]);
  };

  // Background + header band
  setColor("setFillColor", "paper");
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  setColor("setFillColor", "pine");
  doc.rect(0, 0, PAGE_W, 130, "F");

  doc.addImage(tabSealB64, "PNG", MARGIN_X, 28, 44, 44);
  doc.setFont("Archivo", "bold");
  doc.setFontSize(9);
  setColor("setTextColor", "sage");
  doc.text("WHOLECLAIM CHECKLIST", MARGIN_X + 56, 44);
  doc.setFont("Bricolage", "extrabold");
  doc.setFontSize(22);
  setColor("setTextColor", "paper");
  doc.text(checklist.title, MARGIN_X + 56, 68);
  doc.setFont("PublicSans", "normal");
  doc.setFontSize(10.5);
  setColor("setTextColor", "sage");
  const descLines = doc.splitTextToSize(checklist.description, PAGE_W - MARGIN_X * 2 - 56);
  descLines.forEach((l, i) => doc.text(l, MARGIN_X + 56, 86 + i * 13));

  // Checklist groups
  let y = 170;
  for (const group of checklist.groups) {
    doc.setFont("PlexMono", "medium");
    doc.setFontSize(10.5);
    setColor("setTextColor", "stamp");
    doc.text(group.title.toUpperCase(), MARGIN_X, y);
    y += 22;

    doc.setFont("PublicSans", "normal");
    doc.setFontSize(11.5);
    const boxSize = 13;
    const textX = MARGIN_X + boxSize + 14;
    const textW = CONTENT_W - boxSize - 14;
    for (const item of group.items) {
      const lines = doc.splitTextToSize(item, textW);
      setColor("setDrawColor", "ink");
      doc.setLineWidth(1.2);
      doc.rect(MARGIN_X, y - 11, boxSize, boxSize, "S");
      setColor("setTextColor", "ink");
      lines.forEach((l, i) => doc.text(l, textX, y + i * 16));
      y += Math.max(24, 16 * lines.length + 8);
    }
    y += 12;
  }

  // Footer
  const footerY = 700;
  setColor("setDrawColor", "line");
  doc.setLineWidth(0.75);
  doc.line(MARGIN_X, footerY, PAGE_W - MARGIN_X, footerY);
  doc.addImage(tabSealB64, "PNG", MARGIN_X, footerY + 14, 26, 26);
  doc.setFont("Archivo", "bold");
  doc.setFontSize(8.5);
  setColor("setTextColor", "inkSoft");
  doc.text("getwholeclaim.com", MARGIN_X + 36, footerY + 26);
  doc.setFont("PublicSans", "normal");
  doc.setFontSize(7.5);
  setColor("setTextColor", "inkSoft");
  const disclaimerLines = doc.splitTextToSize(DISCLAIMER, CONTENT_W - 36);
  disclaimerLines.forEach((l, i) => doc.text(l, MARGIN_X + 36, footerY + 38 + i * 10));
  doc.text(
    "© 2026 Benjamin Hammonds. All rights reserved.",
    MARGIN_X + 36,
    footerY + 38 + disclaimerLines.length * 10 + 10,
  );

  const outPath = path.join(OUT_DIR, checklist.pdfFile);
  const buf = Buffer.from(doc.output("arraybuffer"));
  fs.writeFileSync(outPath, buf);
  console.log("wrote", buf.length, "bytes ->", outPath);
}
