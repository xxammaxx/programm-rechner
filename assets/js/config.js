// Zentrale Konfiguration der externen Abhaengigkeiten.
//
// Alle drei Eintraege sind standardmaessig leer. Der Rechner funktioniert ohne sie
// vollstaendig. Nichts hier darf personenbezogene Daten enthalten.

export const KONFIGURATION = Object.freeze({
  // GoatCounter. Nur der Kurzname der Instanz, zum Beispiel "programm-rechner" fuer
  // https://programm-rechner.goatcounter.com. Bleibt null, solange kein Konto besteht.
  // Der API-Schluessel gehoert NICHT hierher, sondern ausschliesslich in ein
  // GitHub-Actions-Secret.
  goatcounterKurzname: null,

  // Oeffentlicher Zaehler. Er zeigt exakt das, was gezaehlt wird. Bleibt null, solange
  // GoatCounter nicht eingerichtet ist.
  oeffentlicherZaehler: {
    aktiv: false,
    beschriftung: 'Berechnungen abgeschlossen',
    pfad: 'calculator-completed',
  },

  // Unterstuetzen-Link. Wird erst angezeigt, wenn hier eine Adresse steht.
  unterstuetzen: {
    aktiv: false,
    url: null,
    beschriftung: 'Projekt mit 1 € unterstützen',
  },

  // Angaben nach § 5 Digitale-Dienste-Gesetz. Muessen vom Betreiber geliefert werden.
  // Solange sie fehlen, ist eine Veroeffentlichung nicht zulaessig und der Rechner
  // zeigt an dieser Stelle keine erfundenen Angaben.
  betreiber: {
    name: null,
    anschrift: null,
    email: null,
    inhaltlichVerantwortlich: null,
    vorhanden: false,
  },
});

export const RECHTSSTAND = Object.freeze({
  veranlagungsjahr: 2026,
  programmversion: 'AfD-Bundestagswahlprogramm 2025, verabschiedet am 11.–12. Januar 2025 in Riesa',
  letztePruefung: '2026-09-17',
});
