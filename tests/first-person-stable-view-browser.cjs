const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
(async()=>{
 const T=await import('three');
 const out='test-results/first-person-stable-view';await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']});let page,checkpoint='load';const errors=[],report=[];
 function stable(s,label){
  assert.equal(s.cameraView,'first-person',label+' does not change camera mode');assert.equal(s.handsVisible,true,label+' keeps first-person hands');
  const base=new T.Quaternion().setFromEuler(new T.Euler(s.pitch,s.yaw,0,'YXZ')),expected=base.clone().multiply(new T.Quaternion().setFromEuler(new T.Euler(...s.cameraReaction.rotation))),actual=new T.Quaternion().fromArray(s.viewRotation);
  assert.ok(1-Math.abs(expected.dot(actual))<1e-10,label+' keeps the chosen direction with ordinary impact reactions');
  const eye=new T.Vector3(...s.playerPosition).add(new T.Vector3(...s.cameraReaction.position).applyQuaternion(base));assert.ok(eye.distanceTo(new T.Vector3(...s.viewPosition))<1e-8,label+' stays at player eyes');
 }
 try{
  for(const mobile of [false,true]){
   page=await browser.newPage({viewport:mobile?{width:915,height:412}:{width:1400,height:900},hasTouch:mobile,isMobile:mobile});page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve('index.html')).href+'?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#loadoutCombatSettingsButton').click();await page.locator('#combatView').selectOption('first-person');await page.locator('#closeCombatSettings').click();await page.locator('#startButton').click();await page.locator('#practiceOpponentConfirm').click();
   await page.evaluate(()=>{__AN_HOA__.setAIEnabled(false);__AN_HOA__.setWindCameraEnabled(true);__AN_HOA__.setHealth('player',100000);__AN_HOA__.setHealth('enemy',100000);for(let i=0;i<3&&!/Thấp|Low/.test(__AN_HOA__.state().quality);i++)document.getElementById('qualityButton').click();__AN_HOA__.advance(.01);});
   for(const id of ['fire-meteor','lightning-thunder','light-volley','water-tsunami','water-volley','fire-lance','lightning-volley','earth-reflect','wind-reflect']){
    checkpoint=(mobile?'mobile':'desktop')+' '+id;
    const samples=await page.evaluate(id=>{
     const api=__AN_HOA__;api.combatTest.resetArts();api.setHealth('enemy',100000);api.combatTest.position('player',[0,0,7]);api.combatTest.position('primary',[0,0,-18]);api.advance(.1);api.combatTest.prepare(id,'player');api.combatTest.launch(id);
     const samples=[];for(const dt of [.05,.15,.15,.25,.4,.8,1.2,2]){api.advance(dt);const s=api.state();samples.push({cameraView:s.cameraView,handsVisible:s.handsVisible,yaw:s.yaw,pitch:s.pitch,viewRotation:s.viewRotation,viewPosition:s.viewPosition,playerPosition:s.playerPosition,cameraReaction:s.cameraReaction,enemyHealth:s.enemyHealth,projectiles:s.projectiles,earthArt:s.earthArt,windArt:s.windArt});}return samples;
    },id);
    for(const [i,s]of samples.entries())stable(s,checkpoint+' frame '+i);
    if(['fire-meteor','lightning-thunder','light-volley'].includes(id))assert.ok(samples.at(-1).enemyHealth<100000,id+' still damages the target');
    if(id==='water-tsunami')assert.ok(samples.some(s=>s.projectiles.some(p=>p.style==='tsunami'&&p.phase==='gathering')));
    if(id==='earth-reflect')assert.ok(samples.some(s=>s.earthArt.effects.some(e=>e.kind==='gravity')));
    if(id==='wind-reflect')assert.ok(samples.some(s=>s.windArt.spirits.length>0));
    report.push({mobile,id,frames:samples.length,finalEnemyHealth:samples.at(-1).enemyHealth});
   }
   if(!mobile){
    checkpoint='manual look during spell';await page.locator('#combatSettingsButton').click();await page.locator('#beginnerAimAssist').uncheck();await page.locator('#closeCombatSettings').click();
    await page.evaluate(()=>{const api=__AN_HOA__;api.combatTest.resetArts();api.aimAt([0,1.72,-18]);api.advance(.01);api.combatTest.launch('water-tsunami');api.advance(.1);});
    const before=await page.evaluate(()=>__AN_HOA__.state());await page.evaluate(()=>document.getElementById('world').dispatchEvent(new MouseEvent('mousemove',{bubbles:true,movementX:20,movementY:12})));await page.evaluate(()=>__AN_HOA__.advance(.01));const after=await page.evaluate(()=>__AN_HOA__.state());assert.ok(Math.abs(after.yaw-before.yaw+.05)<1e-10);assert.ok(Math.abs(after.pitch-before.pitch+.03)<1e-10);stable(after,checkpoint);await page.screenshot({path:out+'/desktop-water-manual-look.png'});
   }else await page.screenshot({path:out+'/mobile-first-person.png'});
   await page.close();
  }
  assert.deepEqual(errors,[]);await fs.writeFile(out+'/report.json',JSON.stringify({report,errors},null,2));console.log('PASS: actual local index.html, nine spell types on desktop and emulated mobile preserve first-person orientation/eye position/hands through formation and flight; sky-strike damage, Earth/Wind effects and mouse look during water formation remain functional.');
 }catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});await fs.writeFile(out+'/failure.json',JSON.stringify({checkpoint,error:e.message,errors,state:await page?.evaluate(()=>__AN_HOA__.state()).catch(()=>null)},null,2));throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
