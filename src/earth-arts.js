import * as T from 'three';
import { vfxToon } from './vfx-materials.js';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[2]-b[2]);
const add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,s)=>a.map(v=>v*s),sub=(a,b)=>a.map((v,i)=>v-b[i]);
const unit=v=>mul(v,1/(Math.hypot(...v)||1));
const random=seed=>{const v=Math.sin(seed*127.1+311.7)*43758.5453;return v-Math.floor(v);};

export class EarthArts {
  constructor(scene){
    this.scene=scene;this.effects=[];this.bursts=[];this.serial=0;this.revision=0;
    this.rock=vfxToon('#ba9366');this.dark=vfxToon('#796049');this.light=vfxToon('#d5b283');
    this.soil=vfxToon('#986d4c');
    this.black=new T.MeshBasicMaterial({color:'#090709'});this.ink=new T.LineBasicMaterial({color:'#3e3026',transparent:true,opacity:.55});
    this.mark=new T.MeshBasicMaterial({color:'#bb965d',transparent:true,opacity:.62,depthWrite:false});
    this.geo={rock:new T.DodecahedronGeometry(1),slab:new T.CylinderGeometry(1,.82,1,7),spike:new T.ConeGeometry(1,1,6),box:new T.BoxGeometry(1,1,1),core:new T.SphereGeometry(1,20,14),ring:new T.TorusGeometry(1,.024,5,64)};
    this.edges=new T.EdgesGeometry(this.geo.rock);
    this.cracks=new T.BufferGeometry();this.cracks.setAttribute('position',new T.Float32BufferAttribute([-.48,.3,0,-.06,.1,0,-.06,.1,0,.2,-.18,0,.2,-.18,0,.48,-.32,0,-.06,.1,0,-.2,-.25,0,-.2,-.25,0,-.08,-.46,0,.2,-.18,0,.46,.14,0],3));
  }
  group(){const root=new T.Group();this.scene.add(root);return root;}
  mesh(root,kind,material,p=[0,0,0],scale=[1,1,1]){const m=new T.Mesh(this.geo[kind],material);m.position.fromArray(p);m.scale.fromArray(scale);m.castShadow=m.receiveShadow=true;root.add(m);return m;}
  // Ribbons have a real width at a distance and follow the deformed surface, including road tiles.
  fractures(e,segments){
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(segments.length*18),3));
    const material=new T.MeshBasicMaterial({color:'#30251d',side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
    const mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;e.root.add(mesh);e.fractures={mesh,segments};e.materials.push(material);e.geometries.push(geometry);
  }
  trailPulse(e,at){if(at>e.travel/e.spell.speed)return 0;const age=e.age-at;return ease(age/.045)*(1-ease((age-.18)/.55));}
  fractureGrowth(e,s){return s.trail?this.trailPulse(e,s.at):ease((e.age-s.at)/.1)*ease(e.life/.35);}
  updateFractures(e){
    if(!e.fractures)return;const p=e.fractures.mesh.geometry.attributes.position;let visible=false;
    for(let i=0;i<e.fractures.segments.length;i++){
      const s=e.fractures.segments[i],growth=this.fractureGrowth(e,s),dx=s.b[0]-s.a[0],dz=s.b[2]-s.a[2],length=Math.hypot(dx,dz)||1,width=s.width*growth,ox=-dz/length*width,oz=dx/length*width;
      visible||=growth>.001;
      const points=[[s.a[0]+ox,s.a[2]+oz],[s.a[0]-ox,s.a[2]-oz],[s.b[0]+ox,s.b[2]+oz],[s.a[0]-ox,s.a[2]-oz],[s.b[0]-ox,s.b[2]-oz],[s.b[0]+ox,s.b[2]+oz]];
      for(let j=0;j<6;j++){const [x,z]=points[j];p.setXYZ(i*6+j,x,this.heightAt(x,z)+.17,z);}
    }
    e.fractures.mesh.visible=visible;p.needsUpdate=true;
  }
  trailHeight(e,x,z){
    const dx=x-e.origin[0],dz=z-e.origin[2],along=dx*e.axis[0]+dz*e.axis[2],side=Math.abs(dx*-e.axis[2]+dz*e.axis[0]);
    if(along<1.2||along>e.travel||side>.9)return 0;
    return .24*(1-ease(side/.9))*this.trailPulse(e,along/e.spell.speed);
  }
  corePosition(e){const t=ease(e.age/e.throwEnd),p=add(e.coreOrigin,mul(sub(e.orb,e.coreOrigin),t));p[1]+=Math.sin(t*Math.PI)*3;return p;}
  liftDistance(e,elapsed){const t=Math.max(0,elapsed);return e.spell.pullSpeed*t+.5*e.spell.pullAcceleration*t*t;}
  liftTravelTime(e,length){const speed=e.spell.pullSpeed,acceleration=e.spell.pullAcceleration;return (Math.sqrt(speed*speed+2*acceleration*length)-speed)/acceleration;}
  centerHeight(e){return Math.min(e.orb[1]-1.72,e.baseHeight+.14+this.liftDistance(e,e.age-e.spell.chargeTime));}
  rockProgress(e,n){return clamp(this.liftDistance(e,e.age-n.liftAt)/n.pathLength);}
  rockPosition(e,n){return n.path.getPointAt(this.rockProgress(e,n)).toArray();}
  gravityStage(e){return e.age<e.throwEnd?'throwing':e.age<e.spell.chargeTime?'fracturing':e.age<e.spell.chargeTime+.6?'lifting-center':e.age<e.pullEnd?'gathering':e.age<e.holdEnd?'caged':e.age<e.landTime?'falling':'crater';}
  viewTarget(e){
    const down=ease((e.age-e.throwEnd)/.18),ground=add(e.center,[0,1+Math.max(0,this.centerHeight(e)-e.baseHeight),0]);
    return add(mul(this.corePosition(e),1-down),mul(ground,down));
  }
  target(owner,pos,dir,actors){
    const victim=actors.find(a=>a.owner!==owner),axis=unit(dir);
    if(victim){const delta=sub(victim.pos,pos),along=delta.reduce((sum,v,i)=>sum+v*axis[i],0),off=Math.hypot(...sub(delta,mul(axis,along)));if(along>0&&along<55&&off<1.2)return [victim.pos[0],this.heightAt(victim.pos[0],victim.pos[2]),victim.pos[2]];}
    const reach=axis[1]<-.025?clamp(-pos[1]/axis[1],6,55):31,p=add(pos,mul(axis,reach));p[1]=this.heightAt(p[0],p[2]);return p;
  }
  cast(owner,spell,pos,dir,actors,walls=[]){
    const kind={earthspikes:'spikes',earthcraterspikes:'craterspikes',earthquake:'quake',earthwall:'wall',earthgravity:'gravity'}[spell.style];
    if(!kind)throw new Error('Unknown Earth spell: '+spell.style);
    const crater=kind==='craterspikes'?this.crater(owner):null;
    if(kind==='craterspikes'&&!crater)return null;
    // Replace the caster's old field of this kind, but allow different terrain arts to combine.
    for(const e of [...this.effects])if(e.owner===owner&&e.kind===kind)this.remove(e,walls);
    let axis=unit([dir[0],0,dir[2]]);if(Math.hypot(...axis)<.5)axis=[0,0,-1];
    const center=crater?[...crater.center]:kind==='wall'?add(pos,mul(axis,3)):this.target(owner,pos,dir,actors);center[1]=this.heightAt(center[0],center[2]);
    const root=this.group(),e={id:++this.serial,owner,spell,kind,root,center,axis,age:0,life:spell.duration||0,baseHeight:center[1],phase:'forming',hitOwners:new Set(),materials:[],geometries:[],nodes:[],capture:null};
    if(kind==='spikes'){
      e.life=spell.range/spell.speed+spell.duration+.95;e.phase='tunneling';e.travel=0;e.origin=[...pos];e.headPosition=[...pos];
      e.head=this.mesh(root,'rock',this.dark,pos,[.42,.045,.55]);
      const side=[axis[2],0,-axis[0]],segments=[];e.trailRocks=[];
      for(let along=1.5,i=0;along<spell.range;along+=.85,i++){
        const a=add(pos,add(mul(axis,along),mul(side,(i%2?1:-1)*.13))),b=add(pos,add(mul(axis,along+.85),mul(side,(i%2?-1:1)*.13))),at=(along+.4)/spell.speed;
        segments.push({a,b,width:.085,at,trail:true});
        if(i%2===0){const branch=add(b,add(mul(side,(i%4?1:-1)*.7),mul(axis,.3)));segments.push({a:b,b:branch,width:.055,at,trail:true});}
        for(const sign of [-1,1]){const p=add(a,mul(side,sign*.3)),mesh=this.mesh(root,'rock',i%3?this.rock:this.dark,p,[.34,.12,.5]);mesh.visible=false;e.trailRocks.push({p,mesh,at,sign});}
      }
      this.fractures(e,segments);
    }else if(kind==='craterspikes'){
      e.crater=crater;e.life=crater.life;e.phase='rising';
      for(let ring=0;ring<4;ring++){
        const count=ring?ring*6+2:1,radius=ring*1.48;
        for(let i=0;i<count;i++){
          const a=i/count*Math.PI*2+ring*.33,p=add(center,[Math.cos(a)*radius,0,Math.sin(a)*radius]);
          const mesh=this.mesh(root,'spike',i%3?this.rock:this.light);mesh.visible=false;
          e.nodes.push({p,mesh,delay:ring*.055,height:2.5-ring*.22,started:false});
        }
      }
    }else if(kind==='wall'){
      e.hp=spell.shield;e.maxHp=spell.shield;e.wallRefs=[];e.crackMat=this.ink.clone();e.materials.push(e.crackMat);
      const side=[axis[2],0,-axis[0]];
      for(let i=0;i<7;i++){
        const x=(i-3)*1.04,p=add(add(center,mul(side,x)),mul(axis,.075*x*x));p[1]=this.heightAt(p[0],p[2]);
        const n=unit(add(axis,mul(side,-.15*x))),part=new T.Group();root.add(part);part.position.fromArray(p);part.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(...n));
        this.mesh(part,'box',i%2?this.dark:this.rock,[0,spell.wallHeight/2,0],[1.15,spell.wallHeight,.65]);
        for(let j=0;j<3;j++)this.mesh(part,'rock',j%2?this.light:this.rock,[(j%2-.5)*.35,.5+j*.95,.32],[.40,.40,.20]);
        for(const z of [-.34,.34]){const crack=new T.LineSegments(this.cracks,e.crackMat);crack.position.set(0,spell.wallHeight/2,z);crack.scale.set(1,spell.wallHeight,1);part.add(crack);}
        e.nodes.push({p,part});
        const wall={owner,element:'earth',earthEffect:e,p:[...p],normal:n,width:1.45,height:spell.wallHeight};
        Object.defineProperties(wall,{hp:{get:()=>e.hp,set:v=>{e.hp=Math.max(0,v);},enumerable:true},life:{get:()=>e.life,enumerable:true}});
        e.wallRefs.push(wall);walls.push(wall);
      }
    }else if(kind==='gravity'){
      e.pullEnd=spell.chargeTime+spell.pullTime;e.holdEnd=e.pullEnd+spell.holdTime;e.landTime=e.holdEnd+spell.fallTime;e.life=e.landTime+spell.craterTime;e.phase='charging';e.captureChecked=false;
      e.throwEnd=spell.chargeTime*.65;e.coreOrigin=add(pos,mul(axis,.8));e.coreOrigin[1]+=.12;
      e.orb=[center[0],18+center[1],center[2]];e.core=this.mesh(root,'core',this.black,e.coreOrigin,[.28,.28,.28]);
      e.mass=this.mesh(root,'rock',this.dark,e.orb,[0,0,0]);e.mass.visible=false;
      e.platform=new T.Group();root.add(e.platform);
      this.mesh(e.platform,'slab',this.dark,[0,-.5,0],[1.85,1,1.85]);this.mesh(e.platform,'slab',this.soil,[0,-.02,0],[1.9,.12,1.9]);
      for(let i=0;i<8;i++){const a=i/8*Math.PI*2;this.mesh(e.platform,'rock',i%2?this.rock:this.dark,[Math.cos(a)*1.4,-.65,Math.sin(a)*1.4],[.6,.65,.6]);}
      e.platform.visible=false;
      const segments=[];
      for(let i=0;i<12;i++){
        const angle=i/12*Math.PI*2;
        for(let j=0;j<7;j++){
          const r=.55+j*.85,next=r+.85,a=angle+Math.sin(j*2.1+i)*.09,b=angle+Math.sin((j+1)*2.1+i)*.09;
          const p=add(center,[Math.cos(a)*r,0,Math.sin(a)*r]),q=add(center,[Math.cos(b)*next,0,Math.sin(b)*next]),at=e.throwEnd+r/spell.craterRadius*.27;
          segments.push({a:p,b:q,width:.10+(i%3)*.025,at});
          if(j===2||j===5){const c=add(q,[Math.cos(b+.65)*.8,0,Math.sin(b+.65)*.8]);segments.push({a:q,b:c,width:.07,at:at+.03});}
        }
      }
      for(const radius of [1.9,3.4,5])for(let i=0;i<32;i++){
        const a=i/32*Math.PI*2,b=(i+1)/32*Math.PI*2,r=radius+(i%2)*.14,s=radius+((i+1)%2)*.14;
        segments.push({a:add(center,[Math.cos(a)*r,0,Math.sin(a)*r]),b:add(center,[Math.cos(b)*s,0,Math.sin(b)*s]),width:.10,at:e.throwEnd+radius/spell.craterRadius*.27});
      }
      this.fractures(e,segments);
      e.warning=this.mesh(root,'ring',this.mark,[center[0],center[1]+.08,center[2]],[spell.radius,spell.radius,spell.radius]);e.warning.rotation.x=-Math.PI/2;
      for(let i=0;i<100;i++){
        const seed=e.id*179+i*17,index=i*37%100,a=index*2.39996,y=1-2*(index+.5)/100,r=Math.sqrt(1-y*y),target=[Math.cos(a)*r*4.4,y*4.4,Math.sin(a)*r*4.4];
        const angle=random(seed)*Math.PI*2,radius=2.4+Math.sqrt(random(seed+1))*3.35;
        const source=add(center,[Math.cos(angle)*radius,-.4,Math.sin(angle)*radius]);source[1]+=this.heightAt(source[0],source[2]);
        const rock=this.mesh(root,i%4?'slab':'rock',i%3?this.rock:this.dark,source,[.7+(i%5)*.12,.7+(i%3)*.16,.8+(i%4)*.12]);rock.visible=false;
        const destination=add(e.orb,target),first=add(source,[(random(seed+2)-.5)*1.4,2.8+random(seed+3)*.7,(random(seed+4)-.5)*1.4]);
        const middle=add(add(source,mul(sub(destination,source),.58)),[(random(seed+5)-.5)*4,(random(seed+6)-.5)*1.2,(random(seed+7)-.5)*4]);
        const path=new T.CatmullRomCurve3([new T.Vector3(...source),new T.Vector3(...first),new T.Vector3(...middle),new T.Vector3(...destination)],false,'centripetal');path.arcLengthDivisions=96;
        const batch=Math.floor(i/spell.liftBatchSize),pathLength=path.getLength(),liftAt=spell.chargeTime+.6+batch*spell.liftBatchInterval,spin=[random(seed+9)-.5,random(seed+10)-.5,random(seed+11)-.5];
        e.nodes.push({source,target,path,pathLength,spin,mesh:rock,liftAt,batch});
      }
      // Finish only after every batch has accelerated along its full path.
      e.pullEnd=Math.max(e.pullEnd,...e.nodes.map(n=>n.liftAt+this.liftTravelTime(e,n.pathLength)));e.holdEnd=e.pullEnd+spell.holdTime;e.landTime=e.holdEnd+spell.fallTime;e.life=e.landTime+spell.craterTime;
    }else{
      if(kind==='quake')e.life=spell.duration+spell.residualTime;
      e.marker=this.mesh(root,'ring',this.mark,[center[0],center[1]+.04,center[2]],[spell.radius,spell.radius,spell.radius]);e.marker.rotation.x=-Math.PI/2;
      if(kind==='quake')for(let i=0;i<20;i++){const a=i*2.399,r=1+(i%5);const p=add(center,[Math.cos(a)*r,0,Math.sin(a)*r]);e.nodes.push({p,mesh:this.mesh(root,'rock',i%2?this.rock:this.dark,p,[.6,.45,.65])});}
    }
    if(['quake','gravity'].includes(kind)){
      const vertices=[],indices=[],segments=48,rings=12;
      for(let r=0;r<=rings;r++)for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;vertices.push(Math.cos(a)*r/rings,0,Math.sin(a)*r/rings);}
      for(let r=0;r<rings;r++)for(let i=0;i<segments;i++){const a=r*(segments+1)+i,b=a+1,c=a+segments+1,d=c+1;indices.push(a,b,c,b,d,c);}
      const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
      e.patch=new T.Mesh(geometry,this.soil);e.patch.position.fromArray(center);e.patch.frustumCulled=false;e.patch.receiveShadow=true;root.add(e.patch);e.patchCoordinates=new Float32Array(vertices);
    }
    this.effects.push(e);this.revision++;return e;
  }
  crater(owner){return this.effects.find(e=>e.owner===owner&&e.kind==='gravity'&&e.age>=e.pullEnd&&e.life>.35);}
  spikeHeight(e,node){const age=e.age-node.delay;if(age<0)return 0;if(e.kind==='craterspikes')return node.height*ease(age/.25)*ease(e.life/.35);if(age>e.spell.duration+.95)return 0;const height=age<.55?2.5*ease(age/.18):.35+2.15*(1-ease((age-.55)/.4));return height*ease((e.spell.duration+.95-age)/.3);}
  heightAt(x,z,exclude=null){
    let h=0;
    for(const e of this.effects){
      if(e===exclude)continue;
      const fade=ease(e.life/.35),d=Math.hypot(x-e.center[0],z-e.center[2]);
      if(e.kind==='gravity'&&e.age>=e.spell.chargeTime){
        const age=e.age-e.spell.chargeTime,shape=1-ease(d/e.spell.craterRadius);
        const lift=1.8*(1-ease(d/2.1))*ease(age/.3)*(1-ease((age-.5)/.35));
        h+=(lift-2.7*shape*ease((age-.45)/(e.spell.pullTime-.75)))*fade;
      }
      else if(e.kind==='quake'&&d<e.spell.radius){
        const phase=Math.floor((x-e.center[0])/1.6)*1.73+Math.floor((z-e.center[2])/1.6)*2.1;
        const moving=Math.sin(e.age*Math.PI*2+phase)*1.05,residual=Math.sin(phase)*.42-.1;
        const height=T.MathUtils.lerp(moving,residual,ease((e.age-e.spell.duration+.15)/.3));h+=height*(1-ease(d/e.spell.radius))*ease(e.age/.2)*fade;
      }else if(e.kind==='spikes'){let ridge=this.trailHeight(e,x,z);for(const n of e.nodes){const r=Math.hypot(x-n.p[0],z-n.p[2]);if(r<.95)ridge=Math.max(ridge,.35*(1-ease(r/.95))*clamp(this.spikeHeight(e,n)/.35));}h+=ridge;}
    }
    return clamp(h,-4,2.5);
  }
  solidHeightAt(x,z){let height=this.heightAt(x,z);for(const e of this.effects)if(['spikes','craterspikes'].includes(e.kind))for(const n of e.nodes){const r=Math.hypot(x-n.p[0],z-n.p[2]);if(r<.7)height=Math.max(height,this.heightAt(x,z,e)+.14+this.spikeHeight(e,n)*(1-r/.7));}return height;}
  captured(owner){return this.effects.find(e=>e.capture?.owner===owner&&e.age<e.landTime);}
  floor(owner,x,z){const e=this.captured(owner);return e?e.capture.height:this.heightAt(x,z);}
  slowAt(x,z){let slow=1;for(const e of this.effects)if(['spikes','craterspikes'].includes(e.kind)&&e.nodes.some(n=>Math.hypot(x-n.p[0],z-n.p[2])<.95&&this.spikeHeight(e,n)>0))slow=Math.min(slow,.65);return slow;}
  blocked(x,z,foot){return this.effects.some(e=>e.kind==='wall'&&e.hp>0&&e.nodes.some((node,i)=>{
    const n=e.wallRefs[i].normal,dx=x-node.p[0],dz=z-node.p[2],along=dx*n[0]+dz*n[2],side=dx*-n[2]+dz*n[0];
    return Math.abs(along)<.6&&Math.abs(side)<.91&&foot<node.p[1]+e.spell.wallHeight;
  }));}
  move(start,end){
    const n=Math.max(1,Math.ceil(distance(start,end)/.12));let free=[...start];
    for(let i=1;i<=n;i++){const p=add(start,mul(sub(end,start),i/n)),ground=this.heightAt(p[0],p[2]);if(this.blocked(p[0],p[2],start[1]-1.72)||this.solidHeightAt(p[0],p[2])-this.heightAt(free[0],free[2])>.7)break;free=[p[0],p[1],p[2]];}
    return free;
  }
  intersectTerrain(start,end,padding=.04){
    if(!this.effects.some(e=>e.kind!=='wall'))return null;
    const delta=sub(end,start),steps=Math.min(256,Math.max(2,Math.ceil(Math.hypot(...delta)/.18)));
    for(let i=1;i<=steps;i++){const t=i/steps,p=add(start,mul(delta,t));if(p[1]<=this.solidHeightAt(p[0],p[2])+padding)return p;}
    return null;
  }
  hit(e,actor,amount,damage,blast){
    const shot={owner:e.owner,element:'earth',style:e.spell.style,color:'#d9ae69',damage:amount,v:[0,1,0],unreflectable:true};
    const result=damage(shot,actor.pos);blast?.(e.owner,actor.pos,.9);return result;
  }
  burst(pos,scale=1){const root=this.group();root.position.fromArray(pos);const rocks=[];for(let i=0;i<12;i++){const a=i*2.399,mesh=this.mesh(root,'rock',i%2?this.rock:this.light,[0,0,0],[.06*scale,.06*scale,.06*scale]);rocks.push({mesh,v:[Math.cos(a)*scale*2,(1+i%3)*scale,Math.sin(a)*scale*2]});}this.bursts.push({root,age:0,rocks});}
  remove(e,walls=[]){if(!this.effects.includes(e))return;for(const child of [...this.effects])if(child.crater===e)this.remove(child,walls);if(e.capture)e.capture.fighter.earthControlTime=0;e.root.removeFromParent();for(const m of e.materials)m.dispose();for(const g of e.geometries)g.dispose();e.patch?.geometry.dispose();this.effects=this.effects.filter(x=>x!==e);for(let i=walls.length-1;i>=0;i--)if(walls[i].earthEffect===e)walls.splice(i,1);this.revision++;}
  advance(dt,actors,walls,damage,setPosition=()=>{},event=()=>{},blast=()=>{},intercept=()=>false){
    if(dt<=0)return;
    if(this.effects.length)this.revision++;
    for(const e of [...this.effects]){
      if(!this.effects.includes(e))continue;
      const old=e.age;e.age+=Math.min(dt,e.life);e.life=Math.max(0,e.life-dt);const victim=actors.find(a=>a.owner!==e.owner);
      if(e.kind==='spikes'){
        if(e.eruptedAt===undefined){
          const from=e.travel,old=[...e.headPosition];e.travel=Math.min(e.spell.range,e.travel+e.spell.speed*dt);e.headPosition=add(e.origin,mul(e.axis,e.travel));
          if(intercept({owner:e.owner,old,p:[...e.headPosition],size:.45})){this.remove(e,walls);continue;}
          if(victim){
            const delta=sub(victim.pos,e.origin),along=delta[0]*e.axis[0]+delta[2]*e.axis[2],nearest=clamp(along,from,e.travel),point=add(e.origin,mul(e.axis,nearest));
            if(distance(victim.pos,point)<1.2){
              e.eruptedAt=e.age;e.center=[victim.pos[0],this.heightAt(victim.pos[0],victim.pos[2]),victim.pos[2]];e.head.visible=false;e.life=e.spell.duration+.95;
              for(let i=0;i<5;i++){
                const a=i*Math.PI/2,p=i===0?[...e.center]:add(e.center,[Math.cos(a)*.85,0,Math.sin(a)*.85]);
                const mesh=this.mesh(e.root,'spike',i%3?this.rock:this.light);mesh.visible=false;e.nodes.push({p,mesh,delay:e.age+(i? .06:0),started:false});
              }
            }
          }
          if(e.eruptedAt===undefined&&e.travel>=e.spell.range){this.remove(e,walls);continue;}
        }
        e.phase=e.eruptedAt===undefined?'tunneling':e.age-e.eruptedAt<.95?'erupting':'ridge';
        for(const node of e.nodes){const age=e.age-node.delay;
          if(age>=0&&!node.started){node.started=true;this.burst(node.p,.45);blast(e.owner,node.p,.8);}
          if(age>=.12&&age<=.55&&victim&&!e.hitOwners.has(victim.owner)&&distance(victim.pos,node.p)<1.15&&victim.pos[1]-node.p[1]<2.8){this.hit(e,victim,e.spell.damage,damage,blast);e.hitOwners.add(victim.owner);event('spike',e,victim);}
        }
      }else if(e.kind==='craterspikes'){
        e.phase=e.age<.45?'rising':'spiked';
        if(e.age>=.25&&victim&&!e.hitOwners.has(victim.owner)&&distance(victim.pos,e.center)<e.spell.radius&&victim.pos[1]<this.heightAt(victim.pos[0],victim.pos[2])+3.5){this.hit(e,victim,e.spell.damage,damage,blast);e.hitOwners.add(victim.owner);event('spike',e,victim);}
      }else if(e.kind==='quake'){
        e.phase=e.age<e.spell.duration?'shifting':'rubble';
        const total=Math.min(e.spell.count,Math.floor(e.age+1e-6));e.ticks??=0;
        while(e.ticks<total){e.ticks++;event('quake',e,victim);blast(e.owner,e.center,e.spell.radius);if(victim&&distance(victim.pos,e.center)<e.spell.radius&&victim.pos[1]<this.heightAt(victim.pos[0],victim.pos[2])+2.8)this.hit(e,victim,e.spell.damage,damage,blast);}
      }else if(e.kind==='wall'){
        e.phase=e.hp/e.maxHp<.4?'cracked':'wall';if(e.hp<=0){this.burst(e.center,2);event('wallbreak',e);this.remove(e,walls);continue;}
      }else if(e.kind==='gravity'){
        e.phase=e.age<e.spell.chargeTime?'charging':e.age<e.pullEnd?'pulling':e.age<e.holdEnd?'caged':e.age<e.landTime?'falling':'crater';
        if(old<e.throwEnd&&e.age>=e.throwEnd){this.burst(add(e.center,[0,.15,0]),.65);event('fracture',e,victim);}
        for(let i=0;i<e.nodes.length;i+=e.spell.liftBatchSize){const n=e.nodes[i];if(old<n.liftAt&&e.age>=n.liftAt)this.burst(add(n.source,[0,.5,0]),.5);}
        if(!e.captureChecked&&e.age>=e.spell.chargeTime){
          e.captureChecked=true;
          if(victim&&distance(victim.pos,e.center)<e.spell.radius&&victim.fighter.invulnerableTime<=0){
            for(const other of this.effects)if(other!==e&&other.capture?.owner===victim.owner){other.capture.fighter.earthControlTime=0;other.capture=null;}
            e.capture={owner:victim.owner,fighter:victim.fighter,from:[...victim.pos],height:victim.pos[1]-1.72};event('capture',e,victim);
          }
        }
        const c=e.capture;
        if(c){
          if(e.age<e.landTime){
            const pulling=ease((e.age-e.spell.chargeTime)/.6),falling=ease((e.age-e.holdEnd)/e.spell.fallTime),top=e.orb[1]-1.72;
            c.height=e.age<e.pullEnd?T.MathUtils.lerp(c.from[1]-1.72,this.centerHeight(e),ease((e.age-e.spell.chargeTime)/.18)):T.MathUtils.lerp(top,this.heightAt(e.center[0],e.center[2]),falling);
            const p=[T.MathUtils.lerp(c.from[0],e.center[0],pulling),c.height+1.72,T.MathUtils.lerp(c.from[2],e.center[2],pulling)];setPosition(c.owner,p);c.fighter.earthControlTime=e.landTime-e.age;
          }
          if(!c.cageHit&&e.age>=e.pullEnd){c.cageHit=true;this.hit(e,{owner:c.owner,pos:[e.center[0],e.orb[1],e.center[2]]},e.spell.captureDamage,damage,blast);event('cage',e,victim);}
          if(!c.fallHit&&e.age>=e.landTime){c.fallHit=true;c.fighter.earthControlTime=0;c.height=this.heightAt(e.center[0],e.center[2]);setPosition(c.owner,[e.center[0],c.height+1.72,e.center[2]]);this.hit(e,{owner:c.owner,pos:[e.center[0],c.height+1.72,e.center[2]]},e.spell.fallDamage,damage,blast);this.burst([e.center[0],c.height+.3,e.center[2]],3);event('fall',e,victim);}
        }
      }
      if(e.life<=1e-6)this.remove(e,walls);
    }
    for(const b of [...this.bursts]){b.age+=dt;if(b.age>=.7){b.root.removeFromParent();this.bursts.splice(this.bursts.indexOf(b),1);}}
  }
  visuals(time,reducedMotion=false){
    for(const e of this.effects){
      this.updateFractures(e);
      if(e.patch){
        const growth=e.kind==='gravity'?ease((e.age-e.throwEnd)/(e.spell.chargeTime-e.throwEnd)):ease(e.age/.35),radius=(e.spell.craterRadius||e.spell.radius)*growth*ease(e.life/.35);
        e.patch.visible=radius>.01;const p=e.patch.geometry.attributes.position;
        for(let i=0;i<p.count;i++){const x=e.patchCoordinates[i*3]*radius,z=e.patchCoordinates[i*3+2]*radius;p.setXYZ(i,x,this.heightAt(e.center[0]+x,e.center[2]+z)-e.center[1]+.14,z);}
        p.needsUpdate=true;e.patch.geometry.computeVertexNormals();
      }
      if(['spikes','craterspikes'].includes(e.kind)){
        if(e.head?.visible){e.head.position.set(e.headPosition[0],this.heightAt(e.headPosition[0],e.headPosition[2])+.04,e.headPosition[2]);e.head.rotation.y=Math.atan2(e.axis[0],e.axis[2]);}
        for(const n of e.trailRocks||[]){const pulse=this.trailPulse(e,n.at);n.mesh.visible=pulse>.005;n.mesh.position.set(n.p[0],this.heightAt(n.p[0],n.p[2])+.09*pulse,n.p[2]);n.mesh.scale.set(.34*pulse,.12*pulse,.5*pulse);n.mesh.rotation.set(n.sign*.12*pulse,Math.atan2(e.axis[0],e.axis[2]),n.sign*.3*pulse);}
        for(const n of e.nodes){const h=this.spikeHeight(e,n);n.mesh.visible=h>.001;n.mesh.position.set(n.p[0],this.heightAt(n.p[0],n.p[2],e)+.14+h/2,n.p[2]);n.mesh.scale.set(.7,h,.7);}
      }
      else if(e.kind==='wall'){const grow=ease(e.age/.25)*ease(e.life/.25);e.crackMat.opacity=.08+(1-e.hp/e.maxHp)*.9;for(const n of e.nodes)n.part.scale.y=grow;}
      else if(e.kind==='gravity'){
        const fall=Math.max(0,e.age-e.holdEnd),visible=e.age<e.landTime+.7;
        const packed=e.nodes.reduce((sum,n)=>sum+ease((this.rockProgress(e,n)-.7)/.3),0)/e.nodes.length;
        e.mass.visible=visible&&packed>.001;e.mass.position.set(e.orb[0],e.orb[1]-fall*fall*12,e.orb[2]);e.mass.scale.setScalar(3.7*Math.cbrt(packed)*(1-ease(fall/e.spell.fallTime)));
        e.core.visible=visible;e.core.position.fromArray(this.corePosition(e));e.core.scale.setScalar(.28+.22*ease(e.age/e.throwEnd));e.warning.visible=e.age>=e.throwEnd&&e.age<e.pullEnd;e.warning.position.y=this.heightAt(e.center[0]+e.spell.radius,e.center[2])+.18;
        e.platform.visible=visible&&e.age>=e.spell.chargeTime;e.platform.position.set(e.center[0],this.centerHeight(e)-fall*fall*12,e.center[2]);e.platform.rotation.z=fall*.6;
        for(let i=0;i<e.nodes.length;i++){const n=e.nodes[i],pull=this.rockProgress(e,n);n.mesh.visible=visible&&e.age>=n.liftAt;
          n.mesh.position.fromArray(this.rockPosition(e,n));
          if(fall>0){n.mesh.position.x+=n.target[0]*fall*1.7;n.mesh.position.z+=n.target[2]*fall*1.7;n.mesh.position.y-=fall*fall*12;}
          const turn=reducedMotion?.25:1;n.mesh.rotation.set(n.spin[0]*pull*turn,n.spin[1]*(1+pull*turn),n.spin[2]*pull*turn);}
      }else{
        e.marker.visible=e.age<.45;e.marker.position.y=this.heightAt(e.center[0],e.center[2])+.04;
        for(const n of e.nodes)n.mesh.position.set(n.p[0],this.heightAt(n.p[0],n.p[2])+.2,n.p[2]);
      }
    }
    for(const b of this.bursts)for(const n of b.rocks){n.mesh.position.set(n.v[0]*b.age,n.v[1]*b.age-4*b.age*b.age,n.v[2]*b.age);n.mesh.scale.setScalar(.06*(1-b.age/.7));}
  }
  status(owner){return this.effects.filter(e=>e.owner===owner).map(e=>`${e.spell.name} ${e.life.toFixed(1)}s${e.kind==='wall'?' · '+Math.ceil(e.hp)+' bền':''}`).join(' · ');}
  state(){return {revision:this.revision,effects:this.effects.map(e=>({id:e.id,owner:e.owner,kind:e.kind,style:e.spell.style,phase:e.phase,visualStage:e.kind==='gravity'?this.gravityStage(e):e.phase,age:e.age,life:e.life,center:[...e.center],radius:e.spell.radius||0,formationEndsAt:e.pullEnd??null,batchSize:e.spell.liftBatchSize||0,batchInterval:e.spell.liftBatchInterval||0,launchedBatches:e.kind==='gravity'?new Set(e.nodes.filter(n=>e.age>=n.liftAt).map(n=>n.batch)).size:0,landingAt:e.landTime??null,craterDuration:e.kind==='gravity'?e.spell.craterTime:null,hp:e.hp??null,ticks:e.ticks||0,orb:e.orb?[...e.orb]:null,corePosition:e.kind==='gravity'?this.corePosition(e):null,centralHeight:e.kind==='gravity'?this.centerHeight(e)-e.baseHeight:0,liftedFragments:e.kind==='gravity'?e.nodes.filter(n=>this.rockProgress(e,n)>0).length:0,gatheredFragments:e.kind==='gravity'?e.nodes.filter(n=>this.rockProgress(e,n)>=1).length:0,fractureSegments:e.fractures?.segments.filter(s=>this.fractureGrowth(e,s)>.001).length||0,trailRocks:e.trailRocks?.filter(n=>this.trailPulse(e,n.at)>.005).length||0,captured:e.capture?.owner||null,captureHeight:e.capture?.height||0,wallSegments:e.wallRefs?.length||0,spikeCount:e.nodes.filter(n=>n.delay!==undefined).length,visibleSpikes:e.nodes.filter(n=>n.delay!==undefined&&this.spikeHeight(e,n)>.001).length,travelPosition:e.headPosition?[...e.headPosition]:null,craterId:e.crater?.id||null})),bursts:this.bursts.length};}
  reset(walls=[]){for(const e of [...this.effects])this.remove(e,walls);for(const b of this.bursts)b.root.removeFromParent();this.bursts=[];this.revision++;}
}
