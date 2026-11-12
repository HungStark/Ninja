import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {LightArts} from '../src/light-arts.js';
import {EarthArts} from '../src/earth-arts.js';
import {NatureArts} from '../src/nature-arts.js';
import {WaterBubbles} from '../src/water-bubbles.js';
import {createGuardianBossCombat as createMoba} from '../src/guardian-moba-combat.js';
import {createGuardianBossCombat as createLegacy} from '../src/guardian-legacy-combat.js';
const {Fighter,spells,intersectFireWall}=SealGameCore,spell=id=>spells.find(s=>s.id===id),scene=new T.Scene();let actors,hits;
function setup(){actors=[{id:'player',owner:'player',pos:[10,1.72,7],dir:[0,0,-1],fighter:new Fighter(100000)},{id:'primary',owner:'enemy',pos:[0,1.72,-12],dir:[0,0,1],fighter:new Fighter(100000)},{id:'ha-ly',owner:'player',untargetable:true,pos:[0,1.72,7],dir:[0,0,-1],fighter:new Fighter(100000)}];actors.forEach(a=>a.fighter.autoRestore=false);hits=[];}
const impact=(shot,p)=>{const a=actors.find(a=>a.id===shot.victimId)||actors.filter(a=>a.owner!==shot.owner).sort((a,b)=>Math.hypot(...a.pos.map((v,i)=>v-p[i]))-Math.hypot(...b.pos.map((v,i)=>v-p[i])))[0];hits.push({...shot,id:a.id});shot.hitResult=a.fighter.receive(shot.damage,true,false,shot.element);return shot.hitResult;};
setup();const light=new LightArts(scene,intersectFireWall);light.fire('enemy',spell('light-orb'),actors[1].pos,[0,0,1]);light.advance(.2,actors,[],impact);assert.ok(hits.some(h=>h.id==='ha-ly'));assert.ok(!hits.some(h=>h.id==='player'));light.reset();
setup();const water=new WaterBubbles(scene);water.cast('enemy',spell('water-barrier'),actors[2].pos);water.advance(1.1,actors,impact);assert.ok(hits.some(h=>h.id==='ha-ly'));assert.ok(!hits.some(h=>h.id==='player'));water.reset();
setup();const earth=new EarthArts(scene),walls=[];earth.cast('enemy',spell('earth-volley'),actors[1].pos,[0,0,1],actors,walls,[0,0,7]);for(let t=0;t<6;t+=.05)earth.advance(.05,actors,walls,impact);assert.ok(hits.some(h=>h.id==='ha-ly'),'earth area affects untargetable companion');earth.reset(walls);
setup();const nature=new NatureArts(scene,()=>0,{},intersectFireWall);nature.wood.cast('enemy',spell('wood-reflect'),actors[1].pos,[0,0,1],actors,[],[],actors[2].pos);for(let t=0;t<3;t+=.05)nature.advance(.05,actors,()=>{},[],impact);const flower=nature.wood.gardens[0].plants.find(p=>p.kind==='flower');actors[2].pos=[flower.p[0],1.72,flower.p[2]];const poison=nature.empower('enemy',spell('wood-orb'));nature.wood.cast('enemy',poison,actors[1].pos,[0,0,1],actors,[],[],actors[2].pos);for(let t=0;t<3;t+=.05)nature.advance(.05,actors,()=>{},[],impact);assert.ok(hits.some(h=>h.id==='ha-ly'),'poison has separate exposure for hero and companion');nature.reset();
for(const create of [createMoba,createLegacy]){
 const guardian=create(scene);for(const id of ['fire','water','lightning','wind','earth','wood','ice','light','dark']){
  setup();actors[0].pos=[0,1.72,5];actors[2].pos=[0,1.72,5];guardian.reset(id);const boss={hp:100000,maxHp:100000};const options={aiEnabled:false,targets:actors.filter(a=>a.owner==='player'),bounds:{minX:-16,maxX:16,minZ:-22,maxZ:14},attackBounds:{minX:-14,maxX:14,minZ:0,maxZ:12}};
  guardian.update(.01,boss,actors[0].pos,[0,2,-12],impact,options);guardian.trigger(create===createLegacy?({fire:2,water:0,lightning:1,wind:1,earth:0,wood:0,ice:2,light:1,dark:0}[id]):({wind:2,light:1}[id]||0),actors[0].pos,[0,2,-12],boss);for(let t=0;t<12;t+=.05)guardian.update(.05,boss,actors[0].pos,[0,2,-12],impact,options);assert.ok(hits.some(h=>h.id==='ha-ly'),id+' '+(create===createMoba?'moba':'legacy')+' collateral');
  if(create===createMoba)assert.ok(guardian.state().history.every(h=>h.targetId==='player'),'never select companion as cast target');guardian.clear();
 }guardian.dispose();
}
console.log('PASS: real light beams, bubble explosions, earth AoE, poison and nine guardian families damage the untargetable companion without changing cast targets.');
