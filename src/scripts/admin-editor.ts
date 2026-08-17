/**
 * Kleiner Formatier-Editor für Beitragstexte.
 *
 * Gespeichert wird weiterhin Markdown – die Beiträge bleiben damit in GitHub
 * lesbar und lassen sich auch dort bearbeiten. Der Editor wandelt beim Laden
 * nach HTML und beim Speichern zurück.
 *
 * Bewusst auf wenige Formate begrenzt (fett, kursiv, Listen, zwei
 * Überschriftenebenen, Link). Alles andere wird beim Einfügen verworfen –
 * sonst landet Fremd-Markup aus Word oder von Webseiten im Repository.
 * Zusätzlich filtert der Seitenaufbau noch einmal (rehype-sanitize), damit die
 * Sperre auch bei direkter Bearbeitung über GitHub greift.
 */
import { marked } from 'marked';
import TurndownService from 'turndown';

const nachMarkdown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});

/** Erlaubte Elemente. Alles Übrige wird beim Einfügen zu reinem Text. */
const ERLAUBT = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'UL', 'OL', 'LI', 'H2', 'H3', 'A', 'BLOCKQUOTE']);

export interface EditorGriff {
  /** Aktuellen Inhalt als Markdown lesen. */
  lesen(): string;
  /** Markdown laden. */
  setzen(markdown: string): void;
  /** Vorschau-HTML für die Anzeige. */
  vorschau(): string;
}

export function editorAufbauen(
  bereich: HTMLElement,
  werkzeugleiste: HTMLElement,
  beiAenderung: () => void,
): EditorGriff {
  bereich.contentEditable = 'true';
  bereich.setAttribute('role', 'textbox');
  bereich.setAttribute('aria-multiline', 'true');

  werkzeuge(werkzeugleiste, bereich, beiAenderung);

  bereich.addEventListener('input', beiAenderung);

  // Einfügen immer bereinigen: aus Word oder dem Web kommt sonst fremdes
  // Markup mit Schriftgrößen, Farben und teils sogar Skripten mit.
  bereich.addEventListener('paste', (e) => {
    e.preventDefault();
    const html = e.clipboardData?.getData('text/html');
    const text = e.clipboardData?.getData('text/plain') ?? '';
    const sauber = html ? saeubern(html) : escapeText(text);
    document.execCommand('insertHTML', false, sauber);
    beiAenderung();
  });

  return {
    lesen: () => nachMarkdown.turndown(bereich.innerHTML).trim(),
    setzen: (markdown: string) => {
      bereich.innerHTML = markdown.trim() ? String(marked.parse(markdown, { async: false })) : '<p></p>';
    },
    vorschau: () => bereich.innerHTML,
  };
}

function werkzeuge(leiste: HTMLElement, bereich: HTMLElement, beiAenderung: () => void) {
  const knoepfe: { text: string; titel: string; tun: () => void }[] = [
    { text: 'F', titel: 'Fett', tun: () => befehl('bold') },
    { text: 'K', titel: 'Kursiv', tun: () => befehl('italic') },
    { text: 'Überschrift', titel: 'Zwischenüberschrift', tun: () => befehl('formatBlock', 'h2') },
    { text: 'Kleiner', titel: 'Kleinere Überschrift', tun: () => befehl('formatBlock', 'h3') },
    { text: '• Liste', titel: 'Aufzählung', tun: () => befehl('insertUnorderedList') },
    { text: '1. Liste', titel: 'Nummerierte Liste', tun: () => befehl('insertOrderedList') },
    { text: 'Link', titel: 'Link einfügen', tun: () => link() },
    { text: 'Absatz', titel: 'Formatierung entfernen', tun: () => befehl('formatBlock', 'p') },
  ];

  for (const k of knoepfe) {
    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.textContent = k.text;
    knopf.title = k.titel;
    knopf.setAttribute('aria-label', k.titel);

    /*
      Entscheidend: `pointerdown` abfangen und den Standard verhindern.
      Sonst verliert der Textbereich beim Antippen den markierten Text, und
      die Formatierung greift ins Leere – der klassische Fehler
      selbstgebauter Editoren, besonders auf Touch-Geräten.
    */
    knopf.addEventListener('pointerdown', (e) => e.preventDefault());
    knopf.addEventListener('click', (e) => {
      e.preventDefault();
      bereich.focus();
      k.tun();
      beiAenderung();
    });
    leiste.append(knopf);
  }
}

function befehl(name: string, wert?: string) {
  document.execCommand(name, false, wert);
}

function link() {
  const auswahl = window.getSelection();
  if (!auswahl || auswahl.isCollapsed) {
    window.alert('Bitte markiere zuerst den Text, der zum Link werden soll.');
    return;
  }
  const ziel = window.prompt('Wohin soll der Link führen?', 'https://');
  if (!ziel) return;
  if (!/^(https?:|mailto:|tel:|\/)/i.test(ziel)) {
    window.alert('Bitte gib eine vollständige Adresse an, die mit https:// beginnt.');
    return;
  }
  befehl('createLink', ziel);
}

/** Fremdes HTML auf die erlaubten Elemente zurückschneiden. */
function saeubern(html: string): string {
  const vorlage = document.createElement('div');
  vorlage.innerHTML = html;

  const gehen = (knoten: Element) => {
    for (const kind of [...knoten.children]) {
      gehen(kind);
      if (!ERLAUBT.has(kind.tagName)) {
        // Element auflösen, Inhalt behalten.
        kind.replaceWith(...kind.childNodes);
        continue;
      }
      // Alle Attribute entfernen; bei Links nur eine unbedenkliche Adresse behalten.
      const href = kind.tagName === 'A' ? kind.getAttribute('href') : null;
      for (const attr of [...kind.attributes]) kind.removeAttribute(attr.name);
      if (href && /^(https?:|mailto:|tel:|\/)/i.test(href)) kind.setAttribute('href', href);
    }
  };
  gehen(vorlage);
  return vorlage.innerHTML;
}

function escapeText(text: string): string {
  const p = document.createElement('p');
  p.textContent = text;
  return p.outerHTML;
}
