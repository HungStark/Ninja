import assert from 'node:assert/strict';
import * as T from 'three';
import {REGIONS,isDeepWater} from '../src/adventure-world.js';
import {newJourney,findPath} from '../src/adventure-data.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {createVillager} from '../src/villager.js';
import {villagerAppearance} from '../src/villager-appearance.js';
import {dialogueCast,conversationLines} from '../src/adventure-dialogue.js';
import {village} from '../src/adventure-data.js';
globalThis.innerWidth=1440;globalThis.innerHeight=960;
const world=createAdventureScene(),jobs=new Set();let count=0;
for(const [id,r] of Object.entries(REGIONS)){
 const save=newJourney();save.village=id;world.load(id,save);const residents=world.residentsState();assert.equal(residents.length,r.zones.length);
 assert.equal(new Set(r.npcs.map(p=>p.id)).size,r.npcs.length);
 for(const entry of residents){
  const person=r.npcs.find(p=>p.id===entry.id),interactive=world.interactives.find(p=>p.id===entry.id),profile=villagerAppearance(id,person),zone=r.zones.find(z=>z.id===person.landmark),[x,y,z]=entry.position;
  assert.ok(person.name&&person.role&&person.dialogue);assert.deepEqual([interactive.x,interactive.y,interactive.z],[x,y,z]);assert.equal(world.navigationBlocked(person.platform)(x,z),false,`${entry.id}: resident must stand on accessible ground`);
  if(id==='water')assert.equal(isDeepWater(x,z),false,`${entry.id}: cannot sink in the river`);
  const route=person.platform?world.routes.find(r=>r.platform?.id===person.platform):null,start=route?route.to:[zone.x,zone.z];assert.ok(findPath(start,[x,z],world.navigationBlocked(person.platform)).length||Math.hypot(start[0]-x,start[1]-z)<2,`${entry.id}: landmark has an approach`);
  if(route)assert.ok(Math.abs(y-route.toY)<.2);if(person.elevation!==undefined)assert.equal(y,person.elevation);
  const model=createVillager(profile);jobs.add(profile.job);let triangles=0,draws=0;model.root.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;draws++;}});assert.ok(triangles<4000);assert.ok(draws<90);
  model.update(.2,false);const pose=model.arms.map(a=>a.rotation.x),face=model.head.rotation.y;model.update(1.1,false);assert.ok(model.arms.some((a,i)=>Math.abs(a.rotation.x-pose[i])>.0001)||Math.abs(model.head.rotation.y-face)>.0001,entry.id+' has a live activity');model.root.updateMatrixWorld(true);model.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));
  const cast=dialogueCast(interactive,save,r,village(id));assert.equal(cast.npc.id,person.id);assert.ok(conversationLines(interactive,save,cast,person.dialogue).some(l=>l.text===person.dialogue));count++;
 }
 const first=world.residentsState().map(p=>[p.id,p.position]);world.update(.3,false);world.load(id,save);assert.deepEqual(world.residentsState().map(p=>[p.id,p.position]),first,'fixed positions survive village reload without duplicates');
}
assert.equal(count,64);assert.ok(jobs.size>=15);assert.equal(REGIONS.nameless.npcs.find(p=>p.landmark==='war-cemetery').activity,'mourning');assert.equal(REGIONS.fire.npcs.find(p=>p.landmark==='forge').activity,'forging');
console.log('PASS: 64 fixed residents across all ten villages and every landmark; distinct activities, roles/dialogue/portraits, navigable dry ground and upper platforms, animated models, geometry budgets, deterministic reload without duplicates.');
