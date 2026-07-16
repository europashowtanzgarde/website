# Design-Notizen

Das Erscheinungsbild leitet sich aus dem Vereinslogo, den echten Vereinsbildern
und dem Charakter einer Tanzformation ab. Es soll bühnenpräsent,
gemeinschaftlich und regional verwurzelt wirken – ohne Karnevalskitsch und ohne
austauschbare Agentur- oder Landingpage-Ästhetik.

## Designidee: „Formation & Bühnenprogramm“

Eine Formation funktioniert durch klare Positionen, gemeinsame Achsen und einen
bewussten Rhythmus. Entsprechend strukturieren Linien, Abstände und wechselnde
Inhaltsbreiten die Website. Termine lesen sich wie ein Programm, die
Vereinsgeschichte wie eine Chronik und die Garden wie eigenständige Profile.

Flächen und Karten werden nur dort eingesetzt, wo sie eine echte Gruppe oder
einen Zustand kennzeichnen. Dekorative Glows, Farbwolken, schwebende Karten und
wiederholte Kicker über jeder Überschrift gehören nicht zum System.

## Farben

Die Palette verwendet das Blau (`#182a9c`) und Rot (`#c31820`) des Logos. Blau
trägt große Markenflächen und Überschriften, Rot markiert Energie, Fokus und
wichtige Metadaten. Weiß, ein kühles Blaugrau und dunkles Tintenblau bilden die
neutralen Rollen. Statusfarben werden zusätzlich durch Text und Kontur erklärt
und erfüllen die vorgesehenen Kontrastanforderungen.

Alle wiederkehrenden Werte stehen als CSS Custom Properties in
`src/styles/tokens.css`.

## Typografie

- **Big Shoulders:** kondensierte Bühnen- und Plakatschrift für Überschriften,
  Navigation und kurze Handlungslabels.
- **Hanken Grotesk:** gut lesbare Schrift für Fließtext, Metadaten und längere
  Vereinsinformationen.

Beide Schriften werden lokal ausgeliefert. Die Hierarchie verwendet wenige,
fluid skalierte Stufen; Fließtext ist auf eine lesbare Zeilenlänge begrenzt.

## Bilder

Es werden ausschließlich vorhandene, lokale Vereinsbilder genutzt. Der
Startseiten-Hero ist eine eingefrorene Designzone und bleibt in Bildausschnitt,
Text und responsiver Darstellung unverändert. Andere Bilder sind bewusst in der
Breite begrenzt, damit sie den Inhalt unterstützen statt ihn zu überdecken.
Fehlende Bilder erscheinen als ruhige, eindeutig beschriftete Platzhalter.

## Bewegung und Bedienung

Bewegung beschränkt sich auf kurze Zustandswechsel bei Links, Buttons und der
mobilen Navigation. Inhalte sind nie von Animation abhängig. Die Website
respektiert `prefers-reduced-motion`, bietet sichtbare Fokuszustände und lässt
sich vollständig mit der Tastatur bedienen.
