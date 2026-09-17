# Quellen

Dieses Dokument beschreibt, worauf jede Zahl und jede Programmaussage des Programm-Rechners
zurückführbar ist, in welcher Rangfolge Quellen herangezogen werden, welche Quellen bewusst
**nicht** als Ableitungsgrundlage dienen und welche Abweichungen zwischen Quellen offen
dokumentiert sind.

Alle Angaben abgerufen am 17. September 2026. Die öffentliche Fassung steht in
`quellen.html`.

## 1. Rangfolge der Quellen

Wo eine Primärquelle vorhanden ist, wird sie verwendet. Sekundäre politische Kommentierung
wird nicht zitiert. Die Reihenfolge der Bevorzugung lautet:

1. verabschiedetes Wahlprogramm (`official_programme`)
2. Deutscher Bundestag, Drucksachen (`bundestag`)
3. Bundesministerium der Finanzen (`bundesministerium_der_finanzen`)
4. amtliche Gesetzestexte und Verkündungsblätter (`official_legislation`)
5. ZEW (`zew`)
6. DIW (`diw`)
7. IW (`iw`)
8. begutachtete Forschung (`peer_reviewed_research`)

Dieselbe Reihenfolge steht maschinenlesbar in `data/sources/manifest.json` unter
`priority_order`. Ergänzender Grundsatz aus dem Manifest
(`hinweis_zu_zweitquellen`): Für politische Aussagen wird ausschließlich das verabschiedete
Wahlprogramm zitiert.

## 2. Verabschiedetes Wahlprogramm

| Merkmal | Wert |
|---|---|
| Titel | Programm für Deutschland. Programm der Alternative für Deutschland für die Wahl zum 21. Deutschen Bundestag |
| Organisation | Alternative für Deutschland |
| Verabschiedung | 16. Bundesparteitag, 11.–12. Januar 2025, Riesa, einstimmig |
| Umfang | 166 Seiten |
| PDF-Datum | 3. Februar 2025 |
| PDF-Titel | `BTW25_AfD_Programm_2025-02-03_176_Innenseiten.indd` |
| URL | https://www.afd.de/wp-content/uploads/2025/02/AfD_Bundestagswahlprogramm2025_druck.pdf |

Verabschiedungsklausel, wörtlich: „Das vorliegende Wahlprogramm für die Bundestagswahl 2025
wurde auf dem 16. Bundesparteitag der Alternative für Deutschland vom 11. bis zum 12. Januar
2025 in Riesa beraten und einstimmig verabschiedet.“

Seitenzählung: `source_page` in `data/policies/afd-2025.json` ist die im Dokument
aufgedruckte Seitenzahl. Der PDF-Seitenindex ist `source_page + 2`.

Zitierregel: Zitate werden wörtlich wiedergegeben, mit Seitenzahl. Entfernt werden nur
Zeilenumbruch-Trennstriche und Kolumnentitel. Wortlaut, Zahl und Zeichensetzung werden nicht
verändert.

## 3. Quellenverzeichnis

