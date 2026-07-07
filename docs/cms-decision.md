# CMS-Entscheidung

Diese Datei dokumentiert, warum als Redaktionssystem **Sveltia CMS** gewählt
wurde – geprüft gegen die Anforderungen des Vereins: Git-basiert, kostenlos,
`/admin` im selben Projekt, für Cloudflare Pages geeignet und **für
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
