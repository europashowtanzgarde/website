# CMS-Entscheidung

> **Stand August 2026: Die unten dokumentierte Wahl von Sveltia CMS wurde
> revidiert.** Der Redaktionsbereich ist jetzt eine Eigenentwicklung.
> Die Begründung steht am [Ende dieses Dokuments](#revision-august-2026-eigenentwicklung);
> der ursprüngliche Vergleich bleibt erhalten, weil er die Ausgangslage und die
> verworfenen Alternativen festhält.

Diese Datei dokumentiert, warum als Redaktionssystem zunächst **Sveltia CMS**
gewählt wurde – geprüft gegen die Anforderungen des Vereins: Git-basiert,
kostenlos, `/admin` im selben Projekt, für Cloudflare Pages geeignet und **für
nicht-technische Vereinsmitglieder** bedienbar.

## Anforderungen (Priorität)

1. Von Laien bedienbar, deutsche Feldbeschriftungen.
2. Keine Datenbank, kein Server-Backend, keine laufenden Kosten.
3. Inhalte landen als Dateien direkt im GitHub-Repo (Versionierung, kein
   Vendor-Lock-in).
4. `/admin` im selben Cloudflare-Pages-Projekt, absicherbar über Zero Trust.
5. Geringer Wartungsaufwand, überschaubares Sicherheitsrisiko.

## Vergleich

| Kriterium | **Sveltia CMS** ✅ | Decap CMS | Pages CMS | CloudCannon | Tina / Keystatic | Eigenbau (Pages Functions + GitHub API) |
| --- | --- | --- | --- | --- | --- | --- |
| Grundprinzip | Git-basiert (GitHub) | Git-basiert (GitHub) | Git-basiert (GitHub App) | Git-basiert, gehostet | Git-basiert + teils Backend | Git-basiert, komplett selbst |
| Kosten | **kostenlos, Open Source** | kostenlos, Open Source | kostenlos (Cloud) / self-host | **kostenpflichtig** (Free-Tier begrenzt) | kostenlos (Keystatic) / Tina teils bezahlt | kostenlos, aber Eigenaufwand |
| `/admin` im selben Repo | **Ja** (1 HTML + 1 config.yml) | Ja | Meist externes Tool (pagescms.org) | Externe Plattform | Ja (React-Integration) | Ja |
| Datenbank nötig | **Nein** | Nein | Nein | Nein | Nein (Keystatic) | Nein |
| Einrichtungsaufwand | **gering** | gering | gering–mittel | mittel | mittel–hoch | **hoch** |
| Bedienbarkeit für Laien | **sehr gut** (modern, mobil) | gut (etwas älter) | gut | **sehr gut** (visuell) | gut–mittel | hängt vom Bau ab |
| Cloudflare-Pages-Eignung | **sehr gut** | sehr gut | gut | gut | gut | gut |
| Authentifizierung | GitHub-OAuth (kleine Function) | GitHub-OAuth (externer Dienst nötig) | GitHub App | Plattform-Login | eigener Auth-Flow | selbst zu bauen |
| Bildoptimierung beim Upload | **Ja (WebP, integriert)** | Nein | teils | Ja | teils | selbst zu bauen |
| Deutsche Feld-Labels | **Ja** (über config) | Ja (über config) | Ja | Ja | Ja | Ja |
| Wartungsrisiko | gering–mittel (0.x, aktiv) | gering (stabil, aber träge) | mittel (jüngeres Projekt) | gering (SaaS) | mittel | **hoch** (alles selbst) |
| Datenschutz | sehr gut (kein Tracking) | sehr gut | gut | Daten bei Anbieter | gut | volle Kontrolle |

## Bewertung der Optionen

- **Decap CMS** (früher Netlify CMS): bewährt und stabil, aber die Entwicklung
  stagniert, die Oberfläche wirkt altbacken, es fehlt eine Bildoptimierung, und
  für die GitHub-Anmeldung braucht man ohnehin einen zusätzlichen OAuth-Dienst.
  Sveltia ist zu Decap **konfigurationskompatibel** – ein späterer Wechsel
  wäre praktisch ohne Umbau möglich (guter Sicherheitsanker).
- **Pages CMS**: sympathisch und einfach, wird aber typischerweise als externes
  Tool unter `pagescms.org` betrieben statt sauber unter dem eigenen `/admin`.
  Das widerspricht dem Wunsch „`/admin` im selben Projekt".
- **CloudCannon**: exzellenter visueller Editor, ideal für Laien – aber ein
  **kostenpflichtiger** SaaS mit begrenztem Gratis-Tier und Daten beim Anbieter.
  Für einen kleinen Verein unnötige Kosten und Abhängigkeit.
- **TinaCMS / Keystatic**: technisch stark und gut für strukturierte Inhalte.
  Sie bringen aber mehr Komplexität (React-Integration, teils eigener
  Auth-/Backend-Teil) mit, als eine Vereinswebsite dieser Größe braucht.
- **Eigenbau** (Cloudflare Pages Functions + GitHub API): maximale Kontrolle,
  aber der Aufwand für Editor-UI, Authentifizierung und Sicherheit steht in
  keinem Verhältnis zum Nutzen. Höchstes Wartungs- und Sicherheitsrisiko.

## Entscheidung & Begründung

**Gewählt: Sveltia CMS.** Es erfüllt alle Kernanforderungen am besten:

- **Kostenlos & Open Source**, keine Datenbank, keine SaaS-Abhängigkeit.
- **Nur zwei statische Dateien** (`public/admin/index.html` + `config.yml`) –
  liegt sauber unter `/admin` im selben Cloudflare-Pages-Projekt.
- **Moderne, auch auf dem Handy bedienbare** Oberfläche; deutsche Feldnamen und
  Hilfetexte sind vollständig konfiguriert.
- **Bildoptimierung beim Upload** (WebP, Größenbegrenzung) hält das Repo schlank
  und die Seite schnell – ohne dass Redakteur:innen etwas beachten müssen.
- **Lokaler Modus** („Work with Local Repository") erlaubt Entwickeln/Testen
  ohne jede Anmeldung.
- **Zu Decap kompatibel** – Ausweichmöglichkeit bei Problemen.

Die Authentifizierung läuft über **GitHub OAuth**, umgesetzt als kleine
**Cloudflare Pages Function** im selben Repo (`functions/api/auth.ts` und
`callback.ts`) – kein zusätzliches Deployment, keine Fremdplattform. Der Zugang
zu `/admin` wird zusätzlich über **Cloudflare Access (Zero Trust)** abgesichert.

## Bekannte Einschränkung

Die **Bedien­oberfläche** von Sveltia (Menüs, Buttons) ist Stand Mitte 2026 nur
auf Englisch/Japanisch verfügbar; Deutsch ist noch nicht enthalten. In der
Praxis am wichtigsten sind die Eingabefelder – und **die sind vollständig
deutsch** (siehe `public/admin/config.yml`). Sollte eine durchgehend deutsche
Oberfläche zwingend nötig werden, kann dank Konfigurationskompatibilität auf
**Decap CMS** (mit `locale: de`) gewechselt werden, ohne die Inhalte oder die
Struktur anzufassen.

---

## Revision August 2026: Eigenentwicklung

Die oben getroffene Wahl wurde revidiert. `/admin` ist jetzt eine
**Eigenentwicklung** – dieselbe Option, die im Vergleich als „höchstes Wartungs-
und Sicherheitsrisiko" verworfen worden war. Das war kein Kurswechsel aus Laune,
sondern die Folge von drei Punkten, die sich bei der Umsetzung zeigten.

### Was den Ausschlag gab

**1. Der Anmeldeweg passte nicht zur Zielgruppe.** Sveltia meldet sich über
GitHub an. Jedes Vorstandsmitglied hätte ein eigenes GitHub-Konto gebraucht, als
Mitarbeiter am Repository eingetragen werden müssen und sich nach der
Cloudflare-Anmeldung ein zweites Mal anmelden müssen. Für ehrenamtliche
Vorstände ist das eine Hürde, an der ein Redaktionssystem scheitert – es wird
dann schlicht nicht benutzt.

**2. Der Zugangsschlüssel lag im Browser.** Sveltia legt den GitHub-Token im
Speicher des Browsers ab; das ist bauartbedingt so. Bei der Eigenentwicklung
bleibt er auf dem Server – der Browser sieht ihn nie. Zusätzlich ist
serverseitig festgelegt, **welche Dateien** überhaupt geschrieben werden dürfen.
Ohne diese Grenze könnte über ein Redaktionswerkzeug auch die Bau-Konfiguration
verändert werden, und daraus wird schnell mehr als ein Redaktionsproblem.

**3. Die Oberfläche war nur teilweise deutsch.** Die Bedienelemente von Sveltia
gibt es nur auf Englisch und Japanisch (siehe Einschränkung oben). Bei einer
Eigenentwicklung ist alles deutsch – Beschriftungen, Hinweise und vor allem die
Fehlermeldungen.

Dazu kam ein praktischer Punkt: Mehrere Seiten waren gar nicht redaktionell
befüllbar (Galerie aus Dateinamen, Bilder und Chronik fest im Code). Diese
Umbauten waren unabhängig vom gewählten System nötig – damit schrumpfte der
Vorsprung einer fertigen Lösung erheblich.

### Was der Preis bleibt

Der ursprüngliche Einwand gilt unverändert: **Editor, Bild-Upload und
Fehlerbehandlung sind ab jetzt Eigenpflege.** Es gibt keine Gemeinschaft, die
Fehler meldet und behebt. Dem stehen gegenüber: wenige, verbreitete
Abhängigkeiten (`jose`, `js-yaml`, `marked`, `turndown`) statt eines kompletten
Fremdsystems, und Code, der genau das kann, was dieser Verein braucht.

### Warum weiterhin Git und keine Datenbank

Ebenfalls geprüft wurde, die veränderlichen Inhalte in Cloudflare R2 oder D1 zu
legen. Dagegen sprach:

- Die Website ist **statisch**. Inhalte aus einer Datenbank müssten entweder
  beim Bauen gelesen werden – dann ist es derselbe Ablauf wie mit Git, nur ohne
  dessen Vorteile – oder zur Laufzeit, was einen Umbau auf serverseitiges
  Rendern bedeutet. Letzteres bricht die Bildverarbeitung: Die Galerie berechnet
  ihr Raster aus Bildmaßen, die nur beim Bauen zur Verfügung stehen.
- Der Entwickler könnte Inhalte **nicht mehr über GitHub bearbeiten** – eine
  ausdrückliche Anforderung.
- **Versehentlich Gelöschtes wäre endgültig weg.** Mit Git genügt ein
  `git revert`.
- Die Repository-Größe ist kein Gegenargument: rund 34 MB heute, mit der
  Verkleinerung beim Hochladen etwa 10 MB Zuwachs pro Jahr. GitHub warnt ab 1 GB.

Sollten später sehr viele große Medien dazukommen, ließe sich `public/uploads/`
nachträglich nach R2 auslagern, ohne den Rest anzufassen. Die Galeriebilder
müssten aus dem genannten Grund im Repository bleiben.
