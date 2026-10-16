const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs/promises');
(async()=>{
  await fs.mkdir('test-results/elemental-status',{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
    page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    const click=id=>page.evaluate(id=>document.getElementById(id).click(),id),advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),state=()=>page.evaluate(()=>__AN_HOA__.state()),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
    const reset=async()=>{await page.keyboard.press('Escape');await click('resetButton');};
    const cast=async id=>{await page.keyboard.press('Backspace');for(const key of await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).sequence,id))await page.keyboard.press(key);await page.keyboard.press('Space');};
    const enemy=(id,pos,dir)=>page.evaluate(({id,pos,dir})=>__AN_HOA__.launchEnemy(id,pos,dir),{id,pos,dir});
    const screenshot=name=>page.screenshot({path:`test-results/elemental-status/${name}.png`});
    await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&mode=duel');await page.waitForFunction(()=>document.body.dataset.ready==='true');await click('soundButton');await click('clearLoadout');
    for(const id of ['fire-volley','fire-barrier','lightning-lance','lightning-barrier','water-barrier'])await page.evaluate(id=>document.querySelector(`[data-equip="${id}"]`).click(),id);
    await click('startButton');await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));
    // Empty activators neither cast nor spend chakra.
    await cast('fire-barrier');let s=await state();assert.equal(s.casts,0);close(s.chakra,100);assert.equal(await page.locator('#castButton').isDisabled(),true);
    await cast('lightning-barrier');assert.equal((await state()).casts,0);
    await cast('fire-volley');await advance(1.7);s=await state();assert.equal(s.elemental.enemy.burnStacks,3,'One layer per fireball');close(s.enemyHealth,971.2);assert.equal(s.elemental.visuals.find(v=>v.owner==='enemy').burnCounter,3);await screenshot('burn-3');
    await cast('lightning-lance');await advance(.9);s=await state();assert.equal(s.elemental.enemy.staticStacks,1);assert.equal(s.elemental.enemy.burnStacks,3);await screenshot('burn-and-static');
    await advance(.11);const hp=(await state()).enemyHealth;await cast('fire-barrier');s=await state();close(s.enemyHealth,hp-30);assert.equal(s.elemental.enemy.burnStacks,0);assert.equal(s.elemental.enemy.ignitionLevel,3);close(s.shield,0);await advance(.08);await screenshot('ignition-3');
    // Water applies a cast-time weapon buff, not body armor.
    await reset();await cast('water-barrier');s=await state();close(s.elemental.player.waterWeaponTime,30);close(s.shield,0);await page.keyboard.press('Space');s=await state();let shot=s.projectiles.find(p=>p.style==='shuriken');assert.ok(shot.waterInfused);close(shot.damage,15);close(Math.hypot(...shot.velocity),72);await advance(.05);await screenshot('water-shuriken');await advance(.4);close((await state()).enemyHealth,985);
    await page.keyboard.press('Escape');const paused=(await state()).elemental;await advance(2);assert.deepEqual((await state()).elemental,paused);await page.keyboard.press('Enter');await advance(30);await page.keyboard.press('Space');shot=(await state()).projectiles.find(p=>p.style==='shuriken');assert.equal(shot.waterInfused,false);close(shot.damage,6);close(Math.hypot(...shot.velocity),36);
    // Enemy discharge: three charges, two seconds of stun, then seven of homing.
    await reset();for(let i=0;i<3;i++)await enemy('lightning-lance',[0,1.72,3],[0,0,1]);await advance(.6);s=await state();assert.equal(s.elemental.player.staticStacks,3);close(s.health,814);
    await enemy('lightning-barrier');s=await state();close(s.controlTime,2);assert.equal(s.elemental.player.staticStacks,0);assert.equal(s.elemental.player.magneticActive,false);close(s.elemental.player.magneticTime,7);
    await advance(1.99);assert.equal((await state()).elemental.player.magneticActive,false);await advance(.01);assert.equal((await state()).elemental.player.magneticActive,true);close((await state()).elemental.player.magneticTime,7);
    await enemy('lightning-lance',[-3,1.72,-6],[0,0,1]);await advance(.02);s=await state();shot=s.projectiles.find(p=>p.element==='lightning');assert.ok(shot.velocity[0]>0);
    await page.evaluate(()=>document.getElementById('world').dispatchEvent(new MouseEvent('mousedown',{button:0,bubbles:true})));await advance(.1);s=await state();shot=s.projectiles.find(p=>p.element==='lightning');assert.ok(s.position[0]<-.05);close(shot.target[0],s.position[0]);close(Math.hypot(...shot.velocity),38);await screenshot('magnetic-homing');await advance(.8);close((await state()).health,752);await advance(7);assert.equal((await state()).elemental.player.magneticActive,false);
    // Water hit damage and separate boat stun, without turning it into a prison.
    await reset();await enemy('water-volley',[0,1.72,-7],[0,0,1]);await advance(1.95);s=await state();close(s.health,892);assert.ok(s.elemental.player.boatControlTime>.7&&s.elemental.player.boatControlTime<=1);assert.equal(s.waterArt.prisons,0);await advance(1);close((await state()).controlTime,0);
    await reset();await enemy('water-lance',[0,1.72,3],[0,0,1]);await advance(.6);close((await state()).health,985.6);
    await reset();await enemy('water-tsunami');await advance(3);close((await state()).health,964);
    await reset();await enemy('lightning-reflect');close((await state()).lightningArt.fields[0].slowFactor,.15);
    // AI uses its new activator and throws infused weapons while waiting to cast.
    await reset();await enemy('fire-volley');await advance(1.7);assert.equal((await state()).elemental.player.burnStacks,3);await page.evaluate(()=>__AN_HOA__.setAIEnabled(true));await advance(4);s=await state();assert.ok(s.enemyCooldowns['fire-barrier']>0);assert.equal(s.elemental.player.burnStacks,0);close(s.health,941.2);
    await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));await reset();await enemy('water-barrier');await page.evaluate(()=>__AN_HOA__.setAIEnabled(true));await advance(.05);shot=(await state()).projectiles.find(p=>p.style==='shuriken'&&p.owner==='enemy');assert.ok(shot?.waterInfused);close(shot.damage,15);close(Math.hypot(...shot.velocity),72);await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));
    await reset();await click('qualityButton');await cast('fire-volley');await advance(1.7);s=await state();assert.equal(s.elemental.visuals.find(v=>v.owner==='enemy').flames,5);await screenshot('low-quality-burn');
    await cast('lightning-lance');await advance(.9);assert.equal((await state()).elemental.enemy.staticStacks,1);await advance(10.1);s=await state();assert.equal(s.elemental.enemy.staticStacks,0);assert.equal(s.elemental.visuals.find(v=>v.owner==='enemy').staticCounter,0);assert.equal(s.elemental.visuals.find(v=>v.owner==='enemy').arcs,false);await screenshot('stacks-expired');
    assert.deepEqual(errors,[]);console.log('PASS: real burn/static hits and counters, ignition, empty cast gating, water weapon VFX/speed/damage/expiry, pause/reset, electric stun then homing through dodge, water damage, boat stun and 15% field.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
