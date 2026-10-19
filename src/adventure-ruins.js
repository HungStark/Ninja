import * as T from 'three';

// Vô Danh's cottages retain a recognisable home beneath the damage: plaster,
// wattle and a steep straw roof, rather than a frame of burnt square posts.
export function buildThatchedRuin(c,g,w,d,index){
  const {box,mesh,M}=c,h=2.65+(index%3)*.16,half=w/2+.62,pitch=.65,rise=half*Math.tan(pitch),depth=d+1.25;
  const timber=M('#494236'),raw=M('#716047'),dark=M('#393a31'),stone=M('#827b68'),plaster=[M('#b4a788'),M('#a4987c'),M('#c0b092')],straw=['#95804f','#a18a57','#84734b','#ac935e'].map(color=>M(color));
  g.userData.ruined=true;g.userData.style='abandoned-thatch';
  const shell=new T.Group();shell.name='thatched-ruin';g.add(shell);
  box(shell,dark,0,.09,0,w,.15,d);
  const beam=(a,b,r=.09,material=timber)=>{const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p),o=mesh(new T.CylinderGeometry(r*.7,r,v.length(),5),material,shell,...p.clone().add(q).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o;};
  // Closed exterior walls: each plaster face is authored once. The former lower
  // side strips overlapped the tall wall panels and fought for the same depth.
  const door=1.35,window=.68,wx=w*.33,front=d/2;
  box(shell,plaster[index%3],0,h/2,front,w,h,.23).name='ruin-front-wall';
  box(shell,plaster[1],0,h/2,-d/2,w,h,.26).name='ruin-rear-wall';
  for(const s of [-1,1]){
    box(shell,dark,s*wx,1.66,front+.137,window,1.04,.035);
    for(const px of [s*wx-window/2,s*wx+window/2])box(shell,timber,px,1.66,front+.055,.09,1.06,.18);
    for(const yy of [1.14,2.18])box(shell,raw,s*wx,yy,front+.07,window+.18,.1,.18);
    const shutter=box(shell,timber,s*(wx+.32),1.52,front+.18,.3,.78,.055);shutter.rotation.z=s*.27;shutter.rotation.y=s*.35;
    box(shell,timber,s*(door/2+.04),1.06,front+.06,.12,2.15,.19);
  }
  box(shell,timber,0,2.2,front+.06,1.2,.15,.22);
  // A breached-looking door is only a facade. The cottage keeps its single,
  // closed collision volume, so splinters cannot trap or admit the character.
  const brokenDoor=new T.Group();brokenDoor.name='ruin-broken-door';brokenDoor.userData.closed=true;brokenDoor.userData.splintered=true;shell.add(brokenDoor);
  box(brokenDoor,dark,0,1.055,front+.145,door,2.08,.025);
  const plank=(x,y,length,k,tilt=0)=>{const width=.18,shape=new T.Shape();shape.moveTo(-width/2,0);shape.lineTo(width/2,0);shape.lineTo(width/2,length-.08);shape.lineTo(width*.22,length-.03);shape.lineTo(0,length-.14);shape.lineTo(-width*.2,length);shape.lineTo(-width/2,length-.06);shape.closePath();const o=mesh(new T.ExtrudeGeometry(shape,{depth:.065,bevelEnabled:false}),k%2?raw:timber,brokenDoor,x,y,front+.19+(k%2)*.018);o.rotation.z=tilt;return o;};
  for(let k=0;k<6;k++){
    const x=-door/2+.12+k*.22;
    if(k!==3)plank(x,.025,.4+(k%3)*.16,k,(k-2)*.018);
    if(k!==4){const length=.57+((index+k)%3)*.18,o=plank(x,2.07-length,length,k+1,(k%2?1:-1)*(.025+(index%3)*.025));o.rotation.y=(k-2)*.025;}
  }
  const brace=box(brokenDoor,raw,-.38,.65,front+.29,.43,.1,.075);brace.rotation.z=.24;
  const snapped=box(brokenDoor,timber,.4,1.59,front+.3,.36,.08,.075);snapped.rotation.z=-.18;
  for(let k=0;k<2;k++){const fallen=box(brokenDoor,k?raw:timber,-.3+k*.52,.035+k*.018,front+.56+k*.1,.16,.045,.92-k*.1);fallen.rotation.y=.45+k*.8;}
  // Recessed dark windows retain the abandoned silhouette without entry gaps.
  box(shell,dark,0,1.67,-d/2-.153,.9,1.05,.036);
  for(const s of [-1,1])box(shell,timber,s*.46,1.67,-d/2-.06,.1,1.15,.17);
  for(const yy of [1.1,2.23])box(shell,timber,0,yy,-d/2-.06,1.02,.1,.17);
  box(shell,timber,.08,1.62,-d/2-.06,.055,1.05,.1).rotation.z=.14;
  for(const s of [-1,1]){
    box(shell,plaster[(index+1)%3],s*w/2,h/2,0,.25,h,d-.27).name='ruin-side-wall';
    // Exposed wattle sits beyond the plaster surface rather than inside it.
    for(let k=0;k<5;k++)beam([s*(w/2+.16),.35,-d*.15+k*d*.11],[s*(w/2+.16),h-.15,-d*.15+k*d*.11],.025,raw);
    for(let k=0;k<4;k++)box(shell,raw,s*(w/2+.18),.8+k*.39,.1,.035,.035,d*.7);
    for(const zz of [-d/2,d/2])beam([s*w/2,0,zz],[s*w/2+(s===1?.08:0),h+.1,zz],.11);
    beam([s*w/2,h,front],[0,h+rise,front],.09);
  }
  beam([0,h+rise,-depth/2],[0,h+rise+.02,depth/2],.13);
  for(const zz of [-d/2,d/2]){
    const shape=new T.Shape();shape.moveTo(-w/2,0);shape.lineTo(w/2,0);shape.lineTo(w*.29,rise*.33);shape.lineTo(w*.22,rise*.31);shape.lineTo(w*.12,rise*.65);shape.lineTo(-w*.1,rise*.77);shape.lineTo(-w*.22,rise*.6);shape.closePath();
    mesh(new T.ExtrudeGeometry(shape,{depth:.18,bevelEnabled:false}),plaster[1],shell,0,h-.07,zz-.09);
  }
  // Exposed rafters remain continuous underneath missing patches of thatch.
  for(let k=0;k<8;k++)for(const s of [-1,1]){const zz=-depth/2+k*depth/7;beam([s*half,h-.08,zz],[0,h+rise,zz],.065);}
  const rows=4,cols=13,holeColumn=4+index%4,holeSide=index%2?1:-1;
  for(const s of [-1,1])for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    if((s===holeSide&&row>0&&row<3&&col>=holeColumn&&col<=holeColumn+2)||(s===-holeSide&&row===3&&col===1+(index%3))||(index%4===0&&s===holeSide&&row>=2&&col>=cols-4))continue;
    const q=(row+.5)/rows,x=s*q*half,z=-depth/2+(col+.5)*depth/cols,jitter=Math.sin(index*17+row*7+col*3)*.06;
    const patch=box(shell,straw[2],x,h+(1-q)*rise+jitter,z,half/rows/Math.cos(pitch)+.17,.24,depth/cols+.12);patch.rotation.z=-s*pitch+jitter*.15;
    // Tapered, overlapping straw bundles obscure the square underlayer. Each
    // bundle ends at a different point, so the roof reads as thatch, not shingles.
    for(let j=0;j<3;j++){
      const zf=z+(j-1)*depth/cols*.33,q1=(row+.01)/rows,q2=Math.min(1.1,(row+1.2+(col+j)%3*.07)/rows),xf=s*(q1+q2)*half/2,yf=h+(1-(q1+q2)/2)*rise+.19+jitter;
      const fibre=mesh(new T.CylinderGeometry(.018,.047+(j%2)*.012,(q2-q1)*half/Math.cos(pitch),4),straw[(col+j+index)%4],shell,xf,yf,zf);fibre.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(s*Math.cos(pitch),-Math.sin(pitch),0));
    }
  }
  for(const s of [-1,1])for(let k=0;k<34;k++){if(index%4===0&&s===holeSide&&k>=25)continue;const zz=-depth/2+k*depth/33,drop=.18+(k%5)*.045;beam([s*(half-.09),h+.12,zz],[s*(half+.15),h-drop,zz+.04],.028,straw[(k+index)%4]);beam([s*(half+.15),h-drop,zz+.04],[s*(half+.18),h-drop-.16,zz-.025],.018,straw[(k+index+1)%4]);}
  // Broken chimney, exposed masonry, cracks and fallen roof timbers.
  for(let k=0;k<5;k++)box(shell,k%2?stone:plaster[1],-w*.28,h+rise*.55+k*.27,-d*.25,.55-(k===4?.2:0),.25,.57);
  for(let k=0;k<18;k++){const s=k%2?1:-1,px=s*(w*.2+Math.sin(k*3)*w*.22),py=.22+(k%3)*.22;box(shell,stone,px,py,front+.14,.25+(k%3)*.08,.15,.08);}
  for(let k=0;k<7;k++){const crack=box(shell,dark,w*.41-(k%3)*.14,.4+k*.27,front+.135,.022,.37,.016);crack.rotation.z=k%2?.45:-.38;}
  for(let k=0;k<12;k++){const px=(k%4-1.5)*w*.19,py=.23+Math.floor(k/4)*.35;box(shell,k%3?stone:raw,px,py,-d/2-.145,.18+(k%3)*.07,.16,.035);if(k<7){const crack=box(shell,dark,w*.33-(k%3)*.1,.64+k*.21,-d/2-.15,.02,.4,.012);crack.rotation.z=k%2?.32:-.34;}}
  for(const zz of [-d/2-.14,d/2+.14])for(let k=0;k<4;k++){const stain=mesh(new T.IcosahedronGeometry(.38,0),M(k%2?'#817e5d':'#8e8666'),shell,(k%2?1:-1)*w*.38,.34+k*.18,zz);stain.scale.set(.65,1,.035);stain.rotation.z=k*.7;}
  for(let k=0;k<9;k++){const a=index+k*2.4,r=w*.5+.4+(k%3)*.22,piece=mesh(new T.DodecahedronGeometry(.19+k%3*.055,0),k%2?plaster[1]:stone,shell,Math.sin(a)*r,.12,Math.cos(a)*(d*.5+.4));piece.scale.y=.55;}
  for(let k=0;k<3;k++){const log=box(shell,timber,w*.47+k*.13,.13,front+.55,.12,.14,1.2+k*.25);log.rotation.set(.1,k*.55+.6,.12);}
  // Sparse ivy clings to the shaded wall; its dull colour leaves the ruin dominant.
  for(let vine=0;vine<3;vine++){
    const vx=-w*.45+vine*.22;beam([vx,.1,front+.18],[vx+.18,h-vine*.38,front+.18],.017,M('#555943'));
    for(let k=0;k<10-vine;k++){const leaf=mesh(new T.IcosahedronGeometry(.17,0),M(k%3?'#656c49':'#7c7a50'),shell,vx+Math.sin(k*2+vine)*.21,.24+k*.25,front+.2);leaf.scale.set(1,.6,.4);}
  }
  for(const zz of [-d/2-.17,d/2+.17])for(let k=0;k<9;k++){const tuft=mesh(new T.ConeGeometry(.09,.42,4),M('#7a7751'),shell,-w*.4+(k%3)*.14,.18,zz+(k%2)*.05);tuft.rotation.z=Math.sin(k)*.3;}
}

