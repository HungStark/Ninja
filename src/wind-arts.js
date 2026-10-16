import * as T from 'three';
import { vfxToon } from './vfx-materials.js';
import { WindSpiritModel } from './wind-spirit.js';

const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
const forward=new T.Vector3(0,0,1);
const ribbon=(color,opacity=1)=>new T.MeshBasicMaterial({color,transparent:opacity<1,opacity,side:T.DoubleSide,depthWrite:opacity===1});

function spiralGeometry(){
  const positions=[],indices=[],n=180;
  for(let i=0;i<=n;i++){
    const t=i/n,a=t*Math.PI*6,y=t*5.4,r=.26+t*1.4;
    for(const edge of [-1,1])positions.push(Math.cos(a)*r,y+edge*.10,Math.sin(a)*r);
    if(i<n){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

export class WindArts {
  constructor(scene){
    this.scene=scene;this.spiritModel=new WindSpiritModel();this.shots=new Map();this.walls=new Map();this.airborne=[];this.recoveries=[];this.spirits=[];this.cuts=[];this.reflections=0;
    this.mint=ribbon('#b8f6df',.8);this.white=ribbon('#effff6');this.soft=ribbon('#73c4ac',.16);
    this.gustMaterial=ribbon('#b8f6df',.38);
    this.body=vfxToon('#9bdfc5',{emissive:'#276553',emissiveIntensity:.18});
    this.hair=vfxToon('#408c79');this.face=vfxToon('#f2ddbf',{emissive:'#9e8060',emissiveIntensity:.3});this.eye=ribbon('#234c46');
    this.geo={sphere:new T.SphereGeometry(1,16,12),cone:new T.ConeGeometry(1,1,16),ring:new T.TorusGeometry(1,.027,6,48),gust:new T.TorusGeometry(1,.012,5,32,Math.PI*1.35),spiral:spiralGeometry(),funnel:new T.ConeGeometry(1.65,5.4,24,1,true)};
    const s=new T.Shape();s.moveTo(-1.45,-.30);s.quadraticCurveTo(0,1.0,1.45,-.30);s.quadraticCurveTo(.12,.45,-1.45,-.30);
    this.geo.slash=new T.ExtrudeGeometry(s,{depth:.075,bevelEnabled:false,curveSegments:28});
  }
  mesh(parent,geometry,material,p=[0,0,0],scale=[1,1,1]){
    const m=new T.Mesh(this.geo[geometry],material);m.position.fromArray(p);m.scale.fromArray(scale);parent.add(m);return m;
  }
  group(){const g=new T.Group();this.scene.add(g);return g;}
  lift(owner,victim,duration=2){
    for(const a of [...this.airborne])if(a.victim===victim.owner)this.release(a,false);
    this.recoveries=this.recoveries.filter(r=>r.owner!==victim.owner);
    const a={owner,victim:victim.owner,fighter:victim.fighter,life:duration,age:0,height:0,extended:false,combo:null};
    this.airborne.push(a);victim.fighter.windControlTime=duration;return a;
  }
  canCombo(owner){return this.airborne.some(a=>a.owner===owner&&a.life>1e-6&&!a.extended&&a.fighter.invulnerableTime<=0);}
  combo(owner,spell){
    const a=this.airborne.find(a=>a.owner===owner&&a.life>1e-6&&!a.extended&&a.fighter.invulnerableTime<=0);if(!a)return false;
    a.extended=true;a.life+=spell.duration;a.fighter.windControlTime=a.life;
    a.combo={age:0,ticks:0,duration:spell.duration,count:spell.count,damage:spell.damage};return true;
  }
  height(owner){return Math.max(0,...this.airborne.filter(a=>a.victim===owner).map(a=>a.height),...this.recoveries.filter(r=>r.owner===owner).map(r=>r.height*(1-ease(r.age/.35))));}
  release(a,recover=true){a.fighter.windControlTime=0;this.airborne.splice(this.airborne.indexOf(a),1);if(recover)this.recoveries.push({owner:a.victim,height:a.height,age:0});}
  summon(owner,spell,pos,dir){
    for(const s of [...this.spirits])if(s.owner===owner){s.root.removeFromParent();this.spirits.splice(this.spirits.indexOf(s),1);}
    const root=this.group(),model=this.spiritModel.create(),body=model.body;root.add(body);
    const gusts=new T.Group();root.add(gusts);
    for(let i=0;i<9;i++)this.mesh(gusts,'gust',this.gustMaterial,[0,0,0],[1,1,1]);
    const s={owner,root,body,model,gusts,age:0,life:spell.duration+spell.formation,duration:spell.duration,formation:spell.formation,normal:[dir[0],0,dir[2]],position:[...pos],width:spell.guardWidth,range:spell.guardRange,height:spell.guardHeight,reflections:0};
    this.spirits.push(s);this.placeSpirit(s);return s;
  }
  placeSpirit(s){
    // Keep the guardian in front at eye level, to the right of the aiming ray.
    const ahead=3.7,side=1.15;
    s.root.position.set(s.position[0]+s.normal[0]*ahead-s.normal[2]*side,s.position[1]+.20,s.position[2]+s.normal[2]*ahead+s.normal[0]*side);
    s.root.rotation.y=Math.atan2(s.normal[0],s.normal[2]);
  }
  advance(dt,actors,damage){
    for(const a of [...this.airborne]){
      a.age+=dt;a.life=Math.max(0,a.life-dt);a.height=3.1*ease(a.age/.28);
      if(a.combo){
        const c=a.combo;c.age=Math.min(c.duration,c.age+dt);const total=Math.min(c.count,Math.floor((c.age+1e-6)/(c.duration/c.count)));
        const victim=actors.find(f=>f.owner===a.victim);
        while(c.ticks<total){c.ticks++;if(victim){this.cut(victim.pos,c.ticks);damage({owner:a.owner,damage:c.damage/c.count,element:'wind',color:'#9fe9ce',style:'aircut',v:[0,0,1],unreflectable:true},victim.pos);}}
      }
      if(a.life<=1e-6)this.release(a);
    }
    for(const r of [...this.recoveries]){r.age+=dt;if(r.age>=.35)this.recoveries.splice(this.recoveries.indexOf(r),1);}
    for(const s of [...this.spirits]){
      s.age+=dt;s.life-=dt;const actor=actors.find(f=>f.owner===s.owner);
      if(actor){s.position=[...actor.pos];const n=new T.Vector3(actor.dir[0],0,actor.dir[2]);if(n.lengthSq()>1e-6)s.normal=n.normalize().toArray();}
      this.placeSpirit(s);
      if(s.life<=1e-6){s.root.removeFromParent();this.spirits.splice(this.spirits.indexOf(s),1);}
    }
  }
  redirect(shot,actors){
    if(['thunder','tsunami'].includes(shot.style)||['forming','staged','emerging','gathering','lightcharging'].includes(shot.phase))return false;
    for(const s of this.spirits){
      if(s.owner===shot.owner||s.age+1e-6<s.formation)continue;
      const n=s.normal;if(shot.v[0]*n[0]+shot.v[2]*n[2]>=-.001)continue;
      const local=p=>[(p[0]-s.position[0])*-n[2]+(p[2]-s.position[2])*n[0],p[1]-s.position[1]+1.72,(p[0]-s.position[0])*n[0]+(p[2]-s.position[2])*n[2]];
      const a=local(shot.old),b=local(shot.p),low=[-s.width/2-shot.size,-shot.size,1],high=[s.width/2+shot.size,s.height+shot.size,s.range];let enter=0,leave=1;
      for(let i=0;i<3;i++){const d=b[i]-a[i];if(Math.abs(d)<1e-8){if(a[i]<low[i]||a[i]>high[i]){enter=2;break;}}else{const x=(low[i]-a[i])/d,y=(high[i]-a[i])/d;enter=Math.max(enter,Math.min(x,y));leave=Math.min(leave,Math.max(x,y));}}
      if(enter>leave)continue;
      const point=shot.old.map((v,i)=>v+(shot.p[i]-v)*enter),targetActor=actors.find(f=>f.owner!==s.owner);if(!targetActor)continue;
      const target=[...targetActor.pos],speed=Math.hypot(...shot.v);
      if(shot.style==='meteor')target[1]=0;
      if(shot.style==='tsunami')target[1]=point[1];
      const dir=new T.Vector3(...target).sub(new T.Vector3(...point)).normalize();
      shot.windTimeLeft??=Math.max(1,shot.life||4);
      shot.owner=s.owner;shot.reflected=true;shot.v=dir.multiplyScalar(speed).toArray();shot.p=[...point];shot.old=[...point];shot.target=target;
      if(shot.style==='boat'){shot.origin=[...point];shot.flightAge=0;shot.travelTime=Math.hypot(...target.map((v,i)=>v-point[i]))/speed;}
      if(shot.style==='meteor'){shot.skyStart=[...point];shot.travelAge=0;shot.totalTime=Math.hypot(...target.map((v,i)=>v-point[i]))/speed;shot.skyTime=0;shot.returnTime=0;shot.fallTime=shot.totalTime;}
      if(shot.style==='tsunami'){shot.normal=new T.Vector3(shot.v[0],0,shot.v[2]).normalize().toArray();shot.hitTarget=false;}
      s.reflections++;this.reflections++;this.cut(point,s.reflections);return true;
    }
    return false;
  }
  cut(pos,index=0){const root=this.group();root.position.fromArray(pos);root.rotation.set(.2*index,0,index*.83);this.mesh(root,'slash',this.white);this.cuts.push({root,age:0});}
  makeTornado(){
    const root=this.group();for(let i=0;i<3;i++){const m=this.mesh(root,'spiral',i===0?this.white:this.mint);m.rotation.y=i*Math.PI*2/3;}
    const core=this.mesh(root,'funnel',this.soft,[0,2.7,0]);core.rotation.x=Math.PI;return root;
  }
  makeWall(){
    const root=this.group();
    for(let i=0;i<7;i++){const m=this.mesh(root,'slash',i%2?this.mint:this.white,[0,.45+i*.65,0],[2.1,.6,1]);m.rotation.z=i%2?Math.PI:0;}
    this.mesh(root,'sphere',this.soft,[0,2.5,0],[3.5,2.5,.16]);return root;
  }
  visuals(dt,time,shots,walls){
    const living=new Set(shots.filter(s=>s.element==='wind'));
    for(const [s,g] of this.shots)if(!living.has(s)){g.removeFromParent();this.shots.delete(s);}
    for(const s of living){
      let g=this.shots.get(s);if(!g){g=s.style==='tornado'?this.makeTornado():this.group();if(s.style!=='tornado'){this.mesh(g,'slash',this.body);this.mesh(g,'slash',this.white,[0,.055,-.07],[.92,.78,1]);}this.shots.set(s,g);}
      g.position.fromArray(s.p);
      if(s.style==='tornado'){g.position.y-=1.72;g.rotation.y=time*7;}
      else{g.quaternion.setFromUnitVectors(forward,new T.Vector3(...s.v).normalize());g.rotateZ(.3+Math.sin(time*5)*.08);}
    }
    const wallSet=new Set(walls.filter(w=>w.element==='wind'&&w.hp>0));
    for(const [w,g] of this.walls)if(!wallSet.has(w)){g.removeFromParent();this.walls.delete(w);}
    for(const w of wallSet){let g=this.walls.get(w);if(!g){g=this.makeWall();this.walls.set(w,g);}g.position.fromArray(w.p);g.rotation.y=Math.atan2(w.normal[0],w.normal[2]);for(let i=0;i<7;i++)g.children[i].position.x=Math.sin(time*5+i)*.25;}
    for(const s of this.spirits){
      s.body.position.y=Math.sin(time*3)*.055;s.body.scale.setScalar(.32*ease(s.age/.85));
      // Greet the caster, then turn toward incoming attacks without a camera cut.
      s.body.rotation.y=Math.PI*(1-ease((s.age-1.1)/.7));
      this.spiritModel.update(s.model,time,s.age+1e-6>=s.formation);
      s.gusts.visible=s.age+1e-6>=s.formation;
      for(let i=0;i<s.gusts.children.length;i++){
        const t=(time*1.3+i/9)%1,m=s.gusts.children[i],side=i%2?1:-1;
        m.position.set(side*(.8+t*1.2),.25-Math.sin(t*Math.PI)*.3,.5+t*(s.range-4));m.scale.setScalar(.55+t*.4);m.rotation.z=time*.4+i*.7;
      }
    }
    for(const c of [...this.cuts]){c.age+=dt;c.root.scale.setScalar(1+c.age*2);c.root.visible=c.age<.22;if(c.age>=.3){c.root.removeFromParent();this.cuts.splice(this.cuts.indexOf(c),1);}}
  }
  setInkViewport(width,height){this.spiritModel.setInkViewport(width,height);}
  reset(){
    for(const a of [...this.airborne])this.release(a,false);this.recoveries=[];
    for(const g of [...this.shots.values(),...this.walls.values(),...this.spirits.map(s=>s.root),...this.cuts.map(c=>c.root)])g.removeFromParent();
    this.shots.clear();this.walls.clear();this.spirits=[];this.cuts=[];this.reflections=0;
  }
  state(){return {airborne:this.airborne.map(a=>({owner:a.owner,victim:a.victim,life:a.life,age:a.age,height:a.height,extended:a.extended,comboTicks:a.combo?.ticks||0})),height:{player:this.height('player'),enemy:this.height('enemy')},spirits:this.spirits.map(s=>({owner:s.owner,age:s.age,life:s.life,model:'toon-butterfly-spirit',bodyRotation:s.body.rotation.toArray(),phase:s.age<s.formation?'forming':'blowing',position:s.root.position.toArray(),normal:[...s.normal],reflections:s.reflections,gusts:s.gusts.visible})),projectiles:this.shots.size,walls:this.walls.size,reflections:this.reflections};}
}
