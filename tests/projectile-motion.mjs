import assert from 'node:assert/strict';
import {FLIGHT_PROFILE,flightDistanceAt,flightTimeAt,flightSpeedRatio,projectileMotionStep} from '../src/projectile-motion.js';
import '../game-core.js';
const {projectileTimeStep}=SealGameCore,close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const integrate=(speed,dt,fields=[])=>{const s={element:'fire',owner:'player',phase:'flying',p:[0,1.72,0],v:[0,0,speed]};for(let t=0;t<2-1e-9;t+=dt){const step=projectileMotionStep(s,Math.min(dt,2-t),fields,projectileTimeStep);s.p[2]+=speed*step.travelTime;s.motionTime=step.motionTime;}return s;};
for(const speed of [22,29,38]){
  const start=2/(speed*.2);close(flightDistanceAt(start,speed),2);close(flightSpeedRatio(start,speed),.2);close(flightSpeedRatio(start+.12,speed),FLIGHT_PROFILE.peakSpeedRatio);
  close(flightDistanceAt(start+.22,speed)-flightDistanceAt(start+.12,speed),speed*FLIGHT_PROFILE.peakSpeedRatio*.1);
  const a=integrate(speed,1/60),b=integrate(speed,1/20);close(a.p[2],b.p[2]);close(a.p[2],flightDistanceAt(2,speed));
  for(const d of [0,1,2,2.1,3,31,75])close(flightDistanceAt(flightTimeAt(d,speed),speed),d);
  const slow=integrate(speed,1/60,[{owner:'enemy',p:[0,0,0],height:8,radius:500,life:10,slowFactor:.3}]);close(slow.p[2],flightDistanceAt(.6,speed));
}
const shot={element:'wind',owner:'player',phase:'flying',p:[0,1.72,0],v:[0,0,29]};
const untouched=JSON.stringify(shot);for(let i=0;i<8;i++)projectileMotionStep(shot,.1,[],projectileTimeStep);assert.equal(JSON.stringify(shot),untouched,'Swept collision previews must not advance the launch clock');
for(const phase of ['forming','staged','emerging','gathering','blooming'])close(projectileMotionStep({...shot,phase},.5,[],projectileTimeStep).distance,0);
close(projectileMotionStep({...shot,element:'weapon'},.1,[],projectileTimeStep).distance,2.9);
close(projectileMotionStep({...shot,motionTime:1,v:[0,0,-29]},.1,[],projectileTimeStep).distance,2.9*FLIGHT_PROFILE.peakSpeedRatio);
assert.equal(FLIGHT_PROFILE.launchDistance,2);console.log('PASS: exact 2m launch, rapid smooth burst, speed cap, FPS independence, field slowdown, inverse duration, pure previews, formation gates, weapons and reflection clock continuity.');
