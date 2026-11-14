import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Keep original vertices/materials. Each cell gets its own conservative bounds,
// so the camera and shadow frusta can skip cells without dropping visible detail.
export function splitTerrainForCulling(mesh,cellSize=96){
  const source=mesh.geometry,index=source.index,position=source.attributes.position,cells=new Map(),point=new T.Vector3();
  if(!index)return 0;
  for(let i=0;i<index.count;i+=3){
    const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2),x=(position.getX(a)+position.getX(b)+position.getX(c))/3,z=(position.getZ(a)+position.getZ(b)+position.getZ(c))/3,key=Math.floor(x/cellSize)+','+Math.floor(z/cellSize);
    if(!cells.has(key))cells.set(key,[]);cells.get(key).push(a,b,c);
  }
  // A mesh's layer mask does not hide its children. Preserve the original mesh
  // for terrain queries/tools, but render only its exact indexed cell children.
  mesh.layers.mask=0;
  for(const [key,indices] of cells){
    const geometry=new T.BufferGeometry();for(const [name,attribute] of Object.entries(source.attributes))geometry.setAttribute(name,attribute);
    geometry.setIndex(indices);geometry.boundingBox=new T.Box3();
    for(const i of indices)geometry.boundingBox.expandByPoint(point.fromBufferAttribute(position,i));
    geometry.boundingSphere=geometry.boundingBox.getBoundingSphere(new T.Sphere());
    const chunk=new T.Mesh(geometry,mesh.material);chunk.name='terrain-cell-'+key;chunk.castShadow=mesh.castShadow;chunk.receiveShadow=mesh.receiveShadow;chunk.userData.terrainChunk=true;mesh.add(chunk);
  }
  return cells.size;
}

export function batchStaticScenery(land,{moving=new Set(),terrain,cellSize=96}={}){
  const batches=new Map(),bounds=new T.Box3(),center=new T.Vector3();land.updateMatrixWorld(true);
  land.traverse(object=>{
    if(!object.isMesh||!object.visible||object.isInstancedMesh||object===terrain||Array.isArray(object.material)||!object.geometry.attributes.uv)return;
    for(let parent=object;parent&&parent!==land;parent=parent.parent)if(parent===terrain||moving.has(parent)||parent.userData.dynamic)return;
    const key=object.material.uuid;if(!batches.has(key))batches.set(key,{material:object.material,objects:[]});batches.get(key).objects.push(object);
  });
  let groups=0,sourceMeshes=0;
  for(const {material,objects} of batches.values()){
    if(objects.length<2)continue;
    // Transparent order is authored; retain its original global grouping.
    const cells=new Map(),totalTriangles=objects.reduce((sum,o)=>sum+(o.geometry.index?.count||o.geometry.attributes.position.count)/3,0);
    for(const object of objects){
      let key='all';
      if(!material.transparent&&totalTriangles>=30000){if(!object.geometry.boundingBox)object.geometry.computeBoundingBox();bounds.copy(object.geometry.boundingBox).applyMatrix4(object.matrixWorld);bounds.getCenter(center);key=Math.floor(center.x/cellSize)+','+Math.floor(center.z/cellSize);}
      if(!cells.has(key))cells.set(key,[]);cells.get(key).push(object);
    }
    for(const [key,parts] of cells){
      const geometries=parts.map(object=>{const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();geometry.applyMatrix4(object.matrixWorld);return geometry;});
      const geometry=mergeGeometries(geometries,false);for(const temporary of geometries)temporary.dispose();if(!geometry)continue;
      for(const object of parts){object.parent.remove(object);object.geometry.dispose();}
      geometry.computeBoundingBox();geometry.computeBoundingSphere();
      const mesh=new T.Mesh(geometry,material);mesh.name='scenery-cell-'+key;mesh.castShadow=true;mesh.receiveShadow=true;land.add(mesh);groups++;sourceMeshes+=parts.length;
    }
  }
  return {groups,sourceMeshes};
}
