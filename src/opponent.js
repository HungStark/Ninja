import * as T from 'three';
import { toon } from './materials.js';
import { createHands } from './hands.js';
import { inkMaterial, addInkOutline } from './ink-outline.js';
import {encounterAppearance,createEncounterCreature} from './encounter-appearance.js';
import {createHero} from './hero.js';

// The opponent uses the same articulated hands and twelve poses as the player.
export async function createOpponent(scene, spawnPosition, playerModel = false) {
  const group = new T.Group();
  group.userData.height = 3.01;
  group.position.copy(spawnPosition);
  scene.add(group);
  const cloth = toon(playerModel ? '#29324a' : '#33495f'), dark = toon(playerModel ? '#191f32' : '#182b3d'), skin = toon('#e7bb97'), metal = toon(playerModel ? '#d1ae6b' : '#b6c9ca'), belt = toon(playerModel ? '#c6a76b' : '#b67863');
  const hair=toon(playerModel?'#191f32':'#182b3d');
  const ink=inkMaterial(.8,'#27323c');
  function mesh(geo, mat, pos, scale = [1, 1, 1]) {
    const m = new T.Mesh(geo, mat); m.position.set(...pos); m.scale.set(...scale); m.castShadow = true; m.receiveShadow = true; group.add(m); addInkOutline(m,ink); return m;
  }
  const sphere = new T.SphereGeometry(1, 18, 14), box = new T.BoxGeometry(1, 1, 1);
  mesh(sphere, cloth, [0, 1.72, 0], [.48, .66, .27]);
  mesh(box, dark, [0, 1.12, 0], [.65, .22, .36]);
  mesh(box, belt, [0, 1.32, .02], [.81, .12, .48]);
  mesh(sphere, skin, [0, 2.58, 0], [.29, .34, .27]);
  mesh(sphere, dark, [0, 2.38, .14], [.3, .16, .18]);
  mesh(sphere, hair, [0, 2.78, -.02], [.31, .23, .28]);
  mesh(box, metal, [0, 2.7, .263], [.48, .105, .03]);
  mesh(box, belt, [0, 2.7, .286], [.08, .064, .009]);
  const legs = [];
  for (const side of [-1, 1]) {
    mesh(box, dark, [side * .125, 2.58, .27], [.1, .026, .02]);
    const pivot = new T.Group(); pivot.position.set(side * .23, 1.1, 0); group.add(pivot);
    for (const part of [mesh(sphere, cloth, [side * .23, .68, 0], [.2, .57, .22]), mesh(box, metal, [side * .23, .36, .12], [.28, .25, .12]), mesh(sphere, dark, [side * .23, .13, .1], [.22, .13, .35])]) {
      part.position.sub(pivot.position); pivot.add(part);
    }
    legs.push({ side, pivot });
  }
  const rig = await createHands();
  rig.scene.remove(rig.root); group.add(rig.root);
  rig.root.position.set(0, 2, .02); rig.root.rotation.y = Math.PI; rig.root.scale.setScalar(.9);
  // Sleeve segments follow the animated wrists rather than floating next to the body.
  const arms = [-1, 1].map(side => ({ side, upper: mesh(new T.CylinderGeometry(.14, .16, 1, 12), cloth, [0, 0, 0]), lower: mesh(new T.CylinderGeometry(.105, .13, 1, 12), dark, [0, 0, 0]) }));
  const humanParts=[...group.children];
  let creature=null,appearance=encounterAppearance(null);
  function setAppearance(encounter=null){
    const next=encounterAppearance(encounter);
    if(next.id!==appearance.id||next.kind!==appearance.kind){
      if(creature){group.remove(creature.root);creature.dispose();creature=null;}
      if(next.kind==='creature'){creature=createEncounterCreature(next.id);group.add(creature.root);}
    }
    appearance=next;group.userData.appearance={...next};group.userData.height=creature?.height||3.01;
    for(const part of humanParts)part.visible=!creature;
    if(!playerModel){cloth.color.set(next.coat||'#33495f');hair.color.set(next.hair||'#182b3d');}
  }
  const aura = new T.Mesh(new T.TorusGeometry(.47, .024, 8, 64), new T.MeshBasicMaterial({ color: '#ffc783', transparent: true, opacity: .7, blending: T.AdditiveBlending, depthWrite: false }));
  aura.position.set(0, 1.85, .8); group.add(aura);
  const shield = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshBasicMaterial({ color: '#a6edff', transparent: true, opacity: .17, wireframe: true, depthWrite: false }));
  shield.position.set(0, 1.55, 0); shield.scale.set(1.03, 1.55, .85); group.add(shield);
  const up = new T.Vector3(0, 1, 0);
  function segment(m, a, b) { const delta = b.clone().sub(a); m.position.copy(a).add(b).multiplyScalar(.5); m.scale.y = delta.length(); m.quaternion.setFromUnitVectors(up, delta.normalize()); }
  function update(dt, time, pose, ready, fighter, hit = 0, casting = false, moving = false, reducedMotion = false, lateralVelocity = 0) {
    rig.update(dt, time, pose, ready, moving, casting ? .8 : 0, reducedMotion);
    for(const leg of legs){
      const step=moving&&!reducedMotion?Math.sin(time*(lateralVelocity?11:16)+leg.side*Math.PI/2):0;
      leg.pivot.rotation.x=lateralVelocity?Math.max(0,step)*-.12:step*.38;
      leg.pivot.rotation.z=lateralVelocity?step*Math.sign(lateralVelocity)*.27:0;
    }
    creature?.update(time,moving,reducedMotion,lateralVelocity);
    group.rotation.z = fighter.hp <= 0 ? T.MathUtils.damp(group.rotation.z, -1.4, 4, dt) : Math.sin(hit * 45) * hit * .15;
    group.updateMatrixWorld(true);
    for (let i = 0; i < arms.length; i++) {
      const a = arms[i], wrist = group.worldToLocal(rig.hands[i].wrapper.getWorldPosition(new T.Vector3()));
      const shoulder = new T.Vector3(-a.side * .45, 2.1, 0), elbow = new T.Vector3(-a.side * .52, 1.65, .36);
      segment(a.upper, shoulder, elbow); segment(a.lower, elbow, wrist);
    }
    aura.visible = pose >= 0 && fighter.hp > 0; aura.rotation.z = time * 2;
    shield.visible = !['fire', 'water', 'lightning', 'dark'].includes(fighter.defenseElement) && fighter.shieldTime > 0 && (fighter.shield > 0 || fighter.reflect > 0); shield.material.color.set(fighter.color); shield.rotation.y = time * .4;
  }
  const setInkViewport=(width,height)=>{ink.uniforms.viewport.value.set(width,height);rig.setInkViewport(width,height);};
  return { group, rig, update, shield, aura, legs, setInkViewport, setAppearance };
}

