import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkinned} from 'three/addons/utils/SkeletonUtils.js';
import {inkMaterial,addInkOutline} from './ink-outline.js';
import {residentActivityPose,reachResidentHand} from './resident-rig-pose.js';
import {REST_ARM_OPEN} from './character-motion.js';

const toonRamp=new T.DataTexture(new Uint8Array([52,52,52,255,112,112,112,255,194,194,194,255,255,255,255,255]),4,1,T.RGBAFormat);
toonRamp.minFilter=toonRamp.magFilter=T.NearestFilter;toonRamp.generateMipmaps=false;toonRamp.needsUpdate=true;
const sourcePromises=new Map();
function loadSource(female){
  const file=female?'npc_nu-simple.vrm':'npc_nam-simple.vrm';
  if(!sourcePromises.has(file))sourcePromises.set(file,new GLTFLoader().loadAsync(new URL(`assets/${file}`,document.baseURI).href).then(gltf=>gltf.scene));
  return sourcePromises.get(file);
}

const boneNames={
  hips:'J_Bip_C_Hips',spine:'J_Bip_C_Spine',chest:'J_Bip_C_Chest',head:'J_Bip_C_Head',
  leftArm:'J_Bip_L_UpperArm',leftForearm:'J_Bip_L_LowerArm',rightArm:'J_Bip_R_UpperArm',rightForearm:'J_Bip_R_LowerArm',
  leftLeg:'J_Bip_L_UpperLeg',rightLeg:'J_Bip_R_UpperLeg',leftKnee:'J_Bip_L_LowerLeg',rightKnee:'J_Bip_R_LowerLeg',leftFoot:'J_Bip_L_Foot',rightFoot:'J_Bip_R_Foot',leftHand:'J_Bip_L_Hand',rightHand:'J_Bip_R_Hand'
};

