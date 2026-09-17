import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TARIFF_2025, TARIFF_2026, papUPTAB26 } from '../../assets/js/engine/params.js';
import { tariffTax, tariffTaxSplit, shiftTariff } from '../../assets/js/engine/tariff.js';

// Referenzwerte, unabhängig aus dem Gesetzeswortlaut des § 32a Abs. 1 EStG berechnet.
// Die Werte für 2026 wurden zusätzlich gegen die Wertetabelle im BMF-Programmablaufplan
// 2026 (Modul UPTAB26) und gegen eine zweite, unabhängige Herleitung geprüft.
const REFERENZ = {
  2025: [
    [12096, 0],
    [17443, 1015],
    [68480, 17849],
    [277825, 105774],
    [100000, 31088],
    [300000, 115753],
  ],
  2026: [
    [12348, 0],
    [17799, 1034],
    [69878, 18213],
    [277825, 105550],
    [277826, 105551],
    [100000, 30864],
    [300000, 115529],
  ],
};

test('Grundfreibetrag ist steuerfrei, der erste Euro darüber nicht', () => {
  assert.equal(tariffTax(0), 0);
  assert.equal(tariffTax(12348), 0, 'zvE genau auf dem Grundfreibetrag ergibt 0');
  // (914,51 * 0,0001 + 1400) * 0,0001 = 0,1400009 -> auf volle Euro abgerundet 0
  assert.equal(tariffTax(12349), 0);
});

test('Tarifwerte stimmen mit den aus dem Gesetz abgeleiteten Referenzwerten überein', () => {
  for (const [zve, erwartet] of REFERENZ[2026]) {
    assert.equal(tariffTax(zve, TARIFF_2026), erwartet, `VZ 2026, zvE ${zve}`);
  }
});

test('Tarif 2025 stimmt mit den aus dem Gesetz abgeleiteten Referenzwerten überein', () => {
  for (const [zve, erwartet] of REFERENZ[2025]) {
    assert.equal(tariffTax(zve, TARIFF_2025), erwartet, `VZ 2025, zvE ${zve}`);
  }
});

test('Implementierung stimmt mit dem offiziellen BMF-Programmablaufplan 2026 überein', () => {
  const stichproben = [];
  for (let x = 0; x <= 400000; x += 1) stichproben.push(x);
  for (let x = 400000; x <= 5000000; x += 997) stichproben.push(x);
  for (const x of stichproben) {
    assert.equal(tariffTax(x, TARIFF_2026), papUPTAB26(x), `Abweichung zum PAP bei zvE ${x}`);
  }
});

test('Tarif ist an jeder Zonengrenze stetig und monoton', () => {
  const grenzen = [
    TARIFF_2026.grundfreibetrag,
    TARIFF_2026.zone2.upper,
    TARIFF_2026.zone3.upper,
    TARIFF_2026.zone4.upper,
  ];
  for (const grenze of grenzen) {
    const vor = tariffTax(grenze, TARIFF_2026);
    const nach = tariffTax(grenze + 1, TARIFF_2026);
    assert.ok(nach >= vor, `Steuer darf an der Grenze ${grenze} nicht sinken`);
    assert.ok(nach - vor <= 1, `Sprung an der Grenze ${grenze} ist zu gross: ${nach - vor} Euro`);
  }

  let vorherigerWert = 0;
  for (let x = 0; x <= 1000000; x += 137) {
    const wert = tariffTax(x, TARIFF_2026);
    assert.ok(wert >= vorherigerWert, `Steuer sinkt bei zvE ${x}`);
    vorherigerWert = wert;
  }
});

test('zu versteuerndes Einkommen und Steuerbetrag werden auf volle Euro abgerundet', () => {
  assert.equal(tariffTax(50000.9, TARIFF_2026), tariffTax(50000, TARIFF_2026));
  assert.equal(tariffTax(12348.99, TARIFF_2026), 0);
  assert.ok(Number.isInteger(tariffTax(54321.75, TARIFF_2026)));
});

test('Splittingverfahren: das Zweifache des Betrags für die Haelfte', () => {
  for (const zve of [20000, 40000, 60000, 80000, 120000, 250000, 1000000]) {
    assert.equal(tariffTaxSplit(zve, 2, TARIFF_2026), 2 * tariffTax(Math.floor(zve / 2), TARIFF_2026));
  }
  // Splitting darf die Steuer nie erhoehen.
  for (let zve = 0; zve <= 400000; zve += 997) {
    assert.ok(tariffTaxSplit(zve, 2, TARIFF_2026) <= tariffTax(zve, TARIFF_2026), `zvE ${zve}`);
  }
});

test('Splitting mit Teiler 2 entspricht der ganzzahligen Division des BMF-Programmablaufplans', () => {
  // Modul UPMLST: X = ZVE / KZTAB, danach Abrundung auf volle Euro.
  for (let zve = 0; zve <= 200000; zve += 313) {
    const papX = Math.floor(zve / 2);
    assert.equal(tariffTaxSplit(zve, 2, TARIFF_2026), 2 * papUPTAB26(papX), `zvE ${zve}`);
  }
});

test('Verschobener Tarif entspricht exakt dem Ausgangstarif an der verschobenen Stelle', () => {
  const verschoben = shiftTariff(TARIFF_2026, 2652);
  assert.equal(verschoben.grundfreibetrag, 15000);
  for (let x = 15000; x <= 600000; x += 91) {
    assert.equal(tariffTax(x, verschoben), tariffTax(x - 2652, TARIFF_2026), `zvE ${x}`);
  }
  // Unterhalb des neuen Grundfreibetrags darf keine Steuer entstehen.
  assert.equal(tariffTax(15000, verschoben), 0);
  assert.equal(tariffTax(14999, verschoben), 0);
});

test('Verschobener Tarif bleibt stetig und monoton', () => {
  const verschoben = shiftTariff(TARIFF_2026, 2652);
  let vorherigerWert = 0;
  for (let x = 14000; x <= 400000; x += 61) {
    const wert = tariffTax(x, verschoben);
    assert.ok(wert >= vorherigerWert, `Steuer sinkt bei zvE ${x}`);
    vorherigerWert = wert;
  }
  for (const grenze of [15000, 20451, 72530, 280477]) {
    const diff = tariffTax(grenze + 1, verschoben) - tariffTax(grenze, verschoben);
    assert.ok(diff >= 0 && diff <= 1, `Sprung an der Grenze ${grenze}: ${diff} Euro`);
  }
});

test('Verschobener Tarif entlastet ueberall und kostet niemanden mehr', () => {
  const verschoben = shiftTariff(TARIFF_2026, 2652);
  for (let x = 0; x <= 600000; x += 53) {
    assert.ok(
      tariffTax(x, verschoben) <= tariffTax(x, TARIFF_2026),
      `Grundfreibetragsanhebung belastet bei zvE ${x}`,
    );
  }
});
