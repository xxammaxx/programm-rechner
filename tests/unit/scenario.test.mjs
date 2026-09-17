import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analysiere, BASELINE, SZENARIEN, GESAMTSZENARIO, TARIF_VERSCHIEBUNG, SPARERPAUSCHBETRAG_AFD } from '../../assets/js/engine/scenario.js';
import { berechneJahr } from '../../assets/js/engine/est.js';

const eingabe = (over = {}) => ({
  bruttoJahr: 48000,
  kinder: 0,
  zusammenveranlagt: false,
  kapitalertragJahr: 0,
  ...over,
});

test('Die Tarifverschiebung entspricht der Differenz der Grundfreibetraege', () => {
  assert.equal(TARIF_VERSCHIEBUNG, 15000 - 12348);
  assert.equal(TARIF_VERSCHIEBUNG, 2652);
});

test('Sparer-Pauschbetrag des Programms betraegt 6.672 Euro fuer Ledige', () => {
  assert.equal(SPARERPAUSCHBETRAG_AFD.einzel, 6672);
  assert.equal(SPARERPAUSCHBETRAG_AFD.zusammen, 13344);
});

test('Abschaffung des Solidaritaetszuschlags wirkt genau in Hoehe des bisherigen Zuschlags', () => {
  const basis = berechneJahr(eingabe({ bruttoJahr: 150000 }), BASELINE);
  const ohne = berechneJahr(eingabe({ bruttoJahr: 150000 }), SZENARIEN.solidaritaetszuschlag);
  assert.ok(basis.soli.summe > 0, 'bei 150.000 Euro faellt Solidaritaetszuschlag an');
  assert.equal(ohne.soli.summe, 0);
  const differenz = Math.round((basis.gesamtsteuer - ohne.gesamtsteuer) * 100) / 100;
  assert.equal(differenz, basis.soli.summe);
});

test('Abschaffung des Solidaritaetszuschlags wirkt nicht unterhalb der Freigrenze', () => {
  const e = eingabe({ bruttoJahr: 20000 });
  const basis = berechneJahr(e, BASELINE);
  assert.equal(basis.soli.summe, 0);
  const analyse = analysiere(e);
  const vorschlag = analyse.vorschlaege.find((v) => v.id === 'afd2025-solidaritaetszuschlag-abschaffung');
  assert.equal(vorschlag.wirkungJahr, 0);
});

test('Auch bei mittlerem Einkommen faellt noch kein Solidaritaetszuschlag an', () => {
  // Nach Abzug von Pauschbeträgen und Vorsorgeaufwendungen liegt die tarifliche Steuer
  // bei 90.000 Euro Bruttolohn noch unter der Freigrenze von 20.350 Euro.
  const basis = berechneJahr(eingabe({ bruttoJahr: 90000 }), BASELINE);
  assert.ok(basis.einkommensteuerMitKinderfreibetrag < 20350);
  assert.equal(basis.soli.summe, 0);
});

test('Grundfreibetragserhoehung entlastet oberhalb des neuen Grundfreibetrags', () => {
  for (const brutto of [20000, 40000, 60000, 100000, 250000]) {
    const basis = berechneJahr(eingabe({ bruttoJahr: brutto }), BASELINE);
    const szenario = berechneJahr(eingabe({ bruttoJahr: brutto }), SZENARIEN.grundfreibetrag);
    assert.ok(
      szenario.gesamtsteuer <= basis.gesamtsteuer,
      `Grundfreibetrag belastet bei ${brutto} Euro`,
    );
  }
});

test('Grundfreibetragserhoehung wirkt nicht, wenn ohnehin keine Steuer anfaellt', () => {
  const e = eingabe({ bruttoJahr: 15000 });
  const analyse = analysiere(e);
  const vorschlag = analyse.vorschlaege.find((v) => v.id === 'afd2025-grundfreibetrag-15000');
  assert.equal(vorschlag.wirkungJahr, 0);
});

