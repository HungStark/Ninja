import { build } from "esbuild";
import fs from "node:fs/promises";
await build({ entryPoints: ["src/main.js"], bundle: true, outfile: "game.js", format: "iife", target: "es2020", minify: true, legalComments: "eof" });
console.log("Built offline browser bundle: " + (await fs.stat("game.js")).size + " bytes");
