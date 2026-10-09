import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone } from "three/addons/utils/SkeletonUtils.js";
import { HAND_GLB_BASE64 } from "../assets/hand-data.js";
import { toon, outlineMaterial } from "./materials.js";
import { poses } from "./poses.js";
export async function createHands() {
  const bytes = Uint8Array.from(atob(HAND_GLB_BASE64), (c) => c.charCodeAt(0));
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer, "");
  const scene = new T.Scene(), root = new T.Group();
  scene.add(root);
  scene.add(new T.HemisphereLight("#dfedff", "#8d705a", 1.65));
  const key = new T.DirectionalLight("#ffe0ae", 1.9);
  key.position.set(-1, 2, 2);
  scene.add(key);
  const fireLight = new T.PointLight("#ff9a42", 0, 4, 2);
  fireLight.position.set(0, 0.1, -0.8);
  scene.add(fireLight);
  const hands = [];
  for (const side of [-1, 1]) {
    const wrapper = new T.Group(), model = clone(gltf.scene);
    wrapper.scale.x = side;
    wrapper.position.set(side * 0.33, -0.38, -0.76);
    wrapper.rotation.set(0.16, side * 0.16, side * 0.27);
    wrapper.add(model);
    root.add(wrapper);
    const joints = {};
    model.traverse((o) => {
      if (o.isBone) joints[o.name] = o;
      if (o.isMesh) {
        const name = o.material.name, color = o.material.color?.clone() || new T.Color("#f3c8a5");
        o.material = toon(color, { rim: name === "skin" ? 0.2 : 0.1 });
        o.frustumCulled = false;
        o.castShadow = false;
        o.receiveShadow = false;
        if (o.isSkinnedMesh) {
          const ink = new T.SkinnedMesh(o.geometry, outlineMaterial());
          ink.bind(o.skeleton, o.bindMatrix);
          ink.frustumCulled = false;
          ink.renderOrder = -1;
          o.parent.add(ink);
        }
      }
    });
    hands.push({ side, wrapper, joints, fromPosition: wrapper.position.clone(), fromRotation: wrapper.quaternion.clone(), fromJoints: Object.fromEntries(Object.entries(joints).map(([name, joint]) => [name, joint.quaternion.clone()])) });
  }
  let lastPose = -1, transitionAge = 1, castAge = 10, sealPulse = 0;
  const tempQ = new T.Quaternion(), tempE = new T.Euler(), auraMat = new T.MeshBasicMaterial({ color: new T.Color("#ffcc7a").multiplyScalar(1.5), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
  const aura = new T.Mesh(new T.TorusGeometry(0.13, 18e-4, 6, 80), auraMat);
  aura.position.set(0, -0.2, -0.72);
  scene.add(aura);
  function seal() {
    sealPulse = 1;
  }
  function cast() {
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
      const { side, wrapper, joints } = hand, p = pose ? pose.p : [0.33, -0.39, -0.76], r = pose ? pose.r : [0.16, 0.16, 0.27];
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
        const curl = pose ? pose.curl[f] : 0.24 + f * 0.06;
        for (let j = 0; j < 3; j++) {
          tempE.set(-curl * (j === 0 ? 0.6 : 0.85), 0, j === 0 ? (f - 1.5) * (pose ? pose.spread : 0.06) : 0);
          tempQ.setFromEuler(tempE);
          const jointName = name + "_" + j;
          joints[jointName].quaternion.slerpQuaternions(hand.fromJoints[jointName], tempQ, close);
        }
      }
      for (let j = 0; j < 3; j++) {
        tempE.set(-(pose ? pose.thumb : 0.35) * (j === 0 ? 0.55 : 0.7), 0, j === 0 ? (pose?.thumbAngle ?? 0.92 - (pose ? pose.thumb : 0.35) * 1.05) : 0);
        tempQ.setFromEuler(tempE);
        joints["thumb_" + j].quaternion.slerpQuaternions(hand.fromJoints["thumb_" + j], tempQ, close);
      }
    }
    auraMat.opacity = T.MathUtils.damp(auraMat.opacity, ready ? 0.3 : sealPulse * 0.16, 7, dt);
    aura.rotation.z = time * 0.65;
    aura.scale.setScalar(1 + Math.sin(time * 2) * 0.04);
    fireLight.intensity = T.MathUtils.damp(fireLight.intensity, fireIntensity * 2.6, 13, dt);
  }
  return { scene, root, hands, gltf, update, seal, cast, fireLight };
}
