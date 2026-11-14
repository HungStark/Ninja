import assert from 'node:assert/strict';
import * as T from 'three';
import {createObstacleIndex} from '../src/obstacle-index.js';
import {disposeSceneResources} from '../src/scene-disposal.js';
import {splitTerrainForCulling,batchStaticScenery} from '../src/scenery-batches.js';
import {OpaqueInstanceBatch} from '../src/opaque-instance-batch.js';
import {FireArts} from '../src/fire-arts.js';
import {createStaticInstanceCuller} from '../src/static-instance-culling.js';

let seed=97;const random=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
const boxes=Array.from({length:500},()=>({x:random()*400-200,z:random()*400-200,w:1+random()*8,d:1+random()*8})),index=createObstacleIndex(boxes);
for(let i=0;i<10000;i++){const x=random()*450-225,z=random()*450-225,contains=o=>Math.abs(x-o.x)<o.w&&Math.abs(z-o.z)<o.d;assert.deepEqual(index.query(x,z).filter(contains),boxes.filter(contains));}
assert.ok(index.state().candidates<500*10000*.03,'spatial queries skip unrelated boxes');
const added={x:1000,z:-1000,w:2,d:2};boxes.push(added);assert.ok(index.query(1000,-1000).includes(added));boxes.pop();assert.ok(!index.query(1000,-1000).includes(added));

const geometry=new T.PlaneGeometry(320,320,32,32);geometry.rotateX(-Math.PI/2);const originalIndices=[...geometry.index.array],material=new T.MeshStandardMaterial(),terrain=new T.Mesh(geometry,material);terrain.receiveShadow=true;
assert.ok(splitTerrainForCulling(terrain)>1);assert.equal(terrain.layers.mask,0);
const actual=[];for(const cell of terrain.children){assert.equal(cell.material,material);assert.equal(cell.geometry.attributes.position,geometry.attributes.position);assert.equal(cell.receiveShadow,true);actual.push(...cell.geometry.index.array);const point=new T.Vector3();for(const i of cell.geometry.index.array){point.fromBufferAttribute(geometry.attributes.position,i);assert.ok(cell.geometry.boundingSphere.containsPoint(point));}}
const triangles=indices=>Array.from({length:indices.length/3},(_,i)=>indices.slice(i*3,i*3+3).join(',')).sort();assert.deepEqual(triangles(actual),triangles(originalIndices),'cell culling retains every authored triangle exactly once');
const land=new T.Group();for(let i=0;i<20;i++){const mesh=new T.Mesh(new T.PlaneGeometry(2,2,32,32),material);mesh.position.x=i*25;land.add(mesh);}const batches=batchStaticScenery(land);assert.ok(batches.groups>1);assert.equal(batches.sourceMeshes,20);

const root=new T.Group(),sharedGeometry=new T.BoxGeometry(),ownTexture=new T.Texture(),sharedTexture=new T.Texture();sharedTexture.userData.sharedCharacterTexture=true;
const ownMaterial=new T.MeshStandardMaterial({map:ownTexture,normalMap:sharedTexture}),depth=new T.MeshDepthMaterial();let instanceDisposed=0,geometryDisposed=0,textureDisposed=0,sharedDisposed=0,depthDisposed=0;
sharedGeometry.addEventListener('dispose',()=>geometryDisposed++);ownTexture.addEventListener('dispose',()=>textureDisposed++);sharedTexture.addEventListener('dispose',()=>sharedDisposed++);depth.addEventListener('dispose',()=>depthDisposed++);
for(let i=0;i<2;i++){const mesh=new T.InstancedMesh(sharedGeometry,ownMaterial,3);mesh.customDepthMaterial=depth;mesh.addEventListener('dispose',()=>instanceDisposed++);root.add(mesh);}
const disposed=disposeSceneResources(root,{materials:[ownMaterial],textures:[ownTexture]});
assert.equal(instanceDisposed,2);assert.equal(geometryDisposed,1);assert.equal(textureDisposed,1);assert.equal(sharedDisposed,0);assert.equal(depthDisposed,1);assert.equal(disposed.instances,2);

const scene=new T.Scene(),opaque=new OpaqueInstanceBatch(scene,sharedGeometry,material);opaque.begin(2);opaque.set(0,new T.Matrix4().makeTranslation(5,0,0));opaque.set(1,new T.Matrix4().makeTranslation(-5,0,0));opaque.finish();assert.equal(opaque.state().count,2);assert.ok(opaque.mesh.boundingSphere.radius>=5);
let oldDisposed=0;opaque.mesh.addEventListener('dispose',()=>oldDisposed++);opaque.begin(40);assert.equal(oldDisposed,1);assert.ok(opaque.state().capacity>=40);opaque.begin(0);assert.equal(opaque.mesh.visible,false);opaque.dispose();assert.equal(scene.children.length,0);
const decoration=new T.InstancedMesh(new T.BoxGeometry(),material,2);decoration.setMatrixAt(0,new T.Matrix4().makeTranslation(0,0,-5));decoration.setMatrixAt(1,new T.Matrix4().makeTranslation(100,0,-5));scene.add(decoration);
const camera=new T.PerspectiveCamera(45,1,.1,200),culler=createStaticInstanceCuller(decoration);camera.lookAt(0,0,-5);culler.update(camera);assert.equal(decoration.count,1);
const firstUploads=culler.state().uploads;culler.update(camera);assert.equal(culler.state().uploads,firstUploads,'stationary cameras do not upload instance matrices again');
camera.lookAt(100,0,-5);culler.update(camera);assert.equal(decoration.count,1);const visibleMatrix=new T.Matrix4();decoration.getMatrixAt(0,visibleMatrix);assert.equal(visibleMatrix.elements[12],100);
camera.lookAt(0,0,-5);culler.update(camera);decoration.getMatrixAt(0,visibleMatrix);assert.equal(visibleMatrix.elements[12],0,'turning back restores exact source matrices');
decoration.castShadow=true;assert.throws(()=>createStaticInstanceCuller(decoration),/without shadows/);

const arts=Object.assign(Object.create(FireArts.prototype),{scene,ribbonGeometries:new Map(),orbPool:[],orbAllocations:0,orbReuses:0,sphere:new T.SphereGeometry(),cone:new T.ConeGeometry(),fire:material,red:material,flame:material,gold:material,hot:material,glow:null});
const orb=arts.orb(true);orb.position.x=99;orb.userData.ribbons.visible=false;arts.releaseShotGroup(orb);assert.equal(arts.orb(true),orb);assert.equal(orb.position.x,0);assert.equal(orb.userData.ribbons.visible,true);
arts.releaseShotGroup(orb);for(let i=0;i<100;i++){const next=arts.orb(true);arts.releaseShotGroup(next);}assert.equal(arts.orbAllocations,1);assert.equal(arts.orbReuses,101);
const peak=Array.from({length:70},()=>arts.orb(true));for(const group of peak)arts.releaseShotGroup(group);assert.equal(arts.orbPool.length,32,'retained effects are bounded after a large battle');
console.log('PASS: exact terrain triangles/materials, spatial obstacle equivalence, instance-buffer/shadow-material disposal, shared textures, opaque batching and bounded reusable spell groups.');
