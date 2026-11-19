import assert from 'node:assert/strict';
import '../game-core.js';
import {campaignFixtures} from './campaign-fixtures.mjs';
import {campaignObjective,findPath,newJourney,readJourney} from '../src/adventure-data.js';
import {chooseStarter,promiseMother} from '../src/journey-story.js';
import {currentVillageEvent,advanceVillageEvent} from '../src/village-events.js';
import {completeFieldTask,FIELD_ROUTE,FIELD_ROUTE_REVISION,fieldMission} from '../src/field-route.js';
import {createAdventureScene} from '../src/adventure-scene.js';

globalThis.innerWidth=1280;
globalThis.innerHeight=800;
const world=createAdventureScene(),fixtures=campaignFixtures();

function playTask(save){
  const state=world.fieldRoute.state();
  assert.ok(state,'field task exists at '+save.village);
  assert.equal(world.blocked(state.target[0],state.target[2]),false);
  const p=world.hero.root.position;
  p.fromArray(state.target);
  assert.ok(world.fieldRoute.start(state.entry));
  if(state.mode==='hold'){
    world.fieldRoute.update(.5,.5);
    const progress=world.fieldRoute.state().progress;
    p.x+=8;assert.equal(world.fieldRoute.update(.5,1),null);
    assert.equal(world.fieldRoute.state().progress,progress,'moving away pauses the action');
    p.fromArray(state.target);
  }
  if(state.mode==='escort'||state.mode==='chase')assert.ok(state.end,'a moving task has a walkable destination');
  if(state.mode==='escort'){
    p.x+=10;world.fieldRoute.update(1,1);
    assert.deepEqual(world.fieldRoute.state().target,state.target,'escorted actor waits when the player leaves');
  }
  let done=null;
  for(let i=0;i<350&&!done;i++){
    if(state.mode!=='hold')p.fromArray(world.fieldRoute.state().target);
    done=world.fieldRoute.update(.1,i*.1);
  }
  assert.ok(done,'task can finish');
  assert.ok(completeFieldTask(save,done.key,done.step));
  assert.equal(completeFieldTask(save,done.key,done.step),null,'same completion cannot reward twice');
  world.syncVillageEvents(save);
}

let opening=newJourney();opening.story.fieldRouteRevision=FIELD_ROUTE_REVISION;
promiseMother(opening);chooseStarter(opening,'water-barrier');world.load('nameless',opening);
assert.equal(campaignObjective(opening).targetKind,'field-task');
assert.ok(world.scene.getObjectByName('bridge-repair-site'));
playTask(opening);
opening=readJourney({getItem:()=>JSON.stringify(opening)});
assert.equal(fieldMission(opening).step,1,'save remembers the completed field task');
world.load('nameless',opening);
for(let i=1;i<FIELD_ROUTE.opening.steps.length;i++)playTask(opening);
assert.equal(campaignObjective(opening).targetKind,'intro-guardian');
assert.ok(world.scene.getObjectByName('bridge-reinforced'));
assert.equal(opening.gold,35);
const walkers=world.residentRouteState();
assert.ok(walkers.length>=2);
world.hero.root.position.set(0,world.heightAt(0,0),0);
for(let i=0;i<48;i++)world.update(.25,false);
assert.ok(world.residentRouteState().some((w,i)=>Math.hypot(w.position[0]-walkers[i].position[0],w.position[2]-walkers[i].position[2])>1));
const paused=world.residentRouteState().map(w=>w.position);
world.update(2,false,false,true);
assert.deepEqual(world.residentRouteState().map(w=>w.position),paused);

for(const key of Object.keys(FIELD_ROUTE.events)){
  const save=structuredClone(fixtures[key]);
  assert.ok(save,key);save.story.fieldRouteRevision=FIELD_ROUTE_REVISION;
  if(key==='fire:2')save.story.questItems=[];
  const event=currentVillageEvent(save);
  assert.equal(advanceVillageEvent(save,save.village,event.step,{victory:!!event.battle}).reason,'field');
  world.load(save.village,save);
  assert.equal(campaignObjective(save).targetKind,'field-task',key);
  for(const task of FIELD_ROUTE.events[key].steps){
    const start=world.fieldRoute.state()?.target;
    assert.ok(start,key+' '+task.mode);
    const p=world.hero.root.position;
    if(save.village!=='water')assert.ok(Math.hypot(p.x-start[0],p.z-start[2])<3||findPath([p.x,p.z],[start[0],start[2]],world.blocked).length,key+' '+task.mode+' is reachable');
    playTask(save);
  }
  const result=advanceVillageEvent(save,save.village,event.step,{choiceIndex:Math.max(0,event.choices?.findIndex(c=>c.correct)??0),victory:!!event.battle});
  assert.equal(result.ok,true,key);
  if(key==='fire:2')assert.ok(save.story.questItems.includes('fire:lotus-medicine'));
}
console.log('PASS: Vô Danh rescue, mobile task paths, chase, hold and escort behavior, persistent progress, moving residents, and field actions across all ten villages.');
