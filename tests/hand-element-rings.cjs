const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
  const output='test-results/hand-element-rings';await fs.mkdir(output,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),click=id=>page.evaluate(id=>document.getElementById(id).click(),id);
    const clear=()=>page.keyboard.press('Backspace');
    const seal=async id=>{await clear();for(const k of await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).sequence,id))await page.keyboard.press(k);};
    const cast=async id=>{await seal(id);assert.equal(await page.locator('#castButton').isDisabled(),false,id);await page.keyboard.press('Space');};
    const reset=async()=>{await page.keyboard.press('Escape');await click('resetButton');};
    const equip=async ids=>{if((await state()).started){await page.keyboard.press('Escape');await click('changeLoadout');}await click('clearLoadout');for(const id of ids)await page.evaluate(id=>document.querySelector('[data-equip="'+id+'"]').click(),id);await click('startButton');};
    const expect=async element=>{const s=await state();for(const [e,r] of Object.entries(s.handElementRings)){assert.equal(r.visible,e===element,e+' ring');assert.equal(r.motes,e===element,e+' motes');}assert.equal(s.handFlames,false);assert.equal(s.handWater,false);assert.equal(s.handLightning,false);};
    const capture=async name=>page.screenshot({path:output+'/'+name+'.png'});
    await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1');await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});await click('soundButton');await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));
    for(const element of ['wind','dark','light','earth']){
      const ids=await page.evaluate(e=>SealGameCore.spells.filter(s=>s.element===e).map(s=>s.id),element);await equip(ids);await expect(null);
      for(const id of ids){
        await reset();const spell=await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id),id);
        if(spell.requiresDomain){await seal(id);await expect(null);await clear();await page.evaluate(()=>__AN_HOA__.launchEnemy('dark-domain'));await advance(2.5);assert.equal((await state()).darkDomain.usable,true);}
        if(spell.requiresClones){await seal(id);await expect(null);await cast('dark-orb');await advance(1.05);}
        if(spell.requiresCrater){await seal(id);await expect(null);await clear();await cast('earth-reflect');const g=(await state()).earthArt.effects.find(e=>e.kind==='gravity');await advance(g.formationEndsAt-g.age+.1);}
        if(spell.requiresAirborne){await seal(id);await expect(null);await cast('wind-volley');await advance(1.5);assert.ok((await state()).enemyControlTime>0);}
        await clear();await page.keyboard.press(spell.sequence[0]);await expect(null);
        for(const k of spell.sequence.slice(1))await page.keyboard.press(k);await expect(element);await advance(.32);await expect(element);await clear();await expect(null);
      }
      await reset();const basic=element==='dark'?'dark-orb':element+'-orb';await seal(basic);await advance(.32);await expect(element);await capture(element+'-ready');
      const before=(await state()).handElementRings[element];await advance(.35);const after=(await state()).handElementRings[element];assert.ok(after.time>before.time);assert.ok(after.position.every((v,i)=>Math.abs(v-before.position[i])<.02));
      await page.keyboard.press('Escape');await expect(null);const frozen=(await state()).handElementRings;await advance(2);assert.deepEqual((await state()).handElementRings,frozen);await page.keyboard.press('Enter');await expect(element);
      await page.keyboard.press('Space');await expect(null);await seal(basic);await expect(null);await advance(1.05);await expect(element);
      await clear();await page.keyboard.press('w');await expect(null);await seal(basic);await advance(7.1);await expect(null);
      await seal(basic);await reset();await expect(null);
      const expensive=ids.find(id=>id.endsWith(element==='dark'?'-domain':element==='wind'?'-reflect':'-volley'));await cast(expensive);
      if(element==='dark')await advance(2.5);else await advance(1.05);
      await seal(expensive);await expect(null);assert.equal(await page.locator('#castButton').isDisabled(),true);await advance(5.5);await expect(element);await clear();
      await reset();while((await state()).quality!=='Thấp')await click('qualityButton');await seal(basic);await advance(.32);await expect(element);await capture(element+'-low');await clear();
    }
    for(const element of ['wood','ice']){
      const ids=await page.evaluate(e=>SealGameCore.spells.filter(s=>s.element===e).map(s=>s.id),element);await equip(ids);await expect(null);
      for(const id of ids){
        await reset();const spell=await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id),id);
        if(spell.requiresGarden){await seal(id);await expect(null);await cast('wood-reflect');await advance(2);}
        if(spell.snowCost){await seal(id);await expect(null);await cast('ice-reflect');await advance(3);}
        if(spell.requiresSnowFull){await seal(id);await expect(null);await cast('ice-reflect');await advance(90);}
        await clear();await page.keyboard.press(spell.sequence[0]);await expect(null);
        for(const k of spell.sequence.slice(1))await page.keyboard.press(k);
        await advance(.32);await expect(element);await capture(id+'-ready');await clear();await expect(null);
      }
      await reset();const basic=element+'-reflect';await seal(basic);await advance(.32);await expect(element);await capture(element+'-ready');
      const before=(await state()).handElementRings[element];await advance(.35);assert.ok((await state()).handElementRings[element].time>before.time);
      await page.keyboard.press('Escape');await expect(null);const frozen=(await state()).handElementRings;await advance(2);assert.deepEqual((await state()).handElementRings,frozen);await page.keyboard.press('Enter');await expect(element);
      await page.keyboard.press('Space');await expect(null);await advance(1.1);await seal(basic);await expect(null);
      await reset();while((await state()).quality!=='Thấp')await click('qualityButton');await seal(basic);await advance(.32);await expect(element);await capture(element+'-low');await clear();
    }
    // Selecting a spell from a different element must replace, rather than stack, rings.
    await equip(['wind-orb','dark-orb','light-orb','earth-orb']);for(const e of ['wind','dark','light','earth']){await seal(e+'-orb');await expect(e);}await clear();await expect(null);
    await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});await click('soundButton');await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));await click('startButton');
    for(const e of ['wind','dark','light','earth']){await seal(e+'-orb');await advance(.32);await expect(e);assert.equal((await state()).handElementRings[e].reducedMotion,1);await capture(e+'-reduced-motion');await clear();}
    await equip(['wood-reflect','ice-reflect']);for(const e of ['wood','ice']){await seal(e+'-reflect');await advance(.32);await expect(e);assert.equal((await state()).handElementRings[e].reducedMotion,1);await capture(e+'-reduced-motion');await clear();}
    assert.deepEqual(errors,[]);await fs.writeFile(output+'/verification.json',JSON.stringify({passed:true,elements:['wind','dark','light','earth','wood','ice'],checks:['all thirty spells','incomplete seals','domain/clone/airborne/crater/garden/snow gates','ready ring follows hands','animated rings','pause/resume','casting/cooldown/once-per-match','chakra recovery','wrong/expired seals','reset','switching elements','low quality','reduced motion'],errors},null,2));console.log('PASS: six readiness rings, all 30 spells, prerequisite gates, animation, cast/cooldown/chakra, once-per-match, pause/reset, element switching, graphics and reduced motion.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
