import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {createNamelessGuardianAlly} from '../src/nameless-guardian-ally.js';
const scene=new T.Scene(),ally=createNamelessGuardianAlly(scene),player=new SealGameCore.Fighter(300),actors=[-3,0,3].map((x,i)=>({id:i,pos:[x,1.72,-13],fighter:{hp:1000}}));
let beam=0,slams=0,chargeSeen=false,warningSeen=false,jumpSeen=false,cracksSeen=false,paused=false,firstFiring=false,slamSerial=-1;
ally.reset(true);
for(let frame=0;frame<1200;frame++){
 ally.update(1/60,frame/60,actors,player,[0,1.72,7],(actor,damage,kind)=>{if(kind==='guardian-light')beam+=damage;else slams+=damage;return damage;});
 const s=ally.state();assert.equal(s.armor,0);assert.equal(s.barriers,0);assert.equal(player.shield,0);assert.equal(scene.getObjectByName('guardian-armor'),undefined);
 if(s.cast?.stage==='firing')firstFiring=true;
 if(s.cast?.type==='breath'&&!firstFiring){assert.equal(beam,0,'no damage through charge and head recoil');chargeSeen=true;if(!paused){const before=structuredClone(s);ally.update(3,frame/60,actors,player,[0,1.72,7],()=>assert.fail('paused hit'),false);assert.deepEqual(ally.state(),before);paused=true;}}
 if(s.cast?.type==='slam'){
  if(s.cast.age<.95){assert.equal(s.position[1],0);const marker=scene.getObjectByName('guardian-beast-arts').children.find(m=>m.geometry.type==='CircleGeometry');assert.equal(marker.material.color.getHexString(),'ff2626');warningSeen=true;if(slamSerial!==s.attacks){slamSerial=s.attacks;for(const a of actors)a.pos[0]=marker.position.x+10;}assert.notEqual(marker.position.x,actors[0].pos[0]);}
  if(s.cast.stage==='ascent'||s.cast.stage==='descent'){assert.ok(s.position[1]>0);jumpSeen=true;}
 }
 if(s.cracks.length)cracksSeen=true;
}
assert.ok(chargeSeen&&warningSeen&&jumpSeen&&cracksSeen&&paused);assert.ok(beam>0);assert.equal(slams,0,'dodged landing misses');assert.deepEqual([...new Set(ally.state().history.map(a=>a.type))].sort(),['breath','slam']);
ally.reset();assert.equal(scene.getObjectByName('guardian-ground-cracks'),undefined);ally.dispose();assert.equal(scene.children.length,0);
console.log('PASS: Nameless has no shield or shared ward; charge/recoil/cannon, red warning, diagonal jump/fast descent, cracks, dodge, pause and cleanup.');
