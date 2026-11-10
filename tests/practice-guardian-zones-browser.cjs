const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
(async()=>{
  const {PRACTICE_DIVIDERS}=await import('../src/practice-overhead.js'),out='test-results/practice-overhead';await fs.mkdir(out,{recursive:true});
  const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4359'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page;
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
    browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
    await page.goto('http://127.0.0.1:4359/index.html?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
    await page.locator('#startButton').click();await page.locator('#practiceOpponentConfirm').click();await page.locator('#practiceViewConfirm').click();await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));await advance(.01);
    let s=await state();assert.equal(s.cameraView,'first-person');assert.ok(s.viewPosition[1]<5);assert.equal(s.practiceOverhead.fencesVisible,false);await page.screenshot({path:out+'/first-person-no-flags.png'});
    for(const [guardian,skill]of [['wind',1],['lightning',0]]){
      await page.keyboard.press('Escape');await page.locator('#changeLoadout').click();await page.locator('#startButton').click();await page.locator('[data-practice-type=guardian]').click();await page.locator('[data-practice-guardian='+guardian+']').click();await page.locator('#practiceOpponentConfirm').click();await page.locator('[name=practiceView][value=overhead]').check();await page.locator('#practiceViewConfirm').click();
      await page.evaluate(()=>{__AN_HOA__.setHealth('player',10000);__AN_HOA__.setAIEnabled(true);});const idleStart=(await state()).enemyRenderPosition;await advance(.9);const idleEnd=(await state()).enemyRenderPosition;assert.ok(Math.abs(idleEnd[0]-idleStart[0])>.01&&Math.abs(idleEnd[2]-idleStart[2])>.01,'guardian patrol moves on both axes before attacking');assert.ok(await page.evaluate(skill=>__AN_HOA__.guardianArt(skill),skill));
      let farthestZ=-Infinity;
      for(let i=0;i<21;i++){await advance(.1);s=await state();farthestZ=Math.max(farthestZ,s.enemyRenderPosition[2]);}
      assert.ok(farthestZ>PRACTICE_DIVIDERS[1],guardian+' leap/rush crosses both dividers to reach the player');assert.ok(s.health<10000,'the attack can land beyond the fences');
      assert.equal(await page.locator('#flash').evaluate(e=>Number(e.style.opacity)),0,'guardian damage does not tint the screen');
      assert.equal(s.cameraView,'practice-overhead');assert.equal(s.practiceOverhead.fencesVisible,true);await page.screenshot({path:out+'/'+guardian+'-crosses-fences.png'});
    }
    assert.deepEqual(errors,[]);console.log('PASS: shipped first-person bundle, Wind leap and Lightning rush cross both fences and hit the player without a red damage overlay.');
  }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
