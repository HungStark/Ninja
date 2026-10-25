import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as T from 'three';
import { NatureArts } from '../src/nature-arts.js';
const ctx={};vm.runInNewContext(fs.readFileSync('game-core.js','utf8'),ctx);
const {spells,GameRules,Fighter,intersectFireWall}=ctx.SealGameCore;
const spell=id=>spells.find(s=>s.id===id),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,a+' != '+b),distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const scene=new T.Scene(),arts=new NatureArts(scene,()=>0,{},intersectFireWall);let actors,winner,walls=[],shots=[];
const setup=()=>{arts.reset(walls);winner=null;walls=[];shots=[];actors=[{owner:'player',pos:[0,1.72,7],dir:[0,0,-1],fighter:new Fighter(1000)},{owner:'enemy',pos:[0,1.72,-24],dir:[0,0,1],fighter:new Fighter(1000)}];};
const advance=t=>{for(let age=0;age<t-1e-9&&!winner;age+=1/60){const dt=Math.min(1/60,t-age);for(const a of actors)a.fighter.tick(dt);winner=arts.advance(dt,actors,(owner,p)=>{actors.find(a=>a.owner===owner).pos=[...p];},walls);for(const w of walls)w.life-=dt;}arts.visuals(shots,actors,null);};
const cast=(id,owner='player',dir)=>{const a=actors.find(a=>a.owner===owner);return arts.cast(owner,arts.empower(owner,spell(id)),a.pos,dir||a.dir,actors,walls,shots);};
const plant=owner=>{cast('wood-reflect',owner);advance(2);};
for(const element of ['wood','ice']){const s=spell(element+'-reflect');assert.equal(s.sequence.length,6);assert.equal(s.damage,0);assert.equal(s.oncePerMatch,true);const rules=new GameRules([s.id]);s.sequence.forEach(k=>rules.seal(k));assert.equal(rules.cast().ok,true);rules.tick(2);s.sequence.forEach(k=>rules.seal(k));const chakra=rules.chakra;assert.equal(rules.cast().reason,'once');assert.equal(rules.chakra,chakra);assert.equal(rules.casts,1);assert.equal(new GameRules([s.id]).usedOnce.size,0);}
for(const s of spells.filter(s=>s.requiresGarden)){const rules=new GameRules(s.kind==='attack'?[s.id]:[s.id,'wood-reflect']);s.sequence.forEach(k=>rules.seal(k));assert.equal(rules.cast().reason,'garden');assert.equal(rules.chakra,100);assert.equal(rules.cast({woodGarden:true}).ok,true);}
const locked=new GameRules(['ice-orb']);spell('ice-orb').sequence.forEach(k=>locked.seal(k));assert.equal(locked.cast().reason,'snow');assert.equal(locked.chakra,100);assert.equal(locked.cast({snowFull:true}).ok,true);

