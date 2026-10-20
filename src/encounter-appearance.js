import * as T from 'three';
import {village} from './adventure-data.js';
import {REGIONS} from './adventure-world.js';
import {buildBoss} from './adventure-landmarks.js';
import {toon} from './materials.js';

export function encounterAppearance(encounter){
  if(!encounter)return {kind:'duel',id:'duel',village:'nameless',coat:'#33495f',hair:'#182b3d'};
  const id=encounter.village,v=village(id);
  if(encounter.kind==='boss')return {kind:'creature',id,archetype:['water','fire'].includes(id)?'dragon':id==='lightning'?'bird':['wind','ice'].includes(id)?'beast':id==='dark'?'wraith':'golem',name:encounter.name};
  return {kind:'ninja',id:encounter.kind+'-'+id,village:id,coat:encounter.kind==='quest'?v.color:'#754f4a',hair:encounter.kind==='quest'&&id==='ice'?'#d0dfdf':encounter.kind==='quest'&&id==='light'?'#d4c59e':'#252833',name:encounter.name};
}

// Both exploration and combat build their guardians from the same silhouette.
export function createEncounterCreature(id){
  const root=new T.Group(),animated=[],materials=new Set();
  const M=(color,glow=0)=>{const m=toon(color,{emissive:color,emissiveIntensity:glow*.2});materials.add(m);return m;};
  const mesh=(geometry,material,parent,x=0,y=0,z=0)=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const c={id,v:village(id),animated,M,mesh,group:()=>root,
    box:(p,m,x,y,z,w,h,d)=>mesh(new T.BoxGeometry(w,h,d),m,p,x,y,z),
    cyl:(p,m,x,y,z,r,h,n=8)=>mesh(new T.CylinderGeometry(r,r,h,n),m,p,x,y,z)};
  const {body}=buildBoss(c,REGIONS[id].boss);
  // The exploration arena ring is not part of the combat creature.
  for(const child of [...root.children])if(child!==body){child.geometry?.dispose();root.remove(child);}
  const bounds=new T.Box3().setFromObject(body),size=bounds.getSize(new T.Vector3());
  const scale=Math.min(4.4/size.y,6/size.x,6/size.z);root.scale.setScalar(scale);body.position.y=-bounds.min.y;
  const height=size.y*scale,baseY=body.position.y;
  return {root,height,update(time,moving=false,reducedMotion=false,velocity=0){
    body.position.y=baseY+(reducedMotion?0:Math.sin(time*(moving?9:2))*(moving?.07:.025)/scale);
    body.rotation.z=reducedMotion?0:-velocity*.012;
    for(const a of animated){if(a.kind==='halo')a.mesh.rotation.z=time*.2;if(a.kind==='pulse')a.mesh.scale.setScalar(1+Math.sin(time*4)*.08);}
  },dispose(){const geometries=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}};
}
