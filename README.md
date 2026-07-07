# Website der Europa-Show-Tanzgarde e.V.

Moderne, schnelle und statische Website für die Europa-Show-Tanzgarde aus
Wassertrüdingen – Showtanz, Gardetanz und Vereinsleben. Gebaut mit **Astro**,
gehostet auf **Cloudflare Pages**, gepflegt über ein einfaches, Git-basiertes
Redaktionssystem (**Sveltia CMS**) unter `/admin`.

> Diese Seite ist bewusst datensparsam: keine Cookies, kein Tracking, keine
> externen Schriftarten-CDNs. Deshalb braucht sie auch keinen Cookie-Banner.

---

## Inhalt

- [Technischer Überblick](#technischer-überblick)
- [Lokale Installation](#lokale-installation)
- [Wichtige Befehle](#wichtige-befehle)
- [Projektstruktur](#projektstruktur)
- [Inhalte pflegen (/admin)](#inhalte-pflegen-admin)
- [Cloudflare Pages – Build-Einstellungen](#cloudflare-pages--build-einstellungen)
- [Domain & DNS](#domain--dns)
- [Adminbereich schützen (Cloudflare Zero Trust)](#adminbereich-schützen-cloudflare-zero-trust)
- [Bilder & Logo](#bilder--logo)
- [Weitere Dokumentation](#weitere-dokumentation)
- [Offene TODOs](#offene-todos)

---

## Technischer Überblick

| Bereich          | Wahl                                                        |
| ---------------- | ----------------------------------------------------------- |
| Framework        | [Astro](https://astro.build) (statische Ausgabe)            |
| Sprache          | TypeScript (strict)                                         |
| Inhalte          | Astro Content Collections (Markdown) + JSON für Einstellungen |
| CMS              | [Sveltia CMS](https://github.com/sveltia/sveltia-cms) (Git-basiert) unter `/admin` |
| Auth für /admin  | GitHub OAuth über eine Cloudflare Pages Function (`functions/api/`) |
| Schriften        | Selbst gehostet via `@fontsource` (DSGVO-konform, kein Google-CDN) |
| Styling          | Reines CSS mit CSS-Variablen (`src/styles/`)                |
| Hosting          | Cloudflare Pages                                            |
| Tracking         | keines – keine Cookies, kein Analytics                      |

Warum diese Wahl? Siehe [`docs/cms-decision.md`](docs/cms-decision.md).

---

## Lokale Installation

Voraussetzung: **Node.js 20 oder neuer** (empfohlen: aktuelle LTS-Version, siehe
`.node-version`).

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Entwicklungsserver starten (http://localhost:4321)
npm run dev
```

## Wichtige Befehle

| Befehl            | Zweck                                                        |
| ----------------- | ------------------------------------------------------------ |
| `npm run dev`     | Startet den Entwicklungsserver mit Live-Vorschau             |
| `npm run build`   | Baut die fertige Website nach `dist/`                        |
| `npm run preview` | Zeigt die gebaute Website lokal an                           |
| `npm run check`   | Prüft die TypeScript-/Astro-Typen                            |
| `npm run logo`    | Bereitet das Logo neu auf (aus `input/`, siehe unten)        |

---

## Projektstruktur

```text
├─ public/
│  ├─ admin/          # Redaktionssystem (Sveltia CMS): index.html + config.yml
│  ├─ uploads/        # Über /admin hochgeladene Bilder
│  ├─ favicon.svg     # Favicon (Monogramm)
│  ├─ apple-touch-icon.png / og-default.png  # aus dem Logo erzeugt
│  └─ robots.txt
├─ functions/
│  └─ api/            # Cloudflare Pages Functions: GitHub-OAuth (auth, callback)
├─ src/
│  ├─ assets/         # Logo & Grafiken (werden beim Build optimiert)
│  ├─ components/     # Wiederverwendbare Bausteine (.astro)
│  ├─ content/        # Inhalte: posts, events, groups, gallery (Markdown)
│  ├─ data/           # Einstellungen: site.json, homepage.json
│  ├─ layouts/        # Seitengerüst (BaseLayout)
│  ├─ lib/            # Hilfsfunktionen (Datum, Sammlungen, Einstellungen)
│  ├─ pages/          # Alle Seiten/Routen
│  └─ styles/         # Design-System (tokens, base, motion)
├─ scripts/
│  └─ prepare-logo.mjs  # Freistellen & Aufbereiten des Logos
├─ docs/              # Ausführliche Dokumentation (siehe unten)
├─ astro.config.mjs
└─ package.json
```

---

## Inhalte pflegen (/admin)

Die Website wird über den Adminbereich `https://DEINE-DOMAIN/admin` gepflegt –
ohne Programmierkenntnisse. Bearbeitbar sind: Beiträge, Termine, Garden,
Galerie sowie die Startseiten- und Vereins-Texte.

Eine einfache, bebilderte Schritt-für-Schritt-Anleitung für Vereinsmitglieder
liegt in [`docs/editor-guide.md`](docs/editor-guide.md).

**Kurz:**

- **Lokal testen (Entwickler:innen):** `npm run dev`, dann
  `http://localhost:4321/admin/index.html` öffnen und „Work with Local
  Repository" wählen (funktioniert in Chrome/Edge, ohne Anmeldung).
- **Live:** Anmeldung mit GitHub (benötigt die einmalige OAuth-Einrichtung,
  siehe `docs/cloudflare-setup.md`) oder alternativ „Sign In Using Access
  Token" mit einem persönlichen GitHub-Token.

> Hinweis: Die Bedienoberfläche von Sveltia CMS ist derzeit nur auf Englisch
> oder Japanisch verfügbar. **Alle Eingabefelder sind aber auf Deutsch
> beschriftet.** Details und eine Alternative (Decap CMS) stehen in
> `docs/cms-decision.md`.

---

## Cloudflare Pages – Build-Einstellungen

Beim Verbinden des GitHub-Repos mit Cloudflare Pages:

| Einstellung           | Wert              |
| --------------------- | ----------------- |
| **Framework preset**  | Astro             |
| **Build command**     | `npm run build`   |
| **Build output dir.** | `dist`            |
| **Production branch** | `main`            |
| **Node-Version**      | aktuelle LTS (z. B. `22`) – über `.node-version` gesetzt, alternativ Umgebungsvariable `NODE_VERSION=22` |

Die vollständige, bebilderte Anleitung inklusive Umgebungsvariablen für den
Adminbereich steht in [`docs/cloudflare-setup.md`](docs/cloudflare-setup.md).

---

## Domain & DNS

- Die gewünschte Domain wird in Cloudflare Pages unter **Custom domains**
  verbunden. Liegt die Domain bereits bei Cloudflare, genügt ein Klick; sonst
  wird ein `CNAME` auf die `*.pages.dev`-Adresse gesetzt.
- **Wichtig:** Die echte Domain muss an **einer** Stelle im Code eingetragen
  werden, damit Canonical-URLs, Sitemap und Social-Vorschau stimmen:
  - `astro.config.mjs` → Konstante `SITE_URL`
  - `public/admin/config.yml` → `base_url`, `site_url`, `display_url`
  - Aktuell steht dort der Platzhalter `https://www.europa-showtanzgarde.de`.

---

## Adminbereich schützen (Cloudflare Zero Trust)

Die öffentliche Website bleibt frei zugänglich. Der Pfad `/admin*` sollte über
**Cloudflare Access (Zero Trust)** auf berechtigte Personen beschränkt werden.

Wichtig: Die OAuth-Endpunkte unter `/api/*` dürfen **nicht** hinter Access
liegen. Die genaue Schritt-für-Schritt-Anleitung steht in
[`docs/cloudflare-setup.md`](docs/cloudflare-setup.md).

---

## Bilder & Logo

- Das Vereinslogo liegt als Original unter `input/Logo_Europashowtanzgarde.png`.
- `npm run logo` stellt es frei (grauer Hintergrund → transparent) und erzeugt
  daraus `src/assets/logo.png`, das Apple-Touch-Icon und das Social-Vorschaubild.
- Redaktionell hochgeladene Bilder landen unter `public/uploads/` und werden von
  Sveltia beim Upload automatisch verkleinert (WebP).
- Herkunft und rechtliche Hinweise aller Bilder: [`docs/image-sources.md`](docs/image-sources.md).

---

## Weitere Dokumentation

| Datei                                             | Inhalt                                            |
| ------------------------------------------------- | ------------------------------------------------- |
| [`docs/cms-decision.md`](docs/cms-decision.md)    | Vergleich der CMS-Optionen & Begründung           |
| [`docs/design-notes.md`](docs/design-notes.md)    | Designidee, Farben, Typografie, Animation         |
| [`docs/image-sources.md`](docs/image-sources.md)  | Bildquellen & rechtliche Hinweise                 |
| [`docs/cloudflare-setup.md`](docs/cloudflare-setup.md) | Deployment & Zero-Trust-Schutz für `/admin`  |
| [`docs/editor-guide.md`](docs/editor-guide.md)    | Anleitung für Redakteur:innen (nicht-technisch)   |
| [`docs/github-create-repo.md`](docs/github-create-repo.md) | Repo-Erstellung & Git-Befehle            |

---

## Offene TODOs

- [ ] **Impressum vervollständigen:** vertretungsberechtigter Vorstand,
      Vereinsregister/Registernummer und Anschrift bestätigen (aktuell als
      Platzhalter markiert) – über `/admin → Einstellungen → Website-Einstellungen`.
- [ ] **Echte Domain eintragen** (siehe [Domain & DNS](#domain--dns)).
- [ ] **GitHub OAuth App anlegen** und Secrets in Cloudflare setzen
      (`docs/cloudflare-setup.md`).
- [ ] **Cloudflare Access** für `/admin*` einrichten.
- [ ] **Beispiel-Termine ersetzen:** die vorbefüllten Termine sind mit
      „Beispieltermin" gekennzeichnet und durch echte Daten zu ersetzen.
- [ ] **Trainingszeiten & Ansprechpartner:innen** bei den Garden ergänzen
      (bewusst leer gelassen, um keine veralteten Angaben zu zeigen).
- [ ] **Fotos einpflegen** (Galerie, Beiträge, Garden) – aus offiziellen
      Vereinsquellen, siehe `docs/image-sources.md`.
