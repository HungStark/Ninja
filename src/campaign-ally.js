import * as T from 'three';
import {createNinja} from './ninja.js';
import {HA_LY} from './village-events.js';

// Hạ Ly acts independently: modest support damage and one emergency rescue per battle.
export function createCampaignAlly(scene){
  const root=new T.Group();root.name='ha-ly-combat-ally';root.visible=false;scene.add(root);
  let model=null,active=false,cooldown=2.5,attack=0,rescued=false,hits=0;
  return {
    reset(enabled=false){active=!!enabled;root.visible=active;cooldown=2.5;attack=0;rescued=false;hits=0;if(active&&!model){model=createNinja(HA_LY);root.add(model.root);model.setCombatMode(true);}},
    update(dt,time,actors,player,position,onHit,enabled=true){
      if(!active||!model)return;root.visible=player.hp>0;if(!enabled||player.hp<=0)return;
      root.position.set(position[0]+1.8,position[1]-1.72,position[2]+.8);cooldown-=dt;attack=Math.max(0,attack-dt);
      const target=actors.filter(a=>a.fighter.hp>0).sort((a,b)=>Math.hypot(a.pos[0]-position[0],a.pos[2]-position[2])-Math.hypot(b.pos[0]-position[0],b.pos[2]-position[2]))[0];
      if(target){root.rotation.y=Math.atan2(target.pos[0]-root.position.x,target.pos[2]-root.position.z);if(cooldown<=0){onHit(target,6);hits++;attack=.35;cooldown=3;}}
      if(!rescued&&player.hp>0&&player.hp<=player.maxHp*.25){rescued=true;player.shield=Math.max(player.shield,player.maxHp*.15);player.shieldTime=Math.max(player.shieldTime,4);player.invulnerableTime=Math.max(player.invulnerableTime,.6);}
      model.update(time,false,null,dt);model.combatPose(attack/.35,rescued&&player.shieldTime>0?.35:0);
    },
    state:()=>({active,visible:root.visible,rescued,hits,position:root.position.toArray()}),
    dispose(){model?.dispose();root.removeFromParent();}
  };
}
