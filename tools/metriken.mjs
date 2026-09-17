// Ruft die aggregierten Nutzungszahlen ab und erzeugt den Bericht fuer den kanonischen
// Kommentar im Issue LIVE PRODUCT METRICS.
//
// Grundsaetze:
//  - Es werden ausschliesslich die zulaessigen Ereignisnamen abgefragt.
//  - Fehlt der API-Schluessel oder ist keine Instanz eingerichtet, wird das ehrlich als
//    METRICS_STATUS=ANALYTICS_UNCONFIGURED gemeldet. Es wird keine Zahl erfunden.
//  - Der API-Schluessel liegt nur als GitHub-Actions-Secret vor, nie im Auslieferungscode.
//
// Aufruf: node tools/metriken.mjs

import { appendFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const wurzel = resolve(fileURLToPath(new URL('..', import.meta.url)));

export const METRICS_SCHEMA_VERSION = 1;
export const FENSTER_TAGE = 7;
// Ein Zeitstempel aelter als dieser Wert gilt als veraltet.
export const STALE_SCHWELLE_STUNDEN = 48;

export const ZULAESSIGE_EREIGNISSE = [
  'page_view',
  'calculator_started',
  'step_completed',
  'calculator_completed',
  'source_opened',
  'methodology_opened',
  'support_clicked',
  'generic_js_error',
];

function tagVor(tage) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - tage);
  return d.toISOString().slice(0, 10);
}

function alsZahl(wert) {
  if (typeof wert === 'number') return Number.isFinite(wert) ? wert : null;
  if (typeof wert === 'string') {
    const bereinigt = wert.replace(/[^0-9.-]/g, '');
    if (bereinigt === '') return null;
    const zahl = Number(bereinigt);
    return Number.isFinite(zahl) ? zahl : null;
  }
  return null;
}

async function holeZahl(kurzname, schluessel, pfad, start, end) {
  const url = new URL(`https://${kurzname}.goatcounter.com/api/v0/stats/total`);
  url.searchParams.set('start', start);
  url.searchParams.set('end', end);
  if (pfad) url.searchParams.set('path', pfad);

  const antwort = await fetch(url, {
    headers: { authorization: `Bearer ${schluessel}`, accept: 'application/json' },
  });
  if (!antwort.ok) {
    throw new Error(`GoatCounter antwortete mit ${antwort.status} fuer ${pfad ?? 'gesamt'}`);
  }
  const daten = await antwort.json();
  // Die Schnittstelle liefert je nach Fassung "total" oder "count".
  return alsZahl(daten.total ?? daten.count ?? daten.hits ?? null);
}

function prozent(zaehler, nenner) {
  if (!nenner || nenner <= 0) return null;
  return Math.round((zaehler / nenner) * 1000) / 10;
}

