# Methodik

Vollständige Beschreibung der Rechnung des Programm-Rechners, Version 1. Diese Datei
erweitert die öffentliche Seite `methodik.html` um die technischen Einzelheiten. Beide
Fassungen müssen inhaltlich übereinstimmen. Bei Widerspruch gilt der Rechenkern, und
`methodik.html` wird nachgeführt.

Rechtsstand der Rechnung: Veranlagungszeitraum 2026.
Programmstand: AfD-Bundestagswahlprogramm 2025, verabschiedet am 11.–12. Januar 2025 in Riesa.
Letzte inhaltliche Prüfung: 17. September 2026.

Der Rechner beantwortet ausschließlich die Frage, welche direkt berechenbaren Auswirkungen
ausgewählte, quantifizierbare Vorschläge dieses Programms auf einen Haushalt hätten. Er
ist keine Wahlempfehlung und keine Bewertung des Programms als Ganzes.

---

## 1. Ausgangspunkt: geltendes Recht 2026

| Größe | Wert | Fundstelle |
|---|---|---|
| Grundfreibetrag | 12.348 € | § 32a Abs. 1 EStG, VZ 2026 |
| Zone 2 | 12.349 € bis 17.799 €: `(914,51 · y + 1.400) · y` | § 32a Abs. 1 EStG |
| Zone 3 | 17.800 € bis 69.878 €: `(173,10 · z + 2.397) · z + 1.034,87` | § 32a Abs. 1 EStG |
| Zone 4 | 69.879 € bis 277.825 €: `0,42 · x − 11.135,63` | § 32a Abs. 1 EStG |
| Zone 5 | ab 277.826 €: `0,45 · x − 19.470,38` | § 32a Abs. 1 EStG |
| Kinderfreibetrag | 3.414 € + 1.464 € = 4.878 € je Elternteil und Kind, 9.756 € bei Zusammenveranlagung | § 32 Abs. 6 EStG |
| Kindergeld | 259 € monatlich je Kind | § 66 Abs. 1 EStG |
| Arbeitnehmer-Pauschbetrag | 1.230 € | § 9a EStG |
| Sonderausgaben-Pauschbetrag | 36 €, 72 € bei Zusammenveranlagung | § 10c EStG |
| Sparer-Pauschbetrag | 1.000 €, 2.000 € bei Zusammenveranlagung | § 20 Abs. 9 EStG |
| Entlastungsbetrag für Alleinerziehende | 4.260 € | § 24b EStG |
| Abgeltungsteuer | 25 % | § 32d EStG |
| Solidaritätszuschlag | 5,5 %, Milderungszone höchstens 11,9 % des Überschusses, Freigrenzen 20.350 € / 40.700 € | §§ 3 und 4 SolzG 1995 |
| Enaktende Rechtsgrundlage | Steuerfortentwicklungsgesetz vom 23.12.2024, BGBl. 2024 I Nr. 449 | — |

Die Parameter stehen zweifach im Repository: maschinenlesbar in
`data/baseline/est-2026.json` und im Rechenkern in `assets/js/engine/params.js`.
`tests/unit/params.consistency.test.mjs` erzwingt die Gleichheit beider Fassungen.

Für das Vorjahr ist der Tarif 2025 (`TARIFF_2025`, Grundfreibetrag 12.096 €) ebenfalls
hinterlegt. Er dient als Vergleichsjahr für die Referenztests.

## 2. Rechenweg

Der Rechner bildet einen Arbeitnehmerhaushalt mit gesetzlicher Kranken-, Pflege- und
Rentenversicherung ab, ein Haushalt, ein Veranlagungsjahr, Währung Euro.

1. Aus der monatlichen Angabe wird ein Bruttojahreswert gebildet (`× 12`, kaufmännisch
   gerundet). Bei einer Nettoangabe wird das Brutto vorher numerisch zurückgerechnet und
   als Bandbreite ausgewiesen (Abschnitt 6).
2. Vom Bruttojahreswert werden der Arbeitnehmer-Pauschbetrag, die abzugsfähigen
   Vorsorgeaufwendungen, der Sonderausgaben-Pauschbetrag und, bei Alleinerziehenden mit
   mindestens einem Kind, der Entlastungsbetrag abgezogen.
3. Das Ergebnis ist das zu versteuernde Einkommen, abgerundet auf volle Euro.
4. Darauf wird der Tarif nach § 32a Abs. 1 EStG angewendet, bei Zusammenveranlagung über
   das Splittingverfahren nach § 32a Abs. 5 EStG.
