# AGENTS.md — Projekt-Governance für den Programm-Rechner

Dieses Dokument bindet jeden Agenten, der an diesem Repository arbeitet. Es hat Vorrang vor Bequemlichkeit, Tempo und Fortschrittsanzeigen. Wo dieses Dokument und eine Arbeitsanweisung sich widersprechen, gilt dieses Dokument.

Das Projekt beantwortet eine Frage: Welche direkt berechenbaren Auswirkungen hätten ausgewählte Vorschläge des AfD-Bundestagswahlprogramms 2025 auf einen Haushalt. Es ist ein Informationsrechner. Es ist keine Wahlempfehlung, keine Parteienrangfolge und keine Bewertung eines Programms als Ganzes.

---

## 1. Betriebsmodell

Jede Arbeitseinheit durchläuft diese Stufen in dieser Reihenfolge. Keine Stufe wird übersprungen.

1. **Rehydration** — Vorhandenen Zustand laden: Konfiguration, vorhandene Dateien, vorhandene Dokumentation, offene Aufgaben.
2. **Recon** — Bestandsaufnahme: Welche Dateien existieren, welche Skripte, welche Tests, welcher Git- und Hosting-Zustand.
3. **Read-Set** — Die für die Aufgabe relevanten Dateien vollständig lesen, bevor eine Aussage über sie getroffen wird. Keine Beschreibung aus dem Gedächtnis.
4. **Reality Acquisition** — Primärquellen und amtliche Referenzen direkt abrufen. Keine Zahl aus einer Sekundärdarstellung übernehmen, wenn eine Primärquelle erreichbar ist.
5. **Tool Readiness** — Prüfen, welche Werkzeuge tatsächlich verfügbar und authentifiziert sind, und mit welchen Rechten. Ergebnis festhalten, nicht annehmen.
6. **PRE-FLIGHT** — Gate. Ergebnis wird in `docs/PREFLIGHT.md` protokolliert, mit Datum, Umgebung, Read-Set und Gate-Entscheidung.
7. **Mutation** — Erst nach bestandenem Gate dürfen Dateien erzeugt, geändert oder veröffentlicht werden.

```
NO_MUTATION_BEFORE_PREFLIGHT_PASS = TRUE
```

Ein Gate, das nicht protokolliert ist, gilt als nicht bestanden. Wenn sich während der Mutation herausstellt, dass das Read-Set falsch war, wird die Mutation gestoppt, das Read-Set korrigiert und das Gate erneut gefahren.

## 2. GitHub-Zugang und Quelle der Wahrheit

- Alle GitHub-Mutationen (Repository anlegen, Dateien schreiben, Issues und Kommentare, Workflows, Einstellungen) laufen über die authentifizierte `gh`-CLI. Kein Zugriff über eine nicht authentifizierte Schnittstelle, kein Umweg über einen anonymen HTTP-Aufruf.
- Vor der ersten Mutation wird `gh auth status` geprüft und das Konto, das Protokoll und die vorhandenen Scopes werden protokolliert.
- Fehlt die Authentifizierung, wird nicht mit einem Ersatzweg weitergearbeitet, sondern die Arbeit wird als blockiert gemeldet.

```
GITHUB_IS_THE_SOURCE_OF_TRUTH = TRUE
```

- Der verbindliche Stand des Projekts ist der Stand im Repository, nicht der Stand auf einem Arbeitsrechner, nicht ein Chatverlauf und nicht eine lokale Kopie ohne Versionierung.
- Ist ein Verzeichnis noch kein git-Repository, ist der Zustand nicht belastbar versioniert. In diesem Fall wird ausdrücklich gesagt, dass es keine Versionierung gibt, statt eine Historie zu behaupten.
- Aussagen wie „veröffentlicht“, „freigeschaltet“ oder „committet“ sind erst zulässig, wenn der Zustand tatsächlich abgerufen und belegt wurde.

## 3. Harte Regeln

Diese Regeln sind nicht verhandelbar. Sie sind als überprüfbare Flags formuliert.

