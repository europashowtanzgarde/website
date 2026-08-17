/**
 * Umgebungsvariablen des Redaktionsbereichs.
 *
 * Alle werden in den Cloudflare-Pages-Einstellungen gesetzt
 * (siehe docs/cloudflare-setup.md). Der GitHub-Token ist ein Secret und
 * verlässt den Server nie – der Browser bekommt ihn zu keinem Zeitpunkt.
 */
export interface Env {
  /** Fine-grained PAT des Redaktions-Bots. Nur dieses Repo, nur „Contents". */
  CMS_GITHUB_TOKEN: string;
  /** Zielrepository, Form „inhaber/name". */
  GITHUB_REPO: string;
  /** Branch, in den geschrieben wird. Ohne Angabe „main". */
  GITHUB_BRANCH?: string;
  /** Kommagetrennte Liste erlaubter Hostnamen. */
  ALLOWED_DOMAINS: string;
  /** Cloudflare-Access-Team-Domain, z. B. https://verein.cloudflareaccess.com */
  CF_ACCESS_TEAM_DOMAIN: string;
  /** AUD-Tag der Access-Anwendung. */
  CF_ACCESS_AUD: string;
  /**
   * Nur für die lokale Entwicklung: hebt die Access-Prüfung auf.
   * In der Produktion NIEMALS setzen – die Prüfung ist der einzige Schutz
   * davor, dass Fremde über die API ins Repo schreiben.
   */
  ADMIN_DEV_BYPASS?: string;
}

/** Fehlende Pflichtvariablen. Leeres Ergebnis heißt: alles vorhanden. */
export function fehlendeKonfiguration(env: Env): string[] {
  const pflicht: (keyof Env)[] = ['CMS_GITHUB_TOKEN', 'GITHUB_REPO', 'ALLOWED_DOMAINS'];
  if (!istEntwicklung(env)) {
    pflicht.push('CF_ACCESS_TEAM_DOMAIN', 'CF_ACCESS_AUD');
  }
  return pflicht.filter((name) => !String(env[name] ?? '').trim());
}

/**
 * Entwicklungsmodus? Bewusst eng gefasst: Der Schalter greift nur, wenn er
 * ausdrücklich auf „ja" steht. Ein leerer oder anderer Wert zählt als
 * Produktion – ein Tippfehler öffnet also nicht versehentlich den Zugang.
 */
export function istEntwicklung(env: Env): boolean {
  return env.ADMIN_DEV_BYPASS === 'ja-nur-lokal';
}

export function repoTeile(env: Env): { owner: string; repo: string; branch: string } {
  const [owner, repo] = String(env.GITHUB_REPO ?? '').split('/');
  return { owner, repo, branch: env.GITHUB_BRANCH?.trim() || 'main' };
}