export function attachNpcModel(root,profile){
  if(typeof document==='undefined'){const idle=()=>{};idle.setInkViewport=()=>{};idle.ready=Promise.resolve(false);return idle;}
  let visual=null;const ink=inkMaterial(1.05,'#302b30');
  const ready=loadSource(profile.female).then(source=>{
    if(!root.parent&&!root.userData.villager)return;
    const model=cloneSkinned(source),bounds=new T.Box3().setFromObject(model),height=Math.max(.01,bounds.max.y-bounds.min.y),scale=3/height;
    model.scale.setScalar(scale);model.position.y=-bounds.min.y*scale;model.name=profile.female?'female-npc-vrm':'male-npc-vrm';
    const seed=Array.from(profile.id||'npc').reduce((n,ch)=>(n*31+ch.charCodeAt(0))>>>0,17),variant=seed%7,hueShift=(variant-3)*.012;
    const skinColor=new T.Color(profile.skin||'#bc9475').multiplyScalar(.84+(seed%7)*.055);
    const clothes=(hex,light)=>{const color=new T.Color(hex),hsl={};color.getHSL(hsl);color.setHSL((hsl.h+hueShift+1)%1,Math.max(.18,Math.min(.9,hsl.s*(.86+(seed%5)*.07))),Math.max(.12,Math.min(.78,hsl.l*light)));return color;};
    const clothColor=clothes(profile.coat||'#75664e',.65+(seed%6)*.14),accentColor=clothes(profile.accent||'#a89570',.82+(seed%4)*.1);
    const recolor=(material,color,low=.62,high=1.16)=>{
      const m=material.isMeshBasicMaterial?new T.MeshToonMaterial({name:material.name,color:'#ffffff',map:material.map,alphaMap:material.alphaMap,alphaTest:material.alphaTest,opacity:material.opacity,transparent:material.transparent,side:material.side,depthWrite:material.depthWrite,depthTest:material.depthTest,blending:material.blending,vertexColors:material.vertexColors,gradientMap:toonRamp}):material.clone();m.color.set('#ffffff');
      m.onBeforeCompile=shader=>{shader.uniforms.npcTint={value:color.clone()};shader.uniforms.npcShade={value:new T.Vector2(low,high)};shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 npcTint;uniform vec2 npcShade;').replace('#include <map_fragment>','#include <map_fragment>\nfloat npcLuma=dot(diffuseColor.rgb,vec3(0.299,0.587,0.114));diffuseColor.rgb=npcTint*mix(npcShade.x,npcShade.y,npcLuma);');};
      m.customProgramCacheKey=()=>'npc-lit-toon-appearance-v1';m.needsUpdate=true;return m;
    };
    const outlineMeshes=[];model.traverse(o=>{
      if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
      if(!/eye|facemouth|facebrow/i.test(Array.isArray(o.material)?o.material.map(m=>m.name).join(' '):o.material.name))outlineMeshes.push(o);
      const tint=material=>{
        const name=material.name.toLowerCase();
        if(name.includes('skin'))return recolor(material,skinColor,.7,1.12);
        if(name.includes('hair')||name.includes('facebrow'))return recolor(material,new T.Color(profile.age==='elder'?'#f3f0e5':'#171719'),profile.age==='elder'?.86:.5,profile.age==='elder'?1.02:.96);
        if(name.includes('tops_01_cloth_02'))return recolor(material,profile.female?accentColor:clothColor,.62,1.18);
        if(name.includes('tops_01_cloth_03'))return recolor(material,accentColor,.62,1.18);
        if(name.includes('cloth')||name.includes('tops'))return recolor(material,clothColor,.62,1.18);
        return material.clone();
      };
      o.material=Array.isArray(o.material)?o.material.map(tint):tint(o.material);
      if(o.morphTargetDictionary&&o.morphTargetInfluences){
        const faces=[
          ['Fcl_EYE_Fun','Fcl_BRW_Fun','Fcl_MTH_Up'],['Fcl_EYE_Sorrow','Fcl_BRW_Sorrow','Fcl_MTH_Small'],
          ['Fcl_EYE_Angry','Fcl_BRW_Angry','Fcl_MTH_Down'],['Fcl_EYE_Spread','Fcl_BRW_Surprised','Fcl_MTH_Small'],
          ['Fcl_EYE_Joy','Fcl_BRW_Joy','Fcl_MTH_Up'],['Fcl_EYE_Surprised','Fcl_BRW_Fun','Fcl_MTH_Neutral'],['Fcl_EYE_Sorrow','Fcl_BRW_Angry','Fcl_MTH_Small']
        ][variant];
        for(const [name,index] of Object.entries(o.morphTargetDictionary))if(faces.includes(name))o.morphTargetInfluences[index]=name.startsWith('Fcl_EYE')?.18:name.startsWith('Fcl_BRW')?.13:.1;
        if(profile.age==='elder'&&o.morphTargetDictionary.Fcl_EYE_Sorrow!==undefined)o.morphTargetInfluences[o.morphTargetDictionary.Fcl_EYE_Sorrow]=.16;
        if(profile.memorialOffering)for(const [name,value] of [['Fcl_EYE_Sorrow',.22],['Fcl_BRW_Sorrow',.2],['Fcl_MTH_Small',.1]])if(o.morphTargetDictionary[name]!==undefined)o.morphTargetInfluences[o.morphTargetDictionary[name]]=Math.max(o.morphTargetInfluences[o.morphTargetDictionary[name]],value);
      }
    });
    for(const o of outlineMeshes)addInkOutline(o,ink);
    const bones={};for(const [key,name] of Object.entries(boneNames))bones[key]=model.getObjectByName(name)||null;
    const rest={};for(const [key,bone] of Object.entries(bones))if(bone)rest[key]=bone.quaternion.clone();
    const fingers=[];model.traverse(o=>{const match=o.name.match(/^J_Bip_([LR])_(Index|Middle|Ring|Little|Thumb)([123])$/);if(match)fingers.push({bone:o,base:o.quaternion.clone(),side:match[1]==='L'?1:-1,thumb:match[2]==='Thumb',joint:Number(match[3])-1});});
    const visualRoot=new T.Group();visualRoot.name='male-npc-visual';visualRoot.add(model);root.add(visualRoot);root.updateMatrixWorld(true);
    const held=[],props=[];
    root.traverse(o=>{if(o.userData.residentTool||['open-resident-book','cloth-being-mended'].includes(o.name))props.push(o);});
    for(const prop of props){
      const betweenHands=!prop.userData.residentTool,hand=prop.userData.residentHand===0?bones.rightHand:bones.leftHand;
      const carrier=new T.Group();carrier.name=prop.name+'-grip';(betweenHands?root:hand||root).add(carrier);
      carrier.scale.setScalar(betweenHands?1:1/scale);carrier.add(prop);
      if(!betweenHands&&hand){carrier.position.x=(hand===bones.leftHand?1:-1)*.05;hand.userData.residentGrip=true;}
      prop.position.fromArray(prop.userData.grip||[0,0,0]).negate();prop.rotation.set(0,0,0);
      held.push({carrier,hand,betweenHands});
    }
    visual={visualRoot,model,bones,rest,held,fingers,scale,restHipsY:bones.hips?.position.y??0};
    const procedural=root.getObjectByName('body');if(procedural)procedural.visible=false;
    root.userData.characterModel={asset:profile.female?'npc_nu-simple.vrm':'npc_nam-simple.vrm',ready:true};return true;
  }).catch(error=>{console.warn(`Could not load ${profile.female?'female':'male'} NPC VRM:`,error);return false;});

  const update=(time,moving,{body,head,arms,forearms,legs})=>{
    if(!visual)return;
    const {visualRoot,bones,rest,restHipsY,held,fingers,scale}=visual,pose=residentActivityPose(profile,time,moving);
    visualRoot.position.copy(body.position);if(pose?.kneeling)visualRoot.position.y=0;
    visualRoot.rotation.set(0,0,body.rotation.z*.4);
    const apply=(key,rotation)=>{
      const bone=bones[key];if(!bone||!rest[key])return;
      bone.quaternion.copy(rest[key]).premultiply(new T.Quaternion().setFromEuler(rotation));
    };
    apply('head',head.rotation);
    if(bones.hips)bones.hips.position.y=restHipsY-(pose?.hipsDrop||0)/scale;
    apply('spine',new T.Euler(pose?.spine??body.rotation.x,0,0));apply('chest',new T.Euler(pose?.chest||0,0,0));
    const channels=[{upper:'rightArm',lower:'rightForearm',hand:'rightHand',leg:'rightLeg',knee:'rightKnee',foot:'rightFoot',side:-1},{upper:'leftArm',lower:'leftForearm',hand:'leftHand',leg:'leftLeg',knee:'leftKnee',foot:'leftFoot',side:1}];
    channels.forEach((channel,i)=>{
      const upper=bones[channel.upper],lower=bones[channel.lower],side=channel.side;
      if(bones[channel.hand])bones[channel.hand].quaternion.copy(rest[channel.hand]);
      if(upper)upper.quaternion.copy(rest[channel.upper]).premultiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),-side*1.55)).premultiply(new T.Quaternion().setFromEuler(new T.Euler(arms[i].rotation.x,0,arms[i].rotation.z*.5+side*REST_ARM_OPEN)));
      if(lower)lower.quaternion.copy(rest[channel.lower]).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-side*Math.max(.10,-forearms[i].rotation.x)));
      const knee=pose?.kneeling?2.1:pose?.knee||.08,hip=pose?.kneeling?-.5:legs[i].rotation.x-knee*.5;
      apply(channel.leg,new T.Euler(hip,0,0));apply(channel.knee,new T.Euler(knee,0,0));apply(channel.foot,new T.Euler(-hip-knee,0,0));
      if(pose?.hands)reachResidentHand(root,upper,lower,bones[channel.hand],pose.hands[i],side);
    });
    root.updateWorldMatrix(true,true);
    for(const {carrier,hand,betweenHands} of held){
      if(betweenHands&&bones.leftHand&&bones.rightHand){
        const center=bones.leftHand.getWorldPosition(new T.Vector3()).add(bones.rightHand.getWorldPosition(new T.Vector3())).multiplyScalar(.5);
        carrier.position.copy(root.worldToLocal(center));carrier.position.y-=.025;carrier.rotation.set(.15,0,0);
      }else if(hand){
        const orientation=root.getWorldQuaternion(new T.Quaternion()).multiply(new T.Quaternion().setFromEuler(new T.Euler(pose?.toolPitch||0,0,0)));
        const wrist=orientation.clone().multiply(new T.Quaternion().setFromEuler(new T.Euler(Math.PI/2,0,hand===bones.leftHand?0:Math.PI)));
        hand.quaternion.copy(hand.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(wrist));hand.updateWorldMatrix(false,true);
        carrier.quaternion.copy(hand.getWorldQuaternion(new T.Quaternion()).invert().multiply(orientation));
      }
    }
    for(const {bone,base,side,thumb,joint} of fingers){
      const holding=(side===1?bones.leftHand:bones.rightHand)?.userData.residentGrip;
      const curl=holding?(profile.memorialOffering?[.45,.8,.6]:[.75,1.05,.85]):[.08,.15,.1];
      bone.quaternion.copy(base).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),-side*curl[joint]*(thumb?.5:1)));
    }
    root.userData.residentRigPose={kind:pose?.type||'relaxed-standing',hipsDrop:pose?.hipsDrop||0,reach:pose?.reach||0};
  };
  update.setInkViewport=(width,height)=>ink.uniforms.viewport.value.set(width,height);
  update.ready=ready;
  return update;
}
