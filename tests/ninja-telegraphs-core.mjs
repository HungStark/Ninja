import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {planNinjaTelegraph,createNinjaTelegraphs,NINJA_WARNING_TIME} from '../src/ninja-telegraphs.js';
import {createSpellAimGuide} from '../src/spell-aim-vfx.js';
import {createCombatWarningVfx} from '../src/combat-warning-vfx.js';
import {readCombatControls,arrowMovement} from '../src/combat-controls.js';
const scene=new T.Scene(),origin=[0,1.72,-20],point=[2,1.72,7],extra={bounds:{minX:-14,maxX:14,minZ:1,maxZ:10},bamboo:[[0,0,4]],flowers:[[2,0,6]],clones:[[-3,0,-12]],direction:[0,0,1]},scheduler=createNinjaTelegraphs(scene);let casts=0;
for(const spell of SealGameCore.spells){
 const shapes=planNinjaTelegraph(spell,origin,point,extra);assert.ok(shapes.length,spell.id);assert.ok(shapes.every(s=>Object.values(s).every(v=>typeof v!=='number'||Number.isFinite(v))),spell.id+' finite geometry');
 const target=[...point];scheduler.queue({spell,origin,target,extra,execute:p=>{assert.deepEqual(p,point);casts++;}});target[0]=900;scheduler.advance(NINJA_WARNING_TIME-.01);assert.equal(scheduler.state()[0].fired,false);assert.equal(scheduler.state()[0].borderColor,'red');scheduler.advance(.02);assert.equal(scheduler.state()[0].fired,true);scheduler.clear();assert.equal(scheduler.state().length,0);
}
assert.equal(casts,45);let alive=true;scheduler.queue({spell:SealGameCore.spells[0],origin,target:point,valid:()=>alive,execute:()=>assert.fail('dead caster released a new spell')});alive=false;scheduler.advance(1);assert.equal(scheduler.state().length,0);scheduler.dispose();
// Compare the actual vertex buffers: enemy paths/rings are the same shapes as player aim.
const normal=createSpellAimGuide(scene),danger=createSpellAimGuide(scene,{danger:true});
for(const kind of ['area','direction','sector']){const params={kind,position:[0,0,0],center:[0,0,20],direction:[0,0,1],width:2,radius:4,arc:2,heightAt:()=>0,available:true};normal.update(params);danger.update(params);const vertices=g=>{const result=[];g.root.traverse(m=>{if(m.isMesh)result.push([...m.geometry.getAttribute('position')?.array||[]]);});return result;};assert.deepEqual(vertices(normal),vertices(danger));assert.equal(danger.materials[2].color.getHexString(),'ff4254');assert.equal(normal.materials[2].color.getHexString(),'60ffe4');}
normal.dispose();danger.dispose();const pool=createCombatWarningVfx(scene);for(let i=0;i<500;i++){const root=pool.area([0,0,0],2);pool.release(root);}assert.equal(pool.state().allocated,1);pool.dispose();
const diagonal=arrowMovement(new Set(['arrowright','arrowup']));assert.ok(Math.abs(diagonal[0]-Math.SQRT1_2)<1e-12&&Math.abs(diagonal[1]+Math.SQRT1_2)<1e-12);assert.deepEqual(arrowMovement(new Set(['arrowright','arrowleft'])),[0,0]);assert.deepEqual(readCombatControls({getItem:()=>JSON.stringify({aimAssist:false,movement:'arrows'})}),{aimAssist:false,movement:'mouse'});
console.log('PASS: all 45 ninja skills have a red pre-cast warning, fixed warned targets and cancelled dead casters; enemy/player guide geometry matches, red/green palettes differ and warning meshes are reused.');
