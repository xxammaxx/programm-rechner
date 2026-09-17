import { test, expect } from '@playwright/test';

test('alle Eingabefelder haben eine Beschriftung', async ({ page }) => {
  await page.goto('/');
  for (let schritt = 1; schritt <= 4; schritt += 1) {
    await expect(page.locator(`#schritt-${schritt}`)).toBeVisible();
    const felder = await page.locator(`#schritt-${schritt} input[type="text"]`).all();
    for (const feld of felder) {
      const id = await feld.getAttribute('id');
      await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    }
    if (schritt === 1) await page.fill('#einkommen', '3000');
    await page.click(`#weiter-${schritt}`);
  }
});

test('jede Auswahlgruppe hat eine Ueberschrift', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#schritt-1 legend')).toHaveCount(1);
  await page.fill('#einkommen', '3000');
  await page.click('#weiter-1');
  await expect(page.locator('#schritt-2 legend')).toHaveCount(1);
  await page.click('#weiter-2');
  await expect(page.locator('#schritt-3 legend')).toHaveCount(1);
});

test('der Rechner ist nur mit der Tastatur bedienbar', async ({ page }) => {
  await page.goto('/');
  // Das Einkommensfeld muss ohne Maus erreichbar sein. Wie viele Schritte noetig sind,
  // haengt von der Ausgangsfokussierung des jeweiligen Browsers ab, deshalb wird gesucht.
  let erreicht = false;
  for (let i = 0; i < 5 && !erreicht; i += 1) {
    await page.keyboard.press('Tab');
    erreicht = await page.locator('#einkommen').evaluate((el) => el === document.activeElement);
  }
  expect(erreicht, 'Das Einkommensfeld war nicht per Tabulator erreichbar').toBe(true);
  await page.keyboard.type('2800');
  await expect(page.locator('#einkommen')).toHaveValue('2800');

  // Weiter ohne Maus.
  await page.locator('#weiter-1').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#schritt-2')).toBeVisible();

  // Auswahl per Tastatur.
  await page.locator('input[name="haushalt"][value="verheiratet"]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('input[name="haushalt"][value="verheiratet"]')).toBeChecked();

  await page.locator('#weiter-2').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#schritt-3')).toBeVisible();
});

test('der Fokus ist immer sichtbar', async ({ page }) => {
  await page.goto('/');
  await page.locator('#einkommen').focus();
  const umriss = await page.locator('#einkommen').evaluate((el) => {
    const s = getComputedStyle(el);
    return `${s.outlineStyle} ${s.outlineWidth}`;
  });
  expect(umriss).not.toContain('none');
  expect(umriss).not.toMatch(/^none/);

  await page.locator('#weiter-1').focus();
  const umrissKnopf = await page.locator('#weiter-1').evaluate((el) => {
    const s = getComputedStyle(el);
    return `${s.outlineStyle} ${s.outlineWidth}`;
  });
  expect(umrissKnopf).not.toMatch(/^none 0/);
});

test('die Auswahl ist nicht allein ueber Farbe erkennbar', async ({ page }) => {
  await page.goto('/');
  const brutto = page.locator('input[name="modus"][value="brutto"]');
  const netto = page.locator('input[name="modus"][value="netto"]');

  // Der Zustand liegt in echten Radiofeldern derselben Gruppe, damit Vorleseprogramme
  // ihn ankündigen. Das ist der maschinenlesbare Traeger der Information.
  for (const feld of [brutto, netto]) {
    await expect(feld).toHaveAttribute('type', 'radio');
    await expect(feld).toHaveAttribute('name', 'modus');
  }
  await expect(brutto).toBeChecked();
  await expect(netto).not.toBeChecked();
  await expect(page.getByRole('radiogroup').first()).toBeVisible();

  // Der Zustand aendert sich zusaetzlich sichtbar, nicht nur in der Textfarbe: die
  // Hintergrundflaeche der gewaehlten Option unterscheidet sich messbar.
  const flaeche = (wert) =>
    page.locator(`input[name="modus"][value="${wert}"]`).evaluate((el) => {
      const label = el.closest('label');
      const s = getComputedStyle(label);
      return `${s.backgroundColor}|${s.borderColor}|${s.color}`;
    });

  const vorher = { brutto: await flaeche('brutto'), netto: await flaeche('netto') };
  await page.check('input[name="modus"][value="netto"]');
  const nachher = { brutto: await flaeche('brutto'), netto: await flaeche('netto') };

  expect(nachher.netto, 'die gewaehlte Option muss sich sichtbar aendern').not.toBe(vorher.netto);
  expect(nachher.brutto, 'die abgewaehlte Option muss sich sichtbar aendern').not.toBe(vorher.brutto);

  // Die Umschaltung ueber die Tastatur muss ebenso funktionieren.
  await page.locator('input[name="modus"][value="brutto"]').focus();
  await page.keyboard.press('Space');
  await expect(brutto).toBeChecked();
});

test('Statusangaben sind Text, nicht nur Farbe', async ({ page }) => {
  await page.goto('/');
  await page.fill('#einkommen', '3500');
  await page.click('#weiter-1');
  await page.click('#weiter-2');
  await page.click('#weiter-3');
  await page.click('#ueberspringen-4');
  const marken = await page.locator('#karten .marke, #karten-nicht-bewertet .marke').allTextContents();
  expect(marken.length).toBeGreaterThan(0);
  for (const m of marken) expect(m.trim().length).toBeGreaterThan(4);
});

test('200 Prozent Textzoom bricht das Layout nicht', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '32px';
  });
  const masse = await page.evaluate(() => ({
    dokument: document.documentElement.scrollWidth,
    sichtbar: document.documentElement.clientWidth,
  }));
  expect(masse.dokument).toBeLessThanOrEqual(masse.sichtbar + 1);

  await page.fill('#einkommen', '3500');
  await page.click('#weiter-1');
  await page.click('#weiter-2');
  await page.click('#weiter-3');
  await page.click('#ueberspringen-4');
  const masseErgebnis = await page.evaluate(() => ({
    dokument: document.documentElement.scrollWidth,
    sichtbar: document.documentElement.clientWidth,
  }));
  expect(masseErgebnis.dokument).toBeLessThanOrEqual(masseErgebnis.sichtbar + 1);
});

