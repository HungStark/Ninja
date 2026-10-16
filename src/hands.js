import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { HAND_GLB_BASE64 } from "../assets/hand-data.js";
import { handMaterials } from './hand-materials.js';
import { poses } from "./poses.js";
import { createSealShadow, createHandFire, createHandWater, createHandLightning, createHandElement } from './hand-vfx.js';
import { inkMaterial, addInkOutline } from './ink-outline.js';
export async function createHands() {
  const bytes = Uint8Array.from(atob(HAND_GLB_BASE64), (c) => c.charCodeAt(0));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer, "");
  const scene = new T.Scene(), root = new T.Group();
  scene.add(root);
  const ambient=new T.HemisphereLight("#e3e9f2", "#916d61", .75);
  ambient.layers.enable(1);scene.add(ambient);
  const key = new T.DirectionalLight("#fff1e5", 2.3);
  key.layers.enable(1);
  key.position.set(-1, 2, 2);
  scene.add(key);
  const fill=new T.DirectionalLight('#e0e8ff',.35);fill.layers.enable(1);fill.position.set(1,.4,1);scene.add(fill);
  const fireLight = new T.PointLight("#ff9a42", 0, 4, 2);
  fireLight.position.set(0, 0.1, -0.8);
  scene.add(fireLight);
  const hands = [], materials = handMaterials();
  const ink = inkMaterial(.35, '#60484a'), nailInk = inkMaterial(.18, '#916c70'), armorInk = inkMaterial(.40, '#111827');
  const inkMaterials = [ink, nailInk, armorInk], outlines = [];
  for (const side of [-1, 1]) {
    const wrapper = new T.Group(), model = clone(gltf.scene);
    wrapper.scale.x = side;
    wrapper.position.set(side * .33, -.38, -.76);
    wrapper.rotation.set(.10, side * .10, side * .47);
    wrapper.add(model);
    root.add(wrapper);
    const joints = {};
    const surfaces=[];
    model.traverse((o) => {
      if (o.isBone) joints[o.name] = o;
      if (o.isMesh) {
        o.material = materials[o.material.name] || materials.nail;
        o.frustumCulled = false;
        o.castShadow = false;
        o.receiveShadow = false;
        surfaces.push(o);
      }
    });
    for(const surface of surfaces) {
      if(surface.name==='hand_skin')outlines.push(addInkOutline(surface,ink));
      else if(surface.name.endsWith('_nail'))outlines.push(addInkOutline(surface,nailInk));
      else if(['sleeve','wrist_cuff','glove_back','wrist_plate'].includes(surface.name))outlines.push(addInkOutline(surface,armorInk));
    }
    hands.push({ side, wrapper, joints, fromPosition: wrapper.position.clone(), fromRotation: wrapper.quaternion.clone(), fromJoints: Object.fromEntries(Object.entries(joints).map(([name, joint]) => [name, joint.quaternion.clone()])) });
  }
  let lastPose = -1, transitionAge = 1, castAge = 10, sealPulse = 0;
  const tempQ = new T.Quaternion(), tempE = new T.Euler(), auraMat = new T.MeshBasicMaterial({ color: new T.Color("#ffcc7a").multiplyScalar(1.5), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
  const aura = new T.Mesh(new T.TorusGeometry(0.13, 18e-4, 6, 80), auraMat);
  aura.position.set(0, -0.2, -0.72);
  scene.add(aura);
  const shadow = await createSealShadow(scene), handFire = createHandFire(scene), handWater = createHandWater(scene), handLightning = createHandLightning(scene);
  const handWind=createHandElement(scene,'wind'),handDark=createHandElement(scene,'dark'),handLight=createHandElement(scene,'light'),handEarth=createHandElement(scene,'earth');
  const handWood=createHandElement(scene,'wood'),handIce=createHandElement(scene,'ice');
  const elementalRings={wind:handWind,dark:handDark,light:handLight,earth:handEarth,wood:handWood,ice:handIce};
  const lightFinger=new T.Mesh(new T.OctahedronGeometry(.012),new T.MeshBasicMaterial({color:'#fff4cc',toneMapped:false}));
  lightFinger.position.set(0,.02,0);lightFinger.visible=false;hands[1].joints.index_2.add(lightFinger);
  const lightOrigin=()=>hands[1].joints.index_2.localToWorld(new T.Vector3(0,.02,0));
  const handCenter = new T.Vector3(0, -.2, -.7), palm = new T.Vector3();
  let readyElement = '';
  function setReady(element) {
    readyElement = element || '';
    auraMat.color.set(readyElement==='lightning'?'#c6a2ff':'#ffcc7a').multiplyScalar(1.5);
    handFire.setReady(readyElement === 'fire');
    handWater.setReady(readyElement === 'water');
    handLightning.setReady(readyElement === 'lightning');
    for(const [element,ring] of Object.entries(elementalRings))ring.setReady(readyElement===element);
    if (['fire', 'water', 'lightning','wind','dark','light','earth','wood','ice'].includes(readyElement)) auraMat.opacity = 0;
  }
  function clearEffects() {
    shadow.clear(); setReady(null); sealPulse = 0; auraMat.opacity = 0;lightFinger.visible=false;
  }
  function seal(poseIndex) {
    sealPulse = 1;
    shadow.show(poseIndex);
    shadow.update(0, handCenter);
    if(poseIndex===7)lastPose=-2; // Repeat F opens and bumps the fists together again.
  }
  function cast() {
    clearEffects();
    castAge = 0;
    sealPulse = 0.7;
  }
  function update(dt, time, poseIndex, ready, moving, fireIntensity, reducedMotion) {
    if (poseIndex !== lastPose) {
      transitionAge = 0;
      lastPose = poseIndex;
      for (const hand of hands) {
        hand.fromPosition.copy(hand.wrapper.position);
        hand.fromRotation.copy(hand.wrapper.quaternion);
        for (const [name, joint] of Object.entries(hand.joints)) hand.fromJoints[name] = joint.quaternion.clone();
      }
    }
    transitionAge += dt;
    castAge += dt;
    sealPulse = Math.max(0, sealPulse - dt * 2.2);
    const pose = poses[poseIndex], duration = reducedMotion ? 0.12 : 0.26;
    const progress = Math.min(1, transitionAge / duration), opening = 0.38;
    const smooth = (v) => v * v * (3 - 2 * v);
    const close = smooth(Math.max(0, (progress - opening) / (1 - opening)));
    const separate = smooth(Math.min(1, progress / opening));
    const castPull = Math.exp(-castAge * 7) * Math.sin(Math.min(castAge, 0.5) * 9) * 0.07;
    for (const hand of hands) {
      const { side, wrapper, joints } = hand, p = pose ? pose.p : [.33, -.39, -.76], r = pose ? pose.r : [.10, .10, .47];
      const bob = reducedMotion ? 0 : Math.sin(time * (moving ? 9 : 1.6)) * (moving ? 6e-3 : 3e-3);
      const spreadX = Math.max(0.18, Math.abs(hand.fromPosition.x), p[0] + 0.08);
      const outwardX = T.MathUtils.lerp(hand.fromPosition.x, side * spreadX, separate);
      wrapper.position.set(
        T.MathUtils.lerp(outwardX, side * p[0], close) + side * castPull * 0.8,
        T.MathUtils.lerp(hand.fromPosition.y, p[1], close) + bob - castPull * 0.5,
        T.MathUtils.lerp(hand.fromPosition.z, p[2], close) + castPull
      );
      tempE.set(r[0] + castPull * 3, side * r[1], side * r[2]);
      tempQ.setFromEuler(tempE);
      wrapper.quaternion.slerpQuaternions(hand.fromRotation, tempQ, close);
      for (const [f, name] of ["index", "middle", "ring", "little"].entries()) {
        const curl = pose ? pose.curl[f] : .025 + f * .012;
        for (let j = 0; j < 3; j++) {
          tempE.set(-curl * (pose?.curlJoints?.[j] ?? (j === 0 ? 0.6 : 0.85)), 0, j === 0 ? (f - 1.5) * (pose ? pose.spread : 0.018) : 0);
          tempQ.setFromEuler(tempE);
          const jointName = name + "_" + j;
          joints[jointName].quaternion.slerpQuaternions(hand.fromJoints[jointName], tempQ, close);
        }
      }
      for (let j = 0; j < 3; j++) {
        tempE.set(-(pose ? pose.thumb : .04) * (j === 0 ? 0.55 : 0.7), 0, j === 0 ? (pose ? (pose.thumbAngle ?? .92 - pose.thumb * 1.05) : .35) : 0);
        tempQ.setFromEuler(tempE);
        joints["thumb_" + j].quaternion.slerpQuaternions(hand.fromJoints["thumb_" + j], tempQ, close);
      }
    }
    handCenter.set(0, 0, 0);
    for (const { wrapper } of hands) {
      palm.set(0, .06, 0).applyQuaternion(wrapper.quaternion).add(wrapper.position);
      handCenter.add(palm);
    }
    handCenter.multiplyScalar(.5);
    shadow.update(dt, handCenter);
    const fireReady = ready && readyElement === 'fire';
    handFire.setReady(fireReady);
    handFire.update(time, handCenter, Math.abs(hands[0].wrapper.position.x), reducedMotion);
    const waterReady = ready && readyElement === 'water';
    handWater.setReady(waterReady);
    handWater.update(time, handCenter, Math.abs(hands[0].wrapper.position.x), reducedMotion);
    const lightningReady = ready && readyElement === 'lightning';
    handLightning.setReady(lightningReady);
    handLightning.update(time, handCenter, Math.abs(hands[0].wrapper.position.x), reducedMotion);
    for(const [element,ring] of Object.entries(elementalRings)){
      ring.setReady(ready&&readyElement===element);
      ring.update(time,handCenter,Math.abs(hands[0].wrapper.position.x),reducedMotion);
    }
    aura.position.copy(handCenter);
    auraMat.opacity = fireReady || waterReady || lightningReady || (ready&&!!elementalRings[readyElement]) ? 0 : T.MathUtils.damp(auraMat.opacity, ready ? 0.3 : sealPulse * 0.16, 7, dt);
    aura.rotation.z = time * 0.65;
    aura.scale.setScalar(1 + Math.sin(time * 2) * 0.04);
    fireLight.intensity = T.MathUtils.damp(fireLight.intensity, fireIntensity * 2.6, 13, dt);
  }
  const setInkViewport=(width,height)=>inkMaterials.forEach(m=>m.uniforms.viewport.value.set(width,height));
  return { scene, root, hands, gltf, update, seal, cast, fireLight, setReady, clearEffects, shadow, handFire, handWater, handLightning, handWind,handDark,handLight,handEarth,handWood,handIce,lightFinger,lightOrigin,outlines, setInkViewport };
}
