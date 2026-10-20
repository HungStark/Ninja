export const HIDDEN_GUARD_COUNT=8;
export const GUARDIAN_GUARD_COUNT=2;
export const MIN_GUARD_SPACING=15;

// Resolve against the finished map. Reserve even defeated guards' home slots so
// surviving guards do not move closer together when a previous one disappears.
export function placeVillageGuards(definitions,{limit,boss,valid,heightAt}){
  const placed=[],positions=new Map();
  const order=[...definitions].sort((a,b)=>(b.guardRole==='guardian')-(a.guardRole==='guardian'));
  for(const entry of order){
    const standing=entry.guardRole==='guardian';
    const accepts=(x,z)=>{
      if(Math.abs(x)>limit-3||Math.abs(z)>limit-3)return false;
      const distance=Math.hypot(x-boss.x,z-boss.z);
      if(standing?(distance<9||distance>28):distance<25)return false;
      if(placed.some(p=>Math.hypot(x-p.x,z-p.z)<MIN_GUARD_SPACING+.05))return false;
      const y=heightAt(x,z);return Number.isFinite(y)&&valid(x,z,y);
    };
    let chosen;
    for(const radius of [0,2,4,6,9,13,18,24,32]){
      for(let k=0;k<(radius?32:1);k++){const a=k*Math.PI/16,x=entry.x+Math.sin(a)*radius,z=entry.z+Math.cos(a)*radius;if(accepts(x,z)){chosen={x,z,y:heightAt(x,z)};break;}}
      if(chosen)break;
    }
    if(!chosen){
      const grid=[];for(let x=-limit+4;x<=limit-4;x+=4)for(let z=-limit+4;z<=limit-4;z+=4)grid.push({x,z,d:(x-entry.x)**2+(z-entry.z)**2});
      grid.sort((a,b)=>a.d-b.d);const point=grid.find(p=>accepts(p.x,p.z));if(point)chosen={x:point.x,z:point.z,y:heightAt(point.x,point.z)};
    }
    if(!chosen)throw new Error('No safe guard placement: '+entry.id);
    positions.set(entry.id,chosen);placed.push(chosen);
  }
  return positions;
}
