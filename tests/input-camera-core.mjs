import assert from 'node:assert/strict';
import {physicalKey} from '../src/game-input.js';
import {createCameraHeight} from '../src/camera-height.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {newJourney} from '../src/adventure-data.js';

for(const key of ['ư','Ư','Process','Dead','Unidentified'])assert.equal(physicalKey({key,code:'KeyW',isComposing:true,keyCode:229}),'w');
for(const [code,key] of [['KeyS','s'],['KeyE','e'],['KeyM','m'],['Space',' '],['ArrowUp','arrowup'],['Digit3','3'],['NumpadEnter','enter']])assert.equal(physicalKey({code,key:'Process'}),key);
const filter=createCameraHeight();filter.update(0,0,true);let previous=0,max=0;
for(let k=0;k<180;k++){const h=filter.update(Math.floor(k/6)*.26,1/60);max=Math.max(max,Math.abs(h-previous));previous=h;}
assert.ok(max<.06,'the view never inherits the full 26 cm step jump');
for(let k=0;k<90;k++)filter.update(7.54,1/60);assert.ok(Math.abs(filter.value-7.54)<.0001,'the camera settles without oscillation');
globalThis.innerWidth=1440;globalThis.innerHeight=960;
const world=createAdventureScene(),save=newJourney();save.village='fire';save.position=[88,-70];world.load('fire',save);assert.ok(world.startTraversal('red-cliff'));
let maxAnchorStep=0,last=world.cameraState().anchorHeight,maxFootStep=0,lastFoot=world.hero.root.position.y;
for(let k=0;k<300;k++){world.advanceTraversal(1/60,1);world.update(1/60,false);const current=world.cameraState().anchorHeight;maxAnchorStep=Math.max(maxAnchorStep,Math.abs(current-last));maxFootStep=Math.max(maxFootStep,Math.abs(world.hero.root.position.y-lastFoot));last=current;lastFoot=world.hero.root.position.y;}
assert.ok(maxFootStep>.24,'character feet still land exactly on real treads');assert.ok(maxAnchorStep<.08,'the actual game camera filters tread height changes');
world.recoverHero();assert.ok(Math.abs(world.cameraState().anchorHeight-world.hero.root.position.y)<.001,'teleports snap the anchor without a long camera catch-up');
console.log('PASS: physical IME keys, smooth camera height without oscillation, exact stair contacts and snapped recovery camera.');
