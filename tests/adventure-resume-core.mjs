import assert from 'node:assert/strict';
import '../game-core.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {newJourney,resolveBattle} from '../src/adventure-data.js';
import {villageSidequests,acceptSidequest,completeSidequestTarget} from '../src/journey-story.js';
import {enterInterior} from '../src/adventure-interiors.js';

globalThis.innerWidth=1100;globalThis.innerHeight=700;
const save=newJourney(),world=createAdventureScene();save.village=save.checkpoint='fire';save.position=[0,7];
const at=performance.now();world.load('fire',save);const coldMs=performance.now()-at;
const original=[],physics=world.physicsState(),position=world.hero.root.position.toArray();world.scene.traverse(o=>original.push(o));
const story=world.scene.getObjectByName('village-story-actors'),storyChildren=[...story.children],solids=[...world.solids];
const elapsed=[];
for(let i=0;i<20;i++){
  world.spawnEnemy(0,8,'fire');const root=world.randomEnemy.root;let disposed=0;root.traverse(o=>o.geometry?.addEventListener('dispose',()=>disposed++));world.clearEnemy();assert.equal(root.parent,null);assert.ok(disposed>0);
  resolveBattle(save,{kind:'random',village:'fire',element:'fire'},true);
  const at=performance.now();assert.equal(world.resume('fire',save),true);elapsed.push(performance.now()-at);
  assert.deepEqual(world.hero.root.position.toArray(),position);assert.deepEqual(world.physicsState(),physics);assert.deepEqual(world.solids,solids);
  assert.deepEqual(story.children,storyChildren,'unchanged event actors are retained');
  const objects=[];world.scene.traverse(o=>objects.push(o));assert.deepEqual(objects,original,'repeated encounters do not add scene objects');
}
const q=villageSidequests('fire').find(q=>q.type==='combat');acceptSidequest(save,q);world.syncSidequests(save);const target=world.interactives.find(i=>i.id===q.id);assert.ok(target);
completeSidequestTarget(save,q);world.resume('fire',save);assert.ok(!world.interactives.includes(target));
const g=world.guardsState()[0],disguise=world.scene.getObjectByName('guard-disguise-'+g.disguise),guardSolid=world.solids.find(s=>s.name==='guard-disguise'&&s.x===g.home.x&&s.z===g.home.z);
resolveBattle(save,{kind:'village-guard',village:'fire',guardId:g.id,element:'fire'},true);assert.equal(world.resume('fire',save),true);
assert.ok(!world.guardsState().some(x=>x.id===g.id));assert.ok(!world.interactives.some(x=>x.id===g.id));assert.ok(!world.solids.includes(guardSolid));assert.equal(disguise.parent,null);
const survivor=world.guardsState()[0];world.hero.root.position.set(survivor.x,survivor.y,survivor.z);world.advanceGuards(.7);assert.ok(world.caughtGuard());
resolveBattle(save,{kind:'village-guard',village:'fire',guardId:survivor.id},false);assert.equal(world.resume('fire',save,{preserveHero:false}),true);assert.ok(Math.hypot(world.hero.root.position.x,world.hero.root.position.z-7)<.01);assert.equal(world.caughtGuard(),null,'respawn does not immediately restart a caught guard encounter');assert.ok(world.guardsState().every(g=>g.phase==='hidden'||g.phase==='guarding'));
save.checkpoint='water';resolveBattle(save,{kind:'random',village:'fire'},false);assert.equal(world.resume('water',save),false,'different checkpoint loads its map');
save.village='fire';save.bosses.fire=true;assert.equal(world.resume('fire',save),false,'guardian victory changes scenery');
save.village='wood';save.interior=null;enterInterior(save,'wood-arena',{position:[0,7],surface:null,elevation:0});world.load('wood',save);const room=world.interior,roomPosition=world.hero.root.position.toArray();
resolveBattle(save,{kind:'arena',village:'wood'},false);assert.equal(world.resume('wood',save),true);assert.equal(world.interior,room);assert.deepEqual(world.hero.root.position.toArray(),roomPosition);
console.log(JSON.stringify({coldMs:Math.round(coldMs),meanResumeMs:+(elapsed.reduce((a,b)=>a+b)/elapsed.length).toFixed(2),cycles:elapsed.length}));
console.log('PASS: retained scenery/physics/story actors, stable scene count, removed temporary enemies/quest actors/defeated guards, same-map respawn, cross-map and structural invalidation, arena interior.');
