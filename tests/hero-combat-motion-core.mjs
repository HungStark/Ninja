import assert from 'node:assert/strict';
import {createHero} from '../src/hero.js';
import '../game-core.js';
import {NatureArts} from '../src/nature-arts.js';
import {DASH_DISTANCE,DASH_DURATION} from '../src/dash-boost.js';
import * as T from 'three';
const hero=createHero(),step=dt=>hero.update(0,false,null,dt,false);
step(0);const idle=hero.locomotionState();hero.playCombatAction('throw');step(0);
assert.equal(hero.combatState().phase,'draw');const draw=hero.locomotionState();step(.065);const windup=hero.locomotionState();step(.05);const release=hero.locomotionState();
assert.notDeepEqual(draw.arms,idle.arms);assert.notDeepEqual(draw.arms,windup.arms);assert.notDeepEqual(windup.arms,release.arms);assert.ok(Math.abs(release.arms[1].elbow)<Math.abs(windup.arms[1].elbow),'Elbow extends through the throw');step(.2);assert.equal(hero.combatState(),null);
for(const style of ['volley','snowball','earthwall']){hero.playCombatAction('cast',style);step(.12);assert.equal(hero.combatState().kind,'cast');assert.notDeepEqual(hero.locomotionState().arms,idle.arms);step(.5);}
hero.playCombatAction('dash');step(.03);assert.ok(hero.locomotionState().lean[0]>.5);assert.ok(hero.locomotionState().legs.some(l=>l.knee>.6));assert.ok(hero.locomotionState().arms.every(a=>a.shoulder[0]>1));step(.3);assert.equal(hero.combatState(),null);
assert.equal(DASH_DISTANCE,5);assert.equal(DASH_DURATION,.2/1.5);
hero.playCombatAction('seal');hero.update(0,false,null,.11,false,{pose:0});const extendedHands=hero.combatState().hands;
hero.update(0,false,null,.22,false,{pose:0});const closedHands=hero.combatState().hands;
assert.ok(extendedHands[0][0]-extendedHands[1][0]>.7);assert.ok(closedHands[0][0]-closedHands[1][0]<.32);
hero.root.updateMatrixWorld(true);for(const a of hero.arms){const p=hero.root.worldToLocal(a.hand.getWorldPosition(new T.Vector3()));assert.ok(p.y>1.7&&p.y<2.1&&p.z>.3,'Native hands close at chest height');}
hero.resetCombat();
const snow=new NatureArts(new T.Scene()),spell=SealGameCore.spells.find(s=>s.id==='ice-orb');assert.equal(spell.speed,6.2);
const weather=SealGameCore.spells.find(s=>s.id==='ice-reflect');snow.cast('player',weather,[0,1.72,0],[1,0,0],[]);snow.advance(35,[]);snow.cast('player',spell,[0,1.72,0],[1,0,0],[]);
const ball=snow.balls[0];assert.equal(ball.gatherTime,1);snow.advance(.999,[]);assert.equal(ball.phase,'gathering');snow.advance(.001,[]);assert.equal(ball.phase,'rolling');const x=ball.p[0];snow.advance(.5,[]);assert.ok(Math.abs(ball.p[0]-x-3.1)<1e-6);
console.log('PASS: draw/windup/throw/recovery, distinct cast gestures, crouched dash with trailing arms, 5m dash, one-second snow gathering and doubled rolling speed.');
