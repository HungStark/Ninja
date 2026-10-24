import {oreState} from './spirit-mines.js';
import {INTERIORS,interiorForSave,buildInterior} from './adventure-interiors.js';
import {createVillageStoryActors} from './village-story-actors.js';
import {placeVillageGuards} from './guard-placement.js';
import {createGuardAmbush} from './guard-ambush.js';
import {createTransformationSmoke} from './transformation-smoke.js';
import {HOME,INTRO_SQUAD,villageGuards,villageSidequests} from './journey-story.js';
import {createVandalFireworks} from './vandal-fireworks.js';
import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {buildHouse,buildDistrict,buildBoss} from './adventure-landmarks.js';
import {village,VILLAGES,QUESTS,findPath} from './adventure-data.js';
import {REGIONS,regionMetrics,terrainHeight,riverAt,isDeepWater,waterwayAt,waterDepthAt} from './adventure-world.js';
import {traversalDefinitions,buildBiome,createStorm,traversalComponent} from './adventure-biomes.js';
import {addWarVegetation} from './adventure-ruins.js';
import {createCharacterPhysics} from './adventure-physics.js';
import {registerSceneryColliders,colliderFromGeometry} from './adventure-colliders.js';
import {createVillageSurfaces} from './adventure-materials.js';
import {buildVillageSettlement} from './adventure-settlements.js';
import {HOUSE_WIDTH_SCALE} from './adventure-building-scale.js';
import {encounterAppearance} from './encounter-appearance.js';
import {planVillageShop,buildVillageShop} from './village-shop.js';
import {createHero} from './hero.js';
import {equipmentState} from './equipment.js';
import {createVillager} from './villager.js';
import {createNinja} from './ninja.js';
import {villagerAppearance} from './villager-appearance.js';
import {createCameraHeight} from './camera-height.js';
import {createContactShadows,villageLighting} from './adventure-presentation.js';
import {dressVillage} from './adventure-dressing.js';
import {createQuestItem} from './quest-items.js';

