import { PARAMS_2026, TARIFF_2026 } from './params.js';
import { shiftTariff } from './tariff.js';
import { berechneJahr } from './est.js';

// Der Grundfreibetrag des AfD-Programms liegt bei 15.000 Euro (Programm S. 58).
// Die Differenz zum geltenden Grundfreibetrag 2026 (12.348 Euro) beträgt 2.652 Euro.
export const GRUNDFREIBETRAG_AFD = 15000;
export const TARIF_VERSCHIEBUNG = GRUNDFREIBETRAG_AFD - TARIFF_2026.grundfreibetrag;

export const TARIFF_AFD = shiftTariff(TARIFF_2026, TARIF_VERSCHIEBUNG);

export const SPARERPAUSCHBETRAG_AFD = Object.freeze({
  einzel: 6672, // Programm S. 60
  zusammen: 6672 * 2,
});

const teilerBaseline = (zusammen) => (zusammen ? 2 : 1);

// Familiensplitting: die Summe der Einkünfte aller Familienmitglieder wird durch die
// Zahl der Familienmitglieder geteilt (Programm S. 59). Kinder werden mitgezählt und
// haben kein eigenes zu versteuerndes Einkommen. Keine Deckelung.
const teilerFamiliensplitting = (zusammen, kinder) => (zusammen ? 2 : 1) + kinder;

export const BASELINE = Object.freeze({
  id: 'baseline-2026',
  label: 'Geltendes Recht 2026',
  tarif: TARIFF_2026,
  teiler: teilerBaseline,
  kinderfreibetragAktiv: true,
  sparerpauschbetrag: Object.freeze({
    einzel: PARAMS_2026.pauschbetraege.sparerEinzel,
    zusammen: PARAMS_2026.pauschbetraege.sparerZusammen,
  }),
  soliAktiv: true,
});

export const SZENARIEN = Object.freeze({
  grundfreibetrag: Object.freeze({
    id: 'afd2025-grundfreibetrag-15000',
    label: 'Grundfreibetrag 15.000 Euro',
    tarif: TARIFF_AFD,
    teiler: teilerBaseline,
    kinderfreibetragAktiv: true,
    sparerpauschbetrag: BASELINE.sparerpauschbetrag,
    soliAktiv: true,
  }),
  solidaritaetszuschlag: Object.freeze({
    id: 'afd2025-solidaritaetszuschlag-abschaffung',
    label: 'Solidaritätszuschlag abschaffen',
    tarif: TARIFF_2026,
    teiler: teilerBaseline,
    kinderfreibetragAktiv: true,
    sparerpauschbetrag: BASELINE.sparerpauschbetrag,
    soliAktiv: false,
  }),
  sparerpauschbetrag: Object.freeze({
    id: 'afd2025-sparerpauschbetrag-6672',
    label: 'Sparer-Pauschbetrag 6.672 Euro',
    tarif: TARIFF_2026,
    teiler: teilerBaseline,
    kinderfreibetragAktiv: true,
    sparerpauschbetrag: SPARERPAUSCHBETRAG_AFD,
    soliAktiv: true,
  }),
  familiensplitting: Object.freeze({
    id: 'afd2025-familiensplitting',
    label: 'Familiensplitting',
    tarif: TARIFF_2026,
    teiler: teilerFamiliensplitting,
    // Der Kinderfreibetrag bleibt in der Höhe des geltenden Rechts bestehen. Das Programm
    // kündigt auf S. 148 zusätzlich eine Anhebung an, beziffert sie aber nicht.
    kinderfreibetragAktiv: true,
    sparerpauschbetrag: BASELINE.sparerpauschbetrag,
    soliAktiv: true,
  }),
});

export const GESAMTSZENARIO = Object.freeze({
  id: 'afd2025-gesamt',
  label: 'AfD-Programm, berechenbare Vorschläge zusammen',
  tarif: TARIFF_AFD,
  teiler: teilerFamiliensplitting,
  kinderfreibetragAktiv: true,
  sparerpauschbetrag: SPARERPAUSCHBETRAG_AFD,
  soliAktiv: false,
});

