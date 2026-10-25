import {GUARDIAN_FORMS} from './guardian-beasts.js';
import * as T from 'three';
import {village} from './adventure-data.js';
import {REGIONS} from './adventure-world.js';
import {buildBoss} from './adventure-landmarks.js';
import {toon} from './materials.js';

export function encounterAppearance(encounter){
  if(!encounter)return {kind:'duel',id:'duel',village:'nameless',coat:'#33495f',hair:'#182b3d'};
  const id=encounter.kind==='random'&&encounter.element?encounter.element:encounter.village,v=village(id);
  if(encounter.kind==='boss'&&encounter.guardianForm==='beast')return {kind:'creature',id,archetype:GUARDIAN_FORMS[id].shape,name:encounter.name,guardianForm:'beast'};
  if(encounter.kind==='boss')return {kind:'ninja',id:'guardian-'+id+'-'+(encounter.guardianForm||'human'),village:id,coat:v.color,hair:'#252833',name:encounter.name,guardianForm:encounter.guardianForm||'human'};
  return {kind:'ninja',id:encounter.kind+'-'+id,village:id,coat:v.color,hair:encounter.kind==='quest'&&id==='ice'?'#d0dfdf':encounter.kind==='quest'&&id==='light'?'#d4c59e':'#252833',name:encounter.name};
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
  const mouthPart=['dragon-open-mouth','animal-nose','faceless-orb','hooked-beak','deer-muzzle','tortoise-beak'].map(name=>root.getObjectByName(name)).find(Boolean),headPart=['dragon-skull','animal-head','faceless-orb','eagle-head','deer-head','tortoise-head'].map(name=>root.getObjectByName(name)).find(Boolean);
  const head=new T.Group();head.name='guardian-head-pivot';const headBase=headPart.position.clone();head.position.copy(headBase);headPart.parent.add(head);root.updateMatrixWorld(true);
  const headNames=/^(guardian-eye|animal-head|animal-muzzle|animal-nose|fierce-brow|pointed-ear|round-tiger-ear|faceless|spirit-horn|fox-.*antler|thunder-horn|dragon-(skull|jaw|open-mouth|antler|whisker|tooth)|eagle-head|hooked-beak|deer-(head|muzzle|ear)|branching-antler|antler-|tortoise-(head|beak))/;
  const parts=[];root.traverse(o=>{if(o.isMesh&&headNames.test(o.name))parts.push(o);});for(const part of parts)head.attach(part);
  root.updateMatrixWorld(true);const mouth=new T.Object3D();mouth.name='guardian-mouth-anchor';mouth.position.copy(head.worldToLocal(mouthPart.getWorldPosition(new T.Vector3())));mouth.position.z+=.55;head.add(mouth);
  const headWorldScale=new T.Vector3();
  function setArtPose(p={}){head.position.copy(headBase);head.position.z-=(p.headPull||0)/head.parent.getWorldScale(headWorldScale).z;head.rotation.x=p.headTilt||0;}
  return {root,height,form:GUARDIAN_FORMS[id],setArtPose,mouthPosition(p){if(p)setArtPose(p);root.updateWorldMatrix(true,true);return mouth.getWorldPosition(new T.Vector3());},update(time,moving=false,reducedMotion=false,velocity=0){
    body.position.y=baseY+(reducedMotion?0:Math.sin(time*(moving?9:2))*(moving?.07:.025)/scale);
    body.rotation.z=reducedMotion?0:-velocity*.012;
    for(const a of animated){if(a.kind==='halo')a.mesh.rotation.z=time*.2;if(a.kind==='pulse')a.mesh.scale.setScalar(1+Math.sin(time*4)*.08);}
  },dispose(){const geometries=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}};
}