5. Der Kinderfreibetrag mindert das Einkommen in einer zweiten Fassung. Der
   Familienleistungsausgleich nach § 31 EStG entscheidet, welche der beiden Varianten für
   den Haushalt günstiger ist.
6. Der Solidaritätszuschlag wird auf die Steuer berechnet, die sich mit Kinderfreibetrag
   ergibt.
7. Auf Kapitalerträge fällt die Abgeltungsteuer an, nach Abzug des Sparer-Pauschbetrags.
8. Derselbe Rechenweg wird mit den Programmparametern erneut durchgeführt. Die Differenz
   ist die ausgewiesene Wirkung.

| Schritt | Modul |
|---|---|
| Vorsorgeaufwendungen § 10 EStG | `assets/js/engine/est.js` → `vorsorgeaufwendungen()` |
| zu versteuerndes Einkommen, Familienleistungsausgleich | `assets/js/engine/est.js` → `berechneJahr()` |
| Tarif und Splitting | `assets/js/engine/tariff.js` → `tariffTax()`, `tariffTaxSplit()`, `shiftTariff()` |
| Solidaritätszuschlag | `assets/js/engine/soli.js` → `solidaritaetszuschlag()` |
| Netto, Rückrechnung, Bandbreite | `assets/js/engine/netto.js` → `nettoJahr()`, `bruttoAusNetto()`, `bruttoBandAusNetto()` |
| Szenarien und Einzelwirkungen | `assets/js/engine/scenario.js` → `analysiere()` |
| Parameter | `assets/js/engine/params.js` |

### 2.1 Abrundungen

- Das zu versteuernde Einkommen wird vor der Tarifanwendung auf volle Euro abgerundet
  (§ 32a Abs. 1 Satz 1 EStG). Alle Zonengrenzen sind deshalb Euro-Ganzzahlen.
- `y` und `z` werden aus dem bereits abgerundeten Wert gebildet (§ 32a Abs. 1 Sätze 3 und 4
  EStG). `y` ist ein Zehntausendstel des den Grundfreibetrag übersteigenden Betrags, `z` ein
  Zehntausendstel des 17.799 € übersteigenden Betrags.
- Der Steuerbetrag wird auf den nächsten vollen Euro abgerundet (§ 32a Abs. 1 Satz 6 EStG).
- Der Solidaritätszuschlag wird in Cent gerechnet; Bruchteile eines Cents bleiben außer
  Ansatz (§ 4 Satz 3 SolzG 1995). Die Felder des amtlichen Programmablaufplans sind
  ebenfalls Cent-Felder; die Rechnung in Cent vermeidet Abweichungen von einem Cent durch
  Gleitkommaartefakte.

### 2.2 Splitting

`tariffTaxSplit(zvE, teiler)` bildet das Zweifache des Betrags für die Hälfte des zu
versteuernden Einkommens ab. Die Hälfte wird dabei wie in § 32a Abs. 1 EStG auf volle Euro
abgerundet; das entspricht der ganzzahligen Division `ZVE / KZTAB` im Modul `UPMLST` des
amtlichen Programmablaufplans. Der Teiler ist bewusst ein Parameter und nicht auf 2
festgeschrieben, weil das Familiensplitting denselben Mechanismus mit einem größeren
Teiler verwendet.

### 2.3 Familienleistungsausgleich

Das Kindergeld ist nach § 31 Satz 3 EStG eine Steuervergütung. Der Haushalt erhält die
günstigere der beiden Varianten. Rechnerisch:

```
Einkommensteuer = Tarifsteuer(zvE) − max(Steuerersparnis durch Kinderfreibetrag, Kindergeld)
```

Der Solidaritätszuschlag folgt dieser Günstigerprüfung **nicht**. Nach § 3 Abs. 2 SolzG
1995 ist Bemessungsgrundlage die Steuer, die unter Berücksichtigung der Freibeträge nach
§ 32 Abs. 6 EStG in allen Fällen des § 32 EStG festzusetzen wäre. Der Kinderfreibetrag wird
für den Solidaritätszuschlag also immer angesetzt.

Auf die Kapitalertragsteuer nach § 32d Abs. 3 und 4 EStG wird der Solidaritätszuschlag
ungeachtet der Freigrenze mit 5,5 % erhoben (§ 3 Abs. 3 Satz 2 und § 4 Satz 3 SolzG 1995).
Diese Sonderbehandlung ist im Modul `soli.js` gesondert abgebildet.

