import * as T from 'three';
import {armorById,armguardById} from './equipment.js';
import {createArmorWardrobe} from './hero-armor.js';
import {createArmguardModel} from './armguard-model.js';

const cache=new Map();let renderer,scene,camera;
function picture(kind,item){
  const key=kind+':'+item.id;if(cache.has(key))return cache.get(key);
  if(!renderer){
    renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setSize(160,160);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
    scene=new T.Scene();scene.add(new T.HemisphereLight('#ecf4ed','#43454b',2.6));const light=new T.DirectionalLight('#ffe4bf',4);light.position.set(-3,5,5);scene.add(light);
    camera=new T.OrthographicCamera(-.75,.75,.75,-.75,.1,15);
  }
  const root=new T.Group();scene.add(root);
  if(kind==='armor'){
    const group=(x=0,y=0)=>{const g=new T.Group();g.position.set(x,y,0);root.add(g);return g;};
    const anchors={body:group(),shoulders:[group(-.36,2.04),group(.36,2.04)],bracers:[group(-.38,1.58),group(.38,1.58)],hips:[group(-.175,1.21),group(.175,1.21)],shins:[group(-.175,.71),group(.175,.71)]};
    if(item.id==='traveler'){
      const cloth=new T.MeshStandardMaterial({color:'#29252c',roughness:.85}),red=new T.MeshStandardMaterial({color:'#762936'});
      const vest=new T.Mesh(new T.CylinderGeometry(.32,.27,.78,8),cloth);vest.position.y=1.75;vest.scale.z=.76;root.add(vest);
      const sash=new T.Mesh(new T.BoxGeometry(.09,.83,.04),red);sash.position.set(0,1.75,.26);sash.rotation.z=.48;root.add(sash);
    }else createArmorWardrobe(anchors).build(item);
    anchors.bracers.forEach(g=>g.visible=false);anchors.shins.forEach(g=>g.visible=false);
    root.rotation.y=-.3;camera.position.set(0,1.76,5);camera.lookAt(0,1.76,0);camera.zoom=1.06;
  }else{
    for(const side of [-1,1]){const model=createArmguardModel(item);model.position.set(side*.19,0,0);model.rotation.z=-side*.18;model.rotation.y=-side*.28;root.add(model);}
    camera.position.set(0,-.22,4);camera.lookAt(0,-.22,0);camera.zoom=2.3;
  }
  camera.updateProjectionMatrix();renderer.render(scene,camera);const url=renderer.domElement.toDataURL('image/png');cache.set(key,url);
  const ownedMaterials=new Set();root.traverse(o=>{o.geometry?.dispose();if(kind==='armor'&&o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>ownedMaterials.add(m));});ownedMaterials.forEach(m=>m.dispose());scene.remove(root);
  return url;
}
export function fillGearIcons(container){
  for(const img of container.querySelectorAll('img[data-gear-icon]')){
    const kind=img.dataset.kind,item=(kind==='armor'?armorById:armguardById)(img.dataset.gearIcon);if(item)img.src=picture(kind,item);
  }
}
