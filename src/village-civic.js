import {queryWaterway,waterFootprintDry,nearestDryWaterPoint} from './water-network.js';
import * as T from 'three';
import {REGIONS,regionMetrics,terrainHeight,riverAt,waterwayAt,waterDepthAt} from './adventure-world.js';
import {buildHouse,buildGabledRoof} from './adventure-landmarks.js';
import {setVillagePads,insidePlot,FIRE_PRISON_SITE,FIRE_MOTHER_SITE,FIRE_MEDICINE_SITE} from './village-zoning.js';
import {createFirePrison} from './fire-prison.js';

export const HALL_STYLES={water:'stilt-council',fire:'basalt-forge',lightning:'storm-tower',earth:'sandstone-fort',wind:'wind-pavilion',light:'sun-colonnade',ice:'snow-lodge',wood:'living-timber',dark:'moon-pagoda'};
const layouts=new Map();
const overlapsLandmark=(plot,zone)=>Math.hypot(Math.max(0,Math.abs(zone.x-plot.x)-plot.reserveW/2),Math.max(0,Math.abs(zone.z-plot.z)-plot.reserveD/2))<zone.radius+1;
export const hallId=id=>id+'-council-hall';
export function civicPoint(plot,x,z){return {x:plot.x+Math.cos(plot.yaw||0)*x+Math.sin(plot.yaw||0)*z,z:plot.z-Math.sin(plot.yaw||0)*x+Math.cos(plot.yaw||0)*z};}

// Keep border entrances and their approach clear of the larger estates.
// Travel arrivals use this same position as the visible village gate.
export function civicGatePosition(layout,angle){
  for(let step=0;step<=180;step+=2)for(const side of step?[-1,1]:[1]){
    const yaw=angle+side*step*Math.PI/180,sin=Math.sin(yaw),cos=Math.cos(yaw),radius=130/Math.max(Math.abs(sin),Math.abs(cos)),p={x:sin*radius,z:cos*radius};
    if([0,6,12].some(back=>layout.plots.some(plot=>insidePlot(plot,p.x-sin*back,p.z-cos*back,6))))continue;
    return p;
  }
  throw Error('No clear village gate: '+layout.id);
}

export function civicWaterRoutes(layout,routes){
  const placed=[];
  return routes.map(route=>{
    const origin=route.from[1];
    for(let step=0;step<=260;step+=4)for(const side of step?[-1,1]:[1]){
      const t=origin+step*side;if(Math.abs(t)>132)continue;const r=riverAt('water',t),from=[r.x+r.width+1.5,t],to=[r.x-r.width-1.5,t];
      const mid=[(from[0]+to[0])/2,(from[1]+to[1])/2];
      if(waterDepthAt(...mid)<3||[from,to].some(p=>layout.plots.some(plot=>insidePlot(plot,...p,5)))||placed.some(p=>Math.hypot(p[0]-mid[0],p[1]-mid[1])<22))continue;
      placed.push(mid);return {...route,from,to};
    }
    throw Error('No clear ferry crossing: '+route.id);
  });
}