| Flag | Bedeutung im Projekt |
|---|---|
| `SOURCE_CONFLICT = FAIL_CLOSED` | Bei Abweichungen zwischen Quellen wird nicht gemittelt und nicht gemischt. Es entscheidet die verabschiedete Programmfassung. Die Abweichung wird offengelegt. Ein Vorschlag, der nur durch eine Nicht-Programmquelle belegt ist, wird nicht gerechnet und ausdrücklich als ausgeschlossen geführt. Vorlage: der Sparer-Pauschbetrag 2.400 Euro im ZEW-Gutachten gegen 6.672 Euro im verabschiedeten Programm |
| `FALSE_PRECISION = FORBIDDEN` | Keine Zahl ohne belastbare Grundlage. Fehlt ein Parameter im Programm, wird kein Ersatzwert gewählt und keine Schätzung als Ergebnis ausgegeben. Lieber „nicht bewertet“ als eine erfundene Zahl |
| `NET_TO_GROSS_FALSE_PRECISION = FORBIDDEN` | Bei einer Netto-Eingabe wird keine scheinbar genaue Bruttozahl ausgegeben. Die Rückrechnung wird als Bandbreite gezeigt, das geschätzte Brutto wird benannt und der Rest wird ausgewiesen |
| `CALCULATION_ENGINE_VALIDATED = PASS` | Vor jeder Anzeige eines personalisierten Eurobetrags muss der Rechenkern validiert sein: `node --test`, Abgleich mit dem amtlichen Programmablaufplan (Module `UPTAB26` und `MSOLZ`) und die Konsistenz zwischen `data/baseline/est-<jahr>.json` und `assets/js/engine/params.js`. Ist dieser Nachweis nicht grün, wird kein Eurobetrag ausgeliefert |
| `REAL_USAGE_IS_EVIDENCE_NOT_AUTHORITY = TRUE` | Nutzungsdaten sind Hinweise auf Bedienbarkeit und Zuverlässigkeit. Sie sind keine Erlaubnis, Aussagen, Formeln oder Quellenauslegung zu ändern |
| `LEGAL_OWNER_DATA = REQUIRED_FOR_PUBLICATION` | Ohne die Angaben nach § 5 Digitale-Dienste-Gesetz wird nicht veröffentlicht. Keine Platzhalter, keine erfundenen Anbieterangaben. Siehe `docs/LEGAL-GATE.md` |
| `SELF_VALIDATION_ONLY = FORBIDDEN` | Der Rechenkern darf nicht ausschließlich gegen sich selbst geprüft werden. Zulässig ist eine unabhängige zweite Implementierung (der amtliche Programmablaufplan), aus dem Gesetzeswortlaut abgeleitete Referenzwerte und amtliche Beispielrechnungen. Eine Prüfung, die nur die eigene Engine gegen eigene Erwartungswerte stellt, gilt nicht als Nachweis |

Weitere Grundsätze, die sich aus dem Bestand ergeben:

- Die Abdeckung des Ergebnisses wird immer mit ausgegeben. Ein Ergebnis ohne Angabe, welche Vorschläge berechnet und welche nicht bewertet wurden, ist unzulässig.
- Die Wechselwirkung zwischen den Vorschlägen wird als Zahl ausgewiesen und nicht in die Einzelwerte hineingerechnet.
- Offene Differenzen werden benannt, nicht geglättet. Beispiel: die Differenz von 6 Euro zum amtlichen Rechenbeispiel in Anlage 2 des Programmablaufplans 2026.
- Änderungen an der Methodik werden in `docs/METHODOLOGY.md` nachgeführt, Änderungen an Quellen in `docs/SOURCES.md`.

## 4. Politische Sicherheitsregeln

Diese Regeln gelten für jede Datei, jeden Text, jede Ausgabe und jede Metrik.

Niemals:

- eine Wahl empfehlen oder nahelegen,
- Parteien ranken, vergleichen oder in eine Reihenfolge bringen,
- Angriffssprache, Spott oder Wertung gegenüber Parteien, Personen oder Wählergruppen verwenden,
- politische Formulierungen auf Klicks, Emotion, Abschlussquote, Zielgruppen oder Regionen hin optimieren,
- aus Nutzungsdaten politische Schlussfolgerungen ziehen,
- Formeln, Quellenauslegung oder die Auswahl der Belege ändern, um Beteiligung zu erhöhen.

Metriken dürfen ausschließlich auf diese Felder wirken: Bedienbarkeit, Klarheit, Barrierefreiheit, Zuverlässigkeit, Ladezeit, Fehlerbehandlung, Navigation. Sie dürfen nicht auf politische Aussagen, Formeln, Quellenauslegung oder die Auswahl der Belege wirken.

Zulässig und erwünscht ist eine deutliche Sprache der Offenlegung: Was nicht berechnet wird, wird gesagt. Was unsicher ist, wird als unsicher benannt. Ein Ergebnis darf Null oder negativ sein und wird dann als Null oder negativ gezeigt.

