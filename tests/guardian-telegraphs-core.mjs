import assert from 'node:assert/strict';
import * as T from 'three';
import {createGuardianArsenalCombat} from '../src/guardian-arsenal-combat.js';
import {GUARDIAN_ARSENAL_DESIGNS as designs} from '../src/guardian-arsenal-data.js';
import {guardianSkillStats} from '../src/guardian-balance.js';
import {guardianSegmentDistance} from '../src/guardian-moba-combat.js';
const flat=p=>[p[0],0,p[2]],scene=new T.Scene(),g=createGuardianArsenalCombat(scene),boss=[0,2,-15];
let warnings,now,player,firstDamage,checked=0;const report=[];
const covered=(p,t)=>warnings.some(w=>{if(w.at>t-.3)return false;if(w.kind==='line')return guardianSegmentDistance(flat(p),flat(w.from),flat(w.to))<=w.radius+.65;const dx=p[0]-w.position[0],dz=p[2]-w.position[2],distance=Math.hypot(dx,dz);if(w.kind==='ring')return Math.abs(distance-w.radius)<1;if(w.kind==='cone')return distance<=w.radius+.65&&(dx*w.direction[0]+dz*w.direction[2])/(distance||1)>=Math.cos(w.arc/2)-.02;return distance<=w.radius+.65;});
try{
 for(const moving of [false,true])for(const seeded of [false,true])for(const distance of [4,22])for(const [id,design]of Object.entries(designs))for(const [index,skill]of design.skills.entries()){
  g.reset(id);player=[0,1.7,boss[2]+distance];warnings=[];now=0;firstDamage=null;const active=new Set(),fighter={hp:320,maxHp:1000},options={aiEnabled:false,traceGuardianWarning:w=>warnings.push(w),bounds:{minX:-15,maxX:15,minZ:-25,maxZ:12},attackBounds:{minX:-14,maxX:14,minZ:-11,maxZ:11}};
  const step=()=>{now+=1/60;if(moving&&now>.2)player[0]=Math.sin(now*.9)*1.5;g.update(1/60,fighter,player,boss,(shot,position)=>{firstDamage??=now;assert.ok(covered(position,now),skill.type+' hits outside a previously warned region at '+now.toFixed(2));return {damage:shot.damage};},options);};step();
  if(seeded){const [seedIndex,seconds]=({fire:[1,3.4],water:[1,1.3],lightning:[1,2.3],wind:[4,1.5],earth:[3,1.5],light:[1,5],dark:[2,1.5],wood:[4,1.6],ice:[0,1.8]})[id];g.trigger(seedIndex,player,boss,fighter);for(let i=0;i<seconds*60;i++)step();for(const e of g.state().entities)active.add(e.id);}
  assert.ok(g.trigger(index,player,boss,fighter));
  const duration=guardianSkillStats(skill.type).duration+5;
  for(let frame=0;frame<duration*60;frame++){
   step();for(const e of g.state().entities){if(e.kind==='projectile')assert.ok(e.delay>=.45,skill.type+' projectile has its own path warning');if(!e.active||e.kind==='hazard'||active.has(e.id))continue;active.add(e.id);
    if(e.damage>0||e.solid||['zone','vortex','storm-eye','ice-sheet','flower','tree','treant','spirit','clone','sun'].includes(e.kind))assert.ok(covered(e.position,now),skill.type+' '+e.kind+' appears outside its announced area/path at '+now.toFixed(2));
   }
  }
  assert.ok(warnings.length>0,skill.type+' has a visible cast warning');assert.ok(firstDamage===null||firstDamage>.35,skill.type+' opening reaction window');report.push({id,type:skill.type,distance,warnings:warnings.length,firstDamage});checked++;
 }
 assert.equal(checked,640);console.log('PASS: 640 stationary/moving, near/far and resource-combo scenarios across all 80 skills; warning coverage before hits and hazard/projectile activation.');
}catch(e){console.error('FAILED',JSON.stringify(report.at(-1)));throw e;}finally{g.dispose();}
