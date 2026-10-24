import assert from 'node:assert/strict';
import {createCharacterPhysics} from '../src/adventure-physics.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {newJourney,readJourney,findPath} from '../src/adventure-data.js';
import {REGIONS} from '../src/adventure-world.js';

const p={x:0,y:0,z:0},body=createCharacterPhysics({position:p,baseFloor:()=>0,staticBlocked:()=>false});
body.addBox({name:'step',x:0,z:-2.5,w:4,d:2,top:.8,bottom:0});
body.move(0,-4);assert.ok(p.z>-1.5,'a long frame cannot tunnel through a riser');
assert.ok(body.jump());assert.equal(body.jump(),false,'no jump can be added in mid-air');
let peak=0;for(let k=0;k<80;k++){if(k<34)body.move(0,-.05);body.step(1/60);peak=Math.max(peak,p.y);}
assert.ok(peak>2.7&&peak<3);assert.ok(Math.abs(p.y-.8)<1e-6);assert.ok(body.state().grounded,'a raised slab catches a descending jump');
body.move(0,5);body.step(.1);assert.equal(body.state().grounded,false,'walking off an edge falls instead of snapping to terrain');for(let k=0;k<90;k++)body.step(1/60);assert.equal(p.y,0);
p.x=0;p.z=-1.5;body.reset(.8);for(let k=0;k<60;k++){body.move(0,.035);body.step(1/60);}assert.ok(p.z>.4,'a falling body can continue out of a slab edge without sticking');assert.equal(p.y,0);
p.x=8;p.z=0;body.reset(0);body.addBox({name:'ceiling',x:8,z:0,w:4,d:4,bottom:3.3,top:3.5});body.jump();for(let k=0;k<30;k++)body.step(1/60);assert.ok(p.y<.46,'an underside blocks the head');

globalThis.innerWidth=1440;globalThis.innerHeight=960;
const world=createAdventureScene(),save=newJourney();world.load('nameless',save);
for(const i of world.interactives)assert.ok(findPath([0,7],[i.x,i.z],world.blocked).length,`solid scenery does not cut the route to ${i.kind}/${i.id}`);
const terrace=world.solids.filter(s=>s.name==='terrace-soil').sort((a,b)=>a.top-b.top)[0];assert.ok(terrace);
const x=terrace.x,z=terrace.z+terrace.d/2+1.2,start=newJourney();start.position=[x,z];world.load('nameless',start);assert.ok(Math.hypot(world.hero.root.position.x-x,world.hero.root.position.z-z)<.01);
world.moveHero(0,-2);world.update(1/60,true);assert.ok(world.hero.root.position.z>terrace.z+terrace.d/2,'walking cannot pass through the terrace');
world.jump();for(let k=0;k<85;k++){if(k<30)world.moveHero(0,-.06);world.update(1/60,k<30);}
assert.ok(Math.abs(world.hero.root.position.y-terrace.top)<.04,'a jump lands on actual terrace soil');assert.ok(world.physicsState().grounded);
const safe=world.safeSave(),stored=readJourney({getItem:()=>JSON.stringify({...newJourney(),...safe})});world.load('nameless',stored);assert.ok(Math.abs(world.hero.root.position.y-terrace.top)<.04,'standing elevation survives save/reload');

// Use an intact railing span, and move outward along its true rotated normal.
const rail=world.solids.find(s=>s.name==='bridge-rail'),deck=world.solids.find(s=>s.name==='bridge-deck'&&Math.hypot(s.x-rail.x,s.z-rail.z)<s.d/2+1),dx=rail.x-deck.x,dz=rail.z-deck.z,nx=Math.cos(deck.yaw)*Math.sign(dx*Math.cos(deck.yaw)-dz*Math.sin(deck.yaw)),nz=-Math.sin(deck.yaw)*Math.sign(dx*Math.cos(deck.yaw)-dz*Math.sin(deck.yaw));
const bridgeSave=newJourney();bridgeSave.position=[rail.x-nx*.9,rail.z-nz*.9];world.load('nameless',bridgeSave);const before=[world.hero.root.position.x,world.hero.root.position.z];world.moveHero(nx*3,nz*3);world.update(.016,true);assert.ok(Math.hypot(world.hero.root.position.x-before[0],world.hero.root.position.z-before[1])<1,'a rotated bridge railing blocks the body');
const solidCount=world.solids.length;world.load('nameless',newJourney());assert.equal(world.solids.length,solidCount,'rebuilding a village does not accumulate invisible collisions');
const crystals=REGIONS.earth.zones.find(z=>z.id==='cave-crystals'),caveSave=newJourney();caveSave.village='earth';caveSave.interior={id:'earth-cave',returnPosition:[0,-11.2],returnSurface:null,returnElevation:null};caveSave.position=[crystals.x,crystals.z];world.load('earth',caveSave);const door=world.interactives.find(i=>i.kind==='interior-exit'),exit=[door.x,door.z],cavePath=findPath(caveSave.position,exit,world.blocked);assert.ok(cavePath.length);
for(const [x,z] of cavePath){for(let k=0;k<100&&Math.hypot(x-world.hero.root.position.x,z-world.hero.root.position.z)>.01;k++){const p=world.hero.root.position,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz),step=Math.min(d,.1);world.moveHero(dx/d*step,dz/d*step);world.update(1/60,true);}assert.ok(Math.hypot(x-world.hero.root.position.x,z-world.hero.root.position.z)<.02,'planned cave segments clear the real collision shapes');}
assert.ok(Math.hypot(world.hero.root.position.x-exit[0],world.hero.root.position.z-exit[1])<.02);
console.log('PASS: gravity, bounded jumps/no double-jump, raised landings, edge falls, head collision, real terrace walls/soil/save reload, rotated bridge railing, no tunneling and reachable village routes.');
