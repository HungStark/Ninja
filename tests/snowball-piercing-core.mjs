import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {NatureArts} from '../src/nature-arts.js';
import {sweepSnowball,segmentDistanceSquared} from '../src/snowball-sweep.js';
import {crossWalls} from '../src/combat.js';
const {Fighter,spells,intersectFireWall}=SealGameCore,spell=id=>spells.find(s=>s.id===id);
assert.equal(segmentDistanceSquared([-2,0,0],[2,0,0],[0,0,-3],[0,0,3]),0);assert.equal(segmentDistanceSquared([0,0,0],[0,0,0],[3,0,0],[3,0,0]),9);
for(const owner of ['player','enemy']){
 const scene=new T.Scene(),arts=new NatureArts(scene,()=>0,{},intersectFireWall),other=owner==='player'?'enemy':'player',actors=[{id:owner,owner,pos:[0,1.72,15],fighter:new Fighter(2000)},{id:other,owner:other,pos:[0,1.72,-15],fighter:new Fighter(2000)}];
 const walls=[{owner:other,element:'earth',p:[0,1.7,2],normal:[0,0,1],width:12,height:12,hp:10000,life:100},{owner:other,element:'ice',p:[0,1.7,-3],normal:[0,0,1],width:12,height:12,hp:10000,life:100}];
 const victim=actors[1].fighter;victim.shield=10000;victim.shieldTime=100;victim.reflect=1;
 assert.ok(arts.cast(owner,spell('ice-reflect'),actors[0].pos,[0,0,-1],actors,walls));arts.weather(owner).amount=90;assert.ok(arts.cast(owner,spell('ice-orb'),actors[0].pos,[0,0,-1],actors,walls));
 const ball=arts.balls[0],damage=ball.damage,shots=[{owner:other,p:[0,4.8,0],old:[0,4.8,0],life:10,size:1,style:'meteor'}],fields=[{p:[0,4.8,-2],radius:2}],removed=[],optic={center:[0,4.8,-4],radius:2,owner:other},light={optics:[optic],pulses:[],remove(list,item){removed.push(item);list.splice(list.indexOf(item),1);}},dark={clones:[],bindings:[]},wind={spirits:[]},earth={effects:[]};let hit=0;
 for(let i=0;i<600&&arts.balls.length;i++)arts.advance(1/60,actors,()=>{},walls,(attack)=>{assert.equal(attack.damage,damage);assert.ok(attack.ignoreShield);assert.ok(attack.unstoppable);hit++;victim.receive(attack.damage,true,attack.ignoreShield,'ice');},()=>{},()=>true,attack=>sweepSnowball(attack,{actors,walls,fields,dark,wind,light,earth,nature:arts,shots}));
 assert.equal(hit,1);assert.equal(victim.hp,2000-damage);assert.equal(victim.shield,0);assert.equal(victim.reflect,0);assert.ok(walls.every(w=>w.hp===0));assert.equal(shots[0].life,0);assert.equal(fields.length,0);assert.ok(removed.includes(optic));assert.equal(arts.snow.length,1,'source snowfall survives');
 const ordinary={owner,old:[0,1.7,10],p:[0,1.7,0],size:.2,damage:10};const wall={owner:other,p:[0,1.7,5],normal:[0,0,1],width:10,height:10,hp:100,life:100};assert.ok(crossWalls(ordinary,[wall],intersectFireWall));assert.equal(wall.hp,90,'ordinary spells still spend wall durability');
}
console.log('PASS: both owners, successive 10,000 HP walls, full 250 damage through shield/reflect, no reflection or guardian-object interception, projectile/field/mirror destruction, snow source preserved and ordinary defenses unchanged.');
