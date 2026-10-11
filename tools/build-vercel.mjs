import "./build.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
const files = [
  "index.html",
  "style.css",
  "game-core.js",
  "game.js",
  "ket_an.jpg",
  "assets/ninja-hands.glb",
  "THIRD_PARTY_NOTICES.md",
];

await fs.mkdir(path.join(output, "assets"), { recursive: true });
await Promise.all(files.map(file => fs.copyFile(path.join(root, file), path.join(output, file))));
console.log(`Prepared ${files.length} static files for Vercel in dist/`);
