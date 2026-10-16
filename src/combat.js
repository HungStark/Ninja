// Spend only the damage needed to break a defense; preserve the remainder.
export function absorbDurability(defense,damage,key='hp'){
  const incoming=Math.max(0,damage||0),absorbed=Math.min(Math.max(0,defense[key]||0),incoming);
  defense[key]=Math.max(0,(defense[key]||0)-absorbed);
  return {absorbed,remaining:Math.max(0,incoming-absorbed),broken:defense[key]<=1e-7};
}

export function crossWalls(shot,walls,intersect,onHit=()=>{}){
  const hits=walls.filter(w=>w.hp>0&&w.owner!==shot.owner).map(w=>({wall:w,point:intersect(shot.old,shot.p,w)})).filter(h=>h.point);
  const distance=p=>Math.hypot(...p.map((v,i)=>v-shot.old[i]));hits.sort((a,b)=>distance(a.point)-distance(b.point));
  for(const {wall,point} of hits){
    if(wall.hp<=0)continue;
    const result=absorbDurability(wall,shot.damage);shot.damage=result.remaining;onHit(wall,point,result);
    if(shot.damage<=1e-7)return true;
  }
  return false;
}
