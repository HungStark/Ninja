import * as T from 'three';
import {GUARDIAN_ARTS,guardianPhaseHealth,guardianLeap,guardianBreath,GUARDIAN_BASIC_TIMING as BASIC} from './guardian-arts.js';
import {gameAudio} from './game-audio.js';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export function createGuardianPhases(scene){
  const root=new T.Group();root.name='guardian-beast-arts';scene.add(root);
  const sphere=new T.SphereGeometry(1,16,12),ring=new T.RingGeometry(.86,1,40),disk=new T.CircleGeometry(1,40),cylinder=new T.CylinderGeometry(1,1,1,12,1,true),box=new T.BoxGeometry(1,1,1),crystal=new T.OctahedronGeometry(1),leaf=new T.ConeGeometry(.45,1,4);
  let config=null,phase=1,health=[],transition=null,clock=0,wait=2,cycle=0,action=null,armor=0,attacks=0,pose={x:0,y:0,z:0,lean:0},totalDamage=0;
  const hazards=[],history=[],scars=[];
  const color=()=>GUARDIAN_ARTS[config?.village]?.color||'#dfc58c';
  function material(opacity=.55){return new T.MeshBasicMaterial({color:color(),transparent:true,opacity,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending});}
  function mesh(geo,p,scale,opacity=.55){const m=new T.Mesh(geo,material(opacity));m.position.fromArray(p);m.scale.fromArray(scale);root.add(m);return m;}
  function dispose(m){if(!m)return;m.removeFromParent();m.material.dispose();if(m.userData.ownedGeometry)m.geometry.dispose();}
  function clear(){for(const child of [...root.children])dispose(child);hazards.length=scars.length=0;action=null;pose={x:0,y:0,z:0,lean:0};}
  function crackGround(target){
    const vertices=[];
    function strip(a,b,w){const dx=b[0]-a[0],dz=b[1]-a[1],n=Math.hypot(dx,dz)||1,x=-dz/n*w,z=dx/n*w;vertices.push(a[0]+x,0,a[1]+z,a[0]-x,0,a[1]-z,b[0]+x*.5,0,b[1]+z*.5,b[0]+x*.5,0,b[1]+z*.5,a[0]-x,0,a[1]-z,b[0]-x*.5,0,b[1]-z*.5);}
    for(let i=0;i<7;i++){const a=i*Math.PI*2/7+.2,r=1.7+i%3*.3,mid=[Math.sin(a+.12)*r*.5,Math.cos(a+.12)*r*.5],end=[Math.sin(a)*r,Math.cos(a)*r];strip([0,0],mid,.045);strip(mid,end,.03);strip(mid,[mid[0]+Math.cos(a)*.65,mid[1]-Math.sin(a)*.65],.02);}
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));const m=new T.Mesh(geometry,new T.MeshBasicMaterial({color:'#3d3026',transparent:true,opacity:.72,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2}));m.name='guardian-ground-cracks';m.userData.ownedGeometry=true;m.position.set(target[0],.035,target[2]);root.add(m);scars.push({m,age:0});
  }
  function mark(p,r=1.3,warning=1.3,damage=24){const m=mesh(ring,[p[0],.09,p[2]],[r,r,r]);m.rotation.x=-Math.PI/2;hazards.push({p:[...p],r,warning,damage,age:0,m,hit:false,column:null});}
  function hit(impact,p,damage,style='guardian-area',extra={}){impact({owner:'enemy',element:config.element,style,damage:damage*(phase===3?.6:1),unreflectable:true,v:[0,-1,0],color:color(),...extra},p);}
  function makeAction(index,player,boss,fighter){
    const school=GUARDIAN_ARTS[config.village]||GUARDIAN_ARTS.nameless,special=index===1?school.specials[0]:school.specials[1];
    const type=index===0?'slam':index===2?'breath':index===3?'armor':special.type,name=index===0?'Thiên giáng chấn địa':index===2?school.beam:index===3?'Giáp hộ vệ':special.name;
    action={type,name,age:0,target:[...player],origin:[...boss],damage:special.damage||24,definition:special,index,hits:0,lastTick:0,marks:0,damageAtStart:totalDamage};attacks++;history.push({type,name,phase,at:clock});if(history.length>30)history.shift();
    gameAudio.cast({element:config.element,rank:'S',style:'guardian-'+type});
    if(type==='slam'){action.marker=mesh(disk,[player[0],.1,player[2]],[3.5,3.5,3.5],.4);action.marker.material.color.set('#ff2626');action.marker.rotation.x=-Math.PI/2;}
    if(type==='breath'){action.orb=mesh(sphere,[boss[0],2.5,boss[2]+1.5],[.05,.05,.05],.95);action.orb.material.blending=T.NormalBlending;action.beam=mesh(cylinder,[0,0,0],[0,0,0],.65);action.angle=Math.atan2(player[0]-boss[0],player[2]-boss[2]);action.motes=Array.from({length:16},()=>mesh(['earth','ice'].includes(config.element)?crystal:config.element==='wood'?leaf:sphere,[...boss],[.13,.13,.3],.7));}
    if(type==='armor'||type==='heal'){action.shell=mesh(sphere,[boss[0],boss[1],boss[2]],[4.4,3.3,4.4],.2);if(type==='armor')armor=BASIC.armor;if(type==='heal'){action.vines=Array.from({length:6},(_,i)=>{const a=i*Math.PI/3,m=mesh(cylinder,[boss[0]+Math.cos(a),boss[1],boss[2]+Math.sin(a)],[.14,3,.14],.55);m.rotation.z=Math.sin(a)*.35;return m;});}}
    if(type==='columns')for(let i=0;i<special.count;i++){const half=(special.count-1)*1.1,center=clamp(player[0],-5.5+half,5.5-half),x=center+(i-(special.count-1)/2)*2.2;mark([x,.06,player[2]],1.1,1.35+i*special.delay,special.damage);}
    if(['ring','frost','eye'].includes(type)){action.area=mesh(type==='frost'?disk:ring,[player[0],.1,player[2]],[4,4,4],.28);action.area.rotation.x=-Math.PI/2;action.eye=mesh(ring,[player[0],.12,player[2]],[1.4,1.4,1.4],.7);action.eye.rotation.x=-Math.PI/2;action.eye.visible=type!=='frost';}
    if(type==='lanes'){action.gap=[-3.6,0,3.6][Math.floor(clock)%3];for(const x of [-3.6,0,3.6])if(x!==action.gap)mark([x,.06,player[2]],1.55,1.8,special.damage);}
    if(type==='pincers'||type==='waves'){action.waves=[-1,1].map(s=>mesh(type==='waves'?box:sphere,[s*6,1.2,player[2]-8],[type==='waves'?2.4:1,2.4,1],.45));}
    if(type==='sweep'){action.line=mesh(box,[-6,1.5,player[2]],[.16,3,.6],.3);}
    return name;
  }
  function removeAction(){if(!action)return;for(const key of ['marker','orb','beam','shell','area','eye','line'])dispose(action[key]);for(const m of [...action.waves||[],...action.motes||[],...action.vines||[]])dispose(m);action=null;pose={x:0,y:0,z:0,lean:0};wait=phase===3?2.6:1.5;}
  function updateArmor(boss,dt){
    let shell=root.getObjectByName('guardian-armor');
    if(armor<=0){if(shell)dispose(shell);return;}
    if(!shell){shell=mesh(sphere,boss,[4.4,3.3,4.4],.18);shell.name='guardian-armor';}
    shell.position.set(boss[0]+pose.x,boss[1]+pose.y,boss[2]+pose.z);shell.rotation.y+=dt*.6;
  }
  const api={
    reset(next=null,fighter=null){clear();config=next;phase=next?.basicOnly?2:1;health=next?guardianPhaseHealth(next.hp,next.village):[];transition=null;clock=cycle=attacks=totalDamage=armor=0;wait=next?.basicOnly?1.5:2;history.length=0;if(next&&fighter){fighter.maxHp=health[phase-1];fighter.hp=fighter.maxHp;}},
    beginTransition(fighter,position=[0,0,-13]){if(!config||transition||phase>=health.length||fighter.hp>0)return false;clear();armor=0;transition={age:0,from:phase,to:phase+1,switched:false,position:[...position]};return true;},
    advanceTransition(dt,fighter,onPhase){if(!transition)return;transition.age+=dt;const t=transition.age;
      if(!transition.rings){transition.rings=Array.from({length:3},(_,i)=>{const m=mesh(ring,[0,0,0],[1,1,1],.6);m.rotation.x=-Math.PI/2+i*.6;return m;});transition.shell=mesh(sphere,[0,0,0],[1,1,1],.2);}
      transition.rings.forEach((m,i)=>{m.position.set(transition.position[0],.6+i*.9,transition.position[2]);m.rotation.z+=dt*(i+1);m.scale.setScalar(1.4+(t*(i+1))%3);m.material.opacity=Math.max(0,Math.sin(t/3.2*Math.PI))*.75;});transition.shell.position.set(transition.position[0],2.1,transition.position[2]);transition.shell.scale.setScalar(1+Math.sin(t/3.2*Math.PI)*2.5);transition.shell.material.opacity=Math.max(0,1-Math.abs(t-1.35)/.6)*.8;
      if(t>=1.35&&!transition.switched){transition.switched=true;phase=transition.to;fighter.maxHp=health[phase-1];fighter.hp=fighter.maxHp;fighter.shield=fighter.shieldTime=fighter.reflect=0;fighter.burns=[];fighter.staticCharges=[];fighter.snowBuried=false;for(const key of ['waterControlTime','darkControlTime','windControlTime','earthControlTime','iceControlTime','woodControlTime','lightningControlTime','boatControlTime','magneticTime','ignitionTime','invulnerableTime'])fighter[key]=0;onPhase(phase);}if(t>=3.2){for(const m of transition.rings)dispose(m);dispose(transition.shell);transition=null;wait=2;}},
    damageMultiplier(){return armor>0?.65:1;},
    onDamage(amount){totalDamage+=Math.max(0,amount);},
    slowAt(p){return action?.type==='frost'&&action.age>1.6&&Math.hypot(p[0]-action.target[0],p[2]-action.target[2])<4?.65:1;},
    update(dt,fighter,player,boss,impact,{enabled=true,controlled=false,mouthPosition=null}={}){
      if(!config||phase===1||transition||fighter.hp<=0||!enabled)return;
      clock+=dt;armor=Math.max(0,armor-dt);
      for(const s of [...scars]){s.age+=dt;s.m.material.opacity=.72*Math.min(1,(7-s.age)/2);if(s.age>=7){dispose(s.m);scars.splice(scars.indexOf(s),1);}}
      // Monster attacks stop under control; aura attacks are independent of the human.
      if(controlled&&phase===2){removeAction();updateArmor(boss,dt);return;}
      if(!action){wait-=dt;if(wait<=0){const sequence=config.basicOnly?[2,0]:config.village==='nameless'?[0,1,2,4]:[0,1,2,3,4];makeAction(sequence[cycle++%sequence.length],player,boss,fighter);} }
      const a=action;if(a){a.age+=dt;const t=a.age;
        if(a.type==='slam'){
          const landing=BASIC.slamWindup+BASIC.slamFlight;
          const leap=guardianLeap(t);a.stage=leap.stage;pose={x:(a.target[0]-a.origin[0])*leap.progress,y:leap.height,z:(a.target[2]-a.origin[2])*leap.progress,lean:leap.lean};
          if(t>=landing&&!a.hits){a.hits=1;a.marker.geometry=ring;a.marker.material.color.set(color());crackGround(a.target);if(config.basicOnly||Math.hypot(player[0]-a.target[0],player[2]-a.target[2])<3.5)hit(impact,a.target,38,'guardian-slam');gameAudio.cue('stone-impact');}
          if(t>=landing){a.marker.scale.setScalar(3.5+(t-landing)*5);a.marker.material.opacity=Math.max(0,.7-(t-landing));const q=ease((t-landing-.5)/.7);pose.x=(a.target[0]-a.origin[0])*(1-q);pose.z=(a.target[2]-a.origin[2])*(1-q);}if(t>landing+1.2)removeAction();
        }else if(a.type==='breath'){
          const breath=guardianBreath(t);a.stage=breath.stage;pose.headPull=breath.headPull;pose.headTilt=breath.headTilt;
          const mouth=mouthPosition?.(pose)||[boss[0],boss[1]+.8,boss[2]+1.8*(config.facing||1)];
          if(!breath.firing)a.angle=Math.atan2(player[0]-mouth[0],player[2]-mouth[2]);
          const distance=Math.max(1,Math.hypot(player[0]-mouth[0],player[2]-mouth[2])),dir=new T.Vector3(Math.sin(a.angle),(player[1]-mouth[1])/distance,Math.cos(a.angle)).normalize(),start=new T.Vector3(...mouth).addScaledVector(dir,breath.orbScale+.3);
          a.orb.position.copy(start);a.orb.scale.setScalar(breath.orbScale);
          a.motes.forEach((m,i)=>{const q=(t*1.6+i/16)%1,angle=i*2.4+t*4;if(!breath.firing){m.position.copy(start).add(new T.Vector3(Math.cos(angle)*(1-q)*2.5,Math.sin(angle)*(1-q)*2.5,(1-q)*1.2));m.scale.setScalar(.1);}else{m.position.copy(start).addScaledVector(dir,q*40).add(new T.Vector3(Math.cos(angle)*.4,Math.sin(angle)*.4,0));m.scale.set(.15,.15,config.element==='lightning'?1:.4);}m.rotation.set(t*3+i,t*2,i);});
          if(breath.firing){
            if(!a.fired){a.fired=true;gameAudio.cue('energy-fire');gameAudio.cue('guardian-roar',.5);}
            const target=Math.atan2(player[0]-mouth[0],player[2]-mouth[2]),delta=Math.atan2(Math.sin(target-a.angle),Math.cos(target-a.angle));a.angle+=clamp(delta,-dt*.05,dt*.05);
            const end=start.clone().addScaledVector(dir,48),v=end.clone().sub(start);a.beam.position.copy(start).addScaledVector(v,.5);a.beam.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir);a.beam.scale.set(.65,v.length(),.65);
            a.lastTick+=dt;if(a.lastTick>=.12){const elapsed=a.lastTick;a.lastTick=0;const ray=new T.Line3(start,end),closest=new T.Vector3();ray.closestPointToPoint(new T.Vector3(...player),true,closest);if(closest.distanceTo(new T.Vector3(...player))<1.05)hit(impact,player,18*elapsed,'guardian-breath',{old:start.toArray(),p:[...player],blockable:true});}
          }
          if(t>BASIC.charge+BASIC.breathRecoil+BASIC.breathDuration)removeAction();
        }else if(a.type==='armor'){a.shell.position.set(boss[0],boss[1]+.3,boss[2]);a.shell.rotation.y+=dt;removeAction();}
        else if(a.type==='heal'){a.shell.rotation.y+=dt;if(totalDamage-a.damageAtStart>=fighter.maxHp*.08){removeAction();}else{fighter.hp=Math.min(fighter.maxHp,fighter.hp+fighter.maxHp*.05*dt/4);if(t>4)removeAction();}}
        else if(a.type==='tracking'){if(a.marks<a.definition.count&&t>=a.marks*a.definition.delay){mark(player,1.05,1.2,a.damage);a.marks++;}if(t>a.definition.count*a.definition.delay+1.4)removeAction();}
        else if(a.type==='ring'||a.type==='frost'||a.type==='eye'){
          const safeX=a.type==='eye'?a.target[0]+Math.sin((t-1.7)*.8)*2:a.target[0];a.eye.position.x=clamp(safeX,-4.5,4.5);a.eye.material.color.set('#9df5cf');a.area.rotation.z+=dt*.7;
          if(t>1.7){const dist=Math.hypot(player[0]-a.target[0],player[2]-a.target[2]),danger=a.type==='eye'?Math.abs(player[0]-a.eye.position.x)>1.4:a.type==='frost'?dist<4:dist>1.4&&dist<4.5;a.lastTick+=dt;if(a.lastTick>=.2){const elapsed=a.lastTick;a.lastTick=0;if(danger)hit(impact,player,a.damage*elapsed);}}if(t>5.7)removeAction();
        }else if(a.type==='pincers'||a.type==='waves'){
          const q=clamp((t-1.1)/2.4,0,1);a.waves.forEach((m,i)=>{m.position.x=(i?1:-1)*(6-q*5);m.position.z=a.target[2]-8+q*10;m.rotation.y+=dt*3;if(q>0&&!m.userData.hit&&Math.hypot(player[0]-m.position.x,player[2]-m.position.z)<1.65){m.userData.hit=true;hit(impact,player,a.damage);}});if(t>3.7)removeAction();
        }else if(a.type==='sweep'){const x=-5.8+clamp((t-1.5)/3.2,0,1)*11.6;a.line.position.x=x;a.line.rotation.y=t*2;a.line.material.opacity=t>1.5?.75:.22;if(t>1.5){a.lastTick+=dt;if(a.lastTick>.12){const elapsed=a.lastTick;a.lastTick=0;if(Math.abs(player[0]-x)<.85)hit(impact,player,a.damage*elapsed);}}if(t>4.7)removeAction();}
        else if(t>2.8)removeAction();
      }
      for(const h of [...hazards]){h.age+=dt;h.m.material.opacity=.35+(Math.sin(h.age*12)+1)*.15;if(!h.hit&&h.age>=h.warning){h.hit=true;h.column=mesh(cylinder,[h.p[0],2.5,h.p[2]],[h.r,5,h.r],.7);if(Math.hypot(player[0]-h.p[0],player[2]-h.p[2])<h.r)hit(impact,player,h.damage);gameAudio.impact(config.element,h.damage);}
        if(h.hit){h.column.scale.y=Math.max(.01,5*(1-(h.age-h.warning)/.6));if(h.age>h.warning+.6){dispose(h.m);dispose(h.column);hazards.splice(hazards.indexOf(h),1);}}}
      updateArmor(boss,dt);
    },
    trigger(index,player,boss,fighter){if(!config||phase===1||transition||!Number.isInteger(index)||index<0||index>4||(config.village==='nameless'&&index===3))return false;removeAction();return makeAction(index,player,boss,fighter);},
    dispose(){clear();for(const geometry of [sphere,ring,disk,cylinder,box,crystal,leaf])geometry.dispose();root.removeFromParent();},
    get transitioning(){return !!transition;},get phase(){return phase;},get active(){return !!config;},get form(){return phase===1?'human':phase===2?'beast':'avatar';},get offset(){return {...pose};},
    state:()=>({phase,maxPhase:health.length||1,form:phase===1?'human':phase===2?'beast':'avatar',phaseHealth:[...health],transition:transition?{age:transition.age,from:transition.from,to:transition.to,switched:transition.switched}:null,signature:action?.name||'',action:action?{type:action.type,name:action.name,age:action.age,stage:action.stage||action.type,orbScale:action.orb?.scale.x||0}:null,armor,attacks,cracks:scars.map(s=>({position:s.m.position.toArray(),age:s.age})),history:history.map(h=>({...h})),hazards:hazards.map(h=>({position:[...h.p],remaining:Math.max(0,h.warning-h.age),radius:h.r,hit:h.hit})),offset:{...pose}})
  };return api;
}
