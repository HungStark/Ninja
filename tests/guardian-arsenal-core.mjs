import assert from 'node:assert/strict';
import * as T from 'three';
import {createGuardianArsenalCombat} from '../src/guardian-arsenal-combat.js';
import {GUARDIAN_ARSENAL_DESIGNS as designs,GUARDIAN_ARSENAL_STATS} from '../src/guardian-arsenal-data.js';
import {clampGuardianMovement,practiceMovementBounds} from '../src/practice-overhead.js';
const scene=new T.Scene(),g=createGuardianArsenalCombat(scene),boss=[0,2,-21],home=[0,0,-21];
let f,player,hits,options,moves;
function reset(id){g.reset(id);f={hp:320,maxHp:1000};player=[3,1.7,7];hits=[];moves=[];options={aiEnabled:false,bounds:{minX:-15,maxX:15,minZ:-25,maxZ:11},attackBounds:practiceMovementBounds('player',1),constrainBossMovement:(from,to,mode)=>{const p=clampGuardianMovement(mode==='walk'?home:from,to,mode,3);moves.push({mode,p:[...p]});return p;},control:()=>{},setTargetPosition:(_id,p)=>player=[...p]};step(.01);}
function step(seconds,moving=false){for(let time=0;time<seconds-1e-8;time+=1/60){if(moving)player[0]=Math.sin((totalTime+time)*.7)*9;g.update(1/60,f,player,boss,shot=>{hits.push(shot);return {damage:shot.damage};},options);}totalTime+=seconds;}
let totalTime=0,count=0;
try{
 for(const [id,d]of Object.entries(designs))for(const [i,skill]of d.skills.entries()){
  reset(id);assert.ok(g.trigger(i,player,boss,f),skill.type);try{step(GUARDIAN_ARSENAL_STATS[skill.type].duration+1.5);}catch(e){e.message=skill.type+': '+e.message;throw e;}
  const state=g.state();assert.ok(state.bossPosition.every(Number.isFinite),skill.type);assert.ok(Object.values(state.offset).every(Number.isFinite),skill.type+' pose');assert.ok(state.entities.every(e=>e.position.every(Number.isFinite)),skill.type+' effects');assert.equal(state.returning,null,skill.type+' completes return');assert.ok(Math.hypot(state.bossPosition[0]-home[0],state.bossPosition[2]-home[2])<.01,skill.type+' returns to start');count++;
  g.clear();assert.equal(scene.children.length,0);
 }
 assert.equal(count,80);
 reset('water');g.trigger(4,player,boss,f);step(1);assert.ok(g.state().prison?.hp>0,'water prison is actionable');assert.ok(g.breakPrison(30));assert.equal(g.state().prison,null,'attacking breaks the prison');
 reset('water');g.trigger(6,player,boss,f);step(.1);g.onDamage(110,{guardianPart:'dragon-white-underbelly'});assert.equal(g.state().action,null);assert.ok(g.state().exposed>0,'chest damage interrupts pressure buildup');
 reset('fire');g.trigger(8,player,boss,f);step(.1);g.onDamage(130,{guardianPart:'fire-tail-2'});step(.01);assert.ok(g.state().mechanics.tailGroupsDisabled>0);assert.ok(g.state().exposed>0);
 reset('earth');g.onDamage(95,{guardianPart:'leg-front-left'});g.onDamage(95,{guardianPart:'leg-back-left'});step(.01);assert.equal(g.state().mechanics.brokenLegs,2);assert.ok(g.state().mechanics.toppled);assert.equal(g.defense({guardianPart:'mountain-shell'}).multiplier,2);
 reset('light');g.trigger(3,player,boss,f);step(.1);assert.ok(g.defense({v:[0,0,-1],old:[0,1,0],p:[0,1,-1]}).reflect>0,'boss retains frontal projectile reflection');g.defense({v:[0,0,1]});assert.ok(g.state().exposed>0,'rear hit breaks the stance');
 reset('lightning');g.trigger(5,player,boss,f);step(.1);g.defense({v:[0,0,-1]});assert.equal(g.state().action.type,'wolf-bite','boss counterattack branches to an offensive rush');
 reset('dark');g.trigger(7,player,boss,f);step(.1);g.defense({v:[0,0,-1]});assert.equal(g.state().action.type,'shadow-stalk');
 reset('ice');g.trigger(5,player,boss,f);step(.8);const mirror=g.state().entities.find(e=>e.kind==='ice-spike');assert.ok(mirror);g.areaDamage({owner:'player',damage:40},mirror.position,.1);assert.ok(!g.state().entities.some(e=>e.id===mirror.id),'ice mirrors are destructible');
 for(const id of Object.keys(designs)){
  reset(id);options.aiEnabled=true;step(35,true);const state=g.state();assert.ok(state.attacks>=5,id+' pressure while player moves');assert.ok(state.director.reactionDelay>=.2);assert.ok(state.entities.length<=320);assert.ok(state.vfx.particles<=96);
  const b=practiceMovementBounds('enemy',3,home);for(const m of moves.filter(m=>m.mode==='walk'))assert.ok(m.p[2]>=b.minZ-.001&&m.p[2]<=b.maxZ+.001,id+' walks only in its home court');
 }
 console.log('PASS: 80 authored skills execute, finite effects/poses, offensive excursions return to origin, home-court walking, moving-player AI, perception delay and bounded VFX.');
}finally{g.dispose();}
