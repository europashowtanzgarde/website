# Design-Notizen

Das Erscheinungsbild ist bewusst **aus dem Vereinslogo und dem Vereinszweck**
abgeleitet – nicht aus einer beliebigen Vorlage. Ziel: freundlich, lebendig,
bühnennah und regional verwurzelt, ohne Karnevals-Kitsch und ohne generische
„Agentur-Optik".

## Designidee: „Formation & Bühnenplakat"

Zwei Motive ziehen sich durch die ganze Seite und geben ihr Charakter:

1. **Die Diagonale.** Im Logo sitzt das rote „Show" schräg über den blockigen
   Versalien. Diese Diagonale wird zum Signaturelement: schräg angeschnittene
   Sektionen (`clip-path`), ein diagonal laufendes Schlagwort-Laufband, geneigte
   Akzent-Wörter, schräg „wischende" Unterstreichungen in der Navigation.
   Bewegung – eingefroren im Layout.
2. **Das Formations-Raster.** Eine Tanzformation ist ein Muster aus Menschen im
   Raum. Als feines Punktraster taucht dieses Motiv als Hintergrundtextur immer
   wieder auf (Hero, Seitenköpfe, Footer, Platzhalter).

Dazu kommt ein **Rhythmus aus hell und dunkel**: dunkle „Bühnen-bei-Nacht"-
Bereiche wechseln sich mit hellen Cremeweiß-Sektionen ab – wie Szenenwechsel.
Das vermeidet den typischen, durchgehend dunklen „KI-Look".

## Farbpalette

Aus dem Logo gesampelt, als CSS-Variablen in `src/styles/tokens.css`:

| Rolle              | Farbe        | Verwendung                          |
| ------------------ | ------------ | ----------------------------------- |
| Bühnenblau (Basis) | `#2438b8` / `#4b63e6` | dominante Marken- und Akzentfarbe |
| Show-Rot (Akzent)  | `#e2242c`    | sparsam, hochwirksam (Buttons, Highlights) |
| Nachtblau          | `#0c1024`–`#1a2044` | Hintergründe, „Bühne bei Nacht"     |
| Cremeweiß          | `#faf6ef`    | Text auf Dunkel & helle Sektionen   |
| Bernstein          | `#f5b942`    | warmes „Bodenlicht", Kategorie-Akzent |

Prinzip: **eine dominante Farbe (Blau) + ein scharfer Akzent (Rot)** statt einer
zaghaft verteilten Palette. Neon-artige Glow-Schatten (blau/rot) sind das
verbindende Stilmittel.

## Typografie

Bewusst distinktiv gewählt (kein Inter/Roboto/Arial), selbst gehostet über
`@fontsource` (DSGVO-konform, kein Google-Fonts-CDN):

- **Überschriften – „Big Shoulders":** ultrakondensierte Plakat-/Playbill-
  Schrift. Die Enge zitiert hohe Bühnen-Lettern und die Dichte einer Formation.
- **Fließtext – „Hanken Grotesk":** warm, humanistisch, sehr gut lesbar,
  vollständige deutsche Glyphen. Freundlich statt steril.
- **Akzent – „Kaushan Script":** greift den roten Pinsel-Schriftzug „Show" auf.
  Nur sehr sparsam für kleine, schräg gesetzte Akzentwörter (z. B. „seit 1981").

## Bildsprache

- **Echte Vereinsbilder** stehen im Mittelpunkt (sobald vorhanden). Keine
  Stockfotos, keine KI-Bilder.
- Wo noch Fotos fehlen, erscheinen **klar erkennbare Platzhalter** in
  Bühnenlicht-Optik mit dem Hinweis „Foto folgt" – nie ein erfundenes Bild.
- Das freigestellte Logo „leuchtet" auf dunklem Grund; der Glow wird sauber per
  CSS ergänzt (siehe `docs/image-sources.md`).

## Bewegungs- & Animationskonzept

Ausschließlich CSS, kein schweres JavaScript. Der Grundsatz: **Inhalte sind
immer lesbar**, auch wenn keine Animation läuft.

- **Ein orchestrierter Seiten-Einstieg:** Hero-Elemente „steigen" gestaffelt auf
  (`--rise-index`), das Laufband setzt sich in Bewegung.
- **Scroll-Reveals** nur dort, wo der Browser sie unterstützt
  (`@supports (animation-timeline: view())`) – sonst einfach sichtbar.
- **Gezielte Mikro-Interaktionen:** roter Glow-Puls am Haupt-Button, schräg
  wischende Navigations-Unterstreichung, sanftes Anheben von Karten beim Hover.
- **Rücksicht auf `prefers-reduced-motion`:** Wer im System „Bewegung
  reduzieren" aktiviert hat, sieht keine Animationen; das Laufband hält an.
