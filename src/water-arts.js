import * as T from 'three';
import { vfxToon } from './vfx-materials.js';
import { wornSailGeometry, wornFlagGeometry, sailPatchGeometry, sailStitchesGeometry } from './worn-sail.js';

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
      fragmentShader: `uniform float uTime;varying vec3 vNormal;varying vec3 vView;varying vec3 vLocal;
    void main(){
      vec3 n=normalize(vNormal);
      float r=1.-abs(dot(n,normalize(vView)));
      float l=abs(dot(n,normalize(vec3(-.4,.9,.3))));
      vec3 c=vec3(.025,.12,.24);
      if(l>.32)c=vec3(.035,.34,.47);
      if(l>.78 || r>.73)c=vec3(.20,.70,.84);
      float line=step(.965,sin(vLocal.y*5.+vLocal.x*3.-uTime*3.));
      c=mix(c,vec3(.55,.88,.94),line*.35);
      gl_FragColor=vec4(c,.48+step(.73,r)*.22);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
    });
    this.foam = new T.MeshBasicMaterial({ color: '#d9faff', transparent: true, opacity: .72, depthWrite: false });
    this.waveWater = new T.ShaderMaterial({
      transparent: true, depthWrite: true, side: T.DoubleSide,
      uniforms: { uTime: { value: 0 }, uHeight: { value: 5 } },
      vertexShader: `uniform float uTime;uniform float uHeight;varying vec3 vLocal;varying vec3 vNormal;varying vec3 vView;
        void main(){vec3 p=position;float crest=smoothstep(.1,uHeight,p.y);
          p.y+=crest*(sin(p.x*1.4-uTime*2.7)+.4*sin(p.x*3.2+uTime*4.))*.10;
          p.z+=crest*sin(p.x*.9+uTime*2.)*.16;
          vLocal=p;vec4 mv=modelViewMatrix*vec4(p,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);
          gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform float uTime;uniform float uHeight;varying vec3 vLocal;varying vec3 vNormal;varying vec3 vView;
    void main(){
      vec3 n=normalize(vNormal);
      float l=abs(dot(n,normalize(vec3(-.4,.9,.3))));
      float r=1.-abs(dot(n,normalize(vView)));
      vec3 c=vec3(.018,.085,.14);
      if(l>.32)c=vec3(.025,.26,.35);
      if(l>.76)c=vec3(.07,.45,.53);
      if(r>.88)c=vec3(.19,.64,.71);
      float flow=.5+.5*sin(vLocal.x*.85+vLocal.y*.9-vLocal.z*.6-uTime*1.8+sin(vLocal.x*.42-vLocal.y*.7+uTime)*1.6);
      float stream=smoothstep(.88,.925,flow);
      c+=vec3(.025,.07,.08)*stream;
      float crest=.89+.035*sin(vLocal.x*1.8-uTime*3.);
      float foam=step(uHeight*crest,vLocal.y);
      c=mix(c,vec3(.75,.91,.96),foam);
      gl_FragColor=vec4(c,.96);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
    });
    this.waveFoam = new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide, uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `uniform float uTime;varying vec2 vUv;
    float hash(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
    void main(){
      vec2 q=vUv*vec2(48.,18.)+vec2(uTime*.5,-uTime*2.);
      float n=noise(q)+noise(q*1.7+uTime*.35)*.3;
      float edge=smoothstep(0.,.025,vUv.y)*(1.-smoothstep(.32,.70,vUv.y));
      float alpha=edge*smoothstep(.72,.79,n)*.78;if(alpha<.025)discard;
      gl_FragColor=vec4(.82,.95,1.,alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
    });
    this.wood = vfxToon('#805337', { emissive: '#402918', emissiveIntensity: .15 });
    this.deck = vfxToon('#bd8a56', { emissive: '#503319', emissiveIntensity: .12 });
    this.dark = vfxToon('#172936');
    this.sail = vfxToon('#273449', { emissive: '#17202d', emissiveIntensity: .20, side: T.DoubleSide });
    this.weatheredWood = vfxToon('#75614a', { emissive: '#352a1d', emissiveIntensity: .12 });
    this.sailPatch = vfxToon('#666354', { side: T.DoubleSide });
    this.seams = new T.MeshBasicMaterial({ color: '#44352b' });
    this.stitches = new T.LineBasicMaterial({ color: '#a99d80' });
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
    // The deck clears the hull's upper bevel instead of disappearing inside its cap.
    this.mesh(g, new T.BoxGeometry(2.1, .12, 4.2), this.deck, [0, .60, -.15]);
    // Broad boards and a few uneven repairs remain readable from the overhead camera.
    for (let i = 0; i < 11; i++) {
      const z = -2.08 + i * .38;
      const board = this.mesh(g, new T.BoxGeometry(2.04 - (i % 3) * .045, .016, .355), i % 4 === 1 ? this.weatheredWood : this.deck, [0, .668, z]);
      board.rotation.y = (i % 3 - 1) * .008;
      this.mesh(g, new T.BoxGeometry(1.97, .008, .014), this.seams, [0, .68, z + .18]);
    }
    for (const [x, z, angle] of [[-.65, 1.45, .25], [.64, -.85, -.14]]) {
      const repair = this.mesh(g, new T.BoxGeometry(.38, .025, .78), this.weatheredWood, [x, .692, z]);
      repair.rotation.y = angle;
    }
    for (const side of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const height = .5 - (i % 3) * .025, length = side === -1 && i === 3 ? .34 : .78;
        const rail = new T.BoxGeometry(.1, height, length), p = rail.attributes.position;
        for (let j = 0; j < p.count; j++) if (p.getY(j) > 0 && p.getZ(j) > 0 && p.getX(j) * side > 0) p.setY(j, p.getY(j) - .07);
        rail.computeVertexNormals();
        this.mesh(g, rail, i === 3 ? this.weatheredWood : this.wood, [side * 1.06, .47 + height / 2, -1.78 + i * .83]);
      }
      for (let i = 0; i < 3; i++) {
        const cannon = this.mesh(g, new T.CylinderGeometry(.12, .15, .65, 12), this.dark, [side * 1.2, .72, -.9 + i * .9]);
        cannon.rotation.z = Math.PI / 2;
      }
    }
    this.mesh(g, new T.CylinderGeometry(.07, .12, 4.7, 12), this.wood, [0, 2.65, 0]);
    this.mesh(g, new T.BoxGeometry(3.15, .08, .08), this.deck, [0, 4.35, 0]);
    this.mesh(g, wornSailGeometry(), this.sail, [0, 3.05, .04]);
    for (const face of [-1, 1]) {
      this.mesh(g, sailPatchGeometry(face), this.sailPatch, [0, 3.05, .04]);
      const stitches = new T.LineSegments(sailStitchesGeometry(face), this.stitches);
      stitches.position.set(0, 3.05, .04); g.add(stitches);
    }
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
    this.mesh(g, wornFlagGeometry(), this.sail, [.42, 4.85, 0]);
    g.scale.setScalar(.95);
    const wrapper = new T.Group(); wrapper.add(g);
    const wake = new T.Group(); wrapper.add(wake); wrapper.userData.wake = wake;
    const ribbonMaterial = new T.ShaderMaterial({
      transparent: true, depthWrite: false, side: T.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `uniform float uTime;varying vec2 vUv;
        void main(){float edge=sin(vUv.x*3.14159);float flow=.55+.45*sin(vUv.y*35.-uTime*18.);
          gl_FragColor=vec4(.65,.91,1.,edge*(1.-vUv.y)*flow*.38);}`
    });
    for (const side of [-1, 1]) {
      const ribbon = new T.PlaneGeometry(1, 1, 1, 24), p = ribbon.attributes.position, uv = ribbon.attributes.uv;
      for (let i=0;i<p.count;i++) {
        const t=uv.getY(i), width=.08*(1.-t)+.025;
        p.setXYZ(i,side*(.9+t*.85)+(uv.getX(i)-.5)*width,-.76-t*.2,-1.2-t*4.5);
      }
      const m=this.mesh(wake,ribbon,ribbonMaterial); m.userData.ownedMaterial=true;
    }
    const sprayGeo = new T.BufferGeometry();
    sprayGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(48*3),3));
    sprayGeo.setAttribute('alpha',new T.BufferAttribute(new Float32Array(48),1));
    const spray=new T.Points(sprayGeo,new T.ShaderMaterial({
      transparent:true,depthWrite:false,
      vertexShader:'attribute float alpha;varying float vAlpha;void main(){vAlpha=alpha;vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(32./max(.3,-p.z),1.,4.);gl_Position=projectionMatrix*p;}',
      fragmentShader:'varying float vAlpha;void main(){float r=length(gl_PointCoord-.5);gl_FragColor=vec4(.7,.95,1.,(1.-smoothstep(.05,.5,r))*vAlpha);}'
    }));
    spray.frustumCulled=false; spray.userData.ownedMaterial=true; wake.add(spray);
    wake.userData.spray=spray; wake.userData.ribbonMaterial=ribbonMaterial;
    return wrapper;
  }
  wave(shot) {
    const g = new T.Group(), h = shot.height, section = new T.Shape();
    // Closed cross-section: a deep body and an overhanging lip rolling toward the opponent.
    section.moveTo(-3.2, 0);
    section.bezierCurveTo(-2.5,.7,-1.7,h*.4,-1.1,h*.72);
    section.bezierCurveTo(-.9,h*.95,.2,h*1.05,1.3,h*.93);
    section.bezierCurveTo(2.5,h*.82,2.5,h*.62,1.2,h*.52);
    section.bezierCurveTo(.75,h*.52,.8,h*.68,.5,h*.75);
    section.bezierCurveTo(.1,h*.74,-.3,h*.6,-.1,h*.43);
    section.bezierCurveTo(.2,h*.2,1.7,.4,3.1,0); section.closePath();
    const geometry = new T.ExtrudeGeometry(section, { depth: shot.width, steps: 32, bevelEnabled: false, curveSegments: 20 });
    const p = geometry.attributes.position;
    for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getZ(i) - shot.width / 2, p.getY(i), p.getX(i));
    // Swapping axes flips winding; correct it so face normals also point outward.
    for (let i = 0; i < p.count; i += 3) {
      const b = new T.Vector3().fromBufferAttribute(p,i+1), c = new T.Vector3().fromBufferAttribute(p,i+2);
      p.setXYZ(i+1,c.x,c.y,c.z); p.setXYZ(i+2,b.x,b.y,b.z);
    }
    geometry.computeVertexNormals(); this.mesh(g, geometry, this.waveWater);
    const crest = new T.Group(); g.add(crest); g.userData.crest = crest;
    const foamGeo = new T.PlaneGeometry(shot.width, 1, 64, 16), fp = foamGeo.attributes.position;
    for (let i=0;i<fp.count;i++) {
      const t = fp.getY(i)+.5;
      fp.setXYZ(i,fp.getX(i),h*(.96-.35*t)+Math.sin(fp.getX(i)*2.3)*.07, .55+1.5*Math.sin(t*Math.PI*.9));
    }
    foamGeo.computeVertexNormals(); this.mesh(crest,foamGeo,this.waveFoam);
    const backFoam = new T.PlaneGeometry(shot.width,1,64,24), bp=backFoam.attributes.position;
    for(let i=0;i<bp.count;i++) {
      const t=bp.getY(i)+.5,x=bp.getX(i);
      bp.setXYZ(i,x,h*(.94-.72*t)+Math.sin(x*1.8)*.05,-.95-1.8*t+Math.sin(x*2.7)*.04);
    }
    backFoam.computeVertexNormals();this.mesh(crest,backFoam,this.waveFoam);
    for (let j=0;j<5;j++) {
      const points=[];
      for(let i=0;i<40;i++) { const x=-shot.width/2+i*shot.width/39; points.push(new T.Vector3(x,h*.94-j*.16+Math.sin(x*1.8+j)*.06,.8+j*.18)); }
      this.mesh(crest,new T.TubeGeometry(new T.CatmullRomCurve3(points),80,.025+j*.007,4,false),this.foam);
    }
    const sprayGeo=new T.BufferGeometry(), count=160;
    sprayGeo.setAttribute('position',new T.BufferAttribute(new Float32Array(count*3),3));
    const spray=new T.Points(sprayGeo,new T.ShaderMaterial({
      transparent:true,depthWrite:false,
      uniforms:{uPixelRatio:{value:1}},
      vertexShader:'uniform float uPixelRatio;void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(48.*uPixelRatio/max(.3,-p.z),1.,6.);gl_Position=projectionMatrix*p;}',
      fragmentShader:'void main(){float r=length(gl_PointCoord-.5);gl_FragColor=vec4(.8,.95,1.,(1.-smoothstep(.08,.5,r))*.75);}'
    }));
    spray.frustumCulled=false; spray.userData.ownedMaterial=true; crest.add(spray); g.userData.spray=spray;
    const wash = this.mesh(g,new T.PlaneGeometry(shot.width,4,32,8),this.waveFoam,[0,.05,1.4]);
    wash.rotation.x=-Math.PI/2;
    const carried = new T.Group(); g.add(carried); g.userData.carried = carried;
    return g;
  }
  summonPool() {
    const g = new T.Group();
    const material=new T.ShaderMaterial({
      transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{uAge:{value:0}},
      vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`uniform float uAge;varying vec2 vUv;
        void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);
          float edge=1.-smoothstep(.88+.025*sin(a*7.),1.,r);
          float ripple=.5+.5*sin(r*55.-uAge*12.+sin(a*4.)*.7);
          vec3 color=mix(vec3(.025,.20,.32),vec3(.14,.56,.69),ripple*.5);
          gl_FragColor=vec4(color,edge*.85);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    });
    const pool = this.mesh(g,new T.CircleGeometry(3.2,64),material); pool.rotation.x=-Math.PI/2; pool.userData.ownedMaterial=true;
    g.userData.surface=pool;
    const bubbles=new T.Group(); g.add(bubbles); bubbles.visible=false; g.userData.bubbles=bubbles;
    for(let i=0;i<36;i++) {
      const radius=.055+(i%5)*.015, angle=i*2.399, distance=.4+Math.sqrt((i+.5)/36)*2.4;
      const bubble=this.sphere(bubbles,[Math.sin(angle)*distance,.04,Math.cos(angle)*distance],[radius,radius,radius]);
      bubble.userData.radius=radius;
      const ring=this.mesh(bubble,new T.TorusGeometry(.9,.13,5,12),this.foam); ring.rotation.x=-Math.PI/2;
    }
    return this.add(g);
  }
  visualState(shot) {
    const g=this.shots.get(shot);
    return g ? { bodyVisible:g.visible, up:new T.Vector3(0,1,0).applyQuaternion(g.quaternion).toArray(),
      wakeVisible:!!g.userData.wake?.visible, poolVisible:!!g.userData.pool?.visible,
      bubblesVisible:!!(g.userData.pool?.visible && g.userData.pool.userData.bubbles.visible) } : null;
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
    if (g.userData.pool) this.remove(g.userData.pool);
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
    this.waveWater.uniforms.uTime.value = time; this.waveFoam.uniforms.uTime.value = time;
    this.sync(this.shots, shots.filter(s => s.element === 'water'),
      s => { const g = s.style === 'boat' ? this.boat() : s.style === 'tsunami' ? this.wave(s) : this.orb();
        if(['boat','tsunami'].includes(s.style)) g.userData.pool=this.summonPool(); return g; },
      (g, s) => {
        g.position.fromArray(s.p);
        g.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(...s.v).normalize());
        if (!['boat', 'tsunami'].includes(s.style)) { g.scale.setScalar(s.size); g.rotation.z += time * .7; }
        if (s.style === 'boat') {
          // Flight may climb or descend, but the hull and mast always remain upright.
          g.rotation.set(0,Math.atan2(s.v[0],s.v[2]),0);
          const wake=g.userData.wake;wake.visible=s.phase==='flying';wake.userData.ribbonMaterial.uniforms.uTime.value=s.flightAge;
          const positions=wake.userData.spray.geometry.attributes.position,alpha=wake.userData.spray.geometry.attributes.alpha;
          for(let i=0;i<positions.count;i++) {
            const age=(s.flightAge*1.6+i*.618)%1,side=i%2?1:-1;
            positions.setXYZ(i,side*(1.1+age*(.3+(i%4)*.12)),-.73+Math.sin(age*Math.PI)*.23-age*age*.4,.5-(i%6)*.45-age*4.5);
            alpha.setX(i,(1.-age)*.55);
          }
          positions.needsUpdate=true;alpha.needsUpdate=true;
          const pool=g.userData.pool;pool.visible=s.phase==='emerging';pool.position.set(s.origin[0],.14,s.origin[2]);
          pool.scale.setScalar(.25+Math.sin(Math.min(1,s.age/s.riseTime)*Math.PI)*.85);pool.rotation.y=time;
          pool.userData.surface.material.uniforms.uAge.value=s.age;
        }
        if (s.style === 'tsunami') {
          const growth = s.growth;
          const pool=g.userData.pool;pool.visible=s.phase==='gathering';pool.position.set(s.origin[0],.14,s.origin[2]);
          // Start as a bounded puddle at the feet; spread outward as the wave rises.
          pool.scale.setScalar(.14+.36*Math.min(1,s.age/.35)+.5*growth);
          pool.userData.surface.material.uniforms.uAge.value=s.age;
          const bubbles=pool.userData.bubbles;bubbles.visible=s.age>=.35;
          bubbles.children.forEach((bubble,i)=>{
            const cycle=((s.age-.35)*2.3+i*.618)%1, intensity=Math.min(1,(s.age-.35)/.15);
            bubble.position.y=.035+Math.sin(cycle*Math.PI)*(.08+intensity*.19);
            bubble.scale.setScalar(bubble.userData.radius*(.5+Math.sin(cycle*Math.PI)*.8)*Math.max(0,intensity));
          });
          g.visible=growth>0;
          g.scale.set(.16+.84*growth,growth,.16+.84*growth);
          g.userData.crest.position.y=Math.sin(time*4)*.035;
          const spray=g.userData.spray,positions=spray.geometry.attributes.position;
          for(let i=0;i<positions.count;i++) {
            const age=(time*.85+i*.618)%1;
            positions.setXYZ(i,Math.sin(i*2.399)*s.width*.49+Math.sin(i)*age*.5,s.height*.89+age*1.7-age*age*2.4,i%2?1.05+age*(.7+(i%7)*.19):-.85-age*.8);
          }
          positions.needsUpdate=true;
          const carried = g.userData.carried;
          while (carried.children.length < s.carried.length) {
            const material = new T.MeshBasicMaterial({ color: s.carried[carried.children.length].color, transparent: true, opacity: .65 });
            const m = this.sphere(carried, [0, 0, 0], [.2, .2, .2], material); m.userData.ownedMaterial = true;
          }
          carried.children.forEach((m, i) => { m.material.color.set(s.carried[i].color); m.position.set(Math.sin(i * 2.4 + time) * s.width * .35, 1.5 + Math.cos(i * 1.7 + time * 2) * .9, -1.4); });
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
