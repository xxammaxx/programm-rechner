# Live-Produktmetriken

Dieses Dokument spezifiziert die einzige geplante Datenerhebung nach der Veröffentlichung.
Sie dient ausschließlich der Bedienbarkeit, Klarheit, Barrierefreiheit, Zuverlässigkeit,
Ladezeit, Fehlerbehandlung und Navigation. Sie dient ausdrücklich nicht dazu, politische
Aussagen zu verändern oder Nutzer politisch einzuordnen
(`REAL_USAGE_IS_EVIDENCE_NOT_AUTHORITY = TRUE`, siehe `AGENTS.md`).

Die Erhebung ist im Repository vollständig umgesetzt: Der Workflow
`.github/workflows/metrics.yml`, das Hilfsskript `tools/metriken.mjs`, das kanonische Issue
und der Kommentar bestehen und laufen. Was fehlt, ist allein die Messquelle: Ohne
GoatCounter-Instanz und ohne das Repository-Secret wird ehrlich
`METRICS_STATUS = ANALYTICS_UNCONFIGURED` gemeldet und jede Zahl bleibt `NA`.

## 1. Ausgangslage

| Punkt | Zustand |
|---|---|
| Produktanalyse im Frontend | nicht eingerichtet (`goatcounterKurzname: null` in `assets/js/config.js`) |
| Analyse im Auslieferungszustand | aus; es wird kein Analyseskript geladen und der Rechner läuft vollständig ohne es |
| Workflow im Repository | vorhanden: `.github/workflows/metrics.yml` (`name: LIVE PRODUCT METRICS`), täglicher Zeitplan und manueller Start |
| Hilfsskript | vorhanden: `tools/metriken.mjs` |
| Repository-Secret | `GOATCOUNTER_API_KEY` ist nicht gesetzt |
| Kanonisches Issue | angelegt: Issue Nr. 1 mit dem Titel `LIVE PRODUCT METRICS` in `xxammaxx/programm-rechner`, genau ein Kommentar mit dem Marker |
| Beobachteter `METRICS_STATUS` | `ANALYTICS_UNCONFIGURED` |

Damit gilt: Die Messkette steht und ist geprüft, aber sie misst nichts, weil keine
GoatCounter-Instanz und kein Schlüssel vorliegen. Solange das so ist, hat der Status
`ANALYTICS_UNCONFIGURED` zu lauten. Es werden keine Zahlen erfunden, geschätzt oder aus einem
früheren Lauf fortgeschrieben. `NA` in einem Zahlenfeld bedeutet „keine Messung“, niemals
null.

## 2. Kanonisches Issue

| Merkmal | Festlegung |
|---|---|
| Repository | `xxammaxx/programm-rechner` |
| Titel | `LIVE PRODUCT METRICS` (genau so, Großschreibung verbindlich) |
| Anzahl | genau eines. Es wird nicht je Lauf ein neues Issue angelegt |
| Anlage | Der Workflow sucht das Issue über seinen Titel; findet er es nicht, legt er es genau einmal an |
| Inhalt | genau ein Kommentar. Der Kommentar beginnt mit dem Marker `<!-- live-product-metrics -->` |
| Pflege | Der bestehende Kommentar wird **aktualisiert**, nicht neu erstellt und nicht ergänzt |

Der Marker steht in der ersten Zeile des Kommentars und ist die einzige Kennung, über die der
Kommentar gefunden wird. Der Workflow liest alle Kommentare des Issues und sucht den mit dem
Marker; findet er ihn, aktualisiert er ihn über `updateComment`, sonst legt er genau einen an.
Jede andere Vorgehensweise erzeugt Kommentarspam und macht den Verlauf unlesbar. Geprüft: Ein
zweiter Lauf ließ die Kommentaranzahl bei 1 und die Kommentar-ID unverändert.

Aufbau des Kommentars:

1. Kennung: eine Zeile mit dem Marker `<!-- live-product-metrics -->`.
2. Menschenlesbarer Abschnitt: kurze Tabelle mit Zeitraum, Vergleichszeitraum und den
   Kennzahlen, dazu ein Satz zur Datenlage.
