import * as T from 'three';

// Water has its own surfaces, foam and solid summoned ship, independent of the fire effects.
export class WaterArts {
  constructor(scene) {
    this.scene = scene;
    this.shots = new Map(); this.walls = new Map(); this.shields = new Map(); this.prisons = new Map();
    this.water = new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `uniform float uTime; varying vec3 vNormal; varying vec3 vView; varying vec3 vLocal;
        void main(){vLocal=position;vec3 p=position+normal*.035*sin(position.y*9.+position.x*5.+uTime*5.);
        vec4 mv=modelViewMatrix*vec4(p,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);
        gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform float uTime; varying vec3 vNormal; varying vec3 vView; varying vec3 vLocal;
        void main(){float rim=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),2.);
        float ripple=.5+.5*sin(vLocal.y*13.+vLocal.x*7.-uTime*4.);
        vec3 color=mix(vec3(.025,.23,.48),vec3(.35,.85,1.),rim*.8+ripple*.15);
        gl_FragColor=vec4(color,.18+rim*.5+ripple*.07);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`
    });
    this.foam = new T.MeshBasicMaterial({ color: '#d9faff', transparent: true, opacity: .72, depthWrite: false });
    this.wood = new T.MeshStandardMaterial({ color: '#623927', emissive: '#623927', emissiveIntensity: .45, roughness: .86 });
    this.deck = new T.MeshStandardMaterial({ color: '#ad7950', emissive: '#ad7950', emissiveIntensity: .25, roughness: .8 });
    this.dark = new T.MeshStandardMaterial({ color: '#172936', roughness: .6 });
    this.sail = new T.MeshStandardMaterial({ color: '#17202d', emissive: '#17202d', emissiveIntensity: .45, side: T.DoubleSide, roughness: .9 });
  }
  mesh(g, geometry, material, position = [0, 0, 0], scale = [1, 1, 1]) {
    const m = new T.Mesh(geometry, material); m.position.fromArray(position); m.scale.fromArray(scale); g.add(m); return m;
  }
  sphere(g, p, scale, material = this.water) { return this.mesh(g, new T.SphereGeometry(1, 24, 16), material, p, scale); }
  shell(prison = false) {
    const g = new T.Group();
    this.sphere(g, [0, 0, 0], prison ? [1.45, 1.9, 1.45] : [1.25, 1.7, 1.25]);
    const rings = new T.Group(); g.add(rings); g.userData.rings = rings;
    for (let i = 0; i < 3; i++) {
      const ring = this.mesh(rings, new T.TorusGeometry(prison ? 1.48 : 1.28, .025, 6, 64), this.foam);
      ring.rotation.set(Math.PI / 2 + i * .6, i * 1.1, 0); ring.scale.y = 1.25;
    }
    return g;
  }
  orb() {
    const g = new T.Group(); this.sphere(g, [0, 0, 0], [1, 1, 1]);
    for (let i = 0; i < 3; i++) {
      const ring = this.mesh(g, new T.TorusGeometry(.9, .025, 6, 40), this.foam);
      ring.rotation.set(i * .9, i * .7, i);
    }
    for (let i = 0; i < 8; i++) this.sphere(g, [Math.sin(i * 2) * .8, Math.cos(i * 2) * .8, -1 - i * .28], [.08, .08, .18], this.foam);
    return g;
  }
  boat() {
    const g = new T.Group();
    const hull = new T.Shape();
    hull.moveTo(0, 2.8); hull.bezierCurveTo(1.5, 1.6, 1.6, -1.6, 1.1, -2.5);
    hull.lineTo(-1.1, -2.5); hull.bezierCurveTo(-1.6, -1.6, -1.5, 1.6, 0, 2.8);
    const geo = new T.ExtrudeGeometry(hull, { depth: .95, bevelEnabled: true, bevelThickness: .22, bevelSize: .16, bevelSegments: 2, steps: 1 });
    geo.rotateX(Math.PI / 2); geo.translate(0, .4, 0);
    this.mesh(g, geo, this.wood);
    this.mesh(g, new T.BoxGeometry(2.1, .12, 4.2), this.deck, [0, .44, -.15]);
    for (const side of [-1, 1]) {
      this.mesh(g, new T.BoxGeometry(.1, .5, 4.2), this.wood, [side * 1.06, .72, -.1]);
      for (let i = 0; i < 3; i++) {
        const cannon = this.mesh(g, new T.CylinderGeometry(.12, .15, .65, 12), this.dark, [side * 1.2, .72, -.9 + i * .9]);
        cannon.rotation.z = Math.PI / 2;
      }
    }
    this.mesh(g, new T.CylinderGeometry(.07, .12, 4.7, 12), this.wood, [0, 2.65, 0]);
    this.mesh(g, new T.BoxGeometry(3.15, .08, .08), this.deck, [0, 4.35, 0]);
    const sail = this.mesh(g, new T.PlaneGeometry(2.9, 2.6, 8, 8), this.sail, [0, 3.05, .04]);
    const positions = sail.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) positions.setZ(i, .2 * Math.cos(positions.getX(i)) * Math.cos(positions.getY(i)));
    sail.geometry.computeVertexNormals();
    // A skull and crossed bones make the summoned ship unmistakably a pirate ship.
    for (const face of [-1, 1]) {
      const z = face > 0 ? .32 : -.09;
      this.sphere(g, [0, 3.3, z], [.32, .3, .045], this.foam);
      for (const side of [-1, 1]) this.sphere(g, [side * .12, 3.33, z + face * .05], [.06, .075, .02], this.dark);
      this.mesh(g, new T.BoxGeometry(.28, .16, .06), this.foam, [0, 3.04, z]);
      for (const side of [-1, 1]) {
        const bone = this.mesh(g, new T.BoxGeometry(.9, .055, .05), this.foam, [0, 2.8, z]); bone.rotation.z = side * .45;
      }
    }
    this.mesh(g, new T.PlaneGeometry(.85, .4), this.sail, [.42, 4.85, 0]);
    g.scale.setScalar(.95); g.rotation.y = .35;
    const wrapper = new T.Group(); wrapper.add(g); return wrapper;
  }
  wave(shot) {
    const g = new T.Group(), geometry = new T.PlaneGeometry(shot.width, shot.height, 40, 20);
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = (p.getY(i) + shot.height / 2) / shot.height;
      p.setXYZ(i, p.getX(i), y * shot.height, Math.sin(y * Math.PI * .8) * 1.9 - y * y * 2.2);
    }
    geometry.computeVertexNormals(); this.mesh(g, geometry, this.water);
    const crest = new T.Group(); g.add(crest); g.userData.crest = crest;
    for (let i = 0; i < 33; i++) this.sphere(crest, [-shot.width / 2 + i * shot.width / 32, shot.height - .12, -1], [.3, .17, .35], this.foam);
    for (let i = 0; i < 10; i++) this.sphere(g, [-shot.width / 2 + i * shot.width / 9, .18, .4], [.8, .15, .9], this.water);
    const carried = new T.Group(); g.add(carried); g.userData.carried = carried;
    return g;
  }
  wall(wall) {
    const g = new T.Group();
    this.mesh(g, new T.CircleGeometry(wall.radius, 64), this.water);
    this.mesh(g, new T.TorusGeometry(wall.radius, .045, 8, 64), this.foam);
    for (const r of [.45, .72]) this.mesh(g, new T.TorusGeometry(wall.radius * r, .015, 5, 64), this.foam);
    g.position.fromArray(wall.p); g.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(...wall.normal));
    return g;
  }
  add(g) { this.scene.add(g); return g; }
  remove(g) {
    this.scene.remove(g);
    g.traverse(o => { o.geometry?.dispose(); if (o.userData.ownedMaterial) o.material.dispose(); });
  }
  sync(map, live, make, update) {
    const set = new Set(live);
    for (const [key, g] of map) if (!set.has(key)) { this.remove(g); map.delete(key); }
    for (const key of set) {
      if (!map.has(key)) map.set(key, this.add(make(key)));
      update(map.get(key), key);
    }
  }
  update(dt, time, shots, walls, fighters) {
    this.water.uniforms.uTime.value = time;
    this.sync(this.shots, shots.filter(s => s.element === 'water'),
      s => s.style === 'boat' ? this.boat() : s.style === 'tsunami' ? this.wave(s) : this.orb(),
      (g, s) => {
        g.position.fromArray(s.p);
        g.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(...s.v).normalize());
        if (!['boat', 'tsunami'].includes(s.style)) { g.scale.setScalar(s.size); g.rotation.z += time * .7; }
        if (s.style === 'boat') g.rotation.z += Math.sin(time * 4) * .07;
        if (s.style === 'tsunami') {
          g.userData.crest.children.forEach((m, i) => { m.position.y = s.height - .12 + Math.sin(time * 5 + i * .8) * .12; });
          const carried = g.userData.carried;
          while (carried.children.length < s.carried.length) {
            const material = new T.MeshBasicMaterial({ color: s.carried[carried.children.length].color, transparent: true, opacity: .65 });
            const m = this.sphere(carried, [0, 0, 0], [.2, .2, .2], material); m.userData.ownedMaterial = true;
          }
          carried.children.forEach((m, i) => { m.position.set(Math.sin(i * 2.4 + time) * s.width * .35, 1.5 + Math.cos(i * 1.7 + time * 2) * .9, .3); });
        }
      });
    this.sync(this.walls, walls.filter(w => w.element === 'water' && w.hp > 0 && w.life > 0), w => this.wall(w), (g, w) => { g.scale.setScalar(Math.min(1, w.life * 2)); });
    for (const { owner, fighter, pos } of fighters) {
      for (const [map, active, prison] of [[this.shields, fighter.defenseElement === 'water' && fighter.shieldTime > 0 && fighter.shield > 0, false], [this.prisons, fighter.controlTime > 0, true]]) {
        if (active && !map.has(owner)) map.set(owner, this.add(this.shell(prison)));
        const g = map.get(owner);
        if (g) { g.visible = active; g.position.set(pos[0], 1.5, pos[2]); g.userData.rings.rotation.y = time * (prison ? 1.8 : .7); }
      }
    }
  }
  reset() {
    for (const map of [this.shots, this.walls, this.shields, this.prisons]) { for (const g of map.values()) this.remove(g); map.clear(); }
  }
}
