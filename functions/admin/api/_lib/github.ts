/**
 * Zugriff auf das Repository über die GitHub-Contents-API.
 *
 * Gelesen wird immer der aktuelle Stand des Branches – nicht die gebaute
 * Website. Dadurch sieht die Redaktion ihre Änderungen sofort, auch während
 * Cloudflare Pages noch baut.
 *
 * Der Token bleibt ausschließlich hier; der Browser bekommt ihn nie zu sehen.
 */
import { type Env, repoTeile } from './env';
import { pfadErlaubt } from './pfade';

const API = 'https://api.github.com';

export class GitHubFehler extends Error {
  constructor(
    readonly status: number,
    readonly grund: 'token' | 'konflikt' | 'nichtGefunden' | 'sonstiges',
    nachricht: string,
  ) {
    super(nachricht);
  }
}

export interface Datei {
  /** Dateiinhalt als Text. */
  inhalt: string;
  /**
   * Version der Datei. Muss beim Speichern zurückgeschickt werden – sonst
   * würden parallele Änderungen kommentarlos überschrieben.
   */
  sha: string;
}

function kopf(env: Env): HeadersInit {
  return {
    Authorization: `Bearer ${env.CMS_GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'europashowtanzgarde-redaktion',
  };
}

async function anfrage(env: Env, pfad: string, init?: RequestInit): Promise<Response> {
  let antwort: Response;
  try {
    antwort = await fetch(`${API}${pfad}`, { ...init, headers: { ...kopf(env), ...(init?.headers ?? {}) } });
  } catch {
    throw new GitHubFehler(502, 'sonstiges', 'GitHub war nicht erreichbar.');
  }
  if (antwort.status === 401 || antwort.status === 403) {
    // 403 kann auch „Rate Limit" heißen; für die Redaktion ist beides derselbe
    // Handlungsbedarf: Die technische Betreuung muss sich darum kümmern.
    throw new GitHubFehler(antwort.status, 'token', 'Der Zugang zu GitHub wurde abgelehnt.');
  }
  return antwort;
}

function repoPfad(env: Env, datei: string): string {
  const { owner, repo } = repoTeile(env);
  // Jeder Pfadbestandteil einzeln kodieren, damit „/" erhalten bleibt.
  const kodiert = datei.split('/').map(encodeURIComponent).join('/');
  return `/repos/${owner}/${repo}/contents/${kodiert}`;
}

/** Eine Datei lesen. `null`, wenn sie nicht existiert. */
export async function leseDatei(env: Env, datei: string): Promise<Datei | null> {
  const { branch } = repoTeile(env);
  const antwort = await anfrage(env, `${repoPfad(env, datei)}?ref=${encodeURIComponent(branch)}`);
  if (antwort.status === 404) return null;
  if (!antwort.ok) throw new GitHubFehler(antwort.status, 'sonstiges', 'Datei konnte nicht gelesen werden.');

  const daten = (await antwort.json()) as { content?: string; sha: string; encoding?: string };
  if (!daten.content) {
    // Dateien über 1 MB liefert die Contents-API ohne Inhalt.
    throw new GitHubFehler(413, 'sonstiges', 'Die Datei ist zu groß, um sie hier zu bearbeiten.');
  }
  return { inhalt: base64ZuText(daten.content), sha: daten.sha };
}

/** Rohdaten einer Datei (für die Bildvorschau im Editor). */
export async function leseBinaer(env: Env, datei: string): Promise<ArrayBuffer | null> {
  const { branch } = repoTeile(env);
  const antwort = await anfrage(env, `${repoPfad(env, datei)}?ref=${encodeURIComponent(branch)}`, {
    headers: { Accept: 'application/vnd.github.raw' },
  });
  if (antwort.status === 404) return null;
  if (!antwort.ok) throw new GitHubFehler(antwort.status, 'sonstiges', 'Bild konnte nicht geladen werden.');
  return antwort.arrayBuffer();
}

/** Verzeichnisinhalt auflisten. */
export async function listeOrdner(
  env: Env,
  ordner: string,
): Promise<{ name: string; pfad: string; groesse: number }[]> {
  const { branch } = repoTeile(env);
  const antwort = await anfrage(env, `${repoPfad(env, ordner)}?ref=${encodeURIComponent(branch)}`);
  if (antwort.status === 404) return [];
  if (!antwort.ok) throw new GitHubFehler(antwort.status, 'sonstiges', 'Ordner konnte nicht gelesen werden.');

  const eintraege = (await antwort.json()) as { name: string; path: string; size: number; type: string }[];
  if (!Array.isArray(eintraege)) return [];
  return eintraege
    .filter((e) => e.type === 'file')
    .map((e) => ({ name: e.name, pfad: e.path, groesse: e.size }));
}

/**
 * Datei anlegen oder ändern.
 *
 * `sha` ist die beim Laden gelesene Version. Stimmt sie nicht mehr, hat
 * jemand anders zwischenzeitlich gespeichert – dann bricht der Vorgang mit
 * „konflikt" ab, statt die fremde Änderung stillschweigend zu überschreiben.
 */
export async function schreibeDatei(
  env: Env,
  datei: string,
  inhalt: string | ArrayBuffer,
  nachricht: string,
  sha?: string,
): Promise<{ sha: string }> {
  // Doppelte Sicherung: Der Pfad wurde bereits beim Zusammenbauen geprüft.
  if (!pfadErlaubt(datei)) {
    throw new GitHubFehler(403, 'sonstiges', 'Dieser Speicherort ist nicht freigegeben.');
  }

  const { branch } = repoTeile(env);
  const antwort = await anfrage(env, repoPfad(env, datei), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: nachricht,
      content: typeof inhalt === 'string' ? textZuBase64(inhalt) : binaerZuBase64(inhalt),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (antwort.status === 409 || antwort.status === 422) {
    throw new GitHubFehler(409, 'konflikt', 'Die Datei wurde zwischenzeitlich geändert.');
  }
  if (!antwort.ok) throw new GitHubFehler(antwort.status, 'sonstiges', 'Speichern fehlgeschlagen.');

  const daten = (await antwort.json()) as { content?: { sha: string } };
  return { sha: daten.content?.sha ?? '' };
}

/** Datei löschen. */
export async function loescheDatei(
  env: Env,
  datei: string,
  nachricht: string,
  sha: string,
): Promise<void> {
  if (!pfadErlaubt(datei)) {
    throw new GitHubFehler(403, 'sonstiges', 'Dieser Speicherort ist nicht freigegeben.');
  }
  const { branch } = repoTeile(env);
  const antwort = await anfrage(env, repoPfad(env, datei), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: nachricht, sha, branch }),
  });
  if (antwort.status === 409 || antwort.status === 422) {
    throw new GitHubFehler(409, 'konflikt', 'Die Datei wurde zwischenzeitlich geändert.');
  }
  if (antwort.status === 404) throw new GitHubFehler(404, 'nichtGefunden', 'Nicht gefunden.');
  if (!antwort.ok) throw new GitHubFehler(antwort.status, 'sonstiges', 'Löschen fehlgeschlagen.');
}

/** Letzter Commit des Branches – für die Statusanzeige im Editor. */
export async function letzterCommit(
  env: Env,
): Promise<{ nachricht: string; datum: string } | null> {
  const { owner, repo, branch } = repoTeile(env);
  const antwort = await anfrage(
    env,
    `/repos/${owner}/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=1`,
  );
  if (!antwort.ok) return null;
  const liste = (await antwort.json()) as { commit: { message: string; committer: { date: string } } }[];
  const erster = liste?.[0];
  if (!erster) return null;
  return { nachricht: erster.commit.message.split('\n')[0], datum: erster.commit.committer.date };
}

// --- Kodierung ---------------------------------------------------------------
// `atob`/`btoa` arbeiten byteweise. Für Umlaute muss deshalb ausdrücklich
// über UTF-8 gegangen werden, sonst landen kaputte Zeichen im Repository.

function base64ZuText(base64: string): string {
  const roh = atob(base64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(roh, (z) => z.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

function textZuBase64(text: string): string {
  return binaerZuBase64(new TextEncoder().encode(text).buffer as ArrayBuffer);
}

function binaerZuBase64(puffer: ArrayBuffer): string {
  const bytes = new Uint8Array(puffer);
  let roh = '';
  // In Blöcken, damit sehr große Bilder den Aufrufstapel nicht sprengen.
  const block = 0x8000;
  for (let i = 0; i < bytes.length; i += block) {
    roh += String.fromCharCode(...bytes.subarray(i, i + block));
  }
  return btoa(roh);
}
