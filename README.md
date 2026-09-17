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
| Repository | git-Repository, Branch `main`, Remote `origin` = `https://github.com/xxammaxx/programm-rechner.git`; das Repository ist öffentlich |
| Tests | 88 von 88 Tests grün (`npm test`, Node v24.11.1); E2E-Suite 204 von 204 in vier Profilen |
| Codeprüfung | `CODE_TRUTH = PASS` (130 Prüfungen, 0 Fehler, `npm run check`) |
| Welt-Wahrheitsprüfung | `WORLD_TRUTH = PASS` (41 Prüfungen, 0 Fehler) gegen das Bauergebnis |
| GitHub Pages | vorbereitet, nicht aktiviert (die Pages-Schnittstelle des Repositorys antwortet mit 404) |
| Rechtliches Gate | `LEGAL_OWNER_DATA=REQUIRED_FOR_PUBLICATION`, Klassifizierung `BLOCKED_EXTERNAL_OWNER_ACTION` |
| GoatCounter | nicht eingerichtet (`goatcounterKurzname: null`); es wird kein Analyseskript geladen |
| Unterstützen-Link | deaktiviert (`unterstuetzen.aktiv: false`, `unterstuetzen.url: null`) |
| Inhaltliche Prüfung | 17. September 2026 |
| Rechtsstand der Rechnung | Veranlagungszeitraum 2026 |

Alle Zahlen in dieser Tabelle sind reproduzierbar. Sie wurden mit Node v24.11.1 und Playwright 1.63.0 erhoben; die Einzelschritte stehen unter „Tests“.

**Die eine noch offene Betreiberhandlung:** In `assets/js/config.js` den Block `KONFIGURATION.betreiber` mit `name`, `anschrift` und `email` füllen und `vorhanden: true` setzen; danach GitHub Pages in den Repository-Einstellungen aktivieren (Quelle: GitHub Actions). Ohne diese Angaben bleibt die Veröffentlichung gesperrt, denn ein öffentliches Angebot ohne Anbieterkennzeichnung ist nicht zulässig. Der nächste Push auf `main` veröffentlicht dann automatisch. Die Schrittfolge steht in `docs/LEGAL-GATE.md`.

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
docs/METRICS.md                Live-Produktmetriken, Feldschema und Statuswerte
docs/LEGAL-GATE.md             Rechtliches Gate und Freischaltverfahren

tests/unit/                    node --test, Engine und Datenkonsistenz
tests/reference/               node --test, Abgleich mit dem BMF-Programmablaufplan
tests/e2e/                     Playwright: Journey, Netto, Barrierefreiheit, Datenschutz, Sichtnachweis
tests/visual/                  Sichtnachweis-Bilder, 27 PNG, bewusst mitversioniert

tools/serve.mjs                Lokaler statischer Server, ohne Abhängigkeiten
tools/check.mjs                Code-Wahrheitsschicht, ohne Browser und ohne Abhängigkeiten
tools/legal-gate.mjs           Rechtliches Tor, meldet den Zustand an den Workflow
tools/metriken.mjs             Ruft die Produktmetriken ab und baut den Kommentarbericht
tools/verify-world.mjs         Welt-Wahrheitsprüfung einer ausgelieferten Fassung

.github/workflows/pages.yml    Prüfen und Veröffentlichen bei Push auf main
.github/workflows/metrics.yml  Produktmetriken, täglicher Zeitplan und manueller Start

LICENSE                        MIT, gilt für den Quellcode
playwright.config.js
package.json
```

## Lokal starten

```
npm install
npm run serve
```

Danach `http://127.0.0.1:4173/` im Browser öffnen. Der Server bindet ausschließlich an `127.0.0.1`, liefert nur Dateien aus dem Projektverzeichnis und setzt `cache-control: no-store`. Der Port ist über die Umgebungsvariable `PORT` änderbar; Vorgabe ist 4173.

