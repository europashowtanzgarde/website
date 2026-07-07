/**
 * Logo-Aufbereitung für die Europa-Show-Tanzgarde.
 *
 * Das Original (input/Logo_Europashowtanzgarde.png) zeigt den royalblauen
 * Leucht-Schriftzug und das rote „Show" auf einem VOLLFLÄCHIG GRAUEN,
 * nicht transparenten Hintergrund. Für eine Bühnen-Optik brauchen wir das
 * Logo freigestellt (transparent), damit es auf dunklem Grund „leuchtet".
 *
 * Trick: Der Hintergrund ist UNBUNT (Grau, R≈G≈B), Schrift und Glow sind
 * stark GESÄTTIGT (Blau/Rot). Wir leiten die Transparenz also aus der
 * „Buntheit" (Chroma = max(R,G,B) − min(R,G,B)) ab – mit weicher Rampe,
 * damit der Glow-Verlauf erhalten bleibt.
 *
 * Ausführen mit:  npm run logo
 */

import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const INPUT = resolve(root, 'input/Logo_Europashowtanzgarde.png');
const ASSETS = resolve(root, 'src/assets');
const PUBLIC = resolve(root, 'public');

// Schwellwerte für den Sättigungs-Key (0–255 Chroma).
// Bewusst AGGRESSIV gewählt: Wir behalten nur die stark gesättigten
// Buchstaben-Kerne und schneiden den grau-verunreinigten Original-Glow weg
// (sonst milchig-grauer Schleier auf dunklem Grund). Der eigentliche
// Neon-Glow wird sauber und farbrein per CSS (`filter: drop-shadow`) ergänzt.
const LO = 100;
const HI = 128;

async function keyOutBackground() {
  const src = sharp(INPUT).ensureAlpha();
  const { data, info } = await src.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);

    let alpha;
    if (chroma <= LO) alpha = 0;
    else if (chroma >= HI) alpha = 255;
    else alpha = Math.round(((chroma - LO) / (HI - LO)) * 255);

    data[i + 3] = alpha;
  }

  // Zurück zu PNG, dann transparente Ränder abschneiden.
  return sharp(data, { raw: { width, height, channels } })
    .png()
    .trim({ threshold: 10 });
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
