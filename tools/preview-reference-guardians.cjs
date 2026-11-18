const {chromium}=require('playwright'),{build}=require('esbuild'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const out='test-results/reference-guardians';await fs.mkdir(out,{recursive:true});
 const entry=`import * as T from 'three';import {createEncounterCreature} from './src/encounter-appearance.js';
 const scene=new T.Scene();scene.background=new T.Color('#303b48');scene.add(new T.HemisphereLight('#edf3ff','#65554a',1.5));
 const sun=new T.DirectionalLight('#fff0dc',2.7);sun.position.set(-4,8,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-5,right:5,top:6,bottom:-4,near:.1,far:30});sun.shadow.normalBias=.02;scene.add(sun);
 const rim=new T.DirectionalLight('#95c5ef',1.8);rim.position.set(4,5,-4);scene.add(rim);
 const ground=new T.Mesh(new T.PlaneGeometry(40,40),new T.MeshStandardMaterial({color:'#465260',roughness:.85}));ground.rotation.x=-Math.PI/2;ground.position.y=-.02;ground.receiveShadow=true;scene.add(ground);
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(960,900);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;document.body.style.margin=0;document.body.append(renderer.domElement);
 const camera=new T.OrthographicCamera(-1,1,1,-1,.1,100);let model=null;
 window.review={render(id,view='three-quarter',mode='idle'){
  if(model){scene.remove(model.root);model.dispose();}model=createEncounterCreature(id);scene.add(model.root);
  for(let i=0;i<=90;i++){const time=i/60;model.setCombatState({aiOwnedMovement:true,moveSpeed:mode==='walk'?3:0,bossPosition:[mode==='walk'?time*3:0,0,0],action:mode==='attack'?{role:'melee',age:time,parameters:{windup:.9}}:null});model.update(time,mode==='walk',false,3);}
  if(mode==='attack'){model.setCombatState({action:{role:'melee',age:1.01,parameters:{windup:.9}}});model.update(1.51,false);}
  scene.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model.root),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  const direction=new T.Vector3(...({front:[0,.16,1],side:[1,.18,.01],back:[0,.18,-1],'three-quarter':[.9,.24,1.5]}[view]));
  camera.position.copy(center).addScaledVector(direction.normalize(),15);camera.lookAt(center);camera.updateMatrixWorld(true);
  const frame=new T.Box3(),vertex=new T.Vector3();
  model.root.traverseVisible(object=>{
   const position=object.geometry?.attributes.position;if(!position)return;
   for(let i=0;i<position.count;i++)frame.expandByPoint(vertex.fromBufferAttribute(position,i).applyMatrix4(object.matrixWorld).applyMatrix4(camera.matrixWorldInverse));
  });
  const aspect=960/900,extent=frame.getSize(vertex),halfHeight=Math.max(extent.y,extent.x/aspect)*.56,halfWidth=halfHeight*aspect;
  const centerX=(frame.min.x+frame.max.x)*.5,centerY=(frame.min.y+frame.max.y)*.5;
  Object.assign(camera,{left:centerX-halfWidth,right:centerX+halfWidth,top:centerY+halfHeight,bottom:centerY-halfHeight});
  camera.updateProjectionMatrix();renderer.render(scene,camera);
  return {id,view,mode,animation:model.animationState(),triangles:renderer.info.render.triangles,calls:renderer.info.render.calls,size:size.toArray()};
 },state:()=>model.animationState()};`;
 const bundle=await build({stdin:{contents:entry,resolveDir:process.cwd()},bundle:true,write:false,format:'iife'});
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']}),page=await browser.newPage({viewport:{width:960,height:900}}),errors=[],report=[];
 page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 try{await page.route('**/guardian-preview.html',r=>r.fulfill({contentType:'text/html',body:'<html></html>'}));await page.goto('file:///'+path.join(process.cwd(),'guardian-preview.html').replaceAll('\\','/'));await page.addScriptTag({content:bundle.outputFiles[0].text});
  const {REFERENCE_GUARDIANS}=await import('../src/reference-guardians.js');
  const ids=process.env.GUARDIAN_PREVIEW_IDS?.split(',')||REFERENCE_GUARDIANS;
  for(const id of ids)for(const [view,mode]of [['three-quarter','idle'],['front','idle'],['back','idle'],['three-quarter','walk'],['three-quarter','attack']]){
   const state=await page.evaluate(args=>review.render(...args),[id,view,mode]);report.push(state);assert.ok(state.size.every(Number.isFinite));
   if(id==='water'){assert.equal(state.animation.wingCount,0);assert.equal(state.animation.swimming,true);}if(id==='fire')assert.equal(state.animation.tailCount,9);
   if(id==='light')assert.equal(state.animation.wingCount,2);
   await page.screenshot({path:out+'/'+id+'-'+view+'-'+mode+'.png'});
  }
  assert.deepEqual(errors,[]);await fs.writeFile(out+'/report.json',JSON.stringify({passed:true,errors,report},null,2));console.log('PASS: '+ids.length+' reference guardians, front/back/three-quarter, walking and attack poses, nine fox tails and wingless water dragon.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
