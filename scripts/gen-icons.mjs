import sharp from "sharp";
import { mkdirSync } from "fs";
import path from "path";

const outDir = path.resolve("public/icons");
mkdirSync(outDir, { recursive: true });

const mark = `
  <g transform="scale(2.56)">
    <path d="M46 80 v-16 a8 8 0 0 1 8 -8 h30 l14 14 h48 a8 8 0 0 1 8 8 v52 a10 10 0 0 1 -10 10 h-88 a10 10 0 0 1 -10 -10 z"
          fill="none" stroke="#F2F1EC" stroke-width="9" stroke-linejoin="round"/>
    <circle cx="100" cy="106" r="17" fill="#F2F1EC"/>
  </g>
`;

const anySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="116" fill="#1E4B3C"/>
  ${mark}
</svg>`;

// Maskable: full-bleed square background (OS applies its own mask/rounding),
// same centered mark — no rounded-rect baked in so nothing gets clipped oddly.
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1E4B3C"/>
  ${mark}
</svg>`;

const jobs = [
  { svg: anySvg, size: 192, file: "icon-192.png" },
  { svg: anySvg, size: 512, file: "icon-512.png" },
  { svg: anySvg, size: 180, file: "apple-touch-icon.png" },
  { svg: maskableSvg, size: 512, file: "icon-512-maskable.png" },
];

for (const job of jobs) {
  await sharp(Buffer.from(job.svg), { density: 384 })
    .resize(job.size, job.size)
    .png()
    .toFile(path.join(outDir, job.file));
  console.log("wrote", job.file);
}
