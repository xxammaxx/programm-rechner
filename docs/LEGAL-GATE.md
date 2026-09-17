# Rechtliches Gate

Dieses Dokument beschreibt, warum der Programm-Rechner derzeit nicht öffentlich freigeschaltet
ist, welche Angaben dafür fehlen, wer sie liefern muss und in welcher Reihenfolge die
Freischaltung abläuft.

Der Inhalt dieses Dokuments ist eine technische und organisatorische Verfahrensbeschreibung.
Er ist keine Rechtsberatung.

## 1. Status

| Feld | Wert |
|---|---|
| Regel | `LEGAL_OWNER_DATA = REQUIRED_FOR_PUBLICATION` |
| Klassifizierung | `BLOCKED_EXTERNAL_OWNER_ACTION` |
| Blockierender Umstand | Die Anbieterangaben liegen nicht vor und können nur vom Betreiber geliefert werden |
| GitHub Pages | bewusst **nicht** aktiviert |
| Vorgesehene Adresse | `https://xxammaxx.github.io/programm-rechner/` (nicht erreichbar, solange nicht freigeschaltet) |
| Auswirkung auf das Produkt | Der Rechner ist lokal vollständig funktionsfähig. Er ist nur nicht veröffentlicht |

## 2. Was § 5 Digitale-Dienste-Gesetz verlangt

Für ein öffentliches digitales Angebot sind danach mindestens erforderlich:

1. der vollständige Name des Anbieters,
2. eine Anschrift, unter der der Anbieter niedergelassen ist oder ein Zustellungsbevollmächtigter
   erreichbar ist (Dienst- oder Kontaktanschrift),
3. eine Kontaktmöglichkeit zur **schnellen elektronischen Kontaktaufnahme**, üblicherweise eine
   E-Mail-Adresse.

Diese drei Angaben sind die Mindestmenge. Die Seite `impressum.html` nennt zusätzlich, welche
Angaben fehlen, statt sie zu erfinden. Das Konfigurationsfeld
`KONFIGURATION.betreiber.inhaltlichVerantwortlich` ist für die inhaltlich verantwortliche
Person vorgesehen und wird, wenn gesetzt, mit ausgegeben.

## 3. Warum kein Platzhalter veröffentlicht wurde

Es wäre technisch einfach gewesen, `impressum.html` mit einem Musternamen, einer
Beispielanschrift und einer Beispieladresse zu füllen. Das ist bewusst unterlassen worden.

- Eine erfundene Anbieterangabe ist eine Falschangabe in einem Dokument, das gerade der
  Identifizierbarkeit des Anbieters dienen soll.
- Ein Platzhalter ist nicht als Platzhalter erkennbar, sobald die Seite im Netz steht, und
  erzeugt den Anschein einer Kennzeichnung, die es nicht gibt.
- Eine unvollständige Kennzeichnung ist schlechter als eine sichtbar fehlende: Der Fehler
  wird unsichtbar.

Deshalb gilt als Regel: **Keine erfundenen und keine Platzhalter-Anbieterangaben.** Solange
die Angaben fehlen, wird die Seite nicht veröffentlicht.

Wie das umgesetzt ist: `assets/js/ui/impressum.js` liest ausschließlich aus der
Konfiguration. Sind die Angaben nicht vollständig, wird kein Ersatztext und keine erfundene
Angabe erzeugt, sondern ein sachlicher Hinweis mit `role="note"` eingefügt, dass die
gesetzlich vorgeschriebenen Anbieterangaben noch nicht vorliegen und bewusst nicht erfunden
werden. Die übrigen Abschnitte von `impressum.html` (Haftung für Inhalte, Haftung für Links,
keine Wahlempfehlung) bleiben davon unberührt und sind bereits belegt.

Die Seite trägt zusätzlich `<meta name="robots" content="noindex, follow">`.

## 4. Welche Angaben fehlen und wo sie hingehören

Alle Angaben werden an genau einer Stelle eingetragen: in `assets/js/config.js` im Block
`KONFIGURATION.betreiber`.

| Feld in `config.js` | Erforderlich | Inhalt |
|---|---|---|
| `name` | ja | vollständiger Name des Anbieters (bei einer natürlichen Person: Vor- und Nachname) |
| `anschrift` | ja | Dienst- oder Kontaktanschrift |
| `email` | ja | Adresse für die schnelle elektronische Kontaktaufnahme |
| `inhaltlichVerantwortlich` | optional | Name der inhaltlich verantwortlichen Person, falls abweichend |
| `vorhanden` | ja | Schalter. Solange `false`, wird der Hinweis angezeigt; nach dem Eintragen auf `true` setzen |

Auslieferungszustand: alle Werte `null`, `vorhanden: false`.

Sind `name`, `anschrift` und `email` gesetzt **und** `vorhanden: true`, wird die
Anbieterkennzeichnung als Tabelle gerendert: Anbieter, Anschrift, Kontakt und, falls gesetzt,
inhaltlich verantwortlich. Es gibt keinen weiteren Ort, an dem diese Angaben stehen. Damit
existiert auch keine zweite Fassung, die veralten könnte.

## 5. Ablauf der Freischaltung

1. **Angaben eintragen.** `assets/js/config.js` öffnen und `KONFIGURATION.betreiber` füllen:
   `name`, `anschrift`, `email`, optional `inhaltlichVerantwortlich`.