export function planVillageCivic(id){
  if(id==='nameless')return null;if(layouts.has(id))return layouts.get(id);
  const region=REGIONS[id];region.zones.forEach((z,i)=>{z.civicOriginalIndex??=i;});const limit=regionMetrics(id).limit,templates=[['hall',-86,-75,64,70],['military',-18,-75,42,48],['school',78,-65,60,65]];
  const rotate=(x,z,angle)=>({x:Math.round(x*Math.cos(angle)+z*Math.sin(angle)),z:Math.round(-x*Math.sin(angle)+z*Math.cos(angle))});
  function campusSet(angle){return Object.fromEntries(templates.map(([kind,x,z,w,d])=>{const p=rotate(x,z,angle),yaw=angle+(kind==='clinic'?Math.PI:0),swap=Math.abs(Math.sin(yaw))>.5;return [kind,{kind,...p,w,d,yaw,reserveW:swap?d:w,reserveD:swap?w:d}];}));}
  let campuses,best=-Infinity;
  const protectedSite=id==='fire'?{x:88,z:-96,r:32}:id==='wood'?{x:0,z:0,r:28}:id==='earth'?{x:0,z:-14,r:12}:null;
  for(let quarter=0;quarter<4;quarter++){
    const candidate=campusSet(quarter*Math.PI/2),plots=Object.values(candidate);
    if(protectedSite&&plots.some(p=>Math.hypot(Math.max(0,Math.abs(protectedSite.x-p.x)-p.reserveW/2),Math.max(0,Math.abs(protectedSite.z-p.z)-p.reserveD/2))<protectedSite.r+10))continue;
    const remaining=region.zones.filter(z=>!plots.some(p=>overlapsLandmark(p,z)));
    const score=remaining.length*10-((quarter+id.length)%4)*.01;if(score>best){best=score;campuses=candidate;}
  }
  if(!campuses)throw Error('No separated campus layout: '+id);
  if(id==='water')for(const campus of Object.values(campuses)){
    if(waterFootprintDry(campus.x,campus.z,{w:campus.reserveW,d:campus.reserveD,padding:2,branchesOnly:true}))continue;
    const point=nearestDryWaterPoint(campus.x,campus.z,{w:campus.reserveW,d:campus.reserveD,padding:2,branchesOnly:true,valid:(x,z)=>!Object.values(campuses).some(p=>p!==campus&&Math.abs(x-p.x)<(campus.reserveW+p.reserveW)/2+3&&Math.abs(z-p.z)<(campus.reserveD+p.reserveD)/2+3)});
    if(!point)throw Error('No dry civic plot: '+campus.kind);Object.assign(campus,point);
  }
  const clinics=['school','hall'].map((kind,index)=>{const campus=campuses[kind],w=7,d=6.5,yaw=campus.yaw,swap=Math.abs(Math.sin(yaw))>.5;return {kind:'clinic',id:id+'-clinic-'+index,...civicPoint(campus,15,campus.d/2+7),w,d,yaw,floors:1,reserveW:swap?d:w,reserveD:swap?w:d};});
  const plots=[...Object.values(campuses),...clinics],removed=region.zones.filter(z=>!['great-cave','cave-crystals','heart-tree-house'].includes(z.id)&&plots.some(p=>overlapsLandmark(p,z)));
  const removedIds=new Set(removed.map(z=>z.id)),visible=region.zones.filter(z=>!removedIds.has(z.id));if(!visible.length)throw Error('No remaining village landmarks: '+id);
  // Grade only the civic estates. Houses and surviving landmarks keep their
  // terrain; a twelve-unit apron makes every estate gate approachable.
  for(const p of plots){const samples=[];for(const a of [-1,0,1])for(const b of [-1,0,1])samples.push(terrainHeight(id,p.x+a*p.reserveW/2,p.z+b*p.reserveD/2));p.base=Math.max(...samples)+.08;}
  campuses.hall.base=campuses.military.base=Math.max(campuses.hall.base,campuses.military.base);
  setVillagePads(id,[...plots]);
  const angle=campuses.school.yaw,resCenter=rotate(0,52,angle),swap=Math.abs(Math.sin(angle))>.5,residential={...resCenter,w:264,d:160,yaw:angle,reserveW:swap?160:264,reserveD:swap?264:160};
  const intersectArea=p=>Math.max(0,Math.min(residential.x+residential.reserveW/2,p.x+p.reserveW/2)-Math.max(residential.x-residential.reserveW/2,p.x-p.reserveW/2))*Math.max(0,Math.min(residential.z+residential.reserveD/2,p.z+p.reserveD/2)-Math.max(residential.z-residential.reserveD/2,p.z-p.reserveD/2));
  residential.area=residential.w*residential.d-plots.reduce((sum,p)=>sum+intersectArea(p),0);
  const dry=(x,z,pad=.5)=>id==='water'?queryWaterway(x,z,{original:true}).clearance>pad:id==='ice'||Math.abs(x-riverAt(id,z).x)>riverAt(id,z).width+pad;
  function available(x,z,w,d,clear=3){
    if(Math.abs(x)+w/2>limit-6||Math.abs(z)+d/2>limit-6||Math.hypot(x,z)<15||!insidePlot(residential,x,z,-Math.max(w,d)/2))return null;
    if(plots.some(p=>insidePlot(p,x,z,Math.max(w,d)/2+clear)))return null;
    if(protectedSite&&Math.hypot(x-protectedSite.x,z-protectedSite.z)<protectedSite.r+Math.hypot(w,d)/2)return null;
    if(visible.some(zone=>Math.hypot(x-zone.x,z-zone.z)<Math.min(zone.radius,9)+Math.hypot(w,d)/2)||region.npcs.some(n=>Math.hypot(x-n.x,z-n.z)<Math.hypot(w,d)/2+3))return null;
    const heights=[];for(const a of [-1,1])for(const b of [-1,1]){const px=x+a*w/2,pz=z+b*d/2;if(!dry(px,pz))return null;heights.push(terrainHeight(id,px,pz,id!=='water'));}
    if(Math.max(...heights)-Math.min(...heights)>2.8)return null;return {x,z,w,d,base:Math.max(...heights)};
  }
  let shop=null,shopScore=Infinity;
  for(let x=-118;x<=118;x+=8)for(let z=-118;z<=118;z+=8){const p=available(x,z,16,20,6);if(!p)continue;const score=Math.hypot(x-residential.x,z-residential.z);if(score<shopScore){shopScore=score;shop=p;}}
  if(!shop)throw Error('No residential market: '+id);shop={...shop,kind:'shop',entry:{x:shop.x,z:shop.z+12}};plots.push({...shop,z:shop.z+2,reserveW:16,reserveD:20});
  const candidates=[];for(let x=-122;x<=122;x+=12)for(let z=-122;z<=122;z+=12){const p=available(x,z,7,7,5);if(p)candidates.push(p);}
  const houses=[];while(houses.length<20&&candidates.length){let bestIndex=-1,score=-Infinity;for(let i=0;i<candidates.length;i++){const p=candidates[i],spacing=houses.length?Math.min(...houses.map(h=>Math.hypot(h.x-p.x,h.z-p.z))):Math.hypot(p.x-shop.x,p.z-shop.z);if(spacing>score){score=spacing;bestIndex=i;}}if(houses.length&&score<22)break;const p=candidates.splice(bestIndex,1)[0];p.kind='house';p.yaw=Math.atan2(shop.x-p.x,shop.z-p.z);houses.push(p);}
  if(houses.length!==20)throw Error('No twenty-home residential district: '+id+'/'+houses.length);
  if(id==='water'){
    // Select the established layout against the old banks first. Dry homes keep
    // their exact positions and identities; only flooded footprints are moved.
    const movable=[shop,...houses];
    for(const object of movable){
      if(waterFootprintDry(object.x,object.z,{w:object.w,d:object.d,padding:1}))continue;
      const from={x:object.x,z:object.z},point=nearestDryWaterPoint(from.x,from.z,{w:object.w,d:object.d,padding:1,valid:(x,z)=>insidePlot(residential,x,z,-Math.max(object.w,object.d)/2)&&!plots.some(p=>p.kind!=='shop'&&insidePlot(p,x,z,Math.max(object.w,object.d)/2+3))&&!movable.some(p=>p!==object&&Math.hypot(p.x-x,p.z-z)<(p.kind==='shop'||object.kind==='shop'?Math.hypot(p.w+object.w,p.d+object.d)/2+3:22))&&!visible.some(p=>Math.hypot(p.x-x,p.z-z)<Math.min(p.radius,9)+Math.hypot(object.w,object.d)/2)});
      if(!point)throw Error('No dry home/market');Object.assign(object,point,{waterOriginal:from,waterRelocated:true,base:terrainHeight(id,point.x,point.z)});
      if(object===shop){shop.entry={x:shop.x,z:shop.z+12};Object.assign(plots.find(p=>p.kind==='shop'),{x:shop.x,z:shop.z+2});}
    }
  }
  plots.push(...houses);
  function block(campus,kind,x,z,w,d){return {kind,...civicPoint(campus,x,z),w,d,yaw:campus.yaw,base:campus.base,campus};}
  const hall=block(campuses.hall,'hall',0,-17,38,24),school=block(campuses.school,'school',0,-19,30,14);
  school.floors=2;hall.style=HALL_STYLES[id];for(const p of [hall,school,...clinics])p.entry={...civicPoint(p,0,p.d/2+2),y:p.base+(p===hall&&id==='water'?.955:0)};
  for(const clinic of clinics)clinic.healer={...civicPoint(clinic,0,clinic.d/2+1.5),y:clinic.base};
  for(const p of Object.values(campuses)){p.gate={...civicPoint(p,0,p.d/2+1),y:p.base};p.insideGate={...civicPoint(p,0,p.d/2-4),y:p.base};}
  const guardian=civicPoint(campuses.hall,0,12),guardianPosts=[-8,8].map(x=>civicPoint(campuses.hall,x,22));
  const military=campuses.military;military.prison={...civicPoint(military,10,7),y:military.base};military.jailers=[civicPoint(military,-11,15),civicPoint(military,17,20)];
  const layout={id,hall,school,clinics,clinic:clinics[0],military,campuses,shop,residential,districts:[{id:id+'-residential',...residential}],houses,guardian,guardianPosts,plots,removedLandmarks:removed.map(z=>({id:z.id,name:z.name})),visibleLandmarks:visible};
  region.zones=visible;
  // Keep quest-giver IDs and their rewards when an old landmark is replaced.
  let moved=0;for(const n of region.npcs){if(n.kind==='healer')continue;if(removedIds.has(n.landmark)||Object.values(campuses).some(p=>insidePlot(p,n.x,n.z,3))){const home=houses[moved++%houses.length],p=civicPoint(home,0,7);Object.assign(n,p,{civicResident:true});delete n.platform;delete n.elevation;if(n.landmark)n.landmark=[...visible].sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0].id;}}
  const oldMentor=region.mentor.zoneIds;region.mentor.zoneIds=oldMentor.filter(key=>!removedIds.has(key));if(region.mentor.zoneIds.length<Math.min(2,visible.length))region.mentor.zoneIds=[...new Set([...region.mentor.zoneIds,...visible.map(z=>z.id)])].slice(0,2);
  if(oldMentor.some(key=>removedIds.has(key)))region.mentor.clue='Khám phá '+region.mentor.zoneIds.map(key=>visible.find(z=>z.id===key).name).join(' và ')+', rồi trở lại gặp ta.';
  if(id==='fire'){Object.assign(FIRE_PRISON_SITE,military.prison);Object.assign(FIRE_MOTHER_SITE,civicPoint(military,0,military.d/2+7));Object.assign(FIRE_MEDICINE_SITE,{x:shop.entry.x+4,z:shop.entry.z+3});}
  if(id==='water'){
    // Preserve authored identities; only wet footprints are shifted to a nearby bank.
    const move=(object,w,d)=>{if(waterFootprintDry(object.x,object.z,{w,d,padding:1}))return;const from={x:object.x,z:object.z},point=nearestDryWaterPoint(from.x,from.z,{w,d,padding:1,valid:(x,z)=>!plots.some(p=>insidePlot(p,x,z,Math.max(w,d)/2+1))});if(!point)throw Error('No dry village object: '+object.id);Object.assign(object,point,{waterRelocated:true,waterOriginal:from});};
    for(const zone of visible)move(zone,7,7);
    for(const person of region.npcs){move(person,1.5,1.5);if(person.waterRelocated){delete person.elevation;delete person.platform;}}
  }
  layouts.set(id,layout);return layout;
}

