import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkinned} from 'three/addons/utils/SkeletonUtils.js';

let sourcePromise;
function loadSource(){
  return sourcePromise??=new GLTFLoader().loadAsync(new URL('assets/npc.vrm',document.baseURI).href).then(gltf=>gltf.scene);
}

const boneNames={
  hips:'J_Bip_C_Hips',spine:'J_Bip_C_Spine',chest:'J_Bip_C_Chest',head:'J_Bip_C_Head',
  leftArm:'J_Bip_L_UpperArm',leftForearm:'J_Bip_L_LowerArm',rightArm:'J_Bip_R_UpperArm',rightForearm:'J_Bip_R_LowerArm',
  leftLeg:'J_Bip_L_UpperLeg',rightLeg:'J_Bip_R_UpperLeg',leftHand:'J_Bip_L_Hand',rightHand:'J_Bip_R_Hand'
};

export function attachMaleNpcModel(root,profile){
  let visual=null;
  loadSource().then(source=>{
    if(!root.parent&&!root.userData.villager)return;
    const model=cloneSkinned(source),bounds=new T.Box3().setFromObject(model),height=Math.max(.01,bounds.max.y-bounds.min.y),scale=3/height;
    model.scale.setScalar(scale);model.position.y=-bounds.min.y*scale;model.name='male-npc-vrm';
    const seed=Array.from(profile.id||'npc').reduce((n,ch)=>(n*31+ch.charCodeAt(0))>>>0,17),variant=seed%7,hueShift=(variant-3)*.012;
    const skinColor=new T.Color(profile.skin||'#bc9475').multiplyScalar(.84+(seed%7)*.055);
    const clothes=(hex,light)=>{const color=new T.Color(hex),hsl={};color.getHSL(hsl);color.setHSL((hsl.h+hueShift+1)%1,Math.max(.18,Math.min(.9,hsl.s*(.86+(seed%5)*.07))),Math.max(.12,Math.min(.78,hsl.l*light)));return color;};
    const clothColor=clothes(profile.coat||'#75664e',.65+(seed%6)*.14),accentColor=clothes(profile.accent||'#a89570',.82+(seed%4)*.1);
    const recolor=(material,color,low=.62,high=1.16)=>{
      const m=material.clone();m.color.set('#ffffff');
      m.onBeforeCompile=shader=>{shader.uniforms.npcTint={value:color.clone()};shader.uniforms.npcShade={value:new T.Vector2(low,high)};shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 npcTint;uniform vec2 npcShade;').replace('#include <map_fragment>','#include <map_fragment>\nfloat npcLuma=dot(diffuseColor.rgb,vec3(0.299,0.587,0.114));diffuseColor.rgb=npcTint*mix(npcShade.x,npcShade.y,npcLuma);');};
      m.customProgramCacheKey=()=>'npc-appearance-tint-v1';m.needsUpdate=true;return m;
    };
    model.traverse(o=>{
      if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
      const tint=material=>{
        const name=material.name.toLowerCase();
        if(name.includes('skin'))return recolor(material,skinColor,.7,1.12);
        if(name.includes('hair')||name.includes('facebrow'))return recolor(material,new T.Color(profile.age==='elder'?'#f3f0e5':'#171719'),profile.age==='elder'?.86:.5,profile.age==='elder'?1.02:.96);
        if(name.includes('tops_01_cloth_02'))return recolor(material,clothColor,.62,1.18);
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
        for(const [index,name] of Object.entries(o.morphTargetDictionary))if(faces.includes(name))o.morphTargetInfluences[index]=name.startsWith('Fcl_EYE')?.18:name.startsWith('Fcl_BRW')?.13:.1;
        if(profile.age==='elder'&&o.morphTargetDictionary.Fcl_EYE_Sorrow!==undefined)o.morphTargetInfluences[o.morphTargetDictionary.Fcl_EYE_Sorrow]=.16;
      }
    });
    const bones={};for(const [key,name] of Object.entries(boneNames))bones[key]=model.getObjectByName(name)||null;
    const rest={};for(const [key,bone] of Object.entries(bones))if(bone)rest[key]=bone.quaternion.clone();
    const visualRoot=new T.Group();visualRoot.name='male-npc-visual';visualRoot.add(model);root.add(visualRoot);root.updateMatrixWorld(true);
    const heldTool=['forging-hammer','working-pick','repair-hammer','fishing-rod'].map(name=>root.getObjectByName(name)).find(Boolean);
    if(heldTool){
      const oldParent=heldTool.parent,handCandidates=[bones.leftHand,bones.rightHand].filter(Boolean);
      oldParent?.updateWorldMatrix(true,false);
      const oldPosition=oldParent?oldParent.getWorldPosition(new T.Vector3()):heldTool.getWorldPosition(new T.Vector3());
      const oldRotation=oldParent?oldParent.getWorldQuaternion(new T.Quaternion()):new T.Quaternion();
      const hand=handCandidates.sort((a,b)=>a.getWorldPosition(new T.Vector3()).distanceToSquared(oldPosition)-b.getWorldPosition(new T.Vector3()).distanceToSquared(oldPosition))[0];
      if(hand){
        const localPosition=heldTool.position.clone(),localRotation=heldTool.quaternion.clone(),localScale=heldTool.scale.clone(),handRotation=hand.getWorldQuaternion(new T.Quaternion());
        hand.add(heldTool);
        heldTool.position.copy(localPosition).multiplyScalar(1/scale);
        heldTool.quaternion.copy(handRotation.invert().multiply(oldRotation).multiply(localRotation));
        heldTool.scale.copy(localScale).multiplyScalar(1/scale);
      }
    }
    visual={visualRoot,model,bones,rest,armCorrection:{left:new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),-1.2),right:new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),1.2)}};
    const procedural=root.getObjectByName('body');if(procedural)procedural.visible=false;
  }).catch(error=>console.warn('Could not load male NPC VRM:',error));

  return (time,moving,{body,head,arms,forearms,legs})=>{
    if(!visual)return;
    const {visualRoot,bones,rest,armCorrection}=visual;
    visualRoot.position.copy(body.position);visualRoot.rotation.copy(body.rotation);
    const apply=(key,rotation,correction=null)=>{
      const bone=bones[key];if(!bone||!rest[key])return;
      bone.quaternion.copy(rest[key]);if(correction)bone.quaternion.multiply(correction);
      bone.quaternion.multiply(new T.Quaternion().setFromEuler(rotation));
    };
    apply('head',head.rotation);
    const armPose=rotation=>new T.Euler(-rotation.x,rotation.y,rotation.z,'XYZ');
    apply('leftArm',armPose(arms[0].rotation),armCorrection.left);apply('rightArm',armPose(arms[1].rotation),armCorrection.right);
    apply('leftForearm',forearms[0].rotation);apply('rightForearm',forearms[1].rotation);
    apply('leftLeg',legs[0].rotation);apply('rightLeg',legs[1].rotation);
  };
}
