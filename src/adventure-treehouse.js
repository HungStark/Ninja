import * as T from 'three';

export function buildTreeHouse(c,route){
  const {box,cyl,mesh,M,land}=c,p=route.platform,y=route.toY,root=new T.Group();root.name='central-tree-house';land.add(root);
  const wood=M('#61503a'),edge=M('#443c2d'),planks=[M('#8c7958'),M('#9b8661'),M('#82704f')],bark=M('#655039'),plaster=M('#c9bb8f'),roof=M('#344634');
  const beam=(a,b,r=.13,material=wood)=>{const start=new T.Vector3(...a),end=new T.Vector3(...b),d=end.clone().sub(start),o=mesh(new T.CylinderGeometry(r*.8,r,d.length(),6),material,root,...start.clone().add(end).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;};
  const trunkGeo=new T.CylinderGeometry(.7,3.25,38,9,7),vertices=trunkGeo.attributes.position;
  for(let k=0;k<vertices.count;k++){const h=vertices.getY(k)+19;vertices.setX(k,vertices.getX(k)+Math.sin(h*.07)*.8);vertices.setZ(k,vertices.getZ(k)+Math.sin(h*.09)*.45);}trunkGeo.computeVertexNormals();mesh(trunkGeo,bark,root,p.x,19,p.z).name='ancient-tree-trunk';
  for(let k=0;k<7;k++){const a=k*2.4;beam([p.x,2,p.z],[p.x+Math.sin(a)*4,.1,p.z+Math.cos(a)*4],.72,bark);}
  for(let k=0;k<7;k++){const a=k*2.4,ex=p.x+Math.sin(a)*(7+k%2*2),ez=p.z+Math.cos(a)*(6+k%3),ey=27+k%3*2;beam([p.x,23+k*.4,p.z],[ex,ey,ez],.85,bark);beam([ex,ey,ez],[ex+Math.cos(a)*3,ey+4,ez-Math.sin(a)*2],.38,bark);
    const crown=mesh(new T.IcosahedronGeometry(1,1),M(['#315d35','#3e6b36','#47733b'][k%3]),root,ex,ey+3.8,ez);crown.scale.set(6.5,5.4,6);crown.userData.noCollision=true;
  }
  for(const [dx,h,dz] of [[-8,23,-3],[8,24,-4],[3,25,-9]]){const leaves=mesh(new T.IcosahedronGeometry(1,1),M('#3e6b36'),root,p.x+dx,h,p.z+dz);leaves.scale.set(3.6,2.8,3.5);leaves.userData.noCollision=true;}
  const top=mesh(new T.IcosahedronGeometry(1,1),M('#345f33'),root,p.x+.4,36,p.z);top.scale.set(8,6,7.5);top.userData.noCollision=true;
  // Planked deck wraps the trunk. The open corner gives the stair flight room
  // to emerge without passing the character through a ceiling of floorboards.
  p.customLayout=true;p.obstacles=[{x:p.x,z:p.z,r:2.55}];p.stairNotch=true;
  for(let j=0;j<24;j++){const x=-5.75+j*.5,hole=Math.sqrt(Math.max(0,2.45**2-x*x)),front=x>2.4?1.5:6;
    if(front>hole)box(root,planks[j%3],p.x+x,y-.16,p.z+(hole+front)/2,.48,.32,front-hole);
    box(root,planks[(j+1)%3],p.x+x,y-.16,p.z-(hole+6)/2,.48,.32,6-hole);
  }
  for(const side of [-1,1])for(const z of [-5.7,0,5.7]){if(side===1&&z>1)continue;beam([p.x+side*2.1,y-5,p.z],[p.x+side*5.6,y-.35,p.z+z],.28);}
  box(root,edge,p.x,y-.42,p.z-5.8,12,.42,.3);box(root,edge,p.x-1.8,y-.42,p.z+5.8,8.4,.42,.3);
  const rail=(a,b)=>{beam([a[0],y+1.3,a[1]],[b[0],y+1.3,b[1]],.07);beam([a[0],y+.65,a[1]],[b[0],y+.65,b[1]],.055);const count=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/1.8);for(let k=0;k<=count;k++){const t=k/count;cyl(root,wood,a[0]+(b[0]-a[0])*t,y+.65,a[1]+(b[1]-a[1])*t,.09,1.45,6);}};
  rail([p.x-5.85,p.z-5.85],[p.x+5.85,p.z-5.85]);rail([p.x-5.85,p.z-5.85],[p.x-5.85,p.z+5.85]);rail([p.x-5.85,p.z+5.85],[p.x+2.35,p.z+5.85]);rail([p.x+5.85,p.z-5.85],[p.x+5.85,p.z+1.5]);rail([p.x+2.35,p.z+5.85],[p.x+2.35,p.z+4.2]);
  box(root,wood,p.x+3.2,y-.13,p.z+3,2.5,.26,1.6);

  const hx=p.x-4,hz=p.z-1.4,w=3.6,d=3.4,eave=y+3.25,half=w/2+.4,rise=1.2;
  const cottageStart=root.children.length;
  box(root,plaster,hx,y+1.6,hz,w,3.2,d);
  for(const sx of [-1,1])for(const sz of [-1,1])box(root,wood,hx+sx*w/2,y+1.7,hz+sz*d/2,.16,3.45,.16);
  for(const side of [-1,1]){const panel=box(root,roof,hx+side*half/2,eave+rise/2,hz,Math.hypot(half,rise)+.05,.22,d+1);panel.rotation.z=-side*Math.atan2(rise,half);}
  const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(0,rise);shape.closePath();mesh(new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false}),plaster,root,hx,eave,hz-d/2);
  box(root,edge,hx,y+1.26,hz+d/2+.04,.95,2.52,.08);for(const side of [-1,1])box(root,wood,hx+side*.53,y+1.32,hz+d/2+.1,.12,2.7,.16);box(root,wood,hx,y+2.7,hz+d/2+.1,1.2,.14,.17);
  for(const sx of [-1,1]){box(root,wood,hx+sx*1.25,y+1.9,hz+d/2+.06,.7,.9,.1);box(root,M('#e8c887',.35),hx+sx*1.25,y+1.9,hz+d/2+.12,.53,.7,.04);box(root,wood,hx+sx*1.25,y+1.9,hz+d/2+.15,.05,.73,.04);}
  const cottageParts=root.children.slice(cottageStart),cottage=new T.Group();cottage.name='tree-house-cottage';cottage.position.set(hx,y,hz);cottage.scale.y=1.45;cottage.userData.doorHeight=2.52*1.45;root.add(cottage);for(const part of cottageParts){part.position.sub(new T.Vector3(hx,y,hz));cottage.add(part);}
  // Two complete turns of wooden stairs, with actual treads and handrails.
  const count=60;let last=[null,null];
  for(let j=0;j<=count;j++){const t=j/count,a=route.spiral.angle+t*route.spiral.turns*Math.PI*2,x=p.x+Math.sin(a)*5,z=p.z+Math.cos(a)*5,h=route.fromY+(y-route.fromY)*t;
    const tread=box(root,planks[j%3],x,h-.1+(j===0?.015:0),z,2.05,.2,1.19);tread.rotation.y=a-Math.PI/2;
    if(j%3===0)beam([p.x+Math.sin(a)*2.5,h-1.1,p.z+Math.cos(a)*2.5],[x,h-.24,z],.12);
    for(let side=0;side<2;side++){if(side===0&&j>=count-4)continue;const r=side===0?4.02:5.98,point=new T.Vector3(p.x+Math.sin(a)*r,h+1.25,p.z+Math.cos(a)*r);if(j%2===0)c.solidMesh(cyl(root,wood,point.x,h+.57,point.z,.065,1.35,5),{name:'tree-stair-post'});if(last[side])c.solidMesh(beam(last[side].toArray(),point.toArray(),.045),{name:'tree-stair-railing'});last[side]=point;}
  }
  for(const [x,z] of [[p.x-5.7,p.z+5.7],[p.x+2.3,p.z+5.7],[p.x+5.7,p.z-5.7],[hx-1.35,hz+1.95]]){cyl(root,edge,x,y+1.6,z,.065,3.2,6);c.solidMesh(box(root,M('#ead28f',.8),x,y+3.08,z,.26,.44,.26),{name:'tree-house-lantern',stepable:false});for(const s of [-1,1])box(root,wood,x+s*.17,y+3.08,z,.035,.52,.32);c.solidMesh(box(root,wood,x,y+3.36,z,.42,.1,.42),{name:'tree-house-lantern-cap',stepable:false});const light=new T.PointLight('#ffd294',1.1,8,2);light.position.set(x,y+3.05,z);root.add(light);}
  for(let k=0;k<22;k++){const a=k*2.4,x=p.x+2.6+Math.sin(a)*.35,z=p.z-1+Math.cos(a)*.4,leaf=mesh(new T.IcosahedronGeometry(.3,0),M(k%2?'#416d3f':'#557a43'),root,x,y+2.9-k*.17,z);leaf.scale.set(1.3,.65,.8);leaf.userData.noCollision=true;}
  return root;
}
