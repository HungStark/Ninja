import * as T from 'three';

const clamp=T.MathUtils.clamp,hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const visible=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
const CELL=2,MAX_FLAKES=2800;
export const snowCoverOpacity=amount=>clamp(Math.floor(amount*10+1e-6)/10,0,1);
const LAYERS=[
  {name:'far',share:.52,size:1.5,speed:.75,opacity:.32},
  {name:'middle',share:.34,size:2.7,speed:1.25,opacity:.51},
  {name:'near',share:.14,size:4.1,speed:1.9,opacity:.46}
];

// A small XZ grid reuses the actual scenery triangles. No physics bodies or
// gameplay colliders are added. Falling trajectories query it only on respawn.
export class SnowSurfaces {
  constructor(sources=()=>[],floor=()=>0){
    this.sources=sources;this.floor=floor;this.entries=[];this.grid=new Map();this.groundGrid=new Map();this.groundEntries=[];this.groundTemplates=new Map();this.revision=0;
    this.ray=new T.Ray();this.hit=new T.Vector3();
  }
  insert(grid,t){
    const limitX=t.source.userData.snowSurface==='water'?32:25;
    const minX=Math.max(-limitX,Math.min(t.a.x,t.b.x,t.c.x)),maxX=Math.min(limitX,Math.max(t.a.x,t.b.x,t.c.x)),minZ=Math.max(-43,Math.min(t.a.z,t.b.z,t.c.z)),maxZ=Math.min(25,Math.max(t.a.z,t.b.z,t.c.z));
    for(let x=Math.floor(minX/CELL);x<=Math.floor(maxX/CELL);x++)for(let z=Math.floor(minZ/CELL);z<=Math.floor(maxZ/CELL);z++){
      const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(t);
    }
  }
  triangles(mesh,base){
    const p=mesh.geometry.attributes.position,index=mesh.geometry.index,triangles=[],limitX=mesh.userData.snowSurface==='water'?32:25;
    const point=i=>base?new T.Vector3(base[i*3],base[i*3+1],base[i*3+2]).applyMatrix4(mesh.matrixWorld):new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
    for(let i=0;i<(index?.count??p.count);i+=3){
      const a=point(index?index.getX(i):i),b=point(index?index.getX(i+1):i+1),c=point(index?index.getX(i+2):i+2);
      if(Math.min(a.x,b.x,c.x)>limitX||Math.max(a.x,b.x,c.x)<-limitX||Math.min(a.z,b.z,c.z)>25||Math.max(a.z,b.z,c.z)<-43)continue;
      const normal=new T.Vector3().subVectors(b,a).cross(new T.Vector3().subVectors(c,a)).normalize();
      triangles.push({a,b,c,normal,source:mesh});
    }
    return triangles;
  }
  sync(){
    const meshes=[];
    for(const root of this.sources())root.traverse(o=>{if(o.isMesh&&o.userData.snowSurface&&visible(o)){o.updateWorldMatrix(true,false);meshes.push(o);}});
    const signature=meshes.map(o=>o.id+':'+(o.userData.snowSurface==='ground'?0:o.geometry.attributes.position.version)+':'+o.matrixWorld.elements.join(',')).join('|');
    if(signature===this.signature)return false;this.signature=signature;this.revision++;
    this.entries=[];this.grid.clear();this.groundGrid.clear();this.groundEntries=[];
    for(const mesh of meshes){
      if(mesh.userData.snowSurface==='ground'){
        if(!this.groundTemplates.has(mesh))this.groundTemplates.set(mesh,this.triangles(mesh,mesh.userData.snowBasePositions));
        const triangles=this.groundTemplates.get(mesh);this.groundEntries.push(...triangles);for(const t of triangles)this.insert(this.groundGrid,t);
      }else{
        const triangles=this.triangles(mesh);this.entries.push(...triangles);for(const t of triangles)this.insert(this.grid,t);
      }
    }
    return true;
  }
  groundAt(x,z){
    let y=-Infinity;
    for(const t of this.groundGrid.get(Math.floor(x/CELL)+','+Math.floor(z/CELL))||[]){
      const {a,b,c}=t,den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(den)<1e-9)continue;
      const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/den,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/den;
      if(u>=-1e-6&&v>=-1e-6&&u+v<=1.000001)y=Math.max(y,u*a.y+v*b.y+(1-u-v)*c.y);
    }
    return (Number.isFinite(y)?y:-.07)+this.floor(x,z);
  }
  waterAt(x,z){
    for(const t of this.grid.get(Math.floor(x/CELL)+','+Math.floor(z/CELL))||[]){
      if(t.source.userData.snowSurface!=='water')continue;
      const {a,b,c}=t,den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(den)<1e-9)continue;
      const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/den,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/den;
      if(u>=-1e-6&&v>=-1e-6&&u+v<=1.000001)return u*a.y+v*b.y+(1-u-v)*c.y;
    }
    return -Infinity;
  }
  contact(origin,velocity,duration){
    const speed=velocity.length();this.ray.set(origin,velocity.clone().normalize());let time=duration;
    const candidates=new Set(),steps=Math.max(1,Math.ceil(Math.hypot(velocity.x,velocity.z)*duration/CELL));
    for(let i=0;i<=steps;i++){
      const t=duration*i/steps,key=Math.floor((origin.x+velocity.x*t)/CELL)+','+Math.floor((origin.z+velocity.z*t)/CELL);
      for(const triangle of this.grid.get(key)||[])candidates.add(triangle);
    }
    for(const t of candidates)if(this.ray.intersectTriangle(t.a,t.b,t.c,false,this.hit))time=Math.min(time,this.hit.distanceTo(origin)/speed);
    return time;
  }
}

