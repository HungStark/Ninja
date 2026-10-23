import * as T from 'three';
import { toon } from './materials.js';
import { createHands } from './hands.js';
import {encounterAppearance,createEncounterCreature} from './encounter-appearance.js';
import {createHero} from './hero.js';
import {createNinja} from './ninja.js';

// Human opponents share the adult village ninja; guardians keep their creature models.
export async function createOpponent(scene,spawnPosition,playerModel=false){
  const group=new T.Group();group.position.copy(spawnPosition);scene.add(group);
  const rig=await createHands();rig.scene.remove(rig.root);group.add(rig.root);rig.root.position.set(0,2,.02);rig.root.rotation.y=Math.PI;rig.root.scale.setScalar(.9);
  // Hand materials are globally cached. Clone enemy clothing/skin before recoloring.
  const rigMaterials=new Map();rig.root.traverse(o=>{if(!o.isMesh||!['skin','nail','cloth','glove','trim'].includes(o.material?.name))return;const source=o.material;if(!rigMaterials.has(source))rigMaterials.set(source,source.clone());o.material=rigMaterials.get(source);});
  const cloth=new T.MeshStandardMaterial({color:'#33495f',roughness:.9,flatShading:true}),dark=new T.MeshStandardMaterial({color:'#22272c',roughness:.9,flatShading:true});
  const sleeves=[-1,1].map(side=>{const upper=new T.Mesh(new T.CylinderGeometry(.15,.17,1,8),cloth),lower=new T.Mesh(new T.CylinderGeometry(.10,.12,1,8),dark);upper.castShadow=lower.castShadow=true;group.add(upper,lower);return {side,upper,lower};});
  let ninja=null,creature=null,appearance=null,guardianAura=null;
  function setAppearance(encounter=null){
    const next=encounterAppearance(encounter);
    if(!appearance||next.id!==appearance.id||next.kind!==appearance.kind){
      if(guardianAura){group.remove(guardianAura.root);guardianAura.dispose();guardianAura=null;}
      if(ninja){group.remove(ninja.root);ninja.dispose();ninja=null;}
      if(creature){group.remove(creature.root);creature.dispose();creature=null;}
      if(next.kind==='creature'){creature=createEncounterCreature(next.id);group.add(creature.root);}
      else{
        ninja=createNinja(next);group.add(ninja.root);for(const a of ninja.arms)a.pivot.visible=false;
        for(const anchor of [...ninja.shoulderGuards,...ninja.bracers])ninja.root.add(anchor);
        cloth.color.set(ninja.profile.coat);
        for(const m of rigMaterials.values())m.color.set(m.name==='skin'?ninja.profile.skin:m.name==='cloth'?ninja.profile.coat:m.name==='trim'?ninja.profile.accent:m.name==='nail'?'#d1a18d':'#22272c');
      }
      if(encounter?.guardianForm==='avatar'){
        guardianAura=createEncounterCreature(encounter.village);guardianAura.root.name='guardian-transparent-aura';guardianAura.root.position.set(0,.35,-.8);guardianAura.root.scale.multiplyScalar(1.3);
        guardianAura.root.userData.opacity=.22;
        guardianAura.root.traverse(o=>{if(o.isMesh){o.material.transparent=true;o.material.opacity=.22;o.material.depthWrite=false;o.material.color?.set('#b58aef');if(o.material.emissive)o.material.emissive.set('#9265df');o.renderOrder=3;}});group.add(guardianAura.root);
      }
    }
    appearance=next;group.userData.appearance={...next,model:ninja?.root.name||creature?.root.name||'guardian',ninja:ninja?{...ninja.root.userData.ninja}:null};group.userData.height=creature?.height||ninja?.height||3.01;
    rig.root.visible=!creature;for(const s of sleeves)s.upper.visible=s.lower.visible=!creature;
  }
  const aura=new T.Mesh(new T.TorusGeometry(.47,.024,8,64),new T.MeshBasicMaterial({color:'#ffc783',transparent:true,opacity:.7,blending:T.AdditiveBlending,depthWrite:false}));aura.position.set(0,1.85,.8);group.add(aura);
  const shield=new T.Mesh(new T.SphereGeometry(1,20,14),new T.MeshBasicMaterial({color:'#a6edff',transparent:true,opacity:.17,wireframe:true,depthWrite:false}));shield.position.set(0,1.55,0);shield.scale.set(1.03,1.55,.85);group.add(shield);
  const up=new T.Vector3(0,1,0),down=new T.Vector3(0,-1,0);
  function segment(m,a,b){const d=b.clone().sub(a);m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=d.length();m.quaternion.setFromUnitVectors(up,d.normalize());}
  function update(dt,time,pose,ready,fighter,hit=0,casting=false,moving=false,reducedMotion=false,lateralVelocity=0){
    rig.update(dt,time,pose,ready,moving,casting?.8:0,reducedMotion);
    ninja?.update(reducedMotion?0:time,moving&&!reducedMotion,lateralVelocity?{x:lateralVelocity,z:0}:null,dt);
    creature?.update(time,moving,reducedMotion,lateralVelocity);
    guardianAura?.update(time,false,reducedMotion,0);
    group.rotation.z=fighter.hp<=0?T.MathUtils.damp(group.rotation.z,-1.4,4,dt):Math.sin(hit*45)*hit*.15;group.updateMatrixWorld(true);
    if(ninja)for(let i=0;i<sleeves.length;i++){
      const s=sleeves[i],index=1-i,wrist=group.worldToLocal(rig.hands[i].wrapper.getWorldPosition(new T.Vector3())),shoulder=group.worldToLocal(ninja.arms[index].pivot.getWorldPosition(new T.Vector3())),elbow=shoulder.clone().add(new T.Vector3(-s.side*.08,-.4,.32));segment(s.upper,shoulder,elbow);segment(s.lower,elbow,wrist);
      const shoulderArmor=ninja.shoulderGuards[index],bracer=ninja.bracers[index];shoulderArmor.position.copy(ninja.root.worldToLocal(group.localToWorld(shoulder.clone())));shoulderArmor.quaternion.setFromUnitVectors(down,elbow.clone().sub(shoulder).normalize());bracer.position.copy(ninja.root.worldToLocal(group.localToWorld(elbow.clone())));bracer.quaternion.setFromUnitVectors(down,wrist.clone().sub(elbow).normalize());
    }
    aura.visible=pose>=0&&fighter.hp>0;aura.rotation.z=time*2;
    shield.visible=!['fire','water','lightning','dark'].includes(fighter.defenseElement)&&fighter.shieldTime>0&&(fighter.shield>0||fighter.reflect>0);shield.material.color.set(fighter.color);shield.rotation.y=time*.4;
  }
  setAppearance();
  return {group,rig,update,shield,aura,get guardianAura(){return guardianAura?.root;},get legs(){return ninja?.legs||[];},setInkViewport:(w,h)=>rig.setInkViewport(w,h),setAppearance};
}

