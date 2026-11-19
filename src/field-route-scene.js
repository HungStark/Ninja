import * as T from 'three';
import {createQuestItem} from './quest-items.js';
import {createNinja} from './ninja.js';
import {createVillager} from './villager.js';
import {villagerAppearance} from './villager-appearance.js';
import {currentVillageEvent,eventSpot} from './village-events.js';
import {fieldMission,FIELD_ROUTE} from './field-route.js';
import {canProgressPlot} from './campaign-plot.js';
import {villageSideStory} from './cinematic-route.js';
import {REGIONS} from './adventure-world.js';

export function createFieldRouteScene({scene,hero,interactives,blocked,floor,findPath,dispose,side=false,residentRoot=()=>null}){
  const kind=side?'side-story-task':'field-task';
  const root=new T.Group();root.name=side?'village-side-story':'field-route';scene.add(root);
  let active=null,key=null,elapsed=0,started=false,finished=false;
  const box=(parent,color,x,y,z,w,h,d)=>{
    const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshStandardMaterial({color,roughness:.8}));
    mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
  };
  function reset(){
    for(let i=interactives.length-1;i>=0;i--)if(interactives[i].kind===kind)interactives.splice(i,1);
    if(active?.represented)active.represented.root.visible=active.represented.visible;
    if(active?.actor){active.actor.dispose();active.actor.root.removeFromParent();}
    for(const child of [...root.children]){dispose(child);child.removeFromParent();}
    active=key=null;elapsed=0;started=finished=false;
  }
  function safePoint(x,z){
    for(const radius of [0,1.5,3,5,8,12,18])for(let i=0;i<(radius?16:1);i++){
      const px=x+radius*Math.cos(i*Math.PI/8),pz=z+radius*Math.sin(i*Math.PI/8);
      if(!blocked(px,pz)&&!blocked(Math.round(px),Math.round(pz)))return {x:px,z:pz,y:floor(px,pz)};
    }
    return null;
  }
  function trail(from,anchor,task){
    if(task.destinationOffset){
      const [dx,dz]=task.destinationOffset,end=safePoint(anchor.x+dx,anchor.z+dz);
      if(end){
        const preferred=findPath([from.x,from.z],[end.x,end.z],blocked);
        if(preferred.length>=4&&preferred.length<task.distance*3)return preferred;
      }
    }
    const heading=Math.atan2(anchor.x,anchor.z)+Math.PI;
    for(const turn of [0,.65,-.65,1.3,-1.3,2.1,-2.1,Math.PI]){
      const a=heading+turn,p=safePoint(from.x+Math.sin(a)*task.distance,from.z+Math.cos(a)*task.distance);
      if(!p||Math.hypot(p.x-from.x,p.z-from.z)<5)continue;
      const path=findPath([from.x,from.z],[p.x,p.z],blocked);
      if(path.length>=4&&path.length<task.distance*3)return path;
    }
    return [];
  }
  function bridgeWork(progress){
    const bridge=scene.getObjectByName('ruined-stone-bridge');if(!bridge)return;
    const work=new T.Group();work.name=progress>=2?'bridge-reinforced':'bridge-repair-site';
    bridge.getWorldPosition(work.position);bridge.getWorldQuaternion(work.quaternion);root.add(work);
    if(progress>=2){
      for(const side of [-1,1])for(const z of [-4,0,4]){
        box(work,'#ad8a5a',side*2.53,5.05-Math.abs(z)*.09,z,.18,1.3,.2);
        box(work,'#a78350',side*2.53,5.63-Math.abs(z)*.09,z,.17,.22,3.9);
      }
    }else{
      const beam=box(work,'#745a40',2.54,3.1,7,.22,3,.25);beam.rotation.x=.5;
      const plank=box(work,'#8e6b46',2.3,3.48,5,.22,.25,2);plank.rotation.x=.42;
    }
  }
  function showRestoredSite(id,completed,save){
    const step={water:2,lightning:0,wood:3}[id];
    const site=step===undefined?null:FIELD_ROUTE.events[id+':'+step];
    if(!site||completed<site.steps.length)return;
    const anchor=eventSpot(id,{step,spot:0},save),point=safePoint(anchor.x,anchor.z);
    if(!point)return;
    const group=new T.Group();group.name='restored-field-site-'+id;group.position.set(point.x,point.y,point.z);root.add(group);
    if(id==='wood'){
      for(let i=0;i<7;i++){
        const a=i*2.4,r=1+i*.29;
        const sprout=createQuestItem({model:'lotus'});sprout.position.set(Math.cos(a)*r,0,Math.sin(a)*r);sprout.scale.setScalar(.28+i*.025);group.add(sprout);
        sprout.traverse(o=>{if(o.isMesh&&o.material.color.getHexString()==='d95c79')o.material.color.set('#8dbb6a');});
      }
    }else for(const side of [-1,1]){
      const lantern=createQuestItem({model:'lantern'});lantern.position.set(side*1.3,0,0);lantern.scale.setScalar(1.45);group.add(lantern);
      lantern.traverse(o=>{if(o.isMesh&&o.material.emissiveIntensity===.5){o.material.color.set(id==='water'?'#98dedf':'#ffdf91');o.material.emissive.copy(o.material.color);o.material.emissiveIntensity=.9;}});
    }
  }
  function sync(save,id,roomId){
    if(side){
      const story=!roomId&&villageSideStory(save,id);
      const next=story&&story.step>=0?`${story.key}:${story.step}`:null;
      if(next===key)return;
      reset();key=next;
      if(!next)return;
      const anchor={x:story.anchor[0],z:story.anchor[1]};
      if(story.complete){
        const end=safePoint(anchor.x,anchor.z);
        if(end){const lamp=createQuestItem({model:story.steps.at(-1).model||'lantern'});lamp.name='side-story-result-'+id;lamp.position.set(end.x+1,end.y,end.z);root.add(lamp);}
      }else spawn({...story,task:{...story.task,name:story.task.mode==='escort'?story.title:null}},anchor,id);
      return;
    }
    const event=canProgressPlot(save,id)?currentVillageEvent(save,id):null,mission=fieldMission(save,event);
    const local=mission&&(!mission.opening||id==='nameless')&&(mission.opening?!roomId:(event.interior||null)===(roomId||null));
    const bridgeProgress=id==='nameless'&&!roomId&&(save.story.fieldMissions?.['nameless:road']?.step||0);
    const signalStep={water:2,lightning:0,wood:3}[id];
    const siteProgress=!roomId&&(save.story.fieldMissions?.[id+':'+signalStep]?.step||0);
    const next=JSON.stringify([id,roomId,local?mission.key:null,local?mission.step:null,bridgeProgress,siteProgress]);
    if(next===key)return;
    reset();key=next;
    if(bridgeProgress||local&&mission.opening)bridgeWork(bridgeProgress);
    if(siteProgress)showRestoredSite(id,siteProgress,save);
    if(!local||mission.complete)return;
    const anchor=mission.opening?interactives.find(i=>i.id==='old-bridge'):eventSpot(id,event,save);
    if(anchor)spawn(mission,anchor,id);
  }
  function spawn(mission,anchor,id){
    const task=mission.task;
    const [dx,dz]=task.offset||(side&&mission.step>0?[2.1,1.4]:[0,0]);
    const point=safePoint(anchor.x+dx,anchor.z+dz)||safePoint(hero.root.position.x,hero.root.position.z);
    if(!point)return;
    const entry={kind,id:'field-'+mission.key+'-'+mission.step,label:task.label,...point};
    const group=new T.Group();group.name='field-task-'+task.mode;group.position.set(point.x,point.y,point.z);root.add(group);
    const mobile=task.mode==='escort'||task.mode==='chase';
    let actor=null,represented=null;
    if(task.name){
      const nurse=mission.key==='fire:2';
      const guide=side&&REGIONS[id].npcs.find(p=>p.id===mission.giver);
      const person=guide?{...guide,activity:null}:{id:nurse?'fire-dan':'field-actor',kind:nurse?'healer':'lore',appearance:{female:nurse,job:mission.opening&&mission.step===1?'carpenter':'villager'}};
      actor=task.mode==='chase'?createNinja({id:'field-runner',village:id==='nameless'?'wind':id}):createVillager(villagerAppearance(id,person));
      const original=guide&&residentRoot(guide.id);
      if(original){represented={root:original,visible:original.visible};original.visible=false;}
      group.add(actor.root);actor.root.name='field-actor';if(!mobile)actor.root.position.set(1.25,0,0);
    }
    if(task.model)group.add(createQuestItem({model:task.model}));
    const ring=new T.Mesh(new T.TorusGeometry(.83,.032,6,28),new T.MeshBasicMaterial({color:0xead29b}));ring.rotation.x=Math.PI/2;ring.position.y=.14;group.add(ring);
    let path=mobile?trail(point,anchor,task):[];
    const end=path.at(-1);
    if(end){const post=createQuestItem({model:'lantern'});post.name='field-destination';post.position.set(end[0],floor(...end),end[1]);root.add(post);}
    interactives.push(entry);active={entry,mission,task,group,actor,represented,path,end,ring};
  }
  function start(entry){
    if(!active||entry!==active.entry||started||finished)return false;
    started=true;return true;
  }
  function update(dt,time){
    if(!active||finished)return null;
    const {entry,mission,task,group,actor,path,end,ring}=active;
    const p=hero.root.position,position=group.position,distance=()=>p.distanceTo(position);
    let moving=false,complete=false;
    if(started){
      elapsed+=dt;
      if(task.mode==='hold'){
        active.progress=(active.progress||0)+(distance()<=3.3?dt:0);
        ring.material.color.setHex(distance()<=3.3?0x86dfb0:0xead29b);ring.scale.setScalar(1+.32*Math.min(1,active.progress/task.seconds));
        complete=active.progress>=task.seconds;
      }else if(task.mode==='interact')complete=true;
      else{
        const chase=task.mode==='chase';
        if(path.length&&(chase||distance()<5.5)){
          let budget=dt*(chase?4.2:2.05);
          while(budget>0&&path.length){
            const [x,z]=path[0],dx=x-position.x,dz=z-position.z,d=Math.hypot(dx,dz),step=Math.min(d,budget);
            if(d>.001){position.x+=dx/d*step;position.z+=dz/d*step;position.y=floor(position.x,position.z,position.y+.45);group.rotation.y=Math.atan2(dx,dz);moving=true;}
            if(d<=step+.002)path.shift();budget-=step;
          }
          Object.assign(entry,{x:position.x,y:position.y,z:position.z});
        }
        complete=chase?(elapsed>1.25&&distance()<2.5):(!path.length&&distance()<4);
        if(!end&&elapsed>1&&distance()<3)complete=true;
      }
    }
    actor?.update(time,moving,null,dt);
    if(!complete)return null;
    finished=true;return {key:mission.key,step:mission.step,point:[position.x,position.z]};
  }
  function state(){
    if(!active)return null;
    const {task,entry,end,progress}=active;
    return {mode:task.mode,started,finished,progress:task.seconds?Math.min(1,(progress||0)/task.seconds):null,near:hero.root.position.distanceTo(active.group.position)<=3.3,target:[entry.x,entry.y,entry.z],end,entry};
  }
  return {sync,start,update,reset,state};
}
