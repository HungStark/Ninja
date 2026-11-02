const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
  const out='test-results/mobile-scroll-seals';await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  let page=await browser.newPage({viewport:{width:696,height:330},hasTouch:true}),checkpoint='load';const errors=[];
  const watch=()=>{page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(60000);};watch();
  const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=seconds=>page.evaluate(s=>__AN_HOA__.advance(s),seconds);
  const recipe=id=>page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).sequence,id);
  const tap=async i=>{await page.locator('[data-spell="'+i+'"] .spell-picture').tap();};
  const seq=async expected=>assert.deepEqual((await state()).sequence,expected);
  const clear=async()=>{await page.locator('#androidClearSeals').tap();await seq([]);};
  const start=async()=>{
    await page.waitForFunction(()=>document.body.dataset.ready==='true');
    await page.evaluate(()=>{document.getElementById('clearLoadout').click();for(const id of ['fire-volley','fire-lance','fire-meteor','water-barrier','lightning-lance'])document.querySelector('[data-equip="'+id+'"]').click();document.getElementById('startButton').click();});
    await page.waitForFunction(()=>__AN_HOA__.state().started);await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.setHealth('enemy',__AN_HOA__.state().enemyMaxHealth);});await advance(.01);
  };
  try{
    await page.goto('file:///'+path.join(process.cwd(),'android-apk/www/index.html').replaceAll('\\','/')+'?test=1&mode=duel');await start();
    checkpoint='one touch one real seal';assert.equal(await page.locator('[data-touch-seal]').count(),0);assert.equal(await page.locator('#spellList [data-spell]').count(),5);
    await tap(0);await seq(['q']);assert.equal((await state()).activePose,0);assert.equal((await state()).casts,0);
    await tap(0);await seq(['q','w']);assert.equal((await state()).activePose,1);assert.equal((await state()).casts,0);
    assert.match(await page.locator('#comboSlots').innerText(),/Q/);assert.equal(await page.locator('#spellList [data-spell="0"] .spell-sequence').isVisible(),true);
    await tap(0);await seq(['q']);await tap(0);await seq(['q','w']);
    checkpoint='shared prefix into dragon';const dragon=await recipe('fire-lance');await tap(1);await seq(dragon.slice(0,3));for(let i=3;i<dragon.length;i++)await tap(1);await seq(dragon);assert.equal((await state()).casts,0);
    checkpoint='same shared chain accepts keyboard seals';await clear();await tap(0);await tap(0);await page.keyboard.press('f');await seq(['q','w','f']);
    checkpoint='shared prefix into meteor';await clear();await tap(0);await tap(0);const meteor=await recipe('fire-meteor');for(let i=2;i<meteor.length;i++){await tap(2);await seq(meteor.slice(0,i+1));}assert.equal((await state()).casts,0);
    checkpoint='casting remains a separate single action';await clear();await tap(0);await tap(0);await page.locator('#castButton').tap();assert.equal((await state()).casts,1);assert.equal((await state()).shurikenThrows,0);await seq([]);
    checkpoint='a cooling source still supplies shared seals';assert.ok((await state()).cooldowns['fire-volley']>0);await tap(0);await tap(0);await seq(['q','w']);await tap(1);await seq(dragon.slice(0,3));
    checkpoint='incompatible target starts its own recipe';const water=await recipe('water-barrier');await tap(3);await seq(water.slice(0,1));for(let i=1;i<water.length;i++)await tap(3);await seq(water);await tap(3);await seq(water.slice(0,1));
    checkpoint='boost and movement preserve the shared chain';const before=(await state()).sequence;await page.locator('#dashBoostButton').tap();await seq(before);await page.locator('#androidStepRight').tap();await advance(.2);await seq(before);
    checkpoint='pause prevents seal input';await page.locator('#androidSettings').tap();const paused=(await state()).sequence;await page.locator('[data-spell="0"]').evaluate(el=>el.click());await seq(paused);await page.locator('#androidLayoutSettings').tap();assert.equal(await page.locator('[data-layout-widget^="seal-"]').count(),0);assert.ok(await page.locator('[data-layout-widget="guide"]').isVisible());await page.locator('#mobileLayoutCancel').tap();await page.locator('#resumeButton').tap();await advance(.01);
    checkpoint='default layout at phone sizes';await clear();
    for(const [width,height] of [[696,330],[915,412],[568,320],[540,405],[480,270]]){
      await page.setViewportSize({width,height});await advance(.01);await page.locator('#guide').evaluate(el=>el.getAnimations({subtree:true}).forEach(a=>a.finish()));
      const bounds=await page.locator('#guide,.center-status,#hud>.status,#castButton,#androidAmmo,#androidStepLeft,#dashBoostButton,#androidStepRight,#androidSettings').evaluateAll(els=>Object.fromEntries(els.map(el=>{const r=el.getBoundingClientRect();return [el.id||el.classList[0],{x:r.x,y:r.y,right:r.right,bottom:r.bottom}];})));
      assert.ok(Object.values(bounds).every(r=>r.x>=0&&r.y>=0&&r.right<=width+.1&&r.bottom<=height+.1),JSON.stringify(bounds));
      assert.ok(bounds.guide.right<bounds['center-status'].x);assert.ok(bounds['center-status'].bottom<=bounds.status.y+2);assert.ok(bounds.status.bottom<bounds.androidStepLeft.y+2);
      const controls=['castButton','androidAmmo','androidStepLeft','dashBoostButton','androidStepRight'].map(id=>bounds[id]);assert.ok(controls.slice(1).every((r,i)=>r.x>=controls[i].right-1),JSON.stringify(controls));
      const icons=await page.locator('#spellList .spell-picture').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {y:r.y,bottom:r.bottom,w:r.width,h:r.height};}));assert.ok(icons.every(r=>r.y>=bounds.guide.y&&r.bottom<=bounds.guide.bottom+1&&r.w>=27&&r.h>=27),JSON.stringify(icons));
      await page.screenshot({path:out+'/combat-'+width+'.png'});
    }
    checkpoint='cast dragon using the volley seals';await clear();await tap(0);await tap(0);for(let i=2;i<dragon.length;i++)await tap(1);await seq(dragon);await advance(1);assert.equal(await page.locator('#castButton').isDisabled(),false);const casts=(await state()).casts;await page.locator('#castButton').tap();assert.equal((await state()).casts,casts+1);assert.ok((await state()).cooldowns['fire-lance']>0);
    checkpoint='desktop keeps selection and keyboard controls';await page.close();page=await browser.newPage({viewport:{width:1280,height:800}});watch();await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&mode=duel');await start();assert.equal(await page.locator('#androidControls').count(),0);await page.locator('[data-spell="0"] .spell-picture').click();await seq([]);await page.keyboard.press('q');await page.keyboard.press('w');await seq(['q','w']);await page.locator('[data-spell="1"] .spell-picture').click();await seq(['q','w']);await page.keyboard.press('f');await seq(['q','w','f']);
    assert.deepEqual(errors,[]);await Promise.all(['failure.json','failure.png'].map(name=>fs.unlink(out+'/'+name).catch(e=>{if(e.code!=='ENOENT')throw e;})));console.log('PASS: mobile one-tap real seal, Q/W looping, shared Q/W prefixes across spells and keyboard, cooling source reuse, separate single cast, incompatible spell switching, pause/movement retention, no seal-key widgets, five responsive phone layouts, and unchanged desktop controls.');
  }catch(error){await page.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({checkpoint,message:error.message,errors,state:await state().catch(()=>null)},null,2));throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
