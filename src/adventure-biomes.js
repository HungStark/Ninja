import * as T from 'three';
import {REGIONS,riverAt,waterSector,waterwayAt,regionMetrics} from './adventure-world.js';
import {buildHouse} from './adventure-landmarks.js';

export function traversalDefinitions(id){
  if(id==='water'){
    const routes=[];
    const main=riverAt(id,36);routes.push({id:'west-ferry',name:'Bè sang Xóm Sen',kind:'raft',from:[main.x+main.width+1.5,36],to:[main.x-main.width-1.5,36]});
    const east=46+Math.sin(36*.025)*9;routes.push({id:'east-ferry',name:'Bè sang Chợ Cá',kind:'raft',from:[east-8.5,36],to:[east+8.5,36]});
    for(const [name,x] of [['west',-94],['central',0],['east',96]]){const z=69+Math.sin(x*.028)*7;routes.push({id:`north-${name}`,name:'Bè qua Cửa Sông',kind:'raft',from:[x,z-7.5],to:[x,z+7.5]});}
    return routes;
  }
  if(id==='fire')return [{id:'red-cliff',name:'Leo Vách Tro Hồng',kind:'climb',from:[88,-70],to:[88,-87],top:36,speed:4}];
  if(id==='earth')return [{id:'earth-cave',name:'Lối xuống Đại Hang',kind:'cave',from:[0,-12],to:[0,-20],top:-12,platform:{id:'earth-cave',x:0,z:-32,width:42,depth:50,ellipse:true}}];
  if(id==='wood')return [{id:'heart-tree',name:'Thang dây lên nhà cổ thụ',kind:'ladder',from:[9,3],to:[9,3],rise:17,platform:{id:'heart-tree',x:5,z:0,width:12,depth:12}}];
  if(id==='wind')return REGIONS.wind.zones.filter(z=>z.platform).map((z,i)=>({id:z.platform,name:`Thang dây · ${z.name}`,kind:'ladder',from:[z.x,z.z+4.4],to:[z.x,z.z+4.4],rise:20+i*3,platform:{id:z.platform,x:z.x,z:z.z,width:10,depth:10}}));
  return [];
}
export function traversalComponent(id,x,z,surface=null){if(id==='water')return waterSector(x,z);if(surface)return surface;if(id==='fire'&&Math.hypot(x-88,z+96)<12)return 'summit';return 'ground';}

// Plan walking legs and actual ferry/climbing legs separately. Water is never a walkable shortcut.
export function planExpedition(from,to,{id,surface=null,targetSurface=null,routes,walk}){
  const start=traversalComponent(id,...from,surface),goal=traversalComponent(id,...to,targetSurface),queue=[{component:start,rides:[]}],seen=new Set([start]);let rides;
  while(queue.length){const node=queue.shift();if(node.component===goal){rides=node.rides;break;}for(const route of routes)for(const side of [0,1]){const a=side?route.to:route.from,b=side?route.from:route.to,ca=traversalComponent(id,...a,side?route.platform?.id:null),cb=traversalComponent(id,...b,side?null:route.platform?.id);if(ca===node.component&&!seen.has(cb)){seen.add(cb);queue.push({component:cb,rides:[...node.rides,{route,side}]});}}}
  if(!rides)return null;const legs=[];let at=from,atSurface=surface;
  for(const {route,side} of rides){const dock=side?route.to:route.from,path=walk(at,dock,atSurface);if(!path.length&&Math.hypot(at[0]-dock[0],at[1]-dock[1])>.1)return null;if(path.length)legs.push({kind:'walk',path});legs.push({kind:'traverse',id:route.id,side});at=side?route.from:route.to;atSurface=side?null:route.platform?.id||null;}
  const final=walk(at,to,targetSurface||atSurface);if(!final.length&&Math.hypot(at[0]-to[0],at[1]-to[1])>.1)return null;if(final.length)legs.push({kind:'walk',path:final});return legs;
}

