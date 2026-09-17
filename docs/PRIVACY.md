# Datenschutz aus Entwicklungssicht

Dieses Dokument beschreibt den Datenschutz des Programm-Rechners für Entwickler und
Betreiber: das Bedrohungsmodell, die Invarianten, wie sie getestet werden und welche
Änderungen sie brechen würden. Die nutzergerichtete Fassung steht in `datenschutz.html`.

## 1. Bedrohungsmodell

Angriffspunkt ist nicht ein Server, sondern das Gerät des Nutzers und der Netzwerkverkehr.
Die Anwendung ist so gebaut, dass sie bestimmte Daten **nicht erheben kann**, nicht nur
„nicht erhebt“.

Was die Anwendung technisch nicht leaken kann:

| Datum | Warum nicht |
|---|---|
| Einkommen, Haushaltstyp, Kinderzahl, Kapitalertrag | Es gibt keinen Backend-Endpunkt. Die Werte existieren nur im Arbeitsspeicher der geladenen Seite |
| Rechenergebnis und Ergebnisrichtung | Das Ergebnis wird ausschließlich im DOM dargestellt. Es wird nicht gesendet, nicht gespeichert und nicht in die Adresse geschrieben |
| Leistungsbezug | Wird nicht erfragt |
| Politische Einstellung, Wahlabsicht, Parteimitgliedschaft | Wird nicht erfragt und nicht abgeleitet |
| Name, E-Mail, Anschrift, Arbeitgeber, Telefonnummer | Wird nicht erfragt |
| Geräteübergreifende Wiedererkennung | Kein Cookie, kein Storage, kein Identifier, kein Login |

Der Zustand liegt in `assets/js/ui/app.js` in der Variablen `zustand` und wird nur im
Arbeitsspeicher gehalten. Ein Neuladen der Seite löscht ihn vollständig.

## 2. Invariante: keine Speicherung

Verbindlich für jede ausgelieferte Datei:

- kein `localStorage`,
- kein `sessionStorage`,
- keine Cookies, auch keine technisch notwendigen,
- keine Angabe in URL-Parametern oder URL-Fragmenten,
- keine Übertragung von Eingaben an Dritte,
- kein `fetch` mit Rechnerdaten.

Wie das getestet wird (`tests/e2e/privacy.spec.js`, läuft in allen vier
Playwright-Projekten):

| Test | Prüfung |
|---|---|
| keine Eingabe verlässt das Gerät | Alle Anfragen außerhalb von `http://127.0.0.1:4173` werden mitgeschnitten. Danach wird geprüft, dass keine Anfrage die eingegebene Zahl, die Kapitalertragszahl oder das errechnete Ergebnis enthält — auch nicht ohne Trennzeichen |
| es werden keine Speichermechanismen benutzt | Nach einem vollständigen Durchlauf: `localStorage.length === 0`, `sessionStorage.length === 0`, `document.cookie === ''`, `location.search === ''`, `location.hash === ''`, und die Eingabezahl kommt in der Adresse nicht vor |
| Neuladen löscht alle Eingaben | Nach `reload()` steht Schritt 1 wieder offen, die Felder sind leer und die Vorauswahlen stehen auf dem Ausgangswert |
| die Seite lädt kein Analyse-Skript, solange keine Instanz eingerichtet ist | Alle Skript-Anfragen werden erfasst; außerhalb des eigenen Ursprungs darf keine auftreten |
| kein Geheimnis liegt im Auslieferungscode | `config.js`, `analytics.js` und `ui/app.js` werden auf Token- und Schlüsselmuster geprüft |
| die Datenschutzseite nennt die nicht erhobenen Angaben ausdrücklich | Die Textseite muss die Begriffe `localStorage`, `sessionStorage`, `Cookies`, `Einkommen`, `Haushaltstyp` und `politische Einstellung` enthalten |

Jeder dieser Tests ist ein Regressionsschutz. Wer eine Speicherung einführt, bricht den Test.

## 3. Produktanalyse

Die Analyse ist optional und im Auslieferungszustand **aus**. Sie lädt nur, wenn in
`assets/js/config.js` ein `goatcounterKurzname` gesetzt ist. Ist der Wert `null`, wird kein
Analyseskript angefordert — die Anwendung macht dann keine einzige Anfrage an einen
Analysedienst.

