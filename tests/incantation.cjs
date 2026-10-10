const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');

(async () => {
  await fs.mkdir('test-results', { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // Control speech completion independently of simulation time, as real voices do.
    await page.addInitScript(() => {
      window.__speech = { calls: [], mode: 'pending', utterance: null, pauses: 0, resumes: 0, cancels: 0 };
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: class {
        constructor(text) { this.text = text; }
      } });
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
        getVoices: () => [{ name: 'English', lang: 'en-US' }, { name: 'Vietnamese', lang: 'vi-VN' }],
        speak(u) {
          const s = window.__speech;
          s.calls.push({ text: u.text, lang: u.lang, voice: u.voice?.lang }); s.utterance = u;
          if (s.mode === 'error') u.onerror?.({ error: 'voice-unavailable' });
          if (s.mode === 'throw') throw Error('Speech service unavailable');
          if (s.mode === 'end') u.onend?.();
        },
        cancel() { window.__speech.cancels++; },
        pause() { window.__speech.pauses++; },
        resume() { window.__speech.resumes++; }
      } });
    });
    await page.goto('file:///' + path.join(process.cwd(), 'index.html').replaceAll('\\', '/') + '?test=1');
    await page.waitForFunction(() => document.body.dataset.ready === 'true', null, { timeout: 60000 });
    const state = () => page.evaluate(() => window.__AN_HOA__.state());
    const advance = s => page.evaluate(s => window.__AN_HOA__.advance(s), s);
    const click = id => page.evaluate(id => document.getElementById(id).click(), id);
    const speech = () => page.evaluate(() => ({ ...window.__speech, utterance: null }));
    const mode = value => page.evaluate(value => { window.__speech.mode = value; }, value);
    const reset = async () => { await page.keyboard.press('Escape'); await click('resetButton'); };
    const cast = async id => {
      const sequence = await page.evaluate(id => SealGameCore.spells.find(s => s.id === id).sequence, id);
      for (const key of sequence) await page.keyboard.press(key);
      await page.keyboard.press('Space');
    };
    await click('startButton');
    assert.equal(await page.locator('#spellList .spell').count(), 5);
    assert.equal(await page.locator('#spellList p, #spellList small, #spellList .spell-icon').count(), 0);
    assert.equal(await page.locator('#spellList .spell-title').first().textContent(), 'Hỏa cầu');
    assert.deepEqual(await page.locator('#spellList .spell').first().locator('kbd').allTextContents(), ['Q', 'W']);
    await page.screenshot({ path: 'test-results/compact-carried-scroll.png' });

    await cast('fire-orb');
    assert.equal((await state()).casting, 'fire-orb');
    assert.equal((await state()).casts, 0); assert.equal((await state()).shots, 0);
    assert.equal((await state()).chakra, 100);
    assert.equal(await page.locator('#castButton').isDisabled(), true);
    assert.deepEqual((await speech()).calls, [{ text: 'Hỏa cầu!', lang: 'vi-VN', voice: 'vi-VN' }]);
    const sequence = (await state()).sequence, pose = (await state()).activePose;
    await page.keyboard.press('Space'); await page.keyboard.press('Backspace'); await page.keyboard.press('d');
    await page.evaluate(() => document.querySelector('[data-spell="1"]').click());
    assert.equal((await speech()).calls.length, 1);
    assert.deepEqual((await state()).sequence, sequence); assert.equal((await state()).activePose, pose);
    await advance(1.3); assert.equal((await state()).casts, 0, 'Wait for speech completion');
    await page.screenshot({ path: 'test-results/incantation.png' });
    await page.evaluate(() => window.__speech.utterance.onend()); await advance(.02);
    assert.equal((await state()).casts, 1); assert.equal((await state()).casting, null);
    assert.equal((await state()).projectiles[0].element, 'fire');
    assert.ok((await state()).chakra < 73); assert.equal((await state()).sequence.length, 0);

    await reset(); await mode('end'); await cast('fire-orb'); await advance(.4);
    assert.equal((await state()).casts, 0, 'Even a short voice has a one-second windup');
    await page.keyboard.press('Escape'); const frozen = await state(), pauseCount = (await speech()).pauses;
    await advance(3); assert.equal((await state()).castElapsed, frozen.castElapsed);
    assert.equal((await state()).casts, 0); assert.ok(pauseCount > 0);
    await page.keyboard.press('Enter'); await advance(.6); assert.equal((await state()).casts, 1);

    await reset(); await mode('pending'); await cast('fire-orb');
    await page.evaluate(() => { window.__oldSpeechEnd = window.__speech.utterance.onend; });
    await reset(); assert.equal((await state()).casting, null);
    await cast('water-lance'); await page.evaluate(() => window.__oldSpeechEnd()); await advance(1.2);
    assert.equal((await state()).casts, 0, 'An old speech callback cannot finish a new spell');
    await page.keyboard.press('Escape'); await click('changeLoadout'); await advance(6);
    assert.equal((await state()).casting, null); assert.equal((await state()).shots, 0);
    await click('startButton');

    for (const value of ['error', 'throw']) {
      await reset(); await mode(value); await cast('fire-orb'); await advance(1);
      assert.equal((await state()).casts, 1, value + ' falls back to the minimum delay');
    }
    await reset(); await mode('pending'); await cast('fire-orb'); await advance(4.9);
    assert.equal((await state()).casts, 0); await advance(.1);
    assert.equal((await state()).casts, 1, 'Stalled speech times out without blocking controls');

    await reset(); await mode('pending'); await cast('fire-orb'); const calls = (await speech()).calls.length;
    await click('soundButton'); await advance(1); assert.equal((await state()).casts, 1);
    await reset(); await cast('fire-orb'); await advance(.9); assert.equal((await state()).casts, 0);
    await advance(.1); assert.equal((await state()).casts, 1); assert.equal((await speech()).calls.length, calls);
    await click('soundButton');

    await reset(); await mode('pending'); await cast('earth-barrier'); await advance(1.2);
    assert.equal((await state()).shield, 0, 'Defense also waits for the spoken name');
    await page.evaluate(() => window.__speech.utterance.onend()); await advance(.02);
    assert.equal((await state()).shield, 78); assert.equal((await state()).casts, 1);

    await reset(); await mode('end'); await page.keyboard.press('q'); await page.keyboard.press('w');
    await advance(6.9); await page.keyboard.press('Space'); await advance(1);
    assert.equal((await state()).casts, 1, 'A confirmed sequence stays valid during the windup');

    await reset(); await page.evaluate(() => Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined }));
    await cast('fire-orb'); await advance(1); assert.equal((await state()).casts, 1);
    await reset(); await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.locator('#spellList .spell-title').first().isVisible(), true);
    await page.screenshot({ path: 'test-results/mobile-carried-scroll.png' });
    assert.deepEqual(errors, []);
    console.log('PASS: compact carried scroll; Vietnamese speech before attack/defense; minimum delay; duplicate input blocked; pause/resume; reset/reselect and stale callbacks; mute; speech errors, missing API and timeout; sequence retention.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