test('Sparer-Pauschbetrag wirkt nur, wenn Kapitalertraege angegeben wurden', () => {
  const ohne = analysiere(eingabe({ kapitalertragJahr: 0 }));
  const vorschlagOhne = ohne.vorschlaege.find((v) => v.id === 'afd2025-sparerpauschbetrag-6672');
  assert.equal(vorschlagOhne.anwendbar, false);
  assert.equal(vorschlagOhne.wirkungJahr, null);
  assert.equal(vorschlagOhne.nichtAnwendbarGrund, 'kein Kapitalertrag angegeben');

  const mit = analysiere(eingabe({ kapitalertragJahr: 10000 }));
  const vorschlagMit = mit.vorschlaege.find((v) => v.id === 'afd2025-sparerpauschbetrag-6672');
  assert.equal(vorschlagMit.anwendbar, true);
  assert.ok(vorschlagMit.wirkungJahr > 0);
});

test('Sparer-Pauschbetrag wirkt hoechstens mit der Differenz der Pauschbetraege', () => {
  // Differenz 6.672 - 1.000 = 5.672 Euro zusaetzlich steuerfrei. Abgeltungsteuer
  // 25 Prozent, darauf im Einzelvergleich zusaetzlich 5,5 Prozent Solidaritaetszuschlag.
  const analyse = analysiere(eingabe({ bruttoJahr: 40000, kapitalertragJahr: 50000 }));
  const vorschlag = analyse.vorschlaege.find((v) => v.id === 'afd2025-sparerpauschbetrag-6672');
  const differenz = 6672 - 1000;
  const obergrenzeMitSoli = differenz * 0.25 * 1.055;
  assert.ok(
    Math.abs(vorschlag.wirkungJahr - obergrenzeMitSoli) < 0.05,
    `Wirkung ${vorschlag.wirkungJahr} muss ${obergrenzeMitSoli} entsprechen`,
  );
  assert.ok(vorschlag.wirkungJahr <= obergrenzeMitSoli + 0.05);
});

test('Im Gesamtszenario entfaellt der Solidaritaetsanteil des Sparer-Pauschbetrags', () => {
  const mitSoli = analysiere(eingabe({ bruttoJahr: 40000, kapitalertragJahr: 50000 }));
  const gesamt = mitSoli.gesamt;
  const differenz = 6672 - 1000;
  const basisKest = (50000 - 1000) * 0.25;
  const szenarioKest = (50000 - 6672) * 0.25;
  assert.equal(Math.round((basisKest - szenarioKest) * 100) / 100, differenz * 0.25);
  assert.equal(gesamt.soli.summe, 0, 'im Gesamtszenario kein Solidaritaetszuschlag');
});

test('Sparer-Pauschbetrag wirkt nicht bei Kapitalertraegen unterhalb des geltenden Pauschbetrags', () => {
  const analyse = analysiere(eingabe({ bruttoJahr: 40000, kapitalertragJahr: 900 }));
  const vorschlag = analyse.vorschlaege.find((v) => v.id === 'afd2025-sparerpauschbetrag-6672');
  assert.equal(vorschlag.anwendbar, true);
  assert.equal(vorschlag.wirkungJahr, 0, 'bei 900 Euro faellt keine Abgeltungsteuer an');
});

test('Familiensplitting wirkt nur in Haushalten mit Kindern', () => {
  const ohneKinder = analysiere(eingabe({ kinder: 0 }));
  const vorschlagOhne = ohneKinder.vorschlaege.find((v) => v.id === 'afd2025-familiensplitting');
  assert.equal(vorschlagOhne.anwendbar, false);
  assert.equal(vorschlagOhne.nichtAnwendbarGrund, 'keine Kinder im Haushalt');

  const mitKindern = analysiere(eingabe({ kinder: 2, zusammenveranlagt: true, bruttoJahr: 60000 }));
  const vorschlagMit = mitKindern.vorschlaege.find((v) => v.id === 'afd2025-familiensplitting');
  assert.equal(vorschlagMit.anwendbar, true);
  assert.ok(vorschlagMit.wirkungJahr > 0);
});

