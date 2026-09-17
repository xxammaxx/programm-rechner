import { KONFIGURATION } from './config.js';

// Datensparsame Produktanalyse. Zulaessig sind ausschliesslich die folgenden
// Ereignisnamen. Ereignisnamen duerfen NIE Eingaben enthalten.
export const ERLAUBTE_EREIGNISSE = Object.freeze([
  'page_view',
  'calculator_started',
  'step_completed',
  'calculator_completed',
  'source_opened',
  'methodology_opened',
  'support_clicked',
  'generic_js_error',
]);

const erlaubteMenge = new Set(ERLAUBTE_EREIGNISSE);
let geladen = false;
let verfuegbar = false;

function skriptEinbinden() {
  if (geladen || !KONFIGURATION.goatcounterKurzname) return;
  geladen = true;
  const skript = document.createElement('script');
  skript.async = true;
  skript.dataset.goatcounter =
    `https://${KONFIGURATION.goatcounterKurzname}.goatcounter.com/count`;
  skript.src = 'https://gc.zgo.at/count.js';
  // Scheitert das Laden, bleibt der Rechner vollstaendig funktionsfaehig.
  skript.addEventListener('load', () => {
    verfuegbar = Boolean(window.goatcounter && window.goatcounter.count);
  });
  skript.addEventListener('error', () => {
    verfuegbar = false;
  });
  document.head.appendChild(skript);
}

export function analytikStarten() {
  skriptEinbinden();
}

// Zaehlt ein Ereignis. Sendet ausschliesslich den Ereignisnamen, niemals Eingaben,
// Ergebnisse, Haushaltsmerkmale oder Fehlertexte.
export function zaehle(ereignis) {
  if (!erlaubteMenge.has(ereignis)) return;
  try {
    if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      window.goatcounter.count({ path: ereignis, title: '', event: true });
    }
  } catch {
    // Analyse ist nicht wesentlich. Fehler hier duerfen den Rechner nicht beeinflussen.
  }
}

export function zaehleSeitenaufruf() {
  zaehle('page_view');
}

// Oeffentlicher Zaehler. Zeigt genau das, was gezaehlt wird, und nennt keine Personen.
export async function oeffentlicheZahl() {
  const z = KONFIGURATION.oeffentlicherZaehler;
  if (!z.aktiv || !KONFIGURATION.goatcounterKurzname) return null;
  try {
    const antwort = await fetch(
      `https://${KONFIGURATION.goatcounterKurzname}.goatcounter.com/counter/${encodeURIComponent(z.pfad)}.json`,
      { mode: 'cors' },
    );
    if (!antwort.ok) return null;
    const daten = await antwort.json();
    const zahl = Number.parseInt(String(daten.count).replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(zahl) ? zahl : null;
  } catch {
    return null;
  }
}

// Wird von der Seite aufgerufen, wenn ein Fehler auftritt. Es wird nur der Ereignisname
// gesendet, kein Fehlertext und kein Stapelverzeichnis.
export function meldeFehler() {
  zaehle('generic_js_error');
}