Ein direkter Aufruf über `file://` funktioniert nicht: Der Rechner lädt `data/policies/afd-2025.json` per `fetch`, was ein HTTP-Ursprung erfordert. Ohne diese Datei gibt der Rechner bewusst kein Ergebnis aus, sondern meldet, dass die Quellendaten nicht geladen werden konnten.

Dieselbe Startzeile nutzt die Playwright-Konfiguration als `webServer` mit `reuseExistingServer: true`.

### Bauergebnis prüfen

```
npm run build
WURZEL=_site PORT=4175 node tools/serve.mjs
node tools/verify-world.mjs http://127.0.0.1:4175
```

`npm run build` kopiert `*.html`, `assets/` und `data/` nach `_site/` und legt `_site/.nojekyll` an. `tools/serve.mjs` liest das Wurzelverzeichnis aus `WURZEL` und den Port aus `PORT`; damit lässt sich genau die zusammengestellte Fassung ausliefern. Gegen dieses Verzeichnis ist belegt, dass das Bauergebnis selbsttragend ist: `/tests/…`, `/tools/…` und `/node_modules/…` liefern dort 404.

## Tests

Die Skripte stehen in `package.json` und lauten:

```
npm test             # node --test "tests/unit/*.test.mjs" "tests/reference/*.test.mjs"
npm run test:unit    # nur tests/unit/
npm run test:reference  # nur tests/reference/
npm run test:e2e     # playwright test, Projekte mobil-360, mobil-390, mobil-412, desktop-1280
npm run check        # node tools/check.mjs
npm run verify:world # node tools/verify-world.mjs
npm run serve        # node tools/serve.mjs
npm run build        # baut _site/ und setzt _site/.nojekyll
```

Gemessene Ergebnisse (Node v24.11.1, Playwright 1.63.0):

- `npm test` → 88 Tests, 88 bestanden, 0 Fehler.
- `npm run check` → 130 Prüfungen bestanden, 0 Fehler, Ausgabe `CODE_TRUTH = PASS`. Geprüft werden unter anderem gültiges JSON, die HTML-Struktur, interne Verweise auf vorhandene Dateien, das Fehlen von Geheimnissen und Inline-Ressourcen, das Verbot von Fremdskripten und verbotenen politischen Wendungen sowie der Zustand des rechtlichen Tors.
- `npm run test:e2e` → 204 Tests bestanden, 0 Fehler, über die vier Playwright-Projekte `mobil-360`, `mobil-390`, `mobil-412` und `desktop-1280`.
- `node tools/verify-world.mjs <adresse>` → 41 Prüfungen, 0 Fehler, Ausgabe `WORLD_TRUTH = PASS`. Das Werkzeug rechnet sechs Haushaltsfälle mit dem Rechenkern nach und vergleicht sie mit dem, was die Seite anzeigt, prüft, dass während des gesamten Laufs keine externe Adresse kontaktiert und nichts gespeichert wird, dass alle 20 Quellenverweise erreichbar sind und dass das Impressum nichts erfindet. Ohne Adressargument prüft es die örtliche Auslieferung unter `http://127.0.0.1:4173`.

Hinweis zum Sichtnachweis: `tests/e2e/visual.spec.js` schreibt bei jedem E2E-Lauf 27 PNG-Dateien nach `tests/visual/` (die drei Breiten 360, 390 und 412 Pixel für die fünf Rechnerschirme und die vier Textseiten). Dieses Verzeichnis ist **mitversioniert**. `npm run test:e2e` aktualisiert damit absichtlich Dateien, die als Sichtnachweis im Repository liegen; nach einem Lauf können sie sich im Arbeitsverzeichnis ändern.

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

Die Begründung je Punkt steht im Rechner selbst und in `data/policies/afd-2025.json`. Damit sind zwölf Programmpunkte erfasst: drei direkt berechenbar, einer als Modellannahme, acht nicht einzeln berechenbar.

### Grundlage der Rechnung

