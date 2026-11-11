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
  let ball=cast([1,.5,0]);assert.deepEqual(ball.axis,[1,0,0]);close(ball.p[0],8);close(ball.p[2],0);
  victim.pos=[-20,1.72,15];snow.advance(3,actors);close(ball.p[0],11.1);close(ball.p[2],0);assert.deepEqual(ball.axis,[1,0,0]);close(victim.fighter.hp,1000);
  victim.fighter.hp=0;snow.advance(1,actors);assert.ok(snow.balls.includes(ball),'Target death does not cancel the aimed ball');
  snow.advance(100,actors);assert.equal(snow.balls.length,0,'Missed balls expire');
  ball=cast([0,0,-1],[caster]);snow.advance(2,[caster]);assert.equal(ball.phase,'rolling','Casting needs no target');
  victim.fighter.hp=1000;victim.pos=[12,1.72,-30];ball=cast([0,0,-1]);
  victim.pos=[0,1.72,-20];snow.advance(10,actors);close(victim.fighter.hp,750);assert.equal(snow.balls.length,0,'Enemy entering the chosen path is hit');
  snow.advance(1,actors);close(victim.fighter.hp,750);
  victim.fighter.hp=1000;const near={...victim,id:'near',pos:[0,1.72,-18],fighter:new Fighter(1000)};
  victim.pos=[0,1.72,-35];ball=cast([0,0,-1],[caster,victim,near]);snow.advance(20,[caster,victim,near]);
  close(near.fighter.hp,750);close(victim.fighter.hp,1000);
}
snow.reset([]);
const view=createPracticeOverhead(scene),orb=spell('ice-orb');assert.equal(practiceSpellNeedsAim(orb),true);
view.update({enabled:true,active:true,spell:orb,available:true,position:[0,1.72,7],target:[0,0,-8],heightAt:()=>0});
assert.equal(view.state().visible,true);assert.equal(view.state().preview.kind,'direction');
console.log('PASS: earth wall curves toward caster in every direction; aimed snowball stays straight, hits first enemy on path, expires on miss, supports both owners and shows aiming guide.');
