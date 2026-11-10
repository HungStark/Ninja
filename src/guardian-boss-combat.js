import * as T from 'three';
import {GUARDIAN_BOSS_DESIGNS} from './guardian-boss-designs.js';
import {createEncounterCreature} from './encounter-appearance.js';
import {gameAudio} from './game-audio.js';
import {guardianSkillStats,guardianPassiveStats} from './guardian-balance.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const lanes=[-4.5,0,4.5];
const spread=count=>Array.from({length:count},(_,i)=>count===1?0:-4.5+9*i/(count-1));
const segmentDistance=(p,a,b)=>{
  const d=b.map((v,i)=>v-a[i]),length=d.reduce((s,v)=>s+v*v,0);
  const t=clamp(p.reduce((s,v,i)=>s+(v-a[i])*d[i],0)/(length||1),0,1);
  return Math.hypot(...p.map((v,i)=>v-a[i]-d[i]*t));
};

// Combat-owned visuals and actors: no timers outside the simulation, no changes
// to the player's spells, and all phase state is removed together on reset.
export function createGuardianBossCombat(scene){
  const root=new T.Group();root.name='guardian-distinct-combat';
  const geometry={orb:new T.IcosahedronGeometry(1,1),ring:new T.RingGeometry(.91,1,48),disk:new T.CircleGeometry(1,48),
    box:new T.BoxGeometry(1,1,1),pillar:new T.CylinderGeometry(.65,1,1,7),cone:new T.ConeGeometry(1,1,7),
    crystal:new T.OctahedronGeometry(1),arc:new T.TorusGeometry(1,.09,5,18,Math.PI*1.35)};
  let village=null,design=null,passive=null,phase=2,clock=0,cycle=0,wait=1.8,action=null,serial=0,ctx=null,attacks=0;
  let pose={},exposed=0,stagger=0,legDamage=0,tailCount=0,stack=0,stackLife=0,night=0,waterLevel=0,prison=null;
  let history=[],entities=[],shelters=[],lamps=[],passiveVisuals=[],environmentReady=false;
  const models=new Set();
  function mesh(kind,p,scale,color=design.color,opacity=.7){
    const m=new T.Mesh(geometry[kind],new T.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:T.DoubleSide}));
    m.position.fromArray(p);m.scale.fromArray(scale);root.add(m);return m;
  }
  function remove(m){if(!m)return;m.removeFromParent();m.material?.dispose();}
  function circle(p,r,color=design.color,filled=false){const m=mesh(filled?'disk':'ring',[p[0],.08,p[2]],[r,r,r],color,.5);m.rotation.x=-Math.PI/2;return m;}
  function line(a,b,width=.15,color=design.color){
    const d=new T.Vector3(...b).sub(new T.Vector3(...a)),m=mesh('box',lerp(a,b,.5),[width,width,d.length()],color,.5);
    m.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),d.normalize());return m;
  }
  function destroy(e,broken=false){
    if(e.dead)return;e.dead=true;for(const m of e.visuals||[])remove(m);
    if(e.model){e.model.root.removeFromParent();e.model.dispose();models.delete(e.model);}
    if(broken&&e.kind==='crystal'){
      const p=[e.p[0],.1,e.p[2]],r=e.shelterRadius,m=circle(p,r,'#a5ffd9',true);
      shelters.push({p,r,life:e.shelterDuration,m});
    }
    if(e===prison)prison=null;
  }
  function clear(){
    for(const e of entities)destroy(e);
    for(const model of models){model.root.removeFromParent();model.dispose();}models.clear();
    for(const child of [...root.children])remove(child);
    root.removeFromParent();entities=[];history=[];shelters=[];lamps=[];passiveVisuals=[];
    action=ctx=prison=null;pose={};environmentReady=false;exposed=stagger=legDamage=tailCount=stack=stackLife=night=waterLevel=0;
  }
  function control(kind,seconds){ctx?.control?.(kind,seconds);}
  function emit(damage,p,extra={}){
    if(!ctx||ctx.fighter.hp<=0)return;
    const shot={owner:'enemy',element:village,style:'guardian-'+(action?.type||'hazard'),damage:damage*(1+tailCount*(passive.damagePerTail||0))*(phase===3?.6:1),
      unreflectable:true,color:design.color,v:[0,0,1],...extra};
    const result=ctx.impact(shot,p)||shot.hitResult;
    // Blocked/immune hits do not accumulate the boss-specific status.
    if(!(result?.damage>0))return;
    if(village==='lightning'||village==='ice'){
      stack++;stackLife=passive.stackDuration;
      if(stack>=passive.stackCount){stack=0;control(village==='ice'?'ice':'lightning',passive.controlDuration);}
    }
    if(extra.bind)control('wood',extra.bind);
  }
  function hazard(p,r,delay,damage,kind='pillar',extra={}){
    const e={id:++serial,kind:'hazard',shape:kind,p:[...p],r,delay,life:delay+.65,age:0,damage,visuals:[circle(p,r,'#ff5757',true)],...extra};
    entities.push(e);return e;
  }
  function projectile(from,target,{kind='fireball',speed=8,damage=17,homing=0,r=.45,delay=0,life=5,...extra}={}){
    const d=new T.Vector3(...target).sub(new T.Vector3(...from)).normalize();
    const m=mesh(kind==='windblade'?'arc':kind==='feather'?'cone':'orb',from,kind==='feather'?[.13,.85,.15]:[r,r,r],design.color,.9);
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d);
    const e={id:++serial,kind:'projectile',style:kind,p:[...from],v:d.toArray(),r,age:0,life,speed,damage,homing,delay,visuals:[m],...extra};entities.push(e);return e;
  }
  function object(kind,p,hp,life=14,stats={}){
    const visuals=[circle(p,kind==='grass'?2:1,'#9dffd0')];
    const body=mesh(kind==='crystal'?'crystal':kind==='grass'?'cone':'pillar',[p[0],kind==='grass'?.7:1.2,p[2]],kind==='grass'?[.7,1.4,.7]:[.65,2.2,.65],kind==='decoy'?'#cf612f':design.color,.8);visuals.push(body);
    if(kind==='spirit'){
      visuals.push(mesh('orb',[p[0],2.5,p[2]],[.4,.5,.4],'#e8ffc5',.9));
      visuals.push(mesh('cone',[p[0],1.5,p[2]],[1,1.4,1],design.color,.65));
    }
    const e={...stats,id:++serial,kind,p:[p[0],1.2,p[2]],hp,maxHp:hp,r:kind==='grass'?.9:.8,age:0,life,visuals};entities.push(e);return e;
  }
  function wolf(p,target,delay=0){
    const m=new T.Group();m.name='guardian-shadow-wolf';root.add(m);
    const body=mesh('orb',[0,0,0],[.5,.65,1.1],'#49315e',.78),head=mesh('cone',[0,0,0],[.42,.8,.45],'#bb8cf1',.85);
    m.add(body,head);body.position.set(0,.7,0);head.position.set(0,1.25,.7);
    for(const side of [-1,1]){const eye=mesh('orb',[0,0,0],[.07,.07,.1],'#ead0ff',1);m.add(eye);eye.position.set(side*.2,1.3,1);}
    m.position.fromArray(p);
    entities.push({id:++serial,kind:'wolf',p:[...p],target:[...target],age:0,delay,life:action.life,speed:action.speed,damage:action.damage,radius:action.radius,visuals:[...m.children,m],group:m});
  }
  function beam(from,target,width,color=design.color){const m=line(from,target,width,color);return m;}
  function addEnvironment(player,boss){
    if(village==='water'){
      const surface=mesh('box',[0,.1,-3],[13,.08,34],'#329add',.18);surface.name='guardian-tide';passiveVisuals.push(surface);
    }
    if(village==='dark'){
      for(const x of [-4.5,4.5]){
        const p=[x,.1,player[2]],r=passive.lampRadius,m=circle(p,r,'#ffe9a0',true),pole=mesh('pillar',[x,1.2,player[2]-1],[.15,2.4,.15],'#95845b',1),glow=mesh('orb',[x,2.6,player[2]-1],[.28,.4,.28],'#fff0ad',1);
        lamps.push({p,r});passiveVisuals.push(m,pole,glow);
      }
    }
    if(village==='wood')for(const x of [-3,0,3])object('grass',[x,.1,boss[2]+3],passive.hp,passive.life,{healRate:passive.healRate});
  }
  function begin(index,player,boss,fighter){
    if(!design||!Number.isInteger(index)||index<0||index>=3)return false;
    cancelAction();
    const skill=design.skills[index];
    action={...skill,...guardianSkillStats(skill.type),index,age:0,target:[...player],origin:[...boss],events:new Set(),visuals:[],hit:false};
    attacks++;
    history.push({type:skill.type,name:skill.name,phase,at:clock});if(history.length>30)history.shift();
    gameAudio.cast({element:village,rank:index===2?'SS':'S',style:skill.type});
    return skill.name;
  }
  function cancelAction(){const cooldown=action?.cooldown??1.7;if(action)for(const m of action.visuals)remove(m);action=null;pose={};wait=cooldown;}
  function once(key,at,fn){if(action.age>=at&&!action.events.has(key)){action.events.add(key);fn();}}
  function warning(p,r=1.6){const m=circle(p,r,'#ff5555',true);action.visuals.push(m);return m;}
  function targetPoint(player){return [clamp(player[0],-5,5),.1,player[2]];}
  function erupt(e){
    const {p,r,shape}=e,add=m=>{e.visuals.push(m);return m;};
    if(shape==='bolt'){
      let previous=[p[0],8,p[2]];
      for(let i=1;i<=7;i++){const point=[p[0]+(i===7?0:(i%2?-.35:.35)),8-i*1.12,p[2]];add(line(previous,point,.13,'#f3eaff'));previous=point;}
      add(circle(p,r,'#cda6ff'));add(mesh('orb',[p[0],.4,p[2]],[r,.2,r],'#f7f2ff',.8));
    }else if(shape==='flame'){
      for(let i=0;i<3;i++)add(mesh('cone',[p[0],1.7+i*.4,p[2]],[r*(1-i*.22),3.6-i*.5,r*(1-i*.22)],['#ff5c18','#ff9b25','#ffe18b'][i],.8));
      for(let i=0;i<4;i++)add(mesh('orb',[p[0]+Math.sin(i*2.4)*r,3+i*.3,p[2]+Math.cos(i*2.4)*r],[.1,.24,.1],'#ffd475',.8));
    }else if(shape==='vine'){
      let previous=[p[0],.1,p[2]];
      for(let i=1;i<=8;i++){const point=[p[0]+Math.sin(i*1.4)*r*.65,i*.4,p[2]+Math.cos(i*1.4)*r*.4];add(line(previous,point,.18,'#76b94b'));if(i%2===0)add(mesh('cone',point,[.4,.6,.1],'#b3df7c',.9));previous=point;}
    }else if(shape==='claw'){
      for(let i=-1;i<=1;i++){const a=[p[0]-.9+i*.22,.3,p[2]-1.5],b=[p[0]+.9+i*.22,.3,p[2]+1.5];add(line(a,b,.12,'#e4faff'));add(mesh('crystal',[p[0]+i*.5,.6,p[2]],[.15,1.2,.25],'#8ed7ff',.9));}
    }else if(shape==='feather'){
      const feather=add(mesh('cone',[p[0],1.4,p[2]],[.12,2.6,.2],'#fff2b5',.95));feather.rotation.z=.25;
    }else add(mesh('pillar',[p[0],2,p[2]],[r,4,r],design.color,.95));
  }
  function castAtLanes(count,delay,damage,r,kind='pillar'){
    for(let i=0;i<count;i++){
      const x=count===9?[-5,-1,3,-3,1,5,-4,0,4][i]:-5+10*i/Math.max(1,count-1);
      hazard([x,.1,action.target[2]],r,action.warning+i*delay,damage,kind);
    }
  }
  function dive(player,boss,gold=false){
    const a=action,t=a.age;
    const landing=a.windup+a.rushDuration;
    once('warning',0,()=>{warning(a.target,a.radius);a.visuals.push(line(a.origin,a.target,.12,'#ff8d64'));});
    if(t<a.windup)pose.y=4*Math.min(1,t/.7);
    else if(t<landing){const q=clamp((t-a.windup)/a.rushDuration,0,1);pose.x=(a.target[0]-boss[0])*q;pose.z=(a.target[2]-boss[2])*q;pose.y=4*(1-q);pose.lean=.8;}
    else{
      pose.x=a.target[0]-boss[0];pose.z=a.target[2]-boss[2];pose.y=0;
      once('land',landing,()=>{
        const hit=distance(player,a.target)<a.radius;
        if(hit)emit(a.damage,player,{ignoreShield:gold,armorPiercing:gold});
        // A missed Wind dive is a real punish window. Gold opens its feathers
        // after every dive, allowing a counter even after a shielded hit.
        if(gold||!hit){exposed=a.exposedDuration;stagger=gold?0:a.exposedDuration;}
        a.visuals.push(circle(a.target,2.2,'#a5ffd9'));
      });
      const q=clamp((t-a.returnStart)/a.returnDuration,0,1);pose.x*=1-q;pose.z*=1-q;
    }
  }
  function updateAction(dt,player,boss){
    if(!action)return;
    const a=action,t=a.age+=dt,origin=[boss[0],Math.max(1.7,boss[1]),boss[2]];
    switch(a.type){
      case 'fox-homing':
        for(let i=0;i<a.count;i++)once(i,a.windup+i*a.interval,()=>projectile([origin[0]+(i%2?1:-1),origin[1],origin[2]],player,{speed:a.speed,homing:a.homing,damage:a.damage,life:a.life,r:a.radius}));
        break;
      case 'fox-illusions':{
        once('clones',0,()=>{
          a.real=(cycle+Math.floor(clock))%3;a.realX=lanes[a.real];
          for(let i=0;i<3;i++)if(i!==a.real){
            const model=createEncounterCreature('fire');models.add(model);root.add(model.root);model.root.position.set(lanes[i],0,boss[2]);
            model.root.traverse(m=>{if(m.isMesh){m.material.transparent=true;m.material.opacity=.58;}});
            entities.push({id:++serial,kind:'decoy',p:[lanes[i],boss[1],boss[2]],hp:a.cloneHp,r:1.7,age:0,life:a.duration,model,visuals:[]});
          }
          const real=circle([a.realX,0,boss[2]],1.5,'#ffe09b');a.visuals.push(real);
        });
        pose.x=a.realX-boss[0];
        for(let i=0;i<a.count;i++)once('shot'+i,a.windup+i*a.interval,()=>{
          for(const x of lanes)projectile([x,origin[1],origin[2]],player,{speed:a.speed,homing:x===a.realX?a.homing:0,damage:x===a.realX?a.damage:0,life:a.life});
        });break;
      }
      case 'fox-nine-pillars':once('pillars',0,()=>castAtLanes(a.count,a.interval,a.damage,a.radius,'flame'));break;
      case 'dragon-pressure':{
        once('line',0,()=>{a.end=[...a.target];a.visuals.push(beam(origin,a.end,.16,'#ff7f72'));});
        once('fire',a.windup,()=>{a.ray=beam(origin,a.end,a.radius*.8);a.visuals.push(a.ray);});
        if(t>=a.windup&&t<a.windup+a.beamDuration){a.tick=(a.tick||0)+dt;if(a.tick>=a.tickInterval){const tick=a.tick;a.tick=0;if(segmentDistance(player,origin,a.end)<a.radius)emit(a.damagePerSecond*tick,player,{blockable:true,old:origin,p:[...player]});}}break;
      }
      case 'dragon-prison':
        once('warning',0,()=>warning(a.target,a.radius));
        once('capture',a.windup,()=>{
          if(distance(player,a.target)>a.radius)return;
          const m=mesh('orb',player,[1.2,1.7,1.2],'#61d6ff',.3),rim=mesh('orb',player,[1.22,1.72,1.22],'#d2f8ff',.5);rim.material.wireframe=true;
          prison={id:++serial,kind:'prison',p:[...player],r:1.4,hp:a.hp,maxHp:a.hp,age:0,life:a.life,damage:a.damage,tickInterval:a.tickInterval,visuals:[m,rim]};entities.push(prison);
        });break;
      case 'dragon-tsunami':
        once('wave',0,()=>{
          const gap=lanes[(cycle+Math.floor(clock))%3],gapWidth=a.gapWidth,visuals=[],z=origin[2]+3;
          for(const [left,right] of [[-6.5,gap-gapWidth/2],[gap+gapWidth/2,6.5]]){
            const width=right-left;if(width<=0)continue;
            visuals.push(mesh('box',[(left+right)/2,1,z],[width,2,1.4],'#54bcf0',.7));
            const crest=mesh('arc',[(left+right)/2,2,z],[width/2,1.1,.6],'#d5f8ff',.85);visuals.push(crest);
          }
          const safe=mesh('box',[gap,.07,(z+a.target[2])/2],[gapWidth,.04,a.target[2]-z+6],'#a5ffd9',.22);safe.name='guardian-wave-safe-lane';a.visuals.push(safe);
          entities.push({id:++serial,kind:'wave',p:[0,1,z],age:0,delay:a.windup,speed:a.speed,life:a.life,damage:a.damage,visuals,hit:false,gap,gapWidth});
        });break;
      case 'wolf-zigzag':
      case 'wolf-tempest':{
        const storm=a.type==='wolf-tempest',start=a.windup;
        once('path',0,()=>{
          a.path=[origin,[clamp(a.target[0]-3,-5,5),1.7,a.target[2]-7],[clamp(a.target[0]+3,-5,5),1.7,a.target[2]-3],[a.target[0],1.7,a.target[2]+1]];
          for(let i=1;i<a.path.length;i++)a.visuals.push(line(a.path[i-1],a.path[i],.12,'#ff728b'));
        });
        if(storm)for(let i=0;i<a.count;i++)once('storm'+i,a.boltStart+i*a.interval,()=>hazard(targetPoint(player),a.boltRadius,a.warning,a.boltDamage,'bolt'));
        if(t>=start&&t<start+a.rushDuration){
          const q=clamp((t-start)/a.rushDuration,0,.999)*3,k=Math.floor(q),p=lerp(a.path[k],a.path[k+1],q-k);
          const old=[boss[0]+(pose.x||0),1.7,boss[2]+(pose.z||0)];pose.x=p[0]-boss[0];pose.z=p[2]-boss[2];pose.lean=-.25;
          if(!a.hit&&segmentDistance(player,old,p)<a.radius){a.hit=true;emit(a.damage,player);}
        }else if(t>=start+a.rushDuration){const q=1-clamp((t-start-a.rushDuration)/a.returnDuration,0,1);pose.x=(a.path[3][0]-boss[0])*q;pose.z=(a.path[3][2]-boss[2])*q;}
        break;
      }
      case 'wolf-marks':for(let i=0;i<a.count;i++)once(i,i*a.interval,()=>hazard(targetPoint(player),a.radius,a.warning,a.damage,'bolt'));break;
      case 'eagle-crescents':
        pose.y=2.8;
        for(let i=0;i<a.count;i++)once(i,a.windup+i*a.interval,()=>{
          for(const side of [-1,0,1])projectile([origin[0]+side*.7,origin[1]+2.8,origin[2]],[a.target[0]+side*2,player[1],player[2]],{kind:'windblade',speed:a.speed,damage:a.damage,r:a.radius,life:a.life});
        });break;
      case 'eagle-dive':dive(player,boss);break;
      case 'eagle-tornadoes':
        pose.y=2.5;
        once('vortices',0,()=>{
          for(let i=0;i<a.count;i++){
            const p=[spread(a.count)[i],.1,a.target[2]-1],visuals=[];
            const funnel=mesh('cone',[p[0],1.6,p[2]],[1.1,3.2,1.1],design.color,.16);funnel.rotation.z=Math.PI;visuals.push(funnel);
            for(let j=0;j<5;j++)visuals.push(mesh('arc',[p[0],.3+j*.65,p[2]],[.4+j*.18,.3,.4+j*.18],design.color,.55));
            entities.push({id:++serial,kind:'tornado',p,age:0,delay:a.windup,life:a.life,damage:a.damage,seed:i,tick:0,tickInterval:a.tickInterval,radius:a.radius,orbitSpeed:a.orbitSpeed,travelAmplitude:a.travelAmplitude,visuals});
          }
        });break;
      case 'turtle-quake':
        for(let i=0;i<a.count;i++)once(i,a.windup+i*a.interval,()=>{
          const p=[origin[0],.1,origin[2]],m=circle(p,.2);entities.push({id:++serial,kind:'shockwave',p,age:0,life:a.life,r:0,damage:a.damage,speed:a.speed,radius:a.radius,visuals:[m],hit:false});
        });break;
      case 'turtle-rebound':
        once('shell',0,()=>{a.visuals.push(mesh('orb',origin,[3,2.2,3],design.color,.32));});pose.lean=.15;break;
      case 'turtle-mountains':once('mountains',0,()=>castAtLanes(a.count,a.interval,a.damage,a.radius,'stone'));break;
      case 'gold-feathers':
        pose.y=3;
        // Ten visibly dense bursts; the lane warning precedes every burst.
        for(let i=0;i<a.count;i++)once(i,a.windup+i*a.interval,()=>{
          const safe=i%3;
          for(let k=0;k<3;k++)if(k!==safe)for(let j=0;j<a.feathersPerLane;j++){
            const p=[lanes[k]+(j-(a.feathersPerLane-1)/2)*.32,player[1],player[2]];
            hazard(p,a.radius,a.warning,a.damage,'feather',{ignoreShield:true,armorPiercing:true});
          }
        });break;
      case 'gold-hunt':dive(player,boss,true);break;
      case 'gold-wingblades':
        once('blades',0,()=>{
          for(const side of [-1,1]){
            const p=[origin[0]+side*a.sideOffset,1.7,origin[2]],end=[clamp(a.target[0]+side*a.sideOffset,-5,5),1.7,a.target[2]+3],direction=new T.Vector3(...end).sub(new T.Vector3(...p)).normalize().toArray();
            a.visuals.push(line(p,end,.15,'#ff7777'));
            const m=mesh('box',p,[.18,4,1.6],design.color,.9);m.rotation.z=side*.35;
            entities.push({id:++serial,kind:'blade',p,v:direction,age:0,delay:a.windup,life:a.life,damage:a.damage,speed:a.speed,radius:a.radius,hit:false,visuals:[m]});
          }
        });break;
      case 'shadow-ambush':
        once('warning',a.warningStart,()=>{a.reappear=[a.target[0],1.7,a.target[2]+2];warning(a.reappear,a.radius);a.visuals.push(line(a.reappear,a.target,.18,'#dc9eff'));});
        if(t>=a.reappearAt&&t<a.retreatAt){pose.x=a.reappear[0]-boss[0];pose.z=a.reappear[2]-boss[2];}
        once('strike',a.strikeAt,()=>{if(distance(player,a.target)<a.radius)emit(a.damage,player,{v:[0,0,-1]});exposed=a.exposedDuration;});break;
      case 'shadow-pack':
        for(let i=0;i<a.count;i++)once(i,a.windup+i*a.interval,()=>wolf([(i%2?1:-1)*6,0,a.target[2]-7],player,a.warning));break;
      case 'shadow-night':
        night=Math.max(night,dt+.1);
        once('darkness',0,()=>{
          a.shroud=mesh('box',[0,3.5,a.target[2]-2],[18,7,22],'#080511',.23);a.shroud.material.side=T.BackSide;a.visuals.push(a.shroud);
        });
        for(let i=0;i<a.count;i++)once(i,a.windup+i*a.interval,()=>wolf([(i%2?1:-1)*6,0,a.target[2]+(i%3-1)*6],player,a.warning));break;
      case 'stag-vines':
        for(let i=0;i<a.count;i++)once(i,i*a.interval,()=>hazard(targetPoint(player),a.radius,a.warning,a.damage,'vine',{bind:a.controlDuration}));break;
      case 'stag-spirits':
        once('spirits',0,()=>{for(const x of spread(a.count))object('spirit',[x,.1,a.target[2]-5],a.hp,a.life,{healRate:a.healRate});});
        for(let i=0;i<a.rootCount;i++)once('roots'+i,a.windup+i*a.interval,()=>hazard(targetPoint(player),a.radius,a.warning,a.damage,'vine'));break;
      case 'stag-forest':
        once('forest',0,()=>{
          for(let i=0;i<a.count;i++){const grass=i===a.count-1,x=grass?0:(a.count===6?[-4,-2,0,2,4][i]:spread(Math.max(1,a.count-1))[i]),z=grass?boss[2]+3:a.target[2]-4;object(grass?'grass':'sapling',[x,.1,z],a.hp,a.life,{healRate:grass?passive.healRate:a.healRate});}
        });
        for(let i=0;i<a.waveCount;i++)once('growth'+i,a.windup+i*a.interval,()=>{
          for(const e of entities.filter(e=>!e.dead&&e.kind==='sapling'))hazard([e.p[0],.1,a.target[2]],a.radius,a.warning,a.damage,'vine');
        });break;
      case 'tiger-claws':
        for(let i=0;i<a.count;i++)once(i,a.windup+i*a.interval,()=>{
          const p=targetPoint(player),e=hazard(p,a.radius,a.warning,a.damage,'claw');
          e.visuals.push(line([p[0]-1,.12,p[2]-2],[p[0]+1,.12,p[2]+2],.15));
        });break;
      case 'tiger-crystals':
        once('crystals',0,()=>{
          for(const x of spread(a.count))object('crystal',[x,.1,a.target[2]-1.2],a.hp,a.life,{explodeAt:a.detonateAfter,blast:a.radius,damage:a.damage,shelterRadius:a.shelterRadius,shelterDuration:a.shelterDuration});
        });break;
      case 'tiger-blizzard':
        once('shelter',0,()=>{
          // At least two reachable fixed shelters exist even if no earlier
          // crystal was broken. Destroying these crystals creates extra cover.
          for(const x of [-5,5]){const p=[x,.1,a.target[2]],r=a.fixedShelterRadius,m=circle(p,r,'#a5ffd9',true);shelters.push({p,r,life:a.fixedShelterDuration,m});}
          for(const x of (a.count===3?[-3,0,3]:spread(a.count)))object('crystal',[x,.1,a.target[2]-1.2],a.hp,a.life,{explodeAt:Infinity,shelterRadius:a.shelterRadius,shelterDuration:a.shelterDuration});
          for(let i=0;i<28;i++){const x=-6+(i*2.3)%12,z=a.target[2]-6+(i*1.7)%10;a.visuals.push(mesh('crystal',[x,2+(i%5),z],[.035,.25,.035],'#ecfaff',.65));}
        });
        if(t>=a.windup){a.tick=(a.tick||0)+dt;if(a.tick>=a.tickInterval){a.tick=0;if(!safeFromIce(player))emit(a.damage,player);}}
        once('freeze',a.freezeAt,()=>{if(!safeFromIce(player))control('ice',a.controlDuration);});break;
    }
    if(a.age>=a.duration)cancelAction();
  }
  function safeFromIce(p){return shelters.some(s=>s.life>0&&distance(s.p,p)<s.r);}
  function illuminated(p){return lamps.some(l=>distance(l.p,p)<=l.r);}
  function updateEntities(dt,player,boss){
    for(const e of entities){
      if(e.dead)continue;e.age+=dt;
      if(e.kind==='hazard'){
        if(e.age>=e.delay&&!e.fired){
          e.fired=true;erupt(e);
          if(distance(player,e.p)<e.r+.25)emit(e.damage,player,{bind:e.bind,ignoreShield:e.ignoreShield,armorPiercing:e.armorPiercing});
          gameAudio.impact(village,e.damage);
        }
        if(!e.fired)e.visuals[0].material.opacity=.22+(Math.sin(e.age*12)+1)*.16;
      }else if(e.kind==='projectile'){
        if(e.age>=e.delay){
          const old=[...e.p],d=new T.Vector3(...player).sub(new T.Vector3(...e.p)).normalize(),v=new T.Vector3(...e.v);
          if(e.homing)v.lerp(d,Math.min(1,dt*e.homing)).normalize();e.v=v.toArray();
          e.p=e.p.map((p,i)=>p+e.v[i]*e.speed*dt);e.visuals[0].position.fromArray(e.p);e.visuals[0].rotation.z+=dt*5;
          if(segmentDistance(player,old,e.p)<e.r+.5){emit(e.damage,player,{blockable:true,old,p:[...player],v:e.v});destroy(e);}
        }
      }else if(e.kind==='wolf'){
        if(e.age>=e.delay){
          const d=new T.Vector3(player[0]-e.p[0],0,player[2]-e.p[2]).normalize(),old=[...e.p];
          e.p[0]+=d.x*e.speed*dt;e.p[2]+=d.z*e.speed*dt;e.group.position.fromArray(e.p);e.group.rotation.y=Math.atan2(d.x,d.z);
          if(segmentDistance([player[0],0,player[2]],old,e.p)<e.radius){emit(e.damage,player);destroy(e);}
        }
      }else if(e.kind==='wave'){
        if(e.age>=e.delay){const old=e.p[2];e.p[2]+=e.speed*dt;e.visuals.forEach(m=>m.position.z=e.p[2]);
          if(!e.hit&&player[2]>=old-1&&player[2]<=e.p[2]+1){e.hit=true;if(Math.abs(player[0]-e.gap)>e.gapWidth/2-.25)emit(e.damage,player);}}
      }else if(e.kind==='tornado'){
        if(e.age>=e.delay){
          e.p[0]=Math.sin((e.age-e.delay)*e.orbitSpeed+e.seed*2.1)*e.travelAmplitude;
          e.visuals.forEach((m,i)=>{m.position.x=e.p[0]+Math.sin(e.age*4+i)*.15;m.rotation.y=e.age*3+i;if(m.geometry===geometry.arc)m.rotation.x=Math.PI/2;});
          e.tick+=dt;if(e.tick>=e.tickInterval){e.tick=0;if(distance(player,e.p)<e.radius)emit(e.damage,player);}
        }
      }else if(e.kind==='shockwave'){
        const old=e.r;e.r+=dt*e.speed;e.visuals[0].scale.setScalar(Math.max(.1,e.r));
        const d=distance(player,e.p);if(!e.hit&&d>=old-e.radius&&d<=e.r+e.radius){e.hit=true;if(player[1]<2.8)emit(e.damage,player);}
      }else if(e.kind==='blade'){
        if(e.age>=e.delay){const old=[...e.p];e.p=e.p.map((v,i)=>v+e.v[i]*e.speed*dt);e.visuals[0].position.fromArray(e.p);
          if(!e.hit&&segmentDistance(player,old,e.p)<e.radius){e.hit=true;emit(e.damage,player,{ignoreShield:true,armorPiercing:true});}}
      }else if(e.kind==='crystal'){
        e.visuals[1].rotation.y+=dt;
        if(e.age>=e.explodeAt){if(distance(player,e.p)<e.blast)emit(e.damage,player);destroy(e);}
      }else if(e.kind==='prison'){
        // Captured players may still seal and attack the bubble to escape.
        e.visuals.forEach(m=>m.position.fromArray(player));e.p=[...player];
        e.tick=(e.tick||0)+dt;if(e.tick>=e.tickInterval){e.tick=0;emit(e.damage,player);}
      }else if(e.kind==='spirit'||e.kind==='sapling'||e.kind==='grass'){
        e.visuals[1].rotation.y+=dt*.3;
        if(village==='wood'&&(e.kind!=='grass'||distance(e.p,boss)<passive.healRadius)){
          ctx.fighter.hp=Math.min(ctx.fighter.maxHp,ctx.fighter.hp+ctx.fighter.maxHp*e.healRate*dt);
        }
      }
      if(e.age>=e.life)destroy(e);
    }
    entities=entities.filter(e=>!e.dead);
    for(const s of shelters){s.life-=dt;if(s.life<=0)remove(s.m);}shelters=shelters.filter(s=>s.life>0);
  }
  function active(){return !!design&&!!ctx&&ctx.fighter.hp>0;}
  function hidden(){return active()&&village==='dark'&&exposed<=0&&!illuminated(ctx.player)&&(action?.type==='shadow-ambush'&&action.age<action.reappearAt||night>0||clock%passive.hideCycle<passive.hideDuration);}
  function defense(shot={},p){
    if(!active())return {multiplier:1,reflect:0};
    if(village==='wind')return {multiplier:exposed>0?passive.vulnerability:(pose.y||0)>.5?1-passive.airborneReduction:1,reflect:0};
    if(village==='earth'){
      if(stagger>0)return {multiplier:passive.toppleMultiplier,reflect:0};
      if(action?.type==='turtle-rebound')return {multiplier:1-action.damageReduction,reflect:action.reflection};
      // Actual shot contact height selects legs/head/shell; no random weak spot.
      const localY=(p?.[1]??ctx.boss[1])-(ctx.boss[1]-2.2),part=shot.guardianPart||'';
      const leg=/tortoise-(leg|claw)/.test(part)||(!part&&localY<1.25),head=/tortoise-(head|neck|beak)|guardian-eye/.test(part);
      return {multiplier:leg?passive.legMultiplier:head?passive.headMultiplier:1-passive.shellReduction,reflect:0};
    }
    if(village==='light')return {multiplier:exposed>0?passive.vulnerability:1-passive.damageReduction,reflect:exposed>0||shot.unreflectable||shot.reflected?0:passive.reflection};
    return {multiplier:1,reflect:0};
  }
  function damageObject(e,damage){e.hp=Math.max(0,e.hp-damage);if(e.hp<=0)destroy(e,true);}
  const api={
    reset(id,nextPhase=2){clear();village=id;design=GUARDIAN_BOSS_DESIGNS[id]||null;passive=guardianPassiveStats(id);phase=nextPhase;clock=cycle=serial=attacks=0;wait=1.8;if(design)scene.add(root);},
    clear,trigger:begin,
    update(dt,fighter,player,boss,impact,options={}){
      if(!design||options.enabled===false||fighter.hp<=0)return;
      ctx={fighter,player:[...player],boss:[...boss],impact,control:options.control};
      clock+=dt;exposed=Math.max(0,exposed-dt);stagger=Math.max(0,stagger-dt);night=Math.max(0,night-dt);
      stackLife=Math.max(0,stackLife-dt);if(!stackLife)stack=0;
      if(!environmentReady){environmentReady=true;addEnvironment(player,boss);}
      if(village==='fire')tailCount=Math.max(tailCount,Math.min(passive.tailCap,Math.floor((1-fighter.hp/fighter.maxHp)/passive.healthThreshold)));
      if(village==='water'){waterLevel=passive.tideMin+(1+Math.sin(clock*passive.tideFrequency))*passive.tideAmplitude;passiveVisuals[0].position.y=waterLevel;}
      if(village==='dark')for(const m of passiveVisuals)if(m.geometry===geometry.disk)m.material.opacity=illuminated(player)?.55:.25;
      if(options.controlled&&phase===2){cancelAction();for(const e of entities)if(['projectile','hazard','wolf','wave','blade','shockwave','tornado','decoy','prison'].includes(e.kind))destroy(e);pose={};}
      else{
        if(!action&&stagger<=0){wait-=dt;if(wait<=0){begin(cycle%3,player,boss,fighter);cycle++;}}
        updateAction(dt,player,boss);
      }
      updateEntities(dt,player,boss);
    },
    defense,
    onDamage(amount,shot={},p){
      if(!active()||!(amount>0))return;
      if(village==='earth'&&stagger<=0&&action?.type!=='turtle-rebound'){
        const localY=(p?.[1]??ctx.boss[1])-(ctx.boss[1]-2.2);
        if(/tortoise-(leg|claw)/.test(shot.guardianPart||'')||(!shot.guardianPart&&localY<1.25)){legDamage+=amount;if(legDamage>=ctx.fighter.maxHp*passive.toppleThreshold){legDamage=0;stagger=exposed=passive.toppleDuration;cancelAction();pose.lean=.65;}}
      }
    },
    slowAt(p){if(!active())return 1;if(prison)return 0;if(village==='water')return clamp(1-waterLevel*passive.slowPerLevel,0,1);return 1;},
    hidden,lockable:()=>!hidden(),
    breakPrison(damage){if(!active()||!prison)return false;damageObject(prison,Math.max(0,damage));return true;},
    intercept(shot,damageScale=1){
      if(!active()||shot.owner!=='player'||!shot.old||!shot.p)return false;
      const hit=entities.filter(e=>!e.dead&&e.hp>0&&segmentDistance(e.p,shot.old,shot.p)<e.r+(shot.size||.1)).sort((a,b)=>distance(a.p,shot.old)-distance(b.p,shot.old))[0];
      if(!hit)return false;damageObject(hit,Math.max(0,shot.damage*damageScale));return true;
    },
    areaDamage(shot,p,r,scale=1){if(!active()||shot.owner!=='player')return;for(const e of entities)if(!e.dead&&e.hp>0&&distance(e.p,p)<=r)damageObject(e,shot.damage*scale);},
    get offset(){return {x:0,y:0,z:0,lean:stagger>0?.6:0,...pose};},
    state(){return {action:action?{type:action.type,name:action.name,age:action.age,stage:action.age<1.2?'warning':'active',parameters:guardianSkillStats(action.type)}:null,passiveParameters:{...passive},
      signature:action?.name||'',attacks,history:history.map(h=>({...h})),armor:0,
      difficulty:design?.difficulty||0,passive:design?.passive||'',counter:design?.counter||'',skills:design?.skills.map(s=>s.name)||[],
      exposed,stagger,tailCount,stacks:stack,stackLife,waterLevel,hidden:hidden(),lockable:!hidden(),night:night>0,
      prison:prison?{hp:prison.hp,maxHp:prison.maxHp,remaining:prison.life-prison.age}:null,
      entities:entities.filter(e=>!e.dead).map(e=>({id:e.id,kind:e.kind,position:[...e.p],hp:e.hp,maxHp:e.maxHp,age:e.age,delay:e.delay,r:e.r,gap:e.gap,gapWidth:e.gapWidth})),
      hazards:entities.filter(e=>!e.dead&&e.kind==='hazard').map(e=>({position:[...e.p],radius:e.r,remaining:Math.max(0,e.delay-e.age),hit:!!e.fired})),
      shelters:shelters.map(({p,r,life})=>({position:[...p],radius:r,remaining:life})),lamps:lamps.map(({p,r})=>({position:[...p],radius:r}))};},
    dispose(){clear();for(const g of Object.values(geometry))g.dispose();}
  };return api;
}
