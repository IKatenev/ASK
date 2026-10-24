const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:18745/ASK/';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const context=await browser.newContext({permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();const errors=[],requests=[],audits=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 page.on('request',r=>requests.push(r.url()));
 if(process.env.AXE_PATH)await page.addInitScript({path:process.env.AXE_PATH});
 await page.goto(base);await page.evaluate(()=>document.fonts.ready);
 assert(!requests.some(r=>/\.mp4|imask|googleapis|gstatic|fancybox/.test(r)),'Initial load has optional/external dependencies');
 const audit=async name=>{
  if(!process.env.AXE_PATH)return;
  const result=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}}));
  if(result.violations.length)console.log(name,JSON.stringify(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,why:n.failureSummary}))}))));
  assert.equal(result.violations.length,0,'axe violations: '+name);
  audits.push({state:name,violations:result.violations.length,passes:result.passes.length,manualReview:result.incomplete.map(x=>x.id)});
  console.log('axe PASS:',name);
 };
 await audit('desktop');
 for(const width of [1440,1024,900,768,560,440,375,320]){
  await page.setViewportSize({width,height:900});await page.waitForTimeout(230);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow '+width);
  if(width<=900){const before=await page.locator('.hero__copy').boundingBox();await page.locator('.burger').click();await page.waitForTimeout(230);assert.deepEqual(await page.locator('.hero__copy').boundingBox(),before);assert(await page.locator('main').evaluate(e=>e.inert));await page.keyboard.press('Escape');assert.equal(await page.locator('.burger').getAttribute('aria-expanded'),'false');}
 }
 await audit('320px');
 await page.locator('.burger').click();await page.waitForTimeout(230);await audit('mobile menu');await page.keyboard.press('Escape');
 const summary=page.locator('summary').first();await summary.click();await page.waitForTimeout(80);assert(await page.locator('details').first().evaluate(e=>e.getAnimations().length>0),'No accordion animation');await page.waitForTimeout(180);assert(await page.locator('details').first().getAttribute('open')!==null);await audit('expanded FAQ');await summary.click();await page.waitForTimeout(230);assert.equal(await page.locator('details').first().getAttribute('open'),null);
 await page.setViewportSize({width:1440,height:900});let heights=[];for(const height of [720,900,1200]){await page.setViewportSize({width:1440,height});heights.push(await page.locator('.header').evaluate(e=>e.offsetHeight));}assert.equal(new Set(heights).size,1);
 await page.locator('[data-video]').first().click();assert(await page.locator('dialog').isVisible());await audit('video dialog');await page.keyboard.press('Escape');assert(!await page.locator('dialog').isVisible());assert(await page.locator('video').evaluate(e=>e.paused));
 await page.locator('#name').fill('Иван & <тест>');await page.locator('#email').fill('ivan+test@example.com');await page.locator('#phone').focus();await page.waitForFunction(()=>window.IMask);await page.locator('#phone').fill('0000000001');assert.equal(await page.locator('#phone').inputValue(),'+7(000)000-00-01');await page.locator('.copy-request').click();assert((await page.evaluate(()=>navigator.clipboard.readText())).includes('Иван & <тест>'));
 await page.emulateMedia({reducedMotion:'reduce'});await summary.click();assert(await page.locator('details').first().evaluate(e=>e.getAnimations().length===0));
 // WCAG text-spacing override and reflow at a 320 CSS-pixel viewport.
 await page.setViewportSize({width:320,height:900});await page.evaluate(()=>{for(const el of document.querySelectorAll('p,li,summary,label')){el.style.lineHeight='1.5';el.style.letterSpacing='.12em';el.style.wordSpacing='.16em';}});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:process.env.TEMP+'/ask-audit-mobile.png',fullPage:true});
 assert.deepEqual(errors,[],'Browser errors');
 const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:375,height:900}});await nojs.goto(base);assert(await nojs.locator('nav').isVisible());assert(await nojs.locator('[data-video]').first().getAttribute('href'));await nojs.locator('summary').first().click();assert(await nojs.locator('details').first().getAttribute('open')!==null);await nojs.close();
 if(process.env.AXE_PATH){fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/axe-summary.json',JSON.stringify(audits,null,2));}
 await browser.close();console.log('PASS: responsive, stable overlay, keyboard, video, accordion motion, clipboard, no-JS and text spacing; no delivery attempted.');
})().catch(e=>{console.error(e);process.exit(1)});
