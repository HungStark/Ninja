import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createVillager} from './villager.js';
import {villagerAppearance} from './villager-appearance.js';

let haLyAssetPromise;
function loadHaLyAsset(){
  return haLyAssetPromise??=new GLTFLoader().loadAsync(new URL('assets/ha-ly.glb',document.baseURI).href).then(gltf=>gltf.scene);
}
function cloneHaLyAsset(source){
  const model=source.clone(true);
  model.traverse(o=>{if(!o.isMesh)return;o.geometry=o.geometry.clone();o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();o.castShadow=true;o.receiveShadow=true;});
  return model;
}

export function ninjaProfile(look){
  const village=look.village||'nameless',seed=Array.from(look.id||'duel').reduce((s,c)=>(s*31+c.charCodeAt(0))>>>0,13),base=villagerAppearance(village,{kind:'ninja',id:look.id||'duel'});
  return {...base,id:look.id||'duel',job:'ninja',age:'adult',female:look.female===true,beard:null,hat:null,fur:false,shawl:false,
    coat:look.coat||'#33495f',hair:look.hair||'#252833',hairStyle:look.hairStyle||(look.female?'ponytail':seed%3===0?'ponytail':'short'),
    height:look.female?2.9:2.96+(seed%4)*.065,width:look.female?.85:.94+(seed%3)*.06,hood:!look.female&&look.kind==='ninja'&&look.id.startsWith('random-')&&seed%3!==0,variant:seed%6};
}