### 2.4 Vorsorgeaufwendungen

Angesetzt werden die Arbeitnehmeranteile eines gesetzlich versicherten Arbeitnehmers:

- Rentenversicherung: 9,3 % bis zur Beitragsbemessungsgrenze 101.400 €,
- Krankenversicherung: ermäßigter Beitragssatz 14,0 % nach § 243 SGB V, paritätisch
  getragen, also 7,0 % zuzüglich des halben durchschnittlichen Zusatzbeitragssatzes 2026
  von 2,9 %, also 1,45 %, auf die Beitragsbemessungsgrenze 69.750 €, vermindert um 4 %,
  weil ein Krankengeldanspruch möglich ist (§ 10 Abs. 1 Nr. 3 Satz 4 EStG),
- Pflegeversicherung: 1,8 % auf 69.750 €, mit Zuschlag von 0,6 Prozentpunkten für
  Kinderlose und Abschlag von 0,25 Prozentpunkten je Kind vom zweiten bis zum fünften Kind
  (§ 55 Abs. 3 SGB XI).

Die Arbeitslosenversicherung wirkt sich im Veranlagungsverfahren nicht aus; sie wird
deshalb nicht als Sonderausgabe abgezogen. Sie wird nur im Nettogehalt berücksichtigt, wo
sie tatsächlich anfällt.

Alle Vorsorgeaufwendungen sind im Vergleich zwischen geltendem Recht und Szenario
identisch. Die ausgewiesene Differenz wird dadurch nicht durch die Vereinfachungen bei den
Vorsorgeaufwendungen verzerrt.

## 3. Die vier berechneten Vorschläge

Die Auswahl folgt einer einzigen Bedingung: Der Vorschlag ist im verabschiedeten Programm
wörtlich belegt und sein Parameter ist so bestimmt, dass die Wirkung deterministisch
nachgerechnet werden kann.

| Vorschlag | Programmseite | Status | Wirkt nur, wenn |
|---|---|---|---|
| Grundfreibetrag 15.000 € | 58 | `DIRECTLY_CALCULABLE` | immer |
| Abschaffung des Solidaritätszuschlags für alle | 14 | `DIRECTLY_CALCULABLE` | immer |
| Sparer-Pauschbetrag 6.672 € | 60 | `DIRECTLY_CALCULABLE` | Kapitalertrag angegeben |
| Familiensplitting | 59 | `MODEL_ASSUMPTION` | mindestens ein Kind im Haushalt |

### 3.1 Grundfreibetrag 15.000 Euro (S. 58)

Parameter: Das Programm beziffert den Grundfreibetrag ausdrücklich mit 15.000 €. Der Wert
wird unverändert übernommen.

Offene Stelle im Programm: Zusätzlich fordert das Programm eine „korrespondierende
Verschiebung von weiteren Tarifeckwerten bis hin zum Spitzensteuersatz“, beziffert diese
Verschiebung aber nicht.

Annahmen:

1. Umgesetzt wird die Methode der **parallelen Tarifverschiebung**. Der gesamte Tarif des
   § 32a Abs. 1 EStG (VZ 2026) wird um die Differenz zwischen neuem und geltendem
   Grundfreibetrag nach rechts verschoben. Die Zonenbreiten, die Koeffizienten und damit
   die Progression bleiben unverändert.
2. Rechenregel: `ESt_afd(x) = ESt_2026(x − 2.652)` mit `2.652 = 15.000 − 12.348`.
3. Die Verschiebung passt die Achsenabschnitte der Zonen 4 und 5 so an, dass der Tarif an
   jeder Zonengrenze stetig bleibt (`shiftTariff()` in `assets/js/engine/tariff.js`).
4. Nicht modelliert: die im Programm ebenfalls genannte Indexierung der Freibeträge
   (dauerhafte Regelung, kein Einmaleffekt für ein einzelnes Jahr) und die vom Programm als
   erforderlich bezeichnete, aber nicht bezifferte Verschiebung weiterer Eckwerte.

