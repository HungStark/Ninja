import fs from "node:fs/promises";
import * as T from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { poses } from "../src/poses.js";
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((data) => {
      this.result = data;
      this.onloadend?.();
    }).catch((error) => this.onerror?.(error));
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((data) => {
      this.result = "data:application/octet-stream;base64," + Buffer.from(data).toString("base64");
      this.onloadend?.();
    });
  }
};
// Blender authors the mesh and rig; add the game's twelve clips and embed it.
const source = await fs.readFile('assets/blender-hands.glb');
const { scene } = await new GLTFLoader().parseAsync(source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength), '');
const hand = scene;
const clips = poses.map((pose, i) => {
  const tracks = [];
  for (const [f, name] of ["index", "middle", "ring", "little"].entries()) for (let j = 0; j < 3; j++) {
    const bone = hand.getObjectByName(name + "_" + j), a = bone.quaternion.clone(), b = new T.Quaternion().setFromEuler(new T.Euler(-pose.curl[f] * (pose.curlJoints?.[j] ?? (j === 0 ? 0.6 : 0.85)), 0, j === 0 ? (f - 1.5) * pose.spread : 0));
    tracks.push(new T.QuaternionKeyframeTrack(bone.name + ".quaternion", [0, 0.22], [...a.toArray(), ...b.toArray()]));
  }
  for (let j = 0; j < 3; j++) {
    const bone = hand.getObjectByName("thumb_" + j), b = new T.Quaternion().setFromEuler(new T.Euler(-pose.thumb * (j === 0 ? 0.55 : 0.7), 0, j === 0 ? (pose.thumbAngle ?? 0.92 - pose.thumb * 1.05) : 0));
    tracks.push(new T.QuaternionKeyframeTrack(bone.name + ".quaternion", [0, 0.22], [...bone.quaternion.toArray(), ...b.toArray()]));
  }
  return new T.AnimationClip("seal_" + String(i + 1).padStart(2, "0"), 0.22, tracks);
});
const binary = await new GLTFExporter().parseAsync(scene, { binary: true, trs: true, animations: clips });
await fs.mkdir("assets", { recursive: true });
await fs.writeFile("assets/ninja-hands.glb", Buffer.from(binary));
await fs.writeFile("assets/hand-data.js", "export const HAND_GLB_BASE64=" + JSON.stringify(Buffer.from(binary).toString("base64")) + ";\n");
console.log("Packaged Blender anime hand GLB: " + binary.byteLength + " bytes, 16 bones, 12 animation clips.");
