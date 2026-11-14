import * as T from 'three';

// Animate the existing tube rings along their anatomical curve. A short bounded
// position history lets the tail trail a turn instead of sliding as one rigid S.
export function createGuardianDragonMotion(body){
 const tubes=[],scales=[],delta=Array.from({length:13},()=>new T.Vector3()),hx=new Float64Array(32),hz=new Float64Array(32),ht=new Float64Array(32);
 let cursor=0,count=0,lastTime=-Infinity;
 body.traverse(m=>{
  if(!m.isMesh)return;
  if(['serpentine-dragon','dragon-white-underbelly'].includes(m.name)){
   const geometry=m.geometry,path=geometry.parameters.path,rings=geometry.parameters.tubularSegments,radial=geometry.parameters.radialSegments;geometry.computeBoundingSphere();geometry.boundingSphere.radius+=1.2;
   tubes.push({m,rings,radial,rest:new Float32Array(geometry.attributes.position.array),normals:new Float32Array(geometry.attributes.normal.array),centers:Array.from({length:rings+1},(_,i)=>path.getPointAt(i/rings)),tangents:Array.from({length:rings+1},(_,i)=>path.getTangentAt(i/rings))});
  }else if(['white-belly-scale','dragon-dorsal-fin'].includes(m.name))scales.push({m,p:m.position.clone(),rotation:m.rotation.z});
 });
 const reference=tubes[0];for(const s of scales){let nearest=0,miss=Infinity;reference?.centers.forEach((p,i)=>{const d=p.distanceToSquared(s.p);if(d<miss){nearest=i;miss=d;}});s.ring=nearest;}
 const offset=new T.Vector3(),normal=new T.Vector3(),tangent=new T.Vector3(),q=new T.Quaternion(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function past(wanted){let newer=(cursor+31)%32;for(let i=1;i<count;i++){const older=(cursor+31-i)%32;if(ht[older]<=wanted){const k=clamp((wanted-ht[older])/Math.max(.0001,ht[newer]-ht[older]),0,1);offset.set(hx[older]+(hx[newer]-hx[older])*k,0,hz[older]+(hz[newer]-hz[older])*k);return;}newer=older;}offset.set(hx[newer],0,hz[newer]);}
 return {
  update(time,speed,position,yaw,worldScale,charge,reducedMotion){
   const x=position?.[0]||0,z=position?.[2]||0,previous=(cursor+31)%32;if(time<lastTime||(count&&Math.hypot(x-hx[previous],z-hz[previous])>12)){cursor=count=0;}lastTime=time;hx[cursor]=x;hz[cursor]=z;ht[cursor]=time;cursor=(cursor+1)%32;count=Math.min(32,count+1);
   const moving=Math.min(1,speed/4),frequency=1.1+moving*3.2;
   for(let i=0;i<13;i++){
    const t=i/12,phase=time*frequency+t*Math.PI*2,amplitude=(.055+moving*.32)*(1-t*.75)*(reducedMotion?0:1);past(time-(1-t)*.35);
    const dx=offset.x-x,dz=offset.z-z,lx=(dx*Math.cos(yaw)-dz*Math.sin(yaw))/(worldScale.x||1),lz=(dx*Math.sin(yaw)+dz*Math.cos(yaw))/(worldScale.z||1),limit=(1-t)*.85,length=Math.hypot(lx,lz)||1,k=Math.min(1,limit/length);
    delta[i].set(lx*k+Math.sin(phase)*amplitude,Math.cos(phase)*amplitude*.22,lz*k+Math.cos(phase*.7)*amplitude*.18);
   }
   for(const d of tubes){const p=d.m.geometry.attributes.position,n=d.m.geometry.attributes.normal;
    for(let i=0;i<=d.rings;i++){
     const di=delta[Math.round(i/d.rings*12)],before=delta[Math.max(0,Math.round(i/d.rings*12)-1)],after=delta[Math.min(12,Math.round(i/d.rings*12)+1)],center=d.centers[i];
     tangent.copy(d.tangents[i]).addScaledVector(offset.copy(after).sub(before),.6).normalize();q.setFromUnitVectors(d.tangents[i],tangent);
     for(let j=0;j<=d.radial;j++){const at=i*(d.radial+1)+j,k=at*3;offset.set(d.rest[k]-center.x,d.rest[k+1]-center.y,d.rest[k+2]-center.z).applyQuaternion(q);p.setXYZ(at,center.x*(1-charge*.07)+offset.x+di.x,center.y+offset.y+di.y,center.z+offset.z+di.z);normal.set(d.normals[k],d.normals[k+1],d.normals[k+2]).applyQuaternion(q);n.setXYZ(at,normal.x,normal.y,normal.z);}
    }
    p.needsUpdate=n.needsUpdate=true;
   }
   for(const s of scales){s.m.position.copy(s.p).add(delta[s.ring]);s.m.position.x-=s.p.x*charge*.07;s.m.rotation.z=s.rotation+delta[s.ring].x*.2;}
   return {headShiftX:delta[12].x,headShiftY:delta[12].y,headShiftZ:delta[12].z,headYaw:(delta[12].x-delta[11].x)*.4,swimPhase:time*frequency,tailLag:.35};
  }
 };
}
