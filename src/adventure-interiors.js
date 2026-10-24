import * as T from 'three';
import {REGIONS} from './adventure-world.js';

export const INTERIORS={
  'earth-cave':{id:'earth-cave',village:'earth',title:'Đại Hang Địa Tâm',spawn:[0,-14],bounds:{x:22,minZ:-58,maxZ:-8},center:[0,-33],exit:[0,-9.5],exterior:[0,-11.2],surface:null,zones:['great-cave','cave-crystals'],sky:'#111718',ambient:1.05},
  'wood-arena':{id:'wood-arena',village:'wood',title:'Võ Đường Cửu Làng',spawn:[0,23],bounds:{x:25,minZ:-31,maxZ:31},center:[0,0],exit:[0,28.5],exterior:[1,2.25],surface:'heart-tree',zones:[],sky:'#26322d',ambient:1.7}
};
export const interiorForZone=(village,id)=>village==='earth'&&['great-cave','cave-crystals'].includes(id)?'earth-cave':null;
export function interiorForSave(save){const room=INTERIORS[save.interior?.id];return room?.village===save.village?room:null;}
export function enterInterior(save,id,standing){const room=INTERIORS[id];if(!room||room.village!==save.village||save.interior)return false;save.interior={id,returnPosition:[...standing.position],returnSurface:standing.surface||null,returnElevation:standing.elevation};save.position=[...room.spawn];save.surface=null;save.elevation=0;return true;}
export function leaveInterior(save){const room=interiorForSave(save);if(!room)return false;const from=save.interior;save.position=[...from.returnPosition];save.surface=from.returnSurface;save.elevation=from.returnElevation;save.interior=null;return true;}
export function readInterior(raw,village){const room=INTERIORS[raw?.id];if(!room||room.village!==village)return null;const p=raw.returnPosition,valid=Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&Math.abs(n)<140);return {id:room.id,returnPosition:valid?[...p]:[...room.exterior],returnSurface:room.surface,returnElevation:Number.isFinite(raw.returnElevation)&&raw.returnElevation>=-20&&raw.returnElevation<100?raw.returnElevation:null};}

