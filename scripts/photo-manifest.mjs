#!/usr/bin/env node
/**
 * Lists the photos in public/experiences/<slug>/photos and prints ready-to-paste
 * `assets.images` entries with real width/height (prevents layout shift).
 *
 *   npm run photos -- isa
 *
 * Local only: nothing is uploaded anywhere. Alt text must be written by you.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: npm run photos -- <experience-slug>');
  process.exit(1);
}

const dir = resolve(import.meta.dirname, '..', 'public', 'experiences', slug, 'photos');

/** Reads pixel dimensions from PNG, JPEG, WebP, GIF and SVG headers. */
export function imageSize(buf, ext) {
  if (ext === '.png' && buf.toString('ascii', 1, 4) === 'PNG') {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (ext === '.gif') return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
  if (ext === '.jpg' || ext === '.jpeg') {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) return null;
      const marker = buf[i + 1];
      const length = buf.readUInt16BE(i + 2);
      // SOF0..SOF15 except DHT(C4), JPG(C8), DAC(CC)
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + length;
    }
    return null;
  }
  if (ext === '.webp' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16);
    if (chunk === 'VP8X') {
      return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    }
    if (chunk === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
    if (chunk === 'VP8 ') {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
  }
  if (ext === '.svg') {
    const text = buf.toString('utf8', 0, 2000);
    const w = /\bwidth="(\d+(?:\.\d+)?)"/.exec(text);
    const h = /\bheight="(\d+(?:\.\d+)?)"/.exec(text);
    if (w && h) return { width: Math.round(+w[1]), height: Math.round(+h[1]) };
    const vb = /viewBox="[\d.-]+ [\d.-]+ ([\d.]+) ([\d.]+)"/.exec(text);
    if (vb) return { width: Math.round(+vb[1]), height: Math.round(+vb[2]) };
  }
  return null;
}

let files;
try {
  files = readdirSync(dir)
    .filter((f) => /\.(png|jpe?g|webp|avif|gif|svg)$/i.test(f))
    .sort();
} catch {
  console.error(`No folder ${dir}. Create it and add photos first.`);
  process.exit(1);
}

const lines = [];
const heavy = [];
for (const file of files) {
  const ext = extname(file).toLowerCase();
  const path = resolve(dir, file);
  const size = imageSize(readFileSync(path), ext);
  const kb = Math.round(statSync(path).size / 1024);
  if (kb > 400 && ext !== '.svg') heavy.push(`${file} (${kb} KB)`);
  const id = file
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const dims = size ? `\n  width: ${size.width},\n  height: ${size.height},` : '';
  lines.push(
    `'${id}': {\n  src: 'photos/${file}',\n  alt: 'TODO: describe what is in the photo',${dims}\n},`,
  );
}

console.log(
  `// ${files.length} photo(s) in public/experiences/${slug}/photos — paste into assets.images:\n`,
);
console.log(lines.join('\n'));
if (heavy.length) {
  console.warn(
    `\n// Consider compressing (≤ 2000px wide, WebP/AVIF, ~200–400 KB): ${heavy.join(', ')}`,
  );
}
