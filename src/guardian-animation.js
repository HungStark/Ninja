import * as T from 'three';
import {createGuardianDragonMotion} from './guardian-dragon-motion.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Build joints once. Animation only updates transforms and the dragon's two
// small tube meshes; it creates no geometry or materials during a frame.
export function createGuardianAnimation(id,body){
 const joints=[],wings=[],tails=[],dragon=[],restY=body.position.y,restZ=body.position.z,restScale=body.scale.clone(),worldScale=new T.Vector3();
 const parts=[];body.updateWorldMatrix(true,true);body.traverse(m=>{if(m.isMesh)parts.push(m);});
 const local=m=>body.worldToLocal(m.getWorldPosition(new T.Vector3()));
 function pivot(name,p,meshes){const g=new T.Group();g.name=name;g.position.fromArray(p);body.add(g);body.updateWorldMatrix(true,true);for(const m of meshes)g.attach(m);return g;}
 const legNames=/^(beast-leg|beast-shin|beast-paw|claw|tortoise-leg|tortoise-claw)$/;
 const legParts=parts.filter(m=>legNames.test(m.name)),hips=[];
 if(legParts.length){
  const turtle=id==='earth',slender=id==='wood',x=turtle?2.35:slender?.8:1;
  for(const side of [-1,1])for(const z of turtle?[-2,1.9]:[-1.4,1.15])hips.push({side,z,p:[side*x,turtle?1.4:2.4,z],parts:[]});
  for(const m of legParts){const p=local(m),hip=hips.reduce((a,b)=>Math.hypot(p.x-a.p[0],p.z-a.z)<Math.hypot(p.x-b.p[0],p.z-b.z)?a:b);hip.parts.push(m);}
  for(const hip of hips){const g=pivot('guardian-leg-joint',hip.p,hip.parts),shin=hip.parts.filter(m=>['beast-shin','beast-paw','claw'].includes(m.name));let knee=null;
   if(shin.length){knee=new T.Group();knee.name='guardian-knee-joint';knee.position.set(0,-1.4,hip.z<0?-.25:.15);g.add(knee);g.updateWorldMatrix(true,true);for(const m of shin)knee.attach(m);}
   for(const part of hip.parts)part.userData.guardianPart='leg-'+(hip.z>0?'front-':'back-')+(hip.side<0?'left':'right');joints.push({...hip,g,knee,base:g.position.clone()});
  }
 }
 const wingParts=parts.filter(m=>/^(broad-eagle-wing|wing-arm|wing-tip|flight-feather|feather-tip)$/.test(m.name));
 for(const side of [-1,1]){
  const meshes=wingParts.filter(m=>{m.geometry.computeBoundingBox();const center=m.geometry.boundingBox.getCenter(new T.Vector3()).applyMatrix4(m.matrixWorld);return Math.sign(body.worldToLocal(center).x)===side;});
  if(meshes.length)wings.push({side,g:pivot('guardian-wing-joint',[side*.8,3.5,-.2],meshes)});
 }
 for(const m of parts.filter(m=>/^(fire-tail-\d+|beast-tail|spirit-tail|ribbon-tail)$/.test(m.name)))tails.push({g:pivot('guardian-tail-joint',[0,1.9,-1.8],[m]),phase:tails.length*.65});
 for(const m of parts.filter(m=>['serpentine-dragon','dragon-white-underbelly'].includes(m.name)))dragon.push(m);
 const dragonMotion=id==='water'?createGuardianDragonMotion(body):null;
 let state={},lastTime=null,gait=0,headPose={},snapshot={},lastHeight=0,landAge=1;
 return {
  setState(s){state=s||{};},get headPose(){return headPose;},state:()=>({...snapshot,legs:joints.map(j=>({hip:j.g.rotation.x,knee:j.knee?.rotation.x||0})),wings:wings.map(w=>w.g.rotation.z)}),
  update(time,moving,reducedMotion,velocity){
   const dt=lastTime==null?0:clamp(time-lastTime,0,.1);lastTime=time;
   const speed=state.aiOwnedMovement?state.moveSpeed||0:moving?Math.max(1.5,Math.abs(velocity||0)):0,run=clamp(speed/6,0,1),a=state.action,p=a?.parameters||{},age=a?.age||0;
   const windup=p.windup||p.warning||.6,guard=a?.role==='defense',charge=a?clamp(age/windup,0,1)*(age<windup?1:guard?.85:0):0;
   const repeat=['melee','finisher'].includes(a?.role)&&!['wolf-plunge','turtle-collapse'].includes(a?.type),interval=repeat?p.interval||0:0,attackAge=age-windup,pulse=a&&!guard&&attackAge>=0?Math.exp(-(interval?attackAge%interval:attackAge)*9):0;
   const dashing=a?.role==='pursuit'||['wolf-dashes','shadow-dashes','tiger-claws'].includes(a?.type),ram=['turtle-ram','turtle-spin'].includes(a?.type)&&age>=windup;
   const height=state.offset?.y||0,airborne=height>.15;if(lastHeight>.15&&!airborne)landAge=0;else landAge+=dt;lastHeight=height;const landing=Math.exp(-landAge*12);
   body.getWorldScale(worldScale);const stance=id==='earth'?.75:.6,legLength=(id==='earth'?1.22:2.16)*worldScale.y,stepLength=Math.max(.5,2*legLength*Math.sin(id==='earth'?.38:.55));
   const stride=reducedMotion||airborne?0:clamp(speed/2,0,1);gait+=stride?dt*speed*stance/Math.max(.2,stepLength*stride)*Math.PI*2:0;
   const motionVelocity=state.moveVelocity||[0,0,speed],yaw=state.offset?.yaw||0,n=Math.hypot(motionVelocity[0],motionVelocity[2])||1,forward=(motionVelocity[0]*Math.sin(yaw)+motionVelocity[2]*Math.cos(yaw))/n,sideways=(motionVelocity[0]*Math.cos(yaw)-motionVelocity[2]*Math.sin(yaw))/n;
   for(const j of joints){const offset=id==='earth'?(j.side<0?(j.z>0?.25:0):(j.z>0?.75:.5)):(j.side>0?.5:0)+(j.z>0?.5:0),phase=(gait/(Math.PI*2)+offset)%1,swing=phase>=stance,step=swing?(phase-stance)/(1-stance):phase/stance,progress=swing?step*step*(3-2*step):step,foot=(swing?progress-.5:.5-progress)*stepLength/Math.max(.1,legLength),lift=swing?Math.sin(step*Math.PI):0;
    const angle=Math.asin(clamp(foot,-.8,.8))*stride;j.g.rotation.x=-angle*forward+(j.z>0?-.6:-.4)*charge+(j.z>0?-.85:.3)*pulse;j.g.rotation.z=angle*sideways;
    j.g.position.copy(j.base);j.g.position.y+=lift*(id==='earth'?.1:.24)*stride;
    if(j.knee)j.knee.rotation.x=lift*.8*stride+charge*1.1+landing*.8;
    if(airborne){j.g.rotation.x=j.z>0?-.8:.65;j.g.rotation.z=0;if(j.knee)j.knee.rotation.x=.85;}
    if(ram){j.g.rotation.x=j.z>0?-.65:.55;if(j.knee)j.knee.rotation.x=.8;}
   }
   for(const w of wings){const flap=reducedMotion?0:Math.sin(time*(moving?8:3.5))*(moving?.38:.12);w.g.rotation.z=w.side*(flap+charge*.7-pulse*.85);w.g.rotation.x=charge*-.15+pulse*.3;}
   for(const t of tails){t.g.rotation.y=(reducedMotion?0:Math.sin(time*(moving?5:1.8)+t.phase)*.1)+charge*Math.sin(t.phase)*.18;t.g.rotation.x=-charge*.12+pulse*.15;}
   const motion=reducedMotion?0:1;
   const swim=dragonMotion?.update(time,speed,state.bossPosition,yaw,worldScale,charge,reducedMotion);
   const bob=(swim?Math.sin(time*(moving?2.5:1.2))*.04:(Math.abs(Math.sin(gait*2))*(id==='earth'?.025:.08)*stride+Math.sin(time*2)*.015))*motion;
   const weight=id==='earth'?1.35:1;body.position.y=restY+bob-charge*.36*weight+pulse*.22-landing*.4*weight;body.position.z=restZ-charge*.2+pulse*.55;body.rotation.x=charge*.18-pulse*.22+landing*.1;
   body.rotation.z=(state.mechanics?.toppled?Math.PI/2:0)+((swim?0:Math.sin(gait)*.04*stride)+Math.sin(time*2)*.01)*motion;body.scale.copy(restScale);body.scale.y*=1-charge*.075-landing*.04;
   headPose={headPull:charge*.4-pulse*.15,headTilt:-charge*.25+pulse*.3,...swim};
   snapshot={speed,gait,stride,charge,strike:pulse,landing,airborne,swimming:!!swim,tailLag:swim?.tailLag||0,stage:airborne?'leap':landing>.2?'land':charge>0?'windup':pulse>.1?'strike':a?'recover':moving?'move':'idle',legCount:joints.length,wingCount:wings.length,dragonMeshes:dragon.length};
  }
 };
}
