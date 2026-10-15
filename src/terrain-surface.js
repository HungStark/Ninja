import * as T from 'three';

// Fine cells in the duel area, coarse cells beyond it, with the original UVs.
export function createTerrainGrid(){
  const xs=[-50,-35,-20],zs=[-60,-40,-26];
  for(let x=-15;x<=15;x+=.5)xs.push(x);
  for(let z=-20;z<=40;z+=.5)zs.push(z);
  xs.push(20,35,50);zs.push(50,60);
  const vertices=[],uvs=[],indices=[],width=xs.length;
  for(const z of zs)for(const x of xs){
    const y=Math.abs(x)<15?-.07:Math.sin(x*.21+z*.1)*.35+Math.sin(z*.16)*.22-.2;
    vertices.push(x,y,z);uvs.push((x+50)/100,(60-z)/120);
  }
  for(let z=0;z<zs.length-1;z++)for(let x=0;x<width-1;x++){
    const a=z*width+x,b=a+1,c=a+width,d=c+1;indices.push(a,c,b,b,c,d);
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}

export class TerrainSurface {
  constructor(meshes,instances=[],props=[]){
    this.revision=-1;this.changedVertices=0;
    const v=new T.Vector3();
    this.meshes=meshes.map(mesh=>{
      mesh.updateMatrixWorld(true);const p=mesh.geometry.attributes.position,base=p.array.slice(),xz=new Float32Array(p.count*2);
      for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);xz[i*2]=v.x;xz[i*2+1]=v.z;}
      return {mesh,base,xz};
    });
    this.instances=instances.map(mesh=>({mesh,base:mesh.instanceMatrix.array.slice()}));
    this.props=props.map(mesh=>({mesh,y:mesh.position.y,x:mesh.position.x,z:mesh.position.z}));
  }
  deform(heightAt,revision){
    if(revision===this.revision)return;this.revision=revision;this.changedVertices=0;
    for(const {mesh,base,xz} of this.meshes){
      const p=mesh.geometry.attributes.position;let changed=false;
      for(let i=0;i<p.count;i++){
        const height=heightAt(xz[i*2],xz[i*2+1]),y=base[i*3+1]+height;
        if(Math.abs(p.getY(i)-y)>.0001){p.setY(i,y);changed=true;}
        if(Math.abs(height)>.01)this.changedVertices++;
      }
      if(changed){p.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingSphere();}
    }
    for(const {mesh,base} of this.instances){
      const matrix=mesh.instanceMatrix.array;
      for(let i=0;i<mesh.count;i++){
        const k=i*16,height=heightAt(base[k+12],base[k+14]),visible=height<-.9?0:1;
        for(const offset of [0,1,2,4,5,6,8,9,10])matrix[k+offset]=base[k+offset]*visible;
        matrix[k+13]=base[k+13]+height;
      }
      mesh.instanceMatrix.needsUpdate=true;
    }
    for(const p of this.props)p.mesh.position.y=p.y+heightAt(p.x,p.z);
  }
}
