import * as T from 'three';
import { vfxToon } from './vfx-materials.js';
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const len=a=>Math.hypot(...a),unit=a=>mul(a,1/(len(a)||1)),dist=(a,b)=>len(sub(a,b));
const up=new T.Vector3(0,1,0),forward=new T.Vector3(0,0,1),EPS=.015,MAX_RELAYS=3;
const palette=['#ff707d','#ffbc72','#ffe796','#8ce6a1','#7edeea','#8aabff','#c699f4'];
const basic=(color,opacity=1)=>new T.MeshBasicMaterial({color,opacity,transparent:opacity<1,depthWrite:opacity===1,side:T.DoubleSide});
// Stationary volumetric optics: every visible ray segment is also used for hits.
export class LightArts {
  constructor(scene,intersectWall){
    this.scene=scene;this.intersectWall=intersectWall;this.optics=[];this.channels=[];this.pulses=[];this.flashes=[];this.lastPaths=[];this.serial=0;
    this.white=basic('#fff8df');this.gold=basic('#eacb72');this.soft=basic('#fff0b4',.24);this.colors=palette.map(c=>basic(c));
    this.stone=vfxToon('#587986',{emissive:'#b9d9e0',emissiveIntensity:.12,side:T.DoubleSide});
    this.crystal=vfxToon('#e8e9ff',{transparent:true,opacity:.35,depthWrite:false,emissive:'#c5c7f0',emissiveIntensity:.18,side:T.DoubleSide});
    const triangle=new T.Shape();triangle.moveTo(0,.85);triangle.lineTo(-.65,-.55);triangle.lineTo(.65,-.55);triangle.closePath();
    this.geo={tube:new T.CylinderGeometry(1,1,1,8),ring:new T.TorusGeometry(1,.012,5,64),star:new T.OctahedronGeometry(1),column:new T.CylinderGeometry(1,1,1,8),prism:new T.ExtrudeGeometry(triangle,{depth:.65,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:1})};
    this.edges=new T.EdgesGeometry(this.geo.prism);this.edgeMat=new T.LineBasicMaterial({color:'#dbcf9e',transparent:true,opacity:.7});
    this.geo.disco=new T.IcosahedronGeometry(.85,1);
    for(let i=0;i<this.geo.disco.attributes.position.count;i+=3)this.geo.disco.addGroup(i,3,(i/3)%7);
    this.darkBall=vfxToon('#26303c');this.discoColors=palette.map(color=>vfxToon(color,{emissive:color,emissiveIntensity:.18}));
    this.preview=this.group();this.preview.visible=false;this.previewModel=null;this.previewData=null;
  }
  group(){const g=new T.Group();this.scene.add(g);return g;}
  mesh(parent,geometry,material,p=[0,0,0],scale=[1,1,1]){const m=new T.Mesh(this.geo[geometry],material);m.position.fromArray(p);m.scale.fromArray(scale);parent.add(m);return m;}
  line(m,a,b,r=.02){const d=sub(b,a);m.position.fromArray(mul(add(a,b),.5));m.scale.set(r,len(d),r);m.quaternion.setFromUnitVectors(up,new T.Vector3(...unit(d)));m.visible=len(d)>.001;}
  model(parent,kind,height=1.72){
    const g=new T.Group();parent.add(g);
    if(kind==='prism'){const p=this.mesh(g,'prism',this.crystal,[0,0,-.325]);p.add(new T.LineSegments(this.edges,this.edgeMat));for(let i=0;i<3;i++)this.mesh(g,'star',this.colors[i*3],[(i-1)*.22,-.32,.035],[.03,.05,.03]);}
    else{
      const shaft=Math.max(.25,height-.35);
      this.mesh(g,'column',this.stone,[0,-shaft/2-.15,0],[.24,shaft,.24]);
      this.mesh(g,'column',this.stone,[0,-height+.13,0],[.43,.18,.43]);
      const crystal=this.mesh(g,'star',this.crystal,[0,.03,0],[.38,.55,.38]);
      this.mesh(g,'star',this.white,[0,.03,0],[.10,.18,.10]);
      for(const y of [-height*.72,-.35]){const r=this.mesh(g,'ring',this.gold,[0,y,0],[.28,.28,.28]);r.rotation.x=Math.PI/2;}
      this.mesh(g,'ring',this.gold,[0,.03,0],[.46,.46,.46]);
    }
    const foot=this.mesh(g,'ring',this.gold,[0,-height+.1,0],[.32,.32,.32]);foot.rotation.x=-Math.PI/2;return g;
  }
  // Three easy placements around the aimed target: rear, front-left, front-right.
  placement(owner,kind,pos,dir,actors=[]){
    let axis=unit([dir[0],0,dir[2]]);if(len(axis)<.5)axis=[0,0,-1];
    const own=this.optics.filter(o=>o.owner===owner&&o.kind===kind);
    const slot=[0,1,2].find(i=>!own.some(o=>o.slot===i))??own[0].slot;
    let center,normal=axis;
    if(kind==='prism')center=add(pos,mul(axis,4+slot*2.4));
    else{
      let target=own[0]?.target;
      if(!target){let reach=28.5;const victim=actors.find(a=>a.owner!==owner);if(victim){const d=sub(victim.pos,pos),along=dot(d,axis),off=len(sub(d,mul(axis,along)));if(along>2&&along<50&&off<2.5)reach=along;}target=add(pos,mul(axis,reach));}
      if(own[0])axis=own[0].axis;
      const side=[axis[2],0,-axis[0]];
      center=slot===0?add(target,mul(axis,3.5)):add(add(target,mul(axis,-4)),mul(side,slot===1?4:-4));
      // A tall rear crystal and low front crystals make the star a visible 3D
      // arrangement in FPS instead of flattening every ray onto the eye plane.
      center[1]=slot===0?3.8:.85;normal=unit([target[0]-center[0],0,target[2]-center[2]]);
      return {owner,kind,slot,center,normal,facing:unit(sub(target,center)),target:[...target],axis:[...axis]};
    }
    center[1]=1.72;return {owner,kind,slot,center,normal};
  }
  place(owner,spell,pos,dir,actors=[]){
    const kind=spell.style==='lightprism'?'prism':'pillar',data=this.placement(owner,kind,pos,dir,actors);
    for(const o of [...this.optics])if(o.owner===owner&&o.kind===kind&&o.slot===data.slot)this.remove(this.optics,o);
    const root=this.group();this.model(root,kind,data.center[1]);root.position.fromArray(data.center);root.quaternion.setFromUnitVectors(forward,new T.Vector3(...data.normal));
    const o={...data,id:++this.serial,life:spell.duration,age:0,radius:kind==='pillar'?.5:.7,root};this.optics.push(o);this.flash(data.center,.35);return o;
  }
  disco(owner,spell,pos,dir,actors=[]){
    for(const o of [...this.optics])if(o.owner===owner&&o.kind==='disco')this.remove(this.optics,o);
    const victim=actors.find(a=>a.owner!==owner),target=victim?[...victim.pos]:add(pos,mul(dir,31));
    const center=[target[0],Math.max(1.72,target[1])+3.2,target[2]],root=this.rayRoot();
    const art=new T.Group();root.add(art);art.position.fromArray(center);const ball=this.mesh(art,'disco',this.darkBall);
    const hanger=this.mesh(art,'ring',this.stone,[0,.95,0],[.12,.12,.12]);
    const o={id:++this.serial,owner,kind:'disco',spell,target,center,root,art,ball,hanger,radius:.85,life:18,age:0,active:false,activeAge:0,ticks:0,boost:1,path:[]};
    this.optics.push(o);return o;
  }
  remove(list,item){item.root.removeFromParent();list.splice(list.indexOf(item),1);}
  cancel(owner){for(const c of [...this.channels])if(c.owner===owner)this.remove(this.channels,c);}
  flash(pos,scale=1){const root=this.group();root.position.fromArray(pos);for(let i=0;i<6;i++){const a=i*Math.PI/3;this.mesh(root,'star',this.gold,[Math.cos(a)*.18,Math.sin(a)*.18,0],[.025,.08,.025]);}this.flashes.push({root,age:0,duration:.22,scale});}
  rayRoot(){const root=this.group();root.userData.lines=[];return root;}
  beam(owner,spell,pos,dir){this.cancel(owner);const c={owner,spell,pos:[...pos],dir:[...dir],age:0,ticks:0,root:this.rayRoot(),path:[]};this.channels.push(c);return c;}
  fire(owner,spell,pos,dir){const p={owner,spell,pos:[...pos],dir:unit(dir),age:0,ticks:0,root:this.rayRoot(),path:[],lastPulse:-10};p.charge=this.mesh(p.root,'star',this.white,pos,[.05,.05,.05]);this.pulses.push(p);return p;}
  plane(start,dir,o,range){
    if(o.kind==='pillar'){
      const dx=start[0]-o.center[0],dz=start[2]-o.center[2],a=dir[0]**2+dir[2]**2,b=2*(dx*dir[0]+dz*dir[2]),c=dx*dx+dz*dz-.24**2;
      let best=null;
      if(a>1e-8){const disc=b*b-4*a*c;if(disc>=0){const t=(-b-Math.sqrt(disc))/(2*a),y=start[1]+dir[1]*t;if(t>EPS&&t<=range&&y>=.05&&y<=o.center[1])best={o,point:add(start,mul(dir,t)),t};}}
      const offset=sub(start,o.center),q=dot(offset,dir),disc=q*q-dot(offset,offset)+o.radius**2;
      if(disc>=0){const t=-q-Math.sqrt(disc);if(t>EPS&&t<=range&&(!best||t<best.t))best={o,point:add(start,mul(dir,t)),t};}
      return best;
    }
    if(o.kind==='disco'){
      const offset=sub(start,o.center),b=dot(offset,dir),disc=b*b-dot(offset,offset)+o.radius**2;
      if(disc<0)return null;const t=-b-Math.sqrt(disc);return t>EPS&&t<=range?{o,point:add(start,mul(dir,t)),t}:null;
    }
    const denominator=dot(dir,o.normal);if(Math.abs(denominator)<1e-7)return null;const t=dot(sub(o.center,start),o.normal)/denominator;if(t<EPS*.5||t>range)return null;
    const point=add(start,mul(dir,t)),local=sub(point,o.center),x=dot(local,[-o.normal[2],0,o.normal[0]]),y=local[1];
    const inside=o.kind==='prism'?y>=-.55&&y<=.85&&Math.abs(x)<=.65*(.85-y)/1.4:Math.hypot(x,y)<=o.radius;return inside?{o,point,t}:null;
  }
  fan(pillar,owner,activated){
    const axis=pillar.facing,side=unit([axis[2],0,-axis[0]]),angles=[-48,-24,0,24,48],directions=angles.map(a=>unit(add(mul(axis,Math.cos(a*Math.PI/180)),mul(side,Math.sin(a*Math.PI/180)))));
    // The outer fan rays connect to other pillars. Its central ray stays aimed
    // along the pillar's fixed facing, so moving the target can dodge the fan.
    let index=0;
    for(const other of this.optics){if(other.owner!==owner||other.kind!=='pillar'||other.id===pillar.id||activated.has(other.id)||other.life<=0)continue;
      directions[index++===0?0:4]=unit(sub(other.center,pillar.center));}
    return directions;
  }
  trace(owner,start,direction,walls,range=55,activated=new Set(),ignore=null){
    const path=[],queue=[{pos:[...start],dir:unit(direction),relays:0,prisms:0,seen:new Set(ignore?[ignore]:[]),branch:0,range}];let serial=0;
    // Every pillar emits one five-ray fan per source ray, never a return loop.
    // Three pillars bound the network to at most sixteen branches.
    while(queue.length&&path.length<64){
      const ray=queue.shift();let {pos,dir,relays,prisms,seen,branch}=ray;
      for(let step=0;step<8;step++){
        let reach=ray.range;if(dir[1]<0)reach=Math.min(reach,Math.max(0,-pos[1]/dir[1]));if(reach<=EPS)break;
        let event=null,end=add(pos,mul(dir,reach));
        for(const wall of walls){if(wall.owner===owner||wall.hp<=0||wall.life<=0)continue;const point=this.intersectWall(pos,end,wall);if(point){const t=dist(pos,point);if(!event||t<event.t)event={wall,point,t};}}
        for(const o of this.optics){if(o.owner!==owner||o.life<=0||seen.has(o.id))continue;const hit=this.plane(pos,dir,o,reach);if(hit&&(!event||hit.t<event.t))event=hit;}
        if(event)end=event.point;
        path.push({start:[...pos],end:[...end],dir:[...dir],prisms,relays,branch,multiplier:(1+.5*prisms)*(1+.25*relays),event:event?.o?.kind||(event?.wall?'wall':null),wall:event?.wall,optic:event?.o});
        if(!event||event.wall)break;
        if(event.o.kind==='prism'){seen.add(event.o.id);prisms++;pos=add(end,mul(dir,EPS));continue;}
        if(event.o.kind==='disco')break;
        const pillar=event.o;
        if(!activated.has(pillar.id)&&relays<MAX_RELAYS){activated.add(pillar.id);const visited=new Set([...seen,pillar.id]);
          for(const next of this.fan(pillar,owner,activated))queue.push({pos:add(pillar.center,mul(next,EPS)),dir:next,relays:relays+1,prisms,seen:new Set(visited),branch:++serial,range:18});}
        break;
      }
    }return path;
  }
  resolve(c,actors,walls,damage,intercept,activated,ignore){
    c.path=this.trace(c.owner,c.pos,c.dir,walls,c.spell.range,activated,ignore);const victim=actors.find(a=>a.owner!==c.owner),hitLegs=new Set();
    for(const leg of c.path){const power=c.spell.damage*leg.multiplier;intercept?.({owner:c.owner,element:'light',style:c.spell.style,old:leg.start,p:leg.end,size:.07,damage:power});
      if(victim&&!hitLegs.has(leg.branch)){const along=dot(sub(victim.pos,leg.start),leg.dir),reach=dist(leg.start,leg.end),point=add(leg.start,mul(leg.dir,Math.max(0,Math.min(reach,along))));
        if(along>=0&&along<=reach&&dist(point,victim.pos)<=.67){damage({owner:c.owner,element:'light',style:c.spell.style,color:palette[Math.min(6,leg.prisms*2)],damage:power,v:leg.dir,unreflectable:true,lightRelays:leg.relays,prisms:leg.prisms},victim.pos);hitLegs.add(leg.branch);}}
      if(leg.wall){leg.wall.hp=Math.max(0,leg.wall.hp-power);this.flash(leg.end,.3);}if(leg.event==='pillar')this.flash(leg.end,.2);
      if(leg.event==='disco'&&!leg.optic.active){const o=leg.optic;o.active=true;o.life=Math.max(o.life,o.spell.duration+.3);o.boost=leg.multiplier;o.ball.material=this.discoColors;o.hanger.material=this.gold;this.flash(o.center,.5);}
    }this.lastPaths=this.serialize(c.path);c.lastPulse=c.age;
  }
  advance(dt,actors,walls,damage,intercept){
    for(const o of [...this.optics]){o.life-=dt;o.age+=dt;if(o.life<=1e-6)this.remove(this.optics,o);}
    for(const o of [...this.optics])if(o.kind==='disco'&&o.active){
      o.activeAge+=dt;
      const total=Math.min(o.spell.count,Math.floor((o.activeAge+1e-6)/(o.spell.duration/o.spell.count)));
      while(o.ticks<total){o.ticks++;o.path=[];const activated=new Set(),targets=[[o.center[0],0,o.center[2]]];
        for(let i=0;i<4;i++){const a=i*Math.PI/2+o.ticks*.3;targets.push([o.center[0]+Math.cos(a)*5.5,0,o.center[2]+Math.sin(a)*5.5]);}
        for(const p of this.optics)if(p.owner===o.owner&&p.kind==='pillar')targets.push(p.center);
        for(const target of targets){const dir=unit(sub(target,o.center)),c={owner:o.owner,spell:{...o.spell,damage:o.spell.damage*o.boost,range:35},pos:add(o.center,mul(dir,.9)),dir,age:o.activeAge};
          this.resolve(c,actors,walls,damage,intercept,activated,o.id);for(const leg of c.path)leg.spectrum=7;o.path.push(...c.path);}
        o.lastPulse=o.activeAge;
      }
      if(o.activeAge>=o.spell.duration+.28)this.remove(this.optics,o);
    }
    for(const c of [...this.channels]){const a=actors.find(a=>a.owner===c.owner);if(!a||a.fighter.controlTime>0){this.remove(this.channels,c);continue;}c.age+=dt;c.pos=add(a.pos,mul(a.dir,.25));c.dir=[...a.dir];const total=Math.min(c.spell.count,Math.floor((c.age+1e-6)/(c.spell.duration/c.spell.count)));while(c.ticks<total){c.ticks++;this.resolve(c,actors,walls,damage,intercept);}if(c.age+1e-6>=c.spell.duration)this.remove(this.channels,c);}
    for(const p of [...this.pulses]){p.age+=dt;const charge=p.spell.chargeTime??.1,interval=p.spell.pulseInterval??.25;while(p.ticks<p.spell.count&&p.age+1e-6>=charge+p.ticks*interval){p.ticks++;this.resolve(p,actors,walls,damage,intercept);}if(p.age>=charge+(p.spell.count-1)*interval+.28)this.remove(this.pulses,p);}
    for(const f of [...this.flashes]){f.age+=dt;if(f.age>=f.duration)this.remove(this.flashes,f);}
  }
  previewTarget(data){this.preview.visible=!!data;this.previewData=data;if(!data)return;const key=data.kind+data.center[1];if(this.previewModel?.userData.key!==key){this.preview.clear();this.previewModel=this.model(this.preview,data.kind,data.center[1]);this.previewModel.userData.key=key;}this.preview.position.fromArray(data.center);this.preview.quaternion.setFromUnitVectors(forward,new T.Vector3(...data.normal));this.preview.scale.setScalar(.96);}
  draw(c,path,intensity=1,eye=null){
    const pool=c.root.userData.lines;let used=0;
    const tube=(material,a,b,r)=>{let m=pool[used++];if(!m){m=this.mesh(c.root,'tube',material);pool.push(m);}m.material=material;this.line(m,a,b,r);};
    // Fan rays can pass through the FPS eye. Exclude a small region around
    // the camera from rendering so near-clipped tube caps never fill the screen.
    // The physical trace and damage still use the complete path.
    const segment=(material,a,b,r)=>{
      if(!eye){tube(material,a,b,r);return;}
      const d=sub(b,a),rel=sub(a,eye),aa=dot(d,d),bb=2*dot(rel,d),cc=dot(rel,rel)-1.4**2,disc=bb*bb-4*aa*cc;
      if(aa<1e-8)return;
      if(disc<=0){tube(material,a,b,r);return;}
      const lo=Math.max(0,(-bb-Math.sqrt(disc))/(2*aa)),hi=Math.min(1,(-bb+Math.sqrt(disc))/(2*aa));
      if(lo>=hi){tube(material,a,b,r);return;}
      if(lo>0)tube(material,a,add(a,mul(d,lo)),r);
      if(hi<1)tube(material,add(a,mul(d,hi)),b,r);
    };
    for(let i=0;i<path.length;i++){const leg=path[i],start=[...leg.start];if(i===0)start[1]-=.17;const radius=.015+Math.min(3,leg.relays)*.003;
      if(!leg.prisms&&!leg.spectrum){segment(this.white,start,leg.end,radius*intensity);segment(this.soft,start,leg.end,radius*2.1*intensity);}else{const count=leg.spectrum||Math.min(7,1+leg.prisms*2);let side=unit([leg.dir[2],0,-leg.dir[0]]);if(len(side)<.5)side=[1,0,0];for(let j=0;j<count;j++){const offset=mul(side,(j-(count-1)/2)*.025);segment(this.colors[Math.round(j*6/(count-1))],add(start,offset),add(leg.end,offset),(.012+leg.relays*.002)*intensity);}}}
    for(let i=used;i<pool.length;i++)pool[i].visible=false;
  }
  visuals(time,shots,actors,walls){
    const eye=actors.find(a=>a.owner==='player')?.pos;
    for(const o of this.optics){(o.art||o.root).scale.setScalar(Math.min(1,o.age/.22));if(o.kind==='disco'){o.ball.rotation.y=o.active?o.activeAge*1.5:0;this.draw(o,o.path,o.active?Math.max(0,1-(o.activeAge-(o.lastPulse??-10))/.28):0,eye);}}
    for(const c of this.channels){c.path=this.trace(c.owner,c.pos,c.dir,walls,c.spell.range);this.draw(c,c.path,1,eye);}
    for(const p of this.pulses){const charge=p.spell.chargeTime??.1,t=Math.min(1,p.age/charge);p.charge.visible=p.ticks===0;p.charge.position.fromArray(add(p.pos,mul(p.dir,1.4)));p.charge.position.y-=.15;p.charge.scale.setScalar(.025+t*(charge>.2?.09:.035));p.charge.rotation.set(time,time*.7,0);this.draw(p,p.path,Math.max(0,1-(p.age-p.lastPulse)/.28),eye);}
    for(const f of this.flashes)f.root.scale.setScalar(f.scale*(1+f.age/f.duration));
  }
  status(owner){const own=this.optics.filter(o=>o.owner===owner),p=own.filter(o=>o.kind==='prism').length,m=own.filter(o=>o.kind==='pillar').length,d=own.find(o=>o.kind==='disco');return [p?`${p}/3 lăng kính`:'',m?`${m}/3 cột quang`:'',d?(d.active?'Disco đang phát tia':'Disco chờ tia sáng'):'',this.channels.some(c=>c.owner===owner)?'Quang tuyến':''].filter(Boolean).join(' · ');}
  serialize(path){return path.map(({start,end,prisms,relays,branch,multiplier,event})=>({start:[...start],end:[...end],prisms,relays,branch,multiplier,event}));}
  state(){const optics=this.optics.map(({id,owner,kind,slot,life,center,normal})=>({id,owner,kind,slot,life,center:[...center],normal:normal?[...normal]:null}));return {prisms:optics.filter(o=>o.kind==='prism'),pillars:optics.filter(o=>o.kind==='pillar'),discos:this.optics.filter(o=>o.kind==='disco').map(o=>({owner:o.owner,center:[...o.center],life:o.life,active:o.active,activeAge:o.activeAge,ticks:o.ticks,boost:o.boost,path:this.serialize(o.path)})),channels:this.channels.map(c=>({owner:c.owner,age:c.age,ticks:c.ticks,path:this.serialize(c.path)})),pulses:this.pulses.map(p=>({owner:p.owner,age:p.age,ticks:p.ticks,path:this.serialize(p.path)})),lastPath:this.lastPaths,preview:this.previewData};}
  reset(){for(const list of [this.optics,this.channels,this.pulses,this.flashes]){for(const x of list)x.root.removeFromParent();list.length=0;}this.serial=0;this.lastPaths=[];this.previewData=null;this.preview.visible=false;}
}
