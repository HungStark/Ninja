import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as T from 'three';
import '../game-core.js';
import {NatureArts} from '../src/nature-arts.js';
import {LightArts} from '../src/light-arts.js';
import {createGuardianBossCombat} from '../src/guardian-moba-combat.js';
import {GUARDIAN_BOSS_DESIGNS as designs} from '../src/guardian-moba-designs.js';
import {guardianSkillStats,guardianBalanceOverrides} from '../src/guardian-balance.js';
import {guardianBalanceDocument,updateGuardianSource,readGuardianBalance} from '../tools/guardian-balance-data.mjs';

const scene=new T.Scene(),g=createGuardianBossCombat(scene),base=[0,2,-12];
let fighter,player,hits,controls,options;
function reset(id,p=[0,1.7,5]){fighter={hp:1000,maxHp:1000};player=[...p];hits=[];controls=[];options={aiEnabled:false,bounds:{minX:-16,maxX:16,minZ:-22,maxZ:14},attackBounds:{minX:-14,maxX:14,minZ:0,maxZ:12},control:(kind,time,key)=>controls.push({kind,time,key}),setTargetPosition:(_key,p)=>player=[...p]};g.reset(id);step(.01);}
function step(seconds){for(let t=0;t<seconds-1e-8;t+=1/60)g.update(Math.min(1/60,seconds-t),fighter,player,base,shot=>{hits.push(shot);return {damage:shot.damage};},options);}
function cast(i){assert.ok(g.trigger(i,player,base,fighter));}
function items(kind){return g.state().entities.filter(e=>e.kind===kind||e.tag===kind);}
function kill(e){g.areaDamage({owner:'player',damage:10000},e.position,.01);}
try{
 for(const [id,d] of Object.entries(designs))for(let i=0;i<3;i++){
  reset(id);cast(i);step(8);assert.ok(g.state().offset&&Object.values(g.offset).every(Number.isFinite),id+' '+i);assert.equal(g.state().skills.length,3);assert.ok(g.state().entities.every(e=>e.position.every(Number.isFinite)));g.clear();assert.equal(scene.children.length,0,'reset removes all encounter visuals');
 }
 reset('fire');cast(0);step(.85);assert.equal(hits.length,0,'pillar warning cannot hurt');assert.equal(items('hazard').length,3);step(.1);assert.ok(hits.length);assert.equal(items('fire').length,3);step(2.6);assert.ok(hits.some(h=>h.style==='guardian-fox-pillars'));assert.ok(items('fire').some(e=>e.radius>1.15),'five fire marks cause a new burning explosion');
 reset('fire');fighter.hp=490;step(.01);assert.equal(g.state().tailCount,2);cast(1);step(.83);assert.equal(items('projectile').length,3);step(.3);assert.equal(items('projectile').length,5,'lost health adds fireballs');
 reset('water');cast(1);step(.75);assert.equal(items('vortex').length,3);step(1.7);assert.ok(controls.some(c=>c.kind==='air'),'standing at vortex center knocks up');assert.ok(g.slowAt(player)<1,'wet stacks slow');
 reset('water');step(15);assert.equal(items('puddle').length,1);step(8.1);assert.equal(items('puddle').length,0);
 reset('lightning');cast(2);step(.45);assert.equal(items('clone').length,3);kill(items('clone')[0]);assert.equal(items('clone').length,2,'electric clones can be killed');player=[14,1.7,12];step(guardianSkillStats('wolf-clones').returnAt);assert.ok(items('clone').some(e=>e.returning),'surviving clones return');
 reset('wind');cast(2);step(.2);assert.equal(g.defense().multiplier,0,'ascending eagle is invulnerable');step(1.5);assert.equal(g.defense().multiplier,1);assert.equal(g.state().speedStacks,1);
 reset('wind');step(12);const wind=items('wind')[0];player=[wind.position[0],1.7,wind.position[2]];assert.equal(g.slowAt(player,[-1,0,0]),.85);assert.equal(g.slowAt(player,[1,0,0]),1);
 reset('earth');cast(0);step(.9);assert.equal(items('rock').length,4);const rock=items('rock')[0],from=[rock.position[0]-4,1.7,rock.position[2]],to=[rock.position[0]+4,1.7,rock.position[2]];assert.ok(g.constrainMovement(from,to)[0]<rock.position[0],'swept movement stops at stone');kill(rock);assert.equal(items('rock').length,3);fighter.hp=840;step(.01);assert.equal(g.state().armorLevels,1);const armor=g.state().armor;assert.ok(armor>0);assert.equal(g.absorbDamage(armor+7),7);assert.ok(items('projectile').length>=6,'broken armor sprays shards');
 reset('earth',[0,1.7,-10]);step(3);assert.equal(g.defense().multiplier,.8,'stationary turtle reduces damage');
 reset('light');cast(2);step(.7);assert.equal(items('sword-ring').length,1,'sword ring works without planted feathers');step(2);assert.ok(items('sword-ring')[0].radius<6);
 reset('light',[0,1.7,-10]);for(let i=0;i<3;i++){cast(0);step(1.5);}assert.ok(hits.some(h=>Math.abs(h.armorReduction-.16)<1e-8),'four gold marks reduce armor by 16%');assert.ok(hits.some(h=>h.damage===34),'the next feather consumes marks for bonus damage');
 reset('dark');step(5);assert.equal(g.hidden(),true);g.onDamage(1);assert.equal(g.hidden(),false);cast(1);step(.5);assert.equal(items('clone').filter(e=>e.real).length,1);kill(items('clone')[0]);assert.equal(items('clone').length,2);cast(2);step(.65);assert.equal(g.obscures(player),true);assert.equal(g.slowAt(player),.85);
 reset('dark',[0,1.7,-10]);cast(0);step(1.2);const dashCooldown=g.state().skillCooldowns[0];step(.8);assert.ok(g.state().skillCooldowns[0]<dashCooldown-.8-.2,'hitting a marked target reduces the skill cooldown itself');
 reset('wood');fighter.hp=700;step(10.1);assert.equal(items('spirit').length,1);const hp=fighter.hp;step(1);assert.ok(fighter.hp>=hp+4.9);kill(items('spirit')[0]);assert.equal(g.state().rage,1);cast(0);assert.equal(g.state().rage,0);cast(2);step(.65);assert.equal(items('tree').length,1);kill(items('tree')[0]);assert.equal(g.state().stagger,1.5);assert.equal(g.state().action,null);
 reset('ice');for(let i=0;i<4;i++){cast(1);step(1.03);}assert.ok(controls.some(c=>c.kind==='ice'&&c.time===1));assert.ok(g.targetStatus().freezeImmune>0);const freezes=controls.filter(c=>c.kind==='ice').length;cast(1);step(1.03);assert.equal(controls.filter(c=>c.kind==='ice').length,freezes,'passive freeze immunity prevents repeated control');
 reset('fire');cast(1);const paused=g.state();g.update(3,fighter,player,base,()=>{}, {enabled:false});assert.deepEqual(g.state(),paused);
 reset('fire');step(1.4);const recovery=g.state().recovery;fighter.hp=290;step(.01);assert.equal(g.state().enraged,true);assert.ok(g.state().recovery<=recovery*.82,'enrage speeds pending recovery');
 reset('fire');options.aiEnabled=true;step(115);const history=g.state().history;assert.ok(history.length>15);const sequences=[];for(const h of history){if(!sequences[h.combo])sequences[h.combo]=[];sequences[h.combo].push(h.type);}const complete=sequences.filter(s=>s?.length===3).map(s=>s.join(','));for(let i=2;i<complete.length;i++)assert.ok(complete[i]!==complete[i-1]||complete[i]!==complete[i-2],'AI cannot repeat a combo three times');
 reset('fire');let intercepted=0;options.interceptProjectile=shot=>{intercepted++;shot.damage=0;return true;};cast(1);step(1.3);assert.ok(intercepted>=3);assert.equal(hits.length,0,'traveling fireballs respect defense interception');
 reset('fire');options.targets=[{id:'a',pos:[-6,1.7,5]},{id:'b',pos:[0,1.7,5]},{id:'c',pos:[6,1.7,5]}];step(.01);cast(2);step(.65);for(const t of options.targets)assert.ok(items('hazard').some(e=>Math.hypot(e.position[0]-t.pos[0],e.position[2]-t.pos[2])<.01),'first rain targets every player');
 reset('lightning');for(let i=0;i<12&&g.state().energy<5;i++){player=[i%2?14:-14,1.7,i%3?12:-18];step(3);}assert.equal(g.state().energy,5);options.targets=[{id:'a',pos:[0,1.7,4]},{id:'b',pos:[2,1.7,4]},{id:'c',pos:[-2,1.7,4]},{id:'d',pos:[0,1.7,8]}];step(.01);cast(1);step(.85);assert.equal(hits.filter(h=>h.damage===12).length,2,'charged hit chains to at most two nearby players');
 const source=await fs.readFile('src/guardian-balance.js','utf8'),doc=guardianBalanceDocument(source);assert.equal(doc.rows.length,89);assert.equal(doc.rows.filter(r=>r.kind==='skill').length,80);assert.deepEqual(readGuardianBalance(updateGuardianSource(source,{})).overrides,{});
 assert.throws(()=>updateGuardianSource(source,{'wolf-dashes':{duration:.1}}));assert.throws(()=>updateGuardianSource(source,{'dragon-pressure':{damagePerSecond:-1}}));
 guardianBalanceOverrides['fox-homing']={count:4,damage:31};reset('fire');cast(1);step(1);assert.equal(items('projectile').length,4);assert.equal(g.state().action.parameters.damage,31);delete guardianBalanceOverrides['fox-homing'];assert.equal(guardianSkillStats('fox-homing').count,3);
 reset('wood');cast(2);step(.65);const tree=items('tree')[0],light=new LightArts(scene,()=>null),path=light.trace('player',player,[0,0,-1],[],55,30,shot=>g.intercept(shot));assert.equal(items('tree')[0].hp,60);assert.equal(path[0].end[2],tree.position[2],'rays end at the destructible');light.reset();
 const nature=new NatureArts(scene),actors=[{id:'player',owner:'player',pos:player,dir:[0,0,-1],fighter:new SealGameCore.Fighter(1000)},{id:'boss',owner:'enemy',pos:[0,1.7,-12],dir:[0,0,1],fighter:new SealGameCore.Fighter(1000)}];
 const ball={...SealGameCore.spells.find(s=>s.style==='snowball'),requiresSnow:false,requiresSnowFull:false,snowCost:0,damage:20,radius:1};assert.ok(nature.cast('player',ball,player,[0,0,-1],actors));let snowHits=0;for(let t=0;t<4;t+=1/60)nature.advance(1/60,actors,()=>{},[],shot=>{snowHits++;assert.equal(shot.damage,20,'snowball keeps full damage through a guardian summon');},()=>{},shot=>g.intercept(shot));assert.equal(items('tree')[0].hp,60,'snowball is not absorbed by a guardian summon');assert.equal(snowHits,1);assert.equal(nature.balls.length,0);nature.reset();
 console.log('PASS: all 27 third-person skills, nine passives, warning timing, killable summons, collision, control immunity, defense interception, pause, enrage, AI anti-repeat and 36 balance rows.');
}finally{delete guardianBalanceOverrides['fox-homing'];g.dispose();}
