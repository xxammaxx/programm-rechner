# Bekannte Grenzen

Diese Liste ist vollständig gemeint. Jede Grenze wird benannt, auch wenn sie dem Ergebnis
schadet. Eine verschwiegene Grenze wäre ein Fehler, keine Vereinfachung.

Alle Angaben beziehen sich auf V1, Rechtsstand Veranlagungszeitraum 2026,
Programmstand AfD-Bundestagswahlprogramm 2025 (verabschiedet am 11.–12. Januar 2025 in
Riesa), letzte inhaltliche Prüfung 17. September 2026.

## 1. Veranlagungsverfahren, nicht Lohnsteuerabzug

Der Rechner bildet das Veranlagungsverfahren ab (§§ 2, 10, 32a EStG), nicht den
Lohnsteuerabzug nach § 39b EStG. Die Vorsorgepauschale des Lohnsteuerabzugs folgt einer
anderen Systematik als der Sonderausgabenabzug: unter anderem beim Zusammenspiel der
Teilbeträge für Renten-, Kranken-, Pflege- und Arbeitslosenversicherung und beim Höchstbetrag.

Folge: Der Rechner beansprucht ausdrücklich **nicht**, die amtlichen Lohnsteuertabellen zu
reproduzieren.

Offen dokumentierte Differenz: Im amtlichen Rechenbeispiel (BMF-Programmablaufplan 2026,
Anlage 2, Beispiel 1: Steuerklasse III, 75.000 € Brutto) nennt das BMF eine Lohnsteuer von
8.330 €. Der Rechner kommt auf 8.324 €. Die Differenz von 6 € ist in
`tests/reference/bmf-2026-reference.json` unter
`amtliches_rechenbeispiel.nicht_reproduziert` mit dem Status „offen dokumentiert“
hinterlegt, und `tests/reference/bmf-2026.test.mjs` prüft, dass sie benannt und nicht
beschönigt wird. Eine abschließende Rekonstruktion des amtlichen Tabellenwerts aus dem
veröffentlichten Programmablaufplan ist nicht gelungen.

Dem gegenüber steht eine bestätigte Genauigkeit an anderer Stelle: der Kranken- und
Pflegeversicherungsanteil der Vorsorgepauschale wird mit amtlich 7.149 € exakt reproduziert,
und Tarif und Solidaritätszuschlag werden auf einem dichten Wertegitter (jeder Euro von 0
bis 400.000, danach Schritte von 997 bis 5.000.000) deckungsgleich mit den amtlichen Modulen
`UPTAB26` und `MSOLZ` gerechnet.

Konsequenz für die Nutzung: Die ausgewiesenen Beträge sind Modellrechnungen zum Vergleich
zweier Rechtslagen, keine Vorhersage des eigenen Steuerbescheids und keine Aussage über die
zu erwartende Lohnabrechnung.

## 2. Transferleistungen sind nicht modelliert

Nicht enthalten sind Wohngeld, Bürgergeld, Grundsicherung, Kinderzuschlag und
Unterhaltsvorschuss. Diese Leistungen sind einkommens- und vermögensabhängig und werden auf
das Haushaltseinkommen angerechnet. Ihre Wechselwirkung mit Steueränderungen lässt sich
ohne ein vollständiges Transfermodell nicht abbilden.

Das ist eine echte Grenze, nicht eine Formalie. Das ZEW-Gutachten kommt für einen
Alleinverdiener-Haushalt mit zwei Kindern und 40.000 € Bruttoeinkommen auf ein **Minus** von
440 € und führt das ausdrücklich auf die Anrechnungsregeln beim Wohngeld zurück. Ein reines
Steuermodell kann dieses Ergebnis nicht reproduzieren.

Der Rechner reagiert darauf nicht mit einer Schätzung, sondern mit Offenlegung: Im Ergebnis
steht der Hinweis unter `#transfer-hinweis`, dass nur Steuern und Kindergeld gerechnet
werden und dass Anrechnungsregeln einen Teil der Entlastung wieder aufheben können. Wer eine
dieser Leistungen bezieht, sollte die ausgewiesene Zahl nicht als persönliche Entlastung
lesen.

## 3. Nur Arbeitseinkommen

Abgebildet wird ein Arbeitnehmerhaushalt. Angesetzt werden der Arbeitnehmer-Pauschbetrag und
die Arbeitnehmeranteile der gesetzlichen Vorsorgeaufwendungen. Nicht abgebildet:

- Selbständigkeit, Gewerbebetrieb und freiberufliche Einkünfte,
- Vermietung und Verpachtung,
- Gewinne und Verluste, Verlustverrechnung und Verlustvortrag,
- Werbungskosten oberhalb des Arbeitnehmer-Pauschbetrags,
- außergewöhnliche Belastungen,
- private Kranken- und Pflegeversicherung,
- Beiträge zu sonstigen Versicherungen nach § 10 Abs. 1 Nr. 3a EStG,
- Spenden und Kirchensteuer als Sonderausgaben.

