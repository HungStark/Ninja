const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const out='test-results/combat-settings-revision';await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 let page,checkpoint='load';const errors=[],reports=[];
 try{
  for(const mobile of process.argv.includes('--desktop')?[false]:process.argv.includes('--mobile')?[true]:[false,true]){
   checkpoint=mobile?'mobile':'desktop';console.log('CHECK: '+checkpoint);
   const context=await browser.newContext({viewport:mobile?{width:915,height:412}:{width:1366,height:900},hasTouch:mobile,isMobile:mobile});page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.stack));
   const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),click=sel=>mobile?page.locator(sel).tap():page.locator(sel).click();
   await page.goto('file:///'+path.resolve(mobile?'android-apk/www/index.html':'index.html').replaceAll('\\','/')+'?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
   if(mobile){
    checkpoint='authentic layout previews';await page.evaluate(()=>window.dispatchEvent(new Event('anhoa:mobile-layout')));
    await click('[data-layout-mode=explore]');const preview=page.frameLocator('#mobileLayoutGamePreview');await preview.locator('#androidJoystick').waitFor();assert.equal(await preview.locator('[data-mobile-key]').count(),4);
    await page.screenshot({path:out+'/layout-explore.png'});await click('[data-layout-mode=combat]');await preview.locator('.tactical-spell').first().waitFor();
    assert.equal(await preview.locator('.tactical-spell').count(),5);assert.equal(await preview.locator('.tactical-spell img').count(),5);assert.equal(await preview.locator('#tacticalCast .tactical-sword').count(),1);assert.equal(await preview.locator('#tacticalDash svg').count(),1);assert.equal(await preview.locator('#practiceHandViewport img').count(),1);
    await page.screenshot({path:out+'/layout-combat.png'});
    for(const [width,height] of [[568,320],[480,270],[915,412]]){await page.setViewportSize({width,height});await page.waitForTimeout(200);await preview.locator('.tactical-spell').first().waitFor();const r=await page.locator('#mobileLayoutBoard').boundingBox();assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1);}
    await click('#mobileLayoutCancel');
   }
   checkpoint='custom practice opponent';await click('#startButton');await click('[data-practice-filter=water]');await click('#practiceEnemySelectElement');
   const chosen=await page.locator('[data-practice-remove]').evaluateAll(els=>els.map(e=>e.dataset.practiceRemove));assert.equal(chosen.length,5);await click('#practiceOpponentConfirm');await click('#practiceViewConfirm');
   let s=await state();assert.deepEqual(s.enemyLoadout,chosen);assert.deepEqual(s.enemySpells.map(x=>x.id),chosen);await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.audio.configure({muted:true});});
   const fire=await page.evaluate(()=>SealGameCore.spells.find(s=>s.id===__AN_HOA__.state().loadout[0]));for(const key of fire.sequence)await page.keyboard.press(key);await advance(.01);assert.ok((await state()).practiceOverhead.preview);
   async function settings(){await advance(0);if(mobile){if(!(await state()).paused)await click('#tacticalSettings');await click('[data-tactical-tab=combat]');}else await click((await state()).paused?'#pauseCombatSettingsButton':'#combatSettingsButton');}
   async function close(){if(mobile)await click('#tacticalCloseSettings');else{await click('#closeCombatSettings');if((await state()).paused)await click('#resumeButton');}await advance(.01);}
   await settings();const frozen=await state();await page.locator('#beginnerAimAssist').uncheck();assert.equal((await state()).combatControls.targetId,null);await page.locator('#beginnerAimAssist').check();assert.equal((await state()).combatControls.targetId,'primary');assert.equal(await page.locator('#combatView').isDisabled(),true);await page.locator('#combatView').evaluate(el=>{el.value='first-person';el.dispatchEvent(new Event('change',{bubbles:true}));});s=await state();
   assert.equal(s.paused,true);assert.equal(s.practiceView,'overhead');for(const key of ['enemyHealth','health','chakra','battleTime'])assert.equal(s[key],frozen[key],key+' preserved');assert.deepEqual(s.enemyLoadout,chosen);assert.deepEqual(s.sequence,frozen.sequence);assert.equal(s.combatSize.scale,1.5);assert.equal(s.playerAvatar.visible,true);assert.equal(s.handsVisible,false);assert.equal(s.practiceOverhead.fencesVisible,true);
   await page.locator('#combatPredictionLines').uncheck();await close();assert.equal((await state()).practiceOverhead.visible,false);
   checkpoint='prediction setting persistence and casting';await settings();await page.locator('#combatPredictionLines').check();await close();assert.equal((await state()).practiceOverhead.visible,true);assert.equal((await state()).handsVisible,false);
   const before=await state();await click(mobile?'#tacticalCast':'#castButton');await advance(.01);s=await state();assert.equal(s.casts,before.casts+1);assert.equal(s.shurikenThrows,before.shurikenThrows,'casting never emits an extra shuriken');
   if(mobile){
    checkpoint='multi-touch release ordering';await advance(fire.cooldown+.1);await page.keyboard.press('Backspace');for(const key of fire.sequence.slice(0,-1))await page.keyboard.press(key);await advance(.01);
    const client=await context.newCDPSession(page),spell=await page.locator('[data-tactical-spell="0"]').boundingBox(),attack=await page.locator('#tacticalCast').boundingBox(),p={x:spell.x+spell.width/2,y:spell.y+spell.height/2,id:1},q={x:attack.x+attack.width/2,y:attack.y+attack.height/2,id:2};
    const b=await state();await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p,q]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[p]});await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await advance(.01);
    s=await state();assert.equal(s.shurikenThrows,b.shurikenThrows);assert.equal(s.sequence.length,0);assert.equal(s.casts,b.casts+1);
   }
   checkpoint='enemy prediction visibility';await page.evaluate(()=>{__AN_HOA__.setHealth('player',100000);__AN_HOA__.setAIEnabled(true);for(let i=0;i<180&&!__AN_HOA__.state().ninjaWarnings.some(j=>!j.fired);i++)__AN_HOA__.advance(.05);__AN_HOA__.setAIEnabled(false);});
   const warning=(await state()).ninjaWarnings.find(j=>!j.fired);assert.ok(warning,'bot prepares one of the selected skills');await page.evaluate(()=>{const input=document.getElementById('combatPredictionLines');input.checked=false;input.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal((await state()).ninjaWarnings.find(j=>j.id===warning.id).visible,false);if((await state()).paused)await page.evaluate(()=>document.getElementById('resumeButton').click());await advance(.7);assert.equal((await state()).ninjaWarnings.find(j=>j.id===warning.id)?.fired,true,'hiding warnings preserves the cast');
   await page.screenshot({path:out+'/'+(mobile?'mobile':'desktop')+'-combat.png'});
   checkpoint='first-person choice before battle';await settings();if(mobile)await click('[data-tactical-tab=general]');else await click('#closeCombatSettings');if(!(await state()).paused)await page.keyboard.press('Escape');await click('#changeLoadout');await advance(.01);await click('#startButton');await click('#practiceOpponentConfirm');await page.locator('[name=practiceView][value=first-person]').check();await click('#practiceViewConfirm');await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));s=await state();assert.equal(s.practiceView,'first-person');assert.equal(s.combatSize.scale,1.5);assert.equal(s.playerAvatar.visible,false);assert.equal(s.handsVisible,true);assert.deepEqual(s.enemyLoadout,chosen);
   await settings();assert.equal(await page.locator('#combatView').isDisabled(),true);await page.locator('#combatView').evaluate(el=>{el.value='overhead';el.dispatchEvent(new Event('change',{bubbles:true}));});assert.equal((await state()).practiceView,'first-person');await close();await page.screenshot({path:out+'/'+(mobile?'mobile':'desktop')+'-first-person.png'});
   reports.push({mobile,chosen,viewLockedDuringBattle:true,noExtraShuriken:true});await context.close();
  }
  assert.deepEqual(errors,[]);await fs.writeFile(out+'/report.json',JSON.stringify({reports,errors},null,2));console.log('PASS: authentic layout previews, custom enemy loadout, persistent settings, camera locked during battle, prediction lines and mobile casting.');
 }catch(error){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});error.message=checkpoint+': '+error.message;await fs.writeFile(out+'/failure.json',JSON.stringify({checkpoint,message:error.message,errors,state:await page?.evaluate(()=>__AN_HOA__?.state()).catch(()=>null)},null,2));throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
