const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const {build}=require('esbuild');

function glb(bytes){
  const length=bytes.readUInt32LE(12);
  return {json:JSON.parse(bytes.subarray(20,20+length)),bin:bytes.subarray(28+length)};
}
function accessor(asset,index){
  const a=asset.json.accessors[index],v=asset.json.bufferViews[a.bufferView];
  const count={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type];
  if(!v)return Array.from({length:a.count},()=>Array(count).fill(0));
  const sizes={5121:1,5123:2,5125:4,5126:4},reads={5121:'readUInt8',5123:'readUInt16LE',5125:'readUInt32LE',5126:'readFloatLE'};
  return Array.from({length:a.count},(_,i)=>Array.from({length:count},(_,j)=>asset.bin[reads[a.componentType]]((v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||count*sizes[a.componentType])+j*sizes[a.componentType])));
}

(async()=>{
  const out='test-results/character-style-motion';await fs.mkdir(out,{recursive:true});
  for(const source of ['hero-ninja.glb','npc_nam.vrm','npc_nu.vrm']){
    const variant=source.replace(/(\.[^.]+)$/,'-simple$1');
    const original=glb(await fs.readFile('assets/'+source)),simple=glb(await fs.readFile('assets/'+variant));
    assert.deepEqual(simple.json.nodes,original.json.nodes,'bone transforms and attachment nodes remain unchanged');
    assert.deepEqual(simple.json.skins,original.json.skins,'joint order and bind accessor remain unchanged');
    for(const skin of original.json.skins)assert.deepEqual(accessor(simple,skin.inverseBindMatrices),accessor(original,skin.inverseBindMatrices));
    for(let mi=0;mi<original.json.meshes.length;mi++){
      for(let pi=0;pi<original.json.meshes[mi].primitives.length;pi++){
        const p=original.json.meshes[mi].primitives[pi],q=simple.json.meshes[mi].primitives[pi];
        if(p.targets){
          assert.deepEqual(q,p,'facial primitives and morph references stay untouched');
          for(const target of p.targets)for(const index of Object.values(target))assert.deepEqual(accessor(simple,index),accessor(original,index),'facial morph deltas preserved');
        }
        const positions=accessor(simple,q.attributes.POSITION),indices=accessor(simple,q.indices);
        assert.ok(indices.every(([i])=>i<positions.length),'all triangle indices reference existing vertices');
        assert.ok(positions.every(row=>row.every(Number.isFinite)));
        const weights=accessor(simple,q.attributes.WEIGHTS_0);
        assert.ok(weights.every(row=>Math.abs(row.reduce((a,b)=>a+b,0)-1)<.002),'skin weights stay normalized');
      }
    }
  }
  const {createHero}=await import('../src/hero.js'),T=await import('three');
  const fallback=createHero();
  for(let i=0;i<120;i++)fallback.update(i/60,true,{x:0,z:7.36},1/60,true);
  const angles=[];
  for(let i=0;i<90;i++){
    fallback.update(i/60,true,{x:0,z:7.36},1/60,true);fallback.root.updateMatrixWorld(true);
    angles.push(fallback.legs[0].knee.rotation.x);
    for(const arm of fallback.arms){
      const shoulder=arm.pivot.getWorldPosition(new T.Vector3()),hand=arm.hand.getWorldPosition(new T.Vector3());
      assert.ok(hand.z<shoulder.z-.7,'Naruto sprint keeps both hands behind the body');
      assert.ok(Math.abs(arm.elbow.rotation.x)<.14,'sprinting arms remain extended');
    }
  }
  assert.ok(Math.max(...angles)-Math.min(...angles)>.8,'knees bend substantially during the recovery step');

  const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4321'},windowsHide:true,stdio:['ignore','pipe','pipe']});
  let browser;
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('server exited '+code)));});
    browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const entry=`import * as T from 'three';
      import {createHero} from './src/hero.js';
      import {createVillager} from './src/villager.js';
      import {villagerAppearance} from './src/villager-appearance.js';
      const scene=new T.Scene();scene.background=new T.Color('#b2b7a6');
      scene.add(new T.HemisphereLight('#edead5','#605c4c',2.2));
      const sun=new T.DirectionalLight('#fff0cf',3);sun.position.set(-3,7,5);scene.add(sun);
      const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1280,800);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;document.body.append(renderer.domElement);
      const camera=new T.PerspectiveCamera(34,1280/800,.1,60);
      const floor=new T.Mesh(new T.PlaneGeometry(50,50),new T.MeshStandardMaterial({color:'#8e8764',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;scene.add(floor);
      const hero=createHero();hero.root.position.x=-2.4;scene.add(hero.root);
      const villagers=[false,true].map((female,i)=>{const profile=villagerAppearance('nameless',{id:'review-'+i,kind:'lore',appearance:{female,age:'adult',job:'farmer',height:3,coat:'#817052',accent:'#b49b70'}});const npc=createVillager(profile);npc.root.position.x=i*2.5;scene.add(npc.root);return npc;});
      const pos=o=>o.getWorldPosition(new T.Vector3());
      const bend=(a,b,c)=>pos(b).sub(pos(a)).normalize().angleTo(pos(c).sub(pos(b)).normalize());
      function metrics(){const visual=hero.root.getObjectByName('hero-ninja-glb');if(!visual)return null;scene.updateMatrixWorld(true);const bone=n=>visual.getObjectByName(n);let shoeFloor=Infinity;visual.traverse(o=>{if(!o.isSkinnedMesh||o.userData.inkOutline||!String(o.material?.name).toLowerCase().includes('shoes'))return;for(let i=0;i<o.geometry.attributes.position.count;i++){const p=o.getVertexPosition(i,new T.Vector3()).applyMatrix4(o.matrixWorld);shoeFloor=Math.min(shoeFloor,p.y);}});return {shoeFloor,knees:['L','R'].map(s=>bend(bone('J_Bip_'+s+'_UpperLeg'),bone('J_Bip_'+s+'_LowerLeg'),bone('J_Bip_'+s+'_Foot'))),elbows:['L','R'].map(s=>bend(bone('J_Bip_'+s+'_UpperArm'),bone('J_Bip_'+s+'_LowerArm'),bone('J_Bip_'+s+'_Hand'))),hands:['L','R'].map(s=>pos(bone('J_Bip_'+s+'_Hand')).z-pos(bone('J_Bip_'+s+'_UpperArm')).z),motion:hero.locomotionState()};}
      window.review={ready:()=>!!hero.root.getObjectByName('hero-ninja-glb')&&villagers.every(n=>!!n.root.getObjectByName('male-npc-visual')),pose:(mode='idle',frames=90,angle=.25,group=true)=>{hero.setAirborne(false);for(let i=0;i<frames;i++)hero.update(i/60,mode!=='idle',{x:0,z:mode==='sprint'?7.36:4.6},1/60,mode==='sprint');villagers.forEach(n=>{n.root.visible=group;n.update(0,false);n.setInkViewport(1280,800);});hero.setInkViewport(1280,800);const center=group?new T.Vector3(0,1.5,0):new T.Vector3(-2.4,1.45,0),distance=group?12:6.4;camera.position.copy(center).add(new T.Vector3(Math.sin(angle)*distance,.6,Math.cos(angle)*distance));camera.lookAt(center);renderer.render(scene,camera);return metrics();},step:()=>{hero.update(1,true,{x:0,z:7.36},1/60,true);renderer.render(scene,camera);return metrics();},override:mode=>{if(mode==='jump')hero.airPose(1);else hero.climbPose(0);renderer.render(scene,camera);return metrics();}};`;
    const bundle=await build({stdin:{contents:entry,resolveDir:process.cwd()},bundle:true,write:false,format:'iife'});
    const errors=[];
    async function preview(original){
      const page=await browser.newPage({viewport:{width:1280,height:800}});
      page.on('pageerror',e=>errors.push(e.stack));
      page.on('console',m=>{if(m.type()==='error'||m.type()==='warning'&&/Could not load/.test(m.text()))errors.push(m.text());});
      await page.route('**/character-preview.html',route=>route.fulfill({contentType:'text/html',body:'<html><style>body{margin:0}</style></html>'}));
      if(original)await page.route(/-simple\.(glb|vrm)$/,route=>route.continue({url:route.request().url().replace('-simple.','.')}));
      await page.goto('http://127.0.0.1:4321/character-preview.html');
      await page.addScriptTag({content:bundle.outputFiles[0].text});
      await page.waitForFunction(()=>review.ready(),{timeout:30000});
      const name=original?'before':'after';
      await page.evaluate(()=>review.pose());await page.screenshot({path:out+'/'+name+'-characters.png'});
      await page.evaluate(()=>review.pose('idle',1,Math.PI,false));await page.screenshot({path:out+'/'+name+'-hair-back.png'});
      await page.evaluate(()=>review.pose('sprint',120,Math.PI/2,false));await page.screenshot({path:out+'/'+name+'-sprint-side.png'});
      return page;
    }
    const before=await preview(true);await before.close();
    const after=await preview(false),samples=[];
    for(let i=0;i<50;i++)samples.push(await after.evaluate(()=>review.step()));
    const knees=samples.map(s=>s.knees[0]);assert.ok(Math.max(...knees)-Math.min(...knees)>.8,'loaded GLB actually bends at the knee');
    assert.ok(samples.every(s=>s.hands.every(z=>z<-.6)),'actual GLB hands trail the shoulders throughout the sprint');
    assert.ok(samples.every(s=>s.elbows.every(a=>a<.16)),'actual GLB Naruto arms stay almost straight');
    assert.ok(samples.every(s=>s.shoeFloor>-.08),'skinned shoes do not sink through the ground during sprint');
    const walking=await after.evaluate(()=>review.pose('walk',120,Math.PI/2,false));
    assert.ok(walking.elbows.every(a=>a>.30),'loaded GLB elbows bend rather than twisting on their length');
    await after.screenshot({path:out+'/after-walk-side.png'});
    const jump=await after.evaluate(()=>review.override('jump'));
    assert.ok(jump.knees.every(a=>a>.3)&&jump.elbows.every(a=>a>.25),'jump overrides also reach the visible rig');
    await after.screenshot({path:out+'/after-jump-side.png'});
    const climb=await after.evaluate(()=>review.override('climb'));
    assert.ok(climb.elbows.every(a=>a>.4),'climbing bends the actual elbows');
    await fs.writeFile(out+'/metrics.json',JSON.stringify({sprint:samples,walking},null,2));
    assert.deepEqual(errors,[]);
    console.log('PASS: original rigs and facial morphs preserved, valid skin weights, all three real model variants loaded, bent knees, functional elbow axes and extended trailing Naruto arms.');
  }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