3. Maschinenlesbarer Abschnitt: ein Codeblock mit dem unten festgelegten Feldbestand.

## 3. Zeitplan und Rechte

| Punkt | Festlegung |
|---|---|
| Auslöser | täglicher Zeitplan um `06:15 UTC` (`cron: '15 6 * * *'`) plus `workflow_dispatch` (manueller Start) |
| Nebenläufigkeit | Gruppe `live-product-metrics`, `cancel-in-progress: false` |
| Zeitraum | rollierende 7 Tage (`FENSTER_TAGE = 7`) |
| Vergleichszeitraum | die 7 Tage davor, sofern verfügbar |
| GoatCounter-API-Schlüssel | ausschließlich als Repository-Secret `GOATCOUNTER_API_KEY`. Er wird im Workflow als Umgebungsvariable an `node tools/metriken.mjs` übergeben |
| `GITHUB_TOKEN` | minimale Rechte: `contents: read` und `issues: write`. Kein weiteres Recht |
| Messabruf | `tools/metriken.mjs` fragt je Ereignis `https://<kurzname>.goatcounter.com/api/v0/stats/total` mit `start`, `end` und `path=<ereignis>` ab |
| Ablage | Kein Token und kein Schlüssel liegt jemals in ausgeliefertem Frontend-Code, in `assets/`, in `data/` oder in einer HTML-Datei |
| Auftraggeberkonto des Kommentars | der Workflow selbst über `actions/github-script`. Der Kommentar wird nicht im Namen einer Person verfasst |

`assets/js/config.js` nennt ausdrücklich, dass der Schlüssel nicht in die Konfiguration
gehört, sondern in ein Repository-Secret. `tools/check.mjs` und
`tests/e2e/privacy.spec.js` prüfen, dass kein Geheimnis und kein Fremdskript im
Auslieferungscode liegen.

## 4. Machine-readable Block

Der Bericht endet mit einem Codeblock. Jede Zeile hat die Form `NAME=WERT`, ohne Leerzeichen
um das Gleichheitszeichen. Genau diese Felder, in dieser Schreibweise, in dieser Reihenfolge:

| Feld | Bedeutung | Typ |
|---|---|---|
| `METRICS_SCHEMA_VERSION` | Version des Feldschemas | Zahl, derzeit `1` |
| `UPDATED_AT` | Zeitpunkt des **Laufs**, ISO 8601 in UTC auf Sekunden, mit `Z` | Text |
| `PAGEVIEWS_7D` | Seitenaufrufe im Zeitraum (`page_view`) | Zahl oder `NA` |
| `CALCULATOR_STARTED_7D` | Rechner begonnen (`calculator_started`) | Zahl oder `NA` |
| `CALCULATOR_COMPLETED_7D` | Rechner abgeschlossen (`calculator_completed`) | Zahl oder `NA` |
| `COMPLETION_RATE_7D` | `CALCULATOR_COMPLETED_7D / CALCULATOR_STARTED_7D` in Prozent, auf eine Nachkommastelle gerundet | Zahl oder `NA` |
| `SOURCE_OPENED_7D` | Quellen geöffnet (`source_opened`) | Zahl oder `NA` |
| `SUPPORT_CLICKED_7D` | Unterstützen-Link angeklickt (`support_clicked`) | Zahl oder `NA` |
| `GENERIC_JS_ERRORS_7D` | Technische Fehler (`generic_js_error`) | Zahl oder `NA` |
| `PRIMARY_DROPOFF_STEP` | Schritt mit dem größten Abbruch | `UNKNOWN` oder `NA` |
| `METRICS_STATUS` | Zustand der Messung | `OK`, `ANALYTICS_UNCONFIGURED` oder `ANALYTICS_ERROR` |
| `PAGEVIEWS_PREV_7D` | Seitenaufrufe im Vergleichszeitraum. Nur bei `METRICS_STATUS=OK` | Zahl oder `NA` |
| `CALCULATOR_STARTED_PREV_7D` | Rechner begonnen im Vergleichszeitraum. Nur bei `OK` | Zahl oder `NA` |
| `CALCULATOR_COMPLETED_PREV_7D` | Rechner abgeschlossen im Vergleichszeitraum. Nur bei `OK` | Zahl oder `NA` |
| `COMPLETION_RATE_PREV_7D` | Abschlussquote im Vergleichszeitraum. Nur bei `OK` | Zahl oder `NA` |
| `STALE_SCHWELLE_STUNDEN` | Frischeschwelle in Stunden. Wird in jedem Fall ausgegeben | Zahl, derzeit `48` |

