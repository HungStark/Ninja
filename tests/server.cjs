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
    for (const [url, type] of [["/index.en.html", "text/html"], ["/game.en.js", "text/javascript"], ["/game-core.en.js", "text/javascript"], ["/language-loader.js", "text/javascript"], ["/", "text/html"], ["/game.js", "text/javascript"], ["/adventure.css", "text/css"], ["/android.css", "text/css"], ["/assets/ninja-hands.glb", "model/gltf-binary"], ["/assets/hero-ninja-reference.glb", "model/gltf-binary"]]) {
      const res = await fetch("http://127.0.0.1:4319" + url);
      assert.equal(res.status, 200);
      assert.ok(res.headers.get("content-type").includes(type));
      assert.ok((await res.arrayBuffer()).byteLength > 0);
    }
    for (const url of ["/.git/config", "/package-lock.json", "/src/main.js", "/%2e%2e/server.cjs"]) assert.equal((await fetch("http://127.0.0.1:4319" + url)).status, 404);
    for(const id of ['nameless','water','fire','lightning','wind','earth','wood','ice','light','dark']){const music=await fetch('http://127.0.0.1:4319/assets/music/'+id+'.wav');assert.equal(music.status,200,id);assert.match(music.headers.get('content-type'),/audio\/wav/);const header=new DataView(await music.arrayBuffer());assert.equal(header.getUint32(0,false),0x52494646);}
    assert.equal((await fetch('http://127.0.0.1:4319/assets/music/scores.json')).status,404);
    const {SPELL_ART_FILES}=await import('../src/spell-icon-manifest.js');for(const file of Object.values(SPELL_ART_FILES)){const icon=await fetch('http://127.0.0.1:4319/'+file);assert.equal(icon.status,200,file);assert.match(icon.headers.get('content-type'),/image\/png/);assert.ok((await icon.arrayBuffer()).byteLength>1000);}
    assert.equal((await fetch('http://127.0.0.1:4319/assets/ui/spells-v2.prompt.md')).status,404);
    const {PORTRAIT_IMAGES}=await import('../src/portrait-images.js');const portrait=await fetch('http://127.0.0.1:4319/assets/portraits/'+Object.values(PORTRAIT_IMAGES)[0]);assert.equal(portrait.status,200);assert.match(portrait.headers.get('content-type'),/image\/webp/);assert.match(portrait.headers.get('cache-control'),/immutable/);assert.equal((await fetch('http://127.0.0.1:4319/assets/portraits/report.json')).status,404);
    console.log("PASS: local server assets, MIME types and source/metadata isolation.");
  } finally {
    child.kill();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
