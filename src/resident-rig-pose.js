import * as T from 'three';

// Targets use the resident's root coordinates (a three-unit standing figure).
// Index 0 is the old procedural arm at -X; index 1 is the arm at +X.
export function residentActivityPose(profile,time,moving){
  if(moving||!profile.activity)return null;
  const t=time+profile.variant*.53,type=profile.activity,s=Math.sin(t*.9);
  const pose={type,hipsDrop:0,spine:.12,chest:.04,knee:.12,hands:null,toolPitch:0};
  if(profile.memorialOffering){
    const reach=.5-.5*Math.cos(t*.7);
    return {...pose,type:'kneeling-offering',hipsDrop:.84,spine:.12+reach*.05,chest:.04,kneeling:true,hands:[[-.16,.98-reach*.09,.43+reach*.33],[.24,.86,.31]],reach};
  }
  switch(type){
    case 'mourning':case 'offering':
      return {...pose,spine:.18,hands:[[-.16,1.58,.54],[.20,1.52,.50]]};
    case 'forging':case 'repair':case 'mining':{
      const phase=(t*(type==='forging'?.65:.8))%1,lift=phase<.65?Math.sin(phase/.65*Math.PI/2):Math.max(0,1-(phase-.65)/.12);
      return {...pose,hipsDrop:.13,spine:.43,chest:.13,knee:.30,hands:[[-.20,1.48,.88],[.39,1.40+lift*.82,.53-lift*.12]],toolPitch:1.52-lift*2.1,lift};
    }
    case 'farming':
      return {...pose,hipsDrop:.36-s*.04,spine:.66-s*.10,chest:.12,knee:.68,hands:[[-.12,1.34+s*.10,.60],[.17,1.23+s*.14,.72+s*.06]],toolPitch:.12+s*.18};
    case 'watering':
      return {...pose,hipsDrop:.11,spine:.30,chest:.08,knee:.24,hands:[[-.22,1.55,.43],[.34,1.45+s*.07,.70]],toolPitch:.25+s*.18};
    case 'repairing':
      return {...pose,hipsDrop:.08,spine:.25,chest:.10,hands:[[-.22,1.85,.65],[.18+Math.sin(t*2)*.035,1.91,.70]]};
    case 'pottery':
      return {...pose,hipsDrop:.24,spine:.45,chest:.12,knee:.45,hands:[[-.21,1.28+Math.sin(t*1.2)*.025,.99],[.21,1.28+Math.cos(t*1.2)*.025,.99]]};
    case 'reading':
      return {...pose,spine:.08,hands:[[-.24,1.91,.48],[.24,1.91,.48]]};
    case 'mending':
      return {...pose,hipsDrop:.12,spine:.22,knee:.25,hands:[[-.22,1.61,.51],[.20,1.65+Math.sin(t*1.4)*.045,.53]]};
    case 'warming':
      return {...pose,hipsDrop:.31,spine:.32,knee:.6,hands:[[-.27,1.22,.70],[.27,1.22,.70]]};
    case 'market':case 'sorting':
      return {...pose,hipsDrop:.1,spine:.28,knee:.22,hands:[[-.25,1.53,.76],[.25+s*.11,1.50,.88]]};
    case 'fishing':
      return {...pose,spine:.08,hands:[[-.16,1.69,.49],[.24,1.63+Math.sin(t*.8)*.025,.54]],toolPitch:-.08};
    case 'observing':
      return {...pose,hipsDrop:.09,spine:.28,hands:[[-.22,2.02,.61],[.22,2.02,.61]]};
    case 'lookout':
      return {...pose,spine:.02,hands:[[-.37,1.59,.07],[.18,2.70,.16]]};
    default:return null;
  }
}

// Solve in world space so the same action works for both VRM proportions and
// for residents scaled to different heights. Keep the elbow outside the body.
export function reachResidentHand(root,upper,lower,hand,target,side,poleTarget=null){
  if(!upper||!lower||!hand)return;
  upper.updateWorldMatrix(true,true);
  const shoulder=upper.getWorldPosition(new T.Vector3()),elbow=lower.getWorldPosition(new T.Vector3()),wrist=hand.getWorldPosition(new T.Vector3());
  const goal=root.localToWorld(new T.Vector3(...target)),direction=goal.clone().sub(shoulder),upperLength=shoulder.distanceTo(elbow),lowerLength=elbow.distanceTo(wrist);
  const distance=Math.max(.001,Math.min(direction.length(),upperLength+lowerLength-.001));direction.normalize();
  const pole=root.localToWorld(poleTarget?new T.Vector3(...poleTarget):new T.Vector3(side*.95,1.65,-.30)).sub(shoulder);
  pole.addScaledVector(direction,-pole.dot(direction));
  if(pole.lengthSq()<.000001)pole.set(side,0,0);pole.normalize();
  const along=(upperLength*upperLength-lowerLength*lowerLength+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,upperLength*upperLength-along*along));
  const desiredElbow=shoulder.clone().addScaledVector(direction,along).addScaledVector(pole,height);
  const desiredWrist=shoulder.clone().addScaledVector(direction,distance);
  const aim=(bone,child,point)=>{
    const origin=bone.getWorldPosition(new T.Vector3()),current=child.getWorldPosition(new T.Vector3()).sub(origin).normalize(),desired=point.clone().sub(origin).normalize();
    const rotation=new T.Quaternion().setFromUnitVectors(current,desired).multiply(bone.getWorldQuaternion(new T.Quaternion()));
    bone.quaternion.copy(bone.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(rotation));bone.updateWorldMatrix(false,true);
  };
  aim(upper,lower,desiredElbow);aim(lower,hand,desiredWrist);
}
