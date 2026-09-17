import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PARAMS_2026, TARIFF_2026 } from '../../assets/js/engine/params.js';
import { tariffTax } from '../../assets/js/engine/tariff.js';
import { vorsorgeaufwendungen } from '../../assets/js/engine/est.js';
import { solidaritaetszuschlag } from '../../assets/js/engine/soli.js';
import { TARIF_VERSCHIEBUNG } from '../../assets/js/engine/scenario.js';

const referenz = JSON.parse(
  await readFile(new URL('bmf-2026-reference.json', import.meta.url), 'utf8'),
);

test('Die amtlichen Parameter des BMF-Programmablaufplans 2026 sind in der Engine hinterlegt', () => {
  const w = referenz.pap_2026_parameter.werte;
  assert.equal(w.GFB, TARIFF_2026.grundfreibetrag);
  assert.equal(w.SOLZFREI, PARAMS_2026.solidaritaetszuschlag.freigrenzeEinzel);
  assert.equal(w.BBGRVALV, PARAMS_2026.vorsorge.rvBbg);
  assert.equal(w.BBGKVPV, PARAMS_2026.vorsorge.kvBbg);
  assert.equal(w.RVSATZAN, PARAMS_2026.vorsorge.rvProzent);
  assert.equal(w.KVSATZAN_ermaessigt, PARAMS_2026.vorsorge.kvErmaessigtProzent);
  assert.equal(w.PVSATZAN, PARAMS_2026.vorsorge.pvProzent);
  assert.equal(w.ANP, PARAMS_2026.pauschbetraege.arbeitnehmer);
  assert.equal(w.SAP, PARAMS_2026.pauschbetraege.sonderausgaben);
  assert.equal(w.EFA, PARAMS_2026.pauschbetraege.entlastungAlleinerziehende);
  assert.equal(w.KFB_je_kind_steuerklasse_1, PARAMS_2026.kinder.freibetragJeElternteilJeKind);
  assert.equal(w.KFB_je_kind_steuerklasse_3, PARAMS_2026.kinder.freibetragZusammenJeKind);
  assert.ok(
    Math.abs(PARAMS_2026.vorsorge.kvZusatzAnteilProzent * 200 - w.durchschnittlicher_zusatzbeitragssatz_prozent) < 1e-9,
    'der halbe Zusatzbeitragssatz muss dem halben amtlichen Durchschnittssatz entsprechen',
  );
});

test('Das amtliche Rechenbeispiel zum Kranken- und Pflegeversicherungsanteil wird exakt reproduziert', () => {
  const b = referenz.amtliches_rechenbeispiel;
  assert.equal(b.status, 'bestaetigt');
  const kvSatz = PARAMS_2026.vorsorge.kvErmaessigtProzent + PARAMS_2026.vorsorge.kvZusatzAnteilProzent;
  const anteil = kvSatz * PARAMS_2026.vorsorge.kvBbg + PARAMS_2026.vorsorge.pvProzent * PARAMS_2026.vorsorge.kvBbg;
  assert.equal(Math.floor(anteil), b.amtlicher_wert.vorsorgepauschale_kv_pv_anteil_euro);
});

test('Die offene Differenz zum amtlichen Tabellenwert ist dokumentiert und nicht beschoenigt', () => {
  const n = referenz.amtliches_rechenbeispiel.nicht_reproduziert;
  assert.equal(n.status, 'offen dokumentiert');
  assert.ok(n.differenz_euro > 0, 'die Differenz muss benannt sein');
  assert.ok(
    n.erklaerung.includes('Veranlagungsverfahren'),
    'die Erklaerung muss auf den unterschiedlichen Berechnungsweg hinweisen',
  );
});

test('Die Tarifreferenzwerte werden reproduziert', () => {
  for (const { zve, est } of referenz.tarif_referenzwerte.werte_2026) {
    assert.equal(tariffTax(zve, TARIFF_2026), est, `VZ 2026, zvE ${zve}`);
  }
});

