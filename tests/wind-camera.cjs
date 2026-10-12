const { chromium } = require('playwright');
const assert = require('node:assert/strict'), fs = require('node:fs/promises'), path = require('node:path');

(async () => {
  const output = 'test-results/wind-camera'; await fs.mkdir(output, {recursive:true});
  const browser = await chromium.launch({executablePath:process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:960}}), errors=[];
    page.on('pageerror', e=>errors.push(e.message)); page.on('console', m=>{if(m.type()==='error')errors.push(m.text());});
    const state=()=>page.evaluate(()=>__AN_HOA__.state()), advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t);
    const click=id=>page.evaluate(id=>document.getElementById(id).click(),id);
    const reset=async()=>{await page.keyboard.press('Escape');await click('resetButton');};
    const enemy=id=>page.evaluate(id=>__AN_HOA__.launchEnemy(id),id);
    const capture=async name=>{await advance(0);await page.screenshot({path:output+'/'+name+'.png'});};
    const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
    const cast=async id=>{
      const cost=await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).cost,id), s=await state();
      await advance(Math.max(0,s.cooldown+.01,(cost-s.chakra)/11+.01));await page.keyboard.press('Backspace');
      for(const k of await page.evaluate(id=>SealGameCore.spells.find(s=>s.id===id).sequence,id))await page.keyboard.press(k);
      assert.equal(await page.locator('#castButton').isDisabled(),false,id);await page.keyboard.press('Space');
    };
    const equip=async()=>{await click('clearLoadout');for(const id of ['wind-reflect','fire-orb','fire-lance','water-tsunami','lightning-thunder'])await page.evaluate(id=>document.querySelector('[data-equip="'+id+'"]').click(),id);await click('startButton');};
    const overhead=s=>{
      assert.equal(s.cameraView,'wind-overhead');assert.equal(s.handsVisible,false);assert.equal(s.playerAvatar.visible,true);assert.equal(s.playerAvatar.aimVisible,true);
      const [x,y,z,w]=s.viewRotation;close(2*(x*w-y*z),-1);close(-2*(x*z+y*w),0);close(-(1-2*(x*x+y*y)),0);close(s.viewFov,68);
      close(s.playerAvatar.position[0],s.position[0]);close(s.playerAvatar.position[2],s.position[2]);close(s.playerAvatar.yaw,Math.PI+s.yaw);
    };
    const fps=s=>{assert.equal(s.cameraView,'first-person');assert.equal(s.handsVisible,true);assert.equal(s.playerAvatar.visible,false);assert.equal(s.playerAvatar.aimVisible,false);};
    await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1',{timeout:90000});
    await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});await click('soundButton');await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));await page.evaluate(()=>__AN_HOA__.setWindCameraEnabled(true));await equip();fps(await state());
    await cast('wind-reflect');await advance(.65);assert.equal((await state()).cameraView,'wind-summoning');await capture('reveal');
    await advance(1.15);let s=await state();overhead(s);close(s.windArt.spirits[0].life,5);assert.match(await page.locator('#shieldStatus').innerText(),/5\.0s/);await capture('overhead');
    await page.keyboard.press('Escape');const frozen=await state();await advance(20);assert.deepEqual((await state()).windArt,frozen.windArt);assert.deepEqual((await state()).viewPosition,frozen.viewPosition);assert.deepEqual((await state()).viewRotation,frozen.viewRotation);assert.deepEqual((await state()).playerAvatar,frozen.playerAvatar);await page.keyboard.press('Enter');
    const before=s.playerAvatar.handPose;await page.keyboard.press('q');await advance(.2);s=await state();overhead(s);assert.equal(s.playerAvatar.pose,s.activePose);assert.notDeepEqual(s.playerAvatar.handPose,before);await capture('sealing');await page.keyboard.press('w');await page.keyboard.press('Space');await advance(.1);s=await state();overhead(s);assert.equal(s.casts,2);assert.ok(s.projectiles.some(p=>p.owner==='player'&&p.element==='fire'));
    await page.evaluate(()=>document.getElementById('world').dispatchEvent(new MouseEvent('mousemove',{bubbles:true,movementX:-220,movementY:120})));await advance(.01);s=await state();overhead(s);close(s.yaw,.55);close(s.pitch,-.3);
    await page.evaluate(()=>document.getElementById('world').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:2})));await advance(.1);s=await state();overhead(s);assert.ok(s.position[0]>0);assert.ok(s.playerAvatar.legs.some(v=>Math.abs(v)>.01));await capture('dodge-and-aim');
    await advance(s.windArt.spirits[0].life-.01);overhead(await state());await advance(.02);s=await state();fps(s);assert.equal(s.windArt.spirits.length,0);close(s.yaw,.55);close(s.pitch,-.3);await capture('fps-restored');
    for(const id of ['fire-lance','water-tsunami','lightning-thunder']){
      await reset();await cast('wind-reflect');await advance(1.8);await cast(id);await advance(.1);overhead(await state());
      await advance((await state()).windArt.spirits[0].life+.01);fps(await state());
    }
    await reset();await enemy('wind-reflect');await advance(1.81);fps(await state());await reset();await cast('wind-reflect');await advance(1.81);overhead(await state());await reset();fps(await state());
    await page.setViewportSize({width:600,height:960});await click('qualityButton');await cast('wind-reflect');await advance(1.81);s=await state();overhead(s);
    const tan=Math.tan(68*Math.PI/360);for(const actor of [s.playerAvatar.position,s.enemyRenderPosition]){assert.ok(Math.abs(actor[2]-s.viewPosition[2])/(s.viewPosition[1]*tan)<.9);assert.ok(Math.abs(actor[0]-s.viewPosition[0])/(s.viewPosition[1]*tan*600/960)<.9);}const panelBottom=await page.locator('.enemy-status').evaluate(el=>el.getBoundingClientRect().bottom);
    const enemyPixelY=480+(s.enemyRenderPosition[2]-s.viewPosition[2])*480/((s.viewPosition[1]-s.enemyRenderPosition[1]-2.78)*tan);
    assert.ok(enemyPixelY>panelBottom+10,'The enemy stays below the portrait HUD');await capture('portrait-low');await reset();fps(await state());
    await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});await click('soundButton');await page.evaluate(()=>__AN_HOA__.setAIEnabled(false));await page.evaluate(()=>__AN_HOA__.setWindCameraEnabled(true));await equip();await cast('wind-reflect');await advance(1.81);overhead(await state());await capture('reduced-motion');await advance(5);fps(await state());
    assert.deepEqual(errors,[]);await fs.writeFile(output+'/verification.json',JSON.stringify({passed:true,activeDuration:5,revealDuration:1.8,cameraAngle:90,checks:['full-volume animated player','exact vertical view','pause','five-second boundary','sealing/casting/dodge/aim','other spell camera priority','FPS restore','enemy camera isolation','reset','portrait/low quality','reduced motion'],errors},null,2));console.log('PASS: 90-degree wind camera, animated player, five-second duration, controls, pause/reset, spell priority, portrait and reduced motion.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
