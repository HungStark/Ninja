import * as T from 'three';
// Wide switchbacks keep the walking lane away from the trunk, roots and cottage.
export function buildTreeStairway(c,route,root){
 const points=[[18,route.fromY,14],[18,route.fromY+7.5,-7],[18,route.fromY+7.5,-10],[14,route.fromY+7.5,-10],[14,route.fromY+7.5,-7],[14,route.toY,3],[14,route.toY,6],[10,route.toY,6],[10,route.toY,3]].map(p=>new T.Vector3(...p)),width=3.4,path=[],distances=[0];let length=0;
 const wood=c.M('#927b55'),rail=c.M('#50432f');
 for(let j=0;j<points.length-1;j++){
  const a=points[j],b=points[j+1],dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz),nx=dz/d*width/2,nz=-dx/d*width/2,vertices=[];
  for(const p of [a,b])for(const bottom of [0,-.2])for(const side of [-1,1])vertices.push(p.x+side*nx,p.y+bottom,p.z+side*nz);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex([0,4,1,1,4,5,2,3,6,3,7,6,0,2,4,2,6,4,1,5,3,3,5,7,0,1,2,1,3,2,4,6,5,5,6,7]);geometry.computeVertexNormals();const deck=c.mesh(geometry,wood,root);deck.material.side=T.DoubleSide;deck.name='tree-stair-walkway';c.solidGeometry(deck,{name:'tree-stair-walkway'});
  c.reserveLane({a:[a.x,a.z],b:[b.x,b.z],width:5.6});
  const steps=Math.ceil(d/.48);for(let k=0;k<=steps;k++){const t=k/steps,p=a.clone().lerp(b,t);if(j===0||k>0){path.push(p);if(path.length>1){length+=p.distanceTo(path.at(-2));distances.push(length);}}
   const tread=c.box(root,c.M(k%2?'#a38c62':'#89734e'),p.x,p.y-.015,p.z,width,.055,.13);tread.rotation.y=Math.atan2(dx,dz);tread.userData.noCollision=true;
   for(const side of [-1,1])if(k%3===0&&t*d>2.2&&(1-t)*d>2.2){const x=p.x+side*nx*1.08,z=p.z+side*nz*1.08;c.solidMesh(c.box(root,rail,x,p.y+.65,z,.08,1.3,.08),{name:'tree-stair-side-post',stepable:false});}
  }
  if(d>5)for(const side of [-1,1]){const start=new T.Vector3(a.x+dx/d*2.2+side*nx*1.08,a.y+(b.y-a.y)*2.2/d+1.3,a.z+dz/d*2.2+side*nz*1.08),end=new T.Vector3(b.x-dx/d*2.2+side*nx*1.08,b.y-(b.y-a.y)*2.2/d+1.3,b.z-dz/d*2.2+side*nz*1.08),delta=end.clone().sub(start),beam=c.mesh(new T.CylinderGeometry(.055,.055,delta.length(),6),rail,root,...start.clone().add(end).multiplyScalar(.5).toArray());beam.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());beam.userData.noCollision=true;}
 }
 route.carved={path,distances,length,heightAt:(x,z)=>{let best=Infinity,height=route.fromY;for(let j=0;j<points.length-1;j++){const a=points[j],b=points[j+1],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz))),distance=Math.hypot(x-a.x-dx*t,z-a.z-dz*t);if(distance<best){best=distance;height=a.y+(b.y-a.y)*t;}}return height;}};
 // Fill the former spiral opening so the last flight joins a continuous deck.
 const landing=c.box(root,wood,9.3,route.toY-.16,3,3.4,.32,6);c.solidMesh(landing,{name:'tree-stair-landing'});route.platform.stairNotch=false;
}
