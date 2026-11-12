import * as T from 'three';

// Reuse one small set of meshes for every visit to a clinic.
export function createTreatmentEffect(actor){
  const root=new T.Group();root.name='clinic-treatment';root.visible=false;root.userData.dynamic=true;actor.add(root);
  const geometry=new T.BoxGeometry(1,1,1),materials=[],signs=[];let age=2;
  for(let i=0;i<8;i++){
    const sign=new T.Group(),material=new T.MeshBasicMaterial({color:'#54ed87',transparent:true,depthWrite:false,toneMapped:false});
    for(const [w,h] of [[.4,.12],[.12,.4]]){const mesh=new T.Mesh(geometry,material);mesh.scale.set(w,h,.08);sign.add(mesh);}
    root.add(sign);signs.push(sign);materials.push(material);
  }
  return {clear(){age=2;root.visible=false;},start(){age=0;root.visible=true;},update(dt){if(age>=2)return;age=Math.min(2,age+dt);root.visible=age<2;signs.forEach((sign,i)=>{const t=(age*.9+i/8)%1,a=i*2.4;sign.position.set(Math.sin(a)*.7,.4+t*2.7,Math.cos(a)*.7);sign.rotation.y=-actor.rotation.y;materials[i].opacity=Math.min(1,t*6,(1-t)*4);});},state:()=>({active:age<2,age})};
}
