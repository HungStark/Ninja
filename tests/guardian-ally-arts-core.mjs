import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {createNamelessGuardianAlly} from '../src/nameless-guardian-ally.js';
const scene=new T.Scene(),ally=createNamelessGuardianAlly(scene),player=new SealGameCore.Fighter(300),actors=[-3,0,3].map((x,i)=>({id:i,pos:[x,1.72,-13],fighter:{hp:1000}}));
let beam=0,slams=0,chargeSeen=false,warningSeen=false,jumpSeen=false,shieldSeen=false,paused=false;
ally.reset(true);
for(let frame=0;frame<850;frame++){
 ally.update(1/60,frame/60,actors,player,[0,1.72,7],(actor,damage,kind)=>{if(kind==='guardian-light')beam+=damage;else slams+=damage;return damage;});
 const s=ally.state();if(s.armor>0){const shield=scene.getObjectByName('guardian-armor');assert.ok(shield);assert.equal(shield.position.x,s.position[0]);shieldSeen=true;}
 if(s.cast?.type==='breath'&&s.cast.age<1.25){assert.equal(beam,0,'no damage during initial energy accumulation');chargeSeen=true;if(!paused){const before=structuredClone(s);ally.update(3,frame/60,actors,player,[0,1.72,7],()=>assert.fail('paused hit'),false);assert.deepEqual(ally.state(),before);paused=true;}}
 if(s.cast?.type==='slam'){
  if(s.cast.age<.95){assert.equal(s.position[1],0);const marker=scene.getObjectByName('guardian-beast-arts').children.find(m=>m.geometry.type==='CircleGeometry');assert.equal(marker.material.color.getHexString(),'ff2626');warningSeen=true;for(const a of actors)a.pos[0]=10;assert.notEqual(marker.position.x,10,'warning stays at the original position');}
  if(s.cast.age>1.15&&s.cast.age<1.7){assert.ok(s.position[1]>0);jumpSeen=true;}
 }
}
assert.ok(chargeSeen&&warningSeen&&jumpSeen&&shieldSeen&&paused);assert.ok(beam>0);assert.equal(slams,0,'moving out of the warning avoids landing damage');assert.deepEqual([...new Set(ally.state().history.map(a=>a.type))].sort(),['armor','breath','slam']);
ally.reset();assert.equal(scene.getObjectByName('guardian-armor'),undefined);ally.dispose();assert.equal(scene.children.length,0);
console.log('PASS: allied charge/cannon, self shield, red warning, one-second windup, actual jump, dodgeable impact, pause and cleanup.');
