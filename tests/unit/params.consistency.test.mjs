import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PARAMS_2026, TARIFF_2026, TARIFF_2025 } from '../../assets/js/engine/params.js';

// Die kanonische, maschinenlesbare Fassung liegt in data/baseline/est-2026.json.
// Dieser Test verhindert, dass die beiden Fassungen auseinanderlaufen.
const manifest = JSON.parse(
  await readFile(new URL('../../data/baseline/est-2026.json', import.meta.url), 'utf8'),
);

// Prozentwerte im Manifest stehen als Prozentzahl, in der Engine als Faktor.
// Der Vergleich läuft deshalb mit Toleranz.
function prozentGleich(prozentImManifest, faktorInEngine) {
  return Math.abs(prozentImManifest / 100 - faktorInEngine) < 1e-12;
}

test('Manifest und Engine stimmen beim Veranlagungsjahr ueberein', () => {
  assert.equal(manifest.assessment_year, PARAMS_2026.year);
});

test('Manifest und Engine stimmen beim Tarif des § 32a Abs. 1 EStG ueberein', () => {
  const t = manifest.tariff_32a;
  assert.equal(t.grundfreibetrag, TARIFF_2026.grundfreibetrag);
  const zonen = Object.fromEntries(t.zones.map((z) => [z.zone, z]));
  assert.equal(zonen[2].upper, TARIFF_2026.zone2.upper);
  assert.equal(zonen[2].y_base, TARIFF_2026.grundfreibetrag);
  assert.equal(zonen[2].formula.includes('914.51'), true, 'Wert 914,51 muss im Manifest stehen');
  assert.equal(zonen[3].z_base, TARIFF_2026.zone3.base);
  assert.equal(zonen[3].z_base, TARIFF_2026.zone2.upper);
  assert.equal(zonen[3].formula.includes('173.10'), true, 'Wert 173,10 muss im Manifest stehen');
  assert.equal(zonen[3].formula.includes('1034.87'), true);
  assert.equal(zonen[4].formula.includes('11135.63'), true);
  assert.equal(zonen[5].formula.includes('19470.38'), true);
});

test('Manifest und Engine stimmen bei Kinderfreibetrag und Kindergeld ueberein', () => {
  const k = manifest.kinderfreibetrag_32_abs_6;
  assert.equal(k.saechliches_existenzminimum_je_elternteil_je_kind, 3414);
  assert.equal(k.bea_freibetrag_je_elternteil_je_kind, 1464);
  assert.equal(k.summe_je_elternteil_je_kind, PARAMS_2026.kinder.freibetragJeElternteilJeKind);
  assert.equal(k.bei_zusammenveranlagung_je_kind, PARAMS_2026.kinder.freibetragZusammenJeKind);
  assert.equal(manifest.kindergeld_66.monatlich_je_kind, PARAMS_2026.kinder.kindergeldMonatJeKind);
  assert.equal(
    3414 + 1464,
    PARAMS_2026.kinder.freibetragJeElternteilJeKind,
    'Summe aus sächlichem Existenzminimum und BEA-Freibetrag',
  );
  assert.equal(2 * (3414 + 1464), PARAMS_2026.kinder.freibetragZusammenJeKind);
});

test('Manifest und Engine stimmen bei den Pauschbetraegen ueberein', () => {
  const p = manifest.pauschbetraege;
  assert.equal(p.arbeitnehmer_pauschbetrag_9a, PARAMS_2026.pauschbetraege.arbeitnehmer);
  assert.equal(p.sonderausgaben_pauschbetrag_10c, PARAMS_2026.pauschbetraege.sonderausgaben);
  assert.equal(
    p.sonderausgaben_pauschbetrag_zusammenveranlagung_10c,
    PARAMS_2026.pauschbetraege.sonderausgabenZusammen,
  );
  assert.equal(p.entlastungsbetrag_alleinerziehende_24b, PARAMS_2026.pauschbetraege.entlastungAlleinerziehende);
  assert.equal(p.sparer_pauschbetrag_20_abs_9_einzel, PARAMS_2026.pauschbetraege.sparerEinzel);
  assert.equal(p.sparer_pauschbetrag_20_abs_9_zusammen, PARAMS_2026.pauschbetraege.sparerZusammen);
});

