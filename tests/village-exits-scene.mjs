import assert from 'node:assert/strict';
import {VILLAGES,newJourney,findPath} from '../src/adventure-data.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {planExpedition} from '../src/adventure-biomes.js';
import {travelKind} from '../src/village-travel.js';
globalThis.innerWidth=1200;globalThis.innerHeight=860;
const world=createAdventureScene();
for(const v of VILLAGES){
 const save=newJourney();save.village=v.id;save.position=[0,7];world.load(v.id,save);
 for(const exit of world.gates){
  assert.equal(exit.kind,travelKind(v.id,exit.id));
  const plan=planExpedition([0,7],[exit.x,exit.z],{id:v.id,routes:world.routes,walk:(a,b,key)=>findPath(a,b,world.navigationBlocked(key))});
  assert.ok(plan,`${v.id} → ${exit.id}: walkable exit`);
  if(exit.kind==='dock')assert.ok(exit.board.every(Number.isFinite));
 }
 const roads=[];world.scene.traverse(o=>{if(/^(village-road|worn-earth-road|neighborhood-footpath)$|neighborhood-lane|courtyard-paving/.test(o.name))roads.push(o.name);});assert.deepEqual(roads,[]);
 console.log('CHECK: accessible exits and natural ground in '+v.id);
}
console.log('PASS: every village exit is reachable from the village center, all island links have harbors, and all ten villages use ground without rendered roads.');
