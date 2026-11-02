import assert from 'node:assert/strict';
import {createAdventureScene} from '../src/adventure-scene.js';
import {newJourney} from '../src/adventure-data.js';
globalThis.innerWidth=960;globalThis.innerHeight=640;
const world=createAdventureScene(),save=newJourney();save.story.stage='infiltrate';save.story.villageEvents.fire=4;save.story.companion.recruited=true;save.position=[0,7];world.load('nameless',save);
let moved=0;
for(let lap=0;lap<12;lap++)for(const [dx,dz]of [[0,-1],[1,0],[0,1],[-1,0]])for(let i=0;i<30;i++){
 const hero=world.hero.root.position.clone(),follower=world.storyState().position;
 world.moveHero(dx*4.6/60,dz*4.6/60);world.update(1/60,true);
 const after=world.storyState();assert.equal(after.catchups,0);assert.ok(after.distance<3);
 if(hero.distanceTo(world.hero.root.position)>.04){assert.ok(Math.hypot(...after.position.map((p,i)=>p-follower[i]))>.02,'follower does not stall while the hero keeps moving');moved++;}
}
assert.ok(moved>1200);const same=world.storyState().position;world.syncVillageEvents(save);assert.deepEqual(world.storyState().position,same);world.update(.5,false,false,true);assert.deepEqual(world.storyState().position,same,'dialogue pauses playback without discarding the route');
save.village='wood';save.position=[0,7];world.load('wood',save);const route=world.routes[0];world.hero.root.position.set(route.from[0],route.fromY,route.from[1]);world.syncVillageEvents(save);
// Reload from this ground entrance so both actors start with valid local history.
save.position=[...route.from];save.elevation=route.fromY;world.load('wood',save);assert.ok(world.startTraversal(route.id));
for(let i=0;i<1800&&world.riding;i++){world.advanceTraversal(1/60,1);world.update(1/60,true);assert.equal(world.storyState().visible,true);}
assert.equal(world.riding,false);assert.equal(world.storyState().catchups,0,'spiral stairs do not cause a catch-up teleport');assert.ok(Math.abs(world.hero.root.position.y-world.storyState().position[1])<2);
const safe=world.safeSave();Object.assign(save,safe);world.load('wood',save);assert.ok(Math.abs(world.hero.root.position.y-world.storyState().position[1])<1.3,'upper-floor reload spawns the companion on the same deck');
console.log('PASS: 1,440 real scene movement frames, continuous corner following, zero catch-up teleports, dialogue/quest refresh continuity, visible spiral-stair traversal and elevated-save spawning.');
