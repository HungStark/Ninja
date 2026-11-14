import * as T from 'three';
import {createNinja} from './ninja.js';
import {encounterAppearance} from './encounter-appearance.js';
import {encounterProfile} from './progression.js';
import {configureOpponent} from './opponent-balance.js';

export const infiltrationLimit=id=>['wind','earth'].includes(id)?4:2;
export function infiltratorEncounter(save,entry){
  const element=entry.element,guard=configureOpponent({...encounterProfile(save,'village-guard',element),kind:'village-guard',village:save.village});
  return {...guard,kind:'infiltrator',village:save.village,element,infiltrationId:entry.id,infiltrationMode:entry.mode,name:'Ninja Trăng Khuyết',forced:true};
}
export function createInfiltration({land,interactives,blocked,floor,findPath,hero}){
  const agents=new Map();let serial=0;
  function remove(id){const a=agents.get(id);if(!a)return;a.char.dispose();a.char.root.removeFromParent();for(const root of [a.cover,a.prop]){root?.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});root?.removeFromParent();}const i=interactives.indexOf(a.entry);if(i>=0)interactives.splice(i,1);agents.delete(id);}
  function spawn(x,z,element,mode='survey'){
    const char=createNinja(encounterAppearance({kind:'infiltrator',element}));char.root.name='crescent-infiltrator';char.root.position.set(x,floor(x,z),z);land.add(char.root);
    const entry={kind:'roamer',id:'crescent-infiltrator-'+(++serial),element,mode,x,y:char.root.position.y,z,label:mode==='ambush'?'Sát thủ Trăng Khuyết':mode==='tamper'?'Kẻ đang đặt phong ấn':'Kẻ đang khảo sát địa hình',revealed:mode!=='ambush'};
    let cover=null;if(mode==='ambush'){cover=new T.Mesh(new T.DodecahedronGeometry(.7),new T.MeshStandardMaterial({color:'#6c7262',roughness:1}));cover.position.set(x,entry.y+.5,z);land.add(cover);char.root.visible=false;}
    let prop=null;if(mode==='tamper'){prop=new T.Group();prop.name='crescent-suspicious-seal';prop.position.set(x,entry.y,z+1);const paper=new T.Mesh(new T.BoxGeometry(.7,.03,.8),new T.MeshStandardMaterial({color:'#c8bda3',roughness:1}));paper.position.y=.05;prop.add(paper);const ring=new T.Mesh(new T.TorusGeometry(.23,.025,5,16),new T.MeshStandardMaterial({color:'#4f284e',roughness:1}));ring.rotation.x=-Math.PI/2;ring.position.y=.08;prop.add(ring);land.add(prop);}
    const a={char,entry,cover,prop,age:0,path:[],replan:0,home:{x,z},phase:mode==='ambush'?'hidden':mode==='tamper'?'tamper':'survey'};agents.set(entry.id,a);interactives.push(entry);return char;
  }
  function update(dt,time,paused){
    let caught=null;if(paused)return null;
    for(const a of agents.values()){
      a.age+=dt;const p=a.char.root.position,d=p.distanceTo(hero.root.position);let moving=false;
      if(a.age>=90&&d>25){remove(a.entry.id);continue;}
      if(a.phase==='hidden'&&d<=10){a.phase='chasing';a.entry.revealed=true;a.entry.label='Sát thủ Trăng Khuyết';a.char.root.visible=true;if(a.cover)a.cover.visible=false;}
      if(['survey','tamper'].includes(a.phase)&&d<=4.5){a.phase='caught';caught=a.entry;}
      if(a.phase==='chasing'&&d<=1.9){a.phase='caught';caught=a.entry;}
      if(a.phase==='caught'){caught=a.entry;continue;}
      if(a.phase==='tamper'){a.char.update(time,false,null,dt);a.char.combatPose(.3+Math.sin(a.age)*.05,.15,0);continue;}
      a.replan-=dt;
      if(a.replan<=0){a.replan=a.phase==='chasing'?.55:3;const target=a.phase==='chasing'?hero.root.position:{x:a.home.x+Math.sin(a.age*.3)*3,z:a.home.z+Math.cos(a.age*.3)*3};a.path=blocked(target.x,target.z)?[]:findPath([p.x,p.z],[target.x,target.z],blocked);}
      let budget=dt*(a.phase==='chasing'?8:1.5);while(a.path.length&&budget>0){const [x,z]=a.path[0],dx=x-p.x,dz=z-p.z,length=Math.hypot(dx,dz);if(length<.05){a.path.shift();continue;}const step=Math.min(length,budget,.18),nx=p.x+dx/length*step,nz=p.z+dz/length*step,ny=floor(nx,nz);if(blocked(nx,nz)||Math.abs(ny-p.y)>.8){a.path=[];break;}p.set(nx,ny,nz);a.char.root.rotation.y=Math.atan2(dx,dz);moving=true;budget-=step;}
      a.char.update(time,moving,null,dt);if(!moving&&a.phase==='survey')a.char.root.rotation.y=Math.sin(a.age*.7)*1.5;
      Object.assign(a.entry,{x:p.x,y:p.y,z:p.z});if(a.age>=90&&d>25)remove(a.entry.id);
    }return caught;
  }
  return {spawn,update,remove,clear(){for(const id of [...agents.keys()])remove(id);},get first(){return agents.values().next().value?.char||null;},get count(){return agents.size;},characters:()=>[...agents.values()].map(a=>a.char),state:()=>[...agents.values()].map(a=>({...a.entry,phase:a.phase,age:a.age,visible:a.char.root.visible}))};
}
