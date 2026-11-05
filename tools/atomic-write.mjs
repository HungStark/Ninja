import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';

// Replace the file instead of truncating it: Windows browsers can keep a
// read-only mapping of a large game bundle while the balance table rebuilds it.
export async function atomicWriteFile(target,data){
  const filename=target instanceof URL?fileURLToPath(target):path.resolve(target),temporary=path.join(path.dirname(filename),'.'+path.basename(filename)+'.'+randomUUID()+'.tmp');
  try{await fs.writeFile(temporary,data);await fs.rename(temporary,filename);}
  finally{await fs.unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error;});}
}
