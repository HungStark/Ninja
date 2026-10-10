const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');

(async () => {
  await fs.mkdir('test-results/fire', { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('file:///' + path.join(process.cwd(), 'index.html').replaceAll('\\', '/') + '?test=1');
    await page.waitForFunction(() => document.body.dataset.ready === 'true', null, { timeout: 60000 });
    const state = () => page.evaluate(() => window.__AN_HOA__.state());
    const click = id => page.evaluate(id => document.getElementById(id).click(), id);
    const advance = t => page.evaluate(t => window.__AN_HOA__.advance(t), t);
    const seal = async id => {
      const keys = await page.evaluate(id => SealGameCore.spells.find(s => s.id === id).sequence, id);
      for (const key of keys) await page.keyboard.press(key);
    };
    const cast = async id => { await seal(id); await page.keyboard.press('Space'); };
    const reset = async () => { await page.keyboard.press('Escape'); await click('resetButton'); };
    const screenshot = name => page.screenshot({ path: `test-results/fire/${name}.png` });
    await click('soundButton'); await click('presetFire');
    assert.equal(await page.locator('[data-equip]').count(), 6);
    assert.equal(await page.locator('#loadoutSlots .filled').count(), 5);
    await screenshot('catalog'); await click('startButton');

    await cast('fire-volley');
    assert.equal((await state()).casts, 1); assert.equal((await state()).shots, 1); assert.equal((await state()).salvos, 3);
    await advance(.35); assert.equal((await state()).shots, 3); await screenshot('salvo');
    await advance(.1); assert.equal((await state()).shots, 4); assert.equal((await state()).salvos, 0);
    await advance(1.3); assert.equal((await state()).enemyHealth, 124, 'All four consecutive bolts hit the aim point');

    await reset(); await cast('fire-lance');
    assert.equal((await state()).projectiles[0].style, 'dragon'); assert.equal((await state()).chakra, 44);
    const dragonOrigin = (await state()).projectiles[0].position;
    await advance(.3); await screenshot('dragon-forming');
    assert.ok((await state()).fireArt.projectiles > 0);
    assert.equal((await state()).projectiles[0].phase, 'forming');
    assert.deepEqual((await state()).projectiles[0].position, dragonOrigin);
    assert.equal((await state()).cameraView, 'first-person'); assert.equal((await state()).handsVisible, true);
    await page.keyboard.press('Escape'); const coilFrozen = await state(); await advance(2);
    assert.deepEqual((await state()).projectiles, coilFrozen.projectiles, 'Pause freezes dragon formation');
    await page.keyboard.press('Enter'); await advance(.5); await screenshot('dragon');
    assert.equal((await state()).enemyHealth, 220, 'The forming coil does not deal damage');
    await advance(.7); await screenshot('dragon-overhead');
    const overhead = await state();
    assert.equal(overhead.cameraView, 'overhead'); assert.equal(overhead.projectiles[0].phase, 'flying');
    assert.equal(overhead.handsVisible, false);
    assert.ok(overhead.viewPosition[0] < overhead.projectiles[0].position[0] && overhead.viewPosition[1] > 10, 'Camera is above and left of the flying dragon');
    await page.keyboard.press('Escape'); await advance(2);
    assert.deepEqual((await state()).viewPosition, overhead.viewPosition, 'Pause freezes cinematic camera');
    assert.deepEqual((await state()).projectiles, overhead.projectiles);
    await page.keyboard.press('Enter');
    await page.evaluate(() => document.getElementById('world').dispatchEvent(new MouseEvent('mousemove', { bubbles: true, movementX: 80, movementY: 40 })));
    assert.equal((await state()).yaw, 0); assert.equal((await state()).pitch, 0, 'Cinematic view does not change the player aim');
    await page.evaluate(() => document.getElementById('world').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })));
    await advance(.7); assert.equal((await state()).enemyHealth, 116); await screenshot('dragon-impact');
    assert.equal((await state()).cameraView, 'impact');
    await advance(.4); assert.equal((await state()).cameraView, 'returning');
    await page.keyboard.press('Escape'); const returnFrozen = await state(); await advance(1);
    assert.deepEqual((await state()).viewPosition, returnFrozen.viewPosition, 'Pause also freezes the return transition');
    assert.deepEqual((await state()).viewRotation, returnFrozen.viewRotation);
    await page.keyboard.press('Enter'); await advance(.3); const returned = await state();
    assert.equal(returned.cameraView, 'first-person'); assert.equal(returned.handsVisible, true);
    assert.ok(Math.abs(returned.viewPosition[0] - returned.position[0]) < .01, 'Returns to player current position after a dodge');
    assert.equal(returned.yaw, 0); assert.equal(returned.pitch, 0);
    await reset(); await cast('fire-lance'); await advance(1.5);
    assert.equal((await state()).cameraView, 'overhead'); await reset();
    assert.equal((await state()).cameraView, 'first-person'); assert.equal((await state()).handsVisible, true);
    assert.equal((await state()).shots, 0); assert.equal((await state()).fireArt.projectiles, 0);
    await page.evaluate(() => document.getElementById('world').dispatchEvent(new MouseEvent('mousemove', { bubbles: true, movementX: 120, movementY: -60 })));
    await cast('fire-lance'); await advance(1.5);
    const angled = await state(), shotPosition = angled.projectiles[0].position;
    const left = [-Math.cos(angled.yaw), 0, Math.sin(angled.yaw)];
    assert.ok(angled.viewPosition.reduce((n, x, i) => n + (x - shotPosition[i]) * left[i], 0) > 0, 'Upper-left camera follows the launch direction when aiming sideways');
    await advance(2.8); const missed = await state();
    assert.equal(missed.enemyHealth, 220, 'A dragon aimed off target misses');
    assert.equal(missed.cameraView, 'first-person'); assert.equal(missed.handsVisible, true, 'Camera also returns after a miss');
    assert.ok(Math.abs(missed.yaw + .3) < 1e-8 && Math.abs(missed.pitch - .15) < 1e-8, 'Original aim survives the entire cinematic');
    await reset(); await advance(8.2); await screenshot('dragon-incoming');
    assert.equal((await state()).cameraView, 'first-person', 'Enemy dragon never takes over the player camera');

    await reset(); await page.keyboard.press('3');
    assert.equal(await page.locator('#comboSlots .combo-slot').count(), 8);
    await seal('fire-lance'); assert.equal((await state()).casts, 0); assert.equal((await state()).sequence.length, 6);
    await page.keyboard.press('e'); assert.equal(await page.locator('#castButton').isDisabled(), true);
    await page.keyboard.press('Space'); assert.equal((await state()).casts, 0);
    await page.keyboard.press('r'); await page.keyboard.press('Space');
    assert.equal((await state()).casts, 1); assert.equal((await state()).chakra, 18);
    assert.equal((await state()).projectiles[0].style, 'meteor');
    assert.deepEqual((await state()).projectiles[0].target, [0, .08, -24]);
    assert.equal((await state()).cameraView, 'meteor-sky'); assert.equal((await state()).projectiles[0].position[1], 65);
    await advance(.4); await screenshot('meteor-sky');
    const sky = await state();
    assert.equal(sky.fireArt.clouds, 1); assert.equal(sky.handsVisible, false);
    assert.ok(sky.viewRotation[0] > .2, 'Camera looks upward at the meteor');
    await page.keyboard.press('Escape'); await advance(2);
    assert.deepEqual((await state()).projectiles, sky.projectiles); assert.deepEqual((await state()).viewRotation, sky.viewRotation);
    await page.keyboard.press('Enter');
    await page.evaluate(() => document.getElementById('world').dispatchEvent(new MouseEvent('mousemove', { bubbles: true, movementX: 80, movementY: 40 })));
    assert.equal((await state()).yaw, 0); assert.equal((await state()).pitch, 0);
    await page.evaluate(() => document.getElementById('world').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })));
    await advance(.65); await screenshot('meteor-cloud-break');
    assert.ok((await state()).projectiles[0].position[1] < 42, 'Meteor passes below the cloud layer');
    assert.equal((await state()).projectiles[0].fallAge, 0); assert.equal((await state()).enemyHealth, 220);
    await advance(.55); assert.equal((await state()).cameraView, 'meteor-returning');
    const returnView = await state(); await page.keyboard.press('Escape'); await advance(1);
    assert.deepEqual((await state()).viewRotation, returnView.viewRotation); assert.deepEqual((await state()).projectiles, returnView.projectiles);
    await page.keyboard.press('Enter'); await advance(.22);
    assert.equal((await state()).cameraView, 'first-person'); assert.equal((await state()).handsVisible, true);
    assert.equal((await state()).projectiles[0].phase, 'falling');
    assert.ok((await state()).projectiles[0].fallAge < .03, 'Old fall begins only after the camera returns');
    assert.equal((await state()).position[0], -1.8); assert.equal((await state()).yaw, 0);
    await advance(1.03); await screenshot('meteor-fall');
    await page.keyboard.press('Escape'); const frozen = await state();
    await advance(2); assert.deepEqual((await state()).projectiles, frozen.projectiles);
    await page.keyboard.press('Enter'); await advance(.58);
    assert.equal((await state()).enemyHealth, 70, 'Meteor applies damage once at ground impact');
    assert.equal((await state()).projectiles.filter(s => s.style === 'meteor').length, 0); assert.equal((await state()).fireArt.meteorImpacts.length, 1);
    await advance(.3); await screenshot('meteor-impact');
    const rocks = (await state()).fireArt.meteorImpacts[0].rocks;
    assert.ok(rocks.length > 30 && rocks.some(p => p[1] > 3), 'Impact throws large and small rocks into the air');
    assert.ok((await state()).fireArt.meteorImpacts[0].dust > 0);
    await page.keyboard.press('Escape'); const impactFrozen = (await state()).fireArt.meteorImpacts; await advance(1);
    assert.deepEqual((await state()).fireArt.meteorImpacts, impactFrozen, 'Pause freezes debris and dust');
    await page.keyboard.press('Enter'); await advance(.5); await screenshot('meteor-debris');

    for (const time of [.4, 1.6]) {
      await reset(); await cast('fire-meteor'); await advance(time); await reset();
      assert.equal((await state()).cameraView, 'first-person'); assert.equal((await state()).handsVisible, true);
      assert.equal((await state()).fireArt.clouds, 0); assert.equal((await state()).fireArt.projectiles, 0);
      assert.equal((await state()).fireArt.meteorImpacts.length, 0);
    }

    await reset();
    await page.evaluate(() => document.getElementById('world').dispatchEvent(new MouseEvent('mousemove', { bubbles: true, movementX: 40, movementY: 0 })));
    await cast('fire-meteor'); await advance(3.5);
    assert.equal((await state()).enemyHealth, 70, 'The blast hits opponents away from the meteor core but inside the 5.5m radius');

    await reset();
    await page.evaluate(() => document.getElementById('world').dispatchEvent(new MouseEvent('mousemove', { bubbles: true, movementX: 240, movementY: 0 })));
    await cast('fire-meteor'); await advance(3.5);
    assert.equal((await state()).enemyHealth, 220, 'Meteor misses when aimed away from the opponent');

    await reset(); await advance(2.7); await cast('fire-barrier');
    assert.equal((await state()).shield, 75); await advance(.25);
    assert.equal((await state()).fireArt.shields, 1); await screenshot('shield');
    await advance(1.75); assert.equal((await state()).health, 220); assert.equal((await state()).shield, 32);

    await reset(); await advance(2.7); await cast('fire-reflect');
    assert.equal((await state()).shield, 0); assert.equal((await state()).reflect, 0);
    assert.equal((await state()).walls.length, 1); assert.equal((await state()).walls[0].hp, 120);
    assert.deepEqual((await state()).walls[0].position, [0, 0, 4]);
    await advance(.3); await screenshot('wall');
    await advance(1.7); assert.equal((await state()).health, 220); assert.equal((await state()).walls[0].hp, 77);
    const wallPosition = (await state()).walls[0].position;
    await page.evaluate(() => document.getElementById('world').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 })));
    await advance(.3); assert.deepEqual((await state()).walls[0].position, wallPosition, 'Wall stays where it was cast when player dodges');
    await page.keyboard.press('Escape'); const wallFrozen = (await state()).walls;
    await advance(2); assert.deepEqual((await state()).walls, wallFrozen);
    await page.keyboard.press('Enter'); await advance(2.8); assert.equal((await state()).walls.length, 0);

    await reset(); await cast('fire-volley'); await page.keyboard.press('Escape');
    const pausedSalvo = await state(); await advance(2);
    assert.equal((await state()).salvos, pausedSalvo.salvos); assert.deepEqual((await state()).projectiles, pausedSalvo.projectiles);
    await click('changeLoadout');
    assert.equal((await state()).salvos, 0); assert.equal((await state()).shots, 0); assert.equal((await state()).fireArt.projectiles, 0);
    await page.evaluate(() => {
      document.querySelector('[data-remove="fire-volley"]').click();
      document.querySelector('[data-equip="fire-orb"]').click();
    });
    await click('startButton'); await cast('fire-orb'); await advance(.25); await screenshot('orb');
    await advance(1.35); assert.equal((await state()).enemyHealth, 177);
    // The 8-seal formula must still fit the five-spell guide on phones.
    await reset();
    for (const [width, height] of [[900, 650], [390, 844], [320, 568], [640, 360]]) {
      await page.setViewportSize({ width, height }); await advance(.01); await page.keyboard.press('2');
      const fits = await page.evaluate(() => {
        const guide = document.getElementById('guide'), r = guide.getBoundingClientRect();
        return [...document.querySelectorAll('#spellList .spell, #spellList kbd, #comboSlots .combo-slot, #castButton')].every(el => {
          const b = el.getBoundingClientRect();
          const card = el.closest('#spellList .spell')?.getBoundingClientRect();
          return b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight && (!guide.contains(el) || b.left >= r.left && b.right <= r.right && b.bottom <= r.bottom) && (!card || b.right <= card.right + .5);
        }) && guide.scrollWidth <= guide.clientWidth + 1;
      });
      assert.equal(fits, true, `${width}x${height}: five spells and eight-seal formula fit`);
      await screenshot(`layout-${width}`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const preset of ['Thấp', 'Cao', 'Cân bằng']) {
      await click('qualityButton'); assert.equal((await state()).quality, preset);
      await reset(); await cast('fire-lance'); await advance(.32);
      assert.ok((await state()).fireArt.projectiles > 0);
      await screenshot(`quality-${preset}`);
      await reset(); await advance(1.8); await cast('fire-meteor'); await advance(1.05);
      assert.equal((await state()).cameraView, 'meteor-sky'); assert.equal((await state()).fireArt.clouds, 1);
      await screenshot(`meteor-cloud-${preset}`);
      await advance(2.7); assert.equal((await state()).cameraView, 'first-person'); assert.equal((await state()).enemyHealth, 70);
      assert.ok((await state()).fireArt.meteorImpacts[0].rocks.length > 30);
      await screenshot(`meteor-impact-${preset}`);
    }
    assert.deepEqual(errors, []);
    console.log('PASS fire: six arts and exact seal counts; five-spell loadout; staggered salvo and damage; dragon; meteor sky camera, cloud penetration, return before old fall, debris/dust, hit/miss, pause/reset and all graphics tiers; flame shield; physical wall; responsive guide; no browser/shader errors.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
