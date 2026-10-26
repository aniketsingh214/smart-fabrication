import { test,expect } from '@playwright/test';
// Unrelated browsing tests exercise the explicitly dismissed welcome state.
test.beforeEach(async({context})=>{await context.addInitScript(()=>sessionStorage.setItem('sf:visitor-dismissed','1'));});
test.beforeEach(async({context,baseURL})=>{await context.addCookies([{name:'sf_locale',value:'en',url:baseURL!}]);});
test('header actions and navigation fit narrow and desktop screens',async({page})=>{
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});await page.goto('/contact');
  const header=page.locator('header').first();await expect(header.getByRole('link',{name:'Request a quote',exact:true})).toBeVisible();
  expect(await header.evaluate(node=>node.scrollWidth<=window.innerWidth)).toBe(true);
  const controls=header.getByRole('button',{name:/Open cart/});await expect(controls).toBeVisible();
  expect(await controls.evaluate(node=>node.getBoundingClientRect().right<=window.innerWidth)).toBe(true);
 }
});
test('catalog preserves advanced filters and offers a complete reset',async({page})=>{
 await page.goto('/catalog');await page.getByLabel('Material contains',{exact:true}).fill('steel');await page.getByLabel('Maximum indicative starting price').fill('50000');await page.getByLabel('Sort designs',{exact:true}).selectOption('price-low');
 await page.getByRole('button',{name:'Search',exact:true}).last().click();await expect(page).toHaveURL(/material=steel/);await expect(page).toHaveURL(/budget=50000/);await expect(page).toHaveURL(/sort=price-low/);
 await expect(page.getByLabel('Material contains',{exact:true})).toHaveValue('steel');await page.getByRole('link',{name:'Reset all filters',exact:true}).click();await expect(page).toHaveURL(/\/catalog$/);
});
test('measurement request collects preferences without claiming a confirmed slot (simulated save)',async({page})=>{
 await page.route('**/api/v1/leads',async route=>{
  const body=route.request().postDataJSON();expect(body.phone).toBe('+919876543210');expect(body.measurement_request.address).toBe('Test site address, Jhansi');expect(body.measurement_request.postal_code).toBe('284001');
  await route.fulfill({status:201,json:{data:{id:crypto.randomUUID()},meta:{}}});
 });
 await page.goto('/contact?measurement=1');await expect(page.getByLabel('I would like a site measurement visit',{exact:true})).toBeChecked();
 await page.getByLabel('Your name',{exact:true}).fill('Test customer');await page.getByLabel('Mobile / WhatsApp',{exact:true}).fill('9876543210');await page.getByLabel('City / area',{exact:true}).fill('Jhansi');await page.getByLabel('Tell us about your requirement',{exact:true}).fill('Need a custom steel gate');
 await page.getByLabel('Preferred date (India time)',{exact:true}).fill('2099-01-01');await page.getByLabel('Site address',{exact:true}).fill('Test site address, Jhansi');await page.getByLabel('PIN code',{exact:true}).fill('284001');await page.getByRole('button',{name:'Send enquiry',exact:true}).click();await expect(page.getByRole('heading',{name:'Your enquiry has been received.',exact:true})).toBeVisible();
});
test('published design has measurement handoff and image enlargement',async({page})=>{
 await page.goto('/catalog');const link=page.locator('a[href^="/catalog/"]').first();test.skip(await link.count()===0,'No published design available');await link.click();
 await expect(page.getByRole('link',{name:'Request site measurement',exact:true})).toHaveAttribute('href',/measurement=1/);
 const zoom=page.getByRole('button',{name:'Enlarge product photograph',exact:true});
 if(await zoom.count()){await zoom.click();await expect(page.getByRole('dialog',{name:'Enlarged product photograph',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);}
 const whatsapp=page.getByRole('link',{name:'Enquire about this design on WhatsApp',exact:true});if(await whatsapp.count()){const url=new URL((await whatsapp.getAttribute('href'))!);expect(url.hostname).toBe('wa.me');expect(url.searchParams.get('text')).toContain(new URL(page.url()).pathname);}
});
