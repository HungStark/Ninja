import assert from 'node:assert/strict';
import '../game-core.js';
import {introductoryCooldowns,battleOpportunities} from '../src/battle-coaching.js';
import {createBattleMetrics,BATTLE_HISTORY_KEY} from '../src/battle-metrics.js';
const {spells,elements,GameRules,Fighter,chakraRegen,shuriken,elementalDurations}=SealGameCore,s=id=>spells.find(s=>s.id===id);
for(const [id,damage,cost,cd,count] of [['fire-volley',6,20,4,3],['water-barrier',7.5,22,5,4],['lightning-lance',22,20,4,1],['wind-orb',24,16,4,1],['earth-orb',26,16,4,1],['light-orb',26,16,4,1]]){
  assert.equal(s(id).damage,damage);assert.equal(s(id).cost,cost);assert.equal(s(id).cooldown,cd);assert.equal(s(id).count,count);
  const rules=new GameRules([id]);s(id).sequence.forEach(k=>rules.seal(k));assert.equal(rules.cast().ok,true);assert.equal(rules.chakra,100-cost);assert.equal(rules.remaining(id),cd);
  rules.tick(cd-.01);s(id).sequence.forEach(k=>rules.seal(k));assert.equal(rules.cast().reason,'spellCooldown');rules.tick(.01);assert.equal(rules.cast().ok,true);
}
for(const [id,cd] of Object.entries({'fire-lance':20,'fire-meteor':35,'fire-barrier':8,'water-lance':10,'water-volley':22,'water-tsunami':30,'lightning-volley':20,'lightning-thunder':35,'lightning-barrier':10,'wind-volley':12,'wind-lance':10,'wind-reflect':24,'earth-lance':8,'earth-volley':24,'earth-reflect':40,'light-barrier':12,'light-lance':30,'light-volley':35,'dark-orb':2,'dark-lance':8,'dark-volley':20,'dark-domain':45,'dark-reflect':8,'wood-orb':6,'wood-lance':10,'wood-volley':20,'wood-reflect':15,'ice-orb':45,'ice-lance':8,'ice-volley':11,'ice-reflect':15}))assert.equal(s(id).cooldown,cd,id);
assert.equal(shuriken.damage,2);assert.deepEqual(elementalDurations,{burn:6,static:8});
for(const [element,property,duration] of [['fire','burns',6],['lightning','staticCharges',8]]){
  const target=new Fighter();target.applyElementHit(element,{damage:1},'lance');target.tick(duration-.01);assert.equal(target[property].length,1);target.tick(.01);assert.equal(target[property].length,0,'expires at exact duration');
  assert.ok(spells.filter(s=>s.element===element&&s.kind==='attack').every(s=>s.subtitle.includes(`${duration} giây`)));
}
assert.equal(chakraRegen,5);assert.equal(new Set(spells.map(s=>s.sequence.join(''))).size,45);
for(const el of elements){
  const list=spells.filter(s=>s.element===el.id);assert.ok(list.filter(s=>s.sequence.length===2).length<=1);
  for(const spell of list){assert.ok(spell.sequence.length>=2&&spell.sequence.length<=6);assert.equal(spell.sequence.slice(0,2).join(''),el.prefix);assert.ok(spell.sequence.slice(2).every(k=>!el.prefix.includes(k)));assert.ok(spell.sequence.every((k,i)=>!i||k!==spell.sequence[i-1]));
    assert.ok(!list.some(other=>other.id!==spell.id&&other.sequence.length>2&&other.sequence.length<spell.sequence.length&&spell.sequence.join('').startsWith(other.sequence.join(''))),'only the two-seal basic can be a castable prefix of another recipe');
  }
}
for(const id of ['wind-orb','earth-orb','light-orb']){assert.equal(s(id).sequence.length,2);assert.equal(s(id).cooldown,4);}
for(const id of ['fire-volley','lightning-lance']){assert.equal(s(id).sequence.length,2);assert.equal(s(id).cooldown,4);}
for(const [id,life,cost,cd,hp] of [['fire-reflect',9,28,13,120],['water-reflect',8,26,12,95],['wind-barrier',9,26,13,110],['earth-barrier',10,30,14,180],['ice-barrier',8,24,12,120],['wood-barrier',8,24,13,90]]){
  assert.equal(s(id).sequence.length,3);assert.equal(s(id).duration,life);assert.equal(s(id).cost,cost);assert.equal(s(id).cooldown,cd);assert.equal(s(id).shield,hp);assert.ok(cd>life+(id==='wood-barrier'?2:0));
}
assert.equal(s('light-reflect').sequence.length,3);assert.equal(s('light-reflect').cost,22);assert.equal(s('light-reflect').duration,2.5);
for(const id of ['wood-reflect','ice-reflect']){assert.equal(s(id).sequence.length,6);assert.equal(s(id).oncePerMatch,true);}
assert.equal(s('water-tsunami').damage,79);assert.equal(s('dark-orb').damage,22);assert.equal(s('dark-orb').damage*s('dark-orb').upgradeMultiplier,33);assert.equal(s('lightning-lance').damage,22);assert.equal(s('ice-lance').controlDuration,1.5);
for(const id of ['wind-reflect','ice-volley','lightning-reflect'])assert.equal(s(id).duration,5);assert.equal(s('dark-reflect').duration,3);
for(const id of ['fire-volley','water-barrier','lightning-lance']){
  const r=new GameRules([id],{cooldownOverrides:introductoryCooldowns([id],true)});s(id).sequence.forEach(k=>r.seal(k));assert.equal(r.cast().spell.cooldown,4);assert.equal(r.remaining(id),4);assert.ok(s(id).cooldown>=4);
}
assert.deepEqual(introductoryCooldowns(['fire-volley'],false),{});assert.deepEqual(introductoryCooldowns(['fire-volley','water-barrier'],true),{});
const r=new GameRules(['wind-orb','wind-volley']);r.seal('r');assert.equal(r.throwShuriken().ok,true);assert.deepEqual(r.sequence,['r']);r.seal('a');assert.equal(r.ready().id,'wind-orb');assert.equal(r.casts,0);for(const k of s('wind-volley').sequence.slice(2))r.seal(k);assert.equal(r.ready().id,'wind-volley');assert.equal(r.cast().ok,true);
const context={canCast:()=>true,burnStacks:3,staticStacks:2,airborne:true,sphere:true,wall:true};let hints=battleOpportunities(spells,context);assert.equal(hints[0].id,'wind-lance');for(const id of ['fire-barrier','lightning-barrier','light-orb'])assert.ok(hints.some(h=>h.id===id));assert.ok(!battleOpportunities(spells,{...context,canCast:()=>false}).length);
const metrics=createBattleMetrics(),storage={value:null,getItem(){return this.value;},setItem(k,v){assert.equal(k,BATTLE_HISTORY_KEY);this.value=v;}};
metrics.reset('mobile');metrics.seal(true,1);metrics.advance(.4);metrics.seal(true,2);metrics.advance(2,{controlled:true});metrics.advance(.4);metrics.seal(true,3);metrics.advance(1.5,{cooldown:true});metrics.cast(s('light-reflect'));
assert.equal(metrics.snapshot().sealTimes[3].meanSeconds,.8);assert.equal(metrics.snapshot().waitCooldown,1.5);assert.equal(metrics.snapshot().casts[0].waitAfterSeals,1.5);
const wall={owner:'player',hp:60,life:1};metrics.observeWalls([wall]);metrics.block(40);wall.life=0;metrics.observeWalls([]);assert.equal(metrics.snapshot().blockedDamage,40);assert.equal(metrics.snapshot().unusedDurability,60);
metrics.cast(s('light-reflect'));metrics.cast(s('light-orb'));assert.equal(metrics.snapshot().repeatRate,.5);assert.equal(metrics.snapshot().distinctSpells,2);metrics.finish('victory',storage);assert.equal(metrics.finish('victory',storage),null);assert.equal(JSON.parse(storage.value).length,1);
for(let i=0;i<25;i++){metrics.reset();metrics.seal(true,1);metrics.finish('left',storage);}assert.equal(JSON.parse(storage.value).length,20);
metrics.reset();for(let i=0;i<300;i++)metrics.cast(s('light-orb'));assert.equal(metrics.snapshot().repeatRate,1);assert.equal(metrics.snapshot().totalCasts,300);assert.equal(metrics.snapshot().casts.length,256);
console.log('PASS: all 45 short recipes and role-specific cooldowns; six weaker/cheaper basics and exact recast gating; half-damage shuriken; exact 6s burn/8s static expiry; retained regen/special durations; introductory cooldowns, hints, statistics and bounded history.');