**Warum nicht die Alternative.** Die naheliegende Alternative — nur den Grundfreibetrag
anheben und alle übrigen Eckwerte unverändert lassen — ist rechnerisch nicht eindeutig.
Sie macht den Tarif an der Zonengrenze unstetig: Die Zonen 2 und 3 sind über eigene
Bezugsgrößen definiert (`y` über den Grundfreibetrag, `z` über 17.799 €). Wird nur die
Bezugsgröße der Zone 2 verschoben, während die Obergrenzen und der Anfangswert der Zone 3
stehen bleiben, dann läuft die Zone 2 nicht mehr auf den Anfangswert der Zone 3 zu. Es
entstünde ein Sprung im Steuerbetrag, an dem der Steuerbetrag bei einem Euro mehr Einkommen
um einen dreistelligen Eurobetrag springt. Ein Tarif mit Sprungstelle ist kein Tarif,
sondern ein Artefakt. Die Variante wird deshalb nicht als Hauptzahl verwendet. Der
Rechenkern verwendet ausschließlich die stetige Verschiebung;
`tests/unit/tariff.test.mjs` prüft die Stetigkeit und Monotonie des verschobenen Tarifs an
allen Zonengrenzen und prüft, dass die Verschiebung niemanden schlechter stellt.

Die Berechnung ist in `assets/js/engine/scenario.js` als `TARIF_VERSCHIEBUNG`,
`TARIFF_AFD` und im Szenario `grundfreibetrag` hinterlegt.

### 3.2 Abschaffung des Solidaritätszuschlags für alle (S. 14)

Parameter: Das Programm nennt in der Übersichtsliste „Mehr Netto vom Brutto“ die
„Abschaffung des Solidaritätszuschlags für alle“. Die Zeichenfolge „Solidaritätszuschlag“
kommt im gesamten 166-seitigen Programm genau einmal vor, in dieser Liste. Es gibt keinen
eigenen Detailabschnitt. Die Vollständigkeit der Maßnahme („für alle“) ist damit wörtlich
belegt; die Ausgestaltung ist es nicht.

Annahmen:

1. „für alle“ wird als vollständige Abschaffung verstanden: Solidaritätszuschlag = 0 € in
   allen Fällen.
2. Die Abschaffung wirkt sowohl auf die tarifliche Einkommensteuer als auch auf die
   Kapitalertragsteuer nach § 32d Abs. 3 und 4 EStG.
3. Nicht modelliert: Auswirkungen auf Körperschaftsteuer und Kapitalgesellschaften. Diese
   sind nicht Teil eines privaten Haushalts.

Annahmeaufwand: keiner. Das Szenario setzt `soliAktiv: false`.

### 3.3 Sparer-Pauschbetrag 6.672 Euro (S. 60)

Parameter: Das Programm nennt 6.672 € für Ledige ausdrücklich und koppelt den Betrag an die
Geringfügigkeitsgrenze.

Annahmen:

1. Der Programmwert 6.672 € wird unverändert übernommen. Es wird kein aus der Kopplung
   abgeleiteter aktuellerer Wert gebildet, weil das Programm kein Bezugsjahr nennt.
2. Das Programm nennt den Wert ausdrücklich für Ledige. Für die Zusammenveranlagung wird er
   nach der Systematik des § 20 Abs. 9 Satz 2 EStG verdoppelt, also 13.344 €. Diese
   Verdopplung ist eine Übertragung der Systematik und keine Programmaussage.
3. Der Effekt hängt vom Kapitalertrag des Haushalts ab. Wird kein Kapitalertrag angegeben,
   wird der Vorschlag im Ergebnis ausgewiesen, aber nicht in Euro bewertet (Grund: „kein
   Kapitalertrag angegeben“).
4. Nicht modelliert: die Günstigerprüfung nach § 32d Abs. 6 EStG. Für Haushalte mit einem
   Grenzsteuersatz unter 25 % kann der tatsächliche Vorteil geringer sein. Kapitalerträge
   werden mit der Abgeltungsteuer von 25 % gerechnet.

Die Wirkung ist nach oben durch die Differenz der Pauschbeträge begrenzt:
`6.672 − 1.000 = 5.672` € je Alleinstehendem, multipliziert mit dem Abgeltungsteuersatz von
25 %, also höchstens 1.418 € im Jahr. `tests/unit/scenario.test.mjs` prüft diese Grenze.

### 3.4 Familiensplitting (S. 59)

Status `MODEL_ASSUMPTION`. Das Programm nennt nur das Prinzip: die Summe der Einkünfte aller
Familienmitglieder geteilt durch die Zahl der Familienmitglieder. Es nennt keine
Bemessungsgrundlage im Steuerrechtssinn, keine Obergrenze und keine Übergangsregelung.

Annahmen, vollständig:

1. Teiler ist die Zahl der Familienmitglieder, also zwei Erwachsene plus die Zahl der
   Kinder. Kinder werden mitgezählt.
