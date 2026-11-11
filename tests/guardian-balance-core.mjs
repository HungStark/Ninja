import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {guardianBalanceDocument,updateGuardianSource,readGuardianBalance} from '../tools/guardian-balance-data.mjs';
const source=updateGuardianSource(await fs.readFile('src/guardian-balance.js','utf8'),{}),doc=guardianBalanceDocument(source);
assert.equal(doc.rows.length,36);assert.equal(doc.rows.filter(r=>r.kind==='skill').length,27);assert.equal(doc.rows.filter(r=>r.kind==='passive').length,9);
for(const e of doc.elements)assert.equal(doc.rows.filter(r=>r.element===e.id).length,4);
assert.equal(doc.rows.some(r=>r.element==='nameless'),false);
assert.deepEqual(readGuardianBalance(updateGuardianSource(source,Object.fromEntries(doc.rows.map(r=>[r.id,r.defaults])))).overrides,{});
const count=doc.rows.reduce((n,r)=>n+Object.keys(r.defaults).length,0);assert.equal(count,372);
for(const row of doc.rows)for(const field of [...Object.values(row.columns).flat(),...row.extra]){
 assert.ok(field.label);assert.ok(field.value>=field.min&&field.value<=field.max,row.id+'/'+field.key);
 assert.throws(()=>updateGuardianSource(source,{[row.id]:{[field.key]:field.min-1}}));
 assert.throws(()=>updateGuardianSource(source,{[row.id]:{[field.key]:field.max+1}}));
}
for(const invalid of [null,[],{nameless:{}},{'fox-homing':{count:2.5}},{'fox-homing':{mana:3}},{'dragon-pressure':{duration:1}},{'wolf-dashes':{duration:.2}},{'wolf-clones':{returnAt:99}},{'shadow-clones':{attackAt:20}},{'gold-swords':{duration:1}},{'tiger-blizzard':{duration:1}},{'fox-pillars':{count:8,maxCount:5}}])assert.throws(()=>updateGuardianSource(source,invalid));
const settings={'fox-homing':{damage:0,count:4,cooldown:0},'dragon-vortices':{damage:9,warning:.3},'dragon-tsunami':{damage:91,gapWidth:4},'passive:lightning':{energyCap:2,markDamage:30},'tiger-spikes':{hp:20}};
assert.deepEqual(readGuardianBalance(updateGuardianSource(source,settings)).overrides,settings);
const row=guardianBalanceDocument(updateGuardianSource(source,settings)).rows.find(r=>r.id==='fox-homing');assert.equal(row.columns.damage[0].value,0);assert.equal(row.columns.cooldown[0].value,0);
console.log('PASS: 36 guardian balance rows, 372 labeled numeric fields, all field boundaries, skill timing relations, defaults/zero handling and JSON roundtrip.');
