import assert from 'node:assert/strict';
import * as T from 'three';
import {SHURIKEN_TYPES,newEquipment,readEquipment,takeShuriken,cycleShuriken,ammoCount} from '../src/equipment.js';
import {ShurikenVisuals} from '../src/shuriken.js';
assert.deepEqual(SHURIKEN_TYPES.map(s=>s.damage),[4,5,7,10]);assert.equal(new Set(SHURIKEN_TYPES.map(s=>s.color)).size,4);
assert.deepEqual(SHURIKEN_TYPES.map(s=>!!s.energy),[false,false,false,true]);
const save={equipment:{...newEquipment(),shuriken:'chakra',ammo:{iron:1,steel:2,tempered:0,chakra:1}}};
const platinum=takeShuriken(save);assert.equal(platinum.id,'chakra');assert.equal(platinum.damage,10);assert.equal(platinum.energy,true);assert.equal(save.equipment.shuriken,'iron');assert.equal(ammoCount(save.equipment),3);
assert.equal(takeShuriken(save).damage,4);assert.equal(save.equipment.shuriken,'steel');assert.equal(takeShuriken(save).damage,5);assert.equal(takeShuriken(save).damage,5);assert.equal(takeShuriken(save),null);assert.equal(cycleShuriken(save),false);
save.equipment.ammo={iron:1,steel:0,tempered:2,chakra:1};save.equipment.shuriken='iron';assert.equal(cycleShuriken(save),true);assert.equal(save.equipment.shuriken,'tempered');cycleShuriken(save);assert.equal(save.equipment.shuriken,'chakra');cycleShuriken(save);assert.equal(save.equipment.shuriken,'iron');assert.equal(takeShuriken(save).id,'iron');assert.equal(save.equipment.shuriken,'tempered');
const reloaded=readEquipment({...save.equipment,shuriken:'steel'});assert.equal(reloaded.shuriken,'tempered');assert.deepEqual(readEquipment(reloaded),reloaded);
const scene=new T.Scene(),visuals=new ShurikenVisuals(scene),shots=SHURIKEN_TYPES.map((s,i)=>({...s,style:'shuriken',p:[i*.5,0,0],v:[0,0,36],age:0}));
visuals.update(shots);assert.equal(visuals.objects.size,4);
for(const shot of shots){const root=visuals.objects.get(shot),state=visuals.visualState(shot);assert.equal(state.bladeColor,shot.color);assert.equal(state.energy,!!shot.energy);const blade=root.getObjectByName('shuriken-blade');blade.geometry.computeBoundingBox();const size=blade.geometry.boundingBox.getSize(new T.Vector3());assert.ok(size.z<.02&&size.z<size.x*.1,'all four blades remain flat');const full=new T.Box3().setFromObject(root).getSize(new T.Vector3());assert.ok(full.z<.05,'the energy stays close to the blade plane');}
shots[3].age=.25;visuals.update(shots);assert.notEqual(visuals.visualState(shots[3]).energyRotation,0);assert.equal(visuals.objects.get(shots[0]).getObjectByName('platinum-blade-energy'),undefined);
visuals.reset();assert.equal(visuals.objects.size,0);assert.equal(scene.children.length,0);
console.log('PASS: 4/5/7/10 damage, four material colors, last-shot metadata, lowest-tier automatic fallback, T skips empty stacks, empty bag/reload, thin blades and platinum-only orbiting energy.');
