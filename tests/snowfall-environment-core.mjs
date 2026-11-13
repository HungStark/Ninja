import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {SnowSurfaces,SnowfallVfx,snowCoverOpacity} from '../src/snowfall-vfx.js';
import {NatureArts} from '../src/nature-arts.js';

const scene=new T.Scene(),scenery=new T.Group();scene.add(scenery);
const mesh=(geometry,position,kind)=>{const m=new T.Mesh(geometry,new T.MeshBasicMaterial());m.position.fromArray(position);m.userData.snowSurface=kind;scenery.add(m);return m;};
const ground=mesh(new T.PlaneGeometry(48,66,24,33).rotateX(-Math.PI/2),[0,0,-9],'ground');ground.userData.snowBasePositions=ground.geometry.attributes.position.array.slice();
const fence=mesh(new T.BoxGeometry(12,.15,.2),[0,1.3,-5],'fence');
const rock=mesh(new T.IcosahedronGeometry(1,1),[4,.6,-10],'rock');rock.rotation.z=.3;
const water=mesh(new T.PlaneGeometry(5,5).rotateX(-Math.PI/2),[-6,.15,-10],'water');
let deformation=0;const sources=()=>[scenery],surfaces=new SnowSurfaces(sources,()=>deformation);
assert.equal(surfaces.sync(),true);assert.equal(surfaces.sync(),false);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
close(surfaces.groundAt(0,-4),0);deformation=2;close(surfaces.groundAt(0,-4),2);deformation=0;
close(surfaces.contact(new T.Vector3(0,8,-5),new T.Vector3(0,-1,0),20),8-1.375);
// A slanted flake hits the side instead of tunnelling through a thin rail.
close(surfaces.contact(new T.Vector3(0,1.4,-4),new T.Vector3(0,-.1,-1),5),.9);
close(surfaces.contact(new T.Vector3(-6,8,-10),new T.Vector3(0,-1,0),20),7.85);
scenery.visible=false;assert.equal(surfaces.sync(),true);assert.equal(surfaces.entries.length,0);scenery.visible=true;

