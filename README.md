# Programm-Rechner

Informationsrechner zu ausgewählten, quantifizierbaren Vorschlägen des AfD-Bundestagswahlprogramms 2025.

Der Rechner beantwortet eine einzige Frage: Welche direkt berechenbaren Auswirkungen hätten ausgewählte Vorschläge des AfD-Bundestagswahlprogramms 2025 auf meinen Haushalt?

Vorgesehene öffentliche Adresse (noch **nicht** freigeschaltet): `https://xxammaxx.github.io/programm-rechner/`

> V1 untersucht ausgewählte, quantifizierbare Vorschläge des AfD-Bundestagswahlprogramms 2025. Dies ist keine Wahlempfehlung und keine vollständige Bewertung des Programms.

Der Hinweis steht als Pflicht- und Dauerhinweis auf jeder Ansicht über dem Rechner.

## Was dieser Rechner ist

- Ein statischer Informationsrechner ohne Backend, ohne Framework und ohne externe Laufzeitabhängigkeiten. Ausgeliefert werden HTML, CSS, JavaScript und JSON; gerechnet wird ausschließlich im Browser.
- Mobile-first, geprüft in vier Playwright-Profilen: `mobil-360`, `mobil-390`, `mobil-412`, `desktop-1280`.
- Eine offene Rechnung. Formeln, Annahmen, Quellen, Seitenzahlen und bekannte Grenzen sind im Rechner selbst einsehbar (`methodik.html`, `quellen.html`) und in `docs/` ausführlich dokumentiert.
- Ein Rechner, der auch dann eine ehrliche Antwort gibt, wenn diese Null oder negativ ist.

## Was dieser Rechner nicht ist

- Keine Wahlempfehlung. Es gibt keine Stimmabgabeempfehlung, keine Parteienrangfolge und keine Bewertung eines Programms als Ganzes.
- Keine Steuerberatung und keine Rechtsberatung.
- Keine Gesamtbilanz eines Haushalts. Gerechnet werden Steuern und Kindergeld. Transferleistungen (Wohngeld, Bürgergeld, Grundsicherung, Kinderzuschlag) und die Sozialversicherungsbeiträge im Szenarienvergleich sind nicht Teil der Zahl. Der Rechner weist das im Ergebnis sichtbar aus (`#transfer-hinweis`).
- Keine vollständige Abbildung des Programms. Acht Programmpunkte werden ausdrücklich nicht in Euro bewertet.
- Keine Reproduktion der amtlichen Lohnsteuertabellen. Der Rechner bildet das Veranlagungsverfahren ab, nicht den Lohnsteuerabzug.

## Status

Stand der Prüfung: 17. September 2026.

| Punkt | Wert |
|---|---|
| Repository | Zielname `programm-rechner` unter `xxammaxx`. Zum Prüfzeitpunkt weder lokal als git-Repository initialisiert noch unter GitHub abrufbar |
| Tests | 82 von 82 Tests grün (`node --test`); E2E-Suite vorhanden und lauffähig |
| GitHub Pages | vorbereitet, nicht aktiviert |
| Rechtliches Gate | `BLOCKED_EXTERNAL_OWNER_ACTION` |
| GoatCounter | nicht eingerichtet (`goatcounterKurzname: null`) |
| Unterstützen-Link | deaktiviert (`unterstuetzen.aktiv: false`) |
| Inhaltliche Prüfung | 17. September 2026 |
| Rechtsstand der Rechnung | Veranlagungszeitraum 2026 |

Die Spalte „Repository“ beschreibt den tatsächlich vorgefundenen Zustand. Ist das Verzeichnis noch kein git-Repository, fehlt auch die Versionierung; alle Aussagen über „committet“ oder „veröffentlicht“ sind dann nicht belastbar.

## Aufbau des Repositorys

