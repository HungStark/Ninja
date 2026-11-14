import assert from 'node:assert/strict';
import {createCompanionFollow,FOLLOW_GAP,STUCK_SECONDS} from '../src/companion-follow.js';

const fixture=(options={})=>{
  const hero={x:0,y:0,z:0},position={x:0,y:0,z:-FOLLOW_GAP};
  const follow=createCompanionFollow({position,...options});follow.reset(hero,{yaw:0});return {hero,position,follow};
};
{
  const {hero,position,follow}=fixture();let previous=position.y;
  for(let i=0;i<300;i++){hero.y+=3.5/60;follow.update(1/60,hero,{yaw:0,riding:true});assert.ok(Math.abs(position.y-previous)<.3);previous=position.y;}
  assert.ok(hero.y-position.y<2,'The companion climbs a vertical ladder instead of remaining below');assert.equal(follow.state().catchups,0);
}
for(const fps of [30,60,144]){
  const {hero,position,follow}=fixture();let distance=0;
  for(let i=0;i<fps*12;i++){
    const dt=1/fps,speed=i<fps*3?1:i<fps*6?4.6:i<fps*9?12:2;hero.z+=speed*dt;distance+=speed*dt;
    const s=follow.update(dt,hero,{yaw:0,sprinting:speed>5});
    assert.ok(s.moving,'walking does not pause between samples');assert.ok(Math.abs(s.velocity.z-speed)<1e-6,'copies slow walk, run and sprint speed');
    assert.ok(Math.abs(position.z-(distance-FOLLOW_GAP))<1e-6);assert.equal(s.catchups,0);
  }
  const stopped={...position};for(let i=0;i<fps*60;i++)follow.update(1/fps,hero,{yaw:0});assert.deepEqual(position,stopped);assert.ok(follow.state().buffered<512,'idle history stays bounded');
}
{
  // The route passes around a solid corner. Large frames must consume its two
  // legs separately instead of taking a diagonal through the obstacle.
  const blocked=p=>p.x>1&&p.x<5&&p.z<4,trace=[],{hero,position,follow}=fixture({canOccupy:p=>{trace.push({...p});return !blocked(p);}});
  for(let i=0;i<50;i++){hero.z+=.1;follow.update(1/60,hero,{yaw:0});}
  for(let i=0;i<60;i++){hero.x+=.1;follow.update(1/60,hero,{yaw:0});}
  assert.ok(trace.every(p=>!blocked(p)));assert.ok(Math.abs(position.x-4.2)<1e-6);assert.ok(Math.abs(position.z-5)<1e-6);assert.equal(follow.state().pose.yaw,0,'strafe retains leader facing instead of turning toward velocity');assert.equal(follow.state().catchups,0);
}
{
  const {hero,position,follow}=fixture();
  for(let i=0;i<600;i++){hero.z+=.1;hero.y=Math.max(0,hero.z-3)*.6;follow.update(1/60,hero,{yaw:0,riding:true,surface:'upper-deck'});}
  assert.ok(Math.abs(position.y-(position.z-3)*.6)<1e-6,'replays stair and platform height without a 1.3m cutoff');assert.equal(follow.state().catchups,0);assert.ok(follow.state().buffered<100);
}
{
  let wall=false;const {hero,position,follow}=fixture({canOccupy:p=>!(wall&&p.z>1&&p.z<2)});
  for(let i=0;i<30;i++){hero.z+=.1;follow.update(1/60,hero,{yaw:0});}
  wall=true;for(let i=0;i<45;i++){hero.z+=.1;follow.update(1/60,hero,{yaw:0});}
  assert.equal(follow.state().catchups,0,'no early teleport when a route first becomes blocked');
  for(let i=0;i<60;i++){hero.z+=.1;follow.update(1/60,hero,{yaw:0});}
  assert.equal(follow.state().catchups,1,'only an actual obstruction held longer than the timeout triggers recovery');assert.ok(hero.z-position.z<3);assert.equal(STUCK_SECONDS,1.25);
}
{
  const {hero,position,follow}=fixture();let peak=0;
  for(let i=0;i<120;i++){const t=i/60;hero.y=t<1?Math.max(0,10*t-10*t*t):0;follow.update(1/60,hero,{yaw:0,airborne:hero.y>.001,airHeight:hero.y,verticalSpeed:10-20*t,groundAt:()=>0});peak=Math.max(peak,position.y);}
  assert.ok(peak>2.4,'a jump in place is copied with a small delay');assert.equal(position.y,0);assert.equal(follow.state().catchups,0);
}
{
  const {hero,position,follow}=fixture();let previous=position.y;
  for(let i=0;i<180;i++){const t=i/60;hero.y=t<1?Math.max(0,10*t-10*t*t):0;if(t<.4)hero.z+=4.6/60;follow.update(1/60,hero,{yaw:0,airborne:hero.y>.001,airHeight:hero.y,verticalSpeed:10-20*t,groundAt:()=>0});assert.ok(Math.abs(position.y-previous)<.3,'stopping mid-jump cannot snap the companion vertically');previous=position.y;}
  assert.equal(position.y,0);assert.equal(follow.state().catchups,0);
}
{
  const {hero,position,follow}=fixture();let previous=position.y;
  for(let i=0;i<150;i++){const t=i/60;hero.y=t<1?Math.max(0,10*t-10*t*t):0;if(t>.4)hero.z+=4.6/60;follow.update(1/60,hero,{yaw:0,airborne:hero.y>.001,airHeight:hero.y,verticalSpeed:hero.y?10-20*t:0,groundAt:()=>0});assert.ok(Math.abs(position.y-previous)<.3,'starting a walk mid-jump keeps vertical playback continuous');previous=position.y;}
  assert.equal(position.y,0);assert.equal(follow.state().catchups,0);
}
{
  const {hero,position,follow}=fixture();
  for(let i=0;i<36000;i++){hero.z+=.025;follow.update(1/60,hero,{yaw:Math.PI});}
  assert.ok(follow.state().buffered<160,'long journeys retain only the route still needed');assert.equal(follow.state().catchups,0);assert.ok(Math.abs(hero.z-position.z-FOLLOW_GAP)<1e-5);
}
{
  const {hero,position,follow}=fixture();for(let i=0;i<24000;i++){hero.z+=.0001;follow.update(1/60,hero,{yaw:0});}
  assert.equal(follow.state().catchups,0,'a small movement speed never triggers a distance/history teleport');assert.ok(follow.state().buffered<100);assert.ok(Math.abs(hero.z-position.z-FOLLOW_GAP)<1e-5);
}
console.log('PASS: continuous 30/60/144fps walking/sprinting, exact trailing distance, corner-safe replay and strafe heading, stairs/elevated paths, delayed jumps, obstruction-only recovery and bounded idle/long-route history.');
