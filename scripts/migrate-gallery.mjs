/**
 * Einmalige Migration der Galerie.
 *
 * Vorher: `src/pages/galerie.astro` las alle Bilder per `import.meta.glob` und
 * leitete Bereich, Reihenfolge und Bildbeschreibung aus dem DATEINAMEN ab.
 * Nachher: vier Markdown-Dateien unter `src/content/gallery/`, die das
 * ausdrücklich festhalten – damit über den Redaktionsbereich pflegbar.
 *
 * Dieses Skript bildet die alte Ableitung EXAKT nach, damit die gebaute Seite
 * unverändert bleibt. Es ist bewusst einmalig: nach der Migration werden die
 * Dateien redaktionell gepflegt, ein erneuter Lauf würde diese Pflege
 * überschreiben. Deshalb bricht es ab, wenn die Zieldateien schon Bilder
 * enthalten (Aufruf mit `--force` erzwingt das Überschreiben).
 *
 * Aufruf:  node scripts/migrate-gallery.mjs [--force]
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
const bildOrdner = join(wurzel, 'src/assets/gallery');
const zielOrdner = join(wurzel, 'src/content/gallery');
const force = process.argv.includes('--force');

// --- Logik aus dem bisherigen galerie.astro, unverändert übernommen ---------

const cleanCaption = (fileName) => {
  const original = fileName.replace(/\.(jpe?g)$/i, '').replace(/ \(\d+\)$/, '');
  const shortened = original
    .replace(/^Kindergarde\s+/i, '')
    .replace(/^Jugendgarde\s+/i, '')
    .replace(/^Große Garde\s+/i, '')
    .replace(/^Spalier Große Garde\s*/i, 'Spalier ')
    .replace(/^Spalier Jugendgarde\s*/i, 'Spalier ');
  return shortened || original;
};

/** Bild mit fest hinterlegtem 16:9-Zuschnitt (früher per Dateinamen-Vergleich). */
const CROP_169 = 'Volksfestumzug Jugendgarde.jpeg';

const bereiche = [
  {
    datei: 'kindergarde.md',
    title: 'Kindergarde',
    order: 1,
    filter: (n) => n.startsWith('Kindergarde'),
  },
  {
    datei: 'jugendgarde.md',
    title: 'Jugendgarde',
    order: 2,
    filter: (n) =>
      n.includes('Jugendgarde') &&
      !n.includes('und Große Garde') &&
      !n.startsWith('Kindergarde'),
  },
  {
    datei: 'grosse-garde.md',
    title: 'Große Garde',
    order: 3,
    filter: (n) =>
      (n.startsWith('Große Garde') || n.startsWith('Spalier Große Garde')) &&
      !n.includes('Jugendgarde'),
  },
  {
    datei: 'vereinsleben.md',
    title: 'Vereinsleben & unterwegs',
    order: 4,
    filter: (n) =>
      !n.startsWith('Kindergarde') &&
      !(n.includes('Jugendgarde') && !n.includes('und Große Garde')) &&
      !((n.startsWith('Große Garde') || n.startsWith('Spalier Große Garde')) && !n.includes('Jugendgarde')),
  },
];

// --- Migration --------------------------------------------------------------

const dateien = readdirSync(bildOrdner)
  .filter((n) => /\.(jpe?g)$/i.test(n))
  // Exakt die bisherige Sortierung der Galerie-Seite.
  .sort((a, b) => a.localeCompare(b, 'de'));

if (dateien.length === 0) {
  console.error(`Keine Bilder in ${bildOrdner} gefunden – Abbruch.`);
  process.exit(1);
}

/** YAML-sicher in doppelte Anführungszeichen setzen. */
const yamlString = (wert) => `"${String(wert).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

let gesamt = 0;

for (const bereich of bereiche) {
  const ziel = join(zielOrdner, bereich.datei);

  if (!force && existsSync(ziel) && /^\s+- image:/m.test(readFileSync(ziel, 'utf8'))) {
    console.error(
      `${bereich.datei} enthält bereits Bilder. Die Migration ist offenbar schon gelaufen.\n` +
        'Erneutes Ausführen würde redaktionelle Änderungen überschreiben. Abbruch (--force erzwingt).',
    );
    process.exit(1);
  }

  const bilder = dateien.filter(bereich.filter);
  gesamt += bilder.length;

  const zeilen = bilder.flatMap((datei) => {
    const alt = `${cleanCaption(datei)} – Europa-Show-Tanzgarde`;
    const eintrag = [
      `  - image: ${yamlString(`../../assets/gallery/${datei}`)}`,
      `    alt: ${yamlString(alt)}`,
    ];
    if (datei === CROP_169) eintrag.push('    crop169: true');
    return eintrag;
  });

  const inhalt = [
    '---',
    `title: ${yamlString(bereich.title)}`,
    `order: ${bereich.order}`,
    'images:',
    ...zeilen,
    '---',
    '',
  ].join('\n');

  writeFileSync(ziel, inhalt, 'utf8');
  console.log(`${bereich.datei.padEnd(18)} ${String(bilder.length).padStart(3)} Bilder`);
}

console.log(`\n${gesamt} von ${dateien.length} Bildern zugeordnet.`);
if (gesamt !== dateien.length) {
  console.error('WARNUNG: Anzahl weicht ab – die Bereichsfilter decken nicht alle Bilder ab!');
  process.exit(1);
}