export function buildWarCemetery(c,zone){
  const {box,cyl,mesh,M}=c,g=c.group(zone.x,zone.z),rotation=Math.atan2(-zone.x,-zone.z);g.name='war-cemetery';g.rotation.y=rotation;
  g.userData.graves=16;g.userData.walkableAisle=true;
  const stone=M('#77776b'),pale=M('#94907c'),earth=M('#6f6851'),wood=M('#4d493b'),moss=M('#666c4b'),ink=M('#45473e');
  const at=(x,z)=>{const wx=zone.x+Math.cos(rotation)*x+Math.sin(rotation)*z,wz=zone.z-Math.sin(rotation)*x+Math.cos(rotation)*z;return c.heightAt(wx,wz)-g.position.y;};
  for(let row=0;row<4;row++)for(const side of [-1,1])for(let col=0;col<2;col++){
    const x=side*(4.4+col*3),z=-6+row*3.7,base=at(x,z),n=row*4+col*2+(side===1?1:0),grave=new T.Group();grave.position.set(x,base,z);grave.rotation.y=Math.sin(n*4)*.12;g.add(grave);
    const mound=mesh(new T.SphereGeometry(1,8,4,0,Math.PI*2,0,Math.PI/2),earth,grave,0,.015,.68);mound.scale.set(.73,.24,1.18);
    const head=box(grave,n%3?pale:stone,0,.57,-.28,.68,1.12,.24);head.rotation.z=Math.sin(n*3)*.16;
    const cap=mesh(new T.CylinderGeometry(.34,.34,.24,7,1,false,0,Math.PI),n%3?pale:stone,grave,0,1.11,-.28);cap.rotation.x=Math.PI/2;cap.rotation.z=head.rotation.z;
    for(let k=0;k<3;k++)box(grave,ink,-.08,.8-k*.15,-.143,.2-(k===2?.07:0),.025,.014);
    box(grave,moss,-.19,.15,-.13,.26,.22,.025);
    if(n%3===0){const offering=box(grave,wood,.17,.11,.13,.25,.04,.28);offering.rotation.y=.3;for(let k=0;k<3;k++)cyl(grave,M('#948563'),.1+k*.055,.22,.14,.012,.28,4);}
    if(n===6||n===11){head.rotation.z=.9;head.position.y=.27;cap.visible=false;}
    for(let k=0;k<3;k++){const dry=mesh(new T.ConeGeometry(.025,.36,3),M('#8a7d59'),grave,-.45+k*.11,.16,.1+(k%2)*.16);dry.rotation.z=(k-1)*.38;}
  }
  // The central lane and the path toward the village stay clear for walking.
  for(const side of [-1,1])for(let k=0;k<8;k++){const x=side*9.1,z=-8+k*2.65,y=at(x,z),post=box(g,wood,x,y+.42,z,.13,.85,.14);post.rotation.z=Math.sin(k*3)*.17;if(k%3!==1){const rail=box(g,wood,x,y+.59,z+1,.09,.1,2.3);rail.rotation.x=(k%3===0?.12:-.07);}}
  for(const side of [-1,1]){const x=side*2.1,z=9.7,y=at(x,z);cyl(g,stone,x,y+.6,z,.28,1.2,6);box(g,pale,x,y+1.25,z,.7,.18,.7);}
  const memorialY=at(0,-8.9);box(g,stone,0,memorialY+.12,-8.9,2.4,.24,1.7);const tablet=box(g,pale,0,memorialY+1.15,-8.9,1.32,2.1,.4);tablet.rotation.z=-.075;
  for(const side of [-1,1]){const x=side*9.2,z=-8.4,y=at(x,z),tree=cyl(g,wood,x,y+2.3,z,.15,4.6,5);tree.rotation.z=side*.07;for(let k=0;k<3;k++){const start=new T.Vector3(x,y+1.7+k*.65,z),end=start.clone().add(new T.Vector3(side*(.8+k*.12),.7,Math.sin(k*3)*.7)),delta=end.clone().sub(start),branch=mesh(new T.CylinderGeometry(.023,.065,delta.length(),4),wood,g,...start.clone().add(end).multiplyScalar(.5).toArray());branch.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());}}
  for(let k=0;k<5;k++)box(g,ink,-.2+(k%2)*.35,memorialY+1.75-Math.floor(k/2)*.38,-8.68,.035,.26,.015);
  for(let k=0;k<6;k++){const chip=mesh(new T.DodecahedronGeometry(.22,0),stone,g,-1.2+k*.43,at(-1.2+k*.43,-8.1)+.1,-8.1);chip.scale.y=.45;}
  return g;
}

