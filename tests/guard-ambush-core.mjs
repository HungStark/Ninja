import assert from 'node:assert/strict';
import * as T from 'three';
import '../game-core.js';
import {createGuardAmbush,GUARD_ALERT_RADIUS,GUARD_RUN_SPEED} from '../src/guard-ambush.js';
import {createTransformationSmoke} from '../src/transformation-smoke.js';
import {createCharacterPhysics} from '../src/adventure-physics.js';
import {createNinja} from '../src/ninja.js';
import {newJourney,resolveBattle,findPath,readJourney} from '../src/adventure-data.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {REGIONS} from '../src/adventure-world.js';
import {promiseMother,chooseStarter,INTRO_SQUAD,villageSidequests,acceptSidequest,completeSidequestTarget,claimSidequest,sidequestReward} from '../src/journey-story.js';
import {combatExperienceElement,combatExperienceRewards,requiresGuardBattle} from '../src/combat-experience.js';
import {spellElement} from '../src/progression.js';

for(const disguise of ['stump','bush','rock']){
 const scene=new T.Scene(),land=new T.Group();scene.add(land);const physics=createCharacterPhysics({position:new T.Vector3(0,0,12),baseFloor:()=>0,staticBlocked:()=>false}),char=createNinja({village:'fire'}),smoke=createTransformationSmoke(scene),entry={id:'fire-sentry-1',village:'fire',element:'fire',x:0,y:0,z:0,disguise};land.add(char.root);
 const nav=(x,z)=>Math.abs(x)<.6&&z>3&&z<7;nav.limit=25;
 const guard=createGuardAmbush({entry,char,land,physics,heightAt:()=>0,blocked:nav,findPath,smoke}),hero={x:0,y:0,z:10.01};
 guard.update(.1,{hero});assert.equal(guard.state().phase,'hidden');assert.equal(char.root.visible,false);assert.ok(physics.overlaps(0,0,0,2.85,.36));
 hero.z=9.9;assert.ok(guard.update(.05,{hero}));smoke.update(.05);assert.equal(guard.state().phase,'revealing');assert.equal(smoke.state().color,'#ffffff');assert.equal(smoke.state().active.length,1);assert.equal(char.root.visible,false);
 guard.update(.16,{hero});assert.equal(char.root.visible,true);assert.equal(guard.disguise.visible,false);assert.equal(physics.overlaps(0,0,0,2.85,.36),false);
 const origin={...guard.state().home};for(let i=0;i<150&&!guard.caught();i++){guard.update(.02,{hero});smoke.update(.02);const p=char.root.position;assert.equal(nav(p.x,p.z),false,'pursuit cannot cross the obstacle');}
 assert.ok(guard.caught());assert.ok(Math.hypot(char.root.position.x-origin.x,char.root.position.z-origin.z)>5);assert.equal(smoke.state().active.length,0);assert.equal(smoke.state().bursts,1);assert.equal(guard.state().alertRadius,10);assert.equal(guard.state().runSpeed,5.8);guard.dismiss();assert.equal(guard.caught(),false);assert.equal(guard.state().phase,'withdrawn');
}

const save=newJourney();promiseMother(save);chooseStarter(save,'water-barrier');save.story.stage='infiltrate';save.village='fire';
const enemy={kind:'village-guard',village:'fire',element:'fire',guardId:'fire-sentry-1'};
assert.equal(requiresGuardBattle(save,enemy),true);assert.equal(combatExperienceElement(enemy),'fire');resolveBattle(save,enemy,true);assert.equal(save.progression.xp.fire,75);assert.equal(save.progression.xp.water,0);save.story.peaceSeals.push('fire');assert.equal(requiresGuardBattle(save,enemy),false);assert.equal(requiresGuardBattle(save,{kind:'random',village:'fire'}),false);
for(const element of ['water','fire','lightning','earth','wind','light','ice','wood','dark'])assert.equal(combatExperienceElement({element,village:'nameless'}),element);
const trio={kind:'intro-trio',village:'nameless',squad:INTRO_SQUAD};assert.equal(combatExperienceElement(trio,'primary'),'fire');assert.equal(combatExperienceElement(trio,'squad-1'),'water');assert.equal(combatExperienceElement(trio,'squad-2'),'lightning');assert.deepEqual(combatExperienceRewards(trio,120),[{element:'fire',xp:40},{element:'water',xp:40},{element:'lightning',xp:40}]);
const pupil=newJourney();promiseMother(pupil);chooseStarter(pupil,'water-barrier');resolveBattle(pupil,trio,true);assert.ok(['fire','water','lightning'].every(e=>pupil.progression.xp[e]===40));
for(const id of Object.keys(REGIONS))for(const q of villageSidequests(id)){
 const s=newJourney();const before={xp:JSON.stringify(s.progression),gold:s.gold};acceptSidequest(s,q);completeSidequestTarget(s,q);const reward=sidequestReward(s,q);claimSidequest(s,q);
 if(id==='nameless'){assert.equal(q.rewardScroll,null);assert.equal(q.rewardXp,0);assert.equal(reward.scroll,null);assert.ok(s.gold>before.gold);assert.equal(JSON.stringify(s.progression),before.xp);}
 else if(reward.scroll)assert.equal(spellElement(reward.scroll),id);
}

globalThis.innerWidth=1200;globalThis.innerHeight=800;const world=createAdventureScene();
for(const id of Object.keys(REGIONS)){
 const s=newJourney();s.village=id;s.position=[0,7];world.load(id,s);const guards=world.guardsState();assert.equal(guards.length,id==='nameless'?0:10);
 for(const g of guards){const standing=g.guardRole==='guardian';assert.equal(g.phase,standing?'guarding':'hidden');assert.equal(g.ninjaVisible,standing);assert.equal(g.disguiseVisible,!standing);assert.equal(g.revealed,standing);assert.equal(g.alertRadius,10);if(!standing)assert.ok(world.solids.some(s=>s.name==='guard-disguise'&&s.x===g.x&&s.z===g.z));}
 if(guards.length)assert.deepEqual(new Set(guards.filter(g=>g.guardRole==='hidden').map(g=>g.disguise)),new Set(['stump','bush','rock']));
}
console.log('PASS: all three solid disguises, 10m detection, white smoke before human reveal, collider removal, obstacle-aware 5.8m/s pursuit, contact and peace-seal retreat policy; per-opponent/squad XP; Nameless gold-only quests and regional skill books; hidden guards in all nine villages.');
