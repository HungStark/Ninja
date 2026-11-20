import * as T from 'three';

const UP=new T.Vector3(0,1,0);

export function createStoryCamera({camera,hero,resolveActor,occluded,onFrame}){
  const purpose=new T.PerspectiveCamera();
  let scene=null;
  const actor=speaker=>speaker&&!speaker.thought?resolveActor(speaker.id)||hero.root:hero.root;
  const eye=root=>root.getWorldPosition(new T.Vector3()).addScaledVector(UP,
    root.userData.storyEyeHeight??(root===hero.root?2.4:2.35)-(root.userData.storyPose==='wounded'||root.userData.storyPose==='captive'?.65:0));

  function begin(speakers){
    const roots=speakers.map(actor);
    const partner=roots.find(root=>root!==hero.root)||null;
    const position=hero.root.getWorldPosition(new T.Vector3());
    const forward=partner?partner.getWorldPosition(new T.Vector3()).sub(position):new T.Vector3(0,0,1).applyQuaternion(hero.root.quaternion);
    forward.y=0;
    if(forward.lengthSq()<.01)forward.set(0,0,1);
    forward.normalize();
    const side=new T.Vector3(forward.z,0,-forward.x);
    const center=partner?eye(hero.root).lerp(eye(partner),.5):eye(hero.root);
    const left=center.clone().addScaledVector(side,4.5).addScaledVector(UP,.8);
    const right=center.clone().addScaledVector(side,-4.5).addScaledVector(UP,.8);
    if(occluded(center,left)||!occluded(center,right)&&camera.position.distanceToSquared(right)<camera.position.distanceToSquared(left))side.negate();
    scene={partner,forward,side,age:0,last:-1,cut:0,base:{position:camera.position.clone(),quaternion:camera.quaternion.clone(),fov:camera.fov,visible:hero.root.visible}};
  }

  function companion(subject,other){
    if(other&&subject!==other)return other;
    return subject===hero.root?scene.partner:hero.root;
  }

  function applyShot(mode,subject,other,position,aim,fov){
    purpose.position.copy(position);
    purpose.lookAt(aim);
    camera.position.copy(position);
    camera.quaternion.copy(purpose.quaternion);
    camera.fov=fov;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    Object.assign(scene,{mode,subject,other,aspect:camera.aspect,cut:scene.cut+1});
    onFrame();
  }

  function visual(shot,target){
    if(!scene)return;
    const mode=shot==='insert'&&target?'insert':'thought';
    const center=target?new T.Box3().setFromObject(target):null;
    const focus=center?.getCenter(new T.Vector3());
    const origin=hero.root.getWorldPosition(new T.Vector3());
    const front=focus?focus.clone().sub(origin).setY(0):new T.Vector3(0,0,1).applyQuaternion(hero.root.quaternion);
    if(front.lengthSq()<.01)front.copy(scene.forward);
    front.normalize();
    const side=new T.Vector3(front.z,0,-front.x);
    if(side.dot(scene.side)<0)side.negate();
    const insert=mode==='insert';
    const aim=insert?focus:hero.facePosition().addScaledVector(UP,-.12);
    const size=insert?center.getSize(new T.Vector3()):null;
    const distance=insert?Math.max(2.8,size.y*1.65,Math.hypot(size.x,size.z)*1.12/Math.min(1.3,camera.aspect)):2.35*Math.max(1,.83/camera.aspect);
    const offset=insert?target.userData.storyInsertOffset:null;
    const direction=offset
      ?new T.Vector3().fromArray(offset).applyQuaternion(target.getWorldQuaternion(new T.Quaternion())).normalize()
      :front.clone().multiplyScalar(insert?-1:1).addScaledVector(side,insert?1.05:.27).normalize();
    const position=aim.clone().addScaledVector(direction,distance).addScaledVector(UP,insert?distance*.26:.05);
    if(occluded(aim,position)){
      position.copy(aim).addScaledVector(side,distance).addScaledVector(UP,insert?distance*.38:.42);
      if(occluded(aim,position))position.copy(aim).addScaledVector(direction,distance*.73).addScaledVector(UP,insert?distance*.58:.75);
    }
    scene.visual={shot,target};
    scene.cues=[];
    applyShot(mode,insert?target:hero.root,null,position,aim,insert?48:38);
  }

  function cutTo(mode,subject,other,force=false){
    other=companion(subject,other);
    if(!force&&scene.mode===mode&&scene.subject===subject&&scene.other===other)return;
    const target=eye(subject),listener=other?eye(other):null;
    const axis=listener?listener.clone().sub(target):scene.forward.clone();
    axis.y=0;
    const separation=axis.length();
    if(separation<.1)axis.copy(scene.forward);
    axis.normalize();
    const side=new T.Vector3(axis.z,0,-axis.x);
    if(side.dot(scene.side)<0)side.negate();
    const aspect=Math.min(2.4,Math.max(.35,camera.aspect));
    const frame=Math.max(1,1.15/aspect);
    const scale=Math.max(0,(subject.userData.storyEyeHeight||0)-2.4,(other?.userData.storyEyeHeight||0)-2.4);
    const wide=mode==='wide'||mode==='exit',ots=mode==='ots'&&listener&&separation>1.2&&separation<5.5&&!scale;
    const aim=target.clone();
    if(wide&&listener)aim.lerp(listener,.5);
    aim.y+=wide?-.68+scale*.28:-.23;
    const position=aim.clone()
      .addScaledVector(side,(wide ? (mode==='exit'?5.7:4.2)+separation*.57+scale*1.05 : ots ? .98 : 1.27+scale*.5)*frame)
      .addScaledVector(axis,(wide ? (listener ? .7 : 2.7) : ots ? separation+.7 : 2.65+scale*.55)*frame)
      .addScaledVector(UP,wide ? .82+scale*.35 : .36);
    const clear=point=>!occluded(aim,point)&&(!wide||!listener||!occluded(target,point)&&!occluded(listener,point));
    let fov=wide?52:mode==='reaction'?39:43;
    if(!clear(position)){
      const tighter=target.clone().addScaledVector(side,.75*frame).addScaledVector(axis,(1.9+scale*.55)*frame).addScaledVector(UP,.38);
      const higher=position.clone().addScaledVector(UP,1.35);
      if(clear(higher))position.copy(higher);
      else if(!occluded(target,tighter)){position.copy(tighter);aim.copy(target).addScaledVector(UP,-.28);fov=47;}
      else {position.copy(scene.base.position);aim.copy(target);}
    }
    scene.visual=null;
    applyShot(mode,subject,other,position,aim,fov);
  }

  function line(line,index,duration,next,target){
    if(!scene)return;
    const subject=actor(line.speaker),previous=scene.speaker;
    const other=subject===hero.root?scene.lastNpc||scene.partner:hero.root;
    if(subject!==hero.root)scene.lastNpc=subject;
    const mode=line.cue?.shot||(index>1&&index%3===2?'ots':'single');
    scene.age=0;
    scene.last=index;
    scene.speaker=subject;
    scene.speakerId=line.speaker.id;
    scene.cues=[];
    if(mode==='insert'||mode==='thought'){
      if(scene.mode!==mode)visual(mode,target);
      return;
    }
    if(index===0){
      cutTo('wide',hero.root,scene.partner);
      scene.cues.push({at:Math.min(1,duration*.43),mode,subject,other});
    }else if(previous!==subject||line.cue?.shot){
      if(scene.subject!==subject||scene.mode!=='reaction'||line.cue?.shot)cutTo(mode,subject,other);
    }
    const reacting=next&&!next.speaker.thought?actor(next.speaker):null;
    if(reacting&&reacting!==subject&&duration>=2.4&&(line.cue?.reaction||index%4===1)){
      scene.cues.push({at:duration-Math.min(1.1,duration*.29),mode:'reaction',subject:reacting,other:subject});
    }
  }

  function update(dt){
    if(!scene)return;
    hero.root.visible=true;
    scene.age+=dt;
    let cue;
    while(scene.cues?.[0]?.at<=scene.age)cue=scene.cues.shift();
    if(cue)cutTo(cue.mode,cue.subject,cue.other);
    else if(scene.subject&&camera.aspect!==scene.aspect){
      if(scene.visual)visual(scene.visual.shot,scene.visual.target);
      else cutTo(scene.mode,scene.subject,scene.other,true);
    }
    onFrame();
  }

  function reactTo(speaker){
    if(!scene)return;
    scene.cues=[];
    cutTo('reaction',actor(speaker),scene.speaker);
  }

  function end(){
    if(!scene)return;
    const {position,quaternion,fov,visible}=scene.base;
    camera.position.copy(position);
    camera.quaternion.copy(quaternion);
    camera.fov=fov;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    hero.root.visible=visible;
    scene=null;
    onFrame();
  }

  return {begin,line,visual,reactTo,end,update,get active(){return !!scene;},
    exit(){if(scene){scene.cues=[];cutTo('exit',hero.root,scene.partner);}},
    state:()=>scene?{speaker:scene.speakerId,shot:scene.mode,line:scene.last,subject:scene.subject?.name,cut:scene.cut}:null};
}
