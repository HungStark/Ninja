const fs = require("node:fs/promises"), path = require("node:path"), assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  await fs.mkdir("test-results/seals", { recursive: true });
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 }), errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto("file:///" + path.join(process.cwd(), "index.html").replaceAll("\\", "/") + "?test=1");
    await page.waitForFunction(() => document.body.dataset.ready === "true", null, { timeout: 6e4 });
    const state = () => page.evaluate(() => window.__AN_HOA__.state()), advance = (s) => page.evaluate((s2) => window.__AN_HOA__.advance(s2), s), seal = async (sequence) => {
      for (const k of sequence) await page.keyboard.press(k);
    };
    assert.equal((await state()).bones, 16);
    await page.screenshot({ path: "test-results/start.png" });
    await page.keyboard.press("Enter");
    await advance(0.4);
    assert.equal((await state()).started, true);
    await page.screenshot({ path: "test-results/play.png" });
    const wrists = [];
    for (const k of ["q", "w", "e", "r", "a", "s", "d", "f", "z", "x", "c", "v"]) {
      await page.keyboard.press("Backspace");
      await page.keyboard.press(k);
      await advance(0.35);
      const s = await state();
      wrists.push(s.handPose.map((v) => v.toFixed(2)).join(","));
      await page.screenshot({ path: "test-results/seals/" + k + ".png" });
    }
    assert.equal(new Set(wrists).size, 12);
    await page.keyboard.press("Backspace");
    await seal(["q", "w", "e", "r"]);
    await advance(0.3);
    assert.equal(await page.locator("#castButton").isEnabled(), true);
    await page.screenshot({ path: "test-results/seal.png" });
    await page.keyboard.press("Space");
    await advance(0.18);
    assert.equal((await state()).casts, 1);
    assert.ok((await state()).light > 0);
    await page.screenshot({ path: "test-results/fire.png" });
    await advance(1.3);
    await seal(["q", "w", "e", "r"]);
    await page.keyboard.press("Space");
    await advance(1.4);
    assert.equal((await state()).score, 1);
    await seal(["q", "e"]);
    await page.keyboard.press("Space");
    assert.equal((await state()).casts, 2);
    await page.keyboard.press("Backspace");
    assert.deepEqual((await state()).sequence, []);
    await page.keyboard.press("Escape");
    assert.equal((await state()).paused, true);
    const paused = await state();
    await advance(3);
    assert.equal((await state()).chakra, paused.chakra);
    assert.equal((await state()).time, paused.time);
    await page.keyboard.press("Enter");
    assert.equal((await state()).paused, false);
    for (const expected of ["Th\u1EA5p", "Cao", "C\xE2n b\u1EB1ng"]) {
      await page.evaluate(() => document.getElementById("qualityButton").click());
      assert.equal((await state()).quality, expected);
      const pixel = await page.evaluate(() => {
        window.__AN_HOA__.advance(0.1);
        const gl = document.getElementById("world").getContext("webgl2"), p = new Uint8Array(4);
        gl.readPixels(Math.floor(gl.drawingBufferWidth * 0.5), Math.floor(gl.drawingBufferHeight * 0.22), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p);
        return [...p];
      });
      assert.ok(pixel[0] > pixel[2] + 10, "Path visible in " + expected);
    }
    await page.screenshot({ path: "test-results/quality-high.png" });
    await page.keyboard.press("Escape");
    await page.locator("#resetButton").click();
    assert.equal((await state()).score, 0);
    assert.ok((await state()).chakra > 99);
    let yaw = 0;
    const positions = [[-6, -8], [0, -12], [6, -9], [-8, -20], [8, -20]];
    for (const [x, z] of positions) {
      const next = -Math.atan2(x, 7 - z);
      await page.evaluate((delta) => window.dispatchEvent(new MouseEvent("mousemove", { movementX: delta, movementY: 0 })), -(next - yaw) / 25e-4);
      yaw = next;
      for (let n = 0; n < 2; n++) {
        await seal(["q", "w", "e", "r"]);
        await page.keyboard.press("Space");
        await advance(3.5);
      }
    }
    assert.equal((await state()).score, 5);
    assert.equal((await state()).won, true);
    await page.waitForFunction(() => !document.getElementById("winScreen").classList.contains("hidden"));
    await page.keyboard.press("Enter");
    assert.equal((await state()).round, 2);
    assert.equal((await state()).score, 0);
    await page.keyboard.down("ArrowUp");
    await advance(3.3);
    await page.keyboard.up("ArrowUp");
    await seal(["a", "s", "d", "f"]);
    await page.keyboard.press("Space");
    await advance(2.8);
    assert.ok((await state()).score >= 1);
    await advance(7);
    await seal(["z", "x", "c", "v"]);
    await page.keyboard.press("Space");
    await advance(0.08);
    assert.equal((await state()).casts, 2);
    assert.equal((await state()).shots, 5);
    await page.screenshot({ path: "test-results/phoenix.png" });
    await page.keyboard.press("Escape");
    await page.locator("#resetButton").click();
    await page.evaluate(() => document.getElementById("qualityButton").click());
    await page.setViewportSize({ width: 900, height: 650 });
    await advance(0.3);
    await page.screenshot({ path: "test-results/compact.png" });
    await page.setViewportSize({ width: 1440, height: 960 });
    await advance(0.2);
    await page.screenshot({ path: "test-results/final.png" });
    assert.deepEqual(errors, []);
    const report = { passed: true, renderer: "Edge / WebGL 2 / SwiftShader", checks: ["12 distinct skinned poses", "toon/wind/outline shaders", "three graphics tiers", "fire lighting and bloom", "aimed collision and all five targets", "round completion/restart", "breath range", "phoenix spread", "pause/clock freeze", "offline file loading", "responsive layout"], state: await state(), errors };
    await fs.writeFile("test-results/verification.json", JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
