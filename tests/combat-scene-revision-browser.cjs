const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
(async()=>{
  const out='test-results/combat-scene-revision';await fs.mkdir(out,{recursive:true});
  const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4395'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page,checkpoint='load';
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
    browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    for(const mobile of [false,true]){
      const label=mobile?'mobile':'desktop',errors=[];page=await browser.newPage({viewport:mobile?{width:915,height:412}:{width:1280,height:800},hasTouch:mobile,isMobile:mobile});page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.stack));
      const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
      const enemy=(id,pos,dir)=>page.evaluate(({id,pos,dir})=>__AN_HOA__.launchEnemy(id,pos,dir),{id,pos,dir});
      await page.goto('http://127.0.0.1:4395/?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
      await page.locator('#clearLoadout').click();for(const id of ['fire-lance','lightning-volley','light-lance','ice-reflect','ice-volley'])await page.locator('[data-equip='+id+']').click();
      await page.locator('#startButton').click();await page.locator('#practiceOpponentConfirm').click();await page.locator('[name=practiceView][value=overhead]').check();await page.locator('#practiceViewConfirm').click();
      await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.setHealth('player',10000);__AN_HOA__.setHealth('enemy',10000);});await advance(.01);
      checkpoint=label+' exact area targets';console.log('CHECK '+checkpoint);
      const player=(await state()).playerPosition;
      for(const id of ['fire-meteor','lightning-thunder','light-volley']){
        await enemy(id,[-9,1.72,-21],[1,0,0]);const shot=(await state()).projectiles.find(s=>s.style===({'fire-meteor':'meteor','lightning-thunder':'thunder','light-volley':'jacob'})[id]);
        assert.ok(shot,id);assert.equal(shot.target[0],player[0]);assert.equal(shot.target[2],player[2]);
      }
      for(const id of ['earth-volley','earth-reflect']){await enemy(id,[-9,1.72,-21],[1,0,0]);const effects=(await state()).earthArt.effects;const effect=effects.find(e=>e.style===({'earth-volley':'earthquake','earth-reflect':'earthgravity'})[id]);assert.equal(effect.center[0],player[0]);assert.equal(effect.center[2],player[2]);}
      await enemy('light-lance',[-9,1.72,-21],[1,0,0]);const dome=(await state()).lightArt.domes[0];assert.equal(dome.center[0],player[0]);assert.equal(dome.center[2],player[2]);
      await enemy('lightning-reflect',[-9,1.72,-21],[1,0,0]);const field=(await state()).lightningArt.fields[0];assert.equal(field.position[0],player[0]);assert.equal(field.position[2],player[2]);
      await enemy('water-barrier',[-9,1.72,-21],[1,0,0]);const bubbles=(await state()).waterBubbles.bubbles;assert.equal(bubbles.length,4);for(const axis of [0,2])assert.ok(Math.abs(bubbles.reduce((sum,b)=>sum+b.position[axis],0)/4-player[axis])<1e-6);
      // Reset before formation/visibility checks so area effects cannot interrupt them.
      await page.keyboard.press('Escape');await page.locator('#resetButton').click();await page.locator('#startButton').click();await page.locator('#practiceOpponentConfirm').click();await page.locator('[name=practiceView][value=overhead]').check();await page.locator('#practiceViewConfirm').click();await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.setHealth('player',10000);__AN_HOA__.setHealth('enemy',10000);});
      checkpoint=label+' restored creatures release at 0.1s';console.log('CHECK '+checkpoint);
      for(const [id,style,size] of [['fire-lance','dragon',.72],['lightning-volley','bird',.9]]){
        await enemy(id,[0,1.72,-18],[0,0,1]);let shot=(await state()).projectiles.find(s=>s.style===style);assert.equal(shot.phase,'forming');assert.equal(shot.size,size);
        await advance(.09);shot=(await state()).projectiles.find(s=>s.style===style);assert.equal(shot.phase,'forming');
        await advance(.01);shot=(await state()).projectiles.find(s=>s.style===style);assert.equal(shot.phase,'flying');
      }
      await page.screenshot({path:out+'/'+label+'-creatures.png'});await advance(5);
      checkpoint=label+' full snow aiming';console.log('CHECK '+checkpoint);
      await enemy('ice-reflect');await advance(90);assert.equal((await state()).natureArt.snowVisual.groundOpacity,1);
      for(const id of ['fire-lance','light-lance']){
        await page.keyboard.press('Backspace');for(const key of await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).sequence,id))await page.keyboard.press(key);
        await advance(.01);const s=await state();assert.equal(s.practiceOverhead.visible,true);assert.equal(s.practiceOverhead.preview.spellId,id);assert.equal(s.practiceOverhead.preview.kind,id==='fire-lance'?'direction':'area');
        await page.screenshot({path:out+'/'+label+'-snow-'+id+'.png'});
      }
      assert.deepEqual(errors,[]);await page.close();
    }
    console.log('PASS: desktop/touch exact AI area centers, original-size creatures with 0.1s formation, direction and circle guides under full snow.');
  }catch(error){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({checkpoint,message:error.message,state:await page?.evaluate(()=>__AN_HOA__?.state()).catch(()=>null)},null,2));error.message=checkpoint+': '+error.message;throw error;}finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
