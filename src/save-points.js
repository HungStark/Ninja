import {REGIONS,regionMetrics,riverAt,terrainHeight} from './adventure-world.js';
import {planVillageCivic,civicReserved} from './village-civic.js';
import {waterFootprintDry} from './water-network.js';
import {addVillagePads} from './village-zoning.js';

const cache=new Map();
export function planSavePoints(id){
  if(cache.has(id))return cache.get(id);
  const entry=(x,z,index)=>({kind:'save',id:id+'-save-'+(index+1),x,z,index,label:id==='nameless'?'Ấn hồi sinh':'Ấn hồi sinh · '+(index+1)});
  if(id==='nameless'){const points=[entry(0,5,0)];cache.set(id,points);return points;}
  const layout=planVillageCivic(id),limit=regionMetrics(id).limit;
  const safe=({x,z})=>{
    if(civicReserved(layout,x,z,5)||Math.abs(x)>limit-8||Math.abs(z)>limit-8)return false;
    if(id==='water'?!waterFootprintDry(x,z,{w:5,d:6,padding:1}):Math.abs(x-riverAt(id,z).x)<riverAt(id,z).width+5)return false;
    const heights=[[-2,-3],[-2,2],[2,-3],[2,2]].map(([dx,dz])=>terrainHeight(id,x+dx,z+dz));
    return heights.every(Number.isFinite)&&Math.max(...heights)-Math.min(...heights)<2.5;
  };
  // A common radius and quarter-turn spacing keep all four points equally spaced.
  for(const fraction of [.5,.58,.66,.74,.8,.86])for(let degree=0;degree<90;degree+=2){
    const points=Array.from({length:4},(_,i)=>{const angle=(degree+i*90)*Math.PI/180;return entry(Math.sin(angle)*limit*fraction,Math.cos(angle)*limit*fraction,i);});
    if(points.every(safe)){addVillagePads(id,points.map(p=>({x:p.x,z:p.z-1,reserveW:5,reserveD:7,base:terrainHeight(id,p.x,p.z)})));cache.set(id,points);return points;}
  }
  throw Error('No four accessible save points: '+id);
}
