const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const alive=a=>a.id!=null&&a.fighter?.hp>0&&a.pos?.length===3&&a.pos.every(Number.isFinite);

// Remember the actor under the original aim, rather than acquiring a new target during the salvo.
export function captureVolleyAim(origin,direction,point,actors,{pointAim=false}={}){
  const candidates=actors.filter(alive).map(actor=>{
    const delta=sub(actor.pos,origin),along=dot(delta,direction),offset=pointAim?sub(actor.pos,point):delta.map((v,i)=>v-direction[i]*along);
    return {actor,along,miss:Math.hypot(...offset)};
  }).filter(hit=>hit.along>0&&hit.miss<.65).sort((a,b)=>a.along-b.along);
  return {target:[...point],aimedTargetId:candidates[0]?.actor.id??null};
}

// Called once per projectile, at release. Flying projectiles never revisit this target.
export function refreshVolleyLaunchTarget(shot,actors){
  const actor=actors.find(a=>a.id===shot.aimedTargetId&&alive(a));
  if(actor)shot.target=[...actor.pos];
  return shot.target;
}
