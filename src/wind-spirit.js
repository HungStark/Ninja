import * as T from 'three';
import { vfxToon } from './vfx-materials.js';
import { inkMaterial, addInkOutline } from './ink-outline.js';

// Elliptical cross sections give the leaves real thickness and curved surfaces.
function leafGeometry() {
  const positions=[],indices=[],rows=18,sides=12;
  for(let i=0;i<=rows;i++){
    const t=i/rows,w=Math.max(.002,Math.pow(Math.sin(Math.PI*t),.8));
    for(let j=0;j<=sides;j++){
      const a=j/sides*Math.PI*2;
      positions.push(Math.cos(a)*w*.3+Math.sin(Math.PI*t)*.04,t,Math.sin(a)*w*.07+Math.sin(Math.PI*t)*.08);
      if(i<rows&&j<sides){const k=i*(sides+1)+j;indices.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

function skirtGeometry(){
  const positions=[],indices=[],n=24,levels=[[.04,.18],[-.18,.24],[-.48,.35],[-.73,.43]];
  for(let i=0;i<levels.length;i++)for(let j=0;j<=n;j++){
    const a=j/n*Math.PI*2,[y,r]=levels[i];
    positions.push(Math.sin(a)*r,y+(i===levels.length-1?Math.cos(a*6)*.045:0),Math.cos(a)*r*.72);
    if(i<levels.length-1&&j<n){const k=i*(n+1)+j;indices.push(k,k+n+1,k+1,k+1,k+n+1,k+n+2);}
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

function butterflyWingGeometry(){
  const g=new T.SphereGeometry(1,32,20),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    // Round lobes, a narrower root and a gently bowed, solid wing surface.
    p.setXYZ(i,x*.51*(.87+.13*y),y*.60,z*.075+(1-y*y)*.065);
  }
  g.computeVertexNormals();return g;
}

function glowTexture(){
  const size=64,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const radius=Math.hypot((x+.5-size/2)/(size/2),(y+.5-size/2)/(size/2)),i=(y*size+x)*4;
    data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(Math.pow(Math.max(0,1-radius),2.5)*255);
  }
  const texture=new T.DataTexture(data,size,size,T.RGBAFormat);texture.needsUpdate=true;return texture;
}

export class WindSpiritModel {
  constructor(){
    this.materials={skin:vfxToon('#f3d7b6',{emissive:'#978167',emissiveIntensity:.20}),hair:vfxToon('#398558',{emissive:'#53b475',emissiveIntensity:.12}),tips:vfxToon('#b3ed9c',{emissive:'#85f28a',emissiveIntensity:.25}),cloth:vfxToon('#68bd85',{emissive:'#47d673',emissiveIntensity:.18}),wing:vfxToon('#b6efaa',{emissive:'#6bff89',emissiveIntensity:.38}),gold:vfxToon('#d4f2a3',{emissive:'#88ce79',emissiveIntensity:.18}),white:new T.MeshBasicMaterial({color:'#fff8e8'}),eye:new T.MeshBasicMaterial({color:'#163c37'}),spark:new T.MeshBasicMaterial({color:new T.Color('#93ffad').multiplyScalar(1.7),toneMapped:false})};
    this.glowMaterial=new T.SpriteMaterial({map:glowTexture(),color:'#64f58b',opacity:.22,transparent:true,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false});
    this.ink=inkMaterial(.28,'#346344');
    this.geo={sphere:new T.SphereGeometry(1,24,18),leaf:leafGeometry(),wing:butterflyWingGeometry(),skirt:skirtGeometry(),cylinder:new T.CylinderGeometry(1,1,1,12),ring:new T.TorusGeometry(1,.05,6,48)};
  }
  mesh(parent,type,material,position,scale,outline=true){
    const m=new T.Mesh(this.geo[type],this.materials[material]);m.position.fromArray(position);m.scale.fromArray(scale);parent.add(m);
    if(outline)addInkOutline(m,this.ink);return m;
  }
  segment(parent,a,b,r,material){
    const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);
    const m=this.mesh(parent,'cylinder',material,start.clone().add(end).multiplyScalar(.5).toArray(),[r,delta.length(),r]);
    m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;
  }
  create(){
    const body=new T.Group(),wings=[],arms=[],sparkles=[];
    body.name='ToonButterflySpirit';
    this.mesh(body,'sphere','cloth',[0,.23,0],[.22,.30,.145]);
    this.mesh(body,'cylinder','skin',[0,.49,0],[.075,.13,.075]);
    this.mesh(body,'sphere','skin',[0,.72,.015],[.275,.29,.22]);
    this.mesh(body,'sphere','hair',[0,.87,-.055],[.29,.21,.23]);
    this.mesh(body,'sphere','skin',[0,.70,.208],[.04,.055,.027]);
    const mouth=this.mesh(body,'sphere','eye',[0,.615,.208],[.040,.010,.008],false);
    mouth.name='SpiritMouth';
    this.mesh(body,'skirt','cloth',[0,-.015,0],[1,1,1]);
    this.mesh(body,'ring','gold',[0,-.015,0],[.19,.19,.13]).rotation.x=Math.PI/2;
    this.mesh(body,'sphere','gold',[0,.08,.145],[.052,.068,.024]);
    for(const side of [-1,1]){
      this.mesh(body,'sphere','white',[side*.094,.735,.195],[.071,.069,.017],false);
      this.mesh(body,'sphere','eye',[side*.096,.735,.211],[.033,.049,.012],false);
      this.mesh(body,'sphere','white',[side*.085,.755,.224],[.012,.014,.006],false);
      this.mesh(body,'sphere','hair',[side*.091,.799,.185],[.079,.013,.02]);
      const ear=this.mesh(body,'leaf','skin',[side*.24,.67,0],[.16,.16,.60]);ear.rotation.z=-side*1.2;
      const bang=this.mesh(body,'leaf','hair',[side*.095,.96,.10],[.39,.34,.60]);bang.rotation.z=Math.PI+side*.30;
      const lock=this.mesh(body,'leaf','hair',[side*.18,.80,-.15],[.48,1.05,.8]);lock.rotation.z=Math.PI+side*.14;
      this.segment(body,[side*.08,.98,-.01],[side*.17,1.18,.015],.012,'hair');
      this.mesh(body,'sphere','spark',[side*.17,1.18,.015],[.035,.035,.035],false);
      this.mesh(body,'sphere','skin',[side*.12,-.85,0],[.068,.22,.065]);
      this.mesh(body,'sphere','hair',[side*.12,-1.055,.045],[.085,.105,.14]);
      const petal=this.mesh(body,'leaf','tips',[side*.115,.02,.15],[.43,.66,.6]);petal.rotation.z=Math.PI+side*.18;
      const shoulder=new T.Group();shoulder.position.set(side*.20,.32,0);body.add(shoulder);arms.push({side,root:shoulder});
      this.mesh(shoulder,'sphere','tips',[0,0,0],[.125,.14,.13]);
      this.segment(shoulder,[0,0,0],[side*.20,-.20,.035],.063,'skin');
      this.segment(shoulder,[side*.20,-.20,.035],[side*.36,-.09,.20],.052,'skin');
      this.mesh(shoulder,'sphere','skin',[side*.36,-.09,.20],[.072,.085,.05]);
      this.mesh(shoulder,'sphere','gold',[side*.31,-.125,.16],[.055,.049,.055]);
      for(const high of [true,false]){
        const pivot=new T.Group();pivot.position.set(side*.12,.23,-.13);pivot.rotation.z=-side*(high?.78:2.02);body.add(pivot);wings.push({side,high,root:pivot});
        this.mesh(pivot,'wing','wing',[0,high?.56:.36,0],[high?1.15:.9,high?1:.68,1]);
        this.mesh(pivot,'sphere','tips',[side*.12,high?.75:.47,.14],[high?.14:.10,high?.19:.13,.012],false);
        this.mesh(pivot,'sphere','gold',[-side*.14,high?.48:.25,.13],[.06,.085,.01],false);
      }
    }
    const halo=this.mesh(body,'ring','tips',[0,-1.15,0],[.34,.34,.34],false);halo.rotation.x=Math.PI/2;
    const glow=new T.Sprite(this.glowMaterial);glow.position.set(0,.15,0);glow.scale.set(3.8,3.8,1);body.add(glow);
    for(let i=0;i<5;i++)sparkles.push(this.mesh(body,'sphere','spark',[0,0,0],[.022,.022,.022],false));
    return {body,wings,arms,mouth,halo,sparkles};
  }
  update(model,time,blowing){
    for(const w of model.wings)w.root.rotation.y=w.side*(.20+Math.sin(time*11+(w.high?0:.35))*.30);
    for(const a of model.arms)a.root.rotation.z=a.side*Math.sin(time*3)*.055;
    model.mouth.scale.y=blowing?.024:.010;model.halo.rotation.z=time*.4;
    for(let i=0;i<model.sparkles.length;i++){
      const t=(time*.24+i/model.sparkles.length)%1,a=time*.7+i*2.4,m=model.sparkles[i];
      m.position.set(Math.cos(a)*(.62+t*.3),-1+t*2.2,Math.sin(a)*.4);m.scale.setScalar(.022*Math.sin(Math.PI*t));
    }
  }
  setInkViewport(w,h){this.ink.uniforms.viewport.value.set(w,h);}
}
