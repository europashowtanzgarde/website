# Website der Europa-Show-Tanzgarde e.V.

Moderne, schnelle und statische Website für die Europa-Show-Tanzgarde aus
Wassertrüdingen – Showtanz, Gardetanz und Vereinsleben. Gebaut mit **Astro**,
gehostet auf **Cloudflare Pages**, gepflegt über einen eigenen, Git-basierten
Redaktionsbereich unter `/admin`.

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
| Redaktion        | Eigenentwicklung unter `/admin`; schreibt als Commit ins Repo |
| Zugang zu /admin | Cloudflare Access (Zero Trust) – kein GitHub-Konto für Redakteur:innen |
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
│  ├─ uploads/        # Über /admin hochgeladene Bilder
│  ├─ favicon.svg     # Favicon (Monogramm)
│  ├─ apple-touch-icon.png / og-default.png  # aus dem Logo erzeugt
│  └─ robots.txt
├─ functions/
│  └─ admin/api/      # Cloudflare Pages Functions: Redaktions-Schnittstelle
├─ src/
│  ├─ assets/         # Logo & Grafiken (werden beim Build optimiert)
│  ├─ components/     # Wiederverwendbare Bausteine (.astro)
│  ├─ content/        # Inhalte: posts, events, groups, gallery, chronik, anlass
│  ├─ data/           # Einstellungen: site.json, homepage.json
│  ├─ layouts/        # Seitengerüst (BaseLayout, AdminLayout)
│  ├─ lib/            # Hilfsfunktionen (Datum, Sammlungen, Einstellungen)
│  ├─ pages/          # Alle Seiten/Routen; admin/ = Redaktionsbereich
│  ├─ scripts/        # Bedienlogik des Redaktionsbereichs
│  └─ styles/         # Design-System (tokens, base, motion, admin)
├─ scripts/
│  ├─ prepare-logo.mjs      # Freistellen & Aufbereiten des Logos
│  ├─ migrate-gallery.mjs   # einmalige Migration (bereits gelaufen)
│  └─ migrate-chronik.mjs   # einmalige Migration (bereits gelaufen)
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

- **Live:** Anmeldung ausschließlich über Cloudflare Access (E-Mail +
  Bestätigungscode). Danach landet man direkt im Editor – kein GitHub-Konto,
  kein zweites Passwort. Einrichtung: [`docs/cloudflare-setup.md`](docs/cloudflare-setup.md).
- **Lokal testen (Entwickler:innen):** `npm run dev` zeigt die Oberfläche, führt
  aber **keine** Functions aus – Daten lassen sich damit nicht laden. Für einen
  vollständigen Test `npx wrangler pages dev dist` mit einer `.dev.vars`, siehe
  Abschnitt „Lokal entwickeln" in `docs/cloudflare-setup.md`.

### Arbeitsteilung Redaktion ↔ Entwicklung

Beide Wege schreiben in dasselbe Repository. Damit sie sich nicht gegenseitig
überschreiben, gilt eine klare Grenze – **serverseitig erzwungen**, nicht nur
vereinbart (`functions/admin/api/_lib/pfade.ts`):

| Bereich | Wer | Dateien |
| --- | --- | --- |
| Redaktion (`/admin`) | Vorstand | `src/content/**`, `src/data/*.json`, `src/assets/gallery/**`, `public/uploads/**` |
| Technik (GitHub) | Entwicklung | alles andere |

Für den Entwickleralltag: **vor jedem Push `git pull --rebase`** – der Vorstand
kann jederzeit committet haben. Und `src/content/**` sowie `src/data/*.json`
möglichst nicht direkt anfassen; dann sind Konflikte strukturell ausgeschlossen.

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
  - dieselbe Domain als `ALLOWED_DOMAINS` in den Cloudflare-Umgebungsvariablen
  - Aktuell steht dort `https://www.europashowtanzgarde.de`.

---

## Adminbereich schützen (Cloudflare Zero Trust)

Die öffentliche Website bleibt frei zugänglich. **Cloudflare Access** schützt
`/admin` **und** `/admin/api` – hinter der Schnittstelle steht Schreibzugriff
aufs Repository.

> ⚠️ Zwei Punkte, die leicht übersehen werden:
> 1. Eine Access-Anwendung auf der eigenen Domain schützt die Adresse
>    `<projekt>.pages.dev` **nicht**. Dafür braucht es eine zweite Anwendung.
> 2. Frühere Fassungen dieser Datei sagten, `/api/*` dürfe *nicht* hinter Access
>    liegen. Das galt für den früheren GitHub-Anmeldevorgang und ist heute
>    **falsch herum**.

