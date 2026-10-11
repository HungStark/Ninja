const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');

(async () => {
  await fs.mkdir('test-results/water', { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('file:///' + path.join(process.cwd(), 'index.html').replaceAll('\\', '/') + '?test=1');
    await page.waitForFunction(() => document.body.dataset.ready === 'true', null, { timeout: 60000 });
    const state = () => page.evaluate(() => window.__AN_HOA__.state());
    const advance = t => page.evaluate(t => window.__AN_HOA__.advance(t), t);
    const click = id => page.evaluate(id => document.getElementById(id).click(), id);
    const seal = async id => { for (const key of await page.evaluate(id => SealGameCore.spells.find(s => s.id === id).sequence, id)) await page.keyboard.press(key); };
    const cast = async id => { await seal(id); await page.keyboard.press('Space'); };
    const enemy = (id, pos, dir) => page.evaluate(({ id, pos, dir }) => window.__AN_HOA__.launchEnemy(id, pos, dir), { id, pos, dir });
    const reset = async () => { await page.keyboard.press('Escape'); await click('resetButton'); };
    const screenshot = name => page.screenshot({ path: `test-results/water/${name}.png` });
    const equip = async ids => {
      if ((await state()).started) { await page.keyboard.press('Escape'); await click('changeLoadout'); }
      await click('clearLoadout');
      for (const id of ids) await page.evaluate(id => document.querySelector(`[data-equip="${id}"]`).click(), id);
      await click('startButton');
    };
    const dodge = side => page.evaluate(side => document.getElementById('world').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: side })), side);
    const look = (x, y) => page.evaluate(({ x, y }) => document.getElementById('world').dispatchEvent(new MouseEvent('mousemove', { bubbles: true, movementX: x, movementY: y })), { x, y });
    await click('soundButton');
    await page.locator('[data-element="water"]').click();
    assert.equal(await page.locator('[data-equip]').count(), 6);
    for (const [id, count] of [['water-orb',2],['water-lance',5],['water-volley',6],['water-tsunami',8],['water-barrier',3],['water-reflect',4]]) {
      assert.equal(await page.locator(`[data-equip="${id}"] kbd`).count(), count);
    }
    await screenshot('catalog');
    await equip(['water-orb','water-lance','water-volley','water-barrier','water-reflect']);
    await cast('water-orb'); await advance(.4); assert.equal((await state()).waterArt.projectiles,1); await screenshot('orb');
    await advance(1.4); assert.equal((await state()).enemyHealth,182);

    await reset(); await cast('water-lance'); await advance(1.5);
    let s = await state(); assert.equal(s.enemyHealth,208); assert.ok(s.enemyControlTime > 2.8); assert.equal(s.waterArt.prisons,1);
    await screenshot('prison');
    const aiCasts = s.aiCasts; await advance(2); assert.equal((await state()).aiCasts,aiCasts,'Prison stops enemy casting');
    await page.keyboard.press('Escape'); const frozen = await state(); await advance(1);
    assert.equal((await state()).enemyControlTime,frozen.enemyControlTime); await page.keyboard.press('Enter');
    await advance(1.2); assert.equal((await state()).enemyControlTime,0); assert.equal((await state()).waterArt.prisons,0);

    await reset(); await cast('water-volley'); s = await state(); const target = s.projectiles[0].target;
    assert.equal(s.projectiles[0].phase,'emerging');assert.ok(s.projectiles[0].position[1]<-5);
    assert.equal(s.cameraView,'first-person');await advance(.35); const rise1=await state();assert.equal(rise1.projectiles[0].visual.wakeVisible,false);await screenshot('boat-emerging');
    await advance(.4);s=await state();assert.ok(s.projectiles[0].position[1]>rise1.projectiles[0].position[1]);
    assert.equal(s.enemyHealth,220);assert.equal(s.cameraView,'first-person');await screenshot('boat-rise');
    await advance(.7);s=await state();assert.equal(s.projectiles[0].phase,'flying');assert.equal(s.cameraView,'boat-overhead');assert.equal(s.handsVisible,false);assert.ok(s.viewPosition[1]>10);
    assert.deepEqual(s.projectiles[0].visual.up,[0,1,0]);assert.equal(s.projectiles[0].visual.wakeVisible,true);
    await screenshot('pirate-boat');const direction=[s.yaw,s.pitch];await look(140,0);assert.deepEqual([(await state()).yaw,(await state()).pitch],direction);
    await page.keyboard.press('Escape');const frozenBoat=await state();await advance(1);assert.deepEqual((await state()).viewPosition,frozenBoat.viewPosition);await page.keyboard.press('Enter');
    await advance(.85);
    assert.equal((await state()).enemyHealth,130,'Boat flies to the fixed selected point despite changing aim');
    assert.deepEqual(target,[0,1.72,-24]);
    await advance(.8);assert.equal((await state()).cameraView,'first-person');assert.equal((await state()).handsVisible,true);
    await reset();await look(100,60);await cast('water-volley');await advance(1.3);s=await state();
    assert.ok(Math.abs(s.projectiles[0].velocity[1])>.1,'Boat follows a vertically angled aim');
    assert.deepEqual(s.projectiles[0].visual.up,[0,1,0],'Angled flight never tips the mast');
    assert.equal(s.projectiles[0].visual.wakeVisible,true);await screenshot('boat-downward-aim');
    await reset(); await look(180,0); await cast('water-volley'); await advance(2.8);
    assert.equal((await state()).enemyHealth,220,'Boat aimed away misses');
    await reset();await enemy('water-reflect',[0,1.72,-2],[0,0,1]);await cast('water-volley');await advance(1.22);
    assert.equal((await state()).enemyHealth,220,'Shield can block the boat on its first flight frame');
    await advance(.8);assert.equal((await state()).cameraView,'first-person','Camera returns safely after an immediate block');
    await reset(); await cast('water-volley'); await advance(.3); await page.keyboard.press('Escape'); s=await state(); await advance(2);
    assert.deepEqual((await state()).projectiles,s.projectiles); await page.keyboard.press('Enter');
    await reset(); assert.equal((await state()).waterArt.projectiles,0);

    await cast('water-barrier'); await advance(.1); assert.equal((await state()).shield,65); assert.equal((await state()).waterArt.shields,1); await screenshot('body-shield');
    await enemy('fire-orb',[0,1.72,2],[0,0,1]); await advance(.3);
    assert.equal((await state()).health,220); assert.equal((await state()).shield,22);
    await advance(1); await cast('water-reflect'); await advance(.1); s=await state();
    assert.equal(s.shield,22,'Circular shield coexists with the body shield'); assert.equal(s.reflect,0); assert.equal(s.waterArt.walls,1);
    await screenshot('circular-shield');
    await enemy('fire-orb',[0,1.72,-3],[0,0,1]); await advance(.5);
    assert.equal((await state()).walls[0].hp,52); assert.equal((await state()).shield,22); assert.equal((await state()).health,220);
    await reset(); await cast('water-reflect'); await dodge(2); await dodge(2); await advance(.4);
    await enemy('fire-orb',[3.6,1.72,-3],[0,0,1]); await advance(.5);
    assert.equal((await state()).health,177,'Shot around circular shield still hits'); assert.equal((await state()).walls[0].hp,95);

    await reset(); await enemy('water-lance',[0,1.72,2],[0,0,1]); await advance(.3); s=await state();
    assert.ok(s.controlTime>2.8); assert.equal(s.health,208); const playerPosition=s.position;
    await dodge(2); await cast('water-orb'); await advance(.5); s=await state();
    assert.deepEqual(s.position,playerPosition); assert.equal(s.casts,0); assert.deepEqual(s.sequence,[],'Player cannot seal while trapped');
    await page.keyboard.press('Escape'); s=await state(); await advance(1); assert.equal((await state()).controlTime,s.controlTime);
    await page.keyboard.press('Enter'); await advance(2.6); assert.equal((await state()).controlTime,0);
    await dodge(2); await advance(.2); assert.ok((await state()).position[0]>0,'Movement resumes');
    await reset(); await cast('water-barrier'); await enemy('water-lance',[0,1.72,2],[0,0,1]); await advance(.3);
    assert.equal((await state()).controlTime,0,'Absorbed prison projectile cannot imprison');

    await equip(['water-tsunami','water-orb','water-volley','water-barrier','water-reflect']);
    await cast('water-tsunami'); await advance(.3);s=await state();assert.equal(s.cameraView,'wave-feet');assert.equal(s.projectiles[0].phase,'gathering');
    assert.ok(Math.abs(s.projectiles[0].position[2]-7)<.2);assert.equal(s.projectiles[0].growth,0);assert.equal(s.enemyHealth,220);
    assert.equal(s.projectiles[0].introStage,'pool');assert.equal(s.projectiles[0].visual.poolVisible,true);
    assert.equal(s.projectiles[0].visual.bodyVisible,false);assert.equal(s.projectiles[0].visual.bubblesVisible,false);
    assert.ok(s.viewRotation[0]<-.4,'Camera looks down from the eyes');await screenshot('wave-feet');
    await page.keyboard.press('Escape');const frozenWave=await state();await advance(1);assert.deepEqual((await state()).viewRotation,frozenWave.viewRotation);assert.deepEqual((await state()).projectiles,frozenWave.projectiles);await page.keyboard.press('Enter');
    await advance(.3);s=await state();assert.equal(s.cameraView,'wave-feet');assert.equal(s.projectiles[0].introStage,'foam');
    assert.equal(s.projectiles[0].growth,0);assert.equal(s.projectiles[0].visual.bodyVisible,false);assert.equal(s.projectiles[0].visual.bubblesVisible,true);await screenshot('wave-bubbles');
    await advance(.7);s=await state();assert.equal(s.cameraView,'wave-rising');assert.equal(s.projectiles[0].introStage,'rising');assert.ok(s.projectiles[0].growth>.5);assert.equal(s.projectiles[0].visual.bodyVisible,true);await screenshot('wave-rising');
    await advance(.6);s=await state();assert.equal(s.cameraView,'first-person');assert.equal(s.pitch,0);assert.equal(s.projectiles[0].phase,'flying');assert.equal(s.projectiles[0].growth,1);assert.ok(s.projectiles[0].depth>=6);
    assert.equal(s.projectiles[0].visual.poolVisible,false);
    await screenshot('tsunami');
    for (const id of ['fire-orb','lightning-orb','water-volley']) await enemy(id,[0,1.72,id==='water-volley'?-12:-5],[0,0,1]);
    await enemy('fire-orb',[9,1.72,-5],[0,0,1]);
    await enemy('fire-orb',[0,9,-5],[0,0,1]);
    await advance(.85); s=await state();
    const wave=s.projectiles.find(s=>s.style==='tsunami'); assert.equal(wave.carried.length,3,'Wave sweeps spells across elements');
    assert.equal(s.projectiles.filter(s=>s.owner==='enemy').length,2,'Shots above and outside wave survive');
    await screenshot('tsunami-carrying'); await advance(1.8); assert.equal((await state()).enemyHealth,190,'Wave damage is low');
    await advance(.5); assert.equal((await state()).enemyHealth,190,'Passing wave hits once');

    await reset(); await cast('water-tsunami'); await advance(1.85); await look(45,0); await cast('water-orb'); await advance(.1);
    assert.ok((await state()).projectiles.find(s=>s.style==='tsunami').carried.some(s=>s.owner==='player'),'Wave also carries friendly spells');
    await reset(); await cast('water-reflect'); await advance(3); await cast('water-tsunami'); await advance(1.9);
    assert.equal((await state()).waterArt.walls,0,'Wave sweeps stationary shields along its path');
    await page.keyboard.press('Escape'); s=await state(); await advance(2); assert.deepEqual((await state()).projectiles,s.projectiles);
    await page.keyboard.press('Enter'); await reset();
    assert.equal((await state()).controlTime,0); assert.equal((await state()).waterArt.prisons,0); assert.equal((await state()).waterArt.walls,0);
    await cast('water-tsunami');await seal('water-tsunami');assert.equal((await state()).handWater,false,'Cooldown and depleted chakra suppress the water ring');
    await advance(1.05);assert.equal((await state()).handWater,false);await advance(3.1);assert.equal((await state()).handWater,true,'Eight water seals restore the water ring when chakra recovers');
    await screenshot('water-eight-seals-ready');await page.keyboard.press('Backspace');assert.equal((await state()).handWater,false);await reset();
    await enemy('water-volley');await advance(.6);assert.equal((await state()).cameraView,'first-person','Enemy ship does not move the player camera');
    await enemy('water-tsunami');await advance(.4);assert.equal((await state()).cameraView,'first-person','Enemy wave does not move the player camera');await reset();
    await cast('water-tsunami');await advance(.4);await reset();assert.equal((await state()).cameraView,'first-person','Reset clears the feet camera during wave growth');
    for(let i=0;i<3;i++) { await cast('water-tsunami'); await advance(2.1); await screenshot('quality-'+i); await click('qualityButton'); await reset(); }
    assert.deepEqual(errors,[]);
    console.log('PASS water: six formulas; prison; ground emergence and overhead ship camera; feet camera, progressive thick wave and foam; fixed aim/hit/miss; circular shields; sweeping and low damage once; readiness ring with chakra/cooldown; pause/reset and enemy camera isolation; all graphics tiers; no shader/browser errors.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
