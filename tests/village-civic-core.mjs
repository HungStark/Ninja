import assert from 'node:assert/strict';
import {createAdventureScene} from '../src/adventure-scene.js';
import {newJourney,readJourney,VILLAGES,findPath,resolveBattle} from '../src/adventure-data.js';
import {REGIONS,regionMetrics} from '../src/adventure-world.js';
import {hallId,HALL_STYLES} from '../src/village-civic.js';
import {INTERIORS,enterInterior,leaveInterior} from '../src/adventure-interiors.js';
import {questForNPC,villageSidequests} from '../src/journey-story.js';
import {planExpedition} from '../src/adventure-biomes.js';
import {insidePlot} from '../src/village-zoning.js';
import {advanceVillageEvent,eventSpot,currentVillageEvent,FIRE_PRISON} from '../src/village-events.js';

globalThis.innerWidth=1000;globalThis.innerHeight=700;
const world=createAdventureScene(),summaries=[];
for(const village of VILLAGES){
  const id=village.id,save=newJourney();save.village=id;save.position=[0,7];world.load(id,save);
  if(id==='nameless'){
    assert.equal(world.civic,null);assert.equal(regionMetrics(id).size,140);assert.ok(!INTERIORS[hallId(id)]);assert.equal(world.interactives.find(i=>i.kind==='npc').x,-4);assert.equal(world.interactives.find(i=>i.kind==='npc').z,5);assert.deepEqual([REGIONS[id].boss.x,REGIONS[id].boss.z],[25,-46]);assert.ok(!world.interactives.some(i=>['school','clinic'].includes(i.kind)));continue;
  }
  assert.equal(world.metrics.size,280);assert.equal(world.metrics.area,78400);
  const layout=world.civic;assert.ok(layout);assert.equal(layout.hall.style,HALL_STYLES[id]);assert.equal(layout.districts.length,1);assert.equal(layout.houses.length,20);
  assert.ok(layout.residential.area/world.metrics.area>.45&&layout.residential.area/world.metrics.area<.55);
  assert.ok(layout.houses.every(p=>insidePlot(layout.residential,p.x,p.z)));assert.ok(insidePlot(layout.residential,layout.shop.x,layout.shop.z));
  for(const a of ['hall','school','clinic'])for(const b of ['hall','school','clinic'])if(a!==b)assert.ok(Math.hypot(layout[a].x-layout[b].x,layout[a].z-layout[b].z)>100,'public institutions are separated across the village');
  for(let i=0;i<layout.houses.length;i++)for(let j=0;j<i;j++)assert.ok(Math.hypot(layout.houses[i].x-layout.houses[j].x,layout.houses[i].z-layout.houses[j].z)>=22);
  const xs=layout.houses.map(p=>p.x),zs=layout.houses.map(p=>p.z);assert.ok(Math.max(...xs)-Math.min(...xs)>100);assert.ok(Math.max(...zs)-Math.min(...zs)>100);
  for(const p of Object.values(layout.campuses)){assert.ok(world.scene.getObjectByName(p.kind+'-campus'));assert.equal(world.blocked(p.gate.x,p.gate.z),false,'estate gate stays open');}
  assert.ok(!insidePlot(layout.campuses.hall,layout.military.x,layout.military.z));assert.ok(Math.hypot(layout.campuses.hall.x-layout.military.x,layout.campuses.hall.z-layout.military.z)<75);
  assert.equal(world.scene.getObjectsByProperty('name','village-classroom-block').length,2);assert.equal(world.scene.getObjectByName('village-dormitory').userData.floors,4);assert.ok(world.scene.getObjectByName('village-functional-building'));assert.ok(world.scene.getObjectByName('village-military-barracks'));assert.ok(world.scene.getObjectByName('military-prison'));
  for(const removed of layout.removedLandmarks){assert.ok(!REGIONS[id].zones.some(z=>z.id===removed.id));assert.ok(!world.interactives.some(i=>i.kind==='landmark'&&i.id===removed.id));}
  assert.ok(world.scene.getObjectByName('village-council-hall'));assert.ok(world.scene.getObjectByName('village-school'));assert.ok(world.scene.getObjectByName('village-clinic'));
  const guards=world.guardsState();assert.equal(guards.filter(g=>g.guardRole==='gate').length,village.links.length);for(const gate of world.gates){assert.ok(world.scene.getObjectByName('gate-watch-'+gate.id));assert.equal(world.blocked(gate.x,gate.z),false,`${id} gate ${gate.id} center stays open`);}
  assert.ok(guards.filter(g=>g.guardRole==='guardian').every(g=>insidePlot(layout.campuses.hall,g.home.x,g.home.z)));assert.equal(guards.filter(g=>g.guardRole==='jailer').length,2);assert.ok(guards.filter(g=>g.guardRole==='jailer').every(g=>insidePlot(layout.military,g.home.x,g.home.z)));
  assert.ok(Math.hypot(world.boss.root.position.x-layout.hall.x,world.boss.root.position.z-layout.hall.z)<35);assert.equal(world.interactives.some(i=>i.kind==='npc'),false,'chief lives inside the hall');
  const portal=world.interactives.find(i=>i.kind==='interior-enter'&&i.id===hallId(id));assert.ok(portal);
  for(const item of world.interactives.filter(i=>i.kind==='quest'||i.kind==='traversal'&&!i.platform))assert.equal(world.blocked(item.x,item.z),false,`${id}: ${item.kind}/${item.id} clear after zoning`);
  for(const g of world.gates){const n=Math.hypot(g.x,g.z);assert.equal(world.blocked(g.x*(1-6/n),g.z*(1-6/n)),false,`${id}: arrival from ${g.id} clear`);}
  for(const fixture of world.interactives.filter(i=>['school','clinic'].includes(i.kind)||i===portal)){
    assert.equal(world.blocked(fixture.x,fixture.z),false,`${id}: ${fixture.kind} free`);
    assert.ok(planExpedition([0,7],[fixture.x,fixture.z],{id,routes:world.routes,walk:(a,b,key)=>findPath(a,b,world.navigationBlocked(key))}),`${id}: route to ${fixture.kind}`);
  }
  const healer=world.interactives.find(i=>i.kind==='healer');assert.ok(Math.hypot(healer.x-layout.clinic.entry.x,healer.z-layout.clinic.entry.z)<3);assert.equal(world.blocked(healer.x,healer.z),false);
  const standing={position:[portal.x,portal.z],surface:null,elevation:portal.y};assert.ok(enterInterior(save,portal.id,standing));world.load(id,save);assert.equal(world.interior.kind,'council');assert.equal(world.guardsState().length,0);assert.equal(world.gates.length,0);assert.equal(world.boss,null);
  const chief=world.interactives.find(i=>i.kind==='npc'),exit=world.interactives.find(i=>i.kind==='interior-exit');assert.ok(chief&&exit);
  for(const item of [chief,exit]){assert.equal(world.blocked(item.x,item.z),false);assert.ok(findPath(INTERIORS[portal.id].spawn,[item.x,item.z],world.blocked).length);}
  const chiefQuest=questForNPC(id,chief);assert.equal(chiefQuest.giver,id+'-chief');assert.ok(villageSidequests(id).some(q=>q.id===chiefQuest.id));
  const reloaded=readJourney({getItem:()=>JSON.stringify(save)});assert.deepEqual(reloaded.interior,save.interior);assert.ok(leaveInterior(save));world.load(id,save);assert.equal(world.civic,layout);assert.ok(Math.hypot(world.hero.root.position.x-portal.x,world.hero.root.position.z-portal.z)<.1);
  resolveBattle(save,{kind:'boss',village:id,element:id},true);world.load(id,save);assert.equal(world.boss.root.userData.pacified,true,'defeated guardian remains at the hall');assert.equal(world.civic,layout);summaries.push({id,houses:layout.houses.length,residentialArea:layout.residential.area,removed:layout.removedLandmarks.map(z=>z.id),style:layout.hall.style});
}
const fire=newJourney();fire.village='fire';fire.story.villageEvents.fire=1;world.load('fire',fire);assert.ok(insidePlot(world.civic.military,FIRE_PRISON.x,FIRE_PRISON.z));assert.equal(world.storyState().prison.opened,false);assert.equal(world.storyState().captive.pose,'captive');
resolveBattle(fire,{kind:'village-event',village:'fire',eventStep:1},true);assert.equal(world.resume('fire',fire),true);assert.equal(world.storyState().prison.opened,true);assert.equal(world.storyState().captive.pose,'wounded');assert.ok(!world.guardsState().some(g=>g.guardRole==='jailer'));
const medicine=eventSpot('fire',currentVillageEvent(fire));assert.ok(insidePlot(world.civic.residential,medicine.x,medicine.z));assert.ok(advanceVillageEvent(fire,'fire',2).ok);world.syncVillageEvents(fire);assert.ok(advanceVillageEvent(fire,'fire',3).recruited);world.syncVillageEvents(fire);assert.equal(world.storyState().recruited,true);assert.equal(world.storyState().captive,null);
const oldHall=newJourney();oldHall.village='fire';oldHall.interior={id:hallId('fire'),returnPosition:[0,7],returnSurface:null,returnElevation:0};assert.ok(leaveInterior(oldHall));assert.deepEqual(oldHall.position,[world.civic.hall.entry.x,world.civic.hall.entry.z]);
for(const id of ['light','dark']){const old={...newJourney(),worldRevision:2,village:id,position:[20,15]},migrated=readJourney({getItem:()=>JSON.stringify(old)});assert.deepEqual(migrated.position,[40,30]);assert.equal(migrated.worldRevision,3);assert.deepEqual(readJourney({getItem:()=>JSON.stringify(migrated)}).position,[40,30]);}
assert.equal(new Set(summaries.map(s=>s.style)).size,9);console.log(JSON.stringify(summaries));console.log('PASS: twenty sparse homes on half the map, separated gated school/hall/clinic estates, classroom wings/labs/dormitory, military district/prison/jailers, guardians inside council walls, retired landmarks and working quest targets, hall migration, Ha Ly rescue and unchanged Nameless.');
