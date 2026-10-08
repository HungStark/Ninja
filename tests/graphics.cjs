const fs = require("node:fs/promises"), path = require("node:path"), assert = require("node:assert/strict");
const { chromium } = require("playwright");
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } }), errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto("file:///" + path.join(process.cwd(), "index.html").replaceAll("\\", "/") + "?test=1");
    await page.waitForFunction(() => document.body.dataset.ready === "true", null, { timeout: 6e4 });
    await page.keyboard.press("Enter");
    const colors = [];
    for (let i = 0; i < 4; i++) {
      const sample = await page.evaluate(() => {
        window.__AN_HOA__.advance(0.3);
        const c = document.getElementById("world"), gl = c.getContext("webgl2"), p = new Uint8Array(4);
        gl.readPixels(Math.floor(gl.drawingBufferWidth * 0.5), Math.floor(gl.drawingBufferHeight * 0.22), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p);
        return { quality: window.__AN_HOA__.state().quality, pixel: [...p] };
      });
      assert.ok(sample.pixel[0] > sample.pixel[2] + 10, "Stone path must remain rendered in " + sample.quality + ": " + sample.pixel);
      colors.push(sample);
      await page.screenshot({ path: "test-results/graphics-" + i + ".png" });
      await page.evaluate(() => document.getElementById("qualityButton").click());
    }
    for (const k of ["e", "f", "x"]) {
      await page.keyboard.press("Backspace");
      await page.keyboard.press(k);
      await page.evaluate(() => window.__AN_HOA__.advance(0.5));
      await page.screenshot({ path: "test-results/seals/" + k + ".png" });
    }
    await page.keyboard.press("Backspace");
    await page.evaluate(() => window.__AN_HOA__.advance(0.4));
    await page.setViewportSize({ width: 900, height: 650 });
    await page.evaluate(() => window.__AN_HOA__.advance(0.2));
    await page.screenshot({ path: "test-results/compact.png" });
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.evaluate(() => window.__AN_HOA__.advance(0.3));
    await page.screenshot({ path: "test-results/final.png" });
    assert.deepEqual(errors, []);
    console.log("PASS graphics:", JSON.stringify(colors));
    await fs.writeFile("test-results/graphics-verification.json", JSON.stringify({ passed: true, qualityPixels: colors, errors }, null, 2));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
