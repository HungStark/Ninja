import * as T from 'three';

// Only opaque surfaces enter this batch. Transparent spell layers retain their
// authored draw order, opacity and blending.
export class OpaqueInstanceBatch {
  constructor(scene,geometry,material){this.scene=scene;this.geometry=geometry;this.material=material;this.mesh=null;this.capacity=0;}
  begin(count){
    if(!count){if(this.mesh){this.mesh.count=0;this.mesh.visible=false;}return;}
    if(count>this.capacity){
      this.dispose();this.capacity=16;while(this.capacity<count)this.capacity*=2;
      this.mesh=new T.InstancedMesh(this.geometry,this.material,this.capacity);this.mesh.name='fire-orb-core-batch';this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.scene.add(this.mesh);
    }
    this.mesh.count=count;this.mesh.visible=true;
  }
  set(index,matrix){this.mesh.setMatrixAt(index,matrix);}
  finish(){if(this.mesh?.visible){this.mesh.instanceMatrix.needsUpdate=true;this.mesh.computeBoundingSphere();}}
  dispose(){if(this.mesh){this.mesh.removeFromParent();this.mesh.dispose();}this.mesh=null;this.capacity=0;}
  state(){return {count:this.mesh?.count||0,capacity:this.capacity};}
}
