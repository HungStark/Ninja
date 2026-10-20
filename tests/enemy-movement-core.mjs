import assert from 'node:assert/strict';
import * as T from 'three';
import {createEnemyMovement,incomingThreat} from '../src/enemy-movement.js';
import {createEncounterCreature,encounterAppearance} from '../src/encounter-appearance.js';
import {VILLAGES} from '../src/adventure-data.js';
import {flightDistanceAt} from '../src/projectile-motion.js';

const shot=(x=0)=>({owner:'player',element:'weapon',style:'shuriken',phase:'flying',p:[x,1.6,7],v:[0,0,-45],size:.1,life:4});
const ai=createEnemyMovement(()=>.5);let p=[0,1.72,-24],s=shot(),minimum=Infinity;
assert.ok(incomingThreat([s],p));
for(let i=0;i<50;i++){
  const before=[...p];p=ai.update(1/60,{position:p,shots:[s],beginner:true});
  assert.ok(Math.abs(p[0]-before[0])<=1/60+.00001,'the bot never exceeds the player normal-step speed');
  if(i<17)assert.equal(p[0],0,'the opening enemy has a visible reaction delay');
  s.p[2]-=45/60;minimum=Math.min(minimum,Math.hypot(p[0]-s.p[0],p[1]-s.p[1],p[2]-s.p[2]));
}
assert.equal(ai.state().dodges,1);assert.ok(Math.abs(Math.abs(p[0])-.2)<1e-7,'one reaction moves only 0.2 m; dodging is not guaranteed immunity');
const spellAI=createEnemyMovement(()=>.5);let q=[0,1.72,-24],orb={...shot(),element:'fire',style:'orb',v:[0,0,-24],size:.4,motionTime:0},spellMiss=Infinity;
for(let i=0;i<110;i++){
  q=spellAI.update(1/60,{position:q,shots:[orb]});const clock=orb.motionTime;
  orb.motionTime+=1/60;orb.p[2]-=flightDistanceAt(orb.motionTime,24)-flightDistanceAt(clock,24);
  spellMiss=Math.min(spellMiss,Math.hypot(q[0]-orb.p[0],q[1]-orb.p[1],q[2]-orb.p[2]));
}
assert.ok(spellAI.state().dodges>0&&Math.abs(q[0])<=.200001,'predict released spells without granting a larger dodge');
const x=p[0];p=ai.update(.5,{position:p,shots:[shot(x)],blocked:true});assert.equal(p[0],x);assert.equal(ai.state().velocity,0);
assert.equal(incomingThreat([{...shot(),owner:'enemy'}],p),null);
assert.equal(incomingThreat([{...shot(),phase:'forming'}],p),null);
assert.equal(incomingThreat([{...shot(),v:[0,0,45]}],p),null);
assert.equal(incomingThreat([{...shot(),style:'tsunami'}],p),null);
ai.reset(5.25);p=[5.25,1.72,-24];s=shot(5.25);
for(let i=0;i<35;i++)p=ai.update(1/60,{position:p,shots:[s]});assert.ok(p[0]<5.25,'dodge inward near the edge');
ai.reset();p=[0,1.72,-24];const signs=new Set();
for(let i=0;i<900;i++){p=ai.update(1/60,{position:p});if(ai.state().velocity)signs.add(Math.sign(ai.state().velocity));assert.ok(Math.abs(p[0])<=5.3);}
assert.equal(signs.size,2,'reposition on both sides');
ai.reset();p=[0,1.72,-24];for(let i=0;i<150;i++)p=ai.update(1/60,{position:p,constrain:q=>[0,q[1],q[2]]});assert.equal(p[0],0,'respect terrain and spell barriers');
const types=new Set();
for(const v of VILLAGES){
  const profile=encounterAppearance({kind:'boss',village:v.id,name:v.name});types.add(profile.archetype);
  const model=createEncounterCreature(v.id),bounds=new T.Box3().setFromObject(model.root),size=bounds.getSize(new T.Vector3());
  assert.ok(size.y>2&&size.y<=4.401);assert.ok(Math.abs(bounds.min.y)<.001);assert.ok(size.x<=6.001&&size.z<=6.001);
  model.update(1,true,false,2);assert.ok(Number.isFinite(model.root.children[0].position.y));model.dispose();
  assert.equal(encounterAppearance({kind:'quest',village:v.id}).coat,v.color);
}
assert.ok(types.size>=5);assert.equal(encounterAppearance(null).kind,'duel');
console.log('PASS: delayed lateral reactions, 0.2 m steps at no more than 1 m/s, both directions, arena/terrain/control constraints, ten shared guardian models and encounter palettes.');