for(let step=0;step<=10;step++){
  close(snowCoverOpacity(step*9/90),step/10);
  if(step>0)close(snowCoverOpacity((step*9-.001)/90),(step-1)/10);
}
close(snowCoverOpacity(-1),0);close(snowCoverOpacity(2),1);
const grass=new T.Mesh(new T.PlaneGeometry(),new T.MeshBasicMaterial({vertexColors:true}));
let windCompiled=false;grass.material.onBeforeCompile=()=>{windCompiled=true;};
const vfx=new SnowfallVfx(scene,()=>deformation,{snowSurfaces:sources,snowGrass:grass});
const grassShader={uniforms:{},fragmentShader:'#include <color_fragment>'};grass.material.onBeforeCompile(grassShader);
assert.ok(windCompiled,'Snow tint preserves the existing grass shader');assert.equal(grassShader.uniforms.snowCoverage,vfx.grassCoverage);
const camera=new T.PerspectiveCamera(40,1.6,.1,200);camera.position.set(8,39,32);camera.lookAt(0,0,-8);camera.updateMatrixWorld(true);
const update=(time,extra={})=>vfx.update({snowing:true,amount:1,time,fallTime:time,boosted:false,quality:1,camera,...extra});
update(10);
assert.equal(vfx.state().layers.length,3);assert.ok(vfx.state().layers.every(l=>l.flakes>0));
assert.ok(vfx.state().surfaceTriangles>0);assert.ok(vfx.state().edgeDrifts>=4);assert.equal(vfx.state().drawCalls,5);
assert.equal(vfx.state().coveragePercent,100);assert.ok(vfx.state().waterTriangles>0);
for(const m of [vfx.cover,vfx.riverCover,vfx.caps,vfx.driftMesh])assert.equal(m.material.uniforms.opacity.value,1);
assert.equal(vfx.grassCoverage.value,1);
const riverPositions=vfx.riverCover.geometry.attributes.position;
for(let i=0;i<riverPositions.count;i++)close(riverPositions.getY(i),.176);
assert.ok(vfx.riverCover.geometry.attributes.coverage.array.every(v=>v===1),'River snow has no holes');
const coverPositions=vfx.cover.geometry.attributes.position,coverOpacity=vfx.cover.geometry.attributes.coverage;
let submerged=0;
for(let i=0;i<coverPositions.count;i++)if(Math.abs(coverPositions.getX(i)+6)<2&&Math.abs(coverPositions.getZ(i)+10)<2){assert.equal(coverOpacity.getX(i),0,'Snow never coats submerged ground');submerged++;}
assert.ok(submerged>0);
let solidGround=0;
for(let i=0;i<coverPositions.count;i++)if(Math.abs(coverPositions.getX(i))<10&&Math.abs(coverPositions.getZ(i)-5)<3){assert.equal(coverOpacity.getX(i),1,'Ground snow has no random grass gaps');solidGround++;}
assert.ok(solidGround>0);
for(let step=0;step<=10;step++){
  update(10,{amount:step/10});
  assert.equal(vfx.state().coveragePercent,step*10);
  for(const m of [vfx.cover,vfx.riverCover,vfx.caps,vfx.driftMesh])close(m.material.uniforms.opacity.value,step/10);
  close(vfx.grassCoverage.value,step/10);
}
const normalCount=vfx.flakes.geometry.drawRange.count,stillPositions=vfx.flakes.geometry.attributes.position.array.slice(0,normalCount*3);update(10,{boosted:true});assert.equal(vfx.flakes.geometry.drawRange.count,normalCount*2);
assert.deepEqual(vfx.flakes.geometry.attributes.position.array.slice(0,normalCount*3),stillPositions,'Wind changes never teleport live flakes');
update(10,{quality:2,boosted:true});assert.ok(vfx.flakes.geometry.drawRange.count<=960);
update(10);
const pos=vfx.flakes.geometry.attributes.position,alpha=vfx.flakes.geometry.attributes.flakeOpacity,size=vfx.flakes.geometry.attributes.flakeSize;
assert.ok(new Set(size.array.slice(0,normalCount)).size>100,'Individual flake sizes vary');
for(let i=0;i<normalCount;i++){
  if(pos.getY(i)<=vfx.surfaces.groundAt(pos.getX(i),pos.getZ(i)))assert.equal(alpha.getX(i),0,'No flakes below the terrain');
  if(vfx.cache[i].age>=vfx.cache[i].contact)assert.equal(alpha.getX(i),0,'Contact kills the flake for the rest of its trajectory');
}
const before=pos.array.slice();update(10);assert.deepEqual(pos.array,before,'Rendering a frozen frame never advances snowfall');
// Front and back really occupy different camera-depth bands.
const depths=[[],[],[]],direction=camera.getWorldDirection(new T.Vector3());
for(let i=0;i<normalCount;i++){const p=vfx.cache[i];depths[p.layerIndex].push(p.origin.x*direction.x+p.origin.z*direction.z);}
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
assert.ok(mean(depths[0])>mean(depths[1])&&mean(depths[1])>mean(depths[2]));
// A new fall cycle changes spawn positions; different speeds avoid rows.
const first=vfx.cache[0].origin.clone();update(120);assert.notDeepEqual(vfx.cache[0].origin,first);
assert.ok(vfx.drifts.every(d=>new Set(d.shape.points.slice(1,12).map(p=>Math.hypot(p[0],p[2]).toFixed(3))).size>5));
assert.ok(vfx.drifts.every(d=>d.shape.coverage.slice(-11).every(a=>a===0)),'Drift edges feather to the ground');
fence.visible=false;update(121);assert.ok(!vfx.surfaces.entries.some(t=>t.source===fence),'Hidden scenery stops collecting or blocking snow');
vfx.reset();assert.equal(vfx.state().visibleFlakes,0);assert.equal(vfx.root.visible,false);assert.equal(vfx.grassCoverage.value,0);

// Visual changes must leave stored snow, slow, damage and costs untouched.
const {spells,Fighter}=SealGameCore,spell=id=>spells.find(s=>s.id===id),arts=new NatureArts(new T.Scene());
const actors=[{id:'player',owner:'player',pos:[0,1.72,7],fighter:new Fighter(1000)},{id:'primary',owner:'enemy',pos:[0,1.72,-24],fighter:new Fighter(1000)}];
arts.cast('player',spell('ice-reflect'),actors[0].pos,[0,0,-1],actors);arts.advance(90,actors);
close(arts.snowAmount('player'),90);close(arts.slowAt('enemy'),.55);
arts.visuals([],actors,camera);const stored=arts.snowAmount('player');arts.visuals([],actors,camera);close(arts.snowAmount('player'),stored);
arts.cast('player',spell('ice-orb'),actors[0].pos,[0,0,-1],actors);close(arts.snowAmount('player'),90-spell('ice-orb').snowCost);
arts.advance(20,actors);close(actors[1].fighter.hp,1000-spell('ice-orb').damage);
arts.reset();assert.equal(arts.state().snowVisual.flakes,0);assert.equal(arts.state().snowVisual.drifts,0);
console.log('PASS: three depth layers, randomized respawn/size/speed, particle budget, surface and slanted collision, water, feathered irregular drifts, visibility/reset, deterministic rendering and unchanged snow gameplay.');
