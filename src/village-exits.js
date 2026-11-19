import {travelKind} from './village-travel.js';
import {regionMetrics,terrainHeight} from './adventure-world.js';
import {planVillageCivic} from './village-civic.js';
import {insidePlot} from './village-zoning.js';
import {waterFootprintDry} from './water-network.js';

const GATE_CLEARANCE=5,GATE_WIDTH=2.25,GATE_PLANE=-.45;
export const GATE_ARRIVAL_DEPTH=8;

export function gateArrival(gate){
  return [gate.x-Math.sin(gate.yaw)*GATE_ARRIVAL_DEPTH,gate.z-Math.cos(gate.yaw)*GATE_ARRIVAL_DEPTH];
}
export function crossedRoadGate(gates,from,to,floor){
  for(const gate of gates){
    if(gate.kind!=='gate')continue;
    const dx=Math.sin(gate.yaw),dz=Math.cos(gate.yaw);
    const a=(from.x-gate.x)*dx+(from.z-gate.z)*dz,b=(to.x-gate.x)*dx+(to.z-gate.z)*dz;
    if(a>=GATE_PLANE||b<GATE_PLANE)continue;
    const t=(GATE_PLANE-a)/(b-a),x=from.x+(to.x-from.x)*t,z=from.z+(to.z-from.z)*t,y=from.y+(to.y-from.y)*t;
    if(Math.abs((x-gate.x)*dz-(z-gate.z)*dx)>GATE_WIDTH||Math.abs(y-floor(x,z))>2.2)continue;
    return gate;
  }
  return null;
}

function gateDirection(v,other){
  // The shared borders of Water are north toward Nameless, south toward
  // Wind, and east toward Fire. Their map labels are offset from the borders.
  if(v.id==='water')return {nameless:Math.PI,wind:0,fire:Math.PI/2}[other.id];
  return Math.atan2(other.x-v.x,other.y-v.y);
}

function roadGate(v,other,limit,layout,occupied,waterLane){
  const angle=gateDirection(v,other),ax=Math.sin(angle),az=Math.cos(angle),xSide=Math.abs(ax)>Math.abs(az);
  const sx=xSide?Math.sign(ax):0,sz=xSide?0:Math.sign(az),edge=limit-GATE_CLEARANCE;
  const ideal=v.id==='water'&&!xSide?waterLane:edge*(xSide?az/Math.abs(ax):ax/Math.abs(az));
  const valid=(x,z)=>[0,4,8,13].every(back=>{
    const px=x-sx*back,pz=z-sz*back;
    return !layout?.plots.some(plot=>insidePlot(plot,px,pz,5))&&(v.id!=='water'||waterFootprintDry(px,pz,{w:5,d:5,padding:1}));
  })&&[0,4,8].every(back=>Math.abs(terrainHeight(v.id,x-sx*back,z-sz*back)-terrainHeight(v.id,x,z))<2.6);
  for(let offset=0;offset<=limit*2;offset+=2)for(const sign of offset?[-1,1]:[1]){
    const coordinate=Math.max(-limit+12,Math.min(limit-12,ideal))+offset*sign;
    if(Math.abs(coordinate)>limit-12)continue;
    const x=xSide?sx*edge:coordinate,z=xSide?coordinate:sz*edge;
    if(occupied.some(g=>Math.hypot(g.x-x,g.z-z)<16)||!valid(x,z))continue;
    return {x,z,yaw:Math.atan2(sx,sz)};
  }
  throw new Error('No clear border gate: '+v.id+' → '+other.id);
}

// Shared by scene construction and arrivals: neighboring ferry routes need distinct berths.
export function planVillageExits(v,lookup){
  const layout=planVillageCivic(v.id),metrics=regionMetrics(v.id),roads=[];
  let waterLane=0;
  if(v.id==='water'){
    for(const x of [0,24,-24,40,-40,56,-56,70,-70,86,-86,102,-102]){
      const north=roadGate(v,lookup('nameless'),metrics.limit,layout,[],x),south=roadGate(v,lookup('wind'),metrics.limit,layout,[],x);
      if(north.x===south.x){waterLane=north.x;break;}
    }
  }
  const exits=v.links.map(id=>{
    const other=lookup(id),kind=travelKind(v.id,id),angle=Math.atan2(other.x-v.x,other.y-v.y);
    if(kind==='dock')return {kind,id,label:other.name,angle};
    const road={kind,id,...roadGate(v,other,metrics.limit,layout,roads,waterLane),label:other.name};roads.push(road);return road;
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
