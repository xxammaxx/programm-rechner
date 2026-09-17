import { test, expect } from '@playwright/test';

const EINKOMMEN = '4371';
const KAPITAL = '9876';

test('keine Eingabe verlaesst das Geraet', async ({ page }) => {
  const gesendet = [];
  page.on('request', (r) => {
    const url = r.url();
    if (url.startsWith('http://127.0.0.1:4173')) return;
    gesendet.push(`${r.method()} ${url} ${r.postData() ?? ''}`);
  });

  await page.goto('/');
  await page.fill('#einkommen', EINKOMMEN);
  await page.click('#weiter-1');
  await page.check('input[name="haushalt"][value="verheiratet"]');
  await page.click('#weiter-2');
  await page.check('input[name="kinder"][value="2"]');
  await page.click('#weiter-3');
  await page.fill('#kapital', KAPITAL);
  await page.click('#weiter-4');
  await expect(page.locator('#ergebnis')).toBeVisible();
  await page.waitForTimeout(600);

  const ergebnisText = await page.locator('#ergebnis-betrag').innerText();
  const ziffernErgebnis = ergebnisText.replace(/[^0-9]/g, '');

  const verdaechtig = gesendet.filter((s) => {
    const ohneTrennzeichen = s.replace(/[.\s]/g, '');
    return (
      ohneTrennzeichen.includes(EINKOMMEN) ||
      ohneTrennzeichen.includes(KAPITAL) ||
      (ziffernErgebnis.length > 3 && ohneTrennzeichen.includes(ziffernErgebnis))
    );
  });

  expect(
    verdaechtig,
    `Diese Anfragen enthielten Rechnerdaten: ${verdaechtig.join(' | ')}`,
  ).toEqual([]);
});

test('es werden keine Speichermechanismen benutzt', async ({ page }) => {
  await page.goto('/');
  await page.fill('#einkommen', EINKOMMEN);
  await page.click('#weiter-1');
  await page.click('#weiter-2');
  await page.check('input[name="kinder"][value="3"]');
  await page.click('#weiter-3');
  await page.click('#weiter-4');
  await expect(page.locator('#ergebnis')).toBeVisible();

  const speicher = await page.evaluate(() => ({
    localStorage: window.localStorage.length,
    sessionStorage: window.sessionStorage.length,
    cookies: document.cookie,
    url: window.location.href,
    fragment: window.location.hash,
    suche: window.location.search,
  }));

  expect(speicher.localStorage).toBe(0);
  expect(speicher.sessionStorage).toBe(0);
  expect(speicher.cookies).toBe('');
  expect(speicher.url).not.toContain(EINKOMMEN);
  expect(speicher.fragment).toBe('');
  expect(speicher.suche).toBe('');
});

test('Neuladen loescht alle Eingaben', async ({ page }) => {
  await page.goto('/');
  await page.fill('#einkommen', EINKOMMEN);
  await page.click('#weiter-1');
  await page.check('input[name="haushalt"][value="verheiratet"]');
  await page.click('#weiter-2');
  await page.check('input[name="kinder"][value="2"]');
  await page.click('#weiter-3');
  await expect(page.locator('#schritt-4')).toBeVisible();

  await page.reload();

  await expect(page.locator('#schritt-1')).toBeVisible();
  await expect(page.locator('#einkommen')).toHaveValue('');
  await expect(page.locator('input[name="modus"][value="brutto"]')).toBeChecked();
  await expect(page.locator('input[name="haushalt"][value="allein"]')).toBeChecked();
  await expect(page.locator('input[name="kinder"][value="0"]')).toBeChecked();
  await expect(page.locator('#ergebnis')).toBeHidden();
});

test('die Seite laedt kein Analyse-Skript, solange keine Instanz eingerichtet ist', async ({ page }) => {
  const skripte = [];
  page.on('request', (r) => {
    if (r.resourceType() === 'script') skripte.push(r.url());
  });
  await page.goto('/');
  await page.waitForTimeout(600);
  const extern = skripte.filter((u) => !u.startsWith('http://127.0.0.1:4173'));
  expect(extern, `Unerwartete externe Skripte: ${extern.join(', ')}`).toEqual([]);
});

test('kein Geheimnis liegt im Auslieferungscode', async ({ page }) => {
  const dateien = [
    '/assets/js/config.js',
    '/assets/js/analytics.js',
    '/assets/js/ui/app.js',
  ];
  for (const datei of dateien) {
    const antwort = await page.request.get(datei);
    const inhalt = await antwort.text();
    for (const muster of [/ghp_[A-Za-z0-9]{20,}/, /github_pat_/, /api[_-]?key\s*[:=]\s*["'][^"']+["']/i]) {
      expect(muster.test(inhalt), `${datei} enthaelt ein moegliches Geheimnis (${muster})`).toBe(false);
    }
  }
});

test('die Datenschutzseite nennt die nicht erhobenen Angaben ausdruecklich', async ({ page }) => {
  await page.goto('/datenschutz.html');
  const text = await page.locator('main').innerText();
  for (const begriff of ['localStorage', 'sessionStorage', 'Cookies', 'Einkommen', 'Haushaltstyp', 'politische Einstellung']) {
    expect(text).toContain(begriff);
  }
});
