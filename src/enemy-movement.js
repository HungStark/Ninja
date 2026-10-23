import {flightDistanceAt,flightTimeAt} from './projectile-motion.js';
import {createDashBoost,STEP_DISTANCE,STEP_DURATION,DASH_DISTANCE,DASH_DURATION} from './dash-boost.js';
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

export function createEnemyMovement(random=Math.random){
  const boost=createDashBoost();
  let target=0,cooldown=0,reaction=0,pending=null,idle=1.5,mode='idle',direction=1,velocity=0,dodges=0;
  return {
    reset(x=0){boost.reset();target=x;cooldown=0;reaction=0;pending=null;idle=1.5;mode='idle';direction=1;velocity=0;dodges=0;},
    update(dt,{position,shots=[],beginner=false,heavy=false,blocked=false,casting=false,slow=1,constrain=p=>p}){
      velocity=0;
      if(blocked){boost.cancelDash();boost.tick(dt);pending=null;target=position[0];mode='idle';return position;}
      cooldown=Math.max(0,cooldown-dt);idle-=dt;
      const threat=incomingThreat(shots,position);
      if(!pending&&cooldown<=0&&threat){pending=threat.shot;reaction=beginner?.32:.18;mode='reacting';}
      if(pending){
        reaction-=dt;
        if(!shots.includes(pending)){pending=null;mode='idle';}
        else if(reaction<=0){
          const prediction=incomingThreat([pending],position);
          if(prediction){
            // Use the same G charge, 2 m dash and 12 s cooldown as the player.
            const enhanced=boost.arm()&&boost.consume(),distance=enhanced?DASH_DISTANCE:STEP_DISTANCE;
            // Prefer moving away from the line of fire, and turn inward at arena edges.
            direction=Math.abs(position[0]-prediction.x)>.08?Math.sign(position[0]-prediction.x):direction;
            if(Math.abs(position[0]+direction*distance)>5.3)direction*=-1;
            target=clamp(position[0]+direction*distance,-5.3,5.3);mode='dodging';dodges++;
          }else mode='idle';
          pending=null;cooldown=beginner?2.6:1.5;idle=2+random();
        }
      }
      if(!pending&&mode!=='dodging'&&idle<=0){
        direction=position[0]>.8?-1:position[0]<-.8?1:-direction;
        target=clamp(position[0]+direction*(.8+random()*.4),-5.3,5.3);mode='circling';idle=2.4+random()*1.8;
      }
      if(['dodging','circling'].includes(mode)){
        const dashing=boost.state().dashing,speed=dashing>0?DASH_DISTANCE/DASH_DURATION:(STEP_DISTANCE/STEP_DURATION)*(heavy?.8:1)*clamp(slow,0,1),travel=speed*(dashing>0?Math.min(dt,dashing):dt);
        const x=position[0]+clamp(target-position[0],-travel,travel),next=constrain([x,position[1],position[2]]);
        velocity=dt>0?(next[0]-position[0])/dt:0;
        if(Math.abs(target-next[0])<1e-6||Math.abs(x-position[0])>.001&&Math.abs(velocity)<.01){mode='idle';target=next[0];boost.cancelDash();}
        boost.tick(dt);
        return next;
      }
      boost.tick(dt);return position;
    },
    state:()=>({mode,target,velocity,dodges,reaction,cooldown,stepDistance:STEP_DISTANCE,stepDuration:STEP_DURATION,dashBoost:boost.state()})
  };
}
