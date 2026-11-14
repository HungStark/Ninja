import assert from 'node:assert/strict';
import * as T from 'three';
import {createAdventureScene} from '../src/adventure-scene.js';
import {campaignFixtures} from './campaign-fixtures.mjs';
import {encounterAppearance} from '../src/encounter-appearance.js';
import {ninjaProfile,createNinja} from '../src/ninja.js';
import {villageEventEncounter} from '../src/village-events.js';
import {PLOT} from '../src/campaign-plot.js';
import {CRESCENT_NINJA_STYLE} from '../src/village-ninja-style.js';
import {createInfiltration} from '../src/crescent-infiltration.js';

globalThis.innerWidth=960;globalThis.innerHeight=640;
const fixtures=campaignFixtures(),world=createAdventureScene();
for(const fps of [30,60,144])for(const carried of [false,true]){
  const save=structuredClone(fixtures['earth:report']);save.village='earth';save.position=[0,7];
  if(carried)save.story.companion.hp=0;
  world.load('earth',save);const dock=world.gates.find(g=>g.id==='wood');assert.ok(dock);
  world.hero.root.position.set(dock.x,world.heroHeightAt(dock.x,dock.z),dock.z);
  world.syncVillageEvents(save);assert.equal(world.storyState().carrying,carried);
  assert.ok(world.beginBoarding(dock));let trip;
  for(let i=0;i<fps*5;i++){
    trip=world.advanceBoarding(1/fps);world.update(1/fps,trip.walking,false,true);
    const state=world.storyState();assert.ok(state.visible);assert.ok(state.distance<=(trip.stage==='boarding'?400:3));
    if(trip.stage==='outbound'&&!carried){assert.equal(trip.companions.length,1);assert.ok(new T.Vector3(...trip.companions[0]).distanceTo(new T.Vector3(...trip.passenger))<2);assert.ok(Math.abs(state.position[1]-trip.boat[1]-.055)<.01);assert.equal(state.catchups,0);}
    if(carried)assert.equal(trip.companions.length,0,'carried companion stays attached to hero');
    if(trip.complete)break;
  }
  assert.ok(trip.complete);
  const arrival=structuredClone(save);arrival.village='wood';arrival.position=[0,7];world.load('wood',arrival);assert.ok(world.beginHarborArrival('earth'));
  for(let i=0;i<fps*5;i++){
    trip=world.advanceBoarding(1/fps);world.update(1/fps,trip.walking,false,true);
    assert.ok(world.storyState().visible);assert.ok(world.storyState().distance<3,'Ha Ly rides into Wood on the same boat');if(trip.complete)break;
  }
  assert.ok(trip.complete);assert.equal(world.harborPassageState(),null);assert.ok(world.storyState().distance<(carried?3:2));assert.equal(world.storyState().catchups,0);
  const hp=arrival.story.companion.hp;for(let i=0;i<fps;i++)world.update(1/fps,false);
  assert.equal(arrival.story.companion.hp,hp);assert.ok(world.storyState().distance<3,'follow route resumes on the destination pier');
}
let crescentFights=0;
for(const [village,chapter]of Object.entries(PLOT.villages))for(const [step,event]of chapter.stages.entries())if(event.battle){
  const encounter=villageEventEncounter(village,step);
  if(event.storyBoss||['water-base','fire-jail','fire-general','earth-base','ice-coast','light-battalion','dark-battalion'].includes(event.battle)){
    for(const member of encounter.squad||[encounter]){
      const profile=ninjaProfile(encounterAppearance(encounter.squad?{kind:'intro-trio',...member}:encounter));
      assert.equal(profile.faction,'crescent');assert.equal(profile.uniformColor,CRESCENT_NINJA_STYLE.coat);crescentFights++;
    }
  }
}
const ordinary=ninjaProfile(encounterAppearance({kind:'boss',village:'ice'}));assert.equal(ordinary.faction,undefined);
const infiltration=createInfiltration({land:new T.Group(),interactives:[],floor:()=>0});
for(const mode of ['survey','tamper','ambush']){const actor=infiltration.spawn(0,0,'wind',mode);assert.equal(actor.profile.faction,'crescent');assert.equal(actor.profile.uniformColor,CRESCENT_NINJA_STYLE.coat);assert.equal(actor.profile.id,'crescent-infiltrator');}infiltration.clear();
const crescent=createNinja(encounterAppearance({kind:'infiltrator',element:'fire'}));assert.ok(crescent.root.getObjectByName('crescent-legion-emblem'));crescent.dispose();
console.log('PASS: Earth → Wood companion boarding/sailing/disembarking at 30/60/144 fps, carried companion, follow reset and '+crescentFights+' Crescent combat uniforms; regular guardians keep village uniforms.');
