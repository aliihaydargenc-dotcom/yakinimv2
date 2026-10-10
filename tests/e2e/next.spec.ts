import {test,expect} from '@playwright/test';

test('mobile discovery, save and service navigation (explicit sample data)',async({page})=>{
  await page.goto('/?preview');
  await expect(page.locator('.yn-preview-banner')).toContainText('temsili');
  await expect(page.getByRole('heading',{name:'Yakınında ne var?'})).toBeVisible();
  await expect(page.locator('.yn-places-list .yn-place-row')).toHaveCount(9);
  await page.locator('.yn-place-row').first().locator('.yn-save-action').click();
  await page.locator('.yn-nav:visible').getByRole('button',{name:'Kaydedilen'}).click();
  await expect(page.getByRole('heading',{name:'Kaydedilen yerler'})).toBeVisible();
  await expect(page.locator('.yn-places-list .yn-place-row')).toHaveCount(1);
  await page.locator('.yn-nav:visible').getByRole('button',{name:'Hizmetler'}).click();
  await expect(page.getByRole('heading',{name:'Şehir hizmetleri'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Market fiyatları/})).toBeVisible();
  await page.getByRole('button',{name:/Toplu ulaşım/}).click();
  await expect(page.getByRole('heading',{name:'Toplu ulaşım'})).toBeVisible();
  await assertNoOverflow(page);
});

test('map and emergency pharmacy category are available',async({page})=>{
  await page.goto('/?preview');
  await page.locator('.yn-quick').getByRole('button',{name:'Nöbetçi eczane'}).click();
  await expect(page.getByRole('heading',{name:'Nöbetçi eczane'})).toBeVisible();
  await expect(page.locator('.yn-place-row')).toHaveCount(1);
  await page.locator('.yn-nav:visible').getByRole('button',{name:'Harita'}).click();
  await expect(page.locator('.yn-map-large')).toBeVisible();
  await expect(page.locator('.yn-map-top')).toContainText('Yakınındaki yerler');
  await assertNoOverflow(page);
});

test('manual coordinates work when GPS is unavailable',async({page})=>{
  await page.goto('/?preview&state=location');
  await expect(page.getByText('Önce bir konum seç')).toBeVisible();
  await page.locator('.yn-location-trigger').click();
  await page.getByRole('button',{name:'Koordinat gir'}).click();
  await page.getByRole('textbox',{name:'Enlem'}).fill('36,8615');
  await page.getByRole('textbox',{name:'Boylam'}).fill('30,6377');
  await page.getByRole('button',{name:'Konumu uygula'}).click();
  await expect(page.locator('.yn-places-list .yn-place-row')).toHaveCount(9);
});

test('loading and source failures do not fabricate a place list',async({page})=>{
  await page.goto('/?preview&state=error');
  await expect(page.getByText('Veri kaynağına ulaşılamadı')).toBeVisible();
  await expect(page.locator('.yn-place-row')).toHaveCount(0);
  await page.goto('/?preview&state=empty');
  await expect(page.getByText('Bu seçimde yer bulunamadı')).toBeVisible();
  await expect(page.locator('.yn-place-row')).toHaveCount(0);
});

async function assertNoOverflow(page:import('@playwright/test').Page){
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
}
