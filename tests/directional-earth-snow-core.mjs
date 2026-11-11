import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {EarthArts} from '../src/earth-arts.js';
import {NatureArts} from '../src/nature-arts.js';
import {practiceSpellNeedsAim,createPracticeOverhead} from '../src/practice-overhead.js';
const {spells,Fighter,intersectFireWall}=SealGameCore,spell=id=>spells.find(s=>s.id===id);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const scene=new T.Scene(),earth=new EarthArts(scene),snow=new NatureArts(scene);
for(const axis of [[0,0,-1],[0,0,1],[1,0,0],[.6,0,.8]]){
  const walls=[],wall=earth.cast('player',spell('earth-barrier'),[0,1.72,0],axis,[],walls);
  for(const i of [0,6]){
    const end=wall.nodes[i].p,offset=end.map((v,j)=>v-wall.center[j]);
    assert.ok(offset.reduce((n,v,j)=>n+v*axis[j],0)<0,'Both ends curve toward the caster');
    const normal=new T.Vector3(0,0,1).applyQuaternion(wall.nodes[i].part.quaternion);
    close(normal.dot(new T.Vector3(...walls[i].normal)),1);
  }
  assert.ok(walls.some(w=>intersectFireWall([axis[0]*15,1.72,axis[2]*15],[-axis[0]*2,1.72,-axis[2]*2],w)),'Wall blocks incoming shots');
  const start=[0,1.72,0],end=[axis[0]*7,1.72,axis[2]*7],stopped=earth.move(start,end);
  assert.ok(Math.hypot(stopped[0],stopped[2])<3,'Wall blocks forward movement');
  earth.reset(walls);
}
for(const owner of ['player','enemy']){
  const caster={id:'caster',owner,pos:[0,1.72,0],fighter:new Fighter(1000)};
  const victim={id:'target',owner:owner==='player'?'enemy':'player',pos:[0,1.72,-30],fighter:new Fighter(1000)};
  const actors=[caster,victim];
  const cast=(direction,targets=actors)=>{snow.reset([]);snow.cast(owner,spell('ice-reflect'),caster.pos,direction,targets);snow.advance(35,targets);assert.equal(snow.cast(owner,spell('ice-orb'),caster.pos,direction,targets),true);return snow.balls[0];};
  let ball=cast([1,.5,0]);assert.deepEqual(ball.axis,[0,0,-1]);close(ball.p[0],0);close(ball.p[2],-8);
  victim.pos=[-20,1.72,-30];snow.advance(1.1,actors);assert.ok(ball.axis[0]<0);assert.ok(ball.p[0]<0,'Ball follows its target instead of the original direction');
  victim.fighter.hp=0;snow.advance(.1,actors);assert.equal(snow.balls.length,0,'Target death cancels pursuit');
  snow.reset([]);snow.cast(owner,spell('ice-reflect'),caster.pos,[0,0,-1],[caster]);snow.advance(35,[caster]);assert.equal(snow.cast(owner,spell('ice-orb'),caster.pos,[0,0,-1],[caster]),false,'A living target is required');
  victim.fighter.hp=1000;victim.pos=[12,1.72,-30];ball=cast([1,0,0]);
  victim.pos=[0,1.72,-20];snow.advance(10,actors);close(victim.fighter.hp,750);assert.equal(snow.balls.length,0,'The chosen target is followed and hit');
  snow.advance(1,actors);close(victim.fighter.hp,750);
}
snow.reset([]);
const view=createPracticeOverhead(scene),orb=spell('ice-orb');assert.equal(practiceSpellNeedsAim(orb),false);
view.update({enabled:true,active:true,spell:orb,available:true,position:[0,1.72,7],target:[0,0,-8],heightAt:()=>0});
assert.equal(view.state().visible,false);
console.log('PASS: earth wall curves toward caster in every direction; snowball follows its selected target for both owners, cancels on target death and has no directional aiming guide.');
