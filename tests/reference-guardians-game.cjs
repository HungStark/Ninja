const {chromium}=require('playwright'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const {newJourney}=await import('../src/adventure-data.js'),{promiseMother,chooseStarter}=await import('../src/journey-story.js');
 const {REFERENCE_GUARDIANS}=await import('../src/reference-guardians.js');
 const save=newJourney();promiseMother(save);chooseStarter(save,'fire-volley');
 const out='test-results/reference-guardians-game';await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']}),page=await browser.newPage({viewport:{width:1000,height:650}}),errors=[],report=[];
 page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.setDefaultTimeout(60000);
 await page.addInitScript(s=>localStorage.setItem('anhoa-adventure-v1',JSON.stringify(s)),save);
 try{
  for(const id of process.env.GUARDIAN_GAME_IDS?.split(',')||REFERENCE_GUARDIANS){
   await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&adventure=1');await page.waitForFunction(()=>document.body.dataset.ready==='true');
   await page.locator('#continueJourney').click();await page.waitForFunction(()=>!__AN_HOA__.adventure().loading);
   await page.evaluate(id=>{__AN_HOA__.explore.setRandom(false);__AN_HOA__.explore.offerBattle('random',{kind:'boss',village:id,element:id==='nameless'?'wind':id,name:'Guardian reference check',guardianForm:'beast',beastOnly:true,phases:2,hp:100000,immediate:true});},id);
   assert.equal(await page.evaluate(()=>__AN_HOA__.adventure().phase),'loadout');await page.locator('#startButton').click();
   await page.waitForFunction(()=>!__AN_HOA__.state().battleIntro.active||__AN_HOA__.state().battleIntro.loaded);
   await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.setHealth('player',100000);__AN_HOA__.advance(5);});
   const before=await page.evaluate(()=>__AN_HOA__.state());assert.equal(before.enemyAppearance.kind,'creature');assert.equal(before.enemyAppearance.id,id);assert.equal(before.guardianPhases.form,'beast');
   await page.evaluate(()=>{__AN_HOA__.setAIEnabled(true);__AN_HOA__.guardianArt(0);__AN_HOA__.advance(.4);});
   await page.screenshot({path:out+'/'+id+'.png'});const state=await page.evaluate(()=>__AN_HOA__.state());assert.ok(state.enemyPosition.every(Number.isFinite));
   report.push({id,model:state.guardianModel,phase:state.guardianPhases.phase,triangles:state.triangles,action:state.guardianPhases.action});console.log('GAME '+id);
  }
  const suffix=process.env.GUARDIAN_GAME_IDS?'-'+process.env.GUARDIAN_GAME_IDS.replaceAll(',','-'):'';
  assert.deepEqual(errors,[]);await fs.writeFile(out+'/report'+suffix+'.json',JSON.stringify({passed:true,errors,report},null,2));console.log('PASS: '+report.length+' reference beasts load and attack in the real built game without page or shader errors.');
 }catch(e){await fs.writeFile(out+'/errors.json',JSON.stringify({error:e.stack,errors},null,2));await page.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
