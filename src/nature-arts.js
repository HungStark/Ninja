import * as T from 'three';
import { clone as cloneActor } from 'three/addons/utils/SkeletonUtils.js';
import { vfxToon } from './vfx-materials.js';
import { WoodGarden } from './wood-garden.js';
import { IceSupportVfx } from './ice-support-vfx.js';
const clamp=v=>Math.max(0,Math.min(1,v)),add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),length=v=>Math.hypot(...v),unit=v=>mul(v,1/(length(v)||1));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const hash=i=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v);};

// Match state lives here; visual frame rate never advances snow, tree growth or the finale.
export class NatureArts {
  constructor(scene,floor=()=>0,avatars={},intersect=()=>null,gateHeight=8){
    this.scene=scene;this.floor=floor;this.avatars=avatars;this.time=0;this.trees=[];this.snow=[];this.fogs=[];this.balls=[];this.bindings=[];this.shots=new Map();this.shields=new Map();
    this.wood=new WoodGarden(scene,floor,intersect,gateHeight);this.trees=this.wood.gardens;
    this.iceSupport=new IceSupportVfx();this.iceWalls=[];
    this.geo={sphere:new T.IcosahedronGeometry(1,1),snow:new T.IcosahedronGeometry(1,2),cone:new T.ConeGeometry(1,1,6),box:new T.BoxGeometry(1,1,1),trunk:new T.CylinderGeometry(.65,1,1,9),leaf:new T.OctahedronGeometry(1)};
    this.bark=vfxToon('#765235');this.woodMat=vfxToon('#ae8252');this.leaf=vfxToon('#54944b');this.bright=vfxToon('#9ad36d');this.white=vfxToon('#edf7ff');this.blue=vfxToon('#aacfe7');
    this.ice=new T.MeshBasicMaterial({color:'#c0edff',transparent:true,opacity:.48,depthWrite:false});
    this.environment=new T.Group();scene.add(this.environment);this.environment.visible=false;
    const geometry=new T.PlaneGeometry(44,64,24,32);geometry.rotateX(-Math.PI/2);this.coverBase=geometry.attributes.position.array.slice();
    this.cover=new T.Mesh(geometry,new T.MeshBasicMaterial({color:'#e9f5ff',transparent:true,opacity:0,depthWrite:false}));this.cover.position.z=-9;this.cover.receiveShadow=true;this.environment.add(this.cover);
    const flakes=new T.BufferGeometry();flakes.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(1800*3),3));
    this.flakes=new T.Points(flakes,new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{opacity:{value:.7}},vertexShader:'void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(42./max(1.,-p.z),1.5,7.);gl_Position=projectionMatrix*p;}',fragmentShader:'uniform float opacity;void main(){float a=1.-smoothstep(.12,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(.93,.98,1.,a*opacity);}'}));this.flakes.frustumCulled=false;this.environment.add(this.flakes);
    this.drifts=[];for(let i=0;i<28;i++){const p=[(hash(i+1)-.5)*28,0,-34+hash(i+45)*48],m=this.mesh(this.environment,'sphere',i%3?this.white:this.blue,p,[1,.1,1]);this.drifts.push({p,m});}
    this.haze=new T.Mesh(new T.PlaneGeometry(1,1),new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;void main(){float r=length(vUv-.5);gl_FragColor=vec4(.77,.89,.94,smoothstep(.16,.67,r)*.23);}'}));this.haze.visible=false;this.haze.renderOrder=30;scene.add(this.haze);
  }
  group(){const g=new T.Group();this.scene.add(g);return g;}
  mesh(root,kind,material,p=[0,0,0],scale=[1,1,1]){const m=new T.Mesh(this.geo[kind],material);m.position.fromArray(p);m.scale.fromArray(scale);m.castShadow=m.receiveShadow=true;root.add(m);return m;}
  tree(owner){return this.trees.find(t=>t.owner===owner);}
  weather(owner){return this.snow.find(s=>s.owner===owner);}
  growth(owner){return this.wood.growth(owner);}
  multiplier(owner){return 1+this.growth(owner)*2;}
  snowAmount(owner){const s=this.weather(owner);return s&&!s.consumed?s.amount:0;}
  snowReady(owner){const s=this.weather(owner);return !!s&&!s.consumed&&s.amount+1e-6>=s.spell.snowTime;}
  canCast(owner,spell){if(spell.element==='wood')return this.wood.canCast(owner,spell);if(spell.style==='snowstorm'&&this.weather(owner))return false;if(spell.snowCost&&this.snowAmount(owner)+1e-6<spell.snowCost)return false;return !spell.requiresSnowFull||this.snowReady(owner);}
  empower(owner,spell){return this.wood.empower(owner,spell);}
  hidden(owner){return this.fogs.some(f=>f.owner===owner)||!!this.buried(owner);}
  buried(owner){return this.balls.find(b=>b.victim===owner&&b.phase==='carrying');}
  perceivedPosition(observer,actors){const victim=actors.find(a=>a.owner!==observer),fog=victim&&this.fogs.find(f=>f.owner===victim.owner);return fog?[fog.p[0],fog.p[1]+1.72,fog.p[2]]:victim?.pos;}
  cast(owner,spell,pos,dir,actors,walls=[],shots=[],aimPoint){
    if(!this.canCast(owner,spell))return false;
    if(spell.element==='wood')return this.wood.cast(owner,spell,pos,dir,actors,walls,shots,aimPoint);
    if(spell.snowCost)this.weather(owner).amount=Math.max(0,this.weather(owner).amount-spell.snowCost);
    if(spell.style==='snowstorm'){this.snow.push({owner,spell,age:0,amount:0,consumed:false});return true;}
    if(spell.style==='icebind'){
      const side=unit([-dir[2],0,dir[0]]),p=add(add(pos,mul(dir,2.2)),mul(side,.4));p[1]-=.25;
      const target=aimPoint||add(pos,mul(dir,31)),v=mul(unit(sub(target,p)),spell.speed);
      shots.push({owner,element:'ice',style:'icebind',phase:'blooming',releaseAt:.75,releaseAge:0,p,old:[...p],origin:[...p],v,target,size:spell.size,color:spell.color,damage:spell.damage,controlDuration:spell.controlDuration,life:4,age:0,flightAge:0,trail:0,reflected:false});return true;
    }
    if(spell.style==='icewall'){
      for(const e of [...this.iceWalls])if(e.owner===owner)this.removeIceWall(e,walls);
      const normal=unit([dir[0],0,dir[2]]),p=add(pos,mul(normal,3.2));p[1]=this.floor(p[0],p[2]);
      const root=this.iceSupport.createWall();root.position.fromArray(p);root.rotation.y=Math.atan2(normal[0],normal[2]);this.scene.add(root);
      const wall={owner,element:'ice',p,normal,width:5.9,height:0,hp:spell.shield,life:spell.duration};
      const effect={owner,root,wall,age:0,formation:.82,height:3.9};this.iceWalls.push(effect);walls.push(wall);return true;
    }
    if(spell.style==='icefog'){
      for(const f of [...this.fogs])if(f.owner===owner){this.iceSupport.dispose(f.root);this.fogs.splice(this.fogs.indexOf(f),1);}
      const p=[Math.max(-6,Math.min(6,pos[0]+(pos[0]>2?-4.3:4.3))),this.floor(pos[0],pos[2]),pos[2]+(owner==='player'?-1.2:1.2)];
      const fog=this.iceSupport.createMist(),source=this.avatars[owner],decoy=source?cloneActor(source):new T.Group();fog.root.add(decoy);this.scene.add(fog.root);decoy.visible=false;decoy.rotation.set(0,owner==='player'?Math.PI:0,0);
      this.fogs.push({...fog,owner,p,decoy,age:0,life:spell.duration});return true;
    }
    if(spell.style==='snowball'){
      const victim=actors.find(a=>a.owner!==owner),axis=unit([victim.pos[0]-pos[0],0,victim.pos[2]-pos[2]]),p=add(pos,mul(axis,8)),root=this.group(),spin=new T.Group();root.add(spin);
      const material=this.white.clone();this.mesh(spin,'snow',material,[0,0,0],[spell.radius,spell.radius,spell.radius]);
      for(let i=0;i<24;i++){const a=i*2.399,y=1-2*(i+.5)/24,r=Math.sqrt(1-y*y);this.mesh(spin,'sphere',i%3?material:this.blue,[Math.cos(a)*r*spell.radius*.94,y*spell.radius*.94,Math.sin(a)*r*spell.radius*.94],[.45,.35,.45]);}
      p[1]=this.floor(p[0],p[2])+spell.radius;root.position.fromArray(p);this.weather(owner).consumed=true;this.weather(owner).amount=0;
      const gather=this.group(),chunks=[];
      for(let i=0;i<100;i++){const a=i*2.399,r=5+hash(i+70)*19,origin=[p[0]+Math.cos(a)*r,0,p[2]+Math.sin(a)*r];origin[1]=this.floor(origin[0],origin[2])+.1;const m=this.mesh(gather,'snow',i%4?this.white:this.blue,origin,[.12,.12,.12]);chunks.push({m,origin,delay:hash(i+260)*.6});}
      spin.scale.setScalar(.04);
      this.balls.push({owner,spell,victim:victim.owner,root,spin,material,p,axis,gather,chunks,gatherTime:2.2,phase:'gathering',age:0,carryAge:0,fighter:victim.fighter});return true;
    }
    return null;
  }
  intercept(shot){
    const start=shot.old||shot.p,end=shot.p;if(!start||!end)return false;
    const delta=sub(end,start),a=delta.reduce((n,v)=>n+v*v,0);let first=null;
    for(const b of this.balls){
      if(b.owner===shot.owner||!['rolling','carrying'].includes(b.phase))continue;
      const radius=b.spell.radius+(shot.style==='tsunami'?(shot.width||0)/2:shot.size||0),offset=sub(start,b.p),c=offset.reduce((n,v)=>n+v*v,0)-radius*radius;
      let t=0;if(c>0){if(a<1e-12)continue;const projection=offset.reduce((n,v,i)=>n+v*delta[i],0),disc=projection*projection-a*c;if(disc<0)continue;t=(-projection-Math.sqrt(disc))/a;if(t<0||t>1)continue;}
      if(!first||t<first.t)first={t,point:add(start,mul(delta,t))};
    }
    if(!first)return false;shot.p=first.point;shot.life=0;shot.consumedByDefense=true;return true;
  }
  freeze(owner,actor,duration){
    actor.fighter.iceControlTime=Math.max(actor.fighter.iceControlTime||0,duration);
    let b=this.bindings.find(b=>b.owner===actor.owner);if(!b){const root=this.group();for(let i=0;i<8;i++){const a=i*Math.PI/4;this.mesh(root,'cone',this.ice,[Math.cos(a)*.65,1.25,Math.sin(a)*.65],[.32,2.7,.32]);}b={owner:actor.owner,root,fighter:actor.fighter};this.bindings.push(b);}return b;
  }
  removeIceWall(effect,walls){const i=walls.indexOf(effect.wall);if(i>=0)walls.splice(i,1);this.iceSupport.dispose(effect.root);this.iceWalls.splice(this.iceWalls.indexOf(effect),1);}
  advance(dt,actors,setPosition=()=>{},walls=[],impact){
    if(dt<=0)return null;this.time+=dt;
    this.wood.advance(dt,actors,walls,impact);for(const s of this.snow){s.age+=dt;if(!s.consumed)s.amount=Math.min(s.spell.snowTime,s.amount+dt);}
    for(const f of [...this.fogs]){f.age+=dt;f.life-=dt;if(f.life<=1e-6){this.iceSupport.dispose(f.root);this.fogs.splice(this.fogs.indexOf(f),1);}}
    for(const e of [...this.iceWalls]){e.age+=dt;e.wall.height=e.height*ease(e.age/e.formation);if(!walls.includes(e.wall)||e.wall.hp<=0||e.wall.life<=0)this.removeIceWall(e,walls);}
    for(const b of [...this.bindings])if(b.fighter.iceControlTime<=0){b.root.removeFromParent();this.bindings.splice(this.bindings.indexOf(b),1);}
    for(const b of this.balls){
      const victim=actors.find(a=>a.owner===b.victim);b.age+=dt;
      if(b.phase==='gathering'){
        if(b.age+1e-6<b.gatherTime)continue;
        b.phase='rolling';b.gather.removeFromParent();
      }
      if(b.phase==='rolling')b.axis=unit([victim.pos[0]-b.p[0],0,victim.pos[2]-b.p[2]]);
      const step=b.spell.speed*dt;b.p[0]+=b.axis[0]*step;b.p[2]+=b.axis[2]*step;b.p[1]=this.floor(b.p[0],b.p[2])+b.spell.radius;b.spin.rotation.x+=b.axis[2]*step/b.spell.radius;b.spin.rotation.z-=b.axis[0]*step/b.spell.radius;
      if(b.phase==='rolling'&&Math.hypot(victim.pos[0]-b.p[0],victim.pos[2]-b.p[2])<b.spell.radius-.4){b.phase='carrying';b.carryAge=0;victim.fighter.snowBuried=true;for(const f of [...this.fogs])if(f.owner===victim.owner){this.iceSupport.dispose(f.root);this.fogs.splice(this.fogs.indexOf(f),1);}}
      if(b.phase==='carrying'){b.carryAge+=dt;victim.fighter.iceControlTime=4;setPosition(victim.owner,[b.p[0],b.p[1],b.p[2]]);if(b.carryAge>=2.8)return b.owner;}
    }
    return null;
  }
  shotModel(shot){
    if(shot.style==='icebind'){const root=this.iceSupport.createBind();this.scene.add(root);this.shots.set(shot,root);return root;}
    const root=this.group(),wood=shot.element==='wood',mat=wood?this.woodMat:this.ice;
    if(shot.style==='bambooleaf'){this.mesh(root,'leaf',this.leaf,[0,0,0],[.45,2,.1]);this.mesh(root,'cone',this.bright,[0,0,0],[.045,3,.045]);}
    else if(wood&&shot.style==='orb'){this.mesh(root,'sphere',this.bark,[0,0,0],[.7,.8,.7]);for(let i=0;i<8;i++){const a=i*Math.PI/4,m=this.mesh(root,'cone',this.bright,[Math.cos(a)*.6,0,Math.sin(a)*.6],[.22,.8,.22]);m.rotation.z=Math.PI/2;}}
    else{this.mesh(root,'cone',mat,[0,0,0],[.6,wood?3:2.8,.6]);for(let i=0;i<5;i++){const a=i*2.399,m=this.mesh(root,wood?'leaf':'cone',wood?this.leaf:this.ice,[Math.cos(a)*.4,-.4+i*.2,Math.sin(a)*.4],[.35,.8,.22]);m.rotation.z=.7;}}
    this.shots.set(shot,root);return root;
  }
  visuals(shots,actors,camera,quality=1,reducedMotion=false){
    this.wood.visuals(actors,reducedMotion,camera,quality);
    const gathering=this.balls.find(b=>b.phase==='gathering'),pull=gathering?clamp(gathering.age/gathering.gatherTime):0;
    const snow=Math.max(gathering?1-pull:0,...this.snow.filter(s=>!s.consumed).map(s=>clamp(s.amount/s.spell.snowTime))),snowing=this.snow.some(s=>!s.consumed)||!!gathering;this.environment.visible=snowing;
    if(snowing){this.cover.material.opacity=(.12+.66*snow)*(gathering?1-pull:1);const p=this.cover.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,this.floor(this.coverBase[i*3],this.coverBase[i*3+2]-9)+.15+snow*.12);p.needsUpdate=true;
      const count=Math.min(quality===2?700:1800,Math.floor(180+snow*1620)),f=this.flakes.geometry.attributes.position;this.flakes.geometry.setDrawRange(0,count);
      for(let i=0;i<count;i++){let v=[(hash(i+1)-.5)*38+Math.sin(this.time*.4+i)*.9,((hash(i+1700)*24-this.time*(1.1+hash(i+4)*1.6))%24+24)%24,-38+hash(i+3800)*56];if(gathering){const t=Math.pow(pull,1.5),a=i*2.4+pull*3;v=add(v,mul(sub(gathering.p,v),t));v[0]+=Math.cos(a)*Math.sin(pull*Math.PI)*2;v[2]+=Math.sin(a)*Math.sin(pull*Math.PI)*2;}f.setXYZ(i,...v);}f.needsUpdate=true;
      for(let i=0;i<this.drifts.length;i++){const d=this.drifts[i],v=gathering?add(d.p,mul(sub(gathering.p,d.p),Math.pow(pull,2))):d.p;d.m.visible=!gathering||Math.hypot(v[0]-actors[0].pos[0],v[2]-actors[0].pos[2])>3.2;d.m.position.set(v[0],gathering?v[1]+Math.sin(pull*Math.PI):this.floor(d.p[0],d.p[2])+.05,v[2]);d.m.scale.set((1+hash(i)*1.4)*(1-pull),(.05+snow*.65)*(1-pull),(.7+hash(i+7)*1.2)*(1-pull));}
    }
    for(const f of this.fogs){const actor=actors.find(a=>a.owner===f.owner);if(actor)this.iceSupport.updateMist(f,actor,camera,this.time,reducedMotion);}
    for(const e of this.iceWalls)this.iceSupport.updateWall(e,this.time,reducedMotion);
    this.haze.visible=this.fogs.some(f=>f.owner==='player');if(this.haze.visible&&camera){this.haze.position.copy(camera.position).add(new T.Vector3(0,0,-.7).applyQuaternion(camera.quaternion));this.haze.quaternion.copy(camera.quaternion);const height=2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*.7;this.haze.scale.set(height*camera.aspect,height,1);}
    for(const b of this.balls){b.root.position.fromArray(b.p);b.spin.scale.setScalar(b.phase==='gathering'?.04+.96*Math.pow(clamp(b.age/b.gatherTime),.72):1);if(b.phase==='gathering')for(const c of b.chunks){const t=clamp((b.age-c.delay)/(b.gatherTime-c.delay)),pull=t*t*t,v=add(c.origin,mul(sub(b.p,c.origin),pull));v[1]+=Math.sin(t*Math.PI)*(.7+Math.hypot(c.origin[0]-b.p[0],c.origin[2]-b.p[2])*.15);c.m.position.fromArray(v);c.m.scale.setScalar((.15+.4*Math.sin(t*Math.PI))*(1-.7*t));c.m.visible=t<1&&length(sub(v,camera?camera.position.toArray():actors[0].pos))>3.2;c.m.rotation.x=reducedMotion?0:b.age*3;}if(b.phase==='carrying'){b.material.transparent=true;b.material.opacity=1-.7*clamp((b.carryAge-1.8));}}
    for(const b of this.bindings){const a=actors.find(a=>a.owner===b.owner);if(a)b.root.position.set(a.pos[0],this.floor(a.pos[0],a.pos[2]),a.pos[2]);}
    for(const [shot,root] of this.shots)if(!shots.includes(shot)){this.iceSupport.dispose(root);this.shots.delete(shot);}
    for(const shot of shots.filter(s=>s.element==='wood'||s.element==='ice')){const root=this.shots.get(shot)||this.shotModel(shot);if(shot.style==='icebind'){this.iceSupport.updateBind(root,shot,this.time,reducedMotion);continue;}root.visible=shot.phase!=='blooming';root.position.fromArray(shot.p);root.scale.setScalar(shot.size);root.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...unit(shot.v)));if(shot.style==='bambooleaf'&&!reducedMotion)root.rotateY(shot.age*9);}
  }
  status(owner){const t=this.tree(owner),s=this.weather(owner),fog=this.fogs.find(f=>f.owner===owner),nut=this.wood.walnuts.find(w=>w.owner===owner),poison=this.wood.poisoned(owner);return [t?`Vườn ${Math.round(this.growth(owner)*100)}% · Mộc ×${this.multiplier(owner).toFixed(2)}${this.wood.ready(owner)?'':' · hạt đang nảy mầm'}`:'',nut?nut.added?`Óc chó ${Math.ceil(nut.wall.hp)} · ${nut.wall.life.toFixed(1)}s`:'Óc chó đang rơi và hóa lớn':'',poison?'Trúng độc':'',s?s.consumed?(this.balls.some(b=>b.owner===owner&&b.phase==='gathering')?'Đang gom tuyết':'Đã gom tuyết'):`Tuyết ${Math.min(90,s.amount).toFixed(1)}/90 tuyết${this.snowReady(owner)?' · Z X: Tuyết táng':''}`:'',fog?`Huyễn Sương Vô Ảnh ${fog.life.toFixed(1)}s`:''].filter(Boolean).join(' · ');}
  state(){return {wood:this.wood.state(),trees:this.trees.map(t=>({owner:t.owner,age:t.age,growth:this.growth(t.owner),multiplier:this.multiplier(t.owner),position:[...t.p]})),snow:this.snow.map(s=>({owner:s.owner,age:s.age,amount:this.snowAmount(s.owner),remaining:Math.max(0,s.spell.snowTime-this.snowAmount(s.owner)),ready:this.snowReady(s.owner),consumed:s.consumed,density:clamp(this.snowAmount(s.owner)/s.spell.snowTime)})),iceWalls:this.iceWalls.map(e=>({owner:e.owner,age:e.age,rise:ease(e.age/e.formation),panels:e.root.userData.wall.panels.length,position:[...e.wall.p],height:e.wall.height,hp:e.wall.hp,life:e.wall.life})),iceGather:[...this.shots].filter(([s])=>s.style==='icebind'&&s.phase==='blooming').map(([s,r])=>({owner:s.owner,progress:clamp(s.releaseAge/s.releaseAt),flakes:r.userData.bind.flakes.count,crystalScale:r.userData.bind.core.scale.x})),fogs:this.fogs.map(f=>({owner:f.owner,life:f.life,position:[...f.p],coverPosition:f.cover.position.toArray(),insideView:f.owner==='player',decoyVisible:f.decoy.visible,cloudCount:f.clouds.count})),balls:this.balls.map(b=>({owner:b.owner,victim:b.victim,phase:b.phase,position:[...b.p],age:b.age,gatherTime:b.gatherTime,gatherProgress:clamp(b.age/b.gatherTime),gatherChunks:b.phase==='gathering'?b.chunks.filter(c=>c.m.visible).length:0,carryAge:b.carryAge,radius:b.spell.radius})),bindings:this.bindings.map(b=>b.owner),hidden:{player:this.hidden('player'),enemy:this.hidden('enemy')},snowVisible:this.environment.visible};}
  resetForPhase(walls=[]){
    // Once-per-match preparations belong to the whole encounter, not one HP bar.
    const gardens=this.wood.gardens.filter(g=>g.owner==='player'),snow=this.snow.filter(s=>s.owner==='player'),time=this.time,serial=this.wood.serial;
    for(const g of gardens)this.wood.gardens.splice(this.wood.gardens.indexOf(g),1);
    // Snow Burial consumes its charge to finish one phase; the weather keeps gathering.
    for(const s of snow)if(s.consumed){s.consumed=false;s.amount=0;}
    this.reset(walls);this.wood.gardens.push(...gardens);this.snow.push(...snow);this.time=time;this.wood.serial=serial;
  }
  reset(walls=[]){this.wood.reset(walls);for(const e of [...this.iceWalls])this.removeIceWall(e,walls);for(const list of [this.fogs,this.balls,this.bindings]){for(const e of list){this.iceSupport.dispose(e.root);e.gather?.removeFromParent();e.material?.dispose();if(e.fighter){e.fighter.iceControlTime=0;e.fighter.snowBuried=false;}}list.length=0;}for(const map of [this.shots,this.shields]){for(const root of map.values())this.iceSupport.dispose(root);map.clear();}this.snow=[];this.time=0;this.environment.visible=this.haze.visible=false;if(this.avatars.enemy)this.avatars.enemy.visible=true;}
}