2. Kinder haben kein eigenes zu versteuerndes Einkommen. Das Haushaltseinkommen ist die
   Summe der Einkünfte der Erwachsenen.
3. Als Bemessungsgrundlage dient das zu versteuernde Einkommen, nicht der Rechtsbegriff
   „Einkünfte“, den das Programm verwendet.
4. Es gibt keine Deckelung des Vorteils.
5. Das Familiensplitting tritt an die Stelle des Ehegattensplittings, nicht zusätzlich
   dazu.
6. Der Kinderfreibetrag bleibt in der Höhe des geltenden Rechts bestehen (4.878 € /
   9.756 € je Kind). Das Programm kündigt auf Seite 148 zusätzlich eine Anhebung des
   Kinderfreibetrages an, beziffert sie aber nicht (Abschnitt 4).
7. Das Kindergeld bleibt in der Höhe des geltenden Rechts bestehen (259 € monatlich je
   Kind). Das Programm beziffert keine Kindergeldänderung.

Der Vorschlag wird im Ergebnis getrennt von den direkt berechneten Vorschlägen ausgewiesen
und in der Abdeckungszeile als Modellannahme gezählt.

Der Kinderfreibetrag bleibt auch im Familiensplitting-Szenario angesetzt
(`kinderfreibetragAktiv: true`). Das entspricht dem Programm, das beide Maßnahmen im selben
Satz nennt („mit dem steuerlichen Familiensplitting und einer Anhebung des
Kinderfreibetrages“, Seite 148). Angesetzt wird der geltende Betrag, weil das Programm die
angekündigte Anhebung nicht beziffert. Erkennbar ist der Kinderfreibetrag im Ergebnis nur,
wenn er über den Familienleistungsausgleich nach § 31 EStG günstiger ist als das Kindergeld
und das Familiensplitting die Steuer nicht bereits auf null senkt. Annahme 6 in
`data/policies/afd-2025.json` beschreibt genau dieses Vorgehen.

## 4. Die acht nicht einzeln berechenbaren Programmpunkte

Diese Punkte werden ausdrücklich **nicht** in Euro bewertet. Für sie gibt es keinen
belastbaren persönlichen Betrag, weil entweder der Parameter im Programm fehlt oder der
Effekt am Verbrauch hängt, der nicht erhoben wird.

| Programmpunkt | Seite | Grund der Nichtbewertung |
|---|---|---|
| Abschaffung aller CO₂-Abgaben | 57 | Wirkung hängt am Verbrauch fossiler Brennstoffe |
| Reduzierung der Energiesteuer, Stromsteuer auf das Minimum | 13 | Kein Zielniveau beziffert, zusätzlich verbrauchsabhängig |
| Abschaffung der Grundsteuer | 58 | Ohne Grundbesitz, Messbetrag und Hebesatz nicht bestimmbar; zusätzlich ist die geplante Gegenfinanzierung über einen Zuschlag auf die Einkommensteuer nicht beziffert, der Nettoeffekt also nicht bestimmbar |
| Abschaffung der Vermögen- und Erbschaftsteuer | 60 | Ereignisabhängig, kein laufender Jahresbetrag |
| Mehrwertsteuer Gastronomie auf 7 % | 57 | Parameter beziffert, aber die Ausgaben des Haushalts werden nicht erhoben |
| Mehrwertsteuer Kinderbedarf auf 7 % | 148 | Der begünstigte Warenkorb ist nicht definiert |
| Aufhebung der Grunderwerbsteuer für Selbstnutzer | 36 | Einmalig beim Erwerb, kein Jahresbetrag |
| Anhebung des Kinderfreibetrages | 148 | Angekündigt, aber nicht beziffert. Eine Zahl zu wählen wäre eine erfundene Programmaussage |

Zur Grundsteuer im Einzelnen: Das Programm plant, die Kommunen durch einen Zuschlag auf
die Einkommen- und Körperschaftsteuer vollumfänglich zu entschädigen. Die Entlastung wird
dadurch ganz oder teilweise wieder aufgehoben. Ohne Kenntnis des Zuschlagsatzes ist der
Nettoeffekt nicht bestimmbar. Eine belastbare Zahl ist deshalb nicht möglich.

Nicht gerechnet werden außerdem zwei Posten, die das ZEW-Gutachten unter dem AfD-Programm
aufführt: die Werbungskostenpauschale von 2.000 € und ein Kinderfreibetrag von 12.000 €.
Beide stehen nicht im Wahlprogramm, sondern im Antrag der AfD-Bundestagsfraktion vom
15. Oktober 2024 (BT-Drucksache 20/13356). Die Zeichenfolgen „Werbungskostenpauschale“ und
„Pendlerpauschale“ kommen im 166-seitigen Programm kein einziges Mal vor. Siehe
`docs/SOURCES.md`.

