import * as T from 'three';
import firstFive from '../assets/guardians/reference-guardians.json' with {type:'json'};
import lastFive from '../assets/guardians/later-guardians.json' with {type:'json'};
import {sculptedSurface} from './fantasy-scenery.js';

const assets={...firstFive,...lastFive};
export const REFERENCE_GUARDIANS=Object.freeze(Object.keys(assets));
function bytes(encoded){return Uint8Array.from(atob(encoded),ch=>ch.charCodeAt(0));}
function geometry(data,pivot){
 const raw=bytes(data.p),packed=new Int16Array(raw.buffer),p=new Float32Array(packed.length);
 for(let i=0;i<p.length;i++)p[i]=packed[i]/2048-pivot[i%3];
 const nb=bytes(data.n),ni=new Int8Array(nb.buffer),n=new Float32Array(ni.length);
 for(let i=0;i<n.length;i+=3){const length=Math.hypot(ni[i],ni[i+1],ni[i+2])||1;for(let j=0;j<3;j++)n[i+j]=ni[i+j]/length;}
 const ib=bytes(data.i),g=new T.BufferGeometry();
 g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('normal',new T.BufferAttribute(n,3));
 g.setAttribute('color',new T.Uint8BufferAttribute(bytes(data.c),3,true));
 g.setIndex(new T.BufferAttribute(new Uint16Array(ib.buffer),1));
 if(data.flow)g.setAttribute('guardianFlow',new T.Uint8BufferAttribute(bytes(data.flow),1,true));
 g.computeBoundingSphere();if(data.flow)g.boundingSphere.radius+=1.2;return g;
}
function surface(kind,id){
 const colors={fire:'#ff8e27',nameless:'#ffe0a4',water:'#5ce5ff',lightning:'#bd80ff',wind:'#83efd4',
  earth:'#ffaf45',wood:'#c3fa72',ice:'#55c6ff',light:'#ffcf63',dark:'#ae63f7'};
 if(kind==='eyes'&&id!=='dark')return new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide});
 const transparent=kind==='water'||kind==='spirit',glow=kind==='glow'||kind==='crystal';
 const crystal=kind==='crystal',darkEyes=kind==='eyes';
 const m=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,
  roughness:kind==='metal'?.38:transparent||crystal?.2:.85,metalness:kind==='metal'?.28:.02,
  flatShading:crystal||kind==='rock',transparent,
  opacity:kind==='water'?.48:kind==='spirit'?(id==='dark'?.5:.25):1,depthWrite:!transparent,
  emissive:darkEyes?'#6affed':glow?colors[id]:'#000000',emissiveIntensity:darkEyes?.25:crystal?.21:glow?.48:0});
 m.name=id+'-guardian-'+kind;return sculptedSurface(m,{rim:.045});
}

export function buildReferenceGuardian(c,form){
 const asset=assets[c.id];if(!asset)return null;
 const root=new T.Group(),groups={},materials=[],flowMeshes=[];root.name='guardian-'+form.shape;
 root.userData.guardian={...form,village:c.id,referenceModel:true,version:asset.version};
 for(const [name,part] of Object.entries(asset.parts)){
  const group=new T.Group();group.name='guardian-joint-'+name;groups[name]=group;
  group.position.fromArray(part.pivot);if(part.parent)group.position.sub(new T.Vector3(...asset.parts[part.parent].pivot));
  (part.parent?groups[part.parent]:root).add(group);
 }
 for(const data of asset.meshes){
  const mat=surface(data.kind,c.id);materials.push(mat);
  const object=c.mesh(geometry(data,asset.parts[data.part].pivot),mat,groups[data.part]);
  object.name=data.name;object.userData.guardianPart=data.part;
  if(c.id==='dark'&&data.part==='head'&&data.kind==='eyes')object.name='guardian-eye';
  object.castShadow=!mat.transparent&&data.kind!=='glow'&&data.kind!=='eyes';object.receiveShadow=!mat.transparent;
  if(data.flow)flowMeshes.push(object);
 }
 const head=groups.head,mouth=new T.Object3D(),headAnchor=new T.Object3D();
 const bird=c.id==='wind'||c.id==='light';
 headAnchor.name=c.id==='water'?'dragon-skull':bird?'eagle-head':c.id==='earth'?'tortoise-head':c.id==='wood'?'deer-head':'animal-head';head.add(headAnchor);
 mouth.name=c.id==='water'?'dragon-open-mouth':bird?'hooked-beak':c.id==='earth'?'tortoise-beak':c.id==='wood'?'deer-muzzle':'animal-nose';
 mouth.position.fromArray(asset.mouth).sub(new T.Vector3(...asset.parts.head.pivot));head.add(mouth);
 // References stay outside userData so scene serialization remains acyclic.
 root.referenceRig={groups,head,mouth,materials,flowMeshes,id:c.id};
 return root;
}
