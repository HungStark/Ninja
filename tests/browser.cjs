const fs = require('node:fs/promises'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
(async () => {
  await fs.mkdir('test-results/seals', { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('file:///' + path.join(process.cwd(), 'index.html').replaceAll('\\', '/') + '?test=1');
    await page.waitForFunction(() => document.body.dataset.ready === 'true', null, { timeout: 60000 });
    const state = () => page.evaluate(() => window.__AN_HOA__.state());
    const advance = s => page.evaluate(s => window.__AN_HOA__.advance(s), s);
    const click = id => page.evaluate(id => document.getElementById(id).click(), id);
    const center = async () => { await page.evaluate(() => { const s=window.__AN_HOA__.state(); document.getElementById('world').dispatchEvent(new MouseEvent('mousemove',{bubbles:true,movementX:s.yaw/.0025,movementY:s.pitch/.0025})); }); await advance(.02); };
    const cast = async id => {
      const sequence = await page.evaluate(id => globalThis.SealGameCore.spells.find(s => s.id === id).sequence, id);
      await page.keyboard.press('Backspace');
      for (const key of sequence) await page.keyboard.press(key);
      await page.keyboard.press('Space');
    };
    const reset = async () => { await page.keyboard.press('Escape'); await click('resetButton'); await center(); };
    assert.equal((await state()).bones,16);
    assert.equal(await page.locator('[data-equip]').count(),45);
    assert.equal(await page.locator('[data-element]').count(),10);
    await page.screenshot({path:'test-results/start.png'});
    for (const element of ['fire','water','lightning','wind','earth','light','dark','wood','ice']) {
      await page.locator('[data-element="'+element+'"]').click();
      assert.equal(await page.locator('[data-equip]').count(),5);
    }
    await page.locator('[data-element="all"]').click();
    await page.locator('[data-kind="defense"]').click(); assert.equal(await page.locator('[data-equip]').count(),18);
    await page.locator('[data-kind="attack"]').click(); assert.equal(await page.locator('[data-equip]').count(),27);
    await page.locator('[data-kind="all"]').click();
    await page.locator('[data-equip="wood-orb"]').click();assert.equal((await state()).loadout.length,5);
    await click('clearLoadout');assert.equal(await page.locator('#startButton').isDisabled(),true);
    await page.keyboard.press('Enter');assert.equal((await state()).started,false);
    await click('presetDefense'); assert.equal((await state()).loadout.filter(id=>id.endsWith('barrier')||id.endsWith('reflect')).length,3);
    await click('presetAttack');
    await page.keyboard.press('Enter'); await center();
    assert.equal((await state()).started,true);assert.equal(await page.locator('[data-spell]').count(),5);
    assert.equal((await state()).enemyPosition[2],(await state()).gatePosition[2]);assert.equal((await state()).position[2]-(await state()).enemyPosition[2],31);
    await page.screenshot({path:'test-results/play.png'});
    const wrists=[];
    for(const key of 'qwerasdfzxcv') {
      await page.keyboard.press('Backspace');await page.keyboard.press(key);await advance(.35);
      wrists.push((await state()).handPose.map(v=>v.toFixed(2)).join(','));
      await page.screenshot({path:'test-results/seals/'+key+'.png'});
    }
    assert.equal(new Set(wrists).size,12);
    await reset();
    const initial=await state();
    await page.keyboard.down('ArrowUp');await page.keyboard.down('ArrowRight');await advance(.5);await page.keyboard.up('ArrowUp');await page.keyboard.up('ArrowRight');
    assert.deepEqual((await state()).position,initial.position);
    await page.evaluate(()=>document.getElementById('world').dispatchEvent(new MouseEvent('mousemove',{bubbles:true,movementX:80,movementY:0})));await advance(.15);assert.equal((await state()).position[0],0);
    await page.evaluate(()=>document.getElementById('world').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:0,clientX:1080})));await advance(.3);assert.ok(Math.abs((await state()).position[0]+1.8)<.001);
    await page.mouse.move(720,480);await page.mouse.down({button:'right'});await advance(.5);assert.ok(Math.abs((await state()).position[0])<.001);
    const stopped=(await state()).position[0];await advance(.6);assert.equal((await state()).position[0],stopped);await page.mouse.up({button:'right'});
    await page.evaluate(()=>document.getElementById('world').dispatchEvent(new MouseEvent('mousedown',{bubbles:true,button:2,clientX:10})));await advance(.3);assert.ok(Math.abs((await state()).position[0]-1.8)<.001);
    assert.equal((await state()).position[2],7);
    await reset();
    await cast('dark-orb');assert.equal((await state()).casts,0);
    await cast('fire-orb');await advance(.15);assert.equal((await state()).casts,1);assert.ok((await state()).light>0);
    assert.equal((await state()).projectiles[0].element,'fire');
    await page.screenshot({path:'test-results/fire.png'});await advance(1.6);assert.equal((await state()).enemyHealth,177);
    await reset();await advance(2.3);assert.ok((await state()).enemyPose>=0);assert.equal((await state()).enemySequence.length,1);
    await page.screenshot({path:'test-results/enemy-seal.png'});await advance(2.4);
    assert.ok((await state()).aiCasts>=1);assert.equal((await state()).health,177);
    await reset();await advance(3.7);await cast('earth-barrier');assert.equal((await state()).shield,78);await advance(1);
    assert.equal((await state()).health,220);assert.equal((await state()).shield,35);
    await page.screenshot({path:'test-results/shield.png'});
    await page.keyboard.press('Escape');const frozen=await state();await advance(3);
    assert.equal((await state()).health,frozen.health);assert.equal((await state()).shieldTime,frozen.shieldTime);assert.equal((await state()).enemySequence.join(''),frozen.enemySequence.join(''));assert.equal((await state()).time,frozen.time);
    await page.keyboard.press('Enter');assert.equal((await state()).paused,false);
    await reset();await advance(3.7);await cast('ice-reflect');await advance(2.5);
    assert.equal((await state()).health,220);assert.equal((await state()).reflect,0);assert.equal((await state()).enemyHealth,177);
    await page.screenshot({path:'test-results/reflect.png'});
    await reset();await cast('water-lance');await advance(.1);assert.equal((await state()).projectiles[0].element,'water');assert.equal((await state()).projectiles[0].color,'#50baff');
    await page.screenshot({path:'test-results/water.png'});
    await reset();await cast('lightning-volley');await advance(.05);assert.equal((await state()).shots,3);
    await page.screenshot({path:'test-results/lightning.png'});
    await reset();
    for(let i=0;i<8 && !(await state()).won;i++){ await cast('fire-orb');await advance(1.5); }
    assert.equal((await state()).won,true);assert.equal((await state()).victory,true);assert.equal((await state()).score,1);
    await page.screenshot({path:'test-results/victory.png'});
    await click('nextButton');assert.equal((await state()).started,false);assert.equal((await state()).round,2);assert.equal(await page.locator('#startScreen').isVisible(),true);
    await click('startButton');await center();await advance(30);assert.equal((await state()).won,true);assert.equal((await state()).victory,false);assert.equal((await state()).health,0);
    await page.screenshot({path:'test-results/defeat.png'});
    await click('nextButton');await click('presetDefense');await click('startButton');await center();assert.equal((await state()).equipped.filter(id=>id.endsWith('barrier')||id.endsWith('reflect')).length,3);
    await page.keyboard.press('Escape');await click('changeLoadout');await click('presetAttack');await click('startButton');await center();
    for(const expected of ['Thấp','Cao','Cân bằng']){await click('qualityButton');assert.equal((await state()).quality,expected);await advance(.1);}
    await page.setViewportSize({width:900,height:650});await advance(.2);await page.screenshot({path:'test-results/compact.png'});
    await page.keyboard.press('Escape');await click('changeLoadout');await page.screenshot({path:'test-results/compact-scroll.png'});
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/mobile-scroll.png'});
    assert.equal(await page.locator('#startButton').isEnabled(),true);
    await page.setViewportSize({width:1440,height:960});await click('startButton');await center();await page.screenshot({path:'test-results/final.png'});
    assert.deepEqual(errors,[]);
    const report={passed:true,renderer:'Edge / WebGL 2 / SwiftShader',checks:['9 elements and 45 catalog spells; 2-6 seals by rank; opponent under the gate at 31m','loadout cap, filters, presets, empty validation','12 distinct skinned poses','equipped-only casting','centered FPS aim; left/right click sidesteps; holding and mouse position do not move player','animated AI seals and real incoming damage','barrier absorbs damage','reflection returns enemy projectile','pause freezes fighters, AI, timers','victory, defeat, reset and reselect loadout','colored projectiles and three graphics tiers','offline loading and responsive scroll'],state:await state(),errors};
    await fs.writeFile('test-results/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
