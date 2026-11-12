import assert from 'node:assert/strict';
import * as T from 'three';
import {WATER_CHANNELS,channelPoint,queryWaterway,waterFootprintDry,nearestDryWaterPoint,waterMapMarkup} from '../src/water-network.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {REGIONS,waterDepthAt,isDeepWater} from '../src/adventure-world.js';
import {newJourney,findPath} from '../src/adventure-data.js';
import {villageSidequests,acceptSidequest,completeSidequestTarget,claimSidequest} from '../src/journey-story.js';
import {planExpedition} from '../src/adventure-biomes.js';
import {villageMapMarkup} from '../src/village-map.js';

globalThis.innerWidth=1000;globalThis.innerHeight=700;
assert.equal(WATER_CHANNELS.length,4);assert.ok(!WATER_CHANNELS.some(c=>c.id==='east'));assert.ok(waterFootprintDry(46,-90,{padding:0}));for(const x of [60,90,120,138])assert.ok(waterDepthAt(x,32)>3,'the blue-marked branch extends to the right boundary');
for(const c of WATER_CHANNELS.filter(c=>c.axis==='x')){
 const origin=channelPoint(c,(c.min+c.max)/2),size={w:4,d:6,padding:1};assert.equal(waterFootprintDry(origin.x,origin.z,size),false);
 const p=nearestDryWaterPoint(origin.x,origin.z,size);assert.ok(p);assert.ok(waterFootprintDry(p.x,p.z,size));assert.deepEqual(nearestDryWaterPoint(origin.x,origin.z,size),p);
 const distance=Math.hypot(p.x-origin.x,p.z-origin.z);for(let radius=0;radius<distance-.51;radius+=.5)for(let k=0;k<64;k++){const a=k*Math.PI/32;assert.equal(waterFootprintDry(origin.x+Math.cos(a)*radius,origin.z+Math.sin(a)*radius,size),false,'placement uses the nearest available bank, with half-meter search precision');}
 assert.deepEqual(nearestDryWaterPoint(p.x,p.z,size),p,'dry objects stay put');
}
const world=createAdventureScene(),save=newJourney();save.village='water';const start=performance.now();world.load('water',save);const loadMs=performance.now()-start;
const oldHomes=[[22,-122],[-122,118],[-122,-50],[22,46],[-26,-38],[-86,34],[-74,-122],[-38,106],[22,118],[-26,-98],[22,-14],[-122,-110],[-74,-26],[-38,46],[-122,-2],[-122,70],[-74,82],[-14,10],[-2,82],[10,-74]];
assert.deepEqual(world.civic.houses.map(p=>p.waterOriginal?[p.waterOriginal.x,p.waterOriginal.z]:[p.x,p.z]),oldHomes,'keep every existing dry home at its original position and preserve home order');
assert.equal(world.civic.houses.length,20);const moved=world.civic.houses.filter(p=>p.waterRelocated);assert.ok(moved.length>=1);
for(const house of moved){assert.ok(Math.hypot(house.x-house.waterOriginal.x,house.z-house.waterOriginal.z)<=24.001);assert.ok(waterFootprintDry(house.x,house.z,{w:house.w,d:house.d,padding:1}));}
for(const c of WATER_CHANNELS.filter(c=>c.axis==='x')){const p=channelPoint(c,(c.min+c.max)/2);assert.ok(waterDepthAt(p.x,p.z)>3,'branch beds remain carved through terrain grading');assert.ok(isDeepWater(p.x,p.z));}
const water=world.scene.getObjectByName('river-surface');assert.ok(water.userData.riverNetwork);assert.equal(water.userData.channels.length,4);assert.ok(water.geometry.attributes.position.count<2500);assert.equal(water.material.transparent,false,'overlapping junctions do not stack transparent surfaces');
assert.equal(world.bridges.length,0);assert.equal(world.scene.getObjectsByProperty('name','river-bridge').length,0);assert.equal(world.routes.length,6);
for(const c of WATER_CHANNELS)assert.ok(world.routes.some(r=>r.channel===c.id));
for(const route of world.routes){
 assert.equal(route.kind,'raft');const middle=[(route.from[0]+route.to[0])/2,(route.from[1]+route.to[1])/2];assert.ok(world.blocked(...middle),'no invisible bridge across '+route.channel);assert.ok(route.boat.children.length<=4,'raft geometry stays batched');
 for(const side of [0,1]){const from=side?route.to:route.from,to=side?route.from:route.to;world.hero.root.position.set(from[0],side?route.toY:route.fromY,from[1]);assert.ok(world.startTraversal(route.id,side));for(let k=0;k<150&&world.riding;k++)world.advanceTraversal(.05);assert.equal(world.riding,false);assert.ok(Math.hypot(world.hero.root.position.x-to[0],world.hero.root.position.z-to[1])<.05,'raft reaches both banks');assert.equal(route.boat.visible,false);}
}
const points=world.interactives.filter(i=>!['dock','traversal','village-guard'].includes(i.kind));let pathMs=0;
for(const item of points){assert.ok(waterFootprintDry(item.x,item.z,{padding:0}),item.kind+'/'+item.id+' on land');const at=performance.now(),legs=planExpedition([0,7],[item.x,item.z],{id:'water',routes:world.routes,walk:(a,b,key)=>findPath(a,b,world.navigationBlocked(key))});pathMs+=performance.now()-at;assert.ok(legs,item.kind+'/'+item.id+' reachable');}
world.scene.traverse(o=>{if(o.userData.footprint){const p=o.userData.footprint;assert.ok(waterFootprintDry(p.x,p.z,{w:p.w,d:p.d,yaw:p.yaw,padding:0}),o.name+' footprint stays on land');}});
const matrix=new T.Matrix4(),position=new T.Vector3(),scale=new T.Vector3(),quaternion=new T.Quaternion();for(const name of ['vegetation-trunks','scenery-rocks']){const mesh=world.scene.getObjectByName(name);for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);matrix.decompose(position,quaternion,scale);if(scale.x<.001)continue;assert.ok(waterFootprintDry(position.x,position.z,{padding:0}),name+' '+i+' stays on land');}}
const signature=()=>JSON.stringify({houses:world.civic.houses,people:world.residentsState().map(p=>({id:p.id,position:p.position})),targets:world.interactives.filter(i=>i.kind==='sidequest-target').map(i=>[i.id,i.x,i.z]),bridges:world.bridges});
const before=signature();world.load('water',save);assert.equal(signature(),before,'reloads never accumulate drift or shuffle objects');
for(const q of villageSidequests('water')){acceptSidequest(save,q);world.syncSidequests(save);const target=world.interactives.find(i=>i.kind==='sidequest-target'&&i.id===q.id);assert.ok(target);assert.ok(waterFootprintDry(target.x,target.z,{padding:0}));assert.ok(!world.blocked(target.x,target.z));completeSidequestTarget(save,q);world.syncSidequests(save);claimSidequest(save,q);world.syncSidequests(save);}
save.position=[-35,-48+6*Math.sin(Math.PI*21/98)];save.elevation=0;world.load('water',save);assert.ok(Math.hypot(world.hero.root.position.x-save.position[0],world.hero.root.position.z-save.position[1])<15);assert.ok(waterFootprintDry(world.hero.root.position.x,world.hero.root.position.z,{padding:0}));
const svg=villageMapMarkup({id:'water',region:REGIONS.water,limit:140,gates:world.gates,civic:world.civic,routes:world.routes,hero:{x:0,z:7}}).svg;for(const c of WATER_CHANNELS)assert.ok(svg.includes('data-water-channel="'+c.id+'"'));
assert.equal((svg.match(/data-river-ferry=/g)||[]).length,6);
assert.equal((waterMapMarkup((x,z)=>({x,y:z})).match(/data-water-channel=/g)||[]).length,4);
console.log(JSON.stringify({loadMs:Math.round(loadMs),pathMs:Math.round(pathMs),bridges:world.bridges.length,ferries:world.routes.length,movedHouses:moved.length,waterVertices:water.geometry.attributes.position.count,reachablePoints:points.length}));
console.log('PASS: three connected river branches, common rendered/physical/map geometry, nearest dry footprints, preserved twenty homes, six working raft crossings with no bridges, dry objects and targets, stable reloads and all quest transitions.');

