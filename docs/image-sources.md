# Bildquellen & rechtliche Hinweise

Dieses Dokument hält fest, woher jedes Bild auf der Website stammt und was
rechtlich zu beachten ist. **Grundregeln des Projekts:**

- ❌ **Keine Stockfotos.**
- ❌ **Keine fremden Vereinsbilder.**
- ❌ **Keine Hotlinks** zu Facebook/Instagram (Bilder werden nie direkt von dort
  eingebunden).
- ✅ Bilder liegen **lokal** im Projekt und werden optimiert.
- ✅ Zu jedem Bild gehört eine **Bildbeschreibung (Alt-Text)**.

---

## Aktuell im Projekt enthaltene Bilder

| Datei | Quelle | Inhalt | Hinweis |
| --- | --- | --- | --- |
| `input/Logo_Europashowtanzgarde.png` | Vom Verein bereitgestellt (Ordner `input/`) | Vereinslogo: blauer Leucht-Schriftzug „EUROPA … TANZGARDE" + rotes „Show", auf grauem Hintergrund | Original, unverändert. Dient nur als Quelle für die Aufbereitung, wird **nicht** ausgeliefert. |
| `src/assets/logo.png` | Automatisch aus dem Logo erzeugt (`npm run logo`) | Freigestelltes Logo (transparent) | Grauer Hintergrund per Skript entfernt (Sättigungs-Verfahren). |
| `src/assets/logo-square.png` | Automatisch erzeugt | Logo auf Bühnenblau, quadratisch | Für Kacheln/Icons. |
| `public/apple-touch-icon.png` | Automatisch erzeugt | Logo auf Bühnenblau, 180×180 | Startbildschirm-Icon (iOS). |
| `public/og-default.png` | Automatisch erzeugt | Logo auf Bühnenblau, 1200×630 | Vorschaubild beim Teilen (Social Media). |
| `public/favicon.svg` | Selbst gestaltet (Code) | Monogramm „E" in Markenfarben mit rotem Diagonal-Akzent | Reines SVG, kein Fremdmaterial. |
| Platzhalter (Bühnenlicht-Grafiken) | Selbst gestaltet (CSS/SVG, Komponente `Placeholder.astro`) | Abstrakte Bühnenlicht-Optik mit „Foto folgt" | Kein Bild, nur Grafik – klar als Platzhalter erkennbar. |

Alle abgeleiteten Logo-Dateien lassen sich jederzeit mit `npm run logo` neu
erzeugen. Die Freistellungs-Schwellwerte stehen in `scripts/prepare-logo.mjs`.

---

## Rechtlicher Hinweis zum Logo

Das Logo wurde vom Verein bereitgestellt. Es wird davon ausgegangen, dass der
Verein die Nutzungsrechte an seinem eigenen Logo besitzt.

> **TODO (Verein):** Bitte bestätigen, dass das Logo frei für die Website
> verwendet werden darf, und ggf. den Urheber/die Urheberin des Logos vermerken.

---

## Noch einzupflegen: echte Vereinsfotos

Die Website ist so gebaut, dass fehlende Fotos automatisch durch dezente
Bühnenlicht-Platzhalter ersetzt werden. Es wurden **bewusst keine Bilder von
Facebook/Instagram übernommen**, da die Rechte- und Persönlichkeitslage dort
nicht sicher geklärt werden kann.

**Empfohlenes Vorgehen für den Verein:**

1. Eigene Fotos aus Auftritten, Training und Vereinsleben sammeln.
2. Sicherstellen, dass die Rechte am Foto beim Verein liegen und die
   abgebildeten Personen mit einer Veröffentlichung **einverstanden** sind
   (schriftliche Einwilligung, insbesondere bei Minderjährigen über die
   Erziehungsberechtigten – Stichwort DSGVO & Recht am eigenen Bild).
3. Fotos über `/admin` hochladen (werden automatisch optimiert). Immer eine
   kurze **Bildbeschreibung** ergänzen.
4. Bei Fotos von externen Fotograf:innen den **Fotohinweis** im jeweiligen
   Galerie-Album eintragen.

> **TODO (Verein):** Titelbilder für Beiträge, Bilder für die drei Garden und
> die ersten Galerie-Alben mit echten, freigegebenen Vereinsfotos befüllen.
