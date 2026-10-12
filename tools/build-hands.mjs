import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const portableRoot = path.join(root, '.tools');
const portable = fs.existsSync(portableRoot)
  ? fs.readdirSync(portableRoot).filter(n => /^blender-.*-windows-x64$/.test(n))
      .sort().reverse().map(n => path.join(portableRoot, n, 'blender.exe')).find(p => fs.existsSync(p))
  : undefined;
const blender = process.env.BLENDER_PATH || portable || 'blender';
const modeArgs=process.argv.includes('--procedural')?['--','--procedural']:[];
const result = spawnSync(blender, ['--background', '--factory-startup', '--python-exit-code', '1', '--python', 'tools/blender-hands.py',...modeArgs], {
  cwd: root, stdio: 'inherit', windowsHide: true,
});
if (result.error) throw new Error('Blender is required. Set BLENDER_PATH to blender.exe, or put a portable Blender in .tools/.', { cause: result.error });
if (result.status !== 0) throw new Error(`Blender exited with status ${result.status}`);
process.chdir(root);
await import('./generate-hands.mjs');
