import {flightDistanceAt,flightTimeAt} from './projectile-motion.js';
import {STEP_DISTANCE,DASH_DISTANCE,DASH_DURATION} from './dash-boost.js';
import {ENEMY_MOVE_MULTIPLIER} from './game-pace.js';
export const ENEMY_DASH_COOLDOWN=10;
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
export function defensivePosition(position,walls=[],optics=[],attacker=[0,1.72,7],bounds){
  const candidates=[...walls.filter(w=>w.owner==='enemy'&&w.hp>0&&w.life>0).map(w=>({p:w.p,normal:w.normal,gap:3})),...optics.filter(o=>o.owner==='enemy'&&o.life>0&&(o.kind==='sphere'||o.kind==='mirror'&&o.hp>0)).map(o=>({p:o.center,normal:o.normal,gap:o.kind==='sphere'?o.radius+1.2:2.5}))];
  let best=null;
  for(const cover of candidates){
    const dx=attacker[0]-cover.p[0],dz=attacker[2]-cover.p[2],len=Math.hypot(dx,dz)||1,n=cover.normal||[dx/len,0,dz/len];
    // Frontal walls/mirrors only work on their outward side.
    if(dx*n[0]+dz*n[2]<=0)continue;
    const goal=[cover.p[0]-n[0]*cover.gap,position[1],cover.p[2]-n[2]*cover.gap];
    if((bounds?goal[0]<bounds.minX||goal[0]>bounds.maxX||goal[2]<bounds.minZ||goal[2]>bounds.maxZ:Math.abs(goal[0])>ENEMY_MOVEMENT_LIMIT)||Math.hypot(goal[0]-position[0],goal[2]-position[2])>9)continue;
    const distance=Math.hypot(goal[0]-position[0],goal[2]-position[2]);if(!best||distance<best.distance)best={goal,distance};
  }
  return best?.goal||null;
}
export function unblockableThreat(shots,position){
  return shots.find(s=>s.owner==='player'&&s.life>0&&['meteor','thunder','jacob','earthspikes','earthquake'].includes(s.style)&&Math.hypot((s.target||s.p)[0]-position[0],(s.target||s.p)[2]-position[2])<(s.blastRadius||s.radius||3.5)+.8);
}
export function createEnemyMovement(random=Math.random){
  const choose=()=>random()<.5?-1:1;
  let direction=choose(),directionTime=ENEMY_DIRECTION_INTERVAL,velocity=0,mode='circling',target=direction*ENEMY_MOVEMENT_LIMIT;
  let targetPoint=null,region=null,velocity2d=[0,0];
  let dashCooldown=0,dashing=0,dashUses=0,dashDirection=[0,0,0];
  function freeMove(dt,{position,bounds,moveSpeed,heavy,slow,constrain,cover,danger,frontGuard}){
    const limit=p=>[clamp(p[0],bounds.minX,bounds.maxX),position[1],clamp(p[2],bounds.minZ,bounds.maxZ)],distance=p=>Math.hypot(p[0]-position[0],p[2]-position[2]);
    const key=[bounds.minX,bounds.maxX,bounds.minZ,bounds.maxZ].join(':');
    if(region!==key){region=key;targetPoint=null;}
    if(frontGuard&&!danger){mode='sheltering';targetPoint=null;target=position[0];return position;}
    if(cover&&!danger){mode='sheltering';targetPoint=limit(cover);}
    else if(danger){
      mode='evading';const center=danger.target||danger.p,radius=(danger.blastRadius||danger.radius||3.5)+1;
      const candidates=Array.from({length:8},(_,i)=>limit([center[0]+Math.cos(i*Math.PI/4)*radius,position[1],center[2]+Math.sin(i*Math.PI/4)*radius]));
      candidates.sort((a,b)=>{const da=Math.hypot(a[0]-center[0],a[2]-center[2]),db=Math.hypot(b[0]-center[0],b[2]-center[2]),safeA=da>=radius-1e-6,safeB=db>=radius-1e-6;return safeA!==safeB?safeA?-1:1:safeA?distance(a)-distance(b):db-da;});targetPoint=candidates[0];
    }else{
      if(mode!=='patrolling')targetPoint=null;
      mode='patrolling';
      if(!targetPoint||directionTime<=1e-8||distance(targetPoint)<.1){
        targetPoint=limit([bounds.minX+random()*(bounds.maxX-bounds.minX),position[1],bounds.minZ+random()*(bounds.maxZ-bounds.minZ)]);
        if(distance(targetPoint)<.5)targetPoint=[position[0]<(bounds.minX+bounds.maxX)/2?bounds.maxX:bounds.minX,position[1],position[2]<(bounds.minZ+bounds.maxZ)/2?bounds.maxZ:bounds.minZ];
        directionTime=ENEMY_DIRECTION_INTERVAL;
      }
      directionTime=Math.max(0,directionTime-dt);
    }
    target=targetPoint[0];const length=distance(targetPoint),step=Math.min(length,Math.max(0,dt)*moveSpeed*(heavy?.8:1)*clamp(slow,0,1));
    const next=length>1e-8?limit(constrain([position[0]+(targetPoint[0]-position[0])*step/length,position[1],position[2]+(targetPoint[2]-position[2])*step/length])):position;
    velocity2d=dt>0?[(next[0]-position[0])/dt,(next[2]-position[2])/dt]:[0,0];velocity=velocity2d[0];direction=Math.sign(velocity)||direction;
    if(step>0&&Math.hypot(next[0]-position[0],next[2]-position[2])<1e-6)targetPoint=null;
    return next;
  }
  const controller={
    reset(x=0){direction=choose();directionTime=ENEMY_DIRECTION_INTERVAL;velocity=0;velocity2d=[0,0];targetPoint=null;region=null;mode='circling';target=direction*ENEMY_MOVEMENT_LIMIT;dashCooldown=dashing=dashUses=0;},
    walk(dt,{position,heavy=false,blocked=false,slow=1,constrain=p=>p,shots=[],walls=[],optics=[],attacker,frontGuard=false,bounds=null,moveSpeed=STEP_DISTANCE/STEP_DURATION,moveMultiplier=ENEMY_MOVE_MULTIPLIER}){
      velocity=0;velocity2d=[0,0];
      if(blocked){mode='idle';target=position[0];return position;}
      const cover=defensivePosition(position,walls,optics,attacker,bounds),danger=unblockableThreat(shots,position);
      if(bounds)return freeMove(dt,{position,bounds,moveSpeed:moveSpeed*moveMultiplier,heavy,slow,constrain,cover,danger,frontGuard});
      if(frontGuard&&!danger){mode='sheltering';target=position[0];return position;}
      if(cover&&!danger){
        mode='sheltering';target=cover[0];const distance=Math.hypot(cover[0]-position[0],cover[2]-position[2]),step=Math.min(distance,dt*4*ENEMY_MOVE_MULTIPLIER*clamp(slow,0,1));
        const next=distance>.04?constrain([position[0]+(cover[0]-position[0])*step/distance,position[1],position[2]+(cover[2]-position[2])*step/distance]):position;
        velocity=dt>0?(next[0]-position[0])/dt:0;return next;
      }
      if(danger){
        mode='evading';const center=(danger.target||danger.p)[0],radius=(danger.blastRadius||danger.radius||3.5)+1;
        const left=center-radius,right=center+radius;target=left>=-ENEMY_MOVEMENT_LIMIT&&(right>ENEMY_MOVEMENT_LIMIT||Math.abs(position[0]-left)<Math.abs(position[0]-right))?left:clamp(right,-ENEMY_MOVEMENT_LIMIT,ENEMY_MOVEMENT_LIMIT);
        const next=constrain([position[0]+clamp(target-position[0],-dt*5.8*ENEMY_MOVE_MULTIPLIER*slow,dt*5.8*ENEMY_MOVE_MULTIPLIER*slow),position[1],position[2]]);velocity=dt>0?(next[0]-position[0])/dt:0;return next;
      }
      mode='circling';
      const speed=moveSpeed*moveMultiplier*(heavy?.8:1)*clamp(slow,0,1);
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
    state:()=>({mode,target,targetPoint:targetPoint&&[...targetPoint],velocity2d:[...velocity2d],direction,directionTime,velocity,dodges:dashUses,reaction:0,cooldown:dashCooldown,stepDistance:STEP_DISTANCE,stepDuration:STEP_DURATION,dashBoost:{ready:0,cooldown:dashCooldown,dashing,uses:dashUses}})
  };
  return {reset:controller.reset,state:controller.state,update(dt,options){
    const {position,blocked=false,dashBlocked=false,casting=false,slow=1,shots=[],bounds,frontGuard=false,constrain=p=>p}=options;
    dt=Math.max(0,dt);dashCooldown=Math.max(0,dashCooldown-dt);
    if(blocked||dashBlocked||slow<=0)dashing=0;
    const threat=incomingThreat(shots,position),danger=unblockableThreat(shots,position);
    if(!blocked&&!dashBlocked&&!casting&&slow>0&&dashCooldown<=1e-8&&(danger||threat)&&(!frontGuard||danger)){
      let dx=direction,dz=0;
      if(bounds){
        if(danger){const center=danger.target||danger.p;dx=position[0]-center[0];dz=position[2]-center[2];}
        else{dx=-threat.shot.v[2];dz=threat.shot.v[0];}
        if(Math.hypot(dx,dz)<.001){dx=direction;dz=0;}
      }
      const length=Math.hypot(dx,dz)||1;dx/=length;dz/=length;
      const limit=p=>[clamp(p[0],bounds?.minX??-ENEMY_MOVEMENT_LIMIT,bounds?.maxX??ENEMY_MOVEMENT_LIMIT),p[1],bounds?clamp(p[2],bounds.minZ,bounds.maxZ):position[2]];
      const candidates=[1,-1].map(side=>{const goal=limit(constrain([position[0]+dx*DASH_DISTANCE*side,position[1],position[2]+dz*DASH_DISTANCE*side]));return {goal,d:Math.hypot(goal[0]-position[0],goal[2]-position[2])};}).sort((a,b)=>b.d-a.d);
      if(candidates[0].d>.5){const {goal,d}=candidates[0];dashDirection=[(goal[0]-position[0])/d,0,(goal[2]-position[2])/d];dashing=DASH_DURATION;dashCooldown=ENEMY_DASH_COOLDOWN;dashUses++;}
    }
    if(dashing>0){
      mode='dashing';const step=Math.min(dt,dashing),travel=DASH_DISTANCE/DASH_DURATION*step*clamp(slow,0,1);
      const goal=constrain([clamp(position[0]+dashDirection[0]*travel,bounds?.minX??-ENEMY_MOVEMENT_LIMIT,bounds?.maxX??ENEMY_MOVEMENT_LIMIT),position[1],bounds?clamp(position[2]+dashDirection[2]*travel,bounds.minZ,bounds.maxZ):position[2]]);
      dashing=Math.max(0,dashing-dt);velocity2d=dt>0?[(goal[0]-position[0])/dt,(goal[2]-position[2])/dt]:[0,0];velocity=velocity2d[0];return goal;
    }
    return controller.walk(dt,options);
  }};
}
