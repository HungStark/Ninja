import {actorHitRadius} from './combat-size.js';
import {captureVolleyAim} from './fire-volley-targeting.js';
const alive=actor=>actor?.id!=null&&actor.fighter?.hp>0&&actor.pos?.length===3&&actor.pos.every(Number.isFinite);

export function selectShurikenTarget(origin,direction,point,actors,{pointAim=false,designatedId=null}={}){
  const targets=actors.filter(alive),designated=targets.find(actor=>actor.id===designatedId);
  if(designated)return designated;
  if(pointAim){
    let selected=null,miss=Infinity;
    for(const actor of targets){const distance=Math.hypot(actor.pos[0]-point[0],actor.pos[2]-point[2]);if(distance<actorHitRadius(actor,.8)&&distance<miss){selected=actor;miss=distance;}}
    return selected;
  }
  const {aimedTargetId}=captureVolleyAim(origin,direction,point,targets);
  return targets.find(actor=>actor.id===aimedTargetId)||null;
}

export function steerShuriken(shot,actors){
  if(shot.style!=='shuriken'||shot.phase!=='flying')return false;
  if(shot.homingOwner!==shot.owner){shot.homingTargetId=shot.owner==='enemy'?'player':shot.sourceId||'primary';shot.homingOwner=shot.owner;}
  if(shot.homingTargetId==null)return false;
  const target=actors.find(actor=>actor.id===shot.homingTargetId&&actor.owner!==shot.owner&&alive(actor));
  if(!target){shot.homingTargetId=null;return false;}
  const dx=target.pos[0]-shot.p[0],dy=target.pos[1]-shot.p[1],dz=target.pos[2]-shot.p[2],distance=Math.hypot(dx,dy,dz),speed=Math.hypot(...shot.v);
  shot.target=[...target.pos];if(distance<1e-8||!speed)return false;
  shot.v=[dx/distance*speed,dy/distance*speed,dz/distance*speed];return true;
}