const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.95,flatShading:true,...extra});
function mesh(g,m,parent,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
const box=(p,m,x,y,z,w,h,d)=>mesh(new T.BoxGeometry(w,h,d),m,p,x,y,z);
const cyl=(p,m,x,y,z,r,h,n=8)=>mesh(new T.CylinderGeometry(r,r,h,n),m,p,x,y,z);
function seeded(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}

export function createAdventureScene(){
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(49,innerWidth/innerHeight,.1,340),land=new T.Group();scene.add(land);
  const ambient=new T.HemisphereLight('#dfe8f0','#51554b',1.35);scene.add(ambient);
  const sun=new T.DirectionalLight('#ffe5b9',3.1);sun.position.set(-35,65,28);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:180});sun.shadow.bias=-.0005;sun.shadow.normalBias=.03;scene.add(sun);
  const fill=new T.DirectionalLight('#a9c9ed',.36);fill.position.set(20,25,-35);scene.add(fill);scene.add(sun.target);
  const hero=createHero(),previousHeroPosition=new T.Vector3();scene.add(hero.root);
  const contacts=createContactShadows(scene),reliefMaps=new WeakMap();let dressingCount=0,visualQuality=1;
  const shadowOffset=new T.Vector3(-38,62,26);
  function focusSun(){const p=hero.root.position,texel=64/sun.shadow.mapSize.x,x=Math.round(p.x/texel)*texel,z=Math.round(p.z/texel)*texel,y=Math.round(p.y/2)*2;sun.target.position.set(x,y,z);sun.position.copy(sun.target.position).add(shadowOffset);}
  function setQuality(index){
    visualQuality=index;const size=[2048,1024,512][index]||1024;sun.castShadow=index!==2;
    if(sun.shadow.mapSize.x!==size){sun.shadow.mapSize.set(size,size);sun.shadow.map?.dispose();sun.shadow.map=null;}sun.shadow.needsUpdate=true;
    for(const m of Object.values(surfaces||{}).flat())if(m?.isMaterial){if(m.bumpMap&&!reliefMaps.has(m))reliefMaps.set(m,m.bumpMap);const bump=index===2?null:reliefMaps.get(m)||null;if(m.bumpMap!==bump){m.bumpMap=bump;m.needsUpdate=true;}}
  }
  const obstacles=[],interactives=[],animated=[],citizens=[],party=[],residents=[],materials=new Map(),questActors=new Map();
  let room=null,oreNodes=new Map(),miningTime=0;const pickaxe=new T.Group();pickaxe.visible=false;pickaxe.position.set(0,-.45,.05);hero.arms[1].elbow.add(pickaxe);const pickWood=mat('#7c6545'),pickIron=mat('#8c9b9a');cyl(pickaxe,pickWood,0,0,0,.045,1.1,6);box(pickaxe,pickIron,0,.5,0,.95,.14,.15);
  let shopPlot=null,npc,guard,boss,terrain,foliage,gates=[],bridges=[],routes=[],ride=null,surface=null,randomEnemy=null,current='nameless',time=0,corridors=[];
  const storm=createStorm(scene),fireworks=createVandalFireworks(scene),guardSmoke=createTransformationSmoke(scene);let roadGuards=[],sabotage=null;const guardCharacters=new Set();
  const metrics=()=>room?{scale:1,limit:64,size:Math.max(room.bounds.x*2,room.bounds.maxZ-room.bounds.minZ),area:room.bounds.x*2*(room.bounds.maxZ-room.bounds.minZ),gateRadius:0,arrivalRadius:0}:regionMetrics(current);
  const cemetery=REGIONS.nameless.zones.find(z=>z.id==='war-cemetery');
  const reservedLandscape=(x,z,padding=0)=>current==='nameless'&&Math.hypot(x-HOME.x,z-HOME.z)<6+padding||current==='nameless'&&Math.hypot(x-cemetery.x,z-cemetery.z)<cemetery.radius+1+padding||physics.solids.some(s=>physics.touches(s,x,z,padding));
  let surfaces=null,settlementPaths=[],settlementYards=[];
  let orbitYaw=0,orbitPitch=.2,orbitDistance=4.2;const cameraHeight=createCameraHeight();
  const groundHeight=(x,z)=>room?0:terrainHeight(current,x,z);
  const bridgeAt=(x,z,padding=0)=>bridges.find(b=>Math.abs((x-b.x)*b.dx+(z-b.z)*b.dz)<=b.half+padding&&Math.abs((x-b.x)*b.dz-(z-b.z)*b.dx)<=b.width/2+padding);
  const bridgeHeight=(b,x,z)=>{const t=Math.max(0,Math.min(1,((x-b.x)*b.dx+(z-b.z)*b.dz+b.half)/(2*b.half)));return b.start+(b.end-b.start)*t+Math.sin(t*Math.PI)*.4+.035;};
  const heightAt=(x,z)=>{const bridge=bridgeAt(x,z);if(bridge)return bridgeHeight(bridge,x,z);if(current==='water'&&routes.some(r=>[r.from,r.to].some(p=>Math.abs(x-p[0])<1.3&&Math.abs(z-p[1])<1.65)))return -.35;if(current==='ice'){const river=riverAt(current,z);if(Math.abs(x-river.x)<=river.width)return river.y+.025;}return groundHeight(x,z);};
  const platformFor=key=>routes.find(r=>r.platform?.id===key);
  const standingHeightAt=(x,z)=>{const b=bridgeAt(x,z,.25);return b?bridgeHeight(b,x,z):current==='fire'&&Math.hypot(x-88,z+96)<10?36:heightAt(x,z);};
  const heroHeightAt=(x,z)=>surface?platformFor(surface)?.toY??standingHeightAt(x,z):standingHeightAt(x,z);
  const physics=createCharacterPhysics({position:hero.root.position,baseFloor:(x,z)=>surface?platformFor(surface)?.toY??groundHeight(x,z):current==='ice'?heightAt(x,z):groundHeight(x,z),staticBlocked:(x,z)=>surface?platformBlocked(surface,x,z):boundaryBlocked(x,z)||current==='water'&&isDeepWater(x,z)&&!waterDeckAt(x,z,hero.root.position.y+.4)});
  const storyActors=createVillageStoryActors({scene,hero,blocked,floor:(x,z)=>physics.floorAt(x,z,standingHeightAt(x,z)+.55)});
  const contactFloor=(x,z,ceiling)=>physics.floorAt(x,z,ceiling,current==='ice'?heightAt(x,z):groundHeight(x,z));
  const waterDeckAt=(x,z,ceiling=Infinity)=>physics.floorAt(x,z,ceiling)>=waterwayAt(x,z).y-.15;
  function platformBlocked(key,x,z,padding=0){const p=platformFor(key)?.platform;if(!p)return true;const dx=x-p.x,dz=z-p.z,outside=p.ellipse?(dx/(p.width/2-.5))**2+(dz/(p.depth/2-.5))**2>1:Math.abs(dx)>=p.width/2-.25||Math.abs(dz)>=p.depth/2-.25;
    const notch=p.stairNotch&&dx>2.4&&dz>1.5&&!(Math.abs(dz-3)<.8&&dx<5.05);
    return outside||notch||(p.ellipse||p.customLayout?(p.obstacles||[]).some(o=>Math.hypot(x-o.x,z-o.z)<o.r+padding):Math.abs(dx)<2.65+padding&&Math.abs(dz)<2.15+padding);}
  function canHeroMove(x,z){return physics.canMoveTo(x,z);}
  function navigationBlocked(key=null){return key?(x,z)=>platformBlocked(key,x,z,.3)||physics.overlaps(x,z,platformFor(key)?.toY??0,2.85,.65,true):blocked;}
  function startTraversal(id,side=0){if(ride||!physics.state().grounded)return false;const route=routes.find(r=>r.id===id);if(!route)return false;const p=side?route.to:route.from,y=side?route.toY:route.fromY;if(Math.hypot(hero.root.position.x-p[0],hero.root.position.z-p[1])>2.5||Math.abs(hero.root.position.y-y)>4)return false;physics.reset();ride={route,side,progress:side?1:0,moved:false};if(route.carved){const point=side?route.carved.path.at(-1):route.carved.path[0];hero.root.position.set(point.x,point.y,point.z);physics.reset(point.y);}if(route.ledges){ride.rock=true;ride.index=side?route.ledges.length-1:0;ride.mode='perch';ride.axis=1;const point=route.ledges[ride.index];hero.root.position.set(point.x,point.y,point.z);physics.reset(point.y);}if(route.boat){route.boat.visible=true;for(const boat of route.idleBoats||[])boat.visible=false;}return true;}
  function rockJump(){if(!ride?.rock)return false;if(ride.mode==='hang'){ride.mode='mantle';ride.jumpFrom=hero.root.position.clone();ride.jumpTime=0;return true;}if(ride.mode!=='perch')return false;const direction=(ride.side?-1:1)*(ride.axis<0?-1:1),target=ride.index+direction;if(target<0||target>=ride.route.ledges.length)return false;ride.target=target;ride.jumpFrom=hero.root.position.clone();ride.jumpTime=0;ride.mode='jump';return true;}
  function releaseCliff(){if(!ride?.rock)return false;ride=null;physics.reset(hero.root.position.y);previousHeroPosition.copy(hero.root.position);return true;}
  function tryGrabLedge(){
    if(ride){if(!ride.rock||ride.mode!=='jump'||ride.jumpTime<.28)return false;ride.mode='hang';}
    else {if(physics.state().grounded)return false;const route=routes.find(r=>r.ledges);if(!route)return false;const p=hero.root.position,point=route.ledges.filter(l=>Math.abs(l.y-p.y-2.3)<1.15&&Math.hypot(l.x-p.x,l.z+1.4-p.z)<3).sort((a,b)=>Math.abs(a.y-p.y-2.3)-Math.abs(b.y-p.y-2.3))[0];if(!point)return false;ride={route,side:0,rock:true,index:Math.max(0,point.index-1),target:point.index,mode:'hang',progress:point.index/(route.ledges.length-1),moved:true,axis:1};}
    const point=ride.route.ledges[ride.target];hero.root.position.set(point.x,point.y-2.25,point.z+point.front+.42);hero.root.rotation.y=Math.PI;return true;
  }
  function advanceRock(dt,axis,automatic){
    const r=ride,points=r.route.ledges;r.axis=axis;
    if(r.mode==='hang'){if(axis<0){releaseCliff();return null;}if(axis>0||automatic)rockJump();else return null;}
    if(r.mode==='perch'){if(automatic)rockJump();else return null;}
    r.jumpTime+=dt;const duration=r.mode==='mantle'?.6:.8,t=Math.min(1,r.jumpTime/duration),target=points[r.target],p=hero.root.position,arc=r.mode==='mantle'?.35:1.5;
    p.set(r.jumpFrom.x+(target.x-r.jumpFrom.x)*t,r.jumpFrom.y+(target.y-r.jumpFrom.y)*t+4*arc*t*(1-t),r.jumpFrom.z+(target.z-r.jumpFrom.z)*t);hero.root.rotation.y=Math.atan2(target.x-r.jumpFrom.x,target.z-r.jumpFrom.z);r.progress=(r.index+(r.target-r.index)*t)/(points.length-1);
    if(t===1){r.index=r.target;r.mode='perch';r.moved=true;physics.reset(target.y);if(r.index===(r.side?0:points.length-1)){const result={id:r.route.id,side:r.side?0:1,surface:null};ride=null;surface=null;previousHeroPosition.copy(p);return result;}}return null;
  }
  function recoverHero(){if(ride?.route.boat){ride.route.boat.visible=false;for(const boat of ride.route.idleBoats||[])boat.visible=true;}ride=null;if(!physics.recover({force:true})){surface=null;hero.root.position.set(room?.spawn[0]||0,room?0:heightAt(0,7),room?.spawn[1]||7);physics.reset(hero.root.position.y);}previousHeroPosition.copy(hero.root.position);followCamera(1,true,false);return true;}
  function jumpHero(){if(ride?.route.carved){ride=null;physics.reset(physics.floorAt(hero.root.position.x,hero.root.position.z,hero.root.position.y+.4));}return ride?.rock?rockJump():!ride&&physics.jump();}
  function advanceCarved(dt,axis,automatic){
    const r=ride.route,stairs=r.carved,direction=ride.side?-1:1,amount=dt*(r.speed||4)/stairs.length*(automatic?direction:axis*direction);
    ride.progress=Math.max(0,Math.min(1,ride.progress+amount));ride.walking=!!amount;if(amount)ride.moved=true;
    const distance=ride.progress*stairs.length;let lo=0,hi=stairs.path.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(stairs.distances[m]<=distance)lo=m;else hi=m;}
    const a=stairs.path[lo],b=stairs.path[lo+1],t=(distance-stairs.distances[lo])/Math.max(.001,stairs.distances[lo+1]-stairs.distances[lo]),p=hero.root.position;
    p.x=a.x+(b.x-a.x)*t;p.z=a.z+(b.z-a.z)*t;const floor=stairs.heightAt(p.x,p.z);p.y=Number.isFinite(floor)?floor:a.y+(b.y-a.y)*t;ride.cameraY=a.y+(b.y-a.y)*t;
    if(amount){hero.root.rotation.y=Math.atan2((b.x-a.x)*Math.sign(amount),(b.z-a.z)*Math.sign(amount));const target=hero.root.rotation.y-Math.PI,delta=Math.atan2(Math.sin(target-orbitYaw),Math.cos(target-orbitYaw));orbitYaw+=delta*(1-Math.exp(-dt*5));}
    if(ride.moved&&(ride.progress===0||ride.progress===1)){const side=ride.progress;ride=null;surface=side?r.platform?.id||null:null;physics.reset(p.y);previousHeroPosition.copy(p);return {id:r.id,side,surface};}return null;
  }
  function advanceTraversal(dt,axis=0,automatic=false){if(!ride)return null;if(ride.route.carved)return advanceCarved(dt,axis,automatic);if(ride.rock)return advanceRock(dt,axis,automatic);const r=ride.route,direction=ride.side?-1:1,length=Math.max(1,Math.hypot(r.spiral?r.spiral.radius*r.spiral.turns*Math.PI*2:r.to[0]-r.from[0],r.spiral?0:r.to[1]-r.from[1],r.toY-r.fromY)),amount=dt*(r.kind==='raft'?7:r.speed||3.5)/length*(['raft','cave'].includes(r.kind)||automatic?direction:axis*direction);ride.progress=Math.max(0,Math.min(1,ride.progress+amount));if(amount)ride.moved=true;ride.walking=!!amount;const t=ride.progress,p=hero.root.position;p.x=r.from[0]+(r.to[0]-r.from[0])*t;p.z=r.from[1]+(r.to[1]-r.from[1])*t;p.y=r.kind==='raft'?-.28:r.fromY+(r.toY-r.fromY)*t;if(r.boat)r.boat.position.set(p.x,p.y-.28,p.z);
    if(r.spiral){const a=r.spiral.angle+t*r.spiral.turns*Math.PI*2;p.x=r.spiral.x+Math.sin(a)*r.spiral.radius;p.z=r.spiral.z+Math.cos(a)*r.spiral.radius;if(amount){hero.root.rotation.y=Math.atan2(Math.cos(a)*Math.sign(amount),-Math.sin(a)*Math.sign(amount));const target=hero.root.rotation.y-Math.PI,delta=Math.atan2(Math.sin(target-orbitYaw),Math.cos(target-orbitYaw));orbitYaw+=delta*(1-Math.exp(-dt*8));}}
    if(r.boat)r.boat.position.set(p.x,p.y-.28,p.z);
    if(ride.moved&&(t===0||t===1)){surface=t===1?r.platform?.id||null:null;if(r.boat){r.boat.visible=false;for(const boat of r.idleBoats||[])boat.visible=true;}ride=null;physics.reset(heroHeightAt(p.x,p.z));previousHeroPosition.copy(p);return {id:r.id,side:t,surface};}return null;
  }
  const destination=mesh(new T.RingGeometry(.3,.5,40),new T.MeshBasicMaterial({color:'#f7dca3',side:T.DoubleSide,transparent:true,opacity:.9}),scene);destination.rotation.x=-Math.PI/2;destination.visible=false;
  const M=(color,emission=0)=>{const key=color+':'+emission;if(!materials.has(key))materials.set(key,mat(color,emission?{emissive:color,emissiveIntensity:emission}:{}));return materials.get(key);};
  const group=(x=0,z=0)=>{const g=new T.Group();g.position.set(x,heightAt(x,z),z);land.add(g);return g;};
  function solidMesh(object,{name='landscape-solid',stepable=true}={}){
    object.userData.collider=true;
    object.updateWorldMatrix(true,false);object.geometry.computeBoundingBox();const bounds=object.geometry.boundingBox,m=object.matrixWorld,yaw=Math.atan2(m.elements[8],m.elements[10]),cos=Math.cos(yaw),sin=Math.sin(yaw),center=new T.Vector3().setFromMatrixPosition(m);let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity,bottom=Infinity,top=-Infinity;
    for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new T.Vector3(x,y,z).applyMatrix4(m),dx=p.x-center.x,dz=p.z-center.z,lx=dx*cos-dz*sin,lz=dx*sin+dz*cos;minX=Math.min(minX,lx);maxX=Math.max(maxX,lx);minZ=Math.min(minZ,lz);maxZ=Math.max(maxZ,lz);bottom=Math.min(bottom,p.y);top=Math.max(top,p.y);}
    return physics.addBox({name,x:center.x,z:center.z,w:maxX-minX,d:maxZ-minZ,yaw,bottom,top,stepable});
  }
  function solidGeometry(object,{name='landscape-solid',flat=false}={}){object.updateWorldMatrix(true,false);const collider=colliderFromGeometry(object.geometry,object.matrixWorld,name);if(collider){if(flat){delete collider.topAt;delete collider.bottomAt;}object.userData.collider=true;return physics.addBox(collider);}}
  function disposeObject(root,extraMaterials=[]){const geoms=new Set(),mats=new Set(extraMaterials);root.traverse(o=>{if(o.geometry)geoms.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])mats.add(m);});for(const g of geoms)g.dispose();const textures=new Set();for(const m of mats){for(const key of ['map','bumpMap','roughnessMap'])if(m[key])textures.add(m[key]);m.dispose();}for(const texture of textures)texture.dispose();}
  function disposeLand(){oreNodes.clear();miningTime=0;pickaxe.visible=false;disposeObject(land,Object.values(surfaces||{}).flat().filter(m=>m?.isMaterial));land.clear();questActors.clear();physics.clear();obstacles.length=0;interactives.length=0;animated.length=0;citizens.length=0;party.length=0;residents.length=0;bridges=[];routes=[];ride=null;surface=null;materials.clear();randomEnemy=null;boss=null;foliage=null;}
  function segmentDistance(x,z,target){const dot=Math.max(0,Math.min(1,(x*target.x+z*target.z)/(target.x*target.x+target.z*target.z||1)));return Math.hypot(x-target.x*dot,z-target.z*dot);}
  const laneDistance=(x,z,p)=>{const dx=p.b[0]-p.a[0],dz=p.b[1]-p.a[1],t=Math.max(0,Math.min(1,((x-p.a[0])*dx+(z-p.a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-p.a[0]-dx*t,z-p.a[1]-dz*t);};
  const clearCorridor=(x,z,padding=0)=>shopPlot&&Math.abs(x-shopPlot.x)<8+padding&&Math.abs(z-shopPlot.z-2)<10+padding||settlementYards.some(p=>Math.hypot(x-p.x,z-p.z)<p.r+padding)||settlementPaths.some(p=>laneDistance(x,z,p)<p.width/2+padding)||Math.hypot(x,z)<9+padding||corridors.some(t=>segmentDistance(x,z,t)<2.25+padding)||interactives.some(t=>Math.hypot(x-t.x,z-t.z)<3.2+padding);
  function obstacle(x,z,w,d){const halfW=w/2+.7,halfD=d/2+.7;if(clearCorridor(x,z,Math.hypot(halfW,halfD)))return false;obstacles.push({x,z,w:halfW,d:halfD});return true;}
  function boundaryBlocked(x,z){if(room)return Math.abs(x)>room.bounds.x-.55||z<room.bounds.minZ+.55||z>room.bounds.maxZ-.55;return Math.abs(x)>metrics().limit-1||Math.abs(z)>metrics().limit-1||(current==='earth'&&Math.abs(x)<4.5&&z<-13.2&&z>-23);}
  function baseBlocked(x,z){return boundaryBlocked(x,z)||(current==='water'&&isDeepWater(x,z)&&!waterDeckAt(x,z))||obstacles.some(o=>Math.abs(x-o.x)<o.w&&Math.abs(z-o.z)<o.d);}
  function blocked(x,z){return baseBlocked(x,z)||physics.overlaps(x,z,standingHeightAt(x,z),2.85,.36,true,.19);}
  function road(target,width=2.1){
    const worn=current==='nameless',length=Math.hypot(target.x,target.z),steps=Math.max(2,Math.ceil(length/(worn?.8:1.8))),dx=target.x/length,dz=target.z/length,positions=[],uv=[],indices=[],colors=[],earth=new T.Color('#82745a'),dust=new T.Color('#938469'),sides=worn?[-1,-.62,0,.62,1]:[-1,1],columns=sides.length;
    for(let k=0;k<=steps;k++){const t=k/steps;for(const side of sides){const edge=worn?.86+Math.sin(k*2.7+side+target.x)*.1+Math.sin(k*.8)*.09:surfaces?.91+Math.sin(k*.71+target.x)*.06:1,bend=surfaces&&!bridgeAt(target.x*t,target.z*t)?Math.sin(t*Math.PI)*Math.sin(target.x*.17+target.z*.13)*.85:0,x=target.x*t+dz*(width*edge*side/2+bend),z=target.z*t-dx*(width*edge*side/2+bend);positions.push(x,heightAt(x,z)+(bridgeAt(x,z)?-.08:.035),z);uv.push((side+1)/2,t*length/2);if(worn){const dirt=earth.clone().lerp(dust,(1+Math.sin(k*.9+target.z+side))*.3),variation=(Math.sin(x*.17)*Math.cos(z*.13)+Math.sin(x*.39+z*.25)*.3+1.3)/2.6,color=new T.Color(village(current).ground).multiplyScalar(1-variation*.067).lerp(dirt,Math.abs(side)>.9?.08:.82);colors.push(color.r,color.g,color.b);}}if(k<steps)for(let col=0;col<columns-1;col++){const n=k*columns+col;indices.push(n,n+columns,n+1,n+1,n+columns,n+columns+1);}}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));if(worn)geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();const r=mesh(geo,worn?new T.MeshStandardMaterial({vertexColors:true,roughness:1}):surfaces?.path||M(village(current).path),land);r.receiveShadow=true;r.name=worn?'worn-earth-road':'village-road';
    if(worn)for(let k=4;k<steps;k+=3){const t=k/steps,x=target.x*t,z=target.z*t;if(bridgeAt(x,z))continue;for(const side of [-1,1]){const rut=box(land,M('#7b7056'),x+dz*side*.37,heightAt(x+dz*side*.37,z-dx*side*.37)+.047,z-dx*side*.37,.022,.008,.2+(k%4)*.09);rut.rotation.y=Math.atan2(dx,dz);}}
  }
  function planBridge(target,width){
    if(current==='water')return;
    const length=Math.hypot(target.x,target.z),dx=target.x/length,dz=target.z/length,side=t=>target.x*t-riverAt(current,target.z*t).x;
    let previous=side(0),previousT=0;
    for(let k=1;k<=80;k++){const t=k/80,value=side(t);if(value*previous<0){let low=previousT,high=t;for(let j=0;j<18;j++){const mid=(low+high)/2;if(side(low)*side(mid)<=0)high=mid;else low=mid;}const ratio=(low+high)/2,x=target.x*ratio,z=target.z*ratio,river=riverAt(current,z),tangent=(riverAt(current,z+.1).x-riverAt(current,z-.1).x)/.2,normal=Math.abs(dx-dz*tangent)/Math.hypot(1,tangent);
        if(normal>.25&&!bridges.some(b=>Math.hypot(b.x-x,b.z-z)<5)){const half=Math.min(30,(river.width+2.2)/normal);if(Math.abs(x)+Math.abs(dx)*(half+2)>metrics().limit-2||Math.abs(z)+Math.abs(dz)*(half+2)>metrics().limit-2){previous=value;previousT=t;continue;}bridges.push({x,z,dx,dz,half,width:width+.65,start:groundHeight(x-dx*half,z-dz*half),end:groundHeight(x+dx*half,z+dz*half)});}}
      previous=value;previousT=t;
    }
  }
  function addBridges(){
    const openingAt=p=>interactives.some(i=>Math.hypot(p.x-i.x,p.z-i.z)<1.9);
    const openingBetween=(a,b)=>[0,.5,1].some(t=>openingAt({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t}));
    for(const b of bridges)physics.addBox({name:'bridge-deck',x:b.x,z:b.z,w:b.width,d:b.half*2,yaw:Math.atan2(b.dx,b.dz),topAt:(x,z)=>bridgeHeight(b,x,z),bottomAt:(x,z)=>bridgeHeight(b,x,z)-.18});
    for(const b of bridges){const g=new T.Group();g.name='river-bridge';land.add(g);const worn=current==='nameless',planks=M(current==='fire'?'#827265':current==='ice'?'#8d9e9b':worn?'#706852':'#85745b'),wood=M(current==='fire'?'#5e514a':'#514c44'),segments=Math.ceil(b.half*2/.5);g.userData.weathered=worn;
      for(let k=0;k<segments;k++){const along=-b.half+(k+.5)*2*b.half/segments,x=b.x+b.dx*along,z=b.z+b.dz*along,y=bridgeHeight(b,x,z),width=b.width-(worn?(k%4)*.1:0);const plank=box(g,worn&&k%3===0?M('#83785d'):planks,x,y-.09,z,width,.18,2*b.half/segments+.025);plank.rotation.y=Math.atan2(b.dx,b.dz);if(worn){plank.rotation.z=Math.sin(k*4)*.009;for(const side of [-1,1]){const crack=box(g,M('#48483b'),x+b.dz*side*width*.28,y+.006,z-b.dx*side*width*.28,.035,.012,.25);crack.rotation.y=plank.rotation.y;}if(k%5===0){const moss=box(g,M('#646849'),x+b.dz*b.width*.38,y+.015,z-b.dx*b.width*.38,.42,.018,.32);moss.rotation.y=plank.rotation.y;}}}
      for(const side of [-1,1]){let previous;
        for(let k=0;k<=Math.ceil(b.half);k++){const along=-b.half+k*(2*b.half/Math.ceil(b.half)),x=b.x+b.dx*along+b.dz*side*(b.width/2-.12),z=b.z+b.dz*along-b.dx*side*(b.width/2-.12),y=bridgeHeight(b,x,z),ground=groundHeight(x,z),broken=worn&&(k+(side===1?2:0))%5===2,topY=y+(broken?.24:.88),opening=openingAt({x,z});if(!opening){const post=box(g,wood,x,(ground+topY+.12)/2,z,.16,topY+.12-ground,.16);if(worn)post.rotation.z=side*Math.sin(k*2)*.09;solidMesh(post,{name:'bridge-post',stepable:false});}
          const top=new T.Vector3(x,topY,z);if(previous&&!opening&&!broken&&!(worn&&k%5===3)&&!openingBetween(previous,top)){const delta=top.clone().sub(previous),rail=box(g,wood,(top.x+previous.x)/2,(top.y+previous.y)/2,(top.z+previous.z)/2,.13,.13,delta.length());rail.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),delta.normalize());solidMesh(rail,{name:'bridge-rail',stepable:false});}previous=opening||broken?null:top;
        }
      }
    }
  }
  function arch(target,v){const g=group(target.x,target.z);g.rotation.y=Math.atan2(target.x,target.z);const timber=M(v.roof),stone=M('#acae9c');for(const s of [-1,1]){box(g,stone,s*2.8,.35,0,1,.7,1);box(g,timber,s*2.8,3.2,0,.5,6,.5);}box(g,timber,0,5.8,0,7,.5,.9);box(g,timber,0,6.5,0,8,.3,1.3);box(g,M(v.color,.25),0,5.8,.5,1,1,.08);}
  function addTerrain(v){
    const resolution=metrics().scale===2?256:192,geo=new T.PlaneGeometry(metrics().limit*2+40,metrics().limit*2+40,resolution,resolution);geo.rotateX(-Math.PI/2);const p=geo.attributes.position,colors=[],base=new T.Color(v.ground),warm=new T.Color(v.path),shade=new T.Color(v.ground).multiplyScalar(.76),stone=new T.Color(current==='fire'?'#655751':current==='ice'?'#d2dddd':'#999382');
    const scars=current==='nameless'?[[-10,16],[13,-15],[-34,-11],[35,29],[-41,35],[24,-45]]:[];
    for(let k=0;k<p.count;k++){const x=p.getX(k),z=p.getZ(k),h=groundHeight(x,z),river=riverAt(current,z),bank=Math.abs(x-river.x)-river.width,slope=Math.hypot(groundHeight(x+.5,z)-groundHeight(x-.5,z),groundHeight(x,z+.5)-groundHeight(x,z-.5)),variation=(Math.sin(x*.17)*Math.cos(z*.13)+Math.sin(x*.39+z*.25)*.3+1.3)/2.6,c=base.clone().lerp(shade,variation*.28).lerp(warm,Math.max(0,1-Math.abs(bank-1.5)/4)*.48).lerp(stone,Math.min(.6,Math.max(0,slope-.3)*.65));if(current==='nameless'){c.lerp(warm,Math.max(0,Math.sin(x*.26+z*.17)*Math.cos(z*.23))*.45);const scar=Math.min(...scars.map(([sx,sz])=>Math.hypot(x-sx,z-sz)));c.lerp(new T.Color('#4d4b3d'),Math.max(0,1-scar/5)*.7);}p.setY(k,h);colors.push(c.r,c.g,c.b);}
    if(current==='earth'){const indices=[];for(let k=0;k<geo.index.count;k+=3){const a=geo.index.getX(k),b=geo.index.getX(k+1),c=geo.index.getX(k+2),x=(p.getX(a)+p.getX(b)+p.getX(c))/3,z=(p.getZ(a)+p.getZ(b)+p.getZ(c))/3;if(!(Math.abs(x)<4.5&&z<-13&&z>-23))indices.push(a,b,c);}geo.setIndex(indices);}
    geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();if(surfaces){const uv=geo.attributes.uv;for(let k=0;k<p.count;k++)uv.setXY(k,p.getX(k)/5,p.getZ(k)/5);uv.needsUpdate=true;}
    terrain=mesh(geo,surfaces?.ground||new T.MeshStandardMaterial({vertexColors:true,roughness:1}),land);terrain.name='village-terrain';terrain.castShadow=false;
  }
  function addVegetation(v,rand){
    if(current==='nameless'){addWarVegetation({group,box,mesh,M,heightAt,clearCorridor,obstacles,obstacle,reserved:reservedLandscape,inRiver:(x,z,pad)=>Math.abs(x-riverAt(current,z).x)<riverAt(current,z).width+pad},rand);return;}
    const count=({water:42,wind:28,earth:18,fire:45,light:52,ice:0,wood:200,dark:68,nameless:70,lightning:25})[current]*metrics().scale,trunks=new T.InstancedMesh(new T.CylinderGeometry(.15,.24,1,6),M('#535044'),count),crowns=new T.InstancedMesh(['ice','dark'].includes(current)?new T.ConeGeometry(1,2,6):new T.IcosahedronGeometry(1,0),M(v.tree),count),rocks=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),M(current==='earth'?'#aa855c':current==='ice'?'#b8d2d4':'#72787a'),100),cover=new T.InstancedMesh(new T.ConeGeometry(.17,.6,3),M(current==='ice'?'#d7e2dd':v.tree),1100),dummy=new T.Object3D(),items=[];
    let n=0;for(let k=0;k<count*5&&n<count;k++){const x=(rand()-.5)*(metrics().limit*2+6),z=(rand()-.5)*(metrics().limit*2+6),s=1.2+rand()*2.3,isDesert=['earth','lightning','fire'].includes(current),leafScale=s*(isDesert?.65:current==='water'?.75:1.25);if(Math.abs(x-riverAt(current,z).x)<riverAt(current,z).width+.8||clearCorridor(x,z,leafScale+1)||obstacles.some(o=>Math.abs(x-o.x)<o.w+2&&Math.abs(z-o.z)<o.d+2))continue;const y=heightAt(x,z);dummy.position.set(x,y+s*.7,z);dummy.scale.set(s*.8,s*1.4,s*.8);dummy.rotation.set(0,rand()*6,0);dummy.updateMatrix();trunks.setMatrixAt(n,dummy.matrix);const leafY=leafScale*(current==='water'?.75:1);dummy.position.set(x,y+s*1.4+leafY*.65,z);dummy.scale.set(leafScale,leafY,leafScale);dummy.updateMatrix();crowns.setMatrixAt(n,dummy.matrix);items.push({matrix:dummy.matrix.clone(),center:dummy.position.clone(),radius:leafScale*1.2,hidden:false});if(!isDesert)obstacle(x,z,.9,.9);n++;}trunks.count=n;crowns.count=n;foliage={mesh:crowns,items};
    for(let k=0;k<100;k++){const x=(rand()-.5)*(metrics().limit*2+10),z=(rand()-.5)*(metrics().limit*2+10),s=.4+rand()*1.9;dummy.position.set(x,heightAt(x,z)+s*.5,z);dummy.scale.set(s,s*(current==='earth'?3.2:.7),s);if(clearCorridor(x,z,1))dummy.scale.setScalar(0);dummy.rotation.set(0,rand()*6,.1);dummy.updateMatrix();rocks.setMatrixAt(k,dummy.matrix);}
    for(let k=0;k<1100;k++){const x=(rand()-.5)*(metrics().limit*2+3),z=(rand()-.5)*(metrics().limit*2+3),s=clearCorridor(x,z,.3)||Math.abs(x-riverAt(current,z).x)<riverAt(current,z).width+.5?0:.7+rand()*1.2;dummy.position.set(x,heightAt(x,z)+.2,z);dummy.scale.setScalar(s);dummy.rotation.set(0,rand()*6,rand()*.3);dummy.updateMatrix();cover.setMatrixAt(k,dummy.matrix);}
    trunks.name='vegetation-trunks';crowns.name='vegetation-crowns';rocks.name='scenery-rocks';cover.name='ground-grass';trunks.castShadow=true;crowns.castShadow=true;rocks.castShadow=true;cover.castShadow=false;for(const o of [trunks,crowns,rocks,cover]){o.receiveShadow=true;land.add(o);}
  }
  function addBackdrop(v,rand){
    for(let k=0;k<23;k++){const a=k/23*Math.PI*2,r=metrics().limit+28+rand()*19,h=(current==='earth'||current==='ice'?24:13)+rand()*23,x=Math.sin(a)*r,z=Math.cos(a)*r;let geo;
      if(current==='wood')geo=new T.CylinderGeometry(2,4,h,6);else if(current==='earth')geo=new T.CylinderGeometry(4+rand()*3,8,h,5);else geo=new T.ConeGeometry(8+rand()*11,h,5);
      const p=mesh(geo,M(new T.Color(v.ground).multiplyScalar(.72).getStyle()),land,x,heightAt(x,z)+h/2-4,z);p.rotation.y=rand()*6;p.name='distant-backdrop';
      if(current==='ice'){const snow=mesh(new T.ConeGeometry(5+rand()*3,h*.4,5),M('#e4eae6'),land,x,p.position.y+h*.3,z);snow.rotation.y=p.rotation.y;}
      if(current==='wood'){const crown=mesh(new T.IcosahedronGeometry(13,0),M(v.tree),land,x,p.position.y+h*.45,z);crown.scale.y=.5;}
    }
  }
  function addWater(v){
    const color=current==='fire'?'#db692f':current==='ice'?'#a2cbd4':current==='dark'?'#655a86':current==='nameless'?'#737e70':'#67aab2',positions=[],indices=[];
    for(let k=0;k<=metrics().limit*2+20;k++){const z=-metrics().limit-10+k,river=riverAt(current,z);for(const side of [-1,1])positions.push(river.x+side*river.width,river.y+.025,z);if(k<metrics().limit*2+20){const n=k*2;indices.push(n,n+2,n+1,n+1,n+2,n+3);}}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.computeVertexNormals();const material=new T.MeshStandardMaterial({color,emissive:current==='fire'?color:'#000000',emissiveIntensity:.55,metalness:.2,roughness:current==='ice'?.3:.22,transparent:current!=='fire',opacity:.86});const water=mesh(geo,material,land);water.name='river-surface';water.castShadow=false;if(current!=='ice')animated.push({kind:'ripple',mesh:water});
    const shimmer=M(current==='fire'?'#f5af56':current==='ice'?'#d7eeea':current==='nameless'?'#a2a892':'#b4d7d1',.08);
    for(let k=0;k<46;k++){const z=-metrics().limit+k*metrics().limit*2/46,river=riverAt(current,z),x=river.x+Math.sin(k*2.4)*river.width*.6;const line=box(land,shimmer,x,river.y+.04,z,.35+(k%4)*.17,.012,.05);line.rotation.y=Math.sin(k)*.4;}
  }
  function addGroundDetails(rand){
    const gravel=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),M(current==='ice'?'#c4d5d6':current==='fire'?'#75675d':'#a49b85'),460),boulders=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),M(current==='earth'?'#a58261':'#777d73'),65),reeds=new T.InstancedMesh(new T.CylinderGeometry(.025,.045,1,4),M(current==='fire'?'#9e7150':current==='nameless'?'#8a7e5b':'#87936b'),180),dummy=new T.Object3D();
    let pebbles=0,stones=0,stems=0;
    for(let cluster=0;cluster<32;cluster++){const z=-metrics().limit+5+rand()*(metrics().limit*2-10),river=riverAt(current,z),side=rand()>.5?1:-1,shore=cluster<22,cx=shore?river.x+side*(river.width+.8+rand()*3):((rand()-.5)*metrics().limit*1.6),cz=z;
      for(let k=0;k<20&&pebbles<460;k++){const a=rand()*Math.PI*2,r=rand()*3.6,x=cx+Math.sin(a)*r,pz=cz+Math.cos(a)*r,s=.09+rand()*.25;if(reservedLandscape(x,pz,.5)||clearCorridor(x,pz,.4)||obstacles.some(o=>Math.abs(x-o.x)<o.w+.3&&Math.abs(pz-o.z)<o.d+.3)||bridgeAt(x,pz))continue;dummy.position.set(x,groundHeight(x,pz)+s*.23,pz);dummy.rotation.set(rand()*.4,rand()*6,rand()*.3);dummy.scale.set(s*(1+rand()),s*.45,s);dummy.updateMatrix();gravel.setMatrixAt(pebbles++,dummy.matrix);}
      if(stones<65&&!reservedLandscape(cx,cz,2.5)&&!clearCorridor(cx,cz,2.3)&&!obstacles.some(o=>Math.abs(cx-o.x)<o.w+2.5&&Math.abs(cz-o.z)<o.d+2.5)){const s=.7+rand()*1.1;dummy.position.set(cx,groundHeight(cx,cz)+s*.38,cz);dummy.rotation.set(.1,rand()*6,rand()*.15);dummy.scale.set(s*1.2,s*.7,s);dummy.updateMatrix();boulders.setMatrixAt(stones++,dummy.matrix);obstacle(cx,cz,s*1.5,s*1.5);}
      if(shore&&current!=='fire'&&current!=='ice')for(let k=0;k<7&&stems<180;k++){const x=cx+(rand()-.5)*2,pz=cz+(rand()-.5)*2;if(reservedLandscape(x,pz,.5)||clearCorridor(x,pz,.6)||obstacles.some(o=>Math.abs(x-o.x)<o.w&&Math.abs(pz-o.z)<o.d))continue;const h=.5+rand()*.65;dummy.position.set(x,groundHeight(x,pz)+h/2,pz);dummy.scale.set(1,h,1);dummy.rotation.set((rand()-.5)*.2,rand()*6,(rand()-.5)*.25);dummy.updateMatrix();reeds.setMatrixAt(stems++,dummy.matrix);}
    }
    gravel.count=pebbles;boulders.count=stones;reeds.count=stems;gravel.name='river-gravel';boulders.name='landscape-boulders';reeds.name='river-reeds';for(const object of [gravel,boulders,reeds]){object.castShadow=true;object.receiveShadow=true;land.add(object);}
  }
  function batchScenery(){
    const moving=new Set([...routes.flatMap(r=>[r.boat,...(r.idleBoats||[])]).filter(Boolean),...animated.map(a=>a.mesh),...citizens.flatMap(c=>[c.root,c.workstation]).filter(Boolean),...party.map(p=>p.char.root),...[...questActors.values()].map(a=>a.root),...roadGuards.map(g=>g.disguise)]),batches=new Map();land.updateMatrixWorld(true);
    land.traverse(o=>{if(!o.isMesh||!o.visible||o.isInstancedMesh||o===terrain||Array.isArray(o.material))return;for(let p=o;p&&p!==land;p=p.parent)if(moving.has(p)||p.userData.dynamic)return;if(!o.geometry.attributes.uv)return;const key=o.material.uuid;if(!batches.has(key))batches.set(key,{material:o.material,objects:[]});batches.get(key).objects.push(o);});
    for(const {material,objects} of batches.values()){if(objects.length<2)continue;const geos=objects.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);return g;});const geo=mergeGeometries(geos,false);for(const g of geos)g.dispose();if(!geo)continue;for(const o of objects){o.parent.remove(o);o.geometry.dispose();}const combined=new T.Mesh(geo,material);combined.castShadow=true;combined.receiveShadow=true;land.add(combined);}
  }
  function addSidequestActor(entry){
    let chosen=null;
    for(const radius of [0,2,4,6,9,13]){for(let k=0;k<16;k++){const a=k*Math.PI/8,x=entry.x+Math.sin(a)*radius,z=entry.z+Math.cos(a)*radius,y=physics.floorAt(x,z,heightAt(x,z)+.5);if(!blocked(x,z)&&!physics.overlaps(x,z,y,2.9,.6,true)&&!citizens.some(c=>Math.hypot(c.root.position.x-x,c.root.position.z-z)<2.1)){chosen={x,z,y};break;}}if(chosen)break;}
    if(chosen)Object.assign(entry,chosen);else entry.y=physics.floorAt(entry.x,entry.z,heightAt(entry.x,entry.z)+.5);
    let root,char=null;
    if(entry.questType==='combat'){char=createNinja(encounterAppearance({kind:entry.kind,village:current}));root=char.root;root.position.set(entry.x,entry.y,entry.z);root.rotation.y=Math.atan2(-entry.x,-entry.z);citizens.push(char);}
    else{root=createQuestItem({model:entry.targetModel,name:entry.label});root.position.set(entry.x,entry.y+.04,entry.z);}
    land.add(root);questActors.set(entry.id,{root,char});
  }
  function syncSidequests(save){if(room)return;
    const active=new Map(villageSidequests(current).filter(q=>save.story?.sidequests[q.id]===1).map(q=>[q.id,q]));
    for(let i=interactives.length-1;i>=0;i--){const entry=interactives[i];if(entry.kind!=='sidequest-target'||active.has(entry.id))continue;
      const actor=questActors.get(entry.id);if(actor){actor.root.removeFromParent();if(actor.char){const index=citizens.indexOf(actor.char);if(index>=0)citizens.splice(index,1);}disposeObject(actor.root);questActors.delete(entry.id);}interactives.splice(i,1);
    }
    for(const q of active.values())if(!questActors.has(q.id)){const entry={kind:'sidequest-target',id:q.id,questType:q.type,targetModel:q.targetModel,x:q.x,z:q.z,label:q.targetName};addSidequestActor(entry);interactives.push(entry);}
  }
  function load(id,save,{preserveHero=false}={}){
    const standing=preserveHero?{position:hero.root.position.clone(),surface,physics:physics.state(),yaw:hero.root.rotation.y}:null;
    storyActors.reset();disposeLand();fireworks.reset();guardSmoke.reset();sabotage=null;roadGuards=[];guardCharacters.clear();shopPlot=null;settlementPaths=[];settlementYards=[];room=interiorForSave(save);surfaces=room?null:createVillageSurfaces(id);current=id;const v=village(id),region=REGIONS[id],rand=seeded(VILLAGES.indexOf(v)*913+1049);
    setQuality(visualQuality);
    routes=room?[]:traversalDefinitions(id);storm.reset();blocked.limit=metrics().limit;
    Object.assign(sun.shadow.camera,{left:-32,right:32,top:32,bottom:-32,near:1,far:150});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.00015;sun.shadow.normalBias=.035;
    const lighting=villageLighting(id);ambient.color.set(lighting.sky);ambient.groundColor.set(lighting.ground);ambient.intensity=lighting.ambient;fill.intensity=lighting.fill;sun.color.set(lighting.sun);sun.intensity=lighting.intensity;
    scene.background=new T.Color(v.sky);scene.fog=new T.Fog(v.sky,55*metrics().scale,200*metrics().scale);
    if(room){loadRoom(save);return;}
    gates=v.links.map(target=>{const other=village(target),a=Math.atan2(other.x-v.x,other.y-v.y);return {kind:'gate',id:target,x:Math.sin(a)*metrics().gateRadius,z:Math.cos(a)*metrics().gateRadius,label:other.name};});
    const quest=QUESTS[id];interactives.push(...gates,{kind:'save',x:0,z:5,label:'Ấn hồi sinh'},{kind:'npc',x:-4,z:5,label:'Trưởng làng'},{kind:'quest',x:quest.x??8,z:quest.z??-9.5,label:quest.enemy});
    for(const zone of region.zones.filter(z=>z.platform!=='earth-cave'))interactives.push({kind:'landmark',id:zone.id,x:zone.x,z:zone.z,platform:zone.platform,label:zone.name});
    for(const person of region.npcs.filter(p=>p.platform!=='earth-cave'))interactives.push({kind:person.kind,id:person.id,x:person.x,z:person.z,label:person.name,...(person.platform?{platform:person.platform}:{}),...(person.elevation!==undefined?{y:person.elevation}:{})});
    if(id!=='nameless'&&!save.bosses?.[id])interactives.push({kind:'boss',id:region.boss.id,x:region.boss.x,z:region.boss.z,label:region.boss.name});
    const treatyReady=['water','fire','lightning'].every(key=>save.story?.peaceSeals?.includes(key));
    if(id==='nameless'){
      interactives.push({kind:'home',id:'family-home',x:HOME.spawn[0],z:HOME.spawn[1],label:'Ngôi nhà của gia đình'});
      if(!save.story?.guardianRestored)interactives.push({kind:'intro-guardian',id:'broken-guardian',x:region.boss.x,z:region.boss.z+5,label:'Hộ vệ bị phá hỏng · Ba ninja đột kích'});
    }
    const guardDefinitions=villageGuards(id);for(const g of guardDefinitions)if(!save.story?.defeatedGuards.includes(g.id))interactives.push({...g});
    for(const q of villageSidequests(id))if(save.story?.sidequests[q.id]===1)interactives.push({kind:'sidequest-target',id:q.id,questType:q.type,targetModel:q.targetModel,x:q.x,z:q.z,label:q.targetName});
    if(id==='nameless'&&treatyReady){interactives.push({kind:'treaty',x:3,z:7,label:'Bàn ký hiệp ước'});['water','fire','lightning'].forEach((key,index)=>interactives.push({kind:'treaty',id:key,x:1+index*2,z:9.5,label:REGIONS[key].boss.name}));}
    if(['wind','earth','ice','wood','light'].includes(id))interactives.push({kind:'envoy',x:-3,z:8,label:`Đại diện ${v.name}`});
    shopPlot=planVillageShop(id,[...interactives,...(id==='wood'?routes.flatMap(r=>[{x:r.from[0],z:r.from[1]},{x:r.to[0],z:r.to[1]}]):[]),...guardDefinitions.filter(g=>save.story?.defeatedGuards.includes(g.id))]);interactives.push({kind:'shop',id:'village-shop',...shopPlot.entry,area:{x1:shopPlot.x-6.5,x2:shopPlot.x+6.5,z1:shopPlot.z+4.5,z2:shopPlot.z+12,y:shopPlot.base+.45},label:'Thương hội · '+v.name});
    corridors=[...interactives,...guardDefinitions,...routes.flatMap(r=>[{x:r.from[0],z:r.from[1]},{x:r.to[0],z:r.to[1]}])];for(const g of gates)planBridge(g,3.7);for(const zone of region.zones)if(!zone.platform)planBridge(zone,2.5);for(const b of bridges)corridors.push({x:b.x+b.dx*(b.half+3),z:b.z+b.dz*(b.half+3)});addTerrain(v);addWater(v);
    for(const g of gates){road(g,3.7);arch(g,v);}for(const zone of region.zones)if(!zone.platform)road(zone,2.5);addBridges();road(shopPlot.entry,2.6);cyl(land,M(v.path),0,-.075,0,8,.2,id==='earth'?6:id==='lightning'?8:48);
    const setpieceSpot=zone=>{const a=Math.atan2(zone.x,zone.z);let best,score=-Infinity;for(const side of [-1,1])for(const distance of [14,20]){const p={x:zone.x+Math.cos(a)*distance*side,z:zone.z-Math.sin(a)*distance*side};const clearance=Math.min(Math.hypot(p.x-shopPlot.x,p.z-shopPlot.z)-15,...corridors.map(t=>segmentDistance(p.x,p.z,t)),metrics().limit-5-Math.abs(p.x),metrics().limit-5-Math.abs(p.z));if(clearance>score){score=clearance;best=p;}}return best;};
    const c={id,v,land,obstacles,group,box,cyl,mesh,M,obstacle,clearCorridor,animated,setpieceSpot,heightAt,solidMesh,solidGeometry,surfaces,mainRoads:corridors.filter(t=>!t.platform),reserveLane:p=>settlementPaths.push(p),reserveYard:p=>settlementYards.push(p)};
    const store=buildVillageShop(c,shopPlot);const merchant=createVillager(villagerAppearance(id,{kind:'envoy',id:'shopkeeper'}));merchant.root.position.set(store.merchant.x,store.merchant.y,store.merchant.z);land.add(merchant.root);citizens.push(merchant);
    interactives.push(...buildBiome(c,routes));
    for(const i of interactives)if(i.platform){i.y=platformFor(i.platform)?.toY;if(i.kind==='landmark'&&i.platform!=='earth-cave')i.z+=3;}else if(id==='fire'&&i.id==='summit-lotus')i.y=36;
    region.zones.filter(z=>z.platform!=='earth-cave').forEach((zone,index)=>{if(!zone.platform&&!['red-cliff','summit-lotus'].includes(zone.id))buildDistrict(c,zone,index%4);const g=group(zone.x,zone.z);if(id==='fire'&&zone.id==='red-cliff')g.userData.noCollision=true;if(zone.platform)g.position.y=platformFor(zone.platform).toY;if(id==='fire'&&zone.id==='summit-lotus')g.position.y=36;if(id==='nameless'){g.name='cracked-landmark-marker';for(let k=0;k<7;k++){const a=k*2.4,r=1+k%3*.5,x=Math.sin(a)*r,z=Math.cos(a)*r,paver=mesh(new T.DodecahedronGeometry(.48,0),M('#8c8268'),g,x,heightAt(zone.x+x,zone.z+z)-g.position.y+.025,z);paver.scale.set(1,.12,.7);paver.rotation.y=a;}}else for(let k=0;k<2;k++)cyl(g,M(v.path),0,.015+k*.035,0,3.5-k*.35,.035,32);const mark=mesh(new T.OctahedronGeometry(.28),M(v.color,.65),g,0,2.8,0);animated.push({kind:'float',mesh:mark,base:2.8});});
    const houseInRiver=(x,z,w,d)=>id==='fire'&&Math.hypot(x-88,z+96)<30+Math.hypot(w,d)/2||reservedLandscape(x,z,Math.hypot(w,d)/2+1)||!['water','wood'].includes(id)&&Math.abs(x-riverAt(id,z).x)<riverAt(id,z).width+Math.hypot(w,d)/2+1||id==='nameless'&&(()=>{const h=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([sx,sz])=>heightAt(x+sx*(w/2+.2),z+sz*(d/2+.2)));return Math.max(...h)-Math.min(...h)>.85;})();
    let houses=surfaces?.settlement?buildVillageSettlement(c,region,houseInRiver):0;for(const [x,z,rawW,rawD] of surfaces?.settlement?[]:region.houses){const w=rawW*HOUSE_WIDTH_SCALE,d=rawD*HOUSE_WIDTH_SCALE;if(clearCorridor(x,z,Math.hypot(w/2,d/2)+.7)||houseInRiver(x,z,w,d))continue;buildHouse(c,x,z,rawW,rawD,houses++);}
    // A village can grow around its own districts, without ever borrowing the
    // same six central house positions from the other nine maps.
    for(let k=0;!surfaces?.settlement&&k<(id==='nameless'?800:240)&&houses<26*metrics().scale;k++){const zone=region.zones[k%region.zones.length],a=rand()*Math.PI*2,r=8+rand()*12,x=zone.x+Math.sin(a)*r,z=zone.z+Math.cos(a)*r,w=3.4+rand()*2.3,d=3.2+rand()*2.1;if(Math.abs(x)>metrics().limit-7||Math.abs(z)>metrics().limit-7||clearCorridor(x,z,4*HOUSE_WIDTH_SCALE)||houseInRiver(x,z,w*HOUSE_WIDTH_SCALE,d*HOUSE_WIDTH_SCALE)||obstacles.some(o=>Math.abs(x-o.x)<o.w+4&&Math.abs(z-o.z)<o.d+4))continue;buildHouse(c,x,z,w,d,houses++);}
    if(id==='nameless')buildHouse(c,HOME.x,HOME.z,4.4,3.8,1);
    addVegetation(v,rand);addGroundDetails(rand);addBackdrop(v,rand);
    const shrine=group(0,3),stone=M('#89958a');for(let k=0;k<3;k++)cyl(shrine,stone,0,.15+k*.18,0,1.4-k*.3,.2,8);cyl(shrine,M('#475c5f'),0,1,0,.38,1.1);box(shrine,M('#c1c8ae'),0,1.7,0,1,.24,1);const seal=mesh(new T.OctahedronGeometry(.42),M('#96e6cc',.85),shrine,0,2.35,0);animated.push({kind:'float',mesh:seal,base:2.35});
    const halo=mesh(new T.RingGeometry(1.7,1.78,48),M('#a7ead6',.6),shrine,0,.08,0);halo.rotation.x=-Math.PI/2;
    npc=createVillager(villagerAppearance(id,{kind:'chief'}));npc.root.position.set(-4,heightAt(-4,4),4);npc.root.rotation.y=.4;land.add(npc.root);citizens.push(npc);
    region.npcs.filter(p=>p.platform!=='earth-cave').forEach((person,index)=>{const char=createVillager(villagerAppearance(id,person,index));char.root.position.set(person.x,person.platform?platformFor(person.platform)?.toY??heightAt(person.x,person.z):person.elevation??heightAt(person.x,person.z),person.z);char.root.rotation.y=person.yaw??Math.atan2(-person.x,-person.z);land.add(char.root);citizens.push(char);if(person.activity)residents.push({person,char});if(person.kind==='mentor'){const rune=mesh(new T.TorusGeometry(.8,.04,4,24),M(v.color,.7),char.root,0,3.5,0);rune.rotation.x=Math.PI/2;animated.push({kind:'halo',mesh:rune});}});
    const guardLook=encounterAppearance({kind:'quest',village:id});guard=createNinja(guardLook);guard.root.position.set(quest.x??8,heightAt(quest.x??8,quest.z??-11),quest.z??-11);guard.root.rotation.y=Math.PI;guard.root.visible=save.quests[id]===1;land.add(guard.root);citizens.push(guard);
    if(id==='nameless'||!save.bosses?.[id]){
      boss=buildBoss(c,region.boss);
      if(id==='nameless'&&!save.story?.guardianRestored){boss.body.rotation.z=-.48;boss.body.position.y=-1.3;const motion=animated.find(a=>a.kind==='boss'&&a.mesh===boss.body);if(motion){motion.kind='broken-guardian';motion.base=-1.3;}boss.body.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.color?.multiplyScalar(.55);if(o.material.emissive)o.material.emissive.set('#000000');}});}
    }
    if(id==='nameless'&&!save.story?.guardianRestored)for(let i=0;i<3;i++){
      const n=INTRO_SQUAD[i],char=createNinja(encounterAppearance({kind:'intro-trio',...n}));char.root.position.set(region.boss.x+(i-1)*3,heightAt(region.boss.x+(i-1)*3,region.boss.z+5),region.boss.z+5);char.root.rotation.y=Math.PI;land.add(char.root);citizens.push(char);
    }
    if(['water','fire','lightning','dark'].includes(id)&&!save.bosses?.[id]){const leader=createVillager(villagerAppearance(id,{kind:'leader'}));leader.root.position.set(region.boss.x+5,heightAt(region.boss.x+5,region.boss.z+3),region.boss.z+3);leader.root.rotation.y=Math.PI;land.add(leader.root);citizens.push(leader);}
    if(['wind','earth','ice','wood','light'].includes(id)){const envoy=createVillager(villagerAppearance(id,{kind:'envoy'}));envoy.root.position.set(-3,heightAt(-3,8),8);envoy.root.rotation.y=.4;land.add(envoy.root);citizens.push(envoy);}
    if(id==='nameless'&&treatyReady){const table=group(3,7);box(table,M('#6e5944'),0,1.1,0,3,.2,2);for(const s of [-1,1])for(const zz of [-1,1])box(table,M('#514638'),s*1.2,.5,zz*.75,.18,1,.18);box(table,M('#ded2ae'),0,1.23,0,1.3,.03,1);['water','fire','lightning'].forEach((key,index)=>{const rep=createVillager(villagerAppearance(key,{kind:'envoy'}));const x=1+index*2,z=9.5;rep.root.position.set(x,heightAt(x,z),z);rep.root.rotation.y=Math.PI;land.add(rep.root);citizens.push(rep);});}
    registerSceneryColliders(land,physics,{limit:metrics().limit,moving:[...routes.flatMap(r=>[r.boat,...(r.idleBoats||[])]).filter(Boolean),...animated.map(a=>a.mesh),...citizens.map(c=>c.root)],leafColors:[v.tree,'#507747','#658b53','#7d9b77','#656c49','#7c7a50']});
    // Resolve authored residents against the finished scenery, including decks,
    // the cave floor and elevated houses. Repeated loads choose the same spot.
    for(const {person,char} of residents){
      const zone=region.zones.find(z=>z.id===person.landmark),yaw=char.root.rotation.y,platform=person.platform&&platformFor(person.platform),candidates=[[person.x,person.z]];
      for(const r of [1.3,2.6,4,5.5,7.5,10])for(let k=0;k<16;k++){const a=k*Math.PI/8;candidates.push([person.x+Math.sin(a)*r,person.z+Math.cos(a)*r]);}
      const chosen=candidates.map(([x,z])=>{const y=platform?platform.toY:person.elevation??physics.floorAt(x,z,heightAt(x,z)+.55);return {x,z,y};}).find(p=>{
        if(Math.hypot(p.x-zone.x,p.z-zone.z)>zone.radius+1||Math.abs(p.x)>metrics().limit-2||Math.abs(p.z)>metrics().limit-2)return false;
        if(platform?platformBlocked(person.platform,p.x,p.z,.25):baseBlocked(p.x,p.z))return false;
        if(physics.overlaps(p.x,p.z,p.y,2.9,.7,true,.2))return false;
        if(person.elevation!==undefined&&Math.abs(physics.floorAt(p.x,p.z,p.y+.3)-p.y)>.65)return false;
        if(citizens.some(other=>other!==char&&Math.hypot(other.root.position.x-p.x,other.root.position.z-p.z)<1.25&&Math.abs(other.root.position.y-p.y)<2))return false;
        const hasBench=['forging','repair','repairing','pottery','mining','market','sorting','warming','observing'].includes(person.activity),front={x:p.x+Math.sin(yaw)*1.1,z:p.z+Math.cos(yaw)*1.1};
        if(hasBench&&citizens.some(other=>other!==char&&Math.hypot(other.root.position.x-front.x,other.root.position.z-front.z)<2.1&&Math.abs(other.root.position.y-p.y)<2))return false;
        if(hasBench&&interactives.some(i=>i.id!==person.id&&['save','mentor','traversal','shop','npc'].includes(i.kind)&&Math.hypot(i.x-front.x,i.z-front.z)<2.1&&Math.abs((i.y??heightAt(i.x,i.z))-p.y)<2))return false;
        return !hasBench||!physics.overlaps(front.x,front.z,p.y,1.9,.8,true,.15);
      });
      if(chosen)char.root.position.set(chosen.x,chosen.y,chosen.z);
      char.root.userData.landmark=person.landmark;char.update(0,false);char.root.updateMatrixWorld(true);
      const entry=interactives.find(i=>i.id===person.id);Object.assign(entry,{x:char.root.position.x,z:char.root.position.z,y:char.root.position.y});
      if(char.workstation){land.attach(char.workstation);registerSceneryColliders(char.workstation,physics,{limit:metrics().limit});}
    }
    const guardPositions=placeVillageGuards(guardDefinitions,{limit:metrics().limit,boss:region.boss,heightAt:(x,z)=>physics.floorAt(x,z,heightAt(x,z)+.5),valid:(x,z,y)=>!blocked(x,z)&&!physics.overlaps(x,z,y,2.9,.6,true)&&!citizens.some(c=>Math.hypot(c.root.position.x-x,c.root.position.z-z)<2.1)});
    for(const entry of interactives.filter(i=>['village-guard','sidequest-target'].includes(i.kind))){
      if(entry.kind==='village-guard')Object.assign(entry,guardPositions.get(entry.id));
      else {addSidequestActor(entry);continue;}
      const char=createNinja(encounterAppearance({kind:entry.kind,village:id}));char.root.position.set(entry.x,entry.y,entry.z);char.root.rotation.y=Math.atan2(-entry.x,-entry.z);land.add(char.root);citizens.push(char);guardCharacters.add(char);roadGuards.push(createGuardAmbush({entry,char,land,physics,heightAt:(x,z)=>physics.floorAt(x,z,standingHeightAt(x,z)+.55),blocked,findPath,smoke:guardSmoke}));
    }
    surface=platformFor(save.surface)?.platform?.id||null;
    hero.setEquipment(equipmentState(save));hero.cloth.color.set(save.hero.coat);hero.hair.color.set(save.hero.hair);let pos=save.position,y=heroHeightAt(...pos);if(Number.isFinite(save.elevation)){const supported=physics.floorAt(...pos,save.elevation+.03);if(Math.abs(supported-save.elevation)<.08)y=supported;}if((surface?platformBlocked(surface,...pos):boundaryBlocked(...pos)||id==='water'&&isDeepWater(...pos)&&!waterDeckAt(...pos,y+.4))||!surface&&physics.overlaps(...pos,y,2.85,.36,true)){pos=[0,7];surface=null;y=heroHeightAt(...pos);}y=physics.floorAt(...pos,y+.3);hero.root.position.set(pos[0],y,pos[1]);physics.reset(y);previousHeroPosition.copy(hero.root.position);hero.root.rotation.y=orbitYaw+Math.PI;destination.visible=false;
    if(id!=='nameless'&&treatyReady&&!save.campaign?.treatySigned)['water','fire','lightning'].forEach((key,index)=>{const char=createVillager(villagerAppearance(key,{kind:'envoy'})),offset=[[-2,1],[-3,-1],[-1,-3]][index];char.root.position.set(pos[0]+offset[0],heightAt(pos[0]+offset[0],pos[1]+offset[1]),pos[1]+offset[1]);land.add(char.root);party.push({char,offset});});
    dressingCount=dressVillage({...c,limit:metrics().limit,physics,blocked,interactives},region,rand);
    // Register the new props once, after all NPC/guard positions are resolved.
    for(const cluster of land.children.filter(o=>o.name==='village-prop-cluster'))registerSceneryColliders(cluster,physics,{limit:metrics().limit});
    if(physics.overlaps(hero.root.position.x,hero.root.position.z,hero.root.position.y)){physics.recover();previousHeroPosition.copy(hero.root.position);}
    if(standing){surface=standing.surface;hero.root.position.copy(standing.position);hero.root.rotation.y=standing.yaw;physics.restore(standing.physics);previousHeroPosition.copy(standing.position);}
    storyActors.sync(save,id,interactives,!!room);
    batchScenery();focusSun();contacts.update([hero,...citizens,...party.map(p=>p.char),...storyActors.actors()],contactFloor);
    scene.updateMatrixWorld(true);camera.far=340*metrics().scale;camera.fov=68;camera.updateProjectionMatrix();followCamera(1,true,false);
  }
  function loadRoom(save){
    gates=[];terrain=null;dressingCount=0;ambient.intensity=room.ambient;ambient.color.set('#dedac5');ambient.groundColor.set('#514b41');sun.intensity=.6;fill.intensity=.5;scene.background=new T.Color(room.sky);scene.fog=new T.Fog(room.sky,35,95);orbitYaw=0;orbitPitch=.12;
    const built=buildInterior({land,box,cyl,mesh,M,physics,solidMesh},room);interactives.push(...built.fixtures);oreNodes=built.oreNodes;syncMines(save);
    const people=room.id==='earth-cave'?REGIONS.earth.npcs.filter(p=>p.platform==='earth-cave'):[];
    for(const person of people){const char=createVillager(villagerAppearance(current,person));char.root.position.set(person.x,0,person.z);land.add(char.root);citizens.push(char);residents.push({person:{...person,platform:null},char});interactives.push({kind:person.kind,id:person.id,x:person.x,z:person.z,y:0,label:person.name});}
    if(room.id==='wood-arena'){
      const host=createVillager(villagerAppearance('wood',{id:'arena-referee',kind:'envoy'}));host.root.position.set(0,0,16);land.add(host.root);citizens.push(host);
      Object.keys(REGIONS).filter(id=>id!=='nameless').forEach((id,i)=>{const char=createNinja({id:'arena-spectator-'+id,village:id,kind:'ninja',coat:village(id).color});char.root.position.set(i%2?19:-19,2,-17+Math.floor(i/2)*8);char.root.rotation.y=i%2?-Math.PI/2:Math.PI/2;land.add(char.root);citizens.push(char);});
    }
    hero.setEquipment(equipmentState(save));hero.cloth.color.set(save.hero.coat);hero.hair.color.set(save.hero.hair);const p=save.position;
    const valid=Array.isArray(p)&&!blocked(...p);hero.root.position.set(valid?p[0]:room.spawn[0],0,valid?p[1]:room.spawn[1]);hero.root.rotation.y=Math.PI;physics.reset(0);previousHeroPosition.copy(hero.root.position);destination.visible=false;
    guard={root:new T.Group()};storyActors.sync(save,current,interactives,true);batchScenery();focusSun();contacts.update([hero,...citizens,...storyActors.actors()],contactFloor);scene.updateMatrixWorld(true);camera.far=130;camera.fov=68;camera.updateProjectionMatrix();followCamera(1,true,false);
  }
  function syncMines(save,now=Date.now()){let changed=false;for(const [id,node] of oreNodes){const state=oreState(save,id,now),visible=state.hits<5,entry=interactives.find(i=>i.id===id);if(node.visible!==visible||entry.hits!==state.hits)changed=true;node.visible=visible;entry.depleted=!visible;entry.hits=state.hits;entry.label='Mỏ linh thạch · '+state.hits+'/5';}return changed;}
  function miningStrike(id){const entry=interactives.find(i=>i.id===id);if(!entry)return;miningTime=.4;hero.root.rotation.y=Math.atan2(entry.x-hero.root.position.x,entry.z-hero.root.position.z);pickaxe.visible=true;}
  function spawnEnemy(x,z,element=current==='nameless'?['water','fire','lightning'][Math.floor(Math.random()*3)]:current){
    clearEnemy();const look=encounterAppearance({kind:'random',village:element});randomEnemy=createNinja(look);randomEnemy.root.position.set(x,physics.floorAt(x,z,heightAt(x,z)+.5),z);land.add(randomEnemy.root);
    sabotage={age:0,element};interactives.push({kind:'roamer',id:'roaming-vandal',x,z,y:randomEnemy.root.position.y,label:'Ninja phá hoại · '+village(element).name,element});return randomEnemy;
  }
  function clearEnemy(){const i=interactives.findIndex(i=>i.kind==='roamer');if(i>=0)interactives.splice(i,1);sabotage=null;fireworks.reset();if(randomEnemy){land.remove(randomEnemy.root);disposeObject(randomEnemy.root);randomEnemy=null;}}
  function followCamera(dt,snap=false,menu=false){
    const p=hero.root.position,planned=ride?.route.carved?ride.cameraY??p.y:p.y,eyeY=cameraHeight.update(planned,dt,snap),head=new T.Vector3(p.x,eyeY+2.35,p.z);
    if(menu){hero.root.visible=true;const target=head.clone().add(new T.Vector3(-4,0,0));camera.position.lerp(target.clone().add(new T.Vector3(12,12,17)),snap?1:1-Math.exp(-dt*5));camera.lookAt(target);return;}
    const forward=new T.Vector3(-Math.sin(orbitYaw),0,-Math.cos(orbitYaw)),right=new T.Vector3(Math.cos(orbitYaw),0,-Math.sin(orbitYaw));
    const desired=head.clone().addScaledVector(forward,-orbitDistance).addScaledVector(right,.55);desired.y+=.55+Math.sin(orbitPitch)*orbitDistance;
    const delta=desired.clone().sub(head),length=delta.length(),direction=delta.clone().normalize();
    // Probe collision footprints instead of raycasting every triangle of merged villages.
    for(let d=.6;d<length;d+=.3){const probe=head.clone().addScaledVector(direction,d),solid=surface==='earth-cave'?platformBlocked(surface,probe.x,probe.z):surface&&surface!=='heart-tree'||ride&&!ride.rock&&!ride.route.carved?false:boundaryBlocked(probe.x,probe.z)&&probe.y<heightAt(probe.x,probe.z)+8||probe.y<groundHeight(probe.x,probe.z)+.22||physics.overlaps(probe.x,probe.z,probe.y-.18,.36,.18);if(solid){desired.copy(head).addScaledVector(direction,Math.max(.8,d-.3));break;}}
    desired.y=Math.max(desired.y,(surface?platformFor(surface)?.toY??groundHeight(desired.x,desired.z):groundHeight(desired.x,desired.z))+.6);
    camera.position.lerp(desired,snap?1:1-Math.exp(-dt*14));
    // A wall can push the shoulder camera into the chibi's large head. Keep the view clear.
    hero.root.visible=camera.position.distanceTo(head)>1.25;
    camera.lookAt(head.clone().addScaledVector(forward,5).addScaledVector(right,.25).add(new T.Vector3(0,-Math.tan(orbitPitch)*6,0)));
  }
  function update(dt,moving,menu=false,paused=false,sprinting=false){
    time+=dt;if(menu)hero.root.rotation.y=.6;if(!ride&&!menu&&!paused)physics.step(dt);
    if(!room&&current==='wood'&&!ride&&!surface){const r=routes[0],p=hero.root.position;if(r&&p.y>=r.toY-.12&&!platformBlocked('heart-tree',p.x,p.z)){surface='heart-tree';physics.reset(r.toY);}}
    const velocity={x:dt>0?(hero.root.position.x-previousHeroPosition.x)/dt:0,z:dt>0?(hero.root.position.z-previousHeroPosition.z)/dt:0};previousHeroPosition.copy(hero.root.position);
    hero.update(time,moving||ride?.route.kind==='stairs'&&ride.walking,velocity,dt,sprinting&&!paused&&!ride&&physics.state().grounded);citizens.forEach(c=>{if(!guardCharacters.has(c))c.update(time,false,null,dt,hero.root.position);});for(const g of roadGuards)g.animate(time,paused?0:dt);guardSmoke.update(paused?0:dt);if(randomEnemy){randomEnemy.update(time,false,null,dt);const swing=Math.sin(time*2.6);if(randomEnemy.arms[1])randomEnemy.arms[1].pivot.rotation.x=-.7-swing*.5;}
    const source=randomEnemy?.root.position,targets=obstacles.slice(0,24).map(o=>[o.x,heightAt(o.x,o.z)+1,o.z]);if(source)targets.sort((a,b)=>Math.hypot(a[0]-source.x,a[2]-source.z)-Math.hypot(b[0]-source.x,b[2]-source.z));fireworks.update(paused?0:dt,paused?null:source,targets.slice(0,4));
    if(sabotage&&!paused){sabotage.age+=dt;if(sabotage.age>=30)clearEnemy();}
    if(ride?.rock){if(['hang','mantle'].includes(ride.mode))hero.climbPose(time);else if(ride.mode==='jump')hero.airPose(1-ride.jumpTime*2);}
    else if(ride&&['ladder','climb'].includes(ride.route.kind))hero.climbPose(time);else if(!physics.state().grounded)hero.airPose(physics.state().verticalSpeed);
    if(miningTime>0){miningTime=Math.max(0,miningTime-(paused?0:dt));hero.arms[1].pivot.rotation.x=-1.2-Math.sin((.4-miningTime)/.4*Math.PI)*1.2;pickaxe.visible=miningTime>0;}
    storyActors.update(dt,time,paused,!!ride);
    storm.update(dt,!room&&current==='lightning'&&!menu,hero.root.position);
    for(const {char,offset} of party){const target=new T.Vector3(hero.root.position.x+offset[0],0,hero.root.position.z+offset[1]),p=char.root.position,walking=Math.hypot(p.x-target.x,p.z-target.z)>.2;p.x+=(target.x-p.x)*(1-Math.exp(-dt*3));p.z+=(target.z-p.z)*(1-Math.exp(-dt*3));p.y=heightAt(p.x,p.z);if(walking)char.root.rotation.y=Math.atan2(target.x-p.x,target.z-p.z);char.update(time,walking,null,dt);}
    for(const a of animated){if(a.kind==='float'){a.mesh.rotation.y=time*.55;a.mesh.position.y=a.base+Math.sin(time*1.6)*.2;}if(a.kind==='balloon'){a.mesh.position.y=a.base+Math.sin(time*1.3+a.base)*.25;a.mesh.rotation.z=Math.sin(time*.7)*.035;}if(a.kind==='windmill')a.mesh.rotation.z=time*.45;if(a.kind==='halo')a.mesh.rotation.y+=dt*.24;if(a.kind==='boss'){a.mesh.position.y=a.base+Math.sin(time*1.1)*.18;a.mesh.rotation.y=Math.sin(time*.35)*.08;}if(a.kind==='pulse')a.mesh.scale.setScalar(1+Math.sin(time*2)*.08);if(a.kind==='flag')a.mesh.rotation.y=Math.sin(time*2.4)*.15;if(a.kind==='ripple')a.mesh.material.opacity=.76+Math.sin(time)*.04;}
    focusSun();contacts.update([hero,...citizens,...party.map(p=>p.char),...storyActors.actors(),...(randomEnemy?[randomEnemy]:[])],contactFloor);
    followCamera(dt,false,menu);destination.rotation.z=time;
    const target=hero.root.position.clone().add(new T.Vector3(0,2,0));
    if(foliage){const sight=new T.Line3(camera.position,target),nearest=new T.Vector3(),hiddenMatrix=new T.Matrix4().makeScale(0,0,0);let changed=false;foliage.items.forEach((item,index)=>{sight.closestPointToPoint(item.center,true,nearest);const hidden=nearest.distanceTo(item.center)<item.radius+1;if(hidden!==item.hidden){foliage.mesh.setMatrixAt(index,hidden?hiddenMatrix:item.matrix);item.hidden=hidden;changed=true;}});if(changed)foliage.mesh.instanceMatrix.needsUpdate=true;}
  }
  function project(x,z,y=3){camera.updateMatrixWorld();const p=new T.Vector3(x,heightAt(x,z)+y,z).project(camera);return {left:(p.x+1)*innerWidth/2,top:(1-p.y)*innerHeight/2,visible:p.z<1&&Math.abs(p.x)<1.1&&Math.abs(p.y)<1.1};}
  function pick(clientX,clientY,canvas){if(!terrain)return null;camera.updateMatrixWorld();terrain.updateMatrixWorld();const r=canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObject(terrain,false)[0];return hit?[hit.point.x,hit.point.z]:null;}
  return {scene,camera,hero,syncMines,miningStrike,get interior(){return room;},syncVillageEvents:save=>storyActors.sync(save,current,interactives,!!room),storyState:storyActors.state,obstacles,interactives,syncSidequests,setQuality,presentationState:()=>({dressingClusters:dressingCount,contactShadows:contacts.mesh.count,quality:visualQuality,lighting:{ambient:ambient.intensity,sun:sun.intensity,fill:fill.intensity,shadowExtent:sun.shadow.camera.right,shadowMap:sun.shadow.mapSize.x}}),guardsState:()=>roadGuards.map(g=>g.state()),guardSmokeState:guardSmoke.state,advanceGuards(dt,enabled=true){return roadGuards.filter(g=>g.update(dt,{hero:hero.root.position,enabled,riding:!!ride,surface})).map(g=>g.entry.id);},caughtGuard:()=>roadGuards.find(g=>g.caught())?.entry||null,dismissGuard(id){roadGuards.find(g=>g.entry.id===id)?.dismiss();},sabotageState:()=>sabotage?{...sabotage,remaining:Math.max(0,30-sabotage.age),...fireworks.state()}:null,residentsState:()=>residents.map(({person,char})=>({id:person.id,name:person.name,landmark:person.landmark,activity:person.activity,expression:char.root.userData.expression,platform:person.platform||null,position:char.root.position.toArray(),armPose:char.arms.map(a=>a.rotation.x),headPose:char.head.rotation.toArray().slice(0,3),bodyLean:char.body.rotation.x})),blocked,physicsState:physics.state,get solids(){return physics.solids;},moveHero:(dx,dz)=>physics.move(dx,dz),jump:jumpHero,tryGrabLedge,releaseCliff,recoverHero,heightAt,heroHeightAt,canHeroMove,navigationBlocked,startTraversal,advanceTraversal,unlockAudio(){storm.unlock();guardSmoke.unlock();},get surface(){return surface;},get riding(){return !!ride;},get routes(){return routes;},get metrics(){return metrics();},weatherState:storm.state,traversalState:()=>ride?{id:ride.route.id,kind:ride.route.kind,progress:ride.progress,side:ride.side,mode:ride.mode,ledge:ride.index}:null,safeSave:()=>{if(ride?.rock){const p=ride.route.ledges[ride.index];return {position:[p.x,p.z],surface:null,elevation:p.y};}if(ride)return {position:[...(ride.side?ride.route.to:ride.route.from)],surface:ride.side?ride.route.platform?.id||null:null,elevation:ride.side?ride.route.toY:ride.route.fromY};const p=physics.safePosition();return {position:[p.x,p.z],surface,elevation:p.y};},load,update,project,pick,spawnEnemy,clearEnemy,orbit(dx,dy){orbitYaw=Math.atan2(Math.sin(orbitYaw-dx*.005),Math.cos(orbitYaw-dx*.005));orbitPitch=Math.max(-.95,Math.min(1.1,orbitPitch+dy*.003));hero.root.rotation.y=orbitYaw+Math.PI;},faceView(){hero.root.rotation.y=orbitYaw+Math.PI;},followHeading(yaw,dt){const target=yaw-Math.PI,delta=Math.atan2(Math.sin(target-orbitYaw),Math.cos(target-orbitYaw));orbitYaw+=delta*(1-Math.exp(-dt*8));},zoom(delta){orbitDistance=Math.max(2.8,Math.min(6.5,orbitDistance+delta*.004));},movementAxes(){return {forward:[-Math.sin(orbitYaw),-Math.cos(orbitYaw)],right:[Math.cos(orbitYaw),-Math.sin(orbitYaw)]};},cameraState:()=>({anchorHeight:cameraHeight.value,heroVisible:hero.root.visible,yaw:orbitYaw,heroYaw:hero.root.rotation.y,pitch:orbitPitch,distance:orbitDistance,position:camera.position.toArray(),height:camera.position.y-hero.root.position.y}),get guard(){return guard;},get boss(){return boss;},get gates(){return gates;},get bridges(){return bridges;},get randomEnemy(){return randomEnemy;},destination,resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}};
}
