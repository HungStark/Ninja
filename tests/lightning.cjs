const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs/promises');

(async()=>{
  await fs.mkdir('test-results/lightning',{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const page=await browser.newPage({viewport:{width:1200,height:850}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    const state=()=>page.evaluate(()=>window.__AN_HOA__.state());
    const advance=t=>page.evaluate(t=>window.__AN_HOA__.advance(t),t);
    const click=id=>page.evaluate(id=>document.getElementById(id).click(),id);
    const shot=(s,style,owner='player')=>s.projectiles.find(p=>p.style===style&&p.owner===owner);
    const enemy=(id,pos,dir)=>page.evaluate(({id,pos,dir})=>window.__AN_HOA__.launchEnemy(id,pos,dir),{id,pos,dir});
    const cast=async id=>{
      for(const key of await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).sequence,id))await page.keyboard.press(key);
      assert.equal(await page.locator('#castButton').isDisabled(),false,id+' is ready');await page.keyboard.press('Space');
    };
    const reset=async()=>{await page.keyboard.press('Escape');await click('resetButton');};
    const equip=async ids=>{
      if((await state()).started){await page.keyboard.press('Escape');await click('changeLoadout');}
      await click('clearLoadout');for(const id of ids)await page.evaluate(id=>document.querySelector(`[data-equip="${id}"]`).click(),id);
      await click('startButton');
    };
    const screenshot=name=>page.screenshot({path:`test-results/lightning/${name}.png`});
    await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1');
    await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});
    await click('soundButton');await page.locator('[data-element="lightning"]').click();
    assert.equal(await page.locator('[data-equip]').count(),6);
    for(const [id,count] of [['lightning-orb',2],['lightning-lance',4],['lightning-volley',6],['lightning-thunder',8],['lightning-barrier',3],['lightning-reflect',5]])assert.equal(await page.locator(`[data-equip="${id}"] kbd`).count(),count);
    await screenshot('catalog');
    await equip(['lightning-orb','lightning-lance','lightning-volley','lightning-barrier','lightning-reflect']);

    for(const [id,style,time,damage] of [['lightning-orb','orb',.12,40],['lightning-lance','lance',.08,62]]) {
      await reset();await cast(id);await advance(time);
      let s=await state();assert.equal(s.lightningArt.projectiles,1);assert.ok(shot(s,style));assert.equal(s.cameraView,'first-person');
      await screenshot(style);await advance(1.2);assert.equal((await state()).enemyHealth,1000-damage);
    }
    await reset();await cast('lightning-volley');await advance(.18);
    let s=await state();const birdOrigin=shot(s,'bird').position;
    assert.equal(s.cameraView,'first-person');assert.equal(shot(s,'bird').phase,'forming');
    assert.equal(shot(s,'bird').visual.orbVisible,true);assert.equal(shot(s,'bird').visual.birdVisible,false);
    await screenshot('bird-orb');await advance(.47);s=await state();
    assert.deepEqual(shot(s,'bird').position,birdOrigin);assert.equal(shot(s,'bird').visual.birdVisible,true);
    assert.ok(shot(s,'bird').visual.birdScale>0&&shot(s,'bird').visual.birdScale<1);
    assert.equal(s.enemyHealth,1000);await screenshot('bird-emerging');
    await page.keyboard.press('Escape');const formingFrozen=await state();await advance(1);
    assert.deepEqual((await state()).projectiles,formingFrozen.projectiles);await page.keyboard.press('Enter');
    await advance(.65);s=await state();assert.equal(s.cameraView,'bird-overhead');assert.equal(s.handsVisible,false);
    assert.equal(shot(s,'bird').visual.orbVisible,false);assert.ok(s.viewPosition[1]>10);await screenshot('bird-overhead');
    await page.keyboard.press('Escape');const birdFrozen=await state();await advance(1);
    assert.deepEqual((await state()).viewPosition,birdFrozen.viewPosition);await page.keyboard.press('Enter');
    await advance(.75);assert.equal((await state()).enemyHealth,898);await screenshot('bird-impact');
    await advance(.8);s=await state();assert.equal(s.cameraView,'first-person');assert.equal(s.handsVisible,true);assert.equal(s.yaw,0);assert.equal(s.pitch,0);
    await reset();await enemy('lightning-volley');await advance(1.35);assert.equal((await state()).cameraView,'first-person');
    await reset();await cast('lightning-volley');await advance(1.3);await reset();assert.equal((await state()).lightningArt.projectiles,0);assert.equal((await state()).cameraView,'first-person');
    await reset();await cast('lightning-barrier');await advance(.25);
    assert.equal((await state()).shield,80);assert.equal((await state()).lightningArt.shields,1);await screenshot('shield');
    await enemy('fire-orb',[0,1.72,3],[0,0,1]);await advance(.3);
    assert.equal((await state()).health,1000);assert.equal((await state()).shield,37);
    await advance(4.8);assert.equal((await state()).lightningArt.shields,0);

    await reset();await cast('lightning-reflect');await advance(.3);
    s=await state();assert.equal(s.lightningArt.fields.length,1);assert.ok(Math.abs(s.lightningArt.fields[0].life-9.7)<.001);
    assert.equal(s.reflect,0,'Lôi trận slows rather than reflects');await screenshot('field');
    await enemy('fire-orb',[0,1.72,-5],[0,0,1]);const before=shot(await state(),'orb','enemy').position[2];
    await advance(.5);s=await state();const incoming=shot(s,'orb','enemy');
    assert.ok(Math.abs(incoming.position[2]-before-3)<.01);assert.ok(Math.abs(incoming.slowFactor-.3)<1e-8);assert.equal(s.health,1000);
    await page.keyboard.press('Escape');const frozen=await state();await advance(1);
    assert.deepEqual((await state()).lightningArt,frozen.lightningArt);assert.deepEqual((await state()).projectiles,frozen.projectiles);await page.keyboard.press('Enter');
    await advance(.3);await cast('lightning-orb');await advance(.1);
    assert.equal(shot(await state(),'orb','player').slowFactor,1,'Own projectiles remain at full speed');
    await advance(1);assert.equal((await state()).health,957,'Slowed shots still deal their original damage');
    await reset();await cast('lightning-reflect');await advance(9.9);assert.equal((await state()).lightningArt.fields.length,1);
    await advance(.11);assert.equal((await state()).lightningArt.fields.length,0,'Field ends after ten seconds');
    await reset();await cast('lightning-reflect');await advance(1.1);await cast('lightning-reflect');await advance(.1);
    assert.equal((await state()).lightningArt.fields.length,1,'Recast replaces the old field');assert.ok((await state()).lightningArt.fields[0].life>9.8);
    await click('qualityButton');await click('qualityButton');await advance(.1);await screenshot('field-low');
    await reset();assert.equal((await state()).lightningArt.fields.length,0);

    await equip(['lightning-lance','lightning-volley','lightning-thunder','lightning-barrier','lightning-reflect']);
    await cast('lightning-thunder');await advance(.8);s=await state();
    assert.equal(s.cameraView,'thunder-sky');assert.equal(s.handsVisible,false);assert.equal(s.lightningArt.clouds,1);assert.equal(s.enemyHealth,1000);await screenshot('thunder-cloud');
    const target=shot(s,'thunder').target;
    const cloudOpacity=shot(s,'thunder').visual.chargeOpacity;
    await advance(.1);assert.notEqual(shot(await state(),'thunder').visual.chargeOpacity,cloudOpacity,'Cloud lightning flickers');
    await advance(.55);s=await state();assert.equal(s.cameraView,'thunder-returning');assert.equal(s.lightningArt.bolts,0);assert.equal(s.enemyHealth,1000);
    await page.keyboard.press('Escape');const skyFrozen=await state();await advance(1);
    assert.deepEqual((await state()).viewRotation,skyFrozen.viewRotation);assert.equal((await state()).viewFov,skyFrozen.viewFov);assert.deepEqual((await state()).projectiles,skyFrozen.projectiles);await page.keyboard.press('Enter');
    await advance(.4);s=await state();assert.equal(s.cameraView,'first-person');assert.equal(s.handsVisible,true);assert.equal(s.lightningArt.bolts,0);assert.equal(s.enemyHealth,1000,'Camera returns before the strike');await screenshot('thunder-before-strike');
    await advance(.1);s=await state();assert.equal(s.lightningArt.bolts,1);assert.equal(s.enemyHealth,850);assert.equal(shot(s,'thunder').phase,'striking');assert.equal(s.cameraView,'first-person');await screenshot('thunder-bolt');
    await advance(.3);s=await state();assert.equal(s.yaw,0);assert.equal(s.pitch,0);assert.equal(s.enemyHealth,850,'One strike applies damage once');await screenshot('thunder-ground');
    await advance(.6);assert.equal((await state()).lightningArt.projectiles,0);
    await reset();await cast('lightning-thunder');await advance(.6);await reset();
    s=await state();assert.equal(s.cameraView,'first-person');assert.equal(s.lightningArt.clouds,0);assert.equal(s.viewFov,68);

    await enemy('lightning-thunder');await advance(.3);assert.equal((await state()).cameraView,'first-person','Enemy thunder does not take over the camera');
    for(let i=0;i<3;i++)await page.evaluate(()=>document.getElementById('world').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:2})));
    await advance(1.8);assert.equal((await state()).health,1000,'Player can dodge the marked thunder strike');
    await reset();await enemy('lightning-reflect',[0,1.72,-10],[0,0,1]);await cast('lightning-volley');await advance(1.7);
    assert.ok(shot(await state(),'bird').slowFactor<1,'Enemy field slows the player bird too');

    await page.emulateMedia({reducedMotion:'reduce'});await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1');
    await page.waitForFunction(()=>document.body.dataset.ready==='true');await click('soundButton');await page.locator('[data-element="lightning"]').click();
    await equip(['lightning-thunder']);await cast('lightning-thunder');await advance(.8);
    assert.equal((await state()).viewFov,68);assert.equal((await state()).cameraReaction.strength,0);
    assert.deepEqual(errors,[]);
    await fs.writeFile('test-results/lightning/verification.json',JSON.stringify({passed:true,target,errors},null,2));
    console.log('PASS: six lightning arts, exact seals, distinct visuals and damage, shield, ten-second field, slowdown and friendly speed, pause, recast, reset, low quality, cloud-to-ground thunder, one hit, camera restoration, enemy casts, dodge and reduced motion.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