let namelessClinics=null;
export function planNamelessClinics(){
  if(namelessClinics)return namelessClinics;
  namelessClinics=[[-30,6],[12,22]].map(([x,z],index)=>{const w=7,d=6.5,base=Math.max(...[-1,1].flatMap(a=>[-1,1].map(b=>terrainHeight('nameless',x+a*w/2,z+b*d/2))))+.08;return {kind:'clinic',id:'nameless-clinic-'+index,x,z,w,d,yaw:0,floors:1,reserveW:w,reserveD:d,base,healer:{x,z:z+d/2+1.5,y:base}};});
  setVillagePads('nameless',namelessClinics);return namelessClinics;
}
export function buildSmallClinics(c,clinics){for(const clinic of clinics)building(c,clinic,'clinic');return clinics.map(clinic=>({kind:'clinic',id:clinic.id,...clinic.healer,label:'Y Tá'}));}

export function civicReserved(layout,x,z,pad=0){return !!layout?.plots.some(p=>Math.abs(x-p.x)<(p.reserveW||p.w)/2+pad&&Math.abs(z-p.z)<(p.reserveD||p.d)/2+pad);}

function building(c,plot,kind){
  const {box,cyl,mesh,M}=c,g=c.group(plot.x,plot.z);g.position.y=plot.base;g.rotation.y=plot.yaw||0;g.name=kind==='hall'?'village-council-hall':'village-'+kind;g.userData={civic:true,kind,style:HALL_STYLES[c.id],plot:{...plot},noCollision:true};
  const wood=c.surfaces?.wood||M('#61503b'),stone=c.surfaces?.stone||M('#8b887c'),wall=kind==='hall'&&['water','wood'].includes(c.id)?wood:kind==='hall'&&c.id==='fire'?stone:c.surfaces?.wall||M('#c6b795'),roof=c.surfaces?.roof||M(c.v.roof),accent=M(c.v.color),w=plot.w,d=plot.d,floors=plot.floors||(kind==='school'||kind==='clinic'?3:2),h=kind==='hall'?14:floors*5.8;
  if(kind==='hall'&&c.id==='water'){g.position.y+=1.2;box(g,wood,0,-.12,0,w+2,.24,d+2);for(const x of [-10,-5,5,10])for(const z of [-9,9])cyl(g,wood,x,-.7,z,.3,1.4,8);for(let k=0;k<5;k++){const step=box(g,wood,0,-1.05+k*.23,d/2+3-k*.5,4,.23,1.1);c.solidMesh(step,{name:'hall-entry-step-'+k,stepable:true});}}
  const foundation=box(g,stone,0,-1.05,0,w+.5,2.1,d+.5);c.solidMesh(foundation,{name:kind+'-foundation'});
  const shell=box(g,wall,0,h/2,0,w,h,d);c.solidMesh(shell,{name:kind+'-closed-building',stepable:false});
  if(kind==='hall'){
    const style=HALL_STYLES[c.id];
    if(c.id==='earth'){box(g,stone,0,h+.3,0,w+1,.6,d+1);for(let k=-4;k<=4;k++)box(g,wall,k*2.6,h+1,d/2,.9,1.4,1.2);for(const side of [-1,1]){const tower=cyl(g,stone,side*(w/2-1),h*.65,-d/2+2,2.4,h*1.3,8);tower.name='sandstone-hall-tower';}}
    else if(c.id==='lightning'){buildGabledRoof(c,g,w,d,h,.22,roof);cyl(g,stone,0,h+3,0,3.5,5,6);cyl(g,roof,0,h+5.6,0,4,.35,6);cyl(g,wood,0,h+8,0,.2,5,8);for(let k=0;k<3;k++){const coil=mesh(new T.TorusGeometry(1.3-k*.18,.14,5,20),accent,g,0,h+7+k,0);coil.rotation.x=Math.PI/2;}}
    else if(c.id==='light'){box(g,roof,0,h+.4,0,w+2,.6,d+2);const dome=mesh(new T.SphereGeometry(5,14,7,0,Math.PI*2,0,Math.PI/2),M('#d4b366'),g,0,h+.6,0);dome.scale.y=.8;for(const x of [-9,-6,6,9])cyl(g,wall,x,4.6,d/2+1,.5,9.2,10);mesh(new T.OctahedronGeometry(.8),accent,g,0,14.5,0);}
    else if(c.id==='wind'){const cap=mesh(new T.SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI/2),roof,g,0,h,0);cap.scale.set(w*.62,4.5,d*.62);for(const side of [-1,1]){cyl(g,wood,side*(w/2-2),h+3,0,.11,5,6);const flag=box(g,M('#e7dcba'),side*(w/2-2)+1.3,h+4,0,2.6,1.1,.04);c.animated.push({kind:'flag',mesh:flag});}}
    else if(c.id==='dark'){for(let level=0;level<3;level++)buildGabledRoof(c,g,w-level*5,d-level*3,h+level*2.4,.32,roof);const moon=mesh(new T.TorusGeometry(1.1,.2,6,24,Math.PI*1.6),accent,g,0,h+9,0);moon.rotation.z=.4;}
    else {const pitch=c.id==='ice'?.66:c.id==='fire'?.38:.44;buildGabledRoof(c,g,w,d,h,pitch,roof,wall);if(c.id==='ice')buildGabledRoof(c,g,w-.5,d-.5,h+.23,pitch,M('#ecf2ef'));if(c.id==='water')for(const x of [-10,-5,5,10])cyl(g,wood,x,3,d/2+1,.25,6,8);if(c.id==='wood')for(const side of [-1,1]){const trunk=cyl(g,wood,side*(w/2+1),6,-d/3,1,12,9);trunk.rotation.z=side*.09;const crown=mesh(new T.IcosahedronGeometry(4,0),M(c.v.tree),g,side*(w/2+1),13,-d/3);crown.scale.y=.55;}if(c.id==='fire')for(const side of [-1,1]){cyl(g,stone,side*(w/2-2),h+1,-d/3,.8,4,7);box(g,accent,side*(w/2-2),4.5,d/2+.08,1,5,.12);}}
    box(g,wood,0,3.2,d/2+.08,3.5,6.4,.13);box(g,accent,0,7.5,d/2+.14,5.3,.7,.13);g.userData.style=style;
    if(['water','fire','wood'].includes(c.id)){box(g,roof,0,6.8,d/2+1.7,w-1,.3,3.8);for(const side of [-1,1])cyl(g,wood,side*(w/2-2),3.4,d/2+3,.24,6.8,8);}
  }else{
    buildGabledRoof(c,g,w,d,h,c.id==='ice'?.65:.4,roof,wall);box(g,wood,0,1.7,d/2+.08,2.3,3.4,.12);
    if(kind==='clinic'){const white=M('#e9e2c9');box(g,white,0,5,d/2+.14,3,3,.1);box(g,M('#b45c4e'),0,5,d/2+.22,.5,2.2,.08);box(g,M('#b45c4e'),0,5,d/2+.22,2.2,.5,.08);}
    else {box(g,wood,0,4,d/2+.14,2.4,1,.12);for(let i=0;i<3;i++)box(g,M('#dccb9e'),-.7+i*.7,4,d/2+.23,.13,.65,.07);for(const side of [-1,1]){const book=box(g,M('#d1ba87'),side*1.3,.9,d/2+2,1.8,.2,.8);book.rotation.z=-side*.08;}}
  }
  for(const x of [-1,1])for(const z of [-1,1])box(g,wood,x*(w/2-.2),h/2,z*(d/2-.1),.2,h,.2);
  for(const side of [-1,1]){box(g,wood,side*w*.32,h*.45,d/2+.1,1.6,2,.15);box(g,M('#e9cf95',.12),side*w*.32,h*.45,d/2+.2,1.3,1.7,.05);}
  if(kind!=='hall')for(let floor=0;floor<floors;floor++){
    box(g,wood,0,floor*5.8+.25,d/2+.12,w+.3,.2,.35);
    for(let x=-w/2+3;x<w/2-1;x+=3.5){if(floor===0&&Math.abs(x)<2)continue;box(g,wood,x,3+floor*5.8,d/2+.15,2.3,2.9,.15);box(g,M('#bad2cd',.08),x,3+floor*5.8,d/2+.25,2,2.6,.07);box(g,wood,x,3+floor*5.8,d/2+.31,.08,2.6,.06);}
  }
  g.userData.floors=kind==='hall'?2:floors;
  return g;
}

