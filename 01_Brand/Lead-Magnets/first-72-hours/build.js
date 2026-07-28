const { jsPDF } = require("jspdf");
const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------
// Brand tokens, pulled directly from src/app/globals.css's hp-* set
// (Paper/Pine/Stamp), not re-invented.
// ---------------------------------------------------------------------
const COLOR = {
  paper: [242, 240, 235], // #f2f0eb
  paperDeep: [234, 231, 223], // #eae7df
  ink: [20, 32, 26], // #14201a
  inkSoft: [67, 81, 74], // #43514a
  pine: [30, 70, 54], // #1e4636
  pineDeep: [21, 53, 40], // #153528
  sage: [227, 233, 226], // #e3e9e2
  line: [216, 211, 198], // #d8d3c6
  stamp: [138, 47, 35], // #8a2f23
};

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_X = 64;
const CONTENT_W = PAGE_W - MARGIN_X * 2;
const TOP_Y = 96; // below running header
const BOTTOM_Y = 728; // above running footer

const TITLE = "THE FIRST 72 HOURS";

function loadFont(doc, file, name, style) {
  const ttf = fs.readFileSync(path.join(__dirname, "fonts", file));
  doc.addFileToVFS(file, ttf.toString("base64"));
  doc.addFont(file, name, style);
}

const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
loadFont(doc, "bricolage-800.ttf", "Bricolage", "extrabold");
loadFont(doc, "bricolage-700.ttf", "Bricolage", "bold");
loadFont(doc, "archivo-700.ttf", "Archivo", "bold");
loadFont(doc, "pubsans-400.ttf", "PublicSans", "normal");
loadFont(doc, "pubsans-600.ttf", "PublicSans", "semibold");
loadFont(doc, "plexmono-500.ttf", "PlexMono", "medium");

// Real Tab Seal mark, not a copy -- public/icons/icon-512-maskable.png is
// the same file the PWA manifest points at (src/app/manifest.ts).
const tabSealB64 = fs
  .readFileSync(path.join(__dirname, "..", "..", "..", "public", "icons", "icon-512-maskable.png"))
  .toString("base64");

let pageNum = 0; // incremented on every addPage/first page
let sectionTag = ""; // right-side header tag, e.g. "1 / 8"
let bg = "paper";
let y = TOP_Y;

function setColor(setter, key) {
  const c = COLOR[key];
  doc[setter](c[0], c[1], c[2]);
}

function fillPageBg(key) {
  setColor("setFillColor", key);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
}

function drawHeader() {
  if (bg === "cover" || bg === "cta") return; // full-bleed pine pages have their own composition
  setColor("setDrawColor", "line");
  doc.setLineWidth(0.75);
  doc.line(MARGIN_X, 64, PAGE_W - MARGIN_X, 64);
  doc.setFont("Archivo", "bold");
  doc.setFontSize(8.5);
  setColor("setTextColor", "inkSoft");
  doc.text(TITLE, MARGIN_X, 50);
  if (sectionTag) {
    doc.setFont("PlexMono", "medium");
    doc.text(sectionTag, PAGE_W - MARGIN_X, 50, { align: "right" });
  }
}

function drawFooter() {
  if (bg === "cover" || bg === "cta") return;
  setColor("setDrawColor", "line");
  doc.setLineWidth(0.75);
  doc.line(MARGIN_X, 744, PAGE_W - MARGIN_X, 744);
  doc.setFont("Archivo", "bold");
  doc.setFontSize(8);
  setColor("setTextColor", "inkSoft");
  doc.text("WHOLECLAIM · THE FIRST 72 HOURS", MARGIN_X, 760);
  doc.setFont("PlexMono", "medium");
  doc.text(String(pageNum), PAGE_W - MARGIN_X, 760, { align: "right" });
}

function newPage(bgKey) {
  if (pageNum > 0) doc.addPage();
  pageNum += 1;
  bg = bgKey;
  const fillKey = bgKey === "cta" || bgKey === "cover" ? "pine" : bgKey === "checklist" ? "sage" : bgKey;
  fillPageBg(fillKey);
  drawHeader();
  drawFooter();
  y = TOP_Y;
}

function ensureSpace(needed) {
  if (y + needed > BOTTOM_Y) {
    newPage(bg === "checklist" ? "checklist" : "paper");
  }
}

// ---- text primitives -------------------------------------------------

function sectionEyebrow(numLabel, title) {
  ensureSpace(64);
  doc.setFont("PlexMono", "medium");
  doc.setFontSize(13);
  setColor("setTextColor", "stamp");
  doc.text(numLabel, MARGIN_X, y);
  y += 26;
  doc.setFont("Bricolage", "bold");
  doc.setFontSize(21);
  setColor("setTextColor", "pine");
  const lines = doc.splitTextToSize(title, CONTENT_W);
  for (const line of lines) {
    ensureSpace(26);
    doc.text(line, MARGIN_X, y);
    y += 26;
  }
  y += 8;
}

