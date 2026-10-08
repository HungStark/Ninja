import * as T from "three";
import { toon, canvasTexture, windyDepth, glowTexture, windTime } from "./materials.js";
let seed = 1681;
const rand = () => {
  seed = Math.imul(seed, 1664525) + 1013904223 >>> 0;
  return seed / 4294967296;
}, range = (a, b) => a + (b - a) * rand();
export const targetPositions = [[-6, 1.72, -8], [0, 1.72, -12], [6, 1.72, -9], [-8, 1.72, -20], [8, 1.72, -20]];
export function createWorld() {
  const scene = new T.Scene();
  scene.fog = new T.FogExp2("#b6d8de", 9e-3);
  const animated = [], targets = [], lanternLights = [];
  const mats = { stone: toon("#bdc7af"), darkStone: toon("#657c77"), wood: toon("#85664b"), red: toon("#c55c47"), roof: toon("#364f61"), gold: toon("#e5be79"), grass: toon("#8aaf71"), leaf: toon("#4c936b", { wind: true, side: T.DoubleSide }), pink: toon("#f2b5c8", { wind: true }), ground: toon("#89a67d") };
  const geos = { box: new T.BoxGeometry(1, 1, 1), sphere: new T.SphereGeometry(1, 16, 10), ico: new T.IcosahedronGeometry(1, 1), cylinder: new T.CylinderGeometry(1, 1, 1, 12), cone: new T.ConeGeometry(1, 1, 10) };
  function mesh(geo, mat, p, s = [1, 1, 1], parent = scene) {
    const m = new T.Mesh(typeof geo === "string" ? geos[geo] : geo, mat);
    m.position.fromArray(p);
    m.scale.fromArray(s);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function group(p, parent = scene) {
    const g = new T.Group();
    g.position.fromArray(p);
    parent.add(g);
    return g;
  }
  const sky = new T.Mesh(new T.SphereGeometry(180, 32, 20), new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, uniforms: { top: { value: new T.Color("#66b4df") }, horizon: { value: new T.Color("#d8eadc") }, bottom: { value: new T.Color("#c4dccc") } }, vertexShader: "varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}", fragmentShader: "uniform vec3 top;uniform vec3 horizon;uniform vec3 bottom;varying vec3 dir;void main(){float h=normalize(dir).y;vec3 col=h>0.0?mix(horizon,top,smoothstep(0.0,.65,h)):mix(horizon,bottom,clamp(-h*3.0,0.0,1.0));gl_FragColor=vec4(col,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}" }));
  sky.renderOrder = -10;
  scene.add(sky);
  const glow = glowTexture();
  const sunGlow = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 16773072, transparent: true, opacity: 0.8, depthWrite: false, blending: T.AdditiveBlending }));
  sunGlow.position.set(31, 28, -84);
  sunGlow.scale.set(35, 35, 1);
  scene.add(sunGlow);
  const sunDisk = mesh("sphere", new T.MeshBasicMaterial({ color: 16772816 }), [31, 28, -85], [4.3, 4.3, 4.3]);
  sunDisk.castShadow = false;
  const cloudMat = toon("#fcf8e8", { transparent: true, opacity: 0.82, depthWrite: false, rim: 0 });
  for (let i = 0; i < 12; i++) {
    const cloud = group([range(-85, 85), range(20, 38), range(-125, -50)]);
    for (let j = 0; j < 5; j++) {
      const c = mesh("sphere", cloudMat, [j * 3.2, Math.sin(j * 1.4), 0], [range(3.5, 6), range(1.7, 3), range(1.3, 3)], cloud);
      c.castShadow = false;
    }
    animated.push({ type: "cloud", object: cloud, origin: cloud.position.clone(), phase: range(0, 6) });
  }
  scene.add(new T.HemisphereLight("#d9ecf7", "#6e7869", 1.1));
  const sun = new T.DirectionalLight("#ffe1b0", 2.25);
  sun.position.set(-22, 34, -18);
  sun.target.position.set(0, 0, -10);
  scene.add(sun, sun.target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 30, bottom: -30, near: 1, far: 100 });
  sun.shadow.bias = -3e-4;
  sun.shadow.normalBias = 0.04;
  sun.shadow.radius = 3;
  const fill = new T.DirectionalLight("#b5d8ef", 0.5);
  fill.position.set(10, 10, 20);
  scene.add(fill);
  const groundTex = canvasTexture(512, (c, n) => {
    c.fillStyle = "#a4b88a";
    c.fillRect(0, 0, n, n);
    for (let i = 0; i < 1700; i++) {
      const x = rand() * n, y = rand() * n;
      c.globalAlpha = 0.15;
      c.fillStyle = i % 3 ? "#7c9e6e" : "#d5ce9a";
      c.beginPath();
      c.ellipse(x, y, range(2, 12), range(1, 5), rand() * 6, 0, Math.PI * 2);
      c.fill();
    }
    c.globalAlpha = 1;
  });
  groundTex.wrapS = groundTex.wrapT = T.RepeatWrapping;
  groundTex.repeat.set(14, 16);
  mats.ground.map = groundTex;
  const groundGeo = new T.PlaneGeometry(100, 120, 70, 80);
  groundGeo.rotateX(-Math.PI / 2);
  const gp = groundGeo.attributes.position;
  for (let i = 0; i < gp.count; i++) {
    const x = gp.getX(i), z = gp.getZ(i);
    gp.setY(i, Math.abs(x) < 15 ? -0.07 : Math.sin(x * 0.21 + z * 0.1) * 0.35 + Math.sin(z * 0.16) * 0.22 - 0.2);
  }
  groundGeo.computeVertexNormals();
  const ground = mesh(groundGeo, mats.ground, [0, 0, -20]);
  ground.castShadow = false;
  const stoneTex = canvasTexture(256, (c, n) => {
    c.fillStyle = "#d4d8bb";
    c.fillRect(0, 0, n, n);
    for (let i = 0; i < 180; i++) {
      c.globalAlpha = 0.1;
      c.fillStyle = i % 2 ? "#7e9183" : "#f6efcf";
      c.beginPath();
      c.ellipse(rand() * n, rand() * n, range(4, 30), range(2, 12), rand() * 6, 0, 7);
      c.fill();
    }
    c.strokeStyle = "#9cac99";
    c.globalAlpha = 0.22;
    c.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      let x = rand() * n, y = rand() * n;
      c.beginPath();
      c.moveTo(x, y);
      for (let j = 0; j < 4; j++) {
        x += range(-15, 15);
        y += range(8, 20);
        c.lineTo(x, y);
      }
      c.stroke();
    }
    c.globalAlpha = 1;
  });
  const pathMat = toon("#dedec5", { map: stoneTex });
  for (let z = 11; z > -28; z -= 2.35) for (let x = -1; x <= 1; x++) {
    const tile = mesh(new T.BoxGeometry(1.87, 0.14, 2.17), pathMat, [x * 1.97, 0.02, z + range(-0.045, 0.045)]);
    tile.rotation.y = range(-0.02, 0.02);
  }
  function rock(p, s, color) {
    const geometry = new T.IcosahedronGeometry(1, 2), pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), noise = 1 + 0.12 * Math.sin(x * 7 + z * 4) + 0.07 * Math.cos(y * 8 - x * 3);
      pos.setXYZ(i, x * noise, y * noise, z * noise);
    }
    geometry.computeVertexNormals();
    const r = mesh(geometry, toon(color, { flatShading: true }), p, s);
    r.rotation.set(range(-0.2, 0.2), rand() * 6, range(-0.12, 0.12));
    return r;
  }
  for (let i = 0; i < 48; i++) {
    let x = range(-23, 23), z = range(-40, 15);
    if (Math.abs(x) < 3.6) continue;
    rock([x, 0.18, z], [range(0.3, 1.1), range(0.25, 0.7), range(0.4, 1.2)], i % 3 ? "#9fae95" : "#b2bca1");
  }
  for (const side of [-1, 1]) for (let i = 0; i < 10; i++) {
    const h = range(5, 13);
    rock([side * range(28, 40), h * 0.43, -54 + i * 8], [range(5, 10), h, range(7, 11)], i % 3 ? "#90ad99" : "#a7b39b");
  }
  for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
    const h = range(10, 23);
    rock([(i - 4) * 18 + range(-5, 5), h * 0.3, -65 - row * 23], [range(13, 22), h, range(12, 17)], ["#89aaa1", "#9abbb4", "#aecdc4"][row]);
  }
  const barkTex = canvasTexture(128, (c, n) => {
    c.fillStyle = "#967b60";
    c.fillRect(0, 0, n, n);
    c.strokeStyle = "#6c614c";
    c.globalAlpha = 0.28;
    for (let i = 0; i < 28; i++) {
      c.beginPath();
      const x = rand() * n;
      c.moveTo(x, 0);
      c.bezierCurveTo(x + 10, 40, x - 5, 80, x + 6, n);
      c.stroke();
    }
  });
  mats.wood.map = barkTex;
  function branch(a, b, r, parent) {
    const pa = new T.Vector3(...a), pb = new T.Vector3(...b), delta = pb.clone().sub(pa);
    const m = mesh(new T.CylinderGeometry(r * 0.6, r, delta.length(), 8), mats.wood, pa.clone().add(pb).multiplyScalar(0.5).toArray(), [1, 1, 1], parent);
    m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
    return m;
  }
  function tree(x, z, h, pink = false) {
    const g = group([x, 0, z]);
    branch([0, 0, 0], [0.1, h * 0.78, 0], h * 0.046, g);
    for (let j = 0; j < 5; j++) {
      const a = j / 5 * Math.PI * 2, b = [Math.cos(a) * h * 0.22, h * (0.54 + j * 0.06), Math.sin(a) * h * 0.2];
      branch([0, h * 0.44, 0], b, h * 0.02, g);
      const leaf = mesh("ico", pink ? mats.pink : mats.leaf, [b[0], b[1] + h * 0.13, b[2]], [h * 0.3, h * 0.21, h * 0.27], g);
      leaf.rotation.set(rand(), rand() * 6, rand());
      leaf.customDepthMaterial = windyDepth();
    }
    const crown = mesh("ico", pink ? mats.pink : mats.leaf, [0.1, h * 0.84, 0], [h * 0.33, h * 0.26, h * 0.29], g);
    crown.customDepthMaterial = windyDepth();
    animated.push({ type: "tree", object: g, phase: rand() * 6 });
  }
  for (const side of [-1, 1]) for (let i = 0; i < 14; i++) tree(side * range(17, 25), range(-48, 14), range(5, 8), i % 7 === 0);
  tree(-11, 3, 7.5, true);
  tree(12, 1, 8, true);
  tree(-13, -15, 7);
  tree(13, -14, 7);
  const grassGeo = new T.BufferGeometry(), gv = [], gc = [];
  const baseColor = new T.Color("#527c57"), tipColor = new T.Color("#bdd08a");
  for (let blade = 0; blade < 5; blade++) {
    const a = blade / 5 * Math.PI * 2, h = 0.45 + blade * 0.07, dx = Math.cos(a) * 0.18, dz = Math.sin(a) * 0.18;
    for (const p of [[-0.035, 0, 0], [0.035, 0, 0], [dx, h, dz]]) {
      gv.push(...p);
      gc.push(...(p[1] === 0 ? baseColor : tipColor).toArray());
    }
  }
  grassGeo.setAttribute("position", new T.Float32BufferAttribute(gv, 3));
  grassGeo.setAttribute("color", new T.Float32BufferAttribute(gc, 3));
  grassGeo.computeVertexNormals();
  const grassMat = toon("#ffffff", { vertexColors: true, side: T.DoubleSide, wind: true, rim: 0.02 });
  const count = 1700, grass = new T.InstancedMesh(grassGeo, grassMat, count), dummy = new T.Object3D();
  for (let i = 0; i < count; i++) {
    let x, z;
    do {
      x = range(-22, 22);
      z = range(-40, 15);
    } while (Math.abs(x) < 3.15);
    dummy.position.set(x, 0.015, z);
    dummy.rotation.y = rand() * 6;
    const s = range(0.6, 1.4);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
  }
  grass.castShadow = grass.receiveShadow = true;
  grass.customDepthMaterial = windyDepth();
  grass.frustumCulled = false;
  scene.add(grass);
  const flowers = new T.InstancedMesh(new T.SphereGeometry(0.045, 6, 4), toon("#f7dfa0"), 120);
  for (let i = 0; i < 120; i++) {
    dummy.position.set((i % 2 ? 1 : -1) * range(3.5, 12), range(0.15, 0.35), range(-25, 9));
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    flowers.setMatrixAt(i, dummy.matrix);
  }
  scene.add(flowers);
  const gate = group([0, 0, -24]);
  for (const x of [-8, 8]) {
    mesh(new T.CylinderGeometry(0.39, 0.49, 7.5, 16), mats.red, [x, 3.75, 0], [1, 1, 1], gate);
    mesh("cylinder", mats.darkStone, [x, 0.27, 0], [0.67, 0.54, 0.67], gate);
    for (const y of [1, 5, 6.5]) mesh("cylinder", mats.gold, [x, y, 0], [0.402, 0.065, 0.402], gate);
  }
  mesh("box", mats.red, [0, 5.6, 0], [17.4, 0.35, 0.52], gate);
  mesh("box", mats.red, [0, 6.9, 0], [19, 0.4, 0.68], gate);
  const curve = new T.CatmullRomCurve3([new T.Vector3(-10.8, 7.7, 0), new T.Vector3(-7, 7.35, 0), new T.Vector3(0, 7.32, 0), new T.Vector3(7, 7.35, 0), new T.Vector3(10.8, 7.7, 0)]);
  const roofShape = new T.Shape();
  roofShape.moveTo(-0.18, -0.72);
  roofShape.lineTo(0.18, -0.72);
  roofShape.lineTo(0.18, 0.72);
  roofShape.lineTo(-0.18, 0.72);
  roofShape.closePath();
  const roofGeo = new T.ExtrudeGeometry(roofShape, { steps: 45, bevelEnabled: false, extrudePath: curve });
  mesh(roofGeo, mats.roof, [0, 0, 0], [1, 1, 1], gate);
  for (let x = -9; x <= 9; x += 0.65) mesh("box", mats.gold, [x, 7.09, 0], [0.05, 0.13, 1.45], gate);
  mesh("box", mats.gold, [0, 6.33, 0.42], [1.2, 1.56, 0.12], gate);
  const plaqueTex = canvasTexture(256, (c, n) => {
    c.fillStyle = "#304d5c";
    c.fillRect(0, 0, n, n);
    c.strokeStyle = "#ddb873";
    c.lineWidth = 8;
    c.strokeRect(15, 15, n - 30, n - 30);
    c.fillStyle = "#ebcc96";
    c.font = "150px serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("\u706B", n / 2, n / 2);
  });
  mesh("box", toon("#ffffff", { map: plaqueTex }), [0, 6.33, 0.49], [0.96, 1.31, 0.04], gate);
  const ropeCurve = new T.CatmullRomCurve3([new T.Vector3(-8, 5, 0.3), new T.Vector3(-4, 4.5, 0.3), new T.Vector3(0, 4.35, 0.3), new T.Vector3(4, 4.5, 0.3), new T.Vector3(8, 5, 0.3)]);
  mesh(new T.TubeGeometry(ropeCurve, 40, 0.055, 6, false), mats.gold, [0, 0, 0], [1, 1, 1], gate);
  const paper = toon("#faf2d5", { side: T.DoubleSide });
  for (let i = 0; i < 7; i++) {
    let x = (i - 3) * 1.8, y = 4.4 + 8e-3 * x * x;
    const streamer = group([x, y, 0.32], gate);
    for (let j = 0; j < 3; j++) {
      const sheet = mesh("box", paper, [j % 2 * 0.08, -j * 0.15, 0], [0.21, 0.18, 0.012], streamer);
      sheet.rotation.z = j % 2 ? 0.3 : -0.3;
    }
    animated.push({ type: "banner", object: streamer, phase: i });
  }
  const bannerTex = canvasTexture(256, (c, n) => {
    c.fillStyle = "#bc5949";
    c.fillRect(0, 0, n, n);
    c.strokeStyle = "#f3d59e";
    c.lineWidth = 5;
    c.strokeRect(15, 15, n - 30, n - 30);
    c.fillStyle = "#f3d59e";
    c.font = "115px serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("\u708E", n / 2, n * 0.47);
    for (let j = 0; j < 5; j++) c.fillRect(n / 2 - 4, n * 0.75 + j * 5, 8, 2);
  });
  const bannerMat = toon("#ffffff", { map: bannerTex, wind: true, side: T.DoubleSide });
  for (const side of [-1, 1]) {
    mesh("cylinder", mats.wood, [side * 12, 2.65, -22], [0.07, 5.3, 0.07]);
    const geo = new T.PlaneGeometry(1.15, 2.8, 5, 12);
    geo.translate(0, 1.4, 0);
    const flag = mesh(geo, bannerMat, [side * 11.44, 2.16, -22]);
    flag.customDepthMaterial = windyDepth();
    mesh("box", mats.gold, [side * 11.44, 5, -22], [1.4, 0.08, 0.08]);
  }
  for (const side of [-1, 1]) {
    for (let i = 0; i < 10; i++) {
      mesh("box", mats.wood, [side * 16, 0.85, -25 + i * 4], [0.25, 1.7, 0.25]);
      mesh("sphere", mats.gold, [side * 16, 1.75, -25 + i * 4], [0.15, 0.15, 0.15]);
    }
    for (const y of [0.55, 1.25]) mesh("box", mats.wood, [side * 16, y, -7], [0.15, 0.12, 38]);
  }
  function lantern(x, z) {
    const g = group([x, 0, z]);
    mesh("box", mats.stone, [0, 0.13, 0], [1.1, 0.26, 1.1], g);
    mesh("cylinder", mats.stone, [0, 0.73, 0], [0.22, 1.2, 0.22], g);
    mesh("box", mats.stone, [0, 1.3, 0], [0.97, 0.16, 0.97], g);
    const glowMat = new T.MeshBasicMaterial({ color: new T.Color("#ffd994").multiplyScalar(1.8) });
    mesh("box", glowMat, [0, 1.68, 0], [0.59, 0.64, 0.59], g);
    for (let i = 0; i < 4; i++) {
      let a = i / 4 * Math.PI * 2 + Math.PI / 4;
      mesh("box", mats.darkStone, [Math.cos(a) * 0.4, 1.7, Math.sin(a) * 0.4], [0.1, 0.78, 0.1], g);
    }
    const roof = mesh("cone", mats.roof, [0, 2.2, 0], [0.92, 0.55, 0.92], g);
    roof.rotation.y = Math.PI / 4;
    mesh("sphere", mats.gold, [0, 2.57, 0], [0.1, 0.14, 0.1], g);
    const l = new T.PointLight("#ffb75a", 3, 5, 2);
    l.position.set(x, 1.7, z);
    scene.add(l);
    lanternLights.push(l);
  }
  for (const x of [-5, 5]) for (const z of [4, -19]) lantern(x, z);
  const targetMap = canvasTexture(256, (c, n) => {
    c.fillStyle = "#ebdfb5";
    c.fillRect(0, 0, n, n);
    for (let i = 0; i < 6; i++) {
      c.fillStyle = i % 2 ? "#eeddb0" : "#b75742";
      c.beginPath();
      c.arc(n / 2, n / 2, n * 0.46 * (1 - i * 0.16), 0, Math.PI * 2);
      c.fill();
    }
    for (let i = 0; i < 350; i++) {
      c.globalAlpha = 0.09;
      c.fillStyle = "#765b41";
      c.fillRect(rand() * n, rand() * n, 1, range(1, 6));
    }
    c.globalAlpha = 1;
  });
  targetPositions.forEach((pos, i) => {
    const g = group([pos[0], 0, pos[2]]);
    mesh("box", mats.darkStone, [0, 0.08, 0], [1.1, 0.16, 1], g);
    mesh("box", mats.wood, [0, 0.86, 0], [0.19, 1.6, 0.19], g);
    mesh("box", mats.wood, [0, 1.42, 0], [1.5, 0.12, 0.13], g);
    const discMat = toon("#ffffff", { map: targetMap }), disc = mesh(new T.CylinderGeometry(0.77, 0.77, 0.16, 48), mats.wood, [0, pos[1], 0], [1, 1, 1], g);
    disc.rotation.x = Math.PI / 2;
    const face = mesh(new T.CircleGeometry(0.752, 48), discMat, [0, pos[1], 0.09], [1, 1, 1], g);
    mesh(new T.TorusGeometry(0.76, 0.03, 6, 48), mats.gold, [0, pos[1], 0.1], [1, 1, 1], g);
    targets.push({ group: g, face, disc, material: discMat, pos: new T.Vector3(pos[0], pos[1], pos[2] + 0.1), hp: 100, index: i, dead: false, hit: 0 });
  });
  const petals = new T.InstancedMesh(new T.SphereGeometry(1, 5, 3), toon("#f3bfca", { side: T.DoubleSide }), 70), petalData = [];
  for (let i = 0; i < 70; i++) petalData.push({ x: range(-18, 18), y: range(1, 8), z: range(-28, 12), phase: rand() * 6, speed: range(0.1, 0.35) });
  scene.add(petals);
  petals.castShadow = false;
  function update(time, dt) {
    windTime.value = time;
    for (const a of animated) {
      if (a.type === "cloud") a.object.position.x = a.origin.x + Math.sin(time * 0.025 + a.phase) * 3;
      if (a.type === "tree") a.object.rotation.z = Math.sin(time * 0.65 + a.phase) * 8e-3;
      if (a.type === "banner") a.object.rotation.z = Math.sin(time * 1.2 + a.phase) * 0.08;
    }
    for (let i = 0; i < petalData.length; i++) {
      const p = petalData[i], y = (p.y - time * p.speed + 500) % 9;
      dummy.position.set(p.x + Math.sin(time * 0.3 + p.phase) * 1.2, y, p.z + Math.cos(time * 0.2 + p.phase) * 0.5);
      dummy.rotation.set(time * 0.6 + p.phase, time * 0.3 + p.phase, Math.sin(time + p.phase));
      dummy.scale.set(0.055, 9e-3, 0.027);
      dummy.updateMatrix();
      petals.setMatrixAt(i, dummy.matrix);
    }
    petals.instanceMatrix.needsUpdate = true;
    for (const t of targets) {
      t.hit = Math.max(0, t.hit - dt);
      t.group.rotation.x = T.MathUtils.damp(t.group.rotation.x, t.dead ? -1.48 : Math.sin(t.hit * 40) * t.hit * 0.17, 8, dt);
      t.group.position.y = T.MathUtils.damp(t.group.position.y, t.dead ? -0.12 : 0, 8, dt);
      t.material.emissive.set(t.hit > 0 ? "#ed7840" : "#000000");
      t.material.emissiveIntensity = t.hit > 0 ? 0.4 : 0;
    }
  }
  function reset() {
    targets.forEach((t) => {
      t.hp = 100;
      t.dead = false;
      t.hit = 0;
      t.group.rotation.set(0, 0, 0);
      t.group.position.y = 0;
    });
  }
  return { scene, sky, sun, fill, grass, targets, update, reset, lanternLights };
}
