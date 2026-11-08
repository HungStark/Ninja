import {flightDistanceAt,flightTimeAt} from './projectile-motion.js';
import {STEP_DISTANCE} from './dash-boost.js';
const STEP_DURATION=.2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Predict only released, approaching projectiles. A wide wave still needs a defense.
export function incomingThreat(shots,position,horizon=1.3){
  let nearest=null;
  for(const shot of shots){
    if(shot.owner!=='player'||(shot.phase&&shot.phase!=='flying')||!shot.v||['tsunami','thunder','jacob','meteor','boat'].includes(shot.style))continue;
    const speed2=shot.v.reduce((n,v)=>n+v*v,0);if(speed2<1)continue;
    const along=position.reduce((n,v,i)=>n+(v-shot.p[i])*shot.v[i],0)/speed2;
    if(along<=0)continue;
    const speed=Math.sqrt(speed2),clock=shot.motionTime||0;
    const t=(shot.element==='weapon'?along:flightTimeAt(flightDistanceAt(clock,speed)+along*speed,speed)-clock)/(shot.slowFactor||1);
    if(t>horizon||shot.life<t)continue;
    const impact=shot.p.map((v,i)=>v+shot.v[i]*along),radius=.54+(shot.size||.1);
    if(Math.hypot(...impact.map((v,i)=>v-position[i]))>radius+.2)continue;
    if(!nearest||t<nearest.time)nearest={shot,time:t,x:impact[0],radius};
  }
  return nearest;
}

export const ENEMY_DIRECTION_INTERVAL=2,ENEMY_MOVEMENT_LIMIT=5.3;
export function createEnemyMovement(random=Math.random){
  const choose=()=>random()<.5?-1:1;
  let direction=choose(),directionTime=ENEMY_DIRECTION_INTERVAL,velocity=0,mode='circling',target=direction*ENEMY_MOVEMENT_LIMIT;
  return {
    reset(x=0){direction=choose();directionTime=ENEMY_DIRECTION_INTERVAL;velocity=0;mode='circling';target=direction*ENEMY_MOVEMENT_LIMIT;},
    update(dt,{position,heavy=false,blocked=false,slow=1,constrain=p=>p}){
      velocity=0;
      if(blocked){mode='idle';target=position[0];return position;}
      mode='circling';
      const speed=(STEP_DISTANCE/STEP_DURATION)*(heavy?.8:1)*clamp(slow,0,1);
      let remaining=dt,x=clamp(position[0],-ENEMY_MOVEMENT_LIMIT,ENEMY_MOVEMENT_LIMIT);
      while(remaining>1e-8){
        if(directionTime<=1e-8){direction=choose();directionTime=ENEMY_DIRECTION_INTERVAL;}
        if(x>=ENEMY_MOVEMENT_LIMIT-1e-8&&direction>0||x<=-ENEMY_MOVEMENT_LIMIT+1e-8&&direction<0)direction*=-1;
        const edge=direction*ENEMY_MOVEMENT_LIMIT,edgeTime=speed>0?Math.abs(edge-x)/speed:Infinity,step=Math.min(remaining,directionTime,edgeTime);
        const next=constrain([x+direction*speed*step,position[1],position[2]]);
        x=clamp(next[0],-ENEMY_MOVEMENT_LIMIT,ENEMY_MOVEMENT_LIMIT);remaining-=step;directionTime=Math.max(0,directionTime-step);
        if(Math.abs(x)>=ENEMY_MOVEMENT_LIMIT-1e-8&&Math.sign(x)===direction)direction*=-1;
        if(directionTime<=1e-8){direction=choose();directionTime=ENEMY_DIRECTION_INTERVAL;}
        if(Math.abs(x)>=ENEMY_MOVEMENT_LIMIT-1e-8&&Math.sign(x)===direction)direction*=-1;
      }
      target=direction*ENEMY_MOVEMENT_LIMIT;velocity=dt>0?(x-position[0])/dt:0;
      return [x,position[1],position[2]];
    },
    state:()=>({mode,target,direction,directionTime,velocity,dodges:0,reaction:0,cooldown:0,stepDistance:STEP_DISTANCE,stepDuration:STEP_DURATION,dashBoost:{ready:0,cooldown:0,dashing:0,uses:0}})
  };
}
