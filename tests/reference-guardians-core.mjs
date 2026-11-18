import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import firstFive from '../assets/guardians/reference-guardians.json' with {type:'json'};
import lastFive from '../assets/guardians/later-guardians.json' with {type:'json'};
import {createEncounterCreature} from '../src/encounter-appearance.js';

const assets={...firstFive,...lastFive};
assert.deepEqual(new Set(Object.keys(assets)),new Set(['nameless','fire','water','lightning','wind','earth','wood','ice','light','dark']));
for(const [id,asset]of Object.entries(assets)){
 assert.ok(asset.triangles<30000);assert.ok(asset.meshes.length<=50);
 const file=await fs.readFile(`assets/guardians/${id}.glb`);assert.ok(file.length<1.2*1048576);
 const gltf=await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'');
 assert.equal(gltf.scenes.length,1);assert.equal(gltf.scene.getObjectByName('Cube'),undefined,'export contains only the intended guardian');
 const skinned=gltf.scene.getObjectsByProperty('isSkinnedMesh',true);assert.ok(skinned.length>0);
 const boneNames=new Set(skinned[0].skeleton.bones.map(b=>b.name));assert.ok(boneNames.has('head'));
 if(id==='water'){assert.ok(boneNames.has('flow-12'));assert.ok(![...boneNames].some(n=>n.startsWith('wing-')));}
 const model=createEncounterCreature(id),body=model.root.children[0],rig=body.referenceRig;assert.ok(rig);
 let triangles=0;const sources=[];
 model.root.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position,n=o.geometry.attributes.normal,index=o.geometry.index;
  assert.ok(index);triangles+=index.count/3;assert.ok([...p.array].every(Number.isFinite));assert.ok([...index.array].every(k=>k<p.count));
  for(let k=0;k<n.count;k++)assert.ok(Math.abs(Math.hypot(n.getX(k),n.getY(k),n.getZ(k))-1)<.001);
  sources.push(o);
 });assert.equal(triangles,asset.triangles);
 const neutral=model.mouthPosition({}).clone(),pulled=model.mouthPosition({headPull:.35}).clone();assert.ok(Math.abs(neutral.distanceTo(pulled)-.35)<.0001,'head and mouth retain world-space recoil');model.setArtPose();
 for(let k=0;k<=90;k++){model.setCombatState({aiOwnedMovement:true,moveSpeed:3,bossPosition:[k/20,0,0],offset:{yaw:0}});model.update(k/60,true,false,3);}
 const motion=model.animationState();assert.ok(motion.stride>0);
 if(id==='fire'){assert.equal(motion.tailCount,9);assert.equal(sources.filter(m=>/^fire-tail-\d+$/.test(m.name)).length,9);}
 if(id==='water'){assert.equal(motion.wingCount,0);assert.equal(motion.swimming,true);assert.equal(motion.legCount,0);assert.ok(rig.flowMeshes.length>0);assert.ok(asset.meshes.some(m=>m.kind==='water'));}
 if(id==='wind'||id==='light')assert.equal(motion.wingCount,2);
 if(['earth','wood','ice','dark'].includes(id))assert.equal(motion.legCount,4);
 if(id==='earth'){
  assert.ok(asset.meshes.some(m=>m.kind==='water')&&asset.meshes.some(m=>m.kind==='crystal'));
  model.setCombatState({mechanics:{toppled:true}});model.update(1.55,false,true);assert.equal(body.rotation.z,Math.PI/2);
 }
 if(id==='dark'){
  const eye=rig.head.getObjectByName('guardian-eye');assert.ok(eye);
  model.setCombatState({mechanics:{trueTell:true}});assert.equal(eye.material.emissiveIntensity,2);
  model.setCombatState();assert.equal(eye.material.emissive.getHexString(),'6affed');
 }
 model.root.updateMatrixWorld(true);assert.ok(model.mouthPosition().toArray().every(Number.isFinite));
 const before=rig.head.position.clone();model.setCombatState({action:{role:'melee',age:.45,parameters:{windup:.9}}});model.update(1.6,false);assert.ok(model.animationState().charge>.4);
 model.mouthPosition();assert.ok(rig.head.position.distanceTo(before)>.01);
 let disposed=0;for(const m of new Set(sources.map(m=>m.material)))m.addEventListener('dispose',()=>disposed++);model.dispose();assert.equal(disposed,new Set(sources.map(m=>m.material)).size,'all per-part GPU materials are released');
 console.log(`${id}: ${triangles} triangles, ${asset.meshes.length} parts, ${boneNames.size} exported bones`);
}
console.log('PASS: ten rigged GLBs, mesh budgets, mouth recoil, articulated movement, Earth topple, Dark eye tell, wingless dragon and complete disposal.');
