import assert from 'node:assert/strict';
import * as T from 'three';
import kit from '../assets/fantasy-kit.json' with {type:'json'};
import {sceneryGeometry,sculptedSurface,litCharacterMaterial} from '../src/fantasy-scenery.js';
import {registerSceneryColliders} from '../src/adventure-colliders.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {newJourney,VILLAGES} from '../src/adventure-data.js';
import {GUARDIAN_FORMS} from '../src/guardian-beasts.js';
import {createEncounterCreature} from '../src/encounter-appearance.js';

for(const [name,data] of Object.entries(kit)){
 const geometry=sceneryGeometry(name),p=geometry.attributes.position,n=geometry.attributes.normal;
 assert.ok(p.count/3<1100,name+' geometry budget');
 assert.equal(p.count,n.count);assert.equal(p.count,geometry.attributes.color.count);
 assert.equal(p.count,geometry.attributes.uv.count);
 assert.ok([...p.array,...n.array].every(Number.isFinite));
 for(let i=0;i<n.count;i++)assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<.001,name+' exported normals');
 geometry.computeBoundingBox();assert.ok(geometry.boundingBox.max.y<1.5);assert.ok(geometry.boundingBox.min.y> -1.5);
 assert.equal(data.position.length,p.array.length);geometry.dispose();
}
const rock=new T.Mesh(sceneryGeometry('weathered-rock-0'),new T.MeshStandardMaterial()),root=new T.Group(),solids=[];root.add(rock);
registerSceneryColliders(root,{addBox:c=>solids.push(c)});
assert.equal(solids.length,1,'custom Blender geometry participates in the existing collision pipeline');
assert.ok(solids[0].topAt(0,0)>.5);

const map=new T.Texture(),source=new T.MeshBasicMaterial({name:'Hero tops cloth',map,color:'#762936'}),lit=litCharacterMaterial(source);
assert.ok(lit.isMeshStandardMaterial);assert.equal(lit.map,source.map);assert.equal(lit.color.getHex(),source.color.getHex());
assert.equal(lit.side,source.side);assert.equal(lit.alphaTest,source.alphaTest);
sculptedSurface(lit,{fabric:true});assert.equal(lit.color.getHex(),source.color.getHex());
assert.equal(sculptedSurface(source),source,'unlit eye/face material cannot receive a shader requiring normals');

globalThis.innerWidth=1280;globalThis.innerHeight=800;
const world=createAdventureScene(),report=[];
for(const v of VILLAGES){
 const save=newJourney();save.village=v.id;world.load(v.id,save);
 const river=world.scene.getObjectByName('river-surface');
 assert.equal(river.material.userData.landscapeWater.frozen,v.id==='ice');
 assert.equal(river.material.userData.landscapeWater.lava,v.id==='fire');
 const crowns=world.scene.getObjectByName('vegetation-crowns');
 if(v.id!=='nameless'){
  assert.equal(crowns.material.color.getHexString(),new T.Color(v.tree).getHexString(),'village foliage palette');
  assert.match(crowns.geometry.name,/blender-/);assert.ok(crowns.customDepthMaterial);
 }else assert.ok(world.scene.getObjectByName('war-scarred-vegetation').userData.deadTrees>40,'Vô Danh retains the war-scarred forest');
 const houses=world.scene.getObjectsByProperty('name','village-house');assert.ok(houses.length>10);
 const terrain=world.scene.getObjectByName('village-terrain');world.setQuality(2);assert.equal(terrain.material.bumpMap,null);world.setQuality(0);assert.ok(terrain.material.bumpMap);world.setQuality(1);
 const beast=createEncounterCreature(v.id);assert.equal(beast.form.shape,GUARDIAN_FORMS[v.id].shape);assert.equal(beast.form.name,GUARDIAN_FORMS[v.id].name);
 beast.update(.5,true,false,1);beast.root.updateMatrixWorld(true);assert.ok(beast.mouthPosition().toArray().every(Number.isFinite));beast.dispose();
 report.push({id:v.id,houses:houses.length,trees:crowns?.count??'war-scarred',solids:world.solids.length});
}
console.log(JSON.stringify(report));
console.log('PASS: seven Blender meshes, valid normals/budgets, real rock collisions, preserved garment textures/colors, ten village palettes/architecture/guardian forms, and restored quality settings.');