Die Vergleichsfelder tragen ausdrücklich das Suffix `_PREV_7D`. Sie werden **nur** im Fall
`METRICS_STATUS=OK` geschrieben; in jedem anderen Fall fehlen sie im Block vollständig. Ist
bei `OK` kein Vergleichszeitraum verfügbar, steht dort `NA`. Es wird nicht geschätzt.

`CALCULATOR_STARTED_7D` und `CALCULATOR_COMPLETED_7D` sind im laufenden Betrieb zur
Fehlervermeidung von der Abschlussquote getrennt: Ist der Nenner null, wird
`COMPLETION_RATE_7D` als `NA` ausgegeben und nicht als 0.

Derzeitiger Block, wörtlich aus dem Kommentar des Issues Nr. 1:

```
METRICS_SCHEMA_VERSION=1
UPDATED_AT=2026-09-17T17:20:14Z
PAGEVIEWS_7D=NA
CALCULATOR_STARTED_7D=NA
CALCULATOR_COMPLETED_7D=NA
COMPLETION_RATE_7D=NA
SOURCE_OPENED_7D=NA
SUPPORT_CLICKED_7D=NA
GENERIC_JS_ERRORS_7D=NA
PRIMARY_DROPOFF_STEP=NA
METRICS_STATUS=ANALYTICS_UNCONFIGURED
STALE_SCHWELLE_STUNDEN=48
```

Im Fall `OK` kommen vor `STALE_SCHWELLE_STUNDEN` die vier Vergleichsfelder hinzu, und die
Zahlenfelder tragen Messwerte. Formbeispiel für die Schreibweise, **keine Messwerte**:

```
PAGEVIEWS_7D=1200
CALCULATOR_STARTED_7D=400
CALCULATOR_COMPLETED_7D=210
COMPLETION_RATE_7D=52.5
METRICS_STATUS=OK
PAGEVIEWS_PREV_7D=1000
```

Zahlen sind ohne Tausenderzeichen zu schreiben. Die Abschlussquote verwendet den Punkt als
Dezimaltrennzeichen. Die menschenlesbare Tabelle darüber nennt zusätzlich
`methodology_opened` („Methodenseite geöffnet“); dieses Ereignis wird abgefragt und angezeigt,
hat aber bewusst kein eigenes Feld im Maschinenblock.

### 4.1 `UPDATED_AT` und die drei Statuswerte

`UPDATED_AT` ist der Zeitpunkt des **Laufs**, nicht der Zeitpunkt eines erfolgreichen
Abrufs. Jeder Status trägt deshalb einen frisch aussehenden Zeitstempel, auch
`ANALYTICS_UNCONFIGURED` und `ANALYTICS_ERROR`.

Maßgeblich für die Frage, ob die Zahlen echt sind, ist allein `METRICS_STATUS`. Ein Leser muss
`METRICS_STATUS` zuerst lesen und darf sich nicht auf `UPDATED_AT` verlassen.

| Wert | Bedeutung | Zulässige Zahlen |
|---|---|---|
| `OK` | Abruf erfolgreich | die abgerufenen Werte, Vergleichswerte als `*_PREV_7D` |
| `ANALYTICS_UNCONFIGURED` | `goatcounterKurzname` ist `null` oder das Secret `GOATCOUNTER_API_KEY` fehlt | keine; alle Zahlenfelder `NA` |
| `ANALYTICS_ERROR` | die GoatCounter-Abfrage ist fehlgeschlagen | keine; alle Zahlenfelder `NA` |

