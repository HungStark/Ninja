import assert from 'node:assert/strict';
import {newJourney,readJourney} from '../src/adventure-data.js';
import {REGIONS} from '../src/adventure-world.js';
import {villageGuards} from '../src/journey-story.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {encounterProfile} from '../src/progression.js';
import {MIN_GUARD_SPACING} from '../src/guard-placement.js';

globalThis.innerWidth=1200;globalThis.innerHeight=800;const world=createAdventureScene();
let minDistance=Infinity;
for(const id of Object.keys(REGIONS)){
 const save=newJourney();save.village=id;save.position=[0,7];world.load(id,save);const guards=world.guardsState(),hidden=guards.filter(g=>g.guardRole==='hidden'),guardians=guards.filter(g=>g.guardRole==='guardian');
 assert.equal(guards.length,id==='nameless'?0:10,id);assert.equal(hidden.length,id==='nameless'?0:8,id);assert.equal(guardians.length,id==='nameless'?0:2,id);
 for(let i=0;i<guards.length;i++)for(let j=0;j<i;j++){const d=Math.hypot(guards[i].home.x-guards[j].home.x,guards[i].home.z-guards[j].home.z);assert.ok(d>=MIN_GUARD_SPACING,`${id}: ${guards[i].id}/${guards[j].id} only ${d}m`);minDistance=Math.min(minDistance,d);}
 for(const g of hidden){assert.equal(g.phase,'hidden');assert.equal(g.ninjaVisible,false);assert.equal(g.disguiseVisible,true);assert.ok(['stump','bush','rock'].includes(g.disguise));}
 for(const g of guardians){assert.equal(g.phase,'guarding');assert.equal(g.ninjaVisible,true);assert.equal(g.disguiseVisible,false);assert.equal(g.disguise,null);assert.match(g.name,/Hộ vệ/);const d=Math.hypot(g.x-REGIONS[id].boss.x,g.z-REGIONS[id].boss.z);assert.ok(d>=9&&d<=28,`${id}: guardian post ${d}m from beast`);assert.ok(!world.solids.some(s=>s.name==='guard-disguise'&&s.x===g.x&&s.z===g.z));}
 if(id==='nameless')continue;
 const regular=encounterProfile(save,'village-guard',id),elite=encounterProfile(save,'guardian-guard',id);assert.ok(elite.hp>regular.hp);assert.ok(elite.damageMultiplier>regular.damageMultiplier);assert.ok(elite.spellIds.length>regular.spellIds.length);
 // An older save has only the original first three IDs; keep those victories.
 save.story.defeatedGuards=[id+'-sentry-1',id+'-sentry-3'];const loaded=readJourney({getItem:()=>JSON.stringify(save)});assert.deepEqual(loaded.story.defeatedGuards,save.story.defeatedGuards);world.load(id,loaded);const remaining=world.guardsState();assert.equal(remaining.length,8);
 for(const g of remaining){const old=guards.find(p=>p.id===g.id);assert.deepEqual(g.home,old.home,`${id}: surviving home slot moved after a victory`);}
 console.log(`${id}: 8 hidden + 2 visible elite posts, all separations >=15m, stable old-save slots`);
}
console.log('PASS: 90 village guards total, 72 hidden/18 open elite guardians, no Nameless guards, nearest actual home separation '+minDistance.toFixed(2)+'m, nearby beast posts and stronger profiles.');
