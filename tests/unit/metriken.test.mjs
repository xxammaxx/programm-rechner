import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  baueBericht,
  ZULAESSIGE_EREIGNISSE,
  METRICS_SCHEMA_VERSION,
  STALE_SCHWELLE_STUNDEN,
} from '../../tools/metriken.mjs';

const FELDER = [
  'METRICS_SCHEMA_VERSION',
  'UPDATED_AT',
  'PAGEVIEWS_7D',
  'CALCULATOR_STARTED_7D',
  'CALCULATOR_COMPLETED_7D',
  'COMPLETION_RATE_7D',
  'SOURCE_OPENED_7D',
  'SUPPORT_CLICKED_7D',
  'GENERIC_JS_ERRORS_7D',
  'PRIMARY_DROPOFF_STEP',
  'METRICS_STATUS',
];

function maschinenblock(bericht) {
  const treffer = bericht.match(/```\n([\s\S]*?)\n```/);
  assert.ok(treffer, 'der Bericht braucht einen maschinenlesbaren Block');
  return Object.fromEntries(
    treffer[1].split('\n').map((zeile) => {
      const i = zeile.indexOf('=');
      return [zeile.slice(0, i), zeile.slice(i + 1)];
    }),
  );
}

test('die Ereignisliste ist exakt die zulaessige Liste', () => {
  assert.deepEqual(ZULAESSIGE_EREIGNISSE, [
    'page_view',
    'calculator_started',
    'step_completed',
    'calculator_completed',
    'source_opened',
    'methodology_opened',
    'support_clicked',
    'generic_js_error',
  ]);
});

test('der Bericht enthaelt alle vorgeschriebenen Felder', () => {
  const bericht = baueBericht({
    status: 'OK',
    jetzt: new Date('2026-09-17T06:15:00Z'),
    kurzname: 'programm-rechner',
    aktuell: {
      page_view: 1200,
      calculator_started: 400,
      calculator_completed: 210,
      source_opened: 90,
      methodology_opened: 60,
      support_clicked: 3,
      generic_js_error: 1,
      step_completed: 900,
      completion_rate: 52.5,
      primary_dropoff_step: 'UNKNOWN',
    },
    vorher: {
      page_view: 1000,
      calculator_started: 350,
      calculator_completed: 180,
      completion_rate: 51.4,
    },
  });
  const block = maschinenblock(bericht);
  for (const feld of FELDER) {
    assert.ok(feld in block, `Feld ${feld} fehlt`);
  }
  assert.equal(block.METRICS_SCHEMA_VERSION, String(METRICS_SCHEMA_VERSION));
  assert.equal(block.PAGEVIEWS_7D, '1200');
  assert.equal(block.COMPLETION_RATE_7D, '52.5');
  assert.equal(block.METRICS_STATUS, 'OK');
  assert.equal(block.PAGEVIEWS_PREV_7D, '1000');
});

test('ohne eingerichtete Analyse werden keine Zahlen erfunden', () => {
  const bericht = baueBericht({
    status: 'ANALYTICS_UNCONFIGURED',
    hinweis: 'Die Produktanalyse ist nicht eingerichtet.',
    jetzt: new Date('2026-09-17T06:15:00Z'),
    kurzname: null,
    aktuell: null,
    vorher: null,
  });
  const block = maschinenblock(bericht);
  assert.equal(block.METRICS_STATUS, 'ANALYTICS_UNCONFIGURED');
  for (const feld of ['PAGEVIEWS_7D', 'CALCULATOR_STARTED_7D', 'CALCULATOR_COMPLETED_7D', 'COMPLETION_RATE_7D']) {
    assert.equal(block[feld], 'NA', `${feld} darf ohne Analyse keine Zahl tragen`);
  }
  assert.ok(!/\d{2,}/.test(block.PAGEVIEWS_7D), 'keine erfundene Zahl');
});

test('ein Abfragefehler wird als Fehler und nicht als Null gemeldet', () => {
  const bericht = baueBericht({
    status: 'ANALYTICS_ERROR',
    hinweis: 'Die Abfrage ist fehlgeschlagen.',
    jetzt: new Date('2026-09-17T06:15:00Z'),
    kurzname: 'programm-rechner',
    aktuell: null,
    vorher: null,
  });
  const block = maschinenblock(bericht);
  assert.equal(block.METRICS_STATUS, 'ANALYTICS_ERROR');
  assert.equal(block.CALCULATOR_COMPLETED_7D, 'NA');
});

test('der Bericht nennt die Frischeschwelle und den Grund fuer UNKNOWN', () => {
  const bericht = baueBericht({
    status: 'OK',
    jetzt: new Date('2026-09-17T06:15:00Z'),
    kurzname: 'programm-rechner',
    aktuell: { completion_rate: 50, primary_dropoff_step: 'UNKNOWN' },
    vorher: {},
  });
  assert.ok(bericht.includes(`STALE_SCHWELLE_STUNDEN=${STALE_SCHWELLE_STUNDEN}`));
  assert.ok(bericht.includes('METRICS_STALE'));
  assert.ok(bericht.includes('UNKNOWN'));
  assert.ok(bericht.includes('step_completed'));
});

test('der Bericht enthaelt keine Felder fuer Haushaltsdaten', () => {
  const bericht = baueBericht({
    status: 'OK',
    jetzt: new Date('2026-09-17T06:15:00Z'),
    kurzname: 'programm-rechner',
    aktuell: { completion_rate: 50, primary_dropoff_step: 'UNKNOWN' },
    vorher: {},
  });
  for (const verboten of ['INCOME', 'HOUSEHOLD', 'CHILDREN', 'RESULT', 'BENEFIT', 'PARTY']) {
    assert.ok(!bericht.includes(verboten), `Der Bericht darf ${verboten} nicht enthalten`);
  }
});
