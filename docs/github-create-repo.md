# GitHub-Repository erstellen & veröffentlichen

Diese Website gehört in die GitHub-Organisation
[`europashowtanzgarde`](https://github.com/europashowtanzgarde) als Repository
**`website`**. Nachfolgend die exakten Befehle – sowohl für die GitHub CLI als
auch als manuelle Alternative.

## Empfehlung: öffentliches Repo

Ein **öffentliches** Repository ist hier sinnvoll:

- Die Website-Inhalte sind ohnehin öffentlich.
- Es enthält **keine Geheimnisse** (OAuth-Secrets liegen in Cloudflare, nicht im
  Code).
- Das Git-basierte CMS und Cloudflare Pages arbeiten damit reibungslos, und der
  OAuth-Zugriff braucht weniger weitreichende Rechte.

Wer dennoch ein privates Repo möchte: einfach `--public` durch `--private`
ersetzen. Für die CMS-Anmeldung ist dann der OAuth-Scope `repo` (statt
`public_repo`) nötig – die mitgelieferte Function nutzt bereits `repo,user` und
funktioniert in beiden Fällen.

---

## Variante A – mit GitHub CLI (`gh`)

Voraussetzung: `gh` ist installiert und angemeldet (`gh auth status`), und die
Mitgliedschaft in der Organisation ist aktiv.

```bash
# Falls die Org-Einladung noch aussteht, zuerst annehmen:
gh api --method PATCH user/memberships/orgs/europashowtanzgarde -f state=active

# Alles committen (falls noch nicht geschehen):
git add -A
git commit -m "Initiale Website der Europa-Show-Tanzgarde"

# Repo in der Organisation anlegen, Remote setzen und pushen:
gh repo create europashowtanzgarde/website \
  --public \
  --source=. \
  --remote=origin \
  --push \
  --description "Website der Europa-Show-Tanzgarde e.V. – Astro + Cloudflare Pages"
```

---

## Variante B – manuell (ohne CLI oder bei fehlenden Rechten)

1. Auf <https://github.com/organizations/europashowtanzgarde/repositories/new>
   ein neues Repository **`website`** anlegen (ohne README/‎.gitignore/License,
   da schon vorhanden).
2. Lokal verbinden und pushen:

```bash
git add -A
git commit -m "Initiale Website der Europa-Show-Tanzgarde"
git branch -M main
git remote add origin https://github.com/europashowtanzgarde/website.git
git push -u origin main
```

> Ist der Name `website` bereits vergeben, alternativ
> `europashowtanzgarde-website` verwenden und den Namen entsprechend in
> `public/admin/config.yml` (`repo:`) sowie in der GitHub-OAuth-App anpassen.

---

## Nach dem Push

1. Repository mit **Cloudflare Pages** verbinden (siehe
   [`cloudflare-setup.md`](cloudflare-setup.md)).
2. Echte Domain, GitHub-OAuth-App und Cloudflare Access einrichten.
3. Fertig – ab dann löst jeder Commit (auch aus dem CMS) automatisch einen
   neuen Build aus.
