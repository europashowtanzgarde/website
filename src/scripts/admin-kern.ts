/**
 * Gemeinsame Bausteine des Redaktionsbereichs.
 *
 * Hier stecken die drei Punkte, die auf dem Handy über die Bedienbarkeit
 * entscheiden und erfahrungsgemäß erst beim Testen auffallen:
 *
 *  1. Die Bildschirmtastatur verdeckt die Aktionsleiste  -> `tastaturBeobachten`
 *  2. iOS entlädt Tabs im Hintergrund, Eingaben gehen verloren -> `Zwischenspeicher`
 *  3. Bilder verkleinern, ohne den Tab zum Absturz zu bringen -> `bildVerkleinern`
 */

// --- API ---------------------------------------------------------------------

export class ApiFehler extends Error {
  constructor(readonly status: number, nachricht: string, readonly feld?: string) {
    super(nachricht);
  }
}

/**
 * Aufruf der Redaktions-API.
 *
 * Der Kopf `X-Redaktion` ist Teil des Schutzes vor fremdem Auslösen: Eine
 * fremde Seite kann ihn nicht setzen, ohne dass der Browser vorher nachfragt –
 * und diese Nachfrage beantwortet die API nicht.
 */
export async function api<T = unknown>(
  pfad: string,
  optionen: { methode?: string; koerper?: unknown } = {},
): Promise<T> {
  const { methode = 'GET', koerper } = optionen;

  let antwort: Response;
  try {
    antwort = await fetch(`/admin/api/${pfad}`, {
      method: methode,
      headers: {
        'X-Redaktion': '1',
        ...(koerper === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: koerper === undefined ? undefined : JSON.stringify(koerper),
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiFehler(0, 'Keine Verbindung. Bist du online?');
  }

  if (antwort.status === 204) return undefined as T;

  let daten: unknown = null;
  try {
    daten = await antwort.json();
  } catch {
    /* Antwort ohne JSON – unten als allgemeiner Fehler behandelt. */
  }

  if (!antwort.ok) {
    const d = (daten ?? {}) as { fehler?: string; feld?: string };
    throw new ApiFehler(
      antwort.status,
      d.fehler ?? 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
      d.feld,
    );
  }
  return daten as T;
}

// --- Meldungen ---------------------------------------------------------------

export function meldung(
  ziel: HTMLElement,
  art: 'fehler' | 'ok' | 'info',
  text: string,
): void {
  ziel.innerHTML = '';
  const kasten = document.createElement('div');
  kasten.className = `adm-meldung adm-meldung--${art}`;
  kasten.textContent = text;
  if (art === 'fehler') kasten.setAttribute('role', 'alert');
  ziel.append(kasten);
}

export function meldungLeeren(ziel: HTMLElement): void {
  ziel.innerHTML = '';
}

/**
 * Fehler am betroffenen Feld anzeigen und dorthin scrollen.
 *
 * Ohne das drückt man unten auf „Speichern" und sieht nicht, dass weiter oben
 * eine Angabe fehlt.
 */
export function feldFehlerZeigen(feldName: string | undefined, text: string): boolean {
  document.querySelectorAll('.adm-feld.hat-fehler').forEach((f) => {
    f.classList.remove('hat-fehler');
    f.querySelector('.adm-feld__fehler')?.remove();
  });
  if (!feldName) return false;

  const element =
    document.querySelector<HTMLElement>(`[data-feld="${CSS.escape(feldName)}"]`) ??
    document.querySelector<HTMLElement>(`[name="${CSS.escape(feldName)}"]`);
  const huelle = element?.closest<HTMLElement>('.adm-feld');
  if (!huelle) return false;

  huelle.classList.add('hat-fehler');
  const hinweis = document.createElement('p');
  hinweis.className = 'adm-feld__fehler';
  hinweis.setAttribute('role', 'alert');
  hinweis.textContent = text;
  huelle.append(hinweis);

  huelle.scrollIntoView({ block: 'center', behavior: 'smooth' });
  (huelle.querySelector('input, textarea, select, [contenteditable]') as HTMLElement | null)?.focus();
  return true;
}

// --- Bildschirmtastatur ------------------------------------------------------

/**
 * Hält die Aktionsleiste über der Bildschirmtastatur.
 *
 * `position: fixed` bezieht sich auf den Layout-Bereich, nicht auf den
 * sichtbaren – bei offener Tastatur läge die Leiste darunter und wäre
 * unerreichbar. Der sichtbare Bereich wird über `visualViewport` gemeldet.
 */
export function tastaturBeobachten(): void {
  const vv = window.visualViewport;
  if (!vv) return;

  const anpassen = () => {
    const verdeckt = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty('--adm-tastatur', `${Math.round(verdeckt)}px`);
  };

  vv.addEventListener('resize', anpassen);
  vv.addEventListener('scroll', anpassen);
  anpassen();
}

/** Fokussiertes Feld in den sichtbaren Bereich holen. */
export function fokusSichtbarHalten(): void {
  document.addEventListener(
    'focusin',
    (e) => {
      const ziel = e.target as HTMLElement | null;
      if (!ziel?.matches('input, textarea, select, [contenteditable]')) return;
      // Kurz warten, bis die Tastatur aufgebaut ist.
      setTimeout(() => ziel.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
    },
    true,
  );
}

// --- Zwischenspeicher --------------------------------------------------------

/**
 * Sichert Eingaben im Browser.
 *
 * Hintergrund: iOS entlädt Tabs im Hintergrund. Wer beim Schreiben einen Anruf
 * bekommt, hätte den halbfertigen Beitrag sonst verloren – und `beforeunload`
 * greift in diesem Fall nicht zuverlässig.
 */
export class Zwischenspeicher<T> {
  private zeitgeber: number | undefined;

  constructor(private readonly schluessel: string) {}

  merken(daten: T): void {
    window.clearTimeout(this.zeitgeber);
    this.zeitgeber = window.setTimeout(() => {
      try {
        localStorage.setItem(
          this.schluessel,
          JSON.stringify({ gespeichertAm: Date.now(), daten }),
        );
      } catch {
        /* Speicher voll oder gesperrt – kein Grund, das Schreiben zu stören. */
      }
    }, 600);
  }

  lesen(): { gespeichertAm: number; daten: T } | null {
    try {
      const roh = localStorage.getItem(this.schluessel);
      return roh ? JSON.parse(roh) : null;
    } catch {
      return null;
    }
  }

  verwerfen(): void {
    window.clearTimeout(this.zeitgeber);
    try {
      localStorage.removeItem(this.schluessel);
    } catch {
      /* egal */
    }
  }
}

// --- Ungespeicherte Änderungen ----------------------------------------------

let schmutzig = false;

export function alsGeaendertMarkieren(): void {
  schmutzig = true;
}

export function alsGespeichertMarkieren(): void {
  schmutzig = false;
}

export function verlassenWarnen(): void {
  window.addEventListener('beforeunload', (e) => {
    if (!schmutzig) return;
    e.preventDefault();
    e.returnValue = '';
  });
}

export function istGeaendert(): boolean {
  return schmutzig;
}

// --- Bilder ------------------------------------------------------------------

export interface VerkleinertesBild {
  /** Base64 ohne Präfix – so erwartet es die API. */
  inhalt: string;
  dateiname: string;
  bytes: number;
}

const MAX_KANTE = 2048;

/**
 * Verkleinert ein Bild im Browser, bevor es hochgeladen wird.
 *
 * `createImageBitmap` mit Zielgröße dekodiert direkt herunterskaliert. Ein
 * 12-Megapixel-Foto über ein `Image`-Element in voller Auflösung zu laden
 * belegt rund 48 MB und kann ältere Geräte zum Absturz bringen.
 *
 * `imageOrientation: 'from-image'` berücksichtigt die Aufnahmerichtung –
 * sonst landen Hochformat-Fotos gekippt in der Galerie.
 */
export async function bildVerkleinern(datei: File): Promise<VerkleinertesBild> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(datei, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(
      'Dieses Bild konnte nicht gelesen werden. Bitte wähle ein JPG-, PNG- oder WebP-Bild ' +
        '(bei iPhone-Fotos hilft es, sie vorher als „Sehr kompatibel" zu speichern).',
    );
  }

  const faktor = Math.min(1, MAX_KANTE / Math.max(bitmap.width, bitmap.height));
  const breite = Math.max(1, Math.round(bitmap.width * faktor));
  const hoehe = Math.max(1, Math.round(bitmap.height * faktor));

  const flaeche = document.createElement('canvas');
  flaeche.width = breite;
  flaeche.height = hoehe;
  const stift = flaeche.getContext('2d');
  if (!stift) throw new Error('Das Bild konnte nicht verarbeitet werden.');
  stift.drawImage(bitmap, 0, 0, breite, hoehe);
  bitmap.close();

  const klecks = await new Promise<Blob | null>((fertig) =>
    flaeche.toBlob(fertig, 'image/webp', 0.85),
  );
  if (!klecks) throw new Error('Das Bild konnte nicht umgewandelt werden.');

  const puffer = await klecks.arrayBuffer();
  return {
    inhalt: puffer2base64(puffer),
    dateiname: datei.name,
    bytes: puffer.byteLength,
  };
}

function puffer2base64(puffer: ArrayBuffer): string {
  const bytes = new Uint8Array(puffer);
  let roh = '';
  const block = 0x8000;
  for (let i = 0; i < bytes.length; i += block) {
    roh += String.fromCharCode(...bytes.subarray(i, i + block));
  }
  return btoa(roh);
}

/**
 * Mehrere Bilder NACHEINANDER hochladen.
 *
 * Wer zehn Fotos eines Auftritts auswählt, würde bei paralleler Verarbeitung
 * zehn gleichzeitige Dekodierungen auslösen – das bringt schwächere Geräte an
 * ihre Grenzen.
 */
export async function bilderHochladen(
  dateien: File[],
  ordner: 'uploads' | 'galerie',
  fortschritt: (fertig: number, gesamt: number, name: string) => void,
): Promise<{ dateiname: string; referenz: string }[]> {
  const ergebnisse: { dateiname: string; referenz: string }[] = [];
  for (const [i, datei] of dateien.entries()) {
    fortschritt(i, dateien.length, datei.name);
    const klein = await bildVerkleinern(datei);
    const antwort = await api<{ dateiname: string; referenz: string }>(`medien/${ordner}`, {
      methode: 'POST',
      koerper: { dateiname: klein.dateiname, inhalt: klein.inhalt },
    });
    ergebnisse.push(antwort);
  }
  fortschritt(dateien.length, dateien.length, '');
  return ergebnisse;
}

/** Adresse, unter der der Editor ein Bild anzeigen kann. */
export function vorschauAdresse(referenz: string): string {
  if (referenz.startsWith('/uploads/')) return referenz;
  // Galeriebilder liegen unter src/ und werden nicht öffentlich ausgeliefert.
  const datei = referenz.split('/').pop() ?? '';
  return `/admin/api/vorschau?pfad=${encodeURIComponent(`src/assets/gallery/${datei}`)}`;
}

// --- Kleinkram ---------------------------------------------------------------

export function datumDeutsch(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso;
  const [j, m, t] = iso.slice(0, 10).split('-');
  return `${t}.${m}.${j}`;
}

export function heuteIso(): string {
  const jetzt = new Date();
  const versatz = jetzt.getTimezoneOffset() * 60000;
  return new Date(jetzt.getTime() - versatz).toISOString().slice(0, 10);
}

/** Speichern per Tastatur – auf dem Rechner die gewohnte Handbewegung. */
export function speichernKuerzel(speichern: () => void): void {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      speichern();
    }
  });
}

/** Rückfrage vor dem Löschen – nennt immer, worum es geht. */
export function loeschenBestaetigen(was: string): boolean {
  return window.confirm(`„${was}" wirklich löschen?\n\nDas lässt sich nicht rückgängig machen.`);
}
