import assert from 'node:assert/strict';
import * as T from 'three';
import {createGuardianVfx} from '../src/guardian-vfx.js';
import {createGuardianArsenalCombat} from '../src/guardian-arsenal-combat.js';
import {GUARDIAN_ARSENAL_DESIGNS as designs} from '../src/guardian-arsenal-data.js';
import {guardianSkillStats} from '../src/guardian-balance.js';
import {guardianSegmentDistance} from '../src/guardian-moba-combat.js';
import {createEncounterCreature} from '../src/encounter-appearance.js';
const v=new T.Vector3(),scene=new T.Scene(),vfx=createGuardianVfx();
for(const element of Object.keys(designs))for(const shape of [{kind:'sector',position:[2,0,-3],direction:[0,0,1],radius:5,arc:Math.PI*.8},{kind:'lane',from:[2,0,-12],to:[-5,0,8],radius:.5},{kind:'area',position:[0,0,0],radius:2}]){
 vfx.attach(scene,element);const e=vfx.strike(shape,{source:'fixture'});
 for(const t of [0,.1,.1,.1]){vfx.update(t,t,[],[0,0,0],null);e.root.updateWorldMatrix(true,true);e.root.traverse(m=>{if(!m.isMesh)return;assert.equal(m.layers.mask,1,'attack VFX remain visible without prediction guides');const p=m.geometry.getAttribute('position');for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);const point=[v.x,0,v.z];if(shape.kind==='lane')assert.ok(guardianSegmentDistance(point,shape.from,shape.to)<=shape.radius+.002,'lane animation stays in its capsule');else{const dx=v.x-shape.position[0],dz=v.z-shape.position[2];assert.ok(Math.hypot(dx,dz)<=shape.radius+.002,'area animation matches warning radius');if(shape.kind==='sector')assert.ok(Math.abs(Math.atan2(dx,dz))<=shape.arc/2+.002,'sweep animation matches warning sector');}}});}
}
vfx.attach(scene,'fire');for(let i=0;i<500;i++)vfx.strike({kind:'area',position:[0,0,0],radius:1});assert.ok(vfx.state().strikes.allocated<=vfx.state().strikes.capacity);vfx.update(1,1,[],[0,0,0],null);assert.equal(vfx.state().strikes.active,0);vfx.dispose();
const combat=createGuardianArsenalCombat(scene);let clock=0,hits=0;
try{
 for(const [id,design]of Object.entries(designs))for(const [index,skill]of design.skills.entries()){
  combat.reset(id);const fighter={hp:1000,maxHp:1000},boss=[0,2,-10],target=[0,1.7,-6],options={aiEnabled:false,bounds:{minX:-15,maxX:15,minZ:-25,maxZ:12},attackBounds:{minX:-14,maxX:14,minZ:-11,maxZ:11}};
  const step=()=>combat.update(1/60,fighter,target,boss,shot=>{if(shot.damage>0){hits++;const state=combat.state().vfx.strikes;assert.ok(state.effects.some(e=>e.kind==='contact'&&e.source===shot.style.slice('guardian-'.length)),skill.type+' damage has visible contact animation');}return {damage:shot.damage};},options);
  step();combat.trigger(index,target,boss,fighter);for(let t=0;t<guardianSkillStats(skill.type).duration+3;t+=1/60){clock+=1/60;step();}
  assert.ok(combat.state().vfx.strikes.allocated<=40);combat.clear();assert.equal(combat.state().vfx.strikes.active,0);
 }
 assert.ok(hits>100,'exercise actual near-range skill damage');
}finally{combat.dispose();}
// Authored ranged objects animate toward their warned destination before impact.
const authored=createGuardianArsenalCombat(scene),fighter={hp:1000,maxHp:1000},boss=[0,2,-10],target=[0,1.7,7];
const advance=seconds=>{for(let t=0;t<seconds-1e-6;t+=1/60)authored.update(1/60,fighter,target,boss,shot=>({damage:shot.damage}),{aiEnabled:false});};
try{
 authored.reset('fire');advance(1/60);authored.trigger(8,target,boss,fighter);advance(.85);
 const sun=scene.getObjectByName('guardian-sun'),from=sun.position.clone();advance(.15);
 assert.ok(sun.position.distanceTo(from)>.5,'sun flies instead of teleporting');
 authored.reset('light');advance(1/60);authored.trigger(8,target,boss,fighter);advance(1.2);
 const sword=scene.getObjectByName('guardian-greatsword'),rotation=sword.rotation.x,height=sword.position.y;advance(.45);
 assert.ok(sword.rotation.x<rotation-.6&&sword.position.y<height-1,'greatsword descends along the warned lane');
}finally{authored.dispose();}
const model=createEncounterCreature('fire');try{
 model.setCombatState({action:{type:'fox-tail',role:'melee',parameters:{windup:.55,interval:.45},age:.6,release:null}});model.update(.9,false);assert.equal(model.animationState().strike,0,'wait for actual release instead of guessing the first strike');
 const action={type:'fox-tail',role:'melee',parameters:{windup:.55,interval:.45},age:.55,release:{age:.55,kind:'sweep',side:1}};
 model.setCombatState({action});model.update(1,false);assert.ok(model.animationState().strike>.95);
 action.age=1;model.setCombatState({action});model.update(1.1,false);assert.ok(model.animationState().strike<.05,'no unscheduled extra swing');
 action.release={age:1,kind:'sweep',side:0};model.setCombatState({action});model.update(1.2,false);assert.ok(model.animationState().strike>.95,'next timed hit drives the next swing');
}finally{model.dispose();}
console.log('PASS: elemental attack volumes match lane/sector/area warnings, remain visible with guides off, all 80 skills have contact animation on damage, bounded pooling and exact melee release poses.');
