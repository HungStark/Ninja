import * as T from 'three';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));

function flowingDragon(meshes){
 const parts=meshes.map(mesh=>({mesh,rest:mesh.geometry.attributes.position.array.slice(),flow:mesh.geometry.attributes.guardianFlow}));
 const x=new Float64Array(32),z=new Float64Array(32),times=new Float64Array(32),delta=Array.from({length:13},()=>new T.Vector3());let count=0,cursor=0,last=-Infinity;
 function past(wanted){let newer=(cursor+31)%32;for(let i=1;i<count;i++){const older=(cursor+31-i)%32;if(times[older]<=wanted){const t=clamp((wanted-times[older])/Math.max(.0001,times[newer]-times[older]));return [T.MathUtils.lerp(x[older],x[newer],t),T.MathUtils.lerp(z[older],z[newer],t)];}newer=older;}return [x[newer],z[newer]];}
 return {update(time,speed,position,yaw,scale,reduced){
  const px=position?.[0]||0,pz=position?.[2]||0,prev=(cursor+31)%32;
  if(time<last||count&&Math.hypot(px-x[prev],pz-z[prev])>12){count=cursor=0;}last=time;
  x[cursor]=px;z[cursor]=pz;times[cursor]=time;cursor=(cursor+1)%32;count=Math.min(32,count+1);
  const moving=clamp(speed/4),frequency=1.1+moving*3.2;
  for(let i=0;i<13;i++){
   const t=i/12,[hx,hz]=past(time-(1-t)*.35),dx=hx-px,dz=hz-pz;
   let lx=(dx*Math.cos(yaw)-dz*Math.sin(yaw))/(scale.x||1),lz=(dx*Math.sin(yaw)+dz*Math.cos(yaw))/(scale.z||1);
   const limit=(1-t)*.85,k=Math.min(1,limit/(Math.hypot(lx,lz)||1)),amplitude=(.055+moving*.32)*(1-t*.75)*(reduced?0:1),phase=time*frequency+t*Math.PI*2;
   delta[i].set(lx*k+Math.sin(phase)*amplitude,Math.cos(phase)*amplitude*.22,lz*k+Math.cos(phase*.7)*amplitude*.18);
  }
  for(const {mesh,rest,flow} of parts){
   const p=mesh.geometry.attributes.position;
   for(let i=0;i<p.count;i++){
    const ring=flow.getX(i)*12,a=Math.floor(ring),b=Math.min(12,a+1),t=ring-a,k=i*3;
    p.setXYZ(i,rest[k]+T.MathUtils.lerp(delta[a].x,delta[b].x,t),rest[k+1]+T.MathUtils.lerp(delta[a].y,delta[b].y,t),rest[k+2]+T.MathUtils.lerp(delta[a].z,delta[b].z,t));
   }
   p.needsUpdate=true;
  }
  return {headShiftX:delta[12].x,headShiftY:delta[12].y,headShiftZ:delta[12].z,headYaw:(delta[12].x-delta[11].x)*.4,tailLag:.35};
 }};
}

