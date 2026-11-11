import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {WaterBubbles} from '../src/water-bubbles.js';
import {EarthArts} from '../src/earth-arts.js';
import {sealCycle,SEAL_CYCLE_TIME} from '../src/seal-timing.js';
const {spells,Fighter}=SealGameCore,s=id=>spells.find(x=>x.id===id),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
for(const owner of ['player','enemy']){
  const actors=['player','enemy'].map((owner,i)=>({owner,pos:[0,1.72,i?-24:7],fighter:new Fighter(1000)}));for(const a of actors)a.fighter.autoRestore=false;
  const victim=actors.find(a=>a.owner!==owner),caster=actors.find(a=>a.owner===owner),water=new WaterBubbles(new T.Scene()),spell=s('water-barrier');
  close(spell.detonationInterval,.25);close(spell.duration,1);water.cast(owner,spell,victim.pos);
  for(let i=1;i<=4;i++){water.advance(.249,actors,x=>victim.fighter.receive(x.damage,true));assert.equal(water.detonations.length,i-1);water.advance(.001,actors,x=>victim.fighter.receive(x.damage,true));assert.equal(water.detonations.length,i);close(water.detonations.at(-1).time,i*.25);close(victim.fighter.hp,1000-i*spell.damage);}
  water.reset();victim.fighter.hp=1000;
  const earth=new EarthArts(new T.Scene()),gravity=s('earth-reflect'),art=earth.cast(owner,gravity,caster.pos,owner==='player'?[0,0,-1]:[0,0,1],actors,[]),oldFlight=gravity.chargeTime*.65;
  close(art.throwEnd,oldFlight*2);close(art.chargeTime-art.throwEnd,gravity.chargeTime-oldFlight);
  for(const t of [0,.25,.5,.75,1]){art.age=art.throwEnd*t;const actual=earth.corePosition(art),old=earth.corePosition({...art,age:oldFlight*t,throwEnd:oldFlight});actual.forEach((v,i)=>close(v,old[i]));}
  art.age=0;let hits=0;
  const advance=t=>{for(let elapsed=0;elapsed<t-1e-9;elapsed+=1/60){earth.advance(Math.min(1/60,t-elapsed),actors,[],shot=>{hits++;victim.fighter.receive(shot.damage,true);},(who,p)=>{actors.find(a=>a.owner===who).pos=[...p];});}};
  advance(art.throwEnd-.001);assert.equal(earth.gravityStage(art),'throwing');assert.equal(art.capture,null);assert.equal(earth.heightAt(...[art.center[0],art.center[2]]),0);
  advance(.002);assert.equal(earth.gravityStage(art),'fracturing');assert.equal(art.capture,null);
  advance(art.chargeTime-art.age+.01);assert.equal(art.capture.owner,victim.owner);
  advance(art.landTime-art.age+.01);assert.equal(hits,2);close(victim.fighter.hp,1000-gravity.captureDamage-gravity.fallDamage);close(art.holdEnd-art.pullEnd,gravity.holdTime);
  advance(gravity.craterTime+.01);assert.equal(earth.effects.length,0);
}
close(SEAL_CYCLE_TIME,.3);close(sealCycle(0).clasp,0);close(sealCycle(.15).clasp,1);close(sealCycle(.3).clasp,0);close(sealCycle(1).clasp,0);
console.log('PASS: four quarter-second explosions for both owners, half-speed black core with synchronized capture/rocks/fall and unchanged damage/hold, full 0.3-second close/open seal cycle.');
