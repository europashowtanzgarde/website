/**
 * Bildausschnitt-Steuerung für redaktionell gepflegte Bilder.
 *
 * Früher standen diese Werte fest im Code – pro Dateiname bzw. pro Beitrags-ID
 * (in `[slug].astro`, `aktuelles/index.astro` und `index.astro`). Neue Beiträge
 * konnten sie deshalb nicht erben. Jetzt kommen sie aus dem Frontmatter und
 * sind über den Redaktionsbereich einstellbar.
 *
 * WICHTIG – `focusY` bleibt bewusst optional: Ist es nicht gesetzt, wird gar
 * kein `object-position` ausgegeben. Das entspricht dem CSS-Standard
 * (`50% 50%`) und hält die Ausgabe für Bilder ohne Sonderwunsch unverändert.
 */

export interface BildDarstellung {
  /** Vertikaler Bildausschnitt in Prozent (0 = oben, 100 = unten). */
  focusY?: number;
  /** Vergrößerung; 1 = unverändert. */
  zoom?: number;
  /** Horizontale Feinverschiebung, z. B. „2%". */
  offsetX?: string;
  /** `cover` schneidet zu, `contain` zeigt das ganze Bild. */
  fit?: 'cover' | 'contain';
}

/** Übersetzt die Frontmatter-Felder in die Props von `CmsImage`. */
export function bildProps(d: BildDarstellung | undefined) {
  return {
    position: d?.focusY === undefined ? undefined : `center ${d.focusY}%`,
    scale: d?.zoom ?? 1,
    offsetX: d?.offsetX ?? '0',
    fit: d?.fit ?? 'cover',
  };
}