test('Bedienelemente sind gross genug fuer den Daumen', async ({ page }) => {
  await page.goto('/');
  const zuKlein = [];
  for (const sel of ['#weiter-1', '#einkommen', '.option']) {
    const kasten = await page.locator(sel).first().boundingBox();
    if (kasten && kasten.height < 44) zuKlein.push(`${sel} ist ${Math.round(kasten.height)} Pixel hoch`);
  }
  expect(zuKlein, `Zu kleine Ziele: ${zuKlein.join(', ')}`).toEqual([]);
});

test('die Hauptfarben erreichen den Kontrast AA', async ({ page }) => {
  await page.goto('/');
  const werte = await page.evaluate(() => {
    function leuchtdichte(rgb) {
      const [r, g, b] = rgb.map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }
    function kontrast(vorn, hinten) {
      const l1 = leuchtdichte(vorn);
      const l2 = leuchtdichte(hinten);
      const hell = Math.max(l1, l2);
      const dunkel = Math.min(l1, l2);
      return (hell + 0.05) / (dunkel + 0.05);
    }
    function parse(farbe) {
      return farbe.match(/\d+/g).slice(0, 3).map(Number);
    }
    const ergebnisse = [];
    for (const el of [document.body, document.querySelector('.kopf__unterzeile'), document.querySelector('.schritt__hilfe'), document.querySelector('.hinweis--warnung'), document.querySelector('.ergebnis__label')]) {
      if (!el) continue;
      const s = getComputedStyle(el);
      const hinten = parse(s.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'rgb(255,255,255)' : s.backgroundColor);
      ergebnisse.push({
        selektor: el.className || el.tagName,
        farbe: s.color,
        hinten: `rgb(${hinten.join(',')})`,
        kontrast: kontrast(parse(s.color), hinten),
      });
    }
    return ergebnisse;
  });

  const zuSchwach = werte.filter((w) => w.kontrast < 4.5);
  expect(
    zuSchwach,
    `Zu geringer Kontrast: ${zuSchwach.map((w) => `${w.selektor} ${w.kontrast.toFixed(2)}`).join(', ')}`,
  ).toEqual([]);
});

test('die Textseiten haben eine nachvollziehbare Ueberschriftenfolge', async ({ page }) => {
  for (const pfad of ['index.html', 'methodik.html', 'quellen.html', 'datenschutz.html', 'impressum.html']) {
    await page.goto(`/${pfad}`);
    const h1 = await page.locator('h1').count();
    expect(h1, `${pfad} braucht genau eine Hauptueberschrift`).toBe(1);
    const sprache = await page.locator('html').getAttribute('lang');
    expect(sprache, `${pfad} braucht eine Sprachauszeichnung`).toBe('de');
  }
});
