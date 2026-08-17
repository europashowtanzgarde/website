/**
 * Prüfung der Eingaben, bevor irgendetwas ins Repository geschrieben wird.
 *
 * Das ist die wichtigste Einzelmaßnahme gegen „die Redaktion legt die Website
 * lahm": Cloudflare Pages veröffentlicht nur erfolgreiche Builds. Käme ein
 * Eintrag durch, den das Inhalts-Schema beim Bauen ablehnt, bliebe die Seite
 * auf dem letzten guten Stand stehen – und ab da käme keine Änderung mehr
 * durch, ohne dass jemand merkt warum.
 *
 * WICHTIG – Kopplung: Die Regeln hier müssen zu `src/content.config.ts` und
 * `src/lib/settings.ts` passen. Wird dort ein Feld ergänzt oder verschärft,
 * muss es hier mitgezogen werden. Eine gemeinsame Datei ist nicht möglich,
 * weil die Inhalts-Schemas Astro-eigene Helfer (`image()`) verwenden, die es
 * in einer Cloudflare-Function nicht gibt.
 *
 * Alle Meldungen sind deutscher Klartext und nennen das betroffene Feld,
 * damit der Editor direkt dorthin springen kann.
 */

export interface Pruefergebnis {
  ok: boolean;
  meldung?: string;
  feld?: string;
  /** Bereinigte Daten – nur bei `ok`. */
  daten?: Record<string, unknown>;
}

const fehlt = (feld: string, text: string): Pruefergebnis => ({ ok: false, feld, meldung: text });

// --- Bausteine ---------------------------------------------------------------

function text(wert: unknown): string {
  return typeof wert === 'string' ? wert.trim() : '';
}

function bool(wert: unknown, standard = false): boolean {
  return typeof wert === 'boolean' ? wert : standard;
}

function zahl(wert: unknown, standard: number): number {
  const n = typeof wert === 'number' ? wert : Number(wert);
  return Number.isFinite(n) ? n : standard;
}

const IST_DATUM = /^\d{4}-\d{2}-\d{2}$/;
const IST_UHRZEIT = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Gültiges Kalenderdatum? `2026-02-31` besteht das Muster, aber nicht diese Prüfung. */
function istEchtesDatum(wert: string): boolean {
  if (!IST_DATUM.test(wert)) return false;
  const [j, m, t] = wert.split('-').map(Number);
  const d = new Date(Date.UTC(j, m - 1, t));
  return d.getUTCFullYear() === j && d.getUTCMonth() === m - 1 && d.getUTCDate() === t;
}

/** Bildliste eines Beitrags bzw. eines Galeriebereichs. */
function pruefeBilder(roh: unknown, feldName: string, altPflicht: boolean): Pruefergebnis {
  if (roh === undefined || roh === null) return { ok: true, daten: { [feldName]: [] } };
  if (!Array.isArray(roh)) return fehlt(feldName, 'Die Bilderliste ist beschädigt. Bitte lade die Seite neu.');

  const bilder: Record<string, unknown>[] = [];
  for (const [i, eintrag] of roh.entries()) {
    if (!eintrag || typeof eintrag !== 'object') {
      return fehlt(`${feldName}.${i}`, `Bild ${i + 1} ist unvollständig.`);
    }
    const e = eintrag as Record<string, unknown>;
    const pfad = text(e.image);
    if (!pfad) return fehlt(`${feldName}.${i}.image`, `Bei Bild ${i + 1} fehlt die Bilddatei.`);

    const alt = text(e.alt);
    if (altPflicht && !alt) {
      return fehlt(
        `${feldName}.${i}.alt`,
        `Bitte beschreibe kurz, was auf Bild ${i + 1} zu sehen ist. Das hilft blinden Menschen und Suchmaschinen.`,
      );
    }

    const bild: Record<string, unknown> = { image: pfad, alt };
    if (text(e.caption)) bild.caption = text(e.caption);
    if (e.focusY !== undefined && e.focusY !== null && e.focusY !== '') {
      const f = zahl(e.focusY, 50);
      if (f < 0 || f > 100) return fehlt(`${feldName}.${i}.focusY`, 'Der Bildausschnitt muss zwischen 0 und 100 liegen.');
      bild.focusY = f;
    }
    const zoom = zahl(e.zoom, 1);
    if (zoom < 0.5 || zoom > 3) return fehlt(`${feldName}.${i}.zoom`, 'Die Vergrößerung muss zwischen 0,5 und 3 liegen.');
    if (zoom !== 1) bild.zoom = zoom;
    if (text(e.offsetX) && text(e.offsetX) !== '0') bild.offsetX = text(e.offsetX);
    if (e.fit === 'contain') bild.fit = 'contain';
    if (bool(e.crop169)) bild.crop169 = true;

    bilder.push(bild);
  }
  return { ok: true, daten: { [feldName]: bilder } };
}

