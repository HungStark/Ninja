import assert from 'node:assert/strict';
import {newJourney,readJourney,VILLAGES,SAVE_KEY,mentorReady,completeLesson,resolveBattle,campaignObjective} from '../src/adventure-data.js';
import {REGIONS} from '../src/adventure-world.js';
import {BAGS,maxShurikenPurchase,buyEquipment,shurikenById,shurikenPrice} from '../src/equipment.js';
import {villageSidequests,acceptSidequest,completeSidequestTarget,claimSidequest,sidequestDone} from '../src/journey-story.js';
import {createAdventureScene} from '../src/adventure-scene.js';

const reload=save=>readJourney({getItem:key=>key===SAVE_KEY?JSON.stringify(save):null});
assert.equal(BAGS.at(-1).price,400);
for(const id of ['iron','steel','tempered','chakra'])for(const gold of [0,1,7,8,23,24,399,Infinity])for(const occupied of [0,1,43,49,50]){
  const s=newJourney();s.village='water';s.gold=gold;s.equipment.bag='pouch-240';s.equipment.ownedBags.push('pouch-240');s.equipment.ammo.iron=occupied;
  const max=maxShurikenPurchase(s,id),item=shurikenById(id),before=structuredClone(s.equipment);
  assert.ok(max>=0&&max<=50&&max<=50-occupied);
  if(max){assert.ok(shurikenPrice(item,max)<=gold);const r=buyEquipment(s,id,max);assert.ok(r.ok);assert.equal(s.equipment.ammo[id],before.ammo[id]+max);assert.equal(s.gold,gold-r.price);}
  else{assert.equal(buyEquipment(s,id,1).ok,false);assert.deepEqual(s.equipment,before);assert.equal(s.gold,gold);}
  if(max<50&&max<50-occupied)assert.ok(shurikenPrice(item,max+1)>gold);
}
for(const quantity of [0,-1,1.5,51,NaN,Infinity]){const s=newJourney();s.gold=10000;assert.equal(buyEquipment(s,'iron',quantity).ok,false);assert.equal(s.gold,10000);}
globalThis.innerWidth=1280;globalThis.innerHeight=800;
const world=createAdventureScene();
assert.equal(REGIONS.nameless.mentor,null);
assert.equal(REGIONS.nameless.npcs.find(n=>n.id==='nameless-trac').kind,'lore');
const obsolete=newJourney();obsolete.story.stage='infiltrate';obsolete.campaign.treatySigned=true;obsolete.lessons.nameless=1;obsolete.mentors.nameless=true;obsolete.story.sidequests['nameless:npc:nameless-sen']=2;obsolete.story.questItems=['nameless:npc:nameless-sen'];
const migrated=reload(obsolete);assert.equal(migrated.lessons.nameless,undefined);assert.equal(migrated.mentors.nameless,undefined);assert.equal(migrated.story.sidequests['nameless:npc:nameless-sen'],2);assert.ok(migrated.story.questItems.includes('nameless:npc:nameless-sen'));assert.ok(migrated.progression.books.includes('wind-barrier'),'keep an already earned book');assert.notEqual(campaignObjective(migrated,{localOnly:true}).targetKind,'mentor');
assert.ok(villageSidequests('wind').some(q=>q.rewardScroll==='wind-barrier'),'wind village retains the skill source');
for(const v of VILLAGES){
  let s=newJourney();s.village=v.id;world.load(v.id,s);const quests=villageSidequests(v.id);
  if(v.id==='nameless'){assert.equal(world.interactives.filter(i=>i.kind==='quest').length,1);assert.equal(world.interactives.filter(i=>i.kind==='mentor').length,0);assert.ok(!quests.some(q=>q.type==='combat'&&q.zone==='old-bridge'));}
  assert.equal(new Set(quests.map(q=>q.giver)).size,quests.length);
  assert.ok(quests.every(q=>q.giver!==REGIONS[v.id].mentor?.npcId&&!q.giver.endsWith('-chief')&&!q.giver.endsWith('-envoy')&&q.giver!=='fire-khoi'&&!q.giver.endsWith('-merchant')));
  for(const q of quests){
    assert.ok(world.interactives.some(i=>i.id===q.id),'targets exist before accepting');
    assert.ok(completeSidequestTarget(s,q));assert.equal(completeSidequestTarget(s,q),false);assert.equal(s.story.sidequests[q.id],undefined);
    s=reload(s);assert.ok(sidequestDone(s,q));assert.ok(s.story.questItems.includes(q.id));world.syncSidequests(s);
    assert.ok(!world.interactives.some(i=>i.id===q.id));
    assert.ok(acceptSidequest(s,q));assert.equal(s.story.sidequests[q.id],2);s=reload(s);assert.ok(s.story.earlyTargets.includes(q.id));
    assert.ok(claimSidequest(s,q));assert.equal(claimSidequest(s,q),false);assert.ok(!s.story.questItems.includes(q.id));
  }
  if(REGIONS[v.id].mentor){s.discoveries=REGIONS[v.id].mentor.zoneIds.map(z=>v.id+':'+z);s.campaign.treatySigned=true;
  assert.ok(mentorReady(s,v.id),'exploration before meeting mentor counts');assert.ok(completeLesson(s,v.id).completed);}else assert.equal(mentorReady(s,v.id),false);
}
let s=newJourney();s.village='fire';world.load('fire',s);
const lotus=world.scene.getObjectByName('quest-item-lotus');assert.ok(lotus?.children.length);assert.equal(lotus.position.y,36.04);
s.story.questItems.push('fire:hong-lien');s=reload(s);world.syncSidequests(s);assert.equal(lotus.parent,null);assert.ok(!world.interactives.some(i=>i.kind==='expedition-goal'));
world.load('fire',s);assert.equal(world.scene.getObjectByName('quest-item-lotus'),undefined);
s.expeditions.fire=3;s=reload(s);assert.ok(!s.story.questItems.includes('fire:hong-lien'));
s=newJourney();resolveBattle(s,{kind:'quest',village:'water',element:'water'},true);assert.equal(s.quests.water,2);assert.ok(reload(s).story.earlyVillageQuests.includes('water'));
const combatQuest=villageSidequests('water').find(q=>q.type==='combat');s=newJourney();resolveBattle(s,{kind:'sidequest',village:'water',questId:combatQuest.id,element:'water'},true);assert.ok(reload(s).story.earlyTargets.includes(combatQuest.id));const wins=s.wins;resolveBattle(s,{kind:'sidequest',village:'water',questId:combatQuest.id,element:'water'},true);assert.equal(s.wins,wins);
console.log('PASS: exact variable purchases, atomic limits, 400-coin bag, every village pre-quest target, persisted loot and early combat/survey, one reward, unique NPC tasks, early mentor exploration, visible one-time summit lotus and pre-quest main opponent.');