// The forest surrounds the opponent; the walnut stays on the caster's right.
const surroundsOpponent=g=>{
  const plants=g.plants.filter(p=>p.kind!=='walnut'),quadrants=[0,0,0,0];
  for(const p of plants){const delta=subtract(p.p,g.p),forward=delta[0]*g.axis[0]+delta[2]*g.axis[2],side=delta[0]*g.side[0]+delta[2]*g.side[2];quadrants[(forward<0?2:0)+(side<0?1:0)]++;if(forward<0)assert.ok(p.height<=1.5,'Foreground plants stay below half opponent height');else assert.ok(p.height>2.5,'Background plants retain forest height');}
  assert.ok(quadrants.every(count=>count===9),'Plants must surround the opponent in all four quadrants');
  assert.deepEqual(g.p,actors.find(a=>a.owner!==g.owner).pos);
  assert.ok(distance(g.p,g.origin)>25);
};
const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
setup();assert.equal(cast('wood-orb'),false);assert.equal(cast('wood-barrier'),false);cast('wood-reflect','player',[1,1,0]);assert.equal(cast('wood-reflect'),false);
let garden=arts.tree('player');assert.equal(garden.plants.length,37);assert.equal(new Set(garden.plants.map(p=>p.kind)).size,4);assert.ok(garden.plants.some(p=>distance(p.p,actors[1].pos)>12));assert.ok(Math.max(...garden.plants.map(p=>p.p[0]))-Math.min(...garden.plants.map(p=>p.p[0]))>15);let walnut=garden.plants.find(p=>p.kind==='walnut');assert.ok(walnut.p[0]>0&&walnut.p[2]<7&&walnut.p[2]>-3);
surroundsOpponent(garden);assert.equal(spell('wood-orb').sequence.length,2);assert.equal(walnut.parts.canopy.length,23);for(const kind of ['flower','vine','bamboo']){const heights=garden.plants.filter(p=>p.kind===kind&&!p.foreground).map(p=>p.height);assert.ok(Math.max(...heights)-Math.min(...heights)>1,'Background plants of the same species vary in size');}
assert.equal(arts.wood.ready('player'),false);advance(.4);assert.ok(garden.plants.every(p=>p.seed.visible&&!p.model.visible));const seedPos=garden.plants[0].seed.position.clone();advance(.35);assert.ok(garden.plants[0].seed.position.distanceTo(seedPos)>1);advance(1.25);assert.equal(arts.wood.ready('player'),true);assert.ok(garden.plants.every(p=>p.model.visible&&!p.seed.visible));assert.ok(actors.every(a=>a.fighter.hp===1000));
const startScale=arts.wood.scale('player'),startEmission=arts.empower('player',spell('wood-orb')).poisonRadius,startControl=arts.empower('player',spell('wood-lance')).controlDuration;
advance((garden.readyAt+60)*.5-garden.age);close(arts.growth('player'),.5);close(arts.multiplier('player'),2);assert.ok(arts.wood.scale('player')>startScale);assert.ok(arts.empower('player',spell('wood-orb')).poisonRadius>startEmission);assert.ok(arts.empower('player',spell('wood-lance')).controlDuration>startControl);
for(const s of spells.filter(s=>s.element==='wood'&&!s.oncePerMatch))close(arts.empower('player',s).damage,s.damage*2);
advance(60-garden.age);close(arts.multiplier('player'),3);for(const p of garden.plants){p.model.updateWorldMatrix(true,true);const box=new T.Box3().setFromObject(p.model);assert.ok(box.max.y-box.min.y<=arts.wood.maxPlantHeight+.15,'Plant exceeds three quarters of the gate height');if(p.foreground)assert.ok(box.max.y-p.p[1]<=1.5,'Foreground canopy exceeds half opponent height');}
close(arts.empower('player',spell('wood-lance')).controlDuration,6);close(arts.empower('player',spell('wood-orb')).poisonRadius,5);close(arts.empower('player',spell('wood-barrier')).shield,270);close(arts.empower('player',spell('wood-barrier')).duration,10);
cast('wood-orb');assert.equal(shots.length,0);assert.equal(arts.wood.clouds.length,12);let cloud=arts.wood.clouds[0];close(cloud.radius,5);close(cloud.damageRate,15);assert.ok(cloud.origin[1]>cloud.center[1]+3,'Smoke begins at the tall flower mouth');
actors[1].pos=[cloud.center[0],1.72,cloud.center[2]];advance(2);assert.ok(actors[1].fighter.hp<980);const zoneHP=actors[1].fighter.hp,anchoredCloud=[...cloud.center];actors[1].pos=[100,1.72,100];advance(1);close(actors[1].fighter.hp,zoneHP);assert.deepEqual(cloud.center,anchoredCloud);assert.equal(arts.wood.poisoned('enemy'),false);
actors[1].pos=[cloud.center[0],1.72,cloud.center[2]];advance(1);assert.ok(actors[1].fighter.hp<zoneHP);actors[1].fighter.invulnerableTime=1;const immuneHP=actors[1].fighter.hp;advance(.5);close(actors[1].fighter.hp,immuneHP);advance(2);assert.equal(arts.wood.clouds.length,0);const endedHP=actors[1].fighter.hp;advance(1);close(actors[1].fighter.hp,endedHP);
cast('wood-orb');cast('wood-orb');assert.equal(arts.wood.clouds.length,12,'Refresh replaces this forest smoke instead of leaking clouds');

