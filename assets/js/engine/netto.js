import { PARAMS_2026 } from './params.js';
import { berechneJahr } from './est.js';

// Arbeitnehmerbeitraege zur Sozialversicherung. Sie mindern das Nettogehalt, sind aber
// nicht mit den abzugsfaehigen Vorsorgeaufwendungen nach § 10 EStG gleichzusetzen:
// Die Arbeitslosenversicherung wirkt sich im Veranlagungsverfahren nicht aus, und die
// vierprozentige Kuerzung nach § 10 Abs. 1 Nr. 3 Satz 4 EStG gilt nur fuer den
// Sonderausgabenabzug, nicht fuer den tatsaechlichen Beitrag.
export const ARBEITSLOSENVERSICHERUNG_AN_PROZENT = 0.013;

export function arbeitnehmerbeitraege(brutto, kinder, params = PARAMS_2026) {
  const v = params.vorsorge;
  const rentenbasis = Math.min(brutto, v.rvBbg);
  const kvBasis = Math.min(brutto, v.kvBbg);

  const rentenversicherung = v.rvProzent * rentenbasis;
  const arbeitslosenversicherung = ARBEITSLOSENVERSICHERUNG_AN_PROZENT * rentenbasis;
  const krankenversicherung = (v.kvErmaessigtProzent + v.kvZusatzAnteilProzent) * kvBasis;

  const abschlag = v.pvAbschlagAbZweitemKind * Math.min(Math.max(0, kinder - 1), 4);
  const zuschlag = kinder === 0 ? v.pvKinderlosZuschlag : 0;
  const pflegeversicherung = Math.max(0, v.pvProzent - abschlag + zuschlag) * kvBasis;

  return {
    rentenversicherung,
    arbeitslosenversicherung,
    krankenversicherung,
    pflegeversicherung,
    summe: rentenversicherung + arbeitslosenversicherung + krankenversicherung + pflegeversicherung,
  };
}

// Nettogehalt im Modell. Kapitalertraege bleiben aussen vor, weil das Nettogehalt nicht
// von ihnen abhaengt.
export function nettoJahr(brutto, haushalt, regelwerk, params = PARAMS_2026) {
  const steuer = berechneJahr(
    {
      bruttoJahr: brutto,
      kinder: haushalt.kinder,
      zusammenveranlagt: haushalt.zusammenveranlagt,
      kapitalertragJahr: 0,
    },
    regelwerk,
    params,
  );
  const beitraege = arbeitnehmerbeitraege(brutto, haushalt.kinder, params);
  return {
    brutto,
    beitraege,
    einkommensteuer: steuer.einkommensteuer,
    solidaritaetszuschlag: steuer.soli.summe,
    netto: brutto - beitraege.summe - steuer.einkommensteuer - steuer.soli.summe,
  };
}

// Rueckrechnung Netto auf Brutto.
//
// Das Nettogehalt ist im Modell monoton steigend, aber nicht streng monoton: der Tarif
// rundet die Jahressteuer auf volle Euro ab, und die Sozialbeitraege wachsen je Euro
// Brutto nur um etwa 0,40 Euro. An jeder Aufrundungsstufe der Steuer faellt das Netto
// deshalb um weniger als einen Euro zurueck. Es entsteht eine kleine Saegezahnstufe.
// Deshalb wird zuerst der Bereich eingegrenzt und dann das Brutto gewaehlt, dessen Netto
// dem angegebenen am naechsten kommt. Die verbleibende Abweichung wird als Rest
// ausgewiesen, nicht verschwiegen.
export function bruttoAusNetto(netto, haushalt, regelwerk, params = PARAMS_2026) {
  if (netto <= 0) return { brutto: 0, mehrdeutig: false, treffer: null, rest: 0 };

  const obergrenze = 2000000;
  const nettoBeiObergrenze = nettoJahr(obergrenze, haushalt, regelwerk, params).netto;
  if (netto >= nettoBeiObergrenze) {
    return { brutto: null, mehrdeutig: true, treffer: null, rest: null, grund: 'netto_oberhalb_abbildbarer_bereich' };
  }

  let unten = 0;
  let oben = obergrenze;
  for (let i = 0; i < 120; i += 1) {
    const mitte = (unten + oben) / 2;
    if (nettoJahr(mitte, haushalt, regelwerk, params).netto < netto) unten = mitte;
    else oben = mitte;
  }

  let bestesBrutto = Math.max(0, Math.floor(unten) - 200);
  let besterRest = Infinity;
  const ende = Math.floor(unten) + 200;
  for (let brutto = Math.max(0, Math.floor(unten) - 200); brutto <= ende; brutto += 1) {
    const rest = nettoJahr(brutto, haushalt, regelwerk, params).netto - netto;
    const abstand = Math.abs(rest);
    if (abstand < besterRest - 1e-9) {
      besterRest = abstand;
      bestesBrutto = brutto;
    }
  }

  return {
    brutto: bestesBrutto,
    mehrdeutig: false,
    treffer: nettoJahr(bestesBrutto, haushalt, regelwerk, params).netto,
    rest: nettoJahr(bestesBrutto, haushalt, regelwerk, params).netto - netto,
  };
}

// Ohne Bruttoangabe ist das Brutto nicht eindeutig bestimmbar. Statt einer scheinbar
// genauen Zahl wird eine Bandbreite ausgewiesen. Sie bildet die Unsicherheit ab, die aus
// der Nettoangabe selbst folgt: unbekannter Zusatzbeitrag der Krankenkasse, sonstige
// Abzuege und die Ungenauigkeit der Angabe.
export const NETTO_BANDBREITE = 0.03;

export function bruttoBandAusNetto(netto, haushalt, regelwerk, params = PARAMS_2026) {
  const rueck = bruttoAusNetto(netto, haushalt, regelwerk, params);
  if (rueck.brutto === null) return { ...rueck, band: null };
  const band = {
    von: Math.round(rueck.brutto * (1 - NETTO_BANDBREITE)),
    bis: Math.round(rueck.brutto * (1 + NETTO_BANDBREITE)),
  };
  return { ...rueck, band };
}
