import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as T from 'three';
import { crossWalls } from '../src/combat.js';
import { LightArts } from '../src/light-arts.js';
const ctx={};vm.runInNewContext(fs.readFileSync('game-core.js','utf8'),ctx);
const {Fighter,spells,intersectFireWall}=ctx.SealGameCore,spell=id=>spells.find(s=>s.id===id),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,a+' != '+b);
const wall=(hp,z,element='fire')=>({owner:'enemy',element,hp,life:5,p:[0,0,z],normal:[0,0,1],width:6,height:4});
for(const element of ['fire','water','wind','earth','wood','ice']){
  let w=wall(30,-5,element),s={owner:'player',old:[0,1.72,0],p:[0,1.72,-20],damage:100};assert.equal(crossWalls(s,[w],intersectFireWall),false);close(w.hp,0);close(s.damage,70);
  w=wall(100,-5,element);s.damage=30;assert.equal(crossWalls(s,[w],intersectFireWall),true);close(w.hp,70);close(s.damage,0);
  w=wall(30,-5,element);s.damage=30;assert.equal(crossWalls(s,[w],intersectFireWall),true);close(w.hp,0);close(s.damage,0);
}
let walls=[wall(40,-10),wall(30,-5),wall(70,-15)],shot={owner:'player',old:[0,1.72,0],p:[0,1.72,-20],damage:100};assert.equal(crossWalls(shot,walls,intersectFireWall),true);assert.deepEqual(walls.map(w=>w.hp),[0,0,40]);
let hp=30;const segment=z=>Object.defineProperty(wall(0,z,'earth'),'hp',{get:()=>hp,set:v=>{hp=v;}});shot.damage=100;assert.equal(crossWalls(shot,[segment(-5),segment(-5.1)],intersectFireWall),false);close(shot.damage,70);
const f=new Fighter();f.defend({shield:75,duration:4.5,heal:0,element:'fire',color:'#ff844b'});close(f.receive(100,true).damage,25);close(f.hp,f.maxHp-25);close(f.shield,0);close(f.shieldTime,0);
const arts=new LightArts(new T.Scene(),intersectFireWall),actors=[{owner:'player',pos:[0,1.72,0],dir:[0,0,-1],fighter:new Fighter()},{owner:'enemy',pos:[0,1.72,-15],dir:[0,0,1],fighter:new Fighter()}];
const damage=(s)=>actors.find(a=>a.owner!==s.owner).fighter.receive(s.damage,true);
walls=[wall(10,-9),wall(15,-5)];arts.fire('player',spell('light-orb'),actors[0].pos,actors[0].dir);arts.advance(.1,actors,walls,damage);close(actors[1].fighter.hp,actors[1].fighter.maxHp-1);assert.ok(walls.every(w=>w.hp===0));
arts.reset();actors[1].fighter=new Fighter();walls=[wall(30,-9)];arts.place('player',spell('light-barrier'),actors[0].pos,actors[0].dir,actors);arts.fire('player',spell('light-orb'),actors[0].pos,actors[0].dir);arts.advance(.1,actors,walls,damage);close(actors[1].fighter.hp,actors[1].fighter.maxHp-15.5);assert.equal(arts.lastPaths.at(-1).spectrum,7);
arts.reset();actors[1].fighter=new Fighter();const mirror=arts.place('enemy',spell('light-reflect'),[0,1.72,-10],[0,0,1],actors);mirror.hp=10;arts.fire('player',spell('light-orb'),actors[0].pos,actors[0].dir);arts.advance(.1,actors,[],damage);close(actors[1].fighter.hp,actors[1].fighter.maxHp-16);close(mirror.hp,0);
arts.reset();const shieldMirror=arts.place('enemy',spell('light-reflect'),[0,1.72,-10],[0,0,1],actors);shieldMirror.hp=20;shot={owner:'player',old:[0,1.72,0],p:[0,1.72,-12],v:[0,0,-36],size:.1,life:4,damage:100};walls=[wall(30,-5)];assert.equal(arts.redirect(shot,actors,walls),false);close(shot.damage,50);close(walls[0].hp,0);close(shieldMirror.hp,0);
arts.reset();arts.place('enemy',spell('light-reflect'),[0,1.72,-10],[0,0,1],actors);shot={owner:'player',old:[0,1.72,0],p:[0,1.72,-12],v:[0,0,-36],size:.1,life:4,damage:100};walls=[wall(120,-5)];assert.equal(arts.redirect(shot,actors,walls),true);close(walls[0].hp,20);close(shot.damage,0);assert.ok(shot.consumedByDefense);
console.log('PASS: six wall types, weaker/equal/stronger hits, ordered stacked defenses, shared stone sections, armor break, laser and rainbow residual damage, mirror break, wall/mirror collisions within one frame.');
