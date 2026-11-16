import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {spellAimShape} from '../src/spell-aim-shape.js';
import {createSpellAimGuide} from '../src/spell-aim-vfx.js';
import {createCombatWarningVfx} from '../src/combat-warning-vfx.js';
import {createNinjaTelegraphs,planNinjaTelegraph,NINJA_WARNING_TIME,NINJA_EXISTING_WARNING_STYLES} from '../src/ninja-telegraphs.js';
const scene=new T.Scene(),player=createSpellAimGuide(scene),warnings=createCombatWarningVfx(scene),origin=[-3,1.72,-18],target=[4,1.72,7],spell=id=>SealGameCore.spells.find(s=>s.id===id);
function footprint(root){root.updateMatrixWorld(true);const result=[],p=new T.Vector3();root.traverseVisible(m=>{if(!m.isMesh)return;const a=m.geometry.getAttribute('position');for(let i=0;i<a.count;i++){p.fromBufferAttribute(a,i).applyMatrix4(m.matrixWorld);result.push(Number(p.x.toFixed(5)),Number(p.z.toFixed(5)));}});return result;}
let compared=0;
for(const art of SealGameCore.spells){
 if(NINJA_EXISTING_WARNING_STYLES.has(art.style)){
  const crater=[8,0,3],expected=[{kind:'circle',position:art.style==='earthcraterspikes'?crater:[target[0],0,target[2]],radius:Math.max(.8,art.blastRadius||art.radius||1.7)}];
  assert.deepEqual(planNinjaTelegraph(art,origin,target,{crater}),expected,art.id+' keeps existing marker dimensions');continue;
 }
 const shape=spellAimShape(art,origin,target);player.update({...shape,heightAt:()=>0,available:true});const plan=planNinjaTelegraph(art,origin,target);assert.equal(plan.length,1);
 const danger=warnings.show(plan[0]);assert.deepEqual(footprint(danger),footprint(player.root),art.id+' exact player geometry, width, length, radius and placement');warnings.release(danger);compared++;
}
const fire=planNinjaTelegraph(spell('fire-volley'),origin,target)[0];assert.equal(fire.width,.22);assert.ok(Math.abs(Math.hypot(fire.to[0]-origin[0],fire.to[2]-origin[2])-31)<1e-10);
assert.equal(planNinjaTelegraph(spell('water-tsunami'),origin,target)[0].width,spell('water-tsunami').waveWidth);
assert.equal(planNinjaTelegraph(spell('fire-reflect'),origin,target)[0].kind,'wall');assert.equal(planNinjaTelegraph(spell('fire-reflect'),origin,target)[0].width,spell('fire-reflect').wallWidth);
const scheduler=createNinjaTelegraphs(scene);let flying=false,calls=0;
scheduler.queue({spell:spell('fire-volley'),origin,target,execute:()=>{calls++;return {released:()=>flying};}});scheduler.advance(NINJA_WARNING_TIME-.001);assert.equal(calls,0);assert.equal(scheduler.state()[0].visible,true);
scheduler.advance(.001);assert.equal(calls,1);assert.equal(scheduler.state()[0].visible,true,'warning stays through projectile formation');scheduler.advance(.4);assert.equal(scheduler.state()[0].visible,true);flying=true;scheduler.sync();assert.equal(scheduler.state()[0].visible,false,'warning disappears on the exact launch frame');assert.equal(scheduler.pending('primary'),false);scheduler.clear();
scheduler.queue({spell:spell('water-lance'),origin,target,execute:()=>{calls++;}});scheduler.advance(NINJA_WARNING_TIME);assert.equal(scheduler.state()[0].visible,false,'immediate projectile clears warning at launch');scheduler.clear();
for(const id of ['fire-meteor','lightning-thunder','light-volley','earth-reflect','earth-volley','earth-lance']){
 const art=spell(id);scheduler.queue({spell:art,origin,target,execute:()=>({released:()=>true})});scheduler.advance(NINJA_WARNING_TIME);assert.equal(scheduler.state()[0].visible,true,id+' retains previous ground-warning lifecycle');scheduler.advance(Math.max(1.4,Math.min(7,(art.duration||0)+(art.holdTime||0)+2))+.01);assert.equal(scheduler.state().length,0);
}
let valid=true;scheduler.queue({spell:spell('water-lance'),origin,target,valid:()=>valid,execute:()=>assert.fail('cancelled ninja fired')});valid=false;scheduler.advance(.1);assert.equal(scheduler.state().length,0);
scheduler.dispose();player.dispose();warnings.dispose();
console.log('PASS: '+compared+' ninja guides match player world-space geometry and dimensions; warning survives formation and clears at flight; six native ground-warning types retain size and lifetime.');
