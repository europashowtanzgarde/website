/**
 * Logo-Aufbereitung für die Europa-Show-Tanzgarde.
 *
 * Die Quelle (input/Logo_Europashowtanzgarde.jpg) zeigt den royalblauen
 * Schriftzug „EUROPA / TANZGARDE" und das rote „Show" auf einem
 * VOLLFLÄCHIG GRAUEN, nicht transparenten Hintergrund. Für den hellen,
 * professionellen Auftritt brauchen wir das Logo sauber freigestellt
 * (transparent), damit es randlos auf Weiß sitzt.
 *
 * Verfahren: Der Hintergrund ist ein gleichmäßiges Grau. Wir leiten die
 * Transparenz aus der FARBDISTANZ zum gemessenen Hintergrundgrau ab
 * (euklidisch im RGB). Das trennt sowohl das dunkle Navy als auch das
 * gesättigte Rot sauber vom Grau – zuverlässiger als ein reiner
 * Sättigungs-Key, weil das Blau nur mäßig gesättigt ist. Weiche Rampe
 * (LO→HI) erhält die Anti-Aliasing-Kanten.
 *
 * Ausführen mit:  npm run logo
 */

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const INPUT = resolve(root, 'input/Logo_Europashowtanzgarde.jpg');
const ASSETS = resolve(root, 'src/assets');
const PUBLIC = resolve(root, 'public');

// Schwellwerte für den Distanz-Key (0–441 RGB-Distanz zum Hintergrundgrau).
// LO: darunter gilt Pixel als Hintergrund (transparent). HI: darüber voll
// deckend. Dazwischen weiche Rampe für saubere Kanten. Werte auf Weiß
// visuell abgestimmt: kräftige Buchstaben, kein grauer Schleier.
const LO = 50;
const HI = 120;

async function keyOutBackground() {
  const src = sharp(INPUT).ensureAlpha();
  const { data, info } = await src.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Hintergrundgrau aus den vier Ecken mitteln (robust gegen Rauschen).
  const corner = (x, y) => {
    const i = (y * width + x) * channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const pts = [
    corner(1, 1),
    corner(width - 2, 1),
    corner(1, height - 2),
    corner(width - 2, height - 2),
  ];
  const bg = [0, 1, 2].map(
    (c) => Math.round(pts.reduce((s, p) => s + p[c], 0) / pts.length),
  );

  for (let i = 0; i < data.length; i += channels) {
    const dr = data[i] - bg[0];
    const dg = data[i + 1] - bg[1];
    const db = data[i + 2] - bg[2];
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);

    let alpha;
    if (dist <= LO) alpha = 0;
    else if (dist >= HI) alpha = 255;
    else alpha = Math.round(((dist - LO) / (HI - LO)) * 255);

    data[i + 3] = alpha;
  }

  // Zurück zu PNG, dann transparente Ränder abschneiden.
  return sharp(data, { raw: { width, height, channels } })
    .png()
    .trim({ threshold: 12 });
}

/** Deckende Variante des freigestellten Logos auf Bühnenblau, zentriert. */
async function onNightBackground(logoBuffer, outWidth, outHeight, padding = 0.12) {
  const maxW = Math.round(outWidth * (1 - padding * 2));
  const maxH = Math.round(outHeight * (1 - padding * 2));

  const scaled = await sharp(logoBuffer)
    .resize(maxW, maxH, { fit: 'inside', withoutEnlargement: true })
    .toBuffer();

  const bg = Buffer.from(
    `<svg width="${outWidth}" height="${outHeight}" xmlns="http://www.w3.org/2000/svg">
       <defs>
         <radialGradient id="g" cx="50%" cy="42%" r="75%">
           <stop offset="0%" stop-color="#1c2247"/>
           <stop offset="100%" stop-color="#0c1024"/>
         </radialGradient>
       </defs>
       <rect width="100%" height="100%" fill="url(#g)"/>
     </svg>`,
  );

  return sharp(bg)
    .composite([{ input: scaled, gravity: 'center' }])
    .png();
}

async function main() {
  await mkdir(ASSETS, { recursive: true });
  await mkdir(PUBLIC, { recursive: true });

  // 1) Freigestelltes Logo (transparent) – Hauptvariante.
  const keyed = await keyOutBackground();
  const keyedBuffer = await keyed.toBuffer();
  const meta = await sharp(keyedBuffer).metadata();
  console.log(`Freigestellt & getrimmt: ${meta.width}×${meta.height}px`);

  // Auf sinnvolle Breite begrenzen (Retina-tauglich), transparent speichern.
  const logoWide = await sharp(keyedBuffer)
    .resize({ width: Math.min(meta.width ?? 1200, 1400), withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await sharp(logoWide).toFile(resolve(ASSETS, 'logo.png'));
  console.log('→ src/assets/logo.png');

  // 2) Quadratische Kachel (Logo auf Bühnenblau) für Icons/Teiler.
  const square = await onNightBackground(keyedBuffer, 640, 640, 0.14);
  await square.toFile(resolve(ASSETS, 'logo-square.png'));
  console.log('→ src/assets/logo-square.png');

  // 3) Apple-Touch-Icon (180×180, deckend).
  const touch = await onNightBackground(keyedBuffer, 180, 180, 0.1);
  await touch.png().toFile(resolve(PUBLIC, 'apple-touch-icon.png'));
  console.log('→ public/apple-touch-icon.png');

  // 4) Open-Graph-Standardbild (1200×630).
  const og = await onNightBackground(keyedBuffer, 1200, 630, 0.16);
  await og.png().toFile(resolve(PUBLIC, 'og-default.png'));
  console.log('→ public/og-default.png');

  console.log('\nFertig. Ergebnis bitte visuell auf Grau-Ränder prüfen.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
