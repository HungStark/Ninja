import * as T from 'three';
import { vfxToon } from './vfx-materials.js';

const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s);
const unit=v=>mul(v,1/(Math.hypot(...v)||1)),distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const up=new T.Vector3(0,1,0);
const hash=i=>{const x=Math.sin(i*127.1+311.7)*43758.5453;return x-Math.floor(x);};

// Mature plant height follows the arena gate. Growth only scales these models
// down; the forest and its attacks share the same real plant transforms.
export class WoodGarden {
  constructor(scene,floor,intersect=()=>null,gateHeight=8){
    this.scene=scene;this.floor=floor;this.intersect=intersect;this.gardens=[];this.attacks=[];this.clouds=[];this.walnuts=[];this.bindings=[];this.serial=0;this.gateHeight=gateHeight;this.maxPlantHeight=gateHeight*.75;
    this.geo={sphere:new T.IcosahedronGeometry(1,1),stem:new T.CylinderGeometry(1,1,1,7),cone:new T.ConeGeometry(1,1,7),leaf:new T.OctahedronGeometry(1),nut:new T.SphereGeometry(1,18,12)};
    this.mat={bark:vfxToon('#795235'),nut:vfxToon('#b58b50'),ridge:vfxToon('#6d482d'),stem:vfxToon('#438a47'),leaf:vfxToon('#75b94d'),bamboo:vfxToon('#92bd52'),node:vfxToon('#d0ce75'),petal:vfxToon('#b76bb6'),mouth:vfxToon('#3f153f'),poison:vfxToon('#b1e84b')};
    this.mat.canopyDark=vfxToon('#4d863c');this.mat.canopyLight=vfxToon('#8ab954');
    this.mat.bloom=vfxToon('#d9ff95',{emissive:'#baff63',emissiveIntensity:2.2});
    this.mist=new T.MeshBasicMaterial({color:'#ac53d6',transparent:true,opacity:.2,depthWrite:false});
    this.cloudGeometry=new T.PlaneGeometry(1,1);this.cloudMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{opacity:{value:.12}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;vec4 p=vec4(position,1.);\n#ifdef USE_INSTANCING\np=instanceMatrix*p;\n#endif\ngl_Position=projectionMatrix*modelViewMatrix*p;}',fragmentShader:'varying vec2 vUv;uniform float opacity;void main(){float r=length(vUv-.5)*2.;float a=pow(1.-smoothstep(.05,1.,r),1.35)*opacity;gl_FragColor=vec4(.65,.26,.83,a);}'});
    this.dummy=new T.Object3D();
  }
  group(parent=this.scene){const g=new T.Group();parent.add(g);return g;}
  mesh(root,kind,mat,p=[0,0,0],s=[1,1,1]){const m=new T.Mesh(this.geo[kind],this.mat[mat]||mat);m.position.fromArray(p);m.scale.fromArray(s);m.castShadow=m.receiveShadow=true;root.add(m);return m;}
  segment(mesh,a,b,r){const d=sub(b,a);mesh.position.fromArray(mul(add(a,b),.5));mesh.scale.set(r,Math.hypot(...d),r);mesh.quaternion.setFromUnitVectors(up,new T.Vector3(...unit(d)));}
  garden(owner){return this.gardens.find(g=>g.owner===owner);}
  ready(owner){const g=this.garden(owner);return !!g&&g.age+1e-6>=g.readyAt;}
  growth(owner){const g=this.garden(owner);return g?clamp((g.age-g.readyAt)/Math.max(.001,g.spell.growthTime-g.readyAt)):0;}
  multiplier(owner){return 1+2*this.growth(owner);}
  scale(owner){return .28+.72*Math.sqrt(this.growth(owner));}
  canCast(owner,spell){return spell.style==='woodseed'?!this.garden(owner):!spell.requiresGarden||this.ready(owner);}
  empower(owner,spell){
    if(spell.element!=='wood'||spell.style==='woodseed')return spell;
    const growth=this.growth(owner),power=1+2*growth;
    return {...spell,damage:spell.damage*power,shield:Math.round(spell.shield*power),duration:spell.duration?spell.duration+2*growth:undefined,controlDuration:spell.controlDuration?spell.controlDuration+4*growth:undefined,treePower:power,plantScale:this.scale(owner),growth,poisonRadius:2+3*growth};
  }
  plantModel(kind,heightLimit=Infinity,sizeVariation=1){
    const root=new T.Group(),parts={};
    if(kind==='flower'){
      this.mesh(root,'stem','stem',[0,.9,0],[.1,1.8,.1]);
      for(let i=0;i<5;i++){const a=i*2.4,m=this.mesh(root,'leaf','leaf',[Math.cos(a)*.4,.35+i*.25,Math.sin(a)*.4],[.5,.12,.2]);m.rotation.z=Math.cos(a)*.4;}
      const head=this.group(root);head.position.y=1.9;parts.head=head;parts.petals=[];
      this.mesh(head,'sphere','mouth',[0,0,0],[.34,.32,.32]);
      for(let i=0;i<7;i++){const a=i*Math.PI*2/7,m=this.mesh(head,'leaf','petal',[Math.cos(a)*.44,Math.sin(a)*.44,0],[.32,.38,.13]);m.rotation.z=a-Math.PI/2;parts.petals.push(m);}
      this.mesh(head,'sphere','poison',[0,0,.24],[.2,.2,.1]);
      parts.exhale=this.mesh(head,'sphere',this.mist,[0,0,.7],[.5,.5,.9]);parts.exhale.visible=false;
    }else if(kind==='vine'){
      for(let i=0;i<4;i++){const a=i*1.9,m=this.mesh(root,'stem','stem',[Math.cos(a)*.25,.65+i*.12,Math.sin(a)*.25],[.09,1.3+i*.24,.09]);m.rotation.z=Math.cos(a)*.25;}
      for(let i=0;i<10;i++){const a=i*2.4;this.mesh(root,'leaf','leaf',[Math.cos(a)*(.3+i*.025),.2+i*.16,Math.sin(a)*.5],[.48,.16,.22]);}
    }else if(kind==='bamboo'){
      for(let i=0;i<3;i++){const x=(i-1)*.22,z=i%2*.15,h=3.3+i*.24;
        this.mesh(root,'stem','bamboo',[x,h/2,z],[.095,h,.095]);
        for(let j=1;j<6;j++)this.mesh(root,'stem','node',[x,j*h/6,z],[.11,.065,.11]);
        for(let j=0;j<4;j++){const a=j*2.4+i;const m=this.mesh(root,'leaf','leaf',[x+Math.cos(a)*.4,h*.6+j*.14,z+Math.sin(a)*.3],[.48,.055,.12]);m.rotation.z=Math.cos(a)*.4;}
      }
      parts.sprigs=[];parts.volleyOrigins=[];
      for(let i=0;i<3;i++){
        const a=i*2.4+.4,origin=[Math.cos(a)*.8,2.3+i*.24,Math.sin(a)*.65],sprig=this.group(root);
        const branch=this.mesh(sprig,'stem','bloom');this.segment(branch,[0,origin[1]-.25,0],origin,.035);
        for(let j=0;j<2;j++){const leaf=this.mesh(sprig,'leaf','bloom',add(origin,[(j?1:-1)*.16,.08+j*.12,0]),[.4,.07,.13]);leaf.rotation.z=(j?1:-1)*.45;}
        parts.sprigs.push(sprig);parts.volleyOrigins.push(origin);sprig.visible=false;
      }
    }else{
      this.mesh(root,'stem','bark',[0,1.3,0],[.23,2.6,.23]);
      parts.canopy=[];
      for(let layer=0;layer<3;layer++)for(let i=0;i<[7,9,6][layer];i++){
        const id=layer*11+i,a=i*2.399+layer*.8,r=(layer===1?1.05:.75)*(.8+hash(id+64)*.3),y=2.7+layer*.4+(hash(id+93)-.5)*.24;
        const tip=[Math.cos(a)*r,y,Math.sin(a)*r],branch=this.mesh(root,'stem','bark');this.segment(branch,[0,1.9+layer*.2,0],tip,.055);
        const size=.45+hash(id+19)*.19,leaf=this.mesh(root,'sphere',['canopyDark','leaf','canopyLight'][id%3],tip,[size,.38+hash(id+33)*.17,size*.9]);leaf.rotation.y=a;parts.canopy.push(leaf);
      }
      parts.canopy.push(this.mesh(root,'sphere','canopyLight',[.08,3.85,-.08],[.5,.42,.48]));
      for(let i=0;i<5;i++){const a=i*2.4;this.mesh(root,'nut','nut',[Math.cos(a)*.85,2.6,Math.sin(a)*.85],[.14,.18,.14]);}
    }
    root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(root),height=bounds.max.y-bounds.min.y;
    const swayReach=Math.hypot(Math.max(Math.abs(bounds.min.x),Math.abs(bounds.max.x)),Math.max(Math.abs(bounds.min.z),Math.abs(bounds.max.z)))*.1;
    const normalize=Math.min(this.maxPlantHeight*(kind==='vine'?.82:kind==='flower'?.94:kind==='walnut'?.95:1)*sizeVariation/height,heightLimit/(height+swayReach));root.scale.setScalar(normalize);parts.normalization=normalize;
    return {root,parts,height:height*normalize};
  }
  sow(owner,spell,pos,actors){
    const victim=actors.find(a=>a.owner!==owner),axis=unit([victim.pos[0]-pos[0],0,victim.pos[2]-pos[2]]),side=[-axis[2],0,axis[0]],root=this.group();
    const plants=[],walnutPosition=add(add(pos,mul(axis,5.5)),mul(side,3.1));
    // Scatter around the opponent. Keep the foreground plants below waist
    // height so the forest does not obscure the opponent from the caster.
    for(let i=0;i<36;i++){
      let p,spacing=-1;
      for(let attempt=0;attempt<96;attempt++){
        const angle=(i%4+hash(i*193+attempt*2+8))*Math.PI/2;
        const radius=i===0?.165:Math.sqrt(.32*.32+hash(i*193+attempt*2+9)*(1-.32*.32));
        const candidate=add(add(victim.pos,mul(side,Math.cos(angle)*radius*10)),mul(axis,Math.sin(angle)*radius*11));
        if(Math.abs(candidate[0])>13||candidate[2]<-37||candidate[2]>21)continue;
        const gap=plants.reduce((nearest,plant)=>Math.min(nearest,distance(candidate,plant.p)),distance(candidate,walnutPosition));
        if(gap>spacing){p=candidate;spacing=gap;}
        if(gap>=2.05)break;
      }
      p??=add(victim.pos,mul(side,i%4<2?5:-5));
      const foreground=(p[0]-victim.pos[0])*axis[0]+(p[2]-victim.pos[2])*axis[2]<0;
      plants.push({kind:['flower','vine','bamboo'][i%3],p,foreground,sizeVariation:foreground?1:i===0?.95:.58+.42*hash(i+277),heightLimit:foreground?(victim.height??3)*.5:Infinity,landAt:1.05+(i%4)*.09});
    }
    plants.push({kind:'walnut',p:walnutPosition,landAt:.7});
    let readyAt=0;
    plants.forEach((plant,i)=>{
      plant.p[0]=Math.max(-13,Math.min(13,plant.p[0]));plant.p[2]=Math.max(-37,Math.min(21,plant.p[2]));plant.p[1]=this.floor(plant.p[0],plant.p[2]);plant.seed=this.mesh(root,'sphere','nut',pos,[.11,.15,.11]);
      plant.seedOrigin=add(pos,mul(side,(i%3-1)*.2));plant.launchAt=i===plants.length-1?0:(i%9)*.025;
      const model=this.plantModel(plant.kind,plant.heightLimit,plant.sizeVariation);plant.model=model.root;plant.parts=model.parts;plant.height=model.height;plant.pulse=0;plant.exhaleTime=0;plant.model.visible=false;
      const anchor=this.group(root);anchor.position.fromArray(plant.p);anchor.add(plant.model);plant.anchor=anchor;
      readyAt=Math.max(readyAt,plant.landAt+.3);
    });
    const garden={owner,spell,root,plants,p:[...victim.pos],origin:[...pos],axis,side,age:0,readyAt};this.gardens.push(garden);return true;
  }
  nutModel(root){
    const body=this.group(root);this.mesh(body,'nut','nut',[0,0,0],[1,1.18,.8]);
    for(let i=0;i<12;i++){const a=i*Math.PI*2/12,points=[];for(let j=0;j<19;j++){const y=-.96+j*.106,r=Math.sqrt(Math.max(0,1-y*y))*1.025,angle=a+Math.sin(j*1.8+i)*.065+Math.sin(y*9+i)*.04;points.push(new T.Vector3(Math.cos(angle)*r,y*1.18,Math.sin(angle)*r*.8));}const geo=new T.TubeGeometry(new T.CatmullRomCurve3(points),30,.018+i%3*.006,5,false),ridge=new T.Mesh(geo,this.mat.ridge);ridge.userData.ownedGeometry=true;body.add(ridge);}
    return body;
  }
  plantPoint(plant,point){plant.model.updateWorldMatrix(true,true);return new T.Vector3(...point).applyMatrix4(plant.model.matrixWorld).toArray();}
  cloudRadius(c){return c.radius*ease(c.age/1.4);}
  poisoned(owner){return this.clouds.some(c=>c.inside.has(owner));}
  emitCloud(owner,spell,flower){
    const root=this.group(),material=this.cloudMaterial.clone(),puffs=new T.InstancedMesh(this.cloudGeometry,material,24);
    puffs.instanceMatrix.setUsage(T.DynamicDrawUsage);puffs.frustumCulled=false;puffs.userData.ownedMaterial=true;root.add(puffs);root.position.fromArray(flower.p);
    const mouth=flower.parts.head;mouth.updateWorldMatrix(true,false);const origin=mouth.localToWorld(new T.Vector3(0,0,.38)).toArray();
    flower.pulse=1;flower.exhaleTime=6;
    this.clouds.push({owner,root,puffs,material,origin,center:[...flower.p],age:0,life:6,radius:spell.poisonRadius,height:2.4+spell.growth*.8,damageRate:spell.damage/6,inside:new Set()});
  }
  cast(owner,spell,pos,dir,actors,walls=[],shots=[],aimPoint){
    if(!this.canCast(owner,spell))return false;if(spell.style==='woodseed')return this.sow(owner,spell,pos,actors);
    const g=this.garden(owner),victim=actors.find(a=>a.owner!==owner),target=[...victim.pos],growth=this.growth(owner),scale=this.scale(owner),id=++this.serial;
    if(spell.style==='flowerpoison'){
      for(const c of [...this.clouds])if(c.owner===owner){this.dispose(c.root);this.clouds.splice(this.clouds.indexOf(c),1);}
      for(const flower of g.plants.filter(p=>p.kind==='flower'))this.emitCloud(owner,spell,flower);
      return true;
    }
    if(spell.style==='bamboostab'){
      const plants=g.plants.filter(p=>p.kind==='bamboo'),rounds=1+Math.floor(growth*2+1e-6),count=plants.length*rounds;
      const destination=aimPoint||add(pos,mul(unit(dir),Math.hypot(...sub(target,pos))));
      plants.forEach((plant,i)=>{plant.volleyAge=0;plant.volleyRounds=rounds;plant.volleyDelay=i*.012;plant.pulse=1;});
      for(let i=0;i<count;i++){
        const plant=plants[i%plants.length],round=Math.floor(i/plants.length),origin=this.plantPoint(plant,plant.parts.volleyOrigins[round]);
        const d=unit(sub(destination,origin)),p=add(origin,mul(d,.25));
        shots.push({owner,element:'wood',style:'bambooleaf',phase:'blooming',releaseAt:.55+round*.12+plant.volleyDelay,releaseAge:0,p,old:[...p],origin:[...origin],target:[...destination],v:mul(d,25+growth*10),size:.16+.13*growth,color:'#9dcb52',damage:spell.damage/count,plantScale:scale,life:4,age:0,flightAge:0,trail:0,reflected:false});
      }
      return true;
    }
    if(spell.style==='walnutwall'){
      for(const w of [...this.walnuts])if(w.owner===owner)this.removeWalnut(w,walls);
      const tree=g.plants.find(p=>p.kind==='walnut'),normal=unit([dir[0],0,dir[2]]),p=add(pos,mul(normal,3.1));p[1]=this.floor(p[0],p[2]);
      const root=this.group(),nut=this.nutModel(root),size=.85+.4*growth,origin=this.plantPoint(tree,[0,2.7,0]);tree.pulse=1;
      const wall={owner,element:'wood',p,normal,width:2*size,height:2.36*size,hp:spell.shield,life:spell.duration};
      this.walnuts.push({owner,root,nut,origin,p,normal,size,spell,wall,age:0,formation:1.05,phase:'falling',added:false});return true;
    }
    const root=this.group(),attack={id,owner,spell,target,root,age:0,kind:spell.style,scale,growth,parts:[],hit:[],plants:g.plants.filter(p=>p.kind==='vine')};
    const count=3+Math.floor(growth*3+1e-6);
    for(let i=0;i<count;i++){
      const plant=attack.plants[i%attack.plants.length];plant.pulse=1;
        const origin=add(plant.p,[0,.25*scale,0]),points=[new T.Vector3(...origin)];
        for(let j=1;j<=8;j++){const t=j/8,p=add(origin,mul(sub(target,origin),t));p[1]=this.floor(p[0],p[2])+.12+Math.sin(t*Math.PI)*.25*scale;points.push(new T.Vector3(...p));}
        for(let j=0;j<=35;j++){const t=j/35,a=t*Math.PI*5+i*2.1;points.push(new T.Vector3(target[0]+Math.cos(a)*.65,target[1]-1.45+t*1.95,target[2]+Math.sin(a)*.65));}
        const geometry=new T.TubeGeometry(new T.CatmullRomCurve3(points),90,.045+growth*.035,5,false),vine=new T.Mesh(geometry,this.mat.stem);vine.userData.ownedGeometry=true;root.add(vine);attack.parts.push({vine,total:geometry.index.count});
    }
    this.attacks.push(attack);return true;
  }
  bind(actor,duration){actor.fighter.woodControlTime=Math.max(actor.fighter.woodControlTime||0,duration);this.bindings.push({fighter:actor.fighter,owner:actor.owner});}
  hit(shot,p,actors,impact){
    if(impact){impact(shot,p);return shot.hitResult;}
    const victim=actors.find(a=>a.owner!==shot.owner),result=victim.fighter.receive(shot.damage,false,shot.ignoreShield,'wood');shot.hitResult=result;
    if(shot.style==='vinehit'&&!result.immune)this.bind(victim,shot.controlDuration);return result;
  }
  advance(dt,actors,walls=[],impact){
    if(dt<=0)return;
    for(const g of this.gardens){g.age+=dt;for(const p of g.plants){p.pulse=Math.max(0,p.pulse-dt);p.exhaleTime=Math.max(0,p.exhaleTime-dt);if(p.volleyAge!==undefined)p.volleyAge+=dt;}}
    for(const w of [...this.walnuts]){
      w.age+=dt;if(!w.added&&w.age>=.75)w.phase='growing';if(!w.added&&w.age+1e-6>=w.formation){w.added=true;w.phase='guarding';walls.push(w.wall);}
      if(w.added&&(!walls.includes(w.wall)||w.wall.life<=0||w.wall.hp<=0))this.removeWalnut(w,walls);
    }
    for(const e of [...this.attacks]){
      e.age+=dt;const victim=actors.find(a=>a.owner!==e.owner);
      if(e.kind==='vinebind'&&!e.hit[0]&&e.age>=.85){
        e.hit[0]=true;e.connected=distance(victim.pos,e.target)<1.65+.3*e.growth;
        if(e.connected)this.hit({owner:e.owner,element:'wood',style:'vinehit',color:'#75b94d',damage:e.spell.damage,controlDuration:e.spell.controlDuration,unreflectable:true,v:[0,0,0]},victim.pos,actors,impact);
      }
      const life=e.connected ? .85+e.spell.controlDuration : 1.6;
      if(e.age>=life){this.dispose(e.root);this.attacks.splice(this.attacks.indexOf(e),1);}
    }
    const exposure=new Map();
    for(const c of [...this.clouds]){
      const elapsed=Math.min(dt,c.life);c.age+=elapsed;c.life-=elapsed;c.inside.clear();
      const radius=this.cloudRadius(c);
      for(const actor of actors){
        if(actor.owner===c.owner||c.age<.35||distance(actor.pos,c.center)>radius||actor.pos[1]-this.floor(actor.pos[0],actor.pos[2])>c.height)continue;
        c.inside.add(actor.owner);const key=c.owner+':'+actor.owner,amount=c.damageRate*elapsed,current=exposure.get(key);
        if(!current||current.amount<amount)exposure.set(key,{cloud:c,actor,amount});
      }
      if(c.life<=1e-6){this.dispose(c.root);this.clouds.splice(this.clouds.indexOf(c),1);}
    }
    // Overlapping smoke from one forest expands coverage, without multiplying
    // damage merely because several transparent puffs occupy the same space.
    for(const {cloud,actor,amount} of exposure.values())this.hit({owner:cloud.owner,element:'wood',style:'poisontick',color:'#ad51d1',damage:amount,ignoreShield:true,unreflectable:true,v:[0,0,0]},actor.pos,actors,impact);
    this.bindings=this.bindings.filter(b=>b.fighter.woodControlTime>0);
  }
  visuals(actors,reducedMotion=false,camera=null,quality=1){
    for(const g of this.gardens)for(const p of g.plants){
      const flight=clamp((g.age-p.launchAt)/(p.landAt-p.launchAt)),s=this.scale(g.owner)*ease((g.age-p.landAt)/.3);
      p.seed.visible=flight<1;p.seed.position.fromArray(add(p.seedOrigin,mul(sub(p.p,p.seedOrigin),flight)));p.seed.position.y+=Math.sin(flight*Math.PI)*(p.kind==='walnut'?1.2:5);
      p.model.visible=g.age>=p.landAt;p.model.scale.setScalar(s*p.parts.normalization);p.anchor.position.y=this.floor(p.p[0],p.p[2]);
      p.model.rotation.z=reducedMotion?0:Math.sin(g.age*1.3+p.p[0])*.025*(1+p.pulse*3);
      if(p.parts.sprigs){
        const age=p.volleyAge??Infinity,active=age<.55+(p.volleyRounds||0)*.12+.2;
        if(active&&!reducedMotion)p.model.rotation.z=Math.sin(g.age*1.3+p.p[0])*.025+Math.sin(age*50+p.p[0])*.06;
        for(let i=0;i<3;i++){const sprig=p.parts.sprigs[i];sprig.visible=age>=0&&i<p.volleyRounds&&age<.55+i*.12+p.volleyDelay;sprig.scale.setScalar(ease(age/.45));}
      }
      if(p.parts.head){const victim=actors.find(a=>a.owner!==g.owner);p.parts.head.rotation.y=Math.atan2(victim.pos[0]-p.p[0],victim.pos[2]-p.p[2]);for(const petal of p.parts.petals)petal.scale.z=.13*(1+p.pulse*1.4);p.parts.exhale.visible=p.exhaleTime>0;p.parts.exhale.scale.set(.35+.3*p.pulse,.35+.3*p.pulse,.7+p.pulse*.6);}
    }
    for(const e of this.attacks){
      const progress=ease(e.age/.85),retract=1-ease((e.age-(e.connected ? .85+e.spell.controlDuration-.25 : 1.25))/.35);
      for(const p of e.parts)p.vine.geometry.setDrawRange(0,Math.floor(p.total*progress*retract/3)*3);
    }
    for(const w of this.walnuts){
      const drop=ease(w.age/.75),center=add(w.p,[0,1.18*w.size,0]);w.root.position.fromArray(add(w.origin,mul(sub(center,w.origin),drop)));w.nut.scale.setScalar((.12+.88*ease((w.age-.55)/.5))*w.size);w.root.rotation.y=Math.atan2(w.normal[0],w.normal[2]);w.nut.rotation.z=(1-drop)*2.4;
    }
    for(const c of this.clouds){
      const count=quality===2?12:24,radius=this.cloudRadius(c),origin=sub(c.origin,c.center);c.puffs.count=count;
      c.material.uniforms.opacity.value=.13*ease(c.age/.25)*ease(c.life/.8);
      for(let i=0;i<count;i++){
        const t=ease((c.age-i*.025)/1.4),a=i*2.399+(reducedMotion?0:c.age*.16),r=radius*Math.sqrt(hash(i+61)),dest=[Math.cos(a)*r,.35+hash(i+9)*(c.height-.4),Math.sin(a)*r];
        const p=add(origin,mul(sub(dest,origin),t)),size=.18+(1+radius*.43)*t;
        this.dummy.position.fromArray(p);if(camera)this.dummy.quaternion.copy(camera.quaternion);else this.dummy.quaternion.identity();this.dummy.scale.set(size*1.5,size,1);this.dummy.updateMatrix();c.puffs.setMatrixAt(i,this.dummy.matrix);
      }
      c.puffs.instanceMatrix.needsUpdate=true;
    }
  }
  removeWalnut(w,walls){const i=walls.indexOf(w.wall);if(i>=0)walls.splice(i,1);this.dispose(w.root);this.walnuts.splice(this.walnuts.indexOf(w),1);}
  dispose(root){root.traverse(o=>{if(o.userData.ownedGeometry)o.geometry.dispose();if(o.userData.ownedMaterial)o.material.dispose();});root.removeFromParent();}
  state(){return {gardens:this.gardens.map(g=>({owner:g.owner,age:g.age,ready:this.ready(g.owner),readyAt:g.readyAt,growth:this.growth(g.owner),multiplier:this.multiplier(g.owner),position:[...g.p],plants:g.plants.map(p=>({kind:p.kind,position:[...p.p],height:p.height*this.scale(g.owner),matureHeight:p.height,chargeAge:p.volleyAge??null,glowingSprigs:p.parts.sprigs?.filter(s=>s.visible).length||0,canopyClusters:p.parts.canopy?.length||0,visible:p.model.visible,seedVisible:p.seed.visible}))})),attacks:this.attacks.map(e=>({owner:e.owner,kind:e.kind,age:e.age,scale:e.scale,count:e.parts.length,target:[...e.target],damage:e.spell.damage,controlDuration:e.spell.controlDuration})),clouds:this.clouds.map(c=>({owner:c.owner,age:c.age,life:c.life,center:[...c.center],mouth:[...c.origin],radius:this.cloudRadius(c),maxRadius:c.radius,height:c.height,damageRate:c.damageRate,inside:[...c.inside]})),walnuts:this.walnuts.map(w=>({owner:w.owner,age:w.age,phase:w.phase,position:w.root.position.toArray(),size:w.size,hp:w.wall.hp,life:w.wall.life,active:w.added})),gateHeight:this.gateHeight,maxPlantHeight:this.maxPlantHeight};}
  reset(walls=[]){for(const g of this.gardens)this.dispose(g.root);for(const a of this.attacks)this.dispose(a.root);for(const c of this.clouds)this.dispose(c.root);for(const w of [...this.walnuts])this.removeWalnut(w,walls);for(const b of this.bindings)b.fighter.woodControlTime=0;this.gardens.length=this.attacks.length=this.clouds.length=this.bindings.length=0;this.serial=0;}
}
