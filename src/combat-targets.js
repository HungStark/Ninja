import {actorHitPadding,actorHitRadius} from './combat-size.js';

export const livingOpponents=(actors,owner)=>actors.filter(a=>a.owner!==owner&&a.fighter.hp>0);
export function impactArea(shot,point,radius,actors,impact,horizontal=true){
  let hits=0;
  for(const actor of livingOpponents(actors,shot.owner)){
    const delta=actor.pos.map((v,i)=>v-point[i]),distance=horizontal?Math.hypot(delta[0],delta[2]):Math.hypot(...delta);
    if(distance<=radius+actorHitPadding(actor)){impact({...shot,victimId:actor.id},point);hits++;}
  }
  return hits;
}
export function impactWave(shot,start,end,actors,intersectsWave,impact){
  if(shot.hitOwner!==shot.owner){shot.hitOwner=shot.owner;shot.hitActors=new Set();}
  let hits=0;
  // A hit never consumes the wave or reduces damage for opponents further along it.
  for(const actor of livingOpponents(actors,shot.owner)){
    const key=actor.id??actor.fighter;
    if(shot.hitActors.has(key)||!intersectsWave(actor.pos,actor.pos,start,end,shot.normal,shot.width,shot.height,actorHitRadius(actor),shot.depth))continue;
    shot.hitActors.add(key);impact({...shot,victimId:actor.id},actor.pos);hits++;
  }
  shot.hitTarget=shot.hitActors.size>0;return hits;
}
