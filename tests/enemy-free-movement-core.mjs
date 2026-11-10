import assert from 'node:assert/strict';
import {createEnemyMovement} from '../src/enemy-movement.js';
import {practiceMovementBounds,PRACTICE_BOT_MOVE_SPEED} from '../src/practice-overhead.js';
const bounds=practiceMovementBounds('enemy'),options={bounds,moveSpeed:PRACTICE_BOT_MOVE_SPEED},inside=(p,b=bounds)=>assert.ok(p[0]>=b.minX-1e-8&&p[0]<=b.maxX+1e-8&&p[2]>=b.minZ-1e-8&&p[2]<=b.maxZ+1e-8);
const bot=createEnemyMovement(()=>.75);let p=[0,1.72,-24],points=[[...p]];
for(let i=0;i<900;i++){
  const old=p;p=bot.update(1/60,{...options,position:p});inside(p);assert.equal(p[1],1.72);
  assert.ok(Math.hypot(p[0]-old[0],p[2]-old[2])<=PRACTICE_BOT_MOVE_SPEED/60+1e-8,'diagonal movement has no speed bonus');points.push([...p]);
}
assert.ok(points.some(p=>p[0]>5.3),'free movement uses more than the old horizontal rail');assert.ok(Math.max(...points.map(p=>p[2]))-Math.min(...points.map(p=>p[2]))>2,'bot walks forward/back as well as sideways');assert.equal(bot.state().dashBoost.uses,0);
const timer=bot.state().directionTime;assert.deepEqual(bot.update(.5,{...options,position:p,blocked:true}),p);assert.equal(bot.state().directionTime,timer);assert.deepEqual(bot.state().velocity2d,[0,0]);
for(const [slow,heavy,factor]of [[1,false,1],[.25,false,.25],[1,true,.8]]){
  const ai=createEnemyMovement(()=>.75),start=[0,1.72,-24],next=ai.update(.1,{...options,position:start,slow,heavy});assert.ok(Math.abs(Math.hypot(next[0]-start[0],next[2]-start[2])-PRACTICE_BOT_MOVE_SPEED*.1*factor)<1e-8);
}
const constrained=createEnemyMovement(()=>.75),slide=constrained.update(.1,{...options,position:[0,1.72,-24],constrain:q=>[0,q[1],q[2]]});assert.equal(slide[0],0);assert.ok(slide[2]>-24,'terrain constraints still allow movement on the unblocked axis');
const evader=createEnemyMovement(()=>.75),start=[0,1.72,-20],escape=evader.update(.1,{...options,position:start,shots:[{owner:'player',style:'meteor',life:3,target:[...start],blastRadius:3.5}]});inside(escape);assert.equal(evader.state().mode,'evading');assert.ok(Math.hypot(escape[0],escape[2]+20)>0);
const covered=createEnemyMovement(()=>.75);covered.update(.1,{...options,position:[10,1.72,-24],walls:[{owner:'enemy',hp:100,life:4,p:[8,0,-18],normal:[0,0,1]}]});assert.equal(covered.state().mode,'sheltering');assert.deepEqual(covered.state().targetPoint,[8,1.72,-21],'cover may be used beyond the old horizontal limit');
const displaced=[0,1.72,7],newBounds=practiceMovementBounds('enemy',.65,displaced);p=bot.update(.1,{position:displaced,bounds:newBounds,moveSpeed:PRACTICE_BOT_MOVE_SPEED});inside(p,newBounds);assert.ok(bot.state().targetPoint[2]>=newBounds.minZ,'after a skill crosses fences, the bot chooses a destination in the current section');
bot.reset();assert.equal(bot.state().targetPoint,null);assert.deepEqual(bot.state().velocity2d,[0,0]);
console.log('PASS: two-axis patrol, full-width destinations, normalized speed, bounds, control/slow/heavy/terrain, hazard evasion, cover and skill-displaced sections.');
