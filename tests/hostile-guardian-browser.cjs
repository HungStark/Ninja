const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{build}=require('esbuild'),{chromium}=require('playwright');

(async()=>{
 const {campaignFixtures}=await import('./campaign-fixtures.mjs'),fixtures=campaignFixtures();
 const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',plugins:[{name:'guardian-inspector',setup(b){b.onLoad({filter:/[/\\]src[/\\]adventure\.js$/},async({path})=>({loader:'js',contents:(await fs.readFile(path,'utf8')).replace('const world=createAdventureScene();','const world=window.__guardianWorld=createAdventureScene();')}));}}]});
 const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4394'},windowsHide:true,stdio:['ignore','pipe','pipe']}),out='test-results/hostile-guardian';await fs.mkdir(out,{recursive:true});let browser,page,checkpoint='server';const errors=[],reports=[];
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Test server exited: '+code)));});
  browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const restartOnly=process.argv.includes('--restart-only');
  for(const test of restartOnly?[]:[{id:'water'},{id:'fire'},{id:'lightning'},{id:'fire',mobile:true},{id:'water',resume:true}]){
   checkpoint=test.id+(test.mobile?'-mobile':test.resume?'-resume':'');console.log('CHECK: '+checkpoint);
   page=await browser.newPage({viewport:{width:test.mobile?915:1100,height:test.mobile?412:720},hasTouch:!!test.mobile,isMobile:!!test.mobile});page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
   const seed=structuredClone(fixtures[test.id+':report']);seed.interior=null;seed.position=[0,7];seed.story.guardianOrders=seed.story.guardianOrders.filter(id=>id!==test.id);seed.story.defeatedGuards=seed.story.defeatedGuards.filter(id=>!id.startsWith(test.id+'-guardian-sentry-'));
   if(test.resume){seed.story.guardianOrders.push(test.id);seed.story.defeatedGuards.push(test.id+'-guardian-sentry-1');}
   await page.addInitScript(({seed,mobile})=>{localStorage.setItem('anhoa-adventure-v1',JSON.stringify(seed));if(mobile)document.addEventListener('DOMContentLoaded',()=>document.documentElement.dataset.android='true',{once:true});},{seed,mobile:test.mobile});
   const journey=()=>page.evaluate(()=>__AN_HOA__.adventure()),combat=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),primary=()=>page.locator('#dialogActions button').first();
   const finish=async()=>{const lines=new Map();for(let i=0;i<20;i++){const s=await journey();assert.equal(s.phase,'dialog');lines.set(s.dialogue.index,await page.locator('#dialogBody').getAttribute('aria-label'));if(s.dialogue.complete)return [...lines.values()];await page.locator('#dialogNext').click();}throw Error('Dialogue did not finish');};
   await page.goto('http://127.0.0.1:4394/?test=1&adventure=1');await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#continueJourney').click();await page.waitForFunction(()=>!__AN_HOA__.adventure().loading);
   await page.evaluate(()=>{__AN_HOA__.audio.configure({muted:true,readDialogue:false});__AN_HOA__.explore.setRandom(false);const w=__guardianWorld;w.advanceGuards=()=>[];w.caughtGuard=()=>null;window.__villageLoads=0;window.__originalHero=w.hero;const load=w.load;w.load=(...args)=>{__villageLoads++;return load(...args);};const c=w.civic.campuses.hall,z=c.d/2-1;w.hero.root.position.set(c.x+Math.sin(c.yaw)*z,c.base,c.z+Math.cos(c.yaw)*z);});
   await advance(.01);
   if(!test.resume){
    assert.equal((await journey()).phase,'dialog');assert.match(await page.locator('#dialogKicker').innerText(),/LINH THÚ CHẶN CỔNG/);assert.equal(await primary().isDisabled(),true);
    await page.evaluate(()=>document.querySelector('#dialogActions button').onclick());assert.ok(!(await journey()).save.story.guardianOrders.includes(test.id),'unread guardian speech cannot be bypassed');
    const lines=await finish();assert.equal(lines.length,4);assert.match(lines[2],/khống chế|Bắt giữ|bắt giữ/);assert.ok(!lines.some(l=>/so tài|kiểm tra bản lĩnh/.test(l)));
    await page.screenshot({path:out+'/'+checkpoint+'-guardian.png'});
    await page.evaluate(()=>{const button=document.querySelector('#dialogActions button'),callback=button.onclick;button.onclick=e=>{const start=performance.now();callback(e);window.__guardianHandoffMs=performance.now()-start;};});
    await primary().click();assert.equal((await journey()).phase,'dialog');assert.equal(await page.evaluate(()=>__guardianWorld.boss),null);
   }
   assert.equal(await page.evaluate(()=>__villageLoads),0,'handoff does not rebuild the village');assert.equal(await page.evaluate(()=>__originalHero===__guardianWorld.hero),true);
   assert.equal((await journey()).dialogue.count,2);assert.equal((await journey()).encounter.squad.length,test.resume?1:2);assert.notEqual((await journey()).encounter.immediate,true);
   const guardLines=await finish();assert.deepEqual(guardLines,['Tôi tới đây','Tới đi']);
   await primary().click();assert.equal((await journey()).phase,'loadout');assert.equal((await combat()).started,false);assert.equal(await page.locator('#startScreen').isVisible(),true,'the preparation scroll opens before the fight');assert.ok(await page.locator('#spellCatalog .spell').count()>0);assert.equal((await journey()).dialogue.active,false);
   await advance(.25);assert.equal((await journey()).phase,'loadout','combat waits for the player to finish preparing');await page.screenshot({path:out+'/'+checkpoint+'-scroll.png'});
   await page.locator('#startButton').click();await page.waitForFunction(()=>__AN_HOA__.state().started);assert.equal((await journey()).phase,'combat');await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));await advance(3);assert.equal((await combat()).squad.length,test.resume?1:2);await page.screenshot({path:out+'/'+checkpoint+'-combat.png'});
   await page.evaluate(()=>{for(const actor of __AN_HOA__.state().squad)__AN_HOA__.setHealth(actor.id,0);});await advance(.1);assert.equal((await combat()).won,true);await page.locator('#nextButton').click();await page.waitForFunction(()=>!__AN_HOA__.adventure().loading);
   assert.equal((await journey()).phase,'dialog');const result=await page.locator('#dialogBody').innerText();assert.match(result,/Hai hộ vệ đã bị đánh bại/);assert.doesNotMatch(result,/công nhận bản lĩnh|so tài|thách đấu/);
   for(const n of [1,2])assert.ok((await journey()).save.story.defeatedGuards.includes(test.id+'-guardian-sentry-'+n));
   await page.evaluate(()=>__AN_HOA__.explore.offerBattle('random',{immediate:true}));assert.equal((await journey()).phase,'loadout');assert.equal((await combat()).started,false);assert.equal(await page.locator('#startScreen').isVisible(),true,'an immediate encounter must also open the scroll');
   reports.push({...test,guardLines,handoffMs:await page.evaluate(()=>window.__guardianHandoffMs||0),villageLoads:await page.evaluate(()=>__villageLoads)});await page.close();
  }
  checkpoint='practice-restart';console.log('CHECK: '+checkpoint);page=await browser.newPage({viewport:{width:1100,height:720}});page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
  await page.goto('http://127.0.0.1:4394/?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');
  await page.evaluate(()=>__AN_HOA__.audio.configure({muted:true}));await page.locator('#startButton').click();await page.locator('#practiceOpponentConfirm').click();await page.locator('#practiceViewConfirm').click();await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.advance(3);});
  await page.locator('#world').focus();await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>__AN_HOA__.state().paused),true);await page.locator('#resetButton').click();assert.equal(await page.evaluate(()=>__AN_HOA__.state().started),false);assert.equal(await page.locator('#startScreen').isVisible(),true,'practice restart opens the scroll');
  await page.evaluate(()=>__AN_HOA__.advance(.25));assert.equal(await page.evaluate(()=>__AN_HOA__.state().started),false,'restart waits for confirmation');await page.screenshot({path:out+'/practice-restart-scroll.png'});
  await page.locator('#startButton').click();await page.locator('#practiceOpponentConfirm').click();await page.locator('#practiceViewConfirm').click();assert.equal(await page.evaluate(()=>__AN_HOA__.state().started),true);reports.push({restart:true,preparationScroll:true});
  assert.deepEqual(errors,[]);await fs.writeFile(out+(restartOnly?'/restart-report.json':'/report.json'),JSON.stringify(reports,null,2));await Promise.all(['failure.json','failure.png'].map(name=>fs.unlink(out+'/'+name).catch(e=>{if(e.code!=='ENOENT')throw e;})));console.log(restartOnly?'PASS: restarting practice opens the scroll and waits for explicit confirmation.':'PASS: three hostile village speeches, exact two-line sentry exchange, no village rebuild, mandatory preparation scroll for guardian/immediate/restarted encounters, explicit battle start, mobile/retry behavior and withdrawal text.');
 }catch(error){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({checkpoint,error:error.message,errors},null,2));throw error;}finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
