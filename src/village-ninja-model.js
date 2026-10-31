import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {inkMaterial,addInkOutline} from './ink-outline.js';
import {createCharacterMotion,REST_ARM_OPEN} from './character-motion.js';
import {reachResidentHand} from './resident-rig-pose.js';
import {applyVillageNinjaStyle} from './village-ninja-style.js';

let sourcePromise;
const rotation=(x=0,y=0,z=0)=>new T.Quaternion().setFromEuler(new T.Euler(x,y,z));

export function attachVillageNinja(root,profile,fallback){
  const ink=inkMaterial(.8,'#302b30'),motion=createCharacterMotion();
  let visual=null,bones=null,rest=null,hipsY=0,scale=1,alive=true,combat=false,lastState=null,lastTime=0;
  const boneNames={hips:'J_Bip_C_Hips',spine:'J_Bip_C_Spine',chest:'J_Bip_C_Chest',head:'J_Bip_C_Head'};
  const handsVisible=()=>{if(visual)visual.traverse(o=>{
    if(!o.isMesh||o.userData.inkOutline)return;
    if(o.name.startsWith('NinjaCombat'))o.visible=combat;
    else if(o.name.startsWith('NinjaNativeHand_')||/wrist.*tie/i.test(o.name))o.visible=!combat;
    else if(/tops|body_00_skin/i.test(o.material?.name||''))o.visible=!combat;
  });};
  const apply=(bone,q)=>{if(bone)bone.quaternion.copy(rest.get(bone)).premultiply(q);};
  function arm(i,pitch,spread,flex,clearance=0){
    const side=i===0?1:-1,upper=bones.arms[i],lower=bones.elbows[i];
    if(upper)upper.quaternion.copy(rest.get(upper)).premultiply(rotation(0,0,-side*1.55)).premultiply(rotation(pitch,0,spread+side*clearance));
    if(lower)lower.quaternion.copy(rest.get(lower)).multiply(rotation(0,-side*flex,0));
  }
  function pose(state,time){
    if(!bones)return;
    const {weight,forward,side,sprintLean,sprintBlend,gait}=state;
    for(let i=0;i<2;i++){
      const step=gait.legs[i],a=state.arms[i];arm(i,a.pitch,a.spread,a.flex,REST_ARM_OPEN);
      apply(bones.legs[i],rotation(step.hip-sprintLean,0,step.side));apply(bones.knees[i],rotation(step.knee));apply(bones.feet[i],rotation(step.ankle,0,-step.side));
    }
    apply(bones.hips,rotation(forward*weight*.045*(1-sprintBlend)+sprintLean,0,-side*weight*.05));
    bones.hips.position.y=hipsY-gait.drop*bones.legLength+Math.sin(time*2)*.008*(1-weight)/scale;
    apply(bones.spine,rotation(-forward*weight*.018,0,side*weight*.018));apply(bones.chest,rotation(-forward*weight*.012,0,side*weight*.012));
    apply(bones.head,rotation(Math.sin(time*.9+profile.variant)*.012,Math.sin(time*.5+profile.variant)*.025));
    const blink=((time+profile.variant*.61)%4.6+4.6)%4.6;
    visual.traverse(o=>{if(o.morphTargetDictionary&&o.morphTargetInfluences){const index=o.morphTargetDictionary.Fcl_EYE_Close;if(index!==undefined)o.morphTargetInfluences[index]=blink<.15?Math.sin(blink/.15*Math.PI):0;}});
  }
  function update(time,moving,velocity=null,dt=1/60){
    const speed=velocity?Math.hypot(velocity.x,velocity.z):4.6;
    lastState=motion.update(time,moving,velocity,dt,moving&&speed>5.1,root.rotation.y);lastTime=time;pose(lastState,time);
  }
  const ready=typeof document==='undefined'?Promise.resolve(false):(sourcePromise??=new GLTFLoader().loadAsync(new URL('assets/village-ninja.glb',document.baseURI).href).then(g=>g.scene)).then(source=>{
    if(!alive)return false;
    visual=clone(source);applyVillageNinjaStyle(visual,profile);visual.name='village-ninja-glb';
    scale=3/1.79;visual.scale.setScalar(scale);root.add(visual);fallback.visible=false;
    bones={};for(const [key,name]of Object.entries(boneNames))bones[key]=visual.getObjectByName(name);
    for(const [key,part]of Object.entries({arms:'UpperArm',elbows:'LowerArm',hands:'Hand',legs:'UpperLeg',knees:'LowerLeg',feet:'Foot'}))bones[key]=['L','R'].map(s=>visual.getObjectByName('J_Bip_'+s+'_'+part));
    bones.legLength=bones.knees[0].position.length()+bones.feet[0].position.length();
    rest=new Map();visual.traverse(o=>{if(o.isBone)rest.set(o,o.quaternion.clone());});hipsY=bones.hips.position.y;
    const surfaces=[];visual.traverse(o=>{if(o.isMesh&&!/eye|facemouth|facebrow|badge/i.test(o.material?.name||''))surfaces.push(o);});for(const mesh of surfaces)addInkOutline(mesh,ink);
    handsVisible();root.userData.ninja={...root.userData.ninja,asset:'village-ninja.glb',modelReady:true,...visual.userData.villageStyle};
    if(!lastState)lastState=motion.update(0,false,null,0,false,root.rotation.y);pose(lastState,lastTime);
    return true;
  }).catch(error=>{console.warn('Could not load village ninja GLB:',error);return false;});
  function combatPose(attack,block,bounce){
    if(!bones)return;
    apply(bones.hips,rotation(.12+attack*.16-block*.12,-attack*.28));bones.hips.position.y=hipsY+(-.10+Math.abs(bounce)*.35)/scale;
    for(let i=0;i<2;i++){
      arm(i,i===1?-.75-attack*.95-block*.45:-.85-block*.7,(i===0?-1:1)*(.22+block*.2),i===1?.8-attack*.7+block*.25:1.05+block*.25);
      apply(bones.legs[i],rotation(i===0?-.22-attack*.2:.25+attack*.18,0,i===0?.11:-.11));apply(bones.knees[i],rotation(.25+attack*.2));
    }
  }
  function syncCombatHands(sealHands){
    if(!bones)return false;handsVisible();
    for(let i=0;i<2;i++){
      const target=root.worldToLocal(sealHands[i].wristAnchor.getWorldPosition(new T.Vector3()));
      const side=i===0?1:-1;
      reachResidentHand(root,bones.arms[i],bones.elbows[i],bones.hands[i],target.toArray(),side,[side*1.25,2.30,.10]);
    }
    return true;
  }
  return {ready,update,combatPose,syncCombatHands,setCombatMode(value){combat=value;handsVisible();},setInkViewport(w,h){ink.uniforms.viewport.value.set(w,h);},get loaded(){return !!visual;},get model(){return visual;},get bones(){return bones;},state:()=>lastState,dispose(){alive=false;if(!visual)return;visual.removeFromParent();const gs=new Set(),ms=new Set();visual.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])ms.add(m);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());visual=null;ink.dispose();}};
}
