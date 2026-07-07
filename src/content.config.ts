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

const galleryImage = z.object({
  image: z.string(),
  alt: z.string().default(''),
  caption: z.string().optional(),
});

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().max(220),
    cover: z.string().optional(),
    coverAlt: z.string().default(''),
    gallery: z.array(galleryImage).default([]),
    draft: z.boolean().default(false),
  }),
});

const events = defineCollection({
  loader: glob({ base: './src/content/events', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
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

const gallery = defineCollection({
  loader: glob({ base: './src/content/gallery', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string().optional(),
    credit: z.string().optional(),
    images: z.array(galleryImage).min(1),
  }),
});

export const collections = { posts, events, groups, gallery };