## 5. Einzelwirkung, Gesamtwirkung und Wechselwirkung

`analysiere()` in `assets/js/engine/scenario.js` rechnet:

- `BASELINE` — geltendes Recht 2026,
- `GESAMTSZENARIO` — alle vier Vorschläge gleichzeitig,
- je Vorschlag ein `SZENARIEN`-Eintrag, in dem **nur** dieser Vorschlag vom geltenden Recht
  abweicht.

Die Einzelwirkung eines Vorschlags ist die Differenz der Gesamtsteuer zwischen geltendem
Recht und dem Szenario, in dem ausschließlich dieser Vorschlag gilt (Leave-one-in). Sie ist
**keine** Reihenfolgezerlegung: Die Vorschläge werden nicht nacheinander abgearbeitet, und
es wird keine Reihenfolge der Wirksamkeit behauptet.

Weil die Einzelwirkungen gegen dieselbe Basis gerechnet werden, überschneiden sie sich. Die
Differenz zwischen der Summe der Einzelwirkungen und der Gesamtwirkung wird deshalb offen
als Wechselwirkung ausgewiesen:

```
Wechselwirkung = Gesamtwirkung − Summe(Summe direkt berechnet) − Summe(Modellannahme)
```

Ab einem Betrag von 1 € im Jahr erscheint dazu eine Zeile in der Abdeckungsliste
(`assets/js/ui/app.js`). Sie benennt, dass sich die Einzelwirkungen gegenseitig
überschneiden, und dass die Kopfzahl maßgeblich ist, nicht die Summe der Einzelwerte. Die
Kopfzahl ist immer die Gesamtwirkung, nicht die Summe der Karten.

Warum die Wechselwirkung ausgewiesen und nicht verteilt wird: Eine Verteilung auf die
Einzelposten wäre willkürlich. Sie würde eine Genauigkeit behaupten, die die Rechnung nicht
hat. Die Offenlegung ist die ehrlichere und die prüfbarere Form.

`tests/unit/scenario.test.mjs` prüft unter anderem, dass das Gesamtszenario mindestens so
stark wirkt wie das günstigste Einzelmaßnahmenbündel, dass die Wechselwirkung die Differenz
erklärt, dass die Analyse die Eingabe nicht verändert und nichts speichert, und dass die
Abdeckungszählung zu den zwölf Datensätzen in `data/policies/afd-2025.json` passt.

## 6. Netto-Rückrechnung

Der Rechner löst Netto nicht stillschweigend in Brutto auf. Er rechnet numerisch zurück,
zeigt das Ergebnis aber als Bandbreite und nennt das geschätzte Brutto.

Grund: Das Nettogehalt ist im Modell monoton steigend, aber nicht streng monoton. Der Tarif
rundet die Jahressteuer auf volle Euro ab, und die Sozialbeiträge wachsen je Euro Brutto nur
um etwa 0,40 €. An jeder Aufrundungsstufe der Steuer fällt das Netto deshalb um weniger als
einen Euro zurück. Es entsteht eine kleine Sägezahnstufe. Der Umkehrwert ist damit nur bis
auf einen kleinen Rest eindeutig.

Verfahren (`bruttoAusNetto()`):

1. Eingrenzung des Bereichs durch 120 Schritte binärer Suche zwischen 0 und 2.000.000 €.
2. Auswahl des Bruttowerts, dessen Netto dem angegebenen am nächsten kommt, durch
   lineare Suche im Bereich von ± 200 € um die gefundene Stelle.
3. Ausweis des verbleibenden Rests als Differenz zwischen getroffenem Netto und
   angegebenem Netto.

Die angezeigte Bandbreite beträgt ± 3 % um den geschätzten Bruttowert
(`NETTO_BANDBREITE = 0,03`). Sie bildet die Unsicherheit ab, die aus der Nettoangabe selbst
folgt: unbekannter Zusatzbeitrag der Krankenkasse, sonstige Abzüge und die Ungenauigkeit der
Angabe. Für den Szenarienvergleich werden die Wirkungen an der unteren und der oberen Grenze
der Bandbreite gerechnet; der Bereich wird als „von … bis …“ gezeigt, nicht als Punktwert.

