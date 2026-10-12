import * as T from 'three';
import { vfxToon } from './vfx-materials.js';
import { DarkDomainIntro } from './dark-domain-intro.js';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);

export class DarkDomain {
  constructor(world,reducedMotion=false) {
    this.world=world;this.scene=world.scene;this.reducedMotion=reducedMotion;
    this.active=false;this.transition=null;this.life=0;this.clones=[];this.projectiles=new Map();this.ripples=[];this.serial=0;this.bindings=[];this.dives=[];this.recoveries=[];
    this.saved=null;this.group=new T.Group();this.group.name='BlackInkDomain';this.group.visible=false;this.scene.add(this.group);
    this.overlay=document.getElementById('darkEyelids');
    this.header=document.querySelector('.header-center');this.headerText=this.header.innerHTML;
    this.clock={value:0};this.submerge={value:0};
    this.ink=new T.ShaderMaterial({side:T.DoubleSide,uniforms:{uTime:this.clock,uSubmerge:this.submerge},
      vertexShader:`varying vec3 p;uniform float uTime;void main(){p=position;vec3 v=position;
        v.z+=sin(position.x*.28+uTime*.75)*.036+sin(position.y*.35-uTime*.6)*.032;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(v,1.);}`,
      fragmentShader:`varying vec3 p;uniform float uTime;uniform float uSubmerge;
    void main(){
      vec2 q=p.xy;
      float wave=sin(q.x*.32+sin(q.y*.23+uTime*.4)*1.5+uTime*.5)+sin(q.y*.52-q.x*.14-uTime*.35)*.4;
      vec3 c=vec3(.010,.007,.019);
      if(wave>.50)c=vec3(.023,.014,.036);
      if(wave>1.18)c=vec3(.042,.025,.058);
      gl_FragColor=vec4(c,gl_FrontFacing?1.:mix(1.,.14,uSubmerge));
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
    const floor=new T.Mesh(new T.PlaneGeometry(230,230,120,100),this.ink);floor.rotation.x=-Math.PI/2;floor.position.y=.035;this.group.add(floor);
    const sky=new T.Mesh(new T.SphereGeometry(170,24,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,
      vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:`varying vec3 p;void main(){float h=normalize(p).y;vec3 c=mix(vec3(.039,.032,.057),vec3(.004,.005,.011),smoothstep(0.,.48,h));gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>}`}));sky.renderOrder=-10;this.group.add(sky);
    this.group.add(new T.HemisphereLight('#8f819c','#13101e',1.5));
    const light=new T.DirectionalLight('#b7a6d3',1.15);light.position.set(-8,16,9);this.group.add(light);
    const poolMat=new T.MeshBasicMaterial({color:'#020306',transparent:true,opacity:.8,depthWrite:false});
    const pools=new T.InstancedMesh(new T.CircleGeometry(1,24),poolMat,38),dummy=new T.Object3D();
    for(let i=0;i<38;i++){
      dummy.position.set(Math.sin(i*19.17)*35,.075,Math.cos(i*13.49)*38-8);dummy.rotation.set(-Math.PI/2,0,i*2.7);
      dummy.scale.set(1.2+(i%5)*.9,.7+(i%4)*.45,1);dummy.updateMatrix();pools.setMatrixAt(i,dummy.matrix);
    }pools.instanceMatrix.needsUpdate=true;this.group.add(pools);
    this.cloneMaterial=vfxToon('#38232f', { emissive:'#701822', emissiveIntensity:.24 });
    this.faceMaterial=vfxToon('#130e1e');
    this.eyeMaterial=new T.MeshBasicMaterial({color:'#c2a1ef'});
    this.dogEyeMaterial=new T.MeshBasicMaterial({color:'#ef686e',toneMapped:false});
    this.hornMaterial=vfxToon('#8b6a72',{emissive:'#481b23',emissiveIntensity:.14});
    this.elephantMaterial=vfxToon('#5b4c61',{emissive:'#472734',emissiveIntensity:.2});
    this.tuskMaterial=vfxToon('#c4a6a8',{emissive:'#b09aa3',emissiveIntensity:.35});
    this.ringMaterial=new T.MeshBasicMaterial({color:'#71638a',transparent:true,opacity:.35,depthWrite:false});
    this.geometries={sphere:new T.SphereGeometry(1,14,10),cylinder:new T.CylinderGeometry(1,1,1,10),box:new T.BoxGeometry(1,1,1),cone:new T.ConeGeometry(1,1,12),pool:new T.CircleGeometry(1,32),ring:new T.TorusGeometry(1,.018,5,48)};
    this.cloneGroup=new T.Group();this.cloneGroup.name='ShadowSummons';this.scene.add(this.cloneGroup);
    this.intro=new DarkDomainIntro(world,floor,sky,reducedMotion);
  }
  get usable(){return this.active&&!this.transition;}
  begin(owner,duration=30,position=[0,1.72,7],direction=[0,0,-1]) {
    if(this.transition)return false;
    this.owner=owner;this.duration=duration;
    this.intro.begin(position,direction,this.active);
    this.transition={age:0,destination:'ink',changed:false};return true;
  }
  switchEnvironment(ink) {
    if(ink) {
      if(!this.saved){this.saved={fog:this.scene.fog,background:this.scene.background,visibility:this.world.environment.map(o=>[o,o.visible])};}
      for(const [o] of this.saved.visibility)o.visible=false;
      this.scene.fog=new T.FogExp2('#0c0914',.025);this.scene.background=new T.Color('#06060c');
    } else if(this.saved) {
      for(const [o,visible] of this.saved.visibility)o.visible=visible;
      this.scene.fog=this.saved.fog;this.scene.background=this.saved.background;this.saved=null;
    }
    this.active=ink;this.group.visible=ink;document.body.classList.toggle('dark-domain',ink);
    if(!ink){this.clearDomainArts();for(const c of [...this.clones])if(c.mode==='respawning')this.removeClone(c);this.header.innerHTML=this.headerText;}
  }
  advance(dt,time) {
    this.clock.value=time;
    if(this.active){this.life=Math.max(0,this.life-dt);if(this.life<=1e-6&&!this.transition)this.transition={age:0,destination:'world',changed:false};}
    let lid=0,phase='idle';
    if(this.transition) {
      const t=this.transition;t.age+=dt;
      const close=this.reducedMotion?.12:.38,hold=this.reducedMotion?.05:.16,open=this.reducedMotion?.18:.5;
      const entering=t.destination==='ink';
      if(!entering&&t.age>=close&&!t.changed){t.changed=true;this.switchEnvironment(false);}
      if(t.age<close){lid=ease(t.age/close);phase='closing';}
      else if(t.age<close+hold){lid=1;phase='closed';}
      else{lid=1-ease((t.age-close-hold)/open);phase='opening';}
      if(entering){
        const reveal=this.intro.update(t.age,close+hold,close+hold+open,time);
        if(t.age>=close+hold+open)phase=reveal.phase;
        if(reveal.done){this.intro.reset();this.switchEnvironment(true);this.life=this.duration;this.transition=null;lid=0;phase='idle';}
      }else if(t.age>=close+hold+open){this.transition=null;lid=0;phase='idle';}
    }
    this.blink=lid;this.blinkPhase=phase;this.overlay.style.setProperty('--lid',lid);this.overlay.classList.toggle('blinking',lid>0);
    if(this.active)this.header.innerHTML='<i></i> HẮC LÃNH ĐỊA <span>／</span> ĐẦM LẦY MỰC ĐEN · '+Math.ceil(this.life)+' GIÂY';
  }
  mesh(parent,geometry,material,p,s) {
    const m=new T.Mesh(this.geometries[geometry],material);m.position.fromArray(p);m.scale.fromArray(s);parent.add(m);return m;
  }
  makeClone(owner,p,target,spell,rowSlot) {
    const root=new T.Group(),body=new T.Group();root.add(body);this.cloneGroup.add(root);
    // A compact canine body with an elongated chest, muzzle, pointed ears and four legs.
    this.mesh(body,'sphere',this.cloneMaterial,[0,.66,-.06],[.29,.31,.63]);
    this.mesh(body,'sphere',this.cloneMaterial,[0,.72,.34],[.31,.36,.30]);
    this.mesh(body,'sphere',this.cloneMaterial,[0,.86,.48],[.22,.30,.24]);
    this.mesh(body,'sphere',this.cloneMaterial,[0,1.02,.61],[.25,.23,.28]);
    this.mesh(body,'sphere',this.faceMaterial,[0,.94,.85],[.18,.13,.25]);
    this.mesh(body,'sphere',this.cloneMaterial,[0,.98,1.06],[.11,.075,.06]);
    for(const side of [-1,1]){
      const ear=this.mesh(body,'cone',this.cloneMaterial,[side*.17,1.29,.55],[.13,.35,.12]);ear.rotation.z=side*-.18;
      this.mesh(body,'cone',this.faceMaterial,[side*.17,1.30,.60],[.07,.23,.035]).rotation.z=side*-.18;
      this.mesh(body,'sphere',this.dogEyeMaterial,[side*.18,1.07,.79],[.055,.033,.035]);
    }
    const tail=new T.Group();tail.position.set(0,.71,-.62);body.add(tail);
    this.mesh(tail,'cone',this.cloneMaterial,[0,.18,-.15],[.12,.47,.12]).rotation.x=-.65;
    this.mesh(tail,'cone',this.cloneMaterial,[0,.39,-.22],[.085,.34,.085]).rotation.x=.38;
    const limbs=[];
    for(const side of [-1,1])for(const front of [-1,1]) {
      const leg=new T.Group();leg.position.set(side*.22,.58,front*.36);body.add(leg);
      this.mesh(leg,'sphere',this.cloneMaterial,[0,-.10,0],[.12,.23,.15]);
      const lower=new T.Group();lower.position.set(0,-.28,front<0?-.035:0);leg.add(lower);
      this.mesh(lower,'cylinder',this.cloneMaterial,[0,-.11,0],[.065,.24,.065]);
      this.mesh(lower,'sphere',this.faceMaterial,[0,-.23,.045],[.105,.09,.16]);
      limbs.push({phase:side*front,leg,lower});
    }
    const pool=this.mesh(root,'pool',this.faceMaterial,[0,.06,0],[.8,.8,1]);pool.rotation.x=-Math.PI/2;
    const ring=this.mesh(root,'ring',this.ringMaterial,[0,.09,0],[.7,.7,.7]);ring.rotation.x=-Math.PI/2;
    const clone={id:++this.serial,owner,rowSlot,form:'dog',riseDepth:1.5,hitHeight:.72,hitRadius:.6,mode:'rising',p:[p[0],0,p[2]],home:[p[0],0,p[2]],target:[...target],age:0,damage:spell.damage,root,body,limbs,tail,pool,ring};
    root.position.fromArray(clone.p);body.position.y=-1.5;
    this.clones.push(clone);this.splash(p);return clone;
  }
  commandable(owner){return this.clones.filter(c=>c.owner===owner&&c.mode!=='respawning');}
  cloneCount(owner){return this.clones.filter(c=>c.owner===owner).length;}
  upgradable(owner){return this.clones.filter(c=>c.owner===owner&&c.form==='dog');}
  canSummon(owner,max=3){return this.cloneCount(owner)<max||this.upgradable(owner).length>0;}
  makeElephant(parent){
    const body=new T.Group();parent.add(body);
    this.mesh(body,'sphere',this.elephantMaterial,[0,1.75,-.12],[.95,.76,1.20]);
    this.mesh(body,'sphere',this.elephantMaterial,[0,2.13,.92],[.72,.68,.75]);
    for(const side of [-1,1]){
      this.mesh(body,'sphere',this.elephantMaterial,[side*.86,2.12,.71],[.65,.81,.22]).rotation.z=side*.14;
      this.mesh(body,'sphere',this.faceMaterial,[side*.94,2.13,.86],[.42,.57,.09]);
      this.mesh(body,'sphere',this.dogEyeMaterial,[side*.40,2.28,1.53],[.09,.05,.045]);
      this.mesh(body,'cone',this.tuskMaterial,[side*.36,1.78,1.78],[.11,.77,.11]).rotation.x=Math.PI/2;
      for(const front of [-1,1]){
        this.mesh(body,'cylinder',this.elephantMaterial,[side*.58,.77,front*.72],[.29,1.40,.29]);
        this.mesh(body,'sphere',this.faceMaterial,[side*.58,.12,front*.72],[.34,.16,.36]);
      }
    }
    const curve=new T.CatmullRomCurve3([new T.Vector3(0,2.05,1.50),new T.Vector3(0,1.69,1.87),new T.Vector3(0,1.00,2.01),new T.Vector3(0,.81,2.25),new T.Vector3(0,1.07,2.38)]),up=new T.Vector3(0,1,0);
    for(let i=0;i<9;i++){
      const a=curve.getPoint(i/9),z=curve.getPoint((i+1)/9),delta=z.clone().sub(a),radius=.22-i*.012;
      const m=this.mesh(body,'cylinder',this.elephantMaterial,a.clone().add(z).multiplyScalar(.5).toArray(),[radius,delta.length()+.035,radius]);m.quaternion.setFromUnitVectors(up,delta.normalize());
      this.mesh(body,'sphere',this.elephantMaterial,z.toArray(),[radius,radius,radius]);
    }
    this.mesh(body,'cylinder',this.elephantMaterial,[0,1.08,-1.24],[.055,.80,.055]).rotation.x=.14;
    return body;
  }
  upgradeClone(c,spell){
    const body=c.body;body.clear();
    this.mesh(body,'sphere',this.cloneMaterial,[0,.99,-.13],[.55,.49,.86]);
    this.mesh(body,'sphere',this.cloneMaterial,[0,1.06,.43],[.60,.55,.44]);
    this.mesh(body,'sphere',this.cloneMaterial,[0,1.25,.73],[.40,.44,.36]);
    this.mesh(body,'sphere',this.cloneMaterial,[0,1.27,.96],[.43,.36,.37]);
    this.mesh(body,'sphere',this.faceMaterial,[0,1.15,1.21],[.33,.22,.22]);
    for(const side of [-1,1]){
      this.mesh(body,'sphere',this.faceMaterial,[side*.14,1.20,1.40],[.055,.035,.025]);
      this.mesh(body,'sphere',this.dogEyeMaterial,[side*.29,1.40,1.20],[.065,.04,.035]);
      this.mesh(body,'sphere',this.cloneMaterial,[side*.48,1.45,.81],[.23,.085,.13]).rotation.z=side*.2;
      this.mesh(body,'cone',this.hornMaterial,[side*.43,1.69,.87],[.10,.45,.10]).rotation.z=-side*.85;
      this.mesh(body,'cone',this.hornMaterial,[side*.61,1.87,.87],[.065,.34,.065]).rotation.z=side*.22;
    }
    const tail=new T.Group();tail.position.set(0,1.04,-.93);body.add(tail);
    this.mesh(tail,'cylinder',this.cloneMaterial,[0,-.25,-.03],[.045,.50,.045]).rotation.x=.12;
    this.mesh(tail,'sphere',this.faceMaterial,[0,-.51,-.06],[.09,.14,.10]);
    const limbs=[];
    for(const side of [-1,1])for(const front of [-1,1]){
      const leg=new T.Group();leg.position.set(side*.38,.86,front*.54);body.add(leg);
      this.mesh(leg,'sphere',this.cloneMaterial,[0,-.17,0],[.19,.29,.19]);
      const lower=new T.Group();lower.position.y=-.38;leg.add(lower);
      this.mesh(lower,'cylinder',this.cloneMaterial,[0,-.16,0],[.10,.33,.10]);
      this.mesh(lower,'box',this.faceMaterial,[0,-.36,.02],[.25,.17,.33]);
      limbs.push({phase:side*front,leg,lower});
    }
    c.form='bull';c.damage=spell.damage*spell.upgradeMultiplier;c.limbs=limbs;c.tail=tail;
    c.riseDepth=2.2;c.hitHeight=1.06;c.hitRadius=.85;c.pool.scale.set(1.15,1.15,1);
    if(c.mode==='rising')c.body.position.y=-c.riseDepth*(1-ease(c.age/.45));
    this.splash(c.p);return true;
  }
  cast(spell,owner,pos,dir,target,fighter,victim) {
    if(this.transition||(spell.requiresDomain&&!this.usable))return false;
    if(spell.style==='shadowclone'){
      if(this.cloneCount(owner)>=spell.maxClones){
        const dog=this.upgradable(owner)[0];return dog?this.upgradeClone(dog,spell):false;
      }
      // Each side reserves its own three slots, including clones waiting to resurface.
      const slots=[1,0,2].filter(slot=>!this.clones.some(c=>c.owner===owner&&c.rowSlot===slot));
      const count=Math.min(spell.cloneCount,spell.maxClones-this.cloneCount(owner),slots.length);
      if(count<=0)return false;
      const forward=new T.Vector3(victim.pos[0]-pos[0],0,victim.pos[2]-pos[2]).normalize(),right=new T.Vector3(-forward.z,0,forward.x);
      if(owner==='enemy')right.negate();
      const center=new T.Vector3(pos[0],0,pos[2]).lerp(new T.Vector3(victim.pos[0],0,victim.pos[2]),.25);
      for(const slot of slots.slice(0,count)){
        const p=center.clone().addScaledVector(right,(slot-1)*2.2);
        this.makeClone(owner,p.toArray(),victim.pos,spell,slot);
      }
    }else if(spell.style==='shadowcommand'){
      const clones=this.commandable(owner);if(!clones.length)return false;
      for(const c of clones){c.target=[target[0],0,target[2]];c.mode='charging';c.age=0;c.body.position.y=0;}
      this.splash(target);
    }else if(spell.style==='shadowbind'){
      for(const b of [...this.bindings])if(b.owner===owner)this.releaseBinding(b);
      const p=[target[0],0,target[2]];
      const root=new T.Group();root.position.fromArray(p);this.cloneGroup.add(root);
      root.rotation.y=Math.atan2(pos[0]-p[0],pos[2]-p[2]);
      const pool=this.mesh(root,'pool',this.faceMaterial,[0,.105,0],[1.8,1.8,1]);pool.rotation.x=-Math.PI/2;
      this.mesh(root,'ring',this.ringMaterial,[0,.13,0],[1.65,1.65,1.65]).rotation.x=-Math.PI/2;
      const elephant=this.makeElephant(root);elephant.position.y=13;elephant.scale.setScalar(1.12);
      this.bindings.push({owner,targetOwner:victim.owner,victim:null,p,root,elephant,phase:'falling',age:0,life:spell.fallTime+spell.duration,fallTime:spell.fallTime,duration:spell.duration,damage:spell.damage,impactDone:false,sink:0});this.splash(p);
    }else if(spell.style==='shadowdive'){
      for(const d of [...this.dives])if(d.owner===owner)this.removeDive(d);
      const root=new T.Group();this.cloneGroup.add(root);
      const pool=this.mesh(root,'pool',this.faceMaterial,[0,.11,0],[1.05,1.05,1]);pool.rotation.x=-Math.PI/2;
      for(const scale of [1.05,1.45])this.mesh(root,'ring',this.ringMaterial,[0,.12,0],[scale,scale,scale]).rotation.x=-Math.PI/2;
      root.position.set(pos[0],0,pos[2]);fighter.invulnerableTime=spell.duration;
      this.dives.push({owner,fighter,root,age:0,life:spell.duration,sink:0});this.splash(pos);
    }
    return true;
  }
  updateClones(dt,time,fighters,strike,crush) {
    for(const c of [...this.clones]) {
      if(!this.clones.includes(c))continue;
      c.age+=dt;const opponent=fighters.find(f=>f.owner!==c.owner);
      if(!opponent)continue;
      if(c.mode==='respawning'){
        if(!this.active){this.removeClone(c);continue;}
        if(c.age>=.7){c.mode='rising';c.age=0;c.p=[...c.home];c.body.visible=true;this.splash(c.home);}
        else continue;
      }
      if(c.mode==='rising'&&c.age>=.45){c.mode='idle';c.age=0;}
      const moving=c.mode==='charging',destination=moving?c.target:opponent.pos;
      const delta=[destination[0]-c.p[0],destination[2]-c.p[2]],dist=Math.hypot(...delta);
      if(moving){
        const travel=Math.min(dist,dt*17);if(dist>.001){c.p[0]+=delta[0]/dist*travel;c.p[2]+=delta[1]/dist*travel;}
        if(distance(c.p,destination)<.15){
          this.blastClones(c.owner,c.p,.7);
          if(distance(c.p,opponent.pos)<1.35&&opponent.fighter.invulnerableTime<=0)strike(c,[opponent.pos[0],1.5,opponent.pos[2]]);
          this.destroyClone(c);continue;
        }
      }
      c.root.position.fromArray(c.p);c.root.rotation.y=Math.atan2(delta[0],delta[1]);
      const gait=c.age*(c.form==='bull'?12:16);
      c.body.position.y=c.mode==='rising'?-c.riseDepth*(1-ease(c.age/.45)):moving?Math.abs(Math.sin(gait))*.055:0;
      c.body.rotation.z=Math.sin(time*3+c.id)*.018;c.ring.scale.setScalar(.75+Math.sin(time*2+c.id)*.06);
      c.tail.rotation.z=Math.sin(time*4+c.id)*.14;
      for(const l of c.limbs){const run=moving?Math.sin(gait)*l.phase*(c.form==='bull'?.45:.6):0;l.leg.rotation.x=run;l.lower.rotation.x=moving?Math.max(0,-run)*.7:0;}
    }
    this.updateDomainArts(dt,fighters,crush);
  }
  destroyClone(c){
    this.splash(c.p);
    if(this.active){c.mode='respawning';c.age=0;c.p=[...c.home];c.root.position.fromArray(c.p);c.body.visible=false;}
    else this.removeClone(c);
  }
  vulnerableClones(owner){return this.clones.filter(c=>c.owner!==owner&&c.mode!=='respawning'&&(c.mode!=='rising'||c.age>.2));}
  intercept(shot) {
    const a=shot.old,b=shot.p,d=b.map((v,i)=>v-a[i]),len=d.reduce((s,v)=>s+v*v,0),hits=[];
    for(const c of this.vulnerableClones(shot.owner)){
      const center=[c.p[0],c.hitHeight,c.p[2]],t=clamp(d.reduce((s,v,i)=>s+(center[i]-a[i])*v,0)/(len||1));
      if(Math.hypot(...center.map((v,i)=>v-(a[i]+d[i]*t)))<c.hitRadius+shot.size)hits.push({c,t});
    }
    hits.sort((a,b)=>a.t-b.t);if(!hits.length)return false;
    for(const {c} of hits)this.destroyClone(c);return true;
  }
  blastClones(owner,p,radius){for(const c of this.vulnerableClones(owner))if(distance(c.p,p)<=radius)this.destroyClone(c);}
  updateDomainArts(dt,fighters,crush){
    for(const b of [...this.bindings]){
      b.age+=dt;b.life=Math.max(0,b.fallTime+b.duration-b.age);
      const fall=clamp(b.age/b.fallTime);
      if(!b.impactDone&&b.age+1e-6>=b.fallTime){
        b.impactDone=true;const live=fighters.find(f=>f.owner===b.targetOwner);
        if(live&&distance(b.p,live.pos)<1.5&&live.fighter.invulnerableTime<=0){
          b.victim=live;live.fighter.darkControlTime=b.duration;
          const result=live.fighter.receive(b.damage,true,true);crush?.(b,live,result);
        }
        b.phase=b.victim?'pressing':'missed';this.blastClones(b.owner,b.p,1.5);this.splash(b.p);
      }
      if(!b.impactDone){b.elephant.position.y=13-11.3*fall*fall;b.elephant.scale.setScalar(1.6*(.7+.3*ease(b.age/.2)));}
      else{
        const press=b.age-b.fallTime;
        b.sink=b.victim?-2.9*ease(press/.45):0;
        b.elephant.position.y=1.7-2.9*ease(press/.45)-4.8*ease((press-.45)/.45);
        if(!b.victim&&press>=.9){this.releaseBinding(b);continue;}
      }
      if(b.age+1e-6>=b.fallTime+b.duration)this.releaseBinding(b);
    }
    for(const d of [...this.dives]){
      d.age+=dt;d.life-=dt;d.sink=-3*ease(d.age/.45);
      const f=fighters.find(f=>f.owner===d.owner);if(f)d.root.position.set(f.pos[0],0,f.pos[2]);
      d.root.children[1].rotation.z=d.age*.7;d.root.children[2].scale.setScalar(1.45+Math.sin(d.age*3)*.07);
      if(d.life<=1e-6)this.removeDive(d);
    }
    for(const r of [...this.recoveries]){r.age+=dt;if(r.age>=.35)this.recoveries.splice(this.recoveries.indexOf(r),1);}
  }
  depth(owner){return Math.min(0,...this.bindings.filter(b=>b.victim?.owner===owner).map(b=>b.sink),...this.dives.filter(d=>d.owner===owner).map(d=>d.sink),...this.recoveries.filter(r=>r.owner===owner).map(r=>r.sink*(1-ease(r.age/.35))));}
  diveDepth(owner){return Math.min(0,...this.dives.filter(d=>d.owner===owner).map(d=>d.sink),...this.recoveries.filter(r=>r.owner===owner&&r.kind==='dive').map(r=>r.sink*(1-ease(r.age/.35))));}
  updateSubmergeView(depth,eyeHeight){
    this.submerge.value=clamp(-depth/3);
    const below=eyeHeight<.07&&depth<0;
    this.ink.transparent=below;this.ink.depthWrite=!below;
  }
  releaseBinding(b){b.root.removeFromParent();this.bindings.splice(this.bindings.indexOf(b),1);if(b.victim){b.victim.fighter.darkControlTime=0;this.recoveries.push({owner:b.victim.owner,sink:b.sink,age:0});}}
  removeDive(d){d.root.removeFromParent();this.dives.splice(this.dives.indexOf(d),1);d.fighter.invulnerableTime=0;this.recoveries.push({owner:d.owner,kind:'dive',sink:d.sink,age:0});}
  clearDomainArts(){for(const b of [...this.bindings])this.releaseBinding(b);for(const d of [...this.dives])this.removeDive(d);this.recoveries=[];}
  splash(p) {
    const ring=new T.Mesh(this.geometries.ring,this.ringMaterial);ring.position.set(p[0],.13,p[2]);ring.rotation.x=-Math.PI/2;
    this.cloneGroup.add(ring);this.ripples.push({ring,age:0});
  }
  visuals(dt,time,shots) {
    const living=new Set(shots.filter(s=>s.element==='dark'));
    for(const [s,g] of this.projectiles)if(!living.has(s)){g.removeFromParent();this.projectiles.delete(s);}
    for(const s of living){
      let g=this.projectiles.get(s);
      if(!g){g=new T.Group();this.mesh(g,'sphere',this.cloneMaterial,[0,0,0],[1,1,1]);this.mesh(g,'sphere',this.eyeMaterial,[0,0,0],[.18,.18,.18]);this.group.add(g);this.projectiles.set(s,g);}
      g.position.fromArray(s.p);g.scale.setScalar(s.size);g.rotation.set(time*3,time*4,time);g.children[0].scale.set(1+Math.sin(time*9)*.1,1.1,.85);
    }
    for(let i=this.ripples.length-1;i>=0;i--){const r=this.ripples[i];r.age+=dt;r.ring.scale.setScalar(.3+r.age*2.2);r.ring.visible=r.age<.8;
      if(r.age>=.8){r.ring.removeFromParent();this.ripples.splice(i,1);}}
  }
  removeClone(c){c.root.removeFromParent();const i=this.clones.indexOf(c);if(i>=0)this.clones.splice(i,1);}
  clearClones(){for(const c of [...this.clones])this.removeClone(c);for(const g of this.projectiles.values())g.removeFromParent();this.projectiles.clear();for(const r of this.ripples)r.ring.removeFromParent();this.ripples=[];}
  reset(){this.transition=null;this.life=0;this.blink=0;this.blinkPhase='idle';this.intro.reset();this.switchEnvironment(false);this.clearClones();this.updateSubmergeView(0,1.72);this.overlay.classList.remove('blinking');this.overlay.style.setProperty('--lid',0);}
  state(){return {active:this.active,usable:this.usable,life:this.life,blink:this.blink||0,phase:this.blinkPhase||'idle',intro:this.intro.state(),environmentHidden:this.world.environment.every(o=>!o.visible),clones:this.clones.map(c=>({id:c.id,owner:c.owner,form:c.form,legs:c.limbs.length,damage:c.damage,rowSlot:c.rowSlot,mode:c.mode,position:[...c.p],home:[...c.home],age:c.age})),bindings:this.bindings.map(b=>({owner:b.owner,victim:b.victim?.owner||null,form:'elephant',phase:b.phase,position:[...b.p],elephantPosition:b.elephant.position.toArray(),life:b.life,age:b.age,fallTime:b.fallTime,duration:b.duration,impactDone:b.impactDone,sink:b.sink})),dives:this.dives.map(d=>({owner:d.owner,life:d.life,age:d.age,sink:d.sink})),depth:{player:this.depth('player'),enemy:this.depth('enemy')},projectiles:this.projectiles.size};}
}
