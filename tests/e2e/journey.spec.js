import { test, expect } from '@playwright/test';

// Vollstaendige Reise durch den Rechner. Laeuft auf allen vier Projekten, also auf
// 360, 390, 412 Pixel Breite und auf Desktop.

async function durchlaufe(side, { einkommen = '3.500', haushalt = 'verheiratet', kinder = '2', kapital = '4000' } = {}) {
  await side.goto('/');
  await expect(side.locator('#schritt-1')).toBeVisible();
  await side.fill('#einkommen', einkommen);
  await side.click('#weiter-1');
  await expect(side.locator('#schritt-2')).toBeVisible();

  await side.check(`input[name="haushalt"][value="${haushalt}"]`);
  await side.click('#weiter-2');
  await expect(side.locator('#schritt-3')).toBeVisible();

  await side.check(`input[name="kinder"][value="${kinder}"]`);
  await side.click('#weiter-3');
  await expect(side.locator('#schritt-4')).toBeVisible();

  if (kapital !== null) {
    await side.fill('#kapital', kapital);
    await side.click('#weiter-4');
  } else {
    await side.click('#ueberspringen-4');
  }

  await expect(side.locator('#ergebnis')).toBeVisible();
}

async function keineWaagerechteBewegung(side) {
  const breiten = await side.evaluate(() => ({
    dokument: document.documentElement.scrollWidth,
    sichtbar: document.documentElement.clientWidth,
  }));
  expect(
    breiten.dokument,
    `Seite ist ${breiten.dokument} Pixel breit, sichtbar sind ${breiten.sichtbar}`,
  ).toBeLessThanOrEqual(breiten.sichtbar + 1);
}

test('die Seite laedt ohne Skriptfehler', async ({ page }) => {
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') fehler.push(m.text());
  });
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('berechenbare Vorschläge');
  expect(fehler).toEqual([]);
});

test('der Pflichthinweis steht auf jeder Ansicht oben', async ({ page }) => {
  await page.goto('/');
  const hinweis = page.locator('.hinweis--pflichthinweis').first();
  await expect(hinweis).toBeVisible();
  await expect(hinweis).toContainText('keine Wahlempfehlung');
  await expect(hinweis).toContainText('keine vollständige Bewertung des Programms');
});

test('der erste Schritt fragt nach dem Monatseinkommen und schlaegt Brutto vor', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#frage-1')).toHaveText('Wie viel verdienst du ungefähr im Monat?');
  await expect(page.locator('input[name="modus"][value="brutto"]')).toBeChecked();
  await expect(page.locator('#modus-hinweis')).toContainText('Mit Brutto können wir genauer rechnen');
});

test('die Seite fragt nicht nach Name, E-Mail, Anschrift, Arbeitgeber oder Wahlabsicht', async ({ page }) => {
  await page.goto('/');
  const text = (await page.locator('body').innerText()).toLowerCase();
  for (const verboten of ['name', 'e-mail', 'email', 'telefon', 'arbeitgeber', 'wahlabsicht', 'parteimitglied']) {
    expect(text, `Die Seite darf nicht nach "${verboten}" fragen`).not.toContain(`dein ${verboten}`);
  }
  const eingaben = await page.locator('input').evaluateAll((felder) =>
    felder.map((f) => `${f.type}:${f.name}:${f.autocomplete}`),
  );
  expect(eingaben.join(' ')).not.toContain('email');
  expect(eingaben.join(' ')).not.toContain('password');
});

test('der Rechner laeuft auf allen Viewports vollstaendig durch', async ({ page }) => {
  await durchlaufe(page);
  await expect(page.locator('#ergebnis-betrag')).toContainText('€');
  await expect(page.locator('#ergebnis-monat')).toContainText('im Monat');
});

test('es gibt kein waagerechtes Scrollen', async ({ page }) => {
  await page.goto('/');
  await keineWaagerechteBewegung(page);
  await page.fill('#einkommen', '3500');
  await page.click('#weiter-1');
  await keineWaagerechteBewegung(page);
  await durchlaufe(page);
  await keineWaagerechteBewegung(page);
  for (const pfad of ['methodik.html', 'quellen.html', 'datenschutz.html', 'impressum.html']) {
    await page.goto(`/${pfad}`);
    await keineWaagerechteBewegung(page);
  }
});

test('monetaere Felder nutzen die numerische Tastatur', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#einkommen')).toHaveAttribute('inputmode', 'decimal');
  await page.fill('#einkommen', '3000');
  await page.click('#weiter-1');
  await page.click('#weiter-2');
  await page.click('#weiter-3');
  await expect(page.locator('#kapital')).toHaveAttribute('inputmode', 'decimal');
});

