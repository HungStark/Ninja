import {prepareCharacterSource} from './character-assets.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {characterInkMaterial,addInkOutline} from './ink-outline.js';
import {createCharacterMotion,REST_ARM_OPEN} from './character-motion.js';
import {reachResidentHand} from './resident-rig-pose.js';

const ramp=new T.DataTexture(new Uint8Array([80,80,80,255,154,154,154,255,222,222,222,255,255,255,255,255]),4,1,T.RGBAFormat);
ramp.minFilter=ramp.magFilter=T.NearestFilter;ramp.generateMipmaps=false;ramp.needsUpdate=true;
const rotation=(x=0,y=0,z=0)=>new T.Quaternion().setFromEuler(new T.Euler(x,y,z));
let sourcePromise;

export function attachHaLy(root,profile,fallback){
  const ink=characterInkMaterial(.65,'#30272b'),motion=createCharacterMotion();
  let visual=null,bones=null,rest=null,hipsY=0,scale=1,alive=true,storyPose='standing',lastTime=0,lastState=null,bonds=null;
  const apply=(bone,q)=>{if(bone)bone.quaternion.copy(rest.get(bone)).premultiply(q);};
  function arm(i,pitch,spread,flex){const side=i===0?1:-1,upper=bones.arms[i],lower=bones.elbows[i];upper.quaternion.copy(rest.get(upper)).premultiply(rotation(0,0,-side*1.55)).premultiply(rotation(pitch,0,spread));lower.quaternion.copy(rest.get(lower)).multiply(rotation(0,-side*flex,0));}
  function pose(state,time){
    if(!bones)return;
    const wounded=storyPose!=='standing',breath=Math.sin(time*1.8)*.008;
    visual.traverse(o=>{if(o.isBone&&rest.has(o))o.quaternion.copy(rest.get(o));});
    bones.hips.position.y=hipsY-(wounded?.68:state.gait.drop*bones.legLength*scale)/scale;
    apply(bones.hips,rotation(wounded?.10:state.sprintLean));
    apply(bones.spine,rotation(wounded?.16+breath:0));apply(bones.chest,rotation(wounded?.10+breath:breath));
    apply(bones.head,rotation(wounded?.24+breath:Math.sin(time*.9)*.012,wounded?-.12:Math.sin(time*.5)*.025,wounded?-.09:0));
    for(let i=0;i<2;i++){
      const step=state.gait.legs[i],a=state.arms[i],side=i===0?1:-1;
      apply(bones.legs[i],rotation(wounded?-1.70:step.hip-state.sprintLean,0,wounded?side*.07:step.side));
      apply(bones.knees[i],rotation(wounded?1.48:step.knee));apply(bones.feet[i],rotation(wounded?-.08:step.ankle));
      arm(i,wounded?-.2:a.pitch,wounded?side*.1+side*REST_ARM_OPEN:a.spread+side*REST_ARM_OPEN,wounded?1.2:a.flex);
    }
    for(const bone of bones.skirt){
      const front=/Front/.test(bone.name),side=/Side/.test(bone.name),i=bone.name.includes('_L_')?0:1;
      apply(bone,rotation(wounded?(front?-1.18:side?-.55:0):front?Math.min(0,state.gait.legs[i].hip)*.6:0));
    }
    if(wounded){
      root.updateMatrixWorld(true);
      for(let i=0;i<2;i++)reachResidentHand(root,bones.arms[i],bones.elbows[i],bones.hands[i],[(i===0?1:-1)*.115,1.30+breath,.44],i===0?1:-1,[(i===0?1:-1)*.85,1.25,.12]);
      for(const f of bones.fingers)f.quaternion.copy(rest.get(f)).multiply(rotation(0,(f.name.includes('_L_')?-1:1)*.45,0));
    }
    bonds.visible=storyPose==='captive';
    visual.traverse(o=>{const d=o.morphTargetDictionary,v=o.morphTargetInfluences;if(!d||!v)return;const blink=time%4.8;for(const [name,value]of [['Fcl_EYE_Close',blink<.16?Math.sin(blink/.16*Math.PI):wounded?.12:0],['Fcl_BRW_Sorrow',wounded?.45:0],['Fcl_MTH_Small',wounded?.12:0]])if(d[name]!==undefined)v[d[name]]=value;});
  }
  function update(time,moving,velocity=null,dt=1/60){lastTime=time;lastState=motion.update(time,moving,velocity,dt,moving&&Math.hypot(velocity?.x||0,velocity?.z||0)>5.1,root.rotation.y);pose(lastState,time);}
  const ready=typeof document==='undefined'?Promise.resolve(false):(sourcePromise??=new GLTFLoader().loadAsync(new URL('assets/ha-ly-simple.glb',document.baseURI).href).then(g=>prepareCharacterSource(g.scene))).then(source=>{
    if(!alive)return false;
    visual=clone(source);visual.name='ha-ly-rigged-appearance';
    const bounds=new T.Box3().setFromObject(visual);scale=3/(bounds.max.y-bounds.min.y);visual.scale.setScalar(scale);visual.position.y=-bounds.min.y*scale;
    const outlines=[];visual.traverse(o=>{if(!o.isMesh)return;o.geometry=o.geometry.clone();o.castShadow=o.receiveShadow=true;
      const material=m=>{const n=m.name.toLowerCase(),cloth=/cloth|tops|shoes/.test(n);const result=new T.MeshToonMaterial({name:m.name,color:m.color,map:m.map,alphaMap:m.alphaMap,alphaTest:m.alphaTest,transparent:m.transparent,opacity:m.opacity,side:m.side,depthWrite:m.depthWrite,gradientMap:ramp,flatShading:cloth});
        if(n.includes('skin'))result.color.multiply(new T.Color('#d4b294'));
        if(cloth){result.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat l=dot(diffuseColor.rgb,vec3(.299,.587,.114));diffuseColor.rgb=mix(vec3(l),diffuseColor.rgb,.67)*.82;');};result.customProgramCacheKey=()=>'ha-ly-muted-cloth-v1';}return result;};
      o.material=Array.isArray(o.material)?o.material.map(material):material(o.material);if(!/eye|mouth|brow|lash|highlight/i.test(Array.isArray(o.material)?o.material.map(m=>m.name).join(' '):o.material.name))outlines.push(o);
    });
    for(const o of outlines)addInkOutline(o,ink);
    bones={};for(const [key,name]of Object.entries({hips:'Hips',spine:'Spine',chest:'Chest',head:'Head'}))bones[key]=visual.getObjectByName('J_Bip_C_'+name);
    for(const [key,part]of Object.entries({arms:'UpperArm',elbows:'LowerArm',hands:'Hand',legs:'UpperLeg',knees:'LowerLeg',feet:'Foot'}))bones[key]=['L','R'].map(s=>visual.getObjectByName('J_Bip_'+s+'_'+part));
    bones.legLength=bones.knees[0].position.length()+bones.feet[0].position.length();bones.fingers=[];bones.skirt=[];rest=new Map();visual.traverse(o=>{if(o.isBone){rest.set(o,o.quaternion.clone());if(/_(Index|Middle|Ring|Little)[123]$/.test(o.name))bones.fingers.push(o);if(/Skirt(Front|Side|Back)0_|CoatSkirt(Front|Back)_|CoatSkirtSide1_/.test(o.name))bones.skirt.push(o);}});hipsY=bones.hips.position.y;
    root.add(visual);fallback.visible=false;
    const bandage=new T.Mesh(new T.CylinderGeometry(.062,.064,.07,8),new T.MeshToonMaterial({color:'#c9bda2',gradientMap:ramp}));bandage.name='ha-ly-arm-bandage';bandage.rotation.z=-Math.PI/2;bandage.position.x=.09;bones.arms[0].add(bandage);
    bonds=new T.Group();bonds.name='ha-ly-wrist-bonds';root.add(bonds);
    const rope=new T.MeshToonMaterial({color:'#86724d',gradientMap:ramp});
    for(const side of [-1,1]){const loop=new T.Mesh(new T.TorusGeometry(.082,.019,5,10),rope);loop.position.set(side*.115,1.30,.44);bonds.add(loop);}
    const tie=new T.Mesh(new T.CylinderGeometry(.022,.022,.23,5),rope);tie.rotation.z=Math.PI/2;tie.position.set(0,1.30,.44);bonds.add(tie);
    root.userData.ninja={...root.userData.ninja,asset:'ha-ly-simple.glb',modelReady:true,triangles:16095};
    update(lastTime,false,null,0);return true;
  }).catch(error=>{console.warn('Could not load Hạ Ly GLB:',error);return false;});
  return {ready,update,setStoryPose(value){storyPose=value;root.userData.storyPose=value;if(lastState)pose(lastState,lastTime);},combatPose(){},setCombatMode(){},syncCombatHands:()=>false,setInkViewport(w,h){ink.uniforms.viewport.value.set(w,h);},get loaded(){return !!visual;},get model(){return visual;},get bones(){return bones;},state:()=>lastState,dispose(){alive=false;for(const g of [visual,bonds]){if(!g)continue;g.removeFromParent();const gs=new Set(),ms=new Set();g.traverse(o=>{if(o.geometry)gs.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])ms.add(m);});gs.forEach(x=>x.dispose());ms.forEach(x=>x.dispose());}visual=null;ink.dispose();}};
}
