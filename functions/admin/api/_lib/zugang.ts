/**
 * Zugangsprüfung für alle Endpunkte unter /admin/api.
 *
 * Der Redaktionsbereich hat keine eigene Anmeldung – geprüft wird
 * ausschließlich Cloudflare Access. Weil hinter diesen Endpunkten ein Token
 * mit Schreibrecht aufs Repository steht, liegen hier drei Schichten
 * übereinander. Jede einzelne würde reichen; zusammen fangen sie auch eine
 * versehentlich falsch gesetzte Access-Regel ab.
 */
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { type Env, istEntwicklung } from './env';

export interface Redakteur {
  /** E-Mail aus dem Access-Token – landet im Commit-Text. */
  email: string;
}

/**
 * JWKS-Abruf je Team-Domain zwischenspeichern. `createRemoteJWKSet` cached die
 * Schlüssel selbst, wir vermeiden hier nur, den Cache pro Anfrage neu anzulegen.
 */
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwks(teamDomain: string) {
  const basis = teamDomain.replace(/\/+$/, '');
  let vorhanden = jwksCache.get(basis);
  if (!vorhanden) {
    vorhanden = createRemoteJWKSet(new URL(`${basis}/cdn-cgi/access/certs`));
    jwksCache.set(basis, vorhanden);
  }
  return vorhanden;
}

/**
 * Schicht 1 – erlaubter Hostname.
 *
 * Wichtig: Eine Access-Anwendung auf der eigenen Domain schützt die
 * `*.pages.dev`-Adresse NICHT. Ohne diese Prüfung wären die Schreib-Endpunkte
 * dort offen erreichbar. Fehlt die Variable, wird abgelehnt statt
 * durchgelassen.
 */
export function hostnameErlaubt(url: URL, env: Env): boolean {
  const erlaubt = String(env.ALLOWED_DOMAINS ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  if (erlaubt.length === 0) return false;
  return erlaubt.includes(url.hostname.toLowerCase());
}

/**
 * Schicht 2 – Schutz vor fremdem Auslösen (CSRF).
 *
 * Access authentifiziert über ein Cookie. Ruft eine fremde Seite unsere API
 * auf, schickt der Browser dieses Cookie mit und Access setzt den Token-Header
 * ganz normal – die Token-Prüfung allein hilft also nicht. Zwei Sperren:
 *
 *  - `Origin` muss die eigene Adresse sein.
 *  - Ein eigener Header muss gesetzt sein. Den kann eine fremde Seite nur mit
 *    CORS-Vorabanfrage senden, und die beantworten wir nicht.
 *
 * Lesende Anfragen sind ausgenommen; sie ändern nichts.
 */
export function schreibzugriffErlaubt(request: Request, url: URL): boolean {
  if (request.method === 'GET' || request.method === 'HEAD') return true;

  if (request.headers.get('X-Redaktion') !== '1') return false;

  const origin = request.headers.get('Origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === url.host;
  } catch {
    return false;
  }
}

/**
 * Schicht 3 – Cloudflare-Access-Token prüfen.
 *
 * Die bloße Anwesenheit des Headers genügt ausdrücklich nicht: Ohne
 * Signaturprüfung könnte ihn jeder selbst setzen. Deshalb wird gegen die
 * öffentlichen Schlüssel des Access-Teams verifiziert, inklusive Aussteller
 * und Zielgruppe.
 */
export async function redakteurErmitteln(
  request: Request,
  env: Env,
): Promise<Redakteur | null> {
  if (istEntwicklung(env)) {
    return { email: 'lokale-entwicklung@example.invalid' };
  }

  const token =
    request.headers.get('Cf-Access-Jwt-Assertion') ??
    leseCookie(request.headers.get('Cookie'), 'CF_Authorization');
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, jwks(env.CF_ACCESS_TEAM_DOMAIN), {
      issuer: env.CF_ACCESS_TEAM_DOMAIN.replace(/\/+$/, ''),
      audience: env.CF_ACCESS_AUD,
    });
    const email = typeof payload.email === 'string' ? payload.email : '';
    return { email: email || 'unbekannt' };
  } catch {
    // Abgelaufen, falsch signiert oder für eine andere Anwendung ausgestellt.
    return null;
  }
}

function leseCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const teil of header.split(';')) {
    const i = teil.indexOf('=');
    if (i > -1 && teil.slice(0, i).trim() === name) return teil.slice(i + 1).trim();
  }
  return null;
}
