const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
(async()=>{
  const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4345'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page;
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
    browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const state=()=>page.evaluate(()=>{const s=__AN_HOA__.state();return {position:s.enemyPosition,movement:s.enemyMovement,projectiles:s.projectiles,fields:s.lightningArt.fields,sequence:s.sequence};}),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
    await page.goto('http://127.0.0.1:4345/index.html?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
    await page.locator('#clearLoadout').click();await page.locator('[data-equip=fire-volley]').click();await page.locator('[data-equip=lightning-reflect]').click();await page.locator('#startButton').click();await page.locator('#practiceOpponentConfirm').click();
    const origin=(await state()).position[0],direction=(await state()).movement.direction;
    await advance(.5);close((await state()).position[0],origin+direction*.5);await advance(1.49);close((await state()).position[0],origin+direction*1.99);assert.equal((await state()).movement.direction,direction);
    await advance(.01);close((await state()).movement.directionTime,2);
    await page.keyboard.press('q');await page.keyboard.press('w');await page.keyboard.press('Space');
    for(let i=0;i<12;i++){const before=(await state()).position[0];await advance(.25);const s=await state();assert.ok(Math.abs(s.position[0]-before)>.01,'enemy keeps walking while spells are cast');assert.equal(s.movement.dashBoost.uses,0);assert.equal(s.movement.dashBoost.dashing,0);assert.ok(Math.abs(s.position[0])<=5.3);}
    await page.keyboard.press('Escape');const frozen=(await state()).position;await advance(.5);assert.deepEqual((await state()).position,frozen);await page.locator('#resumeButton').evaluate(b=>b.click());
    await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));await page.keyboard.press('Backspace');for(const key of await page.evaluate(()=>SealGameCore.spells.find(s=>s.id==='lightning-reflect').sequence))await page.keyboard.press(key);await page.keyboard.press('Space');
    close((await state()).fields.find(f=>f.owner==='player').slowFactor,.05);
    await page.evaluate(()=>__AN_HOA__.launchEnemy('wind-orb',[0,1.72,0],[0,0,1]));await advance(.1);const slowed=(await state()).projectiles.find(s=>s.owner==='enemy'&&s.style==='windslash');assert.ok(slowed);close(slowed.slowFactor,.05);
    assert.deepEqual(errors,[]);console.log('PASS: live continuous enemy movement, 2s direction timer, no enemy G during player casts, pause freeze and 5% hostile projectile speed.');
  }catch(e){await fs.mkdir('test-results/enemy-patrol',{recursive:true});await page?.screenshot({path:'test-results/enemy-patrol/failure.png'}).catch(()=>{});await fs.writeFile('test-results/enemy-patrol/failure.json',JSON.stringify({message:e.message,state:await page?.evaluate(()=>__AN_HOA__.state()).catch(()=>null)},null,2));throw e;}finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
