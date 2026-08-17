// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

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
  markdown: {
    /*
      Markdown erlaubt standardmäßig eingebettetes HTML – ein <script> in einem
      Beitrag landete damit ungefiltert auf der öffentlichen Website. Da die
      Beiträge über /admin geschrieben werden (und der Editor formatierten Text
      verarbeitet, in den beim Einfügen aus Word oder dem Web fremdes Markup
      geraten kann), wird beim Bauen gefiltert.

      Diese Sperre greift auch, wenn jemand die Markdown-Datei direkt über
      GitHub bearbeitet – anders als eine Prüfung im Editor.

      Erlaubt ist genau das, was die Formatierleiste erzeugt.
    */
    rehypePlugins: [
      [
        rehypeSanitize,
        {
          ...defaultSchema,
          tagNames: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'h2', 'h3', 'h4', 'a', 'br', 'blockquote'],
          attributes: {
            a: ['href', 'title'],
          },
          protocols: {
            href: ['http', 'https', 'mailto', 'tel'],
          },
        },
      ],
    ],
  },
  integrations: [
    sitemap({
      // /admin (Redaktion) gehört nicht in die Sitemap.
      filter: (page) => !page.includes('/admin'),
    }),
  ],
});
