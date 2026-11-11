import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {crossWalls} from '../src/combat.js';
import {DarkDomain} from '../src/dark-domain.js';
import {NatureArts} from '../src/nature-arts.js';
import {createGuardianPhases} from '../src/guardian-phases.js';
import {practiceSpellNeedsAim} from '../src/practice-overhead.js';
const {Fighter,spells,intersectFireWall}=SealGameCore,spell=id=>spells.find(s=>s.id===id);
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
const types=['fire','water','wind','earth','wood','ice'];
const wall=(owner,hp,z=-18,element='fire')=>({owner,hp,life:100,p:[0,0,z],normal:[0,0,1],width:30,height:4,element});
const actor=(id,owner,x,z)=>({id,owner,pos:[x,1.72,z],fighter:new Fighter(1000)});
const element={innerHTML:'',style:{setProperty(){}},classList:{toggle(){},remove(){}}};
globalThis.document={getElementById:()=>element,querySelector:()=>element,body:element};

// Exercise the common projectile path with every ordinary travelling spell.
for(const id of ['fire-volley','fire-lance','water-lance','water-volley','lightning-lance','lightning-volley','wind-orb','wind-volley','wood-volley','ice-lance']){
  for(const type of types){
    const source=spell(id),damage=source.damage,w=wall('enemy',damage+10,-18,type);
    const shot={owner:'player',old:[0,1.72,0],p:[0,1.72,-40],damage,size:source.size||.1};
    assert.equal(crossWalls(shot,[w],intersectFireWall),true,id+' blocked by '+type);close(w.hp,10);
    if(damage>0){w.hp=damage/2;shot.damage=damage;assert.equal(crossWalls(shot,[w],intersectFireWall),false);close(shot.damage,damage/2);close(w.hp,0);}
  }
}
// Large projectiles meet the wall with their leading surface, below their centre.
assert.ok(intersectFireWall([0,4.8,-8],[0,4.8,-14],wall('enemy',100),4.8));
assert.equal(intersectFireWall([0,10,-8],[0,10,-14],wall('enemy',100),1),null);

for(const owner of ['player','enemy'])for(const form of ['dog','bull'])for(const type of types){
  const scene=new T.Scene(),domain=new DarkDomain({scene,environment:[]});
  const caster=actor('caster',owner,0,0),target=actor('chosen',owner==='player'?'enemy':'player',0,-40),other=actor('other',target.owner,18,-30),actors=[caster,other,target];
  domain.cast(spell('dark-orb'),owner,caster.pos,[1,0,0],target.pos,{},target);
  domain.removeClone(domain.clones[1]);const clone=domain.clones[0];
  if(form==='bull')domain.upgradeClone(clone,spell('dark-orb'));
  const damage=clone.damage,w=wall(target.owner,damage/2,-18,type),hits=[];
  domain.cast(spell('dark-lance'),owner,caster.pos,[1,0,0],[30,0,0],{},target);
  const step=dt=>domain.updateClones(dt,0,actors,(c,p,attack)=>hits.push(attack),undefined,undefined,s=>crossWalls(s,[w],intersectFireWall));
  step(.31);assert.equal(clone.targetId,'chosen');target.pos[0]=3;
  for(let t=0;t<4&&domain.clones.length;t+=.01)step(.01);
  assert.equal(hits.length,1,form+' follows the chosen target for '+owner);assert.equal(hits[0].victimId,'chosen');close(hits[0].damage,damage/2);close(w.hp,0);close(clone.damage,damage);
  domain.reset();
}
// A surviving wall stops the charge; a later charge gets the original damage.
{
  const domain=new DarkDomain({scene:new T.Scene(),environment:[]}),caster=actor('caster','player',0,0),target=actor('chosen','enemy',0,-40),actors=[caster,target];
  domain.switchEnvironment(true);domain.cast(spell('dark-orb'),'player',caster.pos,[0,0,-1],target.pos,{},target);domain.removeClone(domain.clones[1]);
  const c=domain.clones[0],w=wall('enemy',50),hits=[];
  domain.cast(spell('dark-lance'),'player',caster.pos,[1,0,0],[30,0,0],{},target);
  const step=dt=>domain.updateClones(dt,0,actors,(_c,_p,s)=>hits.push(s),undefined,undefined,s=>crossWalls(s,[w],intersectFireWall));
  for(let i=0;i<65;i++)step(.01);assert.equal(c.mode,'respawning');close(w.hp,30);assert.equal(hits.length,0);
  step(1);step(.5);domain.cast(spell('dark-lance'),'player',caster.pos,[1,0,0],[30,0,0],{},target);close(c.chargeDamage,c.damage);
  target.fighter.hp=0;step(.01);assert.equal(hits.length,0,'dead targets are not replaced');
  actors.push(actor('survivor','enemy',10,-40));step(1);step(.5);assert.equal(c.mode,'idle','images can resurface when another enemy is still alive');domain.reset();
}

