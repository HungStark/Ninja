import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export async function checkNoOpticsBeforeCast(page){
  const empty=async label=>{
    const art=await page.evaluate(()=>__AN_HOA__.state().lightArt);
    assert.equal(art.preview,null,label+' has no preview');
    assert.equal(art.spheres.length+art.domes.length+art.mirrors.length,0,label+' creates no optical object');
  };
  const ids=await page.evaluate(()=>__AN_HOA__.state().equipped);
  await empty('Entering battle');
  for(let i=0;i<ids.length;i++){
    await page.keyboard.press('Backspace');await page.keyboard.press(String(i+1));
    await page.evaluate(()=>__AN_HOA__.advance(.016));await empty('Selecting '+ids[i]);
  }
  for(const id of ids){
    await page.keyboard.press('Backspace');
    const sequence=await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).sequence,id);
    for(const key of sequence){await page.keyboard.press(key);await page.evaluate(()=>__AN_HOA__.advance(.016));await empty('Sealing '+id+' / '+key);}
    await page.evaluate(()=>__AN_HOA__.advance(.32));await empty('Ready '+id+' without Space');
  }
  await page.keyboard.press('Backspace');await page.evaluate(()=>__AN_HOA__.advance(.016));await empty('Clearing seals');
}

export async function checkDomeStacks(page){
  const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
  const reset=async()=>{await page.keyboard.press('Escape');await page.evaluate(()=>document.getElementById('resetButton').click());};
  const cast=async id=>{
    const s=await state(),spell=await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id),id);
    await advance(Math.max(0,s.cooldown+.001,(spell.cost-s.chakra)/11+.001));await page.keyboard.press('Backspace');
    for(const key of spell.sequence)await page.keyboard.press(key);
    if(id==='light-lance'){assert.equal((await state()).sequence.length,6);assert.equal((await state()).lightArt.domes.length,0,'Dome still requires Space');}
    assert.equal(await page.locator('#castButton').isDisabled(),false);await page.keyboard.press('Space');
  };
  const capture=name=>page.screenshot({path:fileURLToPath(new URL('../test-results/light/'+name+'.png',import.meta.url))});
  await reset();await cast('light-barrier');await cast('light-lance');assert.equal((await state()).lightArt.domes[0].radius,3.8);
  await cast('light-orb');await advance(1.1);await cast('light-orb');await advance(.1);
  let s=await state();assert.equal(s.lightArt.domes[0].rays.length,2);assert.ok(s.lightArt.domes[0].rays.every(r=>r.spectrum===7&&r.path.every(leg=>leg.spectrum===7)));
  let hp=s.enemyHealth;await advance(1);assert.equal(hp-(await state()).enemyHealth,70,'Two rainbow lasers stack to 70 damage per second');await capture('dome-stacked-rainbow');
  await advance((await state()).lightArt.spheres[0].life+.02);assert.equal((await state()).lightArt.spheres.length,0);
  await cast('light-orb');await advance(.1);s=await state();assert.equal(s.lightArt.domes[0].rays.length,3);
  assert.equal(s.lightArt.domes[0].rays.filter(r=>r.spectrum===7).length,2);assert.equal(s.lightArt.domes[0].rays.filter(r=>r.spectrum===0).length,1);
  hp=s.enemyHealth;await advance(1);assert.equal(hp-(await state()).enemyHealth,90,'Two rainbow lasers plus one white laser stack to 90 per second');await capture('dome-stacked-mixed');
  await advance(7);s=await state();assert.equal(s.lightArt.domes.length,0);hp=s.enemyHealth;await advance(1);assert.equal((await state()).enemyHealth,hp);
  await reset();await cast('light-lance');await cast('light-orb');await advance(.1);await cast('light-orb');await advance(.1);
  s=await state();assert.equal(s.lightArt.domes[0].rays.length,2);assert.ok(s.lightArt.domes[0].rays.every(r=>r.spectrum===0));hp=s.enemyHealth;
  await advance(1);assert.equal(hp-(await state()).enemyHealth,40,'Two white lasers stack to 40 damage per second');
  return {passed:true,seals:6,radius:3.8,stackedDps:{twoWhite:40,twoRainbow:70,twoRainbowOneWhite:90}};
}

