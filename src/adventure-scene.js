import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {buildHouse,buildDistrict,buildBoss} from './adventure-landmarks.js';
import {village,VILLAGES,QUESTS} from './adventure-data.js';
import {REGIONS,WORLD_LIMIT,GATE_RADIUS,terrainHeight} from './adventure-world.js';

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
  const arms=[],legs=[],knees=[],feet=[];
  for(const side of [-1,1]){
    const arm=new T.Group();arm.position.set(side*.43,1.28,0);body.add(arm);box(arm,cloth,side*.055,-.19,0,.25,.43,.28);box(arm,ink,side*.055,-.43,.03,.22,.21,.24);arms.push(arm);
    const leg=new T.Group();leg.position.set(side*.21,.73,0);body.add(leg);box(leg,ink,0,-.155,0,.27,.31,.3);
    const knee=new T.Group();knee.position.y=-.31;leg.add(knee);box(knee,ink,0,-.145,0,.25,.29,.28);box(knee,cloth,0,-.15,.025,.29,.16,.32);
    const foot=new T.Group();foot.position.y=-.31;knee.add(foot);box(foot,ink,0,-.02,.075,.31,.19,.48);legs.push(leg);knees.push(knee);feet.push(foot);
  }
  box(body,strap,.39,.88,-.12,.23,.3,.25);const sword=box(body,ink,-.26,1.16,-.36,.13,1.5,.12);sword.rotation.z=-.45;
  const scarf=box(body,cloth,-.24,1.4,-.35,.22,.78,.07);scarf.rotation.z=-.3;
  root.scale.setScalar(1.25);
  let stride=0,localX=0,localZ=0;
  return {root,cloth,hair:hairMat,locomotionState:()=>({side:localX,forward:localZ,speed:Math.hypot(localX,localZ),stride,legs:legs.map((l,i)=>({hip:[l.rotation.x,l.rotation.z],knee:knees[i].rotation.x,ankle:feet[i].rotation.x})),lean:[body.rotation.x,body.rotation.z]}),update(time,moving,velocity=null,dt=1/60){
    // Animate actual travel in the character's local frame, including strafes and backsteps.
    const yaw=root.rotation.y,vx=moving?(velocity?.x??Math.sin(yaw)*4.6):0,vz=moving?(velocity?.z??Math.cos(yaw)*4.6):0,blend=1-Math.exp(-dt*14);
    localX+=(Math.cos(yaw)*vx-Math.sin(yaw)*vz-localX)*blend;localZ+=(Math.sin(yaw)*vx+Math.cos(yaw)*vz-localZ)*blend;
    const speed=Math.hypot(localX,localZ),weight=Math.min(1,speed/3),side=speed>.001?localX/speed:0,forward=speed>.001?localZ/speed:0,lateral=Math.abs(side),back=forward<0?1:0;
    // Cadence follows distance rather than wall-clock time, so changing direction never resets a step.
    stride+=speed*dt*(2.4+lateral*.3);
    legs.forEach((leg,i)=>{const phase=stride+i*Math.PI,swing=Math.sin(phase)*weight,lift=Math.max(0,Math.cos(phase))*weight,knee=lift*(.5+back*.12);
      leg.position.x=(i===0?-1:1)*(.21+lateral*weight*.045);leg.position.y=.73+lift*.025;
      leg.rotation.x=-swing*forward*(back?.4:.58)-knee*.48;leg.rotation.z=swing*side*.34;
      knees[i].rotation.x=knee;feet[i].rotation.x=-leg.rotation.x-knee;feet[i].rotation.z=-leg.rotation.z;
      arms[i].rotation.x=.06+swing*forward*.3;arms[i].rotation.z=(i===0?.04:-.04)-swing*side*.2;
    });
    body.position.y=Math.sin(time*2)*.012*(1-weight)+Math.abs(Math.sin(stride))*.028*weight;
    body.rotation.x=forward*weight*.045;body.rotation.z=-side*weight*.055+Math.sin(stride)*.018*weight;
    scarf.rotation.x=-weight*.35+Math.sin(time*(weight>0?9:2))*(.07+weight*.04);
  }};
}