| ID | Organisation | Quelle | Verwendung |
|---|---|---|---|
| `afd-wahlprogramm-2025` | Alternative für Deutschland | [AfD-Bundestagswahlprogramm 2025](https://www.afd.de/wp-content/uploads/2025/02/AfD_Bundestagswahlprogramm2025_druck.pdf) | Primäre politische Quelle. Jeder Programmpunkt ist hieraus wörtlich belegt |
| `estg-32a` | Bundesrepublik Deutschland | [§ 32a EStG](https://www.gesetze-im-internet.de/estg/__32a.html) | Tarifformel, Grundfreibetrag, Abrundungsregeln, Splittingverfahren |
| `estg-32` | Bundesrepublik Deutschland | [§ 32 Abs. 6 EStG](https://www.gesetze-im-internet.de/estg/__32.html) | Kinderfreibetrag 3.414 € + 1.464 € je Elternteil und Kind |
| `estg-31` | Bundesrepublik Deutschland | [§ 31 EStG](https://www.gesetze-im-internet.de/estg/__31.html) | Kindergeld als Steuervergütung (Satz 3), Günstigerprüfung (Satz 4) |
| `estg-66` | Bundesrepublik Deutschland | [§ 66 Abs. 1 EStG](https://www.gesetze-im-internet.de/estg/__66.html) | Kindergeld 259 € monatlich je Kind |
| `estg-9a` | Bundesrepublik Deutschland | [§ 9a EStG](https://www.gesetze-im-internet.de/estg/__9a.html) | Arbeitnehmer-Pauschbetrag 1.230 € |
| `estg-10c` | Bundesrepublik Deutschland | [§ 10c EStG](https://www.gesetze-im-internet.de/estg/__10c.html) | Sonderausgaben-Pauschbetrag 36 €, 72 € bei Zusammenveranlagung |
| `estg-10` | Bundesrepublik Deutschland | [§ 10 EStG](https://www.gesetze-im-internet.de/estg/__10.html) | Abzug der Vorsorgeaufwendungen, Kürzung um 4 % nach Abs. 1 Nr. 3 Satz 4, Höchstbetrag nach Abs. 4 |
| `estg-20` | Bundesrepublik Deutschland | [§ 20 Abs. 9 EStG](https://www.gesetze-im-internet.de/estg/__20.html) | Sparer-Pauschbetrag 1.000 € / 2.000 € |
| `estg-24b` | Bundesrepublik Deutschland | [§ 24b EStG](https://www.gesetze-im-internet.de/estg/__24b.html) | Entlastungsbetrag für Alleinerziehende 4.260 € |
| `estg-32d` | Bundesrepublik Deutschland | [§ 32d EStG](https://www.gesetze-im-internet.de/estg/__32d.html) | Abgeltungsteuer 25 % |
| `solzg-1995-3` | Bundesrepublik Deutschland | [§ 3 SolzG 1995](https://www.gesetze-im-internet.de/solzg_1995/__3.html) | Bemessungsgrundlage mit Kinderfreibeträgen in allen Fällen, Freigrenzen 20.350 € / 40.700 €, Sonderbehandlung der Kapitalertragsteuer |
| `solzg-1995-4` | Bundesrepublik Deutschland | [§ 4 SolzG 1995](https://www.gesetze-im-internet.de/solzg_1995/__4.html) | Zuschlagsatz 5,5 %, Milderungszone höchstens 11,9 %, Centrundung |
| `stefeg-2024` | Bundesrepublik Deutschland | [Steuerfortentwicklungsgesetz vom 23.12.2024, BGBl. 2024 I Nr. 449](https://www.recht.bund.de/bgbl/1/2024/449/regelungstext.pdf) | Rechtsgrundlage für Grundfreibetrag, Kinderfreibetrag, Kindergeld und Freigrenzen der Jahre 2025 und 2026 |
| `bmf-pap-2026` | Bundesministerium der Finanzen | [Programmablaufplan 2026](https://www.bundesfinanzministerium.de/Content/DE/Downloads/Steuern/Steuerarten/Lohnsteuer/Programmablaufplan/2025-11-12-PAP-2026.html) | Normative Berechnungsvorschrift nach § 39b Abs. 6 EStG. Unabhängige Referenz für Tarif und Solidaritätszuschlag, Quelle für Beitragsbemessungsgrenzen und den Zusatzbeitragssatz 2,9 % |
| `bmf-pap-2025` | Bundesministerium der Finanzen | [Geänderter Programmablaufplan 2025](https://www.bundesfinanzministerium.de/Content/DE/Downloads/Steuern/Steuerarten/Lohnsteuer/Programmablaufplan/2025-01-22-geaenderte-PAP-2025.html) | Vergleichsjahr 2025. Bestätigt Grundfreibetrag 12.096 €, Freigrenze 19.950 € und die Tarifkoeffizienten 2025 |
| `zew-gutachten-2025` | ZEW Mannheim | [Reformvorschläge der Parteien zur Bundestagswahl 2025](https://zew.de/fileadmin/FTP/gutachten/Bundestagswahlprogramme_ZEW_2025.pdf) | Ausschließlich externe Referenz und Nachweis des Quellenkonflikts. Keine Zahl des Rechners wird hieraus abgeleitet |
| `bt-drs-20-13356` | Deutscher Bundestag | [BT-Drucksache 20/13356](https://dserver.bundestag.de/btd/20/133/2013356.pdf) | Nicht als Programmquelle verwendet. Nachweis, dass zwei ZEW-Posten aus diesem Fraktionsantrag stammen |
| `afd-leitantrag-2024-11` | Alternative für Deutschland | [Leitantrag, Stand 28.11.2024, über web.archive.org](https://web.archive.org/web/20241224034628/https://www.afd.de/wp-content/uploads/2024/11/Leitantrag-Bundestagswahlprogramm-2025.pdf) | Nicht als Programmquelle verwendet. Nachweis der Abweichung beim Sparer-Pauschbetrag |
| `bmf-steuerrechner` | Bundesministerium der Finanzen | [bmf-steuerrechner.de](https://www.bmf-steuerrechner.de/) | Recherchiert, nicht als Prüforakel nutzbar: Die Schnittstelle verlangt einen registrierten Zugriffscode. Ersatz war der Programmablaufplan |
| `soep-v36` | DIW Berlin | [SOEP v36](https://www.diw.de/de/diw_01.c.615551.de/forschungsdaten.html) | Nicht verwendet. Nur geführt, weil das ZEW-Gutachten darauf beruht |

### 3.1 Einzelheiten zum Programmablaufplan 2026

| Merkmal | Wert |
|---|---|
| Schreiben | BMF-Schreiben vom 12. November 2025 |
| Geschäftszeichen | GZ IV C 5 - S 2361/00025/016/028 |
| Stand | 12.11.2025 (endgültig) |
| Anlagen | Anlage 1 (maschinelle Berechnung), Anlage 2 (Lohnsteuertabellen, korrigierte Fassung) |
| Gelesene Module | `MZTABFB`, `MLSTJAHR`, `UPMLST`, `UPTAB26`, `MSOLZ`, `UPEVP`, `MVSPHB` |
| Im Rechner nachgebildete Module | `UPTAB26` in `papUPTAB26()`, `MSOLZ` in `papMSOLZ()`, beide in `assets/js/engine/params.js` |
| Verwendung dieser Module | Ausschließlich als unabhängige Referenz in `tests/` |
| Aus dem PAP bestätigte Werte | `GFB` 12348, `SOLZFREI` 20350, `BBGRVALV` 101400, `BBGKVPV` 69750, `RVSATZAN` 0,093, KV 14,0 % ermäßigt (§ 243 SGB V), durchschnittlicher Zusatzbeitragssatz 2026 2,9 %, PV 3,60 %, ALV 2,6 %, RV 18,6 %, `EFA` 4260, `SAP` 36, `ANP` 1230 |
| Amtliches Rechenbeispiel | Anlage 2, Beispiel 1: Steuerklasse III, 75.000 € Brutto, KV/PV-Anteil der Vorsorgepauschale amtlich 7.149 € — vom Rechner exakt reproduziert. Der amtliche Lohnsteuerwert 8.330 € wird nicht reproduziert; die Differenz von 6 € ist offen dokumentiert (siehe `docs/LIMITATIONS.md`) |

Nicht als Prüforakel verfügbar war die Entwicklerschnittstelle des BMF-Lohn- und
Einkommensteuerrechners. Sie verlangt einen registrierten Zugriffscode. Als Referenz diente
deshalb der Programmablaufplan, der die normative Grundlage dieses Dienstes ist.

## 4. Zwei dokumentierte Abweichungen vom ZEW-Gutachten

Das ZEW-Gutachten „Reformvorschläge der Parteien zur Bundestagswahl 2025“ (Hebsaker und
Stichnoth, Mannheim, Januar 2025) dient ausschließlich als externe Referenz. Es rechnet auf
Rechtsstand **Juli 2024**, mit dem Mikrosimulationsmodell ZEW-EviSTA auf Basis des SOEP v36
(Erhebungsjahr 2019) und berücksichtigt Transfers, die V1 nicht abbildet. Die berichtete
fiskalische Wirkung für die AfD beträgt rund 97 Mrd. €.

**Keine einzige Zahl des Rechners wird aus diesem Gutachten abgeleitet.** Die folgenden
Abweichungen wurden geprüft und werden offengelegt statt verdeckt.

### 4.1 Sparer-Pauschbetrag: 2.400 € gegen 6.672 €

| Parameter | ZEW-Gutachten | Verabschiedetes Programm |
|---|---|---|
| Sparer-Pauschbetrag | 2.400 € | 6.672 € (gedruckte Seite 60) |

Die 2.400 € stammen aus dem Leitantrag der Bundesprogrammkommission (Stand 28. November
2024), also aus der Entwurfsfassung vor dem Parteitag in Riesa. Das Gutachten weist diese
Abweichung nicht aus. Der Rechner übernimmt den Wert der verabschiedeten Fassung und mischt
keine Parameter. Es gilt durchgängig: Bei Abweichungen entscheidet die verabschiedete
Programmfassung, und die Abweichung wird erklärt.

### 4.2 Werbungskostenpauschale 2.000 € und Kinderfreibetrag 12.000 €

| Position | ZEW-Bullet zum AfD-Programm | Programmtext | Befund |
|---|---|---|---|
| Werbungskostenpauschale 2.000 €, Kinderfreibetrag 12.000 € | modelliert, mit Fußnote | Die Zeichenfolgen „Werbungskostenpauschale“ und „Pendlerpauschale“ kommen im 166-seitigen Programm **null Mal** vor | Quelle ist die BT-Drucksache 20/13356, ein Antrag der AfD-Bundestagsfraktion vom 15. Oktober 2024, **nicht** das Wahlprogramm |

Ein Fraktionsantrag ist nicht das Bundestagswahlprogramm. Beide Posten werden daher in V1
nicht gerechnet und ausdrücklich als ausgeschlossen geführt. Die Angabe steht in
`data/policies/afd-2025.json` unter `excluded_source_notice` und in
`data/sources/manifest.json` beim Eintrag `bt-drs-20-13356`.

### 4.3 Zusätzliche Unterschiede, die nicht aus dem Programm stammen

Das Gutachten weist außerdem Ergebnisse aus, die ein reines Steuermodell nicht
reproduzieren kann. Beispiel: Für einen Alleinverdiener-Haushalt mit zwei Kindern und
40.000 € Brutto ergibt sich im Gutachten ein **Minus** von 440 €, das ZEW selbst auf die
Anrechnungsregeln beim Wohngeld zurückführt. Der Rechner bildet Wohngeld nicht ab. Er zeigt
deshalb im Ergebnis einen Hinweis auf Transferleistungen (`#transfer-hinweis`) und weist die
Steuerseite getrennt aus. Die ZEW-Beispielwerte sind in
`tests/reference/bmf-2026-reference.json` unter `zew_referenzwerte` mit dem Status
`nur_referenz_keine_ableitung` geführt; `tests/reference/bmf-2026.test.mjs` prüft, dass
dieser Status gesetzt ist, dass die Abweichungen benannt sind und dass die ZEW-Werte nicht
als Zielwert verwendet werden.

## 5. Handhabung von Quellenkonflikten

Die Regel lautet `SOURCE_CONFLICT = FAIL_CLOSED`:

1. Der Rechner verwendet für jede Programmaussage die **verabschiedete** Programmfassung.
2. ZEW-Parameter werden **niemals** in eine Programmregel gemischt.
3. ZEW wird nur als getrennt gekennzeichnetes externes Modell geführt.
4. Vorschläge, die nur durch ein Nicht-Programmdokument belegt sind, werden aus der
   Berechnung ausgeschlossen und ausdrücklich als ausgeschlossen dokumentiert.
5. Eine erkannte Abweichung wird erklärt, nicht geglättet.

## 6. Maschinenlesbare Fassungen

| Datei | Inhalt | Prüfung |
|---|---|---|
| `data/sources/manifest.json` | Quellenverzeichnis mit `schema_version`, `priority_order` und je Quelle Kategorie, Organisation, Titel, URL, Abrufdatum und Verwendung | `tests/unit/policies.schema.test.mjs` prüft, dass das Verzeichnis die Primärquellen enthält |
| `data/policies/afd-2025.json` | Die zwölf Programmpunkte mit wörtlichem Zitat, `source_url`, `source_page`, Klassifizierung und Annahmen | `tests/unit/policies.schema.test.mjs` prüft Pflichtfelder, Seitenangabe, Klassifizierungswortschatz, Begründungen und die Summen in `summary` |
| `data/baseline/est-2026.json` | Parameter und Tarif des geltenden Rechts 2026 mit Fundstellen und Querverweisen | `tests/unit/params.consistency.test.mjs` vergleicht sie mit `assets/js/engine/params.js` |
| `tests/reference/bmf-2026-reference.json` | Referenzwerte aus amtlichen Quellen, getrennt nach bestätigt und nicht abschließend geklärt | `tests/reference/bmf-2026.test.mjs` |

`summary` in `data/policies/afd-2025.json` weist zwölf Datensätze aus: drei
`DIRECTLY_CALCULABLE`, eine `MODEL_ASSUMPTION`, null `REFERENCE_SCENARIO` und acht
`NOT_INDIVIDUALLY_CALCULABLE`.

## 7. Pflege

- Neue Quelle: Eintrag in `data/sources/manifest.json` und in `quellen.html`. Eine Quelle
  ohne Verwendungszweck wird nicht aufgenommen.
- Neue Programmversion: `data/policies/afd-2025.json` ändern und `last_verified` mitführen.
  Das alte Programm wird nicht überschrieben, sondern als neue Datendatei geführt.
- Erkannte Abweichung: In dieses Dokument aufnehmen, in `methodik.html` und im
  `excluded_source_notice` bzw. `abweichende_annahme` der Datendateien. Eine Abweichung
  ohne Dokumentation ist ein Fehler, kein Detail.
