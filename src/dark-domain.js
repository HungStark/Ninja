import * as T from 'three';
import { vfxToon } from './vfx-materials.js';
import { DarkDomainIntro } from './dark-domain-intro.js';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);

export class DarkDomain {
  constructor(world,reducedMotion=false) {
    this.world=world;this.scene=world.scene;this.reducedMotion=reducedMotion;
    this.active=false;this.transition=null;this.life=0;this.clones=[];this.projectiles=new Map();this.ripples=[];this.serial=0;
    this.saved=null;this.group=new T.Group();this.group.name='BlackInkDomain';this.group.visible=false;this.scene.add(this.group);
    this.overlay=document.getElementById('darkEyelids');
    this.header=document.querySelector('.header-center');this.headerText=this.header.innerHTML;
    this.clock={value:0};
    this.ink=new T.ShaderMaterial({side:T.DoubleSide,uniforms:{uTime:this.clock},
      vertexShader:`varying vec3 p;uniform float uTime;void main(){p=position;vec3 v=position;
        v.z+=sin(position.x*.28+uTime*.75)*.036+sin(position.y*.35-uTime*.6)*.032;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(v,1.);}`,
      fragmentShader:`varying vec3 p;uniform float uTime;
    void main(){
      vec2 q=p.xy;
      float wave=sin(q.x*.32+sin(q.y*.23+uTime*.4)*1.5+uTime*.5)+sin(q.y*.52-q.x*.14-uTime*.35)*.4;
      vec3 c=vec3(.010,.007,.019);
      if(wave>.50)c=vec3(.023,.014,.036);
      if(wave>1.18)c=vec3(.042,.025,.058);
      gl_FragColor=vec4(c,1.);
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
    this.cloneMaterial=vfxToon('#3a2b47', { emissive:'#261a32', emissiveIntensity:.20 });
    this.faceMaterial=vfxToon('#130e1e');
    this.eyeMaterial=new T.MeshBasicMaterial({color:'#c2a1ef'});
    this.ringMaterial=new T.MeshBasicMaterial({color:'#71638a',transparent:true,opacity:.35,depthWrite:false});
    this.geometries={sphere:new T.SphereGeometry(1,14,10),cylinder:new T.CylinderGeometry(1,1,1,10),box:new T.BoxGeometry(1,1,1),cone:new T.ConeGeometry(1,1,12),pool:new T.CircleGeometry(1,32),ring:new T.TorusGeometry(1,.018,5,48)};
    this.cloneGroup=new T.Group();this.group.add(this.cloneGroup);
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
    if(!ink){this.clearClones();this.header.innerHTML=this.headerText;}
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
  makeClone(owner,mode,p,target,spell) {
    const root=new T.Group(),body=new T.Group();root.add(body);this.cloneGroup.add(root);
    this.mesh(body,'cylinder',this.cloneMaterial,[0,1.55,0],[.32,.77,.23]);
    this.mesh(body,'cone',this.cloneMaterial,[0,1.1,0],[.42,.65,.29]).rotation.z=Math.PI;
    this.mesh(body,'sphere',this.cloneMaterial,[0,2.27,0],[.24,.3,.24]);
    this.mesh(body,'sphere',this.faceMaterial,[0,2.19,.14],[.24,.14,.13]);
    for(const side of [-1,1])this.mesh(body,'box',this.eyeMaterial,[side*.09,2.31,.233],[.09,.019,.012]);
    const limbs=[];
    for(const side of [-1,1]) {
      const arm=new T.Group();arm.position.set(side*.34,1.86,0);body.add(arm);
      this.mesh(arm,'cylinder',this.cloneMaterial,[0,-.25,0],[.105,.5,.105]);
      const forearm=new T.Group();forearm.position.y=-.5;arm.add(forearm);
      this.mesh(forearm,'cylinder',this.cloneMaterial,[0,-.19,0],[.085,.38,.085]);
      this.mesh(forearm,'sphere',this.cloneMaterial,[0,-.4,0],[.10,.13,.10]);
      const leg=new T.Group();leg.position.set(side*.17,1.04,0);body.add(leg);
      this.mesh(leg,'cylinder',this.cloneMaterial,[0,-.40,0],[.12,.77,.12]);
      this.mesh(leg,'sphere',this.faceMaterial,[0,-.94,.09],[.14,.12,.23]);
      limbs.push({side,arm,forearm,leg});
    }
    const pool=this.mesh(root,'pool',this.faceMaterial,[0,.06,0],[.8,.8,1]);pool.rotation.x=-Math.PI/2;
    const ring=this.mesh(root,'ring',this.ringMaterial,[0,.09,0],[.7,.7,.7]);ring.rotation.x=-Math.PI/2;
    const clone={id:++this.serial,owner,mode,p:[p[0],0,p[2]],target:[...target],age:0,life:spell.duration,damage:spell.damage,root,body,limbs,ring,shots:0,hp:45,fighter:null};
    root.position.fromArray(clone.p);body.position.y=-2.55;
    this.clones.push(clone);this.splash(p);return clone;
  }
  cast(spell,owner,pos,dir,target,fighter) {
    if(!this.usable)return null;
    const length=Math.hypot(dir[0],dir[2])||1,forward=[dir[0]/length,0,dir[2]/length],right=[-forward[2],0,forward[0]];
    const spawn=(along,side)=>[pos[0]+forward[0]*along+right[0]*side,0,pos[2]+forward[2]*along+right[2]*side];
    const relevant=this.clones.filter(c=>c.owner===owner);
    // Bound persistent summons without letting a recast erase the other spell's clones.
    const mode={shadowclone:'melee',shadowshot:'shooter',shadowpack:'pack',shadowguard:'guard',shadowswap:'decoy'}[spell.style];
    for(const c of relevant)if(c.mode===mode)this.removeClone(c);
    if(mode==='melee')this.makeClone(owner,mode,spawn(1.8,.95),target,spell);
    if(mode==='shooter')for(const side of [-1,1])this.makeClone(owner,mode,spawn(3.5,side*1.6),target,spell);
    if(mode==='pack')for(let i=0;i<4;i++){
      const a=i*Math.PI/2+Math.PI/4;this.makeClone(owner,mode,[target[0]+Math.cos(a)*3.5,0,target[2]+Math.sin(a)*3.5],target,spell);
    }
    if(mode==='guard'){
      fighter.defend(spell);const c=this.makeClone(owner,mode,spawn(2,0),target,spell);c.fighter=fighter;c.forward=forward;
    }
    if(mode==='decoy'){
      const candidate=this.clones.find(c=>c.owner===owner&&c.mode==='shooter'&&distance(c.p,pos)>1);
      const side=pos[0]>=0?-1:1,destination=candidate?[...candidate.p]:[clamp(pos[0]+side*3.6,-5.4,5.4),0,pos[2]];
      destination[0]=clamp(destination[0],-5.4,5.4);destination[2]=clamp(destination[2],-31,10);
      if(candidate){candidate.p=[pos[0],0,pos[2]];candidate.mode='decoy';candidate.age=.4;candidate.life=spell.duration;}
      else this.makeClone(owner,mode,pos,target,spell);
      this.splash(destination);return destination;
    }
    return null;
  }
  updateClones(dt,time,fighters,strike,shoot) {
    if(!this.active)return;
    for(const c of [...this.clones]) {
      if(!this.clones.includes(c))continue;
      c.age+=dt;c.life-=dt;const own=fighters.find(f=>f.owner===c.owner),opponent=fighters.find(f=>f.owner!==c.owner);
      if(!own||!opponent||c.life<=0||own.fighter.hp<=0||opponent.fighter.hp<=0){this.removeClone(c);continue;}
      if(c.mode==='guard') {
        if(c.fighter.defenseElement!=='dark'||c.fighter.shieldTime<=0||c.fighter.shield<=0){this.removeClone(c);continue;}
        c.p[0]=own.pos[0]+c.forward[0]*2;c.p[2]=own.pos[2]+c.forward[2]*2;
      }
      const destination=c.mode==='pack'?c.target:opponent.pos,delta=[destination[0]-c.p[0],destination[2]-c.p[2]],dist=Math.hypot(...delta);
      if(['melee','pack'].includes(c.mode)&&c.age>.4) {
        const travel=Math.min(dist,dt*(c.mode==='pack'?10:17));if(dist>.01){c.p[0]+=delta[0]/dist*travel;c.p[2]+=delta[1]/dist*travel;}
        if(distance(c.p,destination)<.55){
          if(distance(c.p,opponent.pos)<1.35)strike(c,[opponent.pos[0],1.5,opponent.pos[2]]);
          this.splash(c.p);this.removeClone(c);continue;
        }
      }
      if(c.mode==='shooter'&&c.shots<2&&c.age>=.65+c.shots*.6){shoot(c,[c.p[0],1.7,c.p[2]],opponent.pos);c.shots++;}
      c.root.position.fromArray(c.p);c.root.rotation.y=Math.atan2(delta[0],delta[1]);
      c.body.position.y=-2.55*(1-ease(c.age/.4));
      c.body.rotation.z=Math.sin(time*3+c.id)*.018;c.ring.scale.setScalar(.75+Math.sin(time*2+c.id)*.06);
      for(const l of c.limbs){
        const run=['melee','pack'].includes(c.mode)?Math.sin(c.age*16)*l.side*.65:Math.sin(time*2+c.id)*.04;
        l.leg.rotation.x=run;l.arm.rotation.x=c.mode==='shooter'?-1.65:c.mode==='guard'?-1.05:-run;
        l.forearm.rotation.x=c.mode==='guard'?-1.1:c.mode==='shooter'?-.45:-.35;
      }
    }
  }
  intercept(shot) {
    if(!this.active)return false;
    for(const c of this.clones) {
      if(c.owner===shot.owner||!['guard','decoy'].includes(c.mode)||c.age<.3)continue;
      if(c.mode==='guard'&&(c.fighter.defenseElement!=='dark'||c.fighter.shieldTime<=0||c.fighter.shield<=0))continue;
      const a=shot.old,b=shot.p,d=b.map((v,i)=>v-a[i]),center=[c.p[0],1.55,c.p[2]],len=d.reduce((s,v)=>s+v*v,0);
      const t=clamp(d.reduce((s,v,i)=>s+(center[i]-a[i])*v,0)/(len||1));
      if(Math.hypot(...center.map((v,i)=>v-(a[i]+d[i]*t)))>.9+shot.size)continue;
      this.splash(center);
      if(c.mode==='guard'){
        const absorbed=Math.min(c.fighter.shield,shot.damage);c.fighter.shield-=absorbed;shot.damage-=absorbed;
        if(c.fighter.shield<=0)this.removeClone(c);return shot.damage<=0;
      }
      c.hp-=shot.damage;if(c.hp<=0)this.removeClone(c);return true;
    }
    return false;
  }
  splash(p) {
    if(!this.active)return;
    const ring=new T.Mesh(this.geometries.ring,this.ringMaterial);ring.position.set(p[0],.13,p[2]);ring.rotation.x=-Math.PI/2;
    this.group.add(ring);this.ripples.push({ring,age:0});
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
  reset(){this.transition=null;this.life=0;this.blink=0;this.blinkPhase='idle';this.intro.reset();this.switchEnvironment(false);this.overlay.classList.remove('blinking');this.overlay.style.setProperty('--lid',0);}
  state(){return {active:this.active,usable:this.usable,life:this.life,blink:this.blink||0,phase:this.blinkPhase||'idle',intro:this.intro.state(),environmentHidden:this.world.environment.every(o=>!o.visible),clones:this.clones.map(c=>({id:c.id,owner:c.owner,mode:c.mode,position:[...c.p],life:c.life,age:c.age,shots:c.shots})),projectiles:this.projectiles.size};}
}
