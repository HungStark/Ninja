const assert=require('node:assert/strict'),fs=require('node:fs/promises');
const {spawn}=require('node:child_process'),{chromium}=require('playwright'),{build}=require('esbuild');
(async()=>{
  const out='test-results/resident-model-fixes';await fs.mkdir(out,{recursive:true});
  const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4324'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser;
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
    browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const page=await browser.newPage({viewport:{width:1200,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning'&&/Could not load/.test(m.text()))errors.push(m.text());});
    await page.route('**/favicon.ico',r=>r.fulfill({status:204,body:''}));
    await page.route('**/resident-preview.html',r=>r.fulfill({contentType:'text/html',body:'<html><style>body{margin:0;background:#173037}#portrait{width:300px;height:360px}#portrait canvas{display:block;width:100%;height:100%}#label{position:absolute;left:20px;top:20px;color:#eee;font:22px sans-serif}</style><div id="label"></div></html>'}));
    await page.goto('http://127.0.0.1:4324/resident-preview.html');
    const entry=`import * as T from 'three';
      import {createVillager} from './src/villager.js';import {villagerAppearance} from './src/villager-appearance.js';
      import {REGIONS} from './src/adventure-world.js';import {createHeroPreview} from './src/hero-preview.js';import {ARMORS,BAGS} from './src/equipment.js';
      const scene=new T.Scene();scene.background=new T.Color('#b1b6a6');scene.add(new T.HemisphereLight('#eee6d0','#6e6856',2.2));const sun=new T.DirectionalLight('#fff0d5',3);sun.position.set(-3,7,5);scene.add(sun);
      const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1200,900);renderer.toneMapping=T.ACESFilmicToneMapping;document.body.append(renderer.domElement);const camera=new T.PerspectiveCamera(35,1200/900,.1,60);
      const floor=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshStandardMaterial({color:'#8e8764',roughness:1}));floor.rotation.x=-Math.PI/2;scene.add(floor);
      const specs=[['mother','nameless','war-cemetery'],['farmer','nameless','terraces'],['carpenter','nameless','old-bridge'],['reader','nameless','bell-shrine'],['smith','fire','forge']];
      const actors=Object.fromEntries(specs.map(([key,village,landmark])=>{const person=REGIONS[village].npcs.find(n=>n.landmark===landmark),actor=createVillager(villagerAppearance(village,person));scene.add(actor.root);actor.root.visible=false;return [key,actor];}));
      for(const female of [false,true]){const actor=createVillager(villagerAppearance('nameless',{id:'relaxed-'+female,kind:'lore',appearance:{female,age:'adult',job:'farmer',height:3}}));scene.add(actor.root);actor.root.visible=false;actors[female?'female':'male']=actor;}
      const point=o=>o.getWorldPosition(new T.Vector3()),bone=(a,n)=>a.root.getObjectByName('J_Bip_'+n),angle=(a,b,c)=>point(b).sub(point(a)).normalize().angleTo(point(c).sub(point(b)).normalize());
      const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
      function summary(key){const a=actors[key];scene.updateMatrixWorld(true);const props=[];a.root.traverse(o=>{if(o.userData.residentTool)props.push({name:o.name,visible:visible(o),gripDistance:point(o.parent).distanceTo(point(o.parent.parent))});});return {pose:a.root.userData.residentRigPose,hips:point(bone(a,'C_Hips')).toArray(),head:point(bone(a,'C_Head')).toArray(),knees:['L','R'].map(s=>angle(bone(a,s+'_UpperLeg'),bone(a,s+'_LowerLeg'),bone(a,s+'_Foot'))),hands:['R','L'].map(s=>point(bone(a,s+'_Hand')).toArray()),spread:['R','L'].map(s=>Math.abs(point(bone(a,s+'_Hand')).x-point(bone(a,s+'_UpperArm')).x)),props};}
      function show(key,time=1,angle=0,high=false){for(const [id,a]of Object.entries(actors)){a.root.visible=id===key;if(id===key){a.update(time,false);a.setInkViewport(1200,900);}}const center=new T.Vector3(0,key==='mother'?1.1:1.5,.35),distance=5.8;camera.position.copy(center).add(new T.Vector3(Math.sin(angle)*distance,high?5.2:1.1,Math.cos(angle)*distance));camera.lookAt(center);renderer.render(scene,camera);return summary(key);}
      function coverage(key){const a=actors[key],meshes=[];a.root.traverse(o=>{if(o.isSkinnedMesh&&!o.userData.inkOutline)meshes.push(o);});let exposed=0,hits=0;const samples=[];for(const x of [-.12,0,.12])for(const z of [-.17,-.08,0]){const ray=new T.Raycaster(a.root.localToWorld(new T.Vector3(x,3.7,z)),new T.Vector3(0,-1,0));const hit=ray.intersectObjects(meshes,false)[0];if(hit){hits++;const name=Array.isArray(hit.object.material)?hit.object.material[hit.face.materialIndex].name:hit.object.material.name;samples.push(name);if(!/hair/i.test(name))exposed++;}}return {exposed,hits,samples};}
      const portrait=document.createElement('div');portrait.id='portrait';portrait.style.display='none';document.body.append(portrait);const preview=createHeroPreview();
      window.residents={ready:()=>Object.values(actors).every(a=>!!a.root.getObjectByName('male-npc-visual')),show,summary,coverage,portrait:async armored=>{renderer.domElement.style.display='none';document.getElementById('label').style.display='none';portrait.style.display='block';await preview.show(portrait,{armor:ARMORS.find(a=>a.id===(armored?'wind-guard':'traveler')),bag:BAGS[0],hero:{coat:'#29272d'}});},hidePortrait:()=>{portrait.style.display='none';renderer.domElement.style.display='block';}};`;
    const bundle=await build({stdin:{contents:entry,resolveDir:process.cwd()},bundle:true,format:'iife',write:false});await page.addScriptTag({content:bundle.outputFiles[0].text});await page.waitForFunction(()=>residents.ready());
    const results={};
    for(const key of ['male','female','mother','farmer','carpenter','smith','reader']){
      results[key]=await page.evaluate(key=>residents.show(key,1),key);await page.screenshot({path:out+'/'+key+'.png'});
      if(['male','female'].includes(key)){
        results[key].coverage=await page.evaluate(key=>residents.coverage(key),key);
        await page.evaluate(key=>residents.show(key,1,Math.PI,true),key);await page.screenshot({path:out+'/'+key+'-crown.png'});
      }else{
        results[key].later=await page.evaluate(key=>residents.show(key,2.3),key);await page.screenshot({path:out+'/'+key+'-later.png'});
        results[key].cycle=[];
        for(let i=0;i<12;i++)results[key].cycle.push(await page.evaluate(({key,t})=>residents.show(key,t),{key,t:i*.23}));
        if(key==='mother'){await page.evaluate(()=>residents.show('mother',1,Math.PI/2));await page.screenshot({path:out+'/mother-side.png'});}
        if(['smith','carpenter'].includes(key)){const samples=results[key].cycle,index=samples.reduce((best,s,i)=>s.hands[1][1]>samples[best].hands[1][1]?i:best,0);await page.evaluate(({key,t})=>residents.show(key,t),{key,t:index*.23});await page.screenshot({path:out+'/'+key+'-raised.png'});}
      }
    }
    await fs.writeFile(out+'/metrics.json',JSON.stringify(results,null,2));
    for(const key of ['male','female']){assert.ok(results[key].coverage.hits>=6);assert.equal(results[key].coverage.exposed,0,key+' scalp stays covered from above');assert.ok(results[key].spread.every(x=>x<.35),'relaxed arms hang alongside the torso');}
    assert.equal(results.mother.pose.kind,'kneeling-offering');assert.ok(results.mother.knees.every(a=>a>1.8),'mother actually bends both knees');assert.ok(results.mother.hips[1]<1,'mother lowers her hips to kneel');
    await page.evaluate(()=>residents.portrait(false));await page.locator('#portrait').screenshot({path:out+'/training-starter.png'});await page.evaluate(()=>residents.portrait(true));await page.locator('#portrait').screenshot({path:out+'/training-armor.png'});
    for(const key of ['mother','farmer','carpenter','smith']){assert.ok(results[key].props.length>0&&results[key].props.every(p=>p.visible),'work tools remain visible on the actual model');const y=results[key].cycle.map(s=>s.hands[1][1]),z=results[key].cycle.map(s=>s.hands[0][2]);assert.ok(Math.max(...y)-Math.min(...y)>.045||Math.max(...z)-Math.min(...z)>.08,key+' performs an articulated work cycle');}
    const {newJourney}=await import('../src/adventure-data.js');const save=newJourney();save.position=[0,7];
    await page.addInitScript(s=>localStorage.setItem('anhoa-adventure-v1',JSON.stringify(s)),save);
    await page.goto('http://127.0.0.1:4324/?test=1&adventure=1');await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.locator('#continueJourney').click();await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));await page.keyboard.press('c');
    await page.waitForFunction(()=>document.querySelector('#heroPreview canvas')?.dataset.modelReady==='true');
    assert.ok(await page.locator('#heroPreview canvas').evaluate(c=>c.width>=c.clientWidth*1.9),'training portrait renders at double resolution');
    await page.screenshot({path:out+'/training-in-game.png'});
    await page.setViewportSize({width:915,height:412});await page.waitForFunction(()=>document.querySelector('#heroPreview canvas')?.dataset.modelReady==='true');await page.screenshot({path:out+'/training-mobile.png'});
    assert.deepEqual(errors,[]);console.log('PASS: both NPC crowns covered, relaxed arms, real kneeling/offering/farming/carpentry/forging cycles, visible hand tools and loaded training portraits.');
  }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
