// Distances are measured from release, not from the caster or formation animation.
export const FLIGHT_PROFILE=Object.freeze({launchDistance:2,launchSpeedRatio:.2,burstDuration:.12,peakSpeedRatio:1.8});
const INACTIVE_PHASES=new Set(['forming','staged','emerging','gathering','blooming','charging','descending','ready','striking','fading']);
const clamp=t=>Math.max(0,Math.min(1,t));
export function flightDistanceAt(time,speed){
  if(speed<=0||time<=0)return 0;
  const {launchDistance,launchSpeedRatio,burstDuration,peakSpeedRatio}=FLIGHT_PROFILE,slow=speed*launchSpeedRatio,peak=speed*peakSpeedRatio,launchTime=launchDistance/slow;
  if(time<=launchTime)return slow*time;
  const t=time-launchTime;
  if(t<burstDuration){const u=t/burstDuration;return launchDistance+slow*t+(peak-slow)*burstDuration*(u**3-.5*u**4);}
  return launchDistance+(slow+peak)*burstDuration/2+peak*(t-burstDuration);
}
export function flightSpeedRatio(time,speed){
  if(speed<=0)return 1;
  const {launchDistance,launchSpeedRatio,burstDuration,peakSpeedRatio}=FLIGHT_PROFILE,u=clamp((time-launchDistance/(speed*launchSpeedRatio))/burstDuration);
  return launchSpeedRatio+(peakSpeedRatio-launchSpeedRatio)*u*u*(3-2*u);
}
export function flightTimeAt(distance,speed){
  if(speed<=0||distance<=0)return 0;
  let low=0,high=distance/(speed*FLIGHT_PROFILE.launchSpeedRatio)+FLIGHT_PROFILE.burstDuration;
  for(let i=0;i<40;i++){const mid=(low+high)/2;if(flightDistanceAt(mid,speed)<distance)low=mid;else high=mid;}
  return (low+high)/2;
}
export function projectileMotionStep(shot,dt,fields,fieldStep){
  // travelTime scales the stored cruise velocity; motionTime is the launch clock.
  const speed=Math.hypot(...shot.v),time=shot.motionTime||0;
  const inactive=INACTIVE_PHASES.has(shot.phase);
  const profiled=shot.element!=='weapon'&&speed>0;
  if(dt<=0||speed<=0||inactive)return {travelTime:0,motionTime:time,distance:0,slowFactor:1,speedRatio:profiled?flightSpeedRatio(time,speed):1};
  const before=profiled?flightDistanceAt(time,speed):speed*time;
  const distance=profiled?flightDistanceAt(time+dt,speed)-before:speed*dt;
  const average=shot.v.map(v=>v*distance/(speed*dt));
  const field=fieldStep(shot.p,average,dt,shot.owner,fields),next=time+field.travelTime;
  const travelled=profiled?flightDistanceAt(next,speed)-before:speed*field.travelTime;
  return {travelTime:travelled/speed,motionTime:next,distance:travelled,slowFactor:field.slowFactor,speedRatio:profiled?flightSpeedRatio(next,speed):1};
}
