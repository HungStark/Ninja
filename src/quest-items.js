import * as T from 'three';

export const QUEST_ITEM_MODELS={mourning:'flowers',forging:'ore',fishing:'net',mending:'cloth',farming:'seeds',watering:'medicine',mining:'minerals',repair:'tools',repairing:'tools',reading:'scroll',observing:'notes',market:'crate',pottery:'clay',offering:'lantern'};
export function questAction(item){
  if(item.kind==='sidequest-target')return item.questType==='combat'?'Đối mặt · ':item.questType==='survey'?'Khảo sát · ':'Thu thập · ';
  return item.kind==='expedition-goal'?'Thu thập · ':null;
}
export function createQuestItem({model='satchel',name=''}){
  const root=new T.Group();root.name='quest-item-'+model;root.userData.noCollision=true;root.userData.questItem={model,name};
  const mats=new Map(),M=(color,extra={})=>{if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:.86,...extra}));return mats.get(color);};
  const add=(geometry,material,x,y,z,sx=1,sy=1,sz=1)=>{const o=new T.Mesh(geometry,material);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.castShadow=o.receiveShadow=true;root.add(o);return o;};
  const box=(m,x,y,z,w,h,d)=>add(new T.BoxGeometry(w,h,d),m,x,y,z);
  const cyl=(m,x,y,z,r,h)=>add(new T.CylinderGeometry(r,r,h,8),m,x,y,z);
  const wood=M('#80613f'),linen=M('#d5c59b'),dark=M('#454b46'),green=M('#627947'),metal=M('#a1abb1',{metalness:.5,roughness:.4});
  if(model==='flowers'){
    const petal=new T.CircleGeometry(1,6),white=M('#f2ecdd',{side:T.DoubleSide}),gold=M('#d3ae49'),stemGeometry=new T.CylinderGeometry(.018,.022,1,5);
    for(let k=0;k<7;k++){
      const a=k*2.4,r=k? .16+(k%2)*.1:0,x=Math.sin(a)*r,z=Math.cos(a)*r,y=.7+(k%3)*.12;
      const stem=add(stemGeometry,green,x*.5,y*.5,z*.5);stem.scale.y=Math.hypot(x,y,z);stem.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(x,y,z).normalize());
      for(let ring=0;ring<2;ring++)for(let j=0;j<12;j++){const angle=j*Math.PI/6+ring*.2,rr=ring?.07:.11,o=add(petal,white,x+Math.sin(angle)*rr,y+ring*.012,z+Math.cos(angle)*rr,.045,ring?.075:.12,1);o.rotation.set(-Math.PI/2,0,-angle);}
      cyl(gold,x,y+.025,z,.045,.035);
      const leaf=add(new T.CircleGeometry(1,4),M('#728d50',{side:T.DoubleSide}),x*.5+.08,y*.48,z*.5,.13,.05,1);leaf.rotation.set(-.4,0,.6);
    }
    const wrap=add(new T.ConeGeometry(.2,.32,7,1,true),linen,0,.24,0);wrap.rotation.x=Math.PI;const ribbon=add(new T.TorusGeometry(.11,.025,4,10),M('#9d8567'),0,.33,0);ribbon.rotation.x=Math.PI/2;
  }else if(model==='scroll'||model==='notes'){
    const paper=box(linen,0,.16,0,.65,.035,.46);paper.rotation.y=-.2;
    for(const side of [-1,1]){const roll=cyl(linen,side*.32,.2,0,.065,.52);roll.rotation.x=Math.PI/2;}
    for(let k=0;k<4;k++)box(dark,-.04,.185,-.13+k*.08,.35-k*.035,.009,.012).rotation.y=-.2;
    box(M('#9c5a43'),.21,.19,.1,.08,.012,.09);
  }else if(model==='tools'){
    box(wood,0,.25,0,.76,.5,.48);box(dark,0,.54,0,.5,.075,.055);
    for(const x of [-.27,.27])box(metal,x,.3,.25,.065,.47,.025);
    const handle=cyl(wood,-.08,.71,0,.035,.62);handle.rotation.z=-.45;box(metal,-.21,.98,0,.33,.15,.16).rotation.z=-.45;
  }else if(model==='net'){
    const rope=M('#b8a77c');for(let k=0;k<7;k++){const coil=add(new T.TorusGeometry(.28+k%2*.05,.025,4,14),rope,Math.sin(k)*.04,.06+k*.045,Math.cos(k)*.04);coil.rotation.x=Math.PI/2;}
    for(let k=0;k<6;k++){box(rope,-.28+k*.11,.04,.5,.018,.025,.5);box(rope,0,.045,.25+k*.09,.6,.025,.018);}
    for(const x of [-.26,.26])add(new T.SphereGeometry(.065,6,4),M('#ba7751'),x,.08,.54);
  }else if(model==='cloth'){
    for(let k=0;k<3;k++)box(M(['#8ea89f','#b49c78','#d2c7a6'][k]),0,.09+k*.13,0,.7-k*.04,.12,.45);
    const spool=cyl(wood,.43,.17,.1,.12,.32);cyl(linen,.43,.17,.1,.105,.24);
  }else if(model==='medicine'){
    cyl(M('#527e6b'),0,.25,0,.2,.45);cyl(linen,0,.51,0,.1,.13);box(linen,0,.26,.2,.22,.21,.02);box(M('#687a47'),0,.27,.218,.05,.13,.01);
    for(let k=0;k<3;k++)add(new T.OctahedronGeometry(.13),green,.3,.19+k*.05,k*.1).scale.set(.7,1.6,.4);
  }else if(model==='lantern'){
    box(wood,0,.11,0,.42,.1,.42);box(M('#e0b363',{emissive:'#d79436',emissiveIntensity:.5}),0,.35,0,.3,.43,.3);box(wood,0,.61,0,.45,.09,.45);
    for(const x of [-.18,.18])for(const z of [-.18,.18])box(dark,x,.35,z,.045,.48,.045);
    add(new T.TorusGeometry(.11,.022,4,12),metal,0,.75,0);
  }else if(model==='crate'){
    box(wood,0,.28,0,.75,.55,.57);for(const x of [-.26,.26])box(dark,x,.29,.3,.045,.55,.025);box(linen,0,.3,.31,.22,.2,.02);
  }else{
    add(new T.SphereGeometry(1,8,5),model==='clay'?M('#ad7954'):linen,0,.25,0,.33,.29,.28);cyl(wood,0,.5,0,.12,.065);
    const contents=model==='ore'?metal:model==='minerals'?M('#9dabc5'):model==='clay'?M('#b78d67'):M('#bfa775');
    for(let k=0;k<5;k++)add(new T.DodecahedronGeometry(.1,0),contents,Math.sin(k*2)*.14,.5+(k%2)*.07,Math.cos(k*2)*.13);
  }
  return root;
}
