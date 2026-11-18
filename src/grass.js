import * as T from 'three';

// Curved, folded blades catch light along their midrib. Six triangles per
// blade remain inexpensive when instanced over a whole village.
export function createGrassGeometry(base='#527c57',tip='#bdd08a'){
  const geometry=new T.BufferGeometry(),positions=[],colors=[],uvs=[];
  const root=new T.Color(base),end=new T.Color(tip);
  for(let blade=0;blade<7;blade++){
    const angle=blade*2.39996,height=.36+(blade%4)*.105,width=.026+(blade%3)*.009;
    const forward=new T.Vector3(Math.sin(angle),0,Math.cos(angle)),side=new T.Vector3(Math.cos(angle),0,-Math.sin(angle));
    const rows=[0,.58,1],vertices=[];
    for(const t of rows){
      const center=forward.clone().multiplyScalar(t*t*(.16+blade*.009));center.y=height*t;
      for(const k of [-1,0,1])vertices.push(center.clone().addScaledVector(side,k*width*(1-t)).addScaledVector(forward,k===0?-.012*Math.sin(t*Math.PI):0));
    }
    const triangle=(a,b,c)=>{for(const index of [a,b,c]){const p=vertices[index],t=rows[Math.floor(index/3)],color=root.clone().lerp(end,t);positions.push(...p.toArray());colors.push(...color.toArray());uvs.push((index%3)/2,t);}};
    for(let k=0;k<2;k++){const a=k,b=a+3;triangle(a,b,a+1);triangle(a+1,b,b+1);}
    triangle(3,6,4);triangle(4,6,5);
  }
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  // Small tufts beside ruins can join the existing static scenery batches.
  geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
  geometry.computeVertexNormals();return geometry;
}
