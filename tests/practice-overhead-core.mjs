import assert from 'node:assert/strict';
import * as T from 'three';
import {clampPracticePoint,clampPracticeActorPoint,practiceMovementBounds,stepPracticePoint,createPracticeOverhead,PRACTICE_ARENA,PRACTICE_BOUNDS,PRACTICE_DIVIDERS,PRACTICE_MOVE_SPEED} from '../src/practice-overhead.js';
import '../game-core.js';
import {EarthArts} from '../src/earth-arts.js';
import {LightArts} from '../src/light-arts.js';
assert.deepEqual(clampPracticePoint([100,2,-100]),[PRACTICE_BOUNDS.maxX,2,PRACTICE_BOUNDS.minZ]);
const section=(PRACTICE_ARENA.maxZ-PRACTICE_ARENA.minZ)/3;
for(const [a,b]of [[PRACTICE_ARENA.minZ,PRACTICE_DIVIDERS[0]],[...PRACTICE_DIVIDERS],[PRACTICE_DIVIDERS[1],PRACTICE_ARENA.maxZ]])assert.ok(Math.abs(b-a-section)<1e-9,'fences divide the actual arena into equal thirds');
for(const owner of ['player','enemy'])for(const clearance of [.65,3]){
  const b=practiceMovementBounds(owner,clearance),low=clampPracticeActorPoint([-100,4,-100],owner,clearance),high=clampPracticeActorPoint([100,4,100],owner,clearance);
  assert.deepEqual(low,[b.minX,4,b.minZ]);assert.deepEqual(high,[b.maxX,4,b.maxZ]);
  assert.ok(owner==='player'?low[2]>PRACTICE_DIVIDERS[1]:high[2]<PRACTICE_DIVIDERS[0],'neither actor can enter the middle third');
}
const diagonal=stepPracticePoint([0,1.72,7],[3,0,3],2.5);assert.deepEqual(diagonal,[1.5,1.72,5]);
const stopped=stepPracticePoint([0,1.72,7],[0,0,-24],100);assert.ok(Math.abs(stopped[2]-practiceMovementBounds('player').minZ)<1e-9);assert.equal(stopped[1],1.72);
assert.equal(PRACTICE_MOVE_SPEED,3.75,'walking speed is half of the previous 7.5 m/s');
for(const from of [[0,1.72,-24],[0,1.72,-7],[0,1.72,7]]){
  const b=practiceMovementBounds('player',.65,from);
  for(const to of [[0,0,-100],[0,0,100]]){const p=stepPracticePoint(from,to,100);assert.ok(p[2]>=b.minZ-1e-9&&p[2]<=b.maxZ+1e-9,'after skill displacement, walking cannot cross the next fence or snap back home');}
}
const scene=new T.Scene(),view=createPracticeOverhead(scene),camera=new T.PerspectiveCamera(68,1.5,.05,220),canvas={getBoundingClientRect:()=>({left:0,top:0,width:1440,height:960})};
for(const aspect of [1,1.5,16/9,21/9]){
  camera.aspect=aspect;view.camera(camera,canvas);const direction=camera.getWorldDirection(new T.Vector3());
  assert.ok(Math.abs(Math.asin(-direction.y)-Math.PI/4)<1e-6,'Tactical camera looks diagonally down at 45 degrees');assert.ok(Math.abs(direction.x)>.1,'Camera shows the side of characters');
  for(const x of [-16,16])for(const z of [-26,12])for(const y of [0,6]){const p=new T.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<=.85+1e-6&&Math.abs(p.y)<=.82+1e-6,'Arena and standing characters remain in frame across aspect ratios');}
}
camera.aspect=1.5;
view.camera(camera,canvas);const target=new T.Vector3(7,0,-9).project(camera);view.pointer((target.x+1)*720,(1-target.y)*480,camera,canvas);const cursor=view.point();assert.ok(Math.hypot(cursor[0]-7,cursor[2]+9)<1e-6);
view.move();assert.equal(view.target()[2],practiceMovementBounds('player').minZ);assert.deepEqual(view.point(),cursor,'movement bounds do not restrict aiming into the opponent section');view.stop();assert.equal(view.target(),null);
const dividers=scene.children.flatMap(o=>o.children.filter(c=>c.name==='practice-divider'));assert.equal(dividers.length,2);assert.deepEqual(dividers.map(o=>o.position.z),PRACTICE_DIVIDERS);
const config={enabled:true,active:true,available:true,position:[0,1.72,7],target:cursor,heightAt:()=>0};view.update({...config,spell:{id:'fire-meteor',style:'meteor',blastRadius:5.5}});assert.equal(view.state().preview.kind,'area');assert.equal(view.state().preview.radius,5.5);assert.deepEqual(view.state().preview.target,cursor);
view.update({...config,spell:{id:'fire-volley',style:'volley',size:.075}});const preview=view.state().preview;assert.equal(preview.kind,'direction');assert.ok(Math.hypot(preview.target[0]-config.position[0],preview.target[2]-config.position[2])>Math.hypot(cursor[0]-config.position[0],cursor[2]-config.position[2]),'direction preview continues past the cursor');assert.ok(Math.abs(preview.direction[0]*(cursor[2]-config.position[2])-preview.direction[2]*(cursor[0]-config.position[0]))<1e-6,'extended preview keeps the aimed direction');view.update({...config,spell:null});assert.equal(view.state().preview,null);
const earth=new EarthArts(scene),spell=id=>SealGameCore.spells.find(s=>s.id===id),actors=[{owner:'player',pos:[0,1.72,7]},{owner:'enemy',pos:[0,1.72,-24]}],cursorPoint=[6,0,-10];
view.update({...config,spell:{style:'boat'}});assert.equal(view.state().preview.kind,'direction');assert.deepEqual(view.state().preview.target,preview.target,'boat preview shares the extended projectile direction');
assert.deepEqual(earth.cast('player',spell('earth-volley'),actors[0].pos,[0,0,-1],actors,[],cursorPoint).center,cursorPoint);
const light=new LightArts(scene);assert.deepEqual(light.place('player',spell('light-lance'),actors[0].pos,[0,0,-1],actors,cursorPoint).center,[6,.03,-10]);
const previous=light.place('enemy',spell('light-lance'),actors[1].pos,[0,0,1],actors).center;assert.deepEqual(previous,[0,.03,7],'default targeting still follows the existing actor target');
console.log('PASS: cursor bounds/ray projection, direction preview extends through the cursor, area/placed spell targets stay at their intended point.');