// --- Beiträge ----------------------------------------------------------------

export function pruefeBeitrag(roh: Record<string, unknown>): Pruefergebnis {
  const titel = text(roh.title);
  if (!titel) return fehlt('title', 'Bitte gib dem Beitrag einen Titel.');
  if (titel.length > 120) return fehlt('title', 'Der Titel ist zu lang (höchstens 120 Zeichen).');

  const datum = text(roh.date);
  if (!istEchtesDatum(datum)) return fehlt('date', 'Bitte wähle ein gültiges Datum.');

  const beschreibung = text(roh.description);
  if (!beschreibung) return fehlt('description', 'Bitte schreibe einen kurzen Text für die Übersicht.');
  if (beschreibung.length > 220) {
    return fehlt('description', `Der Kurztext ist zu lang: ${beschreibung.length} von höchstens 220 Zeichen.`);
  }

  const bilder = pruefeBilder(roh.gallery, 'gallery', true);
  if (!bilder.ok) return bilder;

  const cover = text(roh.cover);
  if (!cover && Array.isArray(roh.gallery) && roh.gallery.length > 0) {
    return fehlt('cover', 'Weitere Bilder brauchen ein Titelbild. Bitte wähle zuerst eines aus.');
  }
  if (cover && !text(roh.coverAlt)) {
    return fehlt('coverAlt', 'Bitte beschreibe kurz, was auf dem Titelbild zu sehen ist.');
  }

  const daten: Record<string, unknown> = {
    title: titel,
    date: datum,
    description: beschreibung,
    draft: bool(roh.draft),
  };
  if (text(roh.dateLabel)) daten.dateLabel = text(roh.dateLabel);
  if (bool(roh.hideDate)) daten.hideDate = true;
  if (text(roh.lead)) daten.lead = text(roh.lead);
  if (bool(roh.leadImContent)) daten.leadImContent = true;
  if (cover) {
    daten.cover = cover;
    daten.coverAlt = text(roh.coverAlt);
    if (roh.coverFocusY !== undefined && roh.coverFocusY !== null && roh.coverFocusY !== '') {
      daten.coverFocusY = zahl(roh.coverFocusY, 50);
    }
    if (zahl(roh.coverZoom, 1) !== 1) daten.coverZoom = zahl(roh.coverZoom, 1);
    if (text(roh.coverOffsetX) && text(roh.coverOffsetX) !== '0') daten.coverOffsetX = text(roh.coverOffsetX);
    if (roh.coverFit === 'contain') daten.coverFit = 'contain';
    if (roh.teaserFocusY !== undefined && roh.teaserFocusY !== null && roh.teaserFocusY !== '') {
      daten.teaserFocusY = zahl(roh.teaserFocusY, 50);
    }
    if (zahl(roh.teaserZoom, 1) !== 1) daten.teaserZoom = zahl(roh.teaserZoom, 1);
  }
  const galerie = bilder.daten!.gallery as unknown[];
  if (galerie.length > 0) daten.gallery = galerie;

  return { ok: true, daten };
}

// --- Termine -----------------------------------------------------------------

