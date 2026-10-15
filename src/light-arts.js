import * as T from 'three';
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),len=a=>Math.hypot(...a),unit=a=>mul(a,1/(len(a)||1)),dist=(a,b)=>len(sub(a,b));
const reflect=(d,n)=>unit(sub(d,mul(n,2*dot(d,n))));
const up=new T.Vector3(0,1,0),forward=new T.Vector3(0,0,1),EPS=.015;
const palette=['#ff3549','#ff962b','#ffe84c','#59ed83','#48ddff','#5264ff','#bb65ff'];
const basic=(color,opacity=1)=>new T.MeshBasicMaterial({color,opacity,transparent:opacity<1,depthWrite:opacity===1,side:T.DoubleSide,toneMapped:false});

// Optical objects and ray collisions share the same world geometry.
export class LightArts {
  constructor(scene,intersectWall,intersectTerrain=null){
    this.scene=scene;this.intersectWall=intersectWall;this.optics=[];this.pulses=[];this.flashes=[];this.jacobs=new Map();this.lastPaths=[];this.serial=0;this.reflections=0;this.raycaster=new T.Raycaster();
    this.white=basic('#ffffff');this.gold=basic('#ffdb69');this.soft=basic('#ffe8a5',.24);this.colors=palette.map(c=>basic(c));
    this.intersectTerrain=intersectTerrain;
    this.geo={tube:new T.CylinderGeometry(1,1,1,10),ring:new T.TorusGeometry(1,.012,5,64),star:new T.OctahedronGeometry(1),sphere:new T.SphereGeometry(1,32,20),mirror:new T.PlaneGeometry(2.2,2.8),dome:new T.SphereGeometry(1,16,6,0,Math.PI*2,0,Math.PI/2)};
    this.glass=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,
      uniforms:{uTime:{value:0},uMirror:{value:0}},
      vertexShader:'varying vec3 vNormal;varying vec3 vView;varying vec3 vLocal;void main(){vLocal=position;vNormal=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);vView=-p.xyz;gl_Position=projectionMatrix*p;}',
      fragmentShader:`uniform float uTime;uniform float uMirror;varying vec3 vNormal;varying vec3 vView;varying vec3 vLocal;
        void main(){float edge=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),2.8);
          float shine=pow(max(0.,sin(vLocal.y*3.+vLocal.x*2.6+uTime*.35)),24.);
          vec3 color=mix(vec3(.86,.93,1.),vec3(1.,.87,.52),edge*.55);
          float alpha=mix(.018+edge*.24+shine*.055,.25+shine*.24,uMirror);
          gl_FragColor=vec4(color,alpha);}`});
    this.mirrorGlass=this.glass.clone();this.mirrorGlass.uniforms.uMirror.value=1;
    this.edgeMat=new T.LineBasicMaterial({color:'#fff1b5',transparent:true,opacity:.48,toneMapped:false});
    this.domeEdges=new T.EdgesGeometry(this.geo.dome,1);this.mirrorEdges=new T.EdgesGeometry(this.geo.mirror);
  }
  group(){const g=new T.Group();this.scene.add(g);return g;}
  mesh(parent,geometry,material,p=[0,0,0],scale=[1,1,1]){const m=new T.Mesh(this.geo[geometry],material);m.position.fromArray(p);m.scale.fromArray(scale);parent.add(m);return m;}
  line(m,a,b,r=.035){const d=sub(b,a);m.position.fromArray(mul(add(a,b),.5));m.scale.set(r,len(d),r);m.quaternion.setFromUnitVectors(up,new T.Vector3(...unit(d)));m.visible=len(d)>.001;}
  model(parent,kind,radius=.8){
    const g=new T.Group();parent.add(g);
    if(kind==='sphere'){
      this.mesh(g,'sphere',this.glass,[0,0,0],[radius,radius,radius]);
      const band=this.mesh(g,'ring',this.soft,[0,0,0],[radius,radius,radius]);band.rotation.x=Math.PI/2;
      for(let i=0;i<4;i++){const a=i*Math.PI/2;this.mesh(g,'star',this.gold,[Math.cos(a)*radius,Math.sin(a)*radius,0],[.018,.035,.018]);}
    }else if(kind==='mirror'){
      const face=this.mesh(g,'mirror',this.mirrorGlass);face.add(new T.LineSegments(this.mirrorEdges,this.edgeMat));
      for(const x of [-1.1,1.1])for(const y of [-1.4,1.4])this.mesh(g,'star',this.gold,[x,y,.01],[.035,.055,.025]);
    }else{
      const roof=this.mesh(g,'dome',this.glass,[0,0,0],[radius,radius,radius]);roof.add(new T.LineSegments(this.domeEdges,this.edgeMat));
      const rim=this.mesh(g,'ring',this.gold,[0,.02,0],[radius,radius,radius]);rim.rotation.x=-Math.PI/2;
    }
    return g;
  }
  placement(owner,kind,pos,dir,actors=[]){
    const normal=unit(dir);let center,radius;
    if(kind==='dome'){
      const victim=actors.find(a=>a.owner!==owner),delta=victim&&sub(victim.pos,pos),along=delta&&dot(delta,normal);
      const aimed=victim&&along>0&&dist(add(pos,mul(normal,along)),victim.pos)<2.5;
      center=aimed?[victim.pos[0],.03,victim.pos[2]]:add(pos,mul(normal,dir[1]<-.025?Math.min(55,Math.max(6,-pos[1]/dir[1])):31));center[1]=.03;radius=3.8;
    }else{center=add(pos,mul(normal,kind==='sphere'?3:2.4));radius=kind==='sphere'?.8:1.4;}
    return {owner,kind,center,normal,radius};
  }
  place(owner,spell,pos,dir,actors=[]){
    const kind={lightsphere:'sphere',lightdome:'dome',lightmirror:'mirror'}[spell.style];if(!kind)throw new Error('Unknown light optic: '+spell.style);
    const data=this.placement(owner,kind,pos,dir,actors);if(kind==='dome')data.radius=spell.domeRadius;
    for(const o of [...this.optics])if(o.owner===owner&&o.kind===kind)this.remove(this.optics,o);
    const root=this.rayRoot();this.model(root,kind,data.radius);root.position.fromArray(data.center);
    if(kind==='mirror')root.quaternion.setFromUnitVectors(forward,new T.Vector3(...data.normal));
    const o={...data,id:++this.serial,spell,root,life:spell.duration,age:0,rays:[],reflections:0};
    if(kind==='dome'){o.collider=new T.Mesh(this.geo.dome,this.glass);o.collider.position.fromArray(data.center);o.collider.scale.setScalar(data.radius);o.collider.updateMatrixWorld(true);}
    this.optics.push(o);return o;
  }
  remove(list,item){item.root.removeFromParent();const i=list.indexOf(item);if(i>=0)list.splice(i,1);}
  cancel(){} // Single pulses finish independently when the next spell is placed.
  flash(pos,scale=1){const root=this.group();root.position.fromArray(pos);for(let i=0;i<6;i++){const a=i*Math.PI/3;this.mesh(root,'star',this.gold,[Math.cos(a)*.18,Math.sin(a)*.18,0],[.025,.08,.025]);}this.flashes.push({root,age:0,duration:.22,scale});}
  rayRoot(){const root=this.group();root.userData.lines=[];return root;}
  fire(owner,spell,pos,dir){const p={owner,spell,pos:[...pos],dir:unit(dir),age:0,ticks:0,root:this.rayRoot(),path:[],lastPulse:-10};this.pulses.push(p);return p;}
  sphereHit(start,dir,o,range,exit=false){
    if(o.kind==='dome'){
      this.raycaster.set(new T.Vector3(...start),new T.Vector3(...dir));this.raycaster.near=EPS*.5;this.raycaster.far=range;
      const hit=this.raycaster.intersectObject(o.collider,false)[0];
      if(!hit)return null;
      const normal=hit.face.normal.clone().applyNormalMatrix(new T.Matrix3().getNormalMatrix(o.collider.matrixWorld)).normalize().toArray();
      return {o,point:hit.point.toArray(),t:hit.distance,normal};
    }
    const offset=sub(start,o.center),b=dot(offset,dir),disc=b*b-dot(offset,offset)+o.radius**2;if(disc<0)return null;
    const roots=[-b-Math.sqrt(disc),-b+Math.sqrt(disc)],t=exit?roots[1]:roots.find(v=>v>EPS*.5);
    if(t===undefined||t<EPS*.5||t>range)return null;const point=add(start,mul(dir,t));if(o.kind==='dome'&&point[1]<o.center[1])return null;
    return {o,point,t};
  }
  mirrorHit(start,dir,o,range,padding=0){
    const denominator=dot(dir,o.normal);if(denominator>=-.000001)return null;
    const t=dot(sub(o.center,start),o.normal)/denominator;if(t<0||t>range)return null;
    const point=add(start,mul(dir,t)),local=new T.Vector3(...sub(point,o.center));local.applyQuaternion(o.root.quaternion.clone().invert());
    return Math.abs(local.x)<=1.1+padding&&Math.abs(local.y)<=1.4+padding?{o,point,t}:null;
  }
  trace(owner,start,direction,walls=[],range=55){
    const path=[],seen=new Set(),rayRange=range;let pos=[...start],dir=unit(direction),power=1,rayOwner=owner;
    for(let step=0;step<10&&range>EPS;step++){
      let event=null,end=add(pos,mul(dir,range));
      const terrainPoint=this.intersectTerrain?.(pos,end);if(terrainPoint)event={terrain:true,point:terrainPoint,t:dist(pos,terrainPoint)};
      for(const wall of walls){if(wall.owner===rayOwner||wall.hp<=0||wall.life<=0)continue;const point=this.intersectWall(pos,end,wall);if(point){const t=dist(pos,point);if(!event||t<event.t)event={wall,point,t};}}
      for(const o of this.optics){if(o.life<=0||seen.has(o.id))continue;
        const hit=o.kind==='mirror'?(o.owner!==rayOwner?this.mirrorHit(pos,dir,o,range):null):(o.owner===rayOwner?this.sphereHit(pos,dir,o,range):null);
        if(hit&&(!event||hit.t<event.t))event=hit;
      }
      if(event)end=event.point;
      path.push({owner:rayOwner,start:[...pos],end:[...end],dir:[...dir],multiplier:power,spectrum:power>1?7:0,event:event?.o?.kind||(event?.wall?'wall':event?.terrain?'terrain':null),optic:event?.o,wall:event?.wall});
      if(!event||event.wall||event.terrain)break;seen.add(event.o.id);range-=event.t;
      if(event.o.kind==='sphere'){power=Math.max(power,event.o.spell.amplification);pos=add(end,mul(dir,EPS));continue;}
      if(event.o.kind==='mirror'){rayOwner=event.o.owner;dir=reflect(dir,event.o.normal);pos=add(end,mul(dir,EPS));range=rayRange;continue;}
      break;
    }
    return path;
  }
  hit(owner,spell,power,dir,pos,damage){return damage({owner,element:'light',style:spell.style,color:power>1?palette[2]:'#fff2bd',damage:spell.damage*power,v:dir,unreflectable:true,spectrum:power>1?7:0},pos);}
  bouncePath(dome,entry,direction,power,spectrum=power>1?7:0){
    const path=[];let pos=add(entry,mul(direction,EPS)),dir=unit(direction);
    for(let i=0;i<14;i++){
      let hit=this.sphereHit(pos,dir,dome,100,true),normal;
      const ground=dir[1]<-.000001?(dome.center[1]-pos[1])/dir[1]:Infinity;
      if(ground>EPS&&(!hit||ground<hit.t)){hit={point:add(pos,mul(dir,ground)),t:ground};normal=[0,1,0];}
      else if(hit)normal=hit.normal||unit(sub(hit.point,dome.center));if(!hit)break;
      path.push({owner:dome.owner,start:[...pos],end:[...hit.point],dir:[...dir],multiplier:power,spectrum,event:'bounce'});
      dir=reflect(dir,normal);pos=add(hit.point,mul(dir,EPS));
    }
    return path;
  }
  resolve(p,actors,walls,damage,intercept){
    p.path=this.trace(p.owner,p.pos,p.dir,walls,p.spell.range);const hitOwners=new Set();
    for(const leg of p.path){
      const victim=actors.find(a=>a.owner!==leg.owner);intercept?.({owner:leg.owner,element:'light',style:p.spell.style,old:leg.start,p:leg.end,size:.07,damage:p.spell.damage*leg.multiplier});
      if(victim&&!hitOwners.has(leg.owner)){const along=dot(sub(victim.pos,leg.start),leg.dir),reach=dist(leg.start,leg.end);
        if(along>=0&&along<=reach&&dist(add(leg.start,mul(leg.dir,along)),victim.pos)<=.67){this.hit(leg.owner,p.spell,leg.multiplier,leg.dir,victim.pos,damage);hitOwners.add(leg.owner);}}
      if(leg.wall){leg.wall.hp=Math.max(0,leg.wall.hp-p.spell.damage*leg.multiplier);this.flash(leg.end,.3);}
      if(leg.event==='mirror'){leg.optic.reflections++;this.reflections++;this.flash(leg.end,.6);}
      if(leg.event==='dome'){const dome=leg.optic;dome.rays.push({age:0,ticks:0,power:leg.multiplier,spectrum:leg.spectrum,path:this.bouncePath(dome,leg.end,leg.dir,leg.multiplier,leg.spectrum)});this.flash(leg.end,.5);}
    }
    this.lastPaths=this.serialize(p.path);p.lastPulse=p.age;
  }
  redirect(shot,actors,walls=[]){
    if(len(shot.v)<.001||['forming','staged','emerging','gathering','charging'].includes(shot.phase))return false;
    const delta=sub(shot.p,shot.old),range=len(delta);if(range<.000001)return false;const dir=unit(delta);let hit=null;
    for(const o of this.optics){if(o.kind!=='mirror'||o.owner===shot.owner||o.life<=0)continue;const h=this.mirrorHit(shot.old,dir,o,range,Math.min(.5,shot.size||0));if(h&&(!hit||h.t<hit.t))hit=h;}
    if(!hit)return false;if(walls.some(w=>w.owner!==shot.owner&&w.hp>0&&w.life>0&&this.intersectWall(shot.old,hit.point,w)))return false;
    const speed=len(shot.v),out=reflect(unit(shot.v),hit.o.normal),remaining=Math.max(0,range-hit.t);
    shot.owner=hit.o.owner;shot.reflected=true;shot.v=mul(out,speed);shot.old=add(hit.point,mul(out,EPS));shot.p=add(shot.old,mul(out,remaining));
    shot.target=add(shot.p,mul(out,Math.min(55,(shot.life||4)*speed)));
    if(shot.style==='boat'){shot.origin=[...shot.p];shot.flightAge=0;shot.travelTime=dist(shot.p,shot.target)/speed;}
    if(shot.style==='meteor'){shot.skyStart=[...shot.p];shot.travelAge=0;shot.totalTime=dist(shot.p,shot.target)/speed;shot.skyTime=0;shot.returnTime=0;shot.fallTime=shot.totalTime;}
    if(shot.style==='tsunami'){shot.normal=unit([out[0],0,out[2]]);shot.hitTarget=false;}
    hit.o.reflections++;this.reflections++;this.flash(hit.point,.65);return true;
  }
  advance(dt,actors,walls,damage,intercept){
    for(const o of [...this.optics]){const step=Math.min(dt,o.life);o.age+=step;o.life-=step;
      if(o.kind==='dome')for(const ray of o.rays){ray.age+=step;const total=Math.floor(ray.age+1e-6);
        while(ray.ticks<total){ray.ticks++;const victim=actors.find(a=>a.owner!==o.owner);
          if(victim&&victim.pos[1]>=o.center[1]&&dist(victim.pos,o.center)<=o.radius+.4)this.hit(o.owner,o.spell,ray.power,[0,0,-1],victim.pos,damage);}}
      if(o.life<=1e-6)this.remove(this.optics,o);
    }
    for(const p of [...this.pulses]){p.age+=dt;if(!p.ticks&&p.age+1e-6>=p.spell.chargeTime){p.ticks=1;this.resolve(p,actors,walls,damage,intercept);}if(p.age>=p.spell.chargeTime+.32)this.remove(this.pulses,p);}
    for(const f of [...this.flashes]){f.age+=dt;if(f.age>=f.duration)this.remove(this.flashes,f);}
  }
  draw(c,path,intensity=1,eye=null){
    const pool=c.root.userData.lines;let used=0;
    const tube=(material,a,b,r)=>{let m=pool[used++];if(!m){m=this.mesh(c.root,'tube',material);pool.push(m);}m.material=material;const origin=c.root.position.toArray();this.line(m,sub(a,origin),sub(b,origin),r);};
    // Exclude the eye's near region so no tube cap covers the FPS screen.
    const segment=(material,a,b,r)=>{
      if(!eye){tube(material,a,b,r);return;}const d=sub(b,a),rel=sub(a,eye),aa=dot(d,d),bb=2*dot(rel,d),cc=dot(rel,rel)-.8**2,disc=bb*bb-4*aa*cc;
      if(aa<1e-8)return;if(disc<=0){tube(material,a,b,r);return;}
      const lo=Math.max(0,(-bb-Math.sqrt(disc))/(2*aa)),hi=Math.min(1,(-bb+Math.sqrt(disc))/(2*aa));if(lo>=hi){tube(material,a,b,r);return;}
      if(lo>0)tube(material,a,add(a,mul(d,lo)),r);if(hi<1)tube(material,add(a,mul(d,hi)),b,r);
    };
    for(const leg of path){const power=intensity*(leg.brightness??1);if(power<=.001)continue;
      if(!leg.spectrum){segment(this.white,leg.start,leg.end,(leg.event==='bounce'?.065:.035)*power);segment(this.soft,leg.start,leg.end,(leg.event==='bounce'?.12:.075)*power);}
      else{let side=unit([leg.dir[2],0,-leg.dir[0]]);if(len(side)<.5)side=[1,0,0];const bouncing=leg.event==='bounce';for(let j=0;j<7;j++){const offset=mul(side,(j-3)*(bouncing?.04:.027));segment(this.colors[j],add(leg.start,offset),add(leg.end,offset),(bouncing?.026:.018)*power);}}}
    for(let i=used;i<pool.length;i++)pool[i].visible=false;
  }
  jacobModel(shot){
    const root=this.group();root.position.set(shot.target[0],0,shot.target[2]);const portal=new T.Group();root.add(portal);portal.position.y=shot.cloudPoint[1];
    for(const radius of [2.3,3.2,4.2]){const ring=this.mesh(portal,'ring',radius===3.2?this.white:this.gold,[0,0,0],[radius,radius,radius]);ring.rotation.x=Math.PI/2;}
    for(let i=0;i<12;i++){const a=i*Math.PI/6;this.mesh(portal,'star',this.gold,[Math.cos(a)*3.2,0,Math.sin(a)*3.2],[.15,.35,.15]);}
    const core=this.mesh(root,'tube',this.white),glow=this.mesh(root,'tube',this.soft),gold=this.mesh(root,'tube',basic('#ffe28a',.16));
    const floor=this.mesh(root,'ring',this.gold,[0,.09,0],[shot.blastRadius,shot.blastRadius,shot.blastRadius]);floor.rotation.x=-Math.PI/2;
    const stairs=[];for(let i=0;i<9;i++){const rung=this.mesh(root,'ring',i%2?this.white:this.gold,[0,3+i*4,0],[1.5,1.5,1.5]);rung.rotation.x=Math.PI/2;stairs.push(rung);}
    const art={root,portal,core,glow,gold,floor,stairs};this.jacobs.set(shot,art);return art;
  }
  visuals(time,shots,actors){
    this.glass.uniforms.uTime.value=time;this.mirrorGlass.uniforms.uTime.value=time;const eye=actors.find(a=>a.owner==='player')?.pos;
    for(const o of this.optics){o.root.children[0].scale.setScalar(Math.min(1,o.age/.18));
      if(o.kind==='dome'){const path=o.rays.flatMap(ray=>{const head=Math.floor(ray.age*12)%Math.max(1,ray.path.length);return ray.path.map((leg,i)=>({...leg,brightness:i===head||i===(head+1)%ray.path.length?1:.23}));});this.draw(o,path,1,eye);}}
    for(const p of this.pulses)this.draw(p,p.path,Math.max(0,1-(p.age-p.lastPulse)/.32),eye);
    for(const f of this.flashes)f.root.scale.setScalar(f.scale*(1+f.age/f.duration));
    const current=new Set(shots.filter(s=>s.element==='light'&&s.style==='jacob'));
    for(const [shot,art] of this.jacobs)if(!current.has(shot)){art.root.removeFromParent();art.gold.material.dispose();this.jacobs.delete(shot);}
    for(const shot of current){const a=this.jacobs.get(shot)||this.jacobModel(shot),height=shot.cloudPoint[1];
      a.portal.rotation.y=time*.24;a.portal.scale.setScalar(Math.min(1,shot.age/.35));
      const descending=T.MathUtils.clamp((shot.age-shot.strikeTime)/shot.returnTime,0,1),fade=Math.max(0,1-(shot.age-shot.impactTime)/1.1),bottom=height*(1-descending),beamHeight=Math.max(.001,height-bottom);
      for(const [m,r] of [[a.core,1.05],[a.glow,1.6],[a.gold,shot.blastRadius]]){m.visible=shot.age>=shot.strikeTime;m.position.set(0,bottom+beamHeight/2,0);m.scale.set(r*fade,beamHeight,r*fade);}
      a.floor.scale.setScalar(shot.blastRadius*(1+Math.max(0,shot.age-shot.impactTime)*.4));
      for(const rung of a.stairs){rung.visible=shot.age>=shot.strikeTime&&rung.position.y>=bottom;rung.rotation.z=time*.3;}}
  }
  status(owner){return this.optics.filter(o=>o.owner===owner).map(o=>`${{sphere:'Cầu thủy tinh',mirror:'Quang kính',dome:o.rays.length?`Vòm · ${o.rays.length} laser · ${o.rays.reduce((sum,r)=>sum+o.spell.damage*r.power,0)} sát thương/s`:'Vòm chờ laser'}[o.kind]} ${o.life.toFixed(1)}s`).join(' · ');}
  serialize(path){return path.map(({owner,start,end,multiplier,spectrum,event})=>({owner,start:[...start],end:[...end],multiplier,spectrum,event}));}
  state(){const optic=o=>({id:o.id,owner:o.owner,kind:o.kind,life:o.life,center:[...o.center],normal:[...o.normal],radius:o.radius,reflections:o.reflections,rays:o.rays.map(r=>({age:r.age,ticks:r.ticks,power:r.power,spectrum:r.spectrum,path:this.serialize(r.path)}))});
    return {spheres:this.optics.filter(o=>o.kind==='sphere').map(optic),domes:this.optics.filter(o=>o.kind==='dome').map(optic),mirrors:this.optics.filter(o=>o.kind==='mirror').map(optic),pulses:this.pulses.map(p=>({owner:p.owner,age:p.age,ticks:p.ticks,path:this.serialize(p.path)})),jacobs:[...this.jacobs.keys()].map(s=>({owner:s.owner,target:[...s.target],phase:s.phase,age:s.age})),reflections:this.reflections,lastPath:this.lastPaths,preview:null};}
  reset(){for(const list of [this.optics,this.pulses,this.flashes]){for(const x of list)x.root.removeFromParent();list.length=0;}for(const a of this.jacobs.values()){a.root.removeFromParent();a.gold.material.dispose();}this.jacobs.clear();this.serial=0;this.reflections=0;this.lastPaths=[];}
}
