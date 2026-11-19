import {createNinja} from './ninja.js';
import {encounterAppearance} from './encounter-appearance.js';
import {islandOccupied} from './island-occupation.js';
import {CINEMATIC_ROUTE} from './cinematic-route.js';

const patrolAreas={nameless:['old-bridge','bell-shrine'],water:['floating-market','shipyard','lotus'],fire:['forge','ash-outpost','basalt'],lightning:['relay','storm-shelter','copper-ridge'],wind:['wind-farm','kite-meadow','windmills'],earth:['quarry','stone-arch','potters'],wood:['root-quarter','heart-tree-house','herb-garden'],ice:['hearth','polar-sea','snow-ridge'],light:['glass-bridge','sun-plaza','sun-temple'],dark:['lantern-street','mirror-pool','moon-temple']};

export function createVillagePatrols({id,save,land,interactives,citizens,blocked,floor,findPath}){
  const guards=[],occupied=islandOccupied(save,id);
  const eligible=interactives.filter(i=>['landmark','gate','clinic'].includes(i.kind)&&!i.platform&&i.id!=='summit-lotus');
  const preferred=patrolAreas[id].map(key=>eligible.find(i=>i.id===key)).filter(Boolean);
  const sites=[...new Set([...preferred,...eligible.filter(i=>i.kind!=='gate'),...eligible])];
  function pointNear(site,seed,radii){
    for(const radius of radii)for(let i=0;i<12;i++){
      const a=(i+seed*2.1)*Math.PI/6,x=Math.round(site.x+Math.sin(a)*radius),z=Math.round(site.z+Math.cos(a)*radius);
      if(!blocked(x,z))return [x,z];
    }
    return null;
  }
  for(const [index,site]of sites.entries()){
    if(guards.length===(id==='nameless'?2:3))break;
    const a=pointNear(site,index,[4,7,10,14]),b=pointNear(site,index+3,[10,7,14,4]);
    if(!a||!b||Math.hypot(a[0]-b[0],a[1]-b[1])<4)continue;
    const nearbyBlocked=(x,z)=>Math.hypot(x-site.x,z-site.z)>26||blocked(x,z);
    nearbyBlocked.limit=blocked.limit;
    const out=findPath(a,b,nearbyBlocked),back=findPath(b,a,nearbyBlocked);
    if(out.length<3||back.length<3)continue;
    const path=[...out,...back];
    const guardId=`${id}-patrol-${guards.length+1}`;
    const char=createNinja(encounterAppearance({kind:'village-guard',village:id,element:id==='nameless'?'wind':id,occupation:occupied}));
    char.root.name=guardId;char.root.position.set(a[0],floor(...a),a[1]);land.add(char.root);citizens.push(char);
    const entry={id:guardId,kind:'village-patrol',occupation:occupied,x:a[0],z:a[1],y:char.root.position.y,label:occupied?CINEMATIC_ROUTE.ui.occupiedPatrol:CINEMATIC_ROUTE.ui.patrol,appearance:char.profile};
    interactives.push(entry);guards.push({char,entry,path,index:0,wait:guards.length*.8,moving:false,velocity:{x:0,z:0}});
  }
  function update(dt,paused,hero){
    for(const guard of guards){
      const {char,entry,path}=guard,p=char.root.position;
      guard.moving=false;guard.velocity={x:0,z:0};
      if(paused||p.distanceTo(hero)<1.35)continue;
      if(guard.wait>0){guard.wait-=dt;continue;}
      const [x,z]=path[guard.index],dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);
      if(d<.08){guard.index=(guard.index+1)%path.length;if(!guard.index)guard.wait=1.2;continue;}
      const speed=2.25,step=Math.min(d,speed*dt),nx=p.x+dx/d*step,nz=p.z+dz/d*step,ny=floor(nx,nz);
      if(blocked(nx,nz)||Math.abs(ny-p.y)>.9){path.reverse();guard.index=path.length-1-guard.index;guard.wait=.8;continue;}
      p.set(nx,ny,nz);char.root.rotation.y=Math.atan2(dx,dz);Object.assign(entry,{x:nx,y:ny,z:nz});
      guard.moving=true;guard.velocity={x:dx/d*speed,z:dz/d*speed};
    }
  }
  return {update,guards,state:()=>guards.map(g=>({id:g.entry.id,occupation:g.entry.occupation,moving:g.moving,position:g.char.root.position.toArray()}))};
}
