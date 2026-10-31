import * as T from 'three';
import {createGrassGeometry} from './grass.js';
import {withWind,windTime} from './materials.js';
import {village} from './adventure-data.js';

export function createVillageGrass({id,limit,heightAt,allowed,rand}){
  const root=new T.Group();root.name='village-grass';root.userData.noCollision=true;
  const ground=new T.Color(village(id).ground);
  const geometry=createGrassGeometry(ground.clone().multiplyScalar(.76),ground.clone().multiplyScalar(.95));
  const normals=geometry.attributes.normal;
  for(let i=0;i<normals.count;i++)normals.setXYZ(i,0,1,0);
  // Match both the terrain hue and its lighting; only the blade tips brighten a little.
  const material=withWind(new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide}),{upwardLighting:true});
  const dummy=new T.Object3D(),chunks=[],tile=28;
  const density=id==='wood'||id==='wind'?.8:id==='ice'?.38:.6;
  for(let x0=-limit;x0<limit;x0+=tile)for(let z0=-limit;z0<limit;z0+=tile){
    const width=Math.min(tile,limit-x0),depth=Math.min(tile,limit-z0);
    const matrices=[],tints=[];
    for(let k=0;k<Math.ceil(width*depth*density);k++){
      const x=x0+rand()*width,z=z0+rand()*depth;
      if(!allowed(x,z,.4))continue;
      const s=.65+rand()*.85;
      dummy.position.set(x-x0,heightAt(x,z)-.025,z-z0);
      dummy.rotation.set(0,rand()*Math.PI*2,0);
      dummy.scale.set(s,s*(id==='ice'?.7:1),s);dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());tints.push(.94+rand()*.1);
    }
    if(!matrices.length)continue;
    const mesh=new T.InstancedMesh(geometry,material,matrices.length);
    mesh.name='ground-grass';mesh.position.set(x0,0,z0);mesh.receiveShadow=true;
    mesh.userData.noCollision=true;
    matrices.forEach((matrix,i)=>{mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,new T.Color().setScalar(tints[i]));});
    mesh.computeBoundingSphere();
    // Include the small shader wind bend in the chunk's culling volume.
    mesh.boundingSphere.radius+=.3;
    root.add(mesh);chunks.push({mesh,total:matrices.length,x:x0+width/2,z:z0+depth/2});
  }
  if(!chunks.length){geometry.dispose();material.dispose();}
  return {root,update(camera,quality,time){
    windTime.value=time;
    const range=[90,70,48][quality]??70,fraction=[1,.8,.55][quality]??.8;
    for(const chunk of chunks){
      const distance=Math.hypot(camera.position.x-chunk.x,camera.position.z-chunk.z);
      chunk.mesh.visible=distance<range+tile*.71;
      const fade=1-T.MathUtils.smoothstep(distance,range*.55,range+tile*.71);
      chunk.mesh.count=Math.floor(chunk.total*fraction*fade);
    }
  }};
}
