import * as T from 'three';

// Pack visible spatial cells into the same draw call. Only static, opaque,
// non-shadow-casting decoration is eligible; off-screen shadow casters stay intact.
export function createStaticInstanceCuller(mesh,{cellSize=24}={}){
  if(!mesh.isInstancedMesh||mesh.castShadow||mesh.instanceColor||mesh.material.transparent)throw new Error('Static culling requires opaque uncolored instances without shadows');
  const source=mesh.instanceMatrix.array,total=mesh.count,groups=new Map(),matrix=new T.Matrix4(),sphere=new T.Sphere(),point=new T.Vector3();
  if(!mesh.geometry.boundingSphere)mesh.geometry.computeBoundingSphere();
  mesh.computeBoundingSphere();
  for(let i=0;i<total;i++){
    matrix.fromArray(source,i*16);sphere.copy(mesh.geometry.boundingSphere).applyMatrix4(matrix);
    const key=Math.floor(matrix.elements[12]/cellSize)+','+Math.floor(matrix.elements[14]/cellSize);
    if(!groups.has(key))groups.set(key,{indices:[],bounds:new T.Box3()});const group=groups.get(key);group.indices.push(i);
    group.bounds.expandByPoint(point.copy(sphere.center).addScalar(sphere.radius));group.bounds.expandByPoint(point.copy(sphere.center).addScalar(-sphere.radius));
  }
  const cells=[...groups.values()].map(group=>{const matrices=new Float32Array(group.indices.length*16);group.indices.forEach((i,j)=>matrices.set(source.subarray(i*16,i*16+16),j*16));return {bounds:group.bounds,matrices};});
  const clip=new T.Matrix4(),frustum=new T.Frustum();let previous=[],visible=[],uploads=0,initialized=false;
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  return {
    update(camera){
      camera.updateMatrixWorld();mesh.updateWorldMatrix(true,false);
      clip.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse).multiply(mesh.matrixWorld);frustum.setFromProjectionMatrix(clip);
      visible.length=0;let changed=!initialized;
      for(const cell of cells)if(frustum.intersectsBox(cell.bounds)){if(previous[visible.length]!==cell)changed=true;visible.push(cell);}
      if(previous.length!==visible.length)changed=true;
      if(changed){let offset=0;for(const cell of visible){mesh.instanceMatrix.array.set(cell.matrices,offset);offset+=cell.matrices.length;}mesh.count=offset/16;mesh.instanceMatrix.needsUpdate=true;uploads++;initialized=true;}
      const swap=previous;previous=visible;visible=swap;
    },
    state:()=>({total,visible:mesh.count,cells:cells.length,uploads})
  };
}
