# Live-Produktmetriken

Dieses Dokument spezifiziert die einzige geplante Datenerhebung nach der Veröffentlichung.
Sie dient ausschließlich der Bedienbarkeit, Klarheit, Barrierefreiheit, Zuverlässigkeit,
Ladezeit, Fehlerbehandlung und Navigation. Sie dient ausdrücklich nicht dazu, politische
Aussagen zu verändern oder Nutzer politisch einzuordnen
(`REAL_USAGE_IS_EVIDENCE_NOT_AUTHORITY = TRUE`, siehe `AGENTS.md`).

## 1. Ausgangslage

| Punkt | Zustand |
|---|---|
| Produktanalyse im Frontend | nicht eingerichtet (`goatcounterKurzname: null` in `assets/js/config.js`) |
| Analyse im Auslieferungszustand | aus; es wird kein Analyseskript geladen |
| Workflow im Repository | `.github/workflows/` ist derzeit leer; es läuft kein Workflow |
| Kanonisches Issue | noch nicht angelegt |
| Erwarteter `METRICS_STATUS` | `ANALYTICS_UNCONFIGURED` |

Damit gilt: Das Issue und der Workflow sind hier vollständig spezifiziert, aber **noch nicht
in Betrieb**. Der Workflow kann ohne das Actions-Secret für die GoatCounter-Schnittstelle
nicht funktionieren. Solange kein Secret hinterlegt ist und kein Konto besteht, hat der
Status `ANALYTICS_UNCONFIGURED` zu lauten. Es werden keine Zahlen erfunden, geschätzt oder
aus einem früheren Lauf fortgeschrieben.

## 2. Kanonisches Issue

| Merkmal | Festlegung |
|---|---|
| Repository | `programm-rechner` |
| Titel | `LIVE PRODUCT METRICS` (genau so, Großschreibung verbindlich) |
| Anzahl | genau eines. Es wird nicht je Lauf ein neues Issue angelegt |
| Inhalt | genau ein Kommentar mit dem Marker `<!-- live-product-metrics -->` |
| Pflege | Der bestehende Kommentar wird **aktualisiert**, nicht neu erstellt und nicht ergänzt |

Der Marker steht in der ersten Zeile des Kommentars und ist die einzige Kennung, über die
der Kommentar gefunden wird. Ein Lauf sucht den Kommentar mit dem Marker; findet er ihn,
aktualisiert er ihn; findet er ihn nicht, legt er genau einen an. Jede andere Vorgehensweise
erzeugt Kommentarspam und macht den Verlauf unlesbar.

Aufbau des Kommentars:

1. Kennung: eine Zeile mit dem Marker `<!-- live-product-metrics -->`.
2. Menschenlesbarer Abschnitt: kurze Tabelle mit Zeitraum, Vergleichszeitraum und den
   Kennzahlen, dazu ein Satz zur Datenlage.
3. Maschinenlesbarer Abschnitt: ein Codeblock mit dem unten festgelegten Feldbestand.

## 3. Zeitplan und Rechte

| Punkt | Festlegung |
|---|---|
| Auslöser | täglicher Zeitplan plus `workflow_dispatch` (manueller Start) |
| Zeitraum | rollierende 7 Tage |
| Vergleichszeitraum | die 7 Tage davor, sofern verfügbar |
| GoatCounter-API-Schlüssel | ausschließlich als GitHub-Actions-Secret. Vorgesehener Name `GOATCOUNTER_API_KEY`; der Name ist frei, muss aber in Workflow und Secret übereinstimmen |
| `GITHUB_TOKEN` | minimale Rechte: `contents: read` und `issues: write`. Kein weiteres Recht |
| Ablage | Kein Token und kein Schlüssel liegt jemals in ausgeliefertem Frontend-Code, in `assets/`, in `data/` oder in einer HTML-Datei |
| Auftraggeberkonto des Kommentars | ein Bot-Konto oder der Workflow selbst. Der Kommentar wird nicht im Namen einer Person verfasst |

`assets/js/config.js` nennt ausdrücklich, dass der Schlüssel nicht in die Konfiguration
gehört, sondern in ein GitHub-Actions-Secret. `tests/e2e/privacy.spec.js` prüft, dass kein
Token- oder Schlüsselmuster im Auslieferungscode liegt.

Skizze des vorgesehenen Workflows (Pfad `.github/workflows/live-product-metrics.yml`, noch
nicht angelegt):

```yaml
on:
  schedule:
    - cron: '17 5 * * *'      # täglich
  workflow_dispatch:

permissions:
  contents: read
  issues: write

jobs:
  metrik:
    runs-on: ubuntu-latest
    steps:
      - name: Metriken abrufen und Kommentar aktualisieren
        env:
          GOATCOUNTER_API_KEY: ${{ secrets.GOATCOUNTER_API_KEY }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: node tools/metriken.mjs   # noch nicht vorhanden
```

