import * as T from 'three';
import {createVillager} from './villager.js';
import {villagerAppearance} from './villager-appearance.js';

export const HARBOR_TIMING=Object.freeze({boarding:.85,outbound:2.5,inbound:2.8,disembark:1});
export function planHarbor(dock,limit,shoreY){
  const r=Math.hypot(dock.x,dock.z)||1,dx=dock.x/r,dz=dock.z/r;
  const edge=(limit-Math.max(Math.abs(dock.x),Math.abs(dock.z)))/Math.max(Math.abs(dx),Math.abs(dz));
  return {id:dock.id,x:dock.x,z:dock.z,dx,dz,yaw:Math.atan2(dx,dz),shoreY,waterY:shoreY-.65,deckY:shoreY+.2,moored:11,edge:Math.max(22,edge+8),length:edge+300};
}
export function harborLocal(h,x,z){const x0=x-h.x,z0=z-h.z;return {side:x0*h.dz-z0*h.dx,along:x0*h.dx+z0*h.dz};}
export function harborWidth(along){return along<6?10*Math.sqrt(Math.max(0,(along+3)/9)):Math.min(190,10+(along-6)*.62);}
export function harborDistance(h,x,z){const p=harborLocal(h,x,z);return Math.max(-3-p.along,p.along-h.length,Math.abs(p.side)-harborWidth(p.along));}
export function harborDeckAt(h,x,z,pad=0){const p=harborLocal(h,x,z);return Math.abs(p.side)<=2.3-pad&&p.along>=-4+pad&&p.along<=6-pad;}
export function harborGroundHeight(harbors,x,z,base){
  let y=base;
  for(const h of harbors){
    const p=harborLocal(h,x,z),apron=(1-T.MathUtils.smoothstep(Math.abs(p.side),4,9))*T.MathUtils.smoothstep(p.along,-16,-9)*(1-T.MathUtils.smoothstep(p.along,0,2));
    if(apron>0)y=T.MathUtils.lerp(y,h.shoreY,apron);
    const d=harborDistance(h,x,z);if(d>4)continue;const bank=T.MathUtils.smoothstep(d,-.7,4),entrance=T.MathUtils.smoothstep(p.along,-4,0),bed=Math.min(y,h.waterY-1.8);y=T.MathUtils.lerp(y,bed,(1-bank)*entrance);
  }
  return y;
}

