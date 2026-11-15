import assert from 'node:assert/strict';
import * as T from 'three';
import {createGuardianPhases} from '../src/guardian-phases.js';
import {guardianSkillStats} from '../src/guardian-balance.js';
const scene=new T.Scene(),g=createGuardianPhases(scene),boss=[0,2,-21],f={hp:1000,maxHp:1000};
let player,controls,hits,options;
const step=seconds=>{for(let t=0;t<seconds-1e-8;t+=1/60)g.update(Math.min(1/60,seconds-t),f,player,boss,shot=>{hits.push(shot);return {damage:shot.damage};},options);};
function reset(){g.reset({village:'water',element:'water',hp:1000,beastOnly:true,thirdPerson:true},f);player=[0,1.7,7];controls=[];hits=[];options={aiEnabled:false,bounds:{minX:-15,maxX:15,minZ:-25,maxZ:11},attackBounds:{minX:-15,maxX:15,minZ:1,maxZ:11},mouthPosition:()=>[0,4,-19],control:(kind,seconds)=>controls.push({kind,seconds})};step(.01);}
try{
 reset();g.trigger(1,player,boss,f);step(.8);assert.ok(g.state().hazards.some(e=>Math.abs(e.position[2]-7)<.01&&e.radius===1.5&&e.remaining>0));assert.ok(!g.state().entities.some(e=>e.kind==='vortex'));assert.equal(controls.length,0);player=[8,1.7,7];step(.35);const vortex=g.state().entities.find(e=>e.kind==='vortex');assert.ok(vortex);assert.ok(Math.abs(vortex.position[0])<.01);step(1.55);assert.ok(!g.state().entities.some(e=>e.kind==='vortex'));assert.equal(controls.length,0);assert.equal(hits.length,0);
 reset();g.trigger(4,player,boss,f);step(.5);assert.ok(g.state().entities.some(e=>e.kind==='line'),'visible line during charge');assert.equal(g.state().prison,null);assert.equal(g.slowAt(player),1);assert.equal(controls.length,0);assert.ok(!g.state().entities.some(e=>e.kind==='projectile'));
 step(.45);assert.ok(g.state().entities.some(e=>e.kind==='projectile'),'sphere is released after the charge');assert.equal(g.state().prison,null,'a flying sphere cannot imprison remotely');
 for(let i=0;i<240&&!g.state().prison;i++)step(1/60);
 assert.ok(g.state().prison,'standing in the warned path causes a real projectile hit');assert.ok(controls.some(c=>c.kind==='water'&&c.seconds===1.5));assert.equal(g.slowAt(player),0);assert.equal(g.state().prison.breakable,false);assert.equal(g.breakPrison(99999),false);
 g.areaDamage({owner:'player',damage:99999},player,10);assert.ok(g.state().prison,'damage cannot break timed captivity');step(.7);assert.ok(g.state().prison);step(.82);assert.equal(g.state().prison,null);assert.ok(g.slowAt(player)>0,'release occurs automatically after 1.5 seconds');
 reset();g.trigger(4,player,boss,f);step(1);player=[8,1.7,7];
 let previous=null,velocity=null,samples=0;for(let i=0;i<180;i++){const shot=g.state().entities.find(e=>e.kind==='projectile'&&e.source==='dragon-prison');if(shot&&shot.age>=shot.delay){assert.ok(scene.getObjectByName('guardian-water-prison-projectile'),'a visible orb travels on the physical projectile');if(previous){const delta=shot.position.map((x,j)=>x-previous[j]);if(velocity)for(let j=0;j<3;j++)assert.ok(Math.abs(delta[j]-velocity[j])<1e-7,'the orb travels straight at constant speed after the player moves');velocity=delta;}previous=shot.position;samples++;}step(1/60);}
 assert.ok(samples>30,'the sphere is visible across multiple frames in flight');assert.equal(controls.length,0,'sidestepping the locked path avoids capture');assert.equal(g.state().prison,null);assert.equal(hits.length,0);
 reset();options.interceptProjectile=()=>true;g.trigger(4,player,boss,f);step(4);assert.equal(controls.length,0,'intercepted spheres cannot capture');
 for(const x of [-2,0,2]){reset();player[0]=x;g.trigger(2,player,boss,f);step(2);const wave=g.state().entities.find(e=>e.kind==='wave');assert.ok(wave);assert.equal(wave.gapWidth,0);assert.ok(!g.state().entities.some(e=>e.kind==='wave-corridor'),'no misleading safe-lane marker');step(2);assert.ok(hits.some(h=>h.style==='guardian-dragon-wave'),'the full wave collider covers the former central gap');}
 assert.equal(guardianSkillStats('dragon-prison').controlDuration,1.5);
 console.log('PASS: Water Prison warns, launches a dodgeable sphere, captures only on impact for 1.5s, cannot be damage-broken and expires; Crashing Ocean Tide has no rendered or collision gap.');
}finally{g.dispose();}
