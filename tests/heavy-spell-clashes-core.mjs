import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {NatureArts} from '../src/nature-arts.js';
import {sweepSnowball} from '../src/snowball-sweep.js';
import {cancelSpellDamage,resolveWaveClashes,waveClashTime} from '../src/spell-clashes.js';
import {createSpellSoundscape} from '../src/spell-soundscape.js';
const {Fighter,spells,intersectFireWall}=SealGameCore,spell=id=>spells.find(s=>s.id===id),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const make=()=>{
  const nature=new NatureArts(new T.Scene(),()=>0,{},intersectFireWall),actors=[{id:'player',owner:'player',pos:[0,1.72,24],fighter:new Fighter(5000)},{id:'primary',owner:'enemy',pos:[0,1.72,-24],fighter:new Fighter(5000)}];
  return {nature,actors,walls:[],fields:[],dark:{clones:[],bindings:[]},wind:{spirits:[]},light:{optics:[],pulses:[]},earth:{effects:[]},shots:[]};
};
function ball(c,owner,damage,z=0){const actor=c.actors.find(a=>a.owner===owner);if(!c.nature.weather(owner))c.nature.cast(owner,spell('ice-reflect'),actor.pos,[0,0,1],c.actors);c.nature.weather(owner).amount=90;assert.ok(c.nature.cast(owner,spell('ice-orb'),actor.pos,[0,0,1],c.actors));const b=c.nature.balls.at(-1);b.damage=damage;b.phase='rolling';b.age=1;b.p=[0,b.spell.radius,z];return b;}
const wave=(owner,damage,z=0)=>({owner,element:'water',style:'tsunami',phase:'flying',life:5,p:[0,.03,z],old:[0,.03,z],normal:[0,0,owner==='player'?-1:1],width:12,height:5,depth:7,damage,carried:[]});

for(const [da,db]of [[300,100],[100,300],[200,200]])for(const owner of ['player','enemy']){
  const other=owner==='player'?'enemy':'player',c=make(),w=wave(other,db),attack={owner,element:'ice',style:'snowball',old:[0,4.8,10],p:[0,4.8,-10],size:4.8,damage:da,v:[0,0,-1]};c.shots.push(w);
  sweepSnowball(attack,c);close(attack.damage,Math.max(0,da-db));close(w.damage,Math.max(0,db-da));assert.equal(!!w.consumedByDefense,db<=da);
  const d=make(),b=ball(d,other,db),moving=wave(owner,da);moving.old=[0,.03,-20];moving.p=[0,.03,20];
  assert.equal(d.nature.intercept(moving),da<=db);close(moving.damage,Math.max(0,da-db));assert.equal(d.nature.balls.includes(b),db>da);if(db>da)close(b.damage,db-da);
  const e=make();ball(e,owner,da,3);ball(e,other,db,-3);e.nature.advance(.01,e.actors,()=>{},e.walls,()=>assert.fail('Clash must occur before reaching an actor'),()=>{},null,a=>sweepSnowball(a,e));
  assert.equal(e.nature.balls.length,da===db?0:1);if(da!==db){assert.equal(e.nature.balls[0].owner,da>db?owner:other);close(e.nature.balls[0].damage,Math.abs(da-db));}
  const aWave=wave(owner,da,12),bWave=wave(other,db,-12);resolveWaveClashes([aWave,bWave],w=>[w.p[0],w.p[1],-w.p[2]]);close(aWave.damage,Math.max(0,da-db));close(bWave.damage,Math.max(0,db-da));assert.equal(!!aWave.consumedByDefense,da<=db);assert.equal(!!bWave.consumedByDefense,db<=da);
}

