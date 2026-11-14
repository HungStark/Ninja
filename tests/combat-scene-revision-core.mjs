import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {LightArts} from '../src/light-arts.js';
import {createPracticeOverhead} from '../src/practice-overhead.js';

const {Fighter,spells,intersectFireWall}=SealGameCore;
const spell=id=>spells.find(s=>s.id===id);
for(const owner of ['player','enemy']){
  const scene=new T.Scene(),arts=new LightArts(scene,intersectFireWall),victim=owner==='player'?'enemy':'player';
  const actors=[{id:owner,owner,pos:[0,1.72,0],fighter:new Fighter()},{id:victim,owner:victim,pos:[0,1.72,-15],fighter:new Fighter()}];
  const actor=actors[1],dome=arts.place(owner,spell('light-lance'),actors[0].pos,[0,0,-1],actors,actor.pos);
  arts.advance(dome.buildTime,actors,[],()=>{});
  assert.equal(arts.slowAt(victim,actor.pos),.25);
  assert.equal(actor.fighter.controlTime,0,'Being inside does not stun until edge contact');
  assert.equal(arts.slowAt(owner,actor.pos),1,'Caster is unaffected');
  actor.pos=[dome.radius,1.72,-15];arts.advance(.01,actors,[],()=>{});
  assert.equal(arts.slowAt(victim,actor.pos),.25);
  assert.equal(actor.fighter.controlTime,1);
  assert.equal(actor.fighter.controlSource,spell('light-lance').name);
  actor.fighter.tick(.4);arts.advance(.4,actors,[],()=>{});
  assert.equal(actor.fighter.controlTime,.6,'Staying on the edge does not renew stun');
  actor.fighter.tick(.6);actor.pos=[20,1.72,-15];arts.advance(.01,actors,[],()=>{});
  assert.equal(arts.slowAt(victim,actor.pos),1);
  actor.pos=[dome.radius,1.72,-15];arts.advance(.01,actors,[],()=>{});
  assert.equal(actor.fighter.controlTime,0,'Re-entering the same dome never repeats its stun');
  const next=arts.place(owner,spell('light-lance'),actors[0].pos,[0,0,-1],actors,[0,0,-15]);
  arts.advance(next.buildTime,actors,[],()=>{});assert.equal(actor.fighter.controlTime,1,'A new dome has its own first-contact stun');
  actor.fighter.tick(1);arts.advance(next.life,actors,[],()=>{});assert.equal(arts.slowAt(victim,actor.pos),1);
  arts.reset();
}

// Dense ground cover must never occlude any directional or circular aim mesh.
const scene=new T.Scene(),aim=createPracticeOverhead(scene);
aim.aimAt([0,0,-15]);
for(const id of ['fire-lance','light-lance','fire-reflect']){
  aim.update({enabled:true,active:true,spell:spell(id),available:true,position:[0,1.72,7],target:[0,0,-15],heightAt:()=>0});
  const meshes=[];scene.traverse(o=>{if(o.isMesh&&o.visible&&o.parent.visible&&o.userData.aimGuide)meshes.push(o);});
  assert.ok(meshes.length);for(const mesh of meshes){assert.equal(mesh.material.depthTest,false);assert.equal(mesh.material.fog,false);assert.ok(mesh.renderOrder>30);assert.ok([...mesh.geometry.attributes.position.array].every(Number.isFinite));}
  assert.equal(aim.state().visible,true);
}
assert.equal(spell('fire-lance').size,.72);assert.equal(spell('lightning-volley').size,.9);
console.log('PASS: uniform dome slow, first-edge stun/expiry/re-entry/new dome/both owners, aim guides above snow and restored hitboxes.');
