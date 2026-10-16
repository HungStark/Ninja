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
    this.material=vfxToon('#c0cbd6',{side:T.DoubleSide,emissive:'#263849',emissiveIntensity:.35});
    this.ink=new T.LineBasicMaterial({color:'#263747'});
  }
  update(shots){
    for(const [shot,root] of this.objects)if(!shots.includes(shot)){root.removeFromParent();this.objects.delete(shot);}
    for(const shot of shots){if(shot.style!=='shuriken')continue;let root=this.objects.get(shot);
      if(!root){root=new T.Group();const spinner=new T.Group();spinner.add(new T.Mesh(this.geometry,this.material),new T.LineSegments(this.edges,this.ink));root.add(spinner);root.userData.spinner=spinner;this.scene.add(root);this.objects.set(shot,root);}
      root.position.fromArray(shot.p);this.direction.fromArray(shot.v).normalize();root.quaternion.setFromUnitVectors(this.forward,this.direction);root.userData.spinner.rotation.z=shot.age*38;
    }
  }
  reset(){for(const root of this.objects.values())root.removeFromParent();this.objects.clear();}
}