Das Hilfsskript `tools/metriken.mjs` existiert derzeit nicht; es ist zusammen mit dem
Workflow zu erstellen.

## 4. Machine-readable Block

Genau diese Felder, in dieser Schreibweise, mit genau diesen Namen:

| Feld | Bedeutung | Typ |
|---|---|---|
| `METRICS_SCHEMA_VERSION` | Version des Feldschemas | Zahl, Beginn bei `1` |
| `UPDATED_AT` | Zeitpunkt der Aktualisierung, ISO 8601 mit Zeitzone | Text |
| `PAGEVIEWS_7D` | Seitenaufrufe im Zeitraum (`page_view`) | Zahl oder `null` |
| `CALCULATOR_STARTED_7D` | Rechner begonnen (`calculator_started`) | Zahl oder `null` |
| `CALCULATOR_COMPLETED_7D` | Rechner abgeschlossen (`calculator_completed`) | Zahl oder `null` |
| `COMPLETION_RATE_7D` | `CALCULATOR_COMPLETED_7D / CALCULATOR_STARTED_7D`, auf drei Nachkommastellen | Zahl oder `null` |
| `SOURCE_OPENED_7D` | Quellen geöffnet (`source_opened`) | Zahl oder `null` |
| `SUPPORT_CLICKED_7D` | Unterstützen-Link angeklickt (`support_clicked`) | Zahl oder `null` |
| `GENERIC_JS_ERRORS_7D` | Technische Fehler (`generic_js_error`) | Zahl oder `null` |
| `PRIMARY_DROPOFF_STEP` | Schritt mit dem größten Abbruch | Text, Zahl oder `UNKNOWN` |
| `METRICS_STATUS` | Zustand der Metriken | `OK`, `STALE` oder `ANALYTICS_UNCONFIGURED` |

Zusätzlich, soweit verfügbar, die Werte des vorherigen Zeitraums. Vorgesehene Namen:
`*_PREV` in derselben Schreibweise, also `PAGEVIEWS_PREV`, `CALCULATOR_STARTED_PREV`,
`CALCULATOR_COMPLETED_PREV`, `COMPLETION_RATE_PREV`, `SOURCE_OPENED_PREV`,
`SUPPORT_CLICKED_PREV`, `GENERIC_JS_ERRORS_PREV`. Ist kein Vergleichszeitraum verfügbar,
stehen diese Felder auf `null`. Sie werden nicht geschätzt.

Beispiel eines Blocks:

```
METRICS_SCHEMA_VERSION = 1
UPDATED_AT = 2026-09-17T05:17:04+02:00
PAGEVIEWS_7D = 4182
CALCULATOR_STARTED_7D = 1907
CALCULATOR_COMPLETED_7D = 1244
COMPLETION_RATE_7D = 0.652
SOURCE_OPENED_7D = 310
SUPPORT_CLICKED_7D = 0
GENERIC_JS_ERRORS_7D = 2
PRIMARY_DROPOFF_STEP = UNKNOWN
METRICS_STATUS = OK
```

Zahlen sind in diesem Block ohne Tausenderzeichen zu schreiben.

Die Zahlen im Beispiel sind Ausfüllhilfen für das Format, keine Messwerte.

### 4.1 Verbote für die Metrikausgabe

- Keine personenbezogenen Daten: kein Einkommen, kein Haushaltstyp, keine Kinderzahl, kein
  Leistungsbezug, kein Rechenergebnis, keine Ergebnisrichtung, keine gewählte Quelle, keine
  politische Einstellung.
- Keine Freitexte aus Fehlermeldungen, keine Stacks, keine Ausnahmen.
- Keine Sitzungs- oder Nutzerkennungen, keine Geräte-, Orts- oder Zeitreihenprofile.
- Keine Ableitung politischer Aussagen aus den Zahlen.
- Keine Schätzung fehlender Werte. Fehlt eine Zahl, wird `null` geschrieben.

### 4.2 `PRIMARY_DROPOFF_STEP`

Mit der derzeit gültigen Ereignismenge ist dieses Feld nicht bestimmbar.
`ERLAUBTE_EREIGNISSE` in `assets/js/analytics.js` enthält genau acht Namen ohne Parameter,
und `assets/js/ui/app.js` zählt `step_completed` ohne Schrittnummer. Aus den Gesamtzahlen
lässt sich der Abschlussgrad insgesamt berechnen, aber nicht der Schritt mit dem größten
Abbruch.

Deshalb gilt: Der Wert lautet `UNKNOWN`, solange die Ereignismenge unverändert ist. Der Wert
darf nicht geraten werden. Eine Änderung der Ereignismenge (etwa ein eigener Ereignisname je
Schritt) ist eine Erweiterung der Datenerhebung, keine Formalie: Sie ist nach
`docs/PRIVACY.md` Abschnitt 8 zu prüfen, zu dokumentieren und in `datenschutz.html`
nachzuführen, bevor sie eingesetzt wird. Sie darf keine Haushaltsmerkmale übertragen.