export function buildVillageHarbor({id,land,box,cyl,mesh,M,solidMesh},dock,h){
  const root=new T.Group();root.name='village-harbor-'+dock.id;root.userData.noCollision=true;
  root.position.set(h.x,0,h.z);root.rotation.y=h.yaw;land.add(root);
  const wood=M('#99754d'),dark=M('#4d3527'),trim=M('#bd9a65');
  const positions=[],uv=[],indices=[];
  for(let i=0;i<=60;i++){const z=-3+(h.length+3)*i/60,w=harborWidth(z);for(const side of [-1,1]){positions.push(side*w,h.waterY,z);uv.push(side,z*.08);}if(i){const k=(i-1)*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
  const water=mesh(geo,new T.MeshStandardMaterial({color:'#247d9e',roughness:.28,metalness:.18,side:T.DoubleSide}),root);water.name='harbor-sea';water.castShadow=false;water.userData.dynamic=true;
  const foam=new T.Group();foam.name='harbor-sea-ripples';foam.userData.dynamic=true;root.add(foam);
  for(let i=0;i<32;i++){const z=6+i*3.7,w=harborWidth(z),x=Math.sin(i*4.3)*w*.72,line=box(foam,M(i%3?'#63b1c2':'#b6dce0'),x,h.waterY+.025,z,1.4+(i%4)*.7,.015,.07);line.rotation.y=Math.sin(i)*.14;}
  // A supported pier stays walkable while the surrounding bay is deep water.
  const support=box(root,wood,0,h.deckY-.17,1,4.6,.34,10);support.name='harbor-pier-deck';solidMesh(support,{name:'harbor-pier-deck',stepable:true});
  for(let i=0;i<22;i++)box(root,i%3?wood:trim,0,h.deckY+.015,-3.8+i*.45,4.6,.035,.39);
  for(const x of [-2.3,2.3])for(const z of [-3.5,0,3,5.7]){cyl(root,dark,x,h.deckY-.2,z,.17,2.8,8);cyl(root,trim,x,h.deckY+1.2,z,.2,.12,8);}
  const boat=new T.Group();boat.name='inter-village-boat';boat.userData.dynamic=true;root.add(boat);
  // Closed, pointed hull: roughly twice the former width and three times its length.
  const outline=[[-1.6,-5.3],[-2.7,-3.6],[-2.7,3.6],[-1.45,5.1],[0,6.1],[1.45,5.1],[2.7,3.6],[2.7,-3.6],[1.6,-5.3]],hullPositions=[],hullIndices=[];
  for(const [x,z] of outline)hullPositions.push(x,-.05,z,x*.68,-1.05,z*.84);
  for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length;hullIndices.push(i*2,j*2,i*2+1,j*2,j*2+1,i*2+1);}
  hullIndices.push(...Array.from({length:outline.length-2},(_,i)=>[1,(i+2)*2+1,(i+1)*2+1]).flat());
  const hullGeo=new T.BufferGeometry();hullGeo.setAttribute('position',new T.Float32BufferAttribute(hullPositions,3));hullGeo.setIndex(hullIndices);hullGeo.computeVertexNormals();mesh(hullGeo,dark,boat).name='passenger-boat-hull';
  const deckShape=new T.Shape();outline.forEach(([x,z],i)=>i?deckShape.lineTo(x,-z):deckShape.moveTo(x,-z));deckShape.closePath();const deck=mesh(new T.ShapeGeometry(deckShape),wood,boat,0,0,0);deck.rotation.x=-Math.PI/2;deck.name='passenger-boat-deck';
  for(let i=-9;i<=9;i++)box(boat,trim,0,.025,i*.48,Math.abs(i)>7?3.3:5.15,.025,.04);
  for(const x of [-2.65,2.65]){box(boat,dark,x,.5,0,.18,1.05,7.4);box(boat,trim,x,1.04,0,.22,.12,7.5);}
  box(boat,dark,0,.48,-5,3.2,.95,.18);box(boat,trim,0,1,-5,3.5,.14,.24);
  for(const z of [-2.2,2.1])box(boat,dark,0,.55,z,4.5,.22,.55);
  cyl(boat,dark,-.65,3.1,1,.12,6.2,10);box(boat,dark,1,5.3,1,4.5,.12,.12);
  const sail=mesh(new T.PlaneGeometry(4,3.2,4,4),new T.MeshStandardMaterial({color:'#eadcb0',roughness:.95,side:T.DoubleSide}),boat,1.1,3.65,1.05);sail.name='passenger-boat-sail';const sp=sail.geometry.attributes.position;for(let i=0;i<sp.count;i++)sp.setZ(i,Math.sin((sp.getX(i)+2)/4*Math.PI)*.35);sail.geometry.computeVertexNormals();
  const skipper=createVillager(villagerAppearance(id,{id:'harbor-skipper-'+dock.id,activity:'steering',appearance:{job:'boatman',hat:'conical',beard:'short',coat:'#405d63',accent:'#dac597',height:2.9,width:1.04}}));
  skipper.setInkViewport(globalThis.innerWidth||1200,globalThis.innerHeight||860);skipper.root.name='harbor-skipper-'+dock.id;skipper.root.position.set(-1.1,.05,-3.8);boat.add(skipper.root);
  const tiller=box(boat,dark,-1.1,1.45,-4.4,.13,.13,2.3);tiller.rotation.y=-.18;
  const wake=new T.Group();wake.name='passenger-boat-wake';wake.visible=false;boat.add(wake);for(const side of [-1,1]){const streak=box(wake,M('#c0e1df'),side*1.8,-.74,-6.2,.12,.025,3.5);streak.rotation.y=side*.28;}
  const harbor={...h,root,boat,skipper,water,wake,sail,dock};
  harbor.point=(side,along,y=h.deckY)=>new T.Vector3(h.x+h.dz*side+h.dx*along,y,h.z-h.dx*side+h.dz*along);
  harbor.place=(distance,incoming=false,bob=0)=>{boat.position.set(0,h.deckY+bob,distance);boat.rotation.y=incoming?Math.PI:0;boat.rotation.z=bob*.15;boat.updateWorldMatrix(true,true);};
  harbor.passenger=(slot=0)=>boat.localToWorld(new T.Vector3(slot?-1.05:.9,.055,-.9));
  harbor.place(h.moored);dock.board=harbor.passenger().toArray();dock.seaEdge=harbor.point(0,h.edge).toArray();dock.waterY=h.waterY;
  return harbor;
}

// Consume leftover time across stages; the destination scene never starts before departure completes.
export function createHarborPassage(harbor,hero,{incoming=false,passengers=[]}={}){
  const stages=incoming?['inbound','disembark']:['boarding','outbound'];let index=0,elapsed=0,age=0,complete=false;
  const shore=harbor.point(0,0),start=hero.position.clone();harbor.place(incoming?harbor.edge:harbor.moored,incoming);harbor.wake.visible=incoming;
  const companions=passengers.map(root=>({root,start:root.getWorldPosition(new T.Vector3())}));
  const setHero=(p,yaw)=>{hero.position.copy(p);hero.rotation.y=yaw;};
  const pose=()=>{
    const stage=stages[index],t=Math.min(1,elapsed/HARBOR_TIMING[stage]),ease=t*t*(3-2*t),bob=Math.sin(age*2.5)*.045;
    const sailing=stage==='outbound'||stage==='inbound',distance=stage==='outbound'?T.MathUtils.lerp(harbor.moored,harbor.edge,ease):stage==='inbound'?T.MathUtils.lerp(harbor.edge,harbor.moored,ease):harbor.moored;
    harbor.place(distance,incoming,sailing?bob:0);harbor.wake.visible=sailing;
    if(stage==='boarding'){const p=start.clone().lerp(harbor.passenger(),ease);p.y+=Math.sin(t*Math.PI)*.45;setHero(p,harbor.yaw);}
    else if(stage==='disembark'){const p=harbor.passenger().lerp(shore,ease);p.y+=Math.sin(t*Math.PI)*.35;setHero(p,harbor.yaw+Math.PI);}
    else setHero(harbor.passenger(),harbor.yaw+(incoming?Math.PI:0));
    for(const [i,companion] of companions.entries()){
      const seat=harbor.passenger(i+1),landing=harbor.point(-1.1-i*.7,0),p=stage==='boarding'?companion.start.clone().lerp(seat,ease):stage==='disembark'?seat.lerp(landing,ease):seat;
      if(stage==='boarding'||stage==='disembark')p.y+=Math.sin(t*Math.PI)*(stage==='boarding'?.45:.35);
      companion.root.position.copy(companion.root.parent?companion.root.parent.worldToLocal(p):p);companion.root.rotation.y=hero.rotation.y;
    }
  };
  pose();
  return {harbor,incoming,shore,advance(dt){
    if(complete)return this.state();age+=Math.max(0,dt);let remaining=Math.max(0,dt);
    while(remaining>0&&!complete){const step=Math.min(remaining,HARBOR_TIMING[stages[index]]-elapsed);elapsed+=step;remaining-=step;pose();if(elapsed>=HARBOR_TIMING[stages[index]]-1e-8){if(index===stages.length-1){complete=true;harbor.wake.visible=false;}else {index++;elapsed=0;pose();}}}
    return this.state();
  },state(){return {id:harbor.id,stage:stages[index],progress:Math.min(1,elapsed/HARBOR_TIMING[stages[index]]),incoming,complete,walking:stages[index]==='boarding'||stages[index]==='disembark',boat:harbor.boat.getWorldPosition(new T.Vector3()).toArray(),passenger:hero.position.toArray(),companions:companions.map(c=>c.root.getWorldPosition(new T.Vector3()).toArray()),skipper:harbor.skipper.root.getWorldPosition(new T.Vector3()).toArray()};}};
}
