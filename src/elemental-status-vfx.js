import * as T from 'three';
import { canvasTexture } from './materials.js';

export class ElementalStatusEffects{
  constructor(scene,flameTexture){
    this.scene=scene;this.flameTexture=flameTexture;this.actors=new Map();
    this.numbers={burn:[],static:[]};
    for(const [kind,max,color,label] of [['burn',5,'#ff4938','BỎNG'],['static',3,'#9b9aff','TĨNH ĐIỆN']])for(let n=1;n<=max;n++){
      this.numbers[kind][n]=canvasTexture(256,(c,size)=>{
        c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
        c.font='900 150px sans-serif';c.strokeStyle='#141626';c.lineWidth=14;c.strokeText(String(n),size/2,108);c.fillStyle=color;c.fillText(String(n),size/2,108);
        c.font='bold 28px sans-serif';c.lineWidth=6;c.strokeText(label,size/2,211);c.fillText(label,size/2,211);
      });
    }
    this.ringGeometry=new T.TorusGeometry(.75,.025,5,48);
  }
  make(owner){
    const root=new T.Group();this.scene.add(root);
    const flames=Array.from({length:12},()=>{const f=new T.Sprite(new T.SpriteMaterial({map:this.flameTexture,color:'#ffb16b',transparent:true,depthWrite:false,blending:T.AdditiveBlending}));root.add(f);return f;});
    const counters=['burn','static'].map(()=>{const s=new T.Sprite(new T.SpriteMaterial({transparent:true,depthWrite:false}));s.scale.setScalar(1.1);root.add(s);return s;});
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(6*10*6),3));
    const arcs=new T.LineSegments(geometry,new T.LineBasicMaterial({color:new T.Color('#9b8cff').multiplyScalar(2.1),transparent:true,opacity:.85,depthWrite:false,blending:T.AdditiveBlending}));arcs.frustumCulled=false;root.add(arcs);
    const magnet=new T.Mesh(this.ringGeometry,new T.MeshBasicMaterial({color:'#a49aff',transparent:true,opacity:.7,depthWrite:false,blending:T.AdditiveBlending}));magnet.rotation.x=-Math.PI/2;magnet.position.y=.1;root.add(magnet);
    const entry={owner,root,flames,counters,arcs,magnet,burnCount:0,staticCount:0};this.actors.set(owner,entry);return entry;
  }
  update(time,actors,quality,reducedMotion,camera){
    for(const actor of actors){
      const f=actor.fighter,e=this.actors.get(actor.owner)||this.make(actor.owner),base=actor.pos[1]-1.72;
      e.root.position.set(actor.pos[0],base,actor.pos[2]);
      // The FPS player's own numbers are in the HUD; world counters remain above bodies.
      e.root.visible=f.hp>0&&camera.position.distanceTo(new T.Vector3(...actor.pos))>2;
      e.burnCount=f.burns.length;e.staticCount=f.staticStacks;
      e.counters.forEach((s,i)=>{
        const count=i?f.staticStacks:f.burns.length;s.visible=count>0;
        if(count){s.material.map=this.numbers[i?'static':'burn'][count];s.material.needsUpdate=s.userData.last!==count;s.userData.last=count;s.position.set(f.burns.length&&f.staticStacks?(i?.58:-.58):0,3.65,0);}
      });
      const level=Math.max(f.burns.length,f.ignitionLevel),ignited=f.ignitionTime>0;
      e.flames.forEach((flame,i)=>{
        flame.visible=level>0&&i<(quality===2?5:8)+(ignited?4:0);if(!flame.visible)return;
        const phase=(time*(reducedMotion?.3:1.4)+i*.23)%1,a=i*2.399;
        const radius=(ignited?.55:.43)+(ignited?level*.065:level*.015);
        flame.position.set(Math.cos(a)*radius,.35+phase*1.7,Math.sin(a)*radius);
        const height=(ignited?1.05+level*.33:.42+level*.09)*(1-phase*.3);
        flame.scale.set(height*.58,height,1);flame.material.opacity=(ignited?.9:.55)*(1-phase*.7);
      });
      e.arcs.visible=f.staticStacks>0||f.lightningControlTime>0||f.magneticTime>0;
      if(e.arcs.visible){
        const p=e.arcs.geometry.attributes.position,segments=quality===2?3:6,clock=reducedMotion?0:Math.floor(time*18);
        let index=0;
        for(let arc=0;arc<segments;arc++)for(let j=0;j<10;j++)for(const k of [j,j+1]){
          const u=k/10,a=arc*1.047+u*1.5,noise=Math.sin(k*11.7+arc*7.3+clock*2.1),radius=.55+noise*.1;
          p.setXYZ(index++,Math.cos(a)*radius,.2+u*2.65+Math.sin(arc)*.1,Math.sin(a)*radius);
        }
        e.arcs.geometry.setDrawRange(0,index);p.needsUpdate=true;
        e.arcs.material.opacity=f.lightningControlTime>0?1:.48+f.staticStacks*.12;
      }
      e.magnet.visible=f.magneticActive;e.magnet.scale.setScalar(reducedMotion?1:1+Math.sin(time*4)*.1);
    }
  }
  state(){return [...this.actors.values()].map(e=>({owner:e.owner,visible:e.root.visible,burnCounter:e.burnCount,staticCounter:e.staticCount,flames:e.flames.filter(f=>f.visible).length,arcs:e.arcs.visible,magnetic:e.magnet.visible}));}
  reset(){for(const e of this.actors.values()){e.root.removeFromParent();e.arcs.geometry.dispose();e.root.traverse(o=>{if(o.material)o.material.dispose();});}this.actors.clear();}
}