// Full-volume body with the same hand skeleton/poses and navy/gold FPS clothing.
export async function createPlayerAvatar(scene) {
  const hero=createHero(),group=hero.root;scene.add(group);group.userData.height=3.2;
  for(const arm of hero.arms)arm.pivot.visible=false;
  const rig=await createHands();rig.scene.remove(rig.root);group.add(rig.root);rig.root.position.set(0,2,.02);rig.root.rotation.y=Math.PI;rig.root.scale.setScalar(.9);
  const upperMat=toon('#263747'),lowerMat=toon('#202a35'),up=new T.Vector3(0,1,0);
  const previousPosition=group.position.clone();
  const sleeves=[-1,1].map(side=>{const upper=new T.Mesh(new T.CylinderGeometry(.14,.16,1,10),upperMat),lower=new T.Mesh(new T.CylinderGeometry(.1,.13,1,10),lowerMat);group.add(upper,lower);return {side,upper,lower};});
  const segment=(mesh,a,b)=>{const d=b.clone().sub(a);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=d.length();mesh.quaternion.setFromUnitVectors(up,d.normalize());};
  function update(dt,time,pose,ready,fighter,hit=0,casting=false,moving=false,reducedMotion=false){
    const velocity={x:dt>0?(group.position.x-previousPosition.x)/dt:0,z:dt>0?(group.position.z-previousPosition.z)/dt:0};previousPosition.copy(group.position);
    hero.update(reducedMotion?0:time,moving&&!reducedMotion,velocity,dt);rig.update(dt,time,pose,ready,moving,casting?.8:0,reducedMotion);group.updateMatrixWorld(true);
    for(let i=0;i<sleeves.length;i++){const s=sleeves[i],wrist=group.worldToLocal(rig.hands[i].wrapper.getWorldPosition(new T.Vector3())),shoulder=new T.Vector3(-s.side*.38,1.97,0),elbow=new T.Vector3(-s.side*.49,1.6,.3);segment(s.upper,shoulder,elbow);segment(s.lower,elbow,wrist);}
  }
  return {group,rig,legs:hero.legs,update,setEquipment:hero.setEquipment,setInkViewport:(w,h)=>rig.setInkViewport(w,h)};
}
