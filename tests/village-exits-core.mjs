import assert from 'node:assert/strict';
import '../game-core.js';
import {newJourney,village,VILLAGES,findPath} from '../src/adventure-data.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {crossedRoadGate,gateArrival,planVillageExits} from '../src/village-exits.js';
import {regionMetrics} from '../src/adventure-world.js';

globalThis.innerWidth=1280;globalThis.innerHeight=800;
const world=createAdventureScene();
const water=planVillageExits(village('water'),village),north=water.find(g=>g.id==='nameless'),south=water.find(g=>g.id==='wind');
assert.equal(north.x,south.x);assert.equal(north.z,-south.z);assert.ok(north.z<0&&south.z>0);
let roads=0;
for(const v of VILLAGES){
  const save=newJourney();save.village=v.id;world.load(v.id,save);
  const gates=world.gates,limit=regionMetrics(v.id).limit;
  for(const g of gates.filter(g=>g.kind==='gate')){
    const label=`${v.id} → ${g.id}`,arrival=gateArrival(g),dx=Math.sin(g.yaw),dz=Math.cos(g.yaw);
    assert.equal(Math.max(Math.abs(g.x),Math.abs(g.z)),limit-5,label);
    assert.equal(world.blocked(g.x,g.z),false,label+' gate is open');
    assert.equal(world.blocked(...arrival),false,label+' arrival has room');
    assert.ok(findPath(arrival,[g.x,g.z],world.blocked).length,label+' arrival can walk to the arch');
    const start={x:g.x-1.5*dx,z:g.z-1.5*dz};start.y=world.heightAt(start.x,start.z);
    const end={x:g.x,z:g.z,y:world.heightAt(g.x,g.z)};
    assert.equal(crossedRoadGate(gates,start,end,world.heightAt),g,label);
    assert.equal(crossedRoadGate(gates,end,start,world.heightAt),null,'walking inward does not depart');
    const moveSide=p=>({...p,x:p.x+3.1*dz,z:p.z-3.1*dx});
    assert.equal(crossedRoadGate(gates,moveSide(start),moveSide(end),world.heightAt),null,'passing a post outside the opening does not depart');
    assert.equal(crossedRoadGate(gates,start,{...end,y:end.y+8},world.heightAt),null,'flying over the arch does not depart');
    roads++;
  }
}
assert.equal(roads,20);
console.log('PASS: aligned Water gates, clear approaches, automatic crossing volumes and no reverse departures across all villages.');
