# Cloudflare Pages – Einrichtung & Schutz des Redaktionsbereichs

Diese Anleitung beschreibt, wie die Website auf Cloudflare Pages veröffentlicht
wird und wie der Redaktionsbereich `/admin` abgesichert wird.

Reihenfolge: **1) Pages-Projekt → 2) Domain → 3) GitHub-Zugang →
4) Umgebungsvariablen → 5) Zero Trust → 6) Testen.**

---

## 1. Pages-Projekt anlegen

1. [Cloudflare-Dashboard](https://dash.cloudflare.com) → **Workers & Pages** →
   **Create** → **Pages** → **Connect to Git**.
2. Repository `europashowtanzgarde/website` auswählen.
3. Build-Einstellungen:

   | Einstellung            | Wert            |
   | ---------------------- | --------------- |
   | Framework preset       | Astro           |
   | Build command          | `npm run build` |
   | Build output directory | `dist`          |
   | Production branch      | `main`          |

Die Functions in `functions/admin/api/` werden dabei **automatisch** erkannt.

---

## 2. Domain verbinden

1. Pages-Projekt → **Custom domains** → Domain eintragen
   (z. B. `www.europashowtanzgarde.de`).
2. **Danach die echte Domain im Code eintragen** – sonst stimmen Canonical-URLs,
   Sitemap und Social-Vorschau nicht: `astro.config.mjs` → `SITE_URL`.

---

## 3. GitHub-Zugang für die Redaktion

Der Redaktionsbereich schreibt Änderungen als Commits ins Repository. Dafür
braucht er einen Zugang – **die Vorstandsmitglieder selbst brauchen kein
GitHub-Konto**.

1. **Maschinenkonto anlegen**, z. B. `esg-redaktion-bot`. Vereins-E-Mail,
   Zwei-Faktor-Anmeldung aktivieren, Wiederherstellungscodes sicher verwahren.

   > Alternativ ginge das Konto der technischen Betreuung. Ein eigenes Konto ist
   > aber klarer: In der Versionsgeschichte ist dann auf einen Blick zu sehen,
   > welche Änderungen aus dem Redaktionsbereich stammen.

2. Das Konto als **Collaborator mit der Rolle „Write"** einladen – und die
   Einladung im Bot-Konto **annehmen**. Ohne angenommene Einladung schlägt jeder
   Zugriff fehl.

3. Im Bot-Konto einen **Fine-grained Personal Access Token** erzeugen:
   - Resource owner: `europashowtanzgarde`
   - Repository access: **Only select repositories → `website`**
   - Permissions: **ausschließlich Contents: Read and write**
     (kein `Workflows`, kein `Administration`)
   - Expiration: **365 Tage** (kein „no expiration")

   > Prüfe vorher, ob die Organisation Fine-grained Tokens genehmigen muss.
   > Dann dauert Schritt 3 länger als fünf Minuten.

---

## 4. Umgebungsvariablen

Pages-Projekt → **Settings → Environment variables → Production**:

| Variable                | Wert                                             | Typ    |
| ----------------------- | ------------------------------------------------ | ------ |
| `CMS_GITHUB_TOKEN`      | der Token aus Schritt 3                          | Secret |
| `GITHUB_REPO`           | `europashowtanzgarde/website`                    | Text   |
| `GITHUB_BRANCH`         | `main` (optional, Standard ist `main`)           | Text   |
| `ALLOWED_DOMAINS`       | `www.europashowtanzgarde.de`                     | Text   |
| `CF_ACCESS_TEAM_DOMAIN` | `https://<team>.cloudflareaccess.com`            | Text   |
| `CF_ACCESS_AUD`         | AUD-Tag der Access-Anwendung (aus Schritt 5)     | Text   |
| `NODE_VERSION`          | `22`                                             | Text   |

Danach einmal **neu deployen**, damit die Functions die Werte erhalten.

> Fehlt eine Pflichtvariable, meldet der Redaktionsbereich das im Klartext und
> verweigert den Dienst. Er läuft nie „halb konfiguriert" weiter – das wäre
> gefährlicher als ein klarer Fehler.

---

## 5. Zero Trust (Cloudflare Access)

Die öffentliche Website bleibt frei erreichbar. Geschützt werden `/admin` und
die Schnittstelle darunter.

### ⚠️ Wichtig: Diese Regel hat sich umgekehrt

Frühere Fassungen dieser Anleitung sagten, `/api/*` dürfe **nicht** hinter
Access liegen – das galt für den damaligen GitHub-Anmeldevorgang, den es nicht
mehr gibt.

**Jetzt gilt das Gegenteil:** `/admin/api/*` **muss** hinter Access liegen.
Dahinter steht Schreibzugriff auf das Repository.

### Anwendung 1 – Redaktion

1. **Zero Trust → Access → Applications → Add an application → Self-hosted**
2. Konfiguration:
   - **Name:** `Europa-Show-Tanzgarde Redaktion`
   - **Session Duration:** `24 hours`
   - **Domain:** `www.europashowtanzgarde.de`, **Path:** `admin`

   > Die Schnittstelle liegt bewusst unter `/admin/api/` und nicht unter
   > `/api/admin/`. So deckt die eine Regel für `admin` alles ab – es gibt
   > keinen zweiten Pfad, den man vergessen könnte.
3. **Policy** `Redaktion`: Action **Allow**, Include → **Emails** der
   Vorstandsmitglieder (besser: eine Access-Gruppe – dann muss die Pflege nur an
   einer Stelle passieren).
4. **AUD-Tag kopieren** → als `CF_ACCESS_AUD` eintragen (Schritt 4).

### Anwendung 2 – die pages.dev-Adresse sperren

**Das ist kein optionaler Feinschliff.** Eine Access-Anwendung auf der eigenen
Domain schützt die Adresse `<projekt>.pages.dev` **nicht**. Ohne diesen Schritt
wären die Schreib-Endpunkte dort offen im Internet erreichbar.

1. Zweite Self-hosted-Anwendung anlegen.
2. **Domain:** `<projekt>.pages.dev`, Path leer (schützt alles).
3. Policy: **Block** für alle – oder dieselbe Redaktions-Policy, falls ihr die
   Adresse zum Testen braucht.
4. Zusätzlich: Pages → **Settings → General → Enable access policy** für
   Vorschau-Deployments einschalten.

Als dritte Sicherung prüfen die Functions selbst, ob die Anfrage über einen
erlaubten Hostnamen kam (`ALLOWED_DOMAINS`) – falls die Access-Regeln je
verrutschen.

---

## 6. Testen

Funktion:

- [ ] Öffentliche Seiten (`/`, `/termine`, `/galerie` …) sind **ohne** Anmeldung
      erreichbar.
- [ ] `/admin` verlangt die Cloudflare-Anmeldung; danach erscheint direkt der
      Redaktionsbereich – **ohne** weiteren Login.
- [ ] Ein Testtermin lässt sich anlegen, ändern und löschen.
- [ ] Der Commit erscheint im Repository unter dem Bot-Konto, und im
      Commit-Text steht die E-Mail der Person, die die Änderung gemacht hat.
- [ ] Ein Foto vom Handy lässt sich hochladen.

Sicherheit – jeder Punkt muss **fehlschlagen**:

- [ ] `https://<projekt>.pages.dev/admin/api/termine` → **403**.
      *Der wichtigste Einzeltest.*
- [ ] `/admin/api/termine` ohne Anmeldung (z. B. im privaten Fenster) → **403**,
      niemals Daten.
- [ ] Ein `PUT` auf `/admin/api/beitraege/..%2F..%2Fpackage.json` → **403**.
- [ ] Ein `PUT` ohne den Kopf `X-Redaktion` → abgelehnt.

---

## 7. Token erneuern (einmal im Jahr)

Der Token läuft nach 365 Tagen ab. Danach lässt sich nichts mehr speichern; der
Redaktionsbereich meldet das im Klartext.

1. Im Bot-Konto einen neuen Fine-grained Token erzeugen (gleiche Rechte).
2. In Cloudflare Pages das Secret `CMS_GITHUB_TOKEN` überschreiben.
3. Neu deployen.
4. Den alten Token in GitHub löschen.

**Die Vorstandsmitglieder müssen dafür nichts tun.** Am besten einen
Kalendereintrag zwei Wochen vor Ablauf anlegen.

---

## 8. Lokal entwickeln

`npm run dev` startet die Website, führt aber **keine** Functions aus – der
Redaktionsbereich kann dort keine Daten laden. Für einen vollständigen Test:

```bash
npx wrangler pages dev dist --compatibility-date=2026-01-01
```

Dazu eine Datei `.dev.vars` im Projektverzeichnis anlegen (steht bereits in
`.gitignore` und darf **nie** committet werden):

```
CMS_GITHUB_TOKEN=<Token mit Schreibrecht auf ein TESTREPOSITORY>
GITHUB_REPO=<inhaber>/<testrepo>
ALLOWED_DOMAINS=localhost,127.0.0.1
ADMIN_DEV_BYPASS=ja-nur-lokal
```

`ADMIN_DEV_BYPASS` hebt die Access-Prüfung auf und darf **ausschließlich lokal**
gesetzt werden. In der Produktion ist Access der einzige Schutz vor fremdem
Schreibzugriff.

> Zum Ausprobieren am besten ein Testrepository verwenden – dann landen
> Testeinträge nicht in der echten Versionsgeschichte.

---

## Optional: Termine aktuell halten

Statische Seiten frieren die Terminliste zum Build-Zeitpunkt ein. Jede
Redaktionsänderung baut die Seite ohnehin neu. Wer zusätzlich sicherstellen
will, dass abgelaufene Termine regelmäßig verschwinden, legt in Cloudflare Pages
einen **Deploy Hook** an und trägt ihn als GitHub-Secret `CF_DEPLOY_HOOK` ein –
der Workflow `.github/workflows/scheduled-rebuild.yml` nutzt ihn dann wöchentlich.
