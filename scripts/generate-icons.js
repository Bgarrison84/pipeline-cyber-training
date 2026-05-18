// scripts/generate-icons.js
// Phase 11 Plan 01 — One-time dev-time script to generate PWA icon PNGs.
// Run: node scripts/generate-icons.js
// Output: public/pwa-192x192.png, public/pwa-512x512.png, public/apple-touch-icon.png
//
// Design: Dark navy (#111827) background, orange (#f97316) shield polygon.
// Shapes-only — NO ctx.fillText. pureimage requires registerFont() before
// text rendering; omitting it causes silent failure or garbled output.
// A shield polygon conveys "security" without needing text glyphs.

import * as PImage from 'pureimage';
import * as fs from 'fs';

/**
 * Draw one icon at the given pixel size and write it to outPath.
 * @param {number} size - Width and height in pixels
 * @param {string} outPath - Output file path (relative to project root)
 */
async function generateIcon(size, outPath) {
  const img = PImage.make(size, size);
  const ctx = img.getContext('2d');

  // ── Background ────────────────────────────────────────────────────────────
  // Near-black navy (--color-bg-base from D-14) fills the entire canvas.
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, size, size);

  // ── Shield polygon ─────────────────────────────────────────────────────────
  // Orange accent (#f97316 — matches --color-accent) drawn as a 5-point polygon:
  //   top-left corner → top-right corner → bottom-right shoulder →
  //   bottom center point → bottom-left shoulder → close
  // Scaled proportionally so the shape looks balanced at all three icon sizes.
  const cx = size / 2;
  const cy = size / 2;
  const s  = size * 0.58;   // shield "radius" — ~58% of canvas width

  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  // Top-left corner (wide top edge)
  ctx.moveTo(cx - s / 2, cy - s / 2);
  // Top-right corner
  ctx.lineTo(cx + s / 2, cy - s / 2);
  // Bottom-right shoulder (inward bevel)
  ctx.lineTo(cx + s / 2, cy + s / 5);
  // Bottom center point (shield tip)
  ctx.lineTo(cx,         cy + s / 2);
  // Bottom-left shoulder (inward bevel)
  ctx.lineTo(cx - s / 2, cy + s / 5);
  ctx.closePath();
  ctx.fill();

  // ── Inner highlight ────────────────────────────────────────────────────────
  // A smaller concentric shield in the background color creates a subtle
  // "cut-out" effect that distinguishes this icon from a plain orange square.
  const inner = s * 0.52;
  const iy    = cy - (s / 2) + (s * 0.18);  // shift inner shape slightly downward

  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.moveTo(cx - inner / 2, iy);
  ctx.lineTo(cx + inner / 2, iy);
  ctx.lineTo(cx + inner / 2, iy + inner * 0.55);
  ctx.lineTo(cx,             iy + inner * 0.85);
  ctx.lineTo(cx - inner / 2, iy + inner * 0.55);
  ctx.closePath();
  ctx.fill();

  // ── Encode & write ─────────────────────────────────────────────────────────
  await PImage.encodePNGToStream(img, fs.createWriteStream(outPath));
  console.log(`  Generated ${outPath} (${size}x${size})`);
}

// Run from project root: node scripts/generate-icons.js
console.log('Generating PWA icons...');
await generateIcon(192, 'public/pwa-192x192.png');
await generateIcon(512, 'public/pwa-512x512.png');
await generateIcon(180, 'public/apple-touch-icon.png');
console.log('Done. Commit the three PNG files in public/.');
