/**
 * Alle Endpunkte des Redaktionsbereichs.
 *
 * Die Zugangsprüfung liegt in `_middleware.ts` und läuft vor jeder Anfrage –
 * hier steht ausschließlich die Fachlogik.
 *
 *   GET    /admin/api/status                  Stand der Website
 *   GET    /admin/api/<art>                   Liste
 *   GET    /admin/api/<art>/<name>            Einzeleintrag
 *   PUT    /admin/api/<art>/<name>            anlegen oder ändern
 *   DELETE /admin/api/<art>/<name>            löschen
 *   GET    /admin/api/einstellungen/<datei>   Website- bzw. Startseiten-Daten
 *   PUT    /admin/api/einstellungen/<datei>
 *   GET    /admin/api/medien/<ordner>         hochgeladene Bilder auflisten
 *   POST   /admin/api/medien/<ordner>         Bild hochladen
 *   GET    /admin/api/vorschau?pfad=…         Bild anzeigen (auch aus src/)
 */
import { type Env } from './_lib/env';
import { type Redakteur } from './_lib/zugang';
import {
  json, fehler, nichtGefunden, konflikt, tokenAbgelaufen, gitHubGestoert,
} from './_lib/antwort';
import {
  leseDatei, schreibeDatei, loescheDatei, listeOrdner, leseBinaer, letzterCommit, GitHubFehler,
} from './_lib/github';
import { leseMarkdown, schreibeMarkdown, leseJson, schreibeJson } from './_lib/frontmatter';
import {
  SAMMLUNGEN, EINSTELLUNGEN, MEDIEN, type SammlungsName, type EinstellungsName, type MedienOrdner,
  sammlungsPfad, medienPfad, istGueltigerSlug, pfadErlaubt, bildReferenz,
} from './_lib/pfade';
import {
  pruefeBeitrag, pruefeTermin, pruefeGarde, pruefeGaleriebereich, pruefeChronik, pruefeAnlass,
  pruefeWebsiteEinstellungen, pruefeStartseite, type Pruefergebnis,
} from './_lib/schema';
import { slugify, terminSlug, bildSlug, freierName } from './_lib/slug';

interface Kontext {
  request: Request;
  env: Env;
  params: { path?: string | string[] };
  data: { redakteur: Redakteur };
}

/** Pro Sammlung: Prüfung, Beschriftung und ob es einen Fließtext gibt. */
const ARTEN: Record<SammlungsName, {
  pruefe: (roh: Record<string, unknown>) => Pruefergebnis;
  bezeichnung: string;
  mitText: boolean;
}> = {
  beitraege: { pruefe: pruefeBeitrag, bezeichnung: 'Beitrag', mitText: true },
  termine: { pruefe: pruefeTermin, bezeichnung: 'Termin', mitText: false },
  garden: { pruefe: pruefeGarde, bezeichnung: 'Garde', mitText: true },
  galerie: { pruefe: pruefeGaleriebereich, bezeichnung: 'Galeriebereich', mitText: false },
  chronik: { pruefe: pruefeChronik, bezeichnung: 'Chronik-Eintrag', mitText: false },
  anlass: { pruefe: pruefeAnlass, bezeichnung: 'Hinweis', mitText: false },
};

/** Bereiche, deren Einträge fest vorgegeben sind (kein Anlegen, kein Löschen). */
const FESTE_BEREICHE: SammlungsName[] = ['galerie', 'anlass'];

const MAX_BILD_BYTES = 5 * 1024 * 1024;

export async function onRequest(context: Kontext): Promise<Response> {
  const { request, env, params, data } = context;
  const url = new URL(request.url);
  const teile = (Array.isArray(params.path) ? params.path : [params.path])
    .filter((t): t is string => typeof t === 'string' && t.length > 0);

  try {
    return await verteile(teile, request, env, url, data.redakteur);
  } catch (e) {
    if (e instanceof GitHubFehler) {
      if (e.grund === 'token') return tokenAbgelaufen();
      if (e.grund === 'konflikt') return konflikt();
      if (e.grund === 'nichtGefunden') return nichtGefunden();
      return gitHubGestoert();
    }
    return fehler(500, 'Unerwarteter Fehler. Bitte versuche es erneut.');
  }
}