// Welche Vorschläge gehen in das Gesamtszenario ein und unter welchen Bedingungen.
export const VORSCHLAG_REGELN = Object.freeze([
  Object.freeze({
    id: 'afd2025-grundfreibetrag-15000',
    szenario: 'grundfreibetrag',
    status: 'DIRECTLY_CALCULABLE',
    anwendbar: () => true,
    nichtAnwendbarGrund: null,
  }),
  Object.freeze({
    id: 'afd2025-solidaritaetszuschlag-abschaffung',
    szenario: 'solidaritaetszuschlag',
    status: 'DIRECTLY_CALCULABLE',
    anwendbar: () => true,
    nichtAnwendbarGrund: null,
  }),
  Object.freeze({
    id: 'afd2025-sparerpauschbetrag-6672',
    szenario: 'sparerpauschbetrag',
    status: 'DIRECTLY_CALCULABLE',
    anwendbar: (e) => e.kapitalertragJahr > 0,
    nichtAnwendbarGrund: 'kein Kapitalertrag angegeben',
  }),
  Object.freeze({
    id: 'afd2025-familiensplitting',
    szenario: 'familiensplitting',
    status: 'MODEL_ASSUMPTION',
    anwendbar: (e) => e.kinder > 0,
    nichtAnwendbarGrund: 'keine Kinder im Haushalt',
  }),
]);

function rund(v) {
  return Math.round(v * 100) / 100;
}

// Vollständige Analyse: geltendes Recht, Gesamtszenario und der Beitrag jedes einzelnen
// Vorschlags. Der Einzelbeitrag wird als Alleinwirkung des Vorschlags gegenüber dem
// geltenden Recht ermittelt, nicht als Reihenfolgezerlegung. Die Differenz zwischen der
// Summe der Einzelbeiträge und der Gesamtwirkung wird deshalb offen als
// Wechselwirkung ausgewiesen.
export function analysiere(eingabe, params = PARAMS_2026) {
  const e = {
    bruttoJahr: Math.max(0, eingabe.bruttoJahr || 0),
    kinder: Math.max(0, Math.floor(eingabe.kinder || 0)),
    zusammenveranlagt: Boolean(eingabe.zusammenveranlagt),
    kapitalertragJahr: Math.max(0, eingabe.kapitalertragJahr || 0),
  };

  const basis = berechneJahr(e, BASELINE, params);
  const gesamt = berechneJahr(e, GESAMTSZENARIO, params);

  const vorschlaege = VORSCHLAG_REGELN.map((regel) => {
    const anwendbar = regel.anwendbar(e);
    const ergebnis = anwendbar ? berechneJahr(e, SZENARIEN[regel.szenario], params) : null;
    const wirkung = ergebnis ? rund(basis.gesamtsteuer - ergebnis.gesamtsteuer) : null;
    return {
      id: regel.id,
      status: regel.status,
      anwendbar,
      nichtAnwendbarGrund: anwendbar ? null : regel.nichtAnwendbarGrund,
      wirkungJahr: wirkung,
      wirkungMonat: wirkung === null ? null : rund(wirkung / 12),
    };
  });

  const direkt = vorschlaege.filter((v) => v.status === 'DIRECTLY_CALCULABLE' && v.anwendbar);
  const modell = vorschlaege.filter((v) => v.status === 'MODEL_ASSUMPTION' && v.anwendbar);
  const nichtBewertet = vorschlaege.filter((v) => !v.anwendbar);

  const summeDirekt = rund(direkt.reduce((s, v) => s + v.wirkungJahr, 0));
  const summeModell = rund(modell.reduce((s, v) => s + v.wirkungJahr, 0));
  const gesamtWirkung = rund(basis.gesamtsteuer - gesamt.gesamtsteuer);
  const wechselwirkung = rund(gesamtWirkung - summeDirekt - summeModell);

  return {
    eingabe: e,
    basis,
    gesamt,
    vorschlaege,
    ergebnis: {
      gesamtJahr: gesamtWirkung,
      gesamtMonat: rund(gesamtWirkung / 12),
      summeDirektJahr: summeDirekt,
      summeDirektMonat: rund(summeDirekt / 12),
      summeModellJahr: summeModell,
      summeModellMonat: rund(summeModell / 12),
      wechselwirkungJahr: wechselwirkung,
    },
    abdeckung: {
      direktBerechnet: direkt.length,
      nurModellannahme: modell.length,
      nichtBewertet: nichtBewertet.length,
      nichtBewertetIds: nichtBewertet.map((v) => v.id),
    },
  };
}
