import * as T from 'three';

// These are buildings and silhouettes, rather than a single village template
// recoloured ten times. All coordinates here are local to a grounded group.
export function buildGabledRoof(c,g,w,d,eaveY,pitch=.44,material=c.M(c.v.roof),gable=null){
  const half=w/2+.55,rise=half*Math.tan(pitch),top=eaveY+rise;
  for(const side of [-1,1]){const panel=c.box(g,material,side*half/2,eaveY+rise/2,0,half/Math.cos(pitch)+.08,.22,d+1.2);panel.rotation.z=-side*pitch;panel.name='roof-slope';}
  c.box(g,material,0,top+.06,0,.24,.23,d+1.4).name='roof-ridge';
  if(gable){const edge=.55*Math.tan(pitch),shape=new T.Shape();shape.moveTo(-w/2,-.08);shape.lineTo(w/2,-.08);shape.lineTo(w/2,edge);shape.lineTo(0,rise);shape.lineTo(-w/2,edge);shape.closePath();const geometry=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false});c.mesh(geometry,gable,g,0,eaveY,-d/2).name='roof-gable';}
  return top;
}

export function buildHouse(c,x,z,w,d,index){
  const {id,v,group,box,cyl,mesh,M,obstacle}=c,g=group(x,z),wall=M(id==='earth'?'#bf9060':id==='light'?'#ebe1bd':id==='water'?'#9ab8b7':id==='dark'?'#766b83':'#cabda0'),timber=M('#49463f'),roof=M(v.roof),glow=M('#ecc184',.4);
  g.name='village-house';g.userData.footprint={x,z,w,d};
  const stilt=id==='water'?2.2:id==='wood'?1.5:0,levels=id==='light'||id==='lightning'?2:index%4===0?2:1,h=2.7*levels;
  if(c.heightAt){const corners=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([sx,sz])=>c.heightAt(x+sx*(w/2+.2),z+sz*(d/2+.2))),low=Math.min(...corners),high=Math.max(...corners,c.heightAt(x,z));g.position.y=high+.04;
    if(!stilt){const depth=high-low+.32;box(g,M(id==='earth'?'#957454':'#828477'),0,-depth/2,0,w+.3,depth,d+.3).name='house-foundation';}
    else for(const sx of [-1,1])for(const sz of [-1,1]){const px=sx*w*.42,pz=sz*d*.42,depth=g.position.y-c.heightAt(x+px,z+pz)+.2;box(g,timber,px,-depth/2,pz,.24,depth,.24);}
  }
  if(id==='earth'){
    for(let k=0;k<levels;k++)box(g,wall,0,1.4+k*2.5,0,w-k*.7,2.8,d-k*.5);
    box(g,roof,0,h+.35,0,w+.5,.35,d+.5);
    for(let k=-2;k<=2;k++)box(g,wall,k*w/5,h+.8,d/2,.6,.9,.6);
    cyl(g,wall,w*.43,h*.7,-d*.25,w*.19,h*1.4,7);
  }else if(id==='ice'){
    box(g,wall,0,1.25,0,w,2.5,d);
    const peak=mesh(new T.ConeGeometry(1,1,4),roof,g,0,4.4,0);peak.scale.set(w*.82,3.8,d*.82);peak.rotation.y=Math.PI/4;
    const snow=mesh(new T.ConeGeometry(1,1,4),M('#e7eff0'),g,0,4.85,0);snow.scale.set(w*.65,2.9,d*.65);snow.rotation.y=Math.PI/4;
    box(g,timber,-w*.31,3.5,-d*.22,.45,2.6,.45);
  }else if(id==='light'){
    box(g,wall,0,h/2,0,w,h,d);box(g,roof,0,h+.2,0,w+1,.35,d+1);
    for(const s of [-1,1])cyl(g,wall,s*(w*.5+.35),h*.45,d*.5,.3,h,8);
    const dome=mesh(new T.SphereGeometry(w*.44,12,7,0,Math.PI*2,0,Math.PI/2),roof,g,0,h+.35,0);dome.scale.y=.85;
    cyl(g,M('#c3a356'),0,h+w*.38,0,.1,1.3,6);
  }else if(id==='lightning'){
    cyl(g,wall,0,h/2,0,w*.6,h,6);cyl(g,roof,0,h+.15,0,w*.72,.35,6);
    cyl(g,timber,0,h+2,0,.13,4,6);
    for(let k=0;k<3;k++){const ring=mesh(new T.TorusGeometry(.65+k*.13,.07,4,14),M(v.color,.5),g,0,h+.7+k*.6,0);ring.rotation.x=Math.PI/2;}
  }else if(id==='wood'){
    cyl(g,timber,0,stilt*.5,0,w*.23,stilt+1,8);
    cyl(g,wall,0,stilt+1.5,0,w*.6,2.8,7);
    const cap=mesh(new T.ConeGeometry(w*.82,2.6,7),roof,g,0,stilt+3.9,0);cap.scale.z=d/w;
    for(let k=0;k<5;k++)box(g,timber,-w*.6+k*w*.3,stilt-.15,d*.65,.15,.2,d*.5);
    box(g,timber,0,stilt-.2,0,w*1.6,.24,d*1.5);
  }else{
    if(stilt){for(const sx of [-1,1])for(const sz of [-1,1])cyl(g,timber,sx*w*.42,stilt/2,sz*d*.42,.15,stilt,6);box(g,timber,0,stilt,0,w+1,.25,d+1);}
    box(g,wall,0,stilt+h/2,0,w,h,d);
    for(const sx of [-1,1])for(const sz of [-1,1])box(g,timber,sx*w/2,stilt+h/2,sz*d/2,.17,h+.2,.17);
    if(id==='wind'){
      const dome=mesh(new T.SphereGeometry(w*.65,10,6,0,Math.PI*2,0,Math.PI/2),roof,g,0,h,0);dome.scale.set(1,.8,d/w);
      const flag=box(g,M('#e3d6a8'),w*.3,h+2.7,0,2,1,.04);cyl(g,timber,w*.05,h+1.9,0,.07,4,5);c.animated.push({kind:'flag',mesh:flag});
    }else{
      const top=buildGabledRoof(c,g,w,d,stilt+h+.06,id==='dark'?.58:.44,roof,wall);
      if(id==='fire')for(const s of [-1,1]){const tip=box(g,roof,s*(w/2+.55),stilt+h+.13,0,.7,.2,d+1.2);tip.rotation.z=s*.22;}
      if(id==='dark')cyl(g,roof,0,top+.7,0,.09,1.4,6);
    }
    for(let floor=1;floor<=levels;floor++)box(g,timber,0,stilt+floor*2.7-.08,d/2+.045,w+.12,.13,.13);
  }
  box(g,timber,0,stilt+1, d/2+.04,.85,1.95,.12);
  for(const side of [-1,1])box(g,timber,side*.49,stilt+1,d/2+.09,.12,2.1,.16);box(g,timber,0,stilt+2.04,d/2+.09,1.1,.13,.16);
  const windowFloors=['ice','wood'].includes(id)?1:levels;
  for(let floor=0;floor<windowFloors;floor++)for(const side of [-1,1]){const ww=id==='earth'?w-floor*.7:w,dd=id==='earth'?d-floor*.5:d,y=stilt+1.65+floor*2.5;box(g,timber,side*ww*.31,y,dd/2+.075,.72,.86,.09);box(g,glow,side*ww*.31,y,dd/2+.13,.55,.68,.05);box(g,timber,side*ww*.31,y,dd/2+.17,.045,.7,.035);}
  if(stilt)for(let k=0;k<6;k++)box(g,timber,0,stilt-k*.35,d*.5+.25+k*.3,1.5,.2,.6);
  if(index%3===0){box(g,roof,0,stilt+2.3,d*.5+.7,w,.16,1.6);for(const s of [-1,1])cyl(g,timber,s*w*.4,stilt+1.2,d*.5+1.3,.08,2.4,5);}
  obstacle(x,z,w+.6,d+.6);
  return g;
}

