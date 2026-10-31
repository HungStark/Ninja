const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
(async () => {
  const child = spawn(process.execPath, ["server.cjs"], { cwd: process.cwd(), env: { ...process.env, PORT: "4319" }, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  try {
    await new Promise((resolve, reject) => {
      child.stdout.once("data", resolve);
      child.once("error", reject);
      child.once("exit", (code) => reject(Error("server exit " + code)));
    });
    for (const [url, type] of [["/index.en.html", "text/html"], ["/game.en.js", "text/javascript"], ["/game-core.en.js", "text/javascript"], ["/language-loader.js", "text/javascript"], ["/", "text/html"], ["/game.js", "text/javascript"], ["/adventure.css", "text/css"], ["/android.css", "text/css"], ["/assets/ninja-hands.glb", "model/gltf-binary"]]) {
      const res = await fetch("http://127.0.0.1:4319" + url);
      assert.equal(res.status, 200);
      assert.ok(res.headers.get("content-type").includes(type));
      assert.ok((await res.arrayBuffer()).byteLength > 0);
    }
    for (const url of ["/.git/config", "/package-lock.json", "/src/main.js", "/%2e%2e/server.cjs"]) assert.equal((await fetch("http://127.0.0.1:4319" + url)).status, 404);
    const {PORTRAIT_IMAGES}=await import('../src/portrait-images.js');const portrait=await fetch('http://127.0.0.1:4319/assets/portraits/'+Object.values(PORTRAIT_IMAGES)[0]);assert.equal(portrait.status,200);assert.match(portrait.headers.get('content-type'),/image\/webp/);assert.match(portrait.headers.get('cache-control'),/immutable/);assert.equal((await fetch('http://127.0.0.1:4319/assets/portraits/report.json')).status,404);
    console.log("PASS: local server assets, MIME types and source/metadata isolation.");
  } finally {
    child.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
