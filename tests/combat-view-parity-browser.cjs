const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{chromium}=require('playwright');
(async()=>{
 const out='test-results/combat-view-parity';await fs.mkdir(out,{recursive:true});const errors=[],report=[];
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--allow-file-access-from-files','--use-angle=swiftshader','--enable-unsafe-swiftshader']});let page,checkpoint='load';
 try{
  page=await browser.newPage({viewport:{width:1280,height:800}});page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.stack));await page.goto(require('node:url').pathToFileURL(path.resolve('index.html')).href+'?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');const state=()=>page.evaluate(()=>__AN_HOA__.state());
  for(const id of ['fire','water','lightning','wind','earth','light','dark','wood','ice']){
   const samples=[];
   for(const view of ['first-person','overhead']){
    checkpoint=id+' '+view;console.log('CHECK: '+checkpoint);await page.locator('#startButton').click();await page.locator('[data-practice-type=guardian]').click();await page.locator('[data-practice-guardian='+id+']').click();await page.locator('#practiceOpponentConfirm').click();await page.locator('[name=practiceView][value='+view+']').check();await page.locator('#practiceViewConfirm').click();
    await page.evaluate(()=>{__AN_HOA__.audio.configure({muted:true});__AN_HOA__.setHealth('player',100000);__AN_HOA__.setAIEnabled(true);__AN_HOA__.guardianArt(1);__AN_HOA__.advance(.1);__AN_HOA__.setAIEnabled(false);});let s=await state();assert.equal(s.guardianPhases.thirdPerson,true);assert.ok(s.guardianPhases.action);assert.equal(s.combatSize.scale,1.5);assert.equal(s.practiceView,view);
    samples.push({phase:s.guardianPhases.phase,phaseHealth:s.guardianPhases.phaseHealth,action:s.guardianPhases.action.name,actionType:s.guardianPhases.action.type,scale:s.combatSize.scale,spells:s.enemyLoadout});
    await page.locator('#combatSettingsButton').click();const frozen=await state();assert.equal(await page.locator('#combatView').isDisabled(),true);
    await page.locator('#combatView').evaluate(el=>{el.value=el.value==='overhead'?'first-person':'overhead';el.dispatchEvent(new Event('change',{bubbles:true}));});s=await state();assert.equal(s.practiceView,view);assert.equal(s.paused,true);assert.deepEqual(s.guardianPhases,frozen.guardianPhases);assert.deepEqual(s.enemyMovement,frozen.enemyMovement);assert.equal(s.enemyHealth,frozen.enemyHealth);
    await page.locator('#closeCombatSettings').click();if(!(await state()).paused)await page.keyboard.press('Escape');await page.locator('#changeLoadout').click();
   }
   assert.deepEqual(samples[0],samples[1],id+' uses the same kit, phase health, skill and scale in both views');report.push({id,sharedArsenal:true,viewLockedDuringBattle:true});
  }
  assert.deepEqual(errors,[]);await fs.writeFile(out+'/report.json',JSON.stringify({report,errors},null,2));console.log('PASS: all nine guardians share the same skills, phase health and scale in both preselected views; camera changes are blocked during battle and pause.');
 }catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({checkpoint,message:e.message,errors},null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
