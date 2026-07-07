/**
 * Deutsche Datums-/Zeitformatierung. Formatter einmal pro Modul erstellen.
 */

const long = new Intl.DateTimeFormat('de-DE', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const short = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const weekday = new Intl.DateTimeFormat('de-DE', { weekday: 'long' });
const dayNum = new Intl.DateTimeFormat('de-DE', { day: '2-digit' });
const monthShort = new Intl.DateTimeFormat('de-DE', { month: 'short' });
const monthYear = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' });

/** „7. Juli 2026" */
export const formatDate = (d: Date): string => long.format(d);

/** „07.07.2026" */
export const formatDateShort = (d: Date): string => short.format(d);

/** „Montag" */
export const formatWeekday = (d: Date): string => weekday.format(d);

/** „07" – Tageszahl für Datums-Kacheln */
export const formatDay = (d: Date): string => dayNum.format(d);

/** „Juli" (kurz) – für Datums-Kacheln */
export const formatMonthShort = (d: Date): string =>
  monthShort.format(d).replace('.', '');

/** „Juli 2026" – für Galerie-Alben */
export const formatMonthYear = (d: Date): string => monthYear.format(d);

/** „19:30 Uhr" */
export const formatTime = (time?: string): string | undefined =>
  time ? `${time} Uhr` : undefined;

/** ISO-Datum (YYYY-MM-DD) für <time datetime> und JSON-LD. */
export const isoDate = (d: Date): string => d.toISOString().slice(0, 10);
