# Facebook-Startbeitrag — Entwurf, NICHT veröffentlichungsfähig

**Status: `FACEBOOK_POST = PREPARED_DRAFT_BLOCKED`**

Dieser Entwurf darf **nicht** veröffentlicht werden. Der Beitrag setzt vier Bedingungen
voraus, die derzeit nicht alle erfüllt sind:

| Bedingung | Stand | Beleg |
|---|---|---|
| `CALCULATION_ENGINE_VALIDATED=PASS` | **PASS** | `npm test` (88/88), `npm run check` (130/130, `CODE_TRUTH = PASS`), Abgleich mit `UPTAB26` und `MSOLZ` des BMF-Programmablaufplans 2026 |
| `DEPLOYMENT=PASS` | **offen** | GitHub Pages ist bewusst nicht eingeschaltet; kein Lauf hat veröffentlicht |
| `PUBLIC_URL=VERIFIED` | **offen** | es gibt keine veröffentlichte Adresse, die unabhängig geprüft werden könnte |
| `LEGAL_GATE=PASS` | **offen** | `LEGAL_OWNER_DATA=REQUIRED_FOR_PUBLICATION`, Klassifizierung `BLOCKED_EXTERNAL_OWNER_ACTION` |

Es fehlt ausschliesslich eine Handlung des Betreibers: die nach § 5
Digitale-Dienste-Gesetz erforderlichen Angaben in `assets/js/config.js` unter
`KONFIGURATION.betreiber` eintragen und `vorhanden` auf `true` setzen. Danach veröffentlicht
der nächste Push automatisch, die Adresse wird unabhängig geprüft, und der Beitrag kann mit
der dann tatsächlichen Adresse fertiggestellt werden.

`FACEBOOK_IN_APP_BROWSER_PROOF=NOT_PROVEN` — ein echter Aufruf im In-App-Browser von
Facebook wurde nicht getestet. Das wird hier festgehalten und nicht vorgetäuscht.

---

## Entwurf des Beitrags

<!--
Anweisung an den Betreiber: [PRODUKTIONS-ADRESSE] erst nach bestandener Veröffentlichung
durch die dann tatsächliche Adresse ersetzen. Den Text nicht für eine Zielgruppe, eine
Region, einen Wählertyp, Wut, Angst oder politische Konversion umschreiben.
-->

Ich habe einen kleinen Rechner gebaut, der zeigt, welche direkt berechenbaren Auswirkungen
ausgewählter Vorschläge des AfD-Bundestagswahlprogramms 2025 auf einen Haushalt haben
könnten.

Rechenweg, Annahmen und Originalquellen sind offen einsehbar.

👉 [PRODUKTIONS-ADRESSE]

Die Seite gibt keine Wahlempfehlung und berechnet nur das, was sich belastbar berechnen
lässt.

---

## Was der Beitrag bewusst nicht tut

- keine Wahlempfehlung, weder ausdrücklich noch angedeutet
- keine Rangfolge von Parteien
- keine Angriffs-, Angst- oder Empörungssprache
- keine Ansprache bestimmter Wählergruppen, Regionen oder Demografien
- keine Zuspitzung auf ein Ergebnis zugunsten oder zulasten einer Partei
- keine Aussage, die das Programm als Ganzes bewertet

## Was vor dem Veröffentlichen zu prüfen ist

1. `npm run verify:world <veröffentlichte Adresse>` muss `WORLD_TRUTH = PASS` melden.
2. `impressum.html` muss die vollständigen Betreiberangaben zeigen.
3. Die Adresse muss in der Vorschau von Facebook korrekt erscheinen: Titel, Beschreibung
   und Vorschaubild (`assets/img/vorschau.png`, 1200 × 630 Pixel).
4. Der Beitrag darf erst dann abgesendet werden, wenn die ersten drei Punkte belegt sind.
