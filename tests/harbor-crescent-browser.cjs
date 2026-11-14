const assert=require('node:assert/strict'),fs=require('node:fs/promises'),{spawn}=require('node:child_process'),{build}=require('esbuild'),{chromium}=require('playwright');
(async()=>{
 const {campaignFixtures}=await import('./campaign-fixtures.mjs'),fixtures=campaignFixtures(),out='test-results/harbor-crescent';await fs.mkdir(out,{recursive:true});
 const client=await build({stdin:{resolveDir:process.cwd(),contents:`
 import * as T from 'three';import {createAdventureScene} from './src/adventure-scene.js';import {createNinja} from './src/ninja.js';import {createOpponent} from './src/opponent.js';import {encounterAppearance} from './src/encounter-appearance.js';import {PORTRAIT_IMAGES} from './src/portrait-images.js';
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);document.body.append(renderer.domElement);const world=createAdventureScene();window.world=world;
 window.loadTrip=async(save,incoming=false)=>{world.load(save.village,save);await world.charactersReady();if(incoming)world.beginHarborArrival('earth');else{const dock=world.gates.find(g=>g.id==='wood');world.hero.root.position.set(dock.x,world.heroHeightAt(dock.x,dock.z),dock.z);world.beginBoarding(dock);}window.stepTrip(0);};
 window.stepTrip=dt=>{const trip=world.advanceBoarding(dt);world.update(dt,trip?.walking,false,true);renderer.render(world.scene,world.camera);return {trip,companion:world.storyState()};};
 window.gallery=async()=>{const scene=new T.Scene();scene.background=new T.Color('#26313c');scene.add(new T.HemisphereLight('#f4f2ff','#454055',3));const sun=new T.DirectionalLight('#fff2db',3);sun.position.set(-3,5,7);scene.add(sun);let actors=[];
 for(const [i,village]of ['fire','light','ice','dark'].entries()){const actor=createNinja(encounterAppearance({kind:'boss',village,guardianVillage:village,storyBoss:true}));scene.add(actor.root);actor.root.position.x=(i-1.5)*2;actor.root.rotation.y=i===3?Math.PI:0;await actor.ready;actor.update(0,false,null,0);actors.push(actor);}
 const camera=new T.PerspectiveCamera(32,innerWidth/innerHeight,.1,100);camera.position.set(0,3,15);camera.lookAt(0,1.5,0);renderer.render(scene,camera);
 const opponent=await createOpponent(new T.Scene(),new T.Vector3());opponent.setAppearance({kind:'boss',village:'ice'});opponent.setAppearance({kind:'boss',village:'ice',guardianVillage:'ice',storyBoss:true});
 const state=actors.map(a=>{const patches=[];a.model.traverse(o=>{if(o.name.startsWith('NinjaVillageBadge')){o.geometry.computeBoundingBox();patches.push({name:o.name,size:o.geometry.boundingBox.getSize(new T.Vector3()).toArray(),faction:o.userData.faction});}});return {ninja:a.root.userData.ninja,patches};});window.galleryActors=actors;window.galleryRenderer=renderer;
 return {actors:state,opponent:opponent.group.userData.appearance};};
 `},bundle:true,write:false,format:'iife'});
 const server=spawn(process.execPath,['server.cjs'],{env:{...process.env,PORT:'4404'},windowsHide:true,stdio:['ignore','pipe','pipe']});let browser,page;const errors=[];
 try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  for(const mobile of [false,true]){
   page=await browser.newPage({viewport:mobile?{width:915,height:412}:{width:1280,height:800},hasTouch:mobile});page.on('pageerror',e=>errors.push(e.message));await page.route('**/companion-boat.html',r=>r.fulfill({contentType:'text/html',body:'<html><body style="margin:0;overflow:hidden"></body></html>'}));await page.goto('http://127.0.0.1:4404/companion-boat.html');await page.addScriptTag({content:client.outputFiles[0].text});
   const save=structuredClone(fixtures['earth:report']);save.village='earth';await page.evaluate(s=>loadTrip(s),save);
   let state=await page.evaluate(()=>stepTrip(1.9));assert.equal(state.trip.stage,'outbound');assert.ok(state.companion.visible);assert.ok(state.companion.distance<2);assert.equal(state.trip.companions.length,1);await page.screenshot({path:out+'/'+(mobile?'mobile':'desktop')+'-earth-departure.png'});
   await page.evaluate(()=>stepTrip(4));save.village='wood';await page.evaluate(s=>loadTrip(s,true),save);state=await page.evaluate(()=>stepTrip(1.5));assert.equal(state.trip.stage,'inbound');assert.ok(state.companion.distance<2);await page.screenshot({path:out+'/'+(mobile?'mobile':'desktop')+'-wood-arrival.png'});
   state=await page.evaluate(()=>stepTrip(3));assert.ok(state.trip.complete);assert.ok(state.companion.distance<2);assert.equal(state.companion.catchups,0);
   const gallery=await page.evaluate(()=>gallery());for(const a of gallery.actors){assert.equal(a.ninja.faction,'crescent');assert.equal(a.ninja.motif,'crescent-legion');assert.equal(a.patches.length,2);assert.ok(a.patches.every(p=>p.faction==='crescent'));assert.ok(a.patches.find(p=>p.name.endsWith('Front')).size[0]>.18);}
   assert.equal(gallery.opponent.faction,'crescent','same-ID combat appearance switches to the faction uniform');await page.screenshot({path:out+'/'+(mobile?'mobile':'desktop')+'-crescent-uniforms.png'});await page.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS: loaded desktop/touch Earth departure and Wood arrival with visible companion, final follow reset, four real Crescent GLBs with animated chest/back insignia and same-ID combat uniform refresh.');
 }catch(e){await page?.screenshot({path:out+'/failure.png'}).catch(()=>{});throw e;}finally{await browser?.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
