import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {createGuardianPhases} from '../src/guardian-phases.js';
import {GUARDIAN_BOSS_DESIGNS} from '../src/guardian-legacy-designs.js';
const {Fighter}=SealGameCore;
const scene=new T.Scene(),g=createGuardianPhases(scene),boss=[0,2.4,-13],center=[0,1.72,7];
let f,hits,controls;
function reset(id){f=new Fighter(1000);f.autoRestore=false;hits=[];controls=[];g.reset({village:id,element:id,hp:1000,beastOnly:true},f);step(.01);}
function step(seconds,p=center,options={}){for(let t=0;t<seconds-1e-8;t+=1/60)g.update(Math.min(1/60,seconds-t),f,p,boss,(shot,pos)=>{hits.push({shot,pos});return {damage:shot.damage};},{control:(kind,seconds)=>controls.push({kind,seconds}),...options});}
function strike(e,damage=100){return g.intercept({owner:'player',element:'weapon',damage,old:[e.position[0],e.position[1],e.position[2]+2],p:[e.position[0],e.position[1],e.position[2]-2],size:.05});}

assert.equal(Object.keys(GUARDIAN_BOSS_DESIGNS).length,9);
const types=new Set();
for(const [id,design] of Object.entries(GUARDIAN_BOSS_DESIGNS)){
  reset(id);assert.equal(g.state().skills.length,3);assert.equal(g.trigger(-1,center,boss,f),false);assert.equal(g.trigger(3,center,boss,f),false);assert.equal(g.trigger(4,center,boss,f),false);
  for(let index=0;index<3;index++){
    reset(id);assert.equal(g.trigger(index,center,boss,f),design.skills[index].name);
    types.add(g.state().action.type);step(.2);const before=g.state();step(.5,center,{enabled:false});assert.deepEqual(g.state(),before,'pause freezes the entire encounter');
    step(design.skills[index].duration+.2);
    scene.updateMatrixWorld(true);scene.traverse(m=>{assert.ok(m.matrixWorld.elements.every(Number.isFinite),id+' finite visual transform');});
    assert.equal(g.state().armor,0,'no shared armor move');
    g.reset();assert.equal(scene.getObjectByName('guardian-distinct-combat'),undefined,'reset removes all combat entities and environment');
  }
  reset(id);step(31);assert.deepEqual([...new Set(g.state().history.map(h=>h.name))].sort(),design.skills.map(s=>s.name).sort(),'AI uses exactly its three named skills');
}
assert.equal(types.size,27,'all 27 attacks have different behaviors');

reset('fire');f.hp=f.maxHp*.49;step(.1);assert.equal(g.state().tailCount,5);f.hp=f.maxHp;step(.1);assert.equal(g.state().tailCount,5,'burned tails remain awakened after healing');
g.trigger(1,center,boss,f);step(.1);assert.equal(g.state().entities.filter(e=>e.kind==='decoy').length,2,'two decoys plus the real fox');
const decoy=g.state().entities.find(e=>e.kind==='decoy');assert.ok(strike(decoy));assert.equal(g.state().entities.filter(e=>e.kind==='decoy').length,1,'false image can be identified and destroyed');
reset('fire');g.trigger(2,center,boss,f);step(.1);assert.equal(g.state().hazards.length,9);hits=[];step(1.1);assert.equal(hits.length,0,'pillar warnings precede all damage');

reset('water');g.trigger(1,center,boss,f);step(1.4);assert.ok(g.state().prison);assert.equal(g.slowAt(center),0);assert.ok(g.breakPrison(50));assert.equal(g.state().prison,null);assert.ok(g.slowAt(center)>0);
reset('water');g.trigger(1,center,boss,f);step(1.4,[4,1.72,7]);assert.equal(g.state().prison,null,'bubble capture can be dodged');
reset('water');const low=g.slowAt(center);step(2);assert.notEqual(g.slowAt(center),low,'tide changes traversal over time');assert.equal(g.state().highGround,undefined,'no raised terrain');
reset('water');g.trigger(2,center,boss,f);step(.1);const wave=g.state().entities.find(e=>e.kind==='wave');assert.ok(wave.gapWidth>2);step(6,[wave.gap,1.72,7]);assert.equal(hits.length,0,'sideways movement into the warned lane avoids the tsunami');
reset('water');g.trigger(2,center,boss,f);step(6);assert.ok(hits.some(h=>h.shot.damage===42),'outside the safe lane the same tsunami hits');

