import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PARAMS_2026 } from '../../assets/js/engine/params.js';
import { vorsorgeaufwendungen, berechneJahr } from '../../assets/js/engine/est.js';
import { BASELINE } from '../../assets/js/engine/scenario.js';

test('Kranken- und Pflegeversicherungsanteil stimmt mit dem offiziellen BMF-Beispiel ueberein', () => {
  // BMF-Programmablaufplan 2026, Anlage 2, Beispiel 1:
  // Bruttojahresarbeitslohn 75.000 Euro, Steuerklasse III. Der in den Lohnsteuertabellen
  // beruecksichtigte Aufwand fuer die gesetzliche Kranken- und soziale Pflegeversicherung
  // betraegt 7.149 Euro.
  //
  // Nachrechnung: 69.750 Euro (Beitragsbemessungsgrenze KV/PV 2026)
  //   * (7,0 % ermaessigter Satz + 1,45 % halber Zusatzbeitrag) = 5.893,875 Euro
  //   * 1,8 % Arbeitnehmeranteil Pflegeversicherung              = 1.255,50 Euro
  //   Summe                                                      = 7.149,375 Euro, also 7.149 Euro.
  const kvSatz = PARAMS_2026.vorsorge.kvErmaessigtProzent + PARAMS_2026.vorsorge.kvZusatzAnteilProzent;
  const kv = kvSatz * PARAMS_2026.vorsorge.kvBbg;
  const pv = PARAMS_2026.vorsorge.pvProzent * PARAMS_2026.vorsorge.kvBbg;
  assert.equal(Math.round(kv * 1000) / 1000, 5893.875);
  assert.equal(pv, 1255.5);
  assert.equal(Math.floor(kv + pv), 7149, 'muss dem amtlichen Wert 7.149 Euro entsprechen');

  // Der Veranlagungsweg des Rechners zieht zusaetzlich die vierprozentige Kuerzung nach
  // § 10 Abs. 1 Nr. 3 Satz 4 EStG ab. Die Lohnsteuer-Vorsorgepauschale tut das nicht.
  const mitKuerzung = vorsorgeaufwendungen(75000, 0).krankenversicherung;
  assert.equal(Math.round(mitKuerzung * 100) / 100, 5658.12);
});

test('Rentenversicherungsanteil wird auf die Beitragsbemessungsgrenze begrenzt', () => {
  assert.equal(vorsorgeaufwendungen(50000, 0).rentenversicherung, 4650);
  assert.equal(
    vorsorgeaufwendungen(200000, 0).rentenversicherung,
    0.093 * 101400,
    'oberhalb der Beitragsbemessungsgrenze bleibt der Abzug konstant',
  );
});

test('Pflegeversicherung: Kinderlosenzuschlag und Abschlag ab dem zweiten Kind', () => {
  const ohneKind = vorsorgeaufwendungen(60000, 0).pflegeversicherung;
  const einKind = vorsorgeaufwendungen(60000, 1).pflegeversicherung;
  const zweiKinder = vorsorgeaufwendungen(60000, 2).pflegeversicherung;
  const sechsKinder = vorsorgeaufwendungen(60000, 6).pflegeversicherung;

  assert.equal(ohneKind, (0.018 + 0.006) * 60000);
  assert.equal(einKind, 0.018 * 60000);
  assert.equal(zweiKinder, (0.018 - 0.0025) * 60000);
  // Der Abschlag gilt nur fuer das zweite bis fuenfte Kind.
  assert.equal(sechsKinder, (0.018 - 0.01) * 60000);
});

test('Zu versteuerndes Einkommen folgt dem Veranlagungsweg', () => {
  // Brutto 60.000 Euro, keine Kinder, nicht zusammenveranlagt.
  const ergebnis = berechneJahr(
    { bruttoJahr: 60000, kinder: 0, zusammenveranlagt: false, kapitalertragJahr: 0 },
    BASELINE,
  );
  const vorsorge =
    0.093 * 60000 + (0.07 + 0.0145) * 60000 * 0.96 + (0.018 + 0.006) * 60000;
  const erwartetesZvE = Math.floor(60000 - 1230 - vorsorge - 36);
  assert.equal(ergebnis.zuVersteuerndesEinkommen, erwartetesZvE);
  assert.equal(ergebnis.abzuege.vorsorge.summe, vorsorge);
});

