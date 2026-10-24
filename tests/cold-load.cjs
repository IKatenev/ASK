const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async()=>{
 const browser = await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 const results=[];
 for(const fontDelay of [0,1800]){
  const page=await browser.newPage({viewport:{width:412,height:823},isMobile:true,deviceScaleFactor:1.75});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.addInitScript(()=>{
   window.layoutShifts=[];
   new PerformanceObserver(list=>list.getEntries().forEach(entry=>{if(!entry.hadRecentInput)window.layoutShifts.push({value:entry.value,time:entry.startTime,sources:entry.sources?.map(s=>s.node?.className)});})).observe({type:'layout-shift',buffered:true});
  });
  await page.route('**/js/main.min.js',async route=>{await new Promise(resolve=>setTimeout(resolve,2500));await route.continue();});
  if(fontDelay)await page.route('**/*.woff2',async route=>{await new Promise(resolve=>setTimeout(resolve,fontDelay));await route.continue();});
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:18745/ASK/');
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
  const shifts=await page.evaluate(()=>window.layoutShifts);
  const cls=shifts.reduce((sum,entry)=>sum+entry.value,0);
  assert(cls<0.01,'Cold-load regression: '+JSON.stringify(shifts));
  assert.deepEqual(errors,[],'CSP or JavaScript error');
  assert.equal(await page.locator('.burger').getAttribute('aria-expanded'),'false');
  await page.locator('.burger').click();assert.equal(await page.locator('.burger').getAttribute('aria-expanded'),'true');
  results.push({scriptDelay:2500,fontDelay,cls,shifts});
  await page.close();
 }
 await browser.close();fs.mkdirSync('reports',{recursive:true});fs.writeFileSync('reports/cold-load.json',JSON.stringify(results,null,2));console.log('PASS cold mobile load',JSON.stringify(results));
})().catch(e=>{console.error(e);process.exit(1)});
