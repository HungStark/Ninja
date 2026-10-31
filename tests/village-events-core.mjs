import assert from 'node:assert/strict';
import * as T from 'three';
import {VILLAGE_EVENTS,currentVillageEvent,villageEventComplete,advanceVillageEvent,villageEventEncounter} from '../src/village-events.js';
import {newJourney,readJourney,campaignObjective,resolveBattle,findPath} from '../src/adventure-data.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {createVillageStoryActors} from '../src/village-story-actors.js';
import {planExpedition} from '../src/adventure-biomes.js';
import {createAdminSession} from '../src/adventure-access.js';
const baseline=newJourney();baseline.story.stage='infiltrate';baseline.village='fire';baseline.bosses.fire=true;const snapshot=structuredClone(baseline),session=createAdminSession(),draft=session.enter(baseline);let event;while(event=currentVillageEvent(draft))assert.ok(advanceVillageEvent(draft,'fire',event.step,{victory:!!event.battle}).ok);assert.equal(draft.story.companion.recruited,true);assert.deepEqual(baseline,snapshot);assert.deepEqual(session.leave(),snapshot,'admin recruitment never leaks into normal progress');const legacy=readJourney({getItem:()=>JSON.stringify(snapshot)});assert.equal(legacy.bosses.fire,true);assert.equal(campaignObjective(legacy).targetKind,'village-event','old cleared Fire saves can still rescue Hạ Ly');
globalThis.innerWidth=915;globalThis.innerHeight=412;
const world=createAdventureScene();
for(const [id,chapter] of Object.entries(VILLAGE_EVENTS)){
  const save=newJourney();save.story.stage='infiltrate';save.village=id;save.position=[0,7];save.campaign={treatySigned:true,deliveries:['earth','wind','light','ice','wood']};world.load(id,save);
  for(let step=0;step<chapter.stages.length;step++){
    const e=currentVillageEvent(save);assert.equal(e.step,step);assert.equal(campaignObjective(save).targetKind,'village-event');const target=world.interactives.find(i=>i.kind==='village-event');assert.ok(target,id+' has a visible story target');assert.ok(!world.blocked(target.x,target.z),id+' target is physically free');
    assert.ok(planExpedition([0,7],[target.x,target.z],{id,routes:world.routes,walk:(a,b,key)=>findPath(a,b,world.navigationBlocked(key))}),id+' story stage '+step+' reachable from village arrival');
    const position=world.hero.root.position.toArray();if(e.choices){const before=JSON.stringify(save);assert.equal(advanceVillageEvent(save,id,step,{choiceIndex:1}).ok,false);assert.equal(JSON.stringify(save),before,'wrong answer keeps progress and resources');}
    if(e.battle){assert.equal(advanceVillageEvent(save,id,step).ok,false);const encounter={kind:'village-event',village:id,...villageEventEncounter(id)};resolveBattle(save,encounter,true);const wins=save.wins;resolveBattle(save,encounter,true);assert.equal(save.wins,wins,'stale battle victory does not award twice');}
    else assert.equal(advanceVillageEvent(save,id,step).ok,true);
    world.syncVillageEvents(save);assert.deepEqual(world.hero.root.position.toArray(),position,'story refresh never moves the player');
  }
  assert.equal(villageEventComplete(save,id),true);assert.equal(save.gold,45);assert.equal(save.xp,40);assert.equal(advanceVillageEvent(save,id,chapter.stages.length-1).ok,false);const read=readJourney({getItem:()=>JSON.stringify(save)});assert.deepEqual(read.story,save.story);assert.equal(read.story.companion.recruited,id==='fire');assert.equal(world.interactives.some(i=>i.kind==='village-event'),false);
}
const save=newJourney();save.story.villageEvents.fire=4;save.story.companion.recruited=true;const scene=new T.Scene(),hero={root:new T.Group()},entries=[],actors=createVillageStoryActors({scene,hero,blocked:()=>false,floor:()=>0});actors.sync(save,'nameless',entries);assert.equal(actors.state().female,true);assert.equal(entries.filter(i=>i.kind==='companion').length,1);
for(let i=0;i<90;i++){hero.root.position.z-=.1;actors.update(1/30,i/30);}
assert.ok(actors.state().position[2]<-5,'companion really walks behind player');assert.ok(actors.state().distance<4);const position=actors.state().position;actors.sync(save,'nameless',entries);assert.deepEqual(actors.state().position,position,'quest/dialogue refresh keeps companion position');assert.equal(entries.filter(i=>i.kind==='companion').length,1);actors.update(1/30,4,false,true);assert.equal(actors.state().visible,false);actors.update(1/30,5,false,false);assert.equal(actors.state().visible,true);actors.sync(save,'water',entries);assert.equal(actors.state().recruited,true);actors.reset();assert.equal(scene.children[0].children.length,0);
const malformed=newJourney();malformed.story.villageEvents={fire:999,wood:-1,water:2.5,unknown:1};malformed.story.companion.recruited=true;assert.deepEqual(readJourney({getItem:()=>JSON.stringify(malformed)}).story.villageEvents,{});assert.equal(readJourney({getItem:()=>JSON.stringify(malformed)}).story.companion.recruited,false);
const rescue=newJourney();rescue.village='fire';rescue.position=[0,7];world.load('fire',rescue);
assert.equal(currentVillageEvent(rescue).speaker,'Bà Hồng');assert.equal(world.storyState().captive.pose,'captive');assert.ok(world.blocked(-12,22.2),'locked gate blocks movement');assert.ok(world.blocked(-14.2,20),'prison sides block movement');
const solidCount=world.solids.length;for(let i=0;i<5;i++)world.syncVillageEvents(rescue);assert.equal(world.solids.length,solidCount,'refresh replaces colliders without leaking old cells');
advanceVillageEvent(rescue,'fire',0);world.syncVillageEvents(rescue);assert.ok(world.blocked(-12,22.2),'accepting the mission keeps the gate locked');
assert.equal(advanceVillageEvent(rescue,'fire',1).ok,false);advanceVillageEvent(rescue,'fire',1,{victory:true});world.syncVillageEvents(rescue);assert.ok(!world.blocked(-12,22.2),'victory unlocks the physical gate');assert.equal(world.storyState().captive.pose,'wounded');assert.equal(world.storyState().recruited,false);assert.ok(world.blocked(-14.2,20),'side walls remain after opening the gate');
rescue.village='water';world.load('water',rescue);assert.equal(world.storyState().prison,null);assert.equal(world.solids.some(s=>s.id?.startsWith('fire-prison')),false,'travel removes all prison colliders');
console.log('PASS: nine four-stage chapters, wrong choices/retry, battle requirements, unique rewards, save/reload, all 36 targets reachable without moving player on refresh, persistent female companion walking/travel/disposal and sanitized legacy state.');
