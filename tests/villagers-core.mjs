import assert from 'node:assert/strict';
import * as T from 'three';
import {villagerAppearance} from '../src/villager-appearance.js';
import {createVillager} from '../src/villager.js';
import {REGIONS} from '../src/adventure-world.js';
import {village,newJourney} from '../src/adventure-data.js';
import {dialogueCast,speakerPortrait} from '../src/adventure-dialogue.js';
import {createAdventureScene} from '../src/adventure-scene.js';

const jobs=new Set(),silhouettes=new Set();let count=0,maxTriangles=0;
for(const [id,region] of Object.entries(REGIONS))for(const person of [{kind:'chief'},...region.npcs,{kind:'envoy'},{kind:'leader'}]){
  const profile=villagerAppearance(id,person),char=createVillager(profile);jobs.add(profile.job);silhouettes.add(JSON.stringify([profile.height,profile.width,profile.hat,profile.hairStyle]));
  const bounds=new T.Box3().setFromObject(char.root),size=bounds.getSize(new T.Vector3());assert.ok(size.y>2.4&&size.y<4.3);assert.ok(bounds.min.y>-.03&&bounds.min.y<.08,'feet stay on the ground');
  const face=char.root.getObjectByName('face');assert.ok(face);assert.ok(.69*(profile.height/3)/size.y<.27,'adult head-to-body proportions');
  let triangles=0;char.root.traverse(o=>{if(o.isMesh&&!o.userData.inkOutline)triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});maxTriangles=Math.max(maxTriangles,triangles);assert.ok(triangles<4500,'lightweight procedural fallback surfaces');
  char.update(1,false);char.update(2,true,null,.016);char.root.updateMatrixWorld(true);char.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));
  const kind=person.kind==='chief'?'npc':person.kind,cast=dialogueCast({kind,id:person.id},newJourney(),region,village(id));
  if(cast?.npc.appearance){assert.deepEqual(cast.npc.appearance,profile);const portrait=speakerPortrait(cast.npc);assert.ok(portrait.includes('data-portrait-kind="villager"'));assert.ok(portrait.includes('data-model-ready="false"'));assert.ok(!portrait.includes('<svg'),'dialogue mounts a model portrait rather than the old drawing');}
  count++;
}
assert.ok(jobs.size>=12&&silhouettes.size>=30);
globalThis.innerWidth=1440;globalThis.innerHeight=960;const world=createAdventureScene();
for(const id of ['nameless','water','fire','lightning','earth','wind','light','ice','wood','dark']){
  const save=newJourney();save.village=id;world.load(id,save);world.update(.016,false);const npcs=[];world.scene.traverse(o=>{if(o.userData.villager)npcs.push(o);});
  for(const person of REGIONS[id].npcs.filter(p=>p.platform!=='earth-cave')){const model=npcs.find(o=>o.userData.villager.id===person.id);assert.ok(model,`${id}: outdoor named NPC installed`);assert.equal(model.userData.villager.job,villagerAppearance(id,person).job);}
  assert.ok(npcs.some(o=>o.userData.villager.id==='chief'));
}
console.log(`PASS: ${count} human NPC profiles, ${jobs.size} professions, ${silhouettes.size} silhouettes, max ${maxTriangles} triangles, grounded/animated models, matching portraits and NPCs in all ten villages.`);
