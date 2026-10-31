import {pruneUnusedBuildAssets} from './prune-unused-build-assets.mjs';
import "./build.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
const files = [
  "index.html",
  "index.en.html",
  "language-loader.js",
  "game.en.js",
  "game-core.en.js",
  "style.css",
  "adventure.css",
  "android.css",
  "game-core.js",
  "game.js",
  "ket_an.jpg",
  "assets/ninja-hands.glb",
  "assets/ha-ly-simple.glb",
  "assets/hero-ninja-simple.glb",
  "assets/village-ninja.glb",
  "assets/npc_nam-simple.vrm",
  "assets/npc_nu-simple.vrm",
  "THIRD_PARTY_NOTICES.md",
];

await fs.mkdir(path.join(output, "assets"), { recursive: true });
await Promise.all(files.map(file => fs.copyFile(path.join(root, file), path.join(output, file))));
await fs.cp(path.join(root,'assets','portraits'),path.join(output,'assets','portraits'),{recursive:true});
console.log(`Prepared ${files.length} static files for Vercel in dist/`);

// AAPT transparently expands .gz assets; use .tgz and remove old generated names.
for(const name of ['source.tar.gz','wrapper-source.tar.gz'])await fs.unlink(path.join(output,'vendor/espeak-ng',name)).catch(e=>{if(e.code!=='ENOENT')throw e;});
await fs.cp(path.join(root,'vendor/espeak-ng'),path.join(output,'vendor/espeak-ng'),{recursive:true});

await pruneUnusedBuildAssets(output);