Zulässige Ereignisnamen, vollständig (`ERLAUBTE_EREIGNISSE` in `assets/js/analytics.js`):

| Ereignis | Auslöser |
|---|---|
| `page_view` | Seitenaufruf |
| `calculator_started` | Erster Schritt abgeschlossen |
| `step_completed` | Ein Schritt abgeschlossen |
| `calculator_completed` | Rechner abgeschlossen |
| `source_opened` | Ein Quellenlink angeklickt |
| `methodology_opened` | Link auf die Methodenseite angeklickt |
| `support_clicked` | Unterstützen-Link angeklickt |
| `generic_js_error` | Technischer Fehler aufgetreten |

`zaehle()` prüft jeden Namen gegen diese Menge (`erlaubteMenge`) und sendet unbekannte Namen
nicht. Es gibt kein Freitextfeld in der Analyse.

Niemals gesendet:

- Einkommen, Haushaltstyp, Kinderzahl, Kapitalertrag, Leistungsbezug,
- Rechenergebnis oder dessen Richtung,
- die konkret gewählte Quelle,
- politische Einstellung oder Wahlabsicht,
- Fehlertexte, Stapelverzeichnisse oder Ausnahmen mit Nutzerdaten,
- Ereignisnamen mit angehängten Parametern.

Der Fehlerpfad sendet ausschließlich `generic_js_error`: `meldeFehler()` ruft `zaehle()` mit
einem konstanten Namen auf. Der Fehlertext und der Stack werden nicht übergeben.

## 4. Analyse kann den Rechner nicht brechen

Die Analyse ist nicht wesentlich. Das ist im Code durchgesetzt, nicht nur zugesichert:

- Das Skript wird nur eingebunden, wenn `goatcounterKurzname` gesetzt ist.
- Das Laden erfolgt `async`. Ein Ladefehler setzt nur die interne Verfügbarkeit auf `false`.
- `zaehle()` prüft zuerst `window.goatcounter` und ruft `count()` in einem `try`-Block auf.
  Ein Fehler wird geschluckt.
- Die Berechnung in `assets/js/engine/` importiert `analytics.js` nicht. Es gibt keine
  Abhängigkeit vom Analysemodul zur Rechenzeit.
- Scheitert das Laden von `data/policies/afd-2025.json`, wird `generic_js_error` gezählt und
  im Ergebnisbereich eine sachliche Meldung angezeigt; es wird kein Ergebnis ausgegeben.

## 5. Unterstützen-Link

Der Unterstützen-Link folgt einer strikten Enthaltungsregel:

- Auslieferungszustand: `unterstuetzen.aktiv: false`, `unterstuetzen.url: null`. Der Bereich
  `#unterstuetzen-bereich` ist dann `hidden` und wird nicht mit Inhalt gefüllt
  (`renderUnterstuetzen()` in `assets/js/ui/app.js`).
- Angezeigt wird der Link nur, wenn `aktiv` gesetzt ist **und** eine Adresse vorliegt.
- Kein Zahlungs-Widget, kein Skript eines Zahlungsdienstes, kein vorgeladenes `iframe`. Der
  Kontakt zum Anbieter entsteht erst durch den Klick des Nutzers.
- Der Link ist ein externer Link mit `target="_blank"` und
  `rel="noopener noreferrer"`.
- Gemessen wird ausschließlich, dass der Link angeklickt wurde (`support_clicked`). Nicht
  gemessen werden: wer gezahlt hat, in welcher Höhe, unter welcher Identität oder mit
  welcher Transaktionskennung.
- Der Text weist aus, dass die Zahlung freiwillig und ohne Gegenleistung ist und dass es
  sich nicht um eine steuerlich abzugsfähige Spende handelt.
- Keine Stelle im ausgelieferten Code enthält einen Bezahl-Schlüssel, ein Konto oder eine
  Kennung. Jede künftige Integration läuft über die Konfiguration und ist damit sichtbar.

Dieselbe Haltung gilt für den öffentlichen Zähler: `oeffentlicherZaehler.aktiv` ist im
Auslieferungszustand `false`. Ist er aktiv, zeigt er genau die gezählte Zahl, mit einer
Beschriftung, die dem entspricht, was tatsächlich gezählt wird. Er nennt keine Personen und
wird nicht als Druckmittel eingesetzt.

