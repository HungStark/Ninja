import assert from 'node:assert/strict';
import {VILLAGES,village,newJourney,readJourney,resolveBattle,findPath} from '../src/adventure-data.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import '../game-core.js';
globalThis.innerWidth=1440;globalThis.innerHeight=960;
assert.equal(VILLAGES.length,10);
for(const v of VILLAGES)for(const id of v.links)assert.ok(village(id).links.includes(v.id),`${v.id} -> ${id} must connect back`);
const seen=new Set(),visit=id=>{if(seen.has(id))return;seen.add(id);village(id).links.forEach(visit);};visit('nameless');assert.equal(seen.size,10);
const world=createAdventureScene();
for(const v of VILLAGES){
  const save=newJourney();save.village=v.id;world.load(v.id,save);
  for(const i of world.interactives){const route=findPath([0,7],[i.x,i.z],world.blocked);assert.ok(route.length,`${v.id}: cannot reach ${i.kind}/${i.id}`);for(const p of route)assert.equal(world.blocked(...p),false);}
  // Arrival at each reciprocal gate must permit walking into the village core.
  for(const gate of world.gates){const p=[gate.x*19/23,gate.z*19/23];assert.equal(world.blocked(...p),false,`${v.id} arrival from ${gate.id}`);assert.ok(findPath(p,[0,7],world.blocked).length);}
}
assert.deepEqual(findPath([0,0],[1,1],(x,z)=>(x===1&&z===0)||(x===0&&z===1)).slice(0,1),[[-1,0]],'route must walk around a blocked corner');
assert.deepEqual(findPath([0,0],[2,2],(x,z)=>x===2&&z===2),[]);
assert.deepEqual(findPath([0,0],[2.4,2],x=>x>2.3),[],'a fractional click inside a solid object cannot use its free rounded cell');
const fighter=new SealGameCore.Fighter();fighter.autoRestore=false;assert.equal(fighter.receive(1001).defeated,true);assert.equal(fighter.hp,0);
const practiceFighter=new SealGameCore.Fighter();assert.equal(practiceFighter.receive(1001).restored,true);assert.equal(practiceFighter.hp,1000);
const save=newJourney('<Ninja>');save.quests.nameless=1;const encounter={kind:'quest',village:'nameless'};
resolveBattle(save,encounter,true);assert.equal(save.quests.nameless,2);assert.equal(save.gold,60);save.checkpoint='water';save.village='dark';resolveBattle(save,encounter,false);assert.equal(save.village,'water');assert.deepEqual(save.position,[0,7]);assert.equal(save.gold,60);
const read=data=>readJourney({getItem:()=>JSON.stringify(data)});
assert.equal(read({...save,version:2}),null);assert.equal(read({...save,checkpoint:'missing'}),null);
const restored=read({...save,position:[Infinity,3],gold:-4,visited:['missing','water'],hero:{name:'旅人',coat:'bad',hair:'bad'}});assert.deepEqual(restored.position,[0,7]);assert.equal(restored.gold,0);assert.equal(restored.hero.coat,'#345c63');assert.deepEqual(restored.visited,['nameless','water']);assert.ok(restored.activated.includes('water'));
console.log('PASS: ten-map connected graph, all gates/NPCs/save points reachable, reciprocal arrivals, solid collision/corner avoidance, quest rewards, respawn and sanitized save recovery.');
