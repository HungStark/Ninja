import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {SPELL_ICON_ROWS} from '../src/spell-icon-manifest.js';

const root=fileURLToPath(new URL('../',import.meta.url)),source=path.join(root,'assets/ui/spells-v2-atlas.png'),output=path.join(root,'assets/ui/spells');
// Seams measured from this atlas; row heights vary slightly in the source image.
const columns=[0,191,375,560,745,936],rows=[0,189,375,562,747,919,1096,1270,1452,1647];
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
  const page=await browser.newPage();
  const size=await page.evaluate(async src=>{const img=new Image();img.src=src;await img.decode();window.spellAtlas=img;return [img.width,img.height];},'data:image/png;base64,'+(await fs.readFile(source)).toString('base64'));
  if(size[0]!==936||size[1]!==1681)throw Error('Atlas dimensions changed; its crop seams must be reviewed.');
  for(const [row,ids] of SPELL_ICON_ROWS.entries())for(const [column,id] of ids.entries()){
    const png=await page.evaluate(({x,y,width,height})=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(window.spellAtlas,x,y,width,height,0,0,256,256);return canvas.toDataURL('image/png').split(',')[1];},{x:columns[column]+1,y:rows[row]+1,width:columns[column+1]-columns[column]-2,height:rows[row+1]-rows[row]-2});
    await fs.writeFile(path.join(output,id+'.png'),Buffer.from(png,'base64'));
  }
  console.log('Prepared '+SPELL_ICON_ROWS.flat().length+' spell icons at 256 × 256: '+output);
}finally{await browser.close();}
