import * as T from 'three';
import {createGrassGeometry} from './grass.js';
import {withWind,windTime} from './materials.js';
import {village} from './adventure-data.js';

export function createVillageGrass({id,limit,heightAt,allowed,rand}){
  const root=new T.Group();root.name='village-grass';root.userData.noCollision=true;
  const ground=new T.Color(village(id).ground);
  const tips={wood:'#7da751',water:'#89b8a1',wind:'#b0c47b',fire:'#b6a079',earth:'#b5a078',lightning:'#9b91af',dark:'#8b79a1',nameless:'#aba778',ice:'#d4e1df',light:'#d5c78d'};
  const geometry=createGrassGeometry(ground.clone().multiplyScalar(.68),ground.clone().lerp(new T.Color(tips[id]),.32));
  const normals=geometry.attributes.normal;
  for(let i=0;i<normals.count;i++){const n=new T.Vector3(normals.getX(i)*.2,1,normals.getZ(i)*.2).normalize();normals.setXYZ(i,n.x,n.y,n.z);}
  // Match both the terrain hue and its lighting; only the blade tips brighten a little.
  const material=withWind(new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide}),{upwardLighting:true});
  const dummy=new T.Object3D(),chunks=[],tile=28;
  const density=id==='wood'?1.15:id==='wind'?.9:id==='ice'?.3:.72;
  for(let x0=-limit;x0<limit;x0+=tile)for(let z0=-limit;z0<limit;z0+=tile){
    const width=Math.min(tile,limit-x0),depth=Math.min(tile,limit-z0);
    const matrices=[],tints=[];
    for(let k=0;k<Math.ceil(width*depth*density);k++){
      const x=x0+rand()*width,z=z0+rand()*depth;
      if(!allowed(x,z,.4))continue;
      // Broad patches interspersed with small tufts, retaining each biome's hue.
      const patch=.5+.5*Math.sin(x*.18+Math.sin(z*.12)*2)*Math.cos(z*.21);
      const s=.48+rand()*.6+patch*.45;
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
