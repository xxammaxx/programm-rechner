import { test, expect } from '@playwright/test';

// Bei einer Netto-Angabe darf niemals eine scheinbar genaue Einzelzahl erscheinen.
// Das Brutto wird aus einem Modell zurueckgerechnet und als Bandbreite ausgewiesen.

test('Netto-Modus zeigt eine Bandbreite statt einer genauen Zahl', async ({ page }) => {
  await page.goto('/');
  await page.fill('#einkommen', '2.400');
  await page.check('input[name="modus"][value="netto"]');
  await page.click('#weiter-1');
  await page.click('#weiter-2');
  await page.click('#weiter-3');
  await page.click('#ueberspringen-4');

  await expect(page.locator('#ergebnis')).toBeVisible();
  const betrag = await page.locator('#ergebnis-betrag').innerText();
  expect(betrag).toContain('bis');
  expect(betrag).toContain('€');
  expect(betrag).toContain('/ Jahr');
});

test('Netto-Modus erklaert die Rueckrechnung und nennt das geschaetzte Brutto', async ({ page }) => {
  await page.goto('/');
  await page.fill('#einkommen', '2.400');
  await page.check('input[name="modus"][value="netto"]');
  await page.click('#weiter-1');
  await page.click('#weiter-2');
  await page.click('#weiter-3');
  await page.click('#ueberspringen-4');

  const zusatz = await page.locator('#ergebnis-zusatz').innerText();
  expect(zusatz).toContain('Nettoeinkommen');
  expect(zusatz).toContain('zurückgerechnet');
  expect(zusatz).toContain('nicht eindeutig');
  expect(zusatz).toContain('Bandbreite');
  expect(zusatz).toMatch(/rund [\d.]+ €/);
});

test('Netto-Modus erklaert sich schon bei der Eingabe', async ({ page }) => {
  await page.goto('/');
  await page.check('input[name="modus"][value="netto"]');
  await expect(page.locator('#modus-hinweis')).toContainText('Modell zurück');
  await expect(page.locator('#modus-hinweis')).toContainText('Bandbreite');
});

test('Brutto-Modus nennt eine genaue Zahl und kein Bis', async ({ page }) => {
  await page.goto('/');
  await page.fill('#einkommen', '3.500');
  await page.click('#weiter-1');
  await page.click('#weiter-2');
  await page.click('#weiter-3');
  await page.click('#ueberspringen-4');
  const betrag = await page.locator('#ergebnis-betrag').innerText();
  expect(betrag).not.toContain('bis');
  expect(betrag).toMatch(/[+−-]?[\d.]+\s*€\s*\/\s*Jahr/);
  await expect(page.locator('#ergebnis-zusatz')).toContainText('Bruttojahreseinkommen');
});

test('ohne Kinder und ohne Kapitalertraege wird nur bewertet, was anwendbar ist', async ({ page }) => {
  await page.goto('/');
  await page.fill('#einkommen', '5.000');
  await page.click('#weiter-1');
  await page.click('#weiter-2');
  await page.click('#weiter-3');
  await page.click('#ueberspringen-4');

  const abdeckung = await page.locator('#abdeckung-liste').innerText();
  expect(abdeckung).toContain('2 Vorschläge direkt berechnet');
  expect(abdeckung).toContain('0 Vorschlag nur als Modellannahme');
  expect(abdeckung).toContain('Nicht bewertet: Sparer-Pauschbetrag');
  expect(abdeckung).toContain('kein Kapitalertrag angegeben');
  expect(abdeckung).toContain('Nicht bewertet: Familiensplitting');
  expect(abdeckung).toContain('keine Kinder im Haushalt');
});

test('ein sehr niedriges Einkommen ergibt eine ehrliche Null statt einer erfundenen Zahl', async ({ page }) => {
  await page.goto('/');
  await page.fill('#einkommen', '900');
  await page.click('#weiter-1');
  await page.click('#weiter-2');
  await page.click('#weiter-3');
  await page.click('#ueberspringen-4');
  await expect(page.locator('#ergebnis-betrag')).toContainText('0');
});

test('ein Netto oberhalb des abbildbaren Bereichs ergibt keine erfundene Null', async ({ page }) => {
  // Der Rechner bildet Bruttoeinkommen bis 2.000.000 Euro ab. Ein Netto darueber laesst
  // sich nicht zurueckrechnen. Dann darf keine Null erscheinen, die wie ein Ergebnis wirkt.
  await page.goto('/');
  await page.fill('#einkommen', '200000');
  await page.check('input[name="modus"][value="netto"]');
  await page.click('#weiter-1');
  await page.click('#weiter-2');
  await page.click('#weiter-3');
  await page.click('#ueberspringen-4');

  const betrag = (await page.textContent('#ergebnis-betrag')).trim();
  expect(betrag).not.toMatch(/\d/);
  expect(betrag).toContain('kein Ergebnis');
  const zusatz = await page.locator('#ergebnis-zusatz').innerText();
  expect(zusatz).toContain('kein Bruttoeinkommen zurückrechnen');
  // Ohne Zahl gibt es auch keine Abdeckung und keine Vorschlagskarten.
  await expect(page.locator('#ergebnis-details')).toBeHidden();
  await expect(page.locator('#ergebnis-monat')).toBeEmpty();
});

test('der Sparer-Pauschbetrag wird ohne Kapitalertraege neutral gekennzeichnet', async ({ page }) => {
  // Der Vorschlag ist berechenbar, greift aber nicht. Er darf deshalb nicht als
  // grundsaetzlich nicht berechenbar erscheinen.
  await page.goto('/');
  await page.fill('#einkommen', '4.000');
  await page.click('#weiter-1');
  await page.click('#weiter-2');
  await page.click('#weiter-3');
  await page.click('#ueberspringen-4');

  const karte = page.locator('#karten-nicht-bewertet .karte', { hasText: 'Sparer-Pauschbetrag' }).first();
  await expect(karte).toBeVisible();
  await expect(karte.locator('.marke')).toContainText('nicht bewertet');
  await expect(karte.locator('.marke')).not.toContainText('Nicht seriös in Euro berechenbar');
  await expect(karte.locator('.karte__text').first()).toContainText('greift bei deinen Angaben aber nicht');
  // Und in der Abdeckung steht der ehrliche Grund.
  await expect(page.locator('#abdeckung-liste')).toContainText('kein Kapitalertrag angegeben');
});

test('echt nicht berechenbare Punkte behalten ihre Kennzeichnung', async ({ page }) => {
  await page.goto('/');
  await page.fill('#einkommen', '4.000');
  await page.click('#weiter-1');
  await page.click('#weiter-2');
  await page.click('#weiter-3');
  await page.click('#ueberspringen-4');

  const karte = page.locator('#karten-nicht-bewertet .karte', { hasText: 'CO₂-Abgaben' }).first();
  await expect(karte.locator('.marke')).toHaveText('Nicht seriös in Euro berechenbar');
  await expect(karte.locator('.karte__text').first()).toContainText('Verbrauch');
});
