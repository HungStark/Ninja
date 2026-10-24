import assert from 'node:assert/strict';
import '../game-core.js';
import {newJourney,readJourney,resolveBattle,canTravel,campaignObjective,canSignTreaty,signTreaty,deliverTreaty,CAMPAIGN_REGIONS,findPath} from '../src/adventure-data.js';
import {promiseMother,chooseStarter,reportGuardian,negotiatePeace,STARTER_CHOICES,INTRO_SQUAD,MOTHER_ID,HOME,villageSidequests,acceptSidequest,completeSidequestTarget,claimSidequest,villageGuards,questForNPC,sidequestReward} from '../src/journey-story.js';
import {systemLevel,encounterProfile,learnFromBook,gainExperience} from '../src/progression.js';
import {REGIONS} from '../src/adventure-world.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {planExpedition} from '../src/adventure-biomes.js';
import {guardianPhaseHealth,GUARDIAN_ARTS} from '../src/guardian-arts.js';
import {currentVillageEvent,advanceVillageEvent} from '../src/village-events.js';
function finishChapter(s,id){let e;while(e=currentVillageEvent(s,id))assert.ok(advanceVillageEvent(s,id,e.step,{victory:!!e.battle}).ok);}
const read=s=>readJourney({getItem:()=>JSON.stringify(s)});
assert.equal(SealGameCore.spells.find(s=>s.id==='lightning-lance').damage,22);
for(const choice of STARTER_CHOICES){
 const s=newJourney();assert.deepEqual(s.learnedSpells,[]);assert.equal(systemLevel(s.progression,'water'),0);assert.deepEqual(s.position,HOME.spawn);assert.equal(canTravel(s,'water').allowed,false);assert.equal(campaignObjective(s).targetId,MOTHER_ID);
 assert.equal(chooseStarter(s,choice.id),false);assert.equal(promiseMother(s),true);assert.equal(promiseMother(s),false);assert.equal(chooseStarter(s,choice.id),true);assert.equal(chooseStarter(s,'water-barrier'),false);assert.deepEqual(s.learnedSpells,[choice.id]);assert.equal(s.equipment.ammo.iron,10);assert.equal(systemLevel(s.progression,choice.element),1);assert.deepEqual(read(s).learnedSpells,[choice.id]);
 resolveBattle(s,{kind:'intro-trio',village:'nameless'},false);assert.equal(s.story.stage,'guardian');resolveBattle(s,{kind:'intro-trio',village:'nameless'},true);assert.equal(s.story.stage,'report');assert.equal(s.story.guardianRestored,true);const cash=s.gold;resolveBattle(s,{kind:'intro-trio',village:'nameless'},true);assert.equal(s.gold,cash);assert.deepEqual(s.learnedSpells,[choice.id]);
 const earnedXp={...s.progression.xp};assert.equal(reportGuardian(s),true);assert.equal(s.gold,cash+100);assert.deepEqual(s.progression.xp,earnedXp);assert.deepEqual(new Set(s.learnedSpells),new Set(STARTER_CHOICES.map(c=>c.id)));assert.deepEqual(read(s).learnedSpells,s.learnedSpells);
 assert.equal(reportGuardian(s),false);assert.equal(s.gold,cash+100);assert.equal(s.learnedSpells.length,3);assert.deepEqual(s.progression.xp,earnedXp);
 for(const id of ['fire','lightning','water']){assert.equal(canTravel(s,id).allowed,true);s.village=id;finishChapter(s,id);resolveBattle(s,{kind:'boss',village:id},true);assert.ok(!s.story.peaceSeals.includes(id));assert.equal(campaignObjective(s).targetKind,'npc');assert.equal(negotiatePeace(s,id),true);assert.equal(negotiatePeace(s,id),false);}
 s.village='nameless';assert.equal(canSignTreaty(s),true);assert.equal(signTreaty(s),true);
 for(const id of CAMPAIGN_REGIONS){s.village=id;assert.ok(deliverTreaty(s,id));finishChapter(s,id);resolveBattle(s,{kind:'boss',village:id},true);assert.ok(negotiatePeace(s,id));}
 assert.equal(canTravel(s,'dark').allowed,true);assert.deepEqual(read(s).story,s.story);
}
// A saved report also unlocks missing systems without resetting existing experience.
const pendingReport=newJourney();promiseMother(pendingReport);chooseStarter(pendingReport,'fire-volley');pendingReport.story.stage='report';pendingReport.progression.xp.fire=200;pendingReport.progression.books=['water-barrier','fire-wall'];
assert.equal(reportGuardian(pendingReport),true);assert.deepEqual(pendingReport.progression.xp,{fire:200,water:0,lightning:0});assert.deepEqual(pendingReport.progression.books,['fire-wall']);assert.deepEqual(new Set(read(pendingReport).learnedSpells),new Set(STARTER_CHOICES.map(c=>c.id)));
assert.equal(INTRO_SQUAD.length,3);assert.ok(INTRO_SQUAD.every(n=>n.spellIds.length===1));
const old=newJourney();delete old.story;old.learnedSpells=['water-barrier'];old.progression.xp.water=0;old.bosses={water:true,fire:true};const migrated=read(old);assert.equal(migrated.story.stage,'infiltrate');assert.deepEqual([...migrated.story.peaceSeals].sort(),['fire','water']);assert.deepEqual(migrated.learnedSpells,old.learnedSpells);
globalThis.innerWidth=1440;globalThis.innerHeight=960;const world=createAdventureScene();let questCount=0;
for(const id of Object.keys(REGIONS)){
 const s=newJourney();promiseMother(s);chooseStarter(s,'water-barrier');s.story.stage='infiltrate';s.village=id;s.position=id==='nameless'?[...HOME.spawn]:[0,7];
 const quests=villageSidequests(id);questCount+=quests.length;assert.equal(new Set(quests.map(q=>q.id)).size,quests.length);for(const n of REGIONS[id].npcs)assert.ok(quests.some(q=>q.giver===n.id));
 for(const q of quests){assert.ok(acceptSidequest(s,q));assert.equal(claimSidequest(s,q),false);assert.ok(completeSidequestTarget(s,q));const before=s.gold,reward=sidequestReward(s,q);assert.ok(claimSidequest(s,q));assert.equal(claimSidequest(s,q),false);assert.equal(s.gold,before+reward.gold);if(reward.scroll)assert.ok(s.progression.books.includes(reward.scroll));}
 const unfinished=quests.slice(0,2);for(const q of unfinished)s.story.sidequests[q.id]=1;
 world.load(id,s);const routes=world.routes;
 for(const i of world.interactives.filter(i=>['sidequest-target','intro-guardian','home'].includes(i.kind)||i.id===MOTHER_ID)){
   const route=planExpedition(s.position,[i.x,i.z],{id,routes,targetSurface:i.platform,walk:(a,b,key)=>findPath(a,b,world.navigationBlocked(key))});assert.ok(route,id+': unreachable '+i.kind+'/'+i.id+' '+[i.x,i.z]);
 }
 for(const g of villageGuards(id)){const encounter={kind:'village-guard',village:id,guardId:g.id,element:id};const before=s.progression.xp[id]||0;resolveBattle(s,encounter,true);assert.ok(s.progression.xp[id]>before||s.progression.xp[id]===2100);const cash=s.gold;resolveBattle(s,encounter,true);assert.equal(s.gold,cash);}
 world.load(id,s);assert.equal(world.guardsState().length,0);assert.deepEqual(read(s).story,s.story);
 const profile=encounterProfile(s,'boss',id);assert.ok(profile.hp>=360);assert.equal(profile.phases,id==='dark'?3:2);assert.equal(guardianPhaseHealth(profile.hp,id).reduce((a,b)=>a+b),profile.hp);
 assert.equal(GUARDIAN_ARTS[id].specials.length,2);
}
assert.ok(questCount>=100);console.log('PASS: all starter choices, opening order, simultaneous trio profiles, guardian/report, negotiated seals, treaty and dark gate, legacy saves, '+questCount+' NPC quests, persistent sentries, reachable new world interactions and 2/3 guardian phases.');
