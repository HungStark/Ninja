// One description drives riverbeds, water meshes, banks, maps and placement.
// Widths are half widths. Queries stay analytic rather than scanning river meshes.
// Original banks are used only to preserve the established home layout.
// The old east canal is excluded from the visible and physical network below.
const ORIGINAL_CHANNELS=Object.freeze([
  {id:'main',axis:'z',min:-160,max:160,width:9.6,center:t=>-38+20*Math.sin(t*.021),halfWidth:t=>9.6*(1+.1*Math.sin(t*.055))},
  {id:'east',axis:'z',min:-160,max:160,width:7,center:t=>46+9*Math.sin(t*.025)}
]);
export const WATER_CHANNELS=Object.freeze([
  ORIGINAL_CHANNELS[0],
  {id:'south-branch',axis:'x',min:-27,max:160,width:3.8,center:t=>32+4*Math.sin(Math.PI*Math.max(0,Math.min(1,(t+27)/80)))},
  {id:'west-branch',axis:'x',min:-160,max:-18,width:4.2,center:t=>76+8*Math.sin(Math.PI*(t+160)/142)}
]);
export function waterLandSector(x,z){const main=WATER_CHANNELS[0],west=WATER_CHANNELS.find(c=>c.id==='west-branch'),south=WATER_CHANNELS.find(c=>c.id==='south-branch');if(x<main.center(z))return z>west.center(Math.max(west.min,Math.min(west.max,x)))?'west-south':'west-north';return z>south.center(Math.max(south.min,Math.min(south.max,x)))?'east-south':'east-north';}
export function channelPoint(channel,t){const center=channel.center(t),width=channel.halfWidth?.(t)??channel.width;return {x:channel.axis==='z'?center:t,z:channel.axis==='z'?t:center,width,y:-.7};}
export function queryWaterway(x,z,{branchesOnly=false,original=false}={}){
  let best=null,clearance=Infinity;
  for(const c of original?ORIGINAL_CHANNELS:WATER_CHANNELS){if(branchesOnly&&c.axis!=='x')continue;const along=c.axis==='z'?z:x,t=Math.max(c.min,Math.min(c.max,along)),p=channelPoint(c,t),distance=Math.hypot(x-p.x,z-p.z),gap=distance-p.width;
    if(gap<clearance){clearance=gap;best={id:c.id,distance,width:p.width,y:p.y,axis:c.axis,center:c.axis==='z'?p.x:p.z,x:p.x,z:p.z,clearance:gap};}
  }return best;
}
export function waterFootprintDry(x,z,{w=0,d=w,yaw=0,padding=1,branchesOnly=false}={}){
  const radius=Math.hypot(w,d)/2,center=queryWaterway(x,z,{branchesOnly});
  if(center.clearance>radius+padding+1)return true;
  if(center.clearance<padding)return false;
  const nx=Math.max(1,Math.ceil(w/2)),nz=Math.max(1,Math.ceil(d/2)),cos=Math.cos(yaw),sin=Math.sin(yaw);
  for(let a=0;a<=nx;a++)for(let b=0;b<=nz;b++){const lx=(a/nx-.5)*w,lz=(b/nz-.5)*d;if(queryWaterway(x+cos*lx+sin*lz,z-sin*lx+cos*lz,{branchesOnly}).clearance<padding)return false;}
  return true;
}
// Search outward in deterministic distance order, only when a footprint is wet.
// This runs during scene construction, never per frame or on quest rewards.
export function nearestDryWaterPoint(x,z,{w=0,d=w,yaw=0,padding=1,limit=136,maxDistance=100,valid=()=>true,branchesOnly=false}={}){
  const fits=(px,pz)=>{const ex=(Math.abs(Math.cos(yaw))*w+Math.abs(Math.sin(yaw))*d)/2,ez=(Math.abs(Math.sin(yaw))*w+Math.abs(Math.cos(yaw))*d)/2;return Math.abs(px)+ex<=limit&&Math.abs(pz)+ez<=limit&&waterFootprintDry(px,pz,{w,d,yaw,padding,branchesOnly})&&valid(px,pz);};
  if(fits(x,z))return {x,z};
  for(let radius=.5;radius<=maxDistance;radius+=.5){const steps=Math.max(32,Math.ceil(Math.PI*radius*4));for(let k=0;k<steps;k++){const a=k*Math.PI*2/steps,px=x+Math.cos(a)*radius,pz=z+Math.sin(a)*radius;if(fits(px,pz))return {x:px,z:pz};}}
  return null;
}
const paths=new Map();
export function waterChannelPaths(limit=150,step=2){const key=limit+':'+step;if(!paths.has(key))paths.set(key,WATER_CHANNELS.map(c=>{const min=Math.max(-limit,c.min),max=Math.min(limit,c.max),n=Math.ceil((max-min)/step);return {id:c.id,axis:c.axis,width:c.width,points:Array.from({length:n+1},(_,i)=>channelPoint(c,min+(max-min)*i/n))};}));return paths.get(key);}
const mapMarkup=new Map();
export function waterMapMarkup(point,scale=1){const origin=point(0,0),key=scale+':'+origin.x+':'+(origin.y??origin.z);if(!mapMarkup.has(key))mapMarkup.set(key,waterChannelPaths(150,3).map(c=>'<polyline data-water-channel="'+c.id+'" points="'+c.points.map(p=>{const q=point(p.x,p.z);return q.x+','+(q.y??q.z);}).join(' ')+'" fill="none" stroke="#53879a" stroke-opacity=".65" stroke-width="'+c.width*2*scale+'" stroke-linecap="round"/>').join(''));return mapMarkup.get(key);}

export function waterFerryMapMarkup(routes,point,scale=1){return routes.filter(r=>r.kind==='raft').map(r=>{const a=point(...r.from),b=point(...r.to);return '<g data-river-ferry="'+r.id+'"><path d="M'+a.x+' '+(a.y??a.z)+'L'+b.x+' '+(b.y??b.z)+'" fill="none" stroke="#ddc891" stroke-width="'+Math.max(.8,scale)+'" stroke-dasharray="'+3*scale+' '+2*scale+'"/><circle cx="'+a.x+'" cy="'+(a.y??a.z)+'" r="'+1.6*scale+'" fill="#ddc891"/><circle cx="'+b.x+'" cy="'+(b.y??b.z)+'" r="'+1.6*scale+'" fill="#ddc891"/></g>';}).join('');}