Schritt für Schritt: [`docs/cloudflare-setup.md`](docs/cloudflare-setup.md).

---

## Bilder & Logo

- Das Vereinslogo liegt als Original unter `input/Logo_Europashowtanzgarde.png`.
- `npm run logo` stellt es frei (grauer Hintergrund → transparent) und erzeugt
  daraus `src/assets/logo.png`, das Apple-Touch-Icon und das Social-Vorschaubild.
- Redaktionell hochgeladene Bilder werden schon im Browser verkleinert
  (max. 2048 px, WebP) und landen unter `public/uploads/`.
- **Galeriebilder liegen bewusst unter `src/assets/gallery/`**, nicht in
  `public/`: Nur dort ermittelt Astro beim Bauen die Bildmaße, und daraus
  berechnet die Galerie ihr Raster (`--image-ratio`).
- Herkunft und rechtliche Hinweise aller Bilder: [`docs/image-sources.md`](docs/image-sources.md).

---

## Weitere Dokumentation

| Datei                                             | Inhalt                                            |
| ------------------------------------------------- | ------------------------------------------------- |
| [`docs/cms-decision.md`](docs/cms-decision.md)    | Warum eine Eigenentwicklung – und warum Git statt Datenbank |
| [`docs/design-notes.md`](docs/design-notes.md)    | Designidee, Farben, Typografie, Animation         |
| [`docs/image-sources.md`](docs/image-sources.md)  | Bildquellen & rechtliche Hinweise                 |
| [`docs/cloudflare-setup.md`](docs/cloudflare-setup.md) | Deployment & Zero-Trust-Schutz für `/admin`  |
| [`docs/editor-guide.md`](docs/editor-guide.md)    | Anleitung für Redakteur:innen (nicht-technisch)   |
| [`docs/github-create-repo.md`](docs/github-create-repo.md) | Repo-Erstellung & Git-Befehle            |

---

## Offene TODOs

- [ ] **Impressum-Aktualität prüfen:** Die Angaben (Anschrift, Vorstand,
      Vereinsregister VR 10217) stammen aus dem offiziellen Vereinsauftritt
      (Stand 2020). Bitte prüfen, ob Vorstand und Anschrift noch aktuell sind –
      maßgeblich ist das aktuelle Vereinsregister. Bearbeitung über
      `/admin → Einstellungen → Website-Einstellungen`.
- [ ] **Bildrechte & Einwilligungen klären:** Das Ensemble-Foto trägt ein
      Fotografen-Wasserzeichen; Nutzungsrecht und Einwilligung der abgebildeten
      Personen (v. a. Minderjährige) bestätigen – siehe `docs/image-sources.md`.
- [ ] **Domain final schalten:** `europashowtanzgarde.de` liegt bereits bei
      Cloudflare. Prüfen, ob „www" oder die nackte Domain Hauptadresse ist, und
      in `astro.config.mjs` sowie `ALLOWED_DOMAINS` bestätigen.
- [ ] **Redaktionsbereich in Betrieb nehmen** – die Schritte 3 bis 5 in
      [`docs/cloudflare-setup.md`](docs/cloudflare-setup.md): Bot-Konto und
      Token anlegen, Umgebungsvariablen setzen, **beide** Access-Anwendungen
      einrichten (auch die für `*.pages.dev`). Danach die Sicherheitsprüfungen
      aus Schritt 6 durchgehen.
- [ ] **Beispiel-Termine ersetzen:** die vorbefüllten Termine sind mit
      „Beispieltermin" gekennzeichnet und durch echte Daten zu ersetzen.
- [ ] **Trainingszeiten & Ansprechpartner:innen** bei den Garden ergänzen
      (bewusst leer gelassen, um keine veralteten Angaben zu zeigen).
- [ ] **Weitere Fotos einpflegen** – über `/admin`, siehe `docs/image-sources.md`.
- [ ] **Bekannte Schwachstellen in Abhängigkeiten:** `npm audit` meldet fünf
      Punkte in Bau-Werkzeugen (astro, postcss, nanoid, svgo, fast-uri). Sie
      betreffen nicht die ausgelieferte Seite. `npm audit fix` möchte Astro auf
      7.2.2 heben – das ist machbar, aber danach gehört der Vergleich des
      gebauten HTML gegen den vorherigen Stand wiederholt.
- [ ] **Aufräumen:** rund 20 MB Screenshot-Dateien im Projektstammverzeichnis
      (`timeline-*.png`, `home-features-*.png` u. a.) stammen aus früheren
      Layout-Durchgängen und gehören nicht ins Repository.
