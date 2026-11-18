import * as T from 'three';

// Attack volumes use layer 0, independently of optional ground prediction guides.
// Reuse a bounded pool so multi-hit ultimates do not allocate every frame.
export function createGuardianStrikeVfx({root,part,geo,surface,glow,element}){
 const capacity=40,pool=[],active=[],arcs=new Map();let clock=0,serial=0;
 const ringRotation=-Math.PI/2;
 function sectorGeometry(arc){
  const key=arc.toFixed(4);if(arcs.has(key))return arcs.get(key);
  const vertices=[],indices=[],segments=40;
  for(let i=0;i<=segments;i++){const a=-arc/2+arc*i/segments;for(const r of [.82,1])vertices.push(Math.sin(a)*r,0,Math.cos(a)*r);if(i<segments){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();arcs.set(key,geometry);return geometry;
 }
 function release(e){e.root.removeFromParent();e.root.visible=false;e.root.clear();pool.push(e.root);}
 function clear(){for(const e of active)release(e);active.length=0;clock=0;serial=0;}
 function create(shape,{source='guardian',castId=0,life=.55}={}){
  const radius=Math.max(.08,shape.radius||.5);if(active.length>=capacity)release(active.shift());
  const group=pool.pop()||new T.Group(),e={id:++serial,root:group,kind:shape.kind,source,castId,age:0,life,radius,position:[...(shape.position||shape.from||[0,0,0])],from:shape.from&&[...shape.from],to:shape.to&&[...shape.to],direction:shape.direction&&[...shape.direction],arc:shape.arc,parts:[]};
  group.visible=true;group.rotation.set(0,0,0);group.scale.setScalar(1);group.name='guardian-attack-'+e.kind;group.userData.guardianAttack={kind:e.kind,source,castId,radius};group.position.set(e.position[0],e.kind==='contact'?e.position[1]:.12,e.position[2]);root.add(group);
  const add=(geometry,material,p,s)=>{const mesh=part(group,geometry,material,p,s);e.parts.push(mesh);return mesh;};
  if(e.kind==='sector'){
   group.rotation.set(0,Math.atan2(shape.direction[0],shape.direction[2]),0);
   const sweep=sectorGeometry(shape.arc);for(let i=0;i<3;i++)add(sweep,surface(i===1?.78:.25),[0,.3+i*.28,0],[radius*(1-i*.07),1,radius*(1-i*.07)]);
   e.height=1.3;e.length=radius;
  }else if(e.kind==='lane'){
   const dx=shape.to[0]-shape.from[0],dz=shape.to[2]-shape.from[2],length=Math.max(.08,Math.hypot(dx,dz));e.length=length;
   group.position.set((shape.from[0]+shape.to[0])/2,.3,(shape.from[2]+shape.to[2])/2);group.rotation.set(0,Math.atan2(dx,dz),0);
   const beam=add(geo.beam,surface(.72),[0,.35,0],[radius,length,radius]);beam.rotation.x=Math.PI/2;
   const core=add(geo.beam,glow(.65),[0,.35,0],[radius*.26,length,radius*.26]);core.rotation.x=Math.PI/2;
   for(const z of [-length/2,length/2])add(geo.orb,surface(.45),[0,.35,z],[radius,.55+radius*.35,radius]);
   const count=Math.min(9,Math.max(3,Math.ceil(length/2)));
   for(let i=0;i<count;i++){
    const z=-length/2+(i+.5)*length/count,kind=element()==='earth'||element()==='ice'?'shard':element()==='wood'?'trail':'orb';
    const height=.55+radius*.35,m=add(geo[kind],surface(.8),[(i%2?1:-1)*radius*.35,.4,z],[radius*.45,height,Math.min(.65,length/count*.4)]);m.rotation.z=(i%2?1:-1)*Math.min(.3,radius/height*.12);
   }
  }else{
   const ring=add(geo.ring,glow(.7),[0,.18,0],[radius/1.035,radius/1.035,radius/1.035]);ring.rotation.x=ringRotation;
   const count=e.kind==='contact'?3:8,height=e.kind==='contact'?.5:Math.min(3,Math.max(.9,radius*.7));e.height=height;
   for(let i=0;i<count;i++){
    const a=i*Math.PI*2/count,spread=e.kind==='contact'?.35:.64,kind=['earth','ice'].includes(element())?'shard':['fire','wood','light'].includes(element())?'trail':'orb';
    const m=add(geo[kind],surface(.85),[Math.sin(a)*radius*spread,height*.45,Math.cos(a)*radius*spread],[radius*.18,height*.6,radius*.18]);m.rotation.z=Math.sin(a)*Math.min(.3,radius/height*.12);
   }
   if(e.kind!=='contact'&&['water','wind','dark'].includes(element()))add(geo.spiral,surface(.45),[0,.05,0],[radius*.7,height/3,radius*.7]);
  }
  for(const m of e.parts){m.userData.attackBase={position:m.position.clone(),scale:m.scale.clone(),rotation:m.rotation.clone()};}
  active.push(e);return e;
 }
 function update(dt,time){
  clock=time;
  for(let i=active.length-1;i>=0;i--){const e=active[i];e.age+=dt;if(e.age>=e.life){release(e);active.splice(i,1);continue;}
   const t=e.age/e.life,envelope=Math.max(.025,Math.sin(Math.PI*(.12+.88*t)));
   for(let n=0;n<e.parts.length;n++){
    const m=e.parts[n],base=m.userData.attackBase;m.position.copy(base.position);m.scale.copy(base.scale);m.rotation.copy(base.rotation);
    if(e.kind==='sector'){m.position.y+=Math.sin(t*Math.PI)*.45;m.scale.y=envelope;}
    else if(e.kind==='lane'){m.scale.x*=envelope;m.scale.z*=envelope;m.position.y+=Math.sin(t*Math.PI)*.25;}
    else if(n===0){m.scale.multiplyScalar(.82+.18*Math.sin(Math.min(1,t*2)*Math.PI/2));m.position.y+=t*.25;}
    else{m.scale.y*=envelope;m.position.y+=Math.sin(t*Math.PI)*e.height*.4;m.rotation.y+=t*(element()==='water'||element()==='wind'?4:1);}
   }
   // Persist the coverage bounds independently of the visible envelope.
   e.root.userData.guardianAttack.age=e.age;
  }
 }
 return {create,update,clear,state:()=>({active:active.length,capacity,allocated:active.length+pool.length,clock,effects:active.map(e=>({kind:e.kind,source:e.source,castId:e.castId,position:[...e.position],from:e.from&&[...e.from],to:e.to&&[...e.to],direction:e.direction&&[...e.direction],radius:e.radius,arc:e.arc,age:e.age,life:e.life,meshes:e.parts.length}))}),dispose(){clear();pool.length=0;for(const g of arcs.values())g.dispose();arcs.clear();}};
}