Kapitalerträge werden ausschließlich über die Abgeltungsteuer berücksichtigt, und nur, wenn
der Nutzer sie angibt.

Die Vereinfachungen sind im Szenarienvergleich weitgehend neutral, weil die
Vorsorgeaufwendungen in beiden Szenarien identisch eingehen
(`modellneutralitaet` in `data/baseline/est-2026.json`). Sie machen die Zahl aber zu einer
Aussage über einen bestimmten Haushaltstyp, nicht über beliebige Haushalte.

## 4. Ehegattensplitting und Familiensplitting bei Alleinerziehenden

Das Familiensplitting wird als Teiler über die Zahl der Familienmitglieder abgebildet: zwei
Erwachsene plus die Zahl der Kinder. Bei Alleinstehenden und Alleinerziehenden ist der
Ausgangsteiler 1, das Familiensplitting erhöht ihn um die Zahl der Kinder.

Nicht modelliert:

- eine Übertragung des Kinderfreibetragsanteils des anderen Elternteils auf den
  alleinerziehenden Elternteil. Angesetzt wird der halbe Kinderfreibetrag
  (4.878 € je Kind, § 32 Abs. 6 Satz 1 EStG), nicht der volle Betrag,
- eine Zusammenveranlagung oder ein Splittingvorteil für nicht verheiratete Eltern,
- Unterhaltsleistungen des anderen Elternteils,
- die Frage, ob ein zweiter Erwachsener im Haushalt eigene Einkünfte hat. Das Modell
  unterstellt einen Erwerbseinkommenshaushalt mit einem Betrag.

Für Alleinerziehende mit Kindern kann die ausgewiesene Wirkung des Familiensplittings
dadurch von der tatsächlichen abweichen. Die Richtung ist offen; der Rechner behauptet sie
nicht.

## 5. Zusatzbeitrag der Krankenkasse

Angesetzt wird der amtliche Durchschnittssatz von 2,9 % (BMF-Programmablaufplan 2026,
Anlage 2), hälftig getragen, also 1,45 % als Arbeitnehmeranteil. Der kassenindividuelle
Zusatzbeitragssatz kann davon abweichen.

Der Effekt auf das ausgewiesene Ergebnis ist neutral: Der Zusatzbeitrag geht in beiden
Szenarien mit demselben Satz ein und kürzt beide Seiten gleich. Er verschiebt die absolute
Höhe von Brutto zu Netto, nicht die Differenz zwischen geltendem Recht und Szenario. Für die
Netto-Rückrechnung (Abschnitt 7) ist er eine der Unsicherheitsquellen, die in der
Bandbreite abgebildet werden.

## 6. Nicht modellierte Steuerregeln

- **Günstigerprüfung nach § 32d Abs. 6 EStG**: Kapitalerträge werden pauschal mit der
  Abgeltungsteuer von 25 % gerechnet. Liegt der persönliche Grenzsteuersatz unter 25 %, kann
  der tatsächliche Vorteil geringer sein. Betroffen ist ausschließlich der Sparer-Pauschbetrag,
  und nur bei angegebenen Kapitalerträgen.
- **Kirchensteuer**: nicht modelliert, weder als Sonderausgabe noch als Zuschlag.
- **Veranlagung der Kapitalerträge nach § 32d Abs. 3 und 4 EStG** mit ihren Feinheiten im
  Solidaritätszuschlag: nur insoweit abgebildet, wie die Abgeltungsteuer als
  Bemessungsgrundlage des Zuschlags ohne Freigrenze eingeht (§ 3 Abs. 3 Satz 2 und § 4
  Satz 3 SolzG 1995).
- **Solidaritätszuschlag von Kapitalgesellschaften und bei Körperschaftsteuer**: nicht
  abgebildet, da nicht Teil eines privaten Haushalts.
- **Indexierung von Freibeträgen**: Das Programm nennt sie, sie ist aber eine dauerhafte
  Regelung und kein Einmaleffekt eines einzelnen Veranlagungsjahres.

## 7. Rückrechnung von Netto auf Brutto ist nur bis auf einen Rest eindeutig

Das Nettogehalt ist im Modell monoton steigend, aber nicht streng monoton. Der Tarif rundet
die Jahressteuer auf volle Euro ab, während die Sozialbeiträge je Euro Brutto nur um etwa
0,40 € wachsen. An jeder Aufrundungsstufe der Steuer fällt das Netto um weniger als einen
Euro zurück; es entsteht eine kleine Sägezahnstufe. Der Umkehrwert ist deshalb nur bis auf
einen kleinen Rest bestimmt.

Der Rechner verbirgt das nicht, sondern zeigt es:

- Es wird eine Bandbreite von ± 3 % um das geschätzte Brutto ausgewiesen, nicht eine genaue
  Zahl.
- Das geschätzte Brutto wird ausdrücklich genannt.
- Der verbleibende Rest wird im Rechenweg ausgewiesen.
- Die Erklärung steht im Ergebnis, und bei der Eingabe wird schon im Hinweis zur
  Netto-Auswahl darauf hingewiesen (`#modus-hinweis`).

