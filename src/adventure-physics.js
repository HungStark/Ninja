// A feet-based character body against oriented boxes. Terrain is continuous;
// raised decks and terrace walls are solids, with separate support and side tests.
export function createCharacterPhysics({position,baseFloor,staticBlocked,radius=.36,height=2.85,gravity=20,jumpSpeed=10.8,stepHeight=.4}){
  const solids=[],cells=new Map(),safeHistory=[];let grounded=true,velocity=0,lastSafe={x:position.x,y:position.y,z:position.z};
  const nearby=(x,z)=>cells.get(`${Math.floor(x/8)},${Math.floor(z/8)}`)||[];
  const top=(s,x,z)=>s.topAt?s.topAt(x,z):s.top,bottom=(s,x,z)=>s.bottomAt?s.bottomAt(x,z):s.bottom;
  const stepable=(s,x,z)=>s.stepableAt?s.stepableAt(x,z):s.stepable;
  function clearance(s,x,z){if(s.polygon){let inside=true,nearest=Infinity;for(let i=0;i<s.polygon.length;i++){const a=s.polygon[i],b=s.polygon[(i+1)%s.polygon.length],dx=b.x-a.x,dz=b.z-a.z;if(dx*(z-a.z)-dz*(x-a.x)<-1e-7)inside=false;const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));nearest=Math.min(nearest,Math.hypot(x-a.x-t*dx,z-a.z-t*dz));}return inside?-nearest:nearest;}const dx=x-s.x,dz=z-s.z,lx=dx*s.cos-dz*s.sin,lz=dx*s.sin+dz*s.cos,ex=Math.abs(lx)-s.w/2,ez=Math.abs(lz)-s.d/2;return ex<=0&&ez<=0?Math.max(ex,ez):Math.hypot(Math.max(0,ex),Math.max(0,ez));}
  function touches(s,x,z,r=radius){return clearance(s,x,z)<r+1e-10;}
  function addBox(box){const s={stepable:true,...box,cos:Math.cos(box.yaw||0),sin:Math.sin(box.yaw||0)};solids.push(s);const ex=(Math.abs(s.cos)*s.w+Math.abs(s.sin)*s.d)/2+1,ez=(Math.abs(s.sin)*s.w+Math.abs(s.cos)*s.d)/2+1;for(let x=Math.floor((s.x-ex)/8);x<=Math.floor((s.x+ex)/8);x++)for(let z=Math.floor((s.z-ez)/8);z<=Math.floor((s.z+ez)/8);z++){const key=`${x},${z}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(s);}return s;}
  function floorAt(x,z,ceiling=Infinity,floor=baseFloor(x,z)){for(const s of nearby(x,z))if(touches(s,x,z,radius*.7)){const y=top(s,x,z);if(y<=ceiling+.015&&y>floor)floor=y;}return floor;}
  function overlaps(x,z,feet,h=height,r=radius,canStep=false,railMargin=0){return nearby(x,z).some(s=>touches(s,x,z,r+(!stepable(s,x,z)?railMargin:0))&&feet<top(s,x,z)-.012&&feet+h>bottom(s,x,z)+.012&&!(canStep&&stepable(s,x,z)&&top(s,x,z)<=feet+stepHeight));}
  function canMoveTo(x,z){const feet=position.y;if(staticBlocked(x,z)||baseFloor(x,z)>feet+(grounded?stepHeight:.015))return false;return !nearby(x,z).some(s=>touches(s,x,z)&&feet<top(s,x,z)-.012&&feet+height>bottom(s,x,z)+.012&&!(grounded&&stepable(s,x,z)&&top(s,x,z)<=feet+stepHeight)&&!(touches(s,position.x,position.z)&&clearance(s,x,z)>clearance(s,position.x,position.z)+1e-7));}
  function embedded(){return nearby(position.x,position.z).some(s=>clearance(s,position.x,position.z)<radius-.06&&position.y<top(s,position.x,position.z)-stepHeight-.02&&position.y+height>bottom(s,position.x,position.z)+.06);}
  function recover({force=false}={}){
    const start={x:position.x,y:position.y,z:position.z},valid=(x,y,z,room=radius+.02)=>!staticBlocked(x,z)&&!overlaps(x,z,y,height,room)&&Math.abs(floorAt(x,z,y+.03)-y)<.08;
    const candidates=force?[...safeHistory].reverse():[lastSafe];
    for(const p of candidates){const distance=Math.hypot(p.x-start.x,p.z-start.z);if(distance>8||force&&distance<1.5||Math.abs(p.y-start.y)>4||!valid(p.x,p.y,p.z))continue;position.x=p.x;position.z=p.z;reset(p.y);return true;}
    for(let r=force?1.4:.35;r<=7;r+=.35)for(let k=0;k<32;k++){const a=k/32*Math.PI*2,x=start.x+Math.sin(a)*r,z=start.z+Math.cos(a)*r,y=floorAt(x,z,start.y+stepHeight);if(y<start.y-2.5||y>start.y+stepHeight||!valid(x,y,z,force?.65:radius+.02))continue;position.x=x;position.z=z;reset(y);return true;}return false;
  }
  function remember(){if(!overlaps(position.x,position.z,position.y,height,radius)){lastSafe={x:position.x,y:position.y,z:position.z};const p=safeHistory.at(-1);if(!p||Math.hypot(p.x-position.x,p.z-position.z)>.75){safeHistory.push({...lastSafe});if(safeHistory.length>32)safeHistory.shift();}}}
  function move(dx,dz){if((dx||dz)&&grounded&&embedded())recover();const before={x:position.x,z:position.z},steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.15));for(let k=0;k<steps;k++){
    if(canMoveTo(position.x+dx/steps,position.z))position.x+=dx/steps;
    if(canMoveTo(position.x,position.z+dz/steps))position.z+=dz/steps;
    if(grounded){const floor=floorAt(position.x,position.z,position.y+stepHeight);if(floor>position.y&&floor<=position.y+stepHeight+.015)position.y=floor;}
  }return {x:position.x-before.x,z:position.z-before.z};}
  function reset(y=position.y){position.y=y;velocity=0;grounded=true;remember();}
  function jump(){if(!grounded)return false;const floor=floorAt(position.x,position.z,position.y+.03);if(Math.abs(position.y-floor)>.08)return false;grounded=false;velocity=jumpSpeed;return true;}
  function step(dt){
    const count=Math.max(1,Math.ceil(dt/(1/120))),h=dt/count;
    for(let i=0;i<count;i++){
      if(grounded){const floor=floorAt(position.x,position.z,position.y+stepHeight);if(Math.abs(position.y-floor)<=stepHeight+.015){position.y=floor;velocity=0;remember();continue;}grounded=false;}
      const oldY=position.y;velocity-=gravity*h;let nextY=oldY+velocity*h;
      if(velocity>0)for(const s of nearby(position.x,position.z)){if(!touches(s,position.x,position.z))continue;const ceiling=bottom(s,position.x,position.z);if(oldY+height<=ceiling+.015&&nextY+height>=ceiling){nextY=Math.min(nextY,ceiling-height);velocity=0;}}
      const floor=floorAt(position.x,position.z,oldY+.025);
      if(velocity<=0&&nextY<=floor){position.y=floor;velocity=0;grounded=true;remember();}else position.y=nextY;
    }
  }
  return {solids,addBox,touches,top,bottom,floorAt,overlaps,canMoveTo,move,reset,jump,step,recover,clear(){solids.length=0;cells.clear();safeHistory.length=0;lastSafe={x:position.x,y:position.y,z:position.z};reset();},state:()=>({grounded,verticalSpeed:velocity,ground:floorAt(position.x,position.z,position.y+.03),jumpHeight:jumpSpeed*jumpSpeed/(2*gravity)}),safePosition:()=>grounded&&!overlaps(position.x,position.z,position.y)?{x:position.x,y:position.y,z:position.z}:{...lastSafe}};
}