for(const owner of ['player','enemy'])for(const type of types)for(const hp of [100,250,300]){
  const arts=new NatureArts(new T.Scene(),()=>0,{},intersectFireWall),caster=actor('caster',owner,0,0),target=actor('chosen',owner==='player'?'enemy':'player',0,-40),other=actor('other',target.owner,25,-12),actors=[caster,other,target],walls=[wall(target.owner,hp,-18,type)],hits=[];
  arts.cast(owner,spell('ice-reflect'),caster.pos,[1,0,0],actors);arts.weather(owner).amount=90;
  assert.equal(arts.cast(owner,spell('ice-orb'),caster.pos,[1,0,0],actors,walls,[],undefined,'chosen'),true);
  const b=arts.balls[0];assert.equal(b.targetId,'chosen');assert.deepEqual(b.axis,[0,0,-1]);
  arts.advance(1,actors,undefined,walls);target.pos[0]=2;
  arts.advance(.02,actors,undefined,walls);assert.ok(b.axis[0]>0,'snowball tracks a lateral move');
  for(let t=0;t<9&&arts.balls.length;t+=.02)arts.advance(.02,actors,undefined,walls,s=>hits.push(s));
  assert.equal(arts.balls.length,0);close(walls[0].hp,Math.max(0,hp-250));
  if(hp<250){assert.equal(hits.length,1);assert.equal(hits[0].victimId,'chosen');close(hits[0].damage,250-hp);}else assert.equal(hits.length,0);
  close(spell('ice-orb').damage,250);arts.reset(walls);
}
{
  const arts=new NatureArts(new T.Scene()),caster=actor('caster','player',0,0),target=actor('chosen','enemy',0,-40),other=actor('other','enemy',20,-20),actors=[caster,other,target];
  arts.cast('player',spell('ice-reflect'),caster.pos,[0,0,-1],actors);arts.weather('player').amount=90;
  assert.equal(arts.cast('player',spell('ice-orb'),caster.pos,[0,0,-1],actors,[],[],undefined,'missing'),false);close(arts.snowAmount('player'),90);
  arts.cast('player',spell('ice-orb'),caster.pos,[1,0,0],actors,[],[],undefined,'chosen');target.fighter.hp=0;arts.advance(.1,actors);assert.equal(arts.balls.length,0);arts.reset();
}
for(const id of ['dark-lance','ice-orb'])assert.equal(practiceSpellNeedsAim(spell(id)),false,id+' is a targeted skill');

// Guardian travelling attacks also meet walls while travelling, before reaching the player.
for(const id of ['fire','wind','light','dark']){
  const g=createGuardianPhases(new T.Scene()),boss=new Fighter(1000),target=[id==='light'?-2.5:0,1.72,7],walls=[wall('player',10000,id==='dark'?3:-3)],hits=[];
  g.reset({village:id,element:id,hp:1000,beastOnly:true},boss);g.trigger(id==='light'?2:id==='dark'?1:0,target,[0,2.4,-13],boss);
  for(let t=0;t<8;t+=.01)g.update(.01,boss,target,[0,2.4,-13],s=>{hits.push(s);return {damage:s.damage};},{interceptProjectile:s=>crossWalls(s,walls,intersectFireWall)});
  assert.ok(walls[0].hp<10000,id+' attack reaches wall');assert.equal(hits.length,0,id+' stopped before player');g.dispose();
}
console.log('PASS: travelling spells and six wall types; residual damage, large projectile contact, homing dogs/bulls/snowballs, locked identities, dead targets, guardian projectiles and automatic targeting UI.');
