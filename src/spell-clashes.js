const EPSILON=1e-7;
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0),sub=(a,b)=>a.map((v,i)=>v-b[i]);

// Compare outgoing damage before the target's armor, keeping each attack's own units.
export function cancelSpellDamage(a,b,damageScale=()=>1){
  const sa=Math.max(0,damageScale(a)),sb=Math.max(0,damageScale(b));
  const da=Math.max(0,a.damage||0)*sa,db=Math.max(0,b.damage||0)*sb,cancelled=Math.min(da,db);
  a.damage=sa>0?Math.max(0,da-cancelled)/sa:0;
  b.damage=sb>0?Math.max(0,db-cancelled)/sb:0;
  return {cancelled,aDestroyed:a.damage<=EPSILON,bDestroyed:b.damage<=EPSILON};
}

// A swept sphere against the actual width, height and depth of a moving wave.
export function waveContactTime(wave,start,end,pointStart,pointEnd=pointStart,padding=0){
  const local=(p,w)=>[(p[0]-w[0])*-wave.normal[2]+(p[2]-w[2])*wave.normal[0],p[1],(p[0]-w[0])*wave.normal[0]+(p[2]-w[2])*wave.normal[2]];
  const a=local(pointStart,start),b=local(pointEnd,end),low=[-wave.width/2-padding,-padding,-(wave.depth??2.4)/2-padding],high=[wave.width/2+padding,wave.height+padding,(wave.depth??2.4)/2+padding];
  let enter=0,leave=1;
  for(let i=0;i<3;i++){
    const d=b[i]-a[i];
    if(Math.abs(d)<1e-8){if(a[i]<low[i]||a[i]>high[i])return null;continue;}
    const t1=(low[i]-a[i])/d,t2=(high[i]-a[i])/d;
    enter=Math.max(enter,Math.min(t1,t2));leave=Math.min(leave,Math.max(t1,t2));
    if(enter>leave)return null;
  }
  return enter;
}

// Continuous SAT keeps crossing or angled waves from tunnelling through each other.
export function waveClashTime(a,aEnd,b,bEnd){
  const across=w=>[-w.normal[2],0,w.normal[0]],aa=across(a),ba=across(b);
  const extent=(w,side,axis)=>Math.abs(dot(side,axis))*w.width/2+Math.abs(dot(w.normal,axis))*(w.depth??2.4)/2;
  const offset=sub(b.p,a.p),velocity=sub(sub(bEnd,b.p),sub(aEnd,a.p));let enter=0,leave=1;
  for(const axis of [aa,a.normal,ba,b.normal]){
    const radius=extent(a,aa,axis)+extent(b,ba,axis),distance=dot(offset,axis),speed=dot(velocity,axis);
    if(Math.abs(speed)<1e-8){if(Math.abs(distance)>radius)return null;continue;}
    const t1=(-radius-distance)/speed,t2=(radius-distance)/speed;
    enter=Math.max(enter,Math.min(t1,t2));leave=Math.min(leave,Math.max(t1,t2));
    if(enter>leave)return null;
  }
  return enter;
}

export function resolveWaveClashes(shots,endFor,damageScale=()=>1){
  const live=w=>w.style==='tsunami'&&w.phase==='flying'&&w.life>0&&!w.consumedByDefense;
  const waves=shots.filter(live),contacts=[];
  for(let i=0;i<waves.length;i++)for(let j=i+1;j<waves.length;j++){
    const a=waves[i],b=waves[j];if(a.owner===b.owner)continue;
    const time=waveClashTime(a,endFor(a),b,endFor(b));if(time!==null)contacts.push({a,b,time});
  }
  contacts.sort((a,b)=>a.time-b.time);
  for(const {a,b} of contacts){
    if(!live(a)||!live(b))continue;
    const result=cancelSpellDamage(a,b,damageScale);
    if(result.aDestroyed){a.life=0;a.consumedByDefense=true;}
    if(result.bDestroyed){b.life=0;b.consumedByDefense=true;}
  }
}
