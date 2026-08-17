/**
 * Einmalige Migration der Vereinschronik.
 *
 * Vorher: 30 Jahreseinträge als Konstante `timeline` in `src/pages/verein.astro`,
 * dazu eine Liste von Titeln, deren Überschrift nicht umbrechen soll.
 * Nachher: je ein Markdown-Eintrag unter `src/content/chronik/` – damit über
 * den Redaktionsbereich pflegbar (z. B. der Eintrag zum Jubiläum 2026).
 *
 * Die Daten werden direkt aus der Astro-Datei ausgelesen, nicht abgetippt.
 *
 * Aufruf:  node scripts/migrate-chronik.mjs [--force]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
const quelle = join(wurzel, 'src/pages/verein.astro');
const zielOrdner = join(wurzel, 'src/content/chronik');
const force = process.argv.includes('--force');

const astro = readFileSync(quelle, 'utf8');

/** Klammerpaar ab einer Startposition korrekt abgrenzen (Strings beachten). */
function arrayLiteral(text, startIndex) {
  let tiefe = 0;
  let inString = null;
  for (let i = startIndex; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === '\\') i++;
      else if (c === inString) inString = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') inString = c;
    else if (c === '[') tiefe++;
    else if (c === ']') {
      tiefe--;
      if (tiefe === 0) return text.slice(startIndex, i + 1);
    }
  }
  throw new Error('Array-Literal nicht gefunden.');
}

// 1) Die Chronik-Einträge
const timelineStart = astro.indexOf('[', astro.indexOf('const timeline'));
const timeline = new Function(`return ${arrayLiteral(astro, timelineStart)};`)();

// 2) Die Titel, deren Überschrift nicht umbrechen soll
const nowrapStart = astro.indexOf('[', astro.indexOf("'timeline__title--nowrap':"));
const nowrapTitel = new Function(`return ${arrayLiteral(astro, nowrapStart)};`)();

if (!Array.isArray(timeline) || timeline.length === 0) {
  console.error('Chronik-Array konnte nicht gelesen werden – Abbruch.');
  process.exit(1);
}

mkdirSync(zielOrdner, { recursive: true });

if (!force && existsSync(zielOrdner) && readdirSync(zielOrdner).some((n) => n.endsWith('.md'))) {
  console.error(
    'Die Chronik wurde bereits migriert. Ein erneuter Lauf würde redaktionelle ' +
      'Änderungen überschreiben. Abbruch (--force erzwingt).',
  );
  process.exit(1);
}

const yamlString = (wert) => `"${String(wert).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

const jahre = new Set();
let mitNowrap = 0;

for (const eintrag of timeline) {
  // Mehrere Einträge im selben Jahr bekommen einen Zähler angehängt.
  let name = eintrag.year;
  let n = 2;
  while (jahre.has(name)) name = `${eintrag.year}-${n++}`;
  jahre.add(name);

  const nowrap = nowrapTitel.includes(eintrag.title);
  if (nowrap) mitNowrap++;

  const inhalt = [
    '---',
    `year: ${yamlString(eintrag.year)}`,
    `title: ${yamlString(eintrag.title)}`,
    `text: ${yamlString(eintrag.text)}`,
    ...(nowrap ? ['nowrap: true'] : []),
    '---',
    '',
  ].join('\n');

  writeFileSync(join(zielOrdner, `${name}.md`), inhalt, 'utf8');
}

console.log(`${timeline.length} Chronik-Einträge geschrieben (${mitNowrap} davon ohne Umbruch).`);

// Die Titelliste enthielt auch Einträge, die im Chronik-Array gar nicht
// vorkommen – ein Hinweis darauf, dass sie beim Kürzen der Chronik nicht
// mitgepflegt wurde. Sie verschwinden mit der Migration ersatzlos.
const verwaist = nowrapTitel.filter((t) => !timeline.some((e) => e.title === t));
if (verwaist.length > 0) {
  console.log(`\nHinweis: ${verwaist.length} Titel der Umbruch-Liste gehören zu keinem Eintrag`);
  console.log('(sie hatten schon vorher keine Wirkung und entfallen):');
  for (const t of verwaist) console.log(`  - ${t}`);
}