2. **Schalter setzen.** Im selben Block `vorhanden: true`.
3. **Lokal prüfen.** `node tools/serve.mjs` starten und `http://127.0.0.1:4173/impressum.html`
   öffnen. Prüfen: Die Anbieterangaben erscheinen als Tabelle, der Warnhinweis ist
   verschwunden, Rechtschreibung der Anschrift stimmt, die E-Mail-Adresse ist erreichbar.
4. **Datenschutzseite gegenprüfen.** `datenschutz.html` verweist für Fragen zum Hosting auf
   den im Impressum genannten Betreiber. Dieser Verweis wird erst mit dem Eintrag sinnvoll.
5. **Freigabeentscheidung dokumentieren.** Ergebnis festhalten: Wer hat die Angaben geliefert,
   wann, und wer hat die Freischaltung entschieden. Die Klassifizierung wechselt damit von
   `BLOCKED_EXTERNAL_OWNER_ACTION` zu freigegeben.
6. **GitHub Pages aktivieren.** Erst jetzt. Hosting-Einstellungen des Repositorys
   `programm-rechner` auf GitHub Pages umstellen, Quelle: der auszuliefernde Zweig.
7. **Nachprüfen.** Die vorgesehene Adresse aufrufen, `impressum.html` dort prüfen und
   kontrollieren, dass kein Analyse-Skript geladen wird, solange `goatcounterKurzname` `null`
   ist.

Punkt 6 ist ausdrücklich nachgelagert. Die Reihenfolge ist nicht beliebig: Eine
Veröffentlichung vor dem Eintrag der Angaben wäre eine Veröffentlichung ohne
Anbieterkennzeichnung.

## 6. Zusätzliche Gates

Diese Themen sind nicht Teil der V1-Freischaltung, lösen aber jeweils eine eigene Prüfung aus
(`LEGAL_REVIEW_REQUIRED`). Sie werden nicht nebenbei mit erledigt.

| Auslöser | Konsequenz |
|---|---|
| Bezahlte Bewerbung, Anzeigen, Sponsoring | Kennzeichnungspflichten für Werbung werden berührt. Eigene Prüfung vor der Umsetzung |
| Monetarisierung des Angebots | Ändert die Einordnung des Angebots. Eigene Prüfung vor der Umsetzung |
| Unterstützen-Link aktivieren (`unterstuetzen.aktiv`, `unterstuetzen.url`) | Der Link ist freiwillig und ohne Gegenleistung. Er ist keine steuerlich abzugsfähige Spende und wird nie als solche dargestellt. Vor der Aktivierung ist zu prüfen, ob die Einordnung des Angebots davon berührt wird |
| Öffentlicher Zähler aktivieren (`oeffentlicherZaehler.aktiv`) | Der Zähler muss genau zeigen, was gezählt wird, und darf keine Personen nennen |
| Produktanalyse aktivieren (`goatcounterKurzname`) | `datenschutz.html` ist vorher zu prüfen. Die dort genannten Ereignisse müssen mit `ERLAUBTE_EREIGNISSE` übereinstimmen |
| Wahlwerbung, Kandidatur, parteipolitische Trägerschaft | Berührt den Charakter des Angebots unmittelbar. Eigene Prüfung vor jeder Veröffentlichung |

Die drei Schalter stehen in `assets/js/config.js` und sind im Auslieferungszustand
geschlossen: `goatcounterKurzname: null`, `oeffentlicherZaehler.aktiv: false`,
`unterstuetzen.aktiv: false` mit `unterstuetzen.url: null`. Die Konfiguration ist damit die
einzige Stelle, an der eine Aktivierung möglich ist, und jede Aktivierung ist im Repository
sichtbar.

## 7. Was bereits erfüllt ist

| Punkt | Zustand |
|---|---|
| Haftung für Inhalte | in `impressum.html` belegt, inklusive Hinweis, dass keine Steuer- oder Rechtsberatung vorliegt |
| Haftung für Links | in `impressum.html` belegt |
| Keine Wahlempfehlung | in `impressum.html`, auf jeder Textseite und als Dauerhinweis über dem Rechner |
| Keine Cookies, keine Speicherung | umgesetzt und getestet; eine Einwilligung ist für den Auslieferungszustand nicht vorgesehen, weil nichts gespeichert und nichts an Dritte übertragen wird |
| Kein Tracking | Analyse ist aus; es wird kein Analyseskript geladen |
| Kein Zahlungs-Widget | kein Widget, kein vorgeladenes Skript eines Zahlungsdienstes |
| Hosting | GitHub Pages; beim Abruf verarbeitet GitHub technisch notwendige Verbindungsdaten. Der Punkt ist in `datenschutz.html` benannt |
| Impressum nicht indexiert | `noindex, follow` gesetzt |

## 8. Verantwortlichkeit

Die fehlenden Angaben kann ausschließlich der Betreiber des Angebots liefern. Kein Agent, kein
Werkzeug und kein Automatismus darf sie erfinden, aus dem Repository ableiten, aus einer
früheren Fassung übernehmen oder durch einen Platzhalter ersetzen.

Daraus folgt die Klassifizierung `BLOCKED_EXTERNAL_OWNER_ACTION`: Der Vorgang ist nicht durch
Arbeit im Repository auflösbar. Er ist auflösbar, sobald die Angaben vorliegen.

Bis dahin gilt: Der Rechner bleibt lokal lauffähig und prüfbar. Veröffentlicht wird er nicht.