export function buildDistrict(c,zone,index){
  const {id,v,group,box,cyl,mesh,M,animated}=c;
  // Place the large silhouette beside its arrival square. The square itself
  // stays open, with an unobstructed line of travel back to the village core.
  const a=Math.atan2(zone.x,zone.z),spot=c.setpieceSpot(zone),x=spot.x,z=spot.z,g=group(x,z),stone=M(id==='earth'?'#b58b5c':id==='fire'?'#544944':'#8c8c7c'),wood=M('#51483c'),roof=M(v.roof),white=M(id==='earth'?'#c8a276':'#d7d6bf'),accent=M(v.color,.35);
  const ring=(parent,r,y,material=accent)=>{const o=mesh(new T.TorusGeometry(r,.19,6,36),material,parent,0,y,0);return o;};
  const pillar=(px,pz,h=10,r=1.2,material=stone)=>cyl(g,material,px,h/2,pz,r,h,7);
  const giantTree=(px,pz,h=23,r=3)=>{cyl(g,wood,px,h*.4,pz,r,h*.8,9);for(let k=0;k<5;k++){const a=k*2.4;const crown=mesh(new T.IcosahedronGeometry(r*2.6,1),M(v.tree),g,px+Math.sin(a)*r*2,h*.78+Math.cos(k)*2,pz+Math.cos(a)*r*1.6);crown.scale.y=.65;}for(let k=0;k<5;k++){const a=k*Math.PI*.4;const root=box(g,wood,px+Math.sin(a)*r*1.4,r*.5,pz+Math.cos(a)*r*1.4,r*.7,r,5);root.rotation.y=a;}};
  const mill=(px,pz,h=10)=>{mesh(new T.ConeGeometry(2.2,h,8),white,g,px,h/2,pz);const rotor=new T.Group();rotor.position.set(px,h-1,pz+1.2);g.add(rotor);for(let k=0;k<4;k++){const arm=new T.Group();arm.rotation.z=k*Math.PI/2;rotor.add(arm);box(arm,wood,0,2.7,0,.18,6,.14);box(arm,white,.5,2.9,0,1.1,3.3,.08);}animated.push({kind:'windmill',mesh:rotor});};
  const portal=(h=12)=>{for(const s of [-1,1]){pillar(s*4,0,h,1,white);box(g,roof,s*1.8,h+.2,0,5.4,.5,1.5).rotation.z=s*.1;}box(g,roof,0,h+1,0,11,.5,2);};
  if(zone.id==='terraces'){
    for(let k=0;k<5;k++){box(g,M('#91866a'),0,k*.8,-k*2.7,16-k*1.5,.8,3.8);box(g,M('#a2b66e'),0,.43+k*.8,-k*2.7,15.6-k*1.5,.12,3.5);for(let j=0;j<7;j++)box(g,M('#738d55'),-6+j*1.8,.7+k*.8,-k*2.7,.1,.45,2.8);}return;
  }
  if(zone.id==='old-bridge'){
    for(let k=0;k<11;k++){const t=k/10,h=2+Math.sin(t*Math.PI)*3;box(g,stone,0,h,-10+k*2,5,.6,2.1);for(const s of [-1,1])box(g,stone,s*2.4,h+1,-10+k*2,.3,1.5,1.8);}for(const s of [-1,1])cyl(g,stone,0,2,s*7,1,4,7);return;
  }
  if(zone.id==='maple'){
    for(let k=0;k<5;k++){const px=Math.sin(k*2.4)*7,pz=Math.cos(k*2.4)*5,h=6+k%2*2;cyl(g,wood,px,h/2,pz,.4,h,7);for(let j=0;j<3;j++){const crown=mesh(new T.IcosahedronGeometry(3.5,0),M(j%2?'#bf593b':'#db8850'),g,px+(j-1)*1.8,h+1,pz);crown.scale.y=.6;}}return;
  }
  if(zone.id==='lotus'||zone.id==='frozen-lake'||zone.id==='mirror-pool'){
    const water=M(zone.id==='mirror-pool'?'#514868':zone.id==='frozen-lake'?'#91c7d7':'#6caaaa',.1),pool=mesh(new T.CylinderGeometry(10,10,.12,48),water,g,0,.08,0);pool.scale.z=.75;
    if(zone.id==='lotus')for(let k=0;k<18;k++){const a=k*2.4,r=2+k%6;const leaf=mesh(new T.CylinderGeometry(.9,.9,.04,8),M('#7d9b77'),g,Math.sin(a)*r,.2,Math.cos(a)*r*.7);mesh(new T.OctahedronGeometry(.32),M('#ebd9d0'),g,leaf.position.x,.5,leaf.position.z);}
    if(zone.id==='mirror-pool'){const moon=mesh(new T.TorusGeometry(3,.35,6,30),M('#b9acd0',.5),g,0,.24,0);moon.rotation.x=-Math.PI/2;}
    if(zone.id==='frozen-lake')for(let k=0;k<5;k++){const line=box(g,M('#d3e6e9'),Math.sin(k*2)*4,.17,Math.cos(k*2)*3,.06,.03,5);line.rotation.y=k;}
    for(const s of [-1,1]){box(g,wood,s*9,.5,0,2,.3,16);for(let k=-3;k<=3;k++)cyl(g,wood,s*9,.8,k*2,.1,1.6,5);}return;
  }
  if(zone.id==='shipyard'){
    for(let k=0;k<8;k++){const zz=-8+k*2.2,w=6-Math.abs(k-3.5)*.65;const rib=mesh(new T.TorusGeometry(w,.22,5,16,Math.PI),wood,g,0,3.5,zz);rib.rotation.z=Math.PI;box(g,wood,0,.5,zz,.4,.35,2.5);}for(const s of [-1,1])box(g,wood,s*4,1.6,0,.3,.7,17);cyl(g,wood,0,5,-2,.15,10,6);return;
  }
  if(zone.id==='potters'){
    for(let k=0;k<3;k++){const dome=mesh(new T.SphereGeometry(3.1,10,7,0,Math.PI*2,0,Math.PI/2),M('#b57e55'),g,-7+k*7,0,0);box(g,M('#493c34'),-7+k*7,.8,2.7,1.2,1.6,.2);cyl(g,M('#c3996a'),-7+k*7,4,0,.6,3,7);}for(let k=0;k<8;k++){const pot=mesh(new T.SphereGeometry(.6,7,6),M('#c98c61'),g,-7+k*2,.7,5);pot.scale.y=1.3;}return;
  }
  if(zone.id==='bamboo'){
    for(let k=0;k<28;k++){const a=k*2.4,r=3+k%7,px=Math.sin(a)*r,pz=Math.cos(a)*r*.7,h=10+k%5;const stem=cyl(g,M(k%2?'#6e925c':'#78996b'),px,h/2,pz,.15,h,5);stem.rotation.z=Math.sin(k)*.07;for(let j=0;j<3;j++){const leaf=box(g,M('#608e53'),px+Math.sin(j*2+k),h-2+j,pz,2.4,.06,.6);leaf.rotation.y=j*2+k;}}return;
  }
  if(zone.id==='elder-tree'){giantTree(0,0,35,5);const heart=mesh(new T.OctahedronGeometry(1.5),accent,g,0,8,5);animated.push({kind:'float',mesh:heart,base:8});return;}
  if(zone.id==='memorial'){
    for(let k=0;k<12;k++){const px=-7+k%4*4,pz=Math.floor(k/4)*4;const headstone=box(g,M('#696577'),px,1.8,pz,1.4,3.6,.65);headstone.rotation.z=Math.sin(k)*.13;const lamp=mesh(new T.OctahedronGeometry(.35),accent,g,px,3.9,pz);animated.push({kind:'float',mesh:lamp,base:3.9});}return;
  }
  index=({fire:[1,1,2,0],water:[0,2,1,3],wind:[0,2,1,3],light:[3,0,1,2],ice:[2,2,1,0],dark:[1,1,3,0]})[id]?.[index]??index;
  if(id==='nameless'){
    if(index===0){giantTree(0,0,24,3.3);for(let k=0;k<6;k++){const a=k*Math.PI/3;box(g,M('#d8c59d'),Math.sin(a)*4,2.6,Math.cos(a)*4,.45,2,.1).rotation.y=a;}}
    if(index===1){for(let k=0;k<3;k++){box(g,white,0,1.4+k*4,0,8-k*1.2,2.8,7-k);buildGabledRoof(c,g,8-k*1.2,7-k,2.85+k*4,.24,roof,white);}}
    if(index===2){for(let k=0;k<5;k++){const r=mesh(new T.DodecahedronGeometry(3.8-k*.25,0),stone,g,-4+k*2.3,2+k*2,0);r.scale.set(.6,1.5,.75);}portal(7);}
    if(index===3){portal(10);for(let k=0;k<7;k++)box(g,wood,-7+k*2.2,1.2,-4,1.4,2.4,1.4);}
  }
  if(id==='fire'){
    if(index===0){const cone=mesh(new T.ConeGeometry(13,23,10,1,true),M('#55443f'),g,0,9,0);const crater=ring(g,4.2,20,M('#ed7d3c',.9));crater.rotation.x=Math.PI/2;for(let k=0;k<5;k++){const lava=box(g,M('#db6b31',1),Math.sin(k*2)*4,5+k*2,Math.cos(k*2)*4,.7,9,.15);lava.rotation.z=.15+k*.12;}}
    if(index===1){for(let k=0;k<3;k++){cyl(g,M('#444447'),k*3-3,5+k%2*2,0,1.8,10+k%2*4,6);cyl(g,M('#302f32'),k*3-3,11+k%2*4,0,.8,4,7);}box(g,M('#dc782f',.8),0,.5,4,10,.25,2);}
    if(index===2){for(let k=0;k<4;k++){const arch=new T.Group();arch.position.z=k*3.3;g.add(arch);for(const s of [-1,1])box(arch,roof,s*3,3,0,.5,6,.5);box(arch,roof,0,6,0,8,.4,1);}}
    if(index===3){portal(12);for(const s of [-1,1]){mesh(new T.ConeGeometry(2.6,7,6),M('#ea8a42',.5),g,s*7,4,0);pillar(s*7,0,1.7,3,M('#3f3937'));}}
  }
  if(id==='water'){
    if(index===0){for(const s of [-1,1]){for(let k=0;k<6;k++)cyl(g,wood,s*3,1.5,-6+k*2.4,.18,4,6);}box(g,wood,0,2,0,7,.35,17);const ship=mesh(new T.SphereGeometry(1,12,7,0,Math.PI*2,Math.PI/2,Math.PI/2),M('#735648'),g,7,1,0);ship.scale.set(3,2,7);cyl(g,wood,7,6,0,.12,12,5);box(g,white,7,7,0,5,6,.06).rotation.y=.3;}
    if(index===1){for(let k=0;k<7;k++)pillar(-6+k*2,0,18-Math.abs(k-3)*2,1.3,M('#577a7b'));const fall=box(g,M('#8ecad7',.25),0,8,1.3,5,16,.16);fall.material.transparent=true;fall.material.opacity=.7;animated.push({kind:'waterfall',mesh:fall});}
    if(index===2){portal(8);const orb=mesh(new T.SphereGeometry(2.7,12,8),M('#7dc3d4',.4),g,0,6,0);orb.material.transparent=true;orb.material.opacity=.7;animated.push({kind:'float',mesh:orb,base:6});}
    if(index===3){for(let k=0;k<4;k++){const arch=new T.Group();arch.position.x=k*3.3;g.add(arch);cyl(arch,white,0,3,0,.4,6,8);box(arch,white,0,6.4,0,3.5,.5,2);}box(g,wood,5,1.8,3,15,.3,3);}
  }
  if(id==='earth'){
    if(index===0){for(let k=0;k<6;k++){const p=mesh(new T.CylinderGeometry(1.5,3.4,15+k%3*5,5),M(k%2?'#9a6f49':'#bb9469'),g,-9+k*3.5,7+k%3*2.5,0);p.rotation.z=(k-2)*.035;}}
    if(index===1){for(let k=0;k<4;k++)box(g,M('#bc9569'),0,2+k*3,-k*1.5,16-k*3,4,9-k);for(const s of [-1,1])pillar(s*6,6,12,1.5,M('#775741'));}
    if(index===2){portal(11);box(g,M('#4e403b'),0,3,-1,6,6,3);for(let k=0;k<7;k++)box(g,wood,-3+k,1,3,.2,.2,8);}
    if(index===3){for(let k=0;k<5;k++){box(g,M('#ad865a'),-4+k*2,1.2+k*.75,0,2,2.5+k*1.5,8);box(g,white,-4+k*2,2.6+k*1.5,0,2.2,.3,9);}}
  }
  if(id==='wind'){
    if(index===0){mill(-5,0,13);mill(4,-4,10);mill(10,3,8);}
    if(index===1){for(let k=0;k<5;k++){const a=k*1.5;const island=mesh(new T.DodecahedronGeometry(3,0),stone,g,Math.sin(a)*7,8+k*1.5,Math.cos(a)*4);island.scale.y=.5;mesh(new T.ConeGeometry(1.7,5,5),stone,g,island.position.x,island.position.y-2,island.position.z).rotation.z=Math.PI;}}
    if(index===2){for(let k=0;k<5;k++){cyl(g,wood,-8+k*4,5+k%2,0,.09,10+k%2*2,6);const f=box(g,M(k%2?v.color:'#e4dbc0'),-6.5+k*4,8+k%2,0,3,1.5,.05);animated.push({kind:'flag',mesh:f});}}
    if(index===3){portal(9);const harp=ring(g,4,6,white);for(let k=-3;k<=3;k++)box(g,accent,k,6,0,.04,6,.04);animated.push({kind:'halo',mesh:harp});}
  }
  if(id==='ice'){
    if(index===0){for(let k=0;k<7;k++){const ic=mesh(new T.OctahedronGeometry(2.8,0),M(k%2?'#80bbc9':'#d4ebea',.1),g,-8+k*2.8,7+k%3*3,0);ic.scale.set(.7,3+k%3,.9);}}
    if(index===1){portal(13);for(const s of [-1,1]){const spire=mesh(new T.ConeGeometry(2.3,12,6),accent,g,s*6,7,0);}}
    if(index===2){for(let k=0;k<5;k++){const dome=mesh(new T.SphereGeometry(2.9,10,7,0,Math.PI*2,0,Math.PI/2),M('#d7e5df'),g,-6+k*3,0,k%2*4);box(g,M('#536d7b'),-6+k*3,.7,k%2*4+2.8,1.1,1.4,.2);}}
    if(index===3){for(const s of [-1,1])pillar(s*5,0,11,1.3,white);const bridge=mesh(new T.TorusGeometry(5,.8,6,18,Math.PI),white,g,0,8,0);bridge.rotation.z=Math.PI;ring(g,2.7,11,accent);}
  }
  if(id==='lightning'){
    if(index===0){for(let k=0;k<4;k++){const h=17-k*2;pillar(-7+k*4,0,h,.5,M('#545064'));for(let j=0;j<3;j++){const coil=ring(g,1.7-j*.3,h-2+j,accent);coil.position.x=-7+k*4;coil.rotation.x=Math.PI/2;}}}
    if(index===1){for(let k=0;k<7;k++){const crystal=mesh(new T.OctahedronGeometry(2.2,0),accent,g,-7+k*2.4,4+k%3*2,0);crystal.scale.y=2+k%2;}}
    if(index===2){cyl(g,M('#666275'),0,8,0,4,16,6);for(let k=0;k<4;k++)cyl(g,M('#393846'),0,3+k*4,0,5,.4,6);const rotor=ring(g,5.5,15);rotor.rotation.x=Math.PI/3;animated.push({kind:'halo',mesh:rotor});}
    if(index===3){portal(12);const lightning=new T.Group();g.add(lightning);for(let k=0;k<5;k++){const bolt=box(lightning,accent,Math.sin(k*2)*1.3,9+k*1.6,0,.35,2.8,.35);bolt.rotation.z=k%2?.6:-.6;}animated.push({kind:'pulse',mesh:lightning});}
  }
  if(id==='wood'){
    if(index===0){giantTree(0,0,32,4.3);for(let k=0;k<4;k++){const root=box(g,wood,-9+k*6,3,1,1.5,4,7);root.rotation.z=(k-1.5)*.5;}}
    if(index===1){for(let k=0;k<5;k++){cyl(g,M('#c5b68c'),-7+k*3.5,1.8,0,.45,3.6,6);const cap=mesh(new T.SphereGeometry(2.5,10,6,0,Math.PI*2,0,Math.PI/2),M(k%2?'#91ac7b':'#829f96',.15),g,-7+k*3.5,3.4,0);cap.scale.y=.55;}}
    if(index===2){giantTree(-6,0,19,2.5);giantTree(6,0,21,2.8);box(g,wood,0,9,1,15,.5,3);for(const s of [-1,1])box(g,wood,0,10,s*1.5,15,.15,.12);}
    if(index===3){for(let k=0;k<7;k++){const a=k/7*Math.PI*2;pillar(Math.sin(a)*6,Math.cos(a)*6,7,1.3);mesh(new T.IcosahedronGeometry(2.4,0),M(v.tree),g,Math.sin(a)*6,7.5,Math.cos(a)*6);}const heart=mesh(new T.OctahedronGeometry(2),accent,g,0,5,0);animated.push({kind:'float',mesh:heart,base:5});}
  }
  if(id==='light'){
    if(index===0){portal(16);const sun=ring(g,4.5,17,M('#e4bc5b',.5));for(let k=0;k<12;k++){const a=k*Math.PI/6;const ray=mesh(new T.ConeGeometry(.4,2,4),M('#ebc96c',.4),g,Math.sin(a)*6,17+Math.cos(a)*6,0);ray.rotation.z=-a;}}
    if(index===1){for(let k=0;k<5;k++)pillar(-8+k*4,0,13+k%2*3,.65,white);box(g,white,0,15,0,19,.8,3);for(let k=0;k<4;k++)box(g,M('#e0c783'),-6+k*4,7,0,2.5,10,.15);}
    if(index===2){cyl(g,white,0,3,0,5,6,12);const sphere=mesh(new T.SphereGeometry(4.5,16,10,0,Math.PI*2,0,Math.PI/2),M('#b99b5a'),g,0,6,0);for(const s of [-1,1])pillar(s*7,0,17,1,white);const halo=ring(g,3.2,13);halo.rotation.x=.4;animated.push({kind:'halo',mesh:halo});}
    if(index===3){for(let k=0;k<5;k++){const beam=mesh(new T.OctahedronGeometry(1.8,0),M('#ede5b4',.55),g,-6+k*3,7+k%2*3,0);beam.scale.y=4;}portal(10);}
  }
  if(id==='dark'){
    if(index===0){portal(16);const moon=mesh(new T.TorusGeometry(4.5,.9,8,30,Math.PI*1.55),M('#bbb0dc',.4),g,0,16,0);moon.rotation.z=-.8;}
    if(index===1){for(let k=0;k<7;k++){const a=k*2.4;const branch=box(g,M('#413b4c'),Math.sin(a)*6,6+k%2*3,Math.cos(a)*4,.7,14+k%2*6,.7);branch.rotation.z=Math.sin(a)*.3;const lamp=mesh(new T.OctahedronGeometry(.8),accent,g,branch.position.x+1.1,5+k%3*2,branch.position.z);animated.push({kind:'float',mesh:lamp,base:lamp.position.y});}}
    if(index===2){for(let k=0;k<4;k++){box(g,M('#656076'),0,1+k*3,-k,12-k*2,2.6,8-k);for(const s of [-1,1])box(g,roof,s*(3-k*.5),2.8+k*3,-k,8-k,.35,11-k).rotation.z=s*.32;}cyl(g,accent,0,15,-3,.12,5,6);}
    if(index===3){for(let k=0;k<8;k++){const a=k*Math.PI/4;const monolith=box(g,M('#575062'),Math.sin(a)*7,4+k%3*2,Math.cos(a)*7,1.8,8+k%3*4,1.7);monolith.rotation.z=Math.sin(a)*.18;}const heart=mesh(new T.OctahedronGeometry(2.3),accent,g,0,7,0);animated.push({kind:'float',mesh:heart,base:7});}
  }
}

