import {sweepTsunami} from './tsunami.js';
import {cancelSpellDamage,waveContactTime} from './spell-clashes.js';
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),clamp=v=>Math.max(0,Math.min(1,v));
// Closest distance between finite segments, including stationary spell volumes.
export function segmentDistanceSquared(p,q,a,b){
  const d1=sub(q,p),d2=sub(b,a),r=sub(p,a),aa=dot(d1,d1),ee=dot(d2,d2),f=dot(d2,r);let s=0,t=0;
  if(aa<=1e-9&&ee<=1e-9)return dot(r,r);
  if(aa<=1e-9)t=clamp(f/ee);
  else{const c=dot(d1,r);if(ee<=1e-9)s=clamp(-c/aa);else{const bb=dot(d1,d2),denom=aa*ee-bb*bb;s=denom?clamp((bb*f-c*ee)/denom):0;t=(bb*s+f)/ee;if(t<0){t=0;s=clamp(-c/aa);}else if(t>1){t=1;s=clamp((bb-c)/aa);}}}
  const delta=r.map((v,i)=>v+d1[i]*s-d2[i]*t);return dot(delta,delta);
}
export function sweepSnowball(attack,context){
  const start=attack.old,end=attack.p,touches=(p,r=0,q=p)=>segmentDistanceSquared(p,q,start,end)<=(attack.size+r)**2;
  const nature=context.nature;
  for(const wave of context.shots||[])if(wave.owner!==attack.owner&&wave.style==='tsunami'&&wave.phase==='flying'&&wave.life>0&&!wave.consumedByDefense&&waveContactTime(wave,wave.p,wave.p,start,end,attack.size)!==null){
    const result=cancelSpellDamage(attack,wave,context.damageScale);if(result.bDestroyed){wave.life=0;wave.consumedByDefense=true;}
    if(result.aDestroyed)return;
  }
  for(const ball of [...nature.balls])if(ball.owner!==attack.owner&&ball.phase==='rolling'&&touches(ball.p,ball.spell.radius,ball.old||ball.p)){
    const result=cancelSpellDamage(attack,ball,context.damageScale);if(result.bDestroyed)nature.shatter(ball);
    if(result.aDestroyed)return;
  }
  sweepTsunami({...attack,normal:attack.v,width:attack.size*2,height:attack.size*2,depth:attack.size*2,carried:[]},start,end,{...context,destroyClones:true,intersectsWave:(p,q,a,b,n,w,h,r=0)=>touches(p,r,q)});
  for(const shot of context.shots||[])if(shot.style!=='tsunami'&&shot.owner!==attack.owner&&shot.life>0&&touches(shot.p,shot.size||0,shot.old||shot.p)){shot.life=0;shot.consumedByDefense=true;}
}
