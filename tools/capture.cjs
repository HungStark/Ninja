const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");
(async () => {
  await fs.mkdir("test-results", { recursive: true });
  const browser = await chromium.launch({ executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("file:///" + path.join(process.cwd(), "index.html").replaceAll("\\", "/") + "?test=1");
  await page.waitForFunction(() => document.body.dataset.ready === "true", { timeout: 6e4 }).catch(() => {
  });
  console.log("State:", await page.evaluate(() => window.__AN_HOA__?.state()));
  await page.screenshot({ path: "test-results/start.png" });
  await page.keyboard.press("Enter");
  await page.evaluate(() => window.__AN_HOA__?.advance?.(0.3));
  await page.screenshot({ path: "test-results/play.png" });
  const sequence = await page.evaluate(() => SealGameCore.spells.find(s => s.id === window.__AN_HOA__.state().equipped[0]).sequence);
  for (const k of sequence) await page.keyboard.press(k);
  await page.evaluate(() => window.__AN_HOA__?.advance?.(0.4));
  await page.screenshot({ path: "test-results/seal.png" });
  await page.keyboard.press("Space");
  await page.evaluate(() => window.__AN_HOA__?.advance?.(0.2));
  await page.screenshot({ path: "test-results/fire.png" });
  console.log("Errors:", JSON.stringify(errors, null, 2));
  console.log("End:", await page.evaluate(() => window.__AN_HOA__?.state()));
  await browser.close();
  if (errors.length) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