test('Kinderfreibetrag mindert das zu versteuernde Einkommen, wenn er guenstiger ist', () => {
  const ohne = berechneJahr(
    { bruttoJahr: 120000, kinder: 0, zusammenveranlagt: true, kapitalertragJahr: 0 },
    BASELINE,
  );
  const mit = berechneJahr(
    { bruttoJahr: 120000, kinder: 2, zusammenveranlagt: true, kapitalertragJahr: 0 },
    BASELINE,
  );
  assert.equal(mit.kinderfreibetragGesamt, 2 * 9756);
  assert.equal(
    mit.zuVersteuerndesEinkommenMitKinderfreibetrag,
    mit.zuVersteuerndesEinkommen - 2 * 9756,
  );
  assert.ok(mit.ersparnisKinderfreibetrag > mit.kindergeld, 'bei hohem Einkommen ist der Freibetrag guenstiger');
  assert.equal(mit.familienleistungsausgleich, mit.ersparnisKinderfreibetrag);
  assert.ok(mit.einkommensteuer < ohne.einkommensteuer);
});

test('Bei mittlerem Einkommen ist das Kindergeld guenstiger als der Kinderfreibetrag', () => {
  const ergebnis = berechneJahr(
    { bruttoJahr: 60000, kinder: 2, zusammenveranlagt: true, kapitalertragJahr: 0 },
    BASELINE,
  );
  assert.equal(ergebnis.kindergeld, 2 * 3108);
  assert.ok(ergebnis.ersparnisKinderfreibetrag < ergebnis.kindergeld);
  assert.equal(ergebnis.familienleistungsausgleich, ergebnis.kindergeld);
  assert.equal(ergebnis.einkommensteuer, ergebnis.einkommensteuerVorFamilienleistungsausgleich - ergebnis.kindergeld);
});

test('Solidaritaetszuschlag nutzt die Steuer mit Kinderfreibetrag als Bemessungsgrundlage', () => {
  // § 3 Abs. 2 SolzG 1995: der Kinderfreibetrag ist fuer den Solidaritaetszuschlag in
  // allen Faellen des § 32 EStG anzusetzen.
  const ergebnis = berechneJahr(
    { bruttoJahr: 200000, kinder: 2, zusammenveranlagt: true, kapitalertragJahr: 0 },
    BASELINE,
  );
  assert.equal(ergebnis.soli.bemessungsgrundlage, ergebnis.einkommensteuerMitKinderfreibetrag ?? 0);
});

test('Alleinstehende erhalten keinen Splittingvorteil, Verheiratete schon', () => {
  const allein = berechneJahr(
    { bruttoJahr: 80000, kinder: 0, zusammenveranlagt: false, kapitalertragJahr: 0 },
    BASELINE,
  );
  const verheiratet = berechneJahr(
    { bruttoJahr: 80000, kinder: 0, zusammenveranlagt: true, kapitalertragJahr: 0 },
    BASELINE,
  );
  assert.equal(allein.teiler, 1);
  assert.equal(verheiratet.teiler, 2);
  assert.ok(verheiratet.einkommensteuer < allein.einkommensteuer);
});

test('Entlastungsbetrag fuer Alleinerziehende mindert das zu versteuernde Einkommen', () => {
  const mitKind = berechneJahr(
    { bruttoJahr: 40000, kinder: 1, zusammenveranlagt: false, kapitalertragJahr: 0 },
    BASELINE,
  );
  const vergleich = berechneJahr(
    { bruttoJahr: 40000, kinder: 0, zusammenveranlagt: false, kapitalertragJahr: 0 },
    BASELINE,
  );
  assert.equal(mitKind.abzuege.entlastungAlleinerziehende, 4260);
  assert.equal(vergleich.abzuege.entlastungAlleinerziehende, 0);
});

test('Sparer-Pauschbetrag mindert die Bemessungsgrundlage der Abgeltungsteuer', () => {
  const unter = berechneJahr(
    { bruttoJahr: 40000, kinder: 0, zusammenveranlagt: false, kapitalertragJahr: 800 },
    BASELINE,
  );
  assert.equal(unter.abgeltungsteuer, 0, 'innerhalb des Sparer-Pauschbetrags keine Abgeltungsteuer');

  const ueber = berechneJahr(
    { bruttoJahr: 40000, kinder: 0, zusammenveranlagt: false, kapitalertragJahr: 3000 },
    BASELINE,
  );
  assert.equal(ueber.kapitalertraegeNachPauschbetrag, 2000);
  assert.equal(ueber.abgeltungsteuer, 500);
  assert.ok(ueber.soli.zuschlagAufKapitalertragsteuer > 0);
});

test('Ohne Einkommen entsteht keine negative Steuer, aber ein Familienleistungsanspruch', () => {
  const ergebnis = berechneJahr(
    { bruttoJahr: 0, kinder: 2, zusammenveranlagt: true, kapitalertragJahr: 0 },
    BASELINE,
  );
  assert.equal(ergebnis.einkommensteuerVorFamilienleistungsausgleich, 0);
  assert.equal(ergebnis.einkommensteuer, -2 * 3108);
  assert.equal(ergebnis.soli.summe, 0);
});
