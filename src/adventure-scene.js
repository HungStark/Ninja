import * as T from 'three';
import {village,VILLAGES} from './adventure-data.js';

const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.95,flatShading:true,...extra});
function mesh(g,m,parent,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
const box=(p,m,x,y,z,w,h,d)=>mesh(new T.BoxGeometry(w,h,d),m,p,x,y,z);
const cyl=(p,m,x,y,z,r,h,n=8)=>mesh(new T.CylinderGeometry(r,r,h,n),m,p,x,y,z);
function seeded(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}

export function createChibi(coat='#345c63',hair='#252b32',enemy=false){
  const root=new T.Group(),body=new T.Group();root.add(body);
  const cloth=mat(coat),ink=mat('#222c34'),skin=mat('#c9a48a'),metal=mat('#9da7a0'),hairMat=mat(hair),strap=mat('#51473d');
  const torso=mesh(new T.CylinderGeometry(.34,.43,.65,6),cloth,body,0,1.03,0);
  box(body,ink,0,.78,0,.76,.12,.48);box(body,strap,.21,1.09,.22,.11,.57,.06).rotation.z=-.35;
  box(body,ink,0,1.87,.02,.83,.69,.66); // angular hair silhouette
  mesh(new T.SphereGeometry(.43,10,7),skin,body,0,1.8,.065).scale.set(1,1.02,.85);
  const cap=mesh(new T.SphereGeometry(.455,9,5,0,Math.PI*2,0,Math.PI*.53),hairMat,body,0,1.95,0);
  for(let i=0;i<5;i++){const t=mesh(new T.ConeGeometry(.15,.44,4),hairMat,body,-.34+i*.16,2.18+Math.sin(i*2)*.06,-.05);t.rotation.z=(i-2)*-.23;}
  box(body,cloth,0,1.99,.356,.8,.15,.06);box(body,metal,0,2,.397,.3,.12,.024);
  box(body,ink,0,1.65,.338,.67,.27,.07);
  for(const x of [-.16,.16]){box(body,ink,x,1.847,.397,.17,.057,.025).rotation.z=x>0?-.13:.13;box(body,mat(enemy?'#e5aa83':'#c4d6bd'),x,1.84,.414,.065,.035,.012);}
  const arms=[],legs=[];
  for(const side of [-1,1]){
    const arm=new T.Group();arm.position.set(side*.43,1.28,0);body.add(arm);box(arm,cloth,side*.055,-.19,0,.25,.43,.28);box(arm,ink,side*.055,-.43,.03,.22,.21,.24);arms.push(arm);
    const leg=new T.Group();leg.position.set(side*.21,.73,0);body.add(leg);box(leg,ink,0,-.24,0,.27,.48,.3);box(leg,cloth,0,-.46,.025,.29,.16,.32);box(leg,ink,0,-.64,.075,.31,.19,.48);legs.push(leg);
  }
  box(body,strap,.39,.88,-.12,.23,.3,.25);const sword=box(body,ink,-.26,1.16,-.36,.13,1.5,.12);sword.rotation.z=-.45;
  const scarf=box(body,cloth,-.24,1.4,-.35,.22,.78,.07);scarf.rotation.z=-.3;
  root.scale.setScalar(1.25);
  return {root,cloth,hair:hairMat,update(time,moving){legs.forEach((l,i)=>l.rotation.x=moving?Math.sin(time*11+i*Math.PI)*.62:0);arms.forEach((a,i)=>a.rotation.x=moving?Math.sin(time*11-i*Math.PI)*-.45:.06);body.position.y=moving?Math.abs(Math.sin(time*11))*.07:Math.sin(time*2)*.025;scarf.rotation.x=moving?-.45+Math.sin(time*9)*.15:Math.sin(time*2)*.07;}};
}

export function createAdventureScene(){
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(47,innerWidth/innerHeight,.1,240),land=new T.Group();scene.add(land);
  scene.add(new T.HemisphereLight('#d9e4da','#44433d',2.5));
  const sun=new T.DirectionalLight('#ffe2af',3.2);sun.position.set(-22,40,16);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-38,right:38,top:38,bottom:-38,near:1,far:110});sun.shadow.bias=-.0007;scene.add(sun);
  const fill=new T.DirectionalLight('#a5ccd8',1.2);fill.position.set(15,15,-20);scene.add(fill);
  let hero=createChibi(),npc=createChibi('#665a4b','#a9aca0'),guard=createChibi('#793d3d','#24232b',true);scene.add(hero.root);
  const obstacles=[],interactives=[],animated=[];let gates=[],randomEnemy=null,current='nameless',time=0;
  const destination=mesh(new T.RingGeometry(.3,.5,40),new T.MeshBasicMaterial({color:'#f7dca3',side:T.DoubleSide,transparent:true,opacity:.9}),scene);destination.rotation.x=-Math.PI/2;destination.visible=false;
  function disposeLand(){land.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});land.clear();obstacles.length=0;interactives.length=0;animated.length=0;randomEnemy=null;}
  const obstacle=(x,z,w,d)=>obstacles.push({x,z,w:w/2+.65,d:d/2+.65});
  function blocked(x,z){return Math.abs(x)>25.5||Math.abs(z)>25.5||obstacles.some(o=>Math.abs(x-o.x)<o.w&&Math.abs(z-o.z)<o.d);}
  function road(a,b,width,m){const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),start=6;const r=box(land,m,(a[0]+b[0])/2+dx/length*start/2,.015,(a[1]+b[1])/2+dz/length*start/2,width,.08,length-start);r.rotation.y=Math.atan2(dx,dz);}
  function tree(x,z,size,v,rand){
    const wood=mat('#514d40'),leaves=mat(v.tree);cyl(land,wood,x,size*.8,z,size*.15,size*1.6,6);
    if(['ice','wood','dark'].includes(v.id)){
      for(let k=0;k<3;k++){mesh(new T.ConeGeometry(size*(1.1-k*.2),size*1.8,7),leaves,land,x,size*(1.6+k*.6),z);if(v.id==='ice')mesh(new T.ConeGeometry(size*(1.02-k*.2),size*.85,7),mat('#d9e6e1'),land,x,size*(2.04+k*.6),z);}
    }else{
      for(let k=0;k<3;k++)mesh(new T.IcosahedronGeometry(size*(1.05-k*.15),0),leaves,land,x+(k-1)*size*.55,size*(2.1+(k===1?.4:0)),z+(rand()-.5)*size).scale.set(1,.85,1);
    }
  }
  function house(x,z,w,d,v,rand){
    const wall=mat(v.id==='earth'?'#ba9b75':v.id==='light'?'#e2d8b7':'#c7bba1'),timber=mat('#4a4942'),roof=mat(v.roof);
    box(land,mat('#6b7164'),x,.27,z,w+.5,.54,d+.5);box(land,wall,x,1.8,z,w,3.1,d);
    for(const dx of [-w/2,w/2])for(const dz of [-d/2,d/2])box(land,timber,x+dx,1.9,z+dz,.18,3.2,.18);
    for(const side of [-1,1]){const r=box(land,roof,x+side*w*.25,3.9,z,w*.66,.25,d+1.3);r.rotation.z=side*.45;}
    box(land,roof,x,4.4,z,.22,.2,d+1.7);
    box(land,timber,x,.98,z+d/2+.03,.95,1.9,.12);box(land,mat('#d7aa6a',{emissive:'#d7aa6a',emissiveIntensity:.3}),x+w*.29,1.87,z+d/2+.09,.7,.7,.04);
    for(let i=0;i<3;i++)box(land,timber,x+w*.29-.22+i*.22,1.87,z+d/2+.13,.04,.7,.03);
    box(land,roof,x,2.75,z+d/2+.5,w*.7,.14,1.2).rotation.x=.12;
    obstacle(x,z,w,d);if(rand()>.3)box(land,timber,x-w*.6,.35,z+d*.4,.7,.7,.7);
  }
  function arch(x,z,angle,v){
    const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;land.add(g);const wood=mat(v.roof),stone=mat('#b5b4a0');
    for(const side of [-1,1]){box(g,stone,side*2.1,.25,0,.8,.5,.8);box(g,wood,side*2.1,2.2,0,.45,4.1,.45);}
    box(g,wood,0,3.8,0,5.6,.34,.65);box(g,wood,0,4.4,0,6.3,.22,.85);box(g,mat(v.color),0,3.85,.38,.75,.6,.05);
  }
  function crystal(x,z,v,s=1){const m=mat(v.color,{emissive:v.color,emissiveIntensity:.3,metalness:.15});const c=mesh(new T.OctahedronGeometry(s,0),m,land,x,s*1.1,z);c.scale.set(.65,1.6,.65);return c;}
  function load(id,save){
    disposeLand();current=id;const v=village(id),rand=seeded(VILLAGES.indexOf(v)*913+1049);
    scene.background=new T.Color(v.sky);scene.fog=new T.Fog(v.sky,42,110);sun.color.set(v.id==='dark'?'#c5bbec':'#ffe2af');sun.intensity=v.id==='dark'?1.8:3.2;
    box(land,mat(v.ground),0,-.55,0,62,1,62);
    const pathMat=mat(v.path),stone=mat('#797e73');
    cyl(land,pathMat,0,.04,0,7,.1,40);
    gates=v.links.map(target=>{const other=village(target),angle=Math.atan2(other.x-v.x,other.y-v.y),x=Math.sin(angle)*23,z=Math.cos(angle)*23;road([0,0],[x,z],3.6,pathMat);arch(x,z,angle,v);return {kind:'gate',id:target,x,z,label:other.name};});
    interactives.push(...gates);
    // Shared walkable village core, with a solid skyline around its outer paths.
    for(const [x,z,w,d] of [[-11,0,5,4],[11,0,5,4],[-12,10,4.7,4],[12,10,4.5,4],[-13,-10,5,4],[13,-10,4.5,4]]){
      if(gates.some(g=>Math.hypot(g.x-x,g.z-z)<8))continue;
      house(x,z,w,d,v,rand);
    }
    for(let i=0;i<52;i++){
      const x=(rand()-.5)*83,z=(rand()-.5)*83;
      if(Math.hypot(x,z)<16||gates.some(g=>Math.hypot(x-g.x,z-g.z)<8||(Math.abs(x*g.z-z*g.x)/23<2.8&&x*g.x+z*g.z>0&&x*g.x+z*g.z<620))||obstacles.some(o=>Math.abs(x-o.x)<o.w+1&&Math.abs(z-o.z)<o.d+1))continue;
      if(['earth','lightning'].includes(id)&&rand()>.3){const s=1.4+rand()*2.2;const r=mesh(new T.DodecahedronGeometry(s,0),stone,land,x,s*.9,z);r.scale.y=2+rand()*2;if(Math.abs(x)<25&&Math.abs(z)<25)obstacle(x,z,s*1.6,s*1.6);}
      else {const s=.8+rand()*.8;tree(x,z,s,v,rand);if(Math.abs(x)<25&&Math.abs(z)<25)obstacle(x,z,1.3,1.3);}
    }
    // Distant faceted mountain silhouettes, kept outside the walking area.
    for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=47+rand()*10,h=10+rand()*16;mesh(new T.ConeGeometry(7+rand()*8,h,5),mat(new T.Color(v.ground).multiplyScalar(.7)),land,Math.sin(a)*r,h/2-1,Math.cos(a)*r).rotation.y=rand()*3;}
    // Pebbles and ground cover use one instanced draw call each.
    const grass=new T.InstancedMesh(new T.ConeGeometry(.16,.5,3),mat(v.tree),460),dummy=new T.Object3D();
    for(let i=0;i<460;i++){const x=(rand()-.5)*58,z=(rand()-.5)*58;dummy.position.set(x,.2,z);dummy.scale.setScalar(Math.hypot(x,z)<8||gates.some(g=>{const a=g.x,b=g.z;return Math.abs(x*b-z*a)/23<2;})?0:.7+rand());dummy.rotation.set(0,rand()*6,rand()*.25);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);}land.add(grass);
    // Biome landmarks have collision footprints, leaving the radial roads clear.
    if(id==='water'){
      const lake=mesh(new T.CylinderGeometry(6,6,.15,48),mat('#4c9cae',{metalness:.45,roughness:.25}),land,-18,.08,-3);obstacle(-18,-3,11,11);animated.push({kind:'water',mesh:lake});
      for(let i=0;i<6;i++)box(land,mat('#6a6456'),-14+i*.8,.22,2,.72,.18,2);
    }
    if(id==='fire'){
      for(let i=0;i<9;i++){const x=-19+i*.4,z=-13+i*.65;const r=box(land,mat('#e17b39',{emissive:'#c24c20',emissiveIntensity:.8}),x,.1,z,.8,.08,1.3);animated.push({kind:'ember',mesh:r});}obstacle(-17,-10,5,7);
    }
    if(['lightning','ice','light'].includes(id))for(const [x,z] of [[-19,8],[18,-9],[-18,-15]]){for(let i=0;i<3;i++)crystal(x+i*.7,z+i*.5,v,1+i*.4);obstacle(x+1,z+1,3,3);}
    if(id==='lightning'){
      const tower=new T.Group();tower.position.set(-18,0,8);land.add(tower);const iron=mat('#464454');
      for(let i=0;i<4;i++)cyl(tower,iron,0,.4+i*1.25,0,1.4-i*.22,.35,6);
      cyl(tower,iron,0,3,0,.24,6.5,6);mesh(new T.ConeGeometry(.15,2,5),mat('#c4b5d6'),tower,0,7,0);
      const coil=mesh(new T.TorusGeometry(1.25,.07,5,24),mat(v.color,{emissive:v.color,emissiveIntensity:.55}),tower,0,4,0);coil.rotation.x=Math.PI/2;
      for(const side of [-1,1])box(tower,iron,side*.7,5.5,0,1.5,.1,.1).rotation.z=side*.6;obstacle(-18,8,3.5,3.5);
    }
    if(id==='light'){
      const altar=new T.Group();altar.position.set(-18,0,8);land.add(altar);const marble=mat('#ddd4b6'),gold=mat('#b69654',{metalness:.45});
      for(let i=0;i<3;i++)cyl(altar,marble,0,.2+i*.3,0,2.3-i*.4,.3,8);
      for(const side of [-1,1])cyl(altar,marble,side*1.2,2.6,0,.25,4,8);
      box(altar,marble,0,4.5,0,3.3,.4,.8);
      const disk=mesh(new T.TorusGeometry(.95,.13,6,24),gold,altar,0,5.3,0);
      for(let i=0;i<8;i++){const a=i/8*Math.PI*2,r=mesh(new T.ConeGeometry(.13,.65,4),gold,altar,Math.sin(a)*1.55,5.3+Math.cos(a)*1.55,0);r.rotation.z=-a;}
      crystal(-18,8,v,.45);obstacle(-18,8,4.2,4.2);
    }
    if(id==='wood'){tree(-19,3,3.6,v,rand);obstacle(-19,3,5,5);for(let i=0;i<8;i++)mesh(new T.SphereGeometry(.07,4,3),mat('#c7eaa3',{emissive:'#c7eaa3',emissiveIntensity:1}),land,-16+rand()*8,1+rand()*4,rand()*9);}
    if(id==='wind'){
      const g=new T.Group();g.position.set(-18,0,9);land.add(g);mesh(new T.ConeGeometry(1.5,6,8),mat('#b1ad8a'),g,0,3,0);const blades=new T.Group();blades.position.set(0,5,1);g.add(blades);for(let i=0;i<4;i++){const b=new T.Group();b.rotation.z=i*Math.PI/2;blades.add(b);box(b,mat('#dbd6b9'),0,1.7,0,.65,3,.12);}animated.push({kind:'windmill',mesh:blades});obstacle(-18,9,3,3);
    }
    if(id==='dark')for(let i=0;i<7;i++){const x=-19+i*.5,z=9+i*1.4;cyl(land,stone,x,1,z,.15,2);const lamp=mesh(new T.SphereGeometry(.35,8,6),mat('#a59dd5',{emissive:'#a59dd5',emissiveIntensity:.9}),land,x,2.3,z);animated.push({kind:'lamp',mesh:lamp});}
    if(id==='earth')for(let i=0;i<4;i++)box(land,mat('#ac8a62'),-18,1+i*.7,-10-i*.7,8-i*.8,2+i,3);
    // Save point: a stone lantern and a suspended seal above concentric plinths.
    const shrine=new T.Group();shrine.position.set(0,0,3);land.add(shrine);
    for(let i=0;i<3;i++)cyl(shrine,stone,0,.1+i*.18,0,1.5-i*.3,.2,8);
    cyl(shrine,mat('#475961'),0,1,0,.38,1.1);box(shrine,mat('#b4b7a0'),0,1.7,0,1,.24,1);
    const seal=mesh(new T.OctahedronGeometry(.4),mat('#96e6cc',{emissive:'#57ccaf',emissiveIntensity:.9}),shrine,0,2.35,0);animated.push({kind:'seal',mesh:seal});
    const halo=mesh(new T.RingGeometry(1.7,1.78,64),new T.MeshBasicMaterial({color:'#a7ead6',side:T.DoubleSide,transparent:true,opacity:.65}),shrine,0,.08,0);halo.rotation.x=-Math.PI/2;
    obstacle(0,3,1.5,1.5);interactives.push({kind:'save',x:0,z:5,label:'Ấn hồi sinh'});
    npc=createChibi('#6f6957','#b0b6a6');npc.root.position.set(-4,0,4);npc.root.rotation.y=.4;land.add(npc.root);interactives.push({kind:'npc',x:-4,z:5,label:'Trưởng làng'});
    guard=createChibi('#7a4141','#252833',true);guard.root.position.set(8,0,-11);guard.root.rotation.y=Math.PI;guard.root.visible=save.quests[id]===1;land.add(guard.root);
    interactives.push({kind:'quest',x:8,z:-9.5,label:'Kẻ phá ấn'});
    hero.cloth.color.set(save.hero.coat);hero.hair.color.set(save.hero.hair);hero.root.position.set(save.position[0],0,save.position[1]);hero.root.rotation.y=Math.PI;
    if(blocked(...save.position))hero.root.position.set(0,0,7);
    destination.visible=false;camera.position.copy(hero.root.position).add(new T.Vector3(13,17,19));camera.lookAt(hero.root.position.clone().add(new T.Vector3(0,1,0)));
  }
  function spawnEnemy(x,z){if(randomEnemy)land.remove(randomEnemy.root);randomEnemy=createChibi('#754f4a','#2c2932',true);randomEnemy.root.position.set(x,0,z);land.add(randomEnemy.root);return randomEnemy;}
  function clearEnemy(){if(randomEnemy){land.remove(randomEnemy.root);randomEnemy.root.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});randomEnemy=null;}}
  function update(dt,moving,menu=false){time+=dt;if(menu)hero.root.rotation.y=.6;hero.update(time,moving);npc.update(time,false);guard.update(time,false);randomEnemy?.update(time,true);
    for(const a of animated){if(a.kind==='seal'){a.mesh.rotation.y=time*.7;a.mesh.position.y=2.35+Math.sin(time*2)*.1;}if(a.kind==='windmill')a.mesh.rotation.z=time*.35;if(a.kind==='water')a.mesh.position.y=.08+Math.sin(time)*.025;}
    const target=hero.root.position.clone().add(new T.Vector3(menu?-4:0,1,0)),offset=new T.Vector3(menu?10:13,menu?10:17,menu?14:19);
    camera.position.lerp(target.clone().add(offset),1-Math.exp(-dt*5));camera.lookAt(target);destination.rotation.z=time;
  }
  function project(x,z,y=3){camera.updateMatrixWorld();const p=new T.Vector3(x,y,z).project(camera);return {left:(p.x+1)*innerWidth/2,top:(1-p.y)*innerHeight/2,visible:p.z<1&&Math.abs(p.x)<1.1&&Math.abs(p.y)<1.1};}
  function pick(clientX,clientY,canvas){camera.updateMatrixWorld();const r=canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),camera);const point=new T.Vector3();return ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),point)?[point.x,point.z]:null;}
  return {scene,camera,hero,obstacles,interactives,blocked,load,update,project,pick,spawnEnemy,clearEnemy,get guard(){return guard;},get gates(){return gates;},get randomEnemy(){return randomEnemy;},destination,resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}};
}
