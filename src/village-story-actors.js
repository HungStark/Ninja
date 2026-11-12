import {WOOD_SACRED_TREE} from './sacred-tree.js';
import {waterFootprintDry,nearestDryWaterPoint} from './water-network.js';
import * as T from 'three';
import {createNinja} from './ninja.js';
import {createVillager} from './villager.js';
import {villagerAppearance} from './villager-appearance.js';
import {HA_LY,HA_LY_MOTHER,FIRE_PRISON,currentVillageEvent,eventSpot,villageEventStep} from './village-events.js';
import {createFirePrison} from './fire-prison.js';
import {createCompanionFollow,FOLLOW_GAP} from './companion-follow.js';
import {carryingCompanion} from './companion-health.js';
import {companionPresent} from './campaign-plot.js';

export function createVillageStoryActors({scene,hero,blocked,floor,canFollow=p=>!blocked(p.x,p.z),addSolid,removeSolid=()=>{}}){
  const root=new T.Group();root.name='village-story-actors';scene.add(root);
  let follower=null,follow=null,entry=null,activeEvent=null,current='nameless',list=[],moving=false,clock=0;
  let stationary=[],prison=null,captive=null,mother=null;
  let syncedKey=null,syncedList=null,carrying=false;
  const sense=new T.Group(),senseMaterial=new T.MeshBasicMaterial({color:'#8ee8e0',transparent:true,opacity:0,depthWrite:false});sense.name='core-seal-sense';sense.visible=false;scene.add(sense);let senseLife=0;
  for(let i=0;i<3;i++){const ring=new T.Mesh(new T.TorusGeometry(1,.035,6,40),senseMaterial);ring.rotation.x=Math.PI/2;ring.position.y=.2+i*.55;sense.add(ring);}
  const dispose=g=>{const gs=new Set(),ms=new Set();g.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])ms.add(m);});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());g.removeFromParent();};
  function safePoint(p){for(const radius of [0,1.2,2.5,4,6,8])for(let i=0;i<(radius?16:1);i++){const a=i*Math.PI/8,x=p.x+Math.cos(a)*radius,z=p.z+Math.sin(a)*radius,y=floor(x,z,Number.isFinite(p.y)?p.y+.55:undefined);if(Number.isFinite(p.y)?Math.abs(y-p.y)<1.3&&canFollow({...p,x,y,z}):!blocked(x,z))return {x,z,y};}return {...p,y:floor(p.x,p.z,Number.isFinite(p.y)?p.y+.55:undefined)};}
  function mesh(parent,geometry,color,p,scale=[1,1,1]){const m=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.8,emissive:color,emissiveIntensity:.06}));m.position.fromArray(p);m.scale.fromArray(scale);m.castShadow=true;parent.add(m);return m;}
  function props(parent,style){
    if(style==='portal'){const ring=mesh(parent,new T.TorusGeometry(6,.22,8,48),'#9b70d7',[0,15,0]);ring.name='campaign-portal';const inner=mesh(parent,new T.CircleGeometry(5.8,48),'#251c48',[0,15,-.02]);inner.material.side=T.DoubleSide;inner.material.emissiveIntensity=.7;return;}
    const color={water:'#67bbd5',lightning:'#b4a0e7',earth:'#b09a73',wind:'#a3c9ac',light:'#e1ca85',ice:'#c4ebec',wood:'#82a76a',dark:'#9682b2'}[style]||'#b5a079';
    if(['letter','medicine','crate'].includes(style)){mesh(parent,new T.BoxGeometry(1.15,.7,.8),'#775b43',[0,.35,0]);mesh(parent,new T.BoxGeometry(.55,.045,.65),style==='medicine'?'#9ac594':'#e2d4aa',[0,.73,.07]);if(style==='medicine')mesh(parent,new T.CylinderGeometry(.14,.18,.4,10),'#69927c',[.32,.93,0]);return;}
    if(style==='rope'){const m=mesh(parent,new T.TorusGeometry(.65,.07,6,22),'#b89b74',[0,.3,0]);m.rotation.x=Math.PI/2;return;}
    if(style==='injured')return;
    if(['light','dark'].includes(style)){mesh(parent,new T.BoxGeometry(.12,2.6,.18),'#806d5b',[-.9,1.3,0]);mesh(parent,new T.BoxGeometry(.12,2.6,.18),'#806d5b',[.9,1.3,0]);mesh(parent,new T.OctahedronGeometry(1),color,[0,1.7,0],[.8,1.2,.14]);return;}
    if(style==='lantern'){mesh(parent,new T.CylinderGeometry(.4,.32,.7,8),'#f5bf73',[0,1.5,0]);mesh(parent,new T.CylinderGeometry(.06,.06,1.4,8),'#655749',[0,.7,0]);return;}
    for(let i=0;i<3;i++){const x=(i-1)*.85;mesh(parent,style==='earth'?new T.DodecahedronGeometry(.65):new T.CylinderGeometry(.16,.25,1.6,7),color,[x,.8,-.4],[1,1+i*.12,1]);}
  }
  function addActor(id,p,wounded=false){const model=createNinja(HA_LY);model.root.name=wounded?'ha-ly-wounded':'ha-ly-companion';model.root.position.set(p.x,p.y,p.z);root.add(model.root);if(wounded)stationary.push(model);return model;}
  function reset(keepFollower=false){hero.setCarrying(false);carrying=false;syncedKey=null;syncedList=null;for(const s of prison?.colliders||[])removeSolid(s);prison=null;for(const actor of stationary){actor.dispose?.();actor.root.userData.villager=null;dispose(actor.root);}stationary=[];captive=null;mother=null;if(!keepFollower&&follower){follower.dispose();dispose(follower.root);}for(const child of [...root.children])if(!keepFollower||child!==follower?.root)dispose(child);if(!keepFollower){follower=null;follow=null;entry=null;}activeEvent=null;moving=false;}
  function sync(save,id,interactives,inInterior=false){
    const key=JSON.stringify([id,inInterior,villageEventStep(save,id),companionPresent(save),carryingCompanion(save)]);
    if(key===syncedKey&&interactives===syncedList)return;
    reset(current===id&&!!follower&&companionPresent(save));current=id;list=interactives;for(let i=list.length-1;i>=0;i--)if(['village-event','story-witness','companion'].includes(list[i].kind))list.splice(i,1);
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
    if(activeEvent){const giver=id==='fire'&&activeEvent.style==='medicine'?list.find(i=>i.kind==='expedition-giver'):null,original=giver||eventSpot(id,activeEvent),dry=id==='water'&&!waterFootprintDry(original.x,original.z,{w:4,d:4,padding:.8})?nearestDryWaterPoint(original.x,original.z,{w:4,d:4,padding:.8,valid:(x,z)=>!blocked(x,z)}):null,p=safePoint(dry||original);const g=new T.Group();g.position.set(p.x,p.y,p.z);root.add(g);
      if(id!=='fire'){if(id!=='wood'||activeEvent.style==='medicine')props(g,activeEvent.style);if(!['medicine','letter','crate','rope'].includes(activeEvent.style)){const actor=createVillager(villagerAppearance(id,{id:'story-guide-'+id,kind:'lore'}));actor.root.position.set(1.8,0,0);g.add(actor.root);stationary.push(actor);}}
      if(id==='dark'&&!companionPresent(save)&&save.story.companion.recruited){const actor=addActor(HA_LY.id,safePoint({x:p.x-2,z:p.z+1}));actor.root.name='ha-ly-investigating';stationary.push(actor);}
      if(activeEvent.rally){for(const [i,region]of ['water','fire','lightning','wind','earth','wood','ice','light','dark'].entries()){const angle=(i-4)*.23,pos=safePoint({x:p.x+Math.sin(angle)*9,z:p.z+6+Math.cos(angle)*4}),actor=createNinja({village:region});actor.root.name='coalition-'+region;actor.root.position.set(pos.x,pos.y,pos.z);root.add(actor.root);stationary.push(actor);}}

      const mark=mesh(g,new T.OctahedronGeometry(.18),'#f4d88d',[0,3.6,0]);mark.name='story-event-marker';
      list.push({kind:'village-event',id:`story-${id}-${activeEvent.step}`,eventVillage:id,step:activeEvent.step,x:p.x,z:p.z,y:p.y,label:activeEvent.title});
    }
    if(companionPresent(save)){if(!follower){const hp=hero.root.position,yaw=hero.root.rotation.y,p=safePoint({x:hp.x-Math.sin(yaw)*FOLLOW_GAP,y:hp.y,z:hp.z-Math.cos(yaw)*FOLLOW_GAP});follower=addActor(HA_LY.id,p);follower.root.rotation.y=yaw;entry={kind:'companion',id:HA_LY.id,label:'Hạ Ly · Bạn đồng hành',x:p.x,z:p.z,y:p.y};follow=createCompanionFollow({position:follower.root.position,canOccupy:canFollow,safePoint});follow.reset(hp,{yaw});}if(carryingCompanion(save)){carrying=true;hero.setCarrying(true);hero.root.add(follower.root);follower.root.name='ha-ly-carried';follower.root.position.set(1.25,1.55,.7);follower.root.rotation.set(0,0,Math.PI/2);follower.setStoryPose('carried');follow=null;}else if(follower.root.parent!==root){root.add(follower.root);follower.root.name='ha-ly-companion';follower.root.rotation.z=0;follower.setStoryPose('standing');const hp=hero.root.position;follower.root.position.copy(hp);follow=createCompanionFollow({position:follower.root.position,canOccupy:canFollow,safePoint});follow.reset(hp,{yaw:hero.root.rotation.y});}list.push(entry);}
    syncedKey=key;syncedList=interactives;
  }
  function update(dt,time,paused=false,riding=false,budget=null,leader={}){
    if(!paused&&senseLife>0){senseLife=Math.max(0,senseLife-dt);sense.visible=senseLife>0;senseMaterial.opacity=Math.min(.8,senseLife*.5);sense.children.forEach((ring,i)=>ring.scale.setScalar(1+(2-senseLife)*2+i*.4));}
    clock=time;for(const actor of stationary){const slot=budget?.prepare(actor,hero.root.position,dt);if(!slot||slot.tick)actor.update(time,false,null,paused?0:slot?.dt||dt);}if(!follower)return;if(carrying){follower.update(time,false,null,paused?0:dt);const p=follower.root.getWorldPosition(new T.Vector3());Object.assign(entry,{x:p.x,y:hero.root.position.y,z:p.z});return;}
    const p=follower.root.position,state=paused?follow.state():follow.update(dt,hero.root.position,{...leader,yaw:hero.root.rotation.y,riding,groundAt:(x,z,y)=>floor(x,z,y+.03)});moving=!paused&&state.moving;
    follower.root.rotation.y=state.pose.yaw??follower.root.rotation.y;follower.root.visible=true;follower.update(clock,moving,paused?null:state.velocity,paused?0:dt,state.pose);Object.assign(entry,{x:p.x,z:p.z,y:p.y});
  }
  return {sync,reset,update,senseSeal(){const item=list.find(i=>i.kind==='village-event');if(!item||!activeEvent?.sealTrace)return false;const target=activeEvent.targetObject===WOOD_SACRED_TREE.id?WOOD_SACRED_TREE:item;sense.position.set(target.x,floor(target.x,target.z),target.z);senseLife=2;sense.visible=true;return true;},actors:()=>[...stationary,...(follower?[follower]:[])],state:()=>({carrying,sealSense:senseLife>0,event:activeEvent?{village:current,step:activeEvent.step,title:activeEvent.title}:null,prison:prison?{opened:prison.opened,position:[prison.point.x,prison.point.y,prison.point.z]}:null,captive:captive?{pose:captive.root.userData.storyPose,modelReady:captive.modelReady,position:captive.root.position.toArray()}:null,mother:mother?{id:HA_LY_MOTHER.id,position:mother.root.position.toArray()}:null,recruited:!!follower,visible:!!follower?.root.visible,position:follower?.root.getWorldPosition(new T.Vector3()).toArray()||null,female:follower?.profile.female||false,moving,distance:follower?follower.root.position.distanceTo(hero.root.position):null,catchups:follow?.state().catchups||0,following:follow?{...follow.state(),pose:{...follow.state().pose}}:null})};
}
