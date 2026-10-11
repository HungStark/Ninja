const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  await fs.mkdir('test-results/impact-motion', { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 720 } }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const state = () => page.evaluate(() => window.__AN_HOA__.state());
    const advance = t => page.evaluate(t => window.__AN_HOA__.advance(t), t);
    const click = id => page.evaluate(id => document.getElementById(id).click(), id);
    const cast = async id => {
      const keys = await page.evaluate(id => SealGameCore.spells.find(s => s.id === id).sequence, id);
      for (const key of keys) await page.keyboard.press(key);
      await page.keyboard.press('Space');
    };
    const reset = async () => { await page.keyboard.press('Escape'); await click('resetButton'); };
    const open = async () => {
      await page.goto('file:///' + path.join(process.cwd(), 'index.html').replaceAll('\\', '/') + '?test=1');
      await page.waitForFunction(() => document.body.dataset.ready === 'true', null, { timeout: 60000 });
      await click('soundButton'); await click('clearLoadout');
      for (const id of ['fire-orb', 'fire-volley', 'fire-lance', 'fire-barrier', 'fire-reflect']) await page.evaluate(id => document.querySelector('[data-equip="' + id + '"]').click(), id);
      await click('startButton');
    };
    const near = (a, b, message) => assert.ok(Math.abs(a - b) < 1e-7, message + ': ' + a + ' vs ' + b);
    await open(); await cast('fire-volley');
    const row = (await state()).projectiles.sort((a, b) => a.rowIndex - b.rowIndex);
    assert.equal(row.length, 3);
    assert.ok(row.every(s => s.phase === 'staged' && s.size < .1 && s.holdTime === .5));
    for (const shot of row) {
      near(shot.position[1], row[0].position[1], 'Horizontal row height'); near(shot.position[2], row[0].position[2], 'Horizontal row depth');
      assert.deepEqual(shot.velocity, [0, 0, 0]); assert.deepEqual(shot.target, row[0].target);
    }
    near(row[1].position[0] - row[0].position[0], .28, 'Equal spacing'); near(row[2].position[0] - row[1].position[0], .28, 'Equal spacing');
    await advance(.25); await page.screenshot({ path: 'test-results/impact-motion/volley-row.png' });
    await page.keyboard.press('Escape'); const frozenRow = await state(); await advance(1);
    assert.deepEqual((await state()).projectiles, frozenRow.projectiles); near((await state()).viewFov, frozenRow.viewFov, 'Pause freezes charge zoom');
    await page.keyboard.press('Enter'); await advance(.24);
    assert.ok((await state()).projectiles.every(s => s.phase === 'staged'), 'Hold for the entire .5s');
    const phases = async () => (await state()).projectiles.sort((a, b) => a.rowIndex - b.rowIndex).map(s => s.phase);
    await advance(.01); assert.deepEqual(await phases(), ['flying', 'staged', 'staged'], 'First orb releases at .5s');
    await advance(.09); assert.deepEqual(await phases(), ['flying', 'staged', 'staged']);
    await advance(.01); assert.deepEqual(await phases(), ['flying', 'flying', 'staged'], 'Second orb releases at .6s');
    await page.keyboard.press('Escape'); const midSalvo = await state(); await advance(1);
    assert.deepEqual((await state()).projectiles, midSalvo.projectiles, 'Pause freezes a partially released volley');
    await page.keyboard.press('Enter');
    await advance(.09); assert.deepEqual(await phases(), ['flying', 'flying', 'staged']);
    await advance(.01); assert.ok((await state()).projectiles.every(s => s.phase === 'flying' && s.velocity[2] < 0), 'Third orb releases at .7s');
    await advance(.05); assert.ok((await state()).cameraReaction.strength > 0, 'Volley release kicks the camera');
    await page.screenshot({ path: 'test-results/impact-motion/volley-launch.png' });
    await advance(1.3); const volleyHit = await state();
    assert.equal(volleyHit.enemyHealth, 148); assert.equal(volleyHit.shots, 0); assert.equal(volleyHit.fireArt.bursts, 0); assert.equal(volleyHit.smoke, 0);
    await page.screenshot({ path: 'test-results/impact-motion/volley-hit-clean.png' });
    await reset(); await cast('fire-volley'); await advance(.1);
    await page.evaluate(() => document.getElementById('world').dispatchEvent(new MouseEvent('mousemove', { bubbles: true, movementX: 160, movementY: 0 })));
    await advance(.2);
    for (const s of (await state()).projectiles) assert.deepEqual(s.target, row[0].target, 'Aim changes do not move the fixed destination');
    await advance(1.6); assert.equal((await state()).enemyHealth, 148, 'All three shots converge on the chosen target after turning');
    await reset(); await cast('fire-orb'); await advance(.09); const orbKick = await state();
    assert.ok(orbKick.viewFov > 68 && orbKick.cameraReaction.strength > 0, 'Orb firing has recoil and zoom out');
    assert.equal(orbKick.yaw, 0); assert.equal(orbKick.pitch, 0);
    await page.keyboard.press('Escape'); const frozenKick = await state(); await advance(.7);
    assert.deepEqual((await state()).viewPosition, frozenKick.viewPosition); assert.deepEqual((await state()).viewRotation, frozenKick.viewRotation); near((await state()).viewFov, frozenKick.viewFov, 'Pause freezes firing zoom');
    await page.keyboard.press('Enter'); await advance(.6); assert.ok(Math.abs((await state()).viewFov - 68) < .01);
    await reset(); await cast('fire-lance'); await advance(.8); assert.ok((await state()).viewFov < 65, 'Dragon gathers force with a zoom in');
    await advance(.38); assert.ok((await state()).cameraReaction.strength > 0 && (await state()).viewFov > 66, 'Dragon release widens the view and shakes');
    for (let i = 0; i < 40 && (await state()).enemyHealth === 220; i++) await advance(.04);
    assert.equal((await state()).enemyHealth, 116); assert.ok((await state()).cameraReaction.strength > 0, 'Dragon hit shakes after cinematic positioning');
    await reset(); await advance(2.7); await cast('fire-barrier');
    for (let i = 0; i < 60 && (await state()).shield === 75; i++) await advance(.04);
    assert.equal((await state()).shield, 32); assert.ok((await state()).cameraReaction.strength > 0, 'Blocking a shot gives a camera bounce');
    await reset();
    for (let i = 0; i < 130 && (await state()).health === 220; i++) await advance(.04);
    assert.equal((await state()).health, 177); assert.ok((await state()).cameraReaction.strength > 0, 'Getting hit kicks the camera');
    await page.keyboard.press('Escape'); await click('changeLoadout'); await click('presetFire'); await click('startButton'); await cast('fire-meteor');
    const meteorStart = (await state()).projectiles[0], samples = [];
    let elapsed = 0;
    for (const time of [.4, 1.3, 1.5, 1.81, 2.7]) {
      await advance(time - elapsed); elapsed = time;
      const s = (await state()).projectiles.find(s => s.style === 'meteor'); samples.push(s.position);
      assert.deepEqual(s.velocity, meteorStart.velocity, 'One velocity across every camera phase');
      for (let i = 0; i < 3; i++) near(s.position[i], meteorStart.position[i] + meteorStart.velocity[i] * s.age, 'Meteor stays on one straight line');
    }
    await advance(.75); const meteorHit = await state();
    assert.equal(meteorHit.enemyHealth, 70); assert.ok(meteorHit.cameraReaction.strength > 0 && meteorHit.viewFov > 68, 'Meteor impact creates shake and zoom out');
    await page.screenshot({ path: 'test-results/impact-motion/meteor-impact.png' });
    await page.keyboard.press('Escape'); const pausedImpact = await state(); await advance(1);
    assert.deepEqual((await state()).viewPosition, pausedImpact.viewPosition); near((await state()).viewFov, pausedImpact.viewFov, 'Impact freeze');
    await page.keyboard.press('Enter'); await advance(.55); assert.ok((await state()).cameraReaction.strength < meteorHit.cameraReaction.strength, 'Aftershock decays');
    await reset(); assert.equal((await state()).viewFov, 68); assert.equal((await state()).cameraReaction.pulses, 0);
    await page.emulateMedia({ reducedMotion: 'reduce' }); await open(); await cast('fire-volley'); await advance(.6);
    assert.equal((await state()).viewFov, 68); assert.equal((await state()).cameraReaction.strength, 0); assert.deepEqual((await state()).viewPosition, (await state()).position);
    assert.deepEqual(errors, []);
    await fs.writeFile('test-results/impact-motion/verification.json', JSON.stringify({ passed: true, meteorSamples: samples, volleyDamage: 72, errors }, null, 2));
    console.log('PASS: three staged orbs, .5s delay then .1s between shots, locked target, clean hits, straight meteor, cast/charge/release/impact/block/hit camera reactions, pause/reset and reduced motion.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
