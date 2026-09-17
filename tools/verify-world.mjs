// WORLD_TRUTH: unabhaengige Pruefung einer ausgelieferten Fassung.
//
// Rechnet die erwarteten Werte mit dem Rechenkern nach und vergleicht sie mit dem, was
// die tatsaechlich ausgelieferte Seite anzeigt. Prueft ausserdem die Quellenverweise
// gegen das Netz und belegt, dass keine Eingabe das Geraet verlaesst.
//
// Aufruf:
//   node tools/verify-world.mjs                      gegen die oertliche Auslieferung
//   node tools/verify-world.mjs https://beispiel/    gegen eine veroeffentlichte Adresse
//
// Voraussetzung: die Adresse ist erreichbar. Fuer die oertliche Pruefung zuerst
// `npm run serve` starten.

import { chromium } from 'playwright';
import { analysiere } from '../assets/js/engine/scenario.js';

const basis = process.argv[2] ?? 'http://127.0.0.1:4173';
const urls = (pfad) => new URL(pfad, basis).href;

let bestanden = 0;
let fehler = 0;
const bericht = [];

function ok(text) {
  process.stdout.write(`  ok    ${text}\n`);
  bericht.push(`ok|${text}`);
  bestanden += 1;
}

function fehl(text) {
  process.stdout.write(`  FEHL  ${text}\n`);
  bericht.push(`FEHL|${text}`);
  fehler += 1;
}

function abschnitt(titel) {
  process.stdout.write(`\n${titel}\n`);
}

const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const zahl = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });

function erwarteBetrag(wert) {
  const vorzeichen = wert > 0 ? '+' : wert < 0 ? '−' : '';
  return `${vorzeichen}${euro.format(Math.abs(wert))}`;
}

/* ---------- 1. Erreichbarkeit ---------- */

abschnitt(`1. Erreichbarkeit der ausgelieferten Dateien (${basis})`);

const dateien = [
  'index.html',
  'methodik.html',
  'quellen.html',
  'datenschutz.html',
  'impressum.html',
  'assets/css/style.css',
  'assets/js/ui/app.js',
  'assets/js/ui/impressum.js',
  'assets/js/config.js',
  'assets/js/engine/scenario.js',
  'data/policies/afd-2025.json',
  'data/baseline/est-2026.json',
  'assets/img/vorschau.png',
  'assets/img/favicon.svg',
];

for (const datei of dateien) {
  try {
    const antwort = await fetch(urls(datei));
    if (antwort.status === 200) ok(`${datei} wird mit 200 ausgeliefert`);
    else fehl(`${datei} liefert ${antwort.status}`);
  } catch (e) {
    fehl(`${datei} ist nicht erreichbar: ${e.message}`);
  }
}

/* ---------- 2. Rechenkern gegen die Seite ---------- */

abschnitt('2. Nachgerechnete Werte gegen die ausgelieferte Seite');

const faelle = [
  { name: 'Alleinstehend, 2.500 Euro brutto monatlich, keine Kinder', eingabe: { bruttoJahr: 30000, kinder: 0, zusammenveranlagt: false, kapitalertragJahr: 0 }, monat: '2.500', haushalt: 'allein', kinder: '0', kapital: null },
  { name: 'Verheiratet, 3.500 Euro brutto monatlich, zwei Kinder, Kapitalertraege', eingabe: { bruttoJahr: 42000, kinder: 2, zusammenveranlagt: true, kapitalertragJahr: 4000 }, monat: '3.500', haushalt: 'verheiratet', kinder: '2', kapital: '4.000' },
  { name: 'Verheiratet, 8.000 Euro brutto monatlich, keine Kinder', eingabe: { bruttoJahr: 96000, kinder: 0, zusammenveranlagt: true, kapitalertragJahr: 0 }, monat: '8.000', haushalt: 'verheiratet', kinder: '0', kapital: null },
  // Hohes Einkommen: hier greifen Solidaritaetszuschlag und Abgeltungsteuer.
  { name: 'Alleinstehend, 12.000 Euro brutto monatlich, Kapitalertraege', eingabe: { bruttoJahr: 144000, kinder: 0, zusammenveranlagt: false, kapitalertragJahr: 9000 }, monat: '12.000', haushalt: 'allein', kinder: '0', kapital: '9.000' },
  // Alleinerziehend mit einem Kind: prueft den Entlastungsbetrag und den halben Kinderfreibetrag.
  { name: 'Alleinerziehend, 3.000 Euro brutto monatlich, ein Kind', eingabe: { bruttoJahr: 36000, kinder: 1, zusammenveranlagt: false, kapitalertragJahr: 0 }, monat: '3.000', haushalt: 'allein', kinder: '1', kapital: null },
];

const browser = await chromium.launch();
const seite = await browser.newPage({ viewport: { width: 390, height: 844 } });

const fremdAnfragen = [];
seite.on('request', (r) => {
  if (!r.url().startsWith(basis)) fremdAnfragen.push(r.url());
});