Ein Netto oberhalb des abbildbaren Bereichs führt zu keiner erfundenen Zahl, sondern zu
einer ausdrücklichen Meldung der Nichtabbildbarkeit. Null oder negatives Netto ergibt kein
erfundenes Brutto.

Die Rückrechnung geschieht gegen das **geltende Recht**, nicht gegen das Szenario. Der
Nutzer kennt sein heutiges Netto, nicht sein künftiges.

`tests/unit/netto.test.mjs` prüft die stückweise Monotonie, die Trefferquote der
Rückrechnung, die Monotonie der Rückrechnung selbst, die Bandbreite und die Behandlung
unrealistischer Eingaben.

## 7. Validierungsstrategie

Die Prüfung ist bewusst zweischichtig: eine Schicht gegen die eigene Rechnung, eine
unabhängige Schicht gegen amtliche Veröffentlichungen und gegen das Gesetzeswortlaut.

| Prüfung | Gegenstand | Datei |
|---|---|---|
| Tarif gegen den amtlichen Programmablaufplan 2026, Modul `UPTAB26` | Wertegitter: jeder Euro von 0 bis 400.000, danach Schritte von 997 bis 5.000.000 | `tests/unit/tariff.test.mjs` |
| Tarif gegen aus dem Gesetzeswortlaut abgeleitete Referenzwerte | VZ 2026 und VZ 2025 | `tests/unit/tariff.test.mjs`, `tests/reference/bmf-2026.test.mjs` |
| Stetigkeit und Monotonie an allen Zonengrenzen, auch nach der Verschiebung | `tariffTax()`, `shiftTariff()` | `tests/unit/tariff.test.mjs` |
| Splitting gegen die ganzzahlige Division des Moduls `UPMLST` | `tariffTaxSplit()` | `tests/unit/tariff.test.mjs` |
| Solidaritätszuschlag gegen den amtlichen Programmablaufplan 2026, Modul `MSOLZ` | Freigrenze, Milderungszone, voller Satz, Kapitalertragsteuer ohne Freigrenze, Monotonie | `tests/unit/soli.test.mjs` |
| Amtliche Parameter des Programmablaufplans 2026 | `GFB`, `SOLZFREI`, `BBGRVALV`, `BBGKVPV`, `RVSATZAN`, `KVSATZAN_ermaessigt`, `PVSATZAN`, `ANP`, `SAP`, `EFA`, Kinderfreibeträge, durchschnittlicher Zusatzbeitragssatz | `tests/reference/bmf-2026.test.mjs` |
| Amtliches Rechenbeispiel zum Kranken- und Pflegeversicherungsanteil | Anlage 2, Beispiel 1 des Programmablaufplans 2026 | `tests/unit/est.test.mjs`, `tests/reference/bmf-2026.test.mjs` |
| Familienleistungsausgleich | Günstigerprüfung zwischen Kinderfreibetrag und Kindergeld, Bemessungsgrundlage des Solidaritätszuschlags mit Kinderfreibetrag | `tests/unit/est.test.mjs` |
| Konsistenz der Parameter | `data/baseline/est-2026.json` gegen `assets/js/engine/params.js` | `tests/unit/params.consistency.test.mjs` |
| Quellenschema der Programmpunkte | Pflichtfelder, Klassifizierungswortschatz, Seitenangabe, dokumentierte Konflikte, Abdeckungssummen | `tests/unit/policies.schema.test.mjs` |
| Verhalten im Browser | Ablauf, Netto-Modus, Barrierefreiheit, Datenschutz, Sichtnachweis in vier Viewports | `tests/e2e/*.spec.js` |

Die Module `UPTAB26` und `MSOLZ` sind in `assets/js/engine/params.js` als `papUPTAB26()` und
`papMSOLZ()` wörtlich zweitimplementiert. Sie dienen ausschließlich als unabhängige
Referenz im Test und werden **nicht** als Produktpfad verwendet. Damit wird
`SELF_VALIDATION_ONLY = FORBIDDEN` eingehalten: Tarif und Solidaritätszuschlag werden nicht
gegen die eigene Engine, sondern gegen eine getrennte Implementierung der amtlichen
Vorschrift geprüft.

### 7.1 Der amtliche KV/PV-Referenzwert

Anlage 2, Beispiel 1 des Programmablaufplans 2026 nennt für Steuerklasse III und 75.000 €
Brutto einen Kranken- und Pflegeversicherungsanteil der Vorsorgepauschale von amtlich
7.149 €. Der Rechner reproduziert diesen Wert exakt:

