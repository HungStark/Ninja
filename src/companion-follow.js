// Replay the leader's route by travelled distance. Keep every corner and height
// change, and consume as many samples as necessary each frame (including sprint).
export const FOLLOW_GAP=1.8,STUCK_SECONDS=1.25;
export function createCompanionFollow({position,canOccupy=()=>true,safePoint=p=>p,gap=FOLLOW_GAP}){
  let samples=[],cursor=0,total=0,clock=0,stuck=0,catchups=0,moving=false,lastHero=null,pose={},discontinuous=false;
  const copy=(p,meta={})=>({x:p.x,y:p.y,z:p.z,yaw:meta.yaw||0,airborne:!!meta.airborne,sprinting:!!meta.sprinting,surface:meta.surface||null,riding:!!meta.riding,airHeight:meta.airHeight||0,verticalSpeed:meta.verticalSpeed||0,time:clock,s:total});
  const mix=(a,b,t)=>({...a,x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t,yaw:a.yaw+Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw))*t,airHeight:a.airHeight+(b.airHeight-a.airHeight)*t,verticalSpeed:a.verticalSpeed+(b.verticalSpeed-a.verticalSpeed)*t,s:a.s+(b.s-a.s)*t});
  function at(s){let i=1;while(i<samples.length-1&&samples[i].s<s-1e-8)i++;const a=samples[i-1],b=samples[i]||a;return mix(a,b,b.s>a.s?Math.max(0,Math.min(1,(s-a.s)/(b.s-a.s))):1);}
  function reset(hero,meta={}){
    clock=0;cursor=0;stuck=0;moving=false;discontinuous=false;total=Math.hypot(hero.x-position.x,hero.z-position.z,meta.riding?hero.y-position.y:0);
    samples=[{...copy(position,meta),s:0},copy(hero,meta)];lastHero=copy(hero,meta);pose=copy(position,meta);
  }
  function update(dt,hero,meta={}){
    if(!lastHero)reset(hero,meta);moving=false;if(dt<=0)return result({x:0,y:0,z:0});clock+=dt;
    // Ladders need vertical route distance; horizontal-only samples leave the
    // companion at the foot of a straight rope ladder while the hero climbs.
    const before={x:position.x,y:position.y,z:position.z},travel=Math.hypot(hero.x-lastHero.x,hero.z-lastHero.z,meta.riding||lastHero.riding?hero.y-lastHero.y:0);
    if(travel>Math.max(10,dt*60))discontinuous=true;
    total+=travel;const recorded=copy(hero,meta);samples.push(recorded);lastHero=recorded;
    const desired=Math.max(0,total-gap);let blocked=discontinuous,recovered=false;
    while(!blocked&&cursor<desired-1e-7){
      // Stop at each recorded corner, even when one frame covers many points.
      const next=samples.find(p=>p.s>cursor+1e-7),end=Math.min(desired,cursor+.12,next?.s??desired),target=at(end);
      const verticalStep=Math.max(12,Math.abs(meta.verticalSpeed||0),Math.abs(target.verticalSpeed))*dt,y=Math.max(before.y-verticalStep,Math.min(before.y+verticalStep,target.y));
      if(Math.abs(y-target.y)>1e-7){target.y=y;target.airborne=true;target.verticalSpeed=(y-before.y)/dt;}
      if(!canOccupy(target)){blocked=true;break;}
      Object.assign(position,{x:target.x,y:target.y,z:target.z});pose=target;cursor=end;
    }
    // A jump in place has no horizontal distance to replay. Mirror its height
    // with a short delay while preserving the trailing position on the ground.
    const recent=samples.filter(p=>p.time<=clock-.2),delayed=recent.at(-1);
    if(delayed&&total-delayed.s<.03&&travel<.001&&meta.groundAt){
      const target={...pose,x:position.x,y:position.y,z:position.z,yaw:delayed.yaw,sprinting:false};
      if(delayed.airborne){
        const wanted=meta.groundAt(position.x,position.z,position.y)+delayed.airHeight,step=Math.max(12,Math.abs(delayed.verticalSpeed))*dt;
        target.y+=Math.max(-step,Math.min(step,wanted-position.y));target.airborne=true;target.verticalSpeed=delayed.verticalSpeed;
      }else if(pose.airborne){
        const ground=meta.groundAt(position.x,position.z,position.y);target.verticalSpeed=Math.min(0,pose.verticalSpeed)-20*dt;target.y=Math.max(ground,position.y+target.verticalSpeed*dt);target.airborne=target.y>ground+.01;
      }
      if(canOccupy(target)){position.y=target.y;pose=target;}
    }
    const progressed=Math.hypot(position.x-before.x,position.y-before.y,position.z-before.z);
    if(blocked&&progressed<.01)stuck+=dt;else stuck=0;
    if(stuck>=STUCK_SECONDS){
      const target=at(desired),safe=canOccupy(target)?target:safePoint({...hero,yaw:meta.yaw});
      if(safe&&canOccupy({...meta,...safe})){Object.assign(position,{x:safe.x,y:safe.y,z:safe.z});catchups++;recovered=true;reset(hero,meta);}
    }
    // Keep the unconsumed route. If geometry changed and blocks it, recovery
    // above runs first; do not silently discard the route and cut a corner.
    while(samples.length>2&&samples[1].s<cursor-.01&&samples[1].time<clock-.5)samples.shift();
    for(let i=samples.length-2;i>0;i--){
      const a=samples[i-1],b=samples[i],c=samples[i+1];if(b.time>=clock-.5)continue;
      if(b.s===a.s){samples.splice(i,1);continue;}
      if(c.s<=a.s||['airborne','sprinting','surface','riding'].some(k=>a[k]!==b[k]||b[k]!==c[k])||Math.abs(a.yaw-b.yaw)+Math.abs(b.yaw-c.yaw)>.001)continue;
      const t=(b.s-a.s)/(c.s-a.s);
      if(Math.hypot(b.x-a.x-(c.x-a.x)*t,b.y-a.y-(c.y-a.y)*t,b.z-a.z-(c.z-a.z)*t)<1e-7)samples.splice(i,1);
    }
    const velocity=recovered?{x:0,y:0,z:0}:{x:(position.x-before.x)/dt,y:(position.y-before.y)/dt,z:(position.z-before.z)/dt};moving=Math.hypot(velocity.x,velocity.z)>.02;
    return result(velocity);
  }
  const result=velocity=>({moving,velocity,pose,catchups,stuck,buffered:samples.length,cursor,total});
  return {reset,update,state:()=>result({x:0,y:0,z:0})};
}
