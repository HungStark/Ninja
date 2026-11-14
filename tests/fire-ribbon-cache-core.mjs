import assert from 'node:assert/strict';
import * as T from 'three';
import {FireArts} from '../src/fire-arts.js';

// Test sharing/lifetime without browser-only texture creation.
const arts=Object.assign(Object.create(FireArts.prototype),{
  scene:new T.Scene(),ribbonGeometries:new Map(),gold:new T.MeshBasicMaterial()
});
const first=new T.Group(),second=new T.Group();arts.scene.add(first,second);
const a=arts.ribbon(first,1.4,5,1.05,0);
const b=arts.ribbon(second,1.4,5,1.05,0,new T.MeshBasicMaterial({color:'red'}));
assert.equal(a.geometry,b.geometry,'identical ribbons share uploaded geometry even with different materials');
assert.notEqual(a.material,b.material,'geometry sharing does not replace authored colors');
assert.notEqual(arts.ribbon(second,1.4,5,1.05,Math.PI).geometry,a.geometry,'different shapes keep separate geometry');
const expectedVertices=a.geometry.attributes.position.count;
let sharedDisposed=0,ownedDisposed=0;a.geometry.addEventListener('dispose',()=>sharedDisposed++);
const owned=new T.BoxGeometry();owned.addEventListener('dispose',()=>ownedDisposed++);first.add(new T.Mesh(owned,arts.gold));
arts.disposeGroup(first);
assert.equal(first.parent,null);assert.equal(sharedDisposed,0,'despawning one projectile cannot invalidate another live projectile');
assert.equal(ownedDisposed,1,'projectile-owned geometry is still released');
assert.equal(b.geometry.attributes.position.count,expectedVertices);
for(let i=0;i<100;i++){
  const group=new T.Group();arts.scene.add(group);
  assert.equal(arts.ribbon(group,1.4,5,1.05).geometry,a.geometry);
  arts.disposeGroup(group);
}
assert.equal(arts.ribbonGeometries.size,2,'repeated casts do not grow the geometry cache');
assert.equal(sharedDisposed,0);
console.log('PASS: repeated spell geometry reuse, independent materials/shapes, bounded cache and live-projectile disposal safety.');