```
69.750 × (7,0 % + 1,45 %) + 69.750 × 1,8 % = 7.149,375 € → abgerundet 7.149 €
```

Damit sind Beitragsbemessungsgrenze, ermäßigter Beitragssatz, hälftiger Zusatzbeitrag und
Pflegeversicherungssatz gegen eine amtliche Veröffentlichung bestätigt.

### 7.2 Die offen dokumentierte Differenz von 6 Euro

Dasselbe amtliche Beispiel nennt eine Lohnsteuer von 8.330 €. Der Rechner kommt auf 8.324 €.
Die Differenz beträgt 6 € und ist in `tests/reference/bmf-2026-reference.json` unter
`amtliches_rechenbeispiel.nicht_reproduziert` mit Status „offen dokumentiert“ hinterlegt.
`tests/reference/bmf-2026.test.mjs` prüft, dass diese Differenz benannt ist und nicht
beschönigt wird.

Erklärung: Der Rechner bildet das **Veranlagungsverfahren** ab (§§ 2, 10, 32a EStG), nicht
den **Lohnsteuerabzug** (§ 39b EStG). Die Lohnsteuer-Vorsorgepauschale nach § 39b Abs. 2
Satz 5 Nr. 3 EStG folgt einer anderen Systematik als der Sonderausgabenabzug nach § 10 EStG,
unter anderem beim Zusammenspiel der Teilbeträge für Renten-, Kranken-, Pflege- und
Arbeitslosenversicherung und beim Höchstbetrag. Eine abschließende Rekonstruktion des
amtlichen Tabellenwerts ist aus dem veröffentlichten Programmablaufplan heraus nicht
gelungen.

Konsequenz: Der Rechner beansprucht ausdrücklich **nicht**, die amtlichen
Lohnsteuertabellen zu reproduzieren. Als Referenz für die Rechengenauigkeit dienen Tarif und
Solidaritätszuschlag, die auf einem dichten Wertegitter deckungsgleich mit `UPTAB26` und
`MSOLZ` gerechnet werden. Siehe `docs/LIMITATIONS.md`.

## 8. Was das Ergebnis nicht ist

- Nicht die Gesamtbilanz eines Haushalts. Gerechnet werden Steuern und Kindergeld.
  Wohngeld, Bürgergeld, Grundsicherung, Kinderzuschlag und Unterhaltsvorschuss sind nicht
  enthalten. Diese Leistungen werden auf das Einkommen angerechnet und können einen Teil der
  Entlastung wieder aufheben. Der Hinweis steht im Ergebnis unter `#transfer-hinweis`.
- Nicht das Programm als Ganzes. Die Zahl ist die Summe der berechenbaren Vorschläge, nicht
  eine Bewertung des Programms.
- Nicht die Summe der Einzelkarten. Maßgeblich ist die Gesamtwirkung inklusive
  Wechselwirkung.
- Nicht der Lohnsteuerabzug. Siehe Abschnitt 7.2.
- Nicht die Wirkung der acht nicht bewerteten Programmpunkte.
- Keine Steuerberatung. Für die individuelle Situation sind eine zugelassene Steuerberatung
  oder das zuständige Finanzamt maßgeblich.

## 9. Pflege

- Ändert sich das geltende Recht, sind `data/baseline/est-<jahr>.json` und
  `assets/js/engine/params.js` **gemeinsam** zu ändern. `tests/unit/params.consistency.test.mjs`
  erzwingt die Übereinstimmung.
- Ändert sich das Programm, ist `data/policies/afd-2025.json` zu ändern; `exact_claim`,
  `source_page` und `last_verified` werden mitgeführt.
  `tests/unit/policies.schema.test.mjs` erzwingt Pflichtfelder, Seitenangabe und den
  Klassifizierungswortschatz.
- Änderungen an Annahmen werden in dieser Datei, in `methodik.html` und in den
  `assumptions`-Listen der Datendatei gleichzeitig nachgeführt.
- Nach jeder Änderung an Rechenkern oder Parametern gilt `CALCULATION_ENGINE_VALIDATED`:
  erst nach grünem `node --test`, grünem Abgleich mit `UPTAB26` und `MSOLZ` und grüner
  Konsistenzprüfung darf wieder ein Eurobetrag ausgeliefert werden.
- Die zweite Partei wird nach der Regel in `AGENTS.md` ergänzt: neue Datendatei,
  eigenes Regelwerk, unveränderter Rechenkern.
