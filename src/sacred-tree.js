import * as T from 'three';

export const WOOD_SACRED_TREE=Object.freeze({id:'wood-sacred-tree',x:5,z:0,eventSite:{x:5,z:6.8},ladderX:9.3,ladderZ:6.25});
export const sacredTreeRecovered=save=>(save.story?.villageEvents?.wood||0)>=4;

export function createSacredTreeStatus(root,bark,leaves){
  root.userData.sacredTreeId=WOOD_SACRED_TREE.id;
  const poison=new T.Group(),shoots=new T.Group();poison.name='sacred-tree-poison';shoots.name='sacred-tree-new-shoots';poison.userData.dynamic=shoots.userData.dynamic=true;root.add(poison,shoots);
  const blight=new T.MeshStandardMaterial({color:'#583c62',roughness:1}),vein=new T.MeshBasicMaterial({color:'#81578c'}),green=new T.MeshStandardMaterial({color:'#79ad54',roughness:1});
  for(let i=0;i<7;i++){
    const a=i*2.4,x=5+Math.sin(a)*3.3,z=Math.cos(a)*3.3;
    const patch=new T.Mesh(new T.DodecahedronGeometry(.4,0),blight);patch.position.set(x,.35,z);patch.scale.set(1.5,.5,.8);poison.add(patch);
    const points=[new T.Vector3(5+Math.sin(a)*2.2,1.1,Math.cos(a)*2.2),new T.Vector3(x,.45,z),new T.Vector3(5+Math.sin(a)*4.2,.18,Math.cos(a)*4.2)];
    const mark=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),12,.065,5,false),vein);mark.name='poisoned-root-vein';poison.add(mark);
    for(let j=0;j<2;j++){const sprout=new T.Mesh(new T.OctahedronGeometry(.3),green);sprout.position.set(x+(j-.5)*.35,.3+j*.25,z);sprout.scale.set(.6,1.25,.35);sprout.rotation.z=(j?1:-1)*.5;shoots.add(sprout);}
  }
  poison.traverse(o=>o.userData.noCollision=true);shoots.traverse(o=>o.userData.noCollision=true);
  let recovered=false;
  return {sync(save){recovered=sacredTreeRecovered(save);poison.visible=!recovered;shoots.visible=recovered;bark.color.set(recovered?'#655039':'#514348');leaves.forEach((m,i)=>m.color.set(recovered?['#315d35','#3e6b36','#47733b'][i%3]:['#615544','#756047','#635543'][i%3]));root.userData.treeHealth=recovered?'recovered':'poisoned';},state:()=>({id:WOOD_SACRED_TREE.id,x:5,z:0,recovered,poisoned:!recovered,house:'central-tree-house',eventSite:{...WOOD_SACRED_TREE.eventSite}})};
}
