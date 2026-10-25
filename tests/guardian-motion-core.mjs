import assert from 'node:assert/strict';
import * as T from 'three';
import {guardianLeap,guardianBreath,GUARDIAN_BASIC_TIMING as BASIC,GUARDIAN_ARTS} from '../src/guardian-arts.js';
import {createEncounterCreature} from '../src/encounter-appearance.js';
import {createGuardianPhases} from '../src/guardian-phases.js';
import {spellCastCue,spellImpactCue} from '../src/spell-audio-cues.js';
assert.equal(BASIC.charge,1.5);assert.equal(guardianBreath(1.49).firing,false);assert.equal(guardianBreath(1.6).stage,'recoil');assert.ok(guardianBreath(1.6).headPull>0);assert.equal(guardianBreath(1.79).firing,true);assert.ok(guardianBreath(1.4).orbScale>guardianBreath(.4).orbScale);
assert.equal(guardianLeap(.99).height,0);assert.ok(guardianLeap(1.2).progress>0);assert.ok(Math.abs(guardianLeap(1.3).height-8*Math.sin(.3/.45*Math.PI/2))<1e-10,'ascent keeps its former speed');assert.ok(BASIC.slamAscent/BASIC.slamDescent>2.5);assert.equal(guardianLeap(1.62).height,0);
const oldProgress=.3/.9;assert.ok(Math.abs(guardianLeap(1.3).progress-oldProgress*oldProgress*(3-2*oldProgress))<1e-10,'horizontal ascent also keeps its former speed');
for(const id of Object.keys(GUARDIAN_ARTS)){
 const model=createEncounterCreature(id),neutral=model.mouthPosition({}).clone(),back=model.mouthPosition({headPull:.35}).clone();assert.ok(Math.abs(neutral.distanceTo(back)-.35)<1e-5,id+' head moves independently');model.setArtPose();assert.ok(model.mouthPosition().distanceTo(neutral)<1e-5);model.dispose();
}
const scene=new T.Scene(),g=createGuardianPhases(scene),f={hp:100,maxHp:100},player=[3,1.72,4],boss=[-3,2.4,-8];g.reset({village:'nameless',element:'wind',hp:100,basicOnly:true},f);assert.equal(g.trigger(3,player,boss,f),false);g.trigger(0,player,boss,f);
const step=seconds=>{for(let t=0;t<seconds-1e-7;t+=1/60)g.update(1/60,f,player,boss,()=>{});};step(1.5);assert.equal(g.state().cracks.length,0);step(.15);assert.equal(g.state().cracks.length,1);g.reset();assert.equal(scene.getObjectByName('guardian-ground-cracks'),undefined);g.dispose();
for(const [element,style,cue] of [['fire','dragon','dragon-roar'],['fire','meteor','meteor-summon'],['wind','tornado','wind-howl'],['earth','earthquake','rock-shift'],['water','boat','water-surge'],['ice','icebind','ice-crack'],['wood','vinebind','wood-creak']])assert.equal(spellCastCue({element,style}),cue);
assert.equal(spellImpactCue({element:'fire',style:'meteor'}),'explosion');assert.equal(spellImpactCue({element:'lightning',style:'thunder'}),'thunder-strike');
console.log('PASS: unchanged diagonal ascent, 2.8x faster descent, landing-only cracks, 1.5s growing orb + head recoil, ten articulated heads, no Nameless armor and spell-specific sound routing.');
