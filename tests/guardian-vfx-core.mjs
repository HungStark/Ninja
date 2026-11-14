import assert from 'node:assert/strict';
import * as T from 'three';
import {createGuardianVfx} from '../src/guardian-vfx.js';
const scene=new T.Scene(),vfx=createGuardianVfx();vfx.attach(scene,'fire');
const material=vfx.surface(.9);assert.equal(vfx.surface(.9),material,'repeated casts share the shader');let released=0;material.addEventListener('dispose',()=>released++);
const particles=scene.getObjectByName('guardian-spell-vfx').children.find(o=>o.isInstancedMesh);let buffersReleased=0;particles.addEventListener('dispose',()=>buffersReleased++);
const geometries={...vfx.geo};let peak=0;
for(let i=0;i<600;i++){vfx.burst([0,1,0],2);vfx.update(1/60,i/60,[],[0,0,0],null);peak=Math.max(peak,vfx.state().particles);assert.ok(vfx.state().particles<=vfx.state().capacity);}
assert.ok(peak>0);assert.ok(vfx.state().materials<12,'repeated bursts do not allocate materials');
vfx.attach(scene,'ice');vfx.update(1/60,0,[],[0,0,0],null);assert.equal(vfx.state().particles,0,'new encounter clears old sparks');assert.ok(Object.keys(geometries).every(k=>geometries[k]===vfx.geo[k]));
vfx.dispose();assert.equal(scene.children.length,0);assert.equal(released,1);assert.equal(buffersReleased,1,'release instance buffers when disposing the combat system');
console.log('PASS: shared guardian shaders/geometries, bounded particle pool, encounter reset and single disposal of materials and GPU instance buffers.');
