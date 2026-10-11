const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');

(async () => {
  await fs.mkdir('test-results/hand-vfx', { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('file:///' + path.join(process.cwd(), 'index.html').replaceAll('\\', '/') + '?test=1');
    await page.waitForFunction(() => document.body.dataset.ready === 'true', null, { timeout: 60000 });
    const state = () => page.evaluate(() => window.__AN_HOA__.state());
    const advance = seconds => page.evaluate(s => window.__AN_HOA__.advance(s), seconds);
    const click = id => page.evaluate(id => document.getElementById(id).click(), id);
    const clear = () => page.keyboard.press('Backspace');
    const seal = async id => {
      const keys = await page.evaluate(id => SealGameCore.spells.find(s => s.id === id).sequence, id);
      for (const key of keys) await page.keyboard.press(key);
    };
    await click('startButton');
    const keys = 'qwerasdfzxcv', cells = [0, 1, 2, 4, 5, 6, 15, 9, 10, 11, 13, 8];
    for (let i = 0; i < keys.length; i++) {
      await clear(); await page.keyboard.press(keys[i]);
      assert.equal((await state()).sealShadow.visible, true);
      assert.equal((await state()).sealShadow.cell, cells[i]);
      await advance(.1);
      assert.equal((await state()).sealShadow.visible, true);
      await page.screenshot({ path: `test-results/hand-vfx/shadow-${keys[i]}.png` });
      await advance(.1);
      assert.equal((await state()).sealShadow.visible, false);
    }
    await clear(); await page.keyboard.press('q'); await advance(.14); await page.keyboard.press('w');
    assert.equal((await state()).sealShadow.cell, 1);
    assert.equal((await state()).handFlames, true);
    await advance(.19); assert.equal((await state()).sealShadow.visible, true);
    await advance(.12); assert.equal((await state()).sealShadow.visible, false);
    await page.screenshot({ path: 'test-results/hand-vfx/fire-ready.png' });
    const flamePosition = (await state()).handFlamePosition;
    await advance(.4);
    await page.screenshot({ path: 'test-results/hand-vfx/fire-ready-animated.png' });
    await page.keyboard.press('Escape');
    assert.equal((await state()).handFlames, false, 'Pause disables Space readiness');
    const pausedShadow = (await state()).sealShadow;
    await advance(.5); assert.deepEqual((await state()).sealShadow, pausedShadow);
    await page.keyboard.press('Enter'); assert.equal((await state()).handFlames, true);
    await page.keyboard.press('Space'); assert.equal((await state()).handFlames, false);
    assert.equal((await state()).sealShadow.visible, false);
    await seal('fire-orb');
    assert.equal((await state()).handFlames, false, 'Cooldown prevents ready flames');
    await advance(1.05); assert.equal((await state()).handFlames, true);
    await clear(); assert.equal((await state()).handFlames, false);
    await seal('water-lance'); await advance(.32);
    assert.equal((await state()).handFlames, false, 'Water keeps its existing effect');
    await clear(); await seal('fire-orb'); await page.keyboard.press('Escape'); await click('resetButton');
    assert.equal((await state()).handFlames, false); assert.equal((await state()).sealShadow.visible, false);
    await page.keyboard.press('Escape'); await click('changeLoadout'); await click('presetFire'); await click('startButton');
    await seal('fire-meteor'); await advance(.32);
    assert.equal((await state()).handFlames, true);
    await page.screenshot({ path: 'test-results/hand-vfx/fire-meteor-ready.png' });
    await click('qualityButton'); await click('qualityButton'); await advance(.1);
    assert.equal((await state()).handFlames, true);
    await page.screenshot({ path: 'test-results/hand-vfx/fire-ready-low.png' });
    await page.keyboard.press('Space'); await seal('fire-meteor');
    await advance(1.05);
    assert.equal(await page.locator('#castButton').isDisabled(), true, 'Meteor depleted chakra');
    assert.equal((await state()).handFlames, false, 'Insufficient chakra prevents flames');
    await advance(5.5);
    assert.equal(await page.locator('#castButton').isEnabled(), true);
    assert.equal((await state()).handFlames, true, 'Regenerated chakra restores flames');
    assert.deepEqual(errors, []);
    await fs.writeFile('test-results/hand-vfx/verification.json', JSON.stringify({ passed: true, cells, flamePosition, errors }, null, 2));
    console.log('PASS: all twelve offline shadows, .2s timing, retriggering, flame readiness, animation, pause/resume, cast, cooldown, chakra, non-fire, reset and low graphics.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
