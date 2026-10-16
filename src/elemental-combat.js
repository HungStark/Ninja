// Magnetic attraction changes direction, never nominal speed or acceleration age.
export function aimMagneticShots(shots,actors){
  for(const shot of shots){
    if(shot.element!=='lightning'||shot.hitTarget)continue;
    const victim=actors.find(a=>a.owner!==shot.owner);
    if(!victim?.fighter.magneticActive)continue;
    if(shot.style==='thunder'){
      shot.target=[victim.pos[0],.08,victim.pos[2]];
      shot.cloudPoint=[victim.pos[0],44,victim.pos[2]];shot.p=[...shot.cloudPoint];
      continue;
    }
    const speed=Math.hypot(...shot.v);if(!speed)continue;
    const delta=victim.pos.map((p,i)=>p-shot.p[i]),distance=Math.hypot(...delta);if(distance<1e-8)continue;
    shot.v=delta.map(d=>d/distance*speed);shot.target=[...victim.pos];
  }
}
