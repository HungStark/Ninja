const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
(async()=>{
  const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4341'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page;
  const out='test-results/practice-overhead';await fs.mkdir(out,{recursive:true});
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
    browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const state=()=>page.evaluate(()=>{const s=__AN_HOA__.state();return {position:s.position,chakra:s.chakra,dash:s.dashBoost,overhead:s.practiceOverhead,view:s.cameraView,started:s.started,paused:s.paused,avatar:s.playerAvatar,hands:s.handsVisible,handPose:s.handPose,activePose:s.activePose,fingerPose:s.fingerPose,sequence:s.sequence,projectiles:s.projectiles,fields:s.lightningArt.fields};});
    await page.goto('http://127.0.0.1:4341/index.html?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
    await page.locator('#startButton').click();assert.equal(await page.locator('#practiceViewScreen').isVisible(),false);
    await page.locator('#practiceOpponentConfirm').click();await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));
    let s=await state();assert.equal(s.started,true);assert.equal(s.view,'first-person');assert.equal(s.avatar.visible,false);assert.equal(await page.locator('#practiceViewScreen').isVisible(),false);assert.equal(await page.locator('#practiceHandInset').isVisible(),false);
    await page.locator('[name=practiceView][value=overhead]').evaluate(e=>e.checked=true);await page.locator('#practiceViewConfirm').evaluate(b=>b.click());assert.equal((await state()).view,'first-person','hidden controls cannot change the active match');
    await page.keyboard.press('Escape');await page.locator('#changeLoadout').click();await page.locator('#startButton').click();await page.locator('#practiceOpponentConfirm').click();assert.equal((await state()).view,'first-person','hidden radio state cannot activate overhead on the next match');
    await page.screenshot({path:out+'/first-person.png'});assert.deepEqual(errors,[]);console.log('PASS: view selection hidden, direct first-person entry, hidden controls cannot change the active or next match.');
  }catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({message:e.message,state:await page?.evaluate(()=>__AN_HOA__.state()).catch(()=>null)},null,2));throw e;}finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
