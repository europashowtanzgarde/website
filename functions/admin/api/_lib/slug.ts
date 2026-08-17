/**
 * Dateinamen aus Titeln bilden.
 *
 * Deutsche Umlaute werden ausgeschrieben, nicht weggeworfen: „Jubiläumsfeier"
 * wird zu `jubilaeumsfeier` und nicht zu `jubilumsfeier`. Das ist der
 * Unterschied zwischen einem lesbaren und einem verstümmelten Dateinamen.
 */

const ERSATZ: Record<string, string> = {
  ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'ae', Ö: 'oe', Ü: 'ue', ß: 'ss',
  á: 'a', à: 'a', â: 'a', å: 'a', ã: 'a',
  é: 'e', è: 'e', ê: 'e', ë: 'e',
  í: 'i', ì: 'i', î: 'i', ï: 'i',
  ó: 'o', ò: 'o', ô: 'o', õ: 'o', ø: 'o',
  ú: 'u', ù: 'u', û: 'u',
  ç: 'c', ñ: 'n', ý: 'y',
};

export function slugify(text: string): string {
  return text
    .trim()
    .replace(/[äöüÄÖÜßáàâåãéèêëíìîïóòôõøúùûçñý]/g, (z) => ERSATZ[z] ?? z)
    .toLowerCase()
    // Typografische Zeichen und alles Übrige zu Bindestrichen.
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

/** Dateiname für ein hochgeladenes Bild, inklusive Endung. */
export function bildSlug(dateiname: string, format = 'webp'): string {
  const punkt = dateiname.lastIndexOf('.');
  const basis = punkt > 0 ? dateiname.slice(0, punkt) : dateiname;
  return `${slugify(basis) || 'bild'}.${format}`;
}

/**
 * Freien Namen finden. `belegt` sind die bereits vorhandenen Namen (ohne
 * Endung bzw. mit – je nach Aufrufer, aber einheitlich).
 */
export function freierName(wunsch: string, belegt: Set<string>): string {
  if (!belegt.has(wunsch)) return wunsch;

  const punkt = wunsch.lastIndexOf('.');
  const basis = punkt > 0 ? wunsch.slice(0, punkt) : wunsch;
  const endung = punkt > 0 ? wunsch.slice(punkt) : '';

  for (let n = 2; n < 500; n++) {
    const kandidat = `${basis}-${n}${endung}`;
    if (!belegt.has(kandidat)) return kandidat;
  }
  throw new Error('Kein freier Dateiname gefunden.');
}

/** Termin-Dateiname: Datum voran, damit die Ablage chronologisch bleibt. */
export function terminSlug(datum: string, titel: string): string {
  const tag = /^\d{4}-\d{2}-\d{2}$/.test(datum) ? datum : '';
  const rest = slugify(titel) || 'termin';
  return tag ? `${tag}-${rest}` : rest;
}
