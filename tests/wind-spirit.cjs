const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
  const output='test-results/wind-spirit';await fs.mkdir(output,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),click=id=>page.evaluate(id=>document.getElementById(id).click(),id);
    const capture=async name=>{await advance(0);await page.screenshot({path:output+'/'+name+'.png'});};
    const reset=async()=>{await page.keyboard.press('Escape');await click('resetButton');};
    const cast=async id=>{const s=await state(),cost=await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).cost,id);await advance(Math.max(0,s.cooldown+.01,(cost-s.chakra)/11+.01));await page.keyboard.press('Backspace');for(const k of await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).sequence,id))await page.keyboard.press(k);assert.equal(await page.locator('#castButton').isDisabled(),false);await page.keyboard.press('Space');};
    const enemy=(id,pos,dir)=>page.evaluate(({id,pos,dir})=>__AN_HOA__.launchEnemy(id,pos,dir),{id,pos,dir});
    const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
    const fps=s=>{assert.equal(s.cameraView,'first-person');assert.equal(s.handsVisible,true);assert.equal(s.playerAvatar.visible,false);assert.equal(s.playerAvatar.aimVisible,false);};
    const frontal=s=>{
      const spirit=s.windArt.spirits.find(s=>s.owner==='player');assert.ok(spirit);const p=s.position,n=spirit.normal,d=spirit.position.map((v,i)=>v-p[i]);
      close(d[0]*n[0]+d[2]*n[2],3.7);close(d[1],.2);assert.equal(spirit.model,'toon-butterfly-spirit');
    };
    await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1',{timeout:90000});await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});await click('soundButton');await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));
    await click('clearLoadout');for(const id of ['wind-reflect','fire-orb','fire-lance','water-tsunami','lightning-thunder'])await page.evaluate(id=>document.querySelector('[data-equip="'+id+'"]').click(),id);await click('startButton');
    await cast('wind-reflect');await advance(.9);let s=await state();fps(s);frontal(s);assert.equal(s.windArt.spirits[0].phase,'forming');await capture('front-reveal');
    await advance(.9);s=await state();fps(s);frontal(s);close(s.windArt.spirits[0].life,5);assert.match(await page.locator('#shieldStatus').innerText(),/5\.0s/);await capture('front-active');
    await page.keyboard.press('Escape');const frozen=await state();await advance(10);assert.deepEqual((await state()).windArt,frozen.windArt);assert.deepEqual((await state()).viewPosition,frozen.viewPosition);await page.keyboard.press('Enter');
    await cast('fire-orb');await advance(.1);s=await state();fps(s);assert.equal(s.casts,2);assert.ok(s.projectiles.some(s=>s.owner==='player'&&s.element==='fire'));
    await page.evaluate(()=>document.getElementById('world').dispatchEvent(new MouseEvent('mousemove',{bubbles:true,movementX:-180,movementY:60})));await advance(.02);s=await state();fps(s);frontal(s);close(s.yaw,.45);close(s.pitch,-.15);
    await page.evaluate(()=>document.getElementById('world').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:2})));await advance(.1);s=await state();fps(s);frontal(s);assert.ok(s.position[0]>0);await capture('aim-and-dodge');
    await advance(s.windArt.spirits[0].life-.01);assert.equal((await state()).windArt.spirits.length,1);await advance(.02);s=await state();fps(s);assert.equal(s.windArt.spirits.length,0);
    await reset();await cast('wind-reflect');await advance(1.81);await enemy('fire-orb',[0,1.72,-5],[0,0,1]);await advance(.1);s=await state();fps(s);assert.equal(s.windArt.reflections,1);assert.equal(s.projectiles[0].owner,'player');await capture('front-reflection');
    await reset();await cast('wind-reflect');await advance(1.81);await cast('fire-lance');await advance(1.2);s=await state();assert.equal(s.cameraView,'overhead','A wind spirit does not disable another spell camera');assert.ok(s.windArt.spirits.length);await reset();fps(await state());
    await click('qualityButton');await cast('wind-reflect');await advance(.9);fps(await state());await capture('front-low');await reset();
    await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});await click('soundButton');await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));await click('startButton');await cast('wind-reflect');await advance(.9);fps(await state());await capture('front-reduced-motion');await advance(.9);close((await state()).windArt.spirits[0].life,5);await advance(5.01);fps(await state());assert.equal((await state()).windArt.spirits.length,0);
    assert.deepEqual(errors,[]);await fs.writeFile(output+'/verification.json',JSON.stringify({passed:true,activeDuration:5,camera:'FPS',model:'toon-butterfly-spirit',checks:['front eye-level placement','FPS throughout formation and activation','hands and controls','five-second expiry','pause/reset','reflection','other spell cameras','low quality','reduced motion'],errors},null,2));console.log('PASS: frontal toon spirit, FPS, five-second protection, controls, reflection, normal spell cameras, pause/reset, low quality and reduced motion.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
