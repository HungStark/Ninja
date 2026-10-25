// A staged fight in exploration; it never applies combat damage or rewards.
export function updateIntroSkirmish(fighters,time,floor){
  const turn=time/1.3,attacker=Math.floor(turn)%3,defender=(attacker+1)%3,phase=turn%1;
  const reach=Math.sin(Math.PI*Math.max(0,Math.min(1,(phase-.12)/.72)));
  for(let i=0;i<fighters.length;i++){
    const fighter=fighters[i],target=fighters[i===attacker?defender:attacker],dx=target.x-fighter.x,dz=target.z-fighter.z,length=Math.hypot(dx,dz)||1;
    const attack=i===attacker?reach:0,block=i===defender?reach:0,step=attack*.95-block*.22;
    const x=fighter.x+dx/length*step,z=fighter.z+dz/length*step;
    fighter.char.root.position.set(x,floor(x,z),z);fighter.char.root.rotation.y=Math.atan2(dx,dz);
    fighter.char.combatPose(attack,block,Math.sin(time*5+i)*.06);
    fighter.action=i===attacker?'strike':i===defender?'block':'ready';fighter.target=i===attacker?defender:attacker;
  }
}