test('Familiensplitting teilt durch die Zahl der Familienmitglieder', () => {
  const zweiErwachseneZweiKinder = berechneJahr(
    eingabe({ kinder: 2, zusammenveranlagt: true, bruttoJahr: 90000 }),
    SZENARIEN.familiensplitting,
  );
  assert.equal(zweiErwachseneZweiKinder.teiler, 4);

  const alleinerziehendEinKind = berechneJahr(
    eingabe({ kinder: 1, zusammenveranlagt: false, bruttoJahr: 50000 }),
    SZENARIEN.familiensplitting,
  );
  assert.equal(alleinerziehendEinKind.teiler, 2);
});

test('Das Gesamtszenario wirkt mindestens so stark wie das guenstigste Einzelmassnahmenbuendel', () => {
  for (const brutto of [20000, 40000, 80000, 150000]) {
    const analyse = analysiere(eingabe({ bruttoJahr: brutto, kinder: 1, zusammenveranlagt: true }));
    assert.ok(analyse.ergebnis.gesamtJahr >= analyse.ergebnis.summeDirektJahr - 0.01, `brutto ${brutto}`);
  }
});

test('Wechselwirkung wird offen ausgewiesen und erklaert die Differenz', () => {
  const analyse = analysiere(eingabe({ bruttoJahr: 80000, kinder: 1, zusammenveranlagt: true, kapitalertragJahr: 5000 }));
  const summe =
    analyse.ergebnis.summeDirektJahr + analyse.ergebnis.summeModellJahr + analyse.ergebnis.wechselwirkungJahr;
  assert.ok(Math.abs(summe - analyse.ergebnis.gesamtJahr) <= 0.02, 'Zerlegung muss aufgehen');
});

test('Abdeckung zaehlt direkt berechnete, Modellannahmen und nicht bewertete Vorschlaege', () => {
  const analyse = analysiere(eingabe({ kinder: 2, zusammenveranlagt: true, kapitalertragJahr: 0 }));
  assert.equal(analyse.abdeckung.direktBerechnet, 2, 'Grundfreibetrag und Solidaritaetszuschlag');
  assert.equal(analyse.abdeckung.nurModellannahme, 1, 'Familiensplitting');
  assert.equal(analyse.abdeckung.nichtBewertet, 1, 'Sparer-Pauschbetrag ohne Kapitalertrag');
});

test('Ergebnis kann fachlich korrekt auch null oder negativ sein', () => {
  const niedrig = analysiere(eingabe({ bruttoJahr: 15000 }));
  assert.equal(niedrig.ergebnis.gesamtJahr, 0, 'ohne Steuerlast gibt es nichts zu sparen');

  const hochMitKindern = analysiere(eingabe({ bruttoJahr: 40000, kinder: 3, zusammenveranlagt: true }));
  assert.ok(hochMitKindern.ergebnis.gesamtJahr >= 0);
});

test('Die Analyse veraendert die Eingabe nicht und speichert nichts', () => {
  const e = eingabe({ kinder: 2, kapitalertragJahr: 4000 });
  const kopie = JSON.parse(JSON.stringify(e));
  analysiere(e);
  assert.deepEqual(e, kopie, 'die Eingabe darf nicht veraendert werden');
});

test('Das Gesamtszenario kombiniert alle vier Massnahmen', () => {
  assert.equal(GESAMTSZENARIO.soliAktiv, false);
  assert.equal(GESAMTSZENARIO.sparerpauschbetrag.einzel, 6672);
  assert.equal(GESAMTSZENARIO.tarif.grundfreibetrag, 15000);
  assert.equal(GESAMTSZENARIO.teiler(true, 2), 4);
});
