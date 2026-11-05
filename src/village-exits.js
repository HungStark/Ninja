import {travelKind} from './village-travel.js';
import {regionMetrics} from './adventure-world.js';
import {planVillageCivic,civicGatePosition} from './village-civic.js';
import {insidePlot} from './village-zoning.js';

// Shared by scene construction and arrivals: neighboring ferry routes need distinct berths.
export function planVillageExits(v,lookup){
  const layout=planVillageCivic(v.id),metrics=regionMetrics(v.id),exits=v.links.map(id=>{
    const other=lookup(id),angle=Math.atan2(other.x-v.x,other.y-v.y),p=layout?civicGatePosition(layout,angle):{x:Math.sin(angle)*metrics.gateRadius,z:Math.cos(angle)*metrics.gateRadius};
    return {kind:travelKind(v.id,id),id,...p,label:other.name,angle};
  });
  const occupied=exits.filter(e=>e.kind==='gate');
  for(const exit of exits.filter(e=>e.kind==='dock')){
    let chosen=null;
    search:for(let step=0;step<=180;step+=3)for(const side of step?[-1,1]:[1]){
      const angle=exit.angle+side*step*Math.PI/180,dx=Math.sin(angle),dz=Math.cos(angle),radius=(metrics.limit-22)/Math.max(Math.abs(dx),Math.abs(dz)),x=dx*radius,z=dz*radius;
      if(occupied.some(e=>Math.hypot(e.x-x,e.z-z)<42))continue;
      let intersects=false;for(const along of [-14,-7,0,7,16])for(const lateral of [-10,0,10]){
        const px=x+dx*along+dz*lateral,pz=z+dz*along-dx*lateral;
        if(layout?.plots.some(plot=>insidePlot(plot,px,pz,4))||layout?.houses.some(h=>Math.abs(h.x-px)<5&&Math.abs(h.z-pz)<5))intersects=true;
      }
      if(intersects)continue;
      chosen={x,z};break search;
    }
    if(!chosen)throw new Error('No clear harbor approach: '+v.id+' → '+exit.id);
    Object.assign(exit,chosen);occupied.push(exit);
  }
  return exits.map(({angle,...exit})=>exit);
}
