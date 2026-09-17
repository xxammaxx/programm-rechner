import { PARAMS_2026 } from './params.js';
import { tariffTaxSplit } from './tariff.js';
import { solidaritaetszuschlag, ohneCentBruchteile } from './soli.js';

// Vorsorgeaufwendungen nach § 10 Abs. 1 Nr. 2 lit. a und Nr. 3 EStG, Arbeitnehmeranteile
// eines gesetzlich kranken- und pflegeversicherten Arbeitnehmers.
export function vorsorgeaufwendungen(brutto, kinder, params = PARAMS_2026) {
  const v = params.vorsorge;
  const rentenversicherung = v.rvProzent * Math.min(brutto, v.rvBbg);

  // § 10 Abs. 1 Nr. 3 Satz 4 EStG: Bei möglichem Krankengeldanspruch ist der
  // Krankenversicherungsbeitrag um 4 Prozent zu vermindern.
  const kvBasis = Math.min(brutto, v.kvBbg);
  const krankenversicherung =
    (v.kvErmaessigtProzent + v.kvZusatzAnteilProzent) * kvBasis * (1 - v.kuerzungKrankengeld);

  // § 55 Abs. 3 SGB XI: Abschlag von 0,25 Prozentpunkten für das zweite bis fünfte Kind,
  // Zuschlag von 0,6 Prozentpunkten für Kinderlose.
  const abschlag = v.pvAbschlagAbZweitemKind * Math.min(Math.max(0, kinder - 1), 4);
  const zuschlag = kinder === 0 ? v.pvKinderlosZuschlag : 0;
  const pflegeversicherung = Math.max(0, v.pvProzent - abschlag + zuschlag) * kvBasis;

  return {
    rentenversicherung,
    krankenversicherung,
    pflegeversicherung,
    summe: rentenversicherung + krankenversicherung + pflegeversicherung,
  };
}

