import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as T from 'three';
import {newJourney,readJourney,SAVE_KEY,VILLAGES,findPath} from '../src/adventure-data.js';
import {ARMORS,BAGS,SHURIKEN_TYPES,equipmentState,readEquipment,ammoCount,buyEquipment,equipItem,takeShuriken,emergencySupply} from '../src/equipment.js';
import {createHero} from '../src/hero.js';
import {createAdventureScene} from '../src/adventure-scene.js';

const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
let save=newJourney();assert.equal(save.hero.hair,'#d6dce2');assert.equal(equipmentState(save).count,10);
const legacy={...save,hero:{name:'Old hero',coat:'#345c63',hair:'#252b32'},gold:270,equipment:undefined,bosses:{water:true}};
const migrated=readJourney({getItem:key=>key===SAVE_KEY?JSON.stringify(legacy):null});assert.equal(migrated.gold,270);assert.equal(migrated.bosses.water,true);assert.equal(migrated.hero.hair,'#d6dce2');assert.equal(ammoCount(migrated.equipment),10);
const invalid=readEquipment({version:1,armor:'not-owned',bag:'pouch-240',ownedArmor:['bogus'],ownedBags:['bogus'],ammo:{iron:100000,steel:9,chakra:-10}});assert.equal(ammoCount(invalid),10);assert.equal(invalid.bag,'pouch-30');assert.equal(invalid.armor,'traveler');
assert.deepEqual(BAGS.map(b=>b.capacity),[10,20,30,50]);
for(const bag of BAGS){const old=readEquipment({version:1,bag:bag.id,ownedBags:[bag.id],ammo:{iron:100,steel:10,tempered:10,chakra:10}});assert.equal(old.bag,bag.id);assert.equal(ammoCount(old),bag.capacity);assert.equal(old.ammo.chakra,10);assert.equal(old.ownedBags.includes(bag.id),true);assert.deepEqual(readEquipment(old),old);}
assert.deepEqual(SHURIKEN_TYPES.map(s=>s.damage),[4,7,11,16]);assert.ok(SHURIKEN_TYPES.every((s,i,list)=>i===0||s.price>list[i-1].price));
save.gold=1000;assert.equal(buyEquipment(save,'steel').ok,false);assert.equal(save.gold,1000,'a full pouch never consumes money');assert.ok(buyEquipment(save,'pouch-60').ok);assert.equal(save.equipment.bag,'pouch-60');assert.ok(buyEquipment(save,'steel').ok);assert.equal(save.gold,896);assert.equal(ammoCount(save.equipment),20);assert.equal(equipItem(save,'bag','pouch-30'),false);assert.equal(buyEquipment(save,'pouch-60').ok,false);assert.equal(save.gold,896);
assert.equal(buyEquipment(save,'water-guard').ok,false,'regional armor is sold by its own village');save.village='water';assert.ok(buyEquipment(save,'water-guard').ok);assert.equal(save.equipment.armor,'water-guard');assert.equal(save.gold,756);assert.equal(buyEquipment(save,'water-guard').ok,false);assert.equal(save.gold,756);
assert.ok(equipItem(save,'shuriken','steel'));for(let i=0;i<10;i++)assert.equal(takeShuriken(save).damage,7);assert.equal(takeShuriken(save),null);assert.equal(ammoCount(save.equipment),10);assert.ok(equipItem(save,'shuriken','iron'));for(let i=0;i<10;i++)takeShuriken(save);save.gold=0;assert.equal(emergencySupply(save),true);assert.equal(ammoCount(save.equipment),10);assert.equal(emergencySupply(save),false);
assert.equal(equipItem(save,'armor','dark-elite'),false);assert.equal(buyEquipment(save,'chakra').ok,false);assert.equal(save.gold,0);
const roundTrip=readJourney({getItem:()=>JSON.stringify(save)});assert.deepEqual(roundTrip.equipment,save.equipment);

const context={};vm.runInNewContext(fs.readFileSync('game-core.js','utf8'),context);const {Fighter}=context.SealGameCore;
const fighter=new Fighter();fighter.autoRestore=false;fighter.resistances=equipmentState(save).armor.resistances;
close(fighter.receive(40,false,false,'water').damage,30);close(fighter.receive(40,false,false,'ice').damage,35.2);close(fighter.receive(40,false,false,'fire').damage,40);close(fighter.receive(4,false,false,'weapon').damage,4);
fighter.hp=200;fighter.shield=50;close(fighter.receive(100,false,false,'water').damage,25);close(fighter.hp,175);fighter.reflect=1;assert.equal(fighter.receive(100,false,false,'water').reflected,true);close(fighter.hp,175);
fighter.waterWeaponTime=10;assert.equal(fighter.waterWeapon({damage:4,speed:10}).damage,10);assert.equal(fighter.waterWeapon({damage:16,speed:10}).damage,22);
const hero=createHero();assert.ok(hero.root.getObjectByName('hero-covered-eye'));assert.ok(hero.root.getObjectsByProperty('name','hero-silver-hair').length>=8);
for(const armor of ARMORS){hero.setEquipment({armor,bag:BAGS[3]});hero.update(1,true,{x:2,z:1},.016);const size=new T.Box3().setFromObject(hero.root).getSize(new T.Vector3());assert.ok(size.y>2.8&&size.y<3.6);assert.equal(hero.root.userData.equipment.armor,armor.id);assert.ok(size.toArray().every(Number.isFinite));}
hero.airPose(1);hero.climbPose(2);
globalThis.innerWidth=1440;globalThis.innerHeight=960;const world=createAdventureScene();
for(const v of VILLAGES){
  const journey=newJourney();journey.village=v.id;world.load(v.id,journey);const shops=world.scene.getObjectsByProperty('name','village-shop');assert.equal(shops.length,1,v.id);const plot=shops[0].userData.plot,entry=world.interactives.find(i=>i.kind==='shop');assert.ok(entry);assert.ok(findPath([0,7],[entry.x,entry.z],world.blocked).length,`${v.id}: the shop has a walkable approach`);assert.ok(world.solids.some(s=>s.name==='shop-closed-building'));assert.equal(world.solids.filter(s=>s.name==='shop-entry-step').length,7);assert.equal(world.hero.root.name,'silver-masked-hero');
  world.hero.root.position.set(entry.x,world.heightAt(entry.x,entry.z+1),entry.z+1);world.update(.016,false);
  for(let i=0;i<120;i++){world.moveHero(0,-.06);world.update(1/60,true);}
  close(world.hero.root.position.y,plot.base+.45);assert.ok(world.hero.root.position.z<plot.z+7,`${v.id}: the porch is reached by walking up solid steps`);
  for(let i=0;i<90;i++){world.moveHero(0,-.06);world.update(1/60,true);}assert.ok(world.hero.root.position.z>=plot.z+4.3,`${v.id}: closed shop doors block the player`);
  const before=world.hero.root.position.z;for(let i=0;i<15;i++){world.moveHero(0,.08);world.update(1/60,true);}assert.ok(world.hero.root.position.z>before+1,`${v.id}: backing away from the storefront never gets stuck`);
  journey.bosses={water:true,fire:true,lightning:true};world.load(v.id,journey);const after=world.interactives.find(i=>i.kind==='shop');assert.deepEqual([after.x,after.z],[entry.x,entry.z],`${v.id}: story progress does not move the store`);
}
console.log('PASS: legacy/sanitized inventory, finite ammo, capacity, prices, ownership, atomic purchases, gear save/reload, elemental resistance/reflection/shield math, upgraded water shuriken, hero armor models and one accessible shop in every village.');