```
index.html                 Rechner (vier Schritte, Ergebnisansicht)
methodik.html              Rechenweg, Annahmen, Grenzen
quellen.html               Quellenverzeichnis
datenschutz.html           Datenschutzhinweise
impressum.html             Anbieterkennzeichnung, gefüllt aus der Konfiguration

assets/css/style.css
assets/img/favicon.svg
assets/img/vorschau.png

assets/js/config.js        Zentrale Konfiguration der externen Abhängigkeiten
assets/js/analytics.js     Datensparsame Produktanalyse (Ereignis-Allowlist)

assets/js/engine/params.js     Parameter 2025/2026 + Zweitimplementierung des PAP
assets/js/engine/tariff.js     § 32a EStG, Splitting über einen allgemeinen Teiler
assets/js/engine/soli.js       §§ 3 und 4 SolzG 1995, in Cent gerechnet
assets/js/engine/est.js        Jahresveranlagung, Familienleistungsausgleich
assets/js/engine/netto.js      Netto und Rückrechnung Netto auf Brutto
assets/js/engine/scenario.js   BASELINE, SZENARIEN, GESAMTSZENARIO, analysiere()

assets/js/ui/app.js            Ablaufsteuerung und Ergebnisdarstellung
assets/js/ui/impressum.js      Rendert die Anbieterkennzeichnung aus der Konfiguration

data/baseline/est-2026.json    Maschinenlesbare Fassung der Parameter 2026
data/policies/afd-2025.json    Die zwölf Programmpunkte mit Zitat, Seite, Status
data/sources/manifest.json     Maschinenlesbares Quellenverzeichnis

docs/PREFLIGHT.md              Gate-Protokoll vor der ersten Änderung
docs/METHODOLOGY.md            Vollständige Methodik
docs/SOURCES.md                Quellenhierarchie und Quellenkonflikte
docs/PRIVACY.md                Datenschutz aus Entwicklungssicht
docs/LIMITATIONS.md            Bekannte Grenzen
docs/METRICS.md                Entwurf der Live-Produktmetriken
docs/LEGAL-GATE.md             Rechtliches Gate und Freischaltverfahren

tests/unit/                    node --test, Engine und Datenkonsistenz
tests/reference/               node --test, Abgleich mit dem BMF-Programmablaufplan
tests/e2e/                     Playwright: Journey, Netto, Barrierefreiheit, Datenschutz, Sichtnachweis
tests/visual/                  Erzeugte Sichtnachweis-Bilder

tools/serve.mjs                Lokaler statischer Server, ohne Abhängigkeiten
playwright.config.js
package.json
.github/workflows/             derzeit leer
```

## Lokal starten

```
npm install
node tools/serve.mjs
```

Danach `http://127.0.0.1:4173/` im Browser öffnen. Der Server bindet ausschließlich an `127.0.0.1`, liefert nur Dateien aus dem Projektverzeichnis und setzt `cache-control: no-store`. Der Port ist über die Umgebungsvariable `PORT` änderbar; Vorgabe ist 4173.

Ein direkter Aufruf über `file://` funktioniert nicht: Der Rechner lädt `data/policies/afd-2025.json` per `fetch`, was ein HTTP-Ursprung erfordert. Ohne diese Datei gibt der Rechner bewusst kein Ergebnis aus, sondern meldet, dass die Quellendaten nicht geladen werden konnten.

Dieselbe Startzeile nutzt die Playwright-Konfiguration als `webServer` mit `reuseExistingServer: true`.

## Tests

```
npm test             # node --test tests/unit/ tests/reference/  (82 Tests)
npm run test:unit    # nur tests/unit/
npm run test:e2e     # playwright test, Projekte mobil-360, mobil-390, mobil-412, desktop-1280
npm run serve        # identisch zu node tools/serve.mjs
npm run check        # deklariert als node tools/check.mjs
```

Anmerkungen zur Umgebung, in der diese Dokumentation erstellt wurde (Node v24.11.1, Playwright 1.63.0):

- `node --test tests/unit/ tests/reference/` löst die Verzeichnisargumente in diesem Node-Build nicht auf; die Verzeichnisse werden als Skriptpfade behandelt und der Lauf bricht mit `MODULE_NOT_FOUND` ab. `node --test` ohne Argumente findet dieselben Dateien und meldet 82 von 82 Tests grün. Betroffen sind damit auch `npm test` und `npm run test:unit` in ihrer derzeitigen Fassung.
- `npm run check` verweist auf `tools/check.mjs`. Diese Datei liegt im Repository derzeit nicht vor; der Aufruf schlägt fehl.
- Die E2E-Suite ist lauffähig. `tests/e2e/visual.spec.js` schreibt bei jedem Lauf Sichtnachweis-Bilder nach `tests/visual/`.

## Berechnete und nicht berechnete Vorschläge

Vier Vorschläge gehen in das Ergebnis ein. Acht Programmpunkte werden ausdrücklich nicht in Euro bewertet.

Berechnet:

| Vorschlag | Programmseite | Einordnung |
|---|---|---|
| Grundfreibetrag steigt auf 15.000 Euro | 58 | `DIRECTLY_CALCULABLE`, mit dokumentierter Methodenannahme |
| Abschaffung des Solidaritätszuschlags für alle | 14 | `DIRECTLY_CALCULABLE` |
| Sparer-Pauschbetrag steigt auf 6.672 Euro | 60 | `DIRECTLY_CALCULABLE`, nur bei angegebenen Kapitalerträgen bewertet |
| Familiensplitting | 59 | `MODEL_ASSUMPTION`, nur für Haushalte mit Kindern |

Nicht in Euro bewertet:

| Programmpunkt | Programmseite |
|---|---|
| Abschaffung aller CO₂-Abgaben | 57 |
| Reduzierung der Energiesteuer, Stromsteuer auf das Minimum | 13 |
| Abschaffung der Grundsteuer | 58 |
| Abschaffung der Vermögen- und Erbschaftsteuer | 60 |
| Mehrwertsteuer Gastronomie auf 7 Prozent | 57 |
| Mehrwertsteuer Kinderbedarf auf 7 Prozent | 148 |
| Aufhebung der Grunderwerbsteuer für Selbstnutzer | 36 |
| Anhebung des Kinderfreibetrages | 148 |

