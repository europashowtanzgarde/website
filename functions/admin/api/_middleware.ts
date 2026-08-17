/**
 * Vorgeschaltete Prüfung für ALLE Endpunkte unter /admin/api.
 *
 * Bewusst als Middleware und nicht in jedem Endpunkt einzeln: So kann kein
 * später hinzugefügter Endpunkt die Prüfung versehentlich auslassen.
 *
 * Reihenfolge ist Absicht – erst das Billige, dann das Teure:
 *   1. Konfiguration vollständig?      (sonst klare Meldung statt Fehlverhalten)
 *   2. Hostname erlaubt?               (schützt die *.pages.dev-Adresse)
 *   3. Schreibzugriff von uns selbst?  (verhindert fremdes Auslösen)
 *   4. Access-Token gültig?            (einziger echter Identitätsnachweis)
 */
import { type Env, fehlendeKonfiguration } from './_lib/env';
import { hostnameErlaubt, schreibzugriffErlaubt, redakteurErmitteln, type Redakteur } from './_lib/zugang';
import { keinZugang, nichtKonfiguriert, abgelaufen } from './_lib/antwort';

export interface AdminContext {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
  data: { redakteur: Redakteur };
}

export async function onRequest(context: AdminContext): Promise<Response> {
  const { request, env, next } = context;
  const url = new URL(request.url);

  const fehlend = fehlendeKonfiguration(env);
  if (fehlend.length > 0) return nichtKonfiguriert(fehlend);

  if (!hostnameErlaubt(url, env)) return keinZugang();

  if (!schreibzugriffErlaubt(request, url)) return keinZugang();

  const redakteur = await redakteurErmitteln(request, env);
  if (!redakteur) return abgelaufen();

  // Steht den Endpunkten zur Verfügung – u. a. für den Commit-Text.
  context.data.redakteur = redakteur;

  return next();
}
