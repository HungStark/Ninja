import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {WaterBubbles} from '../src/water-bubbles.js';
import {sweepTsunami} from '../src/tsunami.js';
import {newJourney,readJourney} from '../src/adventure-data.js';
import {damageMultiplierFor} from '../src/equipment.js';
const {Fighter,spells,intersectsWave}=SealGameCore,spell=spells.find(s=>s.id==='water-barrier');
assert.equal(newJourney().gold,100000);const saved={...newJourney(),gold:1234};assert.equal(readJourney({getItem:()=>JSON.stringify(saved)}).gold,1234);
assert.equal(spell.count,4);assert.equal(spell.duration,4);assert.equal(spell.detonationInterval,1);assert.equal(spell.cooldown,6);assert.equal(spell.baseDamage,10);assert.equal(spell.damage,12);assert.equal(spell.chargedRadius,undefined);
const scene=new T.Scene(),arts=new WaterBubbles(scene);let actors;
function setup(){arts.reset();actors=[{owner:'player',pos:[0,1.72,7],fighter:new Fighter()},{owner:'enemy',pos:[0,1.72,0],fighter:new Fighter()}];for(const a of actors)a.fighter.autoRestore=false;}
const hit=s=>actors.find(a=>a.owner!==s.owner).fighter.receive(s.damage,true,false,s.element);
setup();arts.cast('player',spell,actors[1].pos);assert.equal(arts.bubbles.length,4);assert.deepEqual(arts.state().bubbles.map(b=>b.remaining),[1,2,3,4]);const positions=arts.state().bubbles.map(b=>b.position);
for(let i=1;i<=4;i++){arts.advance(.99,actors,hit);assert.equal(actors[1].fighter.hp,200-(i-1)*12);arts.advance(.01,actors,hit);assert.equal(arts.bubbles.length,4-i);assert.equal(actors[1].fighter.hp,200-i*12);assert.ok(Math.abs(arts.detonations.at(-1).time-i)<1e-7);}
assert.ok(arts.detonations.every(d=>d.damage===12&&d.radius===2.8));arts.advance(1,actors,hit);assert.equal(actors[1].fighter.hp,152);assert.equal(arts.bursts.length,0);
setup();arts.cast('player',spell,actors[1].pos);arts.advance(4,actors,hit);assert.deepEqual(arts.detonations.map(d=>d.time),[1,2,3,4]);assert.equal(actors[1].fighter.hp,152,'large steps preserve all staggered explosions once');
setup();arts.cast('player',spell,actors[1].pos);actors[1].pos[0]=8;arts.advance(4,actors,hit);assert.equal(actors[1].fighter.hp,200,'escaping the fixed ring evades damage');
setup();actors[1].fighter.resistances={water:.25};actors[1].fighter.shield=30;arts.cast('player',spell,actors[1].pos);arts.advance(4,actors,hit);assert.equal(actors[1].fighter.hp,194,'armor and shields apply to each explosion');
setup();arts.cast('player',spell,actors[1].pos);const frozen=arts.state();sweepTsunami({owner:'player',normal:[0,0,-1],width:12,height:5,depth:7,carried:[]},[0,0,50],[0,0,-50],{actors,walls:[],fields:[],dark:{clones:[],bindings:[]},wind:{spirits:[]},light:{optics:[],pulses:[]},earth:{effects:[]},nature:{wood:{walnuts:[],clouds:[]},fogs:[]},intersectsWave});assert.deepEqual(arts.state(),frozen,'a tsunami cannot trigger, enlarge, empower or carry bubbles');arts.advance(0,actors,hit);assert.deepEqual(arts.state(),frozen);assert.deepEqual(arts.state().bubbles.map(b=>b.position),positions);
setup();arts.cast('enemy',spell,actors[0].pos);arts.advance(4,actors,hit);assert.equal(actors[0].fighter.hp,152);assert.equal(actors[1].fighter.hp,200);arts.reset();assert.equal(scene.children.length,0);assert.deepEqual(arts.state(),{bubbles:[],bursts:[],detonations:[]});
setup();arts.cast('player',spell,actors[1].pos);arts.advance(4,actors,s=>actors[1].fighter.receive(s.damage*damageMultiplierFor({damageMultiplier:1.1,elementBonuses:{water:.14}},s.element),true,false,s.element));assert.ok(Math.abs(actors[1].fighter.hp-(200-4*10*1.2*1.24))<1e-7,'base 10 retains the Water coefficient, shared strength and elemental armguard bonus');arts.reset();
console.log('PASS: four bubbles with base 10 and Water coefficient 1.2 at seconds 1/2/3/4, 6s cooldown, large-step timing, evasion, shields, ownership, pause/reset and no tsunami interaction.');
