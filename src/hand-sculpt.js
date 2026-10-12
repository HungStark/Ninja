import * as T from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const fingerShapes = [
  {name:'index',base:[-.047,.079,0],length:.170,radius:.0138,angle:0},
  {name:'middle',base:[-.015,.092,0],length:.190,radius:.0144,angle:0},
  {name:'ring',base:[.018,.083,0],length:.175,radius:.0137,angle:0},
  {name:'little',base:[.048,.060,0],length:.133,radius:.0118,angle:0},
  {name:'thumb',base:[-.067,.005,0],length:.128,radius:.0164,angle:.35}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,k)=>{const h=clamp(.5+.5*(b-a)/k,0,1);return b*(1-h)+a*h-k*h*(1-h);};
export function handUV(part,u,v) {
  return part==='palm'?[.02+.46*u,.02+.96*v]:[.52+.46*u,.02+part*.192+.008+clamp(v,0,1)*.176];
}
export function fingerRadius(f,t) {
  return f.radius*(1.02-.16*clamp(t,0,1)+.035*Math.exp(-Math.pow((t-.46)/.08,2)));
}
function fingerPoint(f,x,y,z) {
  const dx=x-f.base[0],dy=y-f.base[1],c=Math.cos(f.angle),s=Math.sin(f.angle);
  return [dx*c+dy*s,-dx*s+dy*c,z/ .88];
}
function palmDistance(x,y,z) {
  const width=.039+.025*clamp((y+.13)/.17,0,1);
  const qx=Math.abs(x)-(width-.017),qy=Math.abs(y+.018)-.092,qz=Math.abs(z)-.009;
  return Math.hypot(Math.max(qx,0),Math.max(qy,0),Math.max(qz,0))+Math.min(Math.max(qx,qy,qz),0)-.017;
}
function fingerDistance(f,p) {
  const along=clamp(p[1],-.018,f.length-f.radius*.9);
  return Math.hypot(p[0],p[1]-along,p[2])-fingerRadius(f,along/f.length);
}
// Generate only during asset export: a smooth union joins the fingers, webbing and palm.
export function sculptHand(fingers) {
  const resolution=88, min=[-.145,-.15,-.058], span=[.242,.458,.116];
  const mc=new MarchingCubes(resolution,new T.MeshBasicMaterial(),false,false,40000);
  mc.isolation=0;
  for(let z=0;z<resolution;z++) for(let y=0;y<resolution;y++) for(let x=0;x<resolution;x++) {
    const px=min[0]+x/resolution*span[0],py=min[1]+y/resolution*span[1],pz=min[2]+z/resolution*span[2];
    let d=palmDistance(px,py,pz);
    for(const f of fingers) {
      const p=fingerPoint(f,px,py,pz),fd=fingerDistance(f,p);
      d=smooth(d,fd,p[1]<.022?.010:.0025);
    }
    mc.field[x+y*resolution+z*resolution*resolution]=-d;
  }
  mc.update();
  if(mc.count/3>=40000)throw new Error('Hand sculpture exceeds geometry budget');
  const geo=new T.BufferGeometry();
  geo.setAttribute('position',new T.BufferAttribute(mc.positionArray.slice(0,mc.count*3),3));
  geo.setAttribute('normal',new T.BufferAttribute(mc.normalArray.slice(0,mc.count*3),3));
  geo.scale(...span.map(v=>v/2));geo.translate(...min.map((v,i)=>v+span[i]/2));
  const positions=geo.attributes.position,uv=[],skinIndex=[],skinWeight=[];
  for(let i=0;i<positions.count;i++) {
    const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
    let closest=null,score=Infinity,local;
    for(const f of fingers) {
      const p=fingerPoint(f,x,y,z),along=clamp(p[1],-.018,f.length);
      const distance=Math.hypot(p[0],p[1]-along,p[2])/f.radius;
      if(distance<score){score=distance;closest=f;local=p;}
    }
    const t=local[1]/closest.length;
    if(t<-.08||score>2.1) {
      uv.push(...handUV('palm',(Math.atan2(z/.026,x/.065)+Math.PI*2)%(Math.PI*2)/(Math.PI*2),clamp((y+.13)/.24,0,1)));
    } else {
      const u=(Math.atan2(local[2],local[0])+Math.PI*2)%(Math.PI*2)/(Math.PI*2);
      uv.push(...handUV(fingers.indexOf(closest),u,t));
    }
    // Blend the same distance fields that form the sculpture. Choosing only the
    // closest finger creates a discontinuous bone seam through each webbed root.
    const fields=fingers.map(f=>{const p=fingerPoint(f,x,y,z);return {f,p,d: fingerDistance(f,p)};});
    const pd=palmDistance(x,y,z),nearest=Math.min(pd,...fields.map(v=>v.d));
    const weights=new Map([[0,Math.exp((nearest-pd)/.0035)]]);
    for(const {f,p,d} of fields) {
      const influence=Math.exp((nearest-d)/.0035),q=p[1]/f.length,[j0,j1,j2]=f.ids;
      let joints;
      if(q<.34)joints=[[j0,1]];
      else if(q<.58){const w=(q-.34)/.24;joints=[[j0,1-w],[j1,w]];}
      else if(q<.67)joints=[[j1,1]];
      else if(q<.87){const w=(q-.67)/.20;joints=[[j1,1-w],[j2,w]];}
      else joints=[[j2,1]];
      for(const [id,w] of joints)weights.set(id,(weights.get(id)||0)+influence*w);
    }
    const selected=[...weights].sort((a,b)=>b[1]-a[1]).slice(0,4),total=selected.reduce((sum,v)=>sum+v[1],0);
    while(selected.length<4)selected.push([0,0]);
    skinIndex.push(...selected.map(v=>v[0]));skinWeight.push(...selected.map(v=>v[1]/total));
  }
  geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinIndex,4));
  geo.setAttribute('skinWeight',new T.Float32BufferAttribute(skinWeight,4));
  const merged=mergeVertices(geo,1e-6);geo.dispose();mc.geometry.dispose();mc.material.dispose();
  return merged;
}
