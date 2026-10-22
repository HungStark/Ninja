import assert from 'node:assert/strict';
import * as T from 'three';
import {createContactShadows,villageLighting} from '../src/adventure-presentation.js';
import {createVillageSurfaces} from '../src/adventure-materials.js';
import {createVillager} from '../src/villager.js';
import {villagerAppearance} from '../src/villager-appearance.js';
import {REGIONS} from '../src/adventure-world.js';

const shadows=createContactShadows(new T.Scene(),4),person={root:new T.Group()},hidden={root:new T.Group()};hidden.root.visible=false;
const slope=(x,z)=>x*.1+z*.05;person.root.position.set(3,.5,4);shadows.update([person,hidden],slope);assert.equal(shadows.mesh.count,1);
const matrix=new T.Matrix4();shadows.mesh.getMatrixAt(0,matrix);assert.ok(Math.abs(matrix.elements[13]-.535)<.0001,'shadow follows sloping support, not the character center');
assert.equal(shadows.mesh.geometry.getAttribute('contactStrength').getX(0),1);
person.root.position.y=2;shadows.update([person],slope);assert.equal(shadows.mesh.geometry.getAttribute('contactStrength').getX(0),.5,'jump shadow fades with height');
person.root.position.y=5;shadows.update([person],slope);assert.equal(shadows.mesh.count,0);assert.equal(shadows.mesh.material.depthWrite,false);
for(const id of Object.keys(REGIONS)){
 const surfaces=createVillageSurfaces(id);assert.ok(surfaces);assert.ok(surfaces.ground.vertexColors);assert.notEqual(surfaces.wood.bumpMap,surfaces.wood.map);assert.notEqual(surfaces.wood.roughnessMap.colorSpace,T.SRGBColorSpace);
 assert.ok(surfaces.roof.metalness>(id==='lightning'?.5:-1));assert.notDeepEqual(surfaces.wood.roughnessMap.image.data,surfaces.stone.roughnessMap.image.data);
 const light=villageLighting(id);assert.ok(light.ambient<light.intensity);assert.ok(light.fill<.5);
}
const model=createVillager(villagerAppearance('water',{kind:'chief'})),eyes=model.root.getObjectByName('expressive-eyes');let closed=false,opened=false;
for(let i=0;i<500;i++){model.update(i/60,false,null,1/60,new T.Vector3(2,0,3));closed ||= eyes.scale.y<.2;opened ||= eyes.scale.y>.99;assert.ok(Math.abs(model.head.rotation.x)<.3);assert.ok(Math.abs(model.head.rotation.y)<1);}
assert.ok(closed&&opened,'NPC eyes open and blink');assert.ok(model.root.userData.expression.lookYaw>0,'nearby player receives a restrained head turn');
model.update(10,false,null,1/60,new T.Vector3(0,0,-3));const turn=model.root.userData.expression.lookYaw;for(let i=0;i<120;i++)model.update(10+i/60,false,null,1/60,new T.Vector3(0,0,-3));assert.ok(Math.abs(model.root.userData.expression.lookYaw)<turn*.01,'NPC does not twist around to follow someone behind');
console.log('PASS: grounded slope/jump/hidden-character contact shadows, differentiated linear relief/roughness in ten villages, restrained lighting, blinking and eased attention without head drift.');
