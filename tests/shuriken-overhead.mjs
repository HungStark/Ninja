import assert from 'node:assert/strict';
import * as T from 'three';
import {ShurikenVisuals} from '../src/shuriken.js';
const scene=new T.Scene(),visuals=new ShurikenVisuals(scene),shots=['player','enemy'].map((owner,i)=>({owner,style:'shuriken',p:[i*4,1.7,0],v:[i?72:-72,0,0],age:.1,color:'#707983'}));
visuals.update(shots);
const size=shot=>{scene.updateMatrixWorld(true);return new T.Box3().setFromObject(visuals.objects.get(shot).userData.spinner).getSize(new T.Vector3());};
const original=shots.map(size);
visuals.update(shots,{overhead:true});
for(const [i,shot]of shots.entries()){
  const state=visuals.visualState(shot),root=visuals.objects.get(shot),wind=root.userData.wind;
  assert.equal(state.scale,2);assert.equal(state.windTrail,true);assert.equal(state.windLength,2.8);assert.ok(size(shot).distanceTo(original[i].clone().multiplyScalar(2))<1e-8,'blade and energy double in world size');
  const checkBehind=()=>{scene.updateMatrixWorld(true);const tail=wind.localToWorld(new T.Vector3(0,0,-1)).sub(root.position);assert.ok(tail.dot(new T.Vector3(...shot.v))<0,'wind stays behind the flight direction');};checkBehind();
  shot.v=shot.v.map(v=>-v);visuals.update(shots,{overhead:true});checkBehind();
  const colors=wind.geometry.getAttribute('color');assert.ok(colors.getX(0)>0);assert.equal(colors.getX(colors.count-1),0,'wind fades out at the tail');
}
visuals.update(shots);for(const shot of shots){assert.equal(visuals.visualState(shot).scale,1);assert.equal(visuals.visualState(shot).windTrail,false);}
visuals.update([],{overhead:true});assert.equal(visuals.objects.size,0);assert.equal(scene.children.length,0);
console.log('PASS: both owners get double-size blades/energy and fading wind behind flight/reflection only in overhead view; visuals clean up with shots.');