Ein Netto, das oberhalb des abbildbaren Bereichs liegt, führt zu einer Meldung der
Nichtabbildbarkeit statt zu einer erfundenen Zahl. Regel:
`NET_TO_GROSS_FALSE_PRECISION = FORBIDDEN`.

## 8. Keine zweite Partei in V1

V1 rechnet ausschließlich das AfD-Bundestagswahlprogramm 2025. Es gibt keinen
Parteienvergleich. Die Architektur ist dafür vorbereitet (Datendatei je Partei, Regelwerk in
`assets/js/engine/scenario.js`, unveränderter Rechenkern), aber der zweite Datensatz
existiert nicht.

Daraus folgt: Der Rechner kann die zentrale Frage eines Vergleichers — „was wäre bei einer
anderen Partei anders“ — nicht beantworten. Er beantwortet nur, was ausgewählte Vorschläge
dieses einen Programms für einen Haushalt bedeuten würden. Die Regel für eine spätere
Erweiterung steht in `AGENTS.md`.

## 9. Acht Programmpunkte werden nicht in Euro bewertet

Von zwölf erfassten Programmpunkten werden vier gerechnet und acht nicht. Die acht nicht
bewerteten Punkte sind in `docs/METHODOLOGY.md` Abschnitt 4 mit Begründung aufgeführt.

Diese Lücke ist strukturell, nicht vorübergehend: Für mehrere Punkte (Mehrwertsteuer,
Energiesteuern, CO₂-Abgaben, Grunderwerbsteuer) hängt der persönliche Vorteil an Daten, die
der Rechner bewusst nicht erhebt. Für andere (Kinderfreibetrag S. 148, Grundsteuer-
Gegenfinanzierung) fehlt der Parameter im Programm. Eine Schätzung wäre Scheingenauigkeit.

Folge: Die ausgewiesene Zahl ist eine Untergrenze dessen, was der Haushalt an Entlastung
erfahren könnte, aber sie ist keine belastbare Untergrenze, weil im Programm auch
Gegenfinanzierungen angelegt sind (Grundsteuer über einen Zuschlag auf die Einkommensteuer)
und weil Verbrauchsteuersenkungen an Ausgaben hängen, die der Haushalt selbst kennt. Der
Rechner spricht deshalb nicht von einer Untergrenze, sondern nennt nur die Summe der
berechenbaren Vorschläge.

## 10. Kein Sicherheitsaudit, aber auch keine Lieferkette

Der Rechner ist abhängigkeitsfrei im ausgelieferten Teil: kein Framework, keine
Fremdbibliothek, keine Schriftart von einem Fremdhost, kein CDN, kein Paket zur Laufzeit.
Daraus folgt zweierlei.

Günstig: Es gibt praktisch keine Angriffsfläche über eine Lieferkette. Es gibt keine
Versionen, die gepinnt oder aktualisiert werden müssten, und keinen Fremdcode, der
mitkompromittiert werden könnte. Im Auslieferungszustand lädt die Seite kein einziges
Skript von einem fremden Ursprung; ein Playwright-Test hält das fest.

Ungünstig: Es gibt dafür auch keine externe Sicherheitsüberprüfung. Es gibt kein
Abhängigkeits-Audit, keine Bibliothek, die von anderer Seite geprüft wurde, und kein
Sicherheitsnetz außerhalb dieses Repositorys. Die Prüfung beschränkt sich auf die
Projektregeln, die Unit- und Referenztests und die E2E-Suite.

Die Entwicklungsabhängigkeit `@playwright/test` (1.63.0) betrifft ausschließlich die Tests
und wird nicht an Nutzer ausgeliefert. `package-lock.json` liegt vor.

## 11. Weitere Grenzen, die nicht im Rechenkern liegen

- **Keine Steuerberatung und keine Rechtsberatung.** Für die individuelle Situation sind
  eine zugelassene Steuerberatung oder das zuständige Finanzamt maßgeblich.
- **Keine Bewertung des Programms als Ganzes.** Die Zahl ist die Summe der berechenbaren
  Vorschläge, nicht das Programm. Acht Programmpunkte fehlen als Größe.
- **Kein Lohnsteuertabellen-Abgleich.** Siehe Abschnitt 1.
- **Keine Vorhersage.** Das Programm nennt kein Umsetzungsjahr. `valid_from` ist in allen
  Datensätzen „nicht datiert“. Es wird also nicht behauptet, dass und wann die Vorschläge
  Wirklichkeit würden.
- **Der Wechselwirkungsterm ist eine Restgröße.** Bei mehreren gleichzeitig geltenden
  Vorschlägen ist die Summe der Einzelwirkungen nicht gleich der Gesamtwirkung. Der Rechner
  weist die Differenz offen aus, statt sie zu verteilen.
- **Öffentliche Freischaltung ist blockiert.** Ohne die Angaben nach § 5
  Digitale-Dienste-Gesetz ist eine Veröffentlichung nicht zulässig. Siehe
  `docs/LEGAL-GATE.md`.
