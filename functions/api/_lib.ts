/**
 * Gemeinsame Helfer für den GitHub-OAuth-Flow des Redaktionssystems.
 *
 * Portiert vom offiziellen, MIT-lizenzierten Cloudflare Worker
 * „sveltia-cms-auth" (https://github.com/sveltia/sveltia-cms-auth) auf
 * Cloudflare Pages Functions. Copyright (c) 2023 Kohei Yoshino, MIT-Lizenz.
 */

export interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  /** Kommagetrennte Liste erlaubter Hostnamen (optional). */
  ALLOWED_DOMAINS?: string;
}

export interface FnContext {
  request: Request;
  env: Env;
}

const COOKIE_NAME = 'csrf-state';

/** Cookie-Header in ein einfaches Objekt zerlegen. */
export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > -1) out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return out;
}

export function stateCookie(value: string, maxAge = 600): string {
  const attrs = [
    `${COOKIE_NAME}=${value}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${maxAge}`,
  ];
  return attrs.join('; ');
}

export const clearStateCookie = (): string => stateCookie('', 0);
export const getStateCookieName = (): string => COOKIE_NAME;

/**
 * HTML-Seite, die das Ergebnis per postMessage an das öffnende CMS-Fenster
 * meldet (Decap-/Netlify-Protokoll). Sveltia erwartet exakt dieses Format.
 */
export function renderHandshake(
  status: 'success' | 'error',
  provider: string,
  payload: Record<string, unknown>,
): Response {
  const message = `authorization:${provider}:${status}:${JSON.stringify(payload)}`;
  const body = `<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Anmeldung</title></head>
<body style="font-family:sans-serif;background:#0c1024;color:#faf6ef;display:grid;place-items:center;height:100vh;margin:0">
<p>Anmeldung wird abgeschlossen …</p>
<script>
(function () {
  function receiveMessage(e) {
    window.opener && window.opener.postMessage(${JSON.stringify(message)}, e.origin);
    window.removeEventListener('message', receiveMessage, false);
  }
  window.addEventListener('message', receiveMessage, false);
  window.opener && window.opener.postMessage('authorizing:${provider}', '*');
})();
</script>
</body></html>`;

  return new Response(body, {
    status: status === 'success' ? 200 : 400,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': clearStateCookie(),
      'Cache-Control': 'no-store',
    },
  });
}