export function createAdventureScene(){
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(49,innerWidth/innerHeight,.1,340),land=new T.Group();scene.add(land);
  scene.add(new T.HemisphereLight('#dfede6','#46433f',2.35));
  const sun=new T.DirectionalLight('#ffe5b9',3.1);sun.position.set(-35,65,28);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:180});sun.shadow.bias=-.0005;sun.shadow.normalBias=.03;scene.add(sun);
  const fill=new T.DirectionalLight('#a9cfdf',1.1);fill.position.set(20,25,-35);scene.add(fill);
  const hero=createChibi(),previousHeroPosition=new T.Vector3();scene.add(hero.root);
  const obstacles=[],interactives=[],animated=[],citizens=[],party=[],materials=new Map();
  let npc,guard,boss,terrain,foliage,gates=[],randomEnemy=null,current='nameless',time=0,corridors=[];
  let orbitYaw=0,orbitPitch=.2,orbitDistance=4.2;
  const heightAt=(x,z)=>terrainHeight(current,x,z);
  const destination=mesh(new T.RingGeometry(.3,.5,40),new T.MeshBasicMaterial({color:'#f7dca3',side:T.DoubleSide,transparent:true,opacity:.9}),scene);destination.rotation.x=-Math.PI/2;destination.visible=false;
  const M=(color,emission=0)=>{const key=color+':'+emission;if(!materials.has(key))materials.set(key,mat(color,emission?{emissive:color,emissiveIntensity:emission}:{}));return materials.get(key);};
  const group=(x=0,z=0)=>{const g=new T.Group();g.position.set(x,heightAt(x,z),z);land.add(g);return g;};
  function disposeObject(root){const geoms=new Set(),mats=new Set();root.traverse(o=>{if(o.geometry)geoms.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);});for(const g of geoms)g.dispose();for(const m of mats)m.dispose();}
  function disposeLand(){disposeObject(land);land.clear();obstacles.length=0;interactives.length=0;animated.length=0;citizens.length=0;party.length=0;materials.clear();randomEnemy=null;boss=null;foliage=null;}
  function segmentDistance(x,z,target){const dot=Math.max(0,Math.min(1,(x*target.x+z*target.z)/(target.x*target.x+target.z*target.z||1)));return Math.hypot(x-target.x*dot,z-target.z*dot);}
  const clearCorridor=(x,z,padding=0)=>Math.hypot(x,z)<9+padding||corridors.some(t=>segmentDistance(x,z,t)<2.25+padding)||interactives.some(t=>Math.hypot(x-t.x,z-t.z)<3.2+padding);
  function obstacle(x,z,w,d){const halfW=w/2+.7,halfD=d/2+.7;if(clearCorridor(x,z,Math.hypot(halfW,halfD)))return false;obstacles.push({x,z,w:halfW,d:halfD});return true;}
  function blocked(x,z){return Math.abs(x)>WORLD_LIMIT-1||Math.abs(z)>WORLD_LIMIT-1||obstacles.some(o=>Math.abs(x-o.x)<o.w&&Math.abs(z-o.z)<o.d);}
  function road(target,width=2.1){
    const length=Math.hypot(target.x,target.z),steps=Math.max(2,Math.ceil(length/1.8)),dx=target.x/length,dz=target.z/length,positions=[],uv=[],indices=[];
    for(let k=0;k<=steps;k++){const t=k/steps;for(const side of [-1,1]){const x=target.x*t+dz*width*side/2,z=target.z*t-dx*width*side/2;positions.push(x,heightAt(x,z)+.2,z);uv.push(side<0?0:1,t*length/2);}if(k<steps){const n=k*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();const r=mesh(geo,M(village(current).path),land);r.receiveShadow=true;
  }
  function arch(target,v){const g=group(target.x,target.z);g.rotation.y=Math.atan2(target.x,target.z);const timber=M(v.roof),stone=M('#acae9c');for(const s of [-1,1]){box(g,stone,s*2.8,.35,0,1,.7,1);box(g,timber,s*2.8,3.2,0,.5,6,.5);}box(g,timber,0,5.8,0,7,.5,.9);box(g,timber,0,6.5,0,8,.3,1.3);box(g,M(v.color,.25),0,5.8,.5,1,1,.08);}
  function addTerrain(v){
    const geo=new T.PlaneGeometry(WORLD_LIMIT*2+40,WORLD_LIMIT*2+40,144,144);geo.rotateX(-Math.PI/2);const p=geo.attributes.position,colors=[],base=new T.Color(v.ground),warm=new T.Color(v.path),shade=new T.Color(v.ground).multiplyScalar(.8);
    for(let k=0;k<p.count;k++){const x=p.getX(k),z=p.getZ(k),h=heightAt(x,z);p.setY(k,h);const variation=(Math.sin(x*.15)*Math.cos(z*.12)+1)/2,c=base.clone().lerp(h>3?warm:shade,Math.min(.38,Math.abs(h)*.018+variation*.14));colors.push(c.r,c.g,c.b);}
    geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();terrain=mesh(geo,new T.MeshStandardMaterial({vertexColors:true,roughness:1}),land);terrain.castShadow=false;
  }
  function addVegetation(v,rand){
    const count=({water:42,wind:28,earth:18,fire:45,light:52,ice:80,wood:130,dark:68,nameless:70,lightning:25})[current],trunks=new T.InstancedMesh(new T.CylinderGeometry(.15,.24,1,6),M('#535044'),count),crowns=new T.InstancedMesh(['ice','dark'].includes(current)?new T.ConeGeometry(1,2,6):new T.IcosahedronGeometry(1,0),M(v.tree),count),rocks=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),M(current==='earth'?'#aa855c':current==='ice'?'#b8d2d4':'#72787a'),100),cover=new T.InstancedMesh(new T.ConeGeometry(.17,.6,3),M(current==='ice'?'#d7e2dd':v.tree),1100),dummy=new T.Object3D(),items=[];
    let n=0;for(let k=0;k<count*5&&n<count;k++){const x=(rand()-.5)*146,z=(rand()-.5)*146,s=1.2+rand()*2.3,isDesert=['earth','lightning','fire'].includes(current),leafScale=s*(isDesert?.65:current==='water'?.75:1.25);if(clearCorridor(x,z,leafScale+1)||obstacles.some(o=>Math.abs(x-o.x)<o.w+2&&Math.abs(z-o.z)<o.d+2))continue;const y=heightAt(x,z);dummy.position.set(x,y+s*.7,z);dummy.scale.set(s*.8,s*1.4,s*.8);dummy.rotation.set(0,rand()*6,0);dummy.updateMatrix();trunks.setMatrixAt(n,dummy.matrix);dummy.position.set(x,y+s*2.1,z);dummy.scale.set(leafScale,leafScale*(current==='water'?.55:1),leafScale);dummy.updateMatrix();crowns.setMatrixAt(n,dummy.matrix);items.push({matrix:dummy.matrix.clone(),center:dummy.position.clone(),radius:leafScale*1.2,hidden:false});if(!isDesert)obstacle(x,z,.9,.9);n++;}trunks.count=n;crowns.count=n;foliage={mesh:crowns,items};
    for(let k=0;k<100;k++){const x=(rand()-.5)*150,z=(rand()-.5)*150,s=.4+rand()*1.9;dummy.position.set(x,heightAt(x,z)+s*.5,z);dummy.scale.set(s,s*(current==='earth'?3.2:.7),s);if(clearCorridor(x,z,1))dummy.scale.setScalar(0);dummy.rotation.set(0,rand()*6,.1);dummy.updateMatrix();rocks.setMatrixAt(k,dummy.matrix);}
    for(let k=0;k<1100;k++){const x=(rand()-.5)*143,z=(rand()-.5)*143,s=clearCorridor(x,z,.3)?0:.7+rand()*1.2;dummy.position.set(x,heightAt(x,z)+.2,z);dummy.scale.setScalar(s);dummy.rotation.set(0,rand()*6,rand()*.3);dummy.updateMatrix();cover.setMatrixAt(k,dummy.matrix);}
    trunks.castShadow=true;crowns.castShadow=true;rocks.castShadow=true;cover.castShadow=false;for(const o of [trunks,crowns,rocks,cover]){o.receiveShadow=true;land.add(o);}
  }
  function addBackdrop(v,rand){
    for(let k=0;k<23;k++){const a=k/23*Math.PI*2,r=98+rand()*19,h=(current==='earth'||current==='ice'?24:13)+rand()*23,x=Math.sin(a)*r,z=Math.cos(a)*r;let geo;
      if(current==='wood')geo=new T.CylinderGeometry(2,4,h,6);else if(current==='earth')geo=new T.CylinderGeometry(4+rand()*3,8,h,5);else geo=new T.ConeGeometry(8+rand()*11,h,5);
      const p=mesh(geo,M(new T.Color(v.ground).multiplyScalar(.72).getStyle()),land,x,heightAt(x,z)+h/2-4,z);p.rotation.y=rand()*6;
      if(current==='ice'){const snow=mesh(new T.ConeGeometry(5+rand()*3,h*.4,5),M('#e4eae6'),land,x,p.position.y+h*.3,z);snow.rotation.y=p.rotation.y;}
      if(current==='wood'){const crown=mesh(new T.IcosahedronGeometry(13,0),M(v.tree),land,x,p.position.y+h*.45,z);crown.scale.y=.5;}
    }
  }
  function addWater(v){
    if(!['water','ice','fire','dark'].includes(current))return;
    const color=current==='fire'?'#db692f':current==='ice'?'#a2cbd4':current==='dark'?'#655a86':'#5da6b8';
    // Shallow ribbons follow the terrain; every path crossing is a solid
    // causeway. They are visual waterways, so neither banks nor crossings can
    // strand the player on the wrong side of a quest.
    const positions=[],indices=[];
    for(let k=0;k<=100;k++){const z=-70+k*1.4,cx=current==='water'?Math.sin(z*.055)*16-18:current==='fire'?Math.sin(z*.07)*9+30:Math.sin(z*.04)*12-29,width=current==='water'?5.5:3;for(const s of [-1,1]){const x=cx+s*width;positions.push(x,heightAt(x,z)+.12,z);}if(k<100){const n=k*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();const material=new T.MeshStandardMaterial({color,emissive:current==='fire'?color:'#000000',emissiveIntensity:.65,metalness:.25,roughness:.3,transparent:current!=='fire',opacity:.8});const water=mesh(geo,material,land);water.castShadow=false;animated.push({kind:'ripple',mesh:water});
  }
  function batchScenery(){
    const moving=new Set([...animated.map(a=>a.mesh),...citizens.map(c=>c.root),...party.map(p=>p.char.root)]),batches=new Map();land.updateMatrixWorld(true);
    land.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o===terrain||Array.isArray(o.material))return;for(let p=o;p&&p!==land;p=p.parent)if(moving.has(p))return;if(!o.geometry.attributes.uv)return;const key=o.material.uuid;if(!batches.has(key))batches.set(key,{material:o.material,objects:[]});batches.get(key).objects.push(o);});
    for(const {material,objects} of batches.values()){if(objects.length<2)continue;const geos=objects.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);return g;});const geo=mergeGeometries(geos,false);for(const g of geos)g.dispose();if(!geo)continue;for(const o of objects){o.parent.remove(o);o.geometry.dispose();}const combined=new T.Mesh(geo,material);combined.castShadow=true;combined.receiveShadow=true;land.add(combined);}
  }
  function load(id,save){
    disposeLand();current=id;const v=village(id),region=REGIONS[id],rand=seeded(VILLAGES.indexOf(v)*913+1049);
    scene.background=new T.Color(v.sky);scene.fog=new T.Fog(v.sky,75,235);sun.color.set(id==='dark'?'#c7c2ee':id==='ice'?'#e2f5ff':'#ffe4b7');sun.intensity=id==='dark'?1.75:3.1;
    gates=v.links.map(target=>{const other=village(target),a=Math.atan2(other.x-v.x,other.y-v.y);return {kind:'gate',id:target,x:Math.sin(a)*GATE_RADIUS,z:Math.cos(a)*GATE_RADIUS,label:other.name};});
    const quest=QUESTS[id];interactives.push(...gates,{kind:'save',x:0,z:5,label:'Ấn hồi sinh'},{kind:'npc',x:-4,z:5,label:'Trưởng làng'},{kind:'quest',x:quest.x??8,z:quest.z??-9.5,label:quest.enemy});
    for(const zone of region.zones)interactives.push({kind:'landmark',id:zone.id,x:zone.x,z:zone.z,label:zone.name});
    for(const person of region.npcs)interactives.push({kind:person.kind,id:person.id,x:person.x,z:person.z,label:person.name});
    if(!save.bosses?.[id])interactives.push({kind:'boss',id:region.boss.id,x:region.boss.x,z:region.boss.z,label:region.boss.name});
    const treatyReady=['water','fire','lightning'].every(key=>save.bosses?.[key]);
    if(id==='nameless'&&treatyReady){interactives.push({kind:'treaty',x:3,z:7,label:'Bàn ký hiệp ước'});['water','fire','lightning'].forEach((key,index)=>interactives.push({kind:'treaty',id:key,x:1+index*2,z:9.5,label:REGIONS[key].boss.name}));}
    if(['wind','earth','ice','wood','light'].includes(id))interactives.push({kind:'envoy',x:-3,z:8,label:`Đại diện ${v.name}`});
    corridors=[...interactives];addTerrain(v);addWater(v);
    for(const g of gates){road(g,3.7);arch(g,v);}for(const zone of region.zones)road(zone,2.5);cyl(land,M(v.path),0,.1,0,8,.2,id==='earth'?6:id==='lightning'?8:48);
    const setpieceSpot=zone=>{const a=Math.atan2(zone.x,zone.z);let best,score=-Infinity;for(const side of [-1,1])for(const distance of [14,20]){const p={x:zone.x+Math.cos(a)*distance*side,z:zone.z-Math.sin(a)*distance*side};const clearance=Math.min(...corridors.map(t=>segmentDistance(p.x,p.z,t)),65-Math.abs(p.x),65-Math.abs(p.z));if(clearance>score){score=clearance;best=p;}}return best;};
    const c={id,v,group,box,cyl,mesh,M,obstacle,animated,setpieceSpot};
    region.zones.forEach((zone,index)=>{buildDistrict(c,zone,index);const g=group(zone.x,zone.z);for(let k=0;k<2;k++)cyl(g,M(v.path),0,.015+k*.035,0,3.5-k*.35,.035,32);const mark=mesh(new T.OctahedronGeometry(.28),M(v.color,.65),g,0,2.8,0);animated.push({kind:'float',mesh:mark,base:2.8});});
    let houses=0;for(const [x,z,w,d] of region.houses){if(clearCorridor(x,z,Math.hypot(w/2,d/2)+.7))continue;buildHouse(c,x,z,w,d,houses++);}
    // A village can grow around its own districts, without ever borrowing the
    // same six central house positions from the other nine maps.
    for(let k=0;k<80&&houses<26;k++){const zone=region.zones[k%4],a=rand()*Math.PI*2,r=8+rand()*12,x=zone.x+Math.sin(a)*r,z=zone.z+Math.cos(a)*r,w=3.4+rand()*2.3,d=3.2+rand()*2.1;if(Math.abs(x)>63||Math.abs(z)>63||clearCorridor(x,z,4)||obstacles.some(o=>Math.abs(x-o.x)<o.w+4&&Math.abs(z-o.z)<o.d+4))continue;buildHouse(c,x,z,w,d,houses++);}
    addVegetation(v,rand);addBackdrop(v,rand);
    const shrine=group(0,3),stone=M('#89958a');for(let k=0;k<3;k++)cyl(shrine,stone,0,.15+k*.18,0,1.4-k*.3,.2,8);cyl(shrine,M('#475c5f'),0,1,0,.38,1.1);box(shrine,M('#c1c8ae'),0,1.7,0,1,.24,1);const seal=mesh(new T.OctahedronGeometry(.42),M('#96e6cc',.85),shrine,0,2.35,0);animated.push({kind:'float',mesh:seal,base:2.35});
    const halo=mesh(new T.RingGeometry(1.7,1.78,48),M('#a7ead6',.6),shrine,0,.08,0);halo.rotation.x=-Math.PI/2;
    npc=createChibi('#77725c','#b2b9a9');npc.root.position.set(-4,heightAt(-4,4),4);npc.root.rotation.y=.4;land.add(npc.root);citizens.push(npc);
    region.npcs.forEach((person,index)=>{const char=createChibi(person.kind==='mentor'?v.color:person.kind==='healer'?'#d0d9c0':'#8a7962',index%2?'#ddd0b5':'#3c4243');char.root.position.set(person.x,heightAt(person.x,person.z),person.z);char.root.rotation.y=Math.atan2(-person.x,-person.z);land.add(char.root);citizens.push(char);if(person.kind==='mentor'){const rune=mesh(new T.TorusGeometry(.8,.04,4,24),M(v.color,.7),char.root,0,2.8,0);rune.rotation.x=Math.PI/2;animated.push({kind:'halo',mesh:rune});}});
    guard=createChibi('#7a4141','#252833',true);guard.root.position.set(quest.x??8,heightAt(quest.x??8,quest.z??-11),quest.z??-11);guard.root.rotation.y=Math.PI;guard.root.visible=save.quests[id]===1;land.add(guard.root);citizens.push(guard);
    if(!save.bosses?.[id])boss=buildBoss(c,region.boss);
    if(['water','fire','lightning','dark'].includes(id)&&!save.bosses?.[id]){const leader=createChibi(v.color,id==='dark'?'#d7c9e1':'#30333c',true);leader.root.position.set(region.boss.x+5,heightAt(region.boss.x+5,region.boss.z+3),region.boss.z+3);leader.root.scale.setScalar(1.65);leader.root.rotation.y=Math.PI;land.add(leader.root);citizens.push(leader);}
    if(['wind','earth','ice','wood','light'].includes(id)){const envoy=createChibi(v.color,'#b7b4a0');envoy.root.position.set(-3,heightAt(-3,8),8);envoy.root.rotation.y=.4;land.add(envoy.root);citizens.push(envoy);}
    if(id==='nameless'&&treatyReady){const table=group(3,7);box(table,M('#6e5944'),0,1.1,0,3,.2,2);for(const s of [-1,1])for(const zz of [-1,1])box(table,M('#514638'),s*1.2,.5,zz*.75,.18,1,.18);box(table,M('#ded2ae'),0,1.23,0,1.3,.03,1);['water','fire','lightning'].forEach((key,index)=>{const rep=createChibi(village(key).color,index===1?'#7e6f67':'#323944');const x=1+index*2,z=9.5;rep.root.position.set(x,heightAt(x,z),z);rep.root.rotation.y=Math.PI;land.add(rep.root);citizens.push(rep);});}
    hero.cloth.color.set(save.hero.coat);hero.hair.color.set(save.hero.hair);const pos=blocked(...save.position)?[0,7]:save.position;hero.root.position.set(pos[0],heightAt(...pos),pos[1]);previousHeroPosition.copy(hero.root.position);hero.root.rotation.y=orbitYaw+Math.PI;destination.visible=false;
    if(id!=='nameless'&&treatyReady&&!save.campaign?.treatySigned)['water','fire','lightning'].forEach((key,index)=>{const char=createChibi(village(key).color,index===1?'#7e6f67':'#323944'),offset=[[-2,1],[-3,-1],[-1,-3]][index];char.root.position.set(pos[0]+offset[0],heightAt(pos[0]+offset[0],pos[1]+offset[1]),pos[1]+offset[1]);land.add(char.root);party.push({char,offset});});
    batchScenery();
    scene.updateMatrixWorld(true);camera.fov=68;camera.updateProjectionMatrix();followCamera(1,true,false);
  }
  function spawnEnemy(x,z){clearEnemy();randomEnemy=createChibi('#754f4a','#2c2932',true);randomEnemy.root.position.set(x,heightAt(x,z),z);land.add(randomEnemy.root);return randomEnemy;}
  function clearEnemy(){if(randomEnemy){land.remove(randomEnemy.root);disposeObject(randomEnemy.root);randomEnemy=null;}}
  function followCamera(dt,snap=false,menu=false){
    const p=hero.root.position,head=p.clone().add(new T.Vector3(0,2.35,0));
    if(menu){const target=head.clone().add(new T.Vector3(-4,0,0));camera.position.lerp(target.clone().add(new T.Vector3(12,12,17)),snap?1:1-Math.exp(-dt*5));camera.lookAt(target);return;}
    const forward=new T.Vector3(-Math.sin(orbitYaw),0,-Math.cos(orbitYaw)),right=new T.Vector3(Math.cos(orbitYaw),0,-Math.sin(orbitYaw));
    const desired=head.clone().addScaledVector(forward,-orbitDistance).addScaledVector(right,.55);desired.y+=.55+Math.sin(orbitPitch)*orbitDistance;
    const delta=desired.clone().sub(head),length=delta.length(),direction=delta.clone().normalize();
    // Probe collision footprints instead of raycasting every triangle of merged villages.
    for(let d=.6;d<length;d+=.3){const probe=head.clone().addScaledVector(direction,d);if(blocked(probe.x,probe.z)&&probe.y<heightAt(probe.x,probe.z)+8){desired.copy(head).addScaledVector(direction,Math.max(.8,d-.3));break;}}
    desired.y=Math.max(desired.y,heightAt(desired.x,desired.z)+.6);
    camera.position.lerp(desired,snap?1:1-Math.exp(-dt*14));
    camera.lookAt(head.clone().addScaledVector(forward,5).addScaledVector(right,.25).add(new T.Vector3(0,-Math.sin(orbitPitch)*4,0)));
  }
  function update(dt,moving,menu=false){
    time+=dt;if(menu)hero.root.rotation.y=.6;hero.root.position.y=heightAt(hero.root.position.x,hero.root.position.z);
    const velocity={x:dt>0?(hero.root.position.x-previousHeroPosition.x)/dt:0,z:dt>0?(hero.root.position.z-previousHeroPosition.z)/dt:0};previousHeroPosition.copy(hero.root.position);
    hero.update(time,moving,velocity,dt);citizens.forEach(c=>c.update(time,false,null,dt));if(randomEnemy){randomEnemy.root.position.y=heightAt(randomEnemy.root.position.x,randomEnemy.root.position.z);randomEnemy.update(time,true,null,dt);}
    for(const {char,offset} of party){const target=new T.Vector3(hero.root.position.x+offset[0],0,hero.root.position.z+offset[1]),p=char.root.position,walking=Math.hypot(p.x-target.x,p.z-target.z)>.2;p.x+=(target.x-p.x)*(1-Math.exp(-dt*3));p.z+=(target.z-p.z)*(1-Math.exp(-dt*3));p.y=heightAt(p.x,p.z);if(walking)char.root.rotation.y=Math.atan2(target.x-p.x,target.z-p.z);char.update(time,walking,null,dt);}
    for(const a of animated){if(a.kind==='float'){a.mesh.rotation.y=time*.55;a.mesh.position.y=a.base+Math.sin(time*1.6)*.2;}if(a.kind==='windmill')a.mesh.rotation.z=time*.45;if(a.kind==='halo')a.mesh.rotation.y+=dt*.24;if(a.kind==='boss'){a.mesh.position.y=a.base+Math.sin(time*1.1)*.18;a.mesh.rotation.y=Math.sin(time*.35)*.08;}if(a.kind==='pulse')a.mesh.scale.setScalar(1+Math.sin(time*2)*.08);if(a.kind==='flag')a.mesh.rotation.y=Math.sin(time*2.4)*.15;if(a.kind==='ripple')a.mesh.material.opacity=.76+Math.sin(time)*.04;}
    followCamera(dt,false,menu);destination.rotation.z=time;
    const target=hero.root.position.clone().add(new T.Vector3(0,2,0));
    if(foliage){const sight=new T.Line3(camera.position,target),nearest=new T.Vector3(),hiddenMatrix=new T.Matrix4().makeScale(0,0,0);let changed=false;foliage.items.forEach((item,index)=>{sight.closestPointToPoint(item.center,true,nearest);const hidden=nearest.distanceTo(item.center)<item.radius+1;if(hidden!==item.hidden){foliage.mesh.setMatrixAt(index,hidden?hiddenMatrix:item.matrix);item.hidden=hidden;changed=true;}});if(changed)foliage.mesh.instanceMatrix.needsUpdate=true;}
  }
  function project(x,z,y=3){camera.updateMatrixWorld();const p=new T.Vector3(x,heightAt(x,z)+y,z).project(camera);return {left:(p.x+1)*innerWidth/2,top:(1-p.y)*innerHeight/2,visible:p.z<1&&Math.abs(p.x)<1.1&&Math.abs(p.y)<1.1};}
  function pick(clientX,clientY,canvas){if(!terrain)return null;camera.updateMatrixWorld();terrain.updateMatrixWorld();const r=canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObject(terrain,false)[0];return hit?[hit.point.x,hit.point.z]:null;}
  return {scene,camera,hero,obstacles,interactives,blocked,heightAt,load,update,project,pick,spawnEnemy,clearEnemy,orbit(dx,dy){orbitYaw=Math.atan2(Math.sin(orbitYaw-dx*.005),Math.cos(orbitYaw-dx*.005));orbitPitch=Math.max(-.65,Math.min(1,orbitPitch+dy*.003));hero.root.rotation.y=orbitYaw+Math.PI;},faceView(){hero.root.rotation.y=orbitYaw+Math.PI;},followHeading(yaw,dt){const target=yaw-Math.PI,delta=Math.atan2(Math.sin(target-orbitYaw),Math.cos(target-orbitYaw));orbitYaw+=delta*(1-Math.exp(-dt*8));},zoom(delta){orbitDistance=Math.max(2.8,Math.min(6.5,orbitDistance+delta*.004));},movementAxes(){return {forward:[-Math.sin(orbitYaw),-Math.cos(orbitYaw)],right:[Math.cos(orbitYaw),-Math.sin(orbitYaw)]};},cameraState:()=>({yaw:orbitYaw,heroYaw:hero.root.rotation.y,pitch:orbitPitch,distance:orbitDistance,position:camera.position.toArray(),height:camera.position.y-hero.root.position.y}),get guard(){return guard;},get boss(){return boss;},get gates(){return gates;},get randomEnemy(){return randomEnemy;},destination,resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}};
}
