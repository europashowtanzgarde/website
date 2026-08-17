/**
 * Markdown-Dateien mit YAML-Kopf lesen und schreiben.
 *
 * Bewusst mit `js-yaml` statt eigenem Parser: Der Bestand nutzt mehrzeilige
 * Blockskalare (`>-`), Umlaute und Sonderzeichen. Das von Hand zu zerlegen ist
 * eine verlässliche Fehlerquelle.
 */
import { load, dump } from 'js-yaml';

export interface MarkdownDatei {
  daten: Record<string, unknown>;
  /** Fließtext unterhalb des Kopfes. */
  text: string;
}

const TRENNER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function leseMarkdown(inhalt: string): MarkdownDatei {
  const treffer = TRENNER.exec(inhalt);
  if (!treffer) return { daten: {}, text: inhalt.trim() };

  let daten: Record<string, unknown> = {};
  try {
    const geparst = load(treffer[1]);
    if (geparst && typeof geparst === 'object') daten = geparst as Record<string, unknown>;
  } catch {
    // Kaputter Kopf: lieber leer weitermachen als den Editor blockieren.
    // Die anschließende Prüfung meldet die fehlenden Pflichtfelder verständlich.
    daten = {};
  }
  return { daten, text: inhalt.slice(treffer[0].length).trim() };
}

export function schreibeMarkdown({ daten, text }: MarkdownDatei): string {
  const kopf = dump(daten, { noRefs: true }).trimEnd();

  const rumpf = text.trim();
  return rumpf ? `---\n${kopf}\n---\n\n${rumpf}\n` : `---\n${kopf}\n---\n`;
}

/** JSON-Datei einlesen; wirft nicht, sondern liefert `null` bei Unsinn. */
export function leseJson(inhalt: string): Record<string, unknown> | null {
  try {
    const daten = JSON.parse(inhalt);
    return daten && typeof daten === 'object' ? daten : null;
  } catch {
    return null;
  }
}

/**
 * JSON schreiben – zweizeilige Einrückung und abschließender Zeilenumbruch,
 * damit die Dateien zum Bestand passen und die Versionsgeschichte lesbar bleibt.
 */
export function schreibeJson(daten: unknown): string {
  return `${JSON.stringify(daten, null, 2)}\n`;
}