export function buildBiome(c,routes){
  const {id,land,box,cyl,mesh,M,heightAt,animated}=c,fixtures=[];
  const beam=(parent,material,a,b,width=.09)=>{const delta=b.clone().sub(a),o=box(parent,material,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2,width,width,delta.length());o.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),delta.normalize());return o;};
  const raft=()=>{const g=new T.Group();g.name='fishing-raft';for(let k=-3;k<=3;k++){const pole=cyl(g,M('#b4a46f'),k*.32,0,0,.18,3.4,7);pole.rotation.x=Math.PI/2;}for(const z of [-1,1])box(g,M('#605841'),0,.15,z,2.6,.12,.14);cyl(g,M('#705f49'),.8,1.8,.5,.065,3.5,6);box(g,M('#d1c29b'),.8,2.4,.5,1.5,1.5,.04);land.add(g);return g;};
  for(const r of routes){r.fromY=heightAt(...r.from);r.toY=r.top??(r.rise?r.fromY+r.rise:heightAt(...r.to));
    for(const side of [0,1]){const p=side?r.to:r.from,y=side?r.toY:r.fromY;fixtures.push({kind:'traversal',id:`${r.id}:${side}`,routeId:r.id,side,x:p[0],z:p[1],y,label:r.kind==='raft'?r.name:side?'Đi xuống · '+r.name:r.name,platform:side?r.platform?.id:null});}
    if(r.kind==='raft'){
      r.boat=raft();r.boat.visible=false;
      for(const p of [r.from,r.to]){const w=waterwayAt(...p),y=w.y+.35;for(let j=-2;j<=2;j++)box(land,M('#877457'),p[0]+j*.45,y-.1,p[1],.42,.2,3.3);for(const sx of [-1,1])cyl(land,M('#554c3c'),p[0]+sx*1.25,y+.1,p[1],.1,2.3,6);const idle=raft();idle.position.set(p[0],w.y+.18,p[1]);r.idleBoats??=[];r.idleBoats.push(idle);}
    }else if(r.kind==='climb'){
      const rock=M('#6c5650'),rope=M('#a89974');
      for(let k=0;k<30;k++){const t=k/29,x=r.from[0]+(r.to[0]-r.from[0])*t,y=r.fromY+(r.toY-r.fromY)*t,z=r.from[1]+(r.to[1]-r.from[1])*t;for(const side of [-1,1]){const grip=mesh(new T.DodecahedronGeometry(.42,0),rock,land,x+side*.65,y,z+.2);grip.scale.set(1.1,.5,.8);}if(k%5===0)cyl(land,rope,x,y,z+.4,.065,1.5,5);}
      for(let k=0;k<9;k++){const a=k*2.4,p=mesh(new T.OctahedronGeometry(.28),M('#e09861',.3),land,88+Math.sin(a)*3,36.5,-96+Math.cos(a)*3);p.scale.y=.5;}
    }else if(r.kind==='cave'){
      const stone=M('#6f6557'),dark=M('#383d39'),g=new T.Group();g.name='great-earth-cave';land.add(g);
      const arch=mesh(new T.TorusGeometry(5,1.1,6,18,Math.PI),stone,g,0,r.fromY+1,-14);for(const side of [-1,1])box(g,stone,side*5,r.fromY+1,-14,2,4,5);
      for(const side of [-1,1])box(g,dark,side*4.7,-5,-17,.5,14,6);box(g,dark,0,2,-17,10,.5,6);
      const floor=mesh(new T.CircleGeometry(1,64),M('#77705b'),g,0,-12.04,-32);floor.rotation.x=-Math.PI/2;floor.scale.set(21,25,1);
      const shell=mesh(new T.SphereGeometry(1,32,16,0,Math.PI*2,0,Math.PI/2),new T.MeshStandardMaterial({color:'#645f52',roughness:1,side:T.BackSide}),g,0,-12,-32);shell.scale.set(21,11,25);
      const caveLight=new T.PointLight('#d3b67a',4,48,1);caveLight.position.set(0,-7,-32);g.add(caveLight);
      r.platform.obstacles=[];
      for(let k=0;k<22;k++){const a=k*2.4,rr=6+k%7,x=Math.sin(a)*rr,z=-32+Math.cos(a)*rr,h=1.5+k%4;mesh(new T.ConeGeometry(.45,h,6),stone,g,x,-12+h/2,z);mesh(new T.ConeGeometry(.4,h+1,6),stone,g,x,-2-h/2,z).rotation.z=Math.PI;r.platform.obstacles.push({x,z,r:.7});}
      for(let k=0;k<8;k++){const a=k*.8,crystal=mesh(new T.OctahedronGeometry(.8),M('#b5c5a4',.25),g,Math.sin(a)*14,-10.8,-32+Math.cos(a)*17);crystal.scale.y=1.8;}
      const pool=mesh(new T.CircleGeometry(4,32),M('#5c8885',.1),g,-10,-11.97,-39);pool.rotation.x=-Math.PI/2;
      const poolLight=new T.PointLight('#83b8a2',2.3,25,1);poolLight.position.set(-10,-8,-39);g.add(poolLight);
      for(let k=0;k<26;k++){const a=k*Math.PI*2/26,rock=mesh(new T.DodecahedronGeometry(2.1+k%3*.35,0),M(k%2?'#777261':'#696854'),g,Math.sin(a)*19,-9.8,-32+Math.cos(a)*23);rock.scale.set(1,1.4,1);}
      for(const [x,z,h] of [[-6,-32,8],[6,-27,9],[-2,-41,8]]){cyl(g,stone,x,-12+h/2,z,1.1,h,7);const cap=mesh(new T.ConeGeometry(2.1,2.8,7),stone,g,x,-12+h,z);cap.rotation.z=Math.PI;r.platform.obstacles.push({x,z,r:1.7});}
      for(const x of [2.7,4.1])box(g,M('#6c6250'),x,-11.95,-32,.08,.07,15);box(g,M('#6b5740'),3.4,-11.4,-35,1.6,1,2.2);for(const side of [-1,1])cyl(g,M('#48473c'),3.4+side*.85,-11.9,-35,.25,.15,8).rotation.z=Math.PI/2;
    }else{
      const {platform:p}=r,y=r.toY;
      const local={...c,id:id==='wood'?'wood':'wind',heightAt:null,obstacle:()=>{},group:(x,z)=>{const g=new T.Group();g.position.set(x,y,z);land.add(g);return g;}};
      const house=buildHouse(local,p.x,p.z,4.2,3.4,1);house.name='balloon-house';
      box(land,M('#8e8266'),p.x,y-.22,p.z,p.width,.44,p.depth);
      for(const side of [-1,1])for(let k=0;k<5;k++){box(land,M('#5d5b43'),p.x+side*4.8,y+.55,p.z-4+k*2,.12,1.3,.12);box(land,M('#5d5b43'),p.x+side*4.8,y+1.1,p.z,.1,.1,9.6);}
      if(id==='wind')for(let k=0;k<7;k++){const a=k*Math.PI*2/7,px=p.x+Math.sin(a)*3.3,pz=p.z+Math.cos(a)*2.8,balloon=mesh(new T.SphereGeometry(2.4,12,9),M(['#c5a36a','#789e91','#c77d6a'][k%3]),land,px,y+11+(k%2)*1.8,pz);balloon.scale.y=1.3;animated.push({kind:'balloon',mesh:balloon,base:balloon.position.y});beam(land,M('#b7ad86'),new T.Vector3(p.x+(px-p.x)*.65,y+3,p.z+(pz-p.z)*.65),new T.Vector3(px,balloon.position.y-2.8,pz),.045);}
      else {house.name='central-tree-house';cyl(land,M('#64533d'),0,12,-7,3.2,27,10);c.obstacles.push({x:0,z:-7,w:3,d:3});for(let k=0;k<8;k++){const a=k*2.4,crown=mesh(new T.IcosahedronGeometry(7,1),M(k%2?'#507747':'#658b53'),land,Math.sin(a)*7,28+Math.sin(k)*3,-7+Math.cos(a)*6);crown.scale.y=.6;beam(land,M('#64533d'),new T.Vector3(0,17,-7),new T.Vector3(Math.sin(a)*8,24,-7+Math.cos(a)*7),.6);}}
      for(const side of [-1,1])beam(land,M('#b9a477'),new T.Vector3(r.from[0]+side*.5,r.fromY,r.from[1]),new T.Vector3(r.to[0]+side*.5,y,r.to[1]),.055);
      for(let yy=r.fromY+.4;yy<y;yy+=.42)box(land,M('#887354'),r.from[0],yy,r.from[1],1.12,.09,.14);
      box(land,M('#9a7952'),p.x-3,y+.3,p.z+3,1,.6,.7);box(land,M('#d2c89e'),p.x-3,y+.64,p.z+3,.6,.06,.45);
    }
  }
  if(id==='water'){
    for(const axis of ['x','z']){const positions=[],indices=[];for(let k=0;k<=300;k++){const t=k-150,center=axis==='z'?46+Math.sin(t*.025)*9:69+Math.sin(t*.028)*7,width=axis==='z'?7:6;for(const side of [-1,1])positions.push(axis==='z'?center+side*width:t,-.675,axis==='z'?t:center+side*width);if(k<300){const n=k*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}if(axis==='x')for(let k=0;k<indices.length;k+=3)[indices[k+1],indices[k+2]]=[indices[k+2],indices[k+1]];const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();const canal=mesh(geometry,new T.MeshStandardMaterial({color:'#5f9eaf',metalness:.22,roughness:.22,transparent:true,opacity:.87}),land);canal.name='fishing-village-canal';}
    for(let k=0;k<22;k++){const z=-118+k*11,w=riverAt(id,z),side=k%2?1:-1,x=w.x+side*(w.width+2),y=heightAt(x,z);const g=new T.Group();g.name='fishing-shed';g.position.set(x,y,z);land.add(g);for(const sx of [-1,1])cyl(g,M('#625b48'),sx*2,1,0,.1,3.3,6);box(g,M('#bba87c'),0,2.6,0,5,.16,3);for(let j=0;j<7;j++)beam(g,M('#817f66'),new T.Vector3(-2+j*.65,.4,.1),new T.Vector3(-2+j*.65,2.4,.1),.025);for(let j=0;j<6;j++){const fish=mesh(new T.OctahedronGeometry(.23),M('#a2bbb7'),g,-1.7+j*.62,1.3+Math.sin(j)*.2,.2);fish.scale.set(.5,1.4,.4);}for(let j=0;j<3;j++)cyl(g,M('#877457'),j*.8-1,.3,1.1,.38,.6,8);}
  }
  if(id==='ice'){const sea=box(land,M('#9ec9d6'),0,-.64,116,280,.1,56);sea.name='polar-frozen-sea';for(let k=0;k<28;k++){const x=-127+k*9.3,z=94+(k%4)*11,ice=mesh(new T.DodecahedronGeometry(2.5+k%3),M(k%2?'#cde2e7':'#a9cfdb'),land,x,.5,z);ice.scale.set(1,1+k%3*.6,1.5);} }
  if(id==='earth')for(let k=0;k<50;k++){const a=k*2.4,r=28+(k%7)*14,x=Math.sin(a)*r,z=Math.cos(a)*r;if(c.clearCorridor(x,z,4))continue;const rock=mesh(new T.DodecahedronGeometry(2+k%3,0),M(k%2?'#9b7e5e':'#83735c'),land,x,heightAt(x,z)+1,z);rock.scale.set(1,1.1+k%3*.35,1);c.obstacle(x,z,4,4);}
  if(id==='nameless'){
    for(const [x,z] of [[-10,16],[13,-15],[-34,-11],[35,29],[-41,35],[24,-45]]){const y=heightAt(x,z),rim=mesh(new T.TorusGeometry(2.4,.22,5,24),M('#615c4a'),land,x,y+.05,z);rim.rotation.x=Math.PI/2;const scar=mesh(new T.CircleGeometry(2.3,20),M('#494a3e'),land,x,y+.03,z);scar.rotation.x=-Math.PI/2;for(let k=0;k<6;k++){const a=k*2.4,chip=mesh(new T.DodecahedronGeometry(.4),M('#797766'),land,x+Math.sin(a)*3,y+.25,z+Math.cos(a)*3);chip.scale.y=.5;}}
    for(const [x,z] of [[-15,9],[14,16],[-28,-15],[26,-32]]){const y=heightAt(x,z);for(let k=0;k<5;k++){const pole=box(land,M('#42443b'),x+k*.6,y+.8,z,.16,1.6,.15);pole.rotation.z=(k-2)*.11;}box(land,M('#49483b'),x+1.2,y+.9,z,3,.1,.1);for(const side of [-1,0,1]){const banner=box(land,M(side<0?'#58737a':side===0?'#786783':'#874f42'),x+side*2,y+1.8,z,.8,1.2,.04);banner.rotation.z=side*.2;}}
  }
  if(id==='fire')fixtures.push({kind:'expedition-giver',x:-6,z:5,label:'Thợ Khôi · Hồng liên cứu thương'},{kind:'expedition-goal',x:88,z:-96,y:36,label:'Hái Hồng Liên trên đỉnh núi'});
  if(id==='wind')for(const [x,z] of [[-100,-92],[-92,-100],[-108,-98],[102,96]]){const y=heightAt(x,z),g=new T.Group();g.position.set(x,y,z);land.add(g);mesh(new T.ConeGeometry(2.5,12,8),M('#d0c6a4'),g,0,6,0);const rotor=new T.Group();rotor.position.set(0,10,2);g.add(rotor);for(let k=0;k<4;k++){const blade=new T.Group();blade.rotation.z=k*Math.PI/2;rotor.add(blade);box(blade,M('#ddd5b4'),.4,3,0,1,5,.1);}animated.push({kind:'windmill',mesh:rotor});}
  return fixtures;
}

