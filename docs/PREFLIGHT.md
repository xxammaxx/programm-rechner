# PRE-FLIGHT — Mandatory gate before repository mutation

Status: **PRE-FLIGHT = PASS**
Recorded: 2026-09-17
Rule enforced: `NO_MUTATION_BEFORE_PREFLIGHT_PASS = TRUE`

This record was produced by Recon → Environment Inspection → Read-Set → Reality
Acquisition → MCP/Tool Readiness. No product file was created before this gate passed.

---

## 1. Environment

| Item | Value |
|---|---|
| Working directory | `/home/xxammaxx/Schreibtisch/AFD_Diskredit_website` (empty at start, not a git repo) |
| Node.js | v24.11.1 |
| npm | 11.6.2 |
| Python | 3.12.3 |
| git | 2.43.0 |
| gh CLI | 2.98.0, authenticated as `xxammaxx` (keyring) |
| gh token scopes | includes `repo`, `workflow`, `admin:repo_hook`, `delete_repo` |
| Playwright | 1.63.0 — browsers present: `chromium-1243`, `chromium_headless_shell-1243`, `android-1001` |
| PDF tooling | `pdftotext`, `pdfinfo` present |
| Existing project governance | **none** (empty directory) |

## 2. MCP / tool readiness

No MCP servers are configured for this workspace. Therefore:

- GitHub mutations (repository creation, issues, comments) are performed through the
  authenticated `gh` CLI.
- This is recorded as the project's GitHub governance in `AGENTS.md`.
- A visible browser (Playwright) path IS available and is used for behavioural,
  perceptual and production verification, but not as the mutation channel, because no
  governance requiring that exists and `gh` is authenticated with the needed scopes.

## 3. Network reachability of primary sources

| Host | Result |
|---|---|
| www.afd.de | 200 |
| www.bundesfinanzministerium.de | 302 (reachable) |
| www.zew.de | 200 |
| www.gesetze-im-internet.de | 200 |
| github.com | 200 |

## 4. Read-set (acquired and independently verified)

### 4.1 Political source of truth — AfD Bundestagswahlprogramm 2025 (final, adopted)

- URL: `https://www.afd.de/wp-content/uploads/2025/02/AfD_Bundestagswahlprogramm2025_druck.pdf`
- Document fingerprint: PDF title `BTW25_AfD_Programm_2025-02-03_176_Innenseiten.indd`,
  166 pages, file date 2025-02-03.
- Adoption clause verified verbatim on the front matter: *"Das vorliegende Wahlprogramm
  für die Bundestagswahl 2025 wurde auf dem 16. Bundesparteitag der Alternative für
  Deutschland vom 11. bis zum 12. Januar 2025 in Riesa beraten und einstimmig
  verabschiedet."*
- A **pre-congress draft** (`Leitantrag`, Stand 28.11.2024) also exists and differs from
  the adopted programme. It is NOT the source of truth. See §5.

### 4.2 Baseline law — German income tax, assessment year 2026

Verified verbatim from primary legal sources (retrieved 2026-09-17):

- § 32a Abs. 1 EStG (VZ 2026) — `https://www.gesetze-im-internet.de/estg/__32a.html`
  Grundfreibetrag 12 348 €; zone formulas; floor-to-euro rules.
- § 32 Abs. 6 EStG — Kinderfreibetrag 3 414 € + BEA 1 464 € (= 4 878 € per parent,
  9 756 € bei Zusammenveranlagung).
- § 66 Abs. 1 EStG — Kindergeld 259 €/Monat.
- § 9a Satz 1 Nr. 1 lit. a EStG — Arbeitnehmer-Pauschbetrag 1 230 €.
- § 10c EStG — Sonderausgaben-Pauschbetrag 36 € (72 € bei Zusammenveranlagung).
- § 20 Abs. 9 EStG — Sparer-Pauschbetrag 1 000 € / 2 000 €.
- SolzG 1995 § 3 Abs. 3 — Freigrenzen 20 350 € / 40 700 €.
- SolzG 1995 § 4 — 5,5 %; Milderungszone max. 11,9 % des Überschusses.
- SolzG 1995 § 3 Abs. 2 — Bemessungsgrundlage ist die ESt, die **unter
  Berücksichtigung der Freibeträge nach § 32 Abs. 6 in allen Fällen** festzusetzen wäre.
- Enacting statute: Steuerfortentwicklungsgesetz (SteFeG) vom 23.12.2024,
  BGBl. 2024 I Nr. 449.

### 4.3 Official BMF calculation specification (the authorised engine reference)

