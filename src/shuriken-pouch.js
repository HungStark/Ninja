import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export function createShurikenPouch(bag){
  const root=new T.Group();root.name='shuriken-pouch';root.userData.item=bag.id;root.userData.capacity=bag.capacity;
  const size=bag.capacity>=50?1.3:bag.capacity>=30?1.2:bag.capacity>=20?1.1:1;root.scale.setScalar(.72*size);
  const leather=new T.MeshStandardMaterial({color:'#66513e',roughness:.95,flatShading:true});
  const dark=new T.MeshStandardMaterial({color:'#3f342c',roughness:.95,flatShading:true});
  const trim=new T.MeshStandardMaterial({color:'#b1a084',roughness:.55,metalness:.35});
  const parts=new Map();
  const box=(material,x,y,z,w,h,d)=>{const geometry=new T.BoxGeometry(w,h,d);geometry.translate(x,y,z);if(!parts.has(material))parts.set(material,[]);parts.get(material).push(geometry);};
  const shape=new T.Shape();shape.moveTo(-.13,-.02);shape.lineTo(.13,-.02);shape.lineTo(.145,-.24);shape.quadraticCurveTo(.14,-.3,.09,-.31);shape.lineTo(-.09,-.31);shape.quadraticCurveTo(-.14,-.3,-.145,-.24);shape.closePath();
  const body=new T.ExtrudeGeometry(shape,{depth:.15,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:1,curveSegments:2,steps:1});body.translate(0,0,-.075);parts.set(leather,[body]);
  box(dark,0,-.055,.09,.29,.11,.025);box(dark,0,-.135,.094,.055,.13,.022);
  for(const x of [-.085,.085])box(dark,x,.015,-.065,.045,.1,.032);
  box(trim,0,-.15,.112,.079,.06,.013);box(dark,0,-.15,.121,.043,.029,.008);
  for(const x of [-.115,.115])box(trim,x,-.05,.106,.009,.065,.008);
  for(const [material,geometries] of parts){
    const mesh=new T.Mesh(mergeGeometries(geometries),material);mesh.name='pouch-'+bag.id;mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);geometries.forEach(g=>g.dispose());
  }
  return root;
}

export function disposeShurikenPouch(root){
  const geometries=new Set(),materials=new Set();
  root.traverse(o=>{if(o.userData.inkOutline)return;if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.removeFromParent();
}