test('Manifest und Engine stimmen beim Solidaritaetszuschlag ueberein', () => {
  const s = manifest.solidaritaetszuschlag;
  assert.ok(prozentGleich(s.satz_prozent, PARAMS_2026.solidaritaetszuschlag.satz));
  assert.ok(prozentGleich(s.milderungszone_satz_prozent, PARAMS_2026.solidaritaetszuschlag.milderungssatz));
  assert.equal(s.freigrenze_einzel_2026, PARAMS_2026.solidaritaetszuschlag.freigrenzeEinzel);
  assert.equal(s.freigrenze_zusammenveranlagung_2026, PARAMS_2026.solidaritaetszuschlag.freigrenzeZusammen);
  assert.equal(s.milderungszone_ende_faktor, PARAMS_2026.solidaritaetszuschlag.milderungszoneEndeFaktor);
  // 5,5 % = 11,9 % * (B - F) / B  =>  B / F = 1 / (1 - 5,5 / 11,9)
  const faktorAusSaetzen = 1 / (1 - 5.5 / 11.9);
  assert.ok(
    Math.abs(faktorAusSaetzen - s.milderungszone_ende_faktor) < 1e-9,
    'Faktor muss aus dem Verhaeltnis der beiden Saetze folgen',
  );
});

test('Manifest und Engine stimmen bei den Vorsorgeaufwendungen ueberein', () => {
  const v = manifest.vorsorgeaufwendungen_modell;
  assert.ok(prozentGleich(v.rentenversicherung.arbeitnehmeranteil_prozent, PARAMS_2026.vorsorge.rvProzent));
  assert.equal(v.rentenversicherung.beitragsbemessungsgrenze, PARAMS_2026.vorsorge.rvBbg);
  assert.ok(
    prozentGleich(v.krankenversicherung.arbeitnehmeranteil_halber_satz_prozent, PARAMS_2026.vorsorge.kvErmaessigtProzent),
    'die Engine setzt den Arbeitnehmeranteil an, nicht den vollen paritaetisch getragenen Satz',
  );
  assert.equal(
    v.krankenversicherung.ermaessigter_beitragssatz_prozent,
    2 * v.krankenversicherung.arbeitnehmeranteil_halber_satz_prozent,
    'voller Satz und Arbeitnehmeranteil muessen sich um den Faktor 2 unterscheiden',
  );
  assert.ok(
    prozentGleich(
      v.krankenversicherung.arbeitnehmeranteil_zusatzbeitrag_prozent,
      PARAMS_2026.vorsorge.kvZusatzAnteilProzent,
    ),
  );
  assert.equal(v.krankenversicherung.beitragsbemessungsgrenze, PARAMS_2026.vorsorge.kvBbg);
  assert.ok(
    prozentGleich(
      v.krankenversicherung.kuerzung_wegen_krankengeldanspruch_prozent,
      PARAMS_2026.vorsorge.kuerzungKrankengeld,
    ),
  );
  assert.ok(prozentGleich(v.pflegeversicherung.arbeitnehmeranteil_prozent, PARAMS_2026.vorsorge.pvProzent));
  assert.ok(
    prozentGleich(v.pflegeversicherung.kinderlosenzuschlag_prozent, PARAMS_2026.vorsorge.pvKinderlosZuschlag),
  );
  assert.ok(
    prozentGleich(
      v.pflegeversicherung.abschlag_je_kind_2_bis_5_prozent,
      PARAMS_2026.vorsorge.pvAbschlagAbZweitemKind,
    ),
  );
});

test('Der Tarif 2025 ist als Vergleichsjahr hinterlegt und weicht vom Tarif 2026 ab', () => {
  assert.equal(TARIFF_2025.year, 2025);
  assert.equal(TARIFF_2025.grundfreibetrag, 12096);
  assert.notEqual(TARIFF_2025.grundfreibetrag, TARIFF_2026.grundfreibetrag);
});