export function createReferenceGuardianAnimation(id,body){
 const rig=body.referenceRig,entries=Object.entries(rig.groups),restY=body.position.y,restZ=body.position.z,restScale=body.scale.clone(),worldScale=new T.Vector3();
 const legs=entries.filter(([name])=>/^(front|back)-(left|right)$/.test(name)).map(([name,g])=>({name,g,knee:rig.groups[name+'-knee'],foot:rig.groups[name+'-foot'],front:name.startsWith('front'),side:name.endsWith('left')?1:-1,base:g.position.clone()}));
 const wings=entries.filter(([name])=>name.startsWith('wing-')),tails=entries.filter(([name])=>name.startsWith('tail-'));
 const dragon=id==='water'?flowingDragon(rig.flowMeshes):null;
 let state={},lastTime=null,gait=0,headPose={},snapshot={},previousHeight=0,landAge=1;
 return {setState(value){state=value||{};},get headPose(){return headPose;},state:()=>({...snapshot,legs:legs.map(j=>({hip:j.g.rotation.x,knee:j.knee?.rotation.x||0})),wings:wings.map(([,g])=>g.rotation.z)}),
  update(time,moving,reducedMotion,velocity){
   const dt=lastTime==null?0:clamp(time-lastTime,0,.1);if(lastTime!=null&&time<lastTime)gait=0;lastTime=time;
   const speed=state.aiOwnedMovement?state.moveSpeed||0:moving?Math.max(1.5,Math.abs(velocity||0)):0,a=state.action,p=a?.parameters||{},age=a?.age||0,windup=p.windup||p.warning||.6;
   const charge=a?clamp(age/windup)*(age<windup?1:a.role==='defense'?.85:0):0,release=a?.release,timed=!!a&&'release'in a,attackAge=age-(release?.age??(timed?Infinity:windup));
   const repeat=!timed&&['melee','finisher'].includes(a?.role)&&!['wolf-plunge','turtle-collapse'].includes(a?.type),interval=repeat?p.interval||0:0,pulse=a&&a.role!=='defense'&&attackAge>=0?Math.exp(-(interval?attackAge%interval:attackAge)*9):0;
   const height=state.offset?.y||0,airborne=height>.15;if(previousHeight>.15&&!airborne)landAge=0;else landAge+=dt;previousHeight=height;
   const landing=Math.exp(-landAge*12),stride=reducedMotion||airborne?0:clamp(speed/2),yaw=state.offset?.yaw||0,movement=state.moveVelocity||[0,0,speed],n=Math.hypot(movement[0],movement[2])||1;
   const forward=(movement[0]*Math.sin(yaw)+movement[2]*Math.cos(yaw))/n,sideways=(movement[0]*Math.cos(yaw)-movement[2]*Math.sin(yaw))/n;
   const heavy=id==='earth';
   gait+=dt*speed*(heavy?.49:.7);
   for(const leg of legs){
    const phase=gait+(leg.side>0?Math.PI:0)+(leg.front?Math.PI:0),swing=Math.sin(phase),lift=Math.max(0,Math.cos(phase));
    leg.g.rotation.set(-swing*(heavy?.32:.52)*stride*forward-(leg.front?.6:.4)*charge-(leg.front?.85:-.3)*pulse,0,swing*.3*stride*sideways);
    leg.g.position.copy(leg.base);leg.g.position.y+=lift*(heavy?.10:.20)*stride;
    if(leg.knee)leg.knee.rotation.x=lift*.75*stride+charge*.9+landing*.7;
    if(leg.foot)leg.foot.rotation.x=-(leg.knee?.rotation.x||0)*.35;
    if(airborne){leg.g.rotation.x=leg.front?-.8:.65;if(leg.knee)leg.knee.rotation.x=.85;}
    if(heavy&&['turtle-ram','turtle-spin'].includes(a?.type)&&age>=windup){leg.g.rotation.x=leg.front?-.65:.55;if(leg.knee)leg.knee.rotation.x=.8;}
   }
   for(const [name,g]of wings){const side=name.endsWith('left')?1:-1;g.rotation.z=side*((reducedMotion?0:Math.sin(time*(moving?8:3.5))*(moving?.3:.09))+charge*.5-pulse*.7);g.rotation.x=charge*-.15+pulse*.3;}
   for(const [i,[,g]]of tails.entries()){g.rotation.y=(reducedMotion?0:Math.sin(time*(moving?5:1.8)+i*.65)*.085)+charge*Math.sin(i)*.14+(release?.kind==='sweep'?(release.side?-1:1)*pulse*.75:0);g.rotation.x=-charge*.10+pulse*.12;}
   for(const [name,g]of entries)if(name.startsWith('spirit-ribbon'))g.rotation.z=reducedMotion?0:Math.sin(time*1.2+(name.endsWith('-1')?1:0))*.035;
   if(rig.groups.halo)rig.groups.halo.rotation.z=reducedMotion?0:Math.sin(time*.35)*.025;
   body.getWorldScale(worldScale);const swim=dragon?.update(time,speed,state.bossPosition,yaw,worldScale,reducedMotion);
   body.position.y=restY+(reducedMotion?0:Math.sin(time*2)*.018+Math.abs(Math.sin(gait*2))*.055*stride)-charge*.30+pulse*.20-landing*.3;
   body.position.z=restZ-charge*.2+pulse*.5;body.rotation.x=charge*.16-pulse*.20+landing*.08;
   body.rotation.z=(state.mechanics?.toppled?Math.PI/2:0)+(reducedMotion?0:Math.sin(gait)*.025*stride);
   body.scale.copy(restScale);body.scale.y*=1-charge*.055-landing*.025;
   headPose={headPull:charge*.4-pulse*.15,headTilt:-charge*.25+pulse*.3,...swim};
   snapshot={speed,gait,stride,charge,strike:pulse,releaseKind:release?.kind||null,landing,airborne,swimming:!!swim,tailLag:swim?.tailLag||0,stage:airborne?'leap':landing>.2?'land':charge>0?'windup':pulse>.1?'strike':a?'recover':moving?'move':'idle',legCount:id==='water'?0:legs.length,wingCount:wings.length,dragonMeshes:dragon?rig.flowMeshes.length:0,tailCount:tails.length};
  }
 };
}