function body(text, opts = {}) {
  doc.setFont("PublicSans", opts.emphasis ? "semibold" : "normal");
  doc.setFontSize(10.5);
  setColor("setTextColor", opts.soft ? "inkSoft" : "ink");
  const lines = doc.splitTextToSize(text, opts.width || CONTENT_W);
  for (const line of lines) {
    ensureSpace(16);
    doc.text(line, MARGIN_X + (opts.indent || 0), y);
    y += 16;
  }
  y += 6;
}

function label(text) {
  ensureSpace(20);
  doc.setFont("PublicSans", "semibold");
  doc.setFontSize(10.5);
  setColor("setTextColor", "pine");
  doc.text(text, MARGIN_X, y);
  y += 18;
}

function bulletList(items) {
  const bulletX = MARGIN_X + 4;
  const textX = MARGIN_X + 16;
  const textW = CONTENT_W - 16;
  doc.setFont("PublicSans", "normal");
  doc.setFontSize(10.5);
  for (const item of items) {
    const lines = doc.splitTextToSize(item, textW);
    ensureSpace(16 * lines.length + 2);
    setColor("setFillColor", "stamp");
    doc.rect(bulletX, y - 8, 5, 5, "F");
    setColor("setTextColor", "ink");
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], textX, y + i * 16);
    }
    y += 16 * lines.length + 4;
  }
  y += 6;
}

function checkGlyph(x, yTop) {
  setColor("setDrawColor", "pine");
  doc.setLineWidth(1.4);
  doc.line(x, yTop + 4, x + 3, yTop + 7);
  doc.line(x + 3, yTop + 7, x + 9, yTop - 2);
}

function checkmarkList(items) {
  const textX = MARGIN_X + 18;
  const textW = CONTENT_W - 18;
  doc.setFont("PublicSans", "semibold");
  doc.setFontSize(10.5);
  for (const item of items) {
    const lines = doc.splitTextToSize(item, textW);
    ensureSpace(16 * lines.length + 2);
    checkGlyph(MARGIN_X + 2, y - 8);
    setColor("setTextColor", "pine");
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], textX, y + i * 16);
    }
    y += 16 * lines.length + 4;
  }
  y += 6;
}

function exampleBlock(fields) {
  const padX = 16;
  const padY = 14;
  const labelW = 96;
  doc.setFont("PlexMono", "medium");
  doc.setFontSize(9);
  let bodyLines = [];
  for (const [k, v] of fields) {
    const lines = doc.splitTextToSize(v, CONTENT_W - padX * 2 - labelW);
    bodyLines.push({ k, lines });
  }
  let h = padY * 2;
  for (const f of bodyLines) h += Math.max(1, f.lines.length) * 15;
  ensureSpace(h + 8);
  setColor("setFillColor", "sage");
  doc.roundedRect(MARGIN_X, y - 4, CONTENT_W, h, 3, 3, "F");
  setColor("setDrawColor", "stamp");
  doc.setLineWidth(2);
  doc.line(MARGIN_X, y - 4, MARGIN_X, y - 4 + h);
  let by = y - 4 + padY;
  for (const f of bodyLines) {
    doc.setFont("PlexMono", "medium");
    doc.setFontSize(9);
    setColor("setTextColor", "stamp");
    doc.text(f.k.toUpperCase(), MARGIN_X + padX, by + 8);
    doc.setFont("PublicSans", "normal");
    doc.setFontSize(10.5);
    setColor("setTextColor", "ink");
    for (let i = 0; i < f.lines.length; i++) {
      doc.text(f.lines[i], MARGIN_X + padX + labelW, by + 8 + i * 15);
    }
    by += Math.max(1, f.lines.length) * 15;
  }
  y = y - 4 + h + 16;
}

function checklistGroup(title, items) {
  ensureSpace(30);
  doc.setFont("PlexMono", "medium");
  doc.setFontSize(10);
  setColor("setTextColor", "stamp");
  doc.text(title.toUpperCase(), MARGIN_X, y);
  y += 20;
  const boxSize = 12;
  const textX = MARGIN_X + boxSize + 12;
  const textW = CONTENT_W - boxSize - 12;
  doc.setFont("PublicSans", "normal");
  doc.setFontSize(11);
  for (const item of items) {
    const lines = doc.splitTextToSize(item, textW);
    const rowH = Math.max(22, 16 * lines.length + 6);
    ensureSpace(rowH);
    setColor("setDrawColor", "ink");
    doc.setLineWidth(1.1);
    doc.rect(MARGIN_X, y - 10, boxSize, boxSize, "S");
    setColor("setTextColor", "ink");
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], textX, y + i * 15);
    }
    y += rowH;
  }
  y += 10;
}

module.exports = {
  doc,
  COLOR,
  PAGE_W,
  PAGE_H,
  MARGIN_X,
  CONTENT_W,
  TOP_Y,
  BOTTOM_Y,
  TITLE,
  tabSealB64,
  setColor,
  fillPageBg,
  newPage,
  ensureSpace,
  sectionEyebrow,
  body,
  label,
  bulletList,
  checkmarkList,
  exampleBlock,
  checklistGroup,
  get y() {
    return y;
  },
  set y(v) {
    y = v;
  },
  get pageNum() {
    return pageNum;
  },
  set sectionTag(v) {
    sectionTag = v;
  },
};
