import { analysiere, BASELINE, SZENARIEN, GESAMTSZENARIO } from '../engine/scenario.js';
import { bruttoBandAusNetto, nettoJahr } from '../engine/netto.js';
import { RECHTSSTAND, KONFIGURATION } from '../config.js';
import { analytikStarten, zaehle, zaehleSeitenaufruf, meldeFehler, oeffentlicheZahl } from '../analytics.js';

const euro0 = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const euro2 = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });
const zahl0 = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });

const ANZAHL_SCHRITTE = 4;

const zustand = {
  schritt: 1,
  modus: 'brutto',
  einkommenMonat: null,
  zusammenveranlagt: false,
  kinder: 0,
  kapitalertrag: 0,
};

let vorschlaegeDaten = [];
let analyseErgebnis = null;

const $ = (id) => document.getElementById(id);

function formatiereBetrag(wert) {
  if (wert === null || wert === undefined) return '—';
  const vorzeichen = wert > 0 ? '+' : wert < 0 ? '−' : '';
  return `${vorzeichen}${euro0.format(Math.abs(wert))}`;
}

// Deutsche Zahleneingabe: "2.500" und "2.500,50" und "2500" sind alle zulaessig.
function leseZahl(text) {
  if (typeof text !== 'string') return null;
  const bereinigt = text.trim().replace(/\s|€/g, '').replace(/\./g, '').replace(',', '.');
  if (bereinigt === '') return null;
  const wert = Number(bereinigt);
  if (!Number.isFinite(wert) || wert < 0) return null;
  return wert;
}

