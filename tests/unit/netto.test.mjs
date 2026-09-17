import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  arbeitnehmerbeitraege,
  nettoJahr,
  bruttoAusNetto,
  bruttoBandAusNetto,
  NETTO_BANDBREITE,
} from '../../assets/js/engine/netto.js';
import { analysiere, BASELINE } from '../../assets/js/engine/scenario.js';

const haushalt = (over = {}) => ({ kinder: 0, zusammenveranlagt: false, ...over });

test('Arbeitnehmerbeitraege enthalten vier Zweige und respektieren beide Grenzen', () => {
  const b = arbeitnehmerbeitraege(60000, 0);
  assert.equal(b.rentenversicherung, 0.093 * 60000);
  assert.equal(b.arbeitslosenversicherung, 0.013 * 60000);
  assert.equal(b.krankenversicherung, 0.0845 * 60000);
  assert.equal(b.pflegeversicherung, 0.024 * 60000);
  assert.equal(b.summe, b.rentenversicherung + b.arbeitslosenversicherung + b.krankenversicherung + b.pflegeversicherung);

  const hoch = arbeitnehmerbeitraege(300000, 0);
  assert.equal(hoch.rentenversicherung, 0.093 * 101400);
  assert.equal(hoch.krankenversicherung, 0.0845 * 69750);
});

test('Nettogehalt ist stueckweise monoton steigend', () => {
  let vorher = -Infinity;
  for (let brutto = 0; brutto <= 300000; brutto += 500) {
    const netto = nettoJahr(brutto, haushalt(), BASELINE).netto;
    assert.ok(netto >= vorher, `Netto sinkt bei Brutto ${brutto}`);
    vorher = netto;
  }
});

test('Nettogehalt ist immer kleiner als das Bruttogehalt', () => {
  for (const brutto of [1000, 20000, 50000, 90000, 250000]) {
    const netto = nettoJahr(brutto, haushalt(), BASELINE).netto;
    assert.ok(netto < brutto, `Netto muss unter Brutto liegen bei ${brutto}`);
  }
});

test('Rueckrechnung Netto auf Brutto trifft das Ausgangsbrutto', () => {
  // Wegen der Abrundung des Tarifs auf volle Euro hat das Nettogehalt kleine
  // Saegezahnstufen. Die Umkehrung ist deshalb nur bis auf einen Rest von unter einem
  // Euro eindeutig. Geprueft wird, dass das zurueckgerechnete Brutto dicht am
  // Ausgangswert liegt UND dass das verbleibende Netto nur minimal abweicht.
  for (const brutto of [24000, 36000, 48000, 60000, 84000, 120000, 200000]) {
    for (const h of [haushalt(), haushalt({ zusammenveranlagt: true }), haushalt({ zusammenveranlagt: true, kinder: 2 })]) {
      const netto = nettoJahr(brutto, h, BASELINE).netto;
      const rueck = bruttoAusNetto(netto, h, BASELINE);
      assert.equal(rueck.mehrdeutig, false);
      assert.ok(
        Math.abs(rueck.rest) <= 1,
        `Rest ${rueck.rest} bei Brutto ${brutto} ist zu gross`,
      );
      assert.ok(
        Math.abs(rueck.brutto - brutto) <= 10,
        `Brutto ${brutto} wurde als ${rueck.brutto} zurueckgerechnet`,
      );
    }
  }
});

test('Die Rueckrechnung ist monoton: hoeheres Netto ergibt hoeheres Brutto', () => {
  let vorher = 0;
  for (let netto = 10000; netto <= 60000; netto += 1000) {
    const brutto = bruttoAusNetto(netto, haushalt(), BASELINE).brutto;
    assert.ok(brutto >= vorher, `Brutto sinkt bei Netto ${netto}`);
    vorher = brutto;
  }
});

test('Rueckrechnung liefert eine Bandbreite um das geschaetzte Brutto', () => {
  const rueck = bruttoBandAusNetto(30000, haushalt(), BASELINE);
  assert.equal(rueck.mehrdeutig, false);
  assert.equal(rueck.band.von, Math.round(rueck.brutto * (1 - NETTO_BANDBREITE)));
  assert.equal(rueck.band.bis, Math.round(rueck.brutto * (1 + NETTO_BANDBREITE)));
  assert.ok(rueck.band.von < rueck.brutto && rueck.brutto < rueck.band.bis);
});

test('Die Bandbreite ist im Szenarienvergleich enger als das Ergebnis selbst', () => {
  // Die Bandbreite darf das Ergebnis nicht unbrauchbar machen, aber sie muss sichtbar sein.
  const netto = 24000;
  const band = bruttoBandAusNetto(netto, haushalt(), BASELINE);
  const unten = analysiere({ bruttoJahr: band.band.von, kinder: 0, zusammenveranlagt: false, kapitalertragJahr: 0 });
  const oben = analysiere({ bruttoJahr: band.band.bis, kinder: 0, zusammenveranlagt: false, kapitalertragJahr: 0 });
  assert.ok(unten.ergebnis.gesamtJahr !== oben.ergebnis.gesamtJahr, 'die Bandbreite muss sich im Ergebnis zeigen');
});

test('Null oder negatives Netto liefert kein erfundenes Brutto', () => {
  const r = bruttoAusNetto(0, haushalt(), BASELINE);
  assert.equal(r.brutto, 0);
  assert.equal(bruttoAusNetto(-500, haushalt(), BASELINE).brutto, 0);
});

test('Unrealistisch hohes Netto wird als nicht abbildbar gemeldet', () => {
  const r = bruttoAusNetto(1500000, haushalt(), BASELINE);
  assert.equal(r.brutto, null);
  assert.equal(r.mehrdeutig, true);
  assert.ok(r.grund);
});