// The same adult NPC body, face and materials are used in exploration and combat.
export function createNinja(look){
  const profile=ninjaProfile(look),base=createVillager(profile),{root,body,head}=base;
  root.name='ninja-'+profile.id;root.userData.ninja={id:profile.id,village:profile.village,hood:profile.hood,variant:profile.variant,height:profile.height};
  const mats=new Map(),M=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.86,flatShading:true}));return mats.get(c);};
  const dark=M('#22272c'),wrap=M('#424448'),metal=M('#939d9c'),leather=M('#53443b'),accent=M(profile.accent),cloth=base.cloth;
  const sphere=new T.SphereGeometry(1,10,7),cube=new T.BoxGeometry(1,1,1);
  const mesh=(g,m,p,x,y,z,sx=1,sy=1,sz=1)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
  const box=(p,m,x,y,z,w,h,d)=>mesh(cube,m,p,x,y,z,w,h,d);
  const ball=(p,m,x,y,z,w,h,d)=>mesh(sphere,m,p,x,y,z,w,h,d);
  const panel=(p,m,points,z,depth=.025)=>{const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.008,bevelThickness:.007,bevelSegments:1,steps:1,curveSegments:2}),m,p,0,0,z);};
  const mask=ball(head,dark,0,-.145,0,.303,.19,.268);mask.name='ninja-face-mask';
  for(let i=0;i<3;i++)box(head,wrap,0,-.075-i*.05,.268-i*.012,.24-i*.035,.012,.012).rotation.z=i%2?.07:-.07;
  const band=box(head,cloth,0,.17,.232,.58,.105,.055);band.name='ninja-headband';
  box(head,metal,0,.17,.268,.18,.073,.018);box(head,dark,-.018,.17,.283,.06,.012,.008).rotation.z=.55;box(head,dark,.028,.17,.283,.012,.04,.008);
  for(const side of [-1,1])box(head,dark,side*.11,.074,.242,.125,.02,.022).rotation.z=-side*.12;
  if(profile.hood){
    const hood=mesh(new T.SphereGeometry(1,12,9,Math.PI*.83,Math.PI*1.34,0,Math.PI*.87),cloth,head,0,.035,-.025,.345,.44,.3);hood.material.side=T.DoubleSide;hood.name='ninja-hood';
    for(const side of [-1,1])box(head,wrap,side*.298,-.06,.035,.05,.49,.08).rotation.z=-side*.12;
  }
  const collar=mesh(new T.TorusGeometry(.235,.065,6,14),dark,body,0,2.18,0);collar.rotation.x=Math.PI/2;collar.scale.y=.8;
  const width=profile.width;
  panel(body,dark,[[-.27*width,1.99],[-.31*width,1.78],[-.23*width,1.38],[.23*width,1.38],[.31*width,1.78],[.27*width,1.99]],.24,.035).name='ninja-flak-vest';
  if(profile.variant%3===0){
    for(let i=0;i<3;i++)panel(body,cloth,[[-.245,1.94-i*.16],[-.215,1.83-i*.16],[0,1.79-i*.16],[.215,1.83-i*.16],[.245,1.94-i*.16]],.29,.023);
  }else for(const side of [-1,1]){box(body,cloth,side*.135,1.68,.3,.23,.32,.045);box(body,accent,side*.135,1.77,.332,.2,.035,.017);}
  const harness=box(body,leather,0,1.7,.35,.075,.83,.03);harness.rotation.z=-.49;
  box(body,metal,.105,1.9,.373,.075,.06,.02).rotation.z=-.49;
  box(body,dark,0,1.22,.01,.71*width,.13,.48);box(body,accent,0,1.225,.267,.22,.06,.025);
  for(const side of [-1,1]){box(body,leather,side*.32,1.16,-.1,.19,.24,.2);box(body,metal,side*.32,1.2,-.209,.15,.035,.018);}
  const sword=box(body,dark,-.15,1.62,-.31,.09,1.05,.095);sword.rotation.z=-.43;sword.name='ninja-sheathed-blade';
  const hilt=box(body,leather,-.4,2.17,-.31,.095,.31,.1);hilt.rotation.z=-.43;box(body,metal,-.34,2.04,-.31,.25,.033,.14).rotation.z=-.43;
  for(let i=0;i<4;i++)box(body,accent,-.46+i*.035,2.28-i*.067,-.371,.11,.018,.016).rotation.z=-.43;
  const scarf=panel(body,cloth,[[-.1,2.14],[-.27,2.1],[-.39,1.68],[-.26,1.32],[-.19,1.5],[-.15,1.24],[-.08,1.7]],-.29,.018);scarf.geometry.translate(0,-2.14,0);scarf.position.y=2.14;scarf.name='ninja-travel-scarf';
  const shoulderGuards=[],bracers=[];
  const arms=base.arms.map((pivot,i)=>({side:i===0?-1:1,pivot})),legs=base.legs.map((pivot,i)=>({side:i===0?-1:1,pivot}));
  for(let i=0;i<2;i++){
    const side=i===0?-1:1,arm=arms[i].pivot,elbow=base.forearms[i],leg=legs[i].pivot,shoulder=new T.Group(),bracer=new T.Group();arm.add(shoulder);elbow.add(bracer);bracer.position.set(0,0,-.015);shoulderGuards.push(shoulder);bracers.push(bracer);
    panel(shoulder,wrap,[[-.12,-.02],[.12,-.02],[.15,-.16],[0,-.21],[-.15,-.16]],.15,.027);
    box(shoulder,accent,0,-.08,.188,.2,.028,.015);
    panel(bracer,dark,[[-.09,0],[-.1,-.19],[-.065,-.34],[.065,-.34],[.1,-.19],[.09,0]],.09,.035);
    panel(bracer,metal,[[-.06,-.035],[-.07,-.18],[0,-.28],[.07,-.18],[.06,-.035]],.133,.017);
    for(let k=0;k<3;k++)box(bracer,wrap,0,-.07-k*.085,.16,.16,.018,.015).rotation.z=side*.1;
    ball(elbow,dark,0,-.43,.015,.098,.122,.094);
    box(leg,leather,0,-.19,.15,.23,.07,.027);box(leg,leather,0,-.28,.145,.23,.045,.026);
    panel(leg,wrap,[[-.085,-.52],[-.1,-.67],[-.06,-.87],[.06,-.87],[.1,-.67],[.085,-.52]],.105,.027);
    for(let k=0;k<3;k++)box(leg,accent,0,-.55-k*.1,.148,.19,.022,.018).rotation.z=side*.1;
  }
  let haLyAlive=true;
  if(profile.id==='ha-ly'&&typeof document!=='undefined')loadHaLyAsset().then(source=>{
    if(!haLyAlive||!root.parent)return;
    const visual=cloneHaLyAsset(source);visual.updateMatrixWorld(true);
    const bounds=new T.Box3().setFromObject(visual),height=Math.max(.01,bounds.max.y-bounds.min.y),scale=profile.height/height;
    visual.scale.setScalar(scale);visual.position.y=-bounds.min.y*scale;visual.name='ha-ly-vrm-appearance';
    const geometries=new Set(),materials=new Set();
    for(const child of body.children)child.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
    body.clear();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());body.add(visual);
    root.userData.referenceAppearance=true;
  }).catch(()=>{});
  let stride=0;
  function update(time,moving,velocity=null,dt=1/60){
    base.update(time,false,null,dt);const yaw=root.rotation.y,vx=moving?(velocity?.x??Math.sin(yaw)*2):0,vz=moving?(velocity?.z??Math.cos(yaw)*2):0,speed=Math.hypot(vx,vz),weight=Math.min(1,speed/2),x=(Math.cos(yaw)*vx-Math.sin(yaw)*vz)/(speed||1),z=(Math.sin(yaw)*vx+Math.cos(yaw)*vz)/(speed||1);stride+=speed*dt*3.6;
    legs.forEach((l,i)=>{const step=Math.sin(stride+i*Math.PI)*weight;l.pivot.rotation.x=-step*z*.35;l.pivot.rotation.z=step*x*.25;});
    arms.forEach((a,i)=>{a.pivot.rotation.x=Math.sin(stride+i*Math.PI)*weight*z*.24;a.pivot.rotation.z=-Math.sin(stride+i*Math.PI)*weight*x*.13;});
    body.rotation.z=-x*weight*.035;body.rotation.x=z*weight*.025;scarf.rotation.x=Math.sin(time*2)*.025-weight*.08;
  }
  function combatPose(attack=0,block=0,bounce=0){
    body.rotation.x=.12+attack*.16-block*.12;body.rotation.y=-attack*.28;body.position.y=-.1+Math.abs(bounce)*.35;
    arms.forEach((a,i)=>{a.pivot.rotation.x=i===1?-.75-attack*.95-block*.45:-.85-block*.7;a.pivot.rotation.z=(i===0?-1:1)*(.22+block*.2);base.forearms[i].rotation.x=i===1?-.8+attack*.7-block*.25:-1.05-block*.25;});
    legs[0].pivot.rotation.x=-.22-attack*.2;legs[1].pivot.rotation.x=.25+attack*.18;legs[0].pivot.rotation.z=.11;legs[1].pivot.rotation.z=-.11;head.rotation.y=attack*.15;
  }
  function dispose(){haLyAlive=false;const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}
  return {root,profile,height:profile.height,cloth:base.cloth,hair:base.hair,arms,legs,shoulderGuards,bracers,update,combatPose,setInkViewport:base.setInkViewport,dispose};
}
