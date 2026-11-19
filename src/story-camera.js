import * as T from 'three';

// Keep the conversation on one side of the actors' line so reverse shots read cleanly.
export function createStoryCamera({camera,hero,resolveActor,occluded,onFrame}){
  let scene=null;
  const eye=(root,out)=>root.getWorldPosition(out).add(new T.Vector3(0,root.userData.storyEyeHeight??(root===hero.root?2.4:2.35),0));
  const target=new T.Vector3(),otherEye=new T.Vector3(),axis=new T.Vector3(),side=new T.Vector3(),desired=new T.Vector3();
  const purpose=new T.PerspectiveCamera();
  function begin(speakers){
    if(!scene)scene={baseFov:camera.fov,basePosition:camera.position.clone(),baseRotation:camera.quaternion.clone(),age:0,last:-1};
    scene.returnAge=null;scene.age=0;scene.last=-1;
    scene.partner=speakers.map(s=>resolveActor(s.id)).find(r=>r&&r!==hero.root)||null;
    return !!scene.partner;
  }
  function line(speaker,index){
    if(!scene?.partner)return;
    scene.age=0;scene.last=index;
    scene.speaker=speaker.thought?hero.root:resolveActor(speaker.id)||hero.root;
    scene.speakerId=speaker.id;
    scene.mode=index===0?'wide':'speaker';
  }
  function end(immediate=false){
    if(!scene)return;
    if(immediate){camera.position.copy(scene.basePosition);camera.quaternion.copy(scene.baseRotation);camera.fov=scene.baseFov;camera.updateProjectionMatrix();scene=null;return;}
    if(scene.returnAge===null||scene.returnAge===undefined){scene.returnAge=0;scene.returnPosition=camera.position.clone();scene.returnRotation=camera.quaternion.clone();scene.returnFov=camera.fov;}
  }
  function update(dt){
    if(!scene)return false;
    if(scene.returnAge!==null&&scene.returnAge!==undefined){
      scene.returnAge+=dt;
      const t=Math.min(1,scene.returnAge/.42),blend=t*t*(3-2*t);
      camera.position.lerpVectors(scene.returnPosition,scene.basePosition,blend);
      camera.quaternion.slerpQuaternions(scene.returnRotation,scene.baseRotation,blend);
      camera.fov=T.MathUtils.lerp(scene.returnFov,scene.baseFov,blend);
      if(t===1)scene=null;
    }else{
      if(!scene.partner||!scene.speaker||!scene.partner.parent){end(true);return false;}
      hero.root.visible=true;
      scene.age+=dt;
      const speaker=scene.speaker,listener=speaker===hero.root?scene.partner:hero.root;
      eye(speaker,target);eye(listener,otherEye);
      axis.copy(otherEye).sub(target);axis.y=0;
      if(axis.lengthSq()<.01)axis.set(0,0,1);
      axis.normalize();side.set(axis.z,0,-axis.x);
      if(speaker===hero.root)side.negate();
      const wide=scene.mode==='wide'&&scene.age<1.15;
      if(wide)target.lerp(otherEye,.5);
      target.y-=wide?.36:.26;
      const frame=Math.max(1,1.35/camera.aspect);
      const creatureScale=Math.max(0,(speaker.userData.storyEyeHeight||0)-2.4,(listener.userData.storyEyeHeight||0)-2.4);
      if(wide)target.y+=creatureScale*.38;
      const place=hand=>desired.copy(target).addScaledVector(side,hand*((wide?4.5:1.65)+creatureScale*(wide?1.45:.75))*frame).addScaledVector(axis,((wide?.8:2.65)+creatureScale*.45)*frame).add(new T.Vector3(0,(wide?1.25:.42)+creatureScale*(wide?.66:.32),0));
      place(1);
      if(occluded(target,desired)){
        place(-1);
        if(occluded(target,desired)){
          place(1);desired.y+=2.5;
          if(occluded(target,desired)){place(-1);desired.y+=3.5;}
          if(occluded(target,desired)&&scene.basePosition.distanceTo(target)<14)desired.copy(scene.basePosition);
        }
      }
      purpose.position.copy(desired);purpose.lookAt(target);
      const alpha=1-Math.exp(-dt*9);
      camera.position.lerp(desired,alpha);camera.quaternion.slerp(purpose.quaternion,alpha);
      camera.fov=T.MathUtils.lerp(camera.fov,wide?(creatureScale>0?60:56):43,alpha);
    }
    camera.updateProjectionMatrix();onFrame();return true;
  }
  return {begin,line,end,update,state:()=>scene?{speaker:scene.speakerId||'hero',shot:scene.returnAge!=null?'return':scene.mode==='wide'&&scene.age<1.15?'wide':'speaker',line:scene.last}:null};
}
