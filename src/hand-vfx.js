import * as T from 'three';
import { SHADOW_SHEET } from '../assets/shadow-data.js';

// Match the first four rows of ket_an.jpg to bong.png, not to its 4x4 order.
// Q W E / R A S / D F Z / X C V.
export const sealShadowCells = [0, 1, 2, 4, 5, 6, 7, 9, 10, 11, 13, 8];
// These two heads face the opposite way in the separated sheet.
export const sealShadowFacing = [1, 1, 1, 1, 1, 1, -1, 1, 1, 1, 1, -1];
export const shadowDuration = .2;
const bounds = [
  [113, 21, 258, 237], [496, 23, 252, 241], [843, 58, 194, 212], [1135, 85, 323, 139],
  [128, 291, 245, 191], [490, 285, 267, 208], [812, 330, 295, 121], [1183, 297, 255, 196],
  [91, 526, 279, 229], [441, 513, 246, 260], [779, 542, 353, 234], [1228, 537, 176, 237],
  [108, 789, 208, 210], [460, 789, 150, 212], [798, 789, 199, 210], [1051, 832, 406, 166]
];
let sheetPromise;
function loadSheet() {
  // Node animation tests do not create a DOM; the browser loads the embedded original.
  if (typeof document === 'undefined') return Promise.resolve(new T.Texture());
  return sheetPromise ??= new T.TextureLoader().loadAsync(SHADOW_SHEET);
}

export async function createSealShadow(scene) {
  const texture = await loadSheet();
  texture.minFilter = texture.magFilter = T.LinearFilter;
  texture.generateMipmaps = false;
  const material = new T.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false,
    uniforms: { uMap: { value: texture }, uBounds: { value: new T.Vector4() }, uOpacity: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    // The original white background and eye holes become transparent, preserving the black silhouette.
    fragmentShader: 'uniform sampler2D uMap;uniform vec4 uBounds;uniform float uOpacity;varying vec2 vUv;void main(){vec3 ink=texture2D(uMap,uBounds.xy+vUv*uBounds.zw).rgb;float alpha=(1.0-dot(ink,vec3(.299,.587,.114)))*uOpacity;if(alpha<.01)discard;gl_FragColor=vec4(vec3(.008,.006,.012),alpha);}'
  });
  const mesh = new T.Mesh(new T.PlaneGeometry(1, 1), material);
  mesh.name = 'SealShadow';
  mesh.renderOrder = 20;
  mesh.visible = false;
  scene.add(mesh);
  let age = shadowDuration, cell = -1;
  function show(pose) {
    cell = sealShadowCells[pose] ?? -1;
    if (cell < 0) { clear(); return; }
    const [x, y, w, h] = bounds[cell], pad = 3;
    material.uniforms.uBounds.value.set((x - pad) / 1536, 1 - (y + h + pad) / 1024, (w + pad * 2) / 1536, (h + pad * 2) / 1024);
    const size = .29 / Math.max(w, h);
    mesh.scale.set(sealShadowFacing[pose] * (w + pad * 2) * size, (h + pad * 2) * size, 1);
    age = 0;
    material.uniforms.uOpacity.value = 1;
    mesh.visible = true;
  }
  function clear() { age = shadowDuration; mesh.visible = false; }
  function update(dt, center) {
    age = Math.min(shadowDuration, age + dt);
    mesh.visible = cell >= 0 && age + 1e-9 < shadowDuration;
    mesh.position.copy(center);
    mesh.position.z += .13;
    material.uniforms.uOpacity.value = Math.min(1, Math.max(0, (shadowDuration - age) / .05));
  }
  return { mesh, show, clear, update, state: () => ({ visible: mesh.visible, cell, age, position: mesh.position.toArray(), opacity: material.uniforms.uOpacity.value }) };
}

export function createHandFire(scene) {
  const material = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uReducedMotion: { value: 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `
      uniform float uTime;uniform float uReducedMotion;varying vec2 vUv;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      void main(){
        vec2 p=(vUv-.5)*3.0;float r=length(p),a=atan(p.y,p.x);
        float t=uTime*mix(1.0,.15,uReducedMotion);
        // Periodic coordinates keep the flames continuous across the angle seam.
        vec2 circle=vec2(cos(a),sin(a));
        float n=noise(circle*7.0+vec2(t*2.6,-t*3.8));
        float fine=noise(circle*17.0+vec2(-t*5.0,t*2.8));
        float edge=1.0+(n-.5)*.12;
        float flicker=pow(max(0.0,sin(a*24.0+n*4.0-t*5.0)),4.0);
        float tongue=pow(n,3.0)*.15+flicker*(.12+fine*.28);
        float inside=smoothstep(edge-.065,edge-.02,r);
        float outside=1.0-smoothstep(edge+.02,edge+.055+tongue,r);
        float alpha=inside*outside*(.65+fine*.35);
        float hot=1.0-smoothstep(.008,.055,abs(r-edge));
        vec3 color=mix(vec3(1.0,.055,.002),vec3(1.6,.64,.045),hot);
        if(alpha<.015)discard;
        gl_FragColor=vec4(color,alpha*.85);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const mesh = new T.Mesh(new T.PlaneGeometry(1, 1), material);
  mesh.name = 'ReadyHandFlames';
  mesh.renderOrder = 10;
  mesh.visible = false;
  scene.add(mesh);
  const count = 32, geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(count * 3), 3));
  const embers = new T.Points(geometry, new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    vertexShader: 'void main(){vec4 p=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(2.4/max(.3,-p.z),1.0,7.0);gl_Position=projectionMatrix*p;}',
    fragmentShader: 'void main(){float a=1.0-smoothstep(.1,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(2.0,.65,.035,a*.8);}'
  }));
  embers.name = 'ReadyHandEmbers';
  embers.visible = false;
  embers.frustumCulled = false;
  scene.add(embers);
  const light = new T.PointLight('#ff8c2b', 0, 1.5, 2);
  light.name = 'ReadyHandFireLight';
  scene.add(light);
  function setReady(ready) { mesh.visible = embers.visible = ready; light.intensity = ready ? .035 : 0; }
  function update(time, center, halfWidth, reducedMotion) {
    mesh.position.copy(center); mesh.position.z += .08;
    light.position.copy(center); light.position.z += .2;
    const rx = Math.max(.19, halfWidth + .115), ry = .20;
    mesh.scale.set(rx * 3, ry * 3, 1);
    material.uniforms.uTime.value = time;
    material.uniforms.uReducedMotion.value = Number(reducedMotion);
    if (!mesh.visible) return;
    for (let i = 0; i < count; i++) {
      const life = (time * (reducedMotion ? .07 : .65) + i * .618) % 1, angle = i * 2.399 + time * .18;
      geometry.attributes.position.setXYZ(i, center.x + Math.cos(angle) * rx * (1.05 + life * .25), center.y + Math.sin(angle) * ry * 1.1 + life * .12, center.z + .1);
    }
    geometry.attributes.position.needsUpdate = true;
  }
  return { mesh, embers, light, setReady, update };
}