export function createStorm(scene){
  const positions=new Float32Array(900*6),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));const material=new T.LineBasicMaterial({color:'#a8c4dd',transparent:true,opacity:.35,depthWrite:false}),rain=new T.LineSegments(geometry,material);rain.frustumCulled=false;rain.name='lightning-village-rain';scene.add(rain);const flash=new T.DirectionalLight('#dceaff',0);flash.position.set(40,90,-30);scene.add(flash);
  const boltGeometry=new T.BufferGeometry(),points=[];for(let k=0;k<12;k++)points.push(new T.Vector3(40+Math.sin(k*3)*3,85-k*6,-35+Math.cos(k)*2));boltGeometry.setFromPoints(points);const bolt=new T.Line(boltGeometry,new T.LineBasicMaterial({color:'#e6e9ff'}));scene.add(bolt);
  let time=0,strikes=0,thunderAt=-1,lastStrike=-10,enabled=false,audio=null;
  const unlock=()=>{if(!audio)try{audio=new (globalThis.AudioContext||globalThis.webkitAudioContext)();}catch{}audio?.resume?.().catch(()=>{});};
  const thunder=()=>{if(!audio||audio.state!=='running')return;const duration=2.2,buffer=audio.createBuffer(1,audio.sampleRate*duration,audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(audio.sampleRate*.7));const noise=audio.createBufferSource(),low=audio.createBiquadFilter(),gain=audio.createGain();low.type='lowpass';low.frequency.value=140;gain.gain.value=.16;noise.buffer=buffer;noise.connect(low);low.connect(gain);gain.connect(audio.destination);noise.start();};
  return {unlock,state:()=>({time,raining:enabled&&time%95<47,strikes,flash:flash.intensity}),reset(){time=0;strikes=0;lastStrike=-10;thunderAt=-1;},update(dt,active,hero){enabled=active;if(active)time+=dt;const wet=active&&time%95<47;rain.visible=wet;flash.intensity=0;bolt.visible=false;if(wet){const cycle=time%95;if(cycle>9&&Math.floor(cycle/11)>Math.floor((cycle-dt)/11)){lastStrike=time;strikes++;thunderAt=time+1.1;}const age=time-lastStrike;if(age>=0&&age<.32){flash.intensity=age<.07||age>.14&&age<.21?3.5:.3;bolt.visible=flash.intensity>1;}if(thunderAt>0&&time>=thunderAt){thunder();thunderAt=-1;}for(let k=0;k<900;k++){const x=hero.x+Math.sin(k*32.7)*24,z=hero.z+Math.cos(k*17.1)*24,y=hero.y+((k*.73-time*24)%25+25)%25;positions.set([x,y,z,x-.15,y-.9,z+.07],k*6);}geometry.attributes.position.needsUpdate=true;}}};
}
