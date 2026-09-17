import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PARAMS_2026, papMSOLZ } from '../../assets/js/engine/params.js';
import { solidaritaetszuschlag } from '../../assets/js/engine/soli.js';

test('Unterhalb der Freigrenze faellt kein Solidaritaetszuschlag an', () => {
  const r = solidaritaetszuschlag({ einkommensteuerMitKinderfreibetrag: 20350 });
  assert.equal(r.summe, 0);
  assert.equal(r.zuschlagAufTarif, 0);
});

test('Freigrenzen 2026 sind 20.350 Euro und 40.700 Euro', () => {
  assert.equal(solidaritaetszuschlag({ einkommensteuerMitKinderfreibetrag: 20351 }).freigrenze, 20350);
  assert.equal(
    solidaritaetszuschlag({ einkommensteuerMitKinderfreibetrag: 20351, zusammenveranlagt: true }).freigrenze,
    40700,
  );
  assert.equal(solidaritaetszuschlag({ einkommensteuerMitKinderfreibetrag: 40700, zusammenveranlagt: true }).summe, 0);
});

test('Milderungszone endet bei Freigrenze mal 1,859375', () => {
  const freigrenze = 20350;
  const ende = freigrenze * PARAMS_2026.solidaritaetszuschlag.milderungszoneEndeFaktor;

  const knappDavor = solidaritaetszuschlag({ einkommensteuerMitKinderfreibetrag: ende - 1 });
  assert.ok(knappDavor.milderungszoneGreift, 'knapp unterhalb muss die Milderungszone greifen');
  assert.ok(knappDavor.zuschlagAufTarif < (ende - 1) * 0.055, 'Milderungszone muss den vollen Satz unterschreiten');
  assert.equal(
    knappDavor.zuschlagAufTarif,
    Math.floor((Math.round((ende - 1) * 100) - freigrenze * 100) * 11.9 / 100) / 100,
  );

  const knappDanachCent = Math.floor(freigrenze * 100 * 1.859375) + 1;
  const knappDanach = solidaritaetszuschlag({ einkommensteuerMitKinderfreibetrag: knappDanachCent / 100 });
  assert.equal(knappDanach.milderungszoneGreift, false, 'ab dem Ende gilt der volle Satz');
  assert.equal(knappDanach.zuschlagAufTarif, Math.floor((knappDanachCent * 5.5) / 100) / 100);
});

test('Ab der Milderungszone gilt der volle Satz von 5,5 Prozent', () => {
  const r = solidaritaetszuschlag({ einkommensteuerMitKinderfreibetrag: 100000 });
  assert.equal(r.zuschlagAufTarif, Math.floor(100000 * 0.055 * 100) / 100);
});

test('Implementierung stimmt im Kernbereich mit dem offiziellen BMF-Programmablaufplan 2026 ueberein', () => {
  // Modul MSOLZ des PAP 2026 arbeitet in Cent-Feldern und ohne Kapitalertragsteuer.
  for (let bemessung = 0; bemessung <= 400000; bemessung += 37) {
    for (const zusammenveranlagt of [false, true]) {
      const eigener = solidaritaetszuschlag({ einkommensteuerMitKinderfreibetrag: bemessung, zusammenveranlagt });
      const pap = papMSOLZ(bemessung * 100, zusammenveranlagt ? 2 : 1);
      assert.equal(
        eigener.zuschlagAufTarif,
        pap,
        `Abweichung zum PAP bei Bemessungsgrundlage ${bemessung}, zusammenveranlagt=${zusammenveranlagt}`,
      );
    }
  }
});

test('Kapitalertragsteuer wird ohne Freigrenze mit 5,5 Prozent verzuschlagt', () => {
  // § 3 Abs. 3 Satz 2 und § 4 Satz 3 SolzG 1995.
  const r = solidaritaetszuschlag({
    einkommensteuerMitKinderfreibetrag: 0,
    kapitalertragsteuer: 1000,
  });
  assert.equal(r.zuschlagAufTarif, 0, 'unterhalb der Freigrenze kein Zuschlag auf den Tarif');
  assert.equal(r.zuschlagAufKapitalertragsteuer, 55);
  assert.equal(r.summe, 55);
});

test('Solidaritaetszuschlag ist monoton und nie negativ', () => {
  let vorher = 0;
  for (let bemessung = 0; bemessung <= 500000; bemessung += 211) {
    const wert = solidaritaetszuschlag({ einkommensteuerMitKinderfreibetrag: bemessung }).summe;
    assert.ok(wert >= vorher, `Zuschlag sinkt bei ${bemessung}`);
    assert.ok(wert >= 0);
    vorher = wert;
  }
});