setup();plant('player');cast('wood-lance');advance(.9);assert.ok(actors[1].fighter.woodControlTime>1.8);assert.equal(actors[1].fighter.controlSource,'Vạn Đằng Phược Ấn');const vineDuration=actors[1].fighter.woodControlTime;advance(vineDuration+.2);close(actors[1].fighter.controlTime,0);
setup();plant('player');cast('wood-lance');actors[1].pos[0]+=4;advance(1);close(actors[1].fighter.controlTime,0);close(actors[1].fighter.hp,1000);
setup();plant('player');const power=arts.multiplier('player');cast('wood-volley');assert.equal(shots.length,12);assert.ok(shots.every(s=>s.releaseAt>=.55));assert.ok(shots.every(s=>s.style==='bambooleaf'&&s.target[2]<0&&s.origin[1]>0));close(shots.reduce((n,s)=>n+s.damage,0),75*power);close(actors[1].fighter.hp,1000,'Leaves must travel before dealing damage');
setup();plant('player');cast('wood-volley','player',[1,0,0]);assert.ok(shots.every(s=>s.target[0]>25&&s.target[2]===7),'Bamboo follows the specified direction rather than auto-targeting');

// The fruit falls and expands before it can intercept a frontal attack.
setup();plant('player');cast('wood-barrier');assert.equal(walls.length,0);close(actors[0].fighter.shield,0);advance(.5);assert.equal(arts.wood.walnuts[0].phase,'falling');advance(.4);assert.equal(arts.wood.walnuts[0].phase,'growing');assert.equal(walls.length,0);advance(.2);assert.equal(walls.length,1);assert.equal(arts.wood.walnuts[0].phase,'guarding');
const w=walls[0];assert.ok(intersectFireWall([0,1.72,-10],[0,1.72,7],w));assert.equal(intersectFireWall([0,1.72,12],[0,1.72,7],w),null);const anchored=[...w.p];actors[0].pos[0]=-3;advance(.1);assert.deepEqual(w.p,anchored);w.hp=0;advance(.1);assert.equal(arts.wood.walnuts.length,0);walls.length=0;cast('wood-barrier');advance(1.2);assert.equal(walls.length,1);advance(8);assert.equal(arts.wood.walnuts.length,0);
setup();plant('enemy');surroundsOpponent(arts.tree('enemy'));walnut=arts.tree('enemy').plants.find(p=>p.kind==='walnut');assert.ok(walnut.p[0]<0&&walnut.p[2]>-24);cast('wood-lance','enemy');advance(1);assert.ok(actors[0].fighter.woodControlTime>0);arts.reset(walls);close(actors[0].fighter.woodControlTime,0);assert.equal(arts.trees.length,0);

// Support spells spend the owner's stored snow; an idle full storm cannot bank overflow.
for(const id of ['ice-lance','ice-volley','ice-barrier']){
  const cost=id==='ice-lance'?1:2;setup();assert.equal(spell(id).snowCost,cost);assert.equal(cast(id),false);assert.equal(arts.snow.length,0);
  const r=new GameRules([id,'ice-reflect']);spell(id).sequence.forEach(k=>r.seal(k));assert.equal(r.cast({snowAmount:cost-.01}).reason,'snowCost');close(r.chakra,100);assert.equal(r.casts,0);
  cast('ice-reflect');advance(cost-.01);assert.equal(cast(id),false);close(arts.snowAmount('player'),cost-.01);advance(.01);cast(id);close(arts.snowAmount('player'),0);assert.equal(arts.canCast('player',spell(id)),false);
  assert.equal(r.cast({snowAmount:cost}).ok,true);advance(89.99);assert.equal(arts.snowReady('player'),false);advance(.01);assert.equal(arts.snowReady('player'),true);close(arts.weather('player').age,90+cost);
  advance(30);close(arts.snowAmount('player'),90);cast(id);close(arts.snowAmount('player'),90-cost);assert.equal(arts.snowReady('player'),false);assert.equal(cast('ice-orb'),false);advance(cost);assert.equal(arts.snowReady('player'),true);
}
setup();cast('ice-reflect');cast('ice-reflect','enemy');advance(10);cast('ice-volley','enemy');close(arts.snowAmount('enemy'),8);close(arts.snowAmount('player'),10);const held=arts.snowAmount('enemy');arts.advance(0,actors);close(arts.snowAmount('enemy'),held);