export async function runLightBrowserChecks({chromium,executablePath='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',onProgress=()=>{}}){
  const same=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
  const output=fileURLToPath(new URL('../test-results/light/',import.meta.url));await fs.mkdir(output,{recursive:true});
  const browser=await chromium.launch({executablePath,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const errors=[];
  try{
    const page=await browser.newPage({viewport:{width:1440,height:960}});
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
    const click=id=>page.evaluate(id=>document.getElementById(id).click(),id),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
    const capture=name=>page.screenshot({path:output+name+'.png'});
    const reset=async()=>{await page.keyboard.press('Escape');await click('resetButton');};
    const seal=async id=>{await page.keyboard.press('Backspace');for(const k of await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).sequence,id))await page.keyboard.press(k);};
    const cast=async id=>{const s=await state(),cost=await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).cost,id);await advance(Math.max(0,s.cooldown+.001,(cost-s.chakra)/11+.001));await seal(id);assert.equal((await state()).handLight,true,id+' ready ring');assert.equal(await page.locator('#castButton').isDisabled(),false,id);await page.keyboard.press('Space');};
    const enemy=(id,pos,dir)=>page.evaluate(({id,pos,dir})=>__AN_HOA__.launchEnemy(id,pos,dir),{id,pos,dir});
    const aimAt=target=>page.evaluate(target=>{const s=__AN_HOA__.state(),d=target.map((x,i)=>x-s.position[i]),n=Math.hypot(...d),yaw=Math.atan2(-d[0],-d[2]),pitch=Math.asin(d[1]/n);document.getElementById('world').dispatchEvent(new MouseEvent('mousemove',{bubbles:true,movementX:(s.yaw-yaw)/.0025,movementY:(s.pitch-pitch)/.0025}));},target);
    await page.goto(new URL('../index.html?test=1',import.meta.url).href);await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});await click('soundButton');await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));
    await click('clearLoadout');for(const id of ['light-orb','light-barrier','light-lance','light-reflect','light-volley'])await page.evaluate(id=>document.querySelector('[data-equip="'+id+'"]').click(),id);
    same(await page.evaluate(()=>SealGameCore.spells.filter(s=>s.element==='light').map(s=>s.sequence.length)),[2,6,6,5,8]);await capture('new-catalog');await click('startButton');
    await checkNoOpticsBeforeCast(page);onProgress('Selecting and sealing all five Light spells creates no object before Space');
    await cast('light-orb');await advance(.09);close((await state()).enemyHealth,960);assert.equal((await state()).shots,0);await capture('straight-laser');
    await reset();await cast('light-barrier');await advance(.2);let s=await state();const center=s.lightArt.spheres[0].center;await capture('glass-sphere');await cast('light-orb');await advance(.09);s=await state();close(s.enemyHealth,930);assert.equal(s.lightArt.lastPath.at(-1).spectrum,7);await capture('rainbow-laser');
    await aimAt([10,1.72,-24]);await advance(.1);same((await state()).lightArt.spheres[0].center,center);await advance((await state()).lightArt.spheres[0].life+.01);assert.equal((await state()).lightArt.spheres.length,0);await cast('light-orb');await advance(.1);close((await state()).enemyHealth,930,'Aimed miss does not damage');
    onProgress('Laser and eight-second glass sphere passed');
    await reset();await cast('light-lance');await advance(.2);close((await state()).enemyHealth,1000);await capture('mirror-dome');await cast('light-orb');await advance(.1);s=await state();assert.equal(s.lightArt.domes[0].rays.length,1);assert.equal(s.lightArt.domes[0].rays[0].path.length,14);close(s.enemyHealth,1000);await advance(1);close((await state()).enemyHealth,980);await capture('dome-bounces');await advance(2);close((await state()).enemyHealth,940);await advance((await state()).lightArt.domes[0].life+.01);s=await state();assert.equal(s.lightArt.domes.length,0);const expiredHp=s.enemyHealth;await advance(2);close((await state()).enemyHealth,expiredHp);
    await reset();await cast('light-barrier');await cast('light-lance');await cast('light-orb');await advance(1.1);s=await state();close(s.enemyHealth,965);assert.equal(s.lightArt.domes[0].rays[0].power,1.75);await capture('rainbow-dome');await advance(2);s=await state();close(s.enemyHealth,895);await advance(s.lightArt.spheres[0].life+.01);s=await state();assert.equal(s.lightArt.spheres.length,0);assert.equal(s.lightArt.domes[0].rays[0].spectrum,7,'Captured rainbow survives sphere expiry');const rainbowExpiryHp=s.enemyHealth;await advance(1);close((await state()).enemyHealth,rainbowExpiryHp-35);
    onProgress('Mirror dome capture, bounces, DPS, rainbow boost and expiry passed');
    await checkDomeStacks(page);onProgress('Six-seal enlarged dome retains seven colors and stacks every laser');
    await reset();await cast('light-reflect');await advance(.2);await capture('mirror');await enemy('light-orb');await advance(.1);s=await state();close(s.health,1000);close(s.enemyHealth,960);assert.equal(s.lightArt.reflections,1);await capture('mirror-reflected-laser');
    await reset();await cast('light-reflect');await enemy('fire-orb',[0,1.72,3],[0,0,1]);await advance(.12);s=await state();close(s.health,1000);assert.equal(s.lightArt.reflections,1);assert.ok(s.projectiles.some(p=>p.owner==='player'&&p.reflected));await advance(1.8);s=await state();assert.ok(s.enemyHealth<1000);close(s.health,1000);await advance((await state()).lightArt.mirrors[0].life+.01);assert.equal((await state()).lightArt.mirrors.length,0);await enemy('light-orb');await advance(.1);close((await state()).health,960);
    onProgress('2.5-second mirror reflects both laser and fire projectile');
    await reset();const original=await state();await cast('light-volley');await advance(.55);s=await state();assert.equal(s.cameraView,'jacob-sky');close(s.enemyHealth,1000);await capture('jacob-sky');const frozen=s.lightArt;await page.keyboard.press('Escape');await advance(4);same((await state()).lightArt,frozen);await page.keyboard.press('Enter');await advance(.9);s=await state();assert.equal(s.cameraView,'jacob-returning');assert.equal(s.lightArt.jacobs[0].phase,'descending');close(s.enemyHealth,1000);await capture('jacob-descending');await advance(.45);s=await state();assert.equal(s.cameraView,'first-person');assert.equal(s.handsVisible,true);close(s.yaw,original.yaw);close(s.pitch,original.pitch);close(s.enemyHealth,840);await capture('jacob-impact');await advance(1.2);assert.equal((await state()).lightArt.jacobs.length,0);
    await reset();await aimAt([20,1.72,-24]);await cast('light-volley');await advance(2);close((await state()).enemyHealth,1000,'Jacob targets the aimed position, not a homing hit');await reset();await enemy('light-volley');await advance(1.9);close((await state()).health,840);assert.equal((await state()).cameraView,'first-person');
    onProgress('Jacob sky/descent/impact camera, pause, aim, expiry and both owners passed');
    await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true');await click('soundButton');await click('startButton');await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));
    while((await state()).quality!=='Thấp')await click('qualityButton');await cast('light-lance');await cast('light-orb');await advance(1.1);close((await state()).enemyHealth,980);await capture('dome-low-reduced-motion');await reset();const fov=(await state()).viewFov;await cast('light-volley');await advance(.4);close((await state()).viewFov,fov);await advance(1.5);close((await state()).enemyHealth,840);assert.equal((await state()).cameraView,'first-person');await capture('jacob-low-reduced-motion');
    await reset();await page.keyboard.press('Escape');await click('changeLoadout');for(let i=0;i<5;i++)await click('nextButton');await click('startButton');await page.evaluate(()=>__AN_HOA__.setAIEnabled(true));await advance(20);s=await state();assert.equal(s.round,6);assert.ok(s.aiCasts>=3);assert.ok(s.health<1000,'Light AI attacks with the new spells');
    same(errors,[]);const report={passed:true,sealCounts:[2,6,6,5,8],checks:['selection and seals create no optics before Space','straight white/gold laser','eight-second transparent sphere and seven-color amplification','ten-second mirror dome, physical facet bounces, per-second damage and expiry','rainbow energy remains trapped after sphere expiry','2.5-second mirror reflects lasers and projectiles','Jacob sky/descent/impact camera and damage','aim/walls/shields/immunity in core checks','both owners and AI','pause/reset','low graphics and reduced motion'],errors};await fs.writeFile(output+'verification.json',JSON.stringify(report,null,2));onProgress('All new Light browser checks passed');return report;
  }finally{await browser.close();}
}
