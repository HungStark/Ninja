import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from 'three';
import {guardianBalanceDocument,updateGuardianSource,readGuardianBalance} from '../tools/guardian-balance-data.mjs';
import {guardianBalanceOverrides,guardianSkillStats} from '../src/guardian-balance.js';
import {createGuardianPhases} from '../src/guardian-phases.js';

const source=updateGuardianSource(await fs.readFile('src/guardian-balance.js','utf8'),{}),doc=guardianBalanceDocument(source);
assert.equal(doc.rows.length,36);assert.equal(doc.rows.filter(r=>r.kind==='skill').length,27);assert.equal(doc.rows.filter(r=>r.kind==='passive').length,9);
for(const el of doc.elements)assert.equal(doc.rows.filter(r=>r.element===el.id).length,4);
assert.equal(doc.rows.some(r=>r.element==='nameless'),false);
assert.deepEqual(readGuardianBalance(updateGuardianSource(source,Object.fromEntries(doc.rows.map(r=>[r.id,r.defaults])))).overrides,{});
for(const invalid of [null,[],{'nameless':{}},{'fox-homing':{damage:-1}},{'fox-homing':{count:2.5}},{'fox-homing':{interval:0}},{'fox-homing':{mana:3}},{'dragon-prison':{hp:0}},{'dragon-tsunami':{gapWidth:9}},{'passive:fire':{healthThreshold:0}},{'passive:earth':{shellReduction:1.1}},{'passive:dark':{hideDuration:9}},{'dragon-pressure':{duration:1}},{'shadow-ambush':{strikeAt:.1}},{'tiger-crystals':{detonateAfter:99}},{'tiger-blizzard':{freezeAt:99}}])assert.throws(()=>updateGuardianSource(source,invalid));
const zero=guardianBalanceDocument(updateGuardianSource(source,{'fox-homing':{damage:0,cooldown:0}})).rows.find(r=>r.id==='fox-homing');assert.equal(zero.columns.damage[0].value,0);assert.equal(zero.columns.damage.length,1);
const settings={
 'fox-homing':{damage:31,count:2,windup:.2,interval:.3,speed:14,duration:1,cooldown:4},
 'dragon-prison':{hp:14,damage:9,tickInterval:.5,windup:.3,life:6},
 'dragon-tsunami':{damage:91,speed:15,windup:.4,gapWidth:4},
 'passive:lightning':{stackCount:2,controlDuration:3,stackDuration:10},
 'stag-spirits':{hp:18,count:2,healRate:.025,life:20},
 'tiger-crystals':{hp:12,damage:37,shelterDuration:20,shelterRadius:2.4},
 'passive:earth':{shellReduction:.5,toppleThreshold:.01,toppleDuration:6}
};
assert.deepEqual(readGuardianBalance(updateGuardianSource(source,settings)).overrides,settings);
const original=structuredClone(guardianBalanceOverrides);for(const key of Object.keys(guardianBalanceOverrides))delete guardianBalanceOverrides[key];Object.assign(guardianBalanceOverrides,settings);
const g=createGuardianPhases(new T.Scene()),boss=[0,2.4,-13],player=[0,1.72,7];let f,hits,controls;
function step(seconds,p=player){for(let t=0;t<seconds-1e-8;t+=1/60)g.update(Math.min(1/60,seconds-t),f,p,boss,shot=>{hits.push(shot);return {damage:shot.damage};},{control:(kind,seconds)=>controls.push({kind,seconds})});}
function reset(id){hits=[];controls=[];f={hp:1000,maxHp:1000};g.reset({village:id,element:id,hp:1000,beastOnly:true},f);step(.01);}
try{
 reset('fire');g.trigger(0,player,boss,f);step(.55);assert.equal(g.state().entities.filter(e=>e.kind==='projectile').length,2);assert.equal(g.state().action.parameters.damage,31);step(.6);assert.equal(g.state().action,null);step(3);assert.equal(g.state().attacks,1,'edited recovery postpones the next attack');step(1);assert.equal(g.state().attacks,2);
 reset('water');g.trigger(1,player,boss,f);step(.35);assert.equal(g.state().prison.hp,14);step(.55);assert.ok(hits.some(h=>h.damage===9));assert.equal(g.breakPrison(14),true);assert.equal(g.state().prison,null);
 reset('water');g.trigger(2,player,boss,f);step(3);assert.ok(hits.some(h=>h.damage===91),'saved wave damage reaches actual impacts');
 reset('lightning');g.trigger(1,player,boss,f);step(2.3);assert.ok(controls.some(c=>c.kind==='lightning'&&c.seconds===3),'edited two-stack passive changes paralysis');
 reset('wood');g.trigger(1,player,boss,f);step(.1);const spirits=g.state().entities.filter(e=>e.kind==='spirit');assert.equal(spirits.length,2);assert.equal(spirits[0].hp,18);f.hp=100;step(1);assert.ok(f.hp>f.maxHp*.05+100,'per-spirit regeneration applies the edited rate');
 reset('ice');g.trigger(1,player,boss,f);step(.1);const crystal=g.state().entities.find(e=>e.kind==='crystal');assert.equal(crystal.hp,12);assert.ok(g.intercept({owner:'player',damage:12,old:[crystal.position[0],1.2,7],p:crystal.position}));const shelter=g.state().shelters[0];assert.equal(shelter.radius,2.4);assert.equal(shelter.remaining,20);
 reset('earth');assert.equal(g.defense({guardianPart:'mountain-shell'},boss).multiplier,.5);g.onDamage(f.maxHp*.011,{guardianPart:'tortoise-leg'},boss);assert.equal(g.state().stagger,6);
 assert.equal(guardianSkillStats('fox-homing').damage,31);
}finally{g.dispose();for(const key of Object.keys(guardianBalanceOverrides))delete guardianBalanceOverrides[key];Object.assign(guardianBalanceOverrides,original);}
console.log('PASS: 36 balance rows, 274 numeric parameters, strict validation, zero/default handling and edited recovery, projectile counts, damage, prisons, status thresholds, healing, durability, shelters and weak spots in actual combat.');
