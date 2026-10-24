import * as T from "three";
import {buildInterior,INTERIORS} from "./adventure-interiors.js";
import { toon, canvasTexture, windyDepth, glowTexture, windTime } from "./materials.js";
import { inkMaterial, addInkOutline } from './ink-outline.js';
import { createTerrainGrid, TerrainSurface } from './terrain-surface.js';
let seed = 1681;
const rand = () => {
  seed = Math.imul(seed, 1664525) + 1013904223 >>> 0;
  return seed / 4294967296;
}, range = (a, b) => a + (b - a) * rand();
export function createWorld() {
  const scene = new T.Scene();
  scene.fog = new T.FogExp2("#43536a", 9e-3);
  const animated = [], terrainMeshes=[], terrainProps=[];
  const mats = { stone: toon("#bdc7af"), darkStone: toon("#657c77"), wood: toon("#85664b"), gold: toon("#e5be79"), ground: toon("#89a67d") };
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
  const sky = new T.Mesh(new T.SphereGeometry(180, 32, 20), new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, uniforms: { top: { value: new T.Color("#243b58") }, horizon: { value: new T.Color("#536375") }, bottom: { value: new T.Color("#364450") } }, vertexShader: "varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}", fragmentShader: "uniform vec3 top;uniform vec3 horizon;uniform vec3 bottom;varying vec3 dir;void main(){float h=normalize(dir).y;vec3 col=h>0.0?mix(horizon,top,smoothstep(0.0,.65,h)):mix(horizon,bottom,clamp(-h*3.0,0.0,1.0));gl_FragColor=vec4(col,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}" }));
  sky.renderOrder = -10;
  scene.add(sky);
  const glow = glowTexture();
  const sunGlow = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 16773072, transparent: true, opacity: 0.18, depthWrite: false, blending: T.AdditiveBlending }));
  sunGlow.position.set(31, 28, -84);
  sunGlow.scale.set(35, 35, 1);
  scene.add(sunGlow);
  const sunDisk = mesh("sphere", new T.MeshBasicMaterial({ color: '#b2a389' }), [31, 28, -85], [4.3, 4.3, 4.3]);
  sunDisk.castShadow = false;
  const cloudMat = toon("#9eacbd", { transparent: true, opacity: 0.60, depthWrite: false, rim: 0 });
  for (let i = 0; i < 12; i++) {
    const cloud = group([range(-85, 85), range(20, 38), range(-125, -50)]);
    for (let j = 0; j < 5; j++) {
      const c = mesh("sphere", cloudMat, [j * 3.2, Math.sin(j * 1.4), 0], [range(3.5, 6), range(1.7, 3), range(1.3, 3)], cloud);
      c.castShadow = false;
    }
    animated.push({ type: "cloud", object: cloud, origin: cloud.position.clone(), phase: range(0, 6) });
  }
  // Dim the environment lights rather than the renderer exposure so spell brightness stays intact.
  scene.add(new T.HemisphereLight("#aebfd8", "#4b535c", 0.38));
  const sun = new T.DirectionalLight("#dbc4a9", 0.7);
  sun.position.set(-22, 34, -18);
  sun.target.position.set(0, 0, -10);
  scene.add(sun, sun.target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 30, bottom: -30, near: 1, far: 100 });
  sun.shadow.bias = -3e-4;
  sun.shadow.normalBias = 0.04;
  sun.shadow.radius = 3;
  const fill = new T.DirectionalLight("#9eb8d7", 0.16);
  fill.position.set(10, 10, 20);
  scene.add(fill);
  const groundTex = canvasTexture(512, (c, n) => {
    c.fillStyle = "#a4b88a";
    c.fillRect(0, 0, n, n);
    for (let i = 0; i < 1700; i++) {
      const x = rand() * n, y = rand() * n;
      c.globalAlpha = 0.23;
      c.fillStyle = i % 3 ? "#7c9e6e" : "#d5ce9a";
      c.beginPath();
      const rx=range(2,12),ry=range(1,5),angle=rand()*6;
      // Uneven brush patches instead of a field of smooth dots.
      for(let j=0;j<7;j++){
        const a=j/7*Math.PI*2,r=1+.18*Math.sin(i*3.7+j*2.1);
        const px=Math.cos(a)*rx*r,py=Math.sin(a)*ry*r;
        const bx=x+px*Math.cos(angle)-py*Math.sin(angle),by=y+px*Math.sin(angle)+py*Math.cos(angle);
        if(j===0)c.moveTo(bx,by);else c.lineTo(bx,by);
      }
      c.closePath();
      c.fill();
    }
    c.globalAlpha = 1;
  });
  groundTex.wrapS = groundTex.wrapT = T.RepeatWrapping;
  groundTex.repeat.set(14, 16);
  mats.ground.map = groundTex;
  const groundGeo = createTerrainGrid();
  const ground = mesh(groundGeo, mats.ground, [0, 0, -20]);
  terrainMeshes.push(ground);
  ground.castShadow = false;
  const stoneTex = canvasTexture(256, (c, n) => {
    c.fillStyle = "#d4d8bb";
    c.fillRect(0, 0, n, n);
    for (let i = 0; i < 180; i++) {
      c.globalAlpha = i%5===0?.27:0;
      c.fillStyle = i % 2 ? "#7e9183" : "#f6efcf";
      c.beginPath();
      const x=rand()*n,y=rand()*n,rx=range(4,30),ry=range(2,12),angle=rand()*6;
      for(let j=0;j<6;j++){
        const a=j/6*Math.PI*2,r=1+.22*Math.sin(i*1.8+j*2.3);
        const px=Math.cos(a)*rx*r,py=Math.sin(a)*ry*r;
        const bx=x+px*Math.cos(angle)-py*Math.sin(angle),by=y+px*Math.sin(angle)+py*Math.cos(angle);
        if(j===0)c.moveTo(bx,by);else c.lineTo(bx,by);
      }
      c.closePath();
      c.fill();
    }
    c.strokeStyle = "#677467";
    c.globalAlpha = 0.38;
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
    const tile = mesh(new T.BoxGeometry(1.87, 0.14, 2.17,4,1,4), pathMat, [x * 1.97, 0.02, z + range(-0.045, 0.045)]);
    terrainMeshes.push(tile);
    tile.rotation.y = range(-0.02, 0.02);
    const uv=tile.geometry.attributes.uv,turn=(Math.round(z/2.35)+x+40)%4;
    for(let i=0;i<uv.count;i++){
      let u=uv.getX(i),v=uv.getY(i);
      for(let j=0;j<turn;j++){const next=1-v;v=u;u=next;}
      uv.setXY(i,u,v);
    }
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
    if(Math.abs(p[0])<27&&p[1]<1&&p[2]>-48)terrainProps.push(r);
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
    c.globalAlpha = 0.38;
    for (let i = 0; i < 28; i++) {
      c.beginPath();
      const x = rand() * n;
      c.moveTo(x, 0);
      c.bezierCurveTo(x + 10, 40, x - 5, 80, x + 6, n);
      c.stroke();
    }
  });
  mats.wood.map = barkTex;
  const grassGeo = new T.BufferGeometry(), blades = [], colors = [];
  const baseColor = new T.Color('#527c57'), tipColor = new T.Color('#bdd08a');
  for (let blade = 0; blade < 5; blade++) {
    const angle = blade / 5 * Math.PI * 2, height = .45 + blade * .07;
    const dx = Math.cos(angle) * .18, dz = Math.sin(angle) * .18;
    for (const p of [[-.035, 0, 0], [.035, 0, 0], [dx, height, dz]]) {
      blades.push(...p);
      colors.push(...(p[1] === 0 ? baseColor : tipColor).toArray());
    }
  }
  grassGeo.setAttribute('position', new T.Float32BufferAttribute(blades, 3));
  grassGeo.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  grassGeo.computeVertexNormals();
  const grassMat = toon('#ffffff', { vertexColors: true, side: T.DoubleSide, wind: true, rim: .02 });
  const grass = new T.InstancedMesh(grassGeo, grassMat, 1700), dummy = new T.Object3D();
  for (let i = 0; i < grass.count; i++) {
    let x, z;
    do { x = range(-22, 22); z = range(-40, 15); } while (Math.abs(x) < 3.15);
    dummy.position.set(x, .015, z);
    dummy.rotation.y = rand() * Math.PI * 2;
    dummy.scale.setScalar(range(.6, 1.4));
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
  }
  grass.castShadow = grass.receiveShadow = true;
  grass.customDepthMaterial = windyDepth();
  grass.frustumCulled = false;
  scene.add(grass);
  const opponentSpawn = new T.Vector3(0, 0, -24);
  const plantReferenceHeight = 7.88; // Preserve the established size of summoned Wood plants.
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
  function update(time, dt) {
    windTime.value = time;
    for (const a of animated) {
      if (a.type === "cloud") a.object.position.x = a.origin.x + Math.sin(time * 0.025 + a.phase) * 3;
    }
  }
  const environment = [...scene.children];
  const ink=inkMaterial(.8,'#343d39'),leafInk=inkMaterial(.65,'#3d4543',true),outlines=[];
  const subjects=[],position=new T.Vector3();scene.updateMatrixWorld(true);
  scene.traverse(o=>{
    if(!o.isMesh||o.isInstancedMesh||o.material.transparent||!['BoxGeometry','CylinderGeometry','IcosahedronGeometry'].includes(o.geometry.type))return;
    o.getWorldPosition(position);
    if(position.z< -48||Math.abs(position.x)>27)return;
    subjects.push(o);
  });
  for(const subject of subjects)outlines.push(addInkOutline(subject,subject.material.userData.wind?leafInk:ink));
  const setInkViewport=(width,height)=>[ink,leafInk].forEach(m=>m.uniforms.viewport.value.set(width,height));
  const terrain=new TerrainSurface(terrainMeshes,[grass],terrainProps);
  const outdoor=[...environment],defaultFog=scene.fog,defaultBackground=scene.background;let arena=null,arenaActive=false;
  function setArena(active){
    if(active&&!arena){const materials=new Map(),M=(color,glow=0)=>{const key=color+glow;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.9,emissive:color,emissiveIntensity:glow*.25}));return materials.get(key);},roomMesh=(g,m,p,x=0,y=0,z=0)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
      arena=buildInterior({land:scene,M,mesh:roomMesh,box:(p,m,x,y,z,w,h,d)=>roomMesh(new T.BoxGeometry(w,h,d),m,p,x,y,z),cyl:(p,m,x,y,z,r,h,n)=>roomMesh(new T.CylinderGeometry(r,r,h,n),m,p,x,y,z),solidMesh:o=>o,physics:{addBox:()=>{}}},INTERIORS['wood-arena']).root;arena.add(new T.HemisphereLight('#e8d8b1','#5d594c',1.2));environment.push(arena);
    }
    arenaActive=!!active;for(const object of outdoor)if(!object.isLight)object.visible=!active;if(arena)arena.visible=!!active;scene.fog=active?new T.Fog('#26322d',35,95):defaultFog;scene.background=active?new T.Color('#26322d'):defaultBackground;
  }
  return {get arenaActive(){return arenaActive;},setArena, scene, sky, sun, fill, grass, opponentSpawn, plantReferenceHeight, update, environment, outlines, setInkViewport, terrain };
}
