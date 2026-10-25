import * as T from 'three';
import {createEncounterCreature} from './encounter-appearance.js';
import {createGuardianPhases} from './guardian-phases.js';

// The village ally uses the same three basic arts as every enemy guardian.
export function createNamelessGuardianAlly(scene){
 const root=new T.Group();root.name='nameless-guardian-ally';root.visible=false;scene.add(root);
 const arts=createGuardianPhases(scene),fighter={hp:1,maxHp:1},home=new T.Vector3(-3.7,0,-2);
 let model=null,active=false,clock=0,damage=0,targetId=null;
 return {
  reset(enabled=false){active=!!enabled;root.visible=active;clock=damage=0;targetId=null;home.set(-3.7,0,-2);if(active&&!model){model=createEncounterCreature('nameless');root.add(model.root);}model?.setArtPose();root.position.copy(home);root.rotation.set(0,Math.PI,0);arts.reset(active?{village:'nameless',element:'wind',hp:100,basicOnly:true,facing:-1}:null,fighter);},
  update(dt,time,actors,player,playerPosition,onHit,enabled=true,reducedMotion=false){
   if(!active)return;if(!enabled){model?.update(time,false,true);return;}
   clock+=dt;const living=actors.filter(a=>a.fighter.hp>0);if(!living.length){arts.reset();return;}
   const current=arts.state();
   if(!current.action){home.x=T.MathUtils.damp(home.x,T.MathUtils.clamp(playerPosition[0]-3.7,-4.3,4.3),2,dt);targetId=living.reduce((a,b)=>a.fighter.hp<b.fighter.hp?a:b).id;}
   const target=living.find(a=>a.id===targetId),position=target?.pos||[100,1.72,-13];
   arts.update(dt,fighter,position,[home.x,model.height*.55,home.z],(shot,impactPosition)=>{
    if(shot.style==='guardian-slam'){
     // All actors inside the snapshotted landing area take the same impact.
     for(const actor of living)if(Math.hypot(actor.pos[0]-impactPosition[0],actor.pos[2]-impactPosition[2])<3.5)damage+=onHit(actor,12,'guardian-slam')||0;
    }else if(target)damage+=onHit(target,shot.damage,'guardian-light')||0;
   },{mouthPosition:p=>model.mouthPosition(p).toArray()});
   const state=arts.state(),offset=arts.offset;root.position.set(home.x+offset.x,offset.y,home.z+offset.z);root.rotation.x=offset.lean;
   model.setArtPose(offset);
   model.update(time,state.action?.type==='slam',reducedMotion);
  },
  state(){const s=arts.state();return {active,visible:root.visible,clock,attacks:s.attacks,damage,barriers:0,projectiles:s.action?.stage==='firing'?1:0,action:s.signature||'Đang bảo vệ bạn',cast:s.action,armor:0,shieldVisible:false,cracks:s.cracks,position:root.position.toArray(),history:s.history,name:'Vô Danh Thú'};},
  dispose(){arts.dispose();model?.dispose();root.removeFromParent();}
 };
}
