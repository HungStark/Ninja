const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  await fs.mkdir('test-results/meteor-zoom', { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 720 } }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    const open = async () => {
      await page.goto('file:///' + path.join(process.cwd(), 'index.html').replaceAll('\\', '/') + '?test=1');
      await page.waitForFunction(() => document.body.dataset.ready === 'true', null, { timeout: 60000 });
      await click('soundButton'); await click('presetFire'); await click('startButton');
    };
    const click = id => page.evaluate(id => document.getElementById(id).click(), id);
    const advance = t => page.evaluate(t => window.__AN_HOA__.advance(t), t);
    const state = () => page.evaluate(() => window.__AN_HOA__.state());
    const cast = async (id = 'fire-meteor') => {
      const sequence = await page.evaluate(id => SealGameCore.spells.find(s => s.id === id).sequence, id);
      for (const key of sequence) await page.keyboard.press(key);
      await page.keyboard.press('Space');
    };
    const reset = async () => { await page.keyboard.press('Escape'); await click('resetButton'); };
    await open();
    assert.equal((await state()).viewFov, 68);
    await cast(); assert.equal((await state()).viewFov, 68);
    await advance(.12); const approach = await state();
    assert.ok(approach.viewFov < 68 && approach.viewFov > 54);
    await advance(.12); const close = await state();
    assert.ok(Math.abs(close.viewFov - 54) < 1e-8, 'Appearance reaches the close-up');
    assert.equal(close.cameraView, 'meteor-sky');
    await page.screenshot({ path: 'test-results/meteor-zoom/zoom-in.png' });
    await page.keyboard.press('Escape'); await advance(2);
    assert.equal((await state()).viewFov, close.viewFov, 'Pause freezes the exact zoom');
    assert.deepEqual((await state()).viewRotation, close.viewRotation);
    await page.keyboard.press('Enter');
    await page.setViewportSize({ width: 900, height: 650 }); await advance(0);
    assert.equal((await state()).viewFov, close.viewFov, 'Resize preserves zoom');
    await click('qualityButton'); await advance(0);
    assert.equal((await state()).viewFov, close.viewFov, 'Quality changes preserve zoom');
    await advance(.56); const widening = await state();
    assert.ok(widening.viewFov > close.viewFov && widening.viewFov < 68);
    await page.screenshot({ path: 'test-results/meteor-zoom/zoom-out.png' });
    await advance(.4); const wide = await state();
    assert.ok(wide.viewFov > widening.viewFov && wide.viewFov < 68, 'Zoom out remains gradual');
    await advance(.25); assert.equal((await state()).viewFov, 68);
    assert.equal((await state()).cameraView, 'meteor-returning');
    await advance(.4); const returned = await state();
    assert.equal(returned.cameraView, 'first-person'); assert.equal(returned.viewFov, 68);
    assert.equal(returned.yaw, 0); assert.equal(returned.pitch, 0); assert.equal(returned.handsVisible, true);
    for (const time of [.12, .8, 1.5]) {
      await reset(); await cast(); await advance(time); await reset();
      assert.equal((await state()).viewFov, 68, 'Reset clears zoom in every phase');
    }
    await cast(); await advance(.24); await page.keyboard.press('Escape'); await click('changeLoadout');
    assert.equal((await state()).viewFov, 68, 'Returning to the scroll clears zoom');
    await click('startButton'); await cast('fire-volley'); await advance(.2);
    assert.ok((await state()).viewFov > 64 && (await state()).viewFov < 68, 'Volley has its own small charge zoom');
    await page.emulateMedia({ reducedMotion: 'reduce' }); await open(); await cast();
    for (const time of [.24, .6, .6, .4]) { await advance(time); assert.equal((await state()).viewFov, 68, 'Reduced motion suppresses zoom'); }
    assert.deepEqual(errors, []);
    await fs.writeFile('test-results/meteor-zoom/verification.json', JSON.stringify({ passed: true, approach: approach.viewFov, close: close.viewFov, widening: widening.viewFov, wide: wide.viewFov, returned: returned.viewFov, errors }, null, 2));
    console.log('PASS: meteor zoom in/out, pause, resize, quality, aim restoration, reset in every phase, scroll, other spells and reduced motion.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
