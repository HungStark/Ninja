import assert from 'node:assert/strict';
import '../game-core.js';
import {campaignFixtures} from './campaign-fixtures.mjs';
import {readJourney} from '../src/adventure-data.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {CINEMATIC_ROUTE,SIDE_REWARD,advanceSideStory,startSideStory,villageSideStory} from '../src/cinematic-route.js';

globalThis.innerWidth=1280;
globalThis.innerHeight=800;
const world=createAdventureScene(),fixtures=campaignFixtures();
for(const id of Object.keys(CINEMATIC_ROUTE.side)){
  let save=structuredClone(fixtures.complete);
  Object.assign(save,{village:id,position:[0,7],interior:null,surface:null,elevation:null});
  world.load(id,save);
  const guards=world.patrolState();
  assert.ok(guards.length>=2,id+' has visible patrols');
  assert.ok(guards.every(g=>!g.occupation),id+' patrols are recognized as village guards');
  for(let i=0;i<42;i++)world.update(.12,false);
  assert.ok(world.patrolState().some((g,i)=>Math.hypot(g.position[0]-guards[i].position[0],g.position[2]-guards[i].position[2])>1),id+' patrols walk');
  const story=villageSideStory(save);
  const giver=world.interactives.find(i=>i.id===story.giver);
  assert.ok(giver,id+' has an accessible side-story NPC');
  assert.equal(startSideStory(save,[giver.x,giver.z]),true);
  world.syncVillageEvents(save);
  const before=save.gold;
  for(let step=0;step<story.steps.length;step++){
    const field=world.sideRoute.state();
    assert.ok(field,id+' exposes side-story objective '+step);
    assert.equal(world.blocked(field.target[0],field.target[2]),false);
    if(field.mode==='escort')assert.ok(field.end,id+' escort has a walkable route');
    const p=world.hero.root.position;p.fromArray(field.target);
    assert.equal(world.sideRoute.start(field.entry),true);
    let result=null;
    for(let frame=0;frame<250&&!result;frame++){
      p.fromArray(world.sideRoute.state().target);
      result=world.sideRoute.update(.15,frame*.15);
    }
    assert.ok(result,id+' task completes');
    assert.ok(advanceSideStory(save,result.key,result.step,result.point));
    assert.equal(advanceSideStory(save,result.key,result.step,result.point),null);
    save=readJourney({getItem:()=>JSON.stringify(save)});
    assert.equal(villageSideStory(save).step,step+1,id+' keeps progress after loading');
    world.syncVillageEvents(save);
  }
  assert.equal(save.gold,before+SIDE_REWARD);
  assert.ok(world.scene.getObjectByName('side-story-result-'+id));
  console.log('PASS '+id+' side story and patrols');
}
for(const id of ['light','dark']){
  const save=structuredClone(fixtures[id+':0']);
  assert.equal(villageSideStory(save),null,'side story becomes available after liberation');
  world.load(id,save);assert.ok(world.patrolState().length>=2);
  assert.ok(world.patrolState().every(g=>g.occupation),'occupiers patrol until liberation');
}