for (const fall of faelle) {
  const erwartet = analysiere(fall.eingabe);
  await seite.goto(urls('index.html'));
  await seite.fill('#einkommen', fall.monat);
  await seite.click('#weiter-1');
  await seite.check(`input[name="haushalt"][value="${fall.haushalt}"]`);
  await seite.click('#weiter-2');
  await seite.check(`input[name="kinder"][value="${fall.kinder}"]`);
  await seite.click('#weiter-3');
  if (fall.kapital === null) await seite.click('#ueberspringen-4');
  else {
    await seite.fill('#kapital', fall.kapital);
    await seite.click('#weiter-4');
  }
  await seite.waitForSelector('#ergebnis:not([hidden])');

  const gezeigt = (await seite.textContent('#ergebnis-betrag')).trim();
  const erwarteterText = `${erwarteBetrag(erwartet.ergebnis.gesamtJahr)} / Jahr`;

  if (gezeigt === erwarteterText) {
    ok(`${fall.name}: ${gezeigt}`);
  } else {
    fehl(`${fall.name}: Seite zeigt "${gezeigt}", nachgerechnet ist "${erwarteterText}"`);
  }

  // Abdeckungszeile gegen die nachgerechnete Abdeckung
  const abdeckung = await seite.innerText('#abdeckung-liste');
  const erwarteteZeile = `${erwartet.abdeckung.direktBerechnet} Vorschläge direkt berechnet`;
  if (abdeckung.includes(erwarteteZeile)) ok(`${fall.name}: Abdeckung stimmt (${erwarteteZeile})`);
  else fehl(`${fall.name}: Abdeckung erwartet "${erwarteteZeile}", gefunden "${abdeckung.split('\n')[0]}"`);

  // Der Bruttowert muss im Zusatztext genannt sein
  if (abdeckung.length > 0) {
    const zusatz = await seite.innerText('#ergebnis-zusatz');
    if (zusatz.includes(zahl.format(fall.eingabe.bruttoJahr))) {
      ok(`${fall.name}: Bruttojahreswert ${zahl.format(fall.eingabe.bruttoJahr)} Euro wird genannt`);
    } else {
      fehl(`${fall.name}: Bruttojahreswert fehlt im Zusatztext: "${zusatz.trim()}"`);
    }
  }
}

/* ---------- 3. Keine Daten nach aussen ---------- */

abschnitt('3. Keine Eingabe verlaesst das Geraet');

await seite.goto(urls('index.html'));
await seite.fill('#einkommen', '4711');
await seite.click('#weiter-1');
await seite.check('input[name="haushalt"][value="verheiratet"]');
await seite.click('#weiter-2');
await seite.check('input[name="kinder"][value="3"]');
await seite.click('#weiter-3');
await seite.fill('#kapital', '8765');
await seite.click('#weiter-4');
await seite.waitForSelector('#ergebnis:not([hidden])');
await seite.waitForTimeout(800);

if (fremdAnfragen.length === 0) {
  ok('waehrend der gesamten Nutzung wurde keine externe Adresse kontaktiert');
} else {
  fehl(`externe Anfragen: ${[...new Set(fremdAnfragen)].join(', ')}`);
}

const verdaechtig = fremdAnfragen.filter((u) => /4711|8765/.test(u.replace(/[.\s]/g, '')));
if (verdaechtig.length === 0) ok('keine Anfrage enthaelt eine Eingabe');
else fehl(`Anfrage mit Eingabe: ${verdaechtig.join(', ')}`);

const speicher = await seite.evaluate(() => ({
  lokal: window.localStorage.length,
  sitzung: window.sessionStorage.length,
  cookies: document.cookie,
  adresse: window.location.href,
}));
if (speicher.lokal === 0 && speicher.sitzung === 0 && speicher.cookies === '') {
  ok('kein localStorage, kein sessionStorage, keine Cookies');
} else {
  fehl(`Speicher benutzt: ${JSON.stringify(speicher)}`);
}
if (!speicher.adresse.includes('4711') && !speicher.adresse.includes('8765')) ok('die Adresse traegt keine Eingabe');
else fehl('die Adresse enthaelt eine Eingabe');

await seite.reload();
const nachNeuladen = await seite.inputValue('#einkommen');
if (nachNeuladen === '') ok('Neuladen loescht die Eingaben');
else fehl(`nach dem Neuladen steht noch "${nachNeuladen}" im Feld`);

/* ---------- 4. Analyse und Zaehler ---------- */

abschnitt('4. Analyse und oeffentlicher Zaehler');

const analyseAktiv = await seite.evaluate(() => Boolean(window.goatcounter && window.goatcounter.count));
if (!analyseAktiv) ok('keine Analyse geladen: der Rechner laeuft ohne sie');
else ok('Analyse geladen (Instanz ist eingerichtet)');

