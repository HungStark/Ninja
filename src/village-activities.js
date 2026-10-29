import * as T from 'three';

export function createVillageActivity({root,body,head,arms,legs,profile,material}){
 const type=profile.activity,station=new T.Group();station.name='workstation-'+type;station.userData.resident=profile.id;root.add(station);
 const wood=material('#785a3e'),metal=material('#768080'),dark=material('#373c3b'),linen=material('#d0bc88'),green=material('#5e7d4e'),clay=material('#b5825e');
 const mesh=(g,m,p,x,y,z)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;};
 const box=(p,m,x,y,z,w,h,d)=>mesh(new T.BoxGeometry(w,h,d),m,p,x,y,z);
 const cyl=(p,m,x,y,z,r,h)=>mesh(new T.CylinderGeometry(r,r,h,7),m,p,x,y,z);
 const ball=(p,m,x,y,z,r)=>mesh(new T.IcosahedronGeometry(r,0),m,p,x,y,z);
 const beam=(p,m,a,b,r=.025)=>{const from=new T.Vector3(...a),to=new T.Vector3(...b),delta=to.clone().sub(from),o=mesh(new T.CylinderGeometry(r,r,delta.length(),5),m,p,...from.add(to).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;};
 const table=()=>{box(station,wood,0,1.02,1.12,1.65,.13,.85);for(const x of [-.65,.65])for(const z of [.8,1.45])box(station,wood,x,.5,z,.1,1,.1);};
 const flowers=(p,x,y,z)=>{const g=new T.Group();g.name='offering-flowers';g.position.set(x,y,z);p.add(g);for(let i=0;i<5;i++){const a=i*2.4,px=Math.sin(a)*.13,pz=Math.cos(a)*.12;beam(g,green,[0,0,0],[px,.32+i%2*.07,pz],.012);ball(g,material(i%2?'#d9b8b9':'#e4daca'),px,.35+i%2*.07,pz,.075);}return g;};
 let tool,turntable,sparks,water,cloth;
 if(['mourning','offering'].includes(type)){
  tool=flowers(arms[0],-.04,-.91,.12);tool.name='held-offering-flowers';tool.rotation.x=.45;flowers(station,-.15,.025,1.2);box(station,wood,.32,.035,1.3,.25,.05,.16);
 }
 if(type==='forging'){
  tool=root.getObjectByName('forging-hammer');tool?.position.set(0,-.22,.35);
  box(station,dark,.44,.42,.78,.48,.8,.5);box(station,metal,.44,.92,.78,.84,.22,.55);box(station,metal,.21,1.08,.78,.32,.1,.4);box(station,material('#e77835'),.42,1.09,.8,.3,.035,.09);
  box(station,dark,-1.2,.35,.9,.85,.7,.9);box(station,material('#ad5933'),-1.2,.73,.9,.62,.07,.65);for(let i=0;i<5;i++)ball(station,material('#d18b42'),-1.45+(i%3)*.22,.8,.72+Math.floor(i/3)*.25,.12);
  sparks=new T.Group();sparks.name='forge-sparks';sparks.position.set(.42,1.1,.8);station.add(sparks);const glow=new T.MeshBasicMaterial({color:'#ffc579'});for(let i=0;i<5;i++)ball(sparks,glow,0,0,0,.025);
 }
 if(type==='repair'){
  table();for(let i=0;i<3;i++)box(station,i%2?wood:linen,-.44+i*.44,1.13,1.12,.34,.09,.76);tool=new T.Group();tool.name='repair-hammer';arms[1].add(tool);beam(tool,wood,[.04,-.88,.12],[.04,-.53,.12],.025);box(tool,metal,.04,-.54,.12,.23,.12,.12);
 }
 if(type==='repairing'){
  box(station,dark,0,.71,1.1,.75,1.42,.45);box(station,wood,0,1.47,1.1,1,.1,.65);for(const x of [-.2,.2]){cyl(station,metal,x,1.65,1.1,.06,.37);const coil=mesh(new T.TorusGeometry(.12,.025,4,10),material('#b98d55'),station,x,1.72,1.12);coil.rotation.x=Math.PI/2;}
  tool=new T.Group();arms[1].add(tool);beam(tool,metal,[.05,-.9,.05],[.05,-.59,.05],.025);box(tool,metal,.05,-.6,.05,.13,.1,.055);
 }
 if(type==='mining'){
  const stone=mesh(new T.DodecahedronGeometry(.65,0),material('#8c7e68'),station,.1,.46,1.1);stone.scale.set(1.2,.72,.8);for(let i=0;i<4;i++)ball(station,clay,-.55+i*.28,.08,.7+(i%2)*.9,.11);
  tool=new T.Group();tool.name='working-pick';arms[1].add(tool);beam(tool,wood,[.05,-1.1,.08],[.05,-.53,.08],.026);box(tool,metal,.05,-.54,.08,.44,.09,.09);
 }
 if(type==='pottery'){
  cyl(station,wood,0,.37,1,.16,.7);turntable=cyl(station,wood,0,.76,1,.58,.12);const pot=mesh(new T.SphereGeometry(.27,9,6),clay,turntable,0,.24,0);pot.scale.y=1.18;cyl(turntable,dark,0,.5,0,.13,.025);box(station,wood,-.8,.34,.85,.36,.18,.5);
 }
 if(type==='watering'||type==='farming'){
  for(let i=0;i<5;i++){const x=-.6+(i%3)*.4,z=.75+Math.floor(i/3)*.5;cyl(station,clay,x,.14,z,.16,.25);const leaf=ball(station,green,x,.39,z,.17);leaf.scale.set(.6,1.5,.6);}
  tool=new T.Group();arms[1].add(tool);
  if(type==='watering'){cyl(tool,metal,.05,-.98,.2,.15,.24);beam(tool,metal,[.1,-.95,.2],[.34,-.9,.44],.035);const handle=mesh(new T.TorusGeometry(.15,.022,4,12),metal,tool,-.07,-.88,.19);water=beam(tool,material('#8aafb1'),[.34,-.9,.44],[.34,-1.24,.44],.008);}
  else{beam(tool,wood,[.03,-1.1,.1],[.03,-.22,.7],.025);box(tool,metal,.03,-1.1,.1,.34,.04,.16);}
 }
 if(type==='fishing'){
  tool=new T.Group();tool.name='fishing-rod';arms[1].add(tool);beam(tool,wood,[.04,-.86,.08],[.04,-.36,2.4],.018);beam(tool,linen,[.04,-.36,2.4],[.04,-1.2,2.65],.003);
  cyl(station,wood,-.75,.2,.35,.24,.4);for(let i=0;i<3;i++){const fish=ball(station,metal,-.78+i*.09,.42,.36,.1);fish.scale.set(.45,.45,1.8);}
 }
 if(type==='mending'){
  cloth=box(body,material(profile.accent),0,1.28,.67,.56,.035,.5);cloth.name='cloth-being-mended';for(let i=0;i<4;i++)box(body,linen,-.2+i*.13,1.31,.72,.018,.01,.29);cyl(station,wood,-.75,.17,.4,.24,.34);cyl(station,linen,-.75,.4,.4,.09,.15);
 }
 if(type==='reading'){
  const book=new T.Group();book.name='open-resident-book';book.position.set(0,1.53,.65);book.rotation.x=.15;body.add(book);for(const side of [-1,1]){const page=box(book,linen,side*.16,0,0,.31,.035,.4);page.rotation.z=side*.13;for(let j=0;j<4;j++)box(book,dark,side*.16,.028,-.1+j*.065,.19,.008,.009);}
 }
 if(['market','sorting'].includes(type)){
  table();for(let i=0;i<6;i++){const o=ball(station,material(i%2?'#8e9b79':'#bb9a62'),-.55+i%3*.5,1.21,.9+Math.floor(i/3)*.35,.14);if(profile.village==='water')o.scale.set(1.3,.4,.5);}
 }
 if(type==='observing'){
  for(const x of [-.4,.4])beam(station,wood,[x,0,1.1],[0,1.4,1.1],.035);beam(station,wood,[0,0,1.7],[0,1.4,1.1],.035);const scope=cyl(station,metal,0,1.5,1.1,.13,.9);scope.rotation.x=-1.05;box(station,wood,-.65,.7,1.2,.3,.08,.4);
 }
 if(type==='warming'){
  for(let i=0;i<6;i++){const a=i*Math.PI/3;ball(station,material('#837a6b'),Math.sin(a)*.45,.12,1.25+Math.cos(a)*.45,.17);}for(const a of [-.6,.6])box(station,wood,a*.18,.16,1.25,.55,.12,.12).rotation.y=a;const ember=ball(station,material('#cd8e4a'),0,.26,1.25,.19);ember.scale.set(.8,1.5,.8);
 }
 if(!station.children.length)root.remove(station);
 let offerReach=0;
 return {station:station.children.length?station:null,update(time,moving){
  if(moving)return;const t=time+profile.variant*.53;
  if(['mourning','offering'].includes(type)){
   if(profile.memorialOffering){
    offerReach=.5-.5*Math.cos(t*.7);body.position.y=0;body.rotation.x=.1;head.rotation.x=.2;arms[0].rotation.x=-.2-1.25*offerReach;arms[0].rotation.z=-.06;arms[1].rotation.x=0;arms[1].rotation.z=0;
    legs?.forEach(leg=>{leg.rotation.x=0;leg.rotation.z=0;});root.userData.residentPose={kind:'standing-offering',reach:offerReach};
   }else{body.rotation.x=.1+Math.sin(t*.6)*.025;head.rotation.x=.22;arms[0].rotation.x=-.6;arms[0].rotation.z=-.25;arms[1].rotation.x=-.45;arms[1].rotation.z=.25;}
  }
  if(type==='forging'){const phase=(t*.65)%1,lift=phase<.65?Math.sin(phase/.65*Math.PI/2):Math.max(0,1-(phase-.65)/.12);arms[1].rotation.x=-1.25*lift;arms[0].rotation.x=-.65;arms[0].rotation.z=.5;body.rotation.x=.04+lift*.035;if(sparks){const age=(phase-.77)/.23;sparks.visible=age>=0;for(let i=0;i<5;i++)sparks.children[i].position.set(Math.sin(i*2)*age*.42,Math.max(0,age*.8-age*age*.75),Math.cos(i*2)*age*.42);}}
  if(['repair','mining'].includes(type)){arms[1].rotation.x=-.45-Math.max(0,Math.sin(t*2.8))*.65;arms[0].rotation.x=-.6;body.rotation.x=.08;}
  if(type==='repairing'){arms[1].rotation.x=-.85;arms[1].rotation.z=.16+Math.sin(t*2)*.22;arms[0].rotation.x=-.75;head.rotation.x=.13;}
  if(type==='pottery'){arms.forEach((a,i)=>{a.rotation.x=-.8+Math.sin(t*1.2+i)*.05;a.rotation.z=i?-.32:.32;});body.rotation.x=.09;turntable.rotation.y=time*1.7;}
  if(type==='watering'){arms[1].rotation.x=-.65+Math.sin(t*.9)*.12;arms[1].rotation.z=.2;body.rotation.x=.05;water.visible=Math.sin(t*.9)>-.3;}
  if(type==='farming'){arms[1].rotation.x=-.4+Math.sin(t*.9)*.22;arms[0].rotation.x=-.35;body.rotation.x=.09;}
  if(type==='fishing'){arms[1].rotation.x=-.25+Math.sin(t*.8)*.035;arms[0].rotation.x=-.6;head.rotation.x=.08;}
  if(['mending','reading','warming'].includes(type)){arms.forEach((a,i)=>{a.rotation.x=-(type==='reading'?1.03:.72)+Math.sin(t*1.4+i)*.035;a.rotation.z=i?-.31:.31;});head.rotation.x=.15;if(cloth)cloth.rotation.z=Math.sin(t*.8)*.035;}
  if(['market','sorting'].includes(type)){arms[1].rotation.x=-.65+Math.sin(t*.9)*.16;arms[0].rotation.x=-.45;head.rotation.x=.08;}
  if(type==='observing'){head.rotation.x=-.08;arms[1].rotation.x=-1.05;arms[0].rotation.x=-.7;}
  if(type==='lookout'){head.rotation.y=Math.sin(t*.3)*.4;arms[1].rotation.x=-1.7;arms[1].rotation.z=-.2;}
  root.userData.activity={type,phase:t,...(profile.memorialOffering?{reach:offerReach}:{})};
 }};
}
