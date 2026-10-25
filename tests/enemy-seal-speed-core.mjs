import assert from 'node:assert/strict';
import {newJourney,readJourney,resolveBattle} from '../src/adventure-data.js';
import {encounterProfile} from '../src/progression.js';
import {arenaRound} from '../src/enemy-seal-timing.js';
import {shopStock,buyEquipment} from '../src/equipment.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
for(const order of [['water','fire','lightning','earth','wind','light','ice','wood','dark'],['lightning','water','fire','wood','ice','earth','wind','light','dark']]){
 const s=newJourney();s.story.villageOrder=order;
 for(const v of ['nameless',...order]){
  const normal=encounterProfile(s,'random',v);
  for(const [kind,speed] of [['random',1],['quest',1],['sidequest',1],['village-event',1],['village-guard',1.15],['guardian-guard',1.3],['boss',1.5]]){
   const profile=encounterProfile(s,kind,v);close(profile.sealDelay,normal.sealDelay/speed);close(profile.sealSpeedMultiplier,speed);assert.equal(profile.baseSealDelay,normal.sealDelay);
  }
 }
}
const s=newJourney();s.village='wood';s.interior={id:'wood-arena'};s.gold=111;
for(let round=1;round<=20;round++){
 for(const v of ['fire','water','lightning','earth','wind','light','ice','wood','dark']){const p=encounterProfile(s,'arena',v);close(p.sealSpeedMultiplier,1+(round-1)*.1);close(p.sealDelay,.9/(1+(round-1)*.1));}
 const before=structuredClone(s),battle={kind:'arena',village:'fire',arenaRound:round};resolveBattle(s,battle,false);assert.deepEqual(s,before,'loss keeps current round');resolveBattle(s,battle,true);assert.equal(arenaRound(s),round+1);assert.equal(s.gold,111);assert.deepEqual(s.interior,before.interior);
 const wins=s.wins;resolveBattle(s,battle,true);assert.equal(s.wins,wins,'same completed round cannot award twice');assert.equal(arenaRound(readJourney({getItem:()=>JSON.stringify(s)})),round+1);
}
for(const raw of [undefined,null,{round:0},{round:-2},{round:1.5},{round:'3'},{round:Infinity}]){const saved=newJourney();saved.arena=raw;assert.equal(arenaRound(readJourney({getItem:()=>JSON.stringify(saved)})),1);}
const buyer=newJourney();buyer.gold=240;assert.ok(buyEquipment(buyer,'nameless-guard').ok);assert.equal(buyer.gold,100);assert.ok(buyEquipment(buyer,'nameless-bracers').ok);assert.equal(buyer.gold,0);
for(const v of ['water','fire','lightning','earth','wind','light','ice','wood','dark'])for(const kind of ['armor','armguard']){const standard=shopStock(v).find(i=>i.kind===kind&&!i.elite&&!i.name.includes('chuyên hệ'));assert.ok(shopStock('nameless').filter(i=>i.kind===kind).every(i=>i.price===standard.price));}
console.log('PASS: exact 1/1.15/1.3/1.5 seal speeds across all villages/orders; 20 arena rounds +0.1 with common baseline, win/loss/reload/old saves; Nameless 140/100 shop purchases.');
