import * as T from 'three';
import {createNinja} from './ninja.js';
import {HA_LY} from './village-events.js';
import {COMPANION_BASE_HP} from './companion-health.js';

// Hạ Ly acts independently: modest support damage and one emergency rescue per battle.
export function createCampaignAlly(scene){
  const root=new T.Group();root.name='ha-ly-combat-ally';root.visible=false;scene.add(root);
  let model=null,active=false,cooldown=2.5,attack=0,rescued=false,hits=0,fighter=null,onHealth=()=>{},lastHp=0,sacrificed=false,phoenixAge=4;
  const phoenix=new T.Group();phoenix.name='ha-ly-phoenix-sacrifice';phoenix.visible=false;scene.add(phoenix);
  const emberGeometry=new T.OctahedronGeometry(.1),emberMaterial=new T.MeshBasicMaterial({color:'#ffc86a',transparent:true,depthWrite:false});
  for(let i=0;i<48;i++){const m=new T.Mesh(emberGeometry,emberMaterial);m.userData.index=i;phoenix.add(m);}
  const notify=()=>{if(fighter&&fighter.hp!==lastHp){lastHp=fighter.hp;onHealth(fighter.hp);}};
  const actor=()=>active&&fighter?.hp>0?{id:'ha-ly',owner:'player',untargetable:true,pos:[root.position.x,root.position.y+1.72,root.position.z],height:model?.height||3,hitboxScale:1,fighter}:null;
  return {
    reset(enabled=false,health={},changed=()=>{},position=[0,1.72,7]){sacrificed=!!health.sacrificed;phoenixAge=4;phoenix.visible=false;root.scale.setScalar(1);active=!!enabled&&!sacrificed;root.visible=active;cooldown=2.5;attack=0;rescued=false;hits=0;onHealth=changed;fighter=new globalThis.SealGameCore.Fighter(health.maxHp||COMPANION_BASE_HP);fighter.autoRestore=false;fighter.hp=Math.max(0,Math.min(fighter.maxHp,health.hp??fighter.maxHp));lastHp=fighter.hp;root.position.set(position[0]+1.8,position[1]-1.72,position[2]+.8);root.rotation.set(0,0,0);if(active&&!model){model=createNinja(HA_LY);root.add(model.root);model.setCombatMode(true);}model?.setStoryPose(fighter.hp>0?'standing':'unconscious');if(active&&fighter.hp===0){root.rotation.z=-Math.PI/2;root.position.y+=.35;}},
    update(dt,time,actors,player,position,onHit,enabled=true){
      if(phoenixAge<3){phoenixAge+=dt;phoenix.visible=phoenixAge<3;emberMaterial.opacity=Math.max(0,1-phoenixAge/3);for(const m of phoenix.children){const i=m.userData.index,side=i%2?1:-1,t=i/48;m.position.set(side*(.4+t*3+phoenixAge*.5),.5+Math.sin(t*Math.PI)*2.5+phoenixAge*1.5,Math.sin(i*2.4+phoenixAge)*.6);}root.scale.setScalar(Math.max(0,1-phoenixAge*1.8));root.visible=phoenixAge<.55;}
      if(!active||!model)return;root.visible=true;fighter.tick(dt);notify();if(fighter.hp<=0){root.rotation.z=-Math.PI/2;root.position.y=position[1]-1.72+.35;model.setStoryPose('unconscious');model.update(time,false,null,dt);return;}if(!enabled||player.hp<=0)return;
      root.position.set(position[0]+1.8,position[1]-1.72,position[2]+.8);cooldown-=dt;attack=Math.max(0,attack-dt);
      const target=actors.filter(a=>a.fighter.hp>0).sort((a,b)=>Math.hypot(a.pos[0]-position[0],a.pos[2]-position[2])-Math.hypot(b.pos[0]-position[0],b.pos[2]-position[2]))[0];
      if(target){root.rotation.y=Math.atan2(target.pos[0]-root.position.x,target.pos[2]-root.position.z);if(cooldown<=0&&fighter.controlTime<=0){onHit(target,6);hits++;attack=.35;cooldown=3;}}
      if(!rescued&&player.hp>0&&player.hp<=player.maxHp*.25&&fighter.controlTime<=0){rescued=true;player.shield=Math.max(player.shield,player.maxHp*.15);player.shieldTime=Math.max(player.shieldTime,4);player.invulnerableTime=Math.max(player.invulnerableTime,.6);}
      model.update(time,false,null,dt);model.combatPose(attack/.35,rescued&&player.shieldTime>0?.35:0);
    },
    sacrifice(){active=false;sacrificed=true;fighter.hp=0;phoenixAge=0;phoenix.position.copy(root.position);phoenix.visible=true;model?.setStoryPose('standing');root.rotation.z=0;},
    root,actor,record:notify,
    state:()=>({active,visible:root.visible,rescued,hits,sacrificed,phoenixVisible:phoenix.visible,hp:fighter?.hp??0,maxHp:fighter?.maxHp??COMPANION_BASE_HP,unconscious:active&&fighter?.hp===0,position:root.position.toArray()}),
    dispose(){model?.dispose();root.removeFromParent();phoenix.removeFromParent();emberGeometry.dispose();emberMaterial.dispose();}
  };
}
