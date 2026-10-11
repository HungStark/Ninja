import * as T from 'three';
import { canvasTexture } from './materials.js';

const forward = new T.Vector3(0, 0, -1);
const up = new T.Vector3(0, 1, 0);
const additive = (color, opacity = 1) => new T.MeshBasicMaterial({
  color, transparent: true, opacity, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
});
function part(parent, geometry, material, position = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new T.Mesh(geometry, material);
  mesh.position.set(...position); mesh.scale.set(...scale); parent.add(mesh); return mesh;
}

// All fire art is built locally: molten surfaces, sculpted dragons and animated flame curtains.
export class FireArts {
  constructor(scene, glow) {
    this.scene = scene; this.glow = glow;
    this.shots = new Map(); this.walls = new Map(); this.shields = new Map(); this.bursts = [];
    this.sphere = new T.SphereGeometry(1, 16, 12);
    this.rock = new T.IcosahedronGeometry(1, 1);
    this.cone = new T.ConeGeometry(1, 1, 8, 3);
    this.box = new T.BoxGeometry(1, 1, 1);
    this.ring = new T.TorusGeometry(1, .025, 6, 80);
    this.gold = additive('#ffad38', .55);
    this.hot = additive('#ffe29a', .55);
    this.red = additive('#ff491b', .3);
    this.ink = new T.MeshBasicMaterial({ color: '#702116' });
    this.teeth = new T.MeshBasicMaterial({ color: '#ffe6a1' });
    this.meteorStone = new T.MeshStandardMaterial({ color: '#544033', roughness: 1, flatShading: true });
    this.fire = new T.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec3 vLocal; varying vec3 vNormal; uniform float uTime;
        void main(){vLocal=position;vNormal=normal;vec3 p=position+normal*sin(position.y*9.+position.z*8.-uTime*12.)*.045;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader: `varying vec3 vLocal;varying vec3 vNormal;uniform float uTime;
        float wave(vec3 p){return sin(p.x*7.+p.z*5.+uTime*5.)*sin(p.y*9.-p.z*4.-uTime*8.);}
        void main(){float n=wave(vLocal)+.3*wave(vLocal*2.3);float vein=pow(1.-abs(sin(vLocal.y*6.+vLocal.z*4.+n*2.-uTime*3.)),5.);
        vec3 col=mix(vec3(.4,.01,.002),vec3(2.2,.18,.008),smoothstep(-.6,.5,n));
        col=mix(col,vec3(3.,.8,.055),vein*.6);gl_FragColor=vec4(col,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`
    });
    this.flame = new T.ShaderMaterial({
      transparent: true, blending: T.NormalBlending, depthWrite: false, side: T.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec3 vLocal;uniform float uTime;void main(){vLocal=position;
        vec3 p=position;p.x+=sin(position.y*5.+uTime*9.)*max(0.,position.y+.5)*.16;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader: `varying vec3 vLocal;uniform float uTime;void main(){float h=clamp(vLocal.y+.5,0.,1.);
        float n=sin(vLocal.x*15.+vLocal.y*9.-uTime*13.)*.5+.5;
        vec3 c=mix(vec3(2.4,.55,.025),vec3(.9,.035,.002),h);
        gl_FragColor=vec4(c,(1.-h*.8)*(.45+n*.35));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`
    });
    this.wallMaterial = new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.NormalBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv;uniform float uTime;void main(){vUv=uv;vec3 p=position;
        p.y+=sin(position.x*3.+uTime*7.)*uv.y*.18;p.z+=sin(position.x*2.+uTime*5.)*.09;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragmentShader: `varying vec2 vUv;uniform float uTime;void main(){
        float bend=sin(vUv.y*8.-uTime*4.)*.035;
        float flame=sin((vUv.x+bend)*65.+sin(vUv.y*14.-uTime*7.)*2.);
        float top=.67+.18*sin(vUv.x*49.+uTime*8.)+.12*sin(vUv.x*29.-uTime*6.);
        float mask=(1.-smoothstep(top-.12,top,vUv.y))*smoothstep(0.,.05,vUv.x)*(1.-smoothstep(.95,1.,vUv.x));
        vec3 c=mix(vec3(1.1,.025,.001),vec3(2.8,.7,.035),pow(max(0.,flame),3.));
        gl_FragColor=vec4(c,mask*(.2+.45*max(0.,flame)));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`
    });
    this.shieldMaterial = new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec3 vNormal;varying vec3 vView;varying vec3 vLocal;void main(){vLocal=position;
        vec4 mv=modelViewMatrix*vec4(position,1.);vView=-mv.xyz;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `varying vec3 vNormal;varying vec3 vView;varying vec3 vLocal;uniform float uTime;
        void main(){float rim=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),2.);
        float bands=pow(.5+.5*sin(vLocal.y*24.+atan(vLocal.z,vLocal.x)*5.-uTime*4.),12.);
        float a=.025+rim*.35+bands*.08;gl_FragColor=vec4(mix(vec3(2.4,.25,.02),vec3(3.,1.5,.3),bands),a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`
    });
    this.sigil = canvasTexture(256, (c, n) => {
      c.translate(n / 2, n / 2); c.strokeStyle = '#ffc97c'; c.lineWidth = 2;
      for (const r of [76, 105, 115]) { c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke(); }
      for (let i = 0; i < 12; i++) {
        c.save(); c.rotate(i * Math.PI / 6); c.beginPath(); c.moveTo(0, -78); c.lineTo(5, -91); c.lineTo(-5, -94); c.lineTo(0, -102); c.stroke(); c.restore();
      }
      c.font = 'bold 70px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ff9b43'; c.fillText('火', 0, 0);
    });
    this.sigilMaterial = new T.MeshBasicMaterial({ map: this.sigil, transparent: true, opacity: .7, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
    this.sigilGeometry = new T.PlaneGeometry(1, 1);
    this.flameTexture = canvasTexture(128, c => {
      // Curved translucent flame silhouettes soften the geometry of walls and impact plumes.
      const outer = c.createRadialGradient(64, 98, 5, 64, 83, 66);
      outer.addColorStop(0, '#ffe48d'); outer.addColorStop(.35, '#ffb431');
      outer.addColorStop(.7, 'rgba(255,91,13,.8)'); outer.addColorStop(1, 'rgba(220,35,3,0)');
      c.filter = 'blur(2px)'; c.fillStyle = outer;
      c.beginPath(); c.moveTo(65, 3); c.bezierCurveTo(94, 32, 54, 44, 98, 64);
      c.bezierCurveTo(129, 93, 99, 127, 65, 126); c.bezierCurveTo(21, 126, 8, 102, 30, 75);
      c.bezierCurveTo(56, 47, 49, 29, 65, 3); c.fill();
      const core = c.createLinearGradient(0, 65, 0, 126);
      core.addColorStop(0, 'rgba(255,181,55,0)'); core.addColorStop(.55, '#ffcc55'); core.addColorStop(1, '#fff1af');
      c.fillStyle = core; c.beginPath(); c.moveTo(64, 56);
      c.bezierCurveTo(85, 83, 98, 126, 65, 126); c.bezierCurveTo(40, 126, 38, 94, 64, 56); c.fill();
    });
  }
  flameSprite(parent, width, height) {
    const sprite = new T.Sprite(new T.SpriteMaterial({ map: this.flameTexture, transparent: true, opacity: .85, depthWrite: false }));
    sprite.scale.set(width, height, 1); parent.add(sprite); return sprite;
  }
  sprite(parent, size, opacity = .45) {
    const material = new T.SpriteMaterial({ map: this.glow, color: '#ff9d36', transparent: true, opacity, blending: T.AdditiveBlending, depthWrite: false });
    const sprite = new T.Sprite(material); sprite.scale.setScalar(size); parent.add(sprite); return sprite;
  }
  ribbon(parent, turns, length, radius, phase = 0, material = this.gold) {
    const points = Array.from({ length: 40 }, (_, i) => {
      const t = i / 39, a = t * turns * Math.PI * 2 + phase, r = radius * (1 - t * .75);
      return new T.Vector3(Math.cos(a) * r, Math.sin(a) * r, t * length);
    });
    return part(parent, new T.TubeGeometry(new T.CatmullRomCurve3(points), 40, .025, 4, false), material);
  }
  orb(salvo = false) {
    const g = new T.Group();
    part(g, this.sphere, this.fire);
    part(g, this.sphere, this.red, [0, 0, 0], [1.2, 1.2, 1.2]);
    const ribbons = new T.Group(); g.add(ribbons); g.userData.ribbons = ribbons;
    for (let j = 0; j < 3; j++) this.ribbon(ribbons, 1.4, salvo ? 5 : 4, 1.05, j * Math.PI * 2 / 3, j === 0 ? this.hot : this.gold);
    for (let j = 0; j < 5; j++) {
      const f = part(g, this.cone, this.flame, [Math.sin(j * 2) * .42, Math.cos(j * 2) * .42, 1.3 + j * .34], [.5, 2.5, .5]);
      f.rotation.x = Math.PI / 2;
    }
    this.sprite(g, 4.2, .32);
    return g;
  }
  dragon() {
    const g = new T.Group(), head = new T.Group(); g.add(head);
    g.userData.head = head;
    part(head, this.rock, this.fire, [0, .08, -.1], [1, .8, 1.1]);
    part(head, this.box, this.fire, [0, -.05, -1.1], [.95, .48, 1.2]);
    part(head, this.box, this.ink, [0, -.39, -1.05], [.8, .25, 1.18]);
    const jaw = part(head, this.box, this.fire, [0, -.57, -1.05], [.92, .18, 1.25]);
    g.userData.jaw = jaw;
    for (const side of [-1, 1]) {
      const eye = part(head, this.sphere, this.hot, [side * .82, .27, -.64], [.15, .13, .28]);
      eye.rotation.z = side * -.35;
      part(head, this.sphere, this.ink, [side * .87, .29, -.73], [.045, .11, .13]);
      const brow = part(head, this.box, this.fire, [side * .78, .48, -.57], [.18, .15, .65]); brow.rotation.z = side * -.3;
      const horn = part(head, this.cone, this.teeth, [side * .65, .95, .28], [.13, .95, .13]); horn.rotation.x = .65; horn.rotation.z = side * -.3;
      for (let j = 0; j < 4; j++) {
        const tooth = part(head, this.cone, this.teeth, [side * .34, -.32, -1.53 + j * .27], [.08, .27, .08]); tooth.rotation.z = Math.PI;
      }
      const whisker = new T.CatmullRomCurve3([new T.Vector3(side * .48, -.12, -1.5), new T.Vector3(side * 1.55, -.16, -1), new T.Vector3(side * 1.8, .25, .15), new T.Vector3(side * 1.3, .52, 1.15)]);
      part(head, new T.TubeGeometry(whisker, 18, .035, 5, false), this.gold);
      const mane = part(head, this.cone, this.flame, [side * .8, .15, .92], [.28, 1.7, .28]); mane.rotation.x = Math.PI / 2;
      for (let j = 0; j < 3; j++) {
        const flame = this.flameSprite(head, .8, 1.8);
        flame.position.set(side * (.65 + j * .1), .35 + j * .15, .25 + j * .45);
      }
    }
    const segments = [];
    for (let j = 0; j < 26; j++) {
      const segment = new T.Group(), size = .82 * (1 - j / 29); g.add(segment);
      part(segment, this.sphere, this.fire, [0, 0, 0], [size, size * .78, .55]);
      part(segment, this.sphere, this.gold, [0, -.32 * size, -.08], [size * .64, size * .17, .49]);
      const spike = part(segment, this.cone, this.flame, [0, size * 1.15, 0], [size * .22, size * 1.4, size * .2]); spike.rotation.x = .4;
      if (j % 2 === 0) {
        const flame = this.flameSprite(segment, size * 1.4, size * 2.4);
        flame.position.y = size * .65;
      }
      segments.push(segment);
    }
    g.userData.segments = segments;
    const ribbons = new T.Group(); g.add(ribbons); g.userData.ribbons = ribbons;
    this.ribbon(ribbons, 1.7, 11.5, 1.2, 0, this.gold);
    this.ribbon(ribbons, 1.7, 11.5, 1.2, Math.PI, this.red);
    const coil = new T.Group(); g.add(coil); g.userData.coil = coil;
    const embers = [];
    for (let j = 0; j < 28; j++) {
      const flame = this.flameSprite(coil, .5, .95);
      embers.push(flame);
    }
    g.userData.embers = embers;
    this.sprite(head, 3.8, .22);
    return g;
  }
  updateDragon(g, shot, time, quality) {
    const forming = shot.phase === 'forming';
    const grow = Math.min(1, shot.age / (shot.formation * .65));
    const t = forming ? 0 : Math.min(1, shot.flightAge / shot.uncoil);
    const release = t * t * (3 - 2 * t);
    g.scale.setScalar(shot.size * (1 + release * .2));
    const radius = 2.35, angle = .7 + Math.sin(Math.min(shot.age, shot.formation) * 2) * .08;
    const coilPoint = fraction => {
      const a = angle + fraction * Math.PI * 1.87;
      return new T.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, fraction * .15);
    };
    const coilRotation = fraction => {
      const a = angle + fraction * Math.PI * 1.87;
      return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(
        new T.Vector3(0, 0, 1), new T.Vector3(Math.cos(a), Math.sin(a), 0), new T.Vector3(-Math.sin(a), Math.cos(a), 0)));
    };
    g.position.y += .55 * (1 - release);
    const head = g.userData.head;
    head.position.copy(coilPoint(0)).multiplyScalar(1 - release);
    head.quaternion.copy(coilRotation(.16)).slerp(new T.Quaternion(), release);
    head.scale.setScalar(forming ? .45 + .55 * Math.min(1, shot.age / .18) : 1);
    g.userData.segments.forEach((segment, j, segments) => {
      const fraction = (j + 1) / segments.length;
      const z = .65 + j * .43, wave = Math.sin(j * .4 - time * 8);
      const flight = new T.Vector3(wave * Math.min(.9, j * .09), Math.cos(j * .35 - time * 6) * j * .015, z);
      segment.position.copy(coilPoint(fraction)).lerp(flight, release);
      const flightRotation = new T.Quaternion().setFromAxisAngle(up, Math.cos(j * .4 - time * 8) * .15);
      segment.quaternion.copy(coilRotation(fraction)).slerp(flightRotation, release);
      segment.visible = !forming || fraction <= grow;
      segment.scale.setScalar(forming ? Math.min(1, Math.max(.05, (grow - fraction) * 12)) : 1);
      segment.children[2].visible = quality !== 2 || j % 2 === 0;
    });
    g.userData.ribbons.visible = !forming;
    g.userData.ribbons.scale.setScalar(Math.max(.001, release));
    g.userData.coil.visible = release < 1;
    g.userData.coil.scale.setScalar(1 + release * .4);
    g.userData.embers.forEach((flame, j) => {
      const a = j * Math.PI * 2 / 28 + time * .8;
      flame.position.set(Math.cos(a) * (radius + .12), Math.sin(a) * (radius + .12), -.05);
      flame.material.rotation = a - Math.PI / 2;
      flame.material.opacity = (1 - release) * .7 * Math.min(1, grow * 2);
      flame.visible = quality !== 2 || j % 2 === 0;
    });
    g.userData.jaw.rotation.x = -.12 - Math.sin(time * 10) * .07;
  }
  meteor() {
    const g = new T.Group();
    part(g, this.rock, this.fire, [0, 0, 0], [1, .95, 1.1]);
    for (let j = 0; j < 8; j++) {
      const a = j * 2.4;
      const shard = part(g, this.rock, this.ink, [Math.cos(a) * .79, Math.sin(a) * .72, Math.cos(j * 3) * .72], [.36, .32, .4]);
      shard.rotation.set(j, j * .7, j * .3);
    }
    part(g, this.sphere, this.red, [0, 0, 0], [1.3, 1.3, 1.3]);
    const ribbons = new T.Group(); g.add(ribbons); g.userData.ribbons = ribbons;
    for (let j = 0; j < 4; j++) this.ribbon(ribbons, .8, 9, 1.25, j * Math.PI / 2, j % 2 ? this.gold : this.hot);
    for (let j = 0; j < 8; j++) {
      const f = part(g, this.cone, this.flame, [Math.cos(j * 2) * .55, Math.sin(j * 2) * .55, 2 + j * .55], [.65, 4.5, .65]); f.rotation.x = Math.PI / 2;
    }
    this.sprite(g, 6.5, .5);
    return g;
  }
  marker(shot) {
    const g = new T.Group(); g.position.fromArray(shot.target); this.scene.add(g);
    const sigil = part(g, this.sigilGeometry, this.sigilMaterial, [0, .03, 0], [shot.blastRadius * 2, shot.blastRadius * 2, 1]); sigil.rotation.x = -Math.PI / 2;
    const circle = part(g, this.ring, this.gold); circle.rotation.x = -Math.PI / 2; circle.scale.setScalar(shot.blastRadius);
    return g;
  }
  meteorCloud(shot) {
    const g = new T.Group(); g.position.fromArray(shot.cloudPoint); this.scene.add(g);
    const material = new T.MeshLambertMaterial({ color: '#ece5d7', transparent: true, opacity: .88, depthWrite: false });
    const puffs = [];
    for (let j = 0; j < 29; j++) {
      const center = j >= 24, a = j * 2.399, r = center ? (j - 24) * .5 : 6 + Math.floor(j / 8) * 3;
      const mesh = part(g, this.sphere, material, [Math.cos(a) * r, Math.sin(j * 3) * .8, Math.sin(a) * r], [center ? 2.8 : 4.8, center ? 1.8 : 2, center ? 2.8 : 4.1]);
      puffs.push({ mesh, center, a, origin: mesh.position.clone(), scale: mesh.scale.clone() });
    }
    return { g, material, puffs };
  }
  updateMeteorCloud(cloud, shot, quality) {
    const breakTime = shot.cloudBreakTime;
    const age = Math.max(0, shot.age - breakTime), fade = Math.max(0, 1 - age / 1.7);
    cloud.g.visible = fade > 0; cloud.material.opacity = .88 * fade;
    for (const { mesh, center, a, origin, scale } of cloud.puffs) {
      mesh.visible = (!center || age < .32) && (quality !== 2 || center || Math.round(a / 2.399) % 2 === 0);
      const push = age * (center ? 8 : 3.2);
      mesh.position.copy(origin).add(new T.Vector3(Math.cos(a) * push, age * .8, Math.sin(a) * push));
      mesh.scale.copy(scale).multiplyScalar(center ? Math.max(.001, 1 - age / .32) : 1 + age * .12);
    }
  }
  shield() {
    const g = new T.Group(); this.scene.add(g);
    part(g, this.sphere, this.shieldMaterial, [0, 0, 0], [1.25, 1.65, 1.25]);
    const orbit = new T.Group(); g.add(orbit); g.userData.orbit = orbit;
    for (let j = 0; j < 12; j++) {
      const a = j * Math.PI / 6;
      const f = part(orbit, this.cone, this.flame, [Math.cos(a) * 1.15, -.85, Math.sin(a) * 1.15], [.18, .85, .18]); f.rotation.z = -.2;
    }
    const seal = part(g, this.sigilGeometry, this.sigilMaterial, [0, -1.3, 0], [3, 3, 1]); seal.rotation.x = -Math.PI / 2;
    return g;
  }
  wall(wall) {
    const g = new T.Group(); g.position.fromArray(wall.p); this.scene.add(g);
    g.quaternion.setFromUnitVectors(forward, new T.Vector3(...wall.normal));
    part(g, new T.PlaneGeometry(wall.width, wall.height, 28, 16), this.wallMaterial, [0, wall.height / 2, 0]);
    g.userData.flames = [];
    for (let j = 0; j < 17; j++) {
      const height = 2.1 + .6 * Math.sin(j * 2.3), flame = this.flameSprite(g, .9, height);
      flame.position.set((j / 16 - .5) * wall.width, height / 2, 0);
      g.userData.flames.push({ flame, height, phase: j * 2.3 });
    }
    const sigil = part(g, this.sigilGeometry, this.sigilMaterial, [0, .03, 0], [wall.width, 2.5, 1]); sigil.rotation.x = -Math.PI / 2;
    const light = new T.PointLight('#ff7f24', 6, 8, 2); light.position.y = 1; g.add(light); g.userData.light = light;
    return g;
  }
  blast(pos, style = 'orb', radius = 1) {
    if (style === 'meteor') { this.meteorBlast(pos, radius); return; }
    const dragon = style === 'dragon';
    const g = new T.Group(); g.position.fromArray(pos); this.scene.add(g);
    const gold = this.gold.clone(), red = this.red.clone();
    const circle = part(g, this.ring, gold);
    const shell = part(g, this.sphere, red);
    const flames = [];
    for (let j = 0; j < (dragon ? 12 : 7); j++) {
      const a = j * 2.399, r = .2;
      const f = part(g, this.cone, this.flame, [0, 0, 0], [.3, 2, .3]);
      f.position.set(Math.cos(a) * r, .7, Math.sin(a) * r);
      flames.push({ mesh: f, a, r });
    }
    const debris = [];
    const light = new T.PointLight('#ff9b37', 12, 7, 2); light.position.y = 1; g.add(light);
    this.bursts.push({ g, circle, shell, flames, debris, light, gold, red, age: 0, radius: dragon ? 2.4 : 1, life: .65 });
  }
  meteorBlast(pos, radius) {
    const g = new T.Group(); g.position.fromArray(pos); this.scene.add(g);
    const gold = additive('#ffad34', 1), hot = additive('#ffe8b2', 1), red = additive('#ff6317', .8);
    const dustMaterial = new T.MeshLambertMaterial({ color: '#b89a76', transparent: true, opacity: .4, depthWrite: false });
    const scorchMaterial = new T.MeshBasicMaterial({ color: '#392b23', transparent: true, opacity: .5, depthWrite: false });
    const scorch = part(g, new T.CircleGeometry(radius * .9, 48), scorchMaterial, [0, .04, 0]); scorch.rotation.x = -Math.PI / 2;
    const circle = part(g, this.ring, gold, [0, .08, 0]); circle.rotation.x = -Math.PI / 2;
    const core = part(g, this.sphere, hot, [0, .4, 0], [.5, .5, .5]);
    const flash = this.sprite(g, 9, .6); flash.position.y = 1.3;
    const cracks = new T.Group(); g.add(cracks);
    for (let j = 0; j < 14; j++) {
      const a = j * 2.399, length = radius * (1 + (j % 3) * .14);
      const points = Array.from({ length: 6 }, (_, k) => {
        const r = .3 + k / 5 * length, bend = a + Math.sin(j * 9 + k * 3) * .16;
        return new T.Vector3(Math.cos(bend) * r, .08, Math.sin(bend) * r);
      });
      part(cracks, new T.TubeGeometry(new T.CatmullRomCurve3(points), 16, .035, 4, false), gold);
    }
    const rubble = [], debris = [], dust = [], streaks = [], flames = [];
    for (let j = 0; j < 25; j++) {
      const a = j * 2.399, r = .8 + (j % 6) * radius / 6;
      const size = .35 + (j % 4) * .17;
      const mesh = part(g, this.rock, this.meteorStone, [Math.cos(a) * r, size * .35, Math.sin(a) * r], [size * 1.8, size * .7, size * 1.3]);
      mesh.rotation.set(j * .7, j, j * .4);
      rubble.push({ mesh, scale: mesh.scale.clone() });
    }
    for (let j = 0; j < 46; j++) {
      const a = j * 2.399, large = j < 10, r = (j % 5) * .35;
      const size = large ? .6 + (j % 3) * .25 : .12 + (j % 5) * .065;
      const mesh = part(g, this.rock, this.meteorStone, [Math.cos(a) * r, .3, Math.sin(a) * r], [size * .8, size * (large ? 1.6 : 1.1), size]);
      mesh.rotation.set(j * 2, j, j * .7);
      mesh.castShadow = large;
      const ember = part(mesh, this.rock, red, [0, -.25, 0], [.85, .55, .85]);
      const speed = large ? 3.5 + j % 4 : 5 + j % 7;
      debris.push({ mesh, ember, origin: mesh.position.clone(), v: new T.Vector3(Math.cos(a) * speed, large ? 11 + j % 6 : 6 + j % 9, Math.sin(a) * speed), spin: .7 + j % 5 });
    }
    for (let j = 0; j < 20; j++) {
      const a = j * 2.399, r = 1.5 + (j % 4) * .8;
      const mesh = part(g, this.sphere, dustMaterial, [Math.cos(a) * r, .4, Math.sin(a) * r], [1, 1, 1]);
      dust.push({ mesh, a, r, size: 1.2 + (j % 3) * .45 });
    }
    for (let j = 0; j < 42; j++) {
      const a = j * 2.399, speed = 8 + j % 9;
      const v = new T.Vector3(Math.cos(a) * speed, 8 + j % 13, Math.sin(a) * speed);
      const mesh = part(g, this.cone, j % 3 ? gold : hot, [0, .3, 0], [.065, 1, .065]);
      streaks.push({ mesh, v, length: 1.4 + j % 4 * .6 });
    }
    for (let j = 0; j < 9; j++) {
      const a = j * 2.399, mesh = this.flameSprite(g, 2, 5);
      flames.push({ mesh, a, height: 5 + j % 4 });
    }
    const light = new T.PointLight('#ffb35a', 60, 30, 2); light.position.y = 2; g.add(light);
    this.bursts.push({ meteor: true, g, circle, core, flash, scorch, cracks, rubble, debris, dust, streaks, flames, light,
      gold, hot, red, dustMaterial, scorchMaterial, age: 0, radius, life: 4,
      materials: [gold, hot, red, dustMaterial, scorchMaterial] });
  }
  updateMeteorBlast(b, dt, quality) {
    const age = b.age, fade = Math.max(0, 1 - Math.max(0, age - 2.5) / 1.5);
    b.circle.scale.setScalar(.3 + Math.min(b.radius * 1.5, age * 19));
    b.gold.opacity = Math.max(0, 1 - age / 3) * .95;
    b.hot.opacity = Math.max(0, 1 - age / 1);
    b.flash.material.opacity = Math.max(0, 1 - age / .8) * .7;
    b.red.opacity = Math.max(0, 1 - age / 1.3) * .8;
    b.core.scale.set(1 + age * 7, .7 + age * 8, 1 + age * 7); b.core.visible = age < .55;
    b.dustMaterial.opacity = Math.min(.42, age * 1.5) * fade;
    b.scorchMaterial.opacity = .5 * fade; b.cracks.visible = age < 3;
    b.light.intensity = quality === 2 ? 0 : 60 * Math.exp(-age * 3);
    for (const { mesh, scale } of b.rubble) mesh.scale.copy(scale).multiplyScalar(Math.min(1, age * 12) * fade);
    for (const { mesh, ember, origin, v, spin } of b.debris) {
      mesh.position.copy(origin).addScaledVector(v, age); mesh.position.y -= 7 * age * age;
      mesh.rotation.x += dt * spin; mesh.rotation.z += dt * spin * .7;
      mesh.visible = mesh.position.y > 0 && fade > 0; ember.visible = age < 1.3;
    }
    b.dust.forEach(({ mesh, a, r, size }, j) => {
      const spread = r + age * 2.1;
      mesh.position.set(Math.cos(a) * spread, .6 + age * .9, Math.sin(a) * spread);
      const scale = size * (.25 + Math.min(1.6, age * 1.8)); mesh.scale.set(scale * 1.25, scale, scale);
      mesh.visible = quality !== 2 || j % 2 === 0;
    });
    b.streaks.forEach(({ mesh, v, length }, j) => {
      mesh.position.copy(v).multiplyScalar(age); mesh.position.y += .3 - 7 * age * age;
      mesh.quaternion.setFromUnitVectors(up, new T.Vector3(v.x, v.y - 14 * age, v.z).normalize());
      mesh.scale.y = length * Math.max(.05, 1 - age / .9);
      mesh.visible = age < .85 && (quality !== 2 || j % 2 === 0);
    });
    for (const { mesh, a, height } of b.flames) {
      const h = height * Math.sin(Math.min(1, age / .7) * Math.PI);
      mesh.position.set(Math.cos(a) * age * 2, Math.max(0, h) / 2, Math.sin(a) * age * 2);
      mesh.scale.set(2, Math.max(.001, h), 1); mesh.visible = age < .7;
    }
  }
  disposeGroup(g) {
    this.scene.remove(g);
    // Shared materials and primitives remain cached; custom ribbons and sprites are owned by each group.
    const shared = new Set([this.sphere, this.rock, this.cone, this.box, this.ring, this.sigilGeometry]);
    g.traverse(o => {
      if (o.geometry && !shared.has(o.geometry)) o.geometry.dispose();
      if (o.isSprite) o.material.dispose();
    });
  }
  disposeBurst(b) {
    this.disposeGroup(b.g);
    for (const material of b.materials || [b.gold, b.red]) material.dispose();
  }
  update(dt, time, shots, walls, fighters, quality) {
    for (const m of [this.fire, this.flame, this.wallMaterial, this.shieldMaterial]) m.uniforms.uTime.value = time;
    const live = new Set(shots.filter(s => s.element === 'fire'));
    for (const [shot, art] of this.shots) if (!live.has(shot)) {
      this.disposeGroup(art.g); if (art.marker) this.disposeGroup(art.marker);
      if (art.cloud) { this.disposeGroup(art.cloud.g); art.cloud.material.dispose(); }
      this.shots.delete(shot);
    }
    for (const shot of live) {
      let art = this.shots.get(shot);
      if (!art) {
        const g = shot.style === 'dragon' ? this.dragon() : shot.style === 'meteor' ? this.meteor() : this.orb(shot.style === 'volley');
        this.scene.add(g); art = { g, marker: shot.style === 'meteor' ? this.marker(shot) : null,
          cloud: shot.style === 'meteor' ? this.meteorCloud(shot) : null }; this.shots.set(shot, art);
      }
      const g = art.g;
      g.position.fromArray(shot.p); g.scale.setScalar(shot.size);
      if (shot.style === 'meteor' && shot.phase === 'sky') g.scale.multiplyScalar(1 + .35 * Math.max(0, 1 - shot.preludeAge / shot.skyTime));
      g.quaternion.setFromUnitVectors(forward, new T.Vector3(...shot.v).normalize());
      if (shot.phase === 'staged') {
        g.quaternion.identity();
        g.userData.ribbons.visible = false;
        for (const child of g.children) if (child.geometry === this.cone) child.visible = false;
        g.scale.multiplyScalar(.92 + .08 * Math.sin(time * 8 + shot.rowIndex));
      } else {
        if (g.userData.ribbons) g.userData.ribbons.visible = true;
        for (const child of g.children) if (child.geometry === this.cone) child.visible = true;
      }
      if (g.userData.ribbons) g.userData.ribbons.rotation.z = time * (shot.style === 'meteor' ? 2 : 5);
      if (g.userData.segments) {
        this.updateDragon(g, shot, time, quality);
      }
      if (art.marker) {
        art.marker.rotation.y = -time * .4;
        const scale = 1 + Math.sin(time * 9) * .04; art.marker.scale.setScalar(scale);
      }
      if (art.cloud) this.updateMeteorCloud(art.cloud, shot, quality);
    }
    const liveWalls = new Set(walls.filter(w => w.element !== 'water' && w.life > 0 && w.hp > 0));
    for (const [wall, g] of this.walls) if (!liveWalls.has(wall)) { this.disposeGroup(g); this.walls.delete(wall); }
    for (const wall of liveWalls) {
      if (!this.walls.has(wall)) this.walls.set(wall, this.wall(wall));
      const g = this.walls.get(wall); g.scale.y = Math.min(1, wall.life * 2); g.userData.light.intensity = quality === 2 ? 0 : 6;
      for (const { flame, height, phase } of g.userData.flames) {
        const h = height * (1 + Math.sin(time * 9 + phase) * .12);
        flame.scale.y = h; flame.position.y = h / 2;
      }
    }
    for (const { owner, fighter, pos } of fighters) {
      const active = fighter.defenseElement === 'fire' && fighter.shieldTime > 0 && fighter.shield > 0;
      if (active && !this.shields.has(owner)) this.shields.set(owner, this.shield());
      const g = this.shields.get(owner);
      if (g) {
        g.visible = active; g.position.set(pos[0], 1.4, pos[2]);
        g.userData.orbit.rotation.y = time * 1.2;
        g.scale.setScalar(Math.min(1, fighter.shieldTime * 2));
      }
    }
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i]; b.age += dt; const t = b.age / b.life;
      if (b.meteor) {
        this.updateMeteorBlast(b, dt, quality);
        if (t >= 1) { this.disposeBurst(b); this.bursts.splice(i, 1); }
        continue;
      }
      b.circle.scale.setScalar(.25 + Math.min(b.radius * 1.4, b.age * (b.huge ? 10 : 6)));
      b.gold.opacity = Math.max(0, .85 * (1 - t)); b.red.opacity = Math.max(0, .22 * (1 - t * 2));
      b.shell.scale.setScalar(.2 + Math.min(b.radius, b.age * 8));
      b.light.intensity = quality === 2 ? 0 : (b.huge ? 45 : 12) * Math.exp(-b.age * 5);
      for (const { mesh, a, r } of b.flames) {
        const height = (b.huge ? 12 : 2.5) * Math.sin(Math.min(1, b.age / (b.huge ? 1.6 : .5)) * Math.PI);
        mesh.position.set(Math.cos(a) * (r + b.age * .5), height / 2, Math.sin(a) * (r + b.age * .5));
        mesh.scale.set(b.huge ? 1.8 : .2, Math.max(.001, height), b.huge ? 1 : .2);
      }
      for (const { mesh, v } of b.debris) {
        mesh.position.addScaledVector(v, dt); v.y -= dt * 9.8; mesh.rotation.x += dt * 3;
        mesh.visible = mesh.position.y >= 0;
      }
      if (t >= 1) { this.disposeBurst(b); this.bursts.splice(i, 1); }
    }
  }
  reset() {
    for (const art of this.shots.values()) {
      this.disposeGroup(art.g); if (art.marker) this.disposeGroup(art.marker);
      if (art.cloud) { this.disposeGroup(art.cloud.g); art.cloud.material.dispose(); }
    }
    for (const g of this.walls.values()) this.disposeGroup(g);
    for (const g of this.shields.values()) this.disposeGroup(g);
    for (const b of this.bursts) this.disposeBurst(b);
    this.shots.clear(); this.walls.clear(); this.shields.clear(); this.bursts.length = 0;
  }
}
