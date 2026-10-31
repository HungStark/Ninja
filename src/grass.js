import * as T from 'three';

// Shared five-blade silhouette for the arena and village ground cover.
export function createGrassGeometry(base='#527c57',tip='#bdd08a'){
  const geometry=new T.BufferGeometry(),positions=[],colors=[],uvs=[];
  const root=new T.Color(base),end=new T.Color(tip);
  for(let blade=0;blade<5;blade++){
    const angle=blade/5*Math.PI*2,height=.45+blade*.07;
    const dx=Math.cos(angle)*.18,dz=Math.sin(angle)*.18;
    for(const p of [[-.035,0,0],[.035,0,0],[dx,height,dz]]){
      positions.push(...p);colors.push(...(p[1]===0?root:end).toArray());
    }
    uvs.push(0,0,1,0,.5,1);
  }
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  // Small tufts beside ruins can join the existing static scenery batches.
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
  geometry.computeVertexNormals();return geometry;
}
