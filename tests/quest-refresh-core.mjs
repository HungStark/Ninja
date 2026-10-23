import assert from 'node:assert/strict';
import {createAdventureScene} from '../src/adventure-scene.js';
import {newJourney,VILLAGES} from '../src/adventure-data.js';
import {villageSidequests,acceptSidequest,completeSidequestTarget,claimSidequest} from '../src/journey-story.js';
globalThis.innerWidth=915;globalThis.innerHeight=412;
const world=createAdventureScene(),timings=[],types=new Set();
for(const village of VILLAGES){
  const save=newJourney();save.village=village.id;const start=performance.now();world.load(village.id,save);const loadMs=performance.now()-start;
  const position=world.hero.root.position.toArray(),physics=world.physicsState(),residents=world.residentsState(),solids=[...world.solids],guards=world.guardsState();
  const meshes=[];world.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});let disposed=0;for(const geometry of new Set(meshes.map(m=>m.geometry)))geometry.addEventListener('dispose',()=>disposed++);
  let syncMs=0;
  for(const q of villageSidequests(village.id)){
    types.add(q.type);assert.equal(acceptSidequest(save,q),true);const at=performance.now();world.syncSidequests(save);syncMs+=performance.now()-at;
    const target=world.interactives.find(i=>i.kind==='sidequest-target'&&i.id===q.id);assert.ok(target);assert.ok(Number.isFinite(target.y));assert.equal(world.blocked(target.x,target.z),false,'target remains reachable');
    world.syncSidequests(save);assert.equal(world.interactives.filter(i=>i.id===q.id&&i.kind==='sidequest-target').length,1);
    assert.equal(completeSidequestTarget(save,q),true);world.syncSidequests(save);assert.ok(!world.interactives.some(i=>i.id===q.id&&i.kind==='sidequest-target'));
    assert.equal(claimSidequest(save,q),true);world.syncSidequests(save);assert.deepEqual(world.hero.root.position.toArray(),position);assert.deepEqual(world.physicsState(),physics);
  }
  assert.deepEqual(world.residentsState(),residents);assert.deepEqual(world.guardsState(),guards);assert.deepEqual(world.solids,solids);assert.equal(disposed,0,'quest updates never dispose terrain, buildings, residents or other scenery');for(const mesh of meshes)assert.ok(mesh.parent,'original scenery remains attached');
  timings.push({village:village.id,sceneLoadMs:Math.round(loadMs),meanQuestAddMs:Number((syncMs/villageSidequests(village.id).length).toFixed(2))});
}
const save=newJourney(),q=villageSidequests('nameless').find(q=>q.type==='retrieve');acceptSidequest(save,q);world.load('nameless',save);const pickup=world.scene.getObjectByName('quest-item-'+q.targetModel);assert.ok(pickup?.children.length,'loaded pickup stays separate from static scenery batches');completeSidequestTarget(save,q);world.syncSidequests(save);assert.equal(pickup.parent,null);assert.ok(!world.interactives.some(i=>i.id===q.id&&i.kind==='sidequest-target'));
assert.ok(['retrieve','survey','combat'].every(t=>types.has(t)));
console.log(JSON.stringify(timings));
console.log('PASS: all ten villages add/complete/claim every quest without rebuilding or disposing scenery, moving residents, altering physics/colliders/guards, duplicate targets, or leaving loaded pickup geometry behind.');
