import * as T from 'three';
import { vfxToon } from './vfx-materials.js';

const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const hash=i=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};
const up=new T.Vector3(0,1,0);
export const MIST_ARENA={minX:-16,maxX:16,minZ:-26,maxZ:12,midZ:-7};
export function mistFieldBounds(owner){return {minX:MIST_ARENA.minX,maxX:MIST_ARENA.maxX,minZ:owner==='player'?MIST_ARENA.midZ:MIST_ARENA.minZ,maxZ:owner==='player'?MIST_ARENA.maxZ:MIST_ARENA.midZ};}

export class IceSupportVfx {
  constructor(){
    this.crystal=new T.OctahedronGeometry(1);
    this.flake=new T.IcosahedronGeometry(1,0);
    this.white=new T.MeshBasicMaterial({color:'#e5faff'});
    this.glass=vfxToon('#83d7f1',{transparent:true,opacity:.58,depthWrite:false,side:T.DoubleSide,emissive:'#17465a',emissiveIntensity:.5});
    this.edge=new T.LineBasicMaterial({color:'#dbfaff',transparent:true,opacity:.8,depthWrite:false});
    this.plane=new T.PlaneGeometry(1,1);
    this.fogMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:{value:0},uOpacity:{value:.3},uBounds:{value:new T.Vector4()},uHeight:{value:1.5}},
      vertexShader:'attribute float mistGround;varying vec2 vUv;varying vec3 vWorld;varying float vGround;void main(){vUv=uv;vGround=mistGround;vec4 p=vec4(position,1.);\n#ifdef USE_INSTANCING\np=instanceMatrix*p;\n#endif\nvec4 world=modelMatrix*p;vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}',
      fragmentShader:`
        uniform float uTime;uniform float uOpacity;uniform vec4 uBounds;uniform float uHeight;
        varying vec2 vUv;varying vec3 vWorld;varying float vGround;
        void main(){
          if(vWorld.x<uBounds.x||vWorld.x>uBounds.y||vWorld.z<uBounds.z||vWorld.z>uBounds.w)discard;
          float height=vWorld.y-vGround;
          float cloudTop=uHeight*(1.+.12*sin(vWorld.x*.9+vWorld.z*.12+uTime*.26)+.055*sin(vWorld.x*2.1-vWorld.z*.2-uTime*.19));
          if(height<0.||height>cloudTop)discard;
          vec2 p=vUv-.5;float r=length(p)*2.;
          float billow=.93+.04*sin(p.x*19.+uTime)+.03*sin(p.y*23.-uTime*.7);
          float a=pow(1.-smoothstep(.05,billow,r),.7)*uOpacity;
          float top=1.-smoothstep(cloudTop-.16,cloudTop,height);
          gl_FragColor=vec4(.78,.9,.95,a*top);
        }`});
    this.dummy=new T.Object3D();
  }
  mesh(parent,geometry,material,p=[0,0,0],scale=[1,1,1]){
    const m=new T.Mesh(geometry,material);m.position.fromArray(p);m.scale.fromArray(scale);parent.add(m);return m;
  }
  createBind(){
    const root=new T.Group(),core=new T.Group();root.add(core);
    this.mesh(core,this.crystal,this.glass,[0,0,0],[.28,1.1,.28]);
    this.mesh(core,this.crystal,this.white,[0,0,0],[.06,.8,.06]);
    for(let i=0;i<6;i++){const a=i*Math.PI/3,m=this.mesh(core,this.crystal,this.glass,[Math.cos(a)*.21,-.25,Math.sin(a)*.21],[.08,.65,.08]);m.rotation.z=Math.cos(a)*.28;m.rotation.x=Math.sin(a)*.28;}
    const flakes=new T.InstancedMesh(this.flake,this.white,48);flakes.instanceMatrix.setUsage(T.DynamicDrawUsage);flakes.frustumCulled=false;root.add(flakes);
    root.userData.bind={core,flakes};return root;
  }
  updateBind(root,shot,time,reducedMotion){
    const {core,flakes}=root.userData.bind,charging=shot.phase==='blooming',progress=charging?clamp(shot.releaseAge/shot.releaseAt):1;
    root.position.fromArray(shot.p);root.quaternion.setFromUnitVectors(up,new T.Vector3(...shot.v).normalize());
    core.scale.setScalar(shot.size*(.1+.9*ease(progress))*1.35);core.rotation.y=reducedMotion?0:time*.7;flakes.visible=charging;
    if(!charging)return;
    for(let i=0;i<48;i++){
      const delay=hash(i+17)*.28,t=clamp((progress-delay)/(1-delay)),pull=t*t*t,a=i*2.399,r=1.1+hash(i+28)*1.9;
      this.dummy.position.set(Math.cos(a)*r*(1-pull),(-.7+hash(i+49)*2.6)*(1-pull),Math.sin(a)*r*(1-pull));
      if(!reducedMotion){this.dummy.position.x+=Math.sin(progress*4+i)*.18*(1-t);this.dummy.position.z+=Math.cos(progress*3+i)*.15*(1-t);}
      this.dummy.rotation.set(time+i,i*.7,time*.5);this.dummy.scale.setScalar((.025+hash(i+91)*.035)*(1-.8*pull));this.dummy.updateMatrix();flakes.setMatrixAt(i,this.dummy.matrix);
    }
    flakes.instanceMatrix.needsUpdate=true;
  }
  createWall(){
    const root=new T.Group(),panels=[],glass=this.glass.clone(),edges=this.edge.clone();
    for(let i=0;i<7;i++){
      const h=3.05+(1-Math.abs(i-3)/4)*.9+hash(i+62)*.25,shape=new T.Shape();
      shape.moveTo(-.45,0);shape.lineTo(.45,0);shape.lineTo(.45,h-.46);shape.lineTo(.1,h);shape.lineTo(-.45,h-.22);shape.closePath();
      const geometry=new T.ExtrudeGeometry(shape,{depth:.48,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:1,steps:1});geometry.translate(0,0,-.24);
      const panel=new T.Group();panel.position.set((i-3)*.81,0,(hash(i+4)-.5)*.22);root.add(panel);
      const slab=this.mesh(panel,geometry,glass);slab.userData.ownedGeometry=slab.userData.ownedMaterial=true;
      const rim=new T.LineSegments(new T.EdgesGeometry(geometry,25),edges);rim.userData.ownedGeometry=rim.userData.ownedMaterial=true;panel.add(rim);
      const cracks=[];
      for(let j=0;j<3;j++){const y=.5+j*.85+hash(i*7+j)*.25,x=(hash(i*11+j)-.5)*.5;cracks.push(x,y,.305,x+.18,y+.22,.305,x+.18,y+.22,.305,x-.08,y+.44,.305);}
      const crackGeo=new T.BufferGeometry();crackGeo.setAttribute('position',new T.Float32BufferAttribute(cracks,3));const frost=new T.LineSegments(crackGeo,edges);frost.userData.ownedGeometry=frost.userData.ownedMaterial=true;panel.add(frost);panels.push(panel);
    }
    const chips=new T.InstancedMesh(this.flake,this.white,28);chips.frustumCulled=false;root.add(chips);root.userData.wall={panels,chips,glass,edges};return root;
  }
  updateWall(effect,time,reducedMotion){
    const {panels,chips,glass,edges}=effect.root.userData.wall;
    for(let i=0;i<panels.length;i++)panels[i].scale.y=Math.max(.001,ease((effect.age-i*.04)/.58));
    const fade=clamp(effect.wall.life/.5);glass.opacity=.58*fade;edges.opacity=.8*fade;chips.visible=effect.age<1;
    if(chips.visible)for(let i=0;i<28;i++){
      const t=clamp((effect.age-hash(i+31)*.2)/.8),a=i*2.399;
      this.dummy.position.set((hash(i+66)-.5)*6.2,Math.sin(t*Math.PI)*(.3+hash(i+42)*.6),Math.sin(a)*(.2+t*.45));
      this.dummy.scale.setScalar(.04*(1-t));this.dummy.rotation.set(reducedMotion?0:time*2,i,0);this.dummy.updateMatrix();chips.setMatrixAt(i,this.dummy.matrix);
    }
    chips.instanceMatrix.needsUpdate=true;
  }
  createMist(owner,height=1.5){
    const bounds=mistFieldBounds(owner),root=new T.Group(),cover=new T.Group(),material=this.fogMaterial.clone(),geometry=this.plane.clone(),columns=11,rows=7,layers=3,count=columns*rows*layers;
    geometry.setAttribute('mistGround',new T.InstancedBufferAttribute(new Float32Array(count),1));
    material.uniforms.uBounds.value.set(bounds.minX,bounds.maxX,bounds.minZ,bounds.maxZ);material.uniforms.uHeight.value=height;
    const clouds=new T.InstancedMesh(geometry,material,count);
    clouds.instanceMatrix.setUsage(T.DynamicDrawUsage);clouds.frustumCulled=false;clouds.userData.ownedMaterial=clouds.userData.ownedGeometry=true;cover.add(clouds);root.add(cover);return {root,cover,clouds,material,bounds,height,columns,rows,layers};
  }
  updateMist(fog,actor,camera,time,reducedMotion,floor=()=>0){
    const inside=fog.owner==='player',expand=ease(fog.age/.4),fade=ease(fog.life/.6),{bounds,columns,rows,layers}=fog;
    fog.cover.position.set(0,0,0);fog.material.uniforms.uTime.value=reducedMotion?0:time;
    fog.material.uniforms.uOpacity.value=.12*expand*fade;
    fog.decoy.visible=!inside&&fog.age>.18;fog.decoy.position.fromArray(fog.p);fog.decoy.scale.setScalar(ease((fog.age-.18)/.22));
    const dx=(bounds.maxX-bounds.minX)/(columns-1),dz=(bounds.maxZ-bounds.minZ)/(rows-1),grounds=fog.clouds.geometry.getAttribute('mistGround');
    for(let i=0;i<fog.clouds.count;i++){
      const column=i%columns,row=Math.floor(i/columns)%rows,layer=Math.floor(i/(columns*rows)),drift=reducedMotion?0:Math.sin(time*.3+i)*.24;
      const x=bounds.minX+column*dx+drift,z=bounds.minZ+row*dz+(reducedMotion?0:Math.cos(time*.25+i)*.22),ground=floor(x,z);
      this.dummy.position.set(x,ground+fog.height*(.12+layer/(layers-1)*.6),z);grounds.setX(i,ground);
      if(camera)this.dummy.quaternion.copy(camera.quaternion);else this.dummy.quaternion.identity();
      this.dummy.scale.set(dx*(1.9+hash(i+29)*.2),fog.height*.95,1);this.dummy.updateMatrix();fog.clouds.setMatrixAt(i,this.dummy.matrix);
    }
    grounds.needsUpdate=true;fog.clouds.instanceMatrix.needsUpdate=true;
  }
  dispose(root){
    const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.userData.ownedGeometry&&o.geometry)geometries.add(o.geometry);if(o.userData.ownedMaterial&&o.material)materials.add(o.material);});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.removeFromParent();
  }
}
