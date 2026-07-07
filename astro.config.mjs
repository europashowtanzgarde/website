// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// WICHTIG: `site` muss die spätere echte Produktions-Domain sein.
// Sie steuert Canonical-URLs, Open-Graph-Bilder und die sitemap.
// TODO (Verein): Vor dem Live-Gang die tatsächliche Domain eintragen.
// Aktueller Platzhalter = die historische Vereinsdomain.
const SITE_URL = 'https://www.europa-showtanzgarde.de';

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
