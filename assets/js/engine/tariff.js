import { TARIFF_2026 } from './params.js';

// § 32a Abs. 1 EStG.
//  - Das zu versteuernde Einkommen wird vor der Tarifanwendung auf volle Euro abgerundet
//    (§ 32a Abs. 1 Satz 1 EStG). Alle Zonengrenzen sind deshalb Euro-Ganzzahlen.
//  - y und z werden aus dem bereits abgerundeten Wert gebildet
//    (§ 32a Abs. 1 Satz 3 und 4 EStG).
//  - Der Steuerbetrag wird auf den nächsten vollen Euro abgerundet
//    (§ 32a Abs. 1 Satz 6 EStG).
export function tariffTax(zuVersteuerndesEinkommen, tariff = TARIFF_2026) {
  const x = Math.floor(zuVersteuerndesEinkommen);
  if (x <= tariff.grundfreibetrag) return 0;

  let steuerbetrag;
  if (x <= tariff.zone2.upper) {
    const y = (x - tariff.grundfreibetrag) / 10000;
    steuerbetrag = (tariff.zone2.a * y + tariff.zone2.b) * y;
  } else if (x <= tariff.zone3.upper) {
    const z = (x - tariff.zone3.base) / 10000;
    steuerbetrag = (tariff.zone3.a * z + tariff.zone3.b) * z + tariff.zone3.c;
  } else if (x <= tariff.zone4.upper) {
    steuerbetrag = tariff.zone4.mult * x - tariff.zone4.sub;
  } else {
    steuerbetrag = tariff.zone5.mult * x - tariff.zone5.sub;
  }
  return Math.floor(steuerbetrag);
}

// § 32a Abs. 5 EStG: das Zweifache des Betrags für die Hälfte des zu versteuernden
// Einkommens. Die Hälfte wird nach Absatz 1 auf volle Euro abgerundet; genau das leistet
// die ganzzahlige Division ZVE / KZTAB im Modul UPMLST des BMF-Programmablaufplans 2026.
// Das Splittingverfahren wird hier allgemein über den Teiler abgebildet, weil das
// Familiensplitting denselben Mechanismus mit einem grösseren Teiler verwendet.
export function tariffTaxSplit(zuVersteuerndesEinkommen, teiler, tariff = TARIFF_2026) {
  if (teiler <= 1) return tariffTax(zuVersteuerndesEinkommen, tariff);
  const anteil = Math.floor(Math.floor(zuVersteuerndesEinkommen) / teiler);
  return teiler * tariffTax(anteil, tariff);
}

// Parallele Verschiebung des Tarifs um delta Euro nach rechts.
// Die Zonenbreiten, die Koeffizienten und damit die Progression bleiben unverändert;
// die Achsenabschnitte der Zonen 4 und 5 werden so angepasst, dass der Tarif an jeder
// Zonengrenze stetig bleibt. Es gilt exakt: verschobener Tarif(x) = Ausgangstarif(x - delta).
export function shiftTariff(tariff, delta) {
  if (!delta) return tariff;
  return Object.freeze({
    year: tariff.year,
    grundfreibetrag: tariff.grundfreibetrag + delta,
    zone2: Object.freeze({ ...tariff.zone2, upper: tariff.zone2.upper + delta }),
    zone3: Object.freeze({ ...tariff.zone3, upper: tariff.zone3.upper + delta, base: tariff.zone3.base + delta }),
    zone4: Object.freeze({
      ...tariff.zone4,
      upper: tariff.zone4.upper + delta,
      sub: tariff.zone4.sub + tariff.zone4.mult * delta,
    }),
    zone5: Object.freeze({ ...tariff.zone5, sub: tariff.zone5.sub + tariff.zone5.mult * delta }),
  });
}
