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
  }
  update(shots){
    for(const [shot,root] of this.objects)if(!shots.includes(shot)){root.removeFromParent();this.objects.delete(shot);}
    for(const shot of shots){if(shot.style!=='shuriken')continue;let root=this.objects.get(shot);
      if(!root){root=new T.Group();const spinner=new T.Group(),color=shot.color||'#707983';
        if(!this.materials.has(color))this.materials.set(color,vfxToon(color,{side:T.DoubleSide,emissive:color,emissiveIntensity:.13}));
        const blade=new T.Mesh(this.geometry,this.materials.get(color));blade.name='shuriken-blade';spinner.add(blade,new T.LineSegments(this.edges,this.ink));root.add(spinner);root.userData.spinner=spinner;root.userData.blade=blade;
        if(shot.energy){
          const energy=new T.Group();energy.name='platinum-blade-energy';spinner.add(energy);root.userData.energy=energy;
          for(let i=0;i<2;i++){const arc=new T.Mesh(this.energyArc,this.energyMaterial);arc.rotation.z=i*Math.PI;arc.position.z=(i?1:-1)*.014;energy.add(arc);}
          for(let i=0;i<3;i++){const angle=i*Math.PI*2/3,spark=new T.Mesh(this.energySpark,this.energyMaterial);spark.position.set(Math.cos(angle)*.15,Math.sin(angle)*.15,.014);energy.add(spark);}
        }
        this.scene.add(root);this.objects.set(shot,root);}
      root.position.fromArray(shot.p);this.direction.fromArray(shot.v).normalize();root.quaternion.setFromUnitVectors(this.forward,this.direction);root.userData.spinner.rotation.z=shot.age*38;
      if(root.userData.energy)root.userData.energy.rotation.z=-shot.age*15;
    }
  }
  visualState(shot){const root=this.objects.get(shot);return root?{bladeColor:'#'+root.userData.blade.material.color.getHexString(),energy:!!root.userData.energy,energyRotation:root.userData.energy?.rotation.z||0,bladeDepth:.016}:null;}
  reset(){for(const root of this.objects.values())root.removeFromParent();this.objects.clear();}
}
