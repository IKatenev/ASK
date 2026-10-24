const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
 const browser=await chromium.launch({headless:true, ...(process.env.BROWSER_EXECUTABLE ? {executablePath:process.env.BROWSER_EXECUTABLE} : {})});
 const page=await browser.newPage(); const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 await page.goto('http://127.0.0.1:18744');
 for(const width of [1440,1024,900,768,560,440,375,320]) {
  await page.setViewportSize({width,height:900});
  const measure=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,navHidden:document.querySelector('nav').hidden,burger:getComputedStyle(document.querySelector('.burger')).display}));
  if(measure.scroll>width) throw Error('Overflow '+width+JSON.stringify(measure));
  if(width<=900){
   await page.locator('.burger').click();
   if(await page.locator('.burger').getAttribute('aria-expanded')!=='true') throw Error('Menu open failed');
   await page.keyboard.press('Escape');
   if(await page.locator('.burger').getAttribute('aria-expanded')!=='false') throw Error('Menu close failed');
  }
  console.log(width,JSON.stringify(measure));
 }
 await page.setViewportSize({width:1440,height:900});
 await page.locator('.header__nav-link').first().click();
 if(await page.locator('.burger').getAttribute('aria-expanded')!=='false') throw Error('Desktop toggle');
 await page.locator('#name').fill('Тест & <имя>'); await page.locator('#email').fill('test+tag@example.com');
 await page.locator('#phone').fill('9283135050');
 console.log('masked phone',await page.locator('#phone').inputValue());
 await page.route('**/telegram.php',r=>r.fulfill({status:502,contentType:'text/plain; charset=utf-8',body:'Тестовая ошибка доставки'}));
 await page.locator('.form__button').click();
 await page.waitForFunction(()=>document.querySelector('.form__status').textContent.includes('Тестовая ошибка'));
 if(await page.locator('.form__button').isDisabled()) throw Error('Button stuck');
 await page.route('**/telegram.php',r=>r.fulfill({status:303,headers:{location:'thank-you.html'}}));
 await page.locator('.form__button').click(); await page.waitForURL('**/thank-you.html');
 if(errors.length) throw Error(errors.join('\n'));
 console.log('PASS: responsive widths, menu, desktop anchors, phone mask, error and success form UI, no JS errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});


