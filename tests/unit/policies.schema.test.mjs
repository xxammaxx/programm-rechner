import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const policies = JSON.parse(
  await readFile(new URL('../../data/policies/afd-2025.json', import.meta.url), 'utf8'),
);

const PFLICHTFELDER = [
  'id',
  'policy_name',
  'source_type',
  'source_organisation',
  'source_title',
  'source_date',
  'source_url',
  'source_page',
  'exact_claim',
  'calculation_status',
  'assumptions',
  'valid_from',
  'last_verified',
];

const ERLAUBTE_STATUS = [
  'DIRECTLY_CALCULABLE',
  'MODEL_ASSUMPTION',
  'REFERENCE_SCENARIO',
  'NOT_INDIVIDUALLY_CALCULABLE',
];

test('Jeder Programmpunkt traegt alle Pflichtfelder aus dem Quellenschema', () => {
  for (const p of policies.policies) {
    for (const feld of PFLICHTFELDER) {
      assert.ok(feld in p, `Feld ${feld} fehlt bei ${p.id}`);
    }
  }
});

test('Jeder Programmpunkt verweist auf die Originalquelle mit Seite', () => {
  for (const p of policies.policies) {
    assert.equal(p.source_type, 'party_programme', `${p.id} muss auf das Wahlprogramm verweisen`);
    assert.match(p.source_url, /^https:\/\//, `${p.id} braucht eine Quell-URL`);
    assert.equal(typeof p.source_page, 'number', `${p.id} braucht eine Seitenzahl`);
    assert.ok(p.source_page > 0 && p.source_page <= 166, `${p.id}: Seite ${p.source_page} liegt ausserhalb des Dokuments`);
    assert.ok(p.exact_claim.length > 20, `${p.id} braucht ein woertliches Zitat`);
  }
});

test('Der Klassifizierungswortschatz wird eingehalten', () => {
  for (const p of policies.policies) {
    assert.ok(ERLAUBTE_STATUS.includes(p.calculation_status), `${p.id}: unbekannter Status ${p.calculation_status}`);
  }
});

test('Nicht bewertbare Punkte nennen einen Grund', () => {
  for (const p of policies.policies) {
    if (p.calculation_status === 'NOT_INDIVIDUALLY_CALCULABLE') {
      assert.ok(p.not_calculable_reason && p.not_calculable_reason.length > 40, `${p.id} braucht eine Begruendung`);
      assert.equal(p.assumptions.length, 0, `${p.id}: nicht bewertbare Punkte brauchen keine Annahmen`);
    }
  }
});

test('Bewertete Punkte nennen ihre Annahmen und Parameter', () => {
  for (const p of policies.policies) {
    if (p.calculation_status === 'DIRECTLY_CALCULABLE' || p.calculation_status === 'MODEL_ASSUMPTION') {
      assert.ok(Array.isArray(p.assumptions) && p.assumptions.length > 0, `${p.id} braucht Annahmen`);
      assert.ok(p.documented_parameter, `${p.id} braucht dokumentierte Parameter`);
    }
  }
});

test('Die im ZEW-Gutachten abweichenden Werte sind als Konflikt dokumentiert', () => {
  const sparer = policies.policies.find((p) => p.id === 'afd2025-sparerpauschbetrag-6672');
  assert.equal(sparer.documented_parameter.sparerpauschbetrag_ledige_euro, 6672);
  assert.ok(sparer.exact_claim.includes('6.672 Euro'), 'das Zitat muss die 6.672 Euro enthalten');

  const ausgeschlossen = policies.excluded_source_notice;
  assert.ok(ausgeschlossen.reason.includes('nicht das Bundestagswahlprogramm'));
  assert.ok(ausgeschlossen.url.includes('btd/20/133/2013356.pdf'));
});

test('Die Zusammenfassung stimmt mit den Datensaetzen ueberein', () => {
  const s = policies.summary;
  assert.equal(s.total_records, policies.policies.length);
  const zaehle = (st) => policies.policies.filter((p) => p.calculation_status === st).length;
  assert.equal(s.directly_calculable, zaehle('DIRECTLY_CALCULABLE'));
  assert.equal(s.model_assumption, zaehle('MODEL_ASSUMPTION'));
  assert.equal(s.reference_scenario, zaehle('REFERENCE_SCENARIO'));
  assert.equal(s.not_individually_calculable, zaehle('NOT_INDIVIDUALLY_CALCULABLE'));
});

test('Ids sind eindeutig', () => {
  const ids = policies.policies.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('Jedes Szenario der Engine hat einen belegten Programmpunkt', () => {
  const ids = new Set(policies.policies.map((p) => p.id));
  for (const id of [
    'afd2025-grundfreibetrag-15000',
    'afd2025-solidaritaetszuschlag-abschaffung',
    'afd2025-sparerpauschbetrag-6672',
    'afd2025-familiensplitting',
  ]) {
    assert.ok(ids.has(id), `Szenario ${id} hat keinen Quellendatensatz`);
  }
});

test('Das Quellenverzeichnis enthaelt die Primaerquellen', async () => {
  const dateien = await readdir(new URL('../../data/sources/', import.meta.url));
  assert.ok(dateien.includes('manifest.json'), 'data/sources/manifest.json muss existieren');
  const manifest = JSON.parse(
    await readFile(new URL('../../data/sources/manifest.json', import.meta.url), 'utf8'),
  );
  assert.ok(Array.isArray(manifest.sources) && manifest.sources.length > 0);
  for (const quelle of manifest.sources) {
    assert.match(quelle.url, /^https:\/\//, `${quelle.id} braucht eine URL`);
    assert.ok(quelle.abgerufen, `${quelle.id} braucht ein Abrufdatum`);
  }
});
