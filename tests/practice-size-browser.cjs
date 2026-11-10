const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
(async()=>{
  const out='test-results/practice-size';await fs.mkdir(out,{recursive:true});
  const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4362'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page;
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
    browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    page=await browser.newPage({viewport:{width:1440,height:960}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
    const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
    await page.goto('http://127.0.0.1:4362/index.html?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
    await page.locator('#clearLoadout').click();await page.locator('[data-equip=wind-orb]').click();
    for(const view of ['first-person','overhead']){
      await page.locator('#startButton').click();await page.locator('#practiceOpponentConfirm').click();await page.locator('[name=practiceView][value='+view+']').check();await page.locator('#practiceViewConfirm').click();await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));await advance(.01);
      let s=await state();const scale=view==='overhead'?2:1;assert.equal(s.combatSize.scale,scale);assert.deepEqual(s.combatSize.playerScale,[scale,scale,scale]);assert.deepEqual(s.combatSize.enemyScale,[scale,scale,scale]);assert.equal(s.combatSize.hitRadius,.54*scale);
      const target=[1.35,1.72,s.enemyPosition[2]];
      if(view==='overhead'){const point=await page.evaluate(p=>__AN_HOA__.screenPoint(p),[target[0],0,target[2]]);await page.mouse.move(point.x,point.y);}else await page.evaluate(p=>__AN_HOA__.aimAt(p),target);
      await advance(.01);const enemyBefore=(await state()).enemyHealth;
      for(const key of await page.evaluate(()=>SealGameCore.spells.find(s=>s.id==='wind-orb').sequence))await page.keyboard.press(key);await page.keyboard.press('Space');await advance(1.2);s=await state();
      assert.equal(s.enemyHealth<enemyBefore,view==='overhead','grazing shot hits the enlarged bot but misses the original FPS hitbox');
      const healthBefore=s.health;await page.evaluate(()=>__AN_HOA__.launchEnemy('wind-orb',[1.35,1.72,1],[0,0,1]));await advance(.5);s=await state();assert.equal(s.health<healthBefore,view==='overhead','the player also receives a larger hitbox');
      await page.screenshot({path:out+'/'+view+'.png'});await page.keyboard.press('Escape');await page.locator('#changeLoadout').click();
    }
    assert.deepEqual(errors,[]);console.log('PASS: overhead player/bot models and hit radii double; real grazing projectiles hit both enlarged actors and miss both unchanged first-person hitboxes.');
  }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