async function verteile(
  teile: string[],
  request: Request,
  env: Env,
  url: URL,
  redakteur: Redakteur,
): Promise<Response> {
  const [erstes, zweites] = teile;
  const methode = request.method;

  if (!erstes) return nichtGefunden();

  if (erstes === 'status' && methode === 'GET') {
    const commit = await letzterCommit(env);
    return json({ letzteAenderung: commit });
  }

  if (erstes === 'vorschau' && methode === 'GET') {
    return bildVorschau(env, url);
  }

  if (erstes === 'medien') {
    return medien(zweites, request, env, methode, redakteur);
  }

  if (erstes === 'einstellungen') {
    return einstellungen(zweites, request, env, methode, redakteur);
  }

  if (erstes in ARTEN) {
    return sammlung(erstes as SammlungsName, zweites, request, env, methode, redakteur);
  }

  return nichtGefunden();
}

// --- Sammlungen --------------------------------------------------------------

async function sammlung(
  art: SammlungsName,
  name: string | undefined,
  request: Request,
  env: Env,
  methode: string,
  redakteur: Redakteur,
): Promise<Response> {
  const info = ARTEN[art];
  const ordner = `src/content/${SAMMLUNGEN[art]}`;

  // Liste
  if (!name) {
    if (methode !== 'GET') return fehler(405, 'Diese Aktion ist hier nicht möglich.');
    const dateien = (await listeOrdner(env, ordner)).filter((d) => d.name.endsWith('.md'));
    const eintraege = await Promise.all(
      dateien.map(async (d) => {
        const datei = await leseDatei(env, d.pfad);
        if (!datei) return null;
        const { daten } = leseMarkdown(datei.inhalt);
        return { name: d.name.replace(/\.md$/, ''), ...daten };
      }),
    );
    return json({ eintraege: eintraege.filter(Boolean) });
  }

  if (!istGueltigerSlug(name)) return nichtGefunden();
  const pfad = sammlungsPfad(art, name);
  if (!pfad) return nichtGefunden();

  if (methode === 'GET') {
    const datei = await leseDatei(env, pfad);
    if (!datei) return nichtGefunden();
    const { daten, text } = leseMarkdown(datei.inhalt);
    return json({ name, daten, text, sha: datei.sha });
  }

  if (methode === 'PUT') {
    return speichere(art, name, pfad, request, env, redakteur, info);
  }

  if (methode === 'DELETE') {
    if (FESTE_BEREICHE.includes(art)) {
      return fehler(403, `Ein ${info.bezeichnung} kann nicht gelöscht werden – nur geleert.`);
    }
    const datei = await leseDatei(env, pfad);
    if (!datei) return nichtGefunden();
    await loescheDatei(env, pfad, commitText(`${info.bezeichnung} gelöscht`, name, redakteur), datei.sha);
    return json({ geloescht: true });
  }

  return fehler(405, 'Diese Aktion ist hier nicht möglich.');
}