const KATEGORIEN = ['auftritt', 'training', 'veranstaltung', 'vereinsintern', 'sonstiges'];

export function pruefeTermin(roh: Record<string, unknown>): Pruefergebnis {
  const titel = text(roh.title);
  if (!titel) return fehlt('title', 'Bitte gib dem Termin einen Titel.');
  if (titel.length > 120) return fehlt('title', 'Der Titel ist zu lang (höchstens 120 Zeichen).');

  const datum = text(roh.date);
  if (!istEchtesDatum(datum)) return fehlt('date', 'Bitte wähle ein gültiges Datum.');

  const ende = text(roh.endDate);
  if (ende) {
    if (!istEchtesDatum(ende)) return fehlt('endDate', 'Bitte wähle ein gültiges Enddatum.');
    if (ende < datum) return fehlt('endDate', 'Das Enddatum liegt vor dem Datum des Termins.');
  }

  const uhrzeit = text(roh.time);
  if (uhrzeit && !IST_UHRZEIT.test(uhrzeit)) {
    return fehlt('time', 'Bitte gib die Uhrzeit im Format 19:30 an.');
  }

  const ort = text(roh.location);
  if (!ort) return fehlt('location', 'Bitte gib an, wo der Termin stattfindet.');

  const kategorie = text(roh.category) || 'sonstiges';
  if (!KATEGORIEN.includes(kategorie)) return fehlt('category', 'Diese Kategorie gibt es nicht.');

  const daten: Record<string, unknown> = {
    title: titel,
    date: datum,
    location: ort,
    public: bool(roh.public, true),
    category: kategorie,
  };
  if (ende) daten.endDate = ende;
  if (uhrzeit) daten.time = uhrzeit;
  if (text(roh.description)) daten.description = text(roh.description);
  if (text(roh.dateLabel)) daten.dateLabel = text(roh.dateLabel);
  if (bool(roh.hideDate)) daten.hideDate = true;

  return { ok: true, daten };
}

// --- Garden ------------------------------------------------------------------

export function pruefeGarde(roh: Record<string, unknown>): Pruefergebnis {
  const name = text(roh.name);
  if (!name) return fehlt('name', 'Bitte gib der Garde einen Namen.');

  const beschreibung = text(roh.description);
  if (!beschreibung) return fehlt('description', 'Bitte beschreibe die Garde in zwei, drei Sätzen.');

  const bild = text(roh.image);
  if (bild && !text(roh.imageAlt)) {
    return fehlt('imageAlt', 'Bitte beschreibe kurz, was auf dem Bild zu sehen ist.');
  }

  const daten: Record<string, unknown> = {
    name,
    description: beschreibung,
    order: Math.round(zahl(roh.order, 99)),
  };
  for (const feld of ['ageGroup', 'trainingTime', 'contact'] as const) {
    if (text(roh[feld])) daten[feld] = text(roh[feld]);
  }
  if (bild) {
    daten.image = bild;
    daten.imageAlt = text(roh.imageAlt);
  }
  return { ok: true, daten };
}

// --- Galeriebereich ----------------------------------------------------------

export function pruefeGaleriebereich(roh: Record<string, unknown>): Pruefergebnis {
  const titel = text(roh.title);
  if (!titel) return fehlt('title', 'Dem Bereich fehlt der Name.');

  const bilder = pruefeBilder(roh.images, 'images', false);
  if (!bilder.ok) return bilder;

  return {
    ok: true,
    daten: {
      title: titel,
      order: Math.round(zahl(roh.order, 99)),
      images: bilder.daten!.images,
    },
  };
}

// --- Chronik -----------------------------------------------------------------

