import * as T from 'three';
import {buildHouse} from './adventure-landmarks.js';
import {riverAt,waterwayAt} from './adventure-world.js';
import {scaleBuildingUVs} from './adventure-materials.js';
import {HOUSE_WIDTH_SCALE} from './adventure-building-scale.js';

export function buildVillageSettlement(c,region,houseInRiver){
 const {id,land,box,cyl,mesh,M,heightAt,surfaces:s}=c,plots=[],districts=new Map(),paths=[];
 const nearestRoad=(x,z)=>c.mainRoads.map(t=>{const u=Math.max(.03,Math.min(1,(x*t.x+z*t.z)/(t.x*t.x+t.z*t.z||1)));return {x:t.x*u,z:t.z*u};}).sort((a,b)=>Math.hypot(a.x-x,a.z-z)-Math.hypot(b.x-x,b.z-z))[0];
 const spots=region.zones.filter(z=>!z.platform).map(z=>({...c.setpieceSpot(z),r:['crater','ash-outpost'].includes(z.id)&&id==='fire'?18:z.id==='lotus'?12:10}));
 const dry=(x,z,pad=0)=>id==='water'?waterwayAt(x,z).distance>waterwayAt(x,z).width+pad:Math.abs(x-riverAt(id,z).x)>riverAt(id,z).width+pad;
 function lane(points,width=1.5){
  const positions=[],uv=[],indices=[];
  for(let j=0;j<points.length;j++){const p=points[j],prev=points[Math.max(0,j-1)],next=points[Math.min(points.length-1,j+1)],dx=next[0]-prev[0],dz=next[1]-prev[1],length=Math.hypot(dx,dz)||1;
   for(const side of [-1,1]){const x=p[0]+dz/length*width/2*side,z=p[1]-dx/length*width/2*side;positions.push(x,heightAt(x,z)+.058,z);uv.push(x*.55,z*.55);}
   if(j&&dry(p[0],p[1],.5)&&dry(prev[0],prev[1],.5)){const n=(j-1)*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);paths.push({a:prev,b:p,width});}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const o=mesh(g,s.path,land);o.name=id+'-neighborhood-lane';o.userData.noCollision=true;o.castShadow=false;
 }
 function patch(x,z,r,material=s.path){
  const positions=[x,heightAt(x,z)+.048,z],uv=[x*.5,z*.5],indices=[];
  for(let k=0;k<=40;k++){const a=k/40*Math.PI*2,rr=r*(.86+Math.sin(a*3)*.08+Math.cos(a*5)*.045),px=x+Math.sin(a)*rr,pz=z+Math.cos(a)*rr;positions.push(px,heightAt(px,pz)+.048,pz);uv.push(px*.5,pz*.5);if(k&&dry(px,pz,.3)&&dry(x,z,.3))indices.push(0,k,k+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const o=mesh(g,material,land);o.userData.noCollision=true;o.castShadow=false;o.name=id+'-courtyard-paving';
 }
 function place(x,z,w,d,key,yaw=null){
  w*=HOUSE_WIDTH_SCALE;d*=HOUSE_WIDTH_SCALE;
  if(plots.length>=104)return false;
  const access=nearestRoad(x,z);yaw??=Math.atan2(access.x-x,access.z-z);
  const cos=Math.abs(Math.cos(yaw)),sin=Math.abs(Math.sin(yaw)),b={x,z,w:cos*(w+1.3)+sin*(d+2.3),d:sin*(w+1.3)+cos*(d+2.3)},radius=Math.hypot(w/2+.6,d/2+1.15);
  if(Math.abs(x)>128||Math.abs(z)>128||c.clearCorridor(x,z,radius)||houseInRiver(x,z,b.w,b.d)||!dry(x,z,Math.min(w,d)*.45)||spots.some(p=>Math.hypot(x-p.x,z-p.z)<p.r+radius)||plots.some(p=>Math.abs(x-p.x)<(b.w+p.w)/2+1.1&&Math.abs(z-p.z)<(b.d+p.d)/2+1.1))return false;
  const heights=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([a,bz])=>heightAt(x+a*b.w/2,z+bz*b.d/2));if(Math.max(...heights)-Math.min(...heights)>2.1)return false;
  const count=c.obstacles.length,house=buildHouse(c,x,z,w/HOUSE_WIDTH_SCALE,d/HOUSE_WIDTH_SCALE,plots.length,yaw);house.userData.district=key;house.userData.settlement=true;
  if(c.obstacles.length===count)c.obstacles.push({x,z,w:(cos*w+sin*d)/2+.3,d:(sin*w+cos*d)/2+.3});
  plots.push(b);
  if(!districts.has(key)){const marker=new T.Group();marker.name='settlement-district';marker.userData={village:id,district:key,houses:0};land.add(marker);districts.set(key,marker);}districts.get(key).userData.houses++;
  const start=[x+Math.sin(yaw)*(d/2+2.5),z+Math.cos(yaw)*(d/2+2.5)],end=nearestRoad(...start),points=[],length=Math.hypot(end.x-start[0],end.z-start[1]),steps=Math.max(2,Math.ceil(length/.8));
  paths.push({a:[x,z],b:start,width:w+.6});
  for(let j=0;j<=steps;j++){const t=j/steps;points.push([start[0]+(end.x-start[0])*t+Math.sin(t*Math.PI)*.45,start[1]+(end.z-start[1])*t]);}lane(points);
  return true;
 }
 const centralKey={water:'fishers-street',fire:'forge-bazaar',lightning:'relay-street',wind:'mill-cottages'}[id],central=[];
 if(id==='water'){for(const x of [-18,-8,8,18,29])for(const z of [-34,-22,18,30,41])central.push([x,z]);}
 if(id==='fire'){for(const z of [-34,-24,-14,14,24,34])for(const x of [-42,-32,-22,-12,12,22,32,42])central.push([x,z]);}
 if(id==='lightning'){for(let row=-3;row<=3;row++)for(let col=-4;col<=4;col++)central.push([col*9.5+(row%2)*4.75,row*10.8]);}
 if(id==='wind'){for(const [cx,cz] of [[-24,12],[15,26],[24,-19],[-23,-24]])for(let k=0;k<16;k++){const a=-.7+k*.24;central.push([cx+Math.sin(a)*12,cz+Math.cos(a)*12]);}}
 for(let k=0;k<central.length;k++){const [x,z]=central[k];if(plots.length<26)place(x,z,3.4+k%3*.35,3.2+k%2*.4,centralKey);}
 if(plots.length<15)for(let k=0;k<36;k++){const a=k*Math.PI/18;if(plots.length<20)place(Math.sin(a)*43,Math.cos(a)*43,3.7,3.6,centralKey);}
 if(id==='water')for(const axis of ['main','east'])for(let z=-116;z<=120;z+=10)for(const side of [-1,1]){
  const river=riverAt(id,z),center=axis==='main'?river.x:46+Math.sin(z*.025)*9,width=axis==='main'?river.width:7;if(plots.length<56)place(center+side*(width+10),z,4.1,3.8,axis+'-quays',-side*Math.PI/2);
 }
 for(const zone of region.zones.filter(z=>!z.platform&&!['crater','red-cliff','summit-lotus'].includes(z.id))){
  const districtStart=plots.length,quota=id==='water'?6:10;
  for(const radius of [15,24,32])for(let k=0;k<16;k++){
   if(plots.length>=districtStart+quota)continue;
   if(id==='wind'&&k>10)continue;
   const a=k*Math.PI/8+(id==='lightning'?Math.PI/6:.35),x=id==='fire'?zone.x+(k%4-1.5)*9:zone.x+Math.sin(a)*radius,z=id==='fire'?zone.z+(Math.floor(k/4)-1.5)*9+(radius-24)*.65:zone.z+Math.cos(a)*radius;place(x,z,3.7+k%3*.4,3.5+k%2*.4,zone.id);
  }
 }
 for(const [x,z,w,d] of region.houses)place(x,z,w,d,'outer-street');
 for(const p of paths)c.reserveLane(p);
 patch(0,0,12);
 for(const zone of region.zones)if(!zone.platform&&!['red-cliff','summit-lotus'].includes(zone.id))patch(zone.x,zone.z,id==='wind'?7:8);
 const yardMaterial=M(id==='fire'?'#655649':id==='water'?'#8d998b':id==='lightning'?'#777485':'#92956c');
 function dress(x,z){
  if(!dry(x,z,2.7)||c.clearCorridor(x,z,2.6)||plots.some(p=>Math.abs(x-p.x)<p.w/2+2&&Math.abs(z-p.z)<p.d/2+2)||spots.some(p=>Math.hypot(x-p.x,z-p.z)<p.r+2))return false;
  const g=c.group(x,z);g.name=id+'-street-life';g.userData.kind=id==='water'?'net-drying':id==='fire'?'smith-yard':id==='lightning'?'relay-yard':'farmyard';patch(x,z,3.2,yardMaterial);
  if(id==='water'){
   for(const side of [-1,1])cyl(g,s.wood,side*1.5,1.6,0,.09,3.2,6);
   box(g,s.wood,0,3,0,3.3,.12,.14);
   const net=new T.Group();net.userData.noCollision=true;g.add(net);
   for(let k=0;k<10;k++)box(net,M('#6b786a'),-1.35+k*.3,1.6,0,.018,2.4,.018);
   for(let k=0;k<9;k++)box(net,M('#6b786a'),0,.4+k*.28,0,2.8,.018,.018);
   for(let k=0;k<4;k++){const fish=mesh(new T.OctahedronGeometry(.23),M('#b2c2b9'),net,-1+k*.65,2.25,0);fish.scale.set(.55,1.4,.3);}
   for(const side of [-1,1]){cyl(g,s.wood,side*.9,.35,1.05,.4,.7,8);cyl(g,M('#b2a879'),side*.9,.72,1.05,.42,.1,8);}
  }else if(id==='fire'){
   for(const side of [-1,1])box(g,s.stone,side*1.4,1.3,0,.4,2.6,.4);
   box(g,s.roof,0,2.8,0,3.7,.22,2.6);box(g,s.stone,-.8,.6,0,1,1.2,1.2);box(g,M('#e08036',.3),-.8,1.22,0,.7,.05,.8);
   box(g,s.wood,.9,.65,.3,1.1,1.3,1.1);box(g,M('#494a48'),.9,1.45,.3,1.1,.3,.5);box(g,M('#494a48'),.9,1.7,.3,.55,.22,.6);
   for(let k=0;k<4;k++)cyl(g,s.wood,-1.2+k*.38,.2,1.6,.15,.8,6).rotation.z=Math.PI/2;
  }else if(id==='lightning'){
   for(const side of [-1,1]){cyl(g,s.stone,side*1.2,.45,0,.45,.9,6);cyl(g,s.wood,side*1.2,2.7,0,.13,5.4,6);for(let k=0;k<3;k++){const ring=mesh(new T.TorusGeometry(.25,.055,4,14),M('#c7c2ba'),g,side*1.2,4.2+k*.27,0);ring.rotation.x=Math.PI/2;}}
   const points=[];for(let k=0;k<=12;k++){const t=k/12;points.push(new T.Vector3(-1.2+t*2.4,5-.35*Math.sin(t*Math.PI),0));}
   g.add(new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:'#4b4654'})));
   box(g,s.stone,0,.5,.9,1.2,1,1);box(g,M('#b59a65'),0,1.05,.9,.7,.1,.6);mesh(new T.OctahedronGeometry(.3),M('#b7a2d4',.3),g,0,1.4,.9);
  }else{
   for(const side of [-1,1]){for(const z of [-1.5,1.5])box(g,s.wood,side*1.8,.65,z,.17,1.3,.17);for(const y of [.5,1])c.solidMesh(box(g,s.wood,side*1.8,y,0,.12,.12,3.3),{name:'farm-fence',stepable:false});}
   for(let k=0;k<4;k++)for(let j=0;j<5;j++){const crop=mesh(new T.ConeGeometry(.12,.6,4),M(k%2?'#b6a35f':'#889459'),g,-1.2+k*.65,.3,-1.2+j*.55);crop.userData.noCollision=true;}
   const bale=cyl(g,M('#b8a064'),0,.6,2,.65,1.4,10);bale.rotation.z=Math.PI/2;
  }
  scaleBuildingUVs(g);c.reserveYard({x,z,r:3});return true;
 }
 let dressed=0;
 yards:for(const zone of [{x:0,z:0},...region.zones.filter(z=>!z.platform)])for(let k=0;k<36;k++){const a=k*2.4,r=9+k%5*4;if(dress(zone.x+Math.sin(a)*r,zone.z+Math.cos(a)*r))dressed++;if(dressed>=40)break yards;}
 const summary=new T.Group();summary.name='settlement-layout';summary.userData={village:id,houses:plots.length,innerHouses:plots.filter(p=>Math.hypot(p.x,p.z)<45).length,districts:[...districts.keys()],yards:dressed};land.add(summary);
 return plots.length;
}