// Ice support has real formation stages and an anchored frontal wall.
setup();cast('ice-reflect');advance(10);cast('ice-lance');assert.equal(shots.length,1);assert.equal(shots[0].phase,'blooming');close(shots[0].releaseAt,.75);arts.visuals(shots,actors,null);assert.equal(arts.state().iceGather[0].flakes,48);close(actors[1].fighter.controlTime,0);
cast('ice-barrier');assert.equal(walls.length,1);close(actors[0].fighter.shield,0);const iceWall=walls[0];close(iceWall.height,0);advance(.2);assert.ok(iceWall.height>0&&iceWall.height<3.9);advance(.7);close(iceWall.height,3.9);assert.equal(arts.iceWalls[0].root.userData.wall.panels.length,7);assert.ok(intersectFireWall([0,1.72,-10],[0,1.72,7],iceWall));assert.equal(intersectFireWall([0,1.72,12],[0,1.72,7],iceWall),null);const iceAnchor=[...iceWall.p];actors[0].pos[0]=3;advance(.1);assert.deepEqual(iceWall.p,iceAnchor);iceWall.hp=0;advance(.1);assert.equal(arts.iceWalls.length,0);assert.equal(walls.length,0);
setup();cast('ice-reflect');advance(10);cast('ice-volley');advance(.4);let fog=arts.fogs[0];assert.equal(fog.decoy.visible,false);assert.ok(distance(fog.p,actors[0].pos)>4);actors[0].pos[0]=3;advance(.1);close(fog.cover.position.x,3);assert.equal(fog.material.uniforms.uInside.value,1);
setup();cast('ice-reflect','enemy');advance(10);cast('ice-volley','enemy');advance(.4);fog=arts.fogs[0];assert.equal(fog.decoy.visible,true);close(fog.cover.position.z,-24);assert.equal(fog.material.uniforms.uInside.value,0);assert.ok(distance(fog.p,actors[1].pos)>4);setup();

// Gathering moves snow and grows a stationary sphere before homing begins.
setup();assert.equal(cast('ice-orb'),false);cast('ice-reflect');advance(89.99);assert.equal(arts.snowReady('player'),false);advance(.01);assert.equal(arts.snowReady('player'),true);assert.ok(actors.every(a=>a.fighter.hp===1000));cast('ice-orb','player',[1,1,0]);assert.equal(arts.snowReady('player'),false);assert.equal(cast('ice-orb'),false);
let ball=arts.balls[0],origin=[...ball.p];advance(.3);const earlyScale=ball.spin.scale.x,chunk=ball.chunks[0].m.position.clone();assert.equal(ball.phase,'gathering');assert.equal(arts.state().snowVisible,true);advance(.8);assert.deepEqual(ball.p,origin);assert.ok(ball.spin.scale.x>earlyScale);assert.ok(ball.chunks[0].m.position.distanceTo(chunk)>1);assert.equal(arts.hidden('enemy'),false);
const frozen=JSON.stringify(arts.state());arts.advance(0,actors);arts.visuals(shots,actors,null);assert.equal(JSON.stringify(arts.state()),frozen);advance(1.1);assert.equal(ball.phase,'rolling');assert.equal(ball.gather.parent,null);assert.equal(arts.environment.visible,false);close(ball.spin.scale.x,1);
actors[1].fighter.shield=10000;actors[1].fighter.shieldTime=999;actors[1].fighter.reflect=10;actors[1].fighter.invulnerableTime=999;actors[1].pos[0]=5;advance(1);assert.ok(ball.p[0]>0);advance(5.5);assert.ok(arts.buried('enemy'));assert.equal(arts.hidden('enemy'),true);advance(3);assert.equal(winner,'player');
setup();cast('ice-reflect','enemy');advance(90);cast('ice-orb','enemy');advance(14);assert.equal(winner,'enemy');setup();cast('ice-reflect');advance(90);cast('ice-orb');advance(.7);arts.reset(walls);assert.equal(scene.children.filter(c=>c!==arts.environment&&c!==arts.haze).length,0);
setup();cast('ice-reflect');advance(3);cast('ice-volley');assert.equal(arts.hidden('player'),true);assert.notDeepEqual(arts.perceivedPosition('enemy',actors),actors[0].pos);advance(6);assert.equal(arts.hidden('player'),false);setup();arts.freeze('player',actors[1],3);assert.equal(actors[1].fighter.controlSource,'Hàn Băng Phong Tỏa');advance(3.1);close(actors[1].fighter.controlTime,0);assert.equal(arts.bindings.length,0);
console.log('PASS: automatic four-species garden/seed flights; three-quarter gate height and full-court forest; expanding purple poison regions with entry/exit damage, vine duration and bamboo animations; plant-origin aimed leaves, poison-area exposure, dodge/immunity, front walnut wall, both owners/reset; 90s snow, gathering/travelling chunks/growing sphere, pause, unstoppable homing/burial wins; fog and ice control.');