export function pruefeChronik(roh: Record<string, unknown>): Pruefergebnis {
  const jahr = text(roh.year);
  if (!/^\d{4}$/.test(jahr)) return fehlt('year', 'Bitte gib eine vierstellige Jahreszahl an, z. B. 2026.');

  const titel = text(roh.title);
  if (!titel) return fehlt('title', 'Bitte gib dem Eintrag eine Überschrift.');

  const inhalt = text(roh.text);
  if (!inhalt) return fehlt('text', 'Bitte beschreibe kurz, was in diesem Jahr passiert ist.');

  const daten: Record<string, unknown> = { year: jahr, title: titel, text: inhalt };
  if (bool(roh.nowrap)) daten.nowrap = true;
  return { ok: true, daten };
}

// --- Anlass-Block ------------------------------------------------------------

export function pruefeAnlass(roh: Record<string, unknown>): Pruefergebnis {
  const aktiv = bool(roh.enabled);
  const titel = text(roh.title);

  // Nur wenn der Block auch angezeigt wird, muss er vollständig sein –
  // sonst könnte man ihn nicht abschalten und in Ruhe später befüllen.
  if (aktiv && !titel) return fehlt('title', 'Bitte gib dem Hinweis eine Überschrift.');

  const bild = text(roh.image);
  if (bild && !text(roh.imageAlt)) {
    return fehlt('imageAlt', 'Bitte beschreibe kurz, was auf dem Bild zu sehen ist.');
  }

  const rohFakten = Array.isArray(roh.facts) ? roh.facts : [];
  if (rohFakten.length > 4) {
    return fehlt('facts', 'Höchstens vier Eckdaten – sonst wird die Darstellung zu eng.');
  }
  const facts: { label: string; value: string }[] = [];
  for (const [i, f] of rohFakten.entries()) {
    const e = (f ?? {}) as Record<string, unknown>;
    const label = text(e.label);
    const value = text(e.value);
    if (!label && !value) continue;
    if (!label || !value) {
      return fehlt(`facts.${i}`, `Bei Eckdatum ${i + 1} fehlt die Bezeichnung oder der Wert.`);
    }
    facts.push({ label, value });
  }

  const daten: Record<string, unknown> = { enabled: aktiv, title: titel || 'Hinweis' };
  for (const feld of ['eyebrow', 'text', 'footnote'] as const) {
    if (text(roh[feld])) daten[feld] = text(roh[feld]);
  }
  if (bild) {
    daten.image = bild;
    daten.imageAlt = text(roh.imageAlt);
  }
  if (facts.length > 0) daten.facts = facts;
  return { ok: true, daten };
}

// --- Einstellungen -----------------------------------------------------------

/**
 * Website-Einstellungen. Pflichtfelder entsprechen `siteSchema` in
 * `src/lib/settings.ts` – fehlt dort eines, bricht der Build.
 */
export function pruefeWebsiteEinstellungen(roh: Record<string, unknown>): Pruefergebnis {
  for (const feld of ['name', 'shortName', 'claim', 'email', 'location'] as const) {
    if (!text(roh[feld])) return fehlt(feld, 'Dieses Feld darf nicht leer bleiben.');
  }
  const email = text(roh.email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return fehlt('email', 'Bitte gib eine gültige E-Mail-Adresse an.');
  }

  const impressum = (roh.impressum ?? {}) as Record<string, unknown>;
  for (const feld of ['verein', 'vertretenDurch', 'strasse', 'plzOrt'] as const) {
    if (!text(impressum[feld])) {
      return fehlt(`impressum.${feld}`, 'Impressumsangaben sind rechtlich vorgeschrieben und dürfen nicht fehlen.');
    }
  }
  return { ok: true, daten: roh };
}

export function pruefeStartseite(roh: Record<string, unknown>): Pruefergebnis {
  for (const feld of ['heroKicker', 'heroTitle', 'heroHighlight', 'heroText', 'ctaLabel', 'ctaLink'] as const) {
    if (!text(roh[feld])) return fehlt(feld, 'Dieses Feld darf nicht leer bleiben.');
  }
  if (text(roh.heroImage) && !text(roh.heroImageAlt)) {
    return fehlt('heroImageAlt', 'Bitte beschreibe kurz, was auf dem großen Bild zu sehen ist.');
  }
  return { ok: true, daten: roh };
}
