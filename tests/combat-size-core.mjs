import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {LightArts} from '../src/light-arts.js';
import {WaterBubbles} from '../src/water-bubbles.js';
import {captureVolleyAim} from '../src/fire-volley-targeting.js';
import {clampPracticeActorPoint,practiceMovementBounds,PRACTICE_DIVIDERS} from '../src/practice-overhead.js';
const {Fighter,spells,intersectFireWall}=SealGameCore;
for(const scale of [1,2]){
  const actors=[{id:'player',owner:'player',pos:[0,1.72,0],fighter:new Fighter(1000),hitboxScale:scale},{id:'enemy',owner:'enemy',pos:[1,1.72,-15],fighter:new Fighter(1000),hitboxScale:scale}];
  const light=new LightArts(new T.Scene(),intersectFireWall),spell=spells.find(s=>s.id==='light-orb');let hits=0;
  light.fire('player',spell,actors[0].pos,[0,0,-1]);light.advance(spell.chargeTime+.01,actors,[],()=>hits++);assert.equal(hits,scale===2?1:0,'laser contacts the enlarged target when it grazes the original target');
  assert.equal(captureVolleyAim([0,1.72,0],[0,0,-1],[0,1.72,-31],[actors[1]]).aimedTargetId,scale===2?'enemy':null);
  const bubbles=new WaterBubbles(new T.Scene()),mine={count:1,size:.5,placementRadius:0,detonationInterval:1,blastRadius:2,damage:10};
  bubbles.cast('player',mine,[0,2.22,0]);actors[1].pos=[2.3,1.72,0];hits=0;bubbles.advance(1,actors,()=>hits++);assert.equal(hits,scale===2?1:0,'area damage includes the enlarged edge');
  for(const owner of ['player','enemy']){
    const clearance=.65*scale,b=practiceMovementBounds(owner,clearance),p=clampPracticeActorPoint([100,0,owner==='player'?-100:100],owner,clearance);
    assert.equal(p[0],b.maxX);assert.ok(owner==='player'?p[2]-clearance>=PRACTICE_DIVIDERS[1]-1e-8:p[2]+clearance<=PRACTICE_DIVIDERS[0]+1e-8,'the enlarged body stays on its side of the fence');
  }
}
console.log('PASS: scaled laser contacts, volley aim selection, area damage and movement clearance; default-size behavior preserved.');
