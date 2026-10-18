import assert from 'node:assert/strict';
import * as T from 'three';
import {buildHouse,buildGabledRoof} from '../src/adventure-landmarks.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {LANDSCAPES,terrainHeight,riverAt,waterwayAt} from '../src/adventure-world.js';
import {newJourney,village} from '../src/adventure-data.js';

globalThis.innerWidth=1440;globalThis.innerHeight=960;
const material=new T.MeshStandardMaterial(),mesh=(geometry,material,parent,x=0,y=0,z=0)=>{const o=new T.Mesh(geometry,material);o.position.set(x,y,z);parent.add(o);return o;};
const context={id:'nameless',v:village('nameless'),M:()=>material,mesh,box:(p,m,x,y,z,w,h,d)=>mesh(new T.BoxGeometry(w,h,d),m,p,x,y,z),cyl:(p,m,x,y,z,r,h,n)=>mesh(new T.CylinderGeometry(r,r,h,n),m,p,x,y,z),group:(x,z)=>{const g=new T.Group();g.position.set(x,0,z);return g;},obstacle:()=>{},heightAt:(x,z)=>x*.14-z*.08,animated:[]};
for(const [w,d] of [[3,3],[5.7,5.3]]){
  const roof=new T.Group();buildGabledRoof(context,roof,w,d,3,.44,material,material);roof.updateMatrixWorld(true);
  const slopes=roof.children.filter(o=>o.name==='roof-slope');assert.equal(slopes.length,2);
  for(const panel of slopes){const half=panel.geometry.parameters.width/2,left=new T.Vector3(-half,0,0).applyMatrix4(panel.matrixWorld),right=new T.Vector3(half,0,0).applyMatrix4(panel.matrixWorld),inner=Math.abs(left.x)<Math.abs(right.x)?left:right,outer=inner===left?right:left;assert.ok(inner.y>outer.y+.5,'the ridge must be above the eave, not a V-shaped roof');assert.ok(Math.abs(inner.x)<.08,'roof planes meet at the ridge');}
  const gable=roof.getObjectByName('roof-gable');assert.ok(gable);gable.geometry.computeBoundingBox();assert.ok(gable.geometry.boundingBox.max.y>.8,'the space beneath the roof is closed');
  const house=buildHouse(context,12,-8,w,d,0),foundation=house.getObjectByName('house-foundation');assert.ok(foundation);const top=house.position.y+foundation.position.y+foundation.geometry.parameters.height/2,bottom=top-foundation.geometry.parameters.height;
  for(const sx of [-1,1])for(const sz of [-1,1]){const ground=context.heightAt(12+sx*(w/2+.2),-8+sz*(d/2+.2));assert.ok(top>=ground);assert.ok(bottom<ground,'foundation reaches the ground at every corner');}
}
const world=createAdventureScene();let crossings=0;
for(const id of Object.keys(LANDSCAPES)){
  const save=newJourney();save.village=id;world.load(id,save);
  assert.ok(world.scene.getObjectsByProperty('name','village-house').length>=15,`${id}: houses remain present`);
  for(let z=-65;z<=65;z+=5){const r=riverAt(id,z);assert.ok(terrainHeight(id,r.x,z)<r.y-.7,'the river has a real channel beneath the water');const edge=id==='water'?waterwayAt(r.x+r.width,z):null,bank=id==='water'?waterwayAt(r.x+r.width+r.bank,z):null;if(!edge||edge.axis==='z'&&Math.abs(edge.center-r.x)<.001)assert.ok(Math.abs(terrainHeight(id,r.x+r.width,z)-r.y)<1e-6,'water edge meets its bank outside canal junctions');if(!bank||bank.distance>bank.width+5)assert.ok(terrainHeight(id,r.x+r.width+r.bank,z)>r.y+.2);}
  assert.ok(Math.abs(terrainHeight(id,0,0))<1e-9);assert.ok(Math.abs(terrainHeight(id,0,7))<1e-9,'the initial village square stays level');
  let low=Infinity,high=-Infinity;const bound=60*world.metrics.scale;for(let x=-bound;x<=bound;x+=6)for(let z=-bound;z<=bound;z+=6){const h=terrainHeight(id,x,z);low=Math.min(low,h);high=Math.max(high,h);}assert.ok(high-low>8,`${id}: visible elevation relief`);
  const river=world.scene.getObjectByName('river-surface');assert.ok(river);const pos=river.geometry.attributes.position;for(let i=0;i<pos.count;i++){const r=riverAt(id,pos.getZ(i));assert.ok(Math.abs(pos.getY(i)-r.y-.025)<1e-5,'water follows its level instead of draping over hills');}
  if(id==='ice')for(let z=-60;z<=60;z+=6){const r=riverAt(id,z);assert.ok(world.heightAt(r.x,z)>=r.y,'characters stand on the frozen surface');}
  assert.ok(world.scene.getObjectByName('river-gravel').count>200);assert.ok(world.scene.getObjectByName('landscape-boulders').count>0);
  for(const b of world.bridges){crossings++;assert.ok(world.heightAt(b.x,b.z)>riverAt(id,b.z).y+.1,'a crossing stays above the water');for(let k=0;k<=20;k++){const along=-b.half+k*b.half/10,x=b.x+b.dx*along,z=b.z+b.dz*along;assert.equal(world.blocked(x,z),false,`${id}: bridge approach is unobstructed`);assert.ok(Number.isFinite(world.heightAt(x,z)));}}
}
assert.ok(crossings>=20);
console.log('PASS: pitched roofs meet at raised ridges with closed gables, house foundations reach sloping ground, ten sculpted terrains retain flat plazas, carved riverbeds/level water, gravel/boulders and unobstructed bridges.');