// Only this room is built after the outdoor scene has been disposed.
export function buildInterior(c,room){
  const {land,box,cyl,mesh,M,physics}=c,root=new T.Group();root.name='interior-'+room.id;land.add(root);const wood=room.id==='wood-arena',b=room.bounds,center=(b.minZ+b.maxZ)/2,depth=b.maxZ-b.minZ;
  const solid=(o,name)=>c.solidMesh(o,{name,stepable:false});
  const stone=M(wood?'#68553e':'#5c5b50'),trim=M(wood?'#493a2d':'#373f3d'),warm=M('#e2bd73',.4);
  const floor=box(root,M(wood?'#99815c':'#777361'),0,-.18,center,b.x*2,.36,depth);floor.name='interior-floor';physics.addBox({name:'interior-floor',x:0,z:center,w:b.x*2,d:depth,bottom:-.36,top:0});
  for(const side of [-1,1])solid(box(root,stone,side*(b.x+.3),5.5,center,.6,11,depth+1),'interior-side-wall');
  for(const z of [b.minZ-.3,b.maxZ+.3])solid(box(root,stone,0,5.5,z,b.x*2+1,11,.6),'interior-end-wall');
  // Back-side roof closes the room without exposing any landscape above it.
  const roof=box(root,M(wood?'#4a4030':'#42483f'),0,12,center,b.x*2+1,.5,depth+1);roof.name='interior-ceiling';
  const fixtures=[{kind:'interior-exit',id:room.id,x:room.exit[0],z:room.exit[1],y:0,label:wood?'Ra hiên nhà trên cây':'Trở ra Làng Thổ'}];
  if(wood){
    for(let z=b.minZ+1;z<b.maxZ;z+=1.25)box(root,M(Math.round(z)%2?'#a28c67':'#917852'),0,.006,z,b.x*2-.4,.012,.035);
    for(const side of [-1,1])for(const z of [-24,-12,0,12,24])solid(box(root,trim,side*23,5.6,z,.75,11.2,.75),'arena-timber-column');
    for(const z of [-24,-12,0,12,24])box(root,trim,0,10.7,z,47,.6,.6);
    // The ring is flush with the surrounding floor; movement never catches a step.
    cyl(root,M('#c4b386'),0,.015,0,13,.03,64);const ring=mesh(new T.RingGeometry(12.4,12.62,64),M('#644d36'),root,0,.04,0);ring.rotation.x=-Math.PI/2;
    for(const side of [-1,1])for(let row=0;row<3;row++){const x=side*(17+row*2);solid(box(root,M(row%2?'#746047':'#826d50'),x,.5+row*.5,0,1.65,1+row,42),'arena-grandstand');for(const z of [-20,20])box(root,trim,x,1.25+row*.5,z,1.8,.12,.18);}
    const villages=Object.keys(REGIONS).filter(id=>id!=='nameless');
    villages.forEach((id,i)=>{const x=-20+i*5,cloth=box(root,M(({water:'#6296b2',fire:'#b85843',lightning:'#9182bb',earth:'#ab8a58',wind:'#85aa86',light:'#e0c984',ice:'#a5d5dc',wood:'#568764',dark:'#635577'})[id]),x,7.6,-30.55,2.5,4,.06);cloth.name='village-banner-'+id;box(root,warm,x,9.7,-30.4,2.8,.08,.12);});
    box(root,trim,0,.5,-24,7,1,2.5);box(root,M('#c9b585'),0,1.02,-24,6.8,.06,2.4);
    fixtures.push({kind:'arena-host',id:'wood-arena-host',x:0,z:17,y:0,label:'Trọng tài · Giao hữu Cửu Làng'});
    for(const z of [-20,0,20]){const light=new T.PointLight('#ffdc9e',9,35,1.5);light.position.set(0,8,z);root.add(light);cyl(root,warm,0,8,z,.5,.65,8);}
    box(root,trim,0,2.3,30.65,4.6,4.6,.08);box(root,M('#e6d2a0',.35),0,4.9,30.5,5,.3,.3);
  }else{
    for(let i=0;i<24;i++){const side=i%2?1:-1,z=-12-Math.floor(i/2)*3.8,x=side*(17+(i%3)*1.1),h=2+i%4;
      solid(mesh(new T.ConeGeometry(1.1,h,7),stone,root,x,h/2,z),'cave-stalagmite');const top=mesh(new T.ConeGeometry(.8,2.5+i%3,7),trim,root,x,10,z);top.rotation.z=Math.PI;
    }
    for(const [x,z] of [[11,-40],[-15,-46],[16,-23],[-12,-17]]){for(let k=0;k<5;k++){const crystal=mesh(new T.OctahedronGeometry(.65),M(k%2?'#8ebdb2':'#b4d6bd',.65),root,x+(k-2)*.6,1+k%2*.4,z+Math.sin(k)*.5);crystal.scale.set(.7,1.7+k%2,.7);crystal.rotation.z=(k-2)*.2;}const light=new T.PointLight('#86d4be',6,18,1.4);light.position.set(x,2,z);root.add(light);}
    for(const side of [-1,1])for(const z of [-20,-50]){box(root,trim,side*20,2,z,.12,4,.12);const light=new T.PointLight('#efc280',5,18,1.5);light.position.set(side*19,3.7,z);if(side===(z===-20?-1:1))root.add(light);box(root,warm,side*19,3.5,z,.35,.65,.35);}
    const pool=mesh(new T.CircleGeometry(4,40),M('#527d79',.12),root,-10,.025,-39);pool.rotation.x=-Math.PI/2;const rail=M('#564b3d');for(const x of [3,4.2])box(root,rail,x,.035,-37,.08,.07,23);box(root,rail,3.6,.5,-43,1.7,1,2.1);
    fixtures.push(...room.zones.map(id=>{const z=REGIONS.earth.zones.find(z=>z.id===id);return {kind:'landmark',id,x:z.x,z:z.z,y:0,label:z.name};}));
    box(root,new T.MeshBasicMaterial({color:'#070a0b'}),0,2.5,b.maxZ-.05,5,5,.08);
  }
  return {fixtures,root};
}
