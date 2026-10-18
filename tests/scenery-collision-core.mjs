import assert from 'node:assert/strict';
import * as T from 'three';
import {createAdventureScene} from '../src/adventure-scene.js';
import {colliderFromGeometry} from '../src/adventure-colliders.js';
import {createCharacterPhysics} from '../src/adventure-physics.js';
import {VILLAGES,newJourney} from '../src/adventure-data.js';
import {terrainHeight,waterDepthAt,MAX_WADING_DEPTH} from '../src/adventure-world.js';

const rock=colliderFromGeometry(new T.DodecahedronGeometry(1.4,0),new T.Matrix4().makeTranslation(0,1,0),'rock'),board=colliderFromGeometry(new T.BoxGeometry(3,.2,3),new T.Matrix4().makeTranslation(5,1.7,0),'board');
const p={x:5,y:0,z:2.5},body=createCharacterPhysics({position:p,baseFloor:()=>0,staticBlocked:()=>false});body.addBox(rock);body.addBox(board);body.jump();for(let i=0;i<100;i++){if(i<35)body.move(0,-.06);body.step(1/60);}assert.ok(Math.abs(p.y-1.8)<1e-5,'a rendered board supplies its real top');
const probe=createCharacterPhysics({position:{x:0,y:0,z:0},baseFloor:()=>0,staticBlocked:()=>false});globalThis.innerWidth=1440;globalThis.innerHeight=960;const world=createAdventureScene();
for(const v of VILLAGES){const save=newJourney();save.village=v.id;world.load(v.id,save);const rocks=world.solids.filter(s=>['scenery-rocks','landscape-boulders'].includes(s.name));assert.ok(rocks.length>=10,`${v.id}: instanced rocks participate in physics`);
  const sample=rocks.find(s=>s.topAt(s.x,s.z)>terrainHeight(v.id,s.x,s.z)+.5);assert.ok(sample);const position={x:sample.x-sample.w/2-1,y:terrainHeight(v.id,sample.x-sample.w/2-1,sample.z),z:sample.z},physics=createCharacterPhysics({position,baseFloor:(x,z)=>terrainHeight(v.id,x,z),staticBlocked:()=>false});physics.addBox(sample);
  for(let k=0;k<70;k++){physics.move(.07,0);physics.step(1/60);if(probe.touches(sample,position.x,position.z,.001))assert.ok(position.y>=sample.topAt(position.x,position.z)-.03||position.y+2.85<=sample.bottomAt(position.x,position.z)+.03,`${v.id}: movement never enters a rock's solid volume`);}
  const trunks=world.scene.getObjectByName('vegetation-trunks'),crowns=world.scene.getObjectByName('vegetation-crowns');if(trunks&&crowns){const a=new T.Matrix4(),b=new T.Matrix4();trunks.geometry.computeBoundingBox();crowns.geometry.computeBoundingBox();for(let i=0;i<trunks.count;i++){trunks.getMatrixAt(i,a);crowns.getMatrixAt(i,b);const trunk=trunks.geometry.boundingBox.clone().applyMatrix4(a),crown=crowns.geometry.boundingBox.clone().applyMatrix4(b);assert.ok(crown.min.y<=trunk.max.y+.01,`${v.id}: crowns meet their trunks`);}}
}
const save=newJourney();save.village='water';let found=false;
for(const z of [-24,-12,0,12,24]){const center=46+Math.sin(z*.025)*9,x=center+7*.75;save.position=[x,z];world.load('water',save);if(Math.hypot(world.hero.root.position.x-x,world.hero.root.position.z-z)>.01)continue;assert.ok(waterDepthAt(center+7/3,z)>2.85,'a third of the way across is over the head');for(let i=0;i<150;i++){world.moveHero(-.07,0);world.update(1/60,true);}const depth=waterDepthAt(world.hero.root.position.x,world.hero.root.position.z);assert.ok(depth<=MAX_WADING_DEPTH+.001);assert.ok(depth>.65,'shallow water remains accessible');found=true;break;}
assert.ok(found);console.log('PASS: actual rock faces and board tops, collision on rocks in all ten villages, attached tree crowns, deep Water rivers and shallow-only wading.');
