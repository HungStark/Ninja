import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import '../game-core.js';
import {configureOpponent,createOpponentRules,opponentDamageMultiplier,opponentStage,scaleEnemySpell} from '../src/opponent-balance.js';
import {encounterProfile} from '../src/progression.js';
import {newJourney,VILLAGES} from '../src/adventure-data.js';
import {INTRO_SQUAD} from '../src/journey-story.js';
import {guardianPhaseHealth} from '../src/guardian-arts.js';
import {opponentDocument,updateOpponentSource,parseOpponentOverrides} from '../tools/opponent-balance-data.mjs';
const {GameRules,Fighter,spells}=SealGameCore,spell=id=>spells.find(s=>s.id===id),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const source=await fs.readFile('src/opponent-balance.js','utf8'),core=await fs.readFile('game-core.js','utf8'),document=opponentDocument(source,core);
assert.equal(new Set(document.rows.map(r=>r.id)).size,document.rows.length);assert.equal(document.rows.filter(r=>r.category==='guardian').length,21);assert.equal(document.spells.length,45);
const row=id=>document.rows.find(r=>r.id===id);
assert.equal(row('ninja:random:water').defaults.baseDamagePercent,33.5);
assert.equal(row('ninja:random:dark').defaults.baseDamagePercent,61.5);
assert.equal(row('guardian:water:1').defaults.baseDamagePercent,61);
assert.equal(row('guardian:water:2').defaults.baseDamagePercent,71);
assert.equal(row('guardian:dark:3').defaults.baseDamagePercent,129);
for(const entry of document.rows){assert.equal('damageBoost' in entry.defaults,false);assert.equal('damageReduction' in entry.defaults,false);}
for(const v of VILLAGES){const save=newJourney(),raw={...encounterProfile(save,'boss',v.id),kind:'boss',village:v.id},profile=configureOpponent(raw,{});assert.deepEqual(profile.phaseHealth,guardianPhaseHealth(raw.hp,v.id));assert.equal(profile.hp,raw.hp);assert.deepEqual(profile.spellIds,raw.spellIds);}
const overrides={'ninja:sidequest:water':{hp:850,mana:35,sealDelay:.15,baseDamagePercent:80,spellIds:['fire-volley']},'guardian:fire:1':{hp:713,mana:60,infiniteMana:false,sealDelay:.18,spellIds:['water-lance']},'guardian:fire:2':{hp:1237,baseDamagePercent:80},'guardian:dark:3':{hp:1801,mana:75,infiniteMana:false,sealDelay:.2},'intro:fire':{hp:401,mana:42,sealDelay:.12,baseDamagePercent:64}};
const clean=updateOpponentSource(source,core,overrides);assert.deepEqual(parseOpponentOverrides(clean),overrides);
const profile=configureOpponent({...encounterProfile(newJourney(),'sidequest','water'),kind:'sidequest',village:'water'},overrides);assert.equal(profile.hp,850);assert.equal(profile.sealDelay,.15);const rules=createOpponentRules(GameRules,profile);assert.equal(rules.maxChakra,35);assert.equal(rules.chakra,35);assert.deepEqual(rules.loadout,['fire-volley']);spell('fire-volley').sequence.forEach(k=>rules.seal(k));assert.equal(rules.cast().ok,true);close(rules.chakra,35-spell('fire-volley').cost);rules.tick(100);assert.equal(rules.chakra,35);
close(opponentDamageMultiplier(profile),.8);
const boss=configureOpponent({...encounterProfile(newJourney(),'boss','fire'),kind:'boss',village:'fire'},overrides);assert.deepEqual(boss.phaseHealth,[713,1237]);assert.equal(boss.hp,1950);assert.deepEqual(createOpponentRules(GameRules,boss).loadout,['water-lance']);assert.ok(createOpponentRules(GameRules,boss).spells.some(s=>s.cost>0));close(opponentDamageMultiplier(boss,2),.8);assert.equal(opponentStage(boss,2).baseDamagePercent,80);
const dark=configureOpponent({...encounterProfile(newJourney(),'boss','dark'),kind:'boss',village:'dark'},overrides);assert.equal(dark.phaseHealth.length,3);assert.equal(dark.phaseHealth[2],1801);assert.equal(createOpponentRules(GameRules,dark,3).maxChakra,75);
const trio=configureOpponent({kind:'intro-trio',village:'nameless',hp:188,spellIds:INTRO_SQUAD[0].spellIds,squad:INTRO_SQUAD},overrides);assert.equal(trio.hp,401);assert.equal(trio.squad[0].hp,401);assert.equal(trio.squad[1].hp,188);assert.equal(createOpponentRules(GameRules,trio.squad[0]).maxChakra,42);close(opponentDamageMultiplier(trio.squad[0]),.64);
const guard=configureOpponent({...encounterProfile(newJourney(),'guardian-guard','water'),kind:'village-guard',guardRole:'guardian',village:'water'},{'ninja:guardian-guard:water':{hp:999}});assert.equal(guard.hp,999);
const infinite=configureOpponent({kind:'practice-ninja',hp:440,spellIds:['fire-volley'],balancePractice:true},{'ninja:practice':{mana:0,infiniteMana:true,baseDamagePercent:1100}});const free=createOpponentRules(GameRules,infinite);assert.equal(free.maxChakra,0);assert.equal(free.spells[0].cost,0);close(opponentDamageMultiplier(infinite),11);
for(const percent of [0,33.5,100,10000]){
 const settings={'guardian:dark:3':{baseDamagePercent:percent}},candidate=configureOpponent({...encounterProfile(newJourney(),'boss','dark'),kind:'boss',village:'dark'},settings);
 close(opponentDamageMultiplier(candidate,3),percent/100);
 assert.equal(parseOpponentOverrides(updateOpponentSource(source,core,settings))['guardian:dark:3'].baseDamagePercent,percent);
}
const target=new Fighter(1000);target.autoRestore=false;target.resistances={fire:.2};close(target.receive(100,false,false,'fire').damage,80);
const scaled=scaleEnemySpell({damage:100,baseDamage:100,upgradeDamage:30,captureDamage:60,fallDamage:75,shield:90},1.5);assert.deepEqual([scaled.damage,scaled.upgradeDamage,scaled.captureDamage,scaled.fallDamage,scaled.shield],[150,45,90,112.5,90]);
for(const invalid of [null,[],{unknown:{hp:1}},{'guardian:fire:2':{spellIds:['fire-volley']}},{'guardian:fire:2':{mana:50}},{'guardian:dark:3':{spellIds:['fire-volley']}},{'ninja:practice':{hp:0}},{'ninja:practice':{mana:-1}},{'ninja:practice':{sealDelay:7}},{'ninja:practice':{baseDamagePercent:-1}},{'ninja:practice':{baseDamagePercent:10001}},{'ninja:practice':{damageBoost:20}},{'ninja:practice':{damageReduction:25}},{'ninja:practice':{spellIds:[]}},{'ninja:practice':{spellIds:['fire-volley','fire-volley']}},{'ninja:practice':{spellIds:['unknown']}},{'ninja:practice':{infiniteMana:1}}])assert.throws(()=>updateOpponentSource(source,core,invalid));
console.log('PASS: opponent catalog, exact HP per phase, finite / infinite mana below 100, ninja loadouts, seal cadence, direct base damage percentages, separate squad profiles and strict validation.');
