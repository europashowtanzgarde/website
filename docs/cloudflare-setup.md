# Cloudflare Pages – Einrichtung & Schutz des Adminbereichs

Diese Anleitung beschreibt, wie die Website auf Cloudflare Pages veröffentlicht
wird, wie die GitHub-Anmeldung für `/admin` funktioniert und wie der
Adminbereich über Cloudflare Zero Trust geschützt wird.

Reihenfolge: **1) Pages-Projekt → 2) Domain → 3) GitHub-OAuth-App →
4) Secrets → 5) Zero Trust → 6) Testen.**

---

## 1. Pages-Projekt anlegen

1. In das [Cloudflare-Dashboard](https://dash.cloudflare.com) einloggen →
   **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Das GitHub-Repo `europashowtanzgarde/website` auswählen (Cloudflare-GitHub-App
   ggf. für die Organisation autorisieren).
3. Build-Einstellungen setzen:

   | Einstellung           | Wert            |
   | --------------------- | --------------- |
   | Framework preset      | Astro           |
   | Build command         | `npm run build` |
   | Build output directory| `dist`          |
   | Production branch      | `main`          |

4. Unter **Environment variables** die Node-Version festlegen:
   - `NODE_VERSION` = `22`
   - (die Datei `.node-version` im Repo setzt dies zusätzlich)
5. **Save and Deploy.** Nach dem ersten Build ist die Seite unter
   `https://<projekt>.pages.dev` erreichbar.

Die Pages Functions in `functions/api/` (GitHub-OAuth) werden dabei
**automatisch** miterkannt und bereitgestellt – kein zusätzlicher Schritt nötig.

---

## 2. Domain verbinden

1. Im Pages-Projekt → **Custom domains** → **Set up a custom domain** → die
   gewünschte Domain eintragen (z. B. `www.europashowtanzgarde.de`).
2. Liegt die Domain bereits in Cloudflare, wird der DNS-Eintrag automatisch
   gesetzt. Andernfalls den angezeigten `CNAME` beim bisherigen DNS-Anbieter
   hinterlegen.
3. **Danach im Code die echte Domain eintragen** (sonst stimmen Canonical-URLs,
   Sitemap und Social-Vorschau nicht):
   - `astro.config.mjs` → `SITE_URL`
   - `public/admin/config.yml` → `base_url`, `site_url`, `display_url`
   - Änderungen committen → löst automatisch einen neuen Build aus.

---

## 3. GitHub OAuth App anlegen (Anmeldung für /admin)

Damit sich Redakteur:innen unter `/admin` mit GitHub anmelden können, wird eine
**GitHub OAuth App** benötigt. Das kann nur ein Owner der Organisation
`europashowtanzgarde` tun.

1. GitHub → **Organisation** `europashowtanzgarde` → **Settings** →
   **Developer settings** → **OAuth Apps** → **New OAuth App**.
   (Alternativ persönlich unter <https://github.com/settings/developers>.)
2. Felder ausfüllen:
   - **Application name:** z. B. `Europa-Show-Tanzgarde CMS`
   - **Homepage URL:** `https://www.europashowtanzgarde.de` (echte Domain)
   - **Authorization callback URL:**
     `https://www.europashowtanzgarde.de/api/callback`
     ⚠️ Exakt diese eine URL mit der echten Domain – ohne Slash am Ende.
3. **Register application.** Danach **Client ID** notieren und ein
   **Client Secret** erzeugen (einmal sichtbar – sicher aufbewahren).

---

## 4. Secrets in Cloudflare hinterlegen

Im Pages-Projekt → **Settings → Environment variables → Production**:

| Variable               | Wert                                             | Typ    |
| ---------------------- | ------------------------------------------------ | ------ |
| `GITHUB_CLIENT_ID`     | Client ID der OAuth App                          | Secret |
| `GITHUB_CLIENT_SECRET` | Client Secret der OAuth App                      | Secret |
| `ALLOWED_DOMAINS`      | `www.europashowtanzgarde.de` (die echte Domain) | Text   |
| `NODE_VERSION`         | `22`                                             | Text   |

Danach einmal **neu deployen** (Deployments → Retry/neuer Commit), damit die
Functions die Variablen erhalten.

> Bis die OAuth-App eingerichtet ist, kann man sich im CMS auch über **„Sign In
> Using Access Token"** mit einem persönlichen GitHub-Token (Fine-grained PAT
> mit Schreibrecht auf das Repo) anmelden.

---

## 5. Adminbereich schützen (Cloudflare Zero Trust / Access)

Die öffentliche Website bleibt frei erreichbar – nur `/admin*` wird geschützt.

1. Cloudflare-Dashboard → **Zero Trust** → **Access → Applications** →
   **Add an application** → **Self-hosted**.
2. **Application configuration:**
   - **Application name:** `Europa-Show-Tanzgarde Admin`
   - **Session Duration:** z. B. `24 hours`
   - **Domain:** `www.europashowtanzgarde.de`, **Path:** `admin`
     (schützt `/admin` und alles darunter, also `/admin*`).
3. **Policies** → eine Policy `Redaktion` anlegen:
   - **Action:** Allow
   - **Include → Emails:** die E-Mail-Adressen der berechtigten
     Vereinsmitglieder eintragen (oder **Emails ending in** für eine Domain,
     bzw. eine Access-Gruppe verwenden).
4. Speichern.

### ⚠️ Wichtig: OAuth-Pfade NICHT schützen

Der Anmelde-Flow läuft über `/api/auth` und `/api/callback`. Diese Pfade dürfen
**nicht** hinter Access liegen, sonst bricht der GitHub-Login. Da die
Access-Application nur den Pfad `admin` erfasst, ist `/api/*` automatisch frei.
Nicht versehentlich eine zweite Application für `/` oder `/api` mit
Schutz anlegen.

---

## 6. Testen

- [ ] Öffentliche Seiten (`/`, `/termine`, `/garden` …) sind **ohne** Anmeldung
      erreichbar.
- [ ] Aufruf von `/admin` fordert die **Cloudflare-Access-Anmeldung** an.
- [ ] Nach der Access-Anmeldung lädt das CMS; **„Sign in with GitHub"** führt
      durch den GitHub-Login zurück ins CMS.
- [ ] Eine Test-Änderung im CMS erzeugt einen Commit im Repo und löst einen
      neuen Build aus.
- [ ] `https://<domain>/api/callback` ist **nicht** durch Access blockiert.

---

## Optional: Termine aktuell halten

Statische Seiten „frieren" die Terminliste zum Build-Zeitpunkt ein. Jede
Redaktions-Änderung baut die Seite ohnehin neu. Wer zusätzlich sicherstellen
will, dass abgelaufene Termine regelmäßig verschwinden, kann in Cloudflare Pages
einen **Deploy Hook** anlegen und ihn per Zeitplan aufrufen (z. B. über den
mitgelieferten – standardmäßig deaktivierten – GitHub-Actions-Workflow
`.github/workflows/scheduled-rebuild.yml`).
