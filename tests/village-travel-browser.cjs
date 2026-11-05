const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{chromium}=require('playwright'),{build}=require('esbuild');
(async()=>{
 const out='test-results/village-travel';await fs.mkdir(out,{recursive:true});
 const bundle=await build({entryPoints:['src/main.js'],bundle:true,write:false,format:'iife',plugins:[{name:'inspect-travel',setup(b){b.onLoad({filter:/[/\\]src[/\\]adventure\.js$/},async({path})=>({contents:(await fs.readFile(path,'utf8')).replace('const world=createAdventureScene();','const world=window.__travelWorld=createAdventureScene();').replace('  function update(dt){','  function update(dt){if(window.__freezeTravel&&!window.__manualTravel)return;'),loader:'js'}));}}]});
 const port='4337',server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:port},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page;
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
  browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  page=await browser.newPage({viewport:{width:1200,height:860}});page.setDefaultTimeout(120000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/game.js',r=>r.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text}));
  const {newJourney}=await import('../src/adventure-data.js'),{JOURNEY_ORDER}=await import('../src/village-travel.js'),save=newJourney('Hải trình');
  save.village='earth';save.position=[0,7];save.story.stage='infiltrate';save.story.peaceSeals=[...JOURNEY_ORDER];save.campaign={treatySigned:true,deliveries:['wind','earth','wood','ice','light']};
  await page.addInitScript(s=>{localStorage.setItem('anhoa-adventure-v1',JSON.stringify(s));window.__freezeTravel=true;},save);
  await page.goto(`http://127.0.0.1:${port}/?test=1&adventure=1`);await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#continueJourney').click();await page.waitForFunction(()=>!__AN_HOA__.adventure().loading);
  await page.evaluate(()=>{
   __AN_HOA__.explore.setRandom(false);window.__trips=[];const w=__travelWorld,load=w.load,ready=w.charactersReady;
   w.load=(...args)=>{__trips.push({village:args[0],overlay:!document.getElementById('journeyLoading').hidden,phase:__AN_HOA__.adventure().phase});return load(...args);};
   w.charactersReady=async()=>{const ok=await ready();if(window.__holdCharacters)await new Promise(r=>window.__releaseCharacters=r);return ok;};
  });
  const state=()=>page.evaluate(()=>__AN_HOA__.adventure());
  const advance=t=>page.evaluate(t=>{window.__manualTravel=true;try{__AN_HOA__.advance(t);}finally{window.__manualTravel=false;}},t);
  await page.evaluate(()=>__AN_HOA__.explore.openAtlas());assert.equal(await page.locator('#worldAtlas [data-region]').count(),10);assert.equal(await page.locator('.atlas-sea-routes path').count(),5);await page.screenshot({path:out+'/atlas-desktop.png'});await page.locator('#closeAtlas').click();
  const trips=process.env.TRAVEL_SMOKE==='1'?['wood']:['wood','ice','earth','ice','wood','light','ice','light','wood','earth'];
  for(const [i,target] of trips.entries()){
   const origin=(await state()).save.village;console.log(`CHECK: ${origin} → ${target}`);
   await page.evaluate(target=>{const w=__travelWorld,g=w.gates.find(g=>g.id===target);if(!g||g.kind!=='dock')throw Error('Missing harbor');w.hero.root.position.set(g.x,w.heroHeightAt(g.x,g.z),g.z);window.__holdCharacters=true;__AN_HOA__.explore.travel(target);},target);
   assert.equal((await state()).phase,'boarding');assert.equal(await page.locator('#journeyLoading').isVisible(),false);assert.equal(await page.locator('#startScreen').isVisible(),false);
   await advance(.4);const boarded=await state();assert.equal(boarded.save.village,origin);assert.equal(boarded.phase,'boarding');
   await page.keyboard.press('Escape');await page.keyboard.press('m');await page.keyboard.press('w');assert.equal((await state()).phase,'boarding');
   if(i===0)await page.screenshot({path:out+'/boarding.png'});
   await advance(.5);await page.waitForFunction(()=>!!window.__releaseCharacters);assert.equal((await state()).phase,'transition');assert.equal(await page.locator('#journeyLoading').isVisible(),true);
   if(i===0)await page.screenshot({path:out+'/loading.png'});
   await page.evaluate(()=>{window.__holdCharacters=false;__releaseCharacters();window.__releaseCharacters=null;});await page.waitForFunction(()=>!__AN_HOA__.adventure().loading);
   const arrived=await state(),dock=arrived.gates.find(g=>g.id===origin);assert.equal(arrived.save.village,target);assert.equal(arrived.phase,'explore');assert.ok(Math.hypot(arrived.position[0]-dock.x,arrived.position[1]-dock.z)<1,'arrival is at the reciprocal harbor');assert.equal(arrived.surface,null);assert.equal(arrived.interior,null);
   const roads=await page.evaluate(()=>{const names=[];__travelWorld.scene.traverse(o=>{if(/^(village-road|worn-earth-road|neighborhood-footpath)$|neighborhood-lane|courtyard-paving/.test(o.name))names.push(o.name);});return names;});assert.deepEqual(roads,[]);
   if(i===0)await page.screenshot({path:out+'/arrival.png'});
  }
  assert.ok((await page.evaluate(()=>__trips)).every(t=>t.overlay&&t.phase==='transition'));
  await advance(5);await page.setViewportSize({width:390,height:844});await page.evaluate(()=>__AN_HOA__.explore.openAtlas());await page.screenshot({path:out+'/atlas-mobile.png'});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);assert.deepEqual(errors,[]);
  console.log(`PASS: ${trips.length} directed sea trips, boarding input lock, loading before destination construction, held model readiness, reciprocal harbor arrivals, road removal and desktop/mobile atlas.`);
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
