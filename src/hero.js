import * as T from 'three';

export function createHero(){
  const root=new T.Group(),body=new T.Group();root.name='silver-masked-hero';root.add(body);
  const mats=new Map(),M=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.86,flatShading:true}));return mats.get(c);};
  const cloth=M('#263747'),dark=M('#202a35'),skin=M('#ddae8c'),hair=M('#d6dce2'),silver=M('#acb7bb'),strap=M('#554736');
  const boxGeo=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,12,8);
  const mesh=(g,m,p,x,y,z,sx=1,sy=1,sz=1)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
  const box=(p,m,x,y,z,w,h,d)=>mesh(boxGeo,m,p,x,y,z,w,h,d);
  const ball=(p,m,x,y,z,w,h,d)=>mesh(sphere,m,p,x,y,z,w,h,d);
  const torso=mesh(new T.CylinderGeometry(.35,.29,1,8),cloth,body,0,1.64,0,1,1,.72);
  ball(body,dark,0,1.08,0,.33,.2,.23);box(body,strap,0,1.21,0,.69,.09,.48);
  mesh(new T.CylinderGeometry(.11,.13,.2,8),skin,body,0,2.21,0);
  const head=new T.Group();head.position.set(0,2.55,0);body.add(head);head.name='hero-face';
  ball(head,skin,0,0,0,.265,.335,.245);for(const side of [-1,1])ball(head,skin,side*.255,-.015,0,.04,.07,.045);
  const mask=ball(head,dark,0,-.19,.075,.271,.145,.215);mask.name='hero-face-mask';
  box(head,M('#e8e5d9'),.11,.025,.238,.12,.038,.016);box(head,M('#434f58'),.115,.028,.25,.035,.042,.011);box(head,dark,.11,.084,.228,.14,.025,.025).rotation.z=-.12;
  const band=box(head,dark,-.01,.16,.215,.62,.19,.09);band.rotation.z=.36;
  const patch=box(head,silver,-.125,.065,.279,.23,.18,.045);patch.rotation.z=.29;patch.name='hero-covered-eye';
  box(head,dark,-.13,.067,.307,.09,.022,.009).rotation.z=.9;box(head,dark,-.13,.067,.308,.075,.02,.009).rotation.z=-.7;
  const cap=mesh(new T.SphereGeometry(.29,10,6,0,Math.PI*2,0,Math.PI*.59),hair,head,0,.16,-.025);cap.scale.set(1,1.03,.91);
  for(let i=0;i<9;i++){const spike=mesh(new T.ConeGeometry(.095+i%3*.012,.35+i%3*.055,5),hair,head,-.28+i*.063,.38+Math.sin(i*.38)*.085,-.02+(i%2)*.06);spike.rotation.z=.43+(8-i)*.045;spike.rotation.x=-.25;spike.name='hero-silver-hair';}
  const legs=[],arms=[];
  for(const side of [-1,1]){
    const pivot=new T.Group();pivot.position.set(side*.18,1.08,0);body.add(pivot);
    mesh(new T.CylinderGeometry(.145,.12,.46,7),cloth,pivot,0,-.23,0);
    const knee=new T.Group();knee.position.y=-.46;pivot.add(knee);mesh(new T.CylinderGeometry(.115,.09,.43,7),dark,knee,0,-.215,.01);
    box(knee,silver,0,-.15,.102,.19,.19,.055);
    const foot=new T.Group();foot.position.y=-.43;knee.add(foot);box(foot,dark,0,-.08,.09,.23,.18,.38);box(foot,M('#b5b8a8'),0,-.055,.23,.21,.055,.095);
    legs.push({side,pivot,knee,foot});
    const arm=new T.Group();arm.position.set(side*.38,1.97,0);body.add(arm);const upper=mesh(new T.CylinderGeometry(.15,.13,.46,8),cloth,arm,side*.015,-.23,0);
    const elbow=new T.Group();elbow.position.set(side*.02,-.46,0);arm.add(elbow);const lower=mesh(new T.CylinderGeometry(.12,.09,.4,8),dark,elbow,0,-.2,.01);
    box(elbow,silver,0,-.19,.104,.14,.21,.035);const hand=ball(elbow,dark,0,-.46,.035,.09,.12,.08);
    arms.push({side,pivot:arm,upper,lower,elbow,hand});
  }
  const gear=new T.Group();gear.name='hero-equipment';body.add(gear);let gearKey='',equipment=null;
  function setEquipment(state){
    cloth.color.set(state?.hero?.coat||'#263747');hair.color.set(state?.hero?.hair||'#d6dce2');
    const armor=state?.armor||{id:'traveler',color:'#52684f',style:'vest'},bag=state?.bag||{id:'pouch-30',capacity:10};
    const key=armor.id+':'+bag.id;if(key===gearKey)return;gearKey=key;equipment={armor:armor.id,bag:bag.id};
    const geometries=new Set();gear.traverse(o=>{if(o.geometry)geometries.add(o.geometry);});for(const g of geometries)g.dispose();gear.clear();
    const plate=M(armor.color),trim=M(armor.elite?'#d4b56d':'#9b9f88');
    // Equipment owns its geometry so swapping it never disposes the live body.
    const b=(m,x,y,z,w,h,d)=>mesh(new T.BoxGeometry(w,h,d),m,gear,x,y,z);
    if(armor.style==='mantle'){
      const cape=mesh(new T.CylinderGeometry(.44,.52,.9,8,1,true),plate,gear,0,1.77,-.04);cape.scale.z=.65;
      for(const side of [-1,1])b(trim,side*.3,2.05,.1,.19,.14,.32);
    }else if(armor.style==='lamellar')for(let r=0;r<4;r++)for(const side of [-1,1])b(r%2?plate:trim,side*.18,1.93-r*.18,.232,.32,.16,.09);
    else{b(plate,0,1.72,0,.77,.85,.54);for(const side of [-1,1]){b(trim,side*.2,1.98,.295,.26,.055,.055);b(plate,side*.19,1.57,.31,.29,.27,.12);b(trim,side*.19,1.61,.379,.24,.035,.02);}}
    if(armor.style==='plate'||armor.elite)for(const side of [-1,1]){b(plate,side*.4,2.03,0,.27,.18,.38);b(trim,side*.41,2.12,.015,.25,.035,.35);}
    if(armor.style==='fur'){const collar=mesh(new T.TorusGeometry(.31,.09,6,14),M('#e0d9c9'),gear,0,2.11,0);collar.rotation.x=Math.PI/2;}
    if(armor.style==='wrap'){b(plate,0,1.65,.26,.65,.76,.07);b(trim,0,1.66,.315,.075,.72,.03).rotation.z=-.4;}
    b(dark,0,1.75,.325,.075,.75,.025);
    const size=bag.capacity>=50?1.65:bag.capacity>=30?1.4:bag.capacity>=20?1.15:1;
    b(strap,.32,1.09,-.19,.27*size,.31*size,.26*size);b(trim,.32,1.19,-.19-.14*size,.23*size,.07,.035);
    b(strap,.18,.77,-.15,.22,.28,.13);root.userData.equipment={...equipment};
  }
  setEquipment();let stride=0,localX=0,localZ=0;
  function update(time,moving,velocity=null,dt=1/60){
    const yaw=root.rotation.y,vx=moving?(velocity?.x??Math.sin(yaw)*4.6):0,vz=moving?(velocity?.z??Math.cos(yaw)*4.6):0,blend=1-Math.exp(-dt*14);
    localX+=(Math.cos(yaw)*vx-Math.sin(yaw)*vz-localX)*blend;localZ+=(Math.sin(yaw)*vx+Math.cos(yaw)*vz-localZ)*blend;
    const speed=Math.hypot(localX,localZ),weight=Math.min(1,speed/3),side=speed>.001?localX/speed:0,forward=speed>.001?localZ/speed:0,back=forward<0?1:0;stride+=speed*dt*(2.4+Math.abs(side)*.3);
    legs.forEach((leg,i)=>{const phase=stride+i*Math.PI,swing=Math.sin(phase)*weight,lift=Math.max(0,Math.cos(phase))*weight,knee=lift*(.5+back*.12);leg.pivot.rotation.x=-swing*forward*(back?.4:.58)-knee*.48;leg.pivot.rotation.z=swing*side*.34;leg.knee.rotation.x=knee;leg.foot.rotation.x=-leg.pivot.rotation.x-knee;leg.foot.rotation.z=-leg.pivot.rotation.z;arms[i].pivot.rotation.x=.06+swing*forward*.3;arms[i].pivot.rotation.z=-swing*side*.2;arms[i].elbow.rotation.x=-.13;});
    body.position.y=Math.sin(time*2)*.008*(1-weight)+Math.abs(Math.sin(stride))*.023*weight;body.rotation.x=forward*weight*.045;body.rotation.z=-side*weight*.05;
  }
  function airPose(v){legs.forEach((l,i)=>{l.pivot.rotation.x=-.3;l.pivot.rotation.z=0;l.knee.rotation.x=(v>0?.65:.38)+(i===0?.1:0);l.foot.rotation.x=-l.pivot.rotation.x-l.knee.rotation.x;});arms.forEach(a=>{a.pivot.rotation.x=-.6;a.pivot.rotation.z=-a.side*.22;});}
  function climbPose(t){arms.forEach((a,i)=>{a.pivot.rotation.x=-2+Math.sin(t*6+i*Math.PI)*.35;});legs.forEach((l,i)=>l.knee.rotation.x=.4+Math.sin(t*6+i*Math.PI)*.25);body.rotation.x=-.1;}
  return {root,group:root,cloth,hair,legs,arms,update,airPose,climbPose,setEquipment,locomotionState:()=>({side:localX,forward:localZ,speed:Math.hypot(localX,localZ),stride,legs:legs.map(l=>({hip:[l.pivot.rotation.x,l.pivot.rotation.z],knee:l.knee.rotation.x,ankle:l.foot.rotation.x})),lean:[body.rotation.x,body.rotation.z]}),get equipment(){return equipment;}};
}
