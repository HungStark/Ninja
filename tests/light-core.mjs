import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as T from 'three';
import { LightArts } from '../src/light-arts.js';
const ctx={};vm.runInNewContext(fs.readFileSync('game-core.js','utf8'),ctx);
const {spells,Fighter,intersectFireWall}=ctx.SealGameCore;
const spell=id=>spells.find(s=>s.id===id),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const scene=new T.Scene(),arts=new LightArts(scene,intersectFireWall);
let actors,walls,hits;const setup=()=>{arts.reset();actors=[{owner:'player',pos:[0,1.72,7],dir:[0,0,-1],fighter:new Fighter()},{owner:'enemy',pos:[0,1.72,-15],dir:[0,0,1],fighter:new Fighter()}];walls=[];hits=[];};
const damage=shot=>{hits.push({power:shot.damage,relays:shot.lightRelays,prisms:shot.prisms});return actors.find(a=>a.owner!==shot.owner).fighter.receive(shot.damage,true);};
const advance=t=>{for(let age=0;age<t;age+=1/60)arts.advance(Math.min(1/60,t-age),actors,walls,damage);};
const place=(id,owner='player')=>{const a=actors.find(a=>a.owner===owner);return arts.place(owner,spell(id),a.pos,a.dir,actors);};
const fire=(owner='player',id='light-orb')=>{const a=actors.find(a=>a.owner===owner);arts.fire(owner,spell(id),a.pos,a.dir);advance(.12);};
assert.deepEqual(Array.from(spells.filter(s=>s.element==='light').map(s=>s.sequence.length)),[2,3,4,6,8]);
setup();fire();close(actors[1].fighter.hp,960);assert.equal(hits.length,1);
setup();place('light-barrier');fire();close(actors[1].fighter.hp,940);assert.equal(hits[0].prisms,1);assert.equal(arts.lastPaths.at(-1).prisms,1);
setup();for(let i=0;i<3;i++)place('light-barrier');fire();close(actors[1].fighter.hp,900);assert.equal(hits[0].prisms,3);
const oldIds=arts.optics.map(o=>o.id);place('light-barrier');assert.equal(arts.optics.length,3);assert.ok(!arts.optics.some(o=>o.id===oldIds[0]));assert.equal(new Set(arts.optics.map(o=>o.slot)).size,3);
setup();const rear=place('light-reflect');close(rear.center[2],-18.5);fire();assert.deepEqual(hits.map(h=>h.power),[40,50]);close(actors[1].fighter.hp,910);assert.deepEqual(hits.map(h=>h.relays),[0,1]);assert.equal(arts.lastPaths.filter(p=>p.relays===1).length,5);
setup();place('light-reflect');const left=place('light-reflect'),right=place('light-reflect');close(left.center[0],-4);close(right.center[0],4);close(left.center[2],-11);close(right.center[2],-11);fire();
assert.deepEqual(hits.map(h=>h.power),[40,50,60,60]);close(actors[1].fighter.hp,790);assert.equal(arts.lastPaths.filter(p=>p.relays>0).length,15);assert.ok(arts.lastPaths.length<=16,'Each pillar emits once; no return loop');
place('light-reflect');assert.equal(arts.optics.length,3);assert.equal(arts.optics.at(-1).slot,0);
setup();place('light-barrier');for(let i=0;i<3;i++)place('light-reflect');fire();assert.deepEqual(hits.map(h=>h.power),[60,75,90,90]);close(actors[1].fighter.hp,685);assert.equal(Math.max(...hits.map(h=>h.prisms)),1);
// Missing the column crystal leaves the original straight ray unchanged.
setup();const pillar=place('light-reflect');pillar.center[0]=3;pillar.root.position.x=3;fire();assert.deepEqual(hits.map(h=>h.power),[40]);
// Fans follow the column's placed facing; they do not chase a dodging target.
setup();place('light-reflect');actors[1].pos[0]=7;fire();assert.equal(hits.length,0);assert.equal(arts.lastPaths.filter(p=>p.relays>0).length,5);
setup();walls.push({owner:'enemy',p:[0,0,-10],normal:[0,0,1],width:8,height:5,hp:110,life:5});place('light-barrier');place('light-reflect');fire();close(actors[1].fighter.hp,1000);close(walls[0].hp,50);assert.equal(arts.lastPaths.at(-1).event,'wall');
setup();place('light-reflect');walls.push({owner:'enemy',p:[0,0,-17],normal:[0,0,1],width:8,height:5,hp:110,life:5});fire();assert.deepEqual(hits.map(h=>h.power),[40]);close(walls[0].hp,70);
setup();actors[1].fighter.invulnerableTime=2;place('light-reflect');fire();close(actors[1].fighter.hp,1000);
setup();actors[1].fighter.shield=60;actors[1].fighter.reflect=1;place('light-reflect');fire();close(actors[1].fighter.hp,970);close(actors[1].fighter.shield,0);assert.equal(actors[1].fighter.reflect,1,'Direct light rays remain shield-absorbable, not flying projectiles');
setup();place('light-barrier','enemy');place('light-reflect','enemy');fire('enemy');close(actors[0].fighter.hp,865);close(actors[1].fighter.hp,1000);
setup();place('light-barrier','enemy');fire();close(actors[1].fighter.hp,960,'Opponent optics do not amplify friendly rays');
setup();arts.beam('player',spell('light-lance'),actors[0].pos,actors[0].dir);advance(1.2);close(actors[1].fighter.hp,928);assert.equal(hits.length,6);
setup();place('light-barrier');place('light-reflect');arts.beam('player',spell('light-lance'),actors[0].pos,actors[0].dir);advance(1.2);close(actors[1].fighter.hp,757);assert.equal(hits.length,12);
setup();arts.beam('player',spell('light-lance'),actors[0].pos,actors[0].dir);advance(.4);actors[0].dir=[1,0,0];advance(.8);close(actors[1].fighter.hp,976);
setup();arts.beam('player',spell('light-lance'),actors[0].pos,actors[0].dir);advance(.2);actors[0].fighter.controlTime=2;advance(1);close(actors[1].fighter.hp,988);assert.equal(arts.channels.length,0);
const aimDisco=()=>{const o=arts.optics.find(o=>o.kind==='disco'),delta=o.center.map((x,i)=>x-actors[0].pos[i]),d=Math.hypot(...delta);actors[0].dir=delta.map(x=>x/d);return o;};
setup();arts.disco('player',spell('light-volley'),actors[0].pos,actors[0].dir,actors);advance(3);close(actors[1].fighter.hp,1000);assert.equal(arts.state().discos[0].active,false);fire();assert.equal(arts.state().discos[0].active,false,'A horizontal ray below the orb cannot activate it');close(actors[1].fighter.hp,960);
setup();arts.disco('player',spell('light-volley'),actors[0].pos,actors[0].dir,actors);const disco=aimDisco();fire();assert.equal(disco.active,true);close(actors[1].fighter.hp,1000);advance(3);close(actors[1].fighter.hp,880);assert.equal(disco.ticks,6);assert.equal(disco.ball.material,arts.discoColors);advance(.3);assert.equal(arts.state().discos.length,0);
setup();arts.disco('player',spell('light-volley'),actors[0].pos,actors[0].dir,actors);advance(17.8);aimDisco();fire();advance(3);close(actors[1].fighter.hp,880,'Late activation still gives the full three seconds');
setup();place('light-barrier');arts.disco('player',spell('light-volley'),actors[0].pos,actors[0].dir,actors);aimDisco();fire();close(arts.state().discos[0].boost,1.5);advance(3);close(actors[1].fighter.hp,820);
setup();arts.disco('player',spell('light-volley'),actors[0].pos,actors[0].dir,actors);aimDisco();walls.push({owner:'enemy',p:[0,0,-10],normal:[0,0,1],width:8,height:7,hp:100,life:5});fire();assert.equal(arts.state().discos[0].active,false);close(actors[1].fighter.hp,1000);advance(18);assert.equal(arts.state().discos.length,0);
setup();arts.disco('player',spell('light-volley'),actors[0].pos,actors[0].dir,actors);aimDisco();fire();actors[1].pos[0]=10;advance(3);close(actors[1].fighter.hp,1000,'Moving out from beneath the stationary orb dodges its rays');
setup();for(let i=0;i<3;i++)place('light-reflect');arts.disco('player',spell('light-volley'),actors[0].pos,actors[0].dir,actors);aimDisco();fire();advance(.51);assert.ok(hits.length>1);assert.ok(arts.state().discos[0].path.some(p=>p.relays>0),'Disco rays also activate the column network');
setup();const anchored=place('light-barrier');const center=[...anchored.center];actors[0].pos=[3,1.72,7];actors[0].dir=[1,0,0];advance(1);assert.deepEqual(anchored.center,center);arts.visuals(1,[],actors,walls);assert.ok(anchored.root.children[0].children[0].geometry.attributes.position.count>10);advance(24);assert.equal(arts.optics.length,0);
// A fan beam through the FPS eye must not render enormous near-plane caps.
setup();place('light-barrier');place('light-reflect');place('light-reflect');arts.beam('player',spell('light-lance'),actors[0].pos,actors[0].dir);advance(.21);arts.visuals(.21,[],actors,walls);
for(const m of arts.channels[0].root.userData.lines.filter(m=>m.visible)){
  const d=new T.Vector3(0,1,0).applyQuaternion(m.quaternion).multiplyScalar(m.scale.y/2),a=m.position.clone().sub(d),b=m.position.clone().add(d),eye=new T.Vector3(...actors[0].pos),point=new T.Line3(a,b).closestPointToPoint(eye,true,new T.Vector3());
  assert.ok(point.distanceTo(eye)>=1.399,'Rendered tube excludes eye region; physical ray still crosses it');
}
setup();place('light-barrier');place('light-reflect');arts.previewTarget(arts.placement('player','pillar',actors[0].pos,actors[0].dir,actors));arts.fire('player',spell('light-volley'),actors[0].pos,actors[0].dir);arts.beam('player',spell('light-lance'),actors[0].pos,actors[0].dir);advance(.21);arts.visuals(.21,[],actors,walls);arts.reset();assert.deepEqual(arts.state(),{prisms:[],pillars:[],discos:[],channels:[],pulses:[],lastPath:[],preview:null});assert.equal(scene.children.length,1,'Only the reusable hidden placement preview remains');
console.log('PASS: optical placement/caps/expiry, prism spectrum/damage, five-ray fan, linked three-column star network without repeat activation, walls, dodge/shield/immunity, both owners, beam aim/control, dormant disco activation/aim/walls/amplification/expiry and column links, volume/reset.');
