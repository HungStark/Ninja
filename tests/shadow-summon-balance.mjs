import assert from 'node:assert/strict';
import '../game-core.js';
import {empowerDarkGuardian} from '../src/guardian-arts.js';
const {spells,GameRules}=SealGameCore,spell=spells.find(s=>s.id==='dark-orb');
assert.equal(spell.damage,20);assert.equal(spell.upgradeDamage,30);assert.equal(spell.cloneCount,2);assert.equal(spell.maxClones,4);assert.equal(spell.upgradeMultiplier,undefined);
const rules=new GameRules(['dark-orb']);spell.sequence.forEach(k=>rules.seal(k));assert.equal(rules.cast({shadowCloneCount:4,shadowUpgrades:0}).reason,'cloneLimit');assert.equal(rules.chakra,100);assert.equal(rules.casts,0);assert.equal(rules.cast({shadowCloneCount:4,shadowUpgrades:1}).ok,true);assert.equal(rules.chakra,74);assert.equal(rules.remaining(spell.id),2);
const partial=new GameRules(['dark-orb']);spell.sequence.forEach(k=>partial.seal(k));assert.equal(partial.cast({shadowCloneCount:3,shadowUpgrades:0}).ok,true,'one free slot still accepts a capped summon');
const original=structuredClone(spell),strong=empowerDarkGuardian(spell);assert.deepEqual(spell,original);assert.equal(strong.cloneCount,2);assert.equal(strong.maxClones,4);assert.equal(strong.damage,30);assert.equal(strong.upgradeDamage,45);
console.log('PASS: fixed dog20/bull30, two per summon/four cap, full and partial cap gating, cooldown/cost and isolated guardian dog30/bull45 configuration.');
