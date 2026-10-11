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
    await advance(.35); await screenshot('pirate-boat'); await look(140,0); await advance(.85);
    assert.equal((await state()).enemyHealth,130,'Boat flies to the fixed selected point despite changing aim');
    assert.deepEqual(target,[0,1.72,-24]);
    await reset(); await look(180,0); await cast('water-volley'); await advance(1.4);
    assert.equal((await state()).enemyHealth,220,'Boat aimed away misses');
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
    await cast('water-tsunami'); await advance(.1); await screenshot('tsunami');
    for (const id of ['fire-orb','lightning-orb','water-volley']) await enemy(id,[0,1.72,-5],[0,0,1]);
    await enemy('fire-orb',[9,1.72,-5],[0,0,1]);
    await enemy('fire-orb',[0,9,-5],[0,0,1]);
    await advance(.3); s=await state();
    const wave=s.projectiles.find(s=>s.style==='tsunami'); assert.equal(wave.carried.length,3,'Wave sweeps spells across elements');
    assert.equal(s.projectiles.filter(s=>s.owner==='enemy').length,2,'Shots above and outside wave survive');
    await screenshot('tsunami-carrying'); await advance(2); assert.equal((await state()).enemyHealth,190,'Wave damage is low');
    await advance(.5); assert.equal((await state()).enemyHealth,190,'Passing wave hits once');

    await reset(); await cast('water-tsunami'); await advance(1.1); await look(45,0); await cast('water-orb'); await advance(2.9);
    assert.ok((await state()).projectiles.find(s=>s.style==='tsunami').carried.some(s=>s.owner==='player'),'Wave also carries friendly spells');
    await reset(); await cast('water-reflect'); await advance(3); await cast('water-tsunami'); await advance(.1);
    assert.equal((await state()).waterArt.walls,0,'Wave sweeps stationary shields along its path');
    await page.keyboard.press('Escape'); s=await state(); await advance(2); assert.deepEqual((await state()).projectiles,s.projectiles);
    await page.keyboard.press('Enter'); await reset();
    assert.equal((await state()).controlTime,0); assert.equal((await state()).waterArt.prisons,0); assert.equal((await state()).waterArt.walls,0);
    for(let i=0;i<3;i++) { await cast('water-tsunami'); await advance(.2); await screenshot('quality-'+i); await click('qualityButton'); await reset(); }
    assert.deepEqual(errors,[]);
    console.log('PASS water: six exact formulas; water orb; prison interrupts and locks both sides, expires and pauses; pirate boat fixed target/hit/miss; body and directional circular shields; tsunami carries friendly/enemy spells and walls, preserves high/outside shots, deals low damage once; pause/reset; all graphics tiers; no shader/browser errors.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