Es gibt keinen Statuswert `STALE`. Veraltung ist eine Leseregel, kein Messzustand (Abschnitt 5).

Im Fall `ANALYTICS_UNCONFIGURED` nennt der Bericht ausdrücklich, was fehlt
(„keine GoatCounter-Instanz in `assets/js/config.js` eingetragen“ und/oder „kein
Repository-Secret `GOATCOUNTER_API_KEY` gesetzt“). Im Fall `ANALYTICS_ERROR` nennt er die
Fehlerursache. In beiden Fällen weist der Kommentar darauf hin, dass bewusst keine Zahlen
ausgewiesen werden.

### 4.2 Verbote für die Metrikausgabe

- Keine personenbezogenen Daten: kein Einkommen, kein Haushaltstyp, keine Kinderzahl, kein
  Leistungsbezug, kein Rechenergebnis, keine Ergebnisrichtung, keine gewählte Quelle, keine
  politische Einstellung.
- Keine Freitexte aus Fehlermeldungen, keine Stacks, keine Ausnahmen.
- Keine Sitzungs- oder Nutzerkennungen, keine Geräte-, Orts- oder Zeitreihenprofile.
- Keine Ableitung politischer Aussagen aus den Zahlen.
- Keine Schätzung fehlender Werte. Fehlt eine Zahl, wird `NA` geschrieben und nicht 0.

`tests/unit/metriken.test.mjs` prüft, dass der Bericht keine Felder für Haushaltsdaten
enthält (verbotene Zeichenfolgen `INCOME`, `HOUSEHOLD`, `CHILDREN`, `RESULT`, `BENEFIT`,
`PARTY`) und dass ohne eingerichtete Analyse in keinem Zahlenfeld eine Zahl steht.

### 4.3 `PRIMARY_DROPOFF_STEP`

Mit der derzeit gültigen Ereignismenge ist dieses Feld nicht bestimmbar.
`ZULAESSIGE_EREIGNISSE` in `tools/metriken.mjs` enthält genau acht Namen ohne Parameter:

```
page_view, calculator_started, step_completed, calculator_completed,
source_opened, methodology_opened, support_clicked, generic_js_error
```

`step_completed` trägt keine Schrittnummer. Aus den Gesamtzahlen lässt sich der Abschlussgrad
insgesamt berechnen, aber nicht der Schritt mit dem größten Abbruch.

Deshalb gilt: Im Fall `OK` steht der Wert auf `UNKNOWN`, in jedem anderen Fall auf `NA`, und
der Bericht begründet das im Klartext. Der Wert darf nicht geraten werden. Eine Änderung der
Ereignismenge (etwa ein eigener Ereignisname je Schritt) ist eine Erweiterung der
Datenerhebung, keine Formalie: Sie ist nach `docs/PRIVACY.md` Abschnitt 8 zu prüfen, zu
dokumentieren und in `datenschutz.html` nachzuführen, bevor sie eingesetzt wird. Sie darf
keine Haushaltsmerkmale übertragen.

## 5. Veraltung: `METRICS_STALE`

**Definition:** Ein Metrikstand gilt als veraltet, wenn `METRICS_STATUS` den Wert `OK` hat
**und** `UPDATED_AT` mehr als **48 Stunden** (`STALE_SCHWELLE_STUNDEN`) zurückliegt. Die
Schwelle steht im Maschinenblock, damit ein Leser sie nicht aus diesem Dokument raten muss.

Begründung für den Schwellwert: Bei täglichem Lauf bleibt der Stand normalerweise unter 24
Stunden alt. Ein Stand über 48 Stunden bedeutet, dass mindestens ein Lauf ausgefallen ist
oder der Workflow nicht mehr ausgeführt wird.

Pflicht eines Agenten: Erkennt ein Agent beim Lesen des Metrikkommentars, dass
`METRICS_STATUS` nicht auf `OK` steht oder dass `UPDATED_AT` älter als 48 Stunden ist, dann
meldet er diesen Umstand **zuerst**, bevor er irgendeine Aussage aus den Zahlen ableitet
(`AGENTS.md` Abschnitt 5, Punkte 1 und 2). Aus veralteten Zahlen werden keine Hypothesen
gebildet.