Quelle der Programmaussagen ist das AfD-Bundestagswahlprogramm 2025, verabschiedet auf dem 16. Bundesparteitag am 11. bis 12. Januar 2025 in Riesa. Das PDF hat 180 Seiten; die gedruckte Seitennummerierung läuft bis 175. Die in `data/policies/afd-2025.json` angegebene Seite ist die aufgedruckte Seite; die gedruckte Seite ist der PDF-Seitenindex minus 2.

Rechtsstand der Rechnung ist der Veranlagungszeitraum 2026. Unabhängige Referenz für Tarif und Solidaritätszuschlag ist der amtliche BMF-Programmablaufplan 2026, BMF-Schreiben vom 12.11.2025, GZ IV C 5 - S 2361/00025/016/028.

### Dokumentierte Quellenkonflikte

- Der Sparer-Pauschbetrag: Das ZEW-Gutachten vom Januar 2025 modelliert 2.400 Euro, weil es den Leitantrag vor dem Parteitag heranzieht. Das verabschiedete Programm nennt 6.672 Euro. Der Rechner verwendet den Wert des verabschiedeten Programms und weist die Abweichung aus.
- Zwei Posten, die das ZEW-Gutachten unter dem AfD-Programm aufführt (Werbungskostenpauschale 2.000 Euro, Kinderfreibetrag 12.000 Euro), stammen aus der BT-Drucksache 20/13356 und nicht aus dem Wahlprogramm; die Zeichenfolgen „Werbungskostenpauschale“ und „Pendlerpauschale“ kommen im Programm null Mal vor. Sie werden nicht gerechnet.
- Transferleistungen: Der Rechner bildet Wohngeld, Bürgergeld, Grundsicherung und Kinderzuschlag nicht ab. Die Zahl 440 Euro für den Beispielhaushalt mit zwei Kindern und 40.000 Euro Bruttojahreseinkommen stammt aus dem ZEW-Gutachten. Die Aussage über die Ursache, nämlich das Zusammenspiel aus Steuerentlastung und Anrechnungsregeln beim Wohngeld, steht nicht im Gutachten, sondern in der ZEW-Pressemitteilung „Wen die Parteien entlasten würden“ (`https://www.zew.de/presse/pressearchiv/wen-die-parteien-entlasten-wuerden`). Der Rechner hält diese Unterscheidung ein.

Einzelheiten stehen in `docs/SOURCES.md`.

## Rechtliches Gate: warum die Seite noch nicht öffentlich ist

Nach § 5 Digitale-Dienste-Gesetz braucht ein öffentliches Angebot mindestens den vollständigen Namen, eine Zustellanschrift und eine Kontaktmöglichkeit zur schnellen elektronischen Kontaktaufnahme. Diese Angaben liegen nicht vor.

Deshalb gilt:

- Es wurde **kein Platzhalter und keine erfundene Anbieterangabe** veröffentlicht. `impressum.html` rendert stattdessen einen sachlichen Hinweis, dass die Angaben fehlen (`assets/js/ui/impressum.js`).
- GitHub Pages wurde bewusst **nicht** aktiviert; die Pages-Schnittstelle antwortet für das Repository mit 404.
- Der Status ist `BLOCKED_EXTERNAL_OWNER_ACTION`, die Regel `LEGAL_OWNER_DATA=REQUIRED_FOR_PUBLICATION`.

Das Tor ist technisch umgesetzt. `tools/legal-gate.mjs` prüft, dass `KONFIGURATION.betreiber` in `assets/js/config.js` gesetzt ist, also `vorhanden === true` sowie nicht leere Werte für `name`, `anschrift` und `email`. Es gibt den Zustand aus und schreibt `zulaessig=<bool>` nach `$GITHUB_OUTPUT`. In `.github/workflows/pages.yml` hängen sowohl das Zusammenstellen und Hochladen des Bauergebnisses als auch der gesamte Auftrag `Veroeffentlichen` an dieser Ausgabe. Ein Push auf `main` führt deshalb die Tests und die Codeprüfung aus, meldet das rechtliche Tor als OFFEN und überspringt die Veröffentlichung. In einem realen Lauf ist genau das eingetreten: der Auftrag `Pruefen` war erfolgreich, der Auftrag `Veroeffentlichen` wurde übersprungen.

