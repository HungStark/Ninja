const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{build}=require('esbuild'),{chromium}=require('playwright');
(async()=>{
 const out='test-results/guardian-arsenal';await fs.mkdir(out,{recursive:true});
 const {GUARDIAN_ARSENAL_DESIGNS:designs}=await import('../src/guardian-arsenal-data.js');
 const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',plugins:[{name:'arsenal-controls',setup(b){b.onLoad({filter:/[/\\]src[/\\]main\.js$/},async({path})=>{let source=await fs.readFile(path,'utf8');assert.ok(source.includes('quality,incomingShots:shots'));source=source.replace('quality,incomingShots:shots','quality,aiEnabled:!window.__arsenalManual,incomingShots:shots');return {contents:source,loader:'js'};});}}]});
 const port=4391,server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page,checkpoint='start';const errors=[],reports=[];
 try{
  await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);server.once('exit',code=>j(Error('Server exited '+code)));});
  browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const variants=process.argv.includes('--adventure')?[{adventure:true,ids:['water']}]:process.argv.includes('--mobile')?[{touch:true,ids:['water','lightning','ice']}]:[{ids:Object.keys(designs)},{english:true,ids:['fire']}];
  for(const variant of variants){
   page=await browser.newPage({viewport:variant.touch?{width:915,height:412}:{width:1280,height:800},hasTouch:!!variant.touch,isMobile:!!variant.touch});page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
   if(!variant.english)await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
   if(variant.adventure){const {newJourney}=await import('../src/adventure-data.js'),{promiseMother,chooseStarter}=await import('../src/journey-story.js'),save=newJourney();promiseMother(save);chooseStarter(save,'fire-volley');save.story.stage='infiltrate';save.story.guardianRestored=true;await page.addInitScript(s=>localStorage.setItem('anhoa-adventure-v1',JSON.stringify(s)),save);}
   await page.goto(`http://127.0.0.1:${port}/${variant.english?'index.en.html':'index.html'}?test=1&${variant.adventure?'adventure=1':'mode=duel'}`);await page.waitForFunction(()=>document.body.dataset.ready==='true');
   if(variant.touch)await page.evaluate(()=>{document.body.dataset.android='true';location.reload();});if(variant.touch)await page.waitForFunction(()=>document.body.dataset.ready==='true');
   const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
   for(const id of variant.ids){
    checkpoint=(variant.touch?'mobile':variant.english?'en':'desktop')+' '+id;console.log('CHECK '+checkpoint);
    if(variant.adventure){await page.locator('#continueJourney').click();await page.waitForFunction(()=>!__AN_HOA__.adventure().loading);await page.evaluate(id=>{__AN_HOA__.explore.setRandom(false);__AN_HOA__.explore.offerBattle('random',{kind:'boss',village:id,element:id,name:'Thủy Long',beastOnly:true});for(let i=0;i<40&&!__AN_HOA__.adventure().dialogue.complete;i++)document.getElementById('dialogNext').click();},id);await page.locator('#dialogActions button').first().click();await page.locator('#startButton').click();await page.waitForFunction(()=>!__AN_HOA__.state().battleIntro.active||__AN_HOA__.state().battleIntro.loaded);await advance(2.2);}
    else{await page.locator('#startButton').click();await page.locator('[data-practice-type=guardian]').click();await page.locator('[data-practice-guardian='+id+']').click();assert.equal(await page.locator('#practiceGuardianSelected li').count(),designs[id].skills.length);
    if(variant.english)assert.ok(!/[À-ỹĐđ]/.test(await page.locator('#practiceGuardianSelected ol').innerText()));
    await page.locator('#practiceOpponentConfirm').click();await page.locator('[name=practiceView][value=overhead]').check();await page.locator('#practiceViewConfirm').click();}
    await page.evaluate(()=>{window.__arsenalManual=false;__AN_HOA__.setAIEnabled(true);__AN_HOA__.setHealth('player',100000);});await advance(12);
    let s=await state();assert.equal(s.guardianPhases.arsenal,true);assert.ok(s.guardianPhases.attacks>=3,id+' active pressure');assert.equal(s.aiCasts,0,'beasts never use ninja seal AI');assert.equal(s.guardianPhases.skills.length,designs[id].skills.length);
    if(!variant.english){
     await page.evaluate(()=>window.__arsenalManual=true);await advance(10);const before=(await state()).guardianPhases.bossPosition;
     const index=designs[id].skills.findIndex(x=>x.role==='pursuit');if(index>=0){assert.ok(await page.evaluate(i=>__AN_HOA__.guardianArt(i),index));await advance(.8);await page.screenshot({path:out+'/'+checkpoint.replaceAll(' ','-')+'-attack.png'});await advance(7);const after=(await state()).guardianPhases.bossPosition;assert.ok(Math.hypot(after[0]-before[0],after[2]-before[2])<.05,'returns to attack origin');}
    }
    s=await state();reports.push({variant:checkpoint,attacks:s.guardianPhases.attacks,stage:s.guardianPhases.combatStage,director:s.guardianPhases.director,mechanics:s.guardianPhases.mechanics});
    if(variant.touch){await page.locator('#tacticalSettings').tap();await page.locator('[data-tactical-tab=general]').tap();}else await page.keyboard.press('Escape');
    const frozen=(await state()).guardianPhases;await advance(1);assert.deepEqual((await state()).guardianPhases,frozen);if(!variant.adventure){await page.locator('#changeLoadout').click();if(variant.touch&&await page.locator('#tacticalSettingsMenu').isVisible())await page.locator('#tacticalCloseSettings').click();}
   }
   await page.close();
  }
  assert.deepEqual(errors,[]);await fs.writeFile(out+'/integration'+(process.argv.includes('--mobile')?'-mobile':'')+'.json',JSON.stringify(reports,null,2));console.log('PASS: complete authored loadouts, real boss AI, home-return attacks, no ninja casts, pause and localized names.');
 }catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({checkpoint,error:e.message,errors,state:await page?.evaluate(()=>__AN_HOA__.state()).catch(()=>null)},null,2));throw e;}finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
