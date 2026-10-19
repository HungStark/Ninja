import assert from 'node:assert/strict';
import * as T from 'three';
import {createAdventureScene} from '../src/adventure-scene.js';
import {colliderFromGeometry} from '../src/adventure-colliders.js';
import {newJourney} from '../src/adventure-data.js';

// The bucketed sampler must retain the actual faceted surface, including points
// on cell/triangle boundaries; an analytic polygonal cone supplies the reference.
const cone=colliderFromGeometry(new T.ConeGeometry(25,36,20),new T.Matrix4().makeTranslation(0,18,0),'test-cliff');
for(let k=0;k<20;k++)for(const fraction of [.05,.25,.5,.75,.95]){
  const a=(k+.5)*Math.PI/10,r=25*Math.cos(Math.PI/20)*fraction;
  assert.ok(Math.abs(cone.topAt(Math.sin(a)*r,Math.cos(a)*r)-36*(1-fraction))<.0001);
  assert.ok(Math.abs(cone.bottomAt(Math.sin(a)*r,Math.cos(a)*r))<.0001);
}
globalThis.innerWidth=1280;globalThis.innerHeight=720;
const world=createAdventureScene(),save=newJourney();save.village='fire';world.load('fire',save);
const cliff=world.scene.getObjectByName('fire-rock-cliff');
assert.equal(cliff.children.filter(o=>o.isMesh&&o.visible).length,1,'the entire static cliff has one render mesh');
assert.ok(cliff.userData.renderTriangles<2000,'the low-poly cliff stays within its geometry budget');
// Adjacent triangles can share edges; overlapping horizontal faces at the same
// height cause the stripes/flicker seen when looking down from the summit.
const area=poly=>poly.reduce((sum,p,i)=>{const q=poly[(i+1)%poly.length];return sum+p[0]*q[1]-q[0]*p[1];},0)/2;
const overlap=(subject,clip)=>{let result=subject;const sign=Math.sign(area(clip));for(let k=0;k<3&&result.length;k++){const a=clip[k],b=clip[(k+1)%3],distance=p=>sign*((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])),next=[];for(let j=0;j<result.length;j++){const p=result[j],q=result[(j+1)%result.length],dp=distance(p),dq=distance(q);if(dp>=0)next.push(p);if((dp>=0)!==(dq>=0)){const t=dp/(dp-dq);next.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}}result=next;}return Math.abs(area(result));};
const position=cliff.children[0].geometry.attributes.position,tops=[];
for(let k=0;k<position.count;k+=3){const y=position.getY(k);if(y<35.9||Math.abs(y-position.getY(k+1))>.0001||Math.abs(y-position.getY(k+2))>.0001)continue;tops.push({y,points:[0,1,2].map(j=>[position.getX(k+j),position.getZ(k+j)])});}
for(let i=0;i<tops.length;i++)for(let j=i+1;j<tops.length;j++)if(Math.abs(tops[i].y-tops[j].y)<.001)assert.ok(overlap(tops[i].points,tops[j].points)<.0001,'summit top faces never overlap at the same depth');
assert.equal(cliff.userData.carved,true);assert.equal(cliff.userData.stepCount,124);
assert.equal(world.solids.filter(s=>s.name==='fire-cliff-ledge').length,0,'the route uses cuts in the mountain, not separately attached rocks');
assert.ok(world.routes[0].carved.rise<.4,'each carved riser is a walkable height');
assert.equal(world.solids.filter(s=>s.name==='fire-cliff-mass').length,1,'the whole staircase shares one indexed mountain collider');
const middle=world.routes[0].carved.path[70],resume=newJourney();resume.village='fire';resume.position=[middle.x,middle.z];resume.elevation=middle.y;world.load('fire',resume);
assert.ok(Math.abs(world.hero.root.position.y-middle.y)<.05,'a save halfway up the carved staircase restores the correct step');
world.load('nameless',newJourney());
const houses=world.scene.getObjectsByProperty('name','village-house'),bodies=world.solids.filter(s=>s.name==='closed-house-body');assert.equal(bodies.length,houses.length);
for(const house of houses){assert.equal(house.userData.closedBuilding,true);assert.equal(house.getObjectByName('closed-house-body').visible,false,'collision volumes never become visible during scenery batching');const body=bodies.find(s=>Math.hypot(s.x-house.position.x,s.z-house.position.z)<.01);assert.ok(body);assert.equal(body.stepable,false);assert.ok(!body.topAt,'each house uses a simple solid volume');const f=house.userData.footprint;for(const x of [-.4,0,.4])assert.ok(!world.canHeroMove(f.x+x,f.z+f.d/2),'the entire doorway blocks entry');}
console.log(`PASS: exact bucketed slope samples, one ${cliff.userData.renderTriangles}-triangle cliff, 124 carved steps sharing one mountain collider and ${houses.length} closed cottages with invisible solid collision bodies.`);
