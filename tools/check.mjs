// Code-Wahrheitsschicht: Pruefungen, die ohne Browser und ohne Abhaengigkeiten laufen.
// Aufruf: node tools/check.mjs

import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = resolve(fileURLToPath(new URL('..', import.meta.url)));

let fehler = 0;
let geprueft = 0;

function ok(text) {
  process.stdout.write(`  ok    ${text}\n`);
  geprueft += 1;
}

function fehl(text) {
  process.stdout.write(`  FEHL  ${text}\n`);
  fehler += 1;
}

function abschnitt(titel) {
  process.stdout.write(`\n${titel}\n`);
}

async function sammleEndungen(verzeichnis, endungen, gefunden = []) {
  for (const eintrag of await readdir(verzeichnis, { withFileTypes: true })) {
    // Bauergebnisse und Abhaengigkeiten sind keine Quellen.
    if (eintrag.name === 'node_modules' || eintrag.name === '_site' || eintrag.name.startsWith('.')) continue;
    const voll = join(verzeichnis, eintrag.name);
    if (eintrag.isDirectory()) await sammleEndungen(voll, endungen, gefunden);
    else if (endungen.includes(extname(eintrag.name))) gefunden.push(voll);
  }
  return gefunden;
}

/* ---------- 1. JSON-Dateien ---------- */

abschnitt('1. JSON-Dateien');

const jsonDateien = [
  ...(await sammleEndungen(join(wurzel, 'data'), ['.json'])),
  ...(await sammleEndungen(join(wurzel, 'tests'), ['.json'])),
  join(wurzel, 'package.json'),
];

for (const datei of jsonDateien) {
  const rel = relative(wurzel, datei);
  try {
    JSON.parse(await readFile(datei, 'utf8'));
    ok(`${rel} ist gueltiges JSON`);
  } catch (e) {
    fehl(`${rel} ist kein gueltiges JSON: ${e.message}`);
  }
}

/* ---------- 2. HTML-Struktur ---------- */

abschnitt('2. HTML-Struktur');

const htmlDateien = (await sammleEndungen(wurzel, ['.html'])).filter((f) => !f.includes('node_modules'));
const ausserhalbBau = (f) => !relative(wurzel, f).startsWith('_site');

