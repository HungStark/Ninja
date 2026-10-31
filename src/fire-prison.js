import * as T from 'three';

// Open roof keeps the captive readable from the exploration camera.
export function createFirePrison(parent,point,opened,addSolid=()=>null){
  const root=new T.Group();root.name='fire-prison';root.position.set(point.x,point.y,point.z);parent.add(root);
  const colliders=[],stone=new T.MeshStandardMaterial({color:'#766354',roughness:1,flatShading:true}),iron=new T.MeshStandardMaterial({color:'#454b48',roughness:1}),wood=new T.MeshStandardMaterial({color:'#594737',roughness:1});
  function box(p,size,material=stone,collide=false){const m=new T.Mesh(new T.BoxGeometry(...size),material);m.position.fromArray(p);m.castShadow=m.receiveShadow=true;root.add(m);if(collide){const c=addSolid({id:'fire-prison',x:point.x+p[0],z:point.z+p[2],w:size[0],d:size[2],bottom:point.y+p[1]-size[1]/2,top:point.y+p[1]+size[1]/2,stepable:size[1]<.2});if(c)colliders.push(c);}return m;}
  box([0,.06,0],[4.8,.12,4.8],stone,true);
  box([0,1.65,-2.2],[4.8,3.3,.4],stone,true);
  for(const side of [-1,1]){
    box([side*2.2,.55,0],[.4,1.1,4.4],stone,true);
    box([side*2.2,3.25,0],[.4,.22,4.4]);
    for(let z=-1.8;z<2.1;z+=.44)box([side*2.2,2.13,z],[.075,2.1,.075],iron);
    // One collision surface for each barred side.
    const c=addSolid({id:'fire-prison',x:point.x+side*2.2,z:point.z,w:.4,d:4.4,bottom:point.y,top:point.y+3.4,stepable:false});if(c)colliders.push(c);
    box([side*1.55,.35,2.2],[1.3,.7,.22],stone);
    for(let i=0;i<4;i++)box([side*(1.02+i*.32),1.95,2.2],[.075,2.55,.09],iron);
    const front=addSolid({id:'fire-prison',x:point.x+side*1.55,z:point.z+2.2,w:1.3,d:.22,bottom:point.y,top:point.y+3.35,stepable:false});if(front)colliders.push(front);
    box([side*2.2,1.7,2.2],[.4,3.4,.4]);
  }
  box([0,3.35,2.2],[4.8,.25,.4]);box([0,3.35,-1.9],[4.8,.22,.9]);
  const gate=new T.Group();gate.name='fire-prison-gate';gate.position.set(-.9,.12,2.2);root.add(gate);
  function gateBar(p,size){const m=new T.Mesh(new T.BoxGeometry(...size),iron);m.position.fromArray(p);m.castShadow=true;gate.add(m);}
  for(let x=.05;x<1.8;x+=.28)gateBar([x,1.5,0],[.075,3,.09]);for(const y of [.18,1.5,2.88])gateBar([.9,y,0],[1.8,.095,.12]);
  if(opened)gate.rotation.y=-Math.PI/2;
  else {const c=addSolid({id:'fire-prison-gate',x:point.x,z:point.z+2.2,w:1.8,d:.22,bottom:point.y,top:point.y+3.35,stepable:false});if(c)colliders.push(c);}
  box([0,.78,-.9],[2,.16,.85],wood,true);for(const x of [-.8,.8])box([x,.39,-.9],[.15,.78,.65],wood);
  // Straw and a folded blanket, kept as broad blocks.
  box([.1,.15,-1.7],[1.6,.04,.45],wood);box([.65,.9,-1],[.55,.06,.45],new T.MeshStandardMaterial({color:'#928573',roughness:1}));
  return {root,colliders,opened,point};
}