Die Begründung je Punkt steht im Rechner selbst und in `data/policies/afd-2025.json`. Zwei Posten, die das ZEW-Gutachten unter dem AfD-Programm aufführt (Werbungskostenpauschale 2.000 Euro, Kinderfreibetrag 12.000 Euro), stammen aus der BT-Drucksache 20/13356 und nicht aus dem Wahlprogramm; sie werden nicht gerechnet. Siehe `docs/SOURCES.md`.

## Rechtliches Gate: warum die Seite noch nicht öffentlich ist

Nach § 5 Digitale-Dienste-Gesetz braucht ein öffentliches Angebot mindestens den vollständigen Namen, eine Zustellanschrift und eine Kontaktmöglichkeit zur schnellen elektronischen Kontaktaufnahme. Diese Angaben liegen nicht vor.

Deshalb gilt:

- Es wurde **kein Platzhalter und keine erfundene Anbieterangabe** veröffentlicht. `impressum.html` rendert stattdessen einen sachlichen Hinweis, dass die Angaben fehlen (`assets/js/ui/impressum.js`).
- GitHub Pages wurde bewusst **nicht** aktiviert.
- Der Status ist `BLOCKED_EXTERNAL_OWNER_ACTION`, die Regel `LEGAL_OWNER_DATA=REQUIRED_FOR_PUBLICATION`.

Was der Betreiber tun muss, damit die Seite öffentlich werden kann:

1. In `assets/js/config.js` den Block `KONFIGURATION.betreiber` füllen: `name`, `anschrift`, `email`, optional `inhaltlichVerantwortlich`.
2. Im selben Block `vorhanden: true` setzen.
3. `impressum.html` lokal prüfen (`node tools/serve.mjs`, dann `http://127.0.0.1:4173/impressum.html`). Die Angaben erscheinen ausschließlich aus der Konfiguration.
4. Erst danach GitHub Pages aktivieren.
5. Optional, jeweils separat: `goatcounterKurzname` setzen (Analyse), `oeffentlicherZaehler.aktiv` auf `true` setzen (öffentlicher Zähler), `unterstuetzen.aktiv` und `unterstuetzen.url` setzen (Unterstützen-Link).

Die vollständige Schrittfolge und die zusätzlichen Gates stehen in `docs/LEGAL-GATE.md`.

## GitHub Pages: Grenzen und spätere Migration

Der Betrieb ist auf GitHub Pages ausgelegt und kostenfrei. Für die Planung sind die bekannten Grenzen des Dienstes relevant:

- weiche Bandbreitengrenze von rund 100 GB pro Monat,
- weiche Grenze der Repositorygröße von 1 GB,
- GitHub kann geplante Workflows in inaktiven öffentlichen Repositorys nach 60 Tagen deaktivieren.

Für V1 ist das nicht bindend, weil das Angebot statisch ist, keine Binärdateien in nennenswertem Umfang ausliefert und derzeit keinen geplanten Workflow benötigt. Sollte die tatsächliche Nutzung die Grenzen von GitHub Pages überschreiten, ist die Migration auf einen anderen statischen Hoster eine dokumentierte spätere Option und **nicht** Teil von V1. Der Rechner ist hostneutral: Es genügt, Dateien auszuliefern.

Die 60-Tage-Deaktivierung geplanter Workflows ist der Grund, warum die Metrikprüfung in `docs/METRICS.md` ausdrücklich einen Veraltungstest vorsieht (`METRICS_STALE`, Schwellwert 48 Stunden).

## Lizenz und Rechte an Texten

`package.json` führt das Projekt als privates Paket (`"private": true`) mit der Lizenzangabe MIT. Eine separate Lizenzdatei liegt im Repository derzeit nicht vor.

Zitate aus dem Bundestagswahlprogramm, aus Gesetzestexten und aus amtlichen Veröffentlichungen dienen ausschließlich der Belegführung. Die Rechte an diesen Originaltexten liegen bei den jeweiligen Rechteinhabern.

## Weiterlesen

- `docs/METHODOLOGY.md` — Rechenweg, Formeln, Annahmen, Validierung
- `docs/SOURCES.md` — Quellenhierarchie, Quellenverzeichnis, dokumentierte Abweichungen
- `docs/LIMITATIONS.md` — bekannte Grenzen, offen benannt
- `docs/PRIVACY.md` — Datenschutz aus Entwicklungssicht
- `docs/METRICS.md` — Entwurf der Live-Produktmetriken
- `docs/LEGAL-GATE.md` — rechtliches Gate und Freischaltung
- `docs/PREFLIGHT.md` — Gate-Protokoll vor der ersten Änderung
- `AGENTS.md` — Projekt-Governance für künftige Agenten
