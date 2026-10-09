const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:900,height:650}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1');await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});
 const button=page.locator('#startButton');let box=await button.boundingBox();assert.ok(box.y>=0&&box.y+box.height<=650,'Compact battle button visible without scrolling');
 await page.screenshot({path:'test-results/compact-scroll.png'});await button.click();await page.waitForFunction(()=>document.pointerLockElement===document.getElementById('world'));await page.evaluate(()=>window.__AN_HOA__.advance(.1));
 let reticle=await page.locator('#reticle').boundingBox();assert.equal(reticle.x+reticle.width/2,450);assert.equal(reticle.y+reticle.height/2,325);
 await page.screenshot({path:'test-results/compact.png'});
 const aimBefore=await page.evaluate(()=>window.__AN_HOA__.state());
 await page.setViewportSize({width:1440,height:960});await page.waitForFunction(()=>document.getElementById('world').width===1440 && document.getElementById('world').height===960);await page.evaluate(()=>window.__AN_HOA__.advance(.1));
 const resized=await page.evaluate(()=>window.__AN_HOA__.state());assert.equal(resized.yaw,aimBefore.yaw);assert.equal(resized.pitch,aimBefore.pitch);
 reticle=await page.locator('#reticle').boundingBox();assert.equal(reticle.x+reticle.width/2,720);assert.equal(reticle.y+reticle.height/2,480);
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.pointerLockElement);await page.locator('#changeLoadout').click();await page.setViewportSize({width:390,height:844});
 await button.scrollIntoViewIfNeeded();box=await button.boundingBox();assert.ok(box.y>=0&&box.y+box.height<=844,'Mobile battle action reachable');await page.screenshot({path:'test-results/mobile-scroll-action.png'});await button.click();assert.equal(await page.evaluate(()=>window.__AN_HOA__.state().started),true);
 assert.deepEqual(errors,[]);console.log('PASS layout: compact battle action; centered reticle at both viewport sizes; resize preserves aim; pause releases cursor for UI; mobile action reachable.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
