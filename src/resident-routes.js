// Residents walk to a nearby job, pause to work, then return home. Routes use
// the finished village collision map, including furniture and river banks.
export function createResidentRoutes({residents,interactives,findPath,blocked,floor}){
  const walkers=[];
  for(const [index,{person,char}]of residents.entries()){
    if(person.platform||person.elevation!==undefined||['mourning','offering'].includes(person.activity)||person.id.endsWith('war-cemetery'))continue;
    const home={x:char.root.position.x,y:char.root.position.y,z:char.root.position.z},points=[];
    const localBlocked=(x,z)=>Math.abs(x-home.x)>11||Math.abs(z-home.z)>11||blocked(x,z)||Math.abs(floor(x,z,home.y+.4)-home.y)>.65;
    localBlocked.limit=blocked.limit;
    for(let k=0;k<12;k++){
      const a=(index*1.7+k)*Math.PI/6,x=home.x+Math.cos(a)*(4+index%3),z=home.z+Math.sin(a)*(4+index%3),y=floor(x,z,home.y+.4);
      if(blocked(x,z)||Math.abs(y-home.y)>.6)continue;
      const path=findPath([home.x,home.z],[x,z],localBlocked);if(!path.length||path.length>35)continue;
      points.push({x,z,y});if(points.length===2)break;
    }
    if(points.length)walkers.push({person,char,home,points:[home,...points],entry:interactives.find(i=>i.id===person.id),localBlocked,index:0,path:[],wait:2+index%6,moving:false});
  }
  function update(dt,paused,hero){
    const moving=new Map();
    for(const w of walkers){
      const p=w.char.root.position;w.moving=false;
      if(paused||Math.hypot(p.x-hero.x,p.z-hero.z)<3){moving.set(w.char,false);continue;}
      if(w.wait>0)w.wait-=dt;
      else{
        if(!w.path.length){w.index=(w.index+1)%w.points.length;const t=w.points[w.index];w.path=findPath([p.x,p.z],[t.x,t.z],w.localBlocked);if(!w.path.length)w.wait=5;}
        const t=w.path[0];
        if(t){const dx=t[0]-p.x,dz=t[1]-p.z,d=Math.hypot(dx,dz),step=Math.min(d,dt*1.35),x=p.x+dx/(d||1)*step,z=p.z+dz/(d||1)*step,y=floor(x,z,p.y+.4);
          if(blocked(x,z)||Math.abs(y-p.y)>.65){w.path=[];w.wait=4;}
          else{p.set(x,y,z);w.char.root.rotation.y=Math.atan2(dx,dz);w.moving=step>.001;if(d<.15){w.path.shift();if(!w.path.length)w.wait=5+w.index*2;}}
        }
      }
      if(w.entry)Object.assign(w.entry,{x:p.x,y:p.y,z:p.z});moving.set(w.char,w.moving);
    }
    return moving;
  }
  return {update,state:()=>walkers.map(w=>({id:w.person.id,moving:w.moving,position:w.char.root.position.toArray(),home:[w.home.x,w.home.y,w.home.z]}))};
}
