import * as T from 'three';
import { SHADOW_SHEET } from '../assets/shadow-data.js';

// Match each pose to bong.png; D uses the spread-wing bird selected by the user.
// Q W E / R A S / D F Z / X C V.
export const sealShadowCells = [0, 1, 2, 4, 5, 6, 15, 9, 10, 11, 13, 8];
// V faces the opposite way in the separated sheet.
export const sealShadowFacing = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, -1];
export const shadowDuration = .2;
export const shadowOpacity = .55;
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
    transparent: true, depthWrite: false, depthTest: true,
    uniforms: { uMap: { value: texture }, uBounds: { value: new T.Vector4() }, uOpacity: { value: shadowOpacity } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    // The original white background and eye holes become transparent, preserving the black silhouette.
    fragmentShader: 'uniform sampler2D uMap;uniform vec4 uBounds;uniform float uOpacity;varying vec2 vUv;void main(){vec3 ink=texture2D(uMap,uBounds.xy+vUv*uBounds.zw).rgb;float alpha=(1.0-dot(ink,vec3(.299,.587,.114)))*uOpacity;if(alpha<.01)discard;gl_FragColor=vec4(vec3(.008,.006,.012),alpha);}'
  });
  const mesh = new T.Mesh(new T.PlaneGeometry(1, 1), material);
  mesh.name = 'SealShadow';
  mesh.renderOrder = 0;
  mesh.visible = false;
  scene.add(mesh);
  let age = shadowDuration, cell = -1;
  function show(pose) {
    cell = sealShadowCells[pose] ?? -1;
    if (cell < 0) { clear(); return; }
    const [x, y, w, h] = bounds[cell], pad = 3;
    material.uniforms.uBounds.value.set((x - pad) / 1536, 1 - (y + h + pad) / 1024, (w + pad * 2) / 1536, (h + pad * 2) / 1024);
    // Compensate for the farther plane so the silhouette remains readable behind the hands.
    const size = .4 / Math.max(w, h);
    mesh.scale.set(sealShadowFacing[pose] * (w + pad * 2) * size, (h + pad * 2) * size, 1);
    age = 0;
    material.uniforms.uOpacity.value = shadowOpacity;
    mesh.visible = true;
  }
  function clear() { age = shadowDuration; mesh.visible = false; }
  function update(dt, center) {
    age = Math.min(shadowDuration, age + dt);
    mesh.visible = cell >= 0 && age + 1e-9 < shadowDuration;
    mesh.position.copy(center);
    mesh.position.y += .035;
    // The hands write depth first, so the silhouette cannot paint over their skin or outlines.
    mesh.position.z -= .18;
    material.uniforms.uOpacity.value = shadowOpacity * Math.min(1, Math.max(0, (shadowDuration - age) / .05));
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

export function createHandWater(scene) {
  const material = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uReducedMotion: { value: 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `uniform float uTime;uniform float uReducedMotion;varying vec2 vUv;
      void main(){vec2 p=(vUv-.5)*3.;float r=length(p),a=atan(p.y,p.x);
        float t=uTime*mix(1.,.15,uReducedMotion);
        float edge=1.+.025*sin(a*6.-t*3.)+.015*sin(a*11.+t*2.);
        float flow=.5+.5*sin(a*5.-t*4.+sin(a*8.+t)*.6);
        float ring=1.-smoothstep(.025,.075,abs(r-edge));
        float ripple=(1.-smoothstep(.008,.026,abs(r-edge-.10)))*(.35+.35*flow);
        float glint=pow(flow,8.)*ring;
        float alpha=max(ring*.8,ripple);if(alpha<.015)discard;
        vec3 color=mix(vec3(.03,.36,.9),vec3(.7,1.2,1.5),glint);
        gl_FragColor=vec4(color,alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const mesh = new T.Mesh(new T.PlaneGeometry(1, 1), material);
  mesh.name = 'ReadyHandWater'; mesh.renderOrder = 10; mesh.visible = false; scene.add(mesh);
  const count = 28, geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(count * 3), 3));
  const droplets = new T.Points(geometry, new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    vertexShader: 'void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(3./max(.3,-p.z),1.,8.);gl_Position=projectionMatrix*p;}',
    fragmentShader: 'void main(){float r=length(gl_PointCoord-.5);float a=1.-smoothstep(.15,.5,r);gl_FragColor=vec4(.2,.9,1.4,a*.75);}'
  }));
  droplets.name = 'ReadyHandWaterDroplets'; droplets.frustumCulled = false; droplets.visible = false; scene.add(droplets);
  const light = new T.PointLight('#54caff', 0, 1.5, 2); scene.add(light);
  function setReady(ready) { mesh.visible = droplets.visible = ready; light.intensity = ready ? .035 : 0; }
  function update(time, center, halfWidth, reducedMotion) {
    mesh.position.copy(center); mesh.position.z += .08;
    light.position.copy(center); light.position.z += .2;
    const rx = Math.max(.19, halfWidth + .115), ry = .20;
    mesh.scale.set(rx * 3, ry * 3, 1);
    material.uniforms.uTime.value = time; material.uniforms.uReducedMotion.value = Number(reducedMotion);
    if (!mesh.visible) return;
    for (let i = 0; i < count; i++) {
      const a = i * 2.399 + time * (reducedMotion ? .1 : 1.1), ripple = 1.08 + Math.sin(i + time * 2) * .06;
      geometry.attributes.position.setXYZ(i, center.x + Math.cos(a) * rx * ripple, center.y + Math.sin(a) * ry * ripple, center.z + .1 + Math.sin(a * 2) * .01);
    }
    geometry.attributes.position.needsUpdate = true;
  }
  return { mesh, droplets, light, setReady, update };
}

export function createHandLightning(scene) {
  const material = new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uReducedMotion: { value: 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `uniform float uTime;uniform float uReducedMotion;varying vec2 vUv;
      float zig(float x){return abs(fract(x)-.5)*2.;}
      void main(){
        vec2 p=(vUv-.5)*3.;float r=length(p),a=atan(p.y,p.x)/6.2831853;
        float t=uTime*mix(1.,.12,uReducedMotion);
        float edge=1.+(zig(a*24.+t*2.)-.5)*.11+(zig(a*43.-t*3.)-.5)*.045;
        float core=1.-smoothstep(.006,.022,abs(r-edge));
        float halo=(1.-smoothstep(.015,.095,abs(r-edge)))*.38;
        float branchEdge=edge+.11+(zig(a*17.-t)-.5)*.10;
        float segment=pow(.5+.5*sin(a*6.2831853*7.+t*5.),6.);
        float branch=(1.-smoothstep(.007,.024,abs(r-branchEdge)))*segment;
        float alpha=max(core,max(halo,branch*.75));if(alpha<.015)discard;
        vec3 color=mix(vec3(.38,.12,1.2),vec3(1.25,1.4,1.7),max(core,branch));
        gl_FragColor=vec4(color,alpha*.85);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const mesh = new T.Mesh(new T.PlaneGeometry(1, 1), material);
  mesh.name = 'ReadyHandLightning'; mesh.renderOrder = 10; mesh.visible = false; scene.add(mesh);
  const count = 24, geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(count * 3), 3));
  const sparks = new T.Points(geometry, new T.ShaderMaterial({
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    vertexShader: 'void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(2.2/max(.3,-p.z),1.,6.);gl_Position=projectionMatrix*p;}',
    fragmentShader: 'void main(){float a=1.-smoothstep(.1,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(.8,.65,1.6,a*.75);}'
  }));
  sparks.name = 'ReadyHandLightningSparks'; sparks.frustumCulled = false; sparks.visible = false; scene.add(sparks);
  const light = new T.PointLight('#b9a2ff', 0, 1.5, 2); light.name = 'ReadyHandLightningLight'; scene.add(light);
  function setReady(ready) { mesh.visible = sparks.visible = ready; light.intensity = ready ? .035 : 0; }
  function update(time, center, halfWidth, reducedMotion) {
    mesh.position.copy(center); mesh.position.z += .08;
    light.position.copy(center); light.position.z += .2;
    const rx = Math.max(.19, halfWidth + .115), ry = .20;
    mesh.scale.set(rx * 3, ry * 3, 1);
    material.uniforms.uTime.value = time; material.uniforms.uReducedMotion.value = Number(reducedMotion);
    if (!mesh.visible) return;
    const t = time * (reducedMotion ? .12 : 1);
    for (let i = 0; i < count; i++) {
      const a = i * 2.399 + t * .6, radius = 1.05 + ((t * 1.7 + i * .618) % 1) * .2;
      geometry.attributes.position.setXYZ(i, center.x + Math.cos(a) * rx * radius, center.y + Math.sin(a) * ry * radius, center.z + .1);
    }
    geometry.attributes.position.needsUpdate = true;
  }
  return { mesh, sparks, light, setReady, update };
}

// Match the existing hand rings' placement and readiness gate, with a distinct
// cel palette and motion for wind, shadow and light. Dark ink uses normal alpha
// blending so its dark band remains visible without bloom.
export function createHandElement(scene,element) {
  const kind={wind:0,dark:1,light:2}[element];
  if(kind===undefined)throw new Error('Unsupported hand ring: '+element);
  const colors={wind:'#a7f0cd',dark:'#aa71d5',light:'#ffe7a1'};
  const material=new T.ShaderMaterial({
    transparent:true,depthWrite:false,blending:element==='dark'?T.NormalBlending:T.AdditiveBlending,
    uniforms:{uTime:{value:0},uReducedMotion:{value:0},uKind:{value:kind}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform float uTime;uniform float uReducedMotion;uniform float uKind;varying vec2 vUv;
      float band(float r,float edge,float width){return 1.-smoothstep(width,width+.018,abs(r-edge));}
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);}
      float smokeNoise(vec2 p){return noise(p)*.57+noise(p*2.07+13.2)*.28+noise(p*4.13-7.8)*.15;}
      void main(){
        vec2 p=(vUv-.5)*3.;float r=length(p),a=atan(p.y,p.x);
        float t=uTime*mix(1.,.12,uReducedMotion),alpha;vec3 color;
        if(uKind<.5){
          float edge=1.+.018*sin(a*4.-t*2.4);
          float ring=band(r,edge,.008),gust=0.,mist=0.;
          // Staggered, tapered air currents sweep around the full circumference.
          for(int i=0;i<4;i++){
            float lane=float(i),phase=a-t*(1.8+lane*.19)+lane*1.73;
            float head=.5+.5*cos(phase);
            float tail=smoothstep(.64,.97,head);
            float curve=.90+lane*.074+.035*sin(phase*2.+lane);
            float width=.003+.009*pow(head,5.);
            gust=max(gust,band(r,curve,width)*tail);
            mist=max(mist,(1.-smoothstep(.012,.057,abs(r-curve)))*tail*.22);
          }
          alpha=max(ring*.30,max(gust*.72,mist));
          color=mix(vec3(.19,.56,.40),vec3(.65,.92,.80),gust);
        }else if(uKind<1.5){
          // Advect smoke in circular coordinates so there is no angle seam.
          vec2 orbit=vec2(cos(a+t*.42),sin(a+t*.42));
          float billow=smokeNoise(orbit*5.3+vec2(t*.24,-t*.38));
          float detail=smokeNoise(p*12.+orbit*billow*2.-vec2(t*.3,t*.52));
          float edge=1.+(billow-.5)*.14;
          float spread=.105+billow*.14;
          float cloud=(1.-smoothstep(spread*.32,spread,abs(r-edge)))*smoothstep(.15,.58,detail);
          float ink=band(r,edge,.018),rim=band(r,edge+.024,.006);
          float rimAlpha=rim*(.30+.22*billow);
          float smokeAlpha=cloud*.90;
          alpha=max(smokeAlpha,max(ink*.62,rimAlpha));
          vec3 soot=mix(vec3(.008,.006,.012),vec3(.055,.041,.066),detail);
          color=mix(soot,vec3(.32,.14,.44),rimAlpha/max(.001,alpha));
        }else{
          float ring=band(r,1.,.013),outer=band(r,1.10,.008)*.55;
          float angle=a-t*.4;
          float glint=pow(max(0.,cos(angle*12.)),20.);
          float rays=band(r,1.075,.048)*glint;
          alpha=max(ring*.9,max(outer,rays*.8));
          color=mix(vec3(.78,.51,.14),vec3(1.22,1.12,.78),max(ring,glint));
        }
        if(alpha<.015)discard;gl_FragColor=vec4(color,alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const mesh=new T.Mesh(new T.PlaneGeometry(1,1),material);
  mesh.name='ReadyHand'+element[0].toUpperCase()+element.slice(1);mesh.renderOrder=10;mesh.visible=false;scene.add(mesh);
  const count=element==='dark'?32:12,geometry=new T.BufferGeometry();
  geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(count*3),3));
  geometry.setAttribute('aLife',new T.BufferAttribute(new Float32Array(count),1));
  const motes=new T.Points(geometry,new T.ShaderMaterial({
    transparent:true,depthWrite:false,blending:element==='dark'?T.NormalBlending:T.AdditiveBlending,
    uniforms:{uColor:{value:new T.Color(colors[element])},uKind:{value:kind},uTime:{value:0}},
    vertexShader:`uniform float uKind;attribute float aLife;varying float vLife;
      void main(){vLife=aLife;vec4 p=modelViewMatrix*vec4(position,1.);
        float size=uKind>.5&&uKind<1.5?28.+aLife*36.:2.4;
        gl_PointSize=clamp(size/max(.3,-p.z),1.,uKind>.5&&uKind<1.5?80.:7.);gl_Position=projectionMatrix*p;}`,
    fragmentShader:`uniform vec3 uColor;uniform float uKind;uniform float uTime;varying float vLife;
      void main(){vec2 p=gl_PointCoord-.5;
      if(uKind>.5&&uKind<1.5){
        float a=atan(p.y,p.x),r=length(p);
        float edge=.36+.04*sin(a*5.+uTime*.7+vLife*6.)+.025*cos(a*7.-uTime*.4);
        float cloud=1.-smoothstep(edge*.25,edge,r);
        float fade=sin(vLife*3.14159265);
        gl_FragColor=vec4(.009,.006,.014,cloud*fade*.48);return;
      }
      float r=uKind>1.5?abs(p.x)+abs(p.y):length(p*vec2(1.3,.8));
      float alpha=1.-smoothstep(.1,.48,r);gl_FragColor=vec4(uColor,alpha*(uKind>1.5?.7:.32));}`
  }));
  motes.name=mesh.name+'Motes';motes.frustumCulled=false;motes.visible=false;scene.add(motes);
  const light=new T.PointLight(colors[element],0,1.5,2);light.name=mesh.name+'Light';scene.add(light);
  function setReady(ready){mesh.visible=motes.visible=!!ready;light.intensity=ready ? .025 : 0;}
  function update(time,center,halfWidth,reducedMotion){
    const compact=element!=='light';
    mesh.position.copy(center);mesh.position.y+=compact ? .035 : 0;mesh.position.z+=compact ? -.035 : .08;
    light.position.copy(center);light.position.z+=.2;
    // Keep wind and dark behind the palms, with enough room to surround the hands.
    const rx=compact?Math.max(.21,Math.min(.28,halfWidth+.115)):Math.max(.19,halfWidth+.115),ry=compact ? .17 : .20;
    mesh.scale.set(rx*3,ry*3,1);
    material.uniforms.uTime.value=time;material.uniforms.uReducedMotion.value=Number(reducedMotion);
    if(!mesh.visible)return;
    const t=time*(reducedMotion ? .12 : 1),speed=element==='wind'?2.1:element==='dark'?-.45:.35;
    motes.material.uniforms.uTime.value=t;
    for(let i=0;i<count;i++){
      const life=(t*.38+i*.618)%1;
      const a=i*Math.PI*2/count+t*speed,radius=element==='light'?1.13:element==='dark'?.98+life*.22:1.035+Math.sin(i+t*1.2)*.055;
      geometry.attributes.position.setXYZ(i,mesh.position.x+Math.cos(a)*rx*radius,mesh.position.y+Math.sin(a)*ry*radius+(element==='dark'?life*.022:0),mesh.position.z+(compact ? .015 : .02));
      geometry.attributes.aLife.setX(i,life);
    }
    geometry.attributes.position.needsUpdate=true;
    geometry.attributes.aLife.needsUpdate=true;
  }
  return {mesh,motes,light,setReady,update};
}