for (const datei of htmlDateien) {
  const rel = relative(wurzel, datei);
  const inhalt = await readFile(datei, 'utf8');

  if (!/<html[^>]+lang="de"/.test(inhalt)) fehl(`${rel} hat keine Sprachauszeichnung lang="de"`);
  else ok(`${rel} hat lang="de"`);

  if (!/<meta charset="utf-8">/i.test(inhalt)) fehl(`${rel} hat keine Zeichensatzangabe`);
  else ok(`${rel} hat eine Zeichensatzangabe`);

  if (!/<meta name="viewport"[^>]+width=device-width/.test(inhalt)) fehl(`${rel} hat kein Mobile-Viewport`);
  else ok(`${rel} hat ein Mobile-Viewport`);

  const h1Anzahl = (inhalt.match(/<h1[\s>]/g) ?? []).length;
  if (h1Anzahl !== 1) fehl(`${rel} hat ${h1Anzahl} Hauptueberschriften statt genau einer`);
  else ok(`${rel} hat genau eine Hauptueberschrift`);

  // Keine Inline-Skripte und keine Inline-Stile: Voraussetzung fuer eine strenge CSP.
  const inlineSkript = [...inhalt.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)].filter(
    (m) => m[1].trim().length > 0,
  );
  if (inlineSkript.length > 0) fehl(`${rel} enthaelt ${inlineSkript.length} Inline-Skript`);
  else ok(`${rel} enthaelt kein Inline-Skript`);

  const inlineStil = [...inhalt.matchAll(/\sstyle="/gi)];
  if (inlineStil.length > 0) fehl(`${rel} enthaelt ${inlineStil.length} Inline-Stil`);
  else ok(`${rel} enthaelt keinen Inline-Stil`);

  // Nur erlaubte externe Ziele.
  const extern = [...inhalt.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
  const unerlaubt = extern.filter((u) => !/^https:\/\/(www\.)?(afd\.de|gesetze-im-internet\.de|bundesfinanzministerium\.de|recht\.bund\.de|zew\.de|dserver\.bundestag\.de|web\.archive\.org|xxammaxx\.github\.io|bmf-steuerrechner\.de)\//.test(u));
  if (unerlaubt.length > 0) fehl(`${rel} verweist auf unerwartete externe Ziele: ${unerlaubt.join(', ')}`);
  else ok(`${rel}: alle externen Verweise zeigen auf belegte Quellen`);

  if (/src="http:\/\//.test(inhalt)) fehl(`${rel} laedt eine Ressource unverschluesselt ueber http`);
  else ok(`${rel} laedt nichts unverschluesselt ueber http`);
}

/* ---------- 3. Interne Verweise und Dateien ---------- */

abschnitt('3. Interne Verweise');

for (const datei of htmlDateien) {
  const rel = relative(wurzel, datei);
  const inhalt = await readFile(datei, 'utf8');
  const ziele = [...inhalt.matchAll(/(?:src|href)="([^"]*)"/g)]
    .map((m) => m[1])
    // Nur projektinterne Verweise pruefen. Absolute Adressen, Anker und
    // mailto- oder tel-Verweise werden an anderer Stelle behandelt.
    .filter((z) => z !== '' && !z.startsWith('#') && !/^[a-z][a-z0-9+.-]*:/i.test(z) && !z.startsWith('//'));

  for (const ziel of new Set(ziele)) {
    const pfad = resolve(dirname(datei), ziel.split('?')[0]);
    if (!existsSync(pfad)) fehl(`${rel} verweist auf fehlende Datei ${ziel}`);
    else ok(`${rel} -> ${ziel} vorhanden`);
  }
}

/* ---------- 4. Sicherheit ---------- */

abschnitt('4. Sicherheit');

const skriptDateien = await sammleEndungen(join(wurzel, 'assets'), ['.js']);

const geheimnisMuster = [
  [/ghp_[A-Za-z0-9]{20,}/, 'GitHub-Token'],
  [/github_pat_[A-Za-z0-9_]{20,}/, 'GitHub-Feintoken'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'privater Schluessel'],
  [/AKIA[0-9A-Z]{16}/, 'AWS-Schluessel'],
  [/(api[_-]?key|secret|passwort|password)\s*[:=]\s*["'][^"']{8,}["']/i, 'moegliches Geheimnis'],
];

for (const datei of skriptDateien) {
  const rel = relative(wurzel, datei);
  const inhalt = await readFile(datei, 'utf8');
  let sauber = true;
  for (const [muster, name] of geheimnisMuster) {
    if (muster.test(inhalt)) {
      fehl(`${rel} enthaelt ein moegliches Geheimnis (${name})`);
      sauber = false;
    }
  }
  if (sauber) ok(`${rel} enthaelt kein Geheimnis`);

  if (/\beval\s*\(/.test(inhalt)) fehl(`${rel} verwendet eval`);
  else ok(`${rel} verwendet kein eval`);

  if (/new Function\s*\(/.test(inhalt)) fehl(`${rel} verwendet new Function`);
  else ok(`${rel} verwendet kein new Function`);

  if (/\.innerHTML\s*=/.test(inhalt)) fehl(`${rel} setzt innerHTML`);
  else ok(`${rel} setzt kein innerHTML`);
}

// Der Rechner darf ohne eingerichtete Analyse keinerlei Fremdskript laden.
const htmlUndJs = [...htmlDateien, ...skriptDateien];
const fremdSkript = [];
for (const datei of htmlUndJs) {
  const inhalt = await readFile(datei, 'utf8');
  for (const m of inhalt.matchAll(/src="(https?:\/\/[^"]+\.js)"/g)) fremdSkript.push([relative(wurzel, datei), m[1]]);
  if (/gc\.zgo\.at/.test(inhalt) && !/goatcounterKurzname/.test(inhalt)) {
    fremdSkript.push([relative(wurzel, datei), 'gc.zgo.at ohne Konfigurationspruefung']);
  }
}
if (fremdSkript.length > 0) fehl(`Fremdskripte gefunden: ${JSON.stringify(fremdSkript)}`);
else ok('kein Fremdskript wird geladen');

/* ---------- 5. CSP-Eignung ---------- */

abschnitt('5. CSP-Eignung');

// Es gibt bewusst keine CSP-Meta-Angabe: GitHub Pages erlaubt keine eigenen Header, und
// eine Meta-CSP wuerde Inline-Stile verbieten, die hier nirgends vorkommen. Geprueft wird
// deshalb, dass eine strenge CSP ohne Ausnahmen moeglich waere.
let inlineGesamt = 0;
for (const datei of htmlDateien) {
  const inhalt = await readFile(datei, 'utf8');
  inlineGesamt += (inhalt.match(/\sstyle="/g) ?? []).length;
  inlineGesamt += [...inhalt.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)].filter(
    (m) => m[1].trim().length > 0,
  ).length;
}
if (inlineGesamt === 0) ok('keine Inline-Ressource: eine CSP ohne unsafe-inline ist moeglich');
else fehl(`${inlineGesamt} Inline-Ressourcen verhindern eine strenge CSP`);

/* ---------- 6. Vorschau-Bild ---------- */

abschnitt('6. Soziale Vorschau');

const vorschau = join(wurzel, 'assets/img/vorschau.png');
if (existsSync(vorschau)) {
  const info = await stat(vorschau);
  ok(`assets/img/vorschau.png vorhanden (${Math.round(info.size / 1024)} KB)`);
} else fehl('assets/img/vorschau.png fehlt');

const indexInhalt = await readFile(join(wurzel, 'index.html'), 'utf8');
for (const tag of ['og:title', 'og:description', 'og:url', 'og:image', 'og:site_name', 'og:type']) {
  if (indexInhalt.includes(`property="${tag}"`)) ok(`Vorschauangabe ${tag} vorhanden`);
  else fehl(`Vorschauangabe ${tag} fehlt`);
}
if (/rel="canonical"/.test(indexInhalt)) ok('kanonische Adresse vorhanden');
else fehl('kanonische Adresse fehlt');

/* ---------- 7. Verbotene politische Formulierungen ---------- */

abschnitt('7. Politische Inhalte');

const verboteneWendungen = [
  /solltest du .{0,20}wählen/i,
  /schlechteste Partei/i,
  /so schlecht wird es dir gehen/i,
  /wahlempfehlung:\s*(?!keine)/i,
  /deshalb wähle/i,
  /stimme für/i,
];

const inhaltsDateien = [
  ...htmlDateien,
  ...(await sammleEndungen(join(wurzel, 'assets'), ['.js'])),
  ...(await sammleEndungen(join(wurzel, 'data'), ['.json'])),
  ...(await sammleEndungen(wurzel, ['.md'])),
];

let verdacht = 0;
for (const datei of inhaltsDateien) {
  const inhalt = await readFile(datei, 'utf8');
  for (const muster of verboteneWendungen) {
    if (muster.test(inhalt)) {
      // Ein Hinweis, der genau diese Formulierung als verboten benennt, ist zulaessig.
      if (/nicht schreiben|verboten|never write|Nie schreiben/i.test(inhalt)) continue;
      fehl(`${relative(wurzel, datei)} enthaelt eine verbotene politische Wendung (${muster})`);
      verdacht += 1;
    }
  }
}
if (verdacht === 0) ok('keine Werbe- oder Empfehlungssprache gefunden');

const pflichtSatz = 'Dies ist keine Wahlempfehlung und keine vollständige Bewertung des Programms.';
for (const datei of ['index.html', 'methodik.html']) {
  const inhalt = await readFile(join(wurzel, datei), 'utf8');
  if (inhalt.includes(pflichtSatz)) ok(`${datei} enthaelt den Pflichtsatz`);
  else fehl(`${datei} enthaelt den Pflichtsatz nicht`);
}

/* ---------- 8. Rechtliches Tor ---------- */

abschnitt('8. Rechtliches Tor');

const konfig = await readFile(join(wurzel, 'assets/js/config.js'), 'utf8');
const betreiberGesetzt = !/betreiber:\s*\{[^}]*vorhanden:\s*false/.test(konfig);
if (betreiberGesetzt) {
  ok('Betreiberangaben sind eingetragen: eine Veroeffentlichung ist rechtlich vorbereitet');
} else {
  process.stdout.write(
    '  offen Die Betreiberangaben fehlen. Das ist erwartet und dokumentiert.\n' +
      '        Status: LEGAL_OWNER_DATA=REQUIRED_FOR_PUBLICATION, Veroeffentlichung blockiert.\n' +
      '        Einzutragen in assets/js/config.js unter KONFIGURATION.betreiber, danach vorhanden=true.\n',
  );
}

/* ---------- Ergebnis ---------- */

process.stdout.write(`\n${'-'.repeat(60)}\n`);
process.stdout.write(`Pruefungen bestanden: ${geprueft}, Fehler: ${fehler}\n`);

if (fehler > 0) {
  process.stdout.write('CODE_TRUTH = FAIL\n');
  process.exit(1);
}
process.stdout.write('CODE_TRUTH = PASS\n');
