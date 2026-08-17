import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

/**
 * Inhalts-Schemas (Astro Content Layer).
 *
 * WICHTIG – Kopplung ans CMS: Die `base`-Pfade hier MÜSSEN mit den
 * `folder`-Pfaden in `public/admin/config.yml` übereinstimmen. Wird das eine
 * geändert, muss das andere mitgezogen werden.
 *
 * Bild-Felder sind `/uploads/...`-Strings (vom CMS befüllt). Fehlt ein Bild,
 * zeigt die Seite einen gekennzeichneten Platzhalter statt eines Stockfotos.
 */

/**
 * Bildausschnitt-Felder (siehe `src/lib/bild.ts`). Bewusst alle optional bzw.
 * mit neutralem Standard – ohne Angabe rendert die Seite exakt wie zuvor.
 */
const darstellung = {
  focusY: z.number().min(0).max(100).optional(),
  zoom: z.number().min(0.5).max(3).default(1),
  offsetX: z.string().default('0'),
  fit: z.enum(['cover', 'contain']).default('cover'),
};

const galleryImage = z.object({
  image: z.string(),
  alt: z.string().default(''),
  caption: z.string().optional(),
  ...darstellung,
});

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    dateLabel: z.string().optional(),
    hideDate: z.boolean().default(false),
    description: z.string().max(220),
    lead: z.string().optional(),
    /** Einleitung unterhalb statt oberhalb des Titelbildes anzeigen. */
    leadImContent: z.boolean().default(false),
    cover: z.string().optional(),
    coverAlt: z.string().default(''),
    /** Darstellung des Titelbildes IM Beitrag. */
    coverFocusY: z.number().min(0).max(100).optional(),
    coverZoom: z.number().min(0.5).max(3).default(1),
    coverOffsetX: z.string().default('0'),
    coverFit: z.enum(['cover', 'contain']).default('cover'),
    /** Darstellung des Titelbildes in der Übersichts-/Startseiten-Karte. */
    teaserFocusY: z.number().min(0).max(100).optional(),
    teaserZoom: z.number().min(0.5).max(3).default(1),
    gallery: z.array(galleryImage).default([]),
    draft: z.boolean().default(false),
  }),
});

const events = defineCollection({
  loader: glob({ base: './src/content/events', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    // Uhrzeit als "HH:MM" (optional – manche Termine sind ganztägig).
    time: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .optional(),
    location: z.string(),
    description: z.string().optional(),
    public: z.boolean().default(true),
    category: z
      .enum(['auftritt', 'training', 'veranstaltung', 'vereinsintern', 'sonstiges'])
      .default('sonstiges'),
  }),
});

const groups = defineCollection({
  loader: glob({ base: './src/content/groups', pattern: '**/*.md' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    ageGroup: z.string().optional(),
    trainingTime: z.string().optional(),
    contact: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().default(''),
    order: z.number().int().default(99),
  }),
});

/**
 * Galerie – ein Eintrag je Bereich der Seite /galerie.
 *
 * Die Bilder liegen unter `src/assets/gallery/` und werden über Astros
 * `image()`-Helfer eingebunden. Das ist zwingend: Nur so stehen Breite und
 * Höhe beim Bauen zur Verfügung, und daraus berechnet `galerie.astro` das
 * Seitenverhältnis (`--image-ratio`) für das Rasterlayout. Bilder unter
 * `public/` hätten diese Angaben nicht.
 *
 * Früher wurden Bereich, Reihenfolge und Bildbeschreibung aus dem DATEINAMEN
 * abgeleitet – redaktionell nicht pflegbar. Jetzt stehen sie hier.
 */
const gallery = defineCollection({
  loader: glob({ base: './src/content/gallery', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** Position des Bereichs auf der Seite (kleiner = weiter oben). */
      order: z.number().int().default(99),
      images: z
        .array(
          z.object({
            image: image(),
            alt: z.string().default(''),
            /** Feste 16:9-Darstellung statt des Originalformats. */
            crop169: z.boolean().default(false),
          }),
        )
        .default([]),
    }),
});

/**
 * Anlass-Block auf der Startseite (Jubiläum, Jahresabschluss, Tag der offenen
 * Tür …). Bewusst als Sammlung und nicht als Feld in `homepage.json`, weil das
 * Bild so über `image()` beim Bauen optimiert wird – mit `srcset` und festen
 * Maßen, also ohne Nachladeruckler.
 *
 * Der Block war zuvor als Jubiläumsabschnitt fest in `index.astro` verdrahtet
 * und ließ sich nach dem Ereignis nicht ohne Code-Änderung entfernen.
 */
const anlass = defineCollection({
  loader: glob({ base: './src/content/anlass', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      /** Nur bei `true` erscheint der Block auf der Startseite. */
      enabled: z.boolean().default(false),
      eyebrow: z.string().default(''),
      title: z.string(),
      text: z.string().default(''),
      image: image().optional(),
      imageAlt: z.string().default(''),
      /** Eckdaten, z. B. Einlass/Beginn/Eintritt. Höchstens vier. */
      facts: z
        .array(z.object({ label: z.string(), value: z.string() }))
        .max(4)
        .default([]),
      footnote: z.string().default(''),
    }),
});

/**
 * Vereinschronik auf /verein. Lag zuvor als 30-stellige Konstante im Markup –
 * der Eintrag zum Jubiläum 2026 wäre so nur über GitHub möglich gewesen.
 */
const chronik = defineCollection({
  loader: glob({ base: './src/content/chronik', pattern: '**/*.md' }),
  schema: z.object({
    year: z.string(),
    title: z.string(),
    text: z.string(),
    /** Überschrift nicht umbrechen (für kurze, feststehende Titel). */
    nowrap: z.boolean().default(false),
  }),
});

export const collections = { posts, events, groups, gallery, anlass, chronik };
