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

    for(const [id,style,time,damage] of [['lightning-orb','orb',.12,40],['lightning-lance','lance',.08,62],['lightning-volley','bird',.18,102]]) {
      await reset();await cast(id);await advance(time);
      let s=await state();assert.equal(s.lightningArt.projectiles,1);assert.ok(shot(s,style));assert.equal(s.cameraView,'first-person');
      await screenshot(style);await advance(1.2);assert.equal((await state()).enemyHealth,220-damage);
    }
    await reset();await cast('lightning-barrier');await advance(.25);
    assert.equal((await state()).shield,80);assert.equal((await state()).lightningArt.shields,1);await screenshot('shield');
    await enemy('fire-orb',[0,1.72,3],[0,0,1]);await advance(.3);
    assert.equal((await state()).health,220);assert.equal((await state()).shield,37);
    await advance(4.8);assert.equal((await state()).lightningArt.shields,0);

    await reset();await cast('lightning-reflect');await advance(.3);
    let s=await state();assert.equal(s.lightningArt.fields.length,1);assert.ok(Math.abs(s.lightningArt.fields[0].life-9.7)<.001);
    assert.equal(s.reflect,0,'Lôi trận slows rather than reflects');await screenshot('field');
    await enemy('fire-orb',[0,1.72,-5],[0,0,1]);const before=shot(await state(),'orb','enemy').position[2];
    await advance(.5);s=await state();const incoming=shot(s,'orb','enemy');
    assert.ok(Math.abs(incoming.position[2]-before-3)<.01);assert.ok(Math.abs(incoming.slowFactor-.3)<1e-8);assert.equal(s.health,220);
    await page.keyboard.press('Escape');const frozen=await state();await advance(1);
    assert.deepEqual((await state()).lightningArt,frozen.lightningArt);assert.deepEqual((await state()).projectiles,frozen.projectiles);await page.keyboard.press('Enter');
    await advance(.3);await cast('lightning-orb');await advance(.1);
    assert.equal(shot(await state(),'orb','player').slowFactor,1,'Own projectiles remain at full speed');
    await advance(1);assert.equal((await state()).health,177,'Slowed shots still deal their original damage');
    await reset();await cast('lightning-reflect');await advance(9.9);assert.equal((await state()).lightningArt.fields.length,1);
    await advance(.11);assert.equal((await state()).lightningArt.fields.length,0,'Field ends after ten seconds');
    await reset();await cast('lightning-reflect');await advance(1.1);await cast('lightning-reflect');await advance(.1);
    assert.equal((await state()).lightningArt.fields.length,1,'Recast replaces the old field');assert.ok((await state()).lightningArt.fields[0].life>9.8);
    await click('qualityButton');await click('qualityButton');await advance(.1);await screenshot('field-low');
    await reset();assert.equal((await state()).lightningArt.fields.length,0);

    await equip(['lightning-lance','lightning-volley','lightning-thunder','lightning-barrier','lightning-reflect']);
    await cast('lightning-thunder');await advance(.8);s=await state();
    assert.equal(s.cameraView,'thunder-sky');assert.equal(s.handsVisible,false);assert.equal(s.lightningArt.clouds,1);assert.equal(s.enemyHealth,220);await screenshot('thunder-cloud');
    const target=shot(s,'thunder').target;
    await advance(.65);s=await state();assert.equal(s.lightningArt.bolts,1);assert.equal(s.enemyHealth,70);assert.equal(shot(s,'thunder').phase,'striking');await screenshot('thunder-bolt');
    await page.keyboard.press('Escape');const skyFrozen=await state();await advance(1);
    assert.deepEqual((await state()).viewRotation,skyFrozen.viewRotation);assert.equal((await state()).viewFov,skyFrozen.viewFov);assert.deepEqual((await state()).projectiles,skyFrozen.projectiles);await page.keyboard.press('Enter');
    await advance(.8);s=await state();assert.equal(s.cameraView,'first-person');assert.equal(s.handsVisible,true);assert.equal(s.yaw,0);assert.equal(s.pitch,0);assert.equal(s.enemyHealth,70,'One strike applies damage once');await screenshot('thunder-ground');
    await advance(.4);assert.equal((await state()).lightningArt.projectiles,0);
    await reset();await cast('lightning-thunder');await advance(.6);await reset();
    s=await state();assert.equal(s.cameraView,'first-person');assert.equal(s.lightningArt.clouds,0);assert.equal(s.viewFov,68);

    await enemy('lightning-thunder');await advance(.3);assert.equal((await state()).cameraView,'first-person','Enemy thunder does not take over the camera');
    for(let i=0;i<3;i++)await page.evaluate(()=>document.getElementById('world').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:2})));
    await advance(1.2);assert.equal((await state()).health,220,'Player can dodge the marked thunder strike');
    await reset();await enemy('lightning-reflect',[0,1.72,-10],[0,0,1]);await cast('lightning-volley');await advance(.6);
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
