import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as T from 'three';
import {createGuardianPhases} from '../src/guardian-phases.js';
import {GUARDIAN_ARTS,guardianPhaseHealth,empowerDarkGuardian} from '../src/guardian-arts.js';
import {NatureArts} from '../src/nature-arts.js';
const ctx={};vm.runInNewContext(fs.readFileSync('game-core.js','utf8'),ctx);
const {Fighter,spells}=ctx.SealGameCore;
const scene=new T.Scene(),g=createGuardianPhases(scene),p=[0,1.72,7],b=[0,2.4,-13];let hits=[];
const step=(seconds,f,player=p,opts={})=>{for(let t=0;t<seconds-1e-7;t+=1/60)g.update(1/60,f,player,b,(shot,pos)=>hits.push({shot,pos}),opts);};
function next(f){f.hp=0;assert.equal(g.beginTransition(f),true);g.advanceTransition(1.34,f,()=>assert.fail('early swap'));assert.equal(f.hp,0);g.advanceTransition(.02,f,()=>{});assert.ok(f.hp>0);g.advanceTransition(1.85,f,()=>{});assert.equal(g.transitioning,false);}
for(const village of Object.keys(GUARDIAN_ARTS)){
  const total=1001,parts=guardianPhaseHealth(total,village),f=new Fighter(total);g.reset({village,element:village,hp:total},f);assert.equal(parts.reduce((a,b)=>a+b),total);assert.equal(parts.length,village==='dark'?3:2);assert.equal(f.hp,parts[0]);
  f.hp=1;assert.equal(g.beginTransition(f),false,'must deplete whole HP bar');next(f);assert.equal(g.form,'beast');assert.equal(f.hp,parts[1]);
  hits=[];g.trigger(0,p,b,f);step(.9,f);assert.equal(g.offset.y,0,'full one-second windup before takeoff');const warning=scene.children[0].children.find(m=>m.geometry.type==='CircleGeometry');assert.equal(warning.material.color.getHexString(),'ff2626');assert.equal(hits.length,0);step(1.1,f,[5,1.72,7]);assert.equal(hits.length,0,'all villages can dodge the snapshotted warning');
  for(const index of (village==='nameless'?[0,1,2,4]:[0,1,2,3,4])){hits=[];assert.ok(g.trigger(index,p,b,f));step(6,f);assert.ok(scene.children[0].children.every(m=>m.matrix.elements.every(Number.isFinite)));}
  assert.equal(new Set(g.state().history.map(a=>a.name)).size,village==='nameless'?4:5,village+' distinct direct arts');
  if(village==='dark'){next(f);assert.equal(g.form,'avatar');assert.equal(f.hp,parts[2]);}
  f.hp=0;assert.equal(g.beginTransition(f),false,'last phase ends encounter');g.reset();assert.equal(scene.children[0].children.length,0,'reset removes every visual');
}
function beast(village='water'){const f=new Fighter(1000);g.reset({village,element:village,hp:1000},f);next(f);hits=[];return f;}
let f=beast();g.trigger(0,p,b,f);step(1.4,f);assert.ok(g.offset.y>5);step(.65,f,[5,1.72,7]);assert.equal(hits.length,0,'slam snapshots a position and can be dodged');
f=beast();g.trigger(0,p,b,f);step(2.1,f);assert.equal(hits.length,1);assert.equal(hits[0].shot.damage,38);
f=beast();g.trigger(2,p,b,f);step(1.49,f);assert.equal(hits.length,0,'orb charges for 1.5 seconds');step(.28,f);assert.equal(hits.length,0,'head recoils before firing');step(.9,f);assert.ok(hits.length>=5,'beam applies multiple small ticks');assert.ok(hits.every(h=>h.shot.blockable&&h.shot.damage<3));
f=beast();g.trigger(2,p,b,f);step(1.8,f);hits=[];step(.5,f,[3,1.72,7]);assert.equal(hits.length,0,'a 3 m dash can outrun the tracking beam');
f=beast();g.trigger(3,p,b,f);step(.1,f);assert.equal(g.damageMultiplier(),.65);step(6,f);assert.equal(g.damageMultiplier(),1,'armor expires');
f=beast('wood');f.hp=200;g.trigger(4,p,b,f);step(1,f);assert.ok(f.hp>200&&f.hp<210);g.onDamage(f.maxHp*.08);const before=f.hp;step(1,f);assert.equal(f.hp,before,'healing interrupts on enough incoming damage');
f=beast('ice');g.trigger(4,p,b,f);step(1.8,f);assert.equal(g.slowAt(p),.65);assert.equal(g.slowAt([6,1.72,7]),1);step(.1,f,p,{controlled:true});assert.equal(g.state().action,null,'control cancels monster action');
f=beast('dark');next(f);g.trigger(0,p,b,f);step(2.1,f,p,{controlled:true});assert.ok(hits.length>0,'aura acts independently while human is controlled');assert.ok(hits.at(-1).shot.damage<38);
for(const original of spells.filter(s=>s.element==='dark')){const copy=JSON.stringify(original),strong=empowerDarkGuardian(original);assert.equal(JSON.stringify(original),copy,'player spells remain unchanged');assert.equal(strong.cost,0);assert.equal(strong.cooldown,Math.max(1,original.cooldown*.6));assert.equal(strong.damage,original.damage*1.5);assert.equal(strong.maxClones,4);}
const nature=new NatureArts(new T.Scene()),actors=[{owner:'player',pos:p,dir:[0,0,-1],fighter:new Fighter(1000)},{owner:'enemy',pos:b,dir:[0,0,1],fighter:new Fighter(1000)}];
for(const a of actors)for(const id of ['wood-reflect','ice-reflect'])assert.ok(nature.cast(a.owner,spells.find(s=>s.id===id),a.pos,a.dir,actors));
nature.advance(20,actors);const garden=nature.tree('player'),weather=nature.weather('player'),growth=nature.growth('player');nature.resetForPhase();assert.equal(nature.tree('player'),garden);assert.equal(nature.growth('player'),growth);assert.equal(nature.weather('player'),weather);assert.equal(nature.snowAmount('player'),20);assert.equal(nature.tree('enemy'),undefined);assert.equal(nature.weather('enemy'),undefined);assert.ok(nature.canCast('player',spells.find(s=>s.id==='wood-orb')));nature.advance(2,actors);assert.equal(nature.snowAmount('player'),22);weather.consumed=true;weather.amount=90;nature.resetForPhase();assert.equal(nature.snowAmount('player'),0);nature.advance(3,actors);assert.equal(nature.snowAmount('player'),3,'snow weather keeps gathering after Burial ends one phase');nature.reset();assert.equal(nature.tree('player'),undefined,'preparations still clear when the whole battle ends');
console.log('PASS: ten complete guardian move sets; full HP bars, timed transformations, Dark-only third phase, dodgeable slam, charged beam DoT, armor expiry, healing interruption, frost slow, independent aura and isolated Dark upgrades.');
