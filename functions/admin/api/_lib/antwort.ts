/**
 * Einheitliche Antworten der Redaktions-API.
 *
 * Jede Fehlermeldung ist deutscher Klartext und richtet sich an
 * Vorstandsmitglieder, nicht an Entwickler. Der Editor zeigt sie unverändert
 * an, deshalb steht hier immer, was zu tun ist – nicht nur, was schiefging.
 */

const KOPF = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, private',
  'X-Robots-Tag': 'noindex',
} as const;

export function json(daten: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(daten), { status, headers: { ...KOPF, ...extra } });
}

/**
 * @param status  HTTP-Status
 * @param text    Was der Redakteur lesen soll
 * @param feld    Betroffenes Formularfeld, damit der Editor dorthin springen kann
 */
export function fehler(status: number, text: string, feld?: string): Response {
  return json({ fehler: text, feld }, status);
}

export const nichtGefunden = () =>
  fehler(404, 'Dieser Eintrag wurde nicht gefunden. Vielleicht wurde er inzwischen gelöscht.');

export const keinZugang = () =>
  fehler(403, 'Kein Zugang. Bitte lade die Seite neu und melde dich erneut an.');

export const abgelaufen = () =>
  fehler(401, 'Deine Anmeldung ist abgelaufen. Bitte lade die Seite neu.');

export const konflikt = () =>
  fehler(
    409,
    'Der Eintrag wurde zwischenzeitlich von jemand anderem geändert. ' +
      'Bitte lade die Seite neu – sonst gehen die anderen Änderungen verloren.',
  );

export const nichtKonfiguriert = (fehlend: string[]) =>
  fehler(
    500,
    'Der Redaktionsbereich ist noch nicht vollständig eingerichtet ' +
      `(fehlt: ${fehlend.join(', ')}). Bitte die technische Betreuung informieren.`,
  );

export const tokenAbgelaufen = () =>
  fehler(
    500,
    'Der Zugang der Website zu GitHub ist abgelaufen oder wurde entzogen. ' +
      'Bitte die technische Betreuung informieren – Änderungen können bis dahin ' +
      'nicht gespeichert werden.',
  );

export const gitHubGestoert = () =>
  fehler(502, 'GitHub ist gerade nicht erreichbar. Bitte versuche es in ein paar Minuten erneut.');
