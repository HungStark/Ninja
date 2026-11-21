import * as T from 'three';
import {createQuestItem} from './quest-items.js';
import {createNinja} from './ninja.js';
import {createVillager} from './villager.js';
import {villagerAppearance} from './villager-appearance.js';
import {currentVillageEvent,eventSpot} from './village-events.js';
import {bridgeMission,fieldMission,FIELD_ROUTE} from './field-route.js';
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
  function chaseTrail(from,anchor,task){
    const heading=Math.atan2(anchor.x,anchor.z)+Math.PI;
    for(const turn of [0,.65,-.65,1.3,-1.3,2.1,-2.1,Math.PI]){
      const a=heading+turn,p=safePoint(from.x+Math.sin(a)*task.distance,from.z+Math.cos(a)*task.distance);
      if(!p||Math.hypot(p.x-from.x,p.z-from.z)<5)continue;
      const path=findPath([from.x,from.z],[p.x,p.z],blocked);
      if(path.length>=4&&path.length<task.distance*3)return path;
    }
    return [];
  }
  function escortTrail(from,anchor,site){
    if(!site)return null;
    const [x,z]=site.point||[anchor.x+site.offset[0],anchor.z+site.offset[1]];
    // Search the footprint of the named site for a clear spot. Keep reroutes
    // inside this same site instead of picking an unrelated stopping point.
    for(const radius of [0,1.2,2.4,3.2])for(let i=0;i<(radius?12:1);i++){
      const px=x+Math.cos(i*Math.PI/6)*radius,pz=z+Math.sin(i*Math.PI/6)*radius;
      if(blocked(px,pz)||blocked(Math.round(px),Math.round(pz)))continue;
      const route=findPath([from.x,from.z],[px,pz],blocked);
      if(!route.length&&Math.hypot(px-from.x,pz-from.z)>.8)continue;
      const destination={x:px,y:floor(px,pz),z:pz,label:site.label,kind:'escort-destination'};
      return {path:route.length?route:[[px,pz]],destination};
    }
    return null;
  }
  function escortSite(destination,site){
    const group=new T.Group();group.name='escort-destination';group.position.set(destination.x,destination.y,destination.z);root.add(group);
    const landmark=createQuestItem({model:site.prop,name:site.label});landmark.position.set(.85,.32,0);group.add(landmark);
    box(group,'#82664a',.85,.22,0,1,.21,.74);
    if(site.prop==='medicine'||site.prop==='net')box(group,'#bfa67f',-.65,.15,.45,1.3,.21,.7);
  }
  function stopForObstacle(run){
    const obstacle=run.obstacle;
    if(!obstacle||obstacle.phase!=='ahead'||run.path.length>obstacle.remaining)return false;
    obstacle.phase='waiting';run.entry.label=obstacle.label;
    const p=run.group.position,prop=createQuestItem({model:obstacle.prop,name:obstacle.label});
    prop.position.set(p.x+Math.sin(run.group.rotation.y)*1.25,p.y,p.z+Math.cos(run.group.rotation.y)*1.25);
    prop.name='escort-obstacle';root.add(prop);obstacle.object=prop;
    return true;
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
    const event=canProgressPlot(save,id)?currentVillageEvent(save,id):null;
    const bridge=id==='nameless'&&!roomId?bridgeMission(save):null;
    const mission=fieldMission(save,event)||bridge;
    const local=mission&&(mission.bridge||(event.interior||null)===(roomId||null));
    const signalStep={water:2,lightning:0,wood:3}[id];
    const siteProgress=!roomId&&(save.story.fieldMissions?.[id+':'+signalStep]?.step||0);
    const next=JSON.stringify([id,roomId,local?mission.key:null,local?mission.step:null,bridge?.step,siteProgress]);
    if(next===key)return;
    reset();key=next;
    if(bridge)bridgeWork(bridge.step);
    if(siteProgress)showRestoredSite(id,siteProgress,save);
    if(!local||mission.complete||mission.task.target)return;
    const anchor=mission.task.origin?interactives.find(i=>i.id===mission.task.origin):mission.bridge?interactives.find(i=>i.id==='old-bridge'):eventSpot(id,event,save);
    if(anchor)spawn(mission,anchor,id);
  }
  function spawn(mission,anchor,id){
    const task=mission.task;
    const [dx,dz]=task.offset||(side&&mission.step>0?[2.1,1.4]:[0,0]);
    const point=safePoint(anchor.x+dx,anchor.z+dz)||safePoint(hero.root.position.x,hero.root.position.z);
    if(!point)return;
    const entry={kind,id:'field-'+mission.key+'-'+mission.step,label:task.label,...(mission.bridge?{bridgeQuest:true}:{}),...point};
    const group=new T.Group();group.name='field-task-'+task.mode;group.position.set(point.x,point.y,point.z);root.add(group);
    const mobile=task.mode==='escort'||task.mode==='chase';
    const escort=task.mode==='escort'?escortTrail(point,anchor,task.destination):null;
    let actor=null,represented=null;
    if(task.name){
      const nurse=mission.key==='fire:2';
      const guide=REGIONS[id].npcs.find(p=>p.id===(side?mission.giver:task.origin));
      const person=guide?{...guide,activity:null}:{id:nurse?'fire-dan':'field-actor',kind:nurse?'healer':'lore',appearance:{female:nurse,job:mission.bridge&&mission.step===1?'carpenter':'villager'}};
      actor=task.mode==='chase'?createNinja({id:'field-runner',village:id==='nameless'?'wind':id}):createVillager(villagerAppearance(id,person));
      const original=guide&&residentRoot(guide.id);
      if(original){represented={root:original,visible:original.visible};original.visible=false;}
      group.add(actor.root);actor.root.name='field-actor';if(!mobile)actor.root.position.set(1.25,0,0);
    }
    if(task.model)group.add(createQuestItem({model:task.model}));
    const ring=new T.Mesh(new T.TorusGeometry(.83,.032,6,28),new T.MeshBasicMaterial({color:0xead29b}));ring.rotation.x=Math.PI/2;ring.position.y=.14;group.add(ring);
    const path=escort?.path||(task.mode==='chase'?chaseTrail(point,anchor,task):[]);
    const end=path.at(-1),destination=escort?.destination;
    const obstacle=destination&&task.destination.obstacle?{...task.destination.obstacle,phase:'ahead',remaining:Math.max(1,Math.floor(path.length*.55)),progress:0}:null;
    if(destination)escortSite(destination,task.destination);
    else if(end){const post=createQuestItem({model:'lantern'});post.name='field-destination';post.position.set(end[0],floor(...end),end[1]);root.add(post);}
    interactives.push(entry);active={entry,mission,task,group,actor,represented,path,end,destination,obstacle,ring};
  }
  function start(entry){
    if(!active||entry!==active.entry||finished||active.task.mode==='escort'&&!active.destination)return false;
    if(started){
      if(active.obstacle?.phase!=='waiting')return false;
      active.obstacle.phase='clearing';return true;
    }
    started=true;return true;
  }
  function update(dt,time){
    if(!active||finished)return null;
    const {entry,mission,task,group,actor,path,end,destination,obstacle,ring}=active;
    const p=hero.root.position,position=group.position,distance=()=>p.distanceTo(position);
    let moving=false,complete=false;
    if(started){
      elapsed+=dt;
      if(obstacle?.phase==='clearing'){
        if(distance()<=3.3)obstacle.progress+=dt;
        if(obstacle.progress>=obstacle.seconds){
          obstacle.phase='cleared';entry.label=task.label;
          if(obstacle.object){dispose(obstacle.object);obstacle.object.removeFromParent();obstacle.object=null;}
        }
      }
      if(obstacle?.phase==='waiting'||obstacle?.phase==='clearing'){
        actor?.update(time,false,null,dt);return null;
      }
      if(task.mode==='hold'){
        active.progress=(active.progress||0)+(distance()<=3.3?dt:0);
        ring.material.color.setHex(distance()<=3.3?0x86dfb0:0xead29b);ring.scale.setScalar(1+.32*Math.min(1,active.progress/task.seconds));
        complete=active.progress>=task.seconds;
      }else if(task.mode==='interact')complete=true;
      else{
        const chase=task.mode==='chase';
        if(path.length&&(chase||distance()<5.5)&&!stopForObstacle(active)){
          let budget=dt*(chase?4.2:2.05);
          while(budget>0&&path.length){
            const [x,z]=path[0],dx=x-position.x,dz=z-position.z,d=Math.hypot(dx,dz),step=Math.min(d,budget);
            if(d>.001){position.x+=dx/d*step;position.z+=dz/d*step;position.y=floor(position.x,position.z,position.y+.45);group.rotation.y=Math.atan2(dx,dz);moving=true;}
            if(d<=step+.002)path.shift();budget-=step;
            if(stopForObstacle(active))break;
          }
          Object.assign(entry,{x:position.x,y:position.y,z:position.z});
        }
        complete=chase?(elapsed>1.25&&distance()<2.5):!!destination&&!path.length&&(!obstacle||obstacle.phase==='cleared')&&Math.hypot(p.x-destination.x,p.y-destination.y,p.z-destination.z)<4;
        if(chase&&!end&&elapsed>1&&distance()<3)complete=true;
      }
    }
    actor?.update(time,moving,null,dt);
    if(!complete)return null;
    finished=true;return {key:mission.key,step:mission.step,point:[position.x,position.z],arrival:task.destination?.arrival};
  }
  function state(){
    if(!active)return null;
    const {task,entry,end,destination,obstacle,progress}=active;
    const distance=hero.root.position.distanceTo(active.group.position);
    const obstruction=obstacle&&['waiting','clearing'].includes(obstacle.phase)?{label:obstacle.label,text:obstacle.text,clearing:obstacle.phase==='clearing',progress:obstacle.progress/obstacle.seconds}:null;
    return {mode:task.mode,started,finished,progress:task.seconds?Math.min(1,(progress||0)/task.seconds):obstruction?.clearing?obstruction.progress:null,near:distance<=3.3,waiting:task.mode==='escort'&&distance>=5.5,target:[entry.x,entry.y,entry.z],end,entry,destination,obstruction};
  }
  return {sync,start,update,reset,state};
}