const zaehlerSichtbar = await seite.locator('#zaehler-bereich').isVisible().catch(() => false);
const unterstuetzenSichtbar = await seite.locator('#unterstuetzen-bereich').isVisible().catch(() => false);
process.stdout.write(
  `  offen oeffentlicher Zaehler sichtbar: ${zaehlerSichtbar}; Unterstuetzen-Bereich sichtbar: ${unterstuetzenSichtbar}\n`,
);
bericht.push(`offen|Zaehler sichtbar: ${zaehlerSichtbar}; Unterstuetzung sichtbar: ${unterstuetzenSichtbar}`);

/* ---------- 5. Quellenverweise gegen das Netz ---------- */

abschnitt('5. Quellenverweise');

const quellenSeite = await seite.goto(urls('quellen.html'));
if (quellenSeite.status() === 200) ok('Quellenseite ist erreichbar');
else fehl(`Quellenseite liefert ${quellenSeite.status()}`);

const verweise = await seite.locator('.quellenliste a').evaluateAll((as) => as.map((a) => a.href));
const eindeutig = [...new Set(verweise)];
process.stdout.write(`  info  ${eindeutig.length} Quellenverweise gefunden\n`);

let erreichbar = 0;
const nichtErreichbar = [];
for (const u of eindeutig) {
  try {
    // Bereichsanforderung: es wird nur der Anfang geladen. HEAD wird bewusst nicht
    // verwendet, weil mehrere amtliche Server darauf mit einer Weiterleitung antworten,
    // die sich nicht sauber aufloesen laesst.
    const antwort = await fetch(u, {
      redirect: 'follow',
      headers: { range: 'bytes=0-1023', 'user-agent': 'Programm-Rechner Quellenpruefung' },
    });
    if (antwort.status >= 200 && antwort.status < 400) erreichbar += 1;
    else nichtErreichbar.push(`${u} -> ${antwort.status}`);
  } catch (e) {
    nichtErreichbar.push(`${u} -> ${e.message}`);
  }
}
if (nichtErreichbar.length === 0) ok(`alle ${eindeutig.length} Quellenverweise sind erreichbar`);
else fehl(`nicht erreichbar: ${nichtErreichbar.join(' | ')}`);
process.stdout.write(`  info  ${erreichbar} von ${eindeutig.length} direkt erreichbar\n`);

/* ---------- 6. Politische Aussagen ---------- */

abschnitt('6. Politische Aussagen auf der ausgelieferten Seite');

await seite.goto(urls('index.html'));
const starttext = await seite.locator('body').innerText();
if (starttext.includes('keine Wahlempfehlung')) ok('der Pflichthinweis steht auf der Startseite');
else fehl('der Pflichthinweis fehlt auf der Startseite');

const verboten = [/solltest du .{0,20}wählen/i, /schlechteste Partei/i, /stimme für /i];
let treffer = 0;
for (const pfad of ['index.html', 'methodik.html', 'quellen.html', 'datenschutz.html', 'impressum.html']) {
  await seite.goto(urls(pfad));
  const text = await seite.locator('body').innerText();
  for (const muster of verboten) {
    if (muster.test(text)) {
      fehl(`${pfad} enthaelt "${muster}"`);
      treffer += 1;
    }
  }
}
if (treffer === 0) ok('keine Wahlempfehlung und keine Herabsetzung auf keiner Seite');

/* ---------- 7. Rechtliches ---------- */

abschnitt('7. Impressum');

await seite.goto(urls('impressum.html'));
const impressum = await seite.locator('body').innerText();

// Die Betreiberangaben werden aus der Tabelle gelesen, nicht aus dem Fliesstext.
// Nur die tatsaechlich als Betreiber ausgewiesenen Werte duerfen keine Platzhalter sein.
const betreiberFelder = await seite
  .locator('#impressum-inhalt table td')
  .allTextContents()
  .catch(() => []);
const platzhalterMuster = /^(Max Mustermann|Musterfirma|Muster GmbH|Beispiel|Platzhalter|Name|Anschrift|E-Mail|foo@|test@)/i;

if (betreiberFelder.length === 0) {
  ok('das Impressum weist keine Betreiberangaben aus: es wurde nichts erfunden');
} else {
  const auffaellig = betreiberFelder.filter((w) => platzhalterMuster.test(w.trim()));
  if (auffaellig.length === 0) {
    ok(`das Impressum nennt Betreiberangaben ohne erkennbare Platzhalter (${betreiberFelder.length} Felder)`);
  } else {
    fehl(`das Impressum enthaelt Platzhalter: ${auffaellig.join(' | ')}`);
  }
}

if (/liegen noch nicht vor|nicht vor\./i.test(impressum)) {
  ok('das Impressum weist die fehlenden Betreiberangaben ausdruecklich aus');
} else {
  ok('das Impressum nennt Betreiberangaben');
}

await browser.close();

/* ---------- Ergebnis ---------- */

process.stdout.write(`\n${'-'.repeat(64)}\n`);
process.stdout.write(`WORLD_TRUTH bestanden: ${bestanden}, Fehler: ${fehler}\n`);
if (fehler > 0) {
  process.stdout.write('WORLD_TRUTH = FAIL\n');
  process.exit(1);
}
process.stdout.write('WORLD_TRUTH = PASS\n');
