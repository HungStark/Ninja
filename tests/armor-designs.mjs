import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {createHero} from '../src/hero.js';
import {ARMORS,BAGS} from '../src/equipment.js';
const hero=createHero(),shapes=new Map();let bodyDisposals=0;
hero.root.getObjectByName('hero-face').children.find(o=>o.isMesh).geometry.addEventListener('dispose',()=>bodyDisposals++);
function signature(){const points=[];for(const root of Object.values(hero.armorAnchors).flat())root.traverse(o=>{if(o.isMesh){const a=o.geometry.attributes.position;for(let i=0;i<a.count;i++)points.push([a.getX(i),a.getY(i),a.getZ(i)].map(v=>v.toFixed(4)).join(','));}});return createHash('sha256').update(points.sort().join(';')).digest('hex');}
let maxTriangles=0,maxDraws=0;
for(const armor of ARMORS){
  hero.setEquipment({armor,bag:BAGS[0]});assert.equal(hero.root.userData.equipment.armor,armor.id);
  if(armor.id==='traveler')continue;
  const shape=hero.root.userData.armorAppearance;assert.equal(shape.region,armor.village);assert.equal(shape.elite,!!armor.elite);assert.ok(shape.triangles<2000);assert.ok(shape.draws<=28);maxTriangles=Math.max(maxTriangles,shape.triangles);maxDraws=Math.max(maxDraws,shape.draws);shapes.set(armor.id,{signature:signature(),triangles:shape.triangles});
  for(let i=0;i<2;i++){assert.equal(hero.armorAnchors.shoulders[i].parent,hero.arms[i].pivot);assert.equal(hero.armorAnchors.bracers[i].parent,hero.arms[i].elbow);assert.equal(hero.armorAnchors.shins[i].parent,hero.legs[i].knee);assert.equal(hero.armorAnchors.hips[i].parent,hero.legs[i].pivot);}
  for(const pose of ['walk','jump','climb']){hero.update(2,true,{x:2,z:-2},.1);if(pose==='jump')hero.airPose(1);if(pose==='climb')hero.climbPose(2);hero.root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(hero.root);assert.ok([...bounds.min.toArray(),...bounds.max.toArray()].every(Number.isFinite));assert.ok(bounds.max.y<3.6);}
}
const guards=ARMORS.filter(a=>a.id.endsWith('-guard'));assert.equal(new Set(guards.map(a=>shapes.get(a.id).signature)).size,10,'all ten villages have different geometry, independently of their colors');
for(const a of guards){const elite=shapes.get(a.village+'-elite'),guard=shapes.get(a.id);assert.notEqual(elite.signature,guard.signature);assert.ok(elite.triangles>guard.triangles,'elite armor adds actual shaped parts');}
hero.setEquipment({armor:ARMORS[1],bag:BAGS[0]});const old=hero.armorAnchors.body.children.find(o=>o.isMesh).geometry;let disposed=false;old.addEventListener('dispose',()=>disposed=true);hero.setEquipment({armor:ARMORS[3],bag:BAGS[0]});assert.equal(disposed,true);assert.equal(bodyDisposals,0,'armor swaps never dispose the body geometry');
hero.setEquipment({armor:ARMORS[0],bag:BAGS[0]});for(const root of [...hero.armorAnchors.shoulders,...hero.armorAnchors.shins,...hero.armorAnchors.hips])assert.equal(root.children.length,0);
for(const root of hero.armorAnchors.bracers)assert.equal(root.children[0].userData.item,'bare-wrists','armguards are independent of the body armor');
console.log('PASS: 20 distinct village armor models, geometry differences independent of color, elite upgrades, articulated limb attachments, walk/jump/climb, safe swaps; max '+maxTriangles+' triangles and '+maxDraws+' armor draws.');