function setzeSchritt(nummer) {
  zustand.schritt = nummer;
  for (let i = 1; i <= ANZAHL_SCHRITTE; i += 1) {
    const bereich = $(`schritt-${i}`);
    if (bereich) bereich.hidden = i !== nummer;
  }
  const ergebnis = $('ergebnis');
  if (ergebnis) ergebnis.hidden = true;

  $('fortschritt').hidden = false;
  $('fortschritt-text').textContent = `Schritt ${nummer} von ${ANZAHL_SCHRITTE}`;
  const balken = $('fortschritt-balken');
  balken.value = nummer;
  balken.textContent = `Schritt ${nummer} von ${ANZAHL_SCHRITTE}`;

  const frage = document.querySelector(`#schritt-${nummer} .schritt__frage`);
  if (frage) {
    frage.setAttribute('tabindex', '-1');
    frage.focus({ preventScroll: true });
  }
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function zeigeErgebnis(bereich) {
  for (let i = 1; i <= ANZAHL_SCHRITTE; i += 1) {
    const s = $(`schritt-${i}`);
    if (s) s.hidden = true;
  }
  $('fortschritt').hidden = true;
  $('ergebnis').hidden = false;
  $('ergebnis-titel').setAttribute('tabindex', '-1');
  $('ergebnis-titel').focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (bereich) bereich();
}

/* ---------- Ermittlung des Bruttojahreswerts ---------- */

function ermittleBrutto() {
  const haushalt = { kinder: zustand.kinder, zusammenveranlagt: zustand.zusammenveranlagt };
  if (zustand.modus === 'brutto') {
    return {
      bruttoJahr: Math.round(zustand.einkommenMonat * 12),
      band: null,
      sicher: true,
      rest: 0,
      rueckrechnung: null,
    };
  }
  const nettoJahr = Math.round(zustand.einkommenMonat * 12);
  const rueck = bruttoBandAusNetto(nettoJahr, haushalt, BASELINE);
  if (rueck.brutto === null) {
    return { bruttoJahr: null, band: null, sicher: false, rest: null, rueckrechnung: rueck };
  }
  return {
    bruttoJahr: rueck.brutto,
    band: rueck.band,
    sicher: false,
    rest: rueck.rest,
    nettoJahr,
    rueckrechnung: rueck,
  };
}

/* ---------- Ergebnisdarstellung ---------- */

function kartenEintrag(vorschlag, daten, analyse) {
  const li = document.createElement('li');
  li.className = 'karte';

  const statusKlasse =
    vorschlag.status === 'DIRECTLY_CALCULABLE'
      ? 'marke--direkt'
      : vorschlag.status === 'MODEL_ASSUMPTION'
        ? 'marke--modell'
        : 'marke--nicht';
  const statusText =
    vorschlag.status === 'DIRECTLY_CALCULABLE'
      ? 'Direkt berechnet'
      : vorschlag.status === 'MODEL_ASSUMPTION'
        ? 'Modellannahme'
        : 'Nicht seriös in Euro berechenbar';

  const wirkung =
    vorschlag.wirkungJahr === null
      ? 'nicht bewertet'
      : `${formatiereBetrag(vorschlag.wirkungJahr)} / Jahr`;

  const h3 = document.createElement('h4');
  h3.className = 'karte__name';
  h3.textContent = daten.policy_name;

  const wirksam = document.createElement('p');
  wirksam.className = 'karte__wirkung';
  wirksam.textContent = wirkung;
  if (vorschlag.wirkungJahr !== null && vorschlag.wirkungJahr < 0) {
    wirksam.classList.add('karte__wirkung--negativ');
  }

  const marke = document.createElement('p');
  marke.className = 'karte__marke-zeile';
  const span = document.createElement('span');
  span.className = `marke ${statusKlasse}`;
  span.textContent = statusText;
  marke.appendChild(span);

  const text = document.createElement('p');
  text.className = 'karte__text';
  text.textContent = daten.exact_claim;

  const aktionen = document.createElement('div');
  aktionen.className = 'karte__aktionen';

  const quelle = document.createElement('a');
  quelle.className = 'karte__aktion';
  quelle.href = daten.source_url;
  quelle.target = '_blank';
  quelle.rel = 'noopener noreferrer';
  quelle.textContent = 'Quelle ansehen';
  quelle.addEventListener('click', () => zaehle('source_opened'));

  const rechenwegKnopf = document.createElement('button');
  rechenwegKnopf.type = 'button';
  rechenwegKnopf.className = 'karte__aktion';
  rechenwegKnopf.textContent = 'Rechenweg ansehen';
  rechenwegKnopf.setAttribute('aria-expanded', 'false');

  const rechenweg = document.createElement('div');
  rechenweg.className = 'rechenweg';
  rechenweg.hidden = true;
  const dl = document.createElement('dl');
  const zeilen = [
    ['Geltendes Recht, zu versteuerndes Einkommen', `${zahl0.format(analyse.basis.zuVersteuerndesEinkommen)} €`],
    ['Geltendes Recht, Einkommensteuer', euro2.format(analyse.basis.einkommensteuer)],
    ['Geltendes Recht, Solidaritätszuschlag', euro2.format(analyse.basis.soli.summe)],
    ['Szenario, zu versteuerndes Einkommen', `${zahl0.format(analyse.gesamt.zuVersteuerndesEinkommen)} €`],
    ['Szenario, Splitting-Teiler', String(analyse.gesamt.teiler)],
    ['Szenario, Einkommensteuer', euro2.format(analyse.gesamt.einkommensteuer)],
    ['Szenario, Solidaritätszuschlag', euro2.format(analyse.gesamt.soli.summe)],
    ['Wirkung dieses Vorschlags', vorschlag.wirkungJahr === null ? 'nicht bewertet' : euro2.format(vorschlag.wirkungJahr)],
  ];
  for (const [bezeichnung, wert] of zeilen) {
    const dt = document.createElement('dt');
    dt.textContent = bezeichnung;
    const dd = document.createElement('dd');
    dd.textContent = wert;
    dl.append(dt, dd);
  }
  rechenweg.appendChild(dl);

  if (Array.isArray(daten.assumptions) && daten.assumptions.length > 0) {
    const titel = document.createElement('p');
    const titelStark = document.createElement('strong');
    titelStark.textContent = 'Annahmen zu diesem Vorschlag';
    titel.appendChild(titelStark);
    const liste = document.createElement('ul');
    for (const a of daten.assumptions) {
      const liA = document.createElement('li');
      liA.textContent = a;
      liste.appendChild(liA);
    }
    rechenweg.append(titel, liste);
  }

  const quellzeile = document.createElement('p');
  quellzeile.textContent = `Quelle: ${daten.source_title}, Seite ${daten.source_page}.`;
  rechenweg.appendChild(quellzeile);

  rechenwegKnopf.addEventListener('click', () => {
    rechenweg.hidden = !rechenweg.hidden;
    rechenwegKnopf.setAttribute('aria-expanded', String(!rechenweg.hidden));
  });

  aktionen.append(quelle, rechenwegKnopf);
  li.append(h3, wirksam, marke, text, aktionen, rechenweg);
  return li;
}

function nichtBewertetEintrag(daten) {
  const li = document.createElement('li');
  li.className = 'karte';

  const h4 = document.createElement('h4');
  h4.className = 'karte__name';
  h4.textContent = daten.policy_name;

  const marke = document.createElement('p');
  marke.className = 'karte__marke-zeile';
  const span = document.createElement('span');
  span.className = 'marke marke--nicht';
  span.textContent = 'Nicht seriös in Euro berechenbar';
  marke.appendChild(span);

  const text = document.createElement('p');
  text.className = 'karte__text';
  text.textContent = daten.not_calculable_reason ?? 'Für diesen Punkt gibt es keinen belastbaren persönlichen Eurobetrag.';

  // Das woertliche Zitat steht vollstaendig zur Verfuegung, wird aber erst auf Wunsch
  // aufgeklappt. Die Begruendung bleibt immer sichtbar.
  const details = document.createElement('details');
  details.className = 'zitat';
  const summary = document.createElement('summary');
  summary.className = 'zitat__schalter';
  summary.textContent = `Programmtext ansehen (Seite ${daten.source_page})`;
  const zitat = document.createElement('p');
  zitat.className = 'karte__text zitat__text';
  zitat.textContent = `„${daten.exact_claim}“`;
  details.append(summary, zitat);

  const aktionen = document.createElement('div');
  aktionen.className = 'karte__aktionen';
  const quelle = document.createElement('a');
  quelle.className = 'karte__aktion';
  quelle.href = daten.source_url;
  quelle.target = '_blank';
  quelle.rel = 'noopener noreferrer';
  quelle.textContent = 'Quelle ansehen';
  quelle.addEventListener('click', () => zaehle('source_opened'));
  aktionen.appendChild(quelle);

  li.append(h4, marke, text, details, aktionen);
  return li;
}

function baueErgebnis() {
  const bruttoInfo = ermittleBrutto();
  const analyse = analysiere({
    bruttoJahr: bruttoInfo.bruttoJahr ?? 0,
    kinder: zustand.kinder,
    zusammenveranlagt: zustand.zusammenveranlagt,
    kapitalertragJahr: zustand.kapitalertrag,
  });
  analyseErgebnis = { analyse, bruttoInfo };

  const nachId = new Map(vorschlaegeDaten.map((p) => [p.id, p]));

  // Kopfzahl
  const betragEl = $('ergebnis-betrag');
  betragEl.classList.remove('ergebnis__betrag--negativ');

  if (bruttoInfo.band) {
    const unten = analysiere({
      bruttoJahr: bruttoInfo.band.von,
      kinder: zustand.kinder,
      zusammenveranlagt: zustand.zusammenveranlagt,
      kapitalertragJahr: zustand.kapitalertrag,
    });
    const oben = analysiere({
      bruttoJahr: bruttoInfo.band.bis,
      kinder: zustand.kinder,
      zusammenveranlagt: zustand.zusammenveranlagt,
      kapitalertragJahr: zustand.kapitalertrag,
    });
    const a = Math.min(unten.ergebnis.gesamtJahr, oben.ergebnis.gesamtJahr);
    const b = Math.max(unten.ergebnis.gesamtJahr, oben.ergebnis.gesamtJahr);
    betragEl.textContent = `${formatiereBetrag(a)} bis ${formatiereBetrag(b)} / Jahr`;
    const schnitt = (a + b) / 2;
    $('ergebnis-monat').textContent =
      `Das entspricht ungefähr ${formatiereBetrag(schnitt / 12)} im Monat.`;
  } else {
    betragEl.textContent = `${formatiereBetrag(analyse.ergebnis.gesamtJahr)} / Jahr`;
    if (analyse.ergebnis.gesamtJahr < 0) betragEl.classList.add('ergebnis__betrag--negativ');
    $('ergebnis-monat').textContent =
      `Das entspricht ungefähr ${formatiereBetrag(analyse.ergebnis.gesamtMonat)} im Monat.`;
  }

  // Zusatzzeile zur Datenlage
  const zusatz = $('ergebnis-zusatz');
  zusatz.textContent = '';
  const zeile = document.createElement('p');
  zeile.className = 'ergebnis__vorspann';
  if (zustand.modus === 'netto') {
    zeile.textContent =
      `Du hast ein Nettoeinkommen angegeben. Daraus wurde ein Bruttojahreseinkommen von rund ` +
      `${zahl0.format(bruttoInfo.bruttoJahr)} € zurückgerechnet. Diese Rückrechnung ist nicht eindeutig, ` +
      `deshalb steht hier eine Bandbreite und keine genaue Zahl. Mit einer Bruttoangabe wird das Ergebnis genauer.`;
  } else {
    zeile.textContent =
      `Gerechnet mit einem Bruttojahreseinkommen von ${zahl0.format(bruttoInfo.bruttoJahr)} € ` +
      `auf Rechtsstand ${RECHTSSTAND.veranlagungsjahr}.`;
  }
  zusatz.appendChild(zeile);

  // Abdeckung
  const liste = $('abdeckung-liste');
  liste.textContent = '';

  const ausgeschlossen = analyse.vorschlaege.filter((v) => !v.anwendbar).map((v) => v.id);
  const ohneEuro = vorschlaegeDaten.filter(
    (p) => p.calculation_status === 'NOT_INDIVIDUALLY_CALCULABLE' || ausgeschlossen.includes(p.id),
  );

  const eintraege = [
    `${analyse.abdeckung.direktBerechnet} Vorschläge direkt berechnet: ${formatiereBetrag(analyse.ergebnis.summeDirektJahr)} pro Jahr`,
    `${analyse.abdeckung.nurModellannahme} Vorschlag nur als Modellannahme: ${formatiereBetrag(analyse.ergebnis.summeModellJahr)} pro Jahr`,
    `${ohneEuro.length} Programmpunkte nicht in Euro bewertet, siehe unten`,
  ];
  for (const text of eintraege) {
    const li = document.createElement('li');
    li.textContent = text;
    liste.appendChild(li);
  }

  for (const v of analyse.vorschlaege.filter((x) => !x.anwendbar)) {
    const daten = nachId.get(v.id);
    const li = document.createElement('li');
    const name = daten ? daten.policy_name_short ?? daten.policy_name : v.id;
    li.textContent = `Nicht bewertet: ${name} — ${v.nichtAnwendbarGrund}`;
    liste.appendChild(li);
  }

  if (Math.abs(analyse.ergebnis.wechselwirkungJahr) >= 1) {
    const li = document.createElement('li');
    li.textContent =
      `Überschneidung zwischen den Vorschlägen: ${formatiereBetrag(analyse.ergebnis.wechselwirkungJahr)} pro Jahr. ` +
      'Die Einzelwirkungen überschneiden sich, weil sie sich gegenseitig verstärken. Maßgeblich ist die Zahl oben, nicht die Summe der Einzelwerte.';
    liste.appendChild(li);
  }

  const hinweisLi = document.createElement('li');
  hinweisLi.textContent =
    'Die Zahl ist die Summe der oben genannten berechenbaren Vorschläge. Sie ist nicht das AfD-Programm als Ganzes.';
  liste.appendChild(hinweisLi);

  // Karten der bewerteten Vorschlaege
  const karten = $('karten');
  karten.textContent = '';
  for (const v of analyse.vorschlaege) {
    if (!v.anwendbar) continue;
    const daten = nachId.get(v.id);
    if (!daten) continue;
    karten.appendChild(kartenEintrag(v, daten, analyse));
  }

  // Karten der nicht bewerteten Programmpunkte
  const nichtBewertet = $('karten-nicht-bewertet');
  nichtBewertet.textContent = '';
  for (const daten of ohneEuro) {
    nichtBewertet.appendChild(nichtBewertetEintrag(daten));
  }

  renderUnterstuetzen();
  renderZaehler();
}

/* ---------- Optionale Bereiche ---------- */

function renderUnterstuetzen() {
  const bereich = $('unterstuetzen-bereich');
  const u = KONFIGURATION.unterstuetzen;
  bereich.textContent = '';
  if (!u.aktiv || !u.url) {
    bereich.hidden = true;
    return;
  }
  bereich.hidden = false;
  const box = document.createElement('div');
  box.className = 'hinweis';
  const p = document.createElement('p');
  p.className = 'hinweis__titel';
  p.textContent = 'Hat dir der Rechner geholfen?';
  const a = document.createElement('a');
  a.className = 'karte__aktion';
  a.href = u.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = `☕ ${u.beschriftung}`;
  a.addEventListener('click', () => zaehle('support_clicked'));
  const klein = document.createElement('p');
  klein.className = 'karte__klein';
  klein.textContent =
    'Freiwillig und ohne Gegenleistung. Der Link führt zu einem externen Anbieter und wird erst beim Anklicken geöffnet. Keine steuerlich abzugsfähige Spende.';
  box.append(p, a, klein);
  bereich.appendChild(box);
}

async function renderZaehler() {
  const bereich = $('zaehler-bereich');
  const z = KONFIGURATION.oeffentlicherZaehler;
  bereich.textContent = '';
  if (!z.aktiv) {
    bereich.hidden = true;
    return;
  }
  const zahl = await oeffentlicheZahl();
  if (zahl === null) {
    bereich.hidden = true;
    return;
  }
  bereich.hidden = false;
  const p = document.createElement('p');
  p.className = 'zaehler';
  p.textContent = `${zahl0.format(zahl)} ${z.beschriftung}`;
  bereich.appendChild(p);
}

/* ---------- Verdrahtung ---------- */

function verdrahte() {
  const einkommen = $('einkommen');
  const kapital = $('kapital');

  einkommen.addEventListener('input', () => {
    $('einkommen-fehler').textContent = '';
  });
  kapital.addEventListener('input', () => {
    $('kapital-fehler').textContent = '';
  });

  for (const radio of document.querySelectorAll('input[name="modus"]')) {
    radio.addEventListener('change', () => {
      zustand.modus = radio.value;
      $('modus-hinweis').textContent =
        radio.value === 'brutto'
          ? 'Mit Brutto können wir genauer rechnen. Wenn du nur Netto kennst, geht auch ein grober Check.'
          : 'Bei einer Netto-Angabe rechnen wir das Brutto aus einem Modell zurück. Das ist nicht eindeutig, deshalb zeigen wir eine Bandbreite statt einer genauen Zahl.';
    });
  }

  for (const radio of document.querySelectorAll('input[name="haushalt"]')) {
    radio.addEventListener('change', () => {
      zustand.zusammenveranlagt = radio.value === 'verheiratet';
    });
  }

  for (const radio of document.querySelectorAll('input[name="kinder"]')) {
    radio.addEventListener('change', () => {
      zustand.kinder = Number(radio.value);
    });
  }

  $('weiter-1').addEventListener('click', () => {
    const wert = leseZahl(einkommen.value);
    if (wert === null || wert <= 0) {
      $('einkommen-fehler').textContent = 'Bitte gib eine Zahl größer als 0 ein, zum Beispiel 2.500.';
      einkommen.focus();
      return;
    }
    zustand.einkommenMonat = wert;
    zaehle('calculator_started');
    zaehle('step_completed');
    setzeSchritt(2);
  });

  $('zurueck-2').addEventListener('click', () => setzeSchritt(1));
  $('weiter-2').addEventListener('click', () => {
    zaehle('step_completed');
    setzeSchritt(3);
  });

  $('zurueck-3').addEventListener('click', () => setzeSchritt(2));
  $('weiter-3').addEventListener('click', () => {
    zaehle('step_completed');
    setzeSchritt(4);
  });

  $('zurueck-4').addEventListener('click', () => setzeSchritt(3));

  const abschliessen = () => {
    zustand.kapitalertrag = leseZahl(kapital.value) ?? 0;
    zaehle('step_completed');
    zaehle('calculator_completed');
    zeigeErgebnis(baueErgebnis);
  };

  $('weiter-4').addEventListener('click', () => {
    if (kapital.value.trim() !== '' && leseZahl(kapital.value) === null) {
      $('kapital-fehler').textContent = 'Bitte gib eine Zahl ein oder überspringe den Schritt.';
      kapital.focus();
      return;
    }
    abschliessen();
  });

  $('ueberspringen-4').addEventListener('click', () => {
    kapital.value = '';
    abschliessen();
  });

  $('zurueck-ergebnis').addEventListener('click', () => setzeSchritt(1));

  $('link-methodik').addEventListener('click', () => zaehle('methodology_opened'));

  window.addEventListener('error', () => meldeFehler());
  window.addEventListener('unhandledrejection', () => meldeFehler());
}

async function ladeVorschlaege() {
  const antwort = await fetch('data/policies/afd-2025.json');
  if (!antwort.ok) throw new Error('Quellendaten konnten nicht geladen werden.');
  const daten = await antwort.json();
  vorschlaegeDaten = daten.policies;
}

async function start() {
  analytikStarten();
  zaehleSeitenaufruf();
  try {
    await ladeVorschlaege();
  } catch (fehler) {
    meldeFehler();
    $('ergebnis-vorspann').textContent =
      'Die Quellendaten konnten nicht geladen werden. Ohne sie wird kein Ergebnis ausgegeben.';
  }
  verdrahte();
  setzeSchritt(1);
}

start();
