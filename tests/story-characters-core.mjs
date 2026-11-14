import assert from 'node:assert/strict';
import {campaignFixtures} from './campaign-fixtures.mjs';
import {PLOT} from '../src/campaign-plot.js';
import {campaignLines,heroSpeaker,dialogueCast} from '../src/adventure-dialogue.js';
import {campaignSpeakers,campaignSceneCast,defaultCampaignSpeaker} from '../src/campaign-characters.js';
import {currentVillageEvent} from '../src/village-events.js';
import {portraitKey} from '../src/portrait-key.js';
import {portraitPresets} from '../src/portrait-presets.js';
import {PORTRAIT_IMAGES} from '../src/portrait-images.js';
import {REGIONS} from '../src/adventure-world.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {enterInterior} from '../src/adventure-interiors.js';

const fixtures=campaignFixtures(),presets=new Map(portraitPresets());let checked=0;
for(const [id,chapter] of Object.entries(PLOT.villages))for(const [step] of chapter.stages.entries()){
  const save=fixtures[id+':'+step],event=currentVillageEvent(save,id),cast=campaignSceneCast(save,id,event);
  const lines=event.script?campaignLines(event.script,save,id):[{speaker:defaultCampaignSpeaker(save,id,event)}];
  for(const {speaker} of lines){
    if(speaker.sceneCharacter)assert.ok(cast.some(s=>s.id===speaker.id),'Scene includes '+id+':'+step+' '+speaker.id);
    if(!speaker.appearance)continue;
    const key=portraitKey(speaker),preset=presets.get(key);assert.ok(PORTRAIT_IMAGES[key],'Exact baked portrait exists: '+key);assert.ok(preset);
    if(preset.profile)assert.deepEqual(preset.profile,speaker.appearance,'Portrait and actor share their full profile: '+key);
    checked++;
  }
  const thoughts=campaignLines([['narrator','Ta nhớ.'],['memory','Ta hiểu.']],save,id);
  for(const line of thoughts){assert.equal(line.speaker.id,'hero');assert.ok(line.speaker.thought);assert.equal(portraitKey(line.speaker),portraitKey(heroSpeaker(save)));}
  assert.equal(thoughts[0].speaker.name,'Suy nghĩ nội tâm');
}
const mother=campaignSpeakers(fixtures.homecoming,'nameless').mother;
assert.equal(mother.appearance.id,'nameless-resident-war-cemetery');assert.equal(mother.appearance.female,true);
assert.equal(campaignSpeakers(fixtures['wood:1'],'wood').guide.appearance.female,true);
assert.equal(campaignSpeakers(fixtures['ice:2'],'ice').mage.appearance.female,true);
const shop=dialogueCast({kind:'shop'},fixtures['water:0'],REGIONS.water,{id:'water',name:'Làng Thủy'});assert.equal(shop.npc.appearance.id,'shopkeeper');

globalThis.innerWidth=1280;globalThis.innerHeight=900;const world=createAdventureScene();
for(const key of ['ice:2','wood:2','fire:4','dark:8','nameless:1']){
  const save=structuredClone(fixtures[key]),event=currentVillageEvent(save);if(event.requiresTournament)save.arena.completedRuns=1;
  if(event.interior)enterInterior(save,event.interior,{position:[0,7],surface:null,elevation:0});world.load(save.village,save);
  const visible=world.storyState().cast;
  for(const speaker of campaignSceneCast(save,save.village,event)){
    const actor=visible.find(a=>a.id===speaker.id);assert.ok(actor,key+' has '+speaker.name);assert.ok(actor.visible);assert.deepEqual(actor.appearance,speaker.appearance);
  }
  if(key==='dark:8')assert.equal(world.storyState().visible,false,'Ha Ly waits outside the private confession');
}
const before=world.storyState().cast.length,speakers=campaignSpeakers(fixtures['nameless:1'],'nameless');world.stageDialogue([speakers.mage]);assert.ok(world.storyState().cast.some(a=>a.id===speakers.mage.id));world.endDialogue();assert.equal(world.storyState().cast.length,before,'Temporary scene actors are removed after dialogue');
const bad=structuredClone(fixtures['nameless:1']);Object.assign(bad.story.companion,{sacrificed:true,hp:0});assert.ok(!campaignSceneCast(bad).some(s=>s.id==='ha-ly'));
console.log('PASS: '+checked+' dialogue appearances share exact actor/portrait profiles, all story scripts have their physical cast, inner thoughts use the hero portrait, named NPC identities, five rendered scene plans and private/bad-ending exclusions.');
