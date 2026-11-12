import assert from 'node:assert/strict';
import * as T from 'three';
import {createEnemyMovement,ENEMY_DIRECTION_INTERVAL,ENEMY_MOVEMENT_LIMIT} from '../src/enemy-movement.js';
import {createEncounterCreature,encounterAppearance} from '../src/encounter-appearance.js';
import {VILLAGES} from '../src/adventure-data.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,a+' != '+b);
assert.equal(ENEMY_DIRECTION_INTERVAL,2);
let values=[.25,.75,.75,.25],calls=0;const ai=createEnemyMovement(()=>{calls++;return values.shift()??.25;});let p=[0,1.72,-24];
p=ai.update(1.99,{position:p});close(p[0],-1.99*1.3);assert.equal(calls,1);
p=ai.update(.01,{position:p});close(p[0],-2*1.3);assert.equal(ai.state().direction,1);assert.equal(calls,2);
p=ai.update(2,{position:p,casting:true});close(p[0],0);assert.equal(ai.state().direction,1,'random can retain the same direction');
p=ai.update(2,{position:p});close(p[0],2*1.3);assert.equal(ai.state().direction,-1);
for(const [side,value]of [[1,.75],[-1,.25]]){const bot=createEnemyMovement(()=>value);let edge=[side*5.25,1.72,-24];edge=bot.update(.08,{position:edge});close(edge[0],side*5.246);assert.equal(bot.state().direction,-side,'reverse immediately at an arena edge');edge=bot.update(.1,{position:edge});close(edge[0],side*5.116);assert.ok(Math.abs(edge[0])<=ENEMY_MOVEMENT_LIMIT);}
const steady=createEnemyMovement(()=>.75);let at=[0,1.72,-24];for(let i=0;i<900;i++){const old=at[0];at=steady.update(1/60,{position:at,shots:[{owner:'player',p:[old,1.72,0],v:[0,0,-40],life:4}],casting:true});assert.ok(Math.abs(at[0]-old)<=1.3/60+1e-8);assert.ok(Math.abs(at[0])<=ENEMY_MOVEMENT_LIMIT);assert.equal(steady.state().dashBoost.uses,0);}
const frozen=[...at],timer=steady.state().directionTime;assert.deepEqual(steady.update(.5,{position:at,blocked:true}),frozen);close(steady.state().directionTime,timer);assert.equal(steady.state().velocity,0);
const slow=createEnemyMovement(()=>.75);close(slow.update(1,{position:[0,1.72,-24],slow:.25})[0],.325);
const heavy=createEnemyMovement(()=>.75);close(heavy.update(1,{position:[0,1.72,-24],heavy:true})[0],1.04);
const wall=createEnemyMovement(()=>.75);assert.equal(wall.update(3,{position:[0,1.72,-24],constrain:q=>[0,q[1],q[2]]})[0],0);
steady.reset();assert.equal(steady.state().directionTime,2);assert.deepEqual(steady.state().dashBoost,{ready:0,cooldown:0,dashing:0,uses:0});
const types=new Set();
for(const v of VILLAGES){
  const profile=encounterAppearance({kind:'boss',village:v.id,name:v.name,guardianForm:'beast'});types.add(profile.archetype);
  const model=createEncounterCreature(v.id),bounds=new T.Box3().setFromObject(model.root),size=bounds.getSize(new T.Vector3());
  assert.ok(size.y>2&&size.y<=4.401);assert.ok(Math.abs(bounds.min.y)<.001);assert.ok(size.x<=6.001&&size.z<=6.001);
  model.update(1,true,false,2);assert.ok(Number.isFinite(model.root.children[0].position.y));model.dispose();
  assert.equal(encounterAppearance({kind:'quest',village:v.id}).coat,v.color);
}
assert.ok(types.size>=5);assert.equal(encounterAppearance(null).kind,'duel');
console.log('PASS: continuous movement, random choice every 2s including repeated directions, immediate boundary reversal, no G, speed/control/terrain constraints and guardian models.');
