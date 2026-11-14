import assert from 'node:assert/strict';
import * as T from 'three';
import {createEncounterCreature} from '../src/encounter-appearance.js';
import {createGuardianPhases} from '../src/guardian-phases.js';
import {guardianSkillStats} from '../src/guardian-balance.js';

const moving=createEncounterCreature('water'),still=createEncounterCreature('water');
try{
 for(let i=0;i<=120;i++)for(const [model,x]of [[moving,i/60*3],[still,0]]){
  model.setCombatState({aiOwnedMovement:true,moveSpeed:3,bossPosition:[x,0,0],offset:{yaw:0}});model.update(i/60,true,true);
 }
 const state=moving.animationState();assert.equal(state.legCount,0);assert.equal(state.swimming,true);
 const movingTube=moving.root.getObjectByName('serpentine-dragon'),stillTube=still.root.getObjectByName('serpentine-dragon');
 const p=movingTube.geometry.attributes.position,s=stillTube.geometry.attributes.position;
 assert.ok(p.getX(0)<s.getX(0)-.2,'tail trails a sideways turn instead of translating rigidly');
 assert.ok(Math.abs(p.getX(p.count-1)-s.getX(p.count-1))<.001,'neck follows the leading head immediately');
 for(let i=0;i<p.count;i++){
  assert.ok([p.getX(i),p.getY(i),p.getZ(i)].every(Number.isFinite));
  const n=movingTube.geometry.attributes.normal;assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<.001);
 }
 // Replaying a capture from time zero must not retain a previous movement path.
 moving.setCombatState({aiOwnedMovement:true,moveSpeed:0,bossPosition:[0,0,0],offset:{yaw:0}});moving.update(0,false,true);
 still.setCombatState({aiOwnedMovement:true,moveSpeed:0,bossPosition:[0,0,0],offset:{yaw:0}});still.update(0,false,true);
 assert.deepEqual(p.array,s.array);
 const before=moving.mouthPosition().clone();moving.setCombatState({aiOwnedMovement:true,moveSpeed:0,bossPosition:[0,0,0],action:{role:'resource',age:.45,parameters:{windup:.9}}});moving.update(.1,false);
 assert.ok(moving.mouthPosition().distanceTo(before)>.05,'charging visibly draws the head back');
}finally{moving.dispose();still.dispose();}

const scene=new T.Scene(),g=createGuardianPhases(scene),f={hp:1000,maxHp:1000},boss=[0,2,-13],player=[0,1.7,7],mouth=[.7,4.2,-10];let calls=0;
try{
 g.reset({village:'water',element:'water',hp:1000,beastOnly:true,thirdPerson:true},f);g.trigger(6,player,boss,f);
 for(let t=0;t<guardianSkillStats('dragon-absorb').windup+.05;t+=1/60)g.update(1/60,f,player,boss,()=>({damage:0}),{aiEnabled:false,mouthPosition:()=>{calls++;return mouth;}});
 assert.equal(calls,1,'the real phase wrapper supplies the animated mouth position');
 // Inspect the rendered cylinder endpoint, not only the callback invocation.
 const cylinders=[];scene.traverse(o=>{if(o.isMesh&&o.geometry.type==='CylinderGeometry'&&o.material.userData?.guardianShared)cylinders.push(o);});
 const endpoint=cylinders.some(o=>{o.updateWorldMatrix(true,false);return new T.Vector3(0,-.5,0).applyMatrix4(o.matrixWorld).distanceTo(new T.Vector3(...mouth))<.001;});
 assert.ok(endpoint,'water pressure beam starts at the mouth');
}finally{g.dispose();}
console.log('PASS: legless dragon follows turns, retains finite unit normals, resets its path, anticipates breath and emits the pressure beam from its animated mouth.');
