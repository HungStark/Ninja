import assert from 'node:assert/strict';
import * as T from 'three';
import {createGuardianBossCombat} from '../src/guardian-moba-combat.js';
import {GUARDIAN_BOSS_DESIGNS} from '../src/guardian-boss-designs.js';
import {guardianSkillStats} from '../src/guardian-balance.js';
import {clampGuardianMovement,practiceMovementBounds,PRACTICE_ARENA} from '../src/practice-overhead.js';
import {planGuardianWave} from '../src/guardian-tactics.js';
import {createEncounterCreature} from '../src/encounter-appearance.js';
const scene=new T.Scene(),g=createGuardianBossCombat(scene),boss=[0,2,-21],f={hp:1000,maxHp:1000};
const bounds={minX:-15,maxX:15,minZ:-25,maxZ:11},attackBounds=practiceMovementBounds('player',1),walkBounds=practiceMovementBounds('enemy',3,boss);
let player=[0,1.7,7],hits=[],moves=[];
const options={bounds,attackBounds,random:()=>.2,constrainBossMovement:(from,to,mode)=>{const p=clampGuardianMovement(from,to,mode,3);moves.push({from:[...from],p,mode});return p;}};
function step(seconds,extra={}){for(let t=0;t<seconds-1e-8;t+=1/60)g.update(Math.min(1/60,seconds-t),f,player,boss,shot=>{hits.push(shot);return {damage:shot.damage};},{...options,...extra});}
try{
 const report=[];
 for(const id of Object.keys(GUARDIAN_BOSS_DESIGNS)){
  player=[0,1.7,7];f.hp=1000;hits=[];moves=[];g.reset(id);step(30);
  const state=g.state();assert.ok(state.attacks>=7,id+' must attack repeatedly: '+state.attacks);assert.ok(state.history[0].at<=1,id+' opening');
  assert.equal(new Set(state.history.map(h=>h.type)).size,3,id+' uses its whole combo');
  assert.ok(state.entities.length<=320);assert.ok(state.ongoing.length<=3);
  for(const m of moves){assert.ok(Math.abs(m.p[0])<=13.001&&m.p[2]>=-23.001&&m.p[2]<=9.001,id+' outer fence');if(m.mode==='walk'){const b=practiceMovementBounds('enemy',3,m.from);assert.ok(m.p[2]>=b.minZ-.001&&m.p[2]<=b.maxZ+.001,id+' must not walk through a divider');}}
  if(id==='ice')assert.ok(moves.some(m=>m.mode==='land'&&m.p[2]>0),'tiger pounces toward distant targets');
  report.push({id,attacks:state.attacks,hits:hits.length,damage:Math.round(hits.reduce((n,h)=>n+h.damage,0))});
  g.clear();assert.equal(scene.children.length,0);
 }
 // Weather must remain active while a different attack begins, then reset exactly.
 g.reset('fire');step(5);assert.ok(g.state().ongoing.some(a=>a.type==='fox-firestorm'));assert.ok(g.state().history.at(-1).type!=='fox-firestorm','another attack begins during rain');step(3);const frozen=g.state();g.update(4,f,player,boss,()=>{}, {...options,enabled:false});assert.deepEqual(g.state(),frozen);g.clear();
 // The player can reach the announced refuge at walking speed, including both edges.
 for(const x of [-15,-8,0,8,15])for(let i=0;i<3;i++){
  const a=guardianSkillStats('dragon-tsunami'),p=[x,1.7,7],plan=planGuardianWave(p,attackBounds,i,a),padding=.675;
  assert.ok(Math.max(0,Math.abs(plan.safeX-x)-plan.gap/2+padding)<=2.8*plan.warning,'reachable while slowed');assert.ok(plan.width<=18);assert.ok(plan.gap>=4.4);
 }
 player=[-12,1.7,7];hits=[];g.reset('water');step(.01,{aiEnabled:false});g.trigger(2,player,boss,f);let corridorId=0,safeX=player[0],waves=new Set();
 for(let time=0;time<7;time+=1/60){
  const state=g.state(),corridor=state.entities.filter(e=>e.kind==='wave-corridor').at(-1);
  if(corridor&&corridor.id!==corridorId){corridorId=corridor.id;safeX=corridor.position[0];}
  player[0]+=Math.sign(safeX-player[0])*Math.min(Math.abs(safeX-player[0]),2.8/60);step(1/60,{aiEnabled:false});
  for(const wave of g.state().entities.filter(e=>e.kind==='wave')){waves.add(wave.id);assert.ok(wave.gapWidth>=4.4);}
 }
 assert.equal(waves.size,3);assert.equal(hits.length,0,'all three waves can be dodged through the visible corridor');g.clear();
 for(const id of Object.keys(GUARDIAN_BOSS_DESIGNS)){
  const model=createEncounterCreature(id);model.setCombatState({aiOwnedMovement:true,moveSpeed:5});let peakHip=0;for(let i=0;i<30;i++){model.update(i/60,true);peakHip=Math.max(peakHip,...model.animationState().legs.map(j=>Math.abs(j.hip)));}
  const moving=model.animationState();if(['wind','light'].includes(id))assert.equal(moving.wingCount,2);else if(id==='water')assert.equal(moving.dragonMeshes,2);else{assert.equal(moving.legCount,4);assert.ok(peakHip>.05);assert.ok(moving.legs.some(j=>j.knee>0)||id==='earth');}
  const type=GUARDIAN_BOSS_DESIGNS[id].skills[0].type,parameters=guardianSkillStats(type);model.setCombatState({aiOwnedMovement:true,moveSpeed:0,action:{age:.2,parameters,type}});model.update(.6,false);assert.ok(model.animationState().charge>0,id+' windup');
  model.setCombatState({aiOwnedMovement:true,moveSpeed:0,action:{age:(parameters.windup||parameters.warning||.6)+.02,parameters,type}});model.update(.7,false);assert.ok(model.animationState().strike>.5,id+' release');model.dispose();
 }
 console.log('PASS: nine aggressive boss loops, opening timing, full combos, finite effects, ground fence collision, tiger pounce, reachable tsunami refuge, three damage-free dodges and nine articulated rigs.');console.log(JSON.stringify(report));
}finally{g.dispose();}
