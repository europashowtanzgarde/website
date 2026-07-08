// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// WICHTIG: `site` muss die echte Produktions-Domain sein.
// Sie steuert Canonical-URLs, Open-Graph-Bilder und die sitemap.
// Die Domain europashowtanzgarde.de liegt bereits bei Cloudflare.
// TODO (Verein): Prüfen, ob als Hauptadresse "www" oder die nackte Domain
// (ohne www) verwendet werden soll, und ggf. hier anpassen.
const SITE_URL = 'https://www.europashowtanzgarde.de';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  // Der Dev-/Preview-Server nutzt PORT aus der Umgebung, falls gesetzt.
  server: { port: process.env.PORT ? Number(process.env.PORT) : 4321 },
  // Statische Ausgabe -> Cloudflare Pages (kein Adapter nötig; die
  // OAuth-Endpunkte liegen als Cloudflare Pages Functions in /functions).
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      // /admin (Redaktion) gehört nicht in die Sitemap.
      filter: (page) => !page.includes('/admin'),
    }),
  ],
});
