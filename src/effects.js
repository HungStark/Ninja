import * as T from "three";
import { glowTexture, smokeTexture } from "./materials.js";
export class FireEffects {
  constructor(scene) {
    this.scene = scene;
    this.time = 0;
    this.smoke = [];
    this.rings = [];
    this.objects = [];
    this.glow = glowTexture();
    this.smokeMap = smokeTexture();
    this.lights = [];
    for (let i = 0; i < 3; i++) {
      const light = new T.PointLight("#ff8c38", 0, 9, 2);
      scene.add(light);
      this.lights.push(light);
    }
    this.sparkCapacity = 650;
    const geometry = new T.BufferGeometry();
    geometry.setAttribute("position", new T.BufferAttribute(new Float32Array(this.sparkCapacity * 3), 3));
    geometry.setAttribute("color", new T.BufferAttribute(new Float32Array(this.sparkCapacity * 3), 3));
    geometry.setAttribute("aSize", new T.BufferAttribute(new Float32Array(this.sparkCapacity), 1));
    geometry.setAttribute("aAlpha", new T.BufferAttribute(new Float32Array(this.sparkCapacity), 1));
    this.sparks = new T.Points(geometry, new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uPixelRatio: { value: 1 } }, vertexShader: "attribute vec3 color;attribute float aSize;attribute float aAlpha;varying vec3 vColor;varying float vAlpha;uniform float uPixelRatio;void main(){vColor=color;vAlpha=aAlpha;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(aSize*700.0*uPixelRatio/max(.2,-mv.z),1.0,100.0);gl_Position=projectionMatrix*mv;}", fragmentShader: "varying vec3 vColor;varying float vAlpha;void main(){float r=length(gl_PointCoord-.5)*2.0;float a=pow(max(0.0,1.0-r),2.0)*vAlpha;gl_FragColor=vec4(vColor*2.4,a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}" }));
    this.sparks.frustumCulled = false;
    scene.add(this.sparks);
    const smokeGeo = new T.BufferGeometry();
    smokeGeo.setAttribute("position", new T.BufferAttribute(new Float32Array(180 * 3), 3));
    smokeGeo.setAttribute("aSize", new T.BufferAttribute(new Float32Array(180), 1));
    smokeGeo.setAttribute("aAlpha", new T.BufferAttribute(new Float32Array(180), 1));
    this.smokePoints = new T.Points(smokeGeo, new T.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uMap: { value: this.smokeMap }, uPixelRatio: { value: 1 } }, vertexShader: "attribute float aSize;attribute float aAlpha;varying float vAlpha;uniform float uPixelRatio;void main(){vAlpha=aAlpha;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=clamp(aSize*700.0*uPixelRatio/max(.2,-mv.z),1.0,180.0);gl_Position=projectionMatrix*mv;}", fragmentShader: "uniform sampler2D uMap;varying float vAlpha;void main(){float a=texture2D(uMap,gl_PointCoord).a*vAlpha;gl_FragColor=vec4(.26,.25,.29,a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}" }));
    this.smokePoints.frustumCulled = false;
    this.smokePoints.renderOrder = 5;
    scene.add(this.smokePoints);
    this.fireMaterial = new T.ShaderMaterial({ uniforms: { uTime: { value: 0 } }, vertexShader: "varying vec3 local;uniform float uTime;void main(){local=position;float noise=sin(position.x*9.0+uTime*13.0)*sin(position.y*8.0-uTime*10.0)*.055;vec3 p=position+normal*noise;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}", fragmentShader: "varying vec3 local;uniform float uTime;void main(){float f=sin(local.x*8.0+uTime*11.0)*cos(local.y*10.0-uTime*14.0);vec3 col=mix(vec3(2.8,.23,.02),vec3(3.5,1.4,.25),smoothstep(-.6,.8,f));gl_FragColor=vec4(col,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}" });
    this.coreGeometry = new T.SphereGeometry(1, 16, 12);
    this.flameGeometry = new T.ConeGeometry(1, 1, 9, 3);
  }
  makeShot() {
    const g = new T.Group();
    const core = new T.Mesh(this.coreGeometry, this.fireMaterial.clone());
    core.material.uniforms.uColor = { value: new T.Color('#ff844b') };
    core.material.fragmentShader = core.material.fragmentShader.replace('uniform float uTime;', 'uniform float uTime;uniform vec3 uColor;').replace('gl_FragColor=vec4(col,1.0);', 'gl_FragColor=vec4(uColor*(2.4+smoothstep(-.6,.8,f)),1.0);');
    g.add(core);
    const shell = new T.Mesh(this.coreGeometry, new T.MeshBasicMaterial({ color: new T.Color("#ff7027").multiplyScalar(2), transparent: true, opacity: 0.19, blending: T.AdditiveBlending, depthWrite: false }));
    shell.scale.setScalar(1.3);
    g.add(shell);
    for (let j = 0; j < 4; j++) {
      const flame = new T.Mesh(this.flameGeometry, core.material);
      flame.position.set(Math.sin(j * 2) * 0.35, 0.55 + j * 0.22, Math.cos(j * 2) * 0.35);
      flame.scale.set(0.4, 1.25, 0.4);
      g.add(flame);
    }
    this.scene.add(g);
    this.objects.push(g);
    return g;
  }
  explosion(pos, amount = 1, color = '#ffcb72') {
    for (let i = 0; i < Math.min(12, amount * 7); i++) this.smoke.push({ p: new T.Vector3(...pos), v: new T.Vector3((Math.random() - 0.5) * 1.8, Math.random() * 0.9 + 0.4, (Math.random() - 0.5) * 1.8), age: 0, life: 1.8 + Math.random() * 0.6, size: 0.18 + Math.random() * 0.12 });
    const ring = new T.Mesh(new T.TorusGeometry(1, 0.018, 5, 64), new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(1.6), transparent: true, opacity: 0.7, blending: T.AdditiveBlending, depthWrite: false }));
    ring.position.fromArray(pos);
    ring.scale.setScalar(0.25);
    this.scene.add(ring);
    this.rings.push({ mesh: ring, age: 0 });
  }
  update(dt, time, shots, particles, camera, quality) {
    this.time = time;
    this.fireMaterial.uniforms.uTime.value = time;
    while (this.objects.length < shots.length) this.makeShot();
    for (let i = 0; i < this.objects.length; i++) {
      const g = this.objects[i], shot = shots[i];
      g.visible = !!shot;
      if (!shot) continue;
      g.children[0].material.uniforms.uTime.value = time;
      g.children[0].material.uniforms.uColor.value.set(shot.color || '#ff844b');
      g.children[1].material.color.set(shot.color || '#ff844b').multiplyScalar(2);
      const fire = shot.element === 'fire';
      for (let j = 2; j < g.children.length; j++) g.children[j].visible = fire || shot.style === 'lance';
      g.position.fromArray(shot.p);
      g.scale.setScalar(shot.size);
      g.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(...shot.v).normalize().negate());
      g.children[0].scale.setScalar(1 + Math.sin(time * 25 + i) * 0.06);
      if (shot.style === 'lance') g.children[0].scale.set(.65, 2.6, .65);
      if (shot.element === 'earth' || shot.element === 'wood') g.children[0].scale.set(1, 1.4, 1);
    }
    for (let i = 0; i < this.lights.length; i++) {
      const shot = shots[i], l = this.lights[i];
      l.intensity = shot ? 18 * shot.size : 0;
      if (shot) l.position.fromArray(shot.p);
      if (shot) l.color.set(shot.color || '#ff844b');
    }
    const geo = this.sparks.geometry, n = Math.min(particles.length, this.sparkCapacity);
    geo.setDrawRange(0, n);
    for (let i = 0; i < n; i++) {
      const p = particles[i];
      geo.attributes.position.setXYZ(i, ...p.p);
      geo.attributes.color.setXYZ(i, ...p.color);
      geo.attributes.aSize.setX(i, p.size * (0.4 + 0.6 * p.life / p.max));
      geo.attributes.aAlpha.setX(i, p.life / p.max);
    }
    for (const a of Object.values(geo.attributes)) a.needsUpdate = true;
    for (let i = this.smoke.length - 1; i >= 0; i--) {
      const p = this.smoke[i];
      p.age += dt;
      p.p.addScaledVector(p.v, dt);
      p.v.multiplyScalar(Math.exp(-dt * 0.8));
      if (p.age > p.life) this.smoke.splice(i, 1);
    }
    if (this.smoke.length > 180) this.smoke.splice(0, this.smoke.length - 180);
    const sg = this.smokePoints.geometry;
    sg.setDrawRange(0, this.smoke.length);
    for (let i = 0; i < this.smoke.length; i++) {
      const p = this.smoke[i];
      sg.attributes.position.setXYZ(i, p.p.x, p.p.y, p.p.z);
      sg.attributes.aSize.setX(i, p.size + p.age * 0.4);
      sg.attributes.aAlpha.setX(i, Math.sin(p.age / p.life * Math.PI) * 0.42);
    }
    for (const a of Object.values(sg.attributes)) a.needsUpdate = true;
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.age += dt;
      r.mesh.quaternion.copy(camera.quaternion);
      r.mesh.scale.setScalar(0.25 + r.age * 3);
      r.mesh.material.opacity = Math.max(0, 0.6 - r.age * 1.2);
      if (r.age > 0.5) {
        this.scene.remove(r.mesh);
        r.mesh.geometry.dispose();
        r.mesh.material.dispose();
        this.rings.splice(i, 1);
      }
    }
  }
  reset() {
    this.objects.forEach((o) => o.visible = false);
    this.smoke.length = 0;
    this.rings.forEach((r) => {
      this.scene.remove(r.mesh);
      r.mesh.geometry.dispose();
      r.mesh.material.dispose();
    });
    this.rings.length = 0;
    this.lights.forEach((l) => l.intensity = 0);
  }
  setPixelRatio(dpr) {
    this.sparks.material.uniforms.uPixelRatio.value = dpr;
    this.smokePoints.material.uniforms.uPixelRatio.value = dpr;
  }
}
