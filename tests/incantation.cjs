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
    await page.addInitScript(() => {
      window.__speech = { calls: [], mode: 'pending', utterance: null, pauses: 0, resumes: 0, cancels: 0 };
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: class {
        constructor(text) { this.text = text; }
      } });
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
        getVoices: () => [{ lang: 'en-US' }, { lang: 'vi-VN' }],
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
    const seal = async id => {
      const sequence = await page.evaluate(id => SealGameCore.spells.find(s => s.id === id).sequence, id);
      for (const key of sequence) await page.keyboard.press(key);
    };
    const cast = async id => { await seal(id); await page.keyboard.press('Space'); };
    await click('startButton');
    assert.equal(await page.locator('#spellList .spell').count(), 5);
    assert.equal(await page.locator('#spellList p, #spellList small, #spellList .spell-icon').count(), 0);
    assert.equal(await page.locator('#spellList .spell-title').first().textContent(), 'Hỏa cầu');
    assert.deepEqual(await page.locator('#spellList .spell').first().locator('kbd').allTextContents(), ['Q', 'W']);
    assert.equal(await page.locator('.seal-dock').isVisible(), false);

    await cast('fire-orb');
    assert.equal((await state()).casts, 1, 'Launch in the Space event, without advancing time or completing speech');
    assert.equal((await state()).shots, 1); assert.equal((await state()).chakra, 72);
    assert.equal((await state()).casting, null);
    assert.equal((await state()).projectiles[0].element, 'fire');
    assert.deepEqual((await speech()).calls, [{ text: 'Hỏa cầu!', lang: 'vi-VN', voice: 'vi-VN' }]);
    await page.keyboard.press('Space');
    assert.equal((await state()).casts, 1, 'Duplicate Space cannot launch twice');
    assert.equal((await speech()).calls.length, 1);
    await seal('water-lance');
    assert.equal((await state()).sequence.length, 5, 'Allow the next seals while the voice is still speaking');
    await page.keyboard.press('Space'); assert.equal((await state()).casts, 1, 'Keep the existing cooldown');
    await advance(1); await page.keyboard.press('Space');
    assert.equal((await state()).casts, 2, 'A stalled voice cannot block another cast');
    assert.equal((await speech()).calls.at(-1).text, 'Thủy ngục!');

    await page.keyboard.press('Escape'); const frozen = await state();
    assert.ok((await speech()).pauses > 0);
    await advance(3); assert.equal((await state()).battleTime, frozen.battleTime);
    await page.keyboard.press('Enter'); assert.ok((await speech()).resumes > 1);
    await reset(); await mode('pending'); await cast('fire-orb');
    await page.evaluate(() => { window.__oldSpeechEnd = window.__speech.utterance.onend; });
    await reset(); await cast('water-lance');
    await page.evaluate(() => window.__oldSpeechEnd());
    const cancelCount = (await speech()).cancels;
    await click('soundButton'); assert.ok((await speech()).cancels > cancelCount, 'Stale callbacks cannot clear a newer voice');
    await reset(); const calls = (await speech()).calls.length;
    await cast('fire-orb'); assert.equal((await state()).casts, 1); assert.equal((await speech()).calls.length, calls);
    await click('soundButton');

    for (const value of ['error', 'throw', 'end', 'pending']) {
      await reset(); await mode(value); await cast('fire-orb');
      assert.equal((await state()).casts, 1, value + ': cast immediately regardless of speech service state');
      assert.equal((await state()).shots, 1);
    }
    await reset(); await mode('pending'); await cast('earth-barrier');
    assert.equal((await state()).shield, 78, 'Defense takes effect immediately too');
    assert.equal((await state()).chakra, 74);
    assert.equal((await speech()).calls.at(-1).text, 'Thổ thành!');
    await page.keyboard.press('Escape'); await click('changeLoadout');
    assert.equal((await state()).shots, 0);
    await click('startButton');
    await reset(); await page.evaluate(() => Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined }));
    await cast('fire-orb'); assert.equal((await state()).casts, 1);
    await reset();
    // Include the eight-seal meteor to exercise the widest fire formula.
    await page.keyboard.press('Escape'); await click('changeLoadout'); await click('clearLoadout');
    await page.evaluate(() => {
      for (const id of ['fire-meteor', 'water-volley', 'lightning-volley', 'earth-reflect', 'ice-reflect']) {
        document.querySelector('[data-equip="' + id + '"]').click();
      }
    });
    await click('startButton');
    for (const [width, height] of [[1440, 960], [1280, 720], [900, 650], [640, 650], [390, 844], [320, 568], [900, 450], [640, 360]]) {
      await page.setViewportSize({ width, height });
      await advance(0);
      const layout = await page.evaluate(() => {
        const guide = document.getElementById('guide'), rect = guide.getBoundingClientRect();
        const contained = el => {
          const r = el.getBoundingClientRect();
          return r.left >= rect.left && r.right <= rect.right && r.top >= rect.top && r.bottom <= rect.bottom && r.bottom <= innerHeight && r.top >= 0;
        };
        const action = document.querySelector('.center-status').getBoundingClientRect();
        const overlapsAction = action.left < rect.right && action.right > rect.left && action.top < rect.bottom && action.bottom > rect.top;
        return { count: document.querySelectorAll('#spellList .spell').length, overlapsAction,
          allVisible: [...document.querySelectorAll('#spellList .spell, #spellList .spell-title, #spellList kbd')].every(contained),
          noScroll: guide.scrollHeight <= guide.clientHeight + 1 && guide.scrollWidth <= guide.clientWidth + 1 };
      });
      assert.equal(layout.count, 5);
      assert.equal(layout.allVisible, true, `${width}x${height}: all five spell names and every key are visible`);
      assert.equal(layout.noScroll, true, `${width}x${height}: no scroll required`);
      assert.equal(layout.overlapsAction, false, `${width}x${height}: the action panel cannot cover carried spells`);
      assert.equal(await page.locator('.seal-dock').isVisible(), false);
      await page.screenshot({ path: `test-results/carried-scroll-${width}x${height}.png` });
    }
    assert.deepEqual(errors, []);
    console.log('PASS: simultaneous Vietnamese speech and attack/defense; immediate chakra cost; cooldown; next seals during speech; pause/resume; stale callbacks; mute/errors/missing speech; five spells and keys visible at eight viewport sizes; hidden hand-seal banner.');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
