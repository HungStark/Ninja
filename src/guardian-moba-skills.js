// Skill choreography uses combat primitives supplied by the simulation. Every
// delayed event is an encounter-owned entity or a cast event, so pause/reset is exact.
const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
function aimed(a,c){return c.target(a.targetId)||c.choose(true)||c.aimTargets[0];}
function points(a,c,count,targeted=1,avoid=null){
 const chosen=aimed(a,c),list=[chosen,...c.aimTargets.filter(t=>t.id!==chosen?.id)].filter(Boolean),result=[];
 for(let i=0;i<count;i++){const t=list[i%list.length];let p=i<targeted&&t?[...t.pos]:c.randomPoint({avoid,radius:a.radius||1});if(i>0&&i<targeted&&list.length===1)p=c.fit(c.add(c.predict(t,.5),[1.4,0,0]));result.push(p);}return result;
}
function warn(a,c,p,shape,extra={},after=null,delay=a.warning||.8){
 const src=c.source(a);return c.warning(p,a.radius||1,delay,e=>{c.area(e.p,e.r,a.damage||0,extra,src);after?.(e);},shape,0,src);
}
function bolts(a,c,count,targeted,callback){for(const p of points(a,c,count,targeted))warn(a,c,p,'bolt',{},callback);}
function eruptRocks(a,c,test){for(const rock of [...c.all('rock')])if(test(rock)){c.explodeObject(rock,a.damage*.5,6,{src:c.source(a),style:'shard'});}}
function shoot(a,c,p,dir,extra={}){return c.projectile(p,dir,{damage:a.damage,speed:a.speed||10,r:a.radius||.35,life:a.life||4,src:c.source(a),...extra});}
function direction(c,a,b){return c.unit(c.flat(c.sub(b,a)));}