## 5. Veraltung: `METRICS_STALE`

**Definition:** Ein Metrikstand gilt als veraltet, wenn `UPDATED_AT` älter als
**48 Stunden** ist. In diesem Fall lautet `METRICS_STATUS` = `STALE`.

Begründung für den Schwellwert: Bei täglichem Lauf bleibt der Stand normalerweise unter 24
Stunden alt. Ein Stand über 48 Stunden bedeutet, dass mindestens ein Lauf ausgefallen ist
oder der Workflow nicht mehr ausgeführt wird.

Pflicht eines Agenten: Erkennt ein Agent beim Lesen des Metrikkommentars einen
`UPDATED_AT`, der älter als 48 Stunden ist, oder steht `METRICS_STATUS` nicht auf `OK`, dann
meldet er diesen Umstand **zuerst**, bevor er irgendeine Aussage aus den Zahlen ableitet
(`AGENTS.md` Abschnitt 5, Punkte 1 und 2). Aus veralteten Zahlen werden keine Hypothesen
gebildet.

GitHub kann geplante Workflows in inaktiven öffentlichen Repositorys nach 60 Tagen
deaktivieren. Das ist die wahrscheinlichste Ursache für einen Stand, der längere Zeit nicht
aktualisiert wurde. Die Veraltungsprüfung erkennt genau diesen Fall und macht ihn sichtbar,
ohne dass jemand die Workflow-Liste manuell beobachten muss. Zusätzlich zeigt der
GitHub-Actions-Bereich deaktivierte Workflows an.

## 6. Ehrlichkeit des Status

Der Workflow hat `METRICS_STATUS` wahrheitsgemäß zu setzen:

| Wert | Bedeutung | Zulässige Zahlen |
|---|---|---|
| `OK` | Daten abgerufen, `UPDATED_AT` jünger als 48 Stunden | die abgerufenen Werte |
| `STALE` | Letzter Stand älter als 48 Stunden oder Lauf fehlgeschlagen | die zuletzt bekannten Werte, mit ausdrücklichem Hinweis |
| `ANALYTICS_UNCONFIGURED` | Kein `goatcounterKurzname` gesetzt oder kein Secret hinterlegt | alle Zahlen `null` |

Unzulässig ist insbesondere: einen fehlenden Abruf mit einem alten Wert zu überschreiben,
einen Fehler als `OK` zu melden, einen Schätzwert anstelle von `null` einzusetzen oder einen
Zähler als Erfolg darzustellen, der nicht abgerufen werden konnte. Der
`UPDATED_AT`-Zeitstempel wird nur bei einem tatsächlich erfolgreichen Abruf aktualisiert.

## 7. Was mit den Metriken geschehen darf

Zulässige Reaktionen sind in `AGENTS.md` Abschnitt 5 abschließend aufgeführt. Kurz:
Bedienbarkeit, Klarheit, Barrierefreiheit, Zuverlässigkeit, Ladezeit, Fehlerbehandlung,
Navigation. Jede Änderung setzt eine formulierte Hypothese und eine Vergleichsmessung
voraus.

Unzulässig: politische Sprache überzeugender machen, unerwünschte Ergebnisse verstecken oder
umformulieren, Ergebnisse mit stärkerer politischer Wirkung hervorheben, Formeln ändern, um
Beteiligung zu erhöhen, Nutzer politisch profilieren.

## 8. Einrichtung, Schritt für Schritt

1. GoatCounter-Instanz einrichten und den Kurznamen in `assets/js/config.js` als
   `goatcounterKurzname` eintragen. Damit lädt die Seite das Analyseskript.
2. Den API-Schlüssel als Actions-Secret hinterlegen (vorgesehener Name `GOATCOUNTER_API_KEY`).
   Der Schlüssel wird nicht in das Repository geschrieben.
3. Den Workflow unter `.github/workflows/live-product-metrics.yml` anlegen, mit den Rechten
   `contents: read` und `issues: write`.
4. Das Hilfsskript `tools/metriken.mjs` anlegen: Kommentar mit
   `<!-- live-product-metrics -->` suchen, aktualisieren oder einmalig anlegen.
5. Das kanonische Issue `LIVE PRODUCT METRICS` anlegen, einmalig, und die Nummer im Workflow
   hinterlegen.
6. Die Datenschutzhinweise in `datenschutz.html` prüfen: Die dort genannten zulässigen
   Ereignisse müssen mit `ERLAUBTE_EREIGNISSE` übereinstimmen.
7. `tests/e2e/privacy.spec.js` erneut laufen lassen. Der Test „die Seite lädt kein
   Analyse-Skript, solange keine Instanz eingerichtet ist“ gilt weiterhin und muss für den
   konfigurierten Fall bewusst angepasst werden, nicht stillschweigend entfernt.
