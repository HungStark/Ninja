import assert from 'node:assert/strict';
import '../game-core.js';
import {guardianElementMultipliers} from '../src/guardian-element-balance.js';
import {newJourney,readJourney} from '../src/adventure-data.js';
import {brewHongLienMedicine,advanceVillageEvent} from '../src/village-events.js';
import {REGIONS} from '../src/adventure-world.js';
import {villageSidequests,MOTHER_ID} from '../src/journey-story.js';
const {Fighter}=globalThis.SealGameCore;
for(const village of ['fire','water','lightning','earth','wind','light','ice','wood','dark']){
  const fighter=new Fighter(10000);fighter.incomingElementMultipliers=guardianElementMultipliers(village);
  for(const element of Object.keys(fighter.incomingElementMultipliers)){
    const before=fighter.hp,result=fighter.receive(100,false,false,element);
    assert.ok(Math.abs(result.damage-(element===village?110:90))<1e-8);
    assert.ok(Math.abs(before-fighter.hp-result.damage)<1e-8);
  }
  assert.equal(fighter.receive(100,false,false,'weapon').damage,100);
  fighter.shield=100;const result=fighter.receive(100,false,false,village);assert.equal(result.absorbed,100);assert.ok(Math.abs(result.damage-10)<1e-8);
}
const normal=new Fighter(1000);assert.equal(normal.receive(100,false,false,'fire').damage,100);
normal.incomingElementMultipliers=guardianElementMultipliers('nameless');assert.equal(normal.receive(100,false,false,'wind').damage,100);
for(const [village,region]of Object.entries(REGIONS)){
  const quests=villageSidequests(village);assert.ok(quests.every(q=>!q.giver.endsWith('-merchant')));
  for(const npc of region.npcs){
    const special=npc.id===MOTHER_ID||npc.id===region.mentor?.npcId||npc.id==='fire-khoi';
    assert.equal(quests.filter(q=>q.giver===npc.id).length,special?0:1,npc.id);
  }
}
for(const early of [false,true]){
  let save=newJourney();save.village='fire';save.story.villageEvents.fire=2;
  assert.equal(advanceVillageEvent(save,'fire',2).reason,'medicine');
  assert.equal(brewHongLienMedicine(save),false);
  save.story.questItems.push('fire:hong-lien');if(!early)save.expeditions.fire=2;
  save=readJourney({getItem:()=>JSON.stringify(save)});
  assert.equal(brewHongLienMedicine(save),true);assert.equal(brewHongLienMedicine(save),false);
  assert.ok(!save.story.questItems.includes('fire:hong-lien'));assert.ok(save.story.questItems.includes('fire:lotus-medicine'));
  assert.equal(advanceVillageEvent(save,'fire',2).ok,true);
  save=readJourney({getItem:()=>JSON.stringify(save)});
  assert.equal(advanceVillageEvent(save,'fire',3).recruited,true);
  assert.ok(!save.story.questItems.includes('fire:lotus-medicine'));assert.equal(advanceVillageEvent(save,'fire',3).ok,false);
}
const legacy=newJourney();legacy.village='fire';legacy.story.villageEvents.fire=3;
assert.equal(readJourney({getItem:()=>JSON.stringify(legacy)}).story.villageEvents.fire,2);
legacy.expeditions.fire=3;const migrated=readJourney({getItem:()=>JSON.stringify(legacy)});
assert.equal(migrated.story.villageEvents.fire,3);assert.ok(migrated.story.questItems.includes('fire:lotus-medicine'));
console.log('PASS: elemental guardian damage, weapon/shield behavior, one task per resident, no merchant tasks, required lotus medicine, early collection, one-time crafting/healing and old-save migration.');