test('Fortschnittsanzeige und Zurueckgehen funktionieren', async ({ page }) => {
  await page.goto('/');
  await page.fill('#einkommen', '3000');
  await page.click('#weiter-1');
  await expect(page.locator('#fortschritt-text')).toHaveText('Schritt 2 von 4');
  await expect(page.locator('#fortschritt-balken')).toHaveAttribute('value', '2');
  await page.click('#zurueck-2');
  await expect(page.locator('#schritt-1')).toBeVisible();
  await expect(page.locator('#fortschritt-text')).toHaveText('Schritt 1 von 4');
});

test('eine ungueltige Eingabe wird verstaendlich abgefangen', async ({ page }) => {
  await page.goto('/');
  await page.fill('#einkommen', '');
  await page.click('#weiter-1');
  await expect(page.locator('#einkommen-fehler')).toContainText('größer als 0');
  await expect(page.locator('#schritt-1')).toBeVisible();

  await page.fill('#einkommen', 'abc');
  await page.click('#weiter-1');
  await expect(page.locator('#einkommen-fehler')).toBeVisible();
  await expect(page.locator('#schritt-1')).toBeVisible();
});

test('deutsche Zahlenschreibweise mit Tausenderpunkt wird verstanden', async ({ page }) => {
  await page.goto('/');
  await page.fill('#einkommen', '2.500');
  await page.click('#weiter-1');
  await expect(page.locator('#schritt-2')).toBeVisible();
  await page.click('#zurueck-2');
  await page.fill('#einkommen', '1.234,50');
  await page.click('#weiter-1');
  await expect(page.locator('#schritt-2')).toBeVisible();
});

test('das Ergebnis weist die Berechnungsabdeckung offen aus', async ({ page }) => {
  await durchlaufe(page);
  const abdeckung = page.locator('#abdeckung-liste');
  await expect(abdeckung).toContainText('Vorschläge direkt berechnet');
  await expect(abdeckung).toContainText('nur als Modellannahme');
  await expect(abdeckung).toContainText('nicht in Euro bewertet');
  await expect(abdeckung).toContainText('nicht das AfD-Programm als Ganzes');
});

test('das Ergebnis nennt den Hinweis auf Transferleistungen', async ({ page }) => {
  await durchlaufe(page);
  const hinweis = page.locator('#transfer-hinweis');
  await expect(hinweis).toBeVisible();
  await expect(hinweis).toContainText('Wohngeld');
  await expect(hinweis).toContainText('Bürgergeld');
});

test('jeder bewertete Vorschlag ist als berechnet oder als Modellannahme gekennzeichnet', async ({ page }) => {
  await durchlaufe(page);
  const marken = await page.locator('#karten .marke').allTextContents();
  expect(marken.length).toBeGreaterThan(0);
  for (const m of marken) {
    expect(['Direkt berechnet', 'Modellannahme', 'Nicht seriös in Euro berechenbar']).toContain(m.trim());
  }
});

test('jeder Vorschlag verlinkt die Originalquelle', async ({ page }) => {
  await durchlaufe(page);
  const quellen = page.locator('#karten .karte a', { hasText: 'Quelle ansehen' });
  const anzahl = await quellen.count();
  expect(anzahl).toBeGreaterThan(0);
  for (let i = 0; i < anzahl; i += 1) {
    const href = await quellen.nth(i).getAttribute('href');
    expect(href).toMatch(/^https:\/\//);
    expect(await quellen.nth(i).getAttribute('target')).toBe('_blank');
    expect(await quellen.nth(i).getAttribute('rel')).toContain('noopener');
  }
});

test('der Rechenweg laesst sich aufklappen und zeigt Annahmen', async ({ page }) => {
  await durchlaufe(page);
  const knopf = page.locator('#karten .karte button', { hasText: 'Rechenweg ansehen' }).first();
  await expect(knopf).toHaveAttribute('aria-expanded', 'false');
  await knopf.click();
  await expect(knopf).toHaveAttribute('aria-expanded', 'true');
  const rechenweg = page.locator('#karten .rechenweg').first();
  await expect(rechenweg).toBeVisible();
  await expect(rechenweg).toContainText('zu versteuerndes Einkommen');
});

test('Programmpunkte ohne Eurobetrag werden mit Begruendung ausgewiesen', async ({ page }) => {
  await durchlaufe(page);
  const karten = page.locator('#karten-nicht-bewertet .karte');
  expect(await karten.count()).toBeGreaterThan(0);
  await expect(page.locator('#karten-nicht-bewertet')).toContainText('Nicht seriös in Euro berechenbar');
});

test('nicht bewertete Programmpunkte werden im Ergebnis nicht mit Eurobetrag genannt', async ({ page }) => {
  await durchlaufe(page);
  const text = await page.locator('#karten-nicht-bewertet').innerText();
  for (const wirkung of text.match(/\d+ € \/ Jahr/g) ?? []) {
    throw new Error(`Nicht bewerteter Punkt enthaelt einen Eurobetrag: ${wirkung}`);
  }
});