async function speichere(
  art: SammlungsName,
  name: string,
  pfad: string,
  request: Request,
  env: Env,
  redakteur: Redakteur,
  info: (typeof ARTEN)[SammlungsName],
): Promise<Response> {
  const koerper = (await sicherJson(request)) as {
    daten?: Record<string, unknown>;
    text?: string;
    sha?: string;
    /** Gewünschter neuer Name – nur beim Anlegen ausgewertet. */
    neu?: boolean;
  } | null;
  if (!koerper?.daten) return fehler(400, 'Die Anfrage war unvollständig. Bitte lade die Seite neu.');

  const geprueft = info.pruefe(koerper.daten);
  if (!geprueft.ok) return fehler(422, geprueft.meldung!, geprueft.feld);

  const vorhanden = await leseDatei(env, pfad);

  if (vorhanden && koerper.neu) {
    return fehler(409, 'Unter diesem Namen gibt es bereits einen Eintrag. Bitte wähle einen anderen Titel.');
  }
  // Wer eine bestehende Datei ändert, muss deren Version mitschicken. Sonst
  // würde eine parallele Änderung kommentarlos überschrieben.
  if (vorhanden && !koerper.neu && koerper.sha !== vorhanden.sha) return konflikt();
  if (!vorhanden && !koerper.neu && FESTE_BEREICHE.includes(art) === false) {
    return nichtGefunden();
  }

  const inhalt = schreibeMarkdown({
    daten: geprueft.daten!,
    text: info.mitText ? String(koerper.text ?? '') : '',
  });

  const aktion = vorhanden ? 'geändert' : 'angelegt';
  const titel = String(geprueft.daten!.title ?? geprueft.daten!.name ?? name);
  const { sha } = await schreibeDatei(
    env, pfad, inhalt, commitText(`${info.bezeichnung} „${titel}" ${aktion}`, name, redakteur), vorhanden?.sha,
  );
  return json({ name, sha, angelegt: !vorhanden });
}

// --- Einstellungen -----------------------------------------------------------

async function einstellungen(
  welche: string | undefined,
  request: Request,
  env: Env,
  methode: string,
  redakteur: Redakteur,
): Promise<Response> {
  if (!welche || !(welche in EINSTELLUNGEN)) return nichtGefunden();
  const schluessel = welche as EinstellungsName;
  const pfad = EINSTELLUNGEN[schluessel];

  if (methode === 'GET') {
    const datei = await leseDatei(env, pfad);
    if (!datei) return nichtGefunden();
    return json({ daten: leseJson(datei.inhalt), sha: datei.sha });
  }

  if (methode !== 'PUT') return fehler(405, 'Diese Aktion ist hier nicht möglich.');

  const koerper = (await sicherJson(request)) as { daten?: Record<string, unknown>; sha?: string } | null;
  if (!koerper?.daten) return fehler(400, 'Die Anfrage war unvollständig. Bitte lade die Seite neu.');

  const geprueft = schluessel === 'website'
    ? pruefeWebsiteEinstellungen(koerper.daten)
    : pruefeStartseite(koerper.daten);
  if (!geprueft.ok) return fehler(422, geprueft.meldung!, geprueft.feld);

  const vorhanden = await leseDatei(env, pfad);
  if (!vorhanden) return nichtGefunden();
  if (koerper.sha !== vorhanden.sha) return konflikt();

  const bezeichnung = schluessel === 'website' ? 'Website-Einstellungen' : 'Startseite';
  const { sha } = await schreibeDatei(
    env, pfad, schreibeJson(geprueft.daten), commitText(`${bezeichnung} geändert`, '', redakteur), vorhanden.sha,
  );
  return json({ sha });
}

// --- Medien ------------------------------------------------------------------

