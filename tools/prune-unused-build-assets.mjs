import fs from 'node:fs/promises';
import path from 'node:path';
import {PORTRAIT_IMAGES} from '../src/portrait-images.js';
import {prunePortraitFiles} from './prune-portrait-files.mjs';

export async function pruneUnusedBuildAssets(output){
  const directory=path.resolve(output,'assets');
  // These source models stay in the workspace. Runtime uses derived variants.
  for(const name of ['hero-ninja.glb','hero-ninja-simple.glb','npc.vrm','npc_nam.vrm','npc_nu.vrm','ha-ly.glb']){
    const target=path.resolve(directory,name);if(path.dirname(target)!==directory)throw Error('Unexpected asset path');
    await fs.unlink(target).catch(e=>{if(e.code!=='ENOENT')throw e;});
  }
  await prunePortraitFiles(path.join(directory,'portraits'),PORTRAIT_IMAGES);
}
