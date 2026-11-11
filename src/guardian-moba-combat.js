import * as T from 'three';
import {GUARDIAN_BOSS_DESIGNS} from './guardian-boss-designs.js';
import {guardianSkillStats,guardianPassiveStats,GUARDIAN_AI_DEFAULTS as AI} from './guardian-balance.js';
import {gameAudio} from './game-audio.js';
import {updateGuardianSkill} from './guardian-moba-skills.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(v,s)=>v.map(n=>n*s);
const flat=v=>[v[0],0,v[2]],length=v=>Math.hypot(...v),unit=v=>mul(v,1/(length(v)||1));
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
export function guardianSegmentDistance(p,a,b){
 const d=sub(b,a),t=clamp(sub(p,a).reduce((n,v,i)=>n+v*d[i],0)/(length(d)**2||1),0,1);return length(sub(p,add(a,mul(d,t))));
}
const along=(p,a,b)=>guardianSegmentDistance(flat(p),flat(a),flat(b));
const angle=(a,b)=>Math.atan2(b[0]-a[0],b[2]-a[2]);

// The simulation owns every timer, target identity and spawned object. No
// rendering callback advances combat, and resetting an encounter removes it all.
export function createGuardianBossCombat(scene){
 const root=new T.Group();root.name='guardian-distinct-combat';
 const geo={orb:new T.IcosahedronGeometry(1,1),ring:new T.RingGeometry(.93,1,48),disk:new T.CircleGeometry(1,48),box:new T.BoxGeometry(1,1,1),cone:new T.ConeGeometry(1,1,7),crystal:new T.OctahedronGeometry(1),arc:new T.TorusGeometry(1,.08,5,24,Math.PI*1.4),pillar:new T.CylinderGeometry(.7,1,1,8)};
 let id=null,design=null,passive={},phase=2,clock=0,serial=0,castSerial=0,ctx=null,action=null,entities=[],history=[],wait=1.5,attacks=0;
 let body=null,origin=null,pose={},previousBody=null,stationary=0,armor=0,armorLevels=0,armorShell=null,tailCount=0,energy=0,energyTravel=0,speedStacks=0,rage=0,stagger=0,lastCombat=0,ambushReady=false;
 let seed=1,passiveAt=0,comboCursor=0,comboRepeats=0,comboSerial=0,previousCombo='',combo=[],cooldowns={},stats=new Map(),previousTargets=new Map(),safeX=0,enraged=false,movement=0,revealUntil=0;
 const alive=e=>!e.dead;
 const all=tag=>entities.filter(e=>alive(e)&&(e.tag===tag||e.kind===tag));
 const random=()=>{if(ctx?.random)return clamp(ctx.random(),0,.999999999);seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const bounds=()=>ctx?.bounds||{minX:-6,maxX:6,minZ:-25,maxZ:12};
 const attackBounds=()=>ctx?.attackBounds||{minX:bounds().minX,maxX:bounds().maxX,minZ:Math.min(...targets().map(t=>t.pos[2]))-5,maxZ:Math.max(...targets().map(t=>t.pos[2]))+3};
 const fit=(p,r=0)=>{const b=bounds();return [clamp(p[0],b.minX+r,b.maxX-r),p[1]||0,clamp(p[2],b.minZ+r,b.maxZ-r)];};
 const targets=()=>ctx?.targets.filter(t=>!(t.fighter?.hp<=0))||[];
 const target=key=>targets().find(t=>t.id===key);
 function status(key){if(!stats.has(key))stats.set(key,{stacks:0,stackTime:0,markTime:0,markSkill:null,wetTime:0,slow:0,slowTime:0,rootTime:0,freezeImmune:0});return stats.get(key);}
 function choose(nearest=false){
  const list=targets();if(!list.length)return null;
  if(id==='dark'){const marked=list.filter(t=>status(t.id).markTime>0);if(marked.length)return marked.sort((a,b)=>distance(body,a.pos)-distance(body,b.pos))[0];}
  return nearest?[...list].sort((a,b)=>distance(body,a.pos)-distance(body,b.pos))[0]:list[Math.floor(random()*list.length)];
 }
 const predict=(t,seconds=.5)=>fit(add(t.pos,mul(t.velocity||[0,0,0],seconds)));
 function mesh(kind,p,s,color=design?.color||'#ffffff',opacity=.65,parent=root){
  const m=new T.Mesh(geo[kind],new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,depthWrite:opacity===1,side:T.DoubleSide}));m.position.fromArray(p);m.scale.fromArray(s);parent.add(m);return m;
 }
 function circle(p,r,color=design?.color,filled=false,parent=root){const m=mesh(filled?'disk':'ring',[p[0],.065,p[2]],[r,r,r],color,filled?.18:.7,parent);m.rotation.x=-Math.PI/2;return m;}
 function line(a,b,w=.12,color=design?.color,parent=root){const d=sub(b,a),m=mesh('box',add(a,mul(d,.5)),[w,w,Math.max(.001,length(d))],color,.65,parent);m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(...unit(d)));return m;}
 function remove(node){if(!node)return;const materials=new Set();node.traverse(m=>{if(m.material)for(const mat of Array.isArray(m.material)?m.material:[m.material])materials.add(mat);});node.removeFromParent();for(const mat of materials)mat.dispose();}
 function entity(kind,p,properties={}){const group=new T.Group();group.position.fromArray(p);root.add(group);const e={id:++serial,kind,p:[...p],root:group,age:0,life:1,hit:new Set(),...properties};entities.push(e);return e;}
 function flash(p,r=1,color=design?.color){const e=entity('flash',[p[0],.12,p[2]],{r,life:.45});circle([0,0,0],r,color,false,e.root);return e;}
 function destroy(e,broken=false){
  if(!e||e.dead)return;e.dead=true;remove(e.root);if(e.link)destroy(e.link);for(const link of e.links||[])destroy(link);
  if(broken&&e.kind==='spirit')rage=Math.min(passive.rageCap||3,rage+1);
  if(broken&&e.kind==='tree'){stagger=Math.max(stagger,e.stunTime||1.5);cancel(false);}
  if(broken)flash(e.p,e.r||1);
 }
 function randomPoint({avoid=null,near=null,radius=1,reserve=true}={}){
  const b=attackBounds(),occupied=all('hazard');let best;
  for(let i=0;i<36;i++){
   const p=near?fit([near[0]+(random()-.5)*8,.1,near[2]+(random()-.5)*8]):[b.minX+random()*(b.maxX-b.minX),.1,b.minZ+random()*(b.maxZ-b.minZ)];
   best=p;if(reserve&&Math.abs(p[0]-safeX)<1.6+radius)continue;
   if(occupied.some(e=>distance(e.p,p)<radius+e.r+.4))continue;
   if(avoid&&all(avoid).some(e=>distance(e.p,p)<e.r+radius))continue;
   return p;
  }
  // Keep a corridor even when an editor configuration requests a dense pattern.
  return [safeX<(b.minX+b.maxX)/2?b.maxX-radius:b.minX+radius,.1,best?.[2]??b.minZ];
 }
 const source=a=>({type:a?.type||'passive',castId:a?.castId||0,power:a?.power??1});
 function applySlow(t,amount,time){const s=status(t.id);s.slow=Math.max(s.slow,amount);s.slowTime=Math.max(s.slowTime,time);}
 function control(t,kind,time){
  if(!t||t.fighter?.invulnerableTime>0)return;
  if(kind==='root'){status(t.id).rootTime=Math.max(status(t.id).rootTime,time);return;}
  ctx.control?.(kind,time,t.id);
 }
 function moveTarget(t,p){const next=constrain(t.pos,fit(p,.5),.5);ctx.setTargetPosition?.(t.id,next);t.pos=[...next];}
 function applyPassive(t,src){
  const s=status(t.id);s.stackTime=passive.stackDuration||0;
  if(id==='fire'){
   s.stacks=Math.min(passive.stackCount,s.stacks+1);
   if(s.stacks>=passive.stackCount){s.stacks=0;area(t.pos,passive.explosionRadius,passive.explosionDamage,{passive:false},src);zone('fire',t.pos,passive.explosionRadius,passive.zoneLife,{dps:passive.zoneDps,src});}
  }else if(id==='water'){
   s.stacks=Math.min(passive.stackCount,s.stacks+1);if(s.stacks===passive.stackCount){applySlow(t,passive.slow,passive.slowTime);s.wetTime=passive.slowTime;}
  }else if(id==='lightning'){
   if(s.markTime>0&&s.markSkill!==src.type)emit(passive.markDamage,t,{passive:false},src);
   s.markTime=passive.markTime;s.markSkill=src.type;
   if(energy>=passive.energyCap){energy=0;for(const other of targets().filter(o=>o.id!==t.id&&distance(o.pos,t.pos)<=passive.chainRange).sort((a,b)=>distance(a.pos,t.pos)-distance(b.pos,t.pos)).slice(0,passive.chainCount)){telegraphLine(t.pos,other.pos,.12,.25,'#e7d9ff');emit(passive.chainDamage,other,{passive:false},src);}}
  }else if(id==='light'){
   s.stacks=Math.min(passive.stackCount,s.stacks+1);
  }else if(id==='dark'){s.markTime=passive.markTime;}
  else if(id==='ice'){
   s.stacks=Math.min(passive.stackCount,s.stacks+1);
   if(s.stacks>=passive.stackCount&&s.freezeImmune<=0){s.stacks=0;s.freezeImmune=passive.controlDuration+passive.freezeImmunity;control(t,'ice',passive.controlDuration);}
  }
 }
 function emit(amount,t,extra={},src=source(action)){
  if(!ctx||!t||t.fighter?.hp<=0)return {damage:0};
  const s=status(t.id),armorReduction=id==='light'?s.stacks*passive.armorReduction:0,bonus=extra.passive!==false&&id==='light'&&s.stacks>=passive.stackCount,ambush=extra.passive!==false&&id==='dark'&&ambushReady;let damage=amount*(src.power??1)*(phase===3?.6:1);
  if(bonus)damage+=passive.bonusDamage*(phase===3?.6:1);
  if(ambush)damage*=1+passive.firstHitBonus;
  const shot={owner:'enemy',victimId:t.id,element:id,style:'guardian-'+src.type,damage,unreflectable:true,color:design.color,v:unit(sub(t.pos,body)),armorReduction,...extra};
  const result=ctx.impact(shot,t.pos)||shot.hitResult||{damage:0};
  if(result.damage>0){lastCombat=clock;if(extra.passive!==false){if(bonus){s.stacks=0;s.stackTime=0;}if(ambush)ambushReady=false;applyPassive(t,src);}if(extra.slow)applySlow(t,extra.slow,extra.slowTime||1);if(extra.root)control(t,'root',extra.root);if(extra.air)control(t,'air',extra.air);}
  return result;
 }
 function area(p,r,damage,extra={},src){let hits=0;for(const t of targets())if(distance(t.pos,p)<=r+(t.hitboxScale||1)*.45&&(!extra.ground||t.pos[1]<3.5)){if(emit(damage,t,extra,src).damage>0)hits++;}flash(p,r);return hits;}
 function attackLine(a,b,r,damage,extra={},src){let hits=0;for(const t of targets())if(along(t.pos,a,b)<=r+(t.hitboxScale||1)*.45&&(!extra.ground||t.pos[1]<3.5)){if(emit(damage,t,extra,src).damage>0)hits++;}return hits;}
 function cone(p,d,r,arc,damage,extra={},src){
  for(const t of targets()){const delta=flat(sub(t.pos,p));if(length(delta)<=r+.5&&unit(delta).reduce((n,v,i)=>n+v*d[i],0)>=Math.cos(arc/2))emit(damage,t,extra,src);}
  for(let i=0;i<7;i++){const theta=Math.atan2(d[0],d[2])-arc/2+arc*i/6;telegraphLine(p,add(p,[Math.sin(theta)*r,0,Math.cos(theta)*r]),.18,.4);}
 }
 function telegraphLine(a,b,width=.18,life=.7,color='#ff657a'){const e=entity('line',[0,0,0],{life});line([a[0],.12,a[2]],[b[0],.12,b[2]],width,color,e.root);return e;}
 function warning(p,r,delay,fn,shape='pillar',damage=0,src=source(action)){
  const e=entity('hazard',[p[0],.02,p[2]],{r,delay,life:delay+.5,fn,shape,damage,src});circle([0,0,0],r,'#ff6477',true,e.root);circle([0,0,0],r,'#ffb3a6',false,e.root);return e;
 }
 function eruption(e){
  if(e.shape==='bolt'){let last=[0,9,0];for(let i=1;i<=7;i++){const p=[i===7?0:(i%2?-.25:.25),9-i*1.26,0];line(last,p,.15,'#eee5ff',e.root);last=p;}}
  else if(e.shape==='flame')for(let i=0;i<3;i++)mesh('cone',[0,1.5+i*.3,0],[e.r*(1-i*.22),3.4-i*.4,e.r*(1-i*.22)],['#ff5c18','#ff9e37','#ffe2a0'][i],.85,e.root);
  else if(e.shape==='claw')for(let i=-1;i<=1;i++)line([i*.25,.2,-e.r],[i*.25+.7,.2,e.r],.15,'#d0f5ff',e.root);
  else mesh(e.shape==='vine'?'cone':e.shape==='ice'?'crystal':'pillar',[0,1.5,0],[e.r,3,e.r],design.color,.9,e.root);
 }
 function zone(tag,p,r,life,props={}){const e=entity('zone',[p[0],.03,p[2]],{tag,r,life,tick:0,...props});circle([0,0,0],r,tag==='fire'?'#f56b25':tag==='puddle'?'#4b9edf':tag==='electric'?'#c19aff':tag==='ice'?'#abe8ff':design.color,true,e.root);circle([0,0,0],r,design.color,false,e.root);return e;}
 function trail(tag,a,b,width,life,props={}){const e=zone(tag,add(a,mul(sub(b,a),.5)),width,life,{a:[...a],b:[...b],...props});remove(e.root);e.root=new T.Group();root.add(e.root);line([a[0],.08,a[2]],[b[0],.08,b[2]],width*2,design.color,e.root);return e;}
 function object(kind,p,hp,r,life,props={}){
  const e=entity(kind,[p[0],0,p[2]],{hp,maxHp:hp,r,life,...props});circle([0,0,0],r,design.color,false,e.root);
  if(kind==='tree'){mesh('pillar',[0,1.6,0],[.5,3.2,.5],'#7e6540',1,e.root);for(const side of [-1,1]){line([0,2,0],[side*1.4,3.8,0],.23,'#7e6540',e.root);mesh('orb',[side*.8,3.7,0],[1.7,1,1.4],'#71ae62',.9,e.root);}}
  else if(kind==='spirit'){mesh('cone',[0,.9,0],[.5,1.7,.5],'#71a95f',.9,e.root);mesh('orb',[0,1.9,0],[.5,.6,.5],'#e9ffd1',.9,e.root);}
  else if(kind==='flower'){for(let i=0;i<6;i++)mesh('orb',[Math.cos(i*Math.PI/3)*.5,.55,Math.sin(i*Math.PI/3)*.5],[.4,.3,.4],'#e4a1df',.9,e.root);mesh('orb',[0,.65,0],[.3,.3,.3],'#f3e6ad',1,e.root);}
  else if(kind==='feather'){const m=mesh('cone',[0,.55,0],[.1,1.1,.18],'#fff0ad',1,e.root);m.rotation.z=.35;}
  else if(kind==='clone'){
   mesh('orb',[0,.6,0],[.45,.5,.9],design.color,.7,e.root);mesh('cone',[0,.9,.65],[.3,.6,.3],design.color,.9,e.root);for(const s of [-1,1])mesh('orb',[s*.15,1.06,.9],[.055,.055,.07],'#fff6e0',1,e.root);
  }else mesh(kind==='ice-spike'?'crystal':'pillar',[0,1.3,0],[r,2.6,r],design.color,1,e.root);
  if(hp>0){mesh('box',[0,kind==='tree'?5:2.8,0],[1.6,.09,.08],'#243c35',1,e.root);e.healthBar=mesh('box',[0,kind==='tree'?5:2.8,.045],[1.6,.075,.08],'#b4e28b',1,e.root);}
  return e;
 }
 function projectile(p,d,props={}){
  const e=entity('projectile',[...p],{v:unit(d),speed:10,r:.35,life:4,damage:10,src:source(action),...props});
  const m=mesh(e.style==='windblade'?'arc':e.style==='feather'||e.style==='seed'?'cone':'orb',[0,0,0],e.style==='feather'?[.1,.8,.16]:[e.r,e.r,e.r],design.color,.9,e.root);e.model=m;
  return e;
 }
 function radial(p,count,damage,speed=9,props={}){for(let i=0;i<count;i++){const a=i*Math.PI*2/count;projectile([p[0],1.1,p[2]],[Math.sin(a),0,Math.cos(a)],{damage,speed,life:2.5,...props});}}
 function feather(p,life=passive.featherLife||5){return object('feather',fit(p),0,.2,life);}
 function explodeObject(e,damage,count=6,props={}){radial(e.p,count,damage,props.speed||8,{style:'shard',ignoreObject:e.id,...props});flash(e.p,e.r+1);destroy(e);}
 function wave(p,d,props){
  const e=entity('wave',flat(p),{v:unit(flat(d)),progress:0,life:5,r:1,width:36,gap:3,gapOffset:0,damage:30,src:source(action),...props});
  e.wall=mesh('box',[0,1.2,0],[e.width,2.4,.7],design.color,.25,e.root);e.safe=mesh('box',[e.gapOffset,.15,0],[e.gap,.08,50],'#87e5b3',.35,e.root);e.root.rotation.y=Math.atan2(e.v[0],e.v[2]);return e;
 }
 function overlaps(e,p,extra=0){return e.a?along(p,e.a,e.b)<=e.r+extra:distance(e.p,p)<=e.r+extra;}
 function constrain(from,to,padding=.5){
  let goal=[...to];for(const e of entities)if(alive(e)&&e.solid&&e.hp>0){
   const r=e.r+padding,offset=flat(sub(from,e.p)),d=flat(sub(goal,from)),aa=length(d)**2;
   if(!aa)continue;
   if(length(offset)<r-.001){if(distance(goal,e.p)<=length(offset)){const n=unit(flat(sub(goal,e.p)));goal=[e.p[0]+n[0]*r,goal[1],e.p[2]+n[2]*r];}continue;}
   const bb=offset.reduce((n,v,i)=>n+v*d[i],0),cc=length(offset)**2-r*r,disc=bb*bb-aa*cc;if(disc<0)continue;
   const t=(-bb-Math.sqrt(disc))/aa;if(t>=0&&t<=1)goal=add(from,mul(sub(goal,from),Math.max(0,t-.001)));
  }
  return goal;
 }
 function moveBody(to,speed,dt,solid=true){
  const old=[...body],d=flat(sub(to,body)),step=Math.min(length(d),speed*dt);if(step>0)body=fit(add(body,mul(unit(d),step)),1.1);if(solid)body=constrain(old,body,1.1);return distance(old,body);
 }
 function teleport(p){body=fit(flat(p),1.1);flash(body,1.2);}
 function dash(a,key,destination,at,duration,r,damage,extra={}){
  if(!a.dashes)a.dashes={};let d=a.dashes[key];
  if(!d&&a.age>=at-.55){d=a.dashes[key]={from:[...body],to:fit(flat(destination),.8),hit:new Set()};telegraphLine(d.from,d.to,r*.18,Math.max(.15,at-a.age),id==='dark'?'#b78ae8':'#d7bbff');}
  if(!d||a.age<at||d.done)return null;
  const old=[...body],q=clamp((a.age-at)/duration,0,1);body=add(d.from,mul(sub(d.to,d.from),q));
  for(const t of targets())if(!d.hit.has(t.id)&&along(t.pos,old,body)<r+.45){d.hit.add(t.id);const marked=status(t.id).markTime>0;const result=emit(damage,t,extra,source(a));if(result.damage>0&&marked&&a.cooldownReduction&&!a.markCooldownReduced){a.markCooldownReduced=true;a.recoveryScale=a.cooldownReduction;cooldowns[a.index]=Math.max(clock+Math.max(0,a.duration-a.age),clock+Math.max(0,(cooldowns[a.index]||clock)-clock)*a.cooldownReduction);}}
  pose.lean=-.3;pose.yaw=angle(d.from,d.to);if(q>=1){d.done=true;extra.onFinish?.(d);}return d;
 }
 function gainArmor(amount){armor+=amount;flash(body,2,'#d3be8d');if(!armorShell||armorShell.dead){armorShell=entity('armor-visual',[...body],{life:1e6});mesh('orb',[0,1.8,0],[2.6,2,3.1],'#c8ba91',.2,armorShell.root);}}
 function cancel(recovery=true){
  if(action){for(const e of action.visuals||[])destroy(e);wait=recovery?(action.cooldown||0)*(enraged?AI.enrageCooldown:1)*(action.recoveryScale||1):1;}
  action=null;pose={};
 }
 function begin(index,player,boss,fighter){
  if(!design||!Number.isInteger(index)||index<0||index>2)return false;
  if(!body){body=flat(boss);origin=[...boss];}cancel(false);
  const skill=design.skills[index],values=guardianSkillStats(skill.type),chosen=choose(true)||{id:'player',pos:player};
  const power=id==='wood'?1+rage*passive.ragePerSpirit:1;if(id==='wood')rage=0;
  action={...values,...skill,index,age:0,castId:++castSerial,targetId:chosen.id,target:[...chosen.pos],origin:[...body],events:new Set(),visuals:[],power};
  if(id==='dark'){if(hidden())ambushReady=true;revealUntil=clock+(values.windup||.6)+.4;}
  if(id==='wind')speedStacks=Math.min(passive.speedCap,speedStacks+1);
  attacks++;history.push({type:skill.type,name:skill.name,phase,at:clock,combo:comboSerial});if(history.length>48)history.shift();
  cooldowns[index]=clock+values.duration+(values.cooldown||0)*(enraged?AI.enrageCooldown:1);
  gameAudio.cast({element:id,rank:index===2?'SS':'S',style:skill.type});return skill.name;
 }
 function once(a,key,at,fn){if(a.age+1e-7>=at&&!a.events.has(key)){a.events.add(key);fn();}}
 function chooseSkill(){
  const synergy=id==='fire'?all('fire').length?1:0:id==='water'?all('vortex').length?0:1:id==='lightning'?all('electric').length?1:0:id==='wind'?all('tornado').length?0:1:id==='earth'?all('rock').length?1:0:id==='light'?all('feather').length>=4?2:0:id==='dark'?all('clone').length?2:1:id==='wood'?all('spirit').length?1:0:all('ice').length?1:0;
  if(comboCursor>=combo.length){
   let next=[...design.combo];if(enraged&&random()<.35)next=[synergy,...next.filter(i=>i!==synergy)];
   if(random()>(enraged?Math.min(.95,AI.comboChance+.18):AI.comboChance))next=[synergy,...next.filter(i=>i!==synergy)].sort((a,b)=>a===synergy?-1:b===synergy?1:random()-.5);
   const key=next.join('');if(key===previousCombo)comboRepeats++;else comboRepeats=1;
   if(comboRepeats>AI.maxRepeatedCombos){next=[next[1],next[0],next[2]];comboRepeats=1;}
   previousCombo=next.join('');combo=next;comboCursor=0;comboSerial++;
  }
  const requested=combo[comboCursor],available=[0,1,2].filter(i=>(cooldowns[i]||0)<=clock);
  if(id==='ice'&&requested===0&&choose(true)&&distance(body,choose(true).pos)>7)return null;
  if(!available.length)return null;
  const chosen=available.includes(requested)?requested:available.includes(synergy)?synergy:available[0];if(chosen===requested)comboCursor++;return chosen;
 }
 function tickPassives(dt){
  for(const s of stats.values()){for(const key of ['stackTime','markTime','wetTime','slowTime','rootTime','freezeImmune'])s[key]=Math.max(0,s[key]-dt);if(!s.stackTime)s.stacks=0;if(!s.slowTime)s.slow=0;}
  if(id==='fire')tailCount=Math.max(tailCount,Math.min(passive.tailCap,Math.floor((1-ctx.fighter.hp/ctx.fighter.maxHp+1e-7)/passive.healthThreshold)));
  if(id==='water'&&clock>=passiveAt){passiveAt=clock+passive.puddleInterval;zone('puddle',randomPoint({radius:passive.puddleRadius}),passive.puddleRadius,passive.puddleLife);}
  if(id==='wind'&&clock>=passiveAt){passiveAt=clock+passive.windInterval;const b=bounds();trail('wind',[b.minX,.1,b.minZ],[b.minX,.1,b.maxZ],passive.windWidth,passive.windLife,{v:[1,0,0],speed:passive.windSpeed});}
  if(id==='wood'&&clock>=passiveAt){passiveAt=clock+passive.spiritInterval;if(all('spirit').length<passive.spiritCap)object('spirit',randomPoint({radius:.7}),passive.hp,.65,passive.life,{healRate:passive.healRate});}
  if(id==='dark'&&clock-lastCombat>=passive.hideAfter)ambushReady=true;
  if(id==='earth'){
   const level=Math.floor((1-ctx.fighter.hp/ctx.fighter.maxHp+1e-7)/passive.healthThreshold);
   while(armorLevels<level&&armorLevels<6){armorLevels++;gainArmor(ctx.fighter.maxHp*passive.armorFraction);}
  }
 }
 function steer(dt){
  if(!body||stagger>0||action?.dashing||['wolf-dashes','shadow-dashes','turtle-ram','eagle-dive','shadow-domain'].includes(action?.type))return;
  const t=choose(true);if(!t)return;
  const d=distance(body,t.pos),range=passive.engageRange||8,melee=['lightning','dark','ice','earth'].includes(id),casting=!!action;
  let destination=[...body];
  if(d>range+1.4)destination=[...t.pos];else if(!melee&&d<range*.65)destination=add(body,mul(unit(flat(sub(body,t.pos))),4));
  else if(!melee&&!casting){const theta=angle(body,t.pos)+(Math.floor(clock/3)%2?1:-1)*Math.PI/2;destination=add(body,[Math.sin(theta)*1.5,0,Math.cos(theta)*1.5]);}
  let speed=passive.moveSpeed||2;
  if(id==='water'&&all('puddle').some(e=>overlaps(e,body)))speed*=1+passive.speedBoost;
  if(id==='wind')speed*=1+speedStacks*passive.speedPerCast;
  if(id==='dark'&&hidden())speed*=1+passive.speedBoost;
  if(id==='ice'&&action?.type==='tiger-blizzard')speed*=1+action.speedBoost;
  if(casting&&id!=='ice')speed*=.45;
  moveBody(destination,speed,dt);
 }
 function updateZones(e,dt){
  if(e.v){const delta=mul(e.v,e.speed*dt);e.p=add(e.p,delta);if(e.a){e.a=add(e.a,delta);e.b=add(e.b,delta);e.root.position.add(new T.Vector3(...delta));}else e.root.position.fromArray(e.p);}
  e.tick+=dt;const interval=.5;
  if(e.dps&&e.tick>=interval){const elapsed=e.tick;e.tick=0;for(const t of targets())if(overlaps(e,t.pos,.45))emit(e.dps*elapsed,t,{passive:e.applyStacks===true,ground:true},e.src);}
  if(e.tag==='blizzard'){e.p=[...body];e.r=e.startRadius+(e.maxRadius-e.startRadius)*clamp(e.age/e.life,0,1);e.root.position.fromArray(e.p);e.root.scale.setScalar(e.r/e.startRadius);}
 }
 function projectileInteraction(e){
  if(e.style==='fireball'&&!e.enlarged&&all('fire').some(z=>overlaps(z,e.p))){e.enlarged=true;e.r*=e.growth||1.4;e.blastRadius*=e.growth||1.4;e.root.scale.multiplyScalar(e.growth||1.4);}
  if(e.style==='windblade'&&!e.boosted&&all('wind').some(z=>overlaps(z,e.p))){e.boosted=true;e.speed*=e.speedBoost||1.4;e.life*=e.lifeBoost||1.5;}
  if(e.style==='seed')for(const spirit of all('spirit'))if(distance(spirit.p,e.p)<spirit.r+e.r){spirit.hp=Math.min(spirit.maxHp,spirit.hp+spirit.maxHp*e.healFraction);area(spirit.p,e.thornRadius,e.thornDamage,{passive:false},e.src);destroy(e);return;}
 }
 function updateProjectile(e,dt){
  if(e.age<(e.delay||0))return;
  const t=target(e.targetId);if(t&&e.homing&&e.age<e.homingTime){const desired=unit(sub(t.pos,e.p));e.v=unit(add(mul(e.v,Math.max(0,1-dt*e.homing)),mul(desired,Math.min(1,dt*e.homing))));}
  const old=[...e.p];e.p=add(e.p,mul(e.v,e.speed*dt));e.travel=(e.travel||0)+e.speed*dt;projectileInteraction(e);if(e.dead)return;
  if(e.style==='goldarc')for(const f of [...all('feather')])if(along(f.p,old,e.p)<f.r+e.r){projectile([f.p[0],1.1,f.p[2]],e.v,{style:'feather',damage:e.damage*.5,speed:e.speed,life:3,armorPiercing:true,src:e.src,featherLife:passive.featherLife});destroy(f);}
  const shot={owner:'enemy',element:id,style:'guardian-'+e.src.type,damage:e.damage*e.src.power*(phase===3?.6:1),old,p:[...e.p],size:e.r,v:e.v};
  if(ctx.interceptProjectile?.(shot)){if(e.style==='feather')feather(e.p,e.featherLife);flash(e.p,e.r);destroy(e);return;}
  e.damage=shot.damage/(e.src.power*(phase===3?.6:1)||1);
  for(const obstacle of entities)if(alive(obstacle)&&obstacle.solid&&obstacle.id!==e.ignoreObject&&obstacle.hp>0&&along(obstacle.p,old,e.p)<obstacle.r+e.r){const spent=Math.min(e.damage,obstacle.hp);obstacle.hp-=spent;e.damage-=spent;if(obstacle.hp<=0)destroy(obstacle,true);if(e.damage<=0){if(e.style==='feather')feather(e.p,e.featherLife);destroy(e);return;}}
  for(const victim of targets())if(!e.hit.has(victim.id)&&guardianSegmentDistance(victim.pos,old,e.p)<e.r+.5*(victim.hitboxScale||1)){
   e.hit.add(victim.id);
   if(e.blastRadius)area(e.p,e.blastRadius,e.damage,{},e.src);else emit(e.damage,victim,{armorPiercing:!!e.armorPiercing,slow:e.slow,slowTime:e.slowTime},e.src);
   if(e.arcGroup){const s=status(victim.id);s.arcHits??=new Map();const hits=(s.arcHits.get(e.arcGroup)||0)+1;s.arcHits.set(e.arcGroup,hits);if(s.arcHits.size>8)s.arcHits.delete(s.arcHits.keys().next().value);if(hits>=2)applySlow(victim,e.arcSlow,e.slowTime);}
   if(!e.piercing){destroy(e);return;}
  }
  e.root.position.fromArray(e.p);e.root.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...e.v));
  const b=bounds();if(e.age>=e.life||e.travel>e.range||e.p[0]<b.minX-3||e.p[0]>b.maxX+3||e.p[2]<b.minZ-4||e.p[2]>b.maxZ+4){if(e.style==='feather'&&!e.hit.size)feather(e.p,e.featherLife);destroy(e);}
 }
 function updateVortex(e,dt){
  if(e.age>e.activeTime){e.root.scale.setScalar(.7);return;}
  for(const puddle of all('puddle'))if(distance(e.p,puddle.p)<e.absorbRange){e.r*=e.growth;destroy(puddle);e.root.scale.multiplyScalar(e.growth);}
  e.root.rotation.y+=dt*3;
  for(const t of targets())if(distance(t.pos,e.p)<e.r+.5){const d=unit(flat(sub(e.p,t.pos)));moveTarget(t,add(t.pos,mul(d,e.pullSpeed*dt)));const held=(e.centers.get(t.id)||0)+(distance(t.pos,e.p)<e.r*.3?dt:0);e.centers.set(t.id,held);if(held>=e.centerTime&&!e.hit.has(t.id)){e.hit.add(t.id);control(t,'air',e.controlDuration);}}
  e.tick+=dt;if(e.tick>=.5){e.tick=0;for(const t of targets())if(distance(t.pos,e.p)<e.r)emit(e.damage,t,{},e.src);}
 }
 function updateTornado(e,dt){
  if(e.pullTo){const d=flat(sub(e.pullTo,e.p));e.p=add(e.p,mul(unit(d),Math.min(length(d),20*dt)));e.root.position.fromArray(e.p);if(e.age>=e.collapseAt){area(e.pullTo,e.r+1,e.damage*2,{},e.collapseSource);destroy(e);}return;}
  const t=target(e.targetId),goal=t&&e.guided?t.pos:fit([e.origin[0]+Math.sin(e.age*.9+e.seed)*4,0,e.origin[2]+Math.cos(e.age*.7+e.seed)*4]);
  const d=flat(sub(goal,e.p));e.p=fit(add(e.p,mul(unit(d),Math.min(length(d),e.speed*dt))),.5);e.root.position.fromArray(e.p);e.root.rotation.y+=dt*4;
  for(const shot of all('projectile'))if(shot.style==='windblade'&&!shot.recycled&&distance(e.p,shot.p)<e.r+shot.r){e.stored++;destroy(shot);}
  e.tick+=dt;if(e.tick>=e.tickInterval){e.tick=0;for(const victim of targets())if(distance(victim.pos,e.p)<e.r+.45){emit(e.damage,victim,{},e.src);if(distance(victim.pos,e.p)<e.r*.3&&(e.airAt.get(victim.id)||0)<clock){e.airAt.set(victim.id,clock+2);control(victim,'air',e.controlDuration);}}if(e.stored){radial(e.p,Math.min(8,3+e.stored),e.damage,10,{style:'windblade',recycled:true,src:e.src});e.stored=0;}}
 }
 function updateClone(e,dt){
  const t=target(e.targetId)||choose(true);if(!t){destroy(e);return;}
  if(e.family==='lightning'&&e.age>=e.returnAt){
   if(!e.link)e.link=telegraphLine(e.p,body,e.linkWidth,e.life-e.age,'#d7bbff');
   remove(e.link.root);e.link.root=new T.Group();root.add(e.link.root);line([e.p[0],.4,e.p[2]],[body[0],.4,body[2]],e.linkWidth,'#d7bbff',e.link.root);
   const old=[...e.p];e.p=add(e.p,mul(unit(flat(sub(body,e.p))),Math.min(distance(e.p,body),e.returnSpeed*dt)));
   e.tick+=dt;if(e.tick>=.4){const elapsed=e.tick;e.tick=0;for(const victim of targets())if(along(victim.pos,e.p,body)<e.linkWidth+.4)emit(e.linkDps*elapsed,victim,{passive:false,slow:e.slow,slowTime:1},e.src);}
   if(distance(e.p,body)<.5){destroy(e.link);destroy(e);return;}e.root.position.fromArray(e.p);return;
  }
  if(e.family==='shadow'&&e.age>=e.attackAt){
   if(!e.warned){e.warned=true;e.attackFrom=[...e.p];e.attackTo=e.real?[...t.pos]:randomPoint({near:t.pos});telegraphLine(e.attackFrom,e.attackTo,.18,e.warning,'#b78ae8');}
   if(e.age<e.attackAt+e.warning)return;
   if(e.real){const old=[...e.p],d=flat(sub(e.attackTo,e.p));e.p=add(e.p,mul(unit(d),Math.min(length(d),22*dt)));if(along(t.pos,old,e.p)<e.r+.5){emit(e.damage,t,{},e.src);destroy(e);}else if(distance(e.p,e.attackTo)<.2)destroy(e);}
   else{area(e.p,1.5,e.explosionDamage,{},e.src);destroy(e);}e.root.position.fromArray(e.p);return;
  }
  const goal=e.guided?t.pos:fit(add(e.origin,[Math.sin(e.seed)*5,0,Math.cos(e.seed)*5]));
  const d=flat(sub(goal,e.p)),old=[...e.p];e.p=add(e.p,mul(unit(d),Math.min(length(d),e.speed*dt)));
  if(e.family==='lightning'&&along(t.pos,old,e.p)<e.r+.45){area(e.p,1.3,e.damage,{},e.src);destroy(e);return;}
  e.root.position.fromArray(e.p);e.root.rotation.y=angle(old,e.p);e.root.children.forEach((m,i)=>{if(m.isMesh)m.rotation.z=Math.sin(e.age*7+i)*.08;});
 }
 function updateWave(e,dt){
  const old=[...e.p];e.p=add(e.p,mul(e.v,e.speed*dt));e.root.position.fromArray(e.p);
  const side=[e.v[2],0,-e.v[0]],span=e.speed*dt;
  for(const t of targets()){
   if(e.hit.has(t.id))continue;const delta=flat(sub(t.pos,old)),forward=delta.reduce((n,v,i)=>n+v*e.v[i],0),across=delta.reduce((n,v,i)=>n+v*side[i],0),padding=.5*(t.hitboxScale||1);
   if(forward>=-e.r-padding&&forward<=span+e.r+padding&&Math.abs(across)<e.width/2&&Math.abs(across-e.gapOffset)>e.gap/2-padding){e.hit.add(t.id);emit(e.damage,t,{},e.src);}
  }
  for(const vortex of all('vortex')){const delta=flat(sub(vortex.p,old)),forward=delta.reduce((n,v,i)=>n+v*e.v[i],0),across=delta.reduce((n,v,i)=>n+v*side[i],0);if(forward>=-e.r-vortex.r&&forward<=span+e.r+vortex.r&&Math.abs(across)<e.width/2){area(vortex.p,vortex.r+1,e.damage,{},e.src);destroy(vortex);}}
 }
 function updateEntities(dt){
  for(const e of [...entities]){
   if(e.dead)continue;e.age+=dt;
   if(e.healthBar)e.healthBar.scale.x=1.6*clamp(e.hp/e.maxHp,0,1);
   if(e.kind==='hazard'){
    if(e.age>=e.delay&&!e.fired){e.fired=true;eruption(e);if(e.damage)area(e.p,e.r,e.damage,{},e.src);e.fn?.(e);}
    if(!e.fired)e.root.children[0].material.opacity=.15+.15*(1+Math.sin(e.age*13));
   }else if(e.kind==='zone')updateZones(e,dt);
   else if(e.kind==='projectile')updateProjectile(e,dt);
   else if(e.kind==='vortex')updateVortex(e,dt);
   else if(e.kind==='tornado')updateTornado(e,dt);
   else if(e.kind==='clone')updateClone(e,dt);
   else if(e.kind==='wave')updateWave(e,dt);
   else if(e.kind==='spirit')ctx.fighter.hp=Math.min(ctx.fighter.maxHp,ctx.fighter.hp+ctx.fighter.maxHp*e.healRate*dt);
   else if(e.kind==='tree'){
    ctx.fighter.hp=Math.min(ctx.fighter.maxHp,ctx.fighter.hp+ctx.fighter.maxHp*e.healRate*(1+all('spirit').length*e.linkMultiplier)*dt);
    e.tick+=dt;if(e.tick>=e.rootInterval){e.tick=0;const t=choose();if(t)warning(t.pos,e.r,e.warning,()=>{},'vine',e.damage,e.src);}
    const spirits=all('spirit');for(const link of e.links)if(!spirits.some(s=>s.id===link.spiritId))destroy(link);e.links=e.links.filter(alive);
    for(const spirit of spirits){let link=e.links.find(l=>l.spiritId===spirit.id);if(!link){link=telegraphLine([e.p[0],1.5,e.p[2]],[spirit.p[0],1.5,spirit.p[2]],.06,e.life-e.age,'#b6e594');link.spiritId=spirit.id;e.links.push(link);}}
   }else if(e.kind==='flower'&&e.age>=e.delay){radial(e.p,e.seedCount,e.damage,e.speed,{style:'seed',slow:e.slow,slowTime:e.slowTime,healFraction:e.healFraction,thornDamage:e.thornDamage,thornRadius:e.thornRadius,src:e.src});destroy(e);}
   else if(e.kind==='flash'){e.root.scale.setScalar(1+e.age*3);e.root.children.forEach(m=>{if(m.material)m.material.opacity=Math.max(0,1-e.age/e.life);});}
   else if(e.kind==='armor-visual'){e.root.position.fromArray(body);if(armor<=0)destroy(e);}
   else if(e.update)e.update(dt);
   if(e.age>=e.life)destroy(e);
  }
  entities=entities.filter(alive);
  if(entities.length>320)for(const e of entities.slice(0,entities.length-320))destroy(e);
 }
 const skillContext={
  get body(){return body;},get targets(){return targets();},get passive(){return passive;},get tails(){return tailCount;},get pose(){return pose;},get clock(){return clock;},
  target,choose,predict,random,randomPoint,bounds,attackBounds,fit,source,once,all,warning,zone,trail,object,projectile,radial,wave,feather,flash,telegraphLine,area,attackLine,cone,emit,control,applySlow,moveTarget,moveBody,teleport,dash,gainArmor,destroy,explodeObject,overlaps,status,
  parameters:a=>guardianSkillStats(a.type),get maxHp(){return ctx?.fighter.maxHp||1000;},get designColor(){return design.color;},
  setBody(p){body=[...p];},reveal(seconds){revealUntil=Math.max(revealUntil,clock+seconds);},
  wallContact(a,b,padding){return ctx?.walls?.find(w=>w.hp>0&&w.life>0&&ctx.intersectWall?.([a[0],1.5,a[2]],[b[0],1.5,b[2]],w,padding))||null;},
  add,sub,mul,unit,flat,length,distance,angle,clamp,along,mesh,circle,line,entity,
  setAirborne(value){pose.y=value;},stun(seconds){stagger=Math.max(stagger,seconds);},setDirection(direction){pose.yaw=Math.atan2(direction[0],direction[2]);},
  takeRecovery(a){wait=Math.max(.18,Math.min(.45,(a.cooldown||0)*.2))*(enraged?AI.enrageCooldown:1)*(a.recoveryScale||1);}
 };
 function hidden(){return !!ctx&&id==='dark'&&clock-lastCombat>=passive.hideAfter&&clock>=revealUntil&&stagger<=0;}
 function clear(){for(const e of entities)destroy(e);for(const child of [...root.children])remove(child);root.removeFromParent();entities=[];history=[];action=null;ctx=null;body=origin=previousBody=null;armorShell=null;pose={};stats.clear();previousTargets.clear();armor=armorLevels=tailCount=energy=energyTravel=speedStacks=rage=stagger=stationary=lastCombat=movement=revealUntil=0;}
 const api={
  reset(nextId,nextPhase=2){clear();id=nextId;design=GUARDIAN_BOSS_DESIGNS[id]||null;passive=guardianPassiveStats(id);phase=nextPhase;clock=serial=castSerial=attacks=0;wait=1.5;seed=Array.from(id||'').reduce((n,c)=>n+c.charCodeAt(0),123);comboCursor=comboRepeats=comboSerial=0;combo=[];previousCombo='';cooldowns={};enraged=ambushReady=false;passiveAt=passive.puddleInterval||passive.windInterval||passive.spiritInterval||Infinity;if(design)scene.add(root);},
  clear,trigger:begin,
  update(dt,fighter,player,boss,impact,options={}){
   if(!design||options.enabled===false||fighter.hp<=0||dt<=0)return;
   if(!body){body=flat(boss);origin=[...boss];safeX=(options.bounds?.minX??-6)+((options.bounds?.maxX??6)-(options.bounds?.minX??-6))*(.2+random()*.6);}
   const targetList=(options.targets||[{id:'player',pos:player,hitboxScale:options.playerHitboxScale||1}]).map(t=>{
    const last=previousTargets.get(t.id),raw=last?mul(sub(t.pos,last),1/dt):[0,0,0];return {...t,pos:[...t.pos],velocity:t.velocity||mul(raw,Math.min(1,8/(length(raw)||1)))};
   });
   ctx={...options,fighter,player:[...player],boss:[...boss],impact,targets:targetList};clock+=dt;stagger=Math.max(0,stagger-dt);const wasEnraged=enraged;enraged=fighter.hp/fighter.maxHp<AI.enrageThreshold;
   if(enraged&&!wasEnraged){wait*=AI.enrageCooldown;for(const key of Object.keys(cooldowns))if(cooldowns[key]>clock)cooldowns[key]=clock+(cooldowns[key]-clock)*AI.enrageCooldown;}
   tickPassives(dt);previousBody=[...body];
   if(options.controlled&&phase===2){cancel(false);}
   else if(stagger<=0){
    steer(dt);
    if(!action&&options.aiEnabled!==false){wait-=dt;if(wait<=0){const next=chooseSkill();if(next!==null)begin(next,player,boss,fighter);}}
    if(action){const current=action;action.age+=dt;updateGuardianSkill(action,skillContext,dt);if(action===current&&action.age+1e-7>=action.duration){cancel(true);if(comboCursor<combo.length)skillContext.takeRecovery(current);}}
   }
   if(!['wolf-dashes','shadow-dashes','turtle-ram','eagle-dive'].includes(action?.type)&&choose(true))pose.yaw=angle(body,choose(true).pos);
   movement=distance(body,previousBody);stationary=movement<.002?stationary+dt:0;
   if(id==='lightning'){energyTravel+=movement;while(energyTravel>=passive.energyDistance){energyTravel-=passive.energyDistance;energy=Math.min(passive.energyCap,energy+1);}}
   updateEntities(dt);for(const t of targetList)previousTargets.set(t.id,[...t.pos]);
  },
  defense(){return {multiplier:id==='wind'&&action?.type==='eagle-dive'&&action.age<action.windup+action.rushDuration?0:id==='earth'&&stationary>=passive.stationaryTime?1-passive.damageReduction:1,reflect:0};},
  absorbDamage(amount){if(id!=='earth'||armor<=0)return amount;const spent=Math.min(armor,amount);armor-=spent;if(armor<=1e-7){armor=0;radial(body,passive.shardCount,passive.shardDamage,9,{style:'shard',src:{type:'stone-armor',power:1}});}return amount-spent;},
  onDamage(amount){if(amount>0){lastCombat=clock;ambushReady=false;}},
  slowAt(p,direction=null,targetId='player'){
   if(!ctx)return 1;const s=status(targetId);if(s.rootTime>0)return 0;let slow=Math.max(s.slowTime>0?s.slow:0,id==='ice'?s.stacks*passive.slowPerStack:0);
   for(const e of entities)if(alive(e)&&e.kind==='zone'&&overlaps(e,p,.3)){
    if(e.tag==='ice'||e.tag==='dark')slow=Math.max(slow,e.slow||0);
    if(e.tag==='wind'&&direction&&direction.reduce((n,v,i)=>n+v*e.v[i],0)<-.05)slow=Math.max(slow,passive.slow);
   }return 1-clamp(slow,0,.8);
  },
  constrainMovement:constrain,
  hidden,lockable(){return !hidden()&&!(id==='wind'&&action?.type==='eagle-dive'&&action.age<action.windup+action.rushDuration);},
  breakPrison:()=>false,
  intercept(shot,scale=1){
   if(!ctx||shot.owner!=='player'||!shot.old||!shot.p)return false;
   const hit=entities.filter(e=>alive(e)&&e.hp>0&&along(e.p,shot.old,shot.p)<e.r+(shot.size||.1)&&Math.min(shot.old[1],shot.p[1])<((e.kind==='tree'?5:3)+(shot.size||0))).sort((a,b)=>distance(a.p,shot.old)-distance(b.p,shot.old))[0];
   if(!hit)return false;const d=flat(sub(shot.p,shot.old)),q=clamp(flat(sub(hit.p,shot.old)).reduce((n,v,i)=>n+v*d[i],0)/(length(d)**2||1),0,1);shot.p=add(shot.old,mul(sub(shot.p,shot.old),q));hit.hp=Math.max(0,hit.hp-Math.max(0,shot.damage*scale));if(hit.hp<=0)destroy(hit,true);return true;
  },
  areaDamage(shot,p,r,scale=1){if(shot.owner!=='player')return;for(const e of [...entities])if(alive(e)&&e.hp>0&&distance(e.p,p)<=r+e.r){e.hp=Math.max(0,e.hp-shot.damage*scale);if(e.hp<=0)destroy(e,true);}},
  targetStatus(key='player'){return {element:id,...status(key)};},
  obscures(p){return all('dark').some(e=>overlaps(e,p));},
  get offset(){return {x:body&&origin?body[0]-origin[0]:0,y:0,z:body&&origin?body[2]-origin[2]:0,lean:stagger>0?.5:0,...pose};},
  state(){return {
   action:action?{type:action.type,name:action.name,age:action.age,stage:action.age<(action.windup||action.warning||.6)?'warning':'active',parameters:guardianSkillStats(action.type)}:null,
   signature:action?.name||'',attacks,history:history.map(h=>({...h})),armor,armorLevels,stationary,tailCount,energy,speedStacks,rage,enraged,recovery:wait,skillCooldowns:design?.skills.map((s,i)=>Math.max(0,(cooldowns[i]||0)-clock))||[],combo:[...combo],comboCursor,comboSerial,
   aiOwnedMovement:!!design,bossPosition:body?[...body]:null,moving:movement>.002,difficulty:design?.difficulty||0,title:design?.title||'',role:design?.role||'',passive:design?.passive||'',counter:design?.counter||'',skills:design?.skills.map(s=>s.name)||[],passiveParameters:{...passive},
   statuses:[...stats].map(([key,s])=>({id:key,stacks:s.stacks,stackTime:s.stackTime,markTime:s.markTime,slow:s.slow,slowTime:s.slowTime,rootTime:s.rootTime,freezeImmune:s.freezeImmune})),
   exposed:0,stagger,hidden:hidden(),lockable:api.lockable(),night:all('dark').some(e=>targets().some(t=>t.id==='player'&&overlaps(e,t.pos))),prison:null,shelters:[],lamps:[],
   entities:entities.filter(alive).map(e=>({id:e.id,kind:e.kind,tag:e.tag||e.style||null,position:[...e.p],radius:e.r,hp:e.hp,maxHp:e.maxHp,age:e.age,life:e.life,delay:e.delay,solid:!!e.solid,targetId:e.targetId,real:e.real,returning:e.family==='lightning'&&e.age>=e.returnAt,gapWidth:e.gap,damage:e.damage,enlarged:!!e.enlarged,boosted:!!e.boosted,recycled:!!e.recycled,stored:e.stored,source:e.src?.type})),
   hazards:all('hazard').map(e=>({position:[...e.p],radius:e.r,remaining:Math.max(0,e.delay-e.age),hit:!!e.fired})),offset:api.offset
  };},
  dispose(){clear();for(const g of Object.values(geo))g.dispose();}
 };return api;
}
