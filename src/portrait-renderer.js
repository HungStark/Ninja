import * as T from 'three';
import {createHero} from './hero.js';
import {createVillager} from './villager.js';
import {villagerAppearance} from './villager-appearance.js';
import {createNinja} from './ninja.js';
import {createEncounterCreature} from './encounter-appearance.js';

const WIDTH=256,HEIGHT=304;let renderer=null,previous=null;
function disposeModel(model){
  if(model.dispose){model.dispose();return;}
  const geometries=new Set(),materials=new Set(),skeletons=new Set();
  model.root.traverse(o=>{if(o.geometry&&!o.isSkinnedMesh)geometries.add(o.geometry);if(o.skeleton)skeletons.add(o.skeleton);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])materials.add(m);});
  // GLB/VRM geometries and textures are shared with live characters. Only the
  // portrait clone's procedural geometry, materials and skeleton are owned here.
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());skeletons.forEach(s=>s.dispose());model.root.userData.villager=null;model.root.removeFromParent();
}

export async function renderPortrait(spec){
  const scene=new T.Scene();let model;
  try{
    if(spec.kind==='hero'){model=createHero({outlineWidth:.5});model.setEquipment(spec.equipment);}
    else if(spec.kind==='guardian')model=createEncounterCreature(spec.village);
    else if(spec.kind==='ninja'){model=createNinja(spec.profile);model.setStoryPose(spec.pose);}
    else model=createVillager({...spec.profile,activity:null,memorialOffering:false});
    scene.add(model.root);await model.ready;
    if(spec.kind==='hero'?!model.root.userData.referenceAppearance:spec.kind!=='guardian'&&!model.modelReady)throw Error('Portrait model is unavailable');
    model.update?.(0,false,null,0);model.setInkViewport?.(WIDTH,HEIGHT);model.root.rotation.y=.10;model.root.updateMatrixWorld(true);
    const head=model.root.getObjectByName('J_Bip_C_Head')||model.root.getObjectByName('guardian-head-pivot'),bounds=new T.Box3(),point=new T.Vector3();
    model.root.traverseVisible(o=>{if(!o.isMesh||o.userData.inkOutline)return;for(let i=0;i<o.geometry.attributes.position.count;i++){o.getVertexPosition(i,point);bounds.expandByPoint(point.applyMatrix4(o.matrixWorld));}});
    const headPosition=head?.getWorldPosition(new T.Vector3())||bounds.getCenter(new T.Vector3());
    const span=spec.kind==='guardian'?Math.max(2.2,bounds.getSize(new T.Vector3()).x*.85):Math.max(1.35,(bounds.max.y-headPosition.y+.12)*2.15);
    const target=headPosition.clone();target.y-=spec.kind==='guardian'?.05:.12;
    const camera=new T.PerspectiveCamera(30,WIDTH/HEIGHT,.05,40),distance=span*.5/Math.tan(T.MathUtils.degToRad(camera.fov/2));
    camera.position.set(target.x,target.y,target.z+distance);camera.lookAt(target);camera.updateProjectionMatrix();
    scene.add(new T.HemisphereLight('#e9eee3','#635c55',2.6));const key=new T.DirectionalLight('#fff0da',3.2);key.position.set(-3,5,6);scene.add(key);const fill=new T.DirectionalLight('#b3cbdc',1.1);fill.position.set(4,3,2);scene.add(fill);
    renderer??=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1);renderer.setSize(WIDTH,HEIGHT,false);renderer.setClearColor('#172e33',1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
    renderer.render(scene,camera);const src=renderer.domElement.toDataURL('image/webp',.82);renderer.renderLists.dispose();return src;
  }finally{if(previous)disposeModel(previous);previous=model;}
}

