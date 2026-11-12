import assert from 'node:assert/strict';
import '../game-core.js';
import {newJourney,readJourney,campaignObjective,campaignStage,canTravel,resolveBattle,canSignTreaty,signTreaty} from '../src/adventure-data.js';
import {promiseMother,chooseStarter,reportGuardian,negotiatePeace} from '../src/journey-story.js';
import {VILLAGE_EVENTS,currentVillageEvent,advanceVillageEvent,villageEventEncounter} from '../src/village-events.js';
import {PLOT,PLOT_ORDER,WAR_VILLAGES,ALLIANCE_VILLAGES,acceptAlliance,companionPresent,invasionAvailable} from '../src/campaign-plot.js';
import {orderGuardianGuards} from '../src/village-confrontation.js';
import {requiresGuardBattle} from '../src/combat-experience.js';
import {encounterAppearance} from '../src/encounter-appearance.js';
const load=s=>readJourney({getItem:()=>JSON.stringify(s)});let save=newJourney();
assert.equal(PLOT.chapters.length,5);assert.ok(PLOT.opening.some(([,t])=>t.includes('hàng vạn')));assert.ok(PLOT.villages.dark.stages[1].script.some(([,t])=>t.includes('từng giết cô')));
assert.equal(canTravel(save,'water').allowed,false);promiseMother(save);chooseStarter(save,'fire-volley');resolveBattle(save,{kind:'intro-trio',village:'nameless'},true);assert.ok(save.story.sealCore);assert.ok(save.story.questItems.includes('nameless:seal-core'));reportGuardian(save);assert.equal(canTravel(save,'water').allowed,true);assert.equal(canTravel(save,'fire').allowed,false);
const battles=[];let stepCount=0;
for(const id of PLOT_ORDER){
  if(id==='wind'){save.village='nameless';assert.ok(canSignTreaty(save));assert.ok(signTreaty(save));assert.equal(campaignStage(save),'homecoming');assert.equal(canTravel(save,'wind').allowed,false);save.story.homecomingDone=true;}
  assert.equal(canTravel(save,id).allowed,true,id+' is unlocked in narrative order');save.village=id;
  assert.equal(campaignObjective(save).targetVillage,id);
  while(currentVillageEvent(save)){
    const event=currentVillageEvent(save),gold=save.gold;assert.equal(campaignObjective(save).targetId,`story-${id}-${event.step}`);
    if(event.choices){const before=JSON.stringify(save);assert.equal(advanceVillageEvent(save,id,event.step,{choiceIndex:1}).ok,false);assert.equal(JSON.stringify(save),before);}
    if(id==='fire'&&event.step===2)save.story.questItems.push('fire:lotus-medicine');
    if(event.sealTrace){const copy=structuredClone(save);copy.story.sealCore=false;assert.equal(advanceVillageEvent(copy,id,event.step).reason,'seal-core');}
    if(event.battle){assert.equal(advanceVillageEvent(save,id,event.step).reason,'battle');const encounter={kind:'village-event',...villageEventEncounter(id,event.step)};assert.equal(encounter.village,id);if(event.beast)assert.equal(encounterAppearance(encounter).kind,'creature');resolveBattle(save,encounter,true);const after=JSON.stringify(save);resolveBattle(save,encounter,true);assert.equal(JSON.stringify(save),after,'stale story victory is not replayed');battles.push(event.battle);}
    else assert.ok(advanceVillageEvent(save,id,event.step).ok,id+' '+event.step);
    if(event.recruit)assert.ok(companionPresent(save));if(event.separate)assert.equal(companionPresent(save),false);if(event.reconcile)assert.ok(companionPresent(save));
    save=load(save);assert.ok(save);assert.equal(save.story.villageEvents[id],event.step+1);assert.ok(save.gold>=gold);stepCount++;
  }
  if(WAR_VILLAGES.includes(id)){assert.ok(orderGuardianGuards(save));resolveBattle(save,{kind:'boss',village:id},true);assert.equal(campaignObjective(save).targetKind,'npc');assert.ok(negotiatePeace(save,id));assert.equal(negotiatePeace(save,id),false);}
  else{assert.equal(orderGuardianGuards(save),false);assert.equal(requiresGuardBattle(save,{kind:'village-guard',village:id}),false);assert.equal(save.bosses[id],undefined,'later regions do not require a chief fight');assert.equal(campaignObjective(save).targetKind,'npc');assert.ok(acceptAlliance(save,id));assert.equal(acceptAlliance(save,id),false);assert.equal(negotiatePeace(save,id),false,'later alliance role replaces seal collection');}
  save=load(save);assert.ok(save);
}
assert.deepEqual(save.story.peaceSeals,WAR_VILLAGES);assert.deepEqual(save.story.alliances,ALLIANCE_VILLAGES);assert.equal(campaignStage(save),'invasion');assert.ok(invasionAvailable(save));save.village='nameless';
while(currentVillageEvent(save)){
  const e=currentVillageEvent(save);if(e.battle){const encounter={kind:'village-event',...villageEventEncounter('nameless',e.step)};assert.equal(encounter.village,'nameless');assert.ok(encounter.coalition);resolveBattle(save,encounter,true);battles.push(e.battle);}else assert.ok(advanceVillageEvent(save,'nameless',e.step).ok);save=load(save);
}
assert.equal(campaignStage(save),'complete');assert.equal(campaignObjective(save).targetKind,'complete');assert.ok(companionPresent(save));assert.deepEqual(battles,['water-base','fire-jail','fire-general','wind-courier','wind-eagle','earth-base','gatekeeper']);
const legacy=structuredClone(save);delete legacy.story.plotVersion;legacy.story.villageEvents={water:4,fire:4,lightning:4,wind:4,earth:4,wood:4,ice:4,light:4,dark:4};legacy.bosses.dark=true;legacy.gold=876;legacy.progression.attributes.health=7;const migrated=load(legacy);assert.equal(migrated.gold,876);assert.equal(migrated.progression.attributes.health,7);assert.equal(migrated.bosses.dark,true);assert.equal(migrated.story.villageEvents.fire,4);assert.ok(companionPresent(migrated));assert.equal(migrated.story.villageEvents.dark,undefined);assert.deepEqual(migrated.story.alliances,[]);assert.notEqual(campaignStage(migrated),'complete');
console.log('PASS: five chapters, '+stepCount+' village steps, seven distinct battles, three armistices, six functional alliances, core sensing, Hạ Ly recruitment/separation/reunion, no Dark chief villain fight, invasion finale, wrong-choice and stale-reward guards, per-step save/load and legacy progress preservation.');
