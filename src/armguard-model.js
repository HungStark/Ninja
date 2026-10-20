import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

const materials=new Map();
function mat(color,metal=false){const key=color+metal;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,metalness:metal?.55:0,roughness:metal?.42:.9,flatShading:true}));return materials.get(key);}
// Joint-local forearm geometry, shared by the hero, seal rig and inventory pictures.
export function createArmguardModel(item={id:'bare-wrists',color:'#403640'}){
  const root=new T.Group();root.name='equipped-armguard';root.userData.item=item.id;
  const plate=mat(item.color||'#403640',true),shade=mat(new T.Color(item.color||'#403640').multiplyScalar(.53).getStyle(),true),trim=mat(item.elite?'#d8b67a':'#aaa99d',true),cloth=mat('#29252e');
  const box=(m,x,y,z,w,h,d,angle=0)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.rotation.z=angle;root.add(o);return o;};
  for(const y of [-.09,-.30])box(cloth,0,y,.005,.205,.045,.19);
  if(item.id==='bare-wrists')box(shade,0,-.2,.108,.13,.19,.02);
  else{
    const region=item.village,rows=item.elite?4:3;
    for(let i=0;i<rows;i++){
      const y=-.08-i*.068,w=.17+(i===0?.025:0),o=box(i%2?shade:plate,0,y,.111,w,.06,.046,['wind','dark'].includes(region)?(i%2?.13:-.13):0);
      if(['water','wood'].includes(region)){o.rotation.z=.14;box(trim,0,y-.024,.14,w*.65,.009,.012);}
    }
    if(['earth','lightning','ice'].includes(region)){
      const jewel=new T.Mesh(new T.OctahedronGeometry(item.elite?.07:.048),plate);jewel.scale.set(1,1.45,.38);jewel.position.set(0,-.17,.16);root.add(jewel);
    }else box(trim,0,-.17,.145,.023,.2,.015,['fire','dark'].includes(region)?-.28:.28);
    for(const x of [-.075,.075])box(trim,x,-.17,.14,.013,.25,.015);
    if(item.elite){for(const x of [-.102,.102])box(shade,x,-.2,.07,.04,.21,.09,x<0?-.12:.12);box(trim,0,-.035,.105,.21,.025,.06);}
    if(item.gloves){box(cloth,0,-.405,.045,.16,.13,.115);box(plate,0,-.4,.108,.12,.09,.026);}
  }
  // One draw per material, with owned geometry that can be safely disposed on change.
  const batches=new Map();root.updateMatrixWorld(true);
  for(const o of [...root.children]){const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrixWorld);if(!batches.has(o.material))batches.set(o.material,[]);batches.get(o.material).push(g);o.geometry.dispose();root.remove(o);}
  for(const [material,geometries] of batches){const mesh=new T.Mesh(mergeGeometries(geometries),material);geometries.forEach(g=>g.dispose());mesh.castShadow=mesh.receiveShadow=true;root.add(mesh);}
  return root;
}
export function disposeArmguard(root){root.traverse(o=>o.geometry?.dispose());root.removeFromParent();}
