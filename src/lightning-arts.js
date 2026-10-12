import * as T from 'three';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const glow=(color,opacity=1)=>new T.MeshBasicMaterial({color:new T.Color(color).multiplyScalar(1.2),transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide});
const up=new T.Vector3(0,1,0),dummy=new T.Object3D();

export class LightningArts {
  constructor(scene) {
    this.scene=scene;this.shots=new Map();this.fields=new Map();this.shields=new Map();this.bursts=[];
    this.white=glow('#dceaff',.65);this.violet=glow('#9973ff',.4);this.body=glow('#847cff',.42);
    this.birdBody=new T.MeshBasicMaterial({color:'#8975ea',transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false});
    this.shell=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
      uniforms:{uTime:{value:0},uStrength:{value:1}},vertexShader:'varying vec3 p;varying vec3 n;varying vec3 v;void main(){p=position;n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);v=-mv.xyz;gl_Position=projectionMatrix*mv;}',
      fragmentShader:`uniform float uTime;uniform float uStrength;varying vec3 p;varying vec3 n;varying vec3 v;
        void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(v))),3.);
          float arc=pow(max(0.,1.-abs(sin(p.y*17.+sin(p.x*9.+uTime*2.)*2.+p.z*7.))),20.);
          gl_FragColor=vec4(vec3(.42,.30,1.)+arc*vec3(.8,.9,1.),(.025+rim*.16+arc*.18)*uStrength);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>}`});
  }
  mesh(g,geo,mat,p=[0,0,0],s=[1,1,1]) {
    const m=new T.Mesh(geo,mat);m.position.fromArray(p);m.scale.fromArray(s);g.add(m);return m;
  }
  sphere(g,p,s,mat=this.body) {return this.mesh(g,new T.SphereGeometry(1,18,12),mat,p,s);}
  arc(g,points,radius=.025,material=this.white,owned=false) {
    const mesh=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,6,1,true),material,points.length-1);
    const a=new T.Vector3(),b=new T.Vector3(),dir=new T.Vector3();
    for(let i=1;i<points.length;i++) {
      a.fromArray(points[i-1]);b.fromArray(points[i]);dir.subVectors(b,a);
      dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,dir.clone().normalize());
      dummy.scale.set(radius,dir.length()+radius,radius);dummy.updateMatrix();mesh.setMatrixAt(i-1,dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;mesh.userData.ownedMaterial=owned;g.add(mesh);return mesh;
  }
  orbit(g,radius,phase=0) {
    const points=[];
    for(let i=0;i<=24;i++){const a=i/24*Math.PI*2;points.push([Math.cos(a)*radius,Math.sin(a)*radius,Math.sin(a*5+phase)*radius*.09]);}
    return this.arc(g,points,.018);
  }
  orb() {
    const g=new T.Group();this.sphere(g,[0,0,0],[.65,.65,.65]);this.sphere(g,[0,0,0],[.22,.22,.22],this.white);
    const arcs=new T.Group();g.add(arcs);g.userData.arcs=arcs;
    for(let i=0;i<5;i++){const a=this.orbit(arcs,1+i*.035,i);a.rotation.set(i*.71,i*1.13,i*.45);}
    for(let i=0;i<3;i++)this.arc(g,Array.from({length:9},(_,j)=>[Math.sin(j*4+i)*.3,Math.cos(j*3+i)*.3,-j*.45]),.022,this.violet);
    return g;
  }
  lance() {
    const g=new T.Group();
    const shaft=this.mesh(g,new T.CylinderGeometry(.085,.085,8,8),this.violet,[0,0,-.4]);shaft.rotation.x=Math.PI/2;
    const core=this.mesh(g,new T.CylinderGeometry(.025,.025,8,6),this.white,[0,0,-.4]);core.rotation.x=Math.PI/2;
    const tip=this.mesh(g,new T.ConeGeometry(.38,1.9,6),this.violet,[0,0,4.4]);tip.rotation.x=Math.PI/2;
    for(let i=0;i<3;i++)this.arc(g,Array.from({length:18},(_,j)=>[Math.sin(j*2.7+i)*.38,Math.cos(j*3.1+i)*.38,-5.5+j*.55]),.035,this.violet);
    for(const side of [-1,1])this.arc(g,[[0,0,5.3],[side*.8,0,3],[0,0,3.5]],.025);
    return g;
  }
  bird() {
    const g=new T.Group();this.sphere(g,[0,0,0],[.38,.4,1.05],this.birdBody);this.sphere(g,[0,.25,1],[.3,.32,.4],this.birdBody);
    const beak=this.mesh(g,new T.ConeGeometry(.13,.7,6),this.white,[0,.24,1.52]);beak.rotation.x=Math.PI/2;
    for(const side of [-1,1])this.sphere(g,[side*.23,.31,1.2],[.065,.065,.07],this.white);
    const wings=[];g.userData.wings=wings;
    for(const side of [-1,1]) {
      const wing=new T.Group();wing.position.set(side*.25,.06,.25);wing.scale.x=side;g.add(wing);wings.push(wing);
      const shape=new T.Shape();shape.moveTo(0,.2);shape.lineTo(1.3,.7);shape.lineTo(3.1,-.7);shape.lineTo(1.9,-.8);shape.lineTo(1.2,-1.35);shape.lineTo(.4,-.7);shape.closePath();
      const geo=new T.ShapeGeometry(shape);geo.rotateX(Math.PI/2);this.mesh(wing,geo,this.birdBody);
      this.arc(wing,[[0,0,.2],[.8,.05,.6],[1.3,0,.7],[2.1,.08,.15],[3.1,0,-.7],[1.9,0,-.8],[1.2,0,-1.35],[.4,0,-.7],[0,0,.2]],.035);
      for(let i=0;i<6;i++) {
        const x=.6+i*.35,z=.2-i*.13;
        this.arc(wing,[[x,0,z],[x+.25,.07,z-.25],[x+.1,0,z-.85],[x+.3,-.05,z-1.3]],.025,i%2?this.white:this.violet);
      }
    }
    for(let i=0;i<3;i++)this.arc(g,[[0,0,-.6],[(i-1)*.2,.08,-1.2],[(i-1)*.45,0,-2.3],[(i-1)*.3,.1,-3.4]],.035);
    this.arc(g,[[0,.4,1.1],[.12,.45,.5],[-.1,.44,0],[.1,.4,-.7],[0,.25,-1.1]],.035);
    return g;
  }
  birdSummon() {
    const g=new T.Group(),bird=this.bird(),orb=this.orb();
    g.add(orb,bird);g.userData.bird=bird;g.userData.orb=orb;
    return g;
  }
  shield() {
    const g=new T.Group();this.sphere(g,[0,0,0],[1.3,1.8,1.3],this.shell);
    for(let i=0;i<8;i++){const a=this.orbit(g,1.35,i);a.scale.y=1.32;a.rotation.y=i*Math.PI/8;}
    return g;
  }
  field(f) {
    const g=new T.Group();g.position.fromArray(f.p);
    const base=this.mesh(g,new T.CircleGeometry(f.radius,64),glow('#7155cd',.07));base.rotation.x=-Math.PI/2;base.userData.ownedMaterial=true;
    const fieldShell=this.shell.clone();fieldShell.uniforms.uStrength.value=.3;
    const boundary=this.mesh(g,new T.CylinderGeometry(1,1,1,48,6,true),fieldShell,[0,f.height/2,0],[f.radius,f.height,f.radius]);boundary.userData.ownedMaterial=true;g.userData.shell=fieldShell;
    const rings=new T.Group();g.add(rings);g.userData.rings=rings;
    for(const r of [.4,.72,1]){const m=this.mesh(rings,new T.TorusGeometry(f.radius*r,.035,6,80),this.violet,[0,.05,0]);m.rotation.x=Math.PI/2;}
    const arcs=new T.Group();g.add(arcs);g.userData.arcs=arcs;
    for(let i=0;i<10;i++) {
      const a=i*Math.PI/5,x=Math.cos(a)*f.radius,z=Math.sin(a)*f.radius;
      this.arc(arcs,Array.from({length:9},(_,j)=>[x+Math.sin(j*3+i)*.18,j*f.height/10,z+Math.cos(j*4+i)*.18]),.026,this.violet);
    }
    return g;
  }
  thunder(s) {
    const g=new T.Group();g.position.fromArray(s.target);
    const cloud=new T.Group();cloud.position.set(0,s.cloudPoint[1]-s.target[1],0);g.add(cloud);g.userData.cloud=cloud;
    const cloudMat=new T.MeshStandardMaterial({color:'#798491',emissive:'#786bc0',emissiveIntensity:.01,roughness:1});
    for(let i=0;i<13;i++) {
      const a=i*2.399,r=i?3+(i%4)*1.2:0;
      const puff=this.sphere(cloud,[Math.cos(a)*r*1.3,Math.sin(i*1.7)*.9,Math.sin(a)*r*.5],[3.8+(i%3)*.8,1.4+(i%2)*.5,2.1],cloudMat);
      puff.userData.ownedMaterial=i===0;
    }
    g.userData.cloudMat=cloudMat;
    const charge=new T.Group();cloud.add(charge);g.userData.charge=charge;
    const chargeMaterial=glow('#c6caff',.7);g.userData.chargeMaterial=chargeMaterial;
    for(let i=0;i<5;i++)this.arc(charge,Array.from({length:12},(_,j)=>[-6+j*1.05,-1.5+Math.sin(j*2+i)*.6,(i-2)*1.1+Math.sin(j*2.7+i)*.8]),.055,chargeMaterial,i===0);
    const cloudLight=new T.PointLight('#b9afff',0,24,2);cloudLight.position.y=-4;cloud.add(cloudLight);g.userData.cloudLight=cloudLight;
    const marker=this.mesh(g,new T.TorusGeometry(s.blastRadius,.04,6,80),this.violet,[0,.04,0]);marker.rotation.x=Math.PI/2;g.userData.marker=marker;
    const bolt=new T.Group();g.add(bolt);g.userData.bolt=bolt;
    const height=s.cloudPoint[1]-s.target[1],path=Array.from({length:25},(_,i)=>[i===0||i===24?0:Math.sin(i*2.39)*1.05,height*(1-i/24),i===0||i===24?0:Math.cos(i*3.7)*.65]);
    const core=glow('#eff7ff',1),halo=glow('#9778ff',.45);core.color.multiplyScalar(2);halo.color.multiplyScalar(1.8);g.userData.boltMaterials=[core,halo];
    this.arc(bolt,path,.16,core,true);this.arc(bolt,path,.43,halo,true);
    for(let i=0;i<5;i++) {
      const p=path[5+i*3],side=i%2?1:-1;
      this.arc(bolt,[p,[p[0]+side*2,p[1]-2,p[2]+1],[p[0]+side*4,p[1]-3,p[2]-1],[p[0]+side*5.5,p[1]-6,p[2]+2]],.055,halo);
    }
    const light=new T.PointLight('#c2a6ff',0,65,2);light.position.set(0,4,0);g.add(light);g.userData.light=light;
    return g;
  }
  blast(pos,radius=1) {
    const g=new T.Group();g.position.fromArray(pos);
    const material=glow('#bdaaff',.8),ring=this.mesh(g,new T.TorusGeometry(radius,.035,6,64),material,[0,.08,0]);ring.rotation.x=Math.PI/2;ring.userData.ownedMaterial=true;
    for(let i=0;i<10;i++) {
      const a=i*Math.PI/5,r=radius*(.6+(i%3)*.15);
      this.arc(g,[[0,.1,0],[Math.cos(a+.12)*r*.3,.15,Math.sin(a+.12)*r*.3],[Math.cos(a-.12)*r*.7,.12,Math.sin(a-.12)*r*.7],[Math.cos(a)*r,.06,Math.sin(a)*r]],.035,material);
    }
    const light=new T.PointLight('#bdadff',20,15,2);light.position.y=1;g.add(light);
    this.scene.add(g);this.bursts.push({g,material,light,age:0});
  }
  remove(g) {
    this.scene.remove(g);g.traverse(o=>{o.geometry?.dispose();if(o.isInstancedMesh)o.dispose();if(o.userData.ownedMaterial)o.material.dispose();});
  }
  sync(map,live,make,update) {
    const set=new Set(live);for(const [key,g] of map)if(!set.has(key)){this.remove(g);map.delete(key);}
    for(const key of set){if(!map.has(key)){const g=make(key);this.scene.add(g);map.set(key,g);}update(map.get(key),key);}
  }
  update(dt,time,shots,fields,fighters,quality) {
    this.shell.uniforms.uTime.value=time;
    this.sync(this.shots,shots.filter(s=>s.element==='lightning'),s=>s.style==='thunder'?this.thunder(s):s.style==='bird'?this.birdSummon():s.style==='lance'?this.lance():this.orb(),(g,s)=>{
      if(s.style==='thunder') {
        const charged=clamp(s.age/s.chargeTime),strikeAge=s.age-s.strikeTime;
        const flicker=Math.pow(Math.max(0,Math.sin(s.age*37)+Math.sin(s.age*61)*.45),4);
        g.userData.cloudMat.emissiveIntensity=.01+charged*.025+(strikeAge<0?flicker*.35:0);
        g.userData.charge.visible=strikeAge<0;g.userData.charge.rotation.y=Math.floor(s.age*12)*.7;
        g.userData.chargeMaterial.opacity=.12+clamp(flicker)*.8;
        g.userData.bolt.visible=strikeAge>=0&&strikeAge<.85;
        const fade=clamp(1-Math.max(0,strikeAge-.3)/.55);
        g.userData.cloudLight.intensity=strikeAge<0?charged*4+flicker*32:fade*32;
        g.userData.boltMaterials[0].opacity=fade*.9;g.userData.boltMaterials[1].opacity=fade*.4;
        g.userData.light.intensity=strikeAge<0?0:fade*55;g.userData.marker.visible=strikeAge<.85;
        return;
      }
      g.position.fromArray(s.p);g.scale.setScalar(s.size);g.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(...s.v).normalize());
      if(s.style==='bird') {
        const forming=s.phase==='forming',emerge=forming?clamp((s.age-.3)/.65):1;
        const smooth=emerge*emerge*(3-2*emerge),bird=g.userData.bird,orb=g.userData.orb;
        bird.visible=emerge>0;bird.scale.setScalar(Math.max(.001,smooth));bird.position.z=(1-smooth)*-.6;
        bird.userData.wings.forEach((w,i)=>w.rotation.z=(i?1:-1)*(.4+Math.sin(s.age*10)*.25));
        orb.visible=forming;orb.scale.setScalar((.65+Math.min(1,s.age/.25)*.5)*(1-smooth*.85));
        orb.userData.arcs.rotation.set(s.age*3,s.age*5,s.age*4);
      }
      if(g.userData.arcs)g.userData.arcs.rotation.set(time*.7,time*1.3,time*.9);
      if(g.userData.wings)g.userData.wings.forEach((w,i)=>w.rotation.z=(i?1:-1)*(.4+Math.sin(time*10)*.25));
    });
    this.sync(this.fields,fields,f=>this.field(f),(g,f)=>{
      g.scale.setScalar(Math.min(1,f.age/.2,f.life/.4));g.userData.arcs.rotation.y=time*.08;
      g.userData.shell.uniforms.uTime.value=time;
      g.userData.arcs.visible=quality!==2;g.userData.rings.rotation.y=time*.2;
    });
    for(const {owner,fighter,pos} of fighters) {
      const active=fighter.defenseElement==='lightning'&&fighter.shieldTime>0&&fighter.shield>0;
      if(active&&!this.shields.has(owner)){const g=this.shield();this.scene.add(g);this.shields.set(owner,g);}
      const g=this.shields.get(owner);if(g){g.visible=active;g.position.set(pos[0],1.45,pos[2]);g.rotation.y=time*.15;}
    }
    for(let i=this.bursts.length-1;i>=0;i--) {
      const b=this.bursts[i];b.age+=dt;b.g.scale.setScalar(1+b.age*.8);b.material.opacity=Math.max(0,.8-b.age);b.light.intensity=Math.max(0,20*(1-b.age));
      if(b.age>=1){this.remove(b.g);this.bursts.splice(i,1);}
    }
  }
  visualState(shot) {
    const g=this.shots.get(shot);
    if(!g)return null;
    if(shot.style==='bird')return {orbVisible:g.userData.orb.visible,birdVisible:g.userData.bird.visible,birdScale:g.userData.bird.scale.x};
    if(shot.style==='thunder')return {chargeVisible:g.userData.charge.visible,chargeOpacity:g.userData.chargeMaterial.opacity,boltVisible:g.userData.bolt.visible};
    return null;
  }
  reset() {
    for(const map of [this.shots,this.fields,this.shields]){for(const g of map.values())this.remove(g);map.clear();}
    for(const b of this.bursts)this.remove(b.g);this.bursts.length=0;
  }
}
