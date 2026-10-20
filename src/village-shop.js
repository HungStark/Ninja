import * as T from 'three';
import {REGIONS,regionMetrics,waterwayAt,riverAt,terrainHeight} from './adventure-world.js';
import {buildGabledRoof} from './adventure-landmarks.js';

export function planVillageShop(id,targets=[]){
  // Commerce stays in the same place after bosses fall or the treaty party arrives.
  targets=[...targets.filter(t=>!['boss','treaty','envoy'].includes(t.kind)),{x:REGIONS[id].boss.x,z:REGIONS[id].boss.z}];
  const limit=regionMetrics(id).limit;
  const segmentDistance=(x,z,t)=>{const u=Math.max(0,Math.min(1,(x*t.x+z*t.z)/(t.x*t.x+t.z*t.z||1)));return Math.hypot(x-u*t.x,z-u*t.z);};
  const dry=(x,z)=>id==='water'?waterwayAt(x,z).distance>waterwayAt(x,z).width+1:id==='ice'||Math.abs(x-riverAt(id,z).x)>riverAt(id,z).width+1;
  let best=null,score=-Infinity;
  for(const r of [24,31,39,48])for(let k=0;k<32;k++){
    const a=k*Math.PI/16,x=Math.round(Math.cos(a)*r),z=Math.round(Math.sin(a)*r);
    if(Math.abs(x)>limit-12||Math.abs(z)>limit-17)continue;
    const points=[[-8,-5],[8,-5],[-8,9],[8,9],[0,12],[0,0]].map(([dx,dz])=>[x+dx,z+dz]);
    if(points.some(([px,pz])=>!dry(px,pz)))continue;
    const heights=points.map(([px,pz])=>terrainHeight(id,px,pz)),slope=Math.max(...heights)-Math.min(...heights);
    if(slope>1.6||targets.some(t=>Math.abs(t.x-x)<10&&Math.abs(t.z-z-2)<13))continue;
    const zones=Math.min(...REGIONS[id].zones.filter(t=>!t.platform).map(t=>Math.hypot(t.x-x,t.z-z)-Math.min(t.radius,10)));
    const roads=Math.min(...targets.map(t=>segmentDistance(x,z,t)));
    const value=Math.min(roads,13)*2+Math.min(zones,12)-slope*8-r*.15;
    if(value>score){score=value;best={x,z,base:Math.max(...heights)};}
  }
  if(!best)throw new Error('No safe shop plot in '+id);
  return {...best,w:14,d:16,entry:{x:best.x,z:best.z+12}};
}

export function buildVillageShop(c,plot){
  const {v,id,group,box,cyl,mesh,M,solidMesh}=c,g=group(plot.x,plot.z);g.position.y=plot.base;g.name='village-shop';g.userData={shop:true,village:id,plot:{...plot}};
  // All merchandise is outside the closed building; a broad porch stays walkable.
  g.userData.noCollision=true;
  const wall=M(id==='nameless'?'#b3a183':id==='ice'?'#b7c2c2':'#c1b694'),wood=M('#5c4835'),roof=M(v.roof),accent=M(v.color),floor=.45;
  const foundation=box(g,M('#797c70'),0,-.81,1,14.6,2.4,11.6);solidMesh(foundation,{name:'shop-foundation',stepable:true});
  const building=box(g,wall,0,floor+2.9,0,14,5.8,8);solidMesh(building,{name:'shop-closed-building',stepable:false});
  const porch=box(g,wood,0,.31,6,14.6,.28,4);solidMesh(porch,{name:'shop-porch',stepable:true});
  const entryGround=c.heightAt(plot.x,plot.z+10)-plot.base;
  for(let k=0;k<7;k++){const top=entryGround+(floor-entryGround)*(k+1)/7,bottom=entryGround-.25,step=box(g,M('#7c7460'),0,(top+bottom)/2,10.7-k*.4,3.4,top-bottom,.5);solidMesh(step,{name:'shop-entry-step',stepable:true});}
  buildGabledRoof(c,g,14,8,6.25,.39,roof,wall);
  for(const side of [-1,1]){
    box(g,wood,side*6.85,3.25,4.1,.18,5.8,.2);box(g,wood,side*6.85,2.2,7.65,.18,3.6,.18);
    box(g,wood,side*4.6,3.4,4.08,3.7,2.6,.14);box(g,M('#404f4c'),side*4.6,3.4,4.17,3.3,2.2,.06);
    box(g,accent,side*4.6,4.75,4.2,3.8,.25,.3);
    const light=mesh(new T.SphereGeometry(.23,7,5),M('#e8c784',.35),g,side*6.2,3.15,7.6);light.scale.y=1.5;
  }
  box(g,wood,0,2.45,4.1,2.5,4,.2);for(let i=-3;i<=3;i++)box(g,M('#77634a'),i*.31,2.44,4.22,.25,3.7,.075);
  const awning=box(g,accent,0,4.35,6.2,14.7,.15,4.8);awning.rotation.x=.1;
  for(let i=-6;i<=6;i++)box(g,M('#d8c9a0'),i*1.06,4.1,8.3,.4,.3,.12);
  box(g,wood,0,5.48,4.27,7.2,1.05,.25);
  if(typeof document!=='undefined'){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=160;const ctx=canvas.getContext('2d');ctx.fillStyle='#392e24';ctx.fillRect(0,0,1024,160);ctx.fillStyle='#e6d2a2';ctx.font='bold 58px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('THƯƠNG HỘI · '+v.name.toUpperCase(),512,80,970);
    const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const sign=mesh(new T.PlaneGeometry(7,.9),new T.MeshBasicMaterial({map:texture}),g,0,5.48,4.412);sign.userData.noCollision=true;
  }
  const counter=box(g,wood,4,1.05,6.35,3.4,1.2,1.1);solidMesh(counter,{name:'shop-counter',stepable:false});
  for(let i=0;i<3;i++){box(g,M('#a9b7b9'),3.2+i*.68,1.69,6.3,.42,.06,.42).rotation.y=i*.7;}
  for(const side of [-1,1])box(g,wood,-4.5+side*.75,1.6,5.2,.1,2.3,.1);
  box(g,wood,-4.5,2.75,5.2,1.6,.1,.12);
  const mannequin=cyl(g,M('#96947d'),-4.5,1.59,5.2,.4,1.1,6);mannequin.scale.z=.55;
  for(const side of [-1,1])box(g,accent,-4.5+side*.23,1.6,5.42,.39,.7,.16);
  box(g,wood,-2.8,1.05,6.2,1,.9,.9);box(g,M('#8f7756'),-2.8,1.5,6.2,.65,.45,.4);
  c.obstacles.push({x:plot.x,z:plot.z,w:7.2,d:4.2});
  return {root:g,merchant:{x:plot.x+4,z:plot.z+5.25,y:plot.base+floor}};
}