- **BMF-Programmablaufplan 2026**, BMF-Schreiben vom 12.11.2025,
  GZ IV C 5 - S 2361/00025/016/028, "Stand: 12.11.2025 (endgültig)".
  Published under § 39b Abs. 6 EStG — legally binding calculation specification.
  - Anlage 1 (machine LSt/SolZ): retrieved, 40 pp. Modules read: `MZTABFB`, `MLSTJAHR`,
    `UPMLST`/`UPTAB26`, `MSOLZ`, `UPEVP`, `MVSPHB`.
  - Anlage 2 (Lohnsteuertabellen specification): retrieved, 22 pp.,
    "Stand: 12.11.2025 (endgültig, korrigierte Fassung)".
- Official parameters confirmed from the PAP itself: `GFB = 12348`, `SOLZFREI = 20350`,
  `BBGRVALV = 101400`, `BBGKVPV = 69750`, `RVSATZAN = 0,0930`, Kinderfreibetrag
  `4 878 / 9 756`, durchschnittlicher Zusatzbeitragssatz GKV 2026 = **2,9 %**,
  ermäßigter KV-Beitragssatz § 243 SGB V = 14,0 %, PV 3,60 %, ALV 2,6 %,
  RV 18,6 %.
- The official `UPTAB26` tariff flowchart and the `MSOLZ` Soli flowchart were read and
  are used as an **independent second implementation** for reference testing
  (see `tests/reference/`).
- `https://www.bmf-steuerrechner.de/interface/2026Version1.xhtml` exists but requires a
  registered access code, so it could not be used as a live oracle. The PAP was used
  instead; the PAP is the normative specification behind that service.

### 4.4 External research model (reference only, never a derivation source)

- ZEW Gutachten, Hebsaker/Stichnoth, *"Reformvorschläge der Parteien zur Bundestagswahl
  2025: Finanzielle Auswirkungen"*, Mannheim, 17./20. Januar 2025.
  `https://zew.de/fileadmin/FTP/gutachten/Bundestagswahlprogramme_ZEW_2025.pdf`
- Model: ZEW-EviSTA microsimulation; data SOEP v36 (survey year 2019); **legal baseline
  Rechtsstand Juli 2024** — i.e. *not* 2026 and *not* 2025.
- Scope limit stated by ZEW: *"Maßnahmen, die nicht an den verfügbaren Einkommen, sondern
  der Kaufkraft ansetzen (Mehrwertsteuer, CO2-Bepreisung), sind ebenfalls nicht Teil der
  Analyse."* and *"Die Ergebnisse gelten somit nicht für die Wahlprogramme als Ganzes."*
- Reported AfD fiscal effect: ≈ 97 Mrd. €.

## 5. Verified SOURCE CONFLICT (the conflict the brief required to be checked)

The brief requires that a known divergence between the ZEW January 2025 model and the
final AfD programme be explicitly verified. It was verified, and it is real:

| Item | ZEW model (Jan 2025) | Final adopted AfD programme | Verdict |
|---|---|---|---|
| Sparer-Pauschbetrag | **2 400 €** (no source footnote) | **6 672 €** ("Erhöhung Sparerpauschbetrag", printed p. 60) | **CONFLICT CONFIRMED** |

- The value 2 400 € matches the **pre-congress `Leitantrag` (Stand 28.11.2024)**, which
  ZEW cites elsewhere in the same paragraph — but not the text adopted at Riesa.
- The adopted programme reads verbatim: *"Die AfD will den Sparerpauschbetrag auf 6.672
  Euro erhöhen und an die Geringfügigkeitsgrenze koppeln …"*
- ZEW does **not** flag this divergence anywhere in the document.

A second, independent divergence was also verified:

| Item | ZEW AfD bullet | Programme text | Verdict |
|---|---|---|---|
| Werbungskostenpauschale 2 000 € / Kinderfreibetrag 12 000 € | modelled by ZEW with footnote | Strings `Werbungskostenpauschale` and `Pendlerpauschale` occur **0 times** in the 166-page programme | Source is **BT-Drucksache 20/13356** (AfD-Fraktion motion of 15.10.2024), *not* the Wahlprogramm |

Consequence, applied as a hard rule (`SOURCE_CONFLICT = FAIL_CLOSED`):

1. The calculator uses the **final adopted programme** for every programme description.
2. ZEW parameters are **never** mixed into a programme rule.
3. ZEW is carried only as a separate, clearly-labelled external model/reference.
4. Policies whose only support is a non-programme document (BT-Drucksache 20/13356) are
   **excluded from the V1 calculation** and documented as excluded.

## 6. Gate decision

| Gate | Result |
|---|---|
| Environment inspected | PASS |
| Read-set established | PASS |
| Reality Acquisition completed | PASS |
| Primary sources independently verified | PASS |
| SOURCE CONFLICT detected and handled fail-closed | PASS |
| MCP/tool readiness | PASS (no MCP configured; `gh` authenticated) |

**PRE-FLIGHT = PASS → repository mutation authorised.**