function formatiereZeitstempel(datum) {
  return datum.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function baueBericht(werte) {
  const {
    status,
    hinweis,
    jetzt,
    aktuell,
    vorher,
    kurzname,
    schemaVersion = METRICS_SCHEMA_VERSION,
  } = werte;

  const zeilen = [];
  zeilen.push('## LIVE PRODUCT METRICS');
  zeilen.push('');
  zeilen.push(`Aktualisiert: ${formatiereZeitstempel(jetzt)} · Zeitfenster: letzte ${FENSTER_TAGE} Tage`);
  zeilen.push('');
  zeilen.push('Aggregierte Nutzungszahlen zur Verbesserung von Bedienbarkeit, Klarheit, Barrierefreiheit, Zuverlässigkeit, Ladezeit, Fehlerbehandlung und Navigation.');
  zeilen.push('Keine personenbezogenen Daten. Keine Haushaltsergebnisse. Keine politischen Merkmale.');
  zeilen.push('');

  if (status !== 'OK') {
    zeilen.push('### Status');
    zeilen.push('');
    zeilen.push(`**METRICS_STATUS = ${status}**`);
    zeilen.push('');
    if (hinweis) zeilen.push(hinweis);
    zeilen.push('');
    zeilen.push('Es werden bewusst keine Zahlen ausgewiesen. Erfundene Messwerte waeren schlimmer als keine Messwerte.');
    zeilen.push('');
    zeilen.push('Das Feld `PRIMARY_DROPOFF_STEP` steht auf `NA`, weil ohne Messdaten kein Abbruchschritt bestimmbar ist.');
  } else {
    const a = aktuell;
    const v = vorher ?? {};
    const spalte = (jetzt_, vorher_) =>
      vorher_ === null || vorher_ === undefined ? String(jetzt_ ?? 'k. A.') : `${jetzt_ ?? 'k. A.'} (vorher ${vorher_})`;

    zeilen.push('### Menschlich lesbar');
    zeilen.push('');
    zeilen.push('| Messwert | Wert |');
    zeilen.push('| --- | --- |');
    zeilen.push(`| Seitenaufrufe | ${spalte(a.page_view, v.page_view)} |`);
    zeilen.push(`| Rechner begonnen | ${spalte(a.calculator_started, v.calculator_started)} |`);
    zeilen.push(`| Rechner abgeschlossen | ${spalte(a.calculator_completed, v.calculator_completed)} |`);
    zeilen.push(`| Abschlussquote | ${a.completion_rate === null ? 'k. A.' : a.completion_rate + ' %'} |`);
    zeilen.push(`| Quelle geöffnet | ${spalte(a.source_opened, v.source_opened)} |`);
    zeilen.push(`| Methodenseite geöffnet | ${spalte(a.methodology_opened, v.methodology_opened)} |`);
    zeilen.push(`| Unterstützen angeklickt | ${spalte(a.support_clicked, v.support_clicked)} |`);
    zeilen.push(`| Technische Fehler | ${spalte(a.generic_js_error, v.generic_js_error)} |`);
    zeilen.push('');
    if (kurzname) {
      zeilen.push(`Quelle: GoatCounter-Instanz \`${kurzname}\`.`);
      zeilen.push('');
    }
  }

  zeilen.push('');
  zeilen.push('### Maschinenlesbar');
  zeilen.push('');
  zeilen.push('```');
  zeilen.push(`METRICS_SCHEMA_VERSION=${schemaVersion}`);
  zeilen.push(`UPDATED_AT=${formatiereZeitstempel(jetzt)}`);
  zeilen.push(`PAGEVIEWS_7D=${status === 'OK' ? aktuell.page_view : 'NA'}`);
  zeilen.push(`CALCULATOR_STARTED_7D=${status === 'OK' ? aktuell.calculator_started : 'NA'}`);
  zeilen.push(`CALCULATOR_COMPLETED_7D=${status === 'OK' ? aktuell.calculator_completed : 'NA'}`);
  zeilen.push(`COMPLETION_RATE_7D=${status === 'OK' && aktuell.completion_rate !== null ? aktuell.completion_rate : 'NA'}`);
  zeilen.push(`SOURCE_OPENED_7D=${status === 'OK' ? aktuell.source_opened : 'NA'}`);
  zeilen.push(`SUPPORT_CLICKED_7D=${status === 'OK' ? aktuell.support_clicked : 'NA'}`);
  zeilen.push(`GENERIC_JS_ERRORS_7D=${status === 'OK' ? aktuell.generic_js_error : 'NA'}`);
  zeilen.push(`PRIMARY_DROPOFF_STEP=${status === 'OK' ? aktuell.primary_dropoff_step : 'NA'}`);
  zeilen.push(`METRICS_STATUS=${status}`);
  if (status === 'OK') {
    zeilen.push(`PAGEVIEWS_PREV_7D=${vorher.page_view ?? 'NA'}`);
    zeilen.push(`CALCULATOR_STARTED_PREV_7D=${vorher.calculator_started ?? 'NA'}`);
    zeilen.push(`CALCULATOR_COMPLETED_PREV_7D=${vorher.calculator_completed ?? 'NA'}`);
    zeilen.push(`COMPLETION_RATE_PREV_7D=${vorher.completion_rate ?? 'NA'}`);
  }
  zeilen.push(`STALE_SCHWELLE_STUNDEN=${STALE_SCHWELLE_STUNDEN}`);
  zeilen.push('```');
  zeilen.push('');
  zeilen.push(
    '`PRIMARY_DROPOFF_STEP`: nicht ableitbar. Die festgelegte Ereignisliste enthält nur `step_completed` ohne Schrittnummer, deshalb lässt sich daraus nicht bestimmen, an welchem Schritt Nutzer abbrechen. Der Wert steht deshalb auf `UNKNOWN`, statt eine Zahl zu erfinden. Für eine echte Ableitung wäre ein zusätzliches Ereignis je Schritt nötig, was eine bewusste Entscheidung über die Ereignisliste erfordert.',
  );
  zeilen.push('');
  zeilen.push(
    `Frische: Liegt \`UPDATED_AT\` mehr als ${STALE_SCHWELLE_STUNDEN} Stunden zurück, gilt **METRICS_STALE**. Ursache kann sein, dass GitHub geplante Workflows in öffentlichen, inaktiven Repositories nach 60 Tagen abschaltet.`,
  );

  return zeilen.join('\n');
}

async function liesKurzname() {
  try {
    const inhalt = await readFile(resolve(wurzel, 'assets/js/config.js'), 'utf8');
    const treffer = inhalt.match(/goatcounterKurzname:\s*(null|'([^']*)'|"([^"]*)")/);
    if (!treffer || treffer[1] === 'null') return null;
    return treffer[2] ?? treffer[3] ?? null;
  } catch {
    return null;
  }
}

function leer() {
  const eintraege = Object.fromEntries(ZULAESSIGE_EREIGNISSE.map((e) => [e, 0]));
  return { ...eintraege, completion_rate: null, primary_dropoff_step: 'UNKNOWN' };
}

export async function ermittleWerte() {
  const kurzname = await liesKurzname();
  const schluessel = process.env.GOATCOUNTER_API_KEY;
  const jetzt = new Date();

  if (!kurzname || !schluessel) {
    const fehlt = [];
    if (!kurzname) fehlt.push('keine GoatCounter-Instanz in assets/js/config.js eingetragen');
    if (!schluessel) fehlt.push('kein Repository-Secret GOATCOUNTER_API_KEY gesetzt');
    return {
      status: 'ANALYTICS_UNCONFIGURED',
      hinweis: `Die Produktanalyse ist nicht eingerichtet: ${fehlt.join(' und ')}. Der Rechner läuft vollständig ohne sie.`,
      jetzt,
      kurzname,
      aktuell: null,
      vorher: null,
    };
  }

  const aktuell = leer();
  const vorher = leer();

  try {
    const startAktuell = tagVor(FENSTER_TAGE);
    const ende = tagVor(0);
    const startVorher = tagVor(FENSTER_TAGE * 2);
    const endeVorher = tagVor(FENSTER_TAGE + 1);

    for (const ereignis of ZULAESSIGE_EREIGNISSE) {
      aktuell[ereignis] = await holeZahl(kurzname, schluessel, ereignis, startAktuell, ende);
      vorher[ereignis] = await holeZahl(kurzname, schluessel, ereignis, startVorher, endeVorher);
    }
    aktuell.completion_rate = prozent(aktuell.calculator_completed, aktuell.calculator_started);
    vorher.completion_rate = prozent(vorher.calculator_completed, vorher.calculator_started);

    return {
      status: 'OK',
      hinweis: null,
      jetzt,
      kurzname,
      aktuell,
      vorher,
    };
  } catch (fehler) {
    return {
      status: 'ANALYTICS_ERROR',
      hinweis: `Die Abfrage ist fehlgeschlagen: ${String(fehler.message ?? fehler)}. Es werden keine Zahlen ausgewiesen.`,
      jetzt,
      kurzname,
      aktuell: null,
      vorher: null,
    };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const werte = await ermittleWerte();
  const bericht = baueBericht(werte);
  process.stdout.write(bericht + '\n');

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `bericht<<BERICHT_ENDE\n${bericht}\nBERICHT_ENDE\n`);
  }
}
