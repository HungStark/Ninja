const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('playwright'),{build}=require('esbuild');
(async()=>{
  const {createHero}=await import('../src/hero.js'),T=await import('three');
  const hero=createHero(),dt=1/60;
  const tick=(frames,sprint=true,moving=true)=>{for(let i=0;i<frames;i++)hero.update(i*dt,moving,{x:0,z:sprint?7.36:4.6},dt,sprint);hero.root.updateMatrixWorld(true);};
  tick(60,false);assert.equal(hero.locomotionState().sprintBlend,0);assert.ok(hero.locomotionState().lean[0]<.05);
  tick(1);assert.ok(hero.locomotionState().sprintBlend>0&&hero.locomotionState().sprintBlend<.2,'ease into sprint');
  tick(60);const start=hero.root.position.clone();
  for(let frame=0;frame<90;frame++){
    tick(1);const motion=hero.locomotionState();assert.ok(motion.lean[0]>.41&&motion.lean[0]<.43);
    for(const arm of hero.arms){
      const shoulder=arm.pivot.getWorldPosition(new T.Vector3()),hand=arm.hand.getWorldPosition(new T.Vector3());
      assert.ok(hand.z<shoulder.z-.8,'both hands stay behind the shoulders through the stride');
      assert.ok(Math.abs(arm.elbow.rotation.x)>.08&&Math.abs(arm.elbow.rotation.x)<.14,'Naruto arms stay extended with a relaxed elbow');
    }
    for(const leg of hero.legs){const foot=leg.foot.getWorldQuaternion(new T.Quaternion()),up=new T.Vector3(0,1,0).applyQuaternion(foot);assert.ok(up.y>.999,'foot stays level despite the torso lean');}
    assert.ok(hero.legs.every(l=>l.knee.rotation.x>=0&&l.knee.rotation.x<2.2));
  }
  assert.deepEqual(hero.root.position,start,'posing never moves the gameplay root');
  tick(60,false,false);assert.ok(hero.locomotionState().sprintBlend<.00001);assert.ok(Math.abs(hero.locomotionState().lean[0])<.00001);
  tick(60);hero.airPose(1);assert.ok(hero.arms.every(a=>a.pivot.rotation.x===-.6),'jump overrides trailing arms');hero.climbPose(0);assert.ok(hero.arms.every(a=>a.pivot.rotation.x===-2),'climbing overrides trailing arms');
  for(const velocity of [{x:7.36,z:0},{x:0,z:-7.36}]){const h=createHero();for(let i=0;i<60;i++)h.update(i*dt,true,velocity,dt,true);assert.equal(h.locomotionState().sprintBlend,0,'no sprint pose for side/back movement');}
  const out='test-results/sprint-pose';await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  try{
    const page=await browser.newPage({viewport:{width:960,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const bundle=await build({stdin:{contents:`import * as T from 'three';import {createHero} from './src/hero.js';
      const scene=new T.Scene();scene.background=new T.Color('#c3cbd2');const hero=createHero();scene.add(hero.root);
      scene.add(new T.HemisphereLight(0xffffff,0x6c737f,3));const light=new T.DirectionalLight(0xffefd7,3);light.position.set(4,6,5);scene.add(light);
      const floor=new T.Mesh(new T.PlaneGeometry(20,20),new T.MeshStandardMaterial({color:'#77847b'}));floor.rotation.x=-Math.PI/2;scene.add(floor);
      const camera=new T.PerspectiveCamera(35,960/720,.1,50);camera.position.set(6,2.5,0);camera.lookAt(0,1.5,0);
      const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(960,720);document.body.append(renderer.domElement);
      window.pose=(sprint,angle=0)=>{for(let i=0;i<90;i++)hero.update(i/60,true,{x:0,z:sprint?7.36:4.6},1/60,sprint);camera.position.set(6*Math.cos(angle),2.5,6*Math.sin(angle));camera.lookAt(0,1.5,0);renderer.render(scene,camera);};pose(true);`,resolveDir:process.cwd()},bundle:true,write:false,format:'iife'});
    await page.setContent('<style>body{margin:0}</style>');await page.addScriptTag({content:bundle.outputFiles[0].text});await page.screenshot({path:out+'/sprint-side.png'});await page.evaluate(()=>pose(true,.65));await page.screenshot({path:out+'/sprint-front.png'});await page.evaluate(()=>pose(false));await page.screenshot({path:out+'/walk-side.png'});
    const {newJourney}=await import('../src/adventure-data.js'),save=newJourney();save.position=[0,7];
    await page.addInitScript(s=>localStorage.setItem('anhoa-adventure-v1',JSON.stringify(s)),save);
    const url='file:///'+path.join(process.cwd(),'index.html').replaceAll('\\','/')+'?test=1&adventure=1';
    await page.setViewportSize({width:915,height:412});await page.goto(url);await page.waitForFunction(()=>document.body.dataset.ready==='true');
    await page.locator('#continueJourney').click();await page.evaluate(()=>__AN_HOA__.explore.setRandom(false));
    const advance=t=>page.evaluate(t=>__AN_HOA__.advance(t),t),state=()=>page.evaluate(()=>__AN_HOA__.adventure());await advance(.1);
    await page.keyboard.down('w');await advance(.04);await page.keyboard.up('w');await advance(.04);await page.keyboard.down('w');await advance(.25);
    let s=await state();assert.equal(s.sprinting,true);assert.ok(s.locomotion.sprintBlend>.9,'desktop sprint reaches trailing-arm pose: '+JSON.stringify({motion:s.locomotion,physics:s.physics,position:s.position}));await page.screenshot({path:out+'/in-game-sprint.png'});
    await page.keyboard.down('Space');await advance(.1);s=await state();assert.equal(s.physics.grounded,false);assert.ok(s.locomotion.arms.every(a=>a.shoulder[0]===-.6),'in-game jump overrides sprint arms');await page.keyboard.up('Space');await page.keyboard.up('w');await advance(1.2);s=await state();assert.ok(s.locomotion.sprintBlend<.001,'release returns to normal pose');assert.deepEqual(errors,[]);
    const mobile=await browser.newPage({viewport:{width:915,height:412},hasTouch:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.addInitScript(s=>localStorage.setItem('anhoa-adventure-v1',JSON.stringify(s)),save);await mobile.goto(url);await mobile.waitForFunction(()=>document.body.dataset.ready==='true');await mobile.locator('#continueJourney').tap();await mobile.evaluate(()=>{__AN_HOA__.explore.setRandom(false);__AN_HOA__.advance(.1);});
    const client=await mobile.context().newCDPSession(mobile),touch=(type,touchPoints=[])=>client.send('Input.dispatchTouchEvent',{type,touchPoints});
    const pad=await mobile.locator('#androidJoystick').boundingBox(),thumb={x:pad.x+pad.width/2,y:pad.y+pad.height/2,id:1};await touch('touchStart',[thumb]);await touch('touchMove',[{...thumb,y:pad.y-3}]);const target=await mobile.locator('#androidSprintLock').boundingBox();await touch('touchMove',[{...thumb,x:target.x+target.width/2,y:target.y+target.height/2}]);await touch('touchEnd');await mobile.evaluate(()=>__AN_HOA__.advance(.25));s=await mobile.evaluate(()=>__AN_HOA__.adventure());assert.equal(s.sprinting,true);assert.ok(s.locomotion.sprintBlend>.9,'locked mobile sprint uses the same pose');await mobile.screenshot({path:out+'/mobile-locked-sprint.png'});assert.deepEqual(errors,[]);
    console.log('PASS: sprint lean, trailing straight arms through every stride, level feet, stationary gameplay root, smooth transitions, side/back exclusion, jump/climb overrides, desktop sprint and mobile locked sprint.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
