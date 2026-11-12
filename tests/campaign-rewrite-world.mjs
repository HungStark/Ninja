import assert from 'node:assert/strict';
import * as T from 'three';
import {campaignFixtures} from './campaign-fixtures.mjs';
import {createAdventureScene} from '../src/adventure-scene.js';
import {createCampaignAlly} from '../src/campaign-ally.js';
import {PLOT,WAR_VILLAGES} from '../src/campaign-plot.js';
import english from '../src/locales/campaign.en.json' with {type:'json'};
globalThis.innerWidth=1280;globalThis.innerHeight=900;
const fixtures=campaignFixtures(),world=createAdventureScene();let count=0;
for(const [id,chapter] of Object.entries(PLOT.villages)){
  const first=fixtures[id+':0'];world.load(id,first);
  for(let step=0;step<chapter.stages.length;step++){
    const save=fixtures[id+':'+step];world.syncVillageEvents(save);const item=world.interactives.find(i=>i.kind==='village-event');assert.ok(item,id+' '+step);assert.ok(!world.blocked(item.x,item.z),id+' '+step+' event must be on reachable dry ground');
    assert.equal(world.storyState().recruited,save.story.companion.recruited&&save.story.companion.phase!=='separated');
    if(chapter.stages[step].sealTrace){assert.ok(world.senseSeal());assert.ok(world.storyState().sealSense);}
    if(chapter.stages[step].rally){const actors=[];world.scene.traverse(o=>{if(o.name.startsWith('coalition-'))actors.push(o);});assert.equal(actors.length,9);assert.ok(world.scene.getObjectByName('campaign-portal'));}
    count++;
  }
}
const ally=createCampaignAlly(new T.Scene()),player={hp:20,maxHp:300,shield:0,shieldTime:0,invulnerableTime:0},foe={fighter:{hp:100},pos:[0,1.72,-10]};let damage=0;
ally.reset(true);ally.update(3,3,[foe],player,[0,1.72,7],(_,n)=>damage+=n);assert.equal(damage,6);assert.equal(player.shield,45);assert.ok(ally.state().rescued);player.shield=0;ally.update(.1,3.1,[foe],player,[0,1.72,7],()=>{});assert.equal(player.shield,0,'one rescue per battle');ally.reset(false);assert.equal(ally.state().visible,false);
function checkTranslation(vi,en,path=''){
  if(Array.isArray(vi)){if(vi.every(v=>Array.isArray(v)&&v.length===2)){assert.equal(en?.length,vi.length,path);en.forEach(s=>assert.equal(typeof s,'string'));}else vi.forEach((v,i)=>checkTranslation(v,en?.[i],path+'.'+i));}
  else if(vi&&typeof vi==='object')Object.entries(vi).forEach(([key,v])=>checkTranslation(v,en?.[key],path+'.'+key));
  else if(typeof vi==='string'&&/\.(title|body|label|feedback|speaker)$/.test(path))assert.equal(typeof en,'string',path);
}
checkTranslation(PLOT,english);assert.deepEqual(WAR_VILLAGES,['water','fire','lightning']);
console.log('PASS: '+count+' event placements on dry unblocked ground, companion presence, seal VFX, nine-village rally and portal, ally attack/rescue/reset, complete English story translation structure.');
