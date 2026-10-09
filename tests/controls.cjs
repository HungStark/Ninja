const { chromium } = require('playwright'), path = require('node:path'), assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({ executablePath:process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless:true, args:['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
 try {
  const page=await browser.newPage({viewport:{width:1440,height:960}}), errors=[];
  page.on('pageerror', e=>errors.push(e.message));
  await page.goto('file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1');
  await page.waitForFunction(()=>document.body.dataset.ready==='true',null,{timeout:60000});
  const state=()=>page.evaluate(()=>window.__AN_HOA__.state());
  const advance=seconds=>page.evaluate(s=>window.__AN_HOA__.advance(s),seconds);
  const press=(button,x)=>page.evaluate(({button,x})=>document.getElementById('world').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button,clientX:x,clientY:480})),{button,x});
  await page.locator('#startButton').click();
  await page.waitForFunction(()=>document.pointerLockElement===document.getElementById('world'));
  assert.equal((await state()).aimLocked,true);
  const reticle=await page.locator('#reticle').boundingBox();assert.equal(reticle.x+reticle.width/2,720);assert.equal(reticle.y+reticle.height/2,480);
  const before=await state();
  await page.evaluate(()=>document.getElementById('world').dispatchEvent(new MouseEvent('mousemove',{bubbles:true,movementX:80,movementY:-40})));await advance(.01);
  assert.equal((await state()).position[0],0);assert.ok(Math.abs((await state()).yaw-before.yaw+.2)<1e-8);assert.ok(Math.abs((await state()).pitch-before.pitch-.1)<1e-8);
  await press(0,1300);await advance(.08);assert.ok((await state()).position[0]<0 && (await state()).position[0]>-1.8);
  await advance(.3);assert.ok(Math.abs((await state()).position[0]+1.8)<.001);
  await press(2,10);await advance(.3);assert.ok(Math.abs((await state()).position[0])<.001);
  await page.mouse.down({button:'right'});await advance(.4);assert.ok(Math.abs((await state()).position[0]-1.8)<.001);
  await advance(.8);assert.ok(Math.abs((await state()).position[0]-1.8)<.001);await page.mouse.up({button:'right'});
  const stopped=await state();
  await page.evaluate(()=>document.getElementById('world').dispatchEvent(new MouseEvent('mousemove',{bubbles:true,movementX:-300,movementY:60})));await advance(.2);assert.equal((await state()).position[0],stopped.position[0]);
  for(let i=0;i<20;i++)await press(0,1400);await advance(1.3);assert.equal((await state()).position[0],-6);
  for(let i=0;i<20;i++)await press(2,0);await advance(1.3);assert.equal((await state()).position[0],6);assert.equal((await state()).position[2],7);
  await press(0,1400);await advance(.04);await page.keyboard.press('Escape');
  await page.waitForFunction(()=>window.__AN_HOA__.state().paused && !document.pointerLockElement);
  const frozen=await state();await advance(.5);assert.equal((await state()).position[0],frozen.position[0]);
  await page.locator('#resumeButton').click();await page.waitForFunction(()=>document.pointerLockElement===document.getElementById('world'));
  await advance(.4);assert.equal((await state()).position[0],frozen.position[0]);
  await page.screenshot({path:'test-results/click-controls.png'});
  await page.evaluate(()=>document.exitPointerLock());await page.waitForFunction(()=>window.__AN_HOA__.state().paused);
  // Without pointer lock, clicking interface buttons must not cause a sidestep.
  await page.evaluate(()=>document.getElementById('resumeButton').click());
  const uiBefore=await state();await page.evaluate(()=>document.querySelector('[data-key="q"]').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0})));await advance(.2);
  assert.equal((await state()).position[0],uiBefore.position[0]);assert.equal((await state()).moveTargetX,uiBefore.position[0]);
  await page.keyboard.press('Escape');await page.evaluate(()=>document.getElementById('resetButton').click());
  const neutral=await state();assert.equal(neutral.position[0],0);assert.equal(neutral.yaw,0);assert.equal(neutral.pitch,0);
  const sequence=await page.evaluate(()=>globalThis.SealGameCore.spells.find(s=>s.id==='fire-orb').sequence);
  for(const key of sequence)await page.keyboard.press(key);await page.keyboard.press('Space');await advance(1.8);assert.equal((await state()).enemyHealth,177,'Projectile follows centered reticle');
  assert.deepEqual(errors,[]);
  console.log('PASS controls: native pointer lock; centered reticle and hit ray; mouse aims only; left/right click directions independent of screen side; one step per click/hold; movement bounds; pause/resume cancels steps; losing lock pauses; HUD does not dodge.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
