const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Summons and weather keep their own timelines after the caster is free again.
export const GUARDIAN_BACKGROUND_SKILLS=new Set(['fox-firestorm','gold-swords','tiger-blizzard']);
export function guardianCommitment(a){
 const launch=(a.windup||0)+Math.max(0,(a.count||1)-1)*(a.interval||0);
 if(GUARDIAN_BACKGROUND_SKILLS.has(a.type))return Math.min(a.duration,(a.windup||.6)+.3);
 if(['wolf-clones','eagle-tornadoes','shadow-clones','stag-flowers','stag-tree'].includes(a.type))return Math.min(a.duration,(a.windup||.6)+.22);
 if(['fox-pillars','dragon-vortices','wolf-bolts','turtle-pillars','stag-vines','tiger-spikes'].includes(a.type))return Math.min(a.duration,Math.max(.5,(a.warning||.6)*.6));
 if(['fox-homing','eagle-blades','gold-feathers','gold-arcs'].includes(a.type))return Math.min(a.duration,launch+.2);
 return a.duration;
}

// The refuge is close enough to reach during the warning, and every wave has
// a real hole in both its collider and its rendered wall.
export function planGuardianWave(target,bounds,index,parameters){
 const padding=.7,gap=Math.max(4.4,parameters.gapWidth||0),width=Math.min(parameters.waveWidth||18,bounds.maxX-bounds.minX),half=gap/2;
 const safeX=clamp(target[0]+(index%2?-1:1)*2,bounds.minX+half+padding,bounds.maxX-half-padding);
 const centerX=clamp(target[0],bounds.minX+width/2,bounds.maxX-width/2),minZ=Math.max(bounds.minZ,target[2]-7),maxZ=Math.min(bounds.maxZ,target[2]+7);
 const r=Math.min(.55,parameters.radius||.55),start=[centerX,0,minZ-r-1],endZ=maxZ+r+1;
 return {start,direction:[0,0,1],width,gap,gapOffset:safeX-centerX,safeX,endZ,warning:Math.max(.9,parameters.warning||.9),travelTime:(endZ-start[2])/parameters.speed};
}