GitHub kann geplante Workflows in inaktiven öffentlichen Repositorys nach 60 Tagen
deaktivieren. Das ist die wahrscheinlichste Ursache für einen Stand, der längere Zeit nicht
aktualisiert wurde. Die Veraltungsprüfung erkennt genau diesen Fall und macht ihn sichtbar,
ohne dass jemand die Workflow-Liste manuell beobachten muss. Zusätzlich zeigt der
GitHub-Actions-Bereich deaktivierte Workflows an.

## 6. Ehrlichkeit des Status

Der Workflow hat `METRICS_STATUS` wahrheitsgemäß zu setzen, nach der Tabelle in Abschnitt
4.1. Unzulässig ist insbesondere: einen fehlenden Abruf mit einem alten Wert zu überschreiben,
einen Fehler als `OK` zu melden, einen Schätzwert anstelle von `NA` einzusetzen oder einen
Zähler als Erfolg darzustellen, der nicht abgerufen werden konnte.

Zwei Regeln, die dabei leicht verwechselt werden:

- `UPDATED_AT` wird bei jedem Lauf neu gesetzt, auch wenn nichts abgerufen wurde. Es belegt
  nur, dass der Workflow gelaufen ist. Aussagen über die Datenlage trägt ausschließlich
  `METRICS_STATUS`.
- `NA` ist keine Null. Es bedeutet „keine Messung“. Eine Rechnung über `NA` ist unzulässig,
  und eine fehlende Messung darf nicht als Null in eine Kennzahl eingehen.

## 7. Was mit den Metriken geschehen darf

Zulässige Reaktionen sind in `AGENTS.md` Abschnitt 5 abschließend aufgeführt. Kurz:
Bedienbarkeit, Klarheit, Barrierefreiheit, Zuverlässigkeit, Ladezeit, Fehlerbehandlung,
Navigation. Jede Änderung setzt eine formulierte Hypothese und eine Vergleichsmessung
voraus.

Unzulässig: politische Sprache überzeugender machen, unerwünschte Ergebnisse verstecken oder
umformulieren, Ergebnisse mit stärkerer politischer Wirkung hervorheben, Formeln ändern, um
Beteiligung zu erhöhen, Nutzer politisch profilieren.

## 8. Einrichtung, Schritt für Schritt

Bereits erledigt: Workflow `.github/workflows/metrics.yml`, Hilfsskript
`tools/metriken.mjs`, kanonisches Issue Nr. 1, Kommentar mit Marker, Rechte
`contents: read` und `issues: write`, Veraltungsschwelle 48 Stunden, Tests
`tests/unit/metriken.test.mjs`.

Offen:

1. GoatCounter-Instanz einrichten und den Kurznamen in `assets/js/config.js` als
   `goatcounterKurzname` eintragen. Damit lädt die Seite das Analyseskript.
2. Den API-Schlüssel als Repository-Secret `GOATCOUNTER_API_KEY` hinterlegen. Der Schlüssel
   wird nicht in das Repository geschrieben. Ohne Instanz und Secret bleibt der Status
   `ANALYTICS_UNCONFIGURED`.
3. Die Datenschutzhinweise in `datenschutz.html` prüfen: Die dort genannten zulässigen
   Ereignisse müssen mit `ZULAESSIGE_EREIGNISSE` übereinstimmen.
4. `tests/e2e/privacy.spec.js` erneut laufen lassen. Der Test „die Seite lädt kein
   Analyse-Skript, solange keine Instanz eingerichtet ist“ gilt weiterhin und muss für den
   konfigurierten Fall bewusst angepasst werden, nicht stillschweigend entfernt.
5. Nach dem ersten Lauf mit Daten prüfen, dass der Kommentar aktualisiert und nicht neu
   angelegt wurde: Kommentaranzahl 1, gleiche Kommentar-ID.
