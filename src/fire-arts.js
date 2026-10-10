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
      const horn = part(head, this.cone, this.teeth, [side * .65, 1.05, .28], [.18, 1.5, .18]); horn.rotation.x = .65; horn.rotation.z = side * -.3;
      for (let j = 0; j < 4; j++) {
        const tooth = part(head, this.cone, this.teeth, [side * .34, -.32, -1.53 + j * .27], [.08, .27, .08]); tooth.rotation.z = Math.PI;
      }
      const whisker = new T.CatmullRomCurve3([new T.Vector3(side * .48, -.12, -1.5), new T.Vector3(side * 1.55, -.16, -1), new T.Vector3(side * 1.8, .25, .15), new T.Vector3(side * 1.3, .52, 1.15)]);
      part(head, new T.TubeGeometry(whisker, 18, .035, 5, false), this.gold);
      const mane = part(head, this.cone, this.flame, [side * .8, .15, .92], [.65, 2.4, .65]); mane.rotation.x = Math.PI / 2;
    }
    const segments = [];
    for (let j = 0; j < 12; j++) {
      const segment = new T.Group(), size = .85 * (1 - j / 14); g.add(segment);
      part(segment, this.sphere, this.fire, [0, 0, 0], [size, size * .78, .52]);
      part(segment, this.sphere, this.gold, [0, -.32 * size, -.08], [size * .64, size * .17, .49]);
      const spike = part(segment, this.cone, this.flame, [0, size * 1.15, 0], [size * .22, size * 1.4, size * .2]); spike.rotation.x = .4;
      segments.push(segment);
    }
    g.userData.segments = segments;
    const ribbons = new T.Group(); g.add(ribbons); g.userData.ribbons = ribbons;
    this.ribbon(ribbons, 1.2, 6.5, 1.2, 0, this.gold);
    this.ribbon(ribbons, 1.2, 6.5, 1.2, Math.PI, this.red);
    this.sprite(head, 3.8, .22);
    return g;
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
    const huge = style === 'meteor', dragon = style === 'dragon';
    const g = new T.Group(); g.position.fromArray(pos); this.scene.add(g);
    const gold = this.gold.clone(), red = this.red.clone();
    const circle = part(g, this.ring, gold); circle.rotation.x = huge ? -Math.PI / 2 : 0;
    const shell = part(g, this.sphere, red);
    const flames = [];
    for (let j = 0; j < (huge ? 20 : dragon ? 12 : 7); j++) {
      const a = j * 2.399, r = huge ? 2 + (j % 4) * .9 : .2;
      const f = huge ? this.flameSprite(g, 1.8, 2) : part(g, this.cone, this.flame, [0, 0, 0], [.3, 2, .3]);
      f.position.set(Math.cos(a) * r, .7, Math.sin(a) * r);
      flames.push({ mesh: f, a, r });
    }
    const debris = [];
    if (huge) {
      const crater = part(g, this.sigilGeometry, this.sigilMaterial, [0, .02, 0], [radius * 2, radius * 2, 1]); crater.rotation.x = -Math.PI / 2;
      for (let j = 0; j < 12; j++) {
        const a = j * 2.399, mesh = part(g, this.rock, j % 2 ? this.fire : this.ink, [0, .5, 0], [.13, .18, .16]);
        debris.push({ mesh, v: new T.Vector3(Math.cos(a) * (3 + j % 3), 4 + j % 4, Math.sin(a) * (3 + j % 3)) });
      }
    }
    const light = new T.PointLight('#ff9b37', huge ? 45 : 12, huge ? 24 : 7, 2); light.position.y = 1; g.add(light);
    this.bursts.push({ g, circle, shell, flames, debris, light, gold, red, age: 0, radius: huge ? radius : dragon ? 2.4 : 1, life: huge ? 2.4 : .65, huge });
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
  update(dt, time, shots, walls, fighters, quality) {
    for (const m of [this.fire, this.flame, this.wallMaterial, this.shieldMaterial]) m.uniforms.uTime.value = time;
    const live = new Set(shots.filter(s => s.element === 'fire'));
    for (const [shot, art] of this.shots) if (!live.has(shot)) {
      this.disposeGroup(art.g); if (art.marker) this.disposeGroup(art.marker); this.shots.delete(shot);
    }
    for (const shot of live) {
      let art = this.shots.get(shot);
      if (!art) {
        const g = shot.style === 'dragon' ? this.dragon() : shot.style === 'meteor' ? this.meteor() : this.orb(shot.style === 'volley');
        this.scene.add(g); art = { g, marker: shot.style === 'meteor' ? this.marker(shot) : null }; this.shots.set(shot, art);
      }
      const g = art.g;
      g.position.fromArray(shot.p); g.scale.setScalar(shot.size);
      g.quaternion.setFromUnitVectors(forward, new T.Vector3(...shot.v).normalize());
      if (g.userData.ribbons) g.userData.ribbons.rotation.z = time * (shot.style === 'meteor' ? 2 : 5);
      if (g.userData.segments) {
        g.userData.segments.forEach((segment, j) => {
          const z = .6 + j * .47, wave = Math.sin(j * .45 - time * 8);
          segment.position.set(wave * Math.min(1.2, j * .17), Math.cos(j * .38 - time * 6) * j * .025, z);
          segment.rotation.y = Math.cos(j * .45 - time * 8) * .2;
          segment.children[2].visible = quality !== 2 || j % 2 === 0;
        });
        g.userData.jaw.rotation.x = -.12 - Math.sin(time * 10) * .07;
      }
      if (art.marker) {
        art.marker.rotation.y = -time * .4;
        const scale = 1 + Math.sin(time * 9) * .04; art.marker.scale.setScalar(scale);
      }
    }
    const liveWalls = new Set(walls.filter(w => w.life > 0 && w.hp > 0));
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
      if (t >= 1) { this.disposeGroup(b.g); b.gold.dispose(); b.red.dispose(); this.bursts.splice(i, 1); }
    }
  }
  reset() {
    for (const art of this.shots.values()) { this.disposeGroup(art.g); if (art.marker) this.disposeGroup(art.marker); }
    for (const g of this.walls.values()) this.disposeGroup(g);
    for (const g of this.shields.values()) this.disposeGroup(g);
    for (const b of this.bursts) { this.disposeGroup(b.g); b.gold.dispose(); b.red.dispose(); }
    this.shots.clear(); this.walls.clear(); this.shields.clear(); this.bursts.length = 0;
  }
}