// The exploration hero with the articulated hand-seal rig used by combat.
export async function createPlayerAvatar(scene) {
  const hero=createHero(),group=hero.root;scene.add(group);group.userData.height=3.2;
  for(const arm of hero.arms)arm.pivot.visible=false;
  const rig=await createHands();rig.scene.remove(rig.root);group.add(rig.root);rig.root.position.set(0,2,.02);rig.root.rotation.y=Math.PI;rig.root.scale.setScalar(.9);
  const upperMat=hero.cloth,lowerMat=toon('#14151c'),up=new T.Vector3(0,1,0);
  const previousPosition=group.position.clone();
  const sleeves=[-1,1].map(side=>{const upper=new T.Mesh(new T.CylinderGeometry(.14,.16,1,10),upperMat),lower=new T.Mesh(new T.CylinderGeometry(.1,.13,1,10),lowerMat);group.add(upper,lower);return {side,upper,lower};});
  // Keep armor attached to the articulated combat sleeves when the walking arms are hidden.
  for(const anchor of [...hero.armorAnchors.shoulders,...hero.armorAnchors.bracers])group.add(anchor);
  const segment=(mesh,a,b)=>{const d=b.clone().sub(a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=d.length();mesh.quaternion.setFromUnitVectors(up,d.normalize());};
  function update(dt,time,pose,ready,fighter,hit=0,casting=false,moving=false,reducedMotion=false){
    const velocity={x:dt>0?(group.position.x-previousPosition.x)/dt:0,z:dt>0?(group.position.z-previousPosition.z)/dt:0};previousPosition.copy(group.position);
    hero.update(reducedMotion?0:time,moving&&!reducedMotion,velocity,dt);rig.update(dt,time,pose,ready,moving,casting?.8:0,reducedMotion);group.updateMatrixWorld(true);
    for(let i=0;i<sleeves.length;i++){const s=sleeves[i],wrist=group.worldToLocal(rig.hands[i].wrapper.getWorldPosition(new T.Vector3())),shoulder=new T.Vector3(-s.side*.38,1.97,0),elbow=new T.Vector3(-s.side*.49,1.6,.3);segment(s.upper,shoulder,elbow);segment(s.lower,elbow,wrist);
      const shoulderArmor=hero.armorAnchors.shoulders[1-i],bracerArmor=hero.armorAnchors.bracers[1-i],down=new T.Vector3(0,-1,0);
      shoulderArmor.position.copy(shoulder);shoulderArmor.quaternion.setFromUnitVectors(down,elbow.clone().sub(shoulder).normalize());bracerArmor.position.copy(elbow);bracerArmor.quaternion.setFromUnitVectors(down,wrist.clone().sub(elbow).normalize());
    }
  }
  return {group,rig,legs:hero.legs,update,setEquipment:state=>{hero.setEquipment(state);rig.setArmguard(state?.armguard);},setInkViewport:(w,h)=>rig.setInkViewport(w,h)};
}
