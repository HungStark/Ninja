const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
  const T=await import('three'),{ShurikenVisuals}=await import('../src/shuriken.js');
  const scene=new T.Scene(),visuals=new ShurikenVisuals(scene),shot={style:'shuriken',p:[1,2,3],v:[0,0,-36],age:0};
  visuals.update([shot]);const root=visuals.objects.get(shot);assert.deepEqual(root.position.toArray(),shot.p);assert.ok(root.localToWorld(new T.Vector3(0,0,1)).z<3);shot.age=.1;visuals.update([shot]);assert.ok(Math.abs(root.userData.spinner.rotation.z-3.8)<1e-6);visuals.update([]);assert.equal(scene.children.length,0);
  const output='test-results/cooldowns-shuriken';await fs.mkdir(output,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    const state=()=>page.evaluate(()=>__AN_HOA__.state()),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),click=id=>page.evaluate(id=>document.getElementById(id).click(),id),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-4,a+' != '+b);
    const seal=async id=>{await page.keyboard.press('Backspace');for(const k of await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).sequence,id))await page.keyboard.press(k);};
    const reset=async()=>{await page.keyboard.press('Escape');await click('resetButton');};
    await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1');await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});await click('soundButton');await click('clearLoadout');
    for(const id of ['fire-volley','water-barrier','fire-meteor'])await page.evaluate(id=>document.querySelector('[data-equip="'+id+'"]').click(),id);
    await click('startButton');await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));
    assert.equal(await page.locator('#castButton').isDisabled(),false);await page.keyboard.press('Space');let s=await state();assert.equal(s.shurikenThrows,1);assert.equal(s.casts,0);close(s.chakra,100);assert.equal(s.projectiles[0].style,'shuriken');assert.equal(s.projectiles[0].damage,6);assert.equal(s.projectiles[0].element,'weapon');
    await advance(.01);await page.screenshot({path:output+'/four-blade-shuriken.png'});await page.keyboard.press('Space');assert.equal((await state()).shurikenThrows,1);await advance(.9);close((await state()).enemyHealth,994);
    await page.keyboard.press('q');await page.keyboard.press('Space');s=await state();assert.equal(s.shurikenThrows,2);assert.deepEqual(s.sequence,[]);close(s.chakra,100);await advance(.5);await page.keyboard.press('x');await page.keyboard.press('Space');assert.equal((await state()).shurikenThrows,3);await advance(1);
    await seal('fire-volley');await page.keyboard.press('Space');s=await state();assert.equal(s.casts,1);close(s.cooldowns['fire-volley'],6);close(s.chakra,60);
    await seal('fire-volley');assert.equal(await page.locator('#castButton').isDisabled(),true);await page.keyboard.press('Space');s=await state();assert.equal(s.shurikenThrows,3);assert.equal(s.casts,1);close(s.chakra,60);assert.equal(s.sequence.join(''),'qwdf');assert.ok((await page.locator('[data-spell="0"] [data-cooldown]').innerText()).includes('6.0'));
    await page.screenshot({path:output+'/spell-cooldown.png'});await advance(1.1);close((await state()).chakra,65.5);await seal('water-barrier');await page.keyboard.press('Space');s=await state();assert.equal(s.casts,2);close(s.cooldowns['water-barrier'],4);close(s.cooldowns['fire-volley'],4.9);close(s.chakra,39.5);
    await page.keyboard.press('Escape');const frozen=await state();await advance(3);s=await state();assert.deepEqual(s.cooldowns,frozen.cooldowns);close(s.chakra,frozen.chakra);await page.keyboard.press('Enter');await advance(5);s=await state();assert.deepEqual(s.cooldowns,{});close(s.chakra,64.5);
    await seal('fire-meteor');await page.keyboard.press('Space');s=await state();assert.equal(s.casts,2);assert.equal(s.shurikenThrows,3);assert.equal(s.sequence.join(''),'qwcvzxer');await advance(4);await seal('fire-meteor');await page.keyboard.press('Space');close((await state()).cooldowns['fire-meteor'],15);
    await reset();s=await state();assert.deepEqual(s.cooldowns,{});close(s.shurikenCooldown,0);assert.equal(s.shurikenThrows,0);assert.equal(s.shots,0);
    await page.evaluate(()=>document.querySelector('canvas').dispatchEvent(new MouseEvent('mousemove',{movementX:500,bubbles:true})));await page.keyboard.press('Space');s=await state();assert.ok(Math.abs(s.projectiles[0].velocity[0])>10);await advance(1.2);close((await state()).enemyHealth,1000);
    await reset();await page.evaluate(()=>__AN_HOA__.launchEnemy('fire-reflect',[0,1.72,-4],[0,0,1]));await page.keyboard.press('Space');await advance(.8);s=await state();close(s.enemyHealth,1000);close(s.walls[0].hp,114);
    await reset();await page.evaluate(()=>__AN_HOA__.setAIEnabled(true));await advance(14);s=await state();assert.ok(s.aiCasts>0);assert.ok(Object.values(s.enemyCooldowns).every(t=>t<=15));
    assert.deepEqual(errors,[]);console.log('PASS: independent cooldowns, max 15s, 5 chakra/s, pause/reset, blocked combo retention, rotating four-blade shuriken, zero cost, throttle, partial/invalid seals, aim, hit damage, wall blocking and AI.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
