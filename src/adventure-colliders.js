import * as T from 'three';

const cross=(a,b,c)=>(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
function hull(points){
  const sorted=[...new Map(points.map(p=>[`${p.x.toFixed(5)},${p.z.toFixed(5)}`,p])).values()].sort((a,b)=>a.x-b.x||a.z-b.z),lower=[],upper=[];
  for(const p of sorted){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}
  for(const p of sorted.reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}return lower.slice(0,-1).concat(upper.slice(0,-1));
}

// Convex scenery keeps its actual faceted top: a rock is not an invisible tall
// rectangle, and a tilted board supplies the same slope that the renderer shows.
export function colliderFromGeometry(geometry,matrix,name){
  geometry.computeBoundingBox();const local=geometry.boundingBox.getSize(new T.Vector3()),scale=new T.Vector3().setFromMatrixScale(matrix),dimensions=[local.x*scale.x,local.y*scale.y,local.z*scale.z].sort((a,b)=>a-b);if(dimensions[2]<.7||dimensions[1]<.12||dimensions[0]*dimensions[1]*dimensions[2]<.025)return null;
  const attr=geometry.attributes.position,vertices=[];for(let i=0;i<attr.count;i++)vertices.push(new T.Vector3().fromBufferAttribute(attr,i).applyMatrix4(matrix));
  const bounds=new T.Box3().setFromPoints(vertices),size=bounds.getSize(new T.Vector3()),dims=[size.x,size.y,size.z].sort((a,b)=>a-b);if(dims[2]<.7||dims[1]<.12||size.x*size.y*size.z<.025)return null;
  const polygon=hull(vertices);if(polygon.length<3)return null;const triangles=[],index=geometry.index,total=index?.count??vertices.length;
  for(let i=0;i<total;i+=3){const a=vertices[index?index.getX(i):i],b=vertices[index?index.getX(i+1):i+1],c=vertices[index?index.getX(i+2):i+2],den=cross(a,b,c);if(Math.abs(den)>1e-8)triangles.push({a,b,c,den});}
  let lastX=NaN,lastZ=NaN,last;
  const sample=(x,z)=>{
    if(x===lastX&&z===lastZ)return last;lastX=x;lastZ=z;let point={x,z},inside=true,best=Infinity,closest;
    for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length];if(cross(a,b,point)<-1e-7)inside=false;const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz))),p={x:a.x+t*dx,z:a.z+t*dz},d=(x-p.x)**2+(z-p.z)**2;if(d<best){best=d;closest=p;}}
    if(!inside)point=closest;let bottom=Infinity,top=-Infinity;
    for(const {a,b,c,den} of triangles){const u=cross(point,b,c)/den,v=cross(a,point,c)/den,w=1-u-v;if(u>=-1e-6&&v>=-1e-6&&w>=-1e-6){const y=a.y*u+b.y*v+c.y*w;bottom=Math.min(bottom,y);top=Math.max(top,y);}}
    if(!Number.isFinite(top)){bottom=bounds.min.y;top=bounds.max.y;}else if(top-bottom<1e-5)bottom=bounds.min.y;
    return last={bottom,top};
  };
  return {name,x:(bounds.min.x+bounds.max.x)/2,z:(bounds.min.z+bounds.max.z)/2,w:size.x,d:size.z,yaw:0,bottom:bounds.min.y,top:bounds.max.y,polygon,topAt:(x,z)=>sample(x,z).top,bottomAt:(x,z)=>sample(x,z).bottom};
}

export function registerSceneryColliders(root,physics,{moving=[],leafColors=[],limit=140}={}){
  const excluded=new Set(moving),leaves=new Set(leafColors.map(c=>new T.Color(c).getHexString())),supported=new Set(['BoxGeometry','CylinderGeometry','ConeGeometry','DodecahedronGeometry','IcosahedronGeometry','OctahedronGeometry','SphereGeometry']),instance=new T.Matrix4(),matrix=new T.Matrix4();let count=0;
  root.updateMatrixWorld(true);
  root.traverse(o=>{
    if(!o.isMesh||!o.visible||o.userData.collider||o.userData.noCollision||!supported.has(o.geometry.type)||Array.isArray(o.material)||o.material.transparent||o.material.side===T.BackSide)return;
    for(let p=o;p&&p!==root;p=p.parent)if(excluded.has(p)||p.userData.noCollision)return;
    if(leaves.has(o.material.color?.getHexString())||['vegetation-crowns','ground-grass','river-gravel','river-reeds','distant-backdrop'].includes(o.name))return;
    for(let i=0;i<(o.isInstancedMesh?o.count:1);i++){
      if(o.isInstancedMesh){o.getMatrixAt(i,instance);matrix.multiplyMatrices(o.matrixWorld,instance);}else matrix.copy(o.matrixWorld);
      if(Math.abs(matrix.elements[12])>limit+3||Math.abs(matrix.elements[14])>limit+3)continue;
      const collider=colliderFromGeometry(o.geometry,matrix,o.name||o.parent?.name||'solid-scenery');if(collider){physics.addBox(collider);count++;}
    }
  });return count;
}
