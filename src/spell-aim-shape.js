// Shared ground silhouette for player aiming and ninja pre-launch warnings.
export function spellAimShape(spell,position,cursor,target=cursor){
  const dx=cursor[0]-position[0],dz=cursor[2]-position[2],length=Math.hypot(dx,dz),direction=length>.001?[dx/length,0,dz/length]:[0,0,-1];
  const self=['domain','shadowclone','shadowdive','snowstorm','icefog','flowerpoison'].includes(spell.style);
  const wall=['firewall','waterwall','windwall','icewall','earthwall','lightmirror'].includes(spell.style);
  const area=['meteor','thunder','jacob','waterbubbles','shadowbind','lightdome','earthgravity','earthquake','earthcraterspikes','stormfield','lightsphere','ignite','discharge','woodseed','aircombo'].includes(spell.style);
  const fixed=spell.style==='lightmirror'?2.4:spell.style==='icewall'?3.2:wall?3:spell.style==='stormfield'?4:spell.style==='lightsphere'?3:null;
  const center=self?[...position]:fixed!==null?[position[0]+direction[0]*fixed,0,position[2]+direction[2]*fixed]:area?[...target]:[position[0]+direction[0]*31,0,position[2]+direction[2]*31];
  const radius=spell.style==='lightsphere'?.8:spell.blastRadius||spell.domeRadius||spell.fieldRadius||spell.radius||spell.domainRadius||2.2;
  return {kind:self||area?'area':wall?'wall':'direction',self,position,center,direction,width:wall?(spell.wallWidth||spell.width||4):Math.max(.22,spell.waveWidth||((spell.size||.25)*2)),radius};
}