function campus(c,p){
  const g=c.group(p.x,p.z);g.position.y=p.base;g.rotation.y=p.yaw;g.name=p.kind+'-campus';g.userData={campus:p.kind,plot:{...p},noCollision:true};
  const wall=c.surfaces.stone,wood=c.surfaces.wood,roof=c.surfaces.roof,accent=c.M(c.v.color),gateWidth=p.kind==='school'?12:10,h=5.5;
  const slab=c.box(g,c.M(c.v.ground),0,-.1,0,p.w,.25,p.d);slab.name=p.kind+'-courtyard';c.solidMesh(slab,{name:p.kind+'-courtyard',stepable:true});
  const solid=(x,z,w,d)=>{const o=c.box(g,wall,x,h/2,z,w,h,d);c.solidMesh(o,{name:p.kind+'-campus-wall',stepable:false});c.box(g,roof,x,h+.15,z,w+.2,.3,d+.2);};
  solid(-p.w/2,0,.8,p.d);solid(p.w/2,0,.8,p.d);solid(0,-p.d/2,p.w,.8);const half=(p.w-gateWidth)/2;for(const side of [-1,1]){solid(side*(gateWidth/2+half/2),p.d/2,half,.8);c.box(g,wood,side*(gateWidth/2+.6),3.8,p.d/2,1.1,7.6,1.2);}
  c.box(g,wood,0,7.2,p.d/2,gateWidth+4,.6,1.5);c.box(g,roof,0,8,p.d/2,gateWidth+6,.4,2.8);c.box(g,accent,0,6.5,p.d/2+.9,gateWidth-1,1.2,.12);
  for(const side of [-1,1])for(const z of [-p.d/2+3,p.d/2-3]){c.cyl(g,wood,side*(p.w/2-2),3,z,.16,6,6);c.box(g,c.M('#e3c788',.2),side*(p.w/2-2),5.8,z,.65,.8,.65);}
  return g;
}

