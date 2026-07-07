/**
 * GET /api/auth – Start des GitHub-OAuth-Flows für das Redaktionssystem.
 * Leitet zur GitHub-Anmeldung weiter und hinterlegt einen CSRF-State im Cookie.
 */
import { type Env, type FnContext, stateCookie } from './_lib';

export async function onRequestGet({ request, env }: FnContext): Promise<Response> {
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider') ?? 'github';

  if (provider !== 'github') {
    return new Response('Nicht unterstützter Anmelde-Anbieter.', { status: 400 });
  }

  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return new Response(
      'OAuth ist nicht konfiguriert. Bitte GITHUB_CLIENT_ID und GITHUB_CLIENT_SECRET ' +
        'in den Cloudflare-Pages-Einstellungen hinterlegen (siehe docs/cloudflare-setup.md).',
      { status: 500 },
    );
  }

  // Optionale Absicherung: nur erlaubte Hostnamen dürfen den Flow starten.
  const allowed = (env.ALLOWED_DOMAINS ?? '')
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
  if (allowed.length && !allowed.includes(url.hostname)) {
    return new Response('Domain nicht freigegeben.', { status: 403 });
  }

  const state = crypto.randomUUID();
  const redirectUri = `${url.origin}/api/callback`;

  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  authorize.searchParams.set('redirect_uri', redirectUri);
  authorize.searchParams.set('scope', url.searchParams.get('scope') || 'repo,user');
  authorize.searchParams.set('state', state);

  const headers = new Headers({ Location: authorize.href });
  headers.append('Set-Cookie', stateCookie(state));
  return new Response(null, { status: 302, headers });
}