export function addWarVegetation(c,rand){
  const {mesh,box,M}=c,g=c.group(0,0);g.name='war-scarred-vegetation';
  const trunk=M('#585343'),charcoal=M('#44463d'),leaf=M('#777952'),grass=M('#898061');
  const allowed=(x,z,pad)=>!c.clearCorridor(x,z,pad)&&!c.reserved(x,z,pad)&&!c.inRiver(x,z,pad)&&!c.obstacles.some(o=>Math.abs(x-o.x)<o.w+pad&&Math.abs(z-o.z)<o.d+pad);
  const beam=(x,y,z,tx,ty,tz,r,material=trunk)=>{const delta=new T.Vector3(tx-x,ty-y,tz-z),o=mesh(new T.CylinderGeometry(r*.48,r,delta.length(),5),material,g,(x+tx)/2,(y+ty)/2,(z+tz)/2);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;};
  let trees=0;
  for(let k=0;k<380&&trees<56;k++){
    const x=(rand()-.5)*139,z=(rand()-.5)*139,h=2.8+rand()*4.5;if(!allowed(x,z,2.1))continue;const y=c.heightAt(x,z),a=rand()*6,lean=.3+rand()*.5;
    beam(x,y,z,x+Math.sin(a)*lean,y+h,z+Math.cos(a)*lean,.22+rand()*.11,trees%4===0?charcoal:trunk);
    for(let j=0;j<4;j++){const angle=a+j*2.3,py=y+h*(.48+j*.1),tx=x+Math.sin(angle)*(1.1+j*.18),tz=z+Math.cos(angle)*(1.1+j*.18);beam(x,py,z,tx,py+.6+j*.12,tz,.075);beam(tx,py+.6+j*.12,tz,tx+Math.cos(angle)*.5,py+1.2+j*.12,tz-Math.sin(angle)*.4,.036);if(trees%4===1&&j<3){const crown=mesh(new T.IcosahedronGeometry(.9,0),leaf,g,tx,py+.95,tz);crown.scale.set(1.25,.55,.9);}}
    c.obstacle(x,z,.8,.8);trees++;
  }
  for(let k=0;k<32;k++){const x=(rand()-.5)*130,z=(rand()-.5)*130;if(!allowed(x,z,1.2))continue;const y=c.heightAt(x,z);if(k%2){const log=box(g,charcoal,x,y+.18,z,.28,.3,1.8+rand());log.rotation.set(.08,rand()*6,.09);}else{const stump=mesh(new T.CylinderGeometry(.2,.38,.65,5),trunk,g,x,y+.3,z);stump.rotation.z=.13;}}
  const tufts=new T.InstancedMesh(new T.ConeGeometry(.035,.5,3),grass,1800),dummy=new T.Object3D();let n=0;
  for(let k=0;k<1100;k++){const x=(rand()-.5)*140,z=(rand()-.5)*140;if(c.inRiver(x,z,.4)||c.reserved(x,z,.2)||c.obstacles.some(o=>Math.abs(x-o.x)<o.w&&Math.abs(z-o.z)<o.d)||c.clearCorridor(x,z,.15)&&rand()<.92)continue;const y=c.heightAt(x,z);for(let j=0;j<3&&n<1800;j++){const h=.22+rand()*.4;dummy.position.set(x+(rand()-.5)*.3,y+h*.45,z+(rand()-.5)*.3);dummy.rotation.set((rand()-.5)*.6,rand()*6,(j-1)*.35);dummy.scale.set(1,h/.5,1);dummy.updateMatrix();tufts.setMatrixAt(n++,dummy.matrix);}}
  tufts.count=n;tufts.name='dry-war-grass';tufts.receiveShadow=true;g.add(tufts);g.userData.deadTrees=trees;
  return g;
}
