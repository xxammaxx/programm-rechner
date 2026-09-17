// Prueft das rechtliche Tor vor einer Veroeffentlichung.
//
// Gibt den Zustand auf der Standardausgabe aus, schreibt ihn in die Laufzusammenfassung
// und setzt die Ausgabe `zulaessig` fuer die Bedingung des Veroeffentlichungsauftrags.
// Der Exit-Code ist immer 0: ein offenes Tor ist kein technischer Fehler, sondern der
// dokumentierte Zustand BLOCKED_EXTERNAL_OWNER_ACTION. Veroeffentlicht wird trotzdem
// nichts, weil der Folgeauftrag nur bei zulaessig=true laeuft.
//
// Aufruf: node tools/legal-gate.mjs

import { appendFileSync } from 'node:fs';
import { KONFIGURATION } from '../assets/js/config.js';

const b = KONFIGURATION.betreiber;
const zulaessig = Boolean(b.vorhanden && b.name && b.anschrift && b.email);

const zeilen = [];

if (zulaessig) {
  zeilen.push('Rechtliches Tor: PASS.');
  zeilen.push('');
  zeilen.push('Die nach § 5 Digitale-Dienste-Gesetz erforderlichen Betreiberangaben liegen vor.');
  zeilen.push('Die Veroeffentlichung wird fortgesetzt.');
} else {
  zeilen.push('Rechtliches Tor: OFFEN.');
  zeilen.push('');
  zeilen.push('LEGAL_OWNER_DATA=REQUIRED_FOR_PUBLICATION');
  zeilen.push('Klassifizierung: BLOCKED_EXTERNAL_OWNER_ACTION');
  zeilen.push('');
  zeilen.push('Es fehlen die nach § 5 Digitale-Dienste-Gesetz erforderlichen Angaben:');
  zeilen.push('vollständiger Name, Zustellanschrift und eine Möglichkeit zur schnellen');
  zeilen.push('elektronischen Kontaktaufnahme.');
  zeilen.push('');
  zeilen.push('Fehlende Felder:');
  if (!b.vorhanden) zeilen.push('  - vorhanden steht auf false');
  if (!b.name) zeilen.push('  - name');
  if (!b.anschrift) zeilen.push('  - anschrift');
  if (!b.email) zeilen.push('  - email');
  zeilen.push('');
  zeilen.push('Eintragen in assets/js/config.js unter KONFIGURATION.betreiber,');
  zeilen.push('danach vorhanden auf true setzen.');
  zeilen.push('');
  zeilen.push('Die Veroeffentlichung wird uebersprungen. Es werden bewusst keine Platzhalter');
  zeilen.push('veroeffentlicht und keine Betreiberangaben erfunden.');
}

const text = zeilen.join('\n');
process.stdout.write(text + '\n');

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Veroeffentlichungspruefung\n\n${text}\n`);
}

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `zulaessig=${zulaessig}\n`);
}
