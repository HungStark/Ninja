import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {PRACTICE_GUARDIANS,validPracticeOpponent,practiceOpponentEncounter} from '../src/practice-opponent.js';
import {createGuardianPhases} from '../src/guardian-phases.js';
import {encounterAppearance} from '../src/encounter-appearance.js';
const {spells,defaultLoadout,Fighter}=SealGameCore;
assert.equal(PRACTICE_GUARDIANS.length,9);assert.equal(new Set(PRACTICE_GUARDIANS).size,9);assert.ok(!PRACTICE_GUARDIANS.includes('nameless'));
for(const ids of [[],defaultLoadout.slice(0,4),[...defaultLoadout,spells[10].id],[...defaultLoadout.slice(0,4),defaultLoadout[0]],['unknown',...defaultLoadout.slice(0,4)]])assert.equal(validPracticeOpponent({type:'ninja',spells:ids},spells),false);
const ninja=practiceOpponentEncounter({type:'ninja',spells:defaultLoadout},spells);assert.deepEqual(ninja.spellIds,defaultLoadout);assert.equal(ninja.hp,440);assert.notEqual(ninja.spellIds,defaultLoadout);
assert.equal(validPracticeOpponent({type:'guardian',guardian:'nameless'},spells),false);
for(const id of PRACTICE_GUARDIANS){
  const encounter=practiceOpponentEncounter({type:'guardian',guardian:id},spells),fighter=new Fighter(encounter.hp),phases=createGuardianPhases(new T.Scene());
  assert.equal(encounter.village,id);assert.equal(encounterAppearance(encounter).kind,'creature');assert.equal(encounter.guardianForm,'beast');assert.equal(encounter.beastOnly,true);assert.equal(encounter.spellIds.length,5);
  phases.reset(encounter,fighter);assert.equal(phases.form,'beast');assert.equal(phases.phase,2);assert.ok(fighter.hp>0);assert.ok(phases.trigger(1,[0,1.72,7],[0,2,-24],fighter),'selected beast retains its unique guardian art');
  fighter.hp=0;assert.equal(phases.beginTransition(fighter),false,'practice beast stays in the selected form');phases.dispose();
}
console.log('PASS: exactly five distinct ninja techniques, exactly nine elemental guardians, beast models and unique arts from the start, no transformation or journey mutation.');
