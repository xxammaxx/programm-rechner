import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

// Sichtnachweis: es werden echte, gerenderte Bilder der Pflicht-Viewports erzeugt und
// abgelegt. DOM-Zusicherungen allein genuegen nicht.

const VIEWPORTS = [
  { name: '360', width: 360, height: 780 },
  { name: '390', width: 390, height: 844 },
  { name: '412', width: 412, height: 915 },
];

const AUSGABE = 'tests/visual';

async function schuss(page, viewportName, seite) {
  await mkdir(AUSGABE, { recursive: true });
  await page.screenshot({
    path: `${AUSGABE}/${viewportName}-${seite}.png`,
    fullPage: true,
  });
}

for (const vp of VIEWPORTS) {
  test(`Sichtnachweis bei ${vp.width} Pixel Breite`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });

    await page.goto('/');
    await expect(page.locator('#schritt-1')).toBeVisible();
    await schuss(page, vp.name, '1-einkommen');

    await page.fill('#einkommen', '3.500');
    await page.click('#weiter-1');
    await expect(page.locator('#schritt-2')).toBeVisible();
    await schuss(page, vp.name, '2-haushalt');

    await page.check('input[name="haushalt"][value="verheiratet"]');
    await page.click('#weiter-2');
    await page.check('input[name="kinder"][value="2"]');
    await page.click('#weiter-3');
    await expect(page.locator('#schritt-4')).toBeVisible();
    await schuss(page, vp.name, '3-kinder-vor-kapital');

    await page.fill('#kapital', '4.000');
    await page.click('#weiter-4');
    await expect(page.locator('#ergebnis')).toBeVisible();
    await schuss(page, vp.name, '4-ergebnis');

    // Rechenweg aufgeklappt
    const knopf = page.locator('#karten .karte button', { hasText: 'Rechenweg ansehen' }).first();
    await knopf.click();
    await expect(page.locator('#karten .rechenweg').first()).toBeVisible();
    await schuss(page, vp.name, '5-rechenweg');
  });
}

for (const vp of VIEWPORTS) {
  test(`Textseiten bei ${vp.width} Pixel Breite`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const pfad of ['methodik.html', 'quellen.html', 'datenschutz.html', 'impressum.html']) {
      await page.goto(`/${pfad}`);
      await expect(page.locator('h1')).toBeVisible();
      await schuss(page, vp.name, `seite-${pfad.replace('.html', '')}`);
    }
  });
}

test('der Eingabeschritt passt vollstaendig in den ersten Bildschirm', async ({ page }) => {
  // Ziel: erste sinnvolle Handlung in etwa einer Minute. Das Feld muss ohne Scrollen
  // sichtbar und bedienbar sein.
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  const feld = await page.locator('#einkommen').boundingBox();
  expect(feld.y + feld.height).toBeLessThan(780);
  await expect(page.locator('#weiter-1')).toBeInViewport();
});

test('das Ergebnis ist ohne Scrollen als Ergebnis erkennbar', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto('/');
  await page.fill('#einkommen', '3.500');
  await page.click('#weiter-1');
  await page.click('#weiter-2');
  await page.click('#weiter-3');
  await page.click('#ueberspringen-4');
  await expect(page.locator('.ergebnis__label')).toBeInViewport();
  await expect(page.locator('#ergebnis-betrag')).toBeInViewport();
  await expect(page.locator('#ergebnis-monat')).toBeInViewport();
});