export function buildBoss(c,boss){
  const {id,v,group,box,cyl,mesh,M,animated}=c,g=group(boss.x,boss.z),body=new T.Group();g.add(body);
  const dark=M(id==='ice'?'#90bdcd':id==='earth'?'#9d7c58':id==='wood'?'#665b42':id==='light'?'#cabd88':id==='water'?'#3f7c8a':'#454250'),accent=M(v.color,.75),bone=M('#ddd0ab');
  // Every guardian has a creature silhouette and a visible heart. None reuse
  // the small ninja rig used by roaming encounters.
  if(id==='dark'){
    const cloak=mesh(new T.ConeGeometry(5.5,12,9,1,true),dark,body,0,6,0);cloak.scale.z=.6;
    const mask=mesh(new T.SphereGeometry(2.2,10,7),bone,body,0,12,0);mask.scale.set(1,1.3,.45);
    for(const s of [-1,1]){box(body,M('#352c46'),s*.75,12.2,1.9,.3,.65,.1);const arm=mesh(new T.ConeGeometry(1.6,8,6),dark,body,s*4.6,7,0);arm.rotation.z=s*.8;}
    const eclipse=mesh(new T.TorusGeometry(6,.5,6,40),accent,body,0,12,-3);animated.push({kind:'halo',mesh:eclipse});
  }else if(id==='lightning'){
    const torso=mesh(new T.IcosahedronGeometry(3.4,1),dark,body,0,6,0);torso.scale.set(1,1,1.6);
    mesh(new T.IcosahedronGeometry(1.8),dark,body,0,9,2.8);const beak=mesh(new T.ConeGeometry(.7,2.7,5),bone,body,0,8.7,4.6);beak.rotation.x=Math.PI/2;
    for(const s of [-1,1]){for(let k=0;k<5;k++){const feather=mesh(new T.OctahedronGeometry(1.4),k%2?accent:dark,body,s*(3.3+k*1.3),7-k*.6,-k*.4);feather.scale.set(.8,4-k*.25,.3);feather.rotation.z=-s*(.9+k*.08);}cyl(body,bone,s*1.5,2.2,1,.26,4.4,6);box(body,bone,s*1.5,.35,2,1.5,.5,2.7);}
    for(let k=0;k<3;k++)mesh(new T.ConeGeometry(.35,2.4,4),accent,body,-.8+k*.8,11,2.2).rotation.x=-.3;
  }else if(id==='wind'||id==='ice'){
    const torso=mesh(new T.IcosahedronGeometry(3.8,1),dark,body,0,4.2,-1);torso.scale.set(1.1,.9,1.7);
    for(const s of [-1,1])for(const zz of [-4,2]){cyl(body,dark,s*2.2,1.8,zz,.8,3.6,7);box(body,bone,s*2.2,.5,zz+.4,1.7,.8,2.3);}
    const head=mesh(new T.IcosahedronGeometry(2.7,1),id==='ice'?M('#e4edeb'):bone,body,0,6,4);head.scale.set(1.1,1,1.4);
    for(const s of [-1,1]){mesh(new T.ConeGeometry(.6,3.5,5),accent,body,s*1.7,9,3.6).rotation.z=-s*.3;box(body,accent,s*1,6.5,6.4,.5,.3,.12);}
    for(let k=0;k<7;k++){const a=k*Math.PI*2/7;const mane=mesh(new T.OctahedronGeometry(1.7),id==='ice'?accent:bone,body,Math.sin(a)*3.2,5.5+Math.cos(a)*3,2);mane.scale.y=1.7;mane.rotation.z=-a;}
  }else if(['water','fire'].includes(id)){
    for(let k=0;k<9;k++){const a=k*.5,seg=mesh(new T.IcosahedronGeometry(2.5-k*.15,1),k%3===0?accent:dark,body,Math.sin(a)*4,2+k*.7,-k*1.3);seg.scale.set(1,.85,1.3);}
    const head=mesh(new T.IcosahedronGeometry(3.2,1),dark,body,0,6.4,2);head.scale.set(1.15,.8,1.4);
    for(const s of [-1,1]){mesh(new T.ConeGeometry(.6,3.3,5),bone,body,s*2,9,1).rotation.z=-s*.5;mesh(new T.SphereGeometry(.37,8,5),accent,body,s*1.6,6.9,4.3);const wing=mesh(new T.ConeGeometry(1,1,3),id==='water'?dark:accent,body,s*5.2,6.2,-2);wing.scale.set(5,7,.35);wing.rotation.z=-s*.9;if(id==='water')wing.rotation.x=1;}
    box(body,bone,0,5.1,5,3.6,.35,.8);
  }else if(id==='wood'||id==='nameless'){
    const torso=mesh(new T.IcosahedronGeometry(3.8,1),dark,body,0,5.5,0);torso.scale.y=1.4;
    for(const s of [-1,1]){const leg=cyl(body,dark,s*2,2,0,1,4,6);const arm=cyl(body,dark,s*4.3,5.5,.5,1.1,6,7);arm.rotation.z=s*.3;for(let k=0;k<3;k++){const antler=cyl(body,bone,s*(1+k*.55),10+k*.5,0,.18,3-k*.4,5);antler.rotation.z=s*(.4+k*.3);}}
    const head=mesh(new T.DodecahedronGeometry(2.1),dark,body,0,9,0);head.scale.z=.75;
    for(const s of [-1,1])box(body,accent,s*.8,9.3,1.55,.55,.25,.12);
    if(id==='wood')for(let k=0;k<5;k++)mesh(new T.IcosahedronGeometry(2.6),M(v.tree),body,Math.sin(k*2)*3,10+Math.cos(k)*2,-1.5);
  }else{
    const torso=mesh(new T.IcosahedronGeometry(4,1),dark,body,0,5.5,0);torso.scale.set(1.2,1.2,.7);
    for(const s of [-1,1]){box(body,dark,s*2.2,1.9,0,2.2,3.8,2.5);const arm=mesh(new T.DodecahedronGeometry(2),dark,body,s*5,5.2,0);arm.scale.y=1.8;const shoulder=mesh(new T.OctahedronGeometry(2.3),accent,body,s*4.3,8,0);shoulder.scale.y=1.5;}
    mesh(new T.DodecahedronGeometry(2.1),dark,body,0,10,0);box(body,accent,0,10.2,1.8,2,.35,.15);
    for(let k=0;k<5;k++){const crown=mesh(new T.ConeGeometry(.5,3+k%2,5),bone,body,-2+k,12,0);crown.rotation.z=(k-2)*-.15;}
    if(id==='light'){const halo=mesh(new T.TorusGeometry(4,.25,6,32),accent,body,0,11,-2);animated.push({kind:'halo',mesh:halo});}
    if(id==='lightning'){const halo=mesh(new T.TorusGeometry(5,.22,6,32),accent,body,0,7,-2);halo.rotation.x=.7;animated.push({kind:'halo',mesh:halo});}
  }
  const heart=mesh(new T.OctahedronGeometry(.9),accent,body,0,5.8,3);animated.push({kind:'boss',mesh:body,base:0},{kind:'pulse',mesh:heart});
  const arena=mesh(new T.RingGeometry(7.9,8.1,64),M(v.color,.25),g,0,.08,0);arena.rotation.x=-Math.PI/2;
  return {root:g,body};
}
