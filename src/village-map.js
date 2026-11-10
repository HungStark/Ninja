import {riverAt} from './adventure-world.js';

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function villageMapMarkup({id,region,limit,gates,civic,hero}){
  const size=900,pad=45,scale=(size-pad*2)/(limit*2),point=(x,z)=>({x:pad+(x+limit)*scale,y:pad+(z+limit)*scale});
  const markers=region.zones.map(z=>({id:'zone:'+z.id,type:'landmark',label:z.name,...point(z.x,z.z)}));
  for(const gate of gates)markers.push({id:'gate:'+gate.id,type:gate.kind==='dock'?'dock':'gate',label:(gate.kind==='dock'?'Bến thuyền · ':'Cổng · ')+(gate.label||gate.id),...point(gate.x,gate.z)});
  const buildings=civic?[civic.hall,civic.school,civic.clinic,civic.military,civic.shop,...civic.houses]:region.houses.map(([x,z,w,d])=>({x,z,w,d}));
  if(civic)for(const [kind,label] of [['hall','Nhà họp'],['school','Trường học'],['clinic','Trạm y tế'],['military','Khu quân sự'],['shop','Thương hội']]){
    const building=civic[kind];markers.push({id:'building:'+kind,type:'building',label,...point(building.x,building.z)});
  }
  // Keep every name legible without allowing edge labels to leave the map.
  const occupied=[];
  for(const marker of markers){
    const w=Math.min(300,marker.label.length*9+16),h=25,candidates=[[12,-32],[12,13],[-w-12,-32],[-w-12,13],[12,-58],[-w-12,39]];
    let best=null;
    for(const [dx,dy] of candidates){
      const x=Math.max(10,Math.min(size-w-10,marker.x+dx)),y=Math.max(12,Math.min(size-h-12,marker.y+dy));
      const overlap=occupied.reduce((n,r)=>n+Math.max(0,Math.min(x+w,r.x+r.w)-Math.max(x,r.x))*Math.max(0,Math.min(y+h,r.y+r.h)-Math.max(y,r.y)),0);
      if(!best||overlap<best.overlap)best={x,y,w,h,overlap};if(!overlap)break;
    }
    marker.labelBox=best;occupied.push(best);
  }
  const river=[];for(let z=-limit;z<=limit;z+=4){const p=point(riverAt(id,z).x,z);river.push(p.x+','+p.y);}
  const plots=buildings.map(b=>{const p=point(b.x,b.z);return `<rect class="village-map-building" x="${-(b.w||6)*scale/2}" y="${-(b.d||6)*scale/2}" width="${(b.w||6)*scale}" height="${(b.d||6)*scale}" transform="translate(${p.x} ${p.y}) rotate(${-(b.yaw||0)*180/Math.PI})" rx="2"/>`;}).join('');
  const labels=markers.map(m=>{const r=m.labelBox,c=m.type==='gate'?'#e9b877':m.type==='dock'?'#89cee2':m.type==='building'?'#c9c9a1':'#e4d3a1';return `<g class="village-map-point ${m.type}" data-map-marker="${esc(m.id)}"><title>${esc(m.label)}</title><path d="M${m.x} ${m.y} L${r.x+(m.x<r.x?0:r.w)} ${r.y+r.h/2}" fill="none" stroke="${c}" stroke-opacity=".45"/><circle cx="${m.x}" cy="${m.y}" r="6" fill="${c}" stroke="#163038" stroke-width="3"/><text x="${r.x+5}" y="${r.y+18}">${esc(m.label)}</text></g>`;}).join('');
  const p=point(hero.x,hero.z);
  const svg=`<svg viewBox="0 0 900 900" role="img" aria-label="Bản đồ làng"><defs><pattern id="villageMapGrid" width="45" height="45" patternUnits="userSpaceOnUse"><path d="M45 0H0V45" fill="none" stroke="#b9c8a8" stroke-opacity=".07"/></pattern><clipPath id="villageMapBounds"><rect x="45" y="45" width="810" height="810" rx="12"/></clipPath></defs><rect width="900" height="900" rx="16" fill="#132b32"/><rect width="900" height="900" fill="url(#villageMapGrid)"/><rect x="45" y="45" width="810" height="810" rx="12" fill="#60775a20" stroke="#afbb9766" stroke-width="2"/><g clip-path="url(#villageMapBounds)"><polyline points="${river.join(' ')}" fill="none" stroke="#53879a" stroke-opacity=".6" stroke-width="${riverAt(id,0).width*scale*2}"/>${plots}</g>${labels}<g class="village-map-hero"><circle cx="${p.x}" cy="${p.y}" r="13" fill="none" stroke="#fff0b4" stroke-width="2"/><circle cx="${p.x}" cy="${p.y}" r="6" fill="#fff0b4"/><text x="${Math.min(825,p.x+16)}" y="${Math.max(22,p.y-10)}">Bạn</text></g><g class="village-map-north"><path d="M820 80v-42m-8 12 8-12 8 12" fill="none" stroke="#e7d09a" stroke-width="3"/><text x="815" y="29">N</text></g></svg>`;
  return {svg,markers,size};
}
