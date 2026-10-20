import * as T from 'three';

// Decorative village vandalism: bounded pool, no damage to permanent buildings.
export function createVandalFireworks(scene){
  const geometry=new T.BufferGeometry(),positions=new Float32Array(144*3),colors=new Float32Array(144*3);
  geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('color',new T.BufferAttribute(colors,3));geometry.setDrawRange(0,0);
  const material=new T.PointsMaterial({size:.17,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,blending:T.AdditiveBlending});
  const points=new T.Points(geometry,material);points.frustumCulled=false;points.name='vandal-firework-sparks';scene.add(points);
  const sparks=[],rockets=[];let timer=0,throws=0,explosions=0;
  function burst(p){explosions++;for(let i=0;i<20;i++){const a=i*2.3999,s=1.3+i%4*.4;sparks.push({p:[...p],v:[Math.sin(a)*s,.7+i%5*.3,Math.cos(a)*s],life:.8,color:i%2?[1,.32,.12]:[1,.8,.28]});}if(sparks.length>144)sparks.splice(0,sparks.length-144);}
  return {update(dt,source,targets){
    if(source){timer-=dt;if(timer<=0){timer=2.4;throws++;const target=targets[(throws-1)%targets.length]||[source.x+5,source.y,source.z-4],p=[source.x,source.y+2,source.z];rockets.push({p,start:[...p],target,age:0});}}
    for(const r of [...rockets]){r.age+=dt;const t=Math.min(1,r.age/.9);r.p=r.start.map((v,i)=>v+(r.target[i]-v)*t+(i===1?Math.sin(Math.PI*t)*3:0));sparks.push({p:[...r.p],v:[0,0,0],life:.3,color:[1,.65,.18]});if(t===1){burst(r.p);rockets.splice(rockets.indexOf(r),1);}}
    for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];s.life-=dt;if(s.life<=0){sparks.splice(i,1);continue;}for(let j=0;j<3;j++)s.p[j]+=s.v[j]*dt;s.v[1]-=dt*2;}
    if(sparks.length>144)sparks.splice(0,sparks.length-144);
    sparks.forEach((s,i)=>{positions.set(s.p,i*3);colors.set(s.color.map(c=>c*Math.min(1,s.life*2)),i*3);});geometry.setDrawRange(0,sparks.length);geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;
  },reset(){timer=0;throws=0;explosions=0;sparks.length=rockets.length=0;geometry.setDrawRange(0,0);},state:()=>({throws,explosions,particles:sparks.length,rockets:rockets.length})};
}