## 5. Nach der Veröffentlichung: invariante Reihenfolge der Rückkopplung

Diese Reihenfolge ist verbindlich. Sie wird nicht umgestellt, nicht abgekürzt und nicht übersprungen.

1. **LIVE PRODUCT METRICS lesen.** Zuerst den kanonischen Metrikstand lesen (`docs/METRICS.md`, Marker `<!-- live-product-metrics -->`).
2. **Aktualität der Metriken prüfen.** Zeitstempel gegen den Schwellwert prüfen. Ist der Stand älter als 48 Stunden, gilt `METRICS_STALE` und wird gemeldet, bevor irgendetwas anderes daraus abgeleitet wird.
3. **Aktuellen und vorherigen Zeitraum vergleichen.** Ohne Vergleichszeitraum entsteht keine Aussage.
4. **Offene Produktionsfehler prüfen.** Bekannte Defekte erklären Zahlen häufiger als Verhaltensänderungen.
5. **UX- und Zuverlässigkeitssignale identifizieren.** Ein abgebrochener Schritt, ein erhöhter Fehlerzähler und eine gefallene Abschlussquote sind Signale.
6. **Niemals politische Schlussfolgerungen aus Nutzungsdaten ziehen.**
7. **Niemals politische Aussagen auf Beteiligung hin optimieren.**
8. **Vor jeder UX-Änderung eine Hypothese formulieren.** Was soll sich messbar verbessern, und woran wird das erkannt.
9. **Die Hypothese testen.** Änderung, Messung, Vergleich mit dem Vorzeitraum.
10. **Quellentreue erhalten.** Keine Änderung darf Zahlen, Zitate, Seitenangaben oder die Quellenauslegung verschieben.

Erlaubte Reaktionen auf Signale, jeweils mit Hypothese und Messung:

- Viele Nutzer scheitern an einem Eingabeschritt (Formulierung oder Reihenfolge wird klarer, das Feld bleibt fachlich unverändert).
- Mobile Bedienelemente sind zu klein (Zielgröße und Abstand werden vergrößert).
- JavaScript-Fehler haben zugenommen (Ursache beheben, Fehlerbehandlung verbessern; es wird weiterhin nur `generic_js_error` gezählt, niemals ein Fehlertext).
- Ein Quellenlink ist defekt (Link prüfen und auf die Primärquelle zeigen lassen; die Aussage bleibt unberührt).
- Die Abschlussquote ist unerwartet gefallen (Zusatzhinweise, Ladezeit, Fehlerzustände, Barrierefreiheit prüfen).
- Eine Barrierefreiheits-Regression (Regression beheben, `tests/e2e/accessibility.spec.js` erweitern).

Verbotene automatische Reaktionen:

- politische Sprache emotional überzeugender machen,
- Ergebnisse, die Nutzern nicht gefallen, verstecken, abschwächen oder umformulieren,
- Ergebnisse hervorheben, die stärkere politische Reaktionen auslösen,
- Formeln ändern, um die Beteiligung zu verbessern,
- Nutzer politisch profilieren oder in Gruppen einteilen.

## 6. Eine zweite Partei später hinzufügen

Die Architektur ist parteiunabhängig. Die Regel- und Datenschicht ist von der Rechen- und Darstellungsschicht getrennt. Für eine zweite Partei gilt:

1. Neue Datei `data/policies/<partei>.json` anlegen, nach dem Schema von `data/policies/afd-2025.json`. Pflichtfelder je Programmpunkt und der Klassifizierungswortschatz werden von `tests/unit/policies.schema.test.mjs` erzwungen. Jeder Punkt braucht `source_url`, `source_page` und ein wörtliches `exact_claim`.
2. In `assets/js/engine/scenario.js` ein eigenes Regelwerk ergänzen: die Szenarien für diese Partei, das Gesamtszenario und die Zuordnung in `VORSCHLAG_REGELN`. Die Regeln verweisen über `szenario` auf Einträge des Regelwerks.
3. Der Rechenkern wird **nicht** umgeschrieben. `tariff.js`, `soli.js`, `est.js` und `netto.js` bleiben unverändert, solange sich das geltende Recht nicht ändert. Neue Tarif- und Parameterwelten werden über `shiftTariff` und über Regelwerk-Objekte abgebildet, nicht über Verzweigungen im Tarif.
4. Die Anzeige bleibt vergleichend und wertend neutral: gleiche Darstellung, gleiche Abdeckungsangabe, gleiche Pflicht- und Dauerhinweise. Keine Partei erhält eine günstigere Darstellung oder eine andere Sprache.
5. Erst wenn beide Parteien nachweislich nach demselben Schema und mit denselben Prüfungen laufen, darf die Auswahl in der Oberfläche erscheinen.

