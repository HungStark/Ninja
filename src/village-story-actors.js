import * as T from 'three';
import {createNinja} from './ninja.js';
import {createVillager} from './villager.js';
import {villagerAppearance} from './villager-appearance.js';
import {HA_LY,HA_LY_MOTHER,FIRE_PRISON,currentVillageEvent,eventSpot,villageEventStep} from './village-events.js';
import {createFirePrison} from './fire-prison.js';

export function createVillageStoryActors({scene,hero,blocked,floor,addSolid,removeSolid=()=>{}}){
  const root=new T.Group();root.name='village-story-actors';scene.add(root);
  let follower=null,entry=null,activeEvent=null,current='nameless',list=[],trail=[],moving=false,catchups=0,clock=0;
  let stationary=[],prison=null,captive=null,mother=null;
  const dispose=g=>{const gs=new Set(),ms=new Set();g.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])ms.add(m);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());g.removeFromParent();};
  function safePoint(p){for(const radius of [0,1.2,2.5,4,6,8])for(let i=0;i<(radius?16:1);i++){const a=i*Math.PI/8,x=p.x+Math.cos(a)*radius,z=p.z+Math.sin(a)*radius;if(!blocked(x,z))return {x,z,y:floor(x,z)};}return {...p,y:floor(p.x,p.z)};}
  function mesh(parent,geometry,color,p,scale=[1,1,1]){const m=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.8,emissive:color,emissiveIntensity:.06}));m.position.fromArray(p);m.scale.fromArray(scale);m.castShadow=true;parent.add(m);return m;}
  function props(parent,style){
    const color={water:'#67bbd5',lightning:'#b4a0e7',earth:'#b09a73',wind:'#a3c9ac',light:'#e1ca85',ice:'#c4ebec',wood:'#82a76a',dark:'#9682b2'}[style]||'#b5a079';
    if(['letter','medicine','crate'].includes(style)){mesh(parent,new T.BoxGeometry(1.15,.7,.8),'#775b43',[0,.35,0]);mesh(parent,new T.BoxGeometry(.55,.045,.65),style==='medicine'?'#9ac594':'#e2d4aa',[0,.73,.07]);if(style==='medicine')mesh(parent,new T.CylinderGeometry(.14,.18,.4,10),'#69927c',[.32,.93,0]);return;}
    if(style==='rope'){const m=mesh(parent,new T.TorusGeometry(.65,.07,6,22),'#b89b74',[0,.3,0]);m.rotation.x=Math.PI/2;return;}
    if(style==='injured')return;
    if(['light','dark'].includes(style)){mesh(parent,new T.BoxGeometry(.12,2.6,.18),'#806d5b',[-.9,1.3,0]);mesh(parent,new T.BoxGeometry(.12,2.6,.18),'#806d5b',[.9,1.3,0]);mesh(parent,new T.OctahedronGeometry(1),color,[0,1.7,0],[.8,1.2,.14]);return;}
    if(style==='lantern'){mesh(parent,new T.CylinderGeometry(.4,.32,.7,8),'#f5bf73',[0,1.5,0]);mesh(parent,new T.CylinderGeometry(.06,.06,1.4,8),'#655749',[0,.7,0]);return;}
    for(let i=0;i<3;i++){const x=(i-1)*.85;mesh(parent,style==='earth'?new T.DodecahedronGeometry(.65):new T.CylinderGeometry(.16,.25,1.6,7),color,[x,.8,-.4],[1,1+i*.12,1]);}
  }
  function addActor(id,p,wounded=false){const model=createNinja(HA_LY);model.root.name=wounded?'ha-ly-wounded':'ha-ly-companion';model.root.position.set(p.x,p.y,p.z);root.add(model.root);if(wounded)stationary.push(model);return model;}
  function reset(keepFollower=false){for(const s of prison?.colliders||[])removeSolid(s);prison=null;for(const actor of stationary){actor.dispose?.();actor.root.userData.villager=null;dispose(actor.root);}stationary=[];captive=null;mother=null;if(!keepFollower)follower?.dispose();for(const child of [...root.children])if(!keepFollower||child!==follower?.root)dispose(child);if(!keepFollower){follower=null;entry=null;trail=[];}activeEvent=null;moving=false;}
  function sync(save,id,interactives,inInterior=false){
    reset(current===id&&!!follower&&save.story?.companion?.recruited);current=id;list=interactives;for(let i=list.length-1;i>=0;i--)if(['village-event','story-witness','companion'].includes(list[i].kind))list.splice(i,1);
    activeEvent=inInterior?null:currentVillageEvent(save,id);
    if(id==='fire'&&!inInterior){
      const step=villageEventStep(save,id),p={...FIRE_PRISON,y:floor(FIRE_PRISON.x,FIRE_PRISON.z)};
      prison=createFirePrison(root,p,step>=2,addSolid);
      const mp=safePoint(eventSpot(id,{spot:'entrance'}));mother=createVillager({...villagerAppearance(id,HA_LY_MOTHER),...HA_LY_MOTHER});mother.root.name=HA_LY_MOTHER.id;mother.root.position.set(mp.x,mp.y,mp.z);root.add(mother.root);stationary.push(mother);
      if(step!==0)list.push({kind:'story-witness',id:HA_LY_MOTHER.id,...mp,label:'Bà Hồng · Mẹ nuôi của Hạ Ly'});
      if(!save.story?.companion?.recruited){
        captive=addActor(HA_LY.id,{x:p.x,y:p.y+.12,z:p.z-.9},true);captive.setStoryPose(step<2?'captive':'wounded');
        if(step===0||step===2)list.push({kind:'story-witness',id:'ha-ly-wounded',x:p.x,z:p.z+3.25,y:p.y,label:'Hạ Ly · Nhà lao'});
      }
    }
    if(activeEvent){const p=safePoint(eventSpot(id,activeEvent));const g=new T.Group();g.position.set(p.x,p.y,p.z);root.add(g);
      if(id!=='fire'){props(g,activeEvent.style);if(!['medicine','letter','crate','rope'].includes(activeEvent.style)){const actor=createVillager(villagerAppearance(id,{id:'story-guide-'+id,kind:'lore'}));actor.root.position.set(1.8,0,0);g.add(actor.root);stationary.push(actor);}}
      else if(activeEvent.style==='medicine')props(g,activeEvent.style);
      const mark=mesh(g,new T.OctahedronGeometry(.18),'#f4d88d',[0,3.6,0]);mark.name='story-event-marker';
      list.push({kind:'village-event',id:`story-${id}-${activeEvent.step}`,eventVillage:id,step:activeEvent.step,x:p.x,z:p.z,y:p.y,label:activeEvent.title});
    }
    if(save.story?.companion?.recruited){if(!follower){const hp=hero.root.position,p=safePoint({x:hp.x+1.3,z:hp.z+1});follower=addActor(HA_LY.id,p);entry={kind:'companion',id:HA_LY.id,label:'Hạ Ly · Bạn đồng hành',x:p.x,z:p.z,y:p.y};trail=[hp.clone()];}list.push(entry);}
  }
  function update(dt,time,paused=false,riding=false){
    clock=time;for(const actor of stationary)actor.update(time,false,null,paused?0:dt);if(!follower)return;const hp=hero.root.position,p=follower.root.position,previous=p.clone();moving=false;
    if(!paused){const last=trail.at(-1);if(!last||last.distanceTo(hp)>.32)trail.push(hp.clone());if(trail.length>160)trail.shift();
      if(p.distanceTo(hp)>22||(!riding&&Math.abs(hp.y-p.y)>6)){const safe=safePoint({x:hp.x+1.3,z:hp.z+1});p.set(safe.x,safe.y,safe.z);trail=[hp.clone()];catchups++;}
      let target=trail[0];while(trail.length>1&&p.distanceTo(trail[0])<.5){trail.shift();target=trail[0];}
      if(target&&p.distanceTo(hp)>1.65&&!riding){const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz),step=Math.min(d,dt*(p.distanceTo(hp)>5?7.2:4.9));if(d>.02){const nx=p.x+dx/d*step,nz=p.z+dz/d*step;if(!blocked(nx,nz)){const y=floor(nx,nz);if(Math.abs(y-p.y)<1.3){p.set(nx,y,nz);follower.root.rotation.y=Math.atan2(dx,dz);moving=step>.001;}}}}
    }
    const velocity=moving&&dt>0?{x:(p.x-previous.x)/dt,z:(p.z-previous.z)/dt}:null;
    follower.root.visible=!riding;follower.update(paused?clock:time,moving,velocity,paused?0:dt);Object.assign(entry,{x:p.x,z:p.z,y:p.y});
  }
  return {sync,reset,update,actors:()=>[...stationary,...(follower?[follower]:[])],state:()=>({event:activeEvent?{village:current,step:activeEvent.step,title:activeEvent.title}:null,prison:prison?{opened:prison.opened,position:[prison.point.x,prison.point.y,prison.point.z]}:null,captive:captive?{pose:captive.root.userData.storyPose,modelReady:captive.modelReady,position:captive.root.position.toArray()}:null,mother:mother?{id:HA_LY_MOTHER.id,position:mother.root.position.toArray()}:null,recruited:!!follower,visible:!!follower?.root.visible,position:follower?.root.position.toArray()||null,female:follower?.profile.female||false,moving,distance:follower?follower.root.position.distanceTo(hero.root.position):null,catchups})};
}