// Survivors actually hit for the remainder, rather than restoring their original damage next tick.
for(const owner of ['player','enemy']){
  const c=make(),other=owner==='player'?'enemy':'player';ball(c,owner,300,3);ball(c,other,100,-3);let received=0;
  for(let i=0;i<600&&c.nature.balls.length;i++)c.nature.advance(1/60,c.actors,()=>{},c.walls,a=>{received+=a.damage;},()=>{},null,a=>sweepSnowball(a,c));
  close(received,200);assert.equal(c.nature.balls.length,0);
}
const a={owner:'player',damage:100},b={owner:'enemy',damage:150};cancelSpellDamage(a,b,x=>x.owner==='player'?2:1);close(a.damage,25);close(b.damage,0);
const scaled=make(),scaledBall=ball(scaled,'player',100),scaledWave=wave('enemy',150);scaledWave.old=[0,.03,-20];scaledWave.p=[0,.03,20];scaled.nature.intercept(scaledWave,a=>a.owner==='player'?2:1);close(scaledBall.damage,25);close(scaledWave.damage,0);
for(const style of ['dragon','bird','icebind','shuriken']){
  const c=make(),b=ball(c,'player',10),shot={owner:'enemy',style,old:[0,4.8,-15],p:[0,4.8,15],size:.2,damage:1000,life:5};
  assert.equal(c.nature.intercept(shot),true);assert.equal(shot.life,0);close(b.damage,10);assert.ok(c.nature.balls.includes(b),'Ordinary attacks do not spend snowball damage even when much stronger');
}
const sameTeam=[wave('player',300,0),wave('player',100,0)];resolveWaveClashes(sameTeam,w=>w.p);assert.deepEqual(sameTeam.map(w=>w.damage),[300,100]);
const missA=wave('player',300,12),missB=wave('enemy',100,-12);missB.p[0]=40;assert.equal(waveClashTime(missA,[0,.03,-12],missB,[40,.03,12]),null);
const sideways=wave('enemy',100,0),straight=wave('player',300,12);sideways.p=[-12,.03,0];sideways.normal=[1,0,0];assert.notEqual(waveClashTime(straight,[0,.03,-12],sideways,[12,.03,0]),null);
const chain=[wave('player',300,15),wave('enemy',100,2),wave('enemy',100,-12)];resolveWaveClashes(chain,w=>w.owner==='player'?[0,.03,-25]:w.p);close(chain[0].damage,100);assert.ok(chain.slice(1).every(w=>w.consumedByDefense));resolveWaveClashes(chain,w=>w.p);close(chain[0].damage,100);

// Both casters share the same weather renderer and wind loop, while their snow banks stay independent.
const weather=make(),n=weather.nature,cast=(owner,id)=>n.cast(owner,spell(id),weather.actors.find(a=>a.owner===owner).pos,[0,0,1],weather.actors);
cast('player','ice-reflect');n.weather('player').amount=20;n.visuals([],weather.actors,null);const before=n.state().snowVisual,positions=n.flakes.geometry.attributes.position.array.slice(),children=n.environment.children.length;
cast('enemy','ice-reflect');n.weather('enemy').amount=20;n.visuals([],weather.actors,null);assert.deepEqual(n.state().snowVisual,before);assert.deepEqual(n.flakes.geometry.attributes.position.array,positions);assert.equal(n.environment.children.length,children);
n.weather('player').amount=10;close(n.weather('enemy').amount,20);cast('player','ice-barrier');cast('enemy','ice-barrier');const time=n.snowfallTime;n.advance(1,weather.actors);close(n.snowfallTime-time,1.8);close(n.snowAmount('player'),12);close(n.snowAmount('enemy'),22);
let layers,clips;const sounds=createSpellSoundscape({cue:()=>assert.fail('Snow weather must not emit repeated one-shot cues'),textures:x=>layers=x,attached:x=>clips=x});
sounds.update({snow:n.snow});assert.equal(layers.size,1);assert.equal(layers.get('snowstorm-wind'),1);assert.equal(clips.size,0);sounds.update({snow:[n.weather('player')]});assert.equal(layers.size,1);assert.equal(layers.get('snowstorm-wind'),1);sounds.update({snow:[n.weather('enemy')]});assert.equal(layers.size,1);assert.equal(layers.get('snowstorm-wind'),.65);sounds.update(null);assert.equal(layers.size,0);
console.log('PASS: all three heavy-spell pairs, both owners, equal/stronger/weaker, scaled damage, swept and angled waves, friendly spells, repeated contacts, survivor impact, shared snowfall and one wind loop.');
