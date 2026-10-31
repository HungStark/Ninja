import fs from 'node:fs/promises';
import path from 'node:path';

export async function pruneUnusedBuildAssets(output){
  const directory=path.resolve(output,'assets');
  // These source models stay in the workspace. Runtime uses derived variants.
  for(const name of ['hero-ninja.glb','npc.vrm','npc_nam.vrm','npc_nu.vrm','ha-ly.glb']){
    const target=path.resolve(directory,name);if(path.dirname(target)!==directory)throw Error('Unexpected asset path');
    await fs.unlink(target).catch(e=>{if(e.code!=='ENOENT')throw e;});
  }
}
