import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {DarkDomain} from '../src/dark-domain.js';
import {LightArts} from '../src/light-arts.js';
import {WindArts} from '../src/wind-arts.js';
import {createEnemyMovement,ENEMY_DASH_COOLDOWN} from '../src/enemy-movement.js';
import {ENEMY_MOVE_MULTIPLIER,ADVENTURE_MOVE_MULTIPLIER} from '../src/game-pace.js';
import {ARMORS,ARM_GUARDS,shopStock,readEquipment,newEquipment,damageMultiplierFor} from '../src/equipment.js';
import {resistanceText,bonusText} from '../src/equipment-ui.js';
const {Fighter,spells,intersectFireWall}=SealGameCore,spell=id=>spells.find(s=>s.id===id),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const element={innerHTML:'',style:{setProperty(){}},classList:{toggle(){},remove(){}}};globalThis.document={getElementById:()=>element,querySelector:()=>element,body:element};
for(const village of ['nameless','water','fire','lightning','earth','wind','wood','ice','light','dark']){
  for(const kind of ['armor','armguard']){
    const stock=shopStock(village).filter(i=>i.kind===kind);assert.equal(stock.length,village==='nameless'?1:2);
    for(const item of stock){const rates=kind==='armor'?item.resistances:item.bonuses;assert.deepEqual(rates,village==='nameless'?{fire:.02,water:.02,lightning:.02}:{[village]:item.elite?.1:.05});assert.match(kind==='armor'?resistanceText(item):bonusText(item),new RegExp((kind==='armor'?'−':'\\+')+(village==='nameless'?2:item.elite?10:5)+'%'));
      if(kind==='armor'){const f=new Fighter(1000);f.resistances=rates;close(f.receive(100,true,false,village==='nameless'?'fire':village).damage,100*(1-(village==='nameless'?.02:item.elite?.1:.05)));close(f.receive(100,true,false,'weapon').damage,100);}
      else{const stats={damageMultiplier:1,elementBonuses:rates};close(damageMultiplierFor(stats,village==='nameless'?'water':village),1+(village==='nameless'?.02:item.elite?.1:.05));close(damageMultiplierFor(stats,'weapon'),1);}
    }
  }
}
const old={...newEquipment(),armor:'water-elite-focus',armguard:'fire-bracers-elite-triad',ownedArmor:['water-elite-focus'],ownedArmguards:['fire-bracers-elite-triad']};assert.equal(readEquipment(old).armor,old.armor);assert.equal(readEquipment(old).armguard,old.armguard);assert.ok(ARMORS.find(i=>i.id===old.armor).legacy);assert.ok(ARM_GUARDS.find(i=>i.id===old.armguard).legacy);assert.ok(!shopStock('water').some(i=>i.id===old.armor));

assert.equal(ADVENTURE_MOVE_MULTIPLIER,1.5);assert.equal(ENEMY_MOVE_MULTIPLIER,1.3);assert.equal(ENEMY_DASH_COOLDOWN,10);
const move=createEnemyMovement(()=>.75);close(move.update(1,{position:[0,1.72,-24]})[0],1.3);move.reset();const free=move.update(1,{position:[0,1.72,-24],bounds:{minX:-100,maxX:100,minZ:-100,maxZ:100},moveSpeed:2});close(Math.hypot(free[0],free[2]+24),2.6);
const incoming={owner:'player',p:[0,1.72,-20],v:[0,0,-25],life:10,size:.2};move.reset();let p=move.update(1/60,{position:[0,1.72,-24],shots:[incoming]});assert.equal(move.state().dashBoost.uses,1);close(move.state().dashBoost.cooldown,10);assert.ok(move.state().dashBoost.dashing>0);
for(let i=0;i<60;i++)p=move.update(1/60,{position:p,shots:[incoming]});assert.equal(move.state().dashBoost.uses,1);close(move.state().dashBoost.cooldown,9);
move.update(8.9,{position:[0,1.72,-24],shots:[],blocked:true});move.update(.05,{position:[0,1.72,-24],shots:[incoming]});assert.equal(move.state().dashBoost.uses,1);move.update(.06,{position:[0,1.72,-24],shots:[incoming]});assert.equal(move.state().dashBoost.uses,2);
move.reset();assert.deepEqual(move.state().dashBoost,{ready:0,cooldown:0,dashing:0,uses:0});move.update(.1,{position:[0,1.72,-24],shots:[incoming],dashBlocked:true});assert.equal(move.state().dashBoost.uses,0);move.update(.1,{position:[0,1.72,-24],shots:[incoming],blocked:true});assert.equal(move.state().dashBoost.uses,0);

function reflection(kind,{reverse=false,forming=false,expired=false,weak=false,domainActive=false,bull=false}={}){
  const scene=new T.Scene(),dark=new DarkDomain({scene,environment:[]}),light=new LightArts(scene,intersectFireWall),wind=new WindArts(scene);
  const caster={id:'caster',owner:'player',pos:[0,1.72,7],dir:[0,0,-1],fighter:new Fighter(1000)},defender={id:'defender',owner:'enemy',pos:[0,1.72,-13],dir:[0,0,reverse?-1:1],fighter:new Fighter(1000)},actors=[caster,defender];let hits=[];
  dark.cast(spell('dark-orb'),caster.owner,caster.pos,caster.dir,defender.pos,caster.fighter,defender);
  if(bull)for(const c of dark.clones)dark.upgradeClone(c,spell('dark-orb'));
  const redirect=s=>light.redirect(s,actors)||wind.redirect(s,actors);
  const step=seconds=>{for(let t=0;t<seconds-1e-8;t+=1/120)dark.updateClones(Math.min(1/120,seconds-t),t,actors,(c,pos,attack)=>{const target=actors.find(a=>a.id===attack.victimId);hits.push(target.id);target.fighter.receive(attack.damage,true,false,'dark');},()=>{},()=>false,()=>false,redirect);};
  step(.6);dark.cast(spell('dark-lance'),caster.owner,caster.pos,caster.dir,defender.pos,caster.fighter,defender);
  let optic;
  if(kind==='light'){optic=light.place(defender.owner,spell('light-reflect'),defender.pos,defender.dir,actors);if(weak)optic.hp=1;if(expired)optic.life=0;}
  else{optic=wind.summon(defender.owner,spell('wind-reflect'),defender.pos,defender.dir);optic.age=forming?0:optic.formation;if(expired)optic.life=0;}
  if(domainActive){dark.active=true;dark.life=30;}
  step(2.5);const amount=bull?spell('dark-orb').upgradeDamage:spell('dark-orb').damage;
  if(reverse||forming||expired||weak){assert.equal(caster.fighter.hp,1000);assert.ok(defender.fighter.hp<1000);}
  else{close(caster.fighter.hp,1000-2*amount);assert.equal(defender.fighter.hp,1000);assert.deepEqual(hits,['caster','caster']);assert.equal(kind==='light'?light.reflections:wind.reflections,2);}
  if(domainActive)assert.ok(dark.clones.every(c=>c.owner==='player'),'domain respawns restore the original summoner');
  dark.reset();light.reset();wind.reset();
}
for(const kind of ['light','wind']){reflection(kind);reflection(kind,{reverse:true});reflection(kind,{expired:true});reflection(kind,{bull:true});reflection(kind,{domainActive:true});}
reflection('light',{weak:true});reflection('wind',{forming:true});
console.log('PASS: exact regional shop tiers/percentages, old ownership, defense/offense math, 1.5x adventure/1.3x enemy speeds, 10s enemy dash/control/reset, real mirror/spirit dog+bull return damage, side/expiry/formation/durability and domain respawn.');