async function medien(
  ordnerName: string | undefined,
  request: Request,
  env: Env,
  methode: string,
  redakteur: Redakteur,
): Promise<Response> {
  if (!ordnerName || !(ordnerName in MEDIEN)) return nichtGefunden();
  const ordner = ordnerName as MedienOrdner;

  if (methode === 'GET') {
    const dateien = await listeOrdner(env, MEDIEN[ordner]);
    return json({
      bilder: dateien.map((d) => ({
        dateiname: d.name,
        referenz: bildReferenz(ordner, d.name),
        groesse: d.groesse,
      })),
    });
  }

  if (methode !== 'POST') return fehler(405, 'Diese Aktion ist hier nicht möglich.');

  const koerper = (await sicherJson(request)) as {
    dateiname?: string;
    /** Bilddaten als Base64, ohne Präfix. */
    inhalt?: string;
  } | null;
  if (!koerper?.inhalt || !koerper.dateiname) {
    return fehler(400, 'Es wurde kein Bild übermittelt. Bitte versuche es erneut.');
  }

  let bytes: Uint8Array;
  try {
    const roh = atob(koerper.inhalt);
    bytes = Uint8Array.from(roh, (z) => z.charCodeAt(0));
  } catch {
    return fehler(400, 'Das Bild konnte nicht gelesen werden. Bitte versuche es erneut.');
  }

  // Serverseitige Grenze – die Verkleinerung im Browser lässt sich umgehen.
  if (bytes.byteLength > MAX_BILD_BYTES) {
    return fehler(413, 'Das Bild ist zu groß (höchstens 5 MB). Bitte wähle ein kleineres.');
  }
  if (!istBild(bytes)) {
    return fehler(415, 'Diese Datei ist kein Bild. Erlaubt sind JPG, PNG und WebP.');
  }

  const vorhandene = new Set((await listeOrdner(env, MEDIEN[ordner])).map((d) => d.name));
  const wunsch = bildSlug(koerper.dateiname, endungAusBytes(bytes));
  const dateiname = freierName(wunsch, vorhandene);

  const pfad = medienPfad(ordner, dateiname);
  if (!pfad || !pfadErlaubt(pfad)) {
    return fehler(400, 'Der Dateiname ist nicht zulässig. Bitte benenne die Datei um.');
  }

  await schreibeDatei(
    env, pfad, bytes.buffer as ArrayBuffer, commitText(`Bild „${dateiname}" hochgeladen`, '', redakteur),
  );

  return json({ dateiname, referenz: bildReferenz(ordner, dateiname) });
}

/**
 * Bildvorschau für den Editor.
 *
 * Nötig, weil Galeriebilder unter `src/assets/` liegen und von dort NICHT
 * öffentlich ausgeliefert werden – Astro erzeugt daraus beim Bauen Dateien mit
 * Prüfsummen-Namen. Ohne diesen Umweg könnte der Editor sie nicht anzeigen.
 */
async function bildVorschau(env: Env, url: URL): Promise<Response> {
  const pfad = url.searchParams.get('pfad') ?? '';
  if (!pfadErlaubt(pfad) || !/\.(webp|jpe?g|png|avif)$/i.test(pfad)) {
    return fehler(400, 'Dieses Bild kann nicht angezeigt werden.');
  }

  const daten = await leseBinaer(env, pfad);
  if (!daten) return nichtGefunden();

  const endung = pfad.slice(pfad.lastIndexOf('.') + 1).toLowerCase();
  const typ = endung === 'png' ? 'image/png'
    : endung === 'webp' ? 'image/webp'
    : endung === 'avif' ? 'image/avif'
    : 'image/jpeg';

  return new Response(daten, {
    headers: {
      'Content-Type': typ,
      // Nur im Browser des angemeldeten Redakteurs, nicht in Zwischenspeichern.
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// --- Helfer ------------------------------------------------------------------

async function sicherJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * Commit-Text. Enthält die E-Mail aus dem Access-Token, damit in der
 * Versionsgeschichte nachvollziehbar bleibt, wer geändert hat – alle Commits
 * stammen sonst vom selben Redaktions-Konto.
 */
function commitText(was: string, name: string, redakteur: Redakteur): string {
  const zusatz = name ? ` (${name})` : '';
  return `Redaktion: ${was}${zusatz}\n\nGeändert über /admin von ${redakteur.email}`;
}

/** Dateityp anhand der ersten Bytes statt anhand der Endung. */
function istBild(b: Uint8Array): boolean {
  if (b.length < 12) return false;
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const riff = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46;
  const webp = riff && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  return jpeg || png || webp;
}

function endungAusBytes(b: Uint8Array): string {
  if (b[0] === 0x89 && b[1] === 0x50) return 'png';
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpg';
  return 'webp';
}

// Wird von der Oberfläche zum Vorschlagen von Dateinamen genutzt.
export { slugify, terminSlug };
