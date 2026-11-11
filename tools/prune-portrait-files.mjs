import fs from 'node:fs/promises';
import path from 'node:path';

// Only generated WebP files inside this exact directory can be removed.
// Validate the complete live catalog before deleting any obsolete images.
export async function prunePortraitFiles(directory,images){
  const root=path.resolve(directory),live=new Set(Object.values(images));
  let bytes=0,removed=0,removedBytes=0;
  for(const name of live){
    if(!/^[a-f0-9]{20}\.webp$/.test(name))throw Error('Invalid portrait filename: '+name);
    const stat=await fs.stat(path.join(root,name));
    if(!stat.isFile()||!stat.size)throw Error('Missing portrait image: '+name);
    bytes+=stat.size;
  }
  for(const entry of await fs.readdir(root,{withFileTypes:true})){
    if(!entry.isFile()||!/^[a-f0-9]{20}\.webp$/.test(entry.name)||live.has(entry.name))continue;
    const target=path.resolve(root,entry.name);
    if(path.dirname(target)!==root)throw Error('Unexpected portrait path');
    const stat=await fs.stat(target);await fs.unlink(target);removed++;removedBytes+=stat.size;
  }
  return {files:live.size,bytes,removed,removedBytes};
}
