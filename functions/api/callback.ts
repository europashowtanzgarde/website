/**
 * GET /api/callback – Rückkehr von GitHub. Tauscht den Code gegen ein
 * Access-Token und meldet das Ergebnis per postMessage an das CMS-Fenster.
 */
import { type FnContext, parseCookies, getStateCookieName, renderHandshake } from './_lib';

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

export async function onRequestGet({ request, env }: FnContext): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookies = parseCookies(request.headers.get('Cookie'));
  const savedState = cookies[getStateCookieName()];

  if (!code || !state || !savedState || state !== savedState) {
    return renderHandshake('error', 'github', {
      error: 'Ungültige oder abgelaufene Anmeldesitzung. Bitte erneut versuchen.',
    });
  }

  let data: TokenResponse;
  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'europashowtanzgarde-cms-auth',
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    data = (await res.json()) as TokenResponse;
  } catch {
    return renderHandshake('error', 'github', {
      error: 'GitHub war nicht erreichbar. Bitte später erneut versuchen.',
    });
  }

  if (data.error || !data.access_token) {
    return renderHandshake('error', 'github', {
      error: data.error_description || data.error || 'Token konnte nicht abgerufen werden.',
    });
  }

  return renderHandshake('success', 'github', {
    token: data.access_token,
    provider: 'github',
  });
}