Was der Betreiber tun muss, damit die Seite öffentlich werden kann:

1. In `assets/js/config.js` den Block `KONFIGURATION.betreiber` füllen: `name`, `anschrift`, `email`, optional `inhaltlichVerantwortlich`.
2. Im selben Block `vorhanden: true` setzen.
3. `impressum.html` lokal prüfen (`npm run serve`, dann `http://127.0.0.1:4173/impressum.html`). Die Angaben erscheinen ausschließlich aus der Konfiguration.
4. Erst danach GitHub Pages in den Repository-Einstellungen aktivieren (Quelle: GitHub Actions). Der nächste Push auf `main` veröffentlicht dann automatisch.
5. Optional, jeweils separat: `goatcounterKurzname` setzen (Analyse), `oeffentlicherZaehler.aktiv` auf `true` setzen (öffentlicher Zähler), `unterstuetzen.aktiv` und `unterstuetzen.url` setzen (Unterstützen-Link).

Die vollständige Schrittfolge und die zusätzlichen Gates stehen in `docs/LEGAL-GATE.md`.

## GitHub Pages: Grenzen und spätere Migration

Der Betrieb ist auf GitHub Pages ausgelegt und kostenfrei. Für die Planung sind die bekannten Grenzen des Dienstes relevant:

- weiche Bandbreitengrenze von rund 100 GB pro Monat,
- weiche Grenze der Repositorygröße von 1 GB,
- GitHub kann geplante Workflows in inaktiven öffentlichen Repositorys nach 60 Tagen deaktivieren.

Für V1 ist das nicht bindend, weil das Angebot statisch ist und keine Binärdateien in nennenswertem Umfang ausliefert. Der Workflow `.github/workflows/metrics.yml` läuft geplant und ist von der 60-Tage-Regel betroffen; deshalb sieht die Metrikprüfung einen Veraltungstest vor (`METRICS_STALE`, Schwellwert 48 Stunden, siehe `docs/METRICS.md`). Sollte die tatsächliche Nutzung die Grenzen von GitHub Pages überschreiten, ist die Migration auf einen anderen statischen Hoster eine dokumentierte spätere Option und **nicht** Teil von V1. Der Rechner ist hostneutral: Es genügt, Dateien auszuliefern.

## Lizenz und Rechte an Texten

Der Quellcode steht unter der MIT-Lizenz; der vollständige Text liegt in `LICENSE`. `package.json` führt das Projekt als privates Paket (`"private": true`), als Typ `module`, mit `"engines": { "node": ">=21" }`.

Die MIT-Lizenz gilt für den Quellcode. Zitate aus dem Bundestagswahlprogramm, aus Gesetzestexten und aus amtlichen Veröffentlichungen dienen ausschließlich der Belegführung; die Rechte an diesen Originaltexten liegen bei den jeweiligen Rechteinhabern und werden durch die Lizenz des Quellcodes nicht berührt.

## Weiterlesen

- `docs/METHODOLOGY.md` — Rechenweg, Formeln, Annahmen, Validierung
- `docs/SOURCES.md` — Quellenhierarchie, Quellenverzeichnis, dokumentierte Abweichungen
- `docs/LIMITATIONS.md` — bekannte Grenzen, offen benannt
- `docs/PRIVACY.md` — Datenschutz aus Entwicklungssicht
- `docs/METRICS.md` — Live-Produktmetriken, Feldschema und Statuswerte
- `docs/LEGAL-GATE.md` — rechtliches Gate und Freischaltung
- `docs/PREFLIGHT.md` — Gate-Protokoll vor der ersten Änderung
- `AGENTS.md` — Projekt-Governance für künftige Agenten
