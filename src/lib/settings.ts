import { z } from 'astro:schema';
import siteRaw from '../data/site.json';
import homeRaw from '../data/homepage.json';

/**
 * Globale Einstellungen & Startseiten-Inhalte als typsichere Singletons.
 *
 * Die JSON-Dateien in `src/data/` werden im CMS über die Sammlung
 * „Einstellungen" gepflegt. Beim Build werden sie hier per zod geprüft –
 * eine kaputte Eingabe bricht den Build SICHTBAR ab (statt still zu brechen).
 */

const siteSchema = z.object({
  name: z.string(),
  shortName: z.string(),
  claim: z.string(),
  email: z.string(),
  location: z.string(),
  social: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    youtube: z.string().optional(),
  }),
  impressum: z.object({
    verein: z.string(),
    vertretenDurch: z.string(),
    strasse: z.string(),
    plzOrt: z.string(),
    register: z.string().optional(),
    registerHinweis: z.string().optional(),
  }),
  footerText: z.string().default(''),
});

const homepageSchema = z.object({
  heroKicker: z.string(),
  heroTitle: z.string(),
  heroHighlight: z.string(),
  heroText: z.string(),
  ctaLabel: z.string(),
  ctaLink: z.string(),
  ctaSecondaryLabel: z.string().optional(),
  ctaSecondaryLink: z.string().optional(),
  marqueeWords: z.array(z.string()).default([]),
  notice: z
    .object({
      enabled: z.boolean().default(false),
      text: z.string().default(''),
      link: z.string().optional(),
      linkLabel: z.string().optional(),
    })
    .default({ enabled: false, text: '' }),
  highlights: z
    .array(
      z.object({
        title: z.string(),
        text: z.string(),
        link: z.string(),
        linkLabel: z.string(),
      }),
    )
    .default([]),
  vereinTeaserTitle: z.string(),
  vereinTeaserText: z.string(),
});

export const site = siteSchema.parse(siteRaw);
export const homepage = homepageSchema.parse(homeRaw);

export type SiteSettings = typeof site;
export type Homepage = typeof homepage;
