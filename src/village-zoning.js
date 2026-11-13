// Shared layout state without scene/model dependencies. Terrain and story
// coordinates read the same pads, including the relocated Fire prison.
const pads=new Map();
export const FIRE_PRISON_SITE={x:-12,z:20};
export const FIRE_MOTHER_SITE={x:2.4,z:17};
export const FIRE_MEDICINE_SITE={x:0,z:25};
export function setVillagePads(id,plots){pads.set(id,plots);}
export function addVillagePads(id,plots){pads.set(id,[...(pads.get(id)||[]),...plots]);}
export function levelVillageTerrain(id,x,z,original){
  let weight=0,total=0,blend=0;
  for(const p of pads.get(id)||[]){
    const dx=Math.max(0,Math.abs(x-p.x)-p.reserveW/2),dz=Math.max(0,Math.abs(z-p.z)-p.reserveD/2),distance=Math.hypot(dx,dz);
    if(distance===0)return p.base;
    if(distance>=12)continue;
    let b=1-distance/12;b=b*b*(3-2*b);const w=b/Math.max(.0001,distance*distance);weight+=w;total+=p.base*w;blend=Math.max(blend,b);
  }
  return weight?original*(1-blend)+total/weight*blend:original;
}
export function insidePlot(plot,x,z,padding=0){return Math.abs(x-plot.x)<(plot.reserveW||plot.w)/2+padding&&Math.abs(z-plot.z)<(plot.reserveD||plot.d)/2+padding;}
