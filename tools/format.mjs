import fs from "node:fs/promises";
import path from "node:path";
import { transform } from "esbuild";
for (const dir of ["src", "tools", "tests"]) for (const name of await fs.readdir(dir)) {
  if (!/\.(js|mjs|cjs)$/.test(name)) continue;
  const file = path.join(dir, name), source = await fs.readFile(file, "utf8"), result = await transform(source, { loader: "js", target: "esnext", minify: false, legalComments: "inline" });
  await fs.writeFile(file, result.code);
}
console.log("Formatted source, build tools and tests.");
