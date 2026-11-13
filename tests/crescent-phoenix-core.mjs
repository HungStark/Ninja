import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {campaignFixtures} from './campaign-fixtures.mjs';
import {newJourney,readJourney,resolveBattle} from '../src/adventure-data.js';
import {companionPresent,PLOT_VERSION,PLOT} from '../src/campaign-plot.js';
import {villageGuards} from '../src/journey-story.js';
import {encounterProfile} from '../src/progression.js';
import {configureOpponent} from '../src/opponent-balance.js';
import {infiltratorEncounter,createInfiltration,infiltrationLimit} from '../src/crescent-infiltration.js';
import {sacrificeForHero,storyEnding} from '../src/phoenix-blessing.js';
import {companionUnconscious,carryingCompanion,healCompanion,treatCompanion,syncCompanionGrowth} from '../src/companion-health.js';
import {currentVillageEvent,villageEventEncounter,advanceVillageEvent} from '../src/village-events.js';
import {challengeJailer} from '../src/military-jailer.js';
import {requiresGuardBattle} from '../src/combat-experience.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {createCampaignAlly} from '../src/campaign-ally.js';
const f=campaignFixtures();assert.equal(PLOT_VERSION,4);assert.ok(PLOT.opening.slice(0,-1).every(([key,line])=>key!=='unknown'&&!line));
for(const [id,chapter]of Object.entries(PLOT.villages))if(id!=='dark')for(const event of chapter.stages)assert.ok((event.script||[]).every(([key,line])=>key!=='hero'||!/kiếp trước|trùng sinh/i.test(line)),'past-life secret must remain internal before the private leader conversation');
assert.equal(PLOT.guardianSaved.find(([,line])=>line.includes('Một tương lai'))[0],'memory');
assert.equal(villageGuards('wind').filter(g=>g.guardRole==='hidden').length,3);assert.equal(villageGuards('earth').filter(g=>g.guardRole==='hidden').length,3);assert.equal(infiltrationLimit('wind'),4);
for(const id of ['nameless','water','fire','lightning','wind','earth','wood','ice','light','dark'])assert.equal(villageGuards(id).filter(g=>g.guardRole==='jailer').length,id==='fire'?2:1);
for(const id of ['wind','earth','wood','ice']){
 const s=f[id+':0'],e=infiltratorEncounter(s,{id:'test',element:id,mode:'ambush'}),guard=configureOpponent({...encounterProfile(s,'village-guard',id),kind:'village-guard',village:id});
 for(const key of ['hp','spellIds','balanceStages','damageMultiplier','restTime','weaponInterval','sealDelay','rank','moveSpeed'])assert.deepEqual(e[key],guard[key],id+' same guard '+key);
 assert.ok(requiresGuardBattle(s,e));const xp=s.progression.xp[id]||0;resolveBattle(s,e,true);assert.ok(s.progression.xp[id]>xp);assert.ok(resolveBattle(s,e,true),'repeatable infiltrators');
}
{const s=newJourney(),element='wind',e=infiltratorEncounter(s,{id:'nameless-infiltrator',element}),guard=configureOpponent({...encounterProfile(s,'village-guard',element),kind:'village-guard',village:'nameless'});assert.equal(e.hp,guard.hp);assert.deepEqual(e.balanceStages,guard.balanceStages);assert.deepEqual(e.spellIds,guard.spellIds);}
const jailSave=newJourney();assert.equal(challengeJailer(jailSave,'wind'),'warning');assert.equal(challengeJailer(jailSave,'wind'),'battle');assert.equal(challengeJailer(jailSave,'earth'),'warning');assert.equal(readJourney({getItem:()=>JSON.stringify(jailSave)}).story.jailerWarnings.wind,2);
const encounter=villageEventEncounter('dark',6,f['dark:6']);const s=structuredClone(f['dark:6']);assert.equal(sacrificeForHero(s,{kind:'random',village:'dark'}),false);assert.ok(sacrificeForHero(s,encounter));assert.equal(sacrificeForHero(s,encounter),false);assert.equal(companionPresent(s),false);assert.equal(companionUnconscious(s),false);assert.equal(carryingCompanion(s),false);healCompanion(s);treatCompanion(s,100);syncCompanionGrowth(s);assert.equal(s.story.companion.hp,0);assert.equal(storyEnding(s),'bad');
const restored=readJourney({getItem:()=>JSON.stringify(s)});assert.ok(restored.story.companion.sacrificed);assert.equal(companionPresent(restored),false);resolveBattle(restored,encounter,true);assert.equal(restored.story.villageEvents.dark,7);assert.match(currentVillageEvent(restored).body,/tan biến/);
const ending=structuredClone(f['nameless:3']);ending.story.companion={...s.story.companion};assert.match(currentVillageEvent(ending).title,/Bad End/);assert.equal(currentVillageEvent(ending).style,'memorial');assert.ok(advanceVillageEvent(ending,'nameless',3).ok);assert.equal(ending.story.ending,'bad');assert.match(currentVillageEvent(f['nameless:3']).title,/True End/);
const old=structuredClone(f.complete);old.story.plotVersion=3;const migrated=readJourney({getItem:()=>JSON.stringify(old)});assert.equal(migrated.story.villageEvents.dark,6);assert.equal(migrated.story.villageEvents.light,6);assert.equal(migrated.story.villageEvents.nameless,undefined);assert.deepEqual(migrated.equipment,old.equipment);
assert.match(PLOT.villages.fire.stages[1].body,/Cai ngục thật đã chết/);assert.ok(PLOT.villages.fire.stages[3].script.some(([key,line])=>key==='memory'&&line.includes('kiếp trước')));assert.equal(PLOT.villages.fire.stages[4].battle,'fire-general');assert.match(PLOT.villages.fire.stages[5].body,/Xích Nham/);assert.match(PLOT.villages.dark.stages[5].body,/Phượng Hoàng/);assert.match(PLOT.villages.dark.stages[8].script.map(l=>l[1]).join(' '),/Ta không biết tương lai/);
const entries=[],land=new T.Group(),hero={root:new T.Group()},agents=createInfiltration({land,interactives:entries,blocked:()=>false,floor:()=>0,findPath:(a,b)=>[b],hero});
agents.spawn(20,0,'wind','survey');agents.update(1,1,false);assert.ok(Math.hypot(entries[0].x-20,entries[0].z)>0);hero.root.position.set(entries[0].x,0,entries[0].z);assert.equal(agents.update(.1,2,false)?.mode,'survey');agents.clear();hero.root.position.set(0,0,0);agents.spawn(5,0,'earth','ambush');assert.equal(agents.state()[0].visible,false);agents.update(.1,2,false);assert.equal(agents.state()[0].phase,'chasing');assert.ok(agents.state()[0].visible);hero.root.position.copy(agents.first.root.position);assert.ok(agents.update(.1,3,false));agents.clear();assert.equal(entries.length,0);
globalThis.innerWidth=1280;globalThis.innerHeight=900;const world=createAdventureScene();
for(const id of ['nameless','wind','earth','wood','ice','fire']){
 const seed=structuredClone(f[id==='nameless'?'nameless:0':id+':0']);world.load(id,seed);assert.equal(world.interactives.filter(i=>i.kind==='village-guard'&&i.guardRole==='jailer').length,id==='fire'?2:1);
 if(id!=='fire'){const jailer=world.interactives.find(i=>i.guardRole==='jailer');assert.ok(Math.hypot(jailer.x-world.military.gate.x,jailer.z-world.military.gate.z)<.01);assert.equal(world.blocked(jailer.x,jailer.z),false,'gate must be accessible '+id);}
 if(id==='nameless')assert.equal(world.clinics.length,1);if(id==='fire')assert.ok(world.scene.getObjectByName('fallen-fire-jailer'));
}
world.load('nameless',{...structuredClone(f['nameless:3']),story:{...f['nameless:3'].story,companion:{...s.story.companion}}});assert.ok(world.scene.getObjectByName('ha-ly-memorial'));assert.equal(world.storyState().recruited,false);
const ally=createCampaignAlly(new T.Scene());ally.reset(true,{hp:300,maxHp:300});ally.sacrifice();assert.equal(ally.actor(),null);ally.update(4,4,[],new SealGameCore.Fighter(300),[0,1.72,7],()=>{});assert.equal(ally.state().visible,false);assert.equal(ally.state().phoenixVisible,false);ally.dispose();
console.log('PASS: infiltrator/guard stat parity, repeatable elemental XP, survey/ambush, reduced hidden guards, gate jailers, warning persistence, dead Fire jailer, one Nameless clinic, sacrifice/save/clinic permanence, true/bad narratives and memorial.');
