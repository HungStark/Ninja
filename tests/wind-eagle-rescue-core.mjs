import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from 'three';
import '../game-core.js';
import {campaignFixtures} from './campaign-fixtures.mjs';
import {currentVillageEvent,villageEventEncounter} from '../src/village-events.js';
import {resolveBattle} from '../src/adventure-data.js';
import {encounterProfile} from '../src/progression.js';
import {configureOpponent,opponentStage,opponentDamageMultiplier} from '../src/opponent-balance.js';
import {storyBossProfile} from '../src/island-occupation.js';
import {encounterAppearance} from '../src/encounter-appearance.js';
import {battleConversation} from '../src/battle-conversation.js';
import {createGuardianPhases} from '../src/guardian-phases.js';
import {GUARDIAN_BOSS_DESIGNS} from '../src/guardian-boss-designs.js';
import {opponentDocument} from '../tools/opponent-balance-data.mjs';

const save=structuredClone(campaignFixtures()['wind:3']),event=currentVillageEvent(save),encounter=villageEventEncounter('wind',event.step,save),profile=storyBossProfile(encounter);
assert.equal(event.battle,'wind-eagle');assert.equal(encounter.kind,'village-event');assert.equal(encounter.storyBattle,'wind-eagle');assert.equal(encounter.storyBeast,true);assert.equal(profile.kind,'boss');assert.equal(profile.village,'wind');assert.equal(profile.beastOnly,true);assert.equal(profile.guardianForm,'beast');assert.equal(encounterAppearance(encounter).kind,'creature');assert.ok(battleConversation(encounter,save).length>=2,'rescue conversation is retained');
const standard=configureOpponent({...encounterProfile(save,'boss','wind'),kind:'boss',village:'wind'});
assert.equal(profile.phaseHealth[1],standard.phaseHealth[1]);assert.equal(opponentDamageMultiplier(profile,2),opponentDamageMultiplier(standard,2));assert.equal(opponentStage(profile,2).infiniteMana,true);
const scene=new T.Scene(),g=createGuardianPhases(scene),fighter=new SealGameCore.Fighter(profile.hp);
try{g.reset({...profile,thirdPerson:true},fighter);assert.equal(g.phase,2);assert.equal(fighter.maxHp,standard.phaseHealth[1]);assert.equal(g.state().arsenal,true);assert.deepEqual(g.state().skills,GUARDIAN_BOSS_DESIGNS.wind.skills.map(s=>s.name));for(let i=0;i<600;i++)g.update(1/60,fighter,[0,1.72,7],[0,2,-20],shot=>({damage:shot.damage}),{enabled:true});assert.ok(g.state().attacks>=3);fighter.hp=0;assert.equal(g.beginTransition(fighter),false,'rescue ends after the beast is defeated');}finally{g.dispose();}
const doc=opponentDocument(await fs.readFile('src/opponent-balance.js','utf8'),await fs.readFile('game-core.js','utf8')),row=doc.rows.find(r=>r.id==='event:wind-eagle:0'),guardian=doc.rows.find(r=>r.id==='guardian:wind:2');
assert.equal(row.phase,2);assert.equal(row.form,'Linh thú');assert.equal(row.usesMana,false);assert.equal(row.canEditSpells,false);assert.equal(row.values.hp,guardian.values.hp);assert.equal(row.values.baseDamagePercent,guardian.values.baseDamagePercent);
const next=save.story.villageEvents.wind;resolveBattle(save,encounter,true);assert.equal(save.story.villageEvents.wind,next+1);const completed=JSON.stringify(save);resolveBattle(save,encounter,true);assert.equal(JSON.stringify(save),completed,'victory cannot award or advance twice');
console.log('PASS: Wind Eagle rescue uses the phase-2 guardian stats, beast appearance and eight guardian skills; no extra phase, ninja spell controls or duplicate quest completion.');
