import * as T from 'three';
import {createNinja} from './ninja.js';
import {HA_LY} from './village-events.js';
import {COMPANION_BASE_HP} from './companion-health.js';

// Hạ Ly acts independently: modest support damage and one emergency rescue per battle.
export function createCampaignAlly(scene){
  const root=new T.Group();root.name='ha-ly-combat-ally';root.visible=false;scene.add(root);
  let model=null,active=false,cooldown=2.5,attack=0,rescued=false,hits=0,fighter=null,onHealth=()=>{},lastHp=0;
  const notify=()=>{if(fighter&&fighter.hp!==lastHp){lastHp=fighter.hp;onHealth(fighter.hp);}};
  const actor=()=>active&&fighter?.hp>0?{id:'ha-ly',owner:'player',untargetable:true,pos:[root.position.x,root.position.y+1.72,root.position.z],height:model?.height||3,hitboxScale:1,fighter}:null;
  return {
    reset(enabled=false,health={},changed=()=>{},position=[0,1.72,7]){active=!!enabled;root.visible=active;cooldown=2.5;attack=0;rescued=false;hits=0;onHealth=changed;fighter=new globalThis.SealGameCore.Fighter(health.maxHp||COMPANION_BASE_HP);fighter.autoRestore=false;fighter.hp=Math.max(0,Math.min(fighter.maxHp,health.hp??fighter.maxHp));lastHp=fighter.hp;root.position.set(position[0]+1.8,position[1]-1.72,position[2]+.8);root.rotation.set(0,0,0);if(active&&!model){model=createNinja(HA_LY);root.add(model.root);model.setCombatMode(true);}model?.setStoryPose(fighter.hp>0?'standing':'unconscious');if(active&&fighter.hp===0){root.rotation.z=-Math.PI/2;root.position.y+=.35;}},
    update(dt,time,actors,player,position,onHit,enabled=true){
      if(!active||!model)return;root.visible=true;fighter.tick(dt);notify();if(fighter.hp<=0){root.rotation.z=-Math.PI/2;root.position.y=position[1]-1.72+.35;model.setStoryPose('unconscious');model.update(time,false,null,dt);return;}if(!enabled||player.hp<=0)return;
      root.position.set(position[0]+1.8,position[1]-1.72,position[2]+.8);cooldown-=dt;attack=Math.max(0,attack-dt);
      const target=actors.filter(a=>a.fighter.hp>0).sort((a,b)=>Math.hypot(a.pos[0]-position[0],a.pos[2]-position[2])-Math.hypot(b.pos[0]-position[0],b.pos[2]-position[2]))[0];
      if(target){root.rotation.y=Math.atan2(target.pos[0]-root.position.x,target.pos[2]-root.position.z);if(cooldown<=0&&fighter.controlTime<=0){onHit(target,6);hits++;attack=.35;cooldown=3;}}
      if(!rescued&&player.hp>0&&player.hp<=player.maxHp*.25&&fighter.controlTime<=0){rescued=true;player.shield=Math.max(player.shield,player.maxHp*.15);player.shieldTime=Math.max(player.shieldTime,4);player.invulnerableTime=Math.max(player.invulnerableTime,.6);}
      model.update(time,false,null,dt);model.combatPose(attack/.35,rescued&&player.shieldTime>0?.35:0);
    },
    root,actor,record:notify,
    state:()=>({active,visible:root.visible,rescued,hits,hp:fighter?.hp??0,maxHp:fighter?.maxHp??COMPANION_BASE_HP,unconscious:active&&fighter?.hp===0,position:root.position.toArray()}),
    dispose(){model?.dispose();root.removeFromParent();}
  };
}
