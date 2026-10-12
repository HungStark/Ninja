import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright';

const root=fileURLToPath(new URL('../',import.meta.url));
const stage=process.argv[2]||'05-final';
if(!/^[a-z0-9-]+$/.test(stage))throw new Error('Use a simple stage name');
const out=path.join(root,'test-results','hand-volume',stage);
await fs.mkdir(out,{recursive:true});
await build({stdin:{resolveDir:root,contents:`
import * as T from 'three';
import {createHands} from './src/hands.js';
async function main(){
const hands=await createHands();
const wrapper=hands.hands[0].wrapper;
hands.hands[1].wrapper.visible=false;
wrapper.scale.set(1,1,1);wrapper.position.set(0,0,0);wrapper.rotation.set(0,0,0);
for(const child of hands.scene.children)if(child!==hands.root&&!child.isLight)child.visible=false;
wrapper.traverse(o=>{
  if(o.isMesh&&!o.userData.inkOutline&&o.name!=='hand_skin'&&!o.name.endsWith('_nail'))o.visible=false;
});
const renderer=new T.WebGLRenderer({antialias:true});
renderer.setSize(850,1050);renderer.setClearColor('#202224');
renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.NoToneMapping;
document.body.appendChild(renderer.domElement);
const camera=new T.OrthographicCamera(-.47*850/1050/2,.47*850/1050/2,.47/2,-.47/2,.01,10);
const target=new T.Vector3(-.01,.070,0);
hands.setInkViewport(850,1050);
window.renderHandAngle=angle=>{
  const a=angle*Math.PI/180;camera.position.copy(target).add(new T.Vector3(-Math.sin(a),0,Math.cos(a)));
  camera.up.set(0,1,0);camera.lookAt(target);hands.scene.updateMatrixWorld(true);
  renderer.render(hands.scene,camera);
};
window.renderHandAngle(0);document.body.dataset.ready='true';
}main().catch(error=>{document.body.dataset.error=error.stack||error.message;console.error(error.stack||error.message);});
`},bundle:true,format:'iife',target:'es2022',outfile:path.join(out,'turntable.js')});
await fs.writeFile(path.join(out,'index.html'),'<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#202224}canvas{display:block}</style><body><script src="turntable.js"></script></body>');
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:850,height:1050}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('file:///'+path.join(out,'index.html').replaceAll('\\','/'));
  await page.waitForFunction(()=>document.body.dataset.ready==='true'||document.body.dataset.error,null,{timeout:60000}).catch(e=>{throw new Error(errors.join('\n')||e.message);});
  const error=await page.evaluate(()=>document.body.dataset.error);
  if(error)throw new Error(error);
  for(const [name,angle] of [['front',0],['angle-45',45],['side',90]]){
    await page.evaluate(angle=>window.renderHandAngle(angle),angle);
    await page.screenshot({path:path.join(out,name+'.png')});
  }
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('PASS: actual game GLB, cel material and thin ink rendered at front / 45 / side.');
}finally{await browser.close();}
