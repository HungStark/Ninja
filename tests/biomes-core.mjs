import assert from 'node:assert/strict';
import {createAdventureScene} from '../src/adventure-scene.js';
import {newJourney,readJourney,findPath} from '../src/adventure-data.js';
import {REGIONS,regionMetrics,isDeepWater,riverAt} from '../src/adventure-world.js';
import {planExpedition} from '../src/adventure-biomes.js';
globalThis.innerWidth=1440;globalThis.innerHeight=960;
const world=createAdventureScene(),load=id=>{const s=newJourney();s.village=id;world.load(id,s);return s;};
for(const id of ['water','fire','lightning','wind','earth','ice','wood']){
 assert.equal(regionMetrics(id).area/regionMetrics('nameless').area,4);assert.equal(regionMetrics(id).size,280);load(id);assert.ok(REGIONS[id].zones.length>=6);
 for(const item of world.interactives){const plan=planExpedition([0,7],[item.x,item.z],{id,routes:world.routes,targetSurface:item.platform,walk:(a,b,key)=>findPath(a,b,world.navigationBlocked(key))});assert.ok(plan,`${id}: reachable ${item.kind}/${item.id}`);}
 assert.equal(world.blocked(141,0),true);for(const gate of world.gates){const p=[gate.x*world.metrics.arrivalRadius/world.metrics.gateRadius,gate.z*world.metrics.arrivalRadius/world.metrics.gateRadius];assert.equal(world.blocked(...p),false,`${id}: arrival from ${gate.id} is clear`);}
}
load('nameless');assert.equal(world.metrics.size,140);assert.ok(world.scene.getObjectsByProperty('name','village-house').some(h=>h.userData.ruined));assert.equal(world.blocked(71,0),true);
load('water');assert.equal(world.routes.length,5);const ferry=world.routes[0];assert.ok(isDeepWater((ferry.from[0]+ferry.to[0])/2,36));assert.equal(findPath(ferry.from,ferry.to,world.blocked).length,0,'deep water requires a ferry');
world.hero.root.position.set(ferry.from[0],ferry.fromY,ferry.from[1]);assert.equal(world.startTraversal(ferry.id),true);for(let k=0;k<400&&world.riding;k++){world.advanceTraversal(1/60);world.update(1/60,false);}assert.equal(world.riding,false);assert.ok(Math.hypot(world.hero.root.position.x-ferry.to[0],world.hero.root.position.z-ferry.to[1])<.01);
for(const id of ['fire','wind','earth','wood']){load(id);const route=world.routes[0];world.hero.root.position.set(route.from[0],route.fromY,route.from[1]);assert.ok(world.startTraversal(route.id));world.advanceTraversal(.25,0);if(route.kind!=='cave')assert.equal(world.traversalState().progress,0,'climbing waits for input');
 for(let k=0;k<1600&&world.riding;k++){world.advanceTraversal(1/60,1);world.update(1/60,false);}assert.equal(world.riding,false);assert.ok(Math.abs(world.hero.root.position.y-route.toY)<.05);
 if(route.platform){assert.equal(world.surface,route.platform.id);assert.equal(world.canHeroMove(route.platform.x+route.platform.width,route.platform.z),false,'cannot walk off elevated floors / through cave walls');const safe=world.safeSave(),save=newJourney();save.village=id;save.position=safe.position;save.surface=safe.surface;assert.equal(readJourney({getItem:()=>JSON.stringify(save)}).surface,route.platform.id);if(id==='earth')assert.ok(world.camera.position.y<0,'camera remains inside the cave');}
 assert.ok(world.startTraversal(route.id,1));for(let k=0;k<1600&&world.riding;k++){world.advanceTraversal(1/60,1);world.update(1/60,false);}assert.equal(world.surface,null);assert.ok(Math.abs(world.hero.root.position.y-route.fromY)<.05);
}
load('lightning');world.update(12,false);assert.equal(world.weatherState().raining,true);assert.ok(world.weatherState().strikes>0);world.update(45,false);assert.equal(world.weatherState().raining,false);world.update(40,false);assert.equal(world.weatherState().raining,true);
const old=newJourney();delete old.worldRevision;old.village='water';old.position=[60,-50];const migrated=readJourney({getItem:()=>JSON.stringify(old)});assert.deepEqual(migrated.position,[120,-100]);assert.equal(migrated.worldRevision,2);migrated.position=[132,-124];assert.deepEqual(readJourney({getItem:()=>JSON.stringify(migrated)}).position,[132,-124]);
console.log('PASS: seven fourfold villages, all places reachable with real traversal legs, impassable deep rivers/ferries, input-driven climbing and ladders, elevated saves, cave floor/camera, intermittent storms, ruins and old-save migration.');
