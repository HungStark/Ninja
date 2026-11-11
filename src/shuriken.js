import * as T from 'three';
import { vfxToon } from './vfx-materials.js';

export class ShurikenVisuals {
  constructor(scene){
    this.scene=scene;this.objects=new Map();this.forward=new T.Vector3(0,0,1);this.direction=new T.Vector3();
    const shape=new T.Shape();
    for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?.035:.115,x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);}shape.closePath();
    const hole=new T.Path();hole.absarc(0,0,.014,0,Math.PI*2,true);shape.holes.push(hole);
    this.geometry=new T.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:true,bevelSize:.002,bevelThickness:.002,bevelSegments:1,steps:1});this.geometry.translate(0,0,-.006);
    this.edges=new T.EdgesGeometry(this.geometry,25);
    this.materials=new Map();
    this.ink=new T.LineBasicMaterial({color:'#263747'});
    this.energyMaterial=new T.MeshBasicMaterial({color:new T.Color('#8aeaff').multiplyScalar(1.7),transparent:true,opacity:.8,depthWrite:false,blending:T.AdditiveBlending});
    this.energyArc=new T.TorusGeometry(.147,.004,4,24,Math.PI*.65);
    this.energySpark=new T.SphereGeometry(.006,6,4);
    // Three tapered wind ribbons trail behind local +Z without spinning with the blade.
    const positions=[],colors=[];
    for(let ribbon=0;ribbon<3;ribbon++)for(let i=0;i<16;i++){
      const vertex=(t,edge)=>{const fade=(1-t)**1.4,width=(ribbon===0?.105:.035)*(1-t),offset=(ribbon===0?0:ribbon===1?-1:1)*(.18+.12*Math.sin(t*Math.PI));positions.push(offset+edge*width,.025+(ribbon===0?.025:0),-t);colors.push(.78*fade,.94*fade,fade);};
      const a=i/16,b=(i+1)/16;vertex(a,-1);vertex(b,-1);vertex(a,1);vertex(a,1);vertex(b,-1);vertex(b,1);
    }
    this.windGeometry=new T.BufferGeometry();this.windGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));this.windGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
    this.windMaterial=new T.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.7,blending:T.AdditiveBlending,side:T.DoubleSide,depthWrite:false});
  }
  update(shots,{overhead=false}={}){
    for(const [shot,root] of this.objects)if(!shots.includes(shot)){root.removeFromParent();this.objects.delete(shot);}
    for(const shot of shots){if(shot.style!=='shuriken')continue;let root=this.objects.get(shot);
      if(!root){root=new T.Group();const spinner=new T.Group(),color=shot.color||'#707983';
        if(!this.materials.has(color))this.materials.set(color,vfxToon(color,{side:T.DoubleSide,emissive:color,emissiveIntensity:.13}));
        const blade=new T.Mesh(this.geometry,this.materials.get(color));blade.name='shuriken-blade';spinner.add(blade,new T.LineSegments(this.edges,this.ink));root.add(spinner);root.userData.spinner=spinner;root.userData.blade=blade;
        const energy=new T.Group();energy.name='shuriken-blade-energy';spinner.add(energy);root.userData.energy=energy;
        for(let i=0;i<2;i++){const arc=new T.Mesh(this.energyArc,this.energyMaterial);arc.rotation.z=i*Math.PI;arc.position.z=(i?1:-1)*.014;energy.add(arc);}
        for(let i=0;i<3;i++){const angle=i*Math.PI*2/3,spark=new T.Mesh(this.energySpark,this.energyMaterial);spark.position.set(Math.cos(angle)*.15,Math.sin(angle)*.15,.014);energy.add(spark);}
        const wind=new T.Mesh(this.windGeometry,this.windMaterial);wind.name='shuriken-wind-trail';wind.position.z=-.3;root.add(wind);root.userData.wind=wind;
        this.scene.add(root);this.objects.set(shot,root);}
      root.position.fromArray(shot.p);this.direction.fromArray(shot.v).normalize();root.quaternion.setFromUnitVectors(this.forward,this.direction);root.userData.spinner.rotation.z=shot.age*38;
      root.userData.spinner.scale.setScalar(overhead?2:1);
      const wind=root.userData.wind;wind.visible=overhead&&shot.age>0;wind.scale.z=Math.min(2.8,Math.hypot(...shot.v)*shot.age);
      if(root.userData.energy)root.userData.energy.rotation.z=-shot.age*15;
    }
  }
  visualState(shot){const root=this.objects.get(shot);return root?{bladeColor:'#'+root.userData.blade.material.color.getHexString(),energy:!!root.userData.energy,energyRotation:root.userData.energy?.rotation.z||0,bladeDepth:.016,scale:root.userData.spinner.scale.x,windTrail:root.userData.wind.visible,windLength:root.userData.wind.visible?root.userData.wind.scale.z:0}:null;}
  reset(){for(const root of this.objects.values())root.removeFromParent();this.objects.clear();}
}
