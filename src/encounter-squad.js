import * as T from 'three';
import {createNinja} from './ninja.js';
import {encounterAppearance} from './encounter-appearance.js';
import {createEnemyMovement} from './enemy-movement.js';
import {createDashAura} from './dash-aura.js';

export function createEncounterSquad(scene,{GameRules,Fighter,keys,launch,throwWeapon,getPlayer,getShots,random}){
  const members=[];
  function reset(){for(const m of members){m.rig.root.removeFromParent();m.rig.dispose();m.aura.dispose();}members.length=0;}
  const pos=m=>[m.rig.root.position.x,m.rig.root.position.y+1.72,m.rig.root.position.z];
  return {reset,
    start(profiles,spawn){reset();profiles.slice(1).forEach((profile,i)=>{
      const rig=createNinja(encounterAppearance({kind:'intro-trio',...profile})),fighter=new Fighter(profile.hp);fighter.autoRestore=false;
      rig.root.position.copy(spawn).add(new T.Vector3(i===0?-3.8:3.8,0,1.8));scene.add(rig.root);
      const movement=createEnemyMovement(random);movement.reset(rig.root.position.x);
      members.push({id:'squad-'+(i+1),profile,rig,fighter,rules:new GameRules(profile.spellIds),movement,aura:createDashAura(scene),timer:profile.initialDelay,spell:null,step:0,pose:-1,casts:0,moving:false,castAge:99,trace:[],traceCast:false,weaponTimer:5+i*1.5});
    });},
    actors(){return members.map(m=>({id:m.id,owner:'enemy',pos:pos(m),height:m.rig.height,fighter:m.fighter,dir:direction(pos(m),getPlayer())}));},
    fighter(id){return members.find(m=>m.id===id)?.fighter;},
    position(id){const m=members.find(m=>m.id===id);return m&&pos(m);},
    update(dt,time,enabled=true,reducedMotion=false){
      for(const m of members){
        const alive=m.fighter.hp>0;m.castAge+=dt;
        if(enabled&&alive){
          m.fighter.tick(dt);m.rules.tick(dt);m.weaponTimer-=dt;
          const old=pos(m),next=m.movement.update(dt,{position:old,shots:getShots(),beginner:true,casting:!!m.spell,blocked:m.fighter.controlTime>0});m.rig.root.position.x=next[0];m.moving=Math.abs(next[0]-old[0])>.0001;
          if(m.fighter.controlTime<=0){
            if(m.weaponTimer<=0&&!m.spell){const result=m.rules.throwShuriken();if(result.ok)throwWeapon(m,result.weapon,pos(m),direction(pos(m),getPlayer()));m.weaponTimer=m.profile.weaponInterval;}
            m.timer-=dt;
            if(m.timer<=0){
              if(!m.spell){m.spell=m.rules.spells.find(s=>m.rules.remaining(s.id)<=0&&s.cost<=m.rules.chakra);m.step=0;m.rules.clear();if(!m.spell)m.timer=.5;}
              if(m.spell&&m.step<m.spell.sequence.length){const key=m.spell.sequence[m.step++];m.rules.seal(key);m.trace=[...m.rules.sequence];m.traceCast=false;m.pose=keys.indexOf(key);m.timer=m.profile.sealDelay;}
              else if(m.spell){const result=m.rules.cast();if(result.ok){launch(m,result.spell,pos(m),direction(pos(m),getPlayer()));m.trace=[...m.spell.sequence];m.traceCast=true;m.casts++;m.castAge=0;}m.spell=null;m.pose=-1;m.timer=m.profile.restTime;}
            }
          }
        }
        m.aura.update(enabled?dt:0,m.rig.root.position.toArray(),alive&&m.movement.state().dashBoost.dashing>0,reducedMotion);
        m.rig.update(time,alive&&m.moving,{x:m.movement.state().velocity,z:0},dt);
        if(!alive){m.rig.root.rotation.z=T.MathUtils.damp(m.rig.root.rotation.z,-1.45,4,dt);m.rig.root.position.y=T.MathUtils.damp(m.rig.root.position.y,-.6,4,dt);}
        else if(m.pose>=0&&!reducedMotion){m.rig.arms.forEach((a,i)=>{a.pivot.rotation.x=-1.1;a.pivot.rotation.z=(i?1:-1)*.35;});}
      }
    },
    state:()=>members.map(m=>({id:m.id,name:m.profile.name,element:m.profile.element,hp:m.fighter.hp,maxHp:m.fighter.maxHp,position:pos(m),height:m.rig.height,visible:m.rig.root.visible,chakra:m.rules.chakra,spellIds:[...m.profile.spellIds],casts:m.casts,pose:m.pose,sequence:[...m.rules.sequence],sealTrace:[...m.trace],traceCast:m.traceCast,movement:m.movement.state()}))
  };
}
function direction(a,b){const d=b.map((v,i)=>v-a[i]),n=Math.hypot(...d)||1;return d.map(v=>v/n);}
