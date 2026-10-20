import assert from 'node:assert/strict';
import {VILLAGES,village,newJourney,readJourney,resolveBattle,findPath,discoverZone,mentorReady,completeLesson} from '../src/adventure-data.js';
import {REGIONS,WORLD_LIMIT,GATE_RADIUS,ARRIVAL_RADIUS,terrainHeight} from '../src/adventure-world.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {planExpedition} from '../src/adventure-biomes.js';
import '../game-core.js';
globalThis.innerWidth=1440;globalThis.innerHeight=960;
assert.equal(VILLAGES.length,10);
for(const v of VILLAGES)for(const id of v.links)assert.ok(village(id).links.includes(v.id),`${v.id} -> ${id} must connect back`);
const seen=new Set(),visit=id=>{if(seen.has(id))return;seen.add(id);village(id).links.forEach(visit);};visit('nameless');assert.equal(seen.size,10);
const world=createAdventureScene();
const terrainSignatures=new Set(),layoutSignatures=new Set();
for(const v of VILLAGES){
  const save=newJourney();save.village=v.id;world.load(v.id,save);
  const region=REGIONS[v.id];assert.ok(region.zones.length>=4);assert.equal(region.npcs.filter(n=>n.landmark).length,region.zones.length);assert.ok(region.npcs.some(n=>n.kind==='mentor'));assert.ok(region.boss.hp>200);
  assert.ok(world.interactives.find(i=>i.kind===(v.id==='nameless'?'intro-guardian':'boss')));assert.ok(world.interactives.find(i=>i.kind==='mentor'));assert.equal(world.interactives.filter(i=>i.kind==='landmark').length,region.zones.length);
  const heights=[];for(let x=-60;x<=60;x+=12)for(let z=-60;z<=60;z+=12)heights.push(terrainHeight(v.id,x,z));
  assert.ok(Math.max(...heights)-Math.min(...heights)>3,`${v.id}: landscape needs elevation changes`);
  terrainSignatures.add(heights.map(n=>n.toFixed(1)).join(','));layoutSignatures.add(JSON.stringify(region.houses));
  for(const i of world.interactives){const plan=planExpedition([0,7],[i.x,i.z],{id:v.id,routes:world.routes,targetSurface:i.platform,walk:(a,b,key)=>findPath(a,b,world.navigationBlocked(key))});assert.ok(plan,`${v.id}: cannot reach ${i.kind}/${i.id}`);}
  // Arrival at each reciprocal gate must permit walking into the village core.
  for(const gate of world.gates){const p=[gate.x*world.metrics.arrivalRadius/world.metrics.gateRadius,gate.z*world.metrics.arrivalRadius/world.metrics.gateRadius];assert.equal(world.blocked(...p),false,`${v.id} arrival from ${gate.id}`);assert.ok(planExpedition(p,[0,7],{id:v.id,routes:world.routes,walk:(a,b,key)=>findPath(a,b,world.navigationBlocked(key))}));}
  assert.equal(world.blocked(WORLD_LIMIT+1,0),true);
  const lesson=newJourney();lesson.village=v.id;if(v.id==='nameless')lesson.campaign.treatySigned=true;assert.equal(mentorReady(lesson,v.id),false);assert.equal(completeLesson(lesson,v.id).learned,false);lesson.lessons[v.id]=1;
  for(const id of region.mentor.zoneIds){assert.equal(discoverZone(lesson,v.id,id),true);assert.equal(discoverZone(lesson,v.id,id),false);}
  assert.equal(mentorReady(lesson,v.id),true);assert.equal(completeLesson(lesson,v.id).learned,true);assert.ok(lesson.learnedSpells.some(id=>id.startsWith(v.id==='nameless'?'wind-':v.id+'-')));const learnedCount=lesson.learnedSpells.length;
  completeLesson(lesson,v.id);assert.equal(lesson.learnedSpells.length,learnedCount);assert.equal(lesson.quests[v.id],undefined,'learning must not require combat');
  const boss={kind:'boss',village:v.id};resolveBattle(lesson,boss,true);assert.equal(lesson.bosses[v.id],true);const gold=lesson.gold;assert.equal(gold,100000+region.boss.rewardGold);resolveBattle(lesson,boss,true);assert.equal(lesson.gold,gold,'boss rewards cannot be farmed');
  const restored=readJourney({getItem:()=>JSON.stringify(lesson)});assert.equal(restored.bosses[v.id],true);assert.equal(restored.mentors[v.id],true);assert.equal(restored.discoveries.length,2);assert.ok(region.boss.rewardSpells.every(id=>restored.learnedSpells.includes(id)||restored.progression.books.includes(id)));
}
assert.equal(terrainSignatures.size,10);assert.equal(layoutSignatures.size,10);
const cornerRoute=findPath([0,0],[1,1],(x,z)=>(x===1&&z===0)||(x===0&&z===1));assert.ok(cornerRoute.length>2);assert.ok([[-1,0],[0,-1]].some(p=>p[0]===cornerRoute[0][0]&&p[1]===cornerRoute[0][1]),'route must walk around a blocked corner');
assert.deepEqual(findPath([0,0],[2,2],(x,z)=>x===2&&z===2),[]);
assert.deepEqual(findPath([0,0],[2.4,2],x=>x>2.3),[],'a fractional click inside a solid object cannot use its free rounded cell');
const fighter=new SealGameCore.Fighter();fighter.autoRestore=false;assert.equal(fighter.receive(1001).defeated,true);assert.equal(fighter.hp,0);
const practiceFighter=new SealGameCore.Fighter();assert.equal(practiceFighter.receive(1001).restored,true);assert.equal(practiceFighter.hp,200);
const save=newJourney('<Ninja>');save.quests.nameless=1;const encounter={kind:'quest',village:'nameless'};
resolveBattle(save,encounter,true);assert.equal(save.quests.nameless,2);assert.equal(save.gold,100060);save.checkpoint='water';save.village='dark';resolveBattle(save,encounter,false);assert.equal(save.village,'water');assert.deepEqual(save.position,[0,7]);assert.equal(save.gold,100060);
const read=data=>readJourney({getItem:()=>JSON.stringify(data)});
assert.equal(read({...save,version:2}),null);assert.equal(read({...save,checkpoint:'missing'}),null);
const restored=read({...save,position:[Infinity,3],gold:-4,visited:['missing','water'],hero:{name:'旅人',coat:'bad',hair:'bad'}});assert.deepEqual(restored.position,[0,7]);assert.equal(restored.gold,0);assert.equal(restored.hero.coat,'#211e25');assert.deepEqual(restored.visited,['nameless','water']);assert.ok(restored.activated.includes('water'));
const far=newJourney();far.position=[62,-61];assert.deepEqual(read(far).position,[62,-61]);
const legacy={...newJourney()};delete legacy.learnedSpells;delete legacy.progression;delete legacy.discoveries;delete legacy.lessons;delete legacy.mentors;delete legacy.bosses;assert.equal(read(legacy).learnedSpells.length,45);
console.log('PASS: ten distinct expanded terrain/layouts, forty reachable districts, fixed NPCs and bosses, peaceful lessons with usable spell rewards, one-time boss rewards, all gates, collision and old/new save recovery.');
