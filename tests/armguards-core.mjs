import assert from 'node:assert/strict';
import * as T from 'three';
import {ARMORS,ARM_GUARDS,newEquipment,readEquipment,equipmentState,shopStock,buyEquipment,equipItem,damageMultiplierFor} from '../src/equipment.js';
import {createHero} from '../src/hero.js';
import {createHands} from '../src/hands.js';
import {newJourney} from '../src/adventure-data.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
assert.equal(ARMORS.length,53);assert.equal(ARM_GUARDS.length,53);
for(const catalogue of [ARMORS,ARM_GUARDS])for(const region of new Set(catalogue.filter(i=>i.village).map(i=>i.village))){
 const stock=catalogue.filter(i=>i.village===region),rates=i=>Object.keys(i.resistances||i.bonuses).length;
 for(const elite of (region==='nameless'?[]:[false,true])){const tier=stock.filter(i=>!!i.elite===elite).sort((a,b)=>rates(b)-rates(a));for(let i=1;i<tier.length;i++)assert.ok(tier[i].price>tier[i-1].price,`${region}: fewer affected elements must cost more within the same tier`);}
}
for(const item of [...ARMORS,...ARM_GUARDS]){
 const rates=Object.values(item.resistances||item.bonuses).sort((a,b)=>b-a);if(!rates.length)continue;
 assert.deepEqual(rates,item.elite?(rates.length===3?[.08,.08,.08]:rates.length===2?[.11,.08]:[.14]):rates.length===2?[.05,.05]:[.08],item.id);
}
const legacy={...newEquipment()};delete legacy.armguard;delete legacy.ownedArmguards;
assert.equal(readEquipment(legacy).armguard,'bare-wrists');assert.equal(readEquipment({...legacy,armguard:'water-bracers-elite',ownedArmguards:['fake']}).armguard,'bare-wrists');
const save=newJourney();save.gold=100000;
for(const village of new Set(ARM_GUARDS.filter(a=>a.village).map(a=>a.village))){save.village=village;assert.equal(shopStock(village).filter(a=>a.kind==='armguard').length,village==='nameless'?3:5);for(const item of shopStock(village).filter(a=>['armor','armguard'].includes(a.kind)))assert.ok(buyEquipment(save,item.id).ok);}
assert.equal(save.equipment.ownedArmor.length,49);assert.equal(save.equipment.ownedArmguards.length,49);assert.deepEqual(readEquipment(save.equipment),save.equipment);
save.village='water';const gold=save.gold;assert.equal(buyEquipment(save,'water-bracers').ok,false);assert.equal(save.gold,gold);
assert.ok(equipItem(save,'armguard','water-bracers-elite'));assert.ok(equipItem(save,'armor','fire-guard'));assert.equal(save.equipment.armguard,'water-bracers-elite');
const stats={damageMultiplier:1.1,elementBonuses:equipmentState(save).armguard.bonuses};close(damageMultiplierFor(stats,'water'),1.21);close(damageMultiplierFor(stats,'ice'),1.18);close(damageMultiplierFor(stats,'fire'),1.1);close(damageMultiplierFor(stats,'weapon'),1.1);
const hero=createHero();hero.setEquipment(equipmentState(save));assert.equal(hero.equipment.gloves,true);assert.equal(hero.equipment.armor,'fire-guard');for(const a of hero.arms)assert.notEqual(a.fingers[0].material.color.getHexString(),'deb499');
const hands=await createHands(),other=await createHands(),skin=hands.hands[0].wrapper.getObjectByName('hand_skin'),otherSkin=other.hands[0].wrapper.getObjectByName('hand_skin');
const original=skin.material.color.getHexString();hands.setArmguard(equipmentState(save).armguard);assert.notEqual(skin.material.color.getHexString(),original);assert.equal(otherSkin.material.color.getHexString(),original);assert.notEqual(skin.material,otherSkin.material);
const glove=hands.hands[0].armguard;assert.equal(glove.parent,hands.hands[0].joints.wrist);assert.ok(glove.children.length>0);const q=hands.hands[0].joints.index_0.quaternion.clone();for(let i=0;i<40;i++)hands.update(1/60,i/60,3,false,false,0,false);assert.ok(q.angleTo(hands.hands[0].joints.index_0.quaternion)>.1);
hands.setArmguard(ARM_GUARDS[0]);assert.equal(skin.material.color.getHexString(),original);assert.equal(glove.parent,null);assert.equal(hands.armguardState().gloves,false);
for(const item of ARM_GUARDS){save.equipment.armguard=item.id;hero.setEquipment(equipmentState(save));const bounds=new T.Box3().setFromObject(hero.root);assert.ok(bounds.max.y<3.6);assert.equal(hero.equipment.armguard,item.id);}
console.log('PASS: exact normal/elite percentages, 10 village shops, unlimited ownership, migration/atomic purchases/save roundtrip, independent slots, additive spell-only bonuses, articulated armguards, real skinned gloves, per-rig isolation and restoration.');
