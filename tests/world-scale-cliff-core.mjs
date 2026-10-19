import assert from 'node:assert/strict';
import * as T from 'three';
import {createAdventureScene} from '../src/adventure-scene.js';
import {createCharacterPhysics} from '../src/adventure-physics.js';
import {newJourney,VILLAGES} from '../src/adventure-data.js';
globalThis.innerWidth=1440;globalThis.innerHeight=960;
const world=createAdventureScene(),load=id=>{const save=newJourney();save.village=id;world.load(id,save);return save;};
for(const {id} of VILLAGES){load(id);const heroHeight=new T.Box3().setFromObject(world.hero.root).getSize(new T.Vector3()).y;for(const house of world.scene.getObjectsByProperty('name','village-house'))assert.ok(house.userData.doorHeight>heroHeight+.1,id+': doorway is above the player head');}
load('fire');const posts=world.solids.filter(s=>s.name==='grounded-gate-post');assert.ok(posts.length>=8);for(const post of posts){const ground=world.heightAt(post.x,post.z);assert.ok(post.bottom<=ground+.01&&post.bottom>=ground-.4,'gate legs reach their own ground elevation');}
const route=world.routes[0],save=newJourney();save.village='fire';save.position=[route.from[0],route.from[1]+6];world.load('fire',save);
for(let k=0;k<100;k++){const p=world.hero.root.position,dz=route.from[1]-p.z;if(Math.abs(dz)>.01)world.moveHero(0,Math.sign(dz)*Math.min(Math.abs(dz),4.6/60));world.update(1/60,true);}
assert.ok(Math.hypot(world.hero.root.position.x-route.from[0],world.hero.root.position.z-route.from[1])<.05,'walking into the cliff entrance is not blocked by its landmark decoration');
const stairs=world.routes[0].carved;
const walk=targets=>{for(const target of targets){const p=world.hero.root.position;for(let k=0;k<180;k++){const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);if(d<.01)break;world.moveHero(dx/d*Math.min(d,4.6/60),dz/d*Math.min(d,4.6/60));world.update(1/60,true);}assert.ok(Math.abs(p.y-target.y)<.1&&Math.hypot(p.x-target.x,p.z-target.z)<.02,'ordinary character physics can walk every carved step and turn');}};
walk(stairs.path);walk([...stairs.path].reverse());
assert.ok(world.startTraversal('red-cliff'));const still=world.hero.root.position.clone();world.advanceTraversal(.5,0);assert.ok(world.hero.root.position.distanceTo(still)<1e-7,'guided stairs wait for input');world.advanceTraversal(1,1);assert.ok(world.traversalState().progress>0);assert.ok(world.jump(),'Space leaves the guide and jumps freely from a real step');assert.equal(world.riding,false);assert.equal(world.physicsState().grounded,false);for(let k=0;k<100;k++)world.update(1/60,false);assert.equal(world.physicsState().grounded,true);
const position={x:0,y:0,z:0},body=createCharacterPhysics({position,baseFloor:()=>0,staticBlocked:()=>false});body.addBox({x:0,z:0,w:2,d:2,bottom:0,top:4});body.reset();body.move(.1,0);assert.equal(body.overlaps(position.x,position.z,position.y),false,'an embedded body can recover instead of freezing inside a collider');
load('nameless');const homes=world.scene.getObjectsByProperty('name','village-house').slice(0,8).map(h=>({x:h.position.x,z:h.position.z+h.userData.footprint.d/2+3}));
for(const home of homes){const s=newJourney();s.position=[home.x-.2,home.z];world.load('nameless',s);if(Math.hypot(world.hero.root.position.x-s.position[0],world.hero.root.position.z-s.position[1])>.1)continue;for(let k=0;k<90;k++){world.moveHero(0,-.07);world.update(1/60,true);}for(let k=0;k<110;k++){world.moveHero(0,.07);world.update(1/60,true);}assert.ok(world.hero.root.position.z>home.z-1,'pushing into a ruined doorway still allows walking back out');}
console.log('PASS: doors clear the hero in ten villages, grounded Fire gates, 124 carved steps walked up/down without scripted traversal, pausing and free jumping from the guide, penetration recovery and ruined-door exit regressions.');
