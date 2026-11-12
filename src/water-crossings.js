import {WATER_CHANNELS,channelPoint,waterFootprintDry} from './water-network.js';

// Reserve shallow landings before scenery; the river between them stays impassable.
export function planWaterFerries({valid=()=>true,heightAt}){
  const routes=[];
  for(const channel of WATER_CHANNELS){
    const anchors=channel.axis==='z'?[-92,40]:channel.id==='south-branch'?[10,100]:[(channel.min+channel.max)/2];
    for(const anchor of anchors){
      let chosen;
      search:for(let offset=0;offset<=75;offset+=2)for(const side of offset?[-1,1]:[1]){
        const t=anchor+side*offset;if(t<Math.max(-125,channel.min+10)||t>Math.min(125,channel.max-10))continue;
        const p=channelPoint(channel,t),dx=channel.axis==='z'?1:0,dz=1-dx,half=p.width+1.6,width=4.2;
        if(routes.some(r=>Math.hypot((r.from[0]+r.to[0])/2-p.x,(r.from[1]+r.to[1])/2-p.z)<24))continue;
        if(!valid(p.x,p.z,dx?half*2:width,dx?width:half*2))continue;
        const a={x:p.x-dx*half,z:p.z-dz*half},b={x:p.x+dx*half,z:p.z+dz*half};
        if(![a,b].every(q=>waterFootprintDry(q.x,q.z,{w:2,d:2,padding:.4})))continue;
        chosen={id:routes.length?'water-ferry-'+channel.id+'-'+routes.length:'west-ferry',name:'Bè qua Cửa Sông',kind:'raft',channel:channel.id,from:[a.x,a.z],to:[b.x,b.z],fromY:heightAt(a.x,a.z),toY:heightAt(b.x,b.z)};break search;
      }
      if(!chosen)throw Error('No safe ferry landing: '+channel.id+' / '+anchor);
      routes.push(chosen);
    }
  }return routes;
}