// Jahresberechnung für einen Arbeitnehmerhaushalt.
//
// Der Teiler bildet das Splittingverfahren nach § 32a Abs. 5 EStG ab: 2 bei
// Zusammenveranlagung, 1 sonst. Das Familiensplitting verwendet denselben Mechanismus
// mit einem grösseren Teiler.
export function berechneJahr(eingabe, regelwerk, params = PARAMS_2026) {
  const brutto = Math.max(0, eingabe.bruttoJahr || 0);
  const kinder = Math.max(0, Math.floor(eingabe.kinder || 0));
  const zusammenveranlagt = Boolean(eingabe.zusammenveranlagt);
  const kapitalertrag = Math.max(0, eingabe.kapitalertragJahr || 0);

  const p = params.pauschbetraege;
  const arbeitnehmerPauschbetrag = Math.min(p.arbeitnehmer, brutto);
  const sonderausgabenPauschbetrag = zusammenveranlagt ? p.sonderausgabenZusammen : p.sonderausgaben;
  const entlastungAlleinerziehende =
    !zusammenveranlagt && kinder >= 1 ? p.entlastungAlleinerziehende : 0;

  const vorsorge = vorsorgeaufwendungen(brutto, kinder, params);

  const einkuenfte = Math.max(0, brutto - arbeitnehmerPauschbetrag - vorsorge.summe);
  const zvERoh = Math.max(0, einkuenfte - sonderausgabenPauschbetrag - entlastungAlleinerziehende);

  const kinderfreibetragGesamt = regelwerk.kinderfreibetragAktiv
    ? kinder * (zusammenveranlagt ? params.kinder.freibetragZusammenJeKind : params.kinder.freibetragJeElternteilJeKind)
    : 0;

  // § 32a Abs. 1 Satz 1 EStG: das zu versteuernde Einkommen wird auf volle Euro
  // abgerundet. Der Kinderfreibetrag mindert zuvor das Einkommen, deshalb werden beide
  // Fassungen aus dem ungerundeten Betrag gebildet.
  const zvEVorKinderfreibetrag = Math.floor(zvERoh);
  const zvEMitKinderfreibetrag = Math.floor(Math.max(0, zvERoh - kinderfreibetragGesamt));

  const teiler = regelwerk.teiler(zusammenveranlagt, kinder);
  const estOhneKinderfreibetrag = tariffTaxSplit(zvEVorKinderfreibetrag, teiler, regelwerk.tarif);
  const estMitKinderfreibetrag = tariffTaxSplit(zvEMitKinderfreibetrag, teiler, regelwerk.tarif);

  // § 31 EStG: Das Kindergeld ist nach § 31 Satz 3 EStG eine Steuervergütung. Der
  // Familienleistungsausgleich bewirkt die Freistellung entweder über die Freibeträge
  // nach § 32 Abs. 6 EStG oder über das Kindergeld. Nach § 31 Satz 4 EStG wird die unter
  // Abzug der Freibeträge ermittelte Steuer um den Kindergeldanspruch erhöht, wenn die
  // Freibeträge angesetzt werden. Für den Haushalt ist damit die günstigere der beiden
  // Varianten massgeblich:
  //   Freibetrag günstiger -> tariff(zvE - Freibetrag)
  //   Kindergeld günstiger -> tariff(zvE) - Kindergeld
  // also insgesamt tariff(zvE) - max(Steuerersparnis durch Freibetrag, Kindergeld).
  const kindergeld = params.kinder.kindergeldMonatJeKind * 12 * kinder;
  const ersparnisKinderfreibetrag = estOhneKinderfreibetrag - estMitKinderfreibetrag;
  const familienleistungsausgleich = Math.max(ersparnisKinderfreibetrag, kindergeld);
  const einkommensteuer = estOhneKinderfreibetrag - familienleistungsausgleich;

  const sparerPauschbetrag = zusammenveranlagt
    ? regelwerk.sparerpauschbetrag.zusammen
    : regelwerk.sparerpauschbetrag.einzel;
  const kapitalertraegeNachPauschbetrag = Math.max(0, kapitalertrag - sparerPauschbetrag);
  const abgeltungsteuer = ohneCentBruchteile(kapitalertraegeNachPauschbetrag * params.abgeltungsteuerSatz);

  const soli = regelwerk.soliAktiv
    ? solidaritaetszuschlag(
        {
          einkommensteuerMitKinderfreibetrag: estMitKinderfreibetrag,
          kapitalertragsteuer: abgeltungsteuer,
          zusammenveranlagt,
        },
        params,
      )
    : { freigrenze: 0, bemessungsgrundlage: 0, milderungszoneGreift: false, zuschlagAufTarif: 0, zuschlagAufKapitalertragsteuer: 0, summe: 0 };

  const gesamtsteuer = einkommensteuer + soli.summe + abgeltungsteuer;

  return {
    eingabe: { bruttoJahr: brutto, kinder, zusammenveranlagt, kapitalertragJahr: kapitalertrag },
    regelwerkId: regelwerk.id,
    teiler,
    abzuege: {
      arbeitnehmerPauschbetrag,
      sonderausgabenPauschbetrag,
      entlastungAlleinerziehende,
      vorsorge,
      summe: arbeitnehmerPauschbetrag + sonderausgabenPauschbetrag + entlastungAlleinerziehende + vorsorge.summe,
    },
    zuVersteuerndesEinkommen: zvEVorKinderfreibetrag,
    kinderfreibetragGesamt,
    zuVersteuerndesEinkommenMitKinderfreibetrag: zvEMitKinderfreibetrag,
    einkommensteuerVorFamilienleistungsausgleich: estOhneKinderfreibetrag,
    einkommensteuerMitKinderfreibetrag: estMitKinderfreibetrag,
    ersparnisKinderfreibetrag,
    kindergeld,
    familienleistungsausgleich,
    einkommensteuer,
    sparerPauschbetrag,
    kapitalertraegeNachPauschbetrag,
    abgeltungsteuer,
    soli,
    gesamtsteuer,
  };
}
