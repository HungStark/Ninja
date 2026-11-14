import assert from 'node:assert/strict';
import {GUARDIAN_BOSS_DESIGNS} from '../src/guardian-boss-designs.js';
import fs from 'node:fs/promises';
import {guardianBalanceDocument,updateGuardianSource,readGuardianBalance} from '../tools/guardian-balance-data.mjs';
const source=updateGuardianSource(await fs.readFile('src/guardian-balance.js','utf8'),{}),doc=guardianBalanceDocument(source);
assert.equal(doc.rows.length,89);assert.equal(doc.rows.filter(r=>r.kind==='skill').length,80);assert.equal(doc.rows.filter(r=>r.kind==='passive').length,9);
for(const e of doc.elements)assert.equal(doc.rows.filter(r=>r.element===e.id).length,1+GUARDIAN_BOSS_DESIGNS[e.id].skills.length);
assert.equal(doc.rows.some(r=>r.element==='nameless'),false);
assert.deepEqual(readGuardianBalance(updateGuardianSource(source,Object.fromEntries(doc.rows.map(r=>[r.id,r.defaults])))).overrides,{});
const count=doc.rows.reduce((n,r)=>n+Object.keys(r.defaults).length,0);assert.ok(count>600);
for(const row of doc.rows)for(const field of [...Object.values(row.columns).flat(),...row.extra]){
 assert.ok(field.label);assert.ok(field.value>=field.min&&field.value<=field.max,row.id+'/'+field.key);
 assert.throws(()=>updateGuardianSource(source,{[row.id]:{[field.key]:field.min-1}}));
 assert.throws(()=>updateGuardianSource(source,{[row.id]:{[field.key]:field.max+1}}));
}
for(const invalid of [null,[],{nameless:{}},{'fox-homing':{count:2.5}},{'fox-homing':{mana:3}},{'dragon-pressure':{duration:1}},{'wolf-dashes':{duration:.2}},{'wolf-clones':{returnAt:99}},{'shadow-clones':{attackAt:20}},{'gold-swords':{duration:1}},{'tiger-blizzard':{duration:1}},{'fox-pillars':{count:8,maxCount:5}}])assert.throws(()=>updateGuardianSource(source,invalid));
const settings={'fox-orbit':{damage:0,count:5,cooldown:0},'dragon-roaming-vortex':{damage:9,windup:.3},'dragon-wave':{damage:91,radius:.4},'passive:lightning':{energyCap:2,markDamage:30},'tiger-groundspikes':{damage:20}};
assert.deepEqual(readGuardianBalance(updateGuardianSource(source,settings)).overrides,settings);
const row=guardianBalanceDocument(updateGuardianSource(source,settings)).rows.find(r=>r.id==='fox-orbit');assert.equal(row.columns.damage[0].value,0);assert.equal(row.columns.cooldown[0].value,0);
console.log('PASS: 89 guardian balance rows, all labeled numeric boundaries, defaults/zero handling and JSON roundtrip for the authored arsenal.');
