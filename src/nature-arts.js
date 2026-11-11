import {actorHitRadius} from './combat-size.js';
import * as T from 'three';
import { clone as cloneActor } from 'three/addons/utils/SkeletonUtils.js';
import { vfxToon } from './vfx-materials.js';
import { WoodGarden } from './wood-garden.js';
import { IceSupportVfx } from './ice-support-vfx.js';
const clamp=v=>Math.max(0,Math.min(1,v)),add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),length=v=>Math.hypot(...v),unit=v=>mul(v,1/(length(v)||1));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const hash=i=>{const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v);};

// Match state lives here; rendering never advances snow, growth or combat damage.
export class NatureArts {
  constructor(scene,floor=()=>0,avatars={},intersect=()=>null,gateHeight=8,options={}){
    this.scene=scene;this.floor=floor;this.avatars=avatars;this.time=0;this.trees=[];this.snow=[];this.fogs=[];this.balls=[];this.bindings=[];this.shots=new Map();this.shields=new Map();
    this.wood=new WoodGarden(scene,floor,intersect,gateHeight,options);this.trees=this.wood.gardens;
    this.iceSupport=new IceSupportVfx();this.iceWalls=[];this.blizzards=[];this.snowBursts=[];this.snowfallTime=0;this.snowWindTime=0;
    this.geo={sphere:new T.IcosahedronGeometry(1,1),snow:new T.IcosahedronGeometry(1,2),cone:new T.ConeGeometry(1,1,6),box:new T.BoxGeometry(1,1,1),trunk:new T.CylinderGeometry(.65,1,1,9),leaf:new T.OctahedronGeometry(1)};
    this.bark=vfxToon('#765235');this.woodMat=vfxToon('#ae8252');this.leaf=vfxToon('#54944b');this.bright=vfxToon('#9ad36d');this.white=vfxToon('#edf7ff');this.blue=vfxToon('#aacfe7');
    this.ice=new T.MeshBasicMaterial({color:'#c0edff',transparent:true,opacity:.48,depthWrite:false});
    this.environment=new T.Group();scene.add(this.environment);this.environment.visible=false;
    const geometry=new T.PlaneGeometry(44,64,24,32);geometry.rotateX(-Math.PI/2);this.coverBase=geometry.attributes.position.array.slice();
    this.cover=new T.Mesh(geometry,new T.MeshBasicMaterial({color:'#e9f5ff',transparent:true,opacity:0,depthWrite:false}));this.cover.position.z=-9;this.cover.receiveShadow=true;this.environment.add(this.cover);
    const flakes=new T.BufferGeometry();flakes.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(3600*3),3));
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
  snowAmount(owner){return this.weather(owner)?.amount||0;}
  snowReady(owner){return !!this.weather(owner)&&this.snowAmount(owner)+1e-6>=(globalThis.SealGameCore?.spells.find(s=>s.style==='snowball')?.snowCost??35);}
  blizzard(owner){return this.blizzards.find(b=>b.owner===owner&&b.life>1e-7);}
  snowRate(owner){return this.blizzard(owner)?.multiplier??1;}
  slowAt(owner){return 1-Math.min(.45,Math.max(0,...this.snow.filter(s=>s.owner!==owner).map(s=>s.amount*(s.spell.slowPerSnow??.005))));}
  canCast(owner,spell){if(spell.element==='wood')return this.wood.canCast(owner,spell);if(spell.style==='snowstorm'&&this.weather(owner))return false;if(spell.requiresSnow&&!this.weather(owner))return false;if(spell.snowCost&&(!this.weather(owner)||this.snowAmount(owner)+1e-6<spell.snowCost))return false;return !spell.requiresSnowFull||this.snowReady(owner);}
  empower(owner,spell){return this.wood.empower(owner,spell);}
  hidden(owner){return this.fogs.some(f=>f.owner===owner)||!!this.buried(owner);}
  buried(){return null;}
  perceivedPosition(observer,actors){const victim=actors.find(a=>a.owner!==observer),fog=victim&&this.fogs.find(f=>f.owner===victim.owner);return fog?[fog.p[0],fog.p[1]+1.72,fog.p[2]]:victim?.pos;}
  cast(owner,spell,pos,dir,actors,walls=[],shots=[],aimPoint){
    if(!this.canCast(owner,spell))return false;
    if(spell.element==='wood')return this.wood.cast(owner,spell,pos,dir,actors,walls,shots,aimPoint);
    if(spell.snowCost)this.weather(owner).amount=Math.max(0,this.weather(owner).amount-spell.snowCost);
    if(spell.style==='snowstorm'){this.snow.push({owner,spell,age:0,amount:0,consumed:false});return true;}
    if(spell.style==='blizzard'){
      const previous=this.blizzards.find(b=>b.owner===owner);if(previous)this.blizzards.splice(this.blizzards.indexOf(previous),1);
      this.blizzards.push({owner,life:spell.duration,duration:spell.duration,multiplier:spell.snowMultiplier,age:0});return true;
    }
    if(spell.style==='icebind'){
      const side=unit([-dir[2],0,dir[0]]),p=add(add(pos,mul(dir,2.2)),mul(side,.4));p[1]-=.25;
      const target=aimPoint||add(pos,mul(dir,31)),v=mul(unit(sub(target,p)),spell.speed);
      shots.push({owner,element:'ice',style:'icebind',phase:'flying',releaseAt:0,releaseAge:0,p,old:[...p],origin:[...p],v,target,size:spell.size,color:spell.color,damage:spell.damage,controlDuration:spell.controlDuration,life:4,age:0,flightAge:0,trail:0,reflected:false});return true;
    }
    if(spell.style==='icefog'){
      for(const f of [...this.fogs])if(f.owner===owner){this.iceSupport.dispose(f.root);this.fogs.splice(this.fogs.indexOf(f),1);}
      const p=[Math.max(-6,Math.min(6,pos[0]+(pos[0]>2?-4.3:4.3))),this.floor(pos[0],pos[2]),pos[2]+(owner==='player'?-1.2:1.2)];
      const actor=actors.find(a=>a.owner===owner),fog=this.iceSupport.createMist(owner,(actor?.height||3.01)/2),source=this.avatars[owner],decoy=source?cloneActor(source):new T.Group();fog.root.add(decoy);this.scene.add(fog.root);decoy.visible=false;decoy.rotation.set(0,owner==='player'?Math.PI:0,0);
      this.fogs.push({...fog,owner,p,decoy,age:0,life:spell.duration});return true;
    }
    if(spell.style==='snowball'){
      let axis=unit([dir[0],0,dir[2]]);if(length(axis)<.5)axis=[0,0,-1];
      const p=add(pos,mul(axis,8)),root=this.group(),spin=new T.Group();root.add(spin);
      const material=this.white.clone();this.mesh(spin,'snow',material,[0,0,0],[spell.radius,spell.radius,spell.radius]);
      for(let i=0;i<24;i++){const a=i*2.399,y=1-2*(i+.5)/24,r=Math.sqrt(1-y*y);this.mesh(spin,'sphere',i%3?material:this.blue,[Math.cos(a)*r*spell.radius*.94,y*spell.radius*.94,Math.sin(a)*r*spell.radius*.94],[.45,.35,.45]);}
      p[1]=this.floor(p[0],p[2])+spell.radius;root.position.fromArray(p);
      const gather=this.group(),chunks=[];
      // Gather loose clumps nearby; the ground cover, drifts and falling flakes remain.
      for(let i=0;i<60;i++){const a=i*2.399,r=2+hash(i+70)*6,origin=[p[0]+Math.cos(a)*r,0,p[2]+Math.sin(a)*r];origin[1]=this.floor(origin[0],origin[2])+.1;const m=this.mesh(gather,'snow',i%4?this.white:this.blue,origin,[.12,.12,.12]);chunks.push({m,origin,delay:hash(i+260)*.6});}
      spin.scale.setScalar(.04);
      this.balls.push({owner,spell,root,spin,material,p,axis,gather,chunks,gatherTime:2,phase:'gathering',age:0,travel:0,range:spell.range??64});return true;
    }
    return null;
  }
  intercept(shot){
    const start=shot.old||shot.p,end=shot.p;if(!start||!end)return false;
    const delta=sub(end,start),a=delta.reduce((n,v)=>n+v*v,0);let first=null;
    for(const b of this.balls){
      if(b.owner===shot.owner||b.phase!=='rolling')continue;
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
  removeBall(ball){ball.root.removeFromParent();ball.gather.removeFromParent();ball.material.dispose();this.balls.splice(this.balls.indexOf(ball),1);}
  shatter(ball){
    const root=this.group(),material=this.white.clone();root.position.fromArray(ball.p);material.transparent=true;
    const chunks=new T.InstancedMesh(this.geo.snow,material,48);chunks.instanceMatrix.setUsage(T.DynamicDrawUsage);chunks.frustumCulled=false;root.add(chunks);
    const fragments=Array.from({length:48},(_,i)=>{const a=i*2.399,y=hash(i+98)*2-1,r=Math.sqrt(1-y*y),axis=[Math.cos(a)*r,y,Math.sin(a)*r];return {origin:mul(axis,ball.spell.radius*.6),v:add(mul(axis,3+hash(i+43)*5),[0,2,0]),scale:.15+hash(i+52)*.5};});
    this.snowBursts.push({owner:ball.owner,root,material,chunks,fragments,age:0,life:1.2});this.removeBall(ball);
  }
  advance(dt,actors,setPosition=()=>{},walls=[],impact){
    if(dt<=0)return null;this.time+=dt;
    this.wood.advance(dt,actors,walls,impact);
    const windyTime=Math.max(0,...this.blizzards.map(b=>Math.min(dt,b.life)));this.snowfallTime+=dt+windyTime*.8;this.snowWindTime+=windyTime*1.1;
    for(const s of this.snow){const boost=this.blizzard(s.owner),boostedTime=boost?Math.min(dt,boost.life):0;s.age+=dt;s.amount=Math.min(s.spell.snowTime,s.amount+dt+boostedTime*((boost?.multiplier??1)-1));}
    for(const b of [...this.blizzards]){b.age+=dt;b.life=Math.max(0,b.life-dt);if(b.life<=1e-7)this.blizzards.splice(this.blizzards.indexOf(b),1);}
    for(const b of [...this.snowBursts]){b.age+=dt;b.life-=dt;if(b.life<=0){b.root.removeFromParent();b.material.dispose();this.snowBursts.splice(this.snowBursts.indexOf(b),1);}}
    for(const f of [...this.fogs]){f.age+=dt;f.life-=dt;if(f.life<=1e-6){this.iceSupport.dispose(f.root);this.fogs.splice(this.fogs.indexOf(f),1);}}
    for(const e of [...this.iceWalls]){e.age+=dt;e.wall.height=e.height*ease(e.age/e.formation);if(!walls.includes(e.wall)||e.wall.hp<=0||e.wall.life<=0)this.removeIceWall(e,walls);}
    for(const b of [...this.bindings])if(b.fighter.iceControlTime<=0){b.root.removeFromParent();this.bindings.splice(this.bindings.indexOf(b),1);}
    for(const b of [...this.balls]){
      b.age+=dt;let motionDt=dt;
      if(b.phase==='gathering'){
        if(b.age+1e-6<b.gatherTime)continue;
        b.phase='rolling';b.gather.removeFromParent();motionDt=Math.max(0,b.age-b.gatherTime);
      }
      const before=[...b.p],step=Math.min(b.spell.speed*motionDt,b.range-b.travel);b.travel+=step;b.p[0]+=b.axis[0]*step;b.p[2]+=b.axis[2]*step;b.p[1]=this.floor(b.p[0],b.p[2])+b.spell.radius;b.spin.rotation.x+=b.axis[2]*step/b.spell.radius;b.spin.rotation.z-=b.axis[0]*step/b.spell.radius;
      const delta=sub(b.p,before),length2=delta.reduce((n,v)=>n+v*v,0);let first=null;
      for(const victim of actors){
        if(victim.owner===b.owner||victim.fighter.hp<=0)continue;
        const offset=sub(before,victim.pos),radius=b.spell.radius+actorHitRadius(victim,.45),c=length(offset)**2-radius*radius;
        let t=0;if(c>0){if(length2<1e-12)continue;const projection=offset.reduce((n,v,i)=>n+v*delta[i],0),disc=projection*projection-length2*c;if(disc<0)continue;t=(-projection-Math.sqrt(disc))/length2;if(t<0||t>1)continue;}
        if(!first||t<first.t)first={victim,t};
      }
      if(first){
        const {victim,t}=first;b.p=add(before,mul(delta,t));
        const hit={owner:b.owner,victimId:victim.id,element:'ice',style:'snowball',damage:b.spell.damage,color:b.spell.color,unreflectable:true,v:[...b.axis]};
        if(impact)impact(hit,victim.pos);else victim.fighter.receive(hit.damage,true,false,'ice');
        this.shatter(b);
      }else if(b.travel>=b.range)this.removeBall(b);
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
    const snow=Math.max(0,...this.snow.map(s=>clamp(s.amount/s.spell.snowTime))),snowing=this.snow.length>0,boosted=this.blizzards.length>0;this.environment.visible=snowing;
    if(snowing){this.cover.material.opacity=.12+.66*snow;const p=this.cover.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,this.floor(this.coverBase[i*3],this.coverBase[i*3+2]-9)+.15+snow*.12);p.needsUpdate=true;
      const baseCount=Math.min(quality===2?700:1800,Math.floor(180+snow*1620)),count=Math.min(3600,baseCount*(boosted?2:1)),f=this.flakes.geometry.attributes.position;this.flakes.geometry.setDrawRange(0,count);
      for(let i=0;i<count;i++){const wind=reducedMotion?this.snowWindTime*.25:this.snowWindTime,x=((hash(i+1)*38+wind)%38)-19+Math.sin(this.time*.4+i)*.5,y=((hash(i+1700)*24-this.snowfallTime*(1.1+hash(i+4)*1.6))%24+24)%24,z=-38+((hash(i+3800)*56+wind*.25)%56);f.setXYZ(i,x,y,z);}f.needsUpdate=true;
      for(let i=0;i<this.drifts.length;i++){const d=this.drifts[i];d.m.visible=true;d.m.position.set(d.p[0],this.floor(d.p[0],d.p[2])+.05,d.p[2]);d.m.scale.set(1+hash(i)*1.4,.05+snow*.65,.7+hash(i+7)*1.2);}
    }
    for(const f of this.fogs){const actor=actors.find(a=>a.owner===f.owner);if(actor)this.iceSupport.updateMist(f,actor,camera,this.time,reducedMotion,this.floor);}
    for(const e of this.iceWalls)this.iceSupport.updateWall(e,this.time,reducedMotion);
    this.haze.visible=false;
    for(const b of this.balls){b.root.position.fromArray(b.p);b.spin.scale.setScalar(b.phase==='gathering'?.04+.96*Math.pow(clamp(b.age/b.gatherTime),.72):1);if(b.phase==='gathering')for(const c of b.chunks){const t=clamp((b.age-c.delay)/(b.gatherTime-c.delay)),pull=t*t*t,v=add(c.origin,mul(sub(b.p,c.origin),pull));v[1]+=Math.sin(t*Math.PI)*(.7+Math.hypot(c.origin[0]-b.p[0],c.origin[2]-b.p[2])*.15);c.m.position.fromArray(v);c.m.scale.setScalar((.15+.4*Math.sin(t*Math.PI))*(1-.7*t));c.m.visible=t<1&&length(sub(v,camera?camera.position.toArray():actors[0].pos))>3.2;c.m.rotation.x=reducedMotion?0:b.age*3;}}
    const dummy=this.iceSupport.dummy;
    for(const burst of this.snowBursts){burst.material.opacity=clamp(burst.life/.6);for(let i=0;i<burst.fragments.length;i++){const c=burst.fragments[i],v=add(c.origin,mul(c.v,burst.age));v[1]-=4*burst.age*burst.age;dummy.position.fromArray(v);dummy.rotation.set(reducedMotion?0:burst.age*2,i,burst.age);dummy.scale.setScalar(c.scale*(.4+.6*clamp(burst.life)));dummy.updateMatrix();burst.chunks.setMatrixAt(i,dummy.matrix);}burst.chunks.instanceMatrix.needsUpdate=true;}
    for(const b of this.bindings){const a=actors.find(a=>a.owner===b.owner);if(a)b.root.position.set(a.pos[0],this.floor(a.pos[0],a.pos[2]),a.pos[2]);}
    for(const [shot,root] of this.shots)if(!shots.includes(shot)){this.iceSupport.dispose(root);this.shots.delete(shot);}
    for(const shot of shots.filter(s=>s.element==='wood'||s.element==='ice')){const root=this.shots.get(shot)||this.shotModel(shot);if(shot.style==='icebind'){this.iceSupport.updateBind(root,shot,this.time,reducedMotion);continue;}root.visible=shot.phase!=='blooming';root.position.fromArray(shot.p);root.scale.setScalar(shot.size);root.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...unit(shot.v)));if(shot.style==='bambooleaf'&&!reducedMotion)root.rotateY(shot.age*9);}
  }
  status(owner){
    const t=this.tree(owner),s=this.weather(owner),fog=this.fogs.find(f=>f.owner===owner),nut=this.wood.walnuts.find(w=>w.owner===owner),boost=this.blizzard(owner),slow=this.slowAt(owner);
    return [t?`Vườn ${Math.round(this.growth(owner)*100)}% · Mộc ×${this.multiplier(owner).toFixed(2)}${this.wood.ready(owner)?'':' · hạt đang nảy mầm'}`:'',nut?nut.added?`Óc chó ${Math.ceil(nut.wall.hp)} · ${nut.wall.life.toFixed(1)}s`:'Óc chó đang rơi và hóa lớn':'',this.wood.poisoned(owner)?'Trúng độc':'',s?`Tuyết ${Math.min(s.spell.snowTime,s.amount).toFixed(1)}/${s.spell.snowTime} tuyết${this.snowReady(owner)?' · Z X: Tuyết táng':''}`:'',boost?`Bão Tuyết ×${boost.multiplier} · ${boost.life.toFixed(1)}s`:'',slow<1?`Chậm ${Math.round((1-slow)*1000)/10}%`:'',fog?`Huyễn Sương Vô Ảnh ${fog.life.toFixed(1)}s`:''].filter(Boolean).join(' · ');
  }
  state(){return {
    wood:this.wood.state(),trees:this.trees.map(t=>({owner:t.owner,age:t.age,growth:this.growth(t.owner),multiplier:this.multiplier(t.owner),position:[...t.p]})),
    snow:this.snow.map(s=>({owner:s.owner,age:s.age,amount:s.amount,remaining:Math.max(0,s.spell.snowTime-s.amount),ready:this.snowReady(s.owner),consumed:false,density:clamp(s.amount/s.spell.snowTime),rate:this.snowRate(s.owner)})),
    blizzards:this.blizzards.map(b=>({...b})),snowMovement:{player:this.slowAt('player'),enemy:this.slowAt('enemy')},
    snowVisual:{flakes:this.environment.visible?this.flakes.geometry.drawRange.count:0,boosted:this.blizzards.length>0,fallSpeed:this.blizzards.length?1.8:1,wind:this.blizzards.length?1.1:0,groundOpacity:this.cover.material.opacity,drifts:this.drifts.filter(d=>d.m.visible).length},
    snowBursts:this.snowBursts.map(b=>({owner:b.owner,age:b.age,life:b.life,position:b.root.position.toArray(),fragments:b.fragments.length})),iceWalls:[],
    iceGather:[...this.shots].filter(([s])=>s.style==='icebind'&&s.phase==='blooming').map(([s,r])=>({owner:s.owner,progress:clamp(s.releaseAge/s.releaseAt),flakes:r.userData.bind.flakes.count,crystalScale:r.userData.bind.core.scale.x})),
    fogs:this.fogs.map(f=>({owner:f.owner,life:f.life,position:[...f.p],coverPosition:f.cover.position.toArray(),insideView:f.owner==='player',decoyVisible:f.decoy.visible,cloudCount:f.clouds.count,field:{...f.bounds,height:f.height}})),
    balls:this.balls.map(b=>({owner:b.owner,phase:b.phase,position:[...b.p],direction:[...b.axis],travel:b.travel,range:b.range,age:b.age,gatherTime:b.gatherTime,gatherProgress:clamp(b.age/b.gatherTime),gatherChunks:b.phase==='gathering'?b.chunks.filter(c=>c.m.visible).length:0,radius:b.spell.radius,damage:b.spell.damage,snowCost:b.spell.snowCost})),
    bindings:this.bindings.map(b=>b.owner),hidden:{player:this.hidden('player'),enemy:this.hidden('enemy')},snowVisible:this.environment.visible
  };}
  resetForPhase(walls=[]){
    // Once-per-match preparations belong to the whole encounter, not one HP bar.
    const gardens=this.wood.gardens.filter(g=>g.owner==='player'),snow=this.snow.filter(s=>s.owner==='player'),blizzards=this.blizzards.filter(b=>b.owner==='player'),time=this.time,serial=this.wood.serial,snowfallTime=this.snowfallTime,snowWindTime=this.snowWindTime;
    for(const g of gardens)this.wood.gardens.splice(this.wood.gardens.indexOf(g),1);
    this.reset(walls);this.wood.gardens.push(...gardens);this.snow.push(...snow);this.blizzards.push(...blizzards);this.time=time;this.wood.serial=serial;this.snowfallTime=snowfallTime;this.snowWindTime=snowWindTime;
  }
  reset(walls=[]){this.wood.reset(walls);for(const e of [...this.iceWalls])this.removeIceWall(e,walls);for(const list of [this.fogs,this.balls,this.bindings]){for(const e of list){this.iceSupport.dispose(e.root);e.gather?.removeFromParent();e.material?.dispose();if(e.fighter){e.fighter.iceControlTime=0;e.fighter.snowBuried=false;}}list.length=0;}for(const map of [this.shots,this.shields]){for(const root of map.values())this.iceSupport.dispose(root);map.clear();}for(const b of this.snowBursts){b.root.removeFromParent();b.material.dispose();}this.snowBursts=[];this.blizzards=[];this.snow=[];this.time=0;this.snowfallTime=0;this.snowWindTime=0;this.environment.visible=this.haze.visible=false;if(this.avatars.enemy)this.avatars.enemy.visible=true;}
}