export function updateGuardianSkill(a,c,dt){
 const target=aimed(a,c);if(!target)return;
 const src=c.source(a),origin=[c.body[0],1.7,c.body[2]],at=(key,time,fn)=>c.once(a,key,time,fn);
 switch(a.type){
 case 'fox-pillars':
  at('pillars',0,()=>{for(const p of points(a,c,Math.min(a.maxCount,a.count+c.tails)))warn(a,c,p,'flame',{},e=>c.zone('fire',e.p,e.r,a.zoneLife,{dps:a.zoneDps,applyStacks:true,src}));});break;
 case 'fox-homing':{
  const count=a.count+c.tails;
  for(let i=0;i<count;i++)at(i,a.windup+i*a.interval,()=>{
   const t=i===0?c.choose(true):c.aimTargets[i%c.aimTargets.length],p=c.add(origin,[(i-count/2)*.25,0,0]),destination=i===0?t.pos:c.predict(t,.65);
   shoot(a,c,p,c.sub(destination,p),{style:'fireball',targetId:i===0?t.id:null,homing:i===0?a.homing:0,homingTime:a.homingTime,blastRadius:a.blastRadius,growth:a.growth});
  });break;
 }
 case 'fox-firestorm':
  c.pose.tailSpread=1;
  for(let i=0;i<a.count;i++)at(i,a.windup+i*a.interval,()=>{
   const destinations=i===0?c.aimTargets.filter(t=>c.distance(t.pos,c.body)<45).map(t=>t.pos):points(a,c,Math.min(5,3+c.tails),0,'fire');
   for(const p of destinations)warn(a,c,p,'flame',{},e=>c.zone('fire',e.p,e.r,a.zoneLife,{dps:a.zoneDps,applyStacks:true,src}));
  });
  at('final-warning',a.duration-1.25,()=>{a.finalFrom=[...c.body];a.finalDirection=direction(c,c.body,target.pos);const theta=Math.atan2(a.finalDirection[0],a.finalDirection[2]);for(const offset of [-Math.PI*.45,0,Math.PI*.45])c.telegraphLine(a.finalFrom,c.add(a.finalFrom,[Math.sin(theta+offset)*a.fanRadius,0,Math.cos(theta+offset)*a.fanRadius]),.12,.8,'#ffb25b');});
  at('finale',a.duration-.45,()=>{c.cone(a.finalFrom||c.body,a.finalDirection||direction(c,c.body,target.pos),a.fanRadius,Math.PI*.9,a.fanDamage,{},src);for(const fire of [...c.all('fire')]){c.area(fire.p,fire.r,a.damage,{},src);c.destroy(fire);}});break;
 case 'dragon-pressure':
  at('warning',0,()=>{a.end=c.predict(target,.7);a.beamFrom=[...origin];a.dir=direction(c,origin,a.end);a.end=c.add(origin,c.mul(a.dir,Math.min(a.range,c.distance(origin,a.end)+4)));a.visuals.push(c.telegraphLine(origin,a.end,a.radius*.25,a.windup));});
  at('beam',a.windup,()=>a.visuals.push(c.beam(origin,a.end,a.radius,a.beamDuration)));
  if(a.age>=a.windup&&a.age<a.windup+a.beamDuration){
   a.tick=(a.tick||0)+dt;if(a.tick>=a.tickInterval){const elapsed=a.tick;a.tick=0;const wide=c.all('puddle').some(p=>c.along(p.p,origin,a.end)<p.r);
    for(const t of c.targets){const delta=c.flat(c.sub(t.pos,a.end)),inCone=wide&&c.length(delta)<a.endRadius&&dot(c.unit(delta),a.dir)>Math.cos(a.coneAngle);
     if(c.along(t.pos,origin,a.end)<a.radius+.45||inCone){const result=c.emit(a.damagePerSecond*elapsed,t,{blockable:true,old:origin,p:t.pos},src);if(result.damage>0)c.moveTarget(t,c.add(t.pos,c.mul(a.dir,a.pushSpeed*elapsed)));}
    }
    if(wide)c.flash(a.end,a.endRadius,'#8ed6f1');
   }
  }break;
 case 'dragon-vortices':
  at('vortices',0,()=>{for(const p of points(a,c,a.count))c.warning(p,a.radius,a.warning,()=>{
   const e=c.entity('vortex',[p[0],.03,p[2]],{r:a.radius,life:a.life+(a.lingerTime||8),activeTime:a.life,centers:new Map(),tick:0,src,...c.parameters(a)});e.life=a.life+(a.lingerTime||8);e.age=0;e.kind='vortex';
   for(let i=0;i<4;i++){const m=c.circle([0,i*.16,0],a.radius*(1-i*.2),'#60bce3',false,e.root);m.position.y=i*.16;}
  },'pillar',0,src);});break;
 case 'dragon-tsunami':
  for(let i=0;i<a.count;i++)at(i,a.windup+i*a.interval,()=>c.prepareWave(a,target,i));break;
 case 'wolf-dashes':
  at('plans',0,()=>{a.plans=Array.from({length:a.count},(_,i)=>{const t=c.aimTargets[i%c.aimTargets.length];return i===0?[...t.pos]:c.fit(c.add(t.pos,[(c.random()-.5)*8,0,(c.random()-.5)*6]));});});
  for(let i=0;i<a.count;i++){
   const current=c.aimTargets[i%c.aimTargets.length],side=i===1?(i%2?-1:1)*1.5:0,destination=c.fit(c.add(c.predict(current,.28),[side,0,0]));
   const d=c.dash(a,i,destination,a.windup+i*a.interval,a.rushDuration,a.radius,a.damage);
   if(d?.done&&!d.trail){d.trail=true;c.trail('electric',d.from,d.to,a.trailWidth,a.zoneLife,{dps:a.zoneDps,src});}
  }break;
 case 'wolf-bolts':
  at('bolts',0,()=>bolts(a,c,a.count,1,e=>{
   for(const field of c.all('electric'))if(c.overlaps(field,e.p,e.r)){field.r*=a.growth;for(const m of field.root.children)m.scale.x*=a.growth;c.area(field.p,field.r+1,a.explosionDamage,{},src);field.life=Math.max(field.life,field.age+.75);}
  }));break;
 case 'wolf-clones':
  at('clones',a.windup,()=>{for(let i=0;i<a.count;i++){const theta=i*Math.PI*2/a.count,t=c.aimTargets[i%c.aimTargets.length],p=c.fit(c.add(c.body,[Math.sin(theta)*2,0,Math.cos(theta)*2]));c.object('clone',p,a.hp,a.radius,a.life,{family:'lightning',targetId:t.id,guided:true,origin:[...p],seed:theta,tick:0,src,...c.parameters(a)});}});break;
 case 'eagle-blades':
  for(let i=0;i<a.count;i++)at(i,a.windup+i*a.interval,()=>{
   const t=c.aimTargets[i%c.aimTargets.length],theta=i<2?c.angle(origin,c.predict(t,.4))+(i?-.08:.08):c.random()*Math.PI*2;
   shoot(a,c,origin,[Math.sin(theta),0,Math.cos(theta)],{style:'windblade',piercing:true,range:a.range,speedBoost:a.speedBoost,lifeBoost:a.lifeBoost});
  });break;
 case 'eagle-tornadoes':
  at('tornadoes',a.windup,()=>{for(let i=0;i<a.count;i++){const p=i===0?c.fit(c.add(target.pos,[-3,0,-2])):c.randomPoint({radius:a.radius}),e=c.entity('tornado',p,{...c.parameters(a),r:a.radius,origin:[...p],targetId:target.id,guided:i===0,seed:c.random()*6,tick:0,airAt:new Map(),stored:0,src});for(let j=0;j<5;j++){const m=c.circle([0,.3+j*.5,0],a.radius*(.3+j*.16),'#a1ead5',false,e.root);m.position.y=.3+j*.5;}}});break;
 case 'eagle-dive':
  at('warning',0,()=>{a.locked=[...target.pos];a.start=[...c.body];a.visuals.push(c.warning(a.locked,a.radius,a.windup+a.rushDuration,null,'pillar',0,src));});
  if(a.age<a.windup)c.setAirborne(8*Math.min(1,a.age/.7));
  else if(a.age<a.windup+a.rushDuration){const q=(a.age-a.windup)/a.rushDuration;c.setBody(c.add(a.start,c.mul(c.sub(c.flat(a.locked),a.start),q)));c.setAirborne(8*(1-q));}
  at('land',a.windup+a.rushDuration,()=>{
   c.teleport(a.locked);c.setAirborne(0);c.area(a.locked,a.radius,a.damage,{},src);
   for(let i=0;i<a.count;i++){const t=c.aimTargets[i%c.aimTargets.length],theta=i<2?c.angle(c.body,t.pos)+(i?-.35:.35):c.random()*Math.PI*2;shoot(a,c,[c.body[0],1.1,c.body[2]],[Math.sin(theta),0,Math.cos(theta)],{style:'gust',damage:a.gustDamage,speed:a.gustSpeed,r:a.gustRadius,life:3});}
   for(const tornado of c.all('tornado')){tornado.pullTo=[...c.body];tornado.collapseAt=tornado.age+.4;tornado.collapseSource=src;}
  });break;
 case 'turtle-pillars':
  at('pillars',0,()=>{for(const p of points(a,c,a.count))warn(a,c,p,'pillar',{air:a.controlDuration},e=>c.object('rock',e.p,a.hp,a.radius,a.life,{solid:true,fromPillar:true,src}));});break;
 case 'turtle-quake':
  at('ring',a.windup,()=>{const e=c.entity('quake-ring',[...c.body],{r:.2,life:1.5,speed:a.speed,damage:a.damage,hit:new Set(),src});const ring=c.circle([0,0,0],1,undefined,false,e.root);e.update=step=>{const old=e.r;e.r+=e.speed*step;ring.scale.setScalar(e.r);for(const t of c.targets)if(!e.hit.has(t.id)&&c.distance(t.pos,e.p)>=old-a.radius&&c.distance(t.pos,e.p)<=e.r+a.radius){e.hit.add(t.id);c.emit(e.damage,t,{ground:true},src);}eruptRocks(a,c,r=>c.distance(r.p,e.p)>=old-r.r&&c.distance(r.p,e.p)<=e.r+r.r);};});
  at('cracks',a.windup+a.interval,()=>{a.cracks=[];for(const t of c.aimTargets)for(let j=-1;j<=1;j++){const from=[...c.body],to=c.fit(c.add(t.pos,[j*2,0,0]));a.cracks.push({from,to});c.telegraphLine(from,to,.15,a.interval+a.warning,'#e0bd8d');}});
  at('activate',a.windup+a.interval*2,()=>{const shuffled=[...(a.cracks||[])].sort(()=>c.random()-.5);shuffled.forEach((crack,i)=>c.warning(crack.to,1,a.warning+i*.13,()=>{c.attackLine(crack.from,crack.to,a.radius,a.damage,{ground:true},src);eruptRocks(a,c,r=>c.along(r.p,crack.from,crack.to)<r.r+a.radius);},'pillar',0,src));});break;
 case 'turtle-ram':
  at('warning',0,()=>{a.dir=direction(c,c.body,target.pos);a.bounceCount=0;a.hit=new Set();a.visuals.push(c.telegraphLine(c.body,c.add(c.body,c.mul(a.dir,15)),.25,a.windup));});
  if(a.age<a.windup){c.pose.lean=.3;break;}
  if(a.ramDone)break;
  {
   const old=[...c.body],next=c.add(old,c.mul(a.dir,a.speed*dt)),b=c.bounds(),rock=c.all('rock').find(r=>c.along(r.p,old,next)<r.r+a.radius),wall=c.wallContact(old,next,a.radius),boundary=next[0]<b.minX+a.radius||next[0]>b.maxX-a.radius||next[2]<b.minZ+a.radius||next[2]>b.maxZ-a.radius;
   const grounded=c.fitBody(c.fit(next,a.radius),'walk'),fence=c.distance(grounded,next)>.01;
   c.setBody(grounded,'walk');c.pose.roll=(a.age-a.windup)*9;
   for(const t of c.targets)if(!a.hit.has(t.id)&&c.along(t.pos,old,c.body)<a.radius+.4){a.hit.add(t.id);c.emit(a.damage,t,{},src);}
   if((rock||wall||boundary||fence)&&(a.bouncedAt||0)+.15<a.age){
    a.bouncedAt=a.age;a.bounceCount++;a.hit.clear();let n=rock?direction(c,rock.p,old):wall?.normal||(fence?direction(c,grounded,next):[next[0]<b.minX+a.radius?1:next[0]>b.maxX-a.radius?-1:0,0,next[2]<b.minZ+a.radius?1:-1]);
    if(boundary&&!rock&&!wall)n=[next[0]<b.minX+a.radius?1:next[0]>b.maxX-a.radius?-1:0,0,next[2]<b.minZ+a.radius?1:next[2]>b.maxZ-a.radius?-1:0];n=c.unit(n);
    a.dir=c.unit(c.sub(a.dir,c.mul(n,2*dot(a.dir,n))));const turn=(c.random()-.5)*.6,theta=Math.atan2(a.dir[0],a.dir[2])+turn;a.dir=[Math.sin(theta),0,Math.cos(theta)];c.setDirection(a.dir);
    if(rock){c.explodeObject(rock,a.fanDamage,6,{src});c.gainArmor(c.maxHp*a.armorFraction);}if(wall)wall.hp=Math.max(0,wall.hp-a.damage);
    c.cone(c.body,a.dir,a.fanRadius,Math.PI,a.fanDamage,{ground:true},src);if(a.bounceCount>=a.bounces)a.ramDone=true;
   }
  }break;
 case 'gold-feathers':
  for(let i=0;i<a.count;i++)at(i,a.windup+i*a.interval,()=>{const theta=c.angle(origin,c.predict(c.aimTargets[i%c.aimTargets.length],.4))+(i<3?(i-1)*.06:(c.random()-.5)*a.fanAngle);shoot(a,c,origin,[Math.sin(theta),0,Math.cos(theta)],{style:'feather',armorPiercing:true,featherLife:a.featherLife});});break;
 case 'gold-arcs':
  for(let i=0;i<a.count;i++)at(i,a.windup+i*a.interval,()=>{const theta=c.angle(origin,c.choose(true).pos)+(i?(c.random()<.5?-1:1)*(.55+c.random()*.8):0);shoot(a,c,origin,[Math.sin(theta),0,Math.cos(theta)],{style:'goldarc',piercing:true,arcGroup:a.castId,arcSlow:a.slow,slowTime:a.slowTime});});break;
 case 'gold-swords':
  at('ring',a.windup,()=>{
   const feathers=c.all('feather'),count=Math.max(a.count,feathers.length);for(const f of feathers)c.destroy(f);
   const e=c.entity('sword-ring',c.flat(target.pos),{r:a.radius,life:a.life,shotAt:0,tick:0,targetId:target.id,src}),swords=[];
   c.circle([0,0,0],a.radius,'#f8dc8e',false,e.root);for(let i=0;i<count;i++)swords.push(c.mesh('cone',[0,1.1,0],[.08,.95,.14],'#fff0a5',1,e.root));
   e.update=step=>{const t=c.target(e.targetId);if(t){const d=c.sub(c.flat(t.pos),e.p);e.p=c.add(e.p,c.mul(d,Math.min(1,step*.5)));e.root.position.fromArray(e.p);}e.r=a.radius+(a.endRadius-a.radius)*c.clamp(e.age/e.life,0,1);e.root.children[0].scale.setScalar(e.r);swords.forEach((s,i)=>{const theta=i*Math.PI*2/count+e.age*.7;s.position.set(Math.sin(theta)*e.r,1.1,Math.cos(theta)*e.r);s.rotation.z=theta;});
    e.tick+=step;if(e.tick>=.5){e.tick=0;for(const victim of c.targets)if(Math.abs(c.distance(victim.pos,e.p)-e.r)<.7)c.emit(a.damage,victim,{},src);}
    e.shotAt+=step;if(e.shotAt>=a.interval){e.shotAt=0;const theta=c.random()*Math.PI*2,p=c.add(e.p,[Math.sin(theta)*e.r,1.1,Math.cos(theta)*e.r]);shoot(a,c,p,[Math.sin(theta+.8),0,Math.cos(theta+.8)],{style:'sword',r:.2,life:2});}
   };
  });
  at('final-warning',a.duration-a.warning-.05,()=>{a.finalTarget=[...target.pos];a.visuals.push(c.telegraphLine(c.body,a.finalTarget,.3,a.warning));});
  at('final',a.duration-.05,()=>shoot(a,c,origin,c.sub(a.finalTarget||target.pos,origin),{style:'sword',damage:a.finalDamage,r:.5,life:3,armorPiercing:true}));break;
 case 'shadow-dashes':
  at('plans',0,()=>{a.plans=Array.from({length:a.count},(_,i)=>{if(!i)return [...target.pos];const v=c.length(target.velocity)>.1?c.unit(target.velocity):direction(c,c.body,target.pos),side=[-v[2],0,v[0]];return c.fit(c.add(target.pos,c.add(c.mul(v,2),c.mul(side,(c.random()<.5?-1:1)*4))));});});
  for(let i=0;i<a.count;i++)c.dash(a,i,c.predict(target,.3),a.windup+i*a.interval,a.rushDuration,a.radius,a.damage);
  break;
 case 'shadow-clones':
  at('clones',a.windup,()=>{const real=Math.floor(c.random()*a.count);for(let i=0;i<a.count;i++){const theta=i*Math.PI*2/a.count,p=c.fit(c.add(c.body,[Math.sin(theta)*2.5,0,Math.cos(theta)*2.5]));c.object('clone',p,a.hp,a.radius,a.life,{...c.parameters(a),family:'shadow',real:i===real,targetId:c.choose(true).id,guided:i===0,origin:[...p],seed:c.random()*Math.PI*2,src});}});break;
 case 'shadow-domain':
  at('plan-domain',0,()=>{a.center=[...target.pos];a.points=Array.from({length:a.count},(_,i)=>c.fitBody(c.add(a.center,[Math.sin(i*Math.PI*2/a.count)*a.radius*.65,0,Math.cos(i*Math.PI*2/a.count)*a.radius*.65]),'land'));a.strikes=[];});
  at('domain',a.windup,()=>{c.zone('dark',a.center,a.radius,a.life,{slow:a.slow});for(const p of a.points)a.visuals.push(c.zone('shadow-point',p,.55,a.life));});
  for(let i=0;i<Math.ceil(a.life/a.interval);i++){
   at('tell-'+i,Math.max(0,a.windup+i*a.interval-.5),()=>{const p=a.points[i%a.count],d=direction(c,p,c.predict(target,.2));a.strikes[i]={p,d};c.telegraphLine(p,c.add(p,c.mul(d,a.range)),.2,.5,'#c49cea');});
   at(i,a.windup+i*a.interval,()=>{const strike=a.strikes[i];if(!strike)return;c.teleport(strike.p);c.reveal(.8);c.cone(c.body,strike.d,a.range,Math.PI*.75,a.damage,{},src);for(const clone of c.all('clone').filter(e=>e.family==='shadow')){clone.targetId=target.id;clone.age=Math.min(clone.age,clone.attackAt);}});
  }break;
 case 'stag-vines':
  at('vines',0,()=>{for(const p of points(a,c,a.count)){const near=c.all('spirit').some(s=>c.distance(s.p,p)<4),r=a.radius*(near?a.growth:1);c.warning(p,r,a.warning,e=>{c.area(e.p,e.r,a.damage,{root:a.controlDuration},src);c.zone('vines',e.p,e.r,a.life*(near?a.growth:1),{dps:0});},'vine',0,src);}});break;
 case 'stag-flowers':
  at('flowers',a.windup,()=>{for(const p of points(a,c,a.count))c.object('flower',p,a.hp,.7,a.delay+.5,{...c.parameters(a),src});});break;
 case 'stag-tree':
  at('tree',a.windup,()=>{const b=c.bounds(),p=[(b.minX+b.maxX)/2,0,(b.minZ+b.maxZ)/2];c.object('tree',p,a.hp,a.radius,a.life,{...c.parameters(a),stunTime:a.controlDuration,tick:0,links:[],src});});break;
 case 'tiger-claws':
  if(a.automatic&&(a.dashes?.pounce?!a.dashes.pounce.done:c.distance(c.body,target.pos)>a.range))c.dash(a,'pounce',c.predict(target,.2),a.windup-.32,.3,0,0);
  for(let i=0;i<a.count;i++)at(i,a.windup+i*a.interval,()=>{const t=c.choose(true),d=direction(c,c.body,t.pos),side=[d[2],0,-d[0]],p=i===0?t.pos:i===1?c.fit(c.add(t.pos,c.mul(side,(c.random()<.5?-1:1)*1.8))):c.predict(t,.65);warn(a,c,p,'claw',{ground:true},()=>c.trail('ice',c.add(p,c.mul(d,-1.6)),c.add(p,c.mul(d,1.6)),.8,a.zoneLife,{slow:a.slow}));});break;
 case 'tiger-spikes':
  at('spikes',0,()=>{for(const p of points(a,c,a.count,Math.min(2,c.targets.length===1?2:c.targets.length))){warn(a,c,p,'ice',{air:.25},e=>{const spike=c.object('ice-spike',e.p,a.hp,a.radius,a.life,{solid:true,src});if(c.all('ice').some(z=>c.overlaps(z,e.p))){c.explodeObject(spike,a.shardDamage,a.shardCount,{speed:a.speed,style:'ice-shard',src});}});}});break;
 case 'tiger-blizzard':
  at('storm',a.windup,()=>c.zone('blizzard',c.body,a.radius,a.life,{startRadius:a.radius,maxRadius:a.endRadius,dps:a.damagePerSecond,src}));
  for(let i=0;i<Math.floor(a.life/a.interval);i++)at(i,a.windup+i*a.interval,()=>{const theta=i%2===0?c.angle(c.body,target.pos):c.random()*Math.PI*2;shoot(a,c,origin,[Math.sin(theta),0,Math.cos(theta)],{style:'ice-shard',r:.3,life:3});});
  at('final',a.windup+a.life,()=>{for(const spike of [...c.all('ice-spike')]){for(const t of c.targets)if(c.distance(t.pos,spike.p)<spike.r+2&&c.status(t.id).stacks>=3)c.applySlow(t,a.slow,a.slowTime);c.area(spike.p,spike.r+2,a.explosionDamage,{},src);c.destroy(spike);}});break;
 }
}
