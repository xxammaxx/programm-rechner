import { PARAMS_2026 } from './params.js';

// § 4 Satz 3 SolzG 1995: Bruchteile eines Cents bleiben ausser Ansatz.
// Gerechnet wird deshalb durchgehend in Cent, wie im Modul MSOLZ des
// BMF-Programmablaufplans 2026. Das vermeidet Rundungsartefakte aus der
// Gleitkommarechnung, die sonst zu Abweichungen von einem Cent führen.
function inCent(euro) {
  return Math.round(euro * 100);
}

function ausCent(cent) {
  return cent / 100;
}

// §§ 3 und 4 SolzG 1995.
//
// Bemessungsgrundlage ist nach § 3 Abs. 2 SolzG 1995 die Einkommensteuer, die unter
// Berücksichtigung der Freibeträge nach § 32 Abs. 6 EStG in ALLEN Fällen des § 32 EStG
// festzusetzen wäre. Der Kinderfreibetrag wird für den Solidaritätszuschlag also immer
// angesetzt, unabhängig davon, ob bei der Einkommensteuer das Kindergeld günstiger ist.
//
// Nach § 3 Abs. 3 Satz 1 wird die Freigrenze gegen die Bemessungsgrundlage vermindert um
// die Einkommensteuer nach § 32d Abs. 3 und 4 EStG geprüft. Nach § 3 Abs. 3 Satz 2 und
// § 4 Satz 3 SolzG 1995 wird der Solidaritätszuschlag auf die Einkommensteuer nach § 32d
// Abs. 3 und 4 EStG dagegen ungeachtet der Freigrenze mit 5,5 Prozent erhoben.
export function solidaritaetszuschlag(
  { einkommensteuerMitKinderfreibetrag, kapitalertragsteuer = 0, zusammenveranlagt = false },
  params = PARAMS_2026,
) {
  const s = params.solidaritaetszuschlag;
  const freigrenzeEuro = zusammenveranlagt ? s.freigrenzeZusammen : s.freigrenzeEinzel;

  const bemessungsgrundlageCent = Math.max(
    0,
    inCent(einkommensteuerMitKinderfreibetrag) - inCent(kapitalertragsteuer),
  );
  const freigrenzeCent = inCent(freigrenzeEuro);

  let zuschlagAufTarifCent = 0;
  if (bemessungsgrundlageCent > freigrenzeCent) {
    const vollerSatzCent = Math.floor((bemessungsgrundlageCent * 5.5) / 100);
    const milderungszoneCent = Math.floor(((bemessungsgrundlageCent - freigrenzeCent) * 11.9) / 100);
    zuschlagAufTarifCent = Math.min(vollerSatzCent, milderungszoneCent);
  }

  // Ungeachtet der Freigrenze, § 3 Abs. 3 Satz 2 und § 4 Satz 3 SolzG 1995.
  const zuschlagAufKapitalertragsteuerCent = Math.floor((inCent(kapitalertragsteuer) * 5.5) / 100);

  const endeMilderungszoneCent = Math.floor(freigrenzeCent * s.milderungszoneEndeFaktor);

  return {
    freigrenze: freigrenzeEuro,
    bemessungsgrundlage: ausCent(bemessungsgrundlageCent),
    milderungszoneGreift:
      bemessungsgrundlageCent > freigrenzeCent && bemessungsgrundlageCent < endeMilderungszoneCent,
    zuschlagAufTarif: ausCent(zuschlagAufTarifCent),
    zuschlagAufKapitalertragsteuer: ausCent(zuschlagAufKapitalertragsteuerCent),
    summe: ausCent(zuschlagAufTarifCent + zuschlagAufKapitalertragsteuerCent),
  };
}

// § 4 Satz 3 SolzG 1995: Bruchteile eines Cents bleiben ausser Ansatz.
// Abschneiden, nicht kaufmaennisch runden.
export function ohneCentBruchteile(betrag) {
  return Math.floor(betrag * 100) / 100;
}