## 6. Hosting

Die Auslieferung erfolgt über GitHub Pages. Beim Abruf verarbeitet GitHub technisch
notwendige Verbindungsdaten, insbesondere die IP-Adresse, um die Seite auszuliefern. Darauf
hat der Betreiber keinen Einfluss; es gelten die Datenschutzhinweise von GitHub. Ein eigener
Server wird nicht betrieben, es gibt keine Anmeldung und keine Datenbank.

Der lokale Entwicklungsserver `tools/serve.mjs` bindet ausschließlich an `127.0.0.1`, liefert
nur Dateien aus dem Projektverzeichnis, normalisiert Pfade gegen Ausbrüche aus dem Wurzel-
verzeichnis und setzt `cache-control: no-store` sowie `x-content-type-options: nosniff`.
Er ist ein Entwicklungswerkzeug und nicht für den öffentlichen Betrieb gedacht.

## 7. Sicherheitslage im Auslieferungszustand

- Kein Inline-Skript und kein Inline-Style in den fünf HTML-Dateien. Geprüft: die Dateien
  enthalten weder `<script>`-Blöcke noch `style=`- oder `onclick=`-Attribute.
- Keine externen Skripte im Auslieferungszustand. GoatCounter wird nur bei gesetztem
  Kurznamen geladen, sonst findet keine externe Skriptanfrage statt.
- Keine externen Schriftarten, keine CDN-Abhängigkeiten, keine Fremdbibliotheken.
- Keine Geheimnisse im Frontend. Die GoatCounter-API-Schnittstelle ist eine reine
  Leseschnittstelle für Metriken und gehört ausschließlich in ein GitHub-Actions-Secret
  (siehe `docs/METRICS.md`).

**Empfehlung für den öffentlichen Betrieb:** GitHub Pages erlaubt keine eigenen
HTTP-Sicherheitsheader. Die praktikable Option ist ein
`<meta http-equiv="Content-Security-Policy" content="…">` in den HTML-Dateien. Da im
Auslieferungszustand weder Inline-Skripte noch Inline-Styles noch externe Skripte vorkommen,
ist eine enge Richtlinie umsetzbar, zum Beispiel `default-src 'self'` mit `script-src 'self'`
und `style-src 'self'`. Wird GoatCounter aktiviert, muss `script-src` um `https://gc.zgo.at`
und `connect-src` um `https://<kurzname>.goatcounter.com` erweitert werden. Derzeit ist
**keine** CSP-Metazeile im Repository vorhanden; das ist eine offene Verbesserung, keine
beschlossene Maßnahme.

## 8. Was die Invarianten brechen würde

Diese Änderungen sind unzulässig und würden Tests oder Zusicherungen verletzen:

- eine Speicherung in `localStorage`, `sessionStorage` oder Cookies einführen,
- Zustand in URL-Parameter oder -Fragment schreiben,
- Rechnerdaten an einen Endpunkt senden, auch zu Debug- oder Fehlerzwecken,
- einen Ereignisnamen mit angehängtem Parameter senden (Einkommen, Stufe, Kinderzahl,
  Ergebnis),
- Fehlertext oder Stack an die Analyse übergeben,
- einen API-Schlüssel, ein Token oder ein Geheimnis in `assets/` ablegen,
- ein Analyseskript, eine Schriftart oder eine Bibliothek von einem Fremdhost laden, ohne
  die Konsequenz für Datenschutz und CSP zu dokumentieren,
- den Unterstützen-Link als eingebettetes Widget einbinden,
- einen Zähler einbauen, der Personen oder Ereignisse identifizierbar macht.

## 9. Umgang mit Geheimnissen

- Die GoatCounter-API-Schnittstelle wird ausschließlich serverseitig in GitHub Actions
  verwendet und als Actions-Secret gespeichert.
- Sie erscheint niemals in `assets/`, in `data/` oder in einer HTML-Datei.
- `assets/js/config.js` enthält ausdrücklich nur den Kurznamen der Instanz und den Hinweis,
  dass der Schlüssel dort nicht hingehört.
- Ein Secret, das versehentlich im Frontend landet, gilt als kompromittiert und wird
  rotiert, nicht gelöscht.
