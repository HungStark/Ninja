const assert=require('node:assert/strict'),fs=require('node:fs/promises');
const {spawn}=require('node:child_process'),{chromium}=require('playwright'),{build}=require('esbuild');

(async()=>{
  const out='test-results/hero-equipment-motion';await fs.mkdir(out,{recursive:true});
  const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4362'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser;
  try{
    await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
    const entry=`import * as T from 'three';
      import {createHero} from './src/hero.js';import {ARMORS,BAGS} from './src/equipment.js';
      const scene=new T.Scene();scene.background=new T.Color('#b3b9b1');scene.add(new T.HemisphereLight('#edf1e4','#626458',2.4));const sun=new T.DirectionalLight('#fff0d7',3);sun.position.set(-3,6,5);scene.add(sun);
      const hero=createHero();hero.root.position.set(2,0,-1);hero.root.rotation.y=.35;scene.add(hero.root);
      let armor=ARMORS.find(a=>a.id==='fire-guard'),bag=BAGS[0];const equip=()=>hero.setEquipment({armor,bag});equip();
      const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1000,800);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;document.body.style.margin='0';document.body.append(renderer.domElement);
      const camera=new T.PerspectiveCamera(34,1.25,.1,30),center=hero.root.position.clone().add(new T.Vector3(0,1.5,0));
      const floor=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshStandardMaterial({color:'#8a8978',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.02;scene.add(floor);
      const relative=(a,b)=>a.getWorldQuaternion(new T.Quaternion()).invert().multiply(b.getWorldQuaternion(new T.Quaternion())).toArray();
      function state(){scene.updateMatrixWorld(true);const anchors=hero.equippedArmorAnchors,pouch=hero.pouch,hips=hero.root.getObjectByName('J_Bip_C_Hips');return {
        bodyParent:anchors.body.parent.name,shoulderParents:anchors.shoulders.map(a=>a.parent.name),bodyRotation:anchors.body.getWorldQuaternion(new T.Quaternion()).toArray(),bodyRelative:relative(anchors.body.parent,anchors.body),
        pouch:pouch?{id:pouch.userData.item,parent:pouch.parent.parent.name,rotation:pouch.getWorldQuaternion(new T.Quaternion()).toArray(),relative:relative(hips,pouch),position:hero.root.worldToLocal(pouch.getWorldPosition(new T.Vector3())).toArray(),hips:hero.root.worldToLocal(hips.getWorldPosition(new T.Vector3())).toArray(),size:new T.Box3().setFromObject(pouch).getSize(new T.Vector3()).toArray()}:null,
        count:hero.root.getObjectsByProperty('name','shuriken-pouch').length};}
      window.review={ready:()=>hero.modelReady,state,bag:index=>{bag=index===null?null:BAGS[index];equip();return state();},armor:id=>{armor=ARMORS.find(a=>a.id===id);equip();return state();},pose:(mode='idle',angle=-1)=>{
        hero.setAirborne(mode==='jump',1);for(let i=0;i<120;i++)hero.update(i/60,mode==='sprint',{x:Math.sin(.35)*7.36,z:Math.cos(.35)*7.36},1/60,mode==='sprint');if(mode==='climb')hero.climbPose(.3);
        camera.position.copy(center).add(new T.Vector3(Math.sin(angle)*6,.5,Math.cos(angle)*6));camera.lookAt(center);renderer.render(scene,camera);return state();}};`;
    const bundle=await build({stdin:{contents:entry,resolveDir:process.cwd()},bundle:true,write:false,format:'iife'});
    browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
    const page=await browser.newPage({viewport:{width:1000,height:800}}),errors=[];
    page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning'&&/Could not load/.test(m.text()))errors.push(m.text());});
    await page.route('**/equipment-preview.html',route=>route.fulfill({contentType:'text/html',body:'<html></html>'}));await page.route('**/favicon.ico',route=>route.fulfill({status:204,body:''}));
    await page.goto('http://127.0.0.1:4362/equipment-preview.html');await page.addScriptTag({content:bundle.outputFiles[0].text});await page.waitForFunction(()=>review.ready());
    const {Quaternion}=await import('three'),angle=(a,b)=>new Quaternion(...a).angleTo(new Quaternion(...b));
    const idle=await page.evaluate(()=>review.pose());
    assert.equal(idle.bodyParent,'J_Bip_C_Chest');assert.deepEqual(idle.shoulderParents,['J_Bip_R_UpperArm','J_Bip_L_UpperArm']);
    assert.equal(idle.pouch.parent,'J_Bip_C_Hips');assert.ok(idle.pouch.position[0]<-.25,'pouch hangs on the character right');assert.ok(Math.abs(idle.pouch.position[1]-idle.pouch.hips[1])<.1,'pouch hangs from waist height');
    await page.screenshot({path:out+'/idle-right.png'});
    const sprint=await page.evaluate(()=>review.pose('sprint'));
    assert.ok(angle(idle.bodyRotation,sprint.bodyRotation)>.2,'the cuirass leans with the sprint');assert.ok(angle(idle.bodyRelative,sprint.bodyRelative)<1e-6,'the cuirass keeps its torso fit');assert.ok(angle(idle.pouch.relative,sprint.pouch.relative)<1e-6,'the pouch stays attached to the pelvis');
    await page.screenshot({path:out+'/sprint-right.png'});
    await page.evaluate(()=>review.pose('sprint',-2.5));await page.screenshot({path:out+'/sprint-back.png'});
    for(const mode of ['jump','climb']){const state=await page.evaluate(mode=>review.pose(mode),mode);assert.ok(angle(idle.bodyRelative,state.bodyRelative)<1e-6);assert.ok(angle(idle.pouch.relative,state.pouch.relative)<1e-6);}
    await page.evaluate(()=>review.pose());let previous=0;
    for(let i=0;i<4;i++){const state=await page.evaluate(i=>review.bag(i),i);assert.equal(state.count,1);assert.ok(state.pouch.size.every(v=>v<.4),'all pouch tiers stay small');const volume=state.pouch.size.reduce((a,b)=>a*b,1);assert.ok(volume>previous);previous=volume;}
    assert.equal((await page.evaluate(()=>review.bag(null))).pouch,null,'no equipped bag means no pouch model');
    await page.evaluate(()=>review.bag(1));const swapped=await page.evaluate(()=>review.armor('water-guard'));assert.equal(swapped.count,1);assert.equal(swapped.pouch.id,'pouch-60');
    assert.deepEqual(errors,[]);console.log('PASS: loaded armor follows chest and shoulders through sprint/jump/climb; small right-waist pouches follow the pelvis, respect bag tiers and swaps, and disappear without a bag.');
  }finally{await browser?.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