test('Die Referenzwerte des Solidaritaetszuschlags werden reproduziert', () => {
  const s = referenz.solidaritaetszuschlag_referenzwerte;
  assert.equal(s.freigrenze_einzel, PARAMS_2026.solidaritaetszuschlag.freigrenzeEinzel);
  assert.equal(s.freigrenze_zusammenveranlagung, PARAMS_2026.solidaritaetszuschlag.freigrenzeZusammen);
  assert.equal(solidaritaetszuschlag({ einkommensteuerMitKinderfreibetrag: s.freigrenze_einzel }).summe, 0);
  const ende = s.freigrenze_einzel * s.milderungszone_ende_faktor;
  assert.ok(Math.abs(ende - s.milderungszone_ende_einzel_euro) < 1e-6);
  const oberhalb = solidaritaetszuschlag({ einkommensteuerMitKinderfreibetrag: Math.ceil(ende) });
  assert.equal(oberhalb.milderungszoneGreift, false);
  assert.equal(oberhalb.zuschlagAufTarif, Math.floor(Math.ceil(ende) * 100 * 5.5 / 100) / 100);
});

test('Die ZEW-Werte sind als reine Referenz gekennzeichnet und werden nicht als Zielwert verwendet', () => {
  const z = referenz.zew_referenzwerte;
  assert.equal(z.status, 'nur_referenz_keine_ableitung');
  assert.ok(z.erklaerung ?? z.hinweis);
  assert.ok(z.bekannte_unterschiede_zum_rechner.length >= 4);
  const alle = z.bekannte_unterschiede_zum_rechner.join(' ');
  assert.ok(alle.includes('2.400'), 'die Sparer-Pauschbetrag-Abweichung muss benannt sein');
  assert.ok(alle.includes('20/13356'), 'der Fraktionsantrag muss benannt sein');
  assert.ok(alle.includes('Wohngeld'), 'die fehlenden Transferwirkungen muessen benannt sein');
  // Die Ursachenangabe steht in der Pressemitteilung, nicht im Gutachten. Das muss so
  // belegt sein, damit keine Aussage dem falschen Dokument zugeschrieben wird.
  assert.ok(z.pressemitteilung, 'die Pressemitteilung muss als eigene Quelle geführt sein');
  assert.match(z.pressemitteilung.url, /^https:\/\/www\.zew\.de\/presse\//);
  assert.ok(z.pressemitteilung.zitat.includes('Anrechnungsregeln beim Wohngeld'));
  assert.ok(
    z.pressemitteilung.hinweis.includes('nicht im Gutachten'),
    'der Unterschied zwischen Gutachten und Pressemitteilung muss benannt sein',
  );
  assert.ok(alle.includes('im Gutachten selbst ist nur der Wert 440 Euro ablesbar'));
});

test('Das AfD-Szenario verschiebt den Tarif genau um die Grundfreibetragsdifferenz', () => {
  assert.equal(TARIF_VERSCHIEBUNG, 2652);
  assert.equal(15000 - TARIFF_2026.grundfreibetrag, TARIF_VERSCHIEBUNG);
});

test('Vorsorgeaufwendungen respektieren beide Beitragsbemessungsgrenzen', () => {
  const hoch = vorsorgeaufwendungen(300000, 0);
  assert.equal(hoch.rentenversicherung, 0.093 * PARAMS_2026.vorsorge.rvBbg);
  const kvSatz = PARAMS_2026.vorsorge.kvErmaessigtProzent + PARAMS_2026.vorsorge.kvZusatzAnteilProzent;
  assert.equal(hoch.krankenversicherung, kvSatz * PARAMS_2026.vorsorge.kvBbg * 0.96);
  assert.equal(hoch.pflegeversicherung, (0.018 + 0.006) * PARAMS_2026.vorsorge.kvBbg);
});
