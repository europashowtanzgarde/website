import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * Zentrale Abfrage-Helfer für Inhalte: Entwurfs-Filter, Termin-Logik,
 * Sortierungen. Kapselt zwei knifflige Details:
 *  - Entwürfe (`draft`) sind lokal sichtbar, im Build ausgeblendet.
 *  - „Kommend vs. vergangen" wird gegen HEUTE in Europe/Berlin verglichen
 *    (nicht UTC – der Build läuft auf UTC-Runnern, sonst Off-by-one abends).
 */

/** Heutiges Datum als "YYYY-MM-DD" in der Zeitzone Europe/Berlin. */
function todayInBerlin(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Datum eines Eintrags als "YYYY-MM-DD" (aus UTC-Mitternacht rekonstruiert). */
function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ---- Beiträge -------------------------------------------------------------

export async function getPublishedPosts(): Promise<CollectionEntry<'posts'>[]> {
  const posts = await getCollection('posts', ({ data }) =>
    import.meta.env.DEV ? true : !data.draft,
  );
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

// ---- Termine --------------------------------------------------------------

async function getPublicEvents(): Promise<CollectionEntry<'events'>[]> {
  return getCollection('events', ({ data }) =>
    import.meta.env.DEV ? true : data.public,
  );
}

/** Kommende (und heutige) Termine, aufsteigend nach Datum. */
export async function getUpcomingEvents(
  limit?: number,
): Promise<CollectionEntry<'events'>[]> {
  const today = todayInBerlin();
  const events = (await getPublicEvents())
    .filter((e) => dateKey(e.data.date) >= today)
    .sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
  return typeof limit === 'number' ? events.slice(0, limit) : events;
}

/** Vergangene Termine (Rückblick), absteigend nach Datum. */
export async function getPastEvents(
  limit?: number,
): Promise<CollectionEntry<'events'>[]> {
  const today = todayInBerlin();
  const events = (await getPublicEvents())
    .filter((e) => dateKey(e.data.date) < today)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  return typeof limit === 'number' ? events.slice(0, limit) : events;
}

// ---- Garden / Gruppen -----------------------------------------------------

export async function getGroups(): Promise<CollectionEntry<'groups'>[]> {
  const groups = await getCollection('groups');
  return groups.sort(
    (a, b) =>
      a.data.order - b.data.order || a.data.name.localeCompare(b.data.name, 'de'),
  );
}

// ---- Galerie --------------------------------------------------------------

export async function getGalleryAlbums(): Promise<CollectionEntry<'gallery'>[]> {
  const albums = await getCollection('gallery');
  return albums.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
