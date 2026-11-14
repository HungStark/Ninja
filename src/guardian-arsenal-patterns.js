import {gameAudio} from './game-audio.js';
export function skillTools(a,c){
 const target=()=>c.target(a.targetId)||c.choose(true),src=c.source(a),at=(key,time,fn)=>c.once(a,key,time,fn);
 const direction=(from,to)=>c.unit(c.flat(c.sub(to,from)));
 const predict=(t,lead=.25)=>c.predict(t,Math.min(.8,Math.max(0,lead)));
 const later=(delay,fn)=>{const e=c.entity('arsenal-event',[0,0,0],{life:delay+.1});e.update=()=>{if(e.age+1e-6<delay)return;fn();c.destroy(e);};return e;};
 const mark=(p,r,delay,fn,shape='pillar')=>c.warning(p,r,delay,fn,shape,0,src);
 const weightCue=()=>{if(c.clock-(c.memory.weightCueAt??-1)<.18)return;c.memory.weightCueAt=c.clock;gameAudio.cue(c.id==='earth'?'stone-impact':'energy-fire',.3);};
 const hurt=(p,r=a.radius,damage=a.damage,extra={})=>{if(r>1.4&&damage>20)weightCue();return c.area(p,r,damage,extra,src);};
 const fire=(p,d,extra={})=>c.projectile(p,d,{damage:a.damage,speed:14,r:a.radius<.8?a.radius:.35,life:3.5,src,...extra});
 const fan=(count=a.count,spread=1.5,point=null,extra={})=>{const t=target();if(!t)return;const p=[c.body[0],1.5,c.body[2]],goal=point||predict(t,.3),theta=c.angle(p,goal);for(let i=0;i<count;i++){const angle=theta+(count===1?0:(i/(count-1)-.5)*spread);fire(p,[Math.sin(angle),0,Math.cos(angle)],extra);}};
 const swipe=(key,time,range=a.range,arc=Math.PI*.8,damage=a.damage,extra={})=>{
  at('tell-'+key,Math.max(0,time-.42),()=>{const t=target();if(!t)return;a.swipes??={};const from=[...c.body],d=direction(from,predict(t,.15));a.swipes[key]={from,d};for(const angle of [-arc/2,0,arc/2]){const theta=Math.atan2(d[0],d[2])+angle;c.telegraphLine(from,c.add(from,[Math.sin(theta)*range,0,Math.cos(theta)*range]),.13,.42);}});
  at('hit-'+key,time,()=>{const s=a.swipes?.[key];if(!s)return;c.cone(s.from,s.d,range,arc,damage,extra,src);c.flash(c.add(s.from,c.mul(s.d,range*.6)),1.2);});
 };
 const rush=(key,time,damage=a.damage,extra={})=>{const t=target();if(!t)return;const lead=Math.max(0,time-a.age)+.2,d=c.dash(a,key,predict(t,lead),time,.3/(c.id==='ice'?(c.memory.iceSpeed||1):1),a.radius,damage,extra);if(d?.done&&!d.weightCue){d.weightCue=true;weightCue();}return d;};
 const patch=(tag,p,r=2,life=6,props={})=>c.zone(tag,p,r,life,{src,...props});
 const image=(p,real=false,life=5)=>{const e=c.object('clone',c.fitBody(p,'land'),18,.65,life,{family:'shadow',real,afterimage:true,sourceBoss:c.id,targetId:target()?.id,guided:real,origin:[...p],speed:real?5:2.5,attackAt:real?1.1:1.5,warning:.5,damage:real?a.damage*.6:0,explosionDamage:0,seed:c.random()*6,src});return e;};
 const plant=(kind,p,hp=30,life=9)=>{
  const mapped=kind==='grass'?'spirit':kind==='flower'?'flower':kind==='ironwood'?'rock':kind==='worldtree'?'tree':kind;
  const e=c.object(mapped,p,hp,kind==='worldtree'?1.8:1,life,{plant:kind,growth:0,tick:0,healRate:kind==='grass'?.002:0,linkMultiplier:.2,rootInterval:2,warning:.7,damage:a.damage*.6,r:1,delay:2.2,seedCount:6,speed:8,slow:.15,slowTime:1,healFraction:0,thornDamage:5,thornRadius:1.5,solid:kind==='ironwood',links:[],src});return e;
 };
 const ice=(p,r=2.1,life=8)=>{const e=c.object('ice-spike',p,26,r,life,{tag:'ice',height:.35,src});e.root.scale.y=.055;e.kind='ice-sheet';return e;};
 const ring=(p,damage=a.damage,speed=10,gap=null)=>{const e=c.entity('arsenal-ring',[...p],{life:3,r:.1,hit:new Set(),src});const mesh=c.circle([0,0,0],1,c.designColor,false,e.root);e.update=dt=>{const old=e.r;e.r+=dt*speed;mesh.scale.setScalar(e.r);for(const t of c.targets){if(e.hit.has(t.id)||gap&&Math.abs(t.pos[0]-gap.x)<gap.width/2)continue;const d=c.distance(p,t.pos);if(d>=old-.6&&d<=e.r+.6){e.hit.add(t.id);c.emit(damage,t,{ground:true},src);}}};return e;};
 const aimPoints=(count=a.count)=>{const t=target();return Array.from({length:count},(_,i)=>i===0&&t?predict(t,.35):c.randomPoint({radius:a.radius}));};
 const channel=(kind,threshold=.09)=>{c.memory.channel={kind,until:c.clock+a.duration-a.age,hp:c.maxHp*threshold,broken:false};};
 return {target,src,at,direction,predict,later,mark,hurt,fire,fan,swipe,rush,patch,image,plant,ice,ring,aimPoints,channel};
}

export function arsenalResources(c){return {images:c.all('clone').filter(e=>e.afterimage),feathers:c.all('feather'),plants:[...c.all('spirit'),...c.all('tree'),...c.all('flower'),...c.all('rock')].filter(e=>e.plant),ice:c.all('ice'),fire:c.all('fire'),water:[...c.all('puddle'),...c.all('vortex')]};}
