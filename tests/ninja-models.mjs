import assert from 'node:assert/strict';
import * as T from 'three';
import {createNinja,ninjaProfile} from '../src/ninja.js';
import {encounterAppearance} from '../src/encounter-appearance.js';
import {VILLAGES,newJourney} from '../src/adventure-data.js';
import {createAdventureScene} from '../src/adventure-scene.js';
let maxTriangles=0;const styles=new Set();
for(const village of VILLAGES)for(const kind of ['random','quest']){
  const look=encounterAppearance({kind,village:village.id}),a=createNinja(look),b=createNinja(look),bounds=new T.Box3().setFromObject(a.root),height=bounds.max.y-bounds.min.y;
  assert.deepEqual(a.profile,b.profile);assert.equal(a.profile.job,'ninja');assert.equal(a.profile.coat,look.coat);assert.equal(a.root.userData.villager.job,'ninja');assert.deepEqual(a.root.userData.ninja,b.root.userData.ninja);assert.ok(height>2.7&&height<3.5);assert.ok(bounds.min.y>-.03&&bounds.min.y<.08);assert.ok(.69*a.root.scale.y/height<.27);
  for(const name of ['ninja-face-mask','ninja-headband','ninja-flak-vest','ninja-sheathed-blade'])assert.ok(a.root.getObjectByName(name));
  let triangles=0;a.root.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});maxTriangles=Math.max(maxTriangles,triangles);assert.ok(triangles<3500);styles.add(JSON.stringify([a.profile.hood,a.profile.variant,a.profile.height,a.profile.width]));
  a.update(1,false);a.update(2,true,{x:2,z:0},.1);a.root.updateMatrixWorld(true);assert.ok(a.legs.some(l=>Math.abs(l.pivot.rotation.z)>.01));a.root.traverse(o=>assert.ok(o.matrixWorld.elements.every(Number.isFinite)));a.dispose();b.dispose();
}
assert.ok(styles.size>=10);assert.equal(ninjaProfile(encounterAppearance(null)).job,'ninja');
globalThis.innerWidth=1440;globalThis.innerHeight=960;const world=createAdventureScene();
for(const id of ['nameless','water','fire','ice']){const save=newJourney();save.village=id;save.quests[id]=1;world.load(id,save);assert.equal(world.guard.root.name,'ninja-quest-'+id);const roaming=world.spawnEnemy(2,7);assert.equal(roaming.root.name,'ninja-random-'+id);const expected=createNinja(encounterAppearance({kind:'random',village:id}));assert.deepEqual(roaming.root.userData.ninja,expected.root.userData.ninja);expected.dispose();world.update(.016,false);world.clearEnemy();assert.equal(world.randomEnemy,null);}
console.log('PASS: 20 adult NPC-based ninja profiles, shared exploration/combat identities, masks/headbands/vests/swords, directional steps, safe disposal and world guards/roamers; max '+maxTriangles+' triangles.');
