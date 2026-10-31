const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{chromium}=require('playwright'),{build}=require('esbuild');
(async()=>{
 const out='test-results/loading';await fs.mkdir(out,{recursive:true});
 // Expose the actual scene only in this test bundle to hold asset readiness and inspect load order.
 const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',plugins:[{name:'inspect-loading',setup(b){b.onLoad({filter:/[/\\]src[/\\]adventure\.js$/},async({path})=>({contents:(await fs.readFile(path,'utf8')).replace('const world=createAdventureScene();','const world=window.__loadingWorld=createAdventureScene();'),loader:'js'}));}}]});
 const port=process.env.LOADING_TEST_PORT||'4335',server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:port},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page;
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error('Test server exited: '+code)));});
  browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  page=await browser.newPage({viewport:{width:1100,height:700}});page.setDefaultTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')console.log('Browser: '+m.text());});
  await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
  await page.addInitScript(()=>{
   const fixture=sessionStorage.getItem('loading-fixture');if(fixture){localStorage.setItem('anhoa-adventure-v1',fixture);sessionStorage.removeItem('loading-fixture');}
   const raf=window.requestAnimationFrame.bind(window);window.__heldFrames=[];
   window.requestAnimationFrame=cb=>window.__holdPaint?(window.__heldFrames.push(cb),0):raf(cb);
   window.__releasePaint=()=>{window.__holdPaint=false;window.__heldFrames.splice(0).forEach(cb=>raf(cb));};
  });
  const state=()=>page.evaluate(()=>__AN_HOA__.adventure()),settled=()=>page.waitForFunction(()=>!__AN_HOA__.adventure().loading);
  const open=async()=>{await page.goto(`http://127.0.0.1:${port}/?test=1&adventure=1`);await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.evaluate(()=>{
   window.__loads=[];const world=window.__loadingWorld,load=world.load,ready=world.charactersReady;
   world.load=(...args)=>{window.__loads.push({village:args[0],overlay:!document.getElementById('journeyLoading').hidden,phase:__AN_HOA__.adventure().phase});return load(...args);};
   world.charactersReady=async()=>{const ok=await ready();if(window.__holdCharacters)await new Promise(r=>window.__releaseCharacters=r);return window.__failCharacters?false:ok;};
  });};
  async function begin(selector){
   const count=await page.evaluate(()=>{window.__holdPaint=true;return __loads.length;});
   await page.locator(selector).click();await page.waitForFunction(()=>__heldFrames.length>0);
   assert.equal((await state()).phase,'transition');assert.equal(await page.locator('#journeyLoading').isVisible(),true);
   assert.equal(await page.evaluate(()=>__loads.length),count,'the loader is visible before scene construction');
   const before=(await state()).position;
   await page.keyboard.press('Escape');await page.keyboard.press('m');await page.keyboard.press('w');
   await page.evaluate(()=>{__AN_HOA__.advance(2);document.getElementById('homeAdmin').click();});
   assert.equal((await state()).phase,'transition');assert.deepEqual((await state()).position,before);
   await page.evaluate(()=>__releasePaint());
  }
  const prepareBattle=async()=>{await page.evaluate(()=>{for(let i=0;i<40&&!__AN_HOA__.adventure().dialogue.complete;i++)document.getElementById('dialogNext').click();});await page.locator('#dialogActions button').first().click();};
  await open();
  console.log('CHECK: new journey, paint order and input lock');await begin('#heroForm button[type=submit]');await settled();assert.equal((await state()).phase,'explore');
  const {newJourney}=await import('../src/adventure-data.js'),{promiseMother,chooseStarter}=await import('../src/journey-story.js'),save=newJourney('Loading test');promiseMother(save);chooseStarter(save,'water-barrier');save.story.stage='infiltrate';save.activated=['nameless','water'];save.visited=['nameless','water'];save.position=[0,7];save.gold=83;
  await page.evaluate(s=>sessionStorage.setItem('loading-fixture',JSON.stringify(s)),save);await open();
  console.log('CHECK: continue waits for characters, including slow loads');await page.evaluate(()=>window.__holdCharacters=true);await begin('#continueJourney');await page.waitForFunction(()=>!!window.__releaseCharacters);
  await page.waitForTimeout(650);assert.equal((await state()).phase,'transition');await page.screenshot({path:out+'/desktop.png'});
  await page.evaluate(()=>{window.__holdCharacters=false;__releaseCharacters();window.__releaseCharacters=null;});await settled();assert.equal((await state()).save.gold,83);
  console.log('CHECK: checkpoint travel');await page.keyboard.press('e');await begin('[data-checkpoint="water"]');await settled();assert.equal((await state()).save.village,'water');
  const baseline=await page.evaluate(()=>localStorage.getItem('anhoa-adventure-v1'));
  console.log('CHECK: admin enable, map travel and progress restoration');await page.locator('#journeyMenu').click();await begin('#dialogActions button:nth-child(2)');await settled();assert.equal((await state()).adminEnabled,true);assert.equal((await state()).phase,'admin');
  await page.locator('#adminMap').click();await page.locator('[data-region="dark"]').dispatchEvent('click');await begin('#atlasGo');await settled();assert.equal((await state()).save.village,'dark');
  await page.locator('#adminIndicator').click();await begin('#toggleAdmin');await settled();assert.equal((await state()).adminEnabled,false);assert.deepEqual((await state()).save,JSON.parse(baseline));
  console.log('CHECK: combat loadout retreat and return from a finished battle');
  await page.evaluate(()=>__AN_HOA__.explore.offerBattle('random'));await prepareBattle();await begin('.adventure-back');await settled();assert.equal((await state()).phase,'explore');
  await page.evaluate(()=>__AN_HOA__.explore.offerBattle('random'));await prepareBattle();await page.locator('#startButton').click();await page.waitForFunction(()=>__AN_HOA__.state().started);await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.advance(2.1);__AN_HOA__.setHealth('enemy',0);__AN_HOA__.advance(.2);});
  await begin('#nextButton');await settled();assert.equal((await state()).phase,'explore');assert.equal((await page.evaluate(()=>__AN_HOA__.state())).started,false);
  console.log('CHECK: mobile coverage, reduced motion and recoverable load errors');
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#journeyMenu').click();await page.evaluate(()=>window.__holdCharacters=true);await begin('#dialogActions button:nth-child(2)');await page.waitForFunction(()=>!!window.__releaseCharacters);
  const coverage=await page.locator('#journeyLoading').evaluate(e=>{const r=e.getBoundingClientRect();return {width:r.width,height:r.height,animation:getComputedStyle(e.querySelector('.journey-loading-spinner')).animationName};});assert.deepEqual(coverage,{width:390,height:844,animation:'none'});await page.screenshot({path:out+'/mobile.png'});
  await page.evaluate(()=>{window.__holdCharacters=false;__releaseCharacters();window.__releaseCharacters=null;});await settled();
  await page.evaluate(()=>window.__failCharacters=true);await begin('#toggleAdmin');await page.locator('#journeyLoading button').waitFor({state:'visible'});assert.equal((await state()).phase,'transition');assert.match(await page.locator('#journeyLoadingTitle').innerText(),/Không thể tải/);
  assert.ok((await page.evaluate(()=>__loads)).every(x=>x.overlay&&x.phase==='transition'));assert.deepEqual(errors,[]);
  console.log('PASS: painted loading screen, async model readiness, frozen input, new/continued journeys, checkpoint/admin travel, admin rollback, loadout/battle returns, mobile/reduced motion and load-error recovery.');
 }catch(error){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});console.log(await page?.evaluate(()=>({phase:__AN_HOA__.adventure().phase,title:document.getElementById('journeyLoadingTitle').textContent,hold:window.__holdCharacters,frames:window.__heldFrames.length,loads:window.__loads})).catch(()=>null));throw error;}finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
