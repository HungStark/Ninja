import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {createDashBoost,BOOST_DURATION,DASH_COOLDOWN,DASH_DISTANCE,DASH_DURATION,STEP_DISTANCE,STEP_DURATION} from '../src/dash-boost.js';
import {createDashAura} from '../src/dash-aura.js';
import {createEnemyMovement} from '../src/enemy-movement.js';
const boost=createDashBoost();assert.equal(boost.arm(true),false);assert.equal(boost.arm(),true);assert.equal(boost.state().ready,BOOST_DURATION);assert.equal(boost.arm(),false);boost.tick(3);assert.equal(boost.consume(),false);assert.equal(boost.state().cooldown,0);
assert.equal(boost.arm(),true);boost.tick(2.9);assert.equal(boost.consume(),true);assert.equal(boost.state().cooldown,DASH_COOLDOWN);assert.equal(boost.state().dashing,DASH_DURATION);assert.equal(boost.consume(),false);assert.equal(boost.arm(),false);boost.tick(.2);assert.equal(boost.state().dashing,0);assert.equal(DASH_DISTANCE/DASH_DURATION,15);boost.tick(11.79);assert.equal(boost.arm(),false);boost.tick(.01);assert.equal(boost.state().cooldown,0);assert.equal(boost.arm(),true);boost.reset();assert.deepEqual(boost.state(),{ready:0,cooldown:0,dashing:0,uses:0});
const field=SealGameCore.spells.find(s=>s.id==='lightning-reflect');assert.equal(field.duration,5);assert.equal(field.cooldown,8);
for(const config of [{},{beginner:true},{heavy:true},{casting:true},{slow:.25}]){
 const ai=createEnemyMovement(()=>.5);let p=[0,1.72,0],maxSpeed=0;
 const threat={owner:'player',element:'weapon',style:'shuriken',phase:'flying',p:[0,1.72,10],v:[0,0,-10],life:3,size:.1};
 for(let i=0;i<90;i++){const old=p;p=ai.update(1/60,{position:p,shots:[threat],...config});maxSpeed=Math.max(maxSpeed,Math.abs(p[0]-old[0])*60);}
 assert.ok(Math.abs(Math.abs(p[0])-STEP_DISTANCE)<1e-7);assert.ok(maxSpeed<=STEP_DISTANCE/STEP_DURATION+1e-7);assert.equal(ai.state().dashBoost.uses,0);assert.equal(ai.state().dashBoost.cooldown,0);
}
const scene=new T.Scene(),aura=createDashAura(scene);aura.update(.1,[2,0,7],true);assert.ok(aura.state().visible);assert.equal(aura.state().wisps,8);assert.deepEqual(scene.children[0].position.toArray(),[2,0,7]);aura.update(.1,[2,0,7],false);assert.equal(aura.state().visible,false);aura.clear();
console.log('PASS: 3s charge, one dash per charge, 12s cooldown only after use, no timer drift, 3m/0.2s dash, 5s field/unchanged 8s cooldown, all bot profiles use ordinary steps without G, lightweight rising wind.');
