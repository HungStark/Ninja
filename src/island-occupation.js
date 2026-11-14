import * as T from 'three';

export const ISLAND_LIBERATION={light:4,dark:7};
export const islandOccupied=(save,id=save.village)=>id in ISLAND_LIBERATION&&(save.story?.villageEvents?.[id]||0)<ISLAND_LIBERATION[id];
export const islandCenterLocked=(save,id=save.village)=>islandOccupied(save,id)&&(save.story?.villageEvents?.[id]||0)<(id==='light'?3:6);
export const beastRescued=(save,id)=>({light:(save.story?.villageEvents?.light||0)>=4,wood:(save.story?.villageEvents?.dark||0)>=3,ice:(save.story?.villageEvents?.dark||0)>=5,dark:(save.story?.villageEvents?.dark||0)>=7})[id]||false;
export const beastCaptured=(save,id)=>['wood','ice','light','dark'].includes(id)&&((save.story?.villageEvents?.ice||0)>=7||['light','dark'].includes(id))&&!beastRescued(save,id);
export const legionGuardId=id=>'crescent-'+id;
export function legionGuard(entry,id){return {...entry,id:legionGuardId(entry.id),occupation:true,elite:id==='dark',disguise:null,element:entry.guardRole==='guardian'?id:'dark',name:id==='dark'?'Tinh binh Trăng Khuyết':'Binh đoàn Trăng Khuyết',label:id==='dark'?'Tinh binh Trăng Khuyết':'Binh đoàn Trăng Khuyết'};}
export const storyBossProfile=encounter=>encounter?.storyBoss?{...encounter,kind:'boss',village:encounter.guardianVillage}:encounter;
export function crescentEmblem(root){
  root.userData.faction='crescent';
  // Loaded ninja uniforms already have animated chest/back patches.
  if(root.userData.ninja?.faction==='crescent')return root;
  const existing=root.getObjectByName('crescent-legion-emblem');if(existing)return existing;
  const shape=new T.Shape();shape.absarc(0,0,.25,Math.PI/3,Math.PI*5/3,false);shape.quadraticCurveTo(-.15,0,.125,Math.sqrt(3)*.125);shape.closePath();
  const emblem=new T.Group();emblem.name='crescent-legion-emblem';root.add(emblem);
  const geometry=new T.ShapeGeometry(shape,24),material=new T.MeshStandardMaterial({color:'#ded9ed',roughness:.85,side:T.DoubleSide});
  for(const back of [false,true]){const patch=new T.Mesh(geometry,material);patch.position.set(0,1.86,back?-.33:.39);patch.scale.setScalar(back?1.25:1);emblem.add(patch);}
  return emblem;
}
export function buildOccupationBanners(c,gates,layout){
  const sites=[...gates.map(g=>({x:g.x,z:g.z})),layout.hall.entry,layout.military.insideGate];
  for(const p of sites){const root=c.group(p.x+3,p.z);root.name='crescent-occupation-banner';root.userData.noCollision=true;c.cyl(root,c.M('#453d41'),0,3.4,0,.1,6.8,7);c.box(root,c.M('#2c223e'),.9,5.3,0,1.7,2.5,.08);const moon=c.mesh(new T.TorusGeometry(.48,.09,5,20,Math.PI*1.5),c.M('#d7c390'),root,.9,5.3,.08);moon.rotation.z=.8;}
  if(islandCenterLocked(c.save,c.id)){const p=layout.hall.entry,seal=c.group(p.x,p.z);seal.name='crescent-center-seal';seal.userData.noCollision=true;seal.userData.dynamic=true;const material=new T.MeshBasicMaterial({color:'#a77cc9',transparent:true,opacity:.65,depthWrite:false});c.mesh(new T.TorusGeometry(2.7,.11,6,32),material,seal,0,3,0);for(let i=0;i<6;i++){const a=i*Math.PI/3;c.mesh(new T.OctahedronGeometry(.25),material,seal,Math.cos(a)*2.7,3+Math.sin(a)*2.7,0);}}
}