Ein Vergleich mehrerer Parteien ist erst zulässig, wenn die Berechnungsabdeckung je Partei offen ausgewiesen wird. Ein Vergleich, bei dem eine Partei weniger berechenbare Vorschläge hat, darf nicht als Vorteil oder Nachteil dieser Partei dargestellt werden. Die Abdeckung ist Teil des Ergebnisses.

## 7. Wenn sich Steuerparameter ändern

Bei einem neuen Veranlagungsjahr oder einer Gesetzesänderung sind **beide** Fassungen gemeinsam zu ändern:

- `data/baseline/est-<jahr>.json` (maschinenlesbare, kanonische Fassung), und
- `assets/js/engine/params.js` (Parameter und Tarif im Rechenkern).

`tests/unit/params.consistency.test.mjs` erzwingt, dass beide Fassungen übereinstimmen: Veranlagungsjahr, Tarif des § 32a Abs. 1 EStG, Kinderfreibetrag, Kindergeld, Pauschbeträge, Solidaritätszuschlag und Vorsorgeaufwendungen. Wer nur eine der beiden Fassungen ändert, bekommt einen roten Test und darf nach `CALCULATION_ENGINE_VALIDATED` keinen Eurobetrag ausliefern.

Zusätzlich erforderlich:

- Enaktende Rechtsgrundlage und Fundstelle ergänzen.
- Referenzwerte in `tests/reference/bmf-2026-reference.json` und die Referenzstichproben in `tests/unit/tariff.test.mjs` für das neue Jahr fortschreiben.
- `letztePruefung` in `assets/js/config.js` und das Datum der letzten Prüfung in den Textseiten aktualisieren.
- `docs/METHODOLOGY.md` und `docs/SOURCES.md` nachführen.

## 8. Sprache und Ton

- Dokumentation und Oberflächentexte sind deutsch, sachlich, knapp und ohne Ausrufezeichen.
- Keine Marketingsprache, keine Superlative, keine Wertung von Parteien.
- Begriffe werden konsistent verwendet: „Vorschlag“, „Programmpunkt“, „Annahme“, „Grenze“, „nicht bewertet“.
- Zitate werden wörtlich wiedergegeben, mit Seitenzahl. Zeilenumbruch-Trennstriche und Kolumnentitel werden entfernt, Wortlaut, Zahl und Zeichensetzung nicht verändert.
- Die im Programm aufgedruckte Seitenzahl ist `source_page`. Der PDF-Seitenindex ist `source_page + 2`. Diese Regel wird nirgends gebrochen.

## 9. Dokumentenindex

| Datei | Inhalt |
|---|---|
| `AGENTS.md` | Diese Governance |
| `docs/PREFLIGHT.md` | Gate-Protokoll vor der ersten Änderung |
| `docs/METHODOLOGY.md` | Rechenweg, Formeln, Annahmen, Validierung |
| `docs/SOURCES.md` | Quellenhierarchie, Quellenverzeichnis, Abweichungen |
| `docs/PRIVACY.md` | Datenschutz aus Entwicklungssicht |
| `docs/LIMITATIONS.md` | Bekannte Grenzen |
| `docs/METRICS.md` | Live-Produktmetriken, Schema, Veraltungstest |
| `docs/LEGAL-GATE.md` | Rechtliches Gate und Freischaltverfahren |
| `README.md` | Einstieg, Aufbau, Status, Testbefehle |

## 10. Was ein Agent in diesem Projekt niemals tut

- Ohne protokolliertes PRE-FLIGHT eine Produktdatei ändern.
- Eine Zahl erfinden, mitteln oder aus einer Sekundärquelle ableiten, wenn die Primärquelle fehlt.
- Eine politische Aussage, Rangfolge oder Empfehlung erzeugen.
- Einen Eurobetrag anzeigen, ohne die Abdeckung mit auszugeben.
- Eine offene Differenz verschweigen oder glätten.
- Anbieterangaben mit Platzhaltern füllen oder veröffentlichen, solange sie fehlen.
- Ein Geheimnis, einen API-Schlüssel oder ein Token in ausgeliefertem Frontend-Code ablegen.
- Nutzungsdaten als Begründung für eine Änderung an Formeln, Quellen oder politischer Sprache verwenden.
- Einen Zustand als „veröffentlicht“ bezeichnen, der nicht abgerufen und belegt wurde.