export function buildVillageCivic(c,layout){
  if(!layout)return [];
  for(const p of Object.values(layout.campuses))campus(c,p);
  building(c,layout.hall,'hall');building(c,layout.school,'school');for(const clinic of layout.clinics)building(c,clinic,'clinic');
  const block=(campus,kind,x,z,w,d,floors)=>building(c,{...civicPoint(campus,x,z),base:campus.base,yaw:campus.yaw,w,d,floors},kind);
  const school=layout.campuses.school;
  block(school,'classroom-block',-22,-5,10,20,2);block(school,'classroom-block',22,-5,10,20,2);block(school,'functional-building',-18,20,12,10,1);block(school,'dormitory',18,20,12,12,2);
  // The broad center is reserved for training and assembly, with clear lanes
  // between classroom blocks and a smaller sports/training court at the rear.
  const schoolYard=c.group(school.x,school.z);schoolYard.position.y=school.base+.05;schoolYard.rotation.y=school.yaw;schoolYard.name='school-training-yard';schoolYard.userData.noCollision=true;
  for(const side of [-1,1])c.box(schoolYard,c.M('#d8ca9b'),side*12,.02,10,.1,.04,30);for(const z of [-5,25])c.box(schoolYard,c.M('#d8ca9b'),0,.02,z,24,.04,.1);for(const x of [-8,0,8]){c.cyl(schoolYard,c.surfaces.wood,x,1.6,20,.18,3.2,7);c.box(schoolYard,c.M('#b49367'),x,2.2,20,1.7,.22,.22);}
  const military=layout.military;block(military,'military-barracks',0,-15,26,13,1);block(military,'military-store',-12,5,11,10,1);
  const prison=c.group(military.prison.x,military.prison.z);prison.position.y=military.base;prison.name='military-prison';prison.userData={noCollision:true,kind:'prison',village:c.id};
  // Open entrance and roof expose the cell and captive to the exploration view.
  for(const side of [-1,1]){const wall=c.box(prison,c.surfaces.stone,side*7,2.8,0,.8,5.6,11);c.solidMesh(wall,{name:'prison-building-wall',stepable:false});}const back=c.box(prison,c.surfaces.stone,0,2.8,-5.5,14,5.6,.8);c.solidMesh(back,{name:'prison-building-wall',stepable:false});c.box(prison,c.surfaces.wood,0,5.7,5.5,14,.4,.7);for(const side of [-1,1])c.box(prison,c.surfaces.wood,side*6.7,2.8,5.5,.6,5.6,.6);
  if(c.id!=='fire')createFirePrison(c.land,military.prison,false,c.physics.addBox,c.id+'-prison');
  for(const [index,p]of layout.houses.entries()){const house=buildHouse(c,p.x,p.z,4.4,4.2,index,p.yaw);house.userData.settlement=true;house.userData.district=layout.districts[0].id;c.obstacles.push({x:p.x,z:p.z,w:3.15,d:3.15});}
  const summary=new T.Group();summary.name='settlement-layout';summary.userData={village:c.id,houses:layout.houses.length,districts:layout.districts.map(d=>d.id),yards:0};c.land.add(summary);
  return [{kind:'interior-enter',id:hallId(c.id),...layout.hall.entry,label:'Nhà họp · Trưởng làng'},{kind:'school',id:c.id+'-school',...layout.school.entry,label:'Trường học · Tu luyện'},...layout.clinics.map(clinic=>({kind:'clinic',id:clinic.id,...clinic.healer,label:'Y Tá'})),{kind:'military',id:c.id+'-military',...military.insideGate,label:'Khu quân sự · Trại lính và nhà lao'}].map(i=>({...i,y:c.physics.floorAt(i.x,i.z,c.heightAt(i.x,i.z)+1.3)}));
}

export function buildGateWatch(c,gates){
  for(const gate of gates){const yaw=Math.atan2(gate.x,gate.z),root=c.group(gate.x,gate.z);root.rotation.y=yaw;root.name='gate-watch-'+gate.id;root.userData.noCollision=true;
    for(const side of [-1,1]){const tower=new T.Group();tower.position.set(side*8,0,-2);root.add(tower);const timber=c.surfaces.wood,stone=c.surfaces.stone;const base=c.box(tower,stone,0,3,0,3.4,6,3.4);c.solidMesh(base,{name:'gate-watchtower',stepable:false});c.box(tower,timber,0,6.15,0,5,.3,5);for(const a of [-1,1])for(const b of [-1,1])c.box(tower,timber,a*2,7.5,b*2,.15,2.7,.15);buildGabledRoof(c,tower,5,5,9,.45,c.surfaces.roof);}
  }
}