reset('lightning');g.trigger(1,center,boss,f);step(4);assert.ok(controls.some(c=>c.kind==='lightning'),'three confirmed lightning hits paralyze');
reset('lightning');g.trigger(1,center,boss,f);step(4,center,{controlled:true});assert.equal(hits.length,0,'control cancels beast attacks');

reset('wind');g.trigger(1,center,boss,f);step(2,[5,1.72,7]);assert.ok(g.state().stagger>0);assert.ok(g.damageMultiplier()>1,'a missed dive opens a punish window');
reset('wind');g.trigger(0,center,boss,f);step(.5);assert.equal(g.damageMultiplier(),.55,'airborne passive reduces damage');

reset('earth');assert.ok(Math.abs(g.defense({guardianPart:'mountain-shell'},boss).multiplier-.3)<1e-9);assert.equal(g.defense({guardianPart:'tortoise-leg'},boss).multiplier,1);
g.onDamage(f.maxHp*.05,{guardianPart:'tortoise-leg'},boss);assert.ok(g.state().stagger>0);assert.equal(g.damageMultiplier(),1.8,'leg hits topple the turtle');
step(2);assert.equal(g.state().action,null,'toppled turtle cannot begin its next attack');
reset('earth');g.trigger(1,center,boss,f);step(.1);assert.equal(g.defense().reflect,.35);
reset('light');assert.equal(g.defense().reflect,.18);g.trigger(1,center,boss,f);step(2,[5,1.72,7]);assert.equal(g.defense().reflect,0);assert.ok(g.defense().multiplier>1);
reset('light');g.trigger(2,center,boss,f);step(4,[-2.5,1.72,7]);assert.ok(hits.some(h=>h.shot.ignoreShield&&h.shot.armorPiercing),'golden blades pierce defenses');
reset('light');g.trigger(2,center,boss,f);step(4);assert.equal(hits.length,0,'the gap between golden blades can be dodged into');

reset('dark');g.trigger(0,center,boss,f);step(.2);assert.equal(g.hidden(),true);assert.equal(g.lockable(),false);step(.1,[4.5,1.72,7]);assert.equal(g.hidden(),false);assert.equal(g.lockable(),true,'arena lamps expose the shadow wolf');
reset('dark');g.trigger(1,center,boss,f);step(1);assert.ok(g.state().entities.some(e=>e.kind==='wolf'));

reset('wood');f.hp=200;step(1);assert.ok(f.hp>200,'sacred grass regenerates life');
for(const e of g.state().entities.filter(e=>e.hp))assert.ok(strike(e));const hp=f.hp;step(1);assert.equal(f.hp,hp,'destroying life sources stops healing');
g.trigger(1,center,boss,f);step(.1);assert.equal(g.state().entities.filter(e=>e.kind==='spirit').length,3);step(1);assert.ok(f.hp>hp,'wood spirits restore their guardian');

reset('ice');g.trigger(1,center,boss,f);step(.1);const crystal=g.state().entities.find(e=>e.kind==='crystal');assert.ok(strike(crystal));assert.equal(g.state().shelters.length,1,'broken ice creates usable shelter');
reset('ice');g.trigger(2,center,boss,f);step(7,[5,1.72,7]);assert.equal(hits.length,0);assert.equal(controls.length,0,'fixed refuges make first-cycle blizzards avoidable');
reset('ice');g.trigger(0,center,boss,f);step(4);assert.ok(controls.some(c=>c.kind==='ice'),'three claw hits freeze');
reset('ice');g.trigger(2,center,boss,f);step(1);f.hp=0;assert.equal(g.beginTransition(f),false);g.reset();assert.equal(scene.getObjectByName('guardian-distinct-combat'),undefined);
g.dispose();assert.equal(scene.children.length,0);
console.log('PASS: 27 unique arts, exact three-skill AI, passives, dodge windows, breakable prison, tide and flat-arena safe lanes, lightning/frost stacks, turtle weak spots, metallic reflection, shadow lamps, destructible healing, crystal shelters, pause/control/reset cleanup.');
