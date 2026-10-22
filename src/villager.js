import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createVillageActivity} from './village-activities.js';

// Human proportions and profession-specific silhouettes, without a chibi base.
export function createVillager(profile){
  const root=new T.Group(),body=new T.Group();root.add(body);root.name='villager-'+profile.village+'-'+profile.id;root.userData.villager={...profile};
  const colors=new Map(),material=color=>{if(!colors.has(color))colors.set(color,new T.MeshStandardMaterial({color,roughness:.92,flatShading:true}));return colors.get(color);};
  const cloth=material(profile.coat),accent=material(profile.accent),skin=material(profile.skin),hair=material(profile.hair),ink=material('#302e2b'),leather=material('#604936'),linen=material('#d8cbb0'),metal=material('#8b9290');
  skin.flatShading=false;skin.roughness=.64;hair.roughness=.76;leather.roughness=.73;metal.metalness=.65;metal.roughness=.38;
  const cube=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,10,7);
  const mesh=(geo,mat,parent,x,y,z,sx=1,sy=1,sz=1)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const box=(p,m,x,y,z,w,h,d)=>mesh(cube,m,p,x,y,z,w,h,d);
  const ball=(p,m,x,y,z,w,h,d)=>mesh(sphere,m,p,x,y,z,w,h,d);
  const cone=(p,m,x,y,z,r1,r2,h,n=8)=>mesh(new T.CylinderGeometry(r1,r2,h,n),m,p,x,y,z);
  const part=(name,parent=body)=>{const g=new T.Group();g.name=name;parent.add(g);return g;};
  const width=profile.width,robe=['sage','priest','elder','envoy','lantern'].includes(profile.job),female=profile.female;
  const torso=cone(body,cloth,0,1.62,0,(female?.325:.35)*width,(female?.265:.3)*width,1.01);torso.scale.z=.66;
  ball(body,cloth,0,1.1,0,.34*width,.22,.22);
  box(body,leather,0,1.23,.008,.68*width,.105,.46);
  box(body,accent,.03,1.24,.25,.15,.13,.045);
  if(robe){const skirt=cone(body,cloth,0,.91,0,.3*width,.46*width,1.03);skirt.scale.z=.72;for(const side of [-1,1])box(body,accent,side*.13,.89,.29,.035,.92,.035).rotation.z=side*.055;}
  else if(['smith','miner','healer','tailor'].includes(profile.job)){
    const apron=part('work-apron');box(apron,['smith','miner'].includes(profile.job)?leather:accent,0,1.48,.25,.48*width,1.12,.045);box(apron,leather,.18*width,1.95,.19,.055,.3,.035).rotation.z=.2;
    box(apron,cloth,-.12,1.04,.295,.16,.19,.05);box(apron,cloth,.12,1.04,.295,.16,.19,.05);
  }
  const legs=[],arms=[],forearms=[];
  for(const side of [-1,1]){
    const leg=part('leg-'+side);leg.position.set(side*.17*width,1.08,0);
    cone(leg,robe?ink:cloth,0,-.24,0,.14,.115,.47,7);const shin=cone(leg,ink,0,-.69,.01,.11,.095,.43,7);
    box(leg,leather,0,-.97,.075,.23,.18,.38);legs.push(leg);
    const arm=part('arm-'+side);arm.position.set(side*.37*width,1.96,0);
    const sleeve=cone(arm,cloth,side*.025,-.22,0,.17*width,.145,.45,7);sleeve.rotation.z=side*.1;
    const forearm=part('elbow-'+side,arm);forearm.position.set(side*.055,-.46,.015);
    cone(forearm,profile.job==='smith'?skin:cloth,0,-.17,0,.12,.085,.4,7);
    if(profile.job!=='smith')cone(forearm,accent,0,-.31,0,.12,.12,.07,7);
    ball(forearm,skin,0,-.44,.015,.095,.125,.09);arms.push(arm);forearms.push(forearm);
  }
  cone(body,skin,0,2.2,0,.11,.13,.25,8);
  const head=part('face');head.position.set(0,2.55,.015);
  const faceWidth=female?.255:.275+(profile.variant%2)*.015;
  ball(head,skin,0,0,0,faceWidth,.345,.25);
  const eyes=part('expressive-eyes',head),brows=part('expressive-brows',head);eyes.position.set(0,.026,.239);brows.position.set(0,.09,.23);
  for(const side of [-1,1]){
    ball(head,skin,side*(faceWidth-.012),-.015,-.005,.055,.085,.05);
    ball(eyes,material('#e6ddd1'),side*.105,0,0,.06,.025,.012);
    ball(eyes,ink,side*.103,0,.012,.019,.023,.008);
    box(brows,hair,side*.105,0,0,.12,.018,.024).rotation.z=side*(profile.activity==='mourning'?-.16:profile.variant%2?.05:-.06);
    if(profile.age==='elder')box(head,material('#916c54'),side*.17,-.035,.208,.06,.012,.013).rotation.z=side*.15;
  }
  if(profile.job!=='ninja'){
    const nose=mesh(new T.ConeGeometry(.048,.14,4),skin,head,0,-.035,.262);nose.rotation.x=Math.PI/2;
    const smile=profile.activity==='mourning'?0:.016,curve=new T.QuadraticBezierCurve3(new T.Vector3(-.052,-.15,.226),new T.Vector3(0,-.15-smile,.237),new T.Vector3(.052,-.15,.226));
    mesh(new T.TubeGeometry(curve,6,.008,4,false),material('#885b4a'),head,0,0,0);
  }
  const cap=mesh(new T.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI*.55),hair,head,0,.085,-.015,faceWidth+.025,.3,.255);
  if(profile.hairStyle==='bald'){cap.scale.set(faceWidth+.01,.16,.24);cap.position.set(0,-.015,-.09);}
  else if(profile.hairStyle==='short')for(const side of [-1,1])box(head,hair,side*.19,.18,.1,.18,.15,.22).rotation.z=side*.18;
  else if(profile.hairStyle==='bun'){ball(head,hair,0,.4,-.2,.14,.16,.14);cone(head,accent,0,.4,-.2,.145,.145,.04,8);}
  else if(profile.hairStyle==='long'){for(const side of [-1,1]){const strand=cone(head,hair,side*.23,-.17,-.075,.12,.065,.7,7);strand.rotation.z=side*.08;}box(head,hair,0,-.23,-.19,.37,.65,.14);}
  else if(['ponytail','braid'].includes(profile.hairStyle)){
    ball(head,hair,0,.02,-.28,.13,.14,.12);
    if(profile.hairStyle==='braid')for(let k=0;k<6;k++)ball(head,hair,Math.sin(k*2)*.025,-.12-k*.09,-.29,.075-k*.005,.075,.07);
    else cone(head,hair,0,-.27,-.3,.11,.025,.58,7).rotation.x=-.2;
    box(head,accent,0,-.04,-.4,.12,.06,.025);
  }
  if(profile.beard){const beard=mesh(new T.ConeGeometry(profile.beard==='long'?.16:.15,profile.beard==='long'?.5:.16,7),hair,head,0,profile.beard==='long'?-.38:-.21,.12);beard.rotation.x=Math.PI;for(const side of [-1,1])box(head,hair,side*.073,-.115,.247,.15,.035,.025).rotation.z=side*.12;}
  const hat=part('headwear',head);
  if(['conical','straw'].includes(profile.hat)){cone(hat,material('#a18a56'),0,.34,0,.025,.63,profile.hat==='conical'?.3:.13,12);cone(hat,material('#c8b17b'),0,.2,0,.64,.64,.025,12);}
  if(profile.hat==='helmet'){mesh(new T.SphereGeometry(1,10,5,0,Math.PI*2,0,Math.PI/2),metal,hat,0,.05,0,.34,.37,.3);box(hat,accent,0,.19,.292,.17,.14,.07);ball(hat,linen,0,.19,.34,.06,.06,.025);}
  if(profile.hat==='band')box(hat,accent,0,.21,.224,.49,.09,.035);
  if(profile.hat==='goggles')for(const side of [-1,1]){ball(hat,leather,side*.13,.21,.21,.12,.09,.065);ball(hat,material('#91aeb1'),side*.13,.21,.26,.073,.06,.023);}
  if(profile.hat==='fur'){ball(hat,cloth,0,.21,-.01,.35,.25,.31);for(const side of [-1,1])box(hat,linen,side*.28,.025,-.01,.13,.3,.22);cone(hat,linen,0,.15,0,.35,.35,.12,10);}
  if(profile.hat==='hood'){const hood=ball(hat,cloth,0,.04,-.13,.4,.48,.29);for(const side of [-1,1])box(hat,cloth,side*.3,-.08,.025,.12,.58,.21);}
  if(robe||profile.shawl||profile.fur){const mantle=cone(body,profile.fur?linen:accent,0,1.99,-.025,.28,.5*width,.25,8);mantle.scale.z=.7;}
  const prop=part('profession-'+profile.job);
  const staff=(color=leather,height=2.5)=>{cone(prop,color,.61, height/2, .02,.038,.05,height,7);};
  if(['elder','sage'].includes(profile.job)){
    staff(leather,profile.job==='elder'?1.3:3.25);if(profile.job==='elder')box(prop,leather,.53,1.29,.02,.22,.07,.08);else mesh(new T.OctahedronGeometry(.13),accent,prop,.61,3.3,.02);
    arms[1].rotation.x=-.16;
  }
  if(['elder','sage','boatman','farmer'].includes(profile.job))arms[1].rotation.z=-.12;
  if(profile.job==='smith'){
    const hammer=part('forging-hammer',arms[1]);cone(hammer,leather,.05,-.92,.12,.035,.035,.62,6);box(hammer,metal,.05,-.62,.12,.35,.18,.18);
    box(prop,metal,-.32,1.15,.25,.08,.3,.07).rotation.z=.13;
  }
  if(profile.job==='boatman'){
    staff(leather,3.3);const blade=box(prop,material('#99825a'),.61,.3,.02,.24,.55,.07);blade.rotation.z=.1;
    const rope=mesh(new T.TorusGeometry(.22,.045,5,16),material('#b4a178'),prop,-.38,1.24,-.12);rope.rotation.y=-.5;
  }
  if(profile.job==='miner'){
    const pick=part('mining-pick');pick.position.set(-.39,1.68,-.24);pick.rotation.z=-.4;cone(pick,leather,0,0,0,.035,.035,1.45,6);box(pick,metal,0,.65,0,.7,.1,.12).rotation.z=.13;
  }
  if(profile.job==='engineer'){
    box(prop,leather,.39,1.13,.03,.24,.35,.3);for(let k=0;k<3;k++)cone(prop,metal,.32+k*.05,1.42,.07,.025,.025,.24,5);
    const coil=mesh(new T.TorusGeometry(.17,.025,5,12),accent,prop,-.4,1.61,-.17);coil.rotation.y=.7;
  }
  if(['healer','tailor'].includes(profile.job)){
    const basket=cone(prop,material('#948058'),-.42,.98,.05,.2,.15,.38,9);
    for(let k=0;k<5;k++){const leaf=mesh(new T.OctahedronGeometry(.12),material('#70805a'),prop,-.42+Math.sin(k*2)*.13,1.2+k%2*.06,.05+Math.cos(k*2)*.1);leaf.scale.set(.45,1.5,.5);}
    if(profile.job==='healer'){box(prop,accent,0,1.79,.255,.08,.23,.02);box(prop,accent,0,1.79,.26,.22,.07,.02);}
    else{box(prop,linen,.32,1.32,.13,.18,.3,.16);box(prop,accent,.32,1.3,.23,.18,.055,.025);}
  }
  if(profile.job==='farmer'){
    staff(leather,2.2);box(prop,metal,.61,2.12,.02,.6,.08,.1);for(let i=0;i<4;i++)box(prop,metal,.4+i*.14,2.03,.02,.035,.2,.04);
    box(body,accent,.1,1.94,.23,.17,.2,.04).rotation.z=.3;
  }
  if(profile.job==='priest'){
    box(prop,accent,0,1.55,.25,.19,.85,.04);const sun=mesh(new T.TorusGeometry(.09,.025,5,12),metal,prop,0,1.92,.29);
    const book=box(prop,material('#625640'),-.43,1.16,.18,.26,.35,.12);book.rotation.z=.1;box(prop,linen,-.43,1.16,.25,.2,.28,.02);
  }
  if(profile.job==='ranger'){
    const strap=box(body,leather,.01,1.66,.253,.075,.95,.045);strap.rotation.z=-.55;
    cone(prop,leather,-.24,1.72,-.28,.12,.09,.69,7);for(let i=0;i<3;i++)cone(prop,linen,-.31+i*.065,2.16,-.29,.012,.012,.4,5);
    const bow=mesh(new T.TorusGeometry(.48,.025,5,14,Math.PI),leather,prop,.32,1.46,-.28);bow.rotation.z=-Math.PI/2;
  }
  if(profile.job==='lantern'){
    const light=material('#d6ad62');light.emissive=new T.Color('#eaaa54');light.emissiveIntensity=.5;
    box(prop,ink,.55,.86,.12,.22,.35,.22);box(prop,light,.55,.86,.235,.13,.23,.025);box(prop,metal,.55,1.065,.12,.27,.06,.27);
    const ring=mesh(new T.TorusGeometry(.085,.015,5,12),metal,prop,.55,1.16,.12);
  }
  if(['envoy','leader'].includes(profile.job)){
    box(prop,accent,0,1.67,.26,.24,.62,.035);
    for(const side of [-1,1])box(prop,profile.job==='leader'?metal:accent,side*.4,1.99,0,.27,.17,.37);
    const scroll=cone(prop,linen,-.45,1.19,.16,.08,.08,.48,7);scroll.rotation.z=.3;box(prop,accent,-.45,1.2,.245,.18,.055,.025);
  }
  root.scale.setScalar(profile.height/3);
  if(profile.activity){
    // Batch static pieces per joint, preserving the articulated head and limbs.
    const obsolete=new Set();root.traverse(parent=>{if(parent.isMesh)return;const batches=new Map();for(const child of [...parent.children])if(child.isMesh){child.updateMatrix();const geo=(child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone()).applyMatrix4(child.matrix);if(!batches.has(child.material))batches.set(child.material,[]);batches.get(child.material).push(geo);obsolete.add(child.geometry);parent.remove(child);}for(const [mat,geos] of batches){const geo=mergeGeometries(geos);geos.forEach(g=>g.dispose());const o=new T.Mesh(geo,mat);o.castShadow=o.receiveShadow=true;parent.add(o);}});obsolete.forEach(g=>g.dispose());
  }
  const activity=profile.activity?createVillageActivity({root,body,head,arms,profile,material}):null;
  // Hand-held tools follow the elbow, while workbenches remain on the ground.
  root.updateMatrixWorld(true);
  arms.forEach((arm,i)=>{for(const child of [...arm.children])if(child.isGroup&&child!==forearms[i])forearms[i].attach(child);});
  let stride=0,lookYaw=0,lookPitch=0;
  const rest=arms.map(a=>a.rotation.clone());
  function update(time,moving,velocity=null,dt=1/60,attention=null){
    stride+=moving?dt*8.5:0;const breath=Math.sin(time*1.7+profile.variant)*.008;
    body.position.y=breath;body.rotation.x=profile.age==='elder'?.055:0;
    body.rotation.z=Math.sin(time*.63+profile.variant)*.012;
    body.position.x=Math.sin(time*.63+profile.variant)*.013;
    head.rotation.x=0;head.rotation.y=Math.sin(time*.37+profile.variant)*.055;
    legs.forEach((leg,i)=>{leg.rotation.x=moving?Math.sin(stride+i*Math.PI)*.35:0;});
    arms.forEach((arm,i)=>{arm.rotation.x=rest[i].x+(moving?-Math.sin(stride+i*Math.PI)*.24:Math.sin(time*1.2+i)*.025);});
    if(!moving&&profile.job==='smith')arms[1].rotation.x=-.35+Math.sin(time*1.5)*.16;
    activity?.update(time,moving);
    forearms.forEach((elbow,i)=>{const work=!moving&&profile.activity,flex=work?Math.min(.38,Math.abs(arms[i].rotation.x)*.24):.08;elbow.rotation.x=-flex-Math.sin(time*1.05+profile.variant+i)*.025;});
    const cycle=3.4+(profile.variant%5)*.37,blinkPhase=((time+profile.variant*.71)%cycle+cycle)%cycle,blink=blinkPhase<.16?Math.sin(blinkPhase/.16*Math.PI):0;
    eyes.scale.y=1-blink*.94;
    let targetYaw=0,targetPitch=0;
    if(attention&&!moving){const dx=attention.x-root.position.x,dz=attention.z-root.position.z,distance=Math.hypot(dx,dz),angle=Math.atan2(dx,dz)-root.rotation.y,yaw=Math.atan2(Math.sin(angle),Math.cos(angle));
      if(distance<6&&distance>.5&&Math.abs(yaw)<1.2){const focus=['forging','mining','reading','mourning'].includes(profile.activity)?.3:.8;targetYaw=yaw*focus;targetPitch=Math.max(-.12,Math.min(.12,(root.position.y+2.4-attention.y-2.2)/distance))*.5;}
    }
    const ease=1-Math.exp(-Math.max(0,dt)*5);lookYaw+=(targetYaw-lookYaw)*ease;lookPitch+=(targetPitch-lookPitch)*ease;
    head.rotation.y+=lookYaw;head.rotation.x=(head.rotation.x||0)+lookPitch;head.rotation.z=Math.sin(time*.49+profile.variant)*.017;
    brows.position.y=.09+Math.sin(time*.7+profile.variant)*.003;
    root.userData.expression={blink,lookYaw,lookPitch};
  }
  return {root,body,head,arms,forearms,legs,cloth,hair,update,workstation:activity?.station||null};
}
