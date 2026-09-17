// Rechtsstand-Parameter 2026. Kanonische, maschinenlesbare Fassung: data/baseline/est-2026.json.
// tests/unit/params.consistency.test.mjs erzwingt die Gleichheit beider Fassungen.

export const BASELINE_YEAR = 2026;

// § 32a Abs. 1 EStG, Veranlagungszeitraum 2026.
export const TARIFF_2026 = Object.freeze({
  year: 2026,
  grundfreibetrag: 12348,
  zone2: Object.freeze({ upper: 17799, a: 914.51, b: 1400 }),
  zone3: Object.freeze({ upper: 69878, base: 17799, a: 173.1, b: 2397, c: 1034.87 }),
  zone4: Object.freeze({ upper: 277825, mult: 0.42, sub: 11135.63 }),
  zone5: Object.freeze({ mult: 0.45, sub: 19470.38 }),
});

// § 32a Abs. 1 EStG, Veranlagungszeitraum 2025 (BGBl. 2024 I Nr. 449, Art. 1 Nr. 2).
export const TARIFF_2025 = Object.freeze({
  year: 2025,
  grundfreibetrag: 12096,
  zone2: Object.freeze({ upper: 17443, a: 932.3, b: 1400 }),
  zone3: Object.freeze({ upper: 68480, base: 17443, a: 176.64, b: 2397, c: 1015.13 }),
  zone4: Object.freeze({ upper: 277825, mult: 0.42, sub: 10911.92 }),
  zone5: Object.freeze({ mult: 0.45, sub: 19246.67 }),
});

export const PARAMS_2026 = Object.freeze({
  year: 2026,

  pauschbetraege: Object.freeze({
    arbeitnehmer: 1230, // § 9a Satz 1 Nr. 1 lit. a EStG
    sonderausgaben: 36, // § 10c Satz 1 EStG
    sonderausgabenZusammen: 72, // § 10c Satz 2 EStG
    entlastungAlleinerziehende: 4260, // § 24b EStG
    sparerEinzel: 1000, // § 20 Abs. 9 Satz 1 EStG
    sparerZusammen: 2000, // § 20 Abs. 9 Satz 2 EStG
  }),

  kinder: Object.freeze({
    freibetragJeElternteilJeKind: 4878, // § 32 Abs. 6 Satz 1 EStG (3 414 + 1 464)
    freibetragZusammenJeKind: 9756, // § 32 Abs. 6 Satz 2 EStG
    kindergeldMonatJeKind: 259, // § 66 Abs. 1 EStG
  }),

  solidaritaetszuschlag: Object.freeze({
    satz: 0.055, // § 4 Satz 1 SolzG 1995
    milderungssatz: 0.119, // § 4 Satz 2 SolzG 1995
    freigrenzeEinzel: 20350, // § 3 Abs. 3 Satz 1 Nr. 2 SolzG 1995
    freigrenzeZusammen: 40700, // § 3 Abs. 3 Satz 1 Nr. 1 SolzG 1995
    milderungszoneEndeFaktor: 1.859375, // Freigrenze * 1,859375; abgeleitet aus § 4 Satz 1 und 2
  }),

  abgeltungsteuerSatz: 0.25, // § 32d Abs. 1 EStG

  // § 10 Abs. 1 Nr. 2 lit. a und Nr. 3 EStG. Arbeitnehmeranteile, gesetzlich versichert.
  vorsorge: Object.freeze({
    rvProzent: 0.093,
    rvBbg: 101400,
    kvErmaessigtProzent: 0.07,
    kvZusatzAnteilProzent: 0.0145, // halber durchschnittlicher Zusatzbeitragssatz 2026 (2,9 %)
    kvBbg: 69750,
    kuerzungKrankengeld: 0.04, // § 10 Abs. 1 Nr. 3 Satz 4 EStG
    pvProzent: 0.018,
    pvKinderlosZuschlag: 0.006,
    pvAbschlagAbZweitemKind: 0.0025,
  }),
});

// Programmablaufplan 2026 des BMF, Modul UPTAB26, als wörtliche Zweitimplementierung.
// Dient ausschliesslich als unabhängige Referenz im Test, nicht als Produktpfad.
export function papUPTAB26(zveAbgerundet) {
  const x = Math.floor(zveAbgerundet);
  const gfb = 12348;
  if (x < gfb + 1) return 0;
  let rw;
  let y;
  if (x < 17800) {
    y = (x - gfb) / 10000;
    rw = y * 914.51;
    rw = rw + 1400;
    rw = rw * y;
    return Math.floor(rw);
  }
  if (x < 69879) {
    y = (x - 17799) / 10000;
    rw = y * 173.1;
    rw = rw + 2397;
    rw = rw * y;
    rw = rw + 1034.87;
    return Math.floor(rw);
  }
  if (x < 277826) {
    return Math.floor(x * 0.42 - 11135.63);
  }
  return Math.floor(x * 0.45 - 19470.38);
}

// Programmablaufplan 2026 des BMF, Modul MSOLZ.
// Die Felder des PAP sind Cent-Felder; jbmgCent ist die Jahresbemessungsgrundlage in Cent.
export function papMSOLZ(jbmgCent, kztab) {
  const solzFreiCent = 20350 * kztab * 100;
  let solzJCent = 0;
  if (jbmgCent > solzFreiCent) {
    solzJCent = Math.floor((jbmgCent * 5.5) / 100);
    const solzMinCent = Math.floor(((jbmgCent - solzFreiCent) * 11.9) / 100);
    if (solzMinCent < solzJCent) solzJCent = solzMinCent;
  }
  return solzJCent / 100;
}