const snowVertex=`
  attribute float coverage;
  varying vec3 vWorld;
  varying float vCoverage;
  void main(){vCoverage=coverage;vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}
`;
const snowFragment=`
  uniform float opacity;
  varying vec3 vWorld;
  varying float vCoverage;
  float noise(vec2 p){return sin(p.x*.73+sin(p.y*1.17))*sin(p.y*.61+sin(p.x*1.31));}
  void main(){
    float n=noise(vWorld.xz);
    float a=vCoverage*opacity;
    if(a<.008)discard;
    gl_FragColor=vec4(mix(vec3(.72,.83,.87),vec3(.91,.95,.96),.64+n*.16),a);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const snowMaterial=()=>new T.ShaderMaterial({transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,uniforms:{opacity:{value:0}},vertexShader:snowVertex,fragmentShader:snowFragment});

function driftGeometry(seed){
  const points=[[0,1,0]],coverage=[1],indices=[],n=11;
  for(let ring=0;ring<2;ring++)for(let j=0;j<n;j++){
    const angle=j/n*Math.PI*2,r=(.72+hash(seed+j*3)*.5)*(ring?1:.57);
    points.push([Math.cos(angle)*r,ring?0:.35+hash(seed+j+37)*.2,Math.sin(angle)*r]);coverage.push(ring?0:.9);
  }
  for(let j=0;j<n;j++){const a=1+j,b=1+(j+1)%n,c=a+n,d=b+n;indices.push(0,b,a,a,b,c,b,d,c);}
  return {points,coverage,indices};
}

export class SnowfallVfx {
  constructor(scene,floor,options={}){
    this.surfaces=new SnowSurfaces(options.snowSurfaces,floor);this.root=new T.Group();this.root.name='snowfall-environment';this.root.visible=false;scene.add(this.root);
    this.cache=Array(MAX_FLAKES);this.cameraDirection=new T.Vector3(0,0,-1);
    this.grassCoverage={value:0};
    if(options.snowGrass){
      const material=options.snowGrass.material,compile=material.onBeforeCompile,key=material.customProgramCacheKey();
      material.onBeforeCompile=(shader,renderer)=>{
        compile.call(material,shader,renderer);shader.uniforms.snowCoverage=this.grassCoverage;
        shader.fragmentShader='uniform float snowCoverage;\n'+shader.fragmentShader;
        shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.88,.93,.95),snowCoverage);');
      };
      material.customProgramCacheKey=()=>key+'-snow-cover';material.needsUpdate=true;
    }
    const geometry=new T.BufferGeometry();
    for(const [name,size] of [['position',3],['flakeSize',1],['flakeOpacity',1]])geometry.setAttribute(name,new T.BufferAttribute(new Float32Array(MAX_FLAKES*size),size).setUsage(T.DynamicDrawUsage));
    geometry.setDrawRange(0,0);
    this.flakes=new T.Points(geometry,new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{pixelRatio:{value:1}},vertexShader:`
      attribute float flakeSize;attribute float flakeOpacity;uniform float pixelRatio;varying float vAlpha;
      void main(){vec4 p=modelViewMatrix*vec4(position,1.);float d=max(1.,-p.z);vAlpha=flakeOpacity*smoothstep(1.8,4.8,d);gl_PointSize=clamp(flakeSize*38./d,1.,5.5)*pixelRatio;gl_Position=projectionMatrix*p;}
    `,fragmentShader:`
      varying float vAlpha;
      void main(){vec2 p=abs(gl_PointCoord-.5);float edge=max(p.x*.87+p.y*.5,p.y);float a=1.-smoothstep(.29,.49,edge);if(a*vAlpha<.01)discard;gl_FragColor=vec4(.91,.96,1.,a*vAlpha);}
    `}));this.flakes.frustumCulled=false;this.root.add(this.flakes);
    const coverGeometry=new T.PlaneGeometry(48,66,32,44);coverGeometry.rotateX(-Math.PI/2);coverGeometry.translate(0,0,-9);
    coverGeometry.setAttribute('coverage',new T.Float32BufferAttribute(Array.from({length:coverGeometry.attributes.position.count},(_,i)=>{
      const p=coverGeometry.attributes.position;return clamp(Math.min(24-Math.abs(p.getX(i)),33-Math.abs(p.getZ(i)+9))/3,0,1);
    }),1));
    this.cover=new T.Mesh(coverGeometry,snowMaterial());this.cover.frustumCulled=false;this.root.add(this.cover);
    // Keep the river overlay separate so transparent water sorts directly
    // behind its coating, including at the intermediate opacity steps.
    this.riverCover=new T.Mesh(new T.BufferGeometry(),snowMaterial());this.riverCover.frustumCulled=false;this.root.add(this.riverCover);
    this.caps=new T.Mesh(new T.BufferGeometry(),snowMaterial());this.caps.frustumCulled=false;this.root.add(this.caps);
    this.driftMesh=new T.Mesh(new T.BufferGeometry(),snowMaterial());this.driftMesh.frustumCulled=false;this.root.add(this.driftMesh);
    this.drifts=Array.from({length:28},(_,i)=>this.drift([(hash(i+1)-.5)*38,0,-36+hash(i+45)*55],i));this.edgeDrifts=[];
    this.lastGroundTime=-Infinity;this.layerCounts=[0,0,0];
  }
  drift(p,seed,scale=[1.1+hash(seed+9)*1.9,.12+hash(seed+12)*.18,.7+hash(seed+7)*1.4]){
    return {p,m:new T.Object3D(),shape:driftGeometry(seed),scale,seed};
  }
  rebuildSurfaces(){
    const positions=[],coverage=[],river=[];this.edgeDrifts=[];const bounds=new Map();
    // Reuse the terrain's tessellation so snow never cuts across a channel bank
    // or floats above the sloped ground at the edge of the arena.
    if(this.surfaces.groundEntries.length){
      const vertices=[],cover=[];
      for(const t of this.surfaces.groundEntries)for(const p of [t.a,t.b,t.c]){
        vertices.push(p.x,p.y,p.z);
        const border=clamp(Math.min(24-Math.abs(p.x),33-Math.abs(p.z+9))/3,0,1),dry=clamp((p.y-this.surfaces.waterAt(p.x,p.z))/.12,0,1);
        cover.push(border*dry);
      }
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('coverage',new T.Float32BufferAttribute(cover,1));
      this.cover.geometry.dispose();this.cover.geometry=geometry;this.coverBase=geometry.attributes.position.array.slice();
    }else if(!this.coverBase)this.coverBase=this.cover.geometry.attributes.position.array.slice();
    for(const t of this.surfaces.entries){
      const {a,b,c,normal,source}=t;
      if(source.userData.snowSurface==='water'){
        if(normal.y>0)for(const p of [a,b,c])river.push(p.x,p.y+.026,p.z);
        continue;
      }
      if(!bounds.has(source))bounds.set(source,new T.Box3());const box=bounds.get(source);box.expandByPoint(a);box.expandByPoint(b);box.expandByPoint(c);
      if(normal.y<.48||source.userData.snowSurface==='water')continue;
      // Long rails need subdivisions for an uneven coating, rocks keep their facets.
      const steps=Math.min(32,Math.max(1,Math.ceil(Math.max(a.distanceTo(b),b.distanceTo(c),c.distanceTo(a))/1.25)));
      const vertex=(u,v)=>{
        const p=a.clone().addScaledVector(new T.Vector3().subVectors(b,a),u/steps).addScaledVector(new T.Vector3().subVectors(c,a),v/steps);
        const depth=.018+(.5+.5*Math.sin(p.x*3.1+p.z*2.7))*.045;
        positions.push(p.x,p.y+depth,p.z);coverage.push(1);
      };
      for(let u=0;u<steps;u++)for(let v=0;v<steps-u;v++){
        vertex(u,v);vertex(u+1,v);vertex(u,v+1);
        if(u+v<steps-1){vertex(u+1,v);vertex(u+1,v+1);vertex(u,v+1);}
      }
    }
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('coverage',new T.Float32BufferAttribute(coverage,1));this.caps.geometry.dispose();this.caps.geometry=geometry;
    const riverGeometry=new T.BufferGeometry();riverGeometry.setAttribute('position',new T.Float32BufferAttribute(river,3));riverGeometry.setAttribute('coverage',new T.Float32BufferAttribute(new Float32Array(river.length/3).fill(1),1));this.riverCover.geometry.dispose();this.riverCover.geometry=riverGeometry;
    // More wind-deposited snow beside the feet of rails and at rock edges.
    for(const [source,box] of bounds){
      if(source.userData.snowSurface==='water')continue;
      const size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3()),alongX=size.x>size.z,long=Math.max(size.x,size.z),short=Math.min(size.x,size.z);
      if(center.y-size.y/2>this.surfaces.groundAt(center.x,center.z)+1.8)continue;
      const count=Math.min(18,Math.max(2,Math.ceil(long/2.3)));
      for(let j=0;j<count&&this.edgeDrifts.length<160;j++){
        const seed=source.id*31+j,p=[center.x,0,center.z],offset=(j+.35+hash(seed)*.3)/count-.5,sign=j%2?1:-1;
        p[alongX?0:2]+=long*offset;p[alongX?2:0]+=sign*(short*.5+.13);
        this.edgeDrifts.push(this.drift(p,seed,alongX?[.7+hash(seed)*.7,.2+hash(seed+2)*.13,.35+hash(seed+1)*.25]:[.35+hash(seed+1)*.25,.2+hash(seed+2)*.13,.7+hash(seed)*.7]));
      }
    }
    this.buildDrifts();
  }
  buildDrifts(){
    const positions=[],coverage=[],indices=[];
    for(const d of [...this.drifts,...this.edgeDrifts]){
      d.offset=positions.length/3;for(let i=0;i<d.shape.points.length;i++){positions.push(0,0,0);coverage.push(d.shape.coverage[i]);}for(const i of d.shape.indices)indices.push(d.offset+i);
    }
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));geometry.setAttribute('coverage',new T.Float32BufferAttribute(coverage,1));geometry.setIndex(indices);this.driftMesh.geometry.dispose();this.driftMesh.geometry=geometry;
  }
  updateGround(amount){
    const p=this.cover.geometry.attributes.position;
    for(let i=0;i<p.count;i++)p.setY(i,(this.surfaces.groundEntries.length?this.coverBase[i*3+1]+this.surfaces.floor(p.getX(i),p.getZ(i)):this.surfaces.groundAt(p.getX(i),p.getZ(i)))+.026);
    p.needsUpdate=true;
    const vertices=this.driftMesh.geometry.attributes.position,coverage=this.driftMesh.geometry.attributes.coverage;
    for(const d of [...this.drifts,...this.edgeDrifts]){
      d.m.visible=true;d.m.position.set(d.p[0],this.surfaces.groundAt(d.p[0],d.p[2])+.03,d.p[2]);
      for(let i=0;i<d.shape.points.length;i++){
        const v=d.shape.points[i],x=d.p[0]+v[0]*d.scale[0],z=d.p[2]+v[2]*d.scale[2];
        const floor=this.surfaces.groundAt(x,z);
        vertices.setXYZ(d.offset+i,x,floor+.028+v[1]*d.scale[1]*(.2+.8*amount),z);
        coverage.setX(d.offset+i,d.shape.coverage[i]*clamp((floor-this.surfaces.waterAt(x,z))/.12,0,1));
      }
    }
    vertices.needsUpdate=coverage.needsUpdate=true;
  }
  particle(i,time,windy,reducedMotion){
    const layerIndex=hash(i+760)<.52?0:hash(i+760)<.86?1:2,layer=LAYERS[layerIndex],speed=layer.speed*(.7+hash(i+4)*.65),duration=34/speed,clock=time+hash(i+1700)*duration,cycle=Math.floor(clock/duration),age=clock-cycle*duration;
    let p=this.cache[i];
    if(!p||p.cycle!==cycle){
      const seed=i+cycle*7919,origin=new T.Vector3(0,24,0),velocity=new T.Vector3((hash(seed+91)-.5)*.18+(windy?(reducedMotion?.22:.85):.06),-speed,(hash(seed+93)-.5)*.1);
      // Partition the volume along the view direction: sparse large flakes in
      // front, smaller slower flakes behind. Existing flakes keep their paths
      // when the camera turns; new flakes enter the new view-depth bands.
      for(let attempt=0;attempt<48;attempt++){
        origin.x=(hash(seed+1+attempt*101)-.5)*44;origin.z=-41+hash(seed+3800+attempt*97)*64;
        const depth=origin.x*this.cameraDirection.x+origin.z*this.cameraDirection.z;
        const fraction=(depth-this.depthMin)/(this.depthMax-this.depthMin||1);
        if(!this.hasCamera||(layerIndex===2?fraction<.24:layerIndex===1?fraction>=.24&&fraction<.6:fraction>=.6))break;
      }
      p={cycle,origin,velocity,contact:this.surfaces.contact(origin,velocity,duration),layerIndex,size:layer.size*(.6+hash(seed+70)*.8),opacity:layer.opacity*(.7+hash(seed+71)*.3),windy,reducedMotion,revision:this.surfaces.revision};this.cache[i]=p;
    }else if(p.windy!==windy||p.reducedMotion!==reducedMotion||p.revision!==this.surfaces.revision){
      const current=p.origin.clone().addScaledVector(p.velocity,age),windSpeed=windy?(reducedMotion?.22:.85):.06,seed=i+cycle*7919;
      p.velocity.x=(hash(seed+91)-.5)*.18+windSpeed;
      p.origin.copy(current).addScaledVector(p.velocity,-age);
      // Wind changes preserve the current position, and a vanished flake stays
      // vanished if scenery moves or a wall is removed later in its fall.
      if(p.contact>age)p.contact=age+this.surfaces.contact(current,p.velocity,duration-age);
      p.windy=windy;p.reducedMotion=reducedMotion;p.revision=this.surfaces.revision;
    }
    p.age=age;return p;
  }
  update({snowing,amount,time,fallTime,boosted,quality=1,reducedMotion=false,camera}){
    this.root.visible=snowing;const opacity=snowing?snowCoverOpacity(amount):0;this.grassCoverage.value=opacity;
    for(const mesh of [this.cover,this.riverCover,this.caps,this.driftMesh]){mesh.material.opacity=opacity;mesh.material.uniforms.opacity.value=opacity;mesh.material.depthWrite=opacity===1;mesh.visible=opacity>0;}
    if(!snowing)return;
    const changed=this.surfaces.sync();if(changed||!this.driftMesh.geometry.attributes.position)this.rebuildSurfaces();
    this.hasCamera=!!camera;
    if(camera){
      camera.getWorldDirection(this.cameraDirection);
      // An overhead camera can point straight down; its screen-up direction
      // still provides a stable front/back partition of the arena.
      if(Math.hypot(this.cameraDirection.x,this.cameraDirection.z)<.05)this.cameraDirection.set(0,0,-1);
      const depths=[[-22,-41],[-22,23],[22,-41],[22,23]].map(([x,z])=>x*this.cameraDirection.x+z*this.cameraDirection.z);this.depthMin=Math.min(...depths);this.depthMax=Math.max(...depths);
    }
    // Terrain and snow-bank vertices run at 8 Hz; the particles remain frame smooth.
    if(changed||time<this.lastGroundTime||time-this.lastGroundTime>=.125){this.updateGround(amount);this.lastGroundTime=time;}
    const baseCount=Math.min(quality===2?480:1220,Math.floor(140+amount*1080+1e-6)),count=baseCount*(boosted?2:1),positions=this.flakes.geometry.attributes.position,sizes=this.flakes.geometry.attributes.flakeSize,alphas=this.flakes.geometry.attributes.flakeOpacity;
    this.layerCounts.fill(0);this.visibleFlakes=0;
    this.flakes.material.uniforms.pixelRatio.value=Math.min(1.5,globalThis.devicePixelRatio||1);
    for(let i=0;i<count;i++){
      const p=this.particle(i,fallTime,boosted,reducedMotion),x=p.origin.x+p.velocity.x*p.age,z=p.origin.z+p.velocity.z*p.age,y=p.origin.y+p.velocity.y*p.age;
      const ground=this.surfaces.groundAt(x,z),fade=clamp((y-ground)/.28,0,1)*clamp((p.contact-p.age)*(-p.velocity.y)/.28,0,1)*clamp(p.age/.35,0,1);
      positions.setXYZ(i,x,y,z);sizes.setX(i,p.size);alphas.setX(i,p.opacity*fade);this.layerCounts[p.layerIndex]++;if(fade>.01)this.visibleFlakes++;
    }
    positions.needsUpdate=sizes.needsUpdate=alphas.needsUpdate=true;this.flakes.geometry.setDrawRange(0,count);
  }
  state(){return {layers:LAYERS.map((p,i)=>({name:p.name,flakes:this.root.visible?this.layerCounts[i]:0,size:p.size,speed:p.speed,opacity:p.opacity})),visibleFlakes:this.root.visible?this.visibleFlakes||0:0,surfaceTriangles:this.caps.geometry.attributes.position?.count/3||0,waterTriangles:this.riverCover.geometry.attributes.position?.count/3||0,coveragePercent:this.root.visible?Math.round(this.cover.material.opacity*100):0,edgeDrifts:this.root.visible?this.edgeDrifts.length:0,drawCalls:this.root.visible?1+[this.cover,this.riverCover,this.caps,this.driftMesh].filter(m=>m.visible&&m.geometry.attributes.position?.count>0).length:0};}
  reset(){this.root.visible=false;this.grassCoverage.value=0;this.cover.material.opacity=0;this.cache.fill(undefined);this.lastGroundTime=-Infinity;for(const d of this.drifts)d.m.visible=false;}
}
