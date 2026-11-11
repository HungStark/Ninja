const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{chromium}=require('playwright'),{build}=require('esbuild');
(async()=>{
 const out='test-results/hero-reference/'+(process.argv[2]||'after');await fs.mkdir(out,{recursive:true});
 const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4393'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser;
 try{
  await new Promise((r,j)=>{server.stdout.once('data',r);server.once('error',j);});
  const entry=`import * as T from 'three';import {createHero} from './src/hero.js';import {ARMORS,BAGS} from './src/equipment.js';
   const scene=new T.Scene();scene.background=new T.Color('#292c32');scene.add(new T.HemisphereLight('#f0efff','#5d5150',2));
   const sun=new T.DirectionalLight('#ffe6cc',3.4);sun.position.set(-3,5,6);scene.add(sun);const rim=new T.DirectionalLight('#b3c8eb',2.5);rim.position.set(3,4,-4);scene.add(rim);
   const hero=createHero({outlineWidth:.45});scene.add(hero.root);const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(960,1000);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;document.body.style.margin=0;document.body.append(renderer.domElement);
   const floor=new T.Mesh(new T.CircleGeometry(5,64),new T.MeshStandardMaterial({color:'#35383c',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;scene.add(floor);
   const camera=new T.PerspectiveCamera(29,.96,.1,30);
   window.review={ready:hero.ready,render:(angle=0,mode='idle',armor='traveler',close=false)=>{
    hero.root.rotation.y=angle;hero.setEquipment({armor:ARMORS.find(a=>a.id===armor),bag:BAGS[0]});hero.setAirborne(mode==='jump',1);
    hero.resetCombat();if(mode==='seal')hero.playCombatAction('seal');
    for(let i=0;i<100;i++)hero.update(i/60,mode==='walk'||mode==='sprint',{x:Math.sin(angle)*5,z:Math.cos(angle)*5},1/60,mode==='sprint');
    if(mode==='seal'){hero.playCombatAction('seal');hero.update(2,false,null,.12,false,{pose:0});}if(mode==='climb')hero.climbPose(.3);
    camera.position.set(.12,close?2.72:1.65,close?2.05:7);camera.lookAt(0,close?2.58:1.52,0);hero.setInkViewport(960,1000);scene.updateMatrixWorld(true);renderer.render(scene,camera);
    return {ready:hero.modelReady,triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,bones:['Head','Chest','Hips','L_Hand','R_Hand'].map(n=>{const b=hero.root.getObjectByName(n.includes('_')?'J_Bip_'+n:'J_Bip_C_'+n);return b&&hero.root.worldToLocal(b.getWorldPosition(new T.Vector3())).toArray();})};
   },contract:()=>{const visual=hero.root.getObjectByName('hero-ninja-glb');hero.setEyeOpening(0);const blinks=[];visual.traverse(o=>{if(o.morphTargetDictionary?.Fcl_EYE_Close!==undefined)blinks.push(o.morphTargetInfluences[o.morphTargetDictionary.Fcl_EYE_Close]);});hero.setEyeOpening(1);return {integratedMask:visual.userData.heroReference?.integratedMask,duplicateMask:!!hero.root.getObjectByName('hero-cloth-face-mask'),blinks};},geometry:()=>{const a=[];hero.root.traverse(o=>{if(o.isMesh&&!o.userData.inkOutline){const b=new T.Box3().setFromObject(o);a.push({name:o.name,material:Array.isArray(o.material)?o.material.map(m=>m.name):o.material.name,min:b.min.toArray(),max:b.max.toArray()});}});return a;}};`;
  const bundle=await build({stdin:{contents:entry,resolveDir:process.cwd()},bundle:true,write:false,format:'iife'});
  browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:960,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||/Could not load hero/.test(m.text()))errors.push(m.text());});
  await page.route('**/hero-reference.html',r=>r.fulfill({contentType:'text/html',body:'<html></html>'}));await page.route('**/favicon.ico',r=>r.fulfill({status:204,body:''}));await page.goto('http://127.0.0.1:4393/hero-reference.html');await page.addScriptTag({content:bundle.outputFiles[0].text});await page.evaluate(()=>review.ready);
  const contract=await page.evaluate(()=>review.contract());assert.equal(contract.integratedMask,true);assert.equal(contract.duplicateMask,false);assert.ok(contract.blinks.length>0&&contract.blinks.every(v=>v===1));
  const results=[];for(const [name,angle,mode,armor,close] of [['front',0],['three-quarter',.65],['side',Math.PI/2],['back',Math.PI],['portrait',0,'idle','traveler',true],['sprint',.65,'sprint'],['jump',.65,'jump'],['seal',0,'seal'],['armor',.65,'idle','fire-guard']]){results.push({name,...await page.evaluate(a=>review.render(...a),[angle,mode||'idle',armor||'traveler',!!close])});await page.screenshot({path:out+'/'+name+'.png'});}
  await fs.writeFile(out+'/report.json',JSON.stringify({errors,results,geometry:await page.evaluate(()=>review.geometry())},null,2));if(errors.length)throw new Error(errors.join('\n'));console.log(JSON.stringify(results));
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
