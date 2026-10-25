import * as T from 'three';
import {createEncounterCreature} from './encounter-appearance.js';
import {gameAudio} from './game-audio.js';

export function createNamelessGuardianAlly(scene){
 const root=new T.Group();root.name='nameless-guardian-ally';root.visible=false;scene.add(root);let model=null,active=false,clock=0,nextBolt=2.5,nextSlam=8,nextBarrier=1.5,attacks=0,damage=0,barriers=0,action='Đang bảo vệ bạn';const bolts=[],waves=[];
 const geometry=new T.OctahedronGeometry(.28),ring=new T.RingGeometry(.9,1,40),material=new T.MeshBasicMaterial({color:'#e5dbad',transparent:true,opacity:.85,depthWrite:false,side:T.DoubleSide});
 function clear(){for(const a of [...bolts,...waves])a.mesh.removeFromParent();bolts.length=waves.length=0;}
 function strike(actor,amount,kind,onHit){if(!actor||actor.fighter.hp<=0)return;const dealt=onHit(actor,amount,kind)||0;damage+=dealt;}
 return {
  reset(enabled=false){clear();active=!!enabled;root.visible=active;clock=attacks=damage=barriers=0;nextBolt=2.5;nextSlam=8;nextBarrier=1.5;action='Đang bảo vệ bạn';if(active&&!model){model=createEncounterCreature('nameless');root.add(model.root);}root.position.set(-3.7,0,-2);root.rotation.y=Math.PI;},
  update(dt,time,actors,player,playerPosition,onHit,enabled=true,reducedMotion=false){
   if(!active)return;if(!enabled){model?.update(time,false,true);return;}clock+=dt;const living=actors.filter(a=>a.fighter.hp>0);if(!living.length)return;
   const targetX=T.MathUtils.clamp(playerPosition[0]-3.7,-4.3,4.3);root.position.x=T.MathUtils.damp(root.position.x,targetX,2,dt);model.update(time,true,reducedMotion);
   if(clock>=nextBolt){const target=living.sort((a,b)=>a.fighter.hp-b.fighter.hp)[0],mesh=new T.Mesh(geometry,material);mesh.position.copy(root.position).add(new T.Vector3(0,2.8,-1));scene.add(mesh);bolts.push({mesh,from:mesh.position.clone(),target:target.id,age:0});nextBolt=clock+4.5;attacks++;action='Hư quang · Bảo vệ đồng đội';gameAudio.tone(420,.08,'sine',.025);}
   if(clock>=nextSlam){for(const actor of living){const mesh=new T.Mesh(ring,material);mesh.rotation.x=-Math.PI/2;mesh.position.set(actor.pos[0],.08,actor.pos[2]);scene.add(mesh);waves.push({mesh,age:0});strike(actor,12,'guardian-slam',onHit);}nextSlam=clock+10;attacks++;action='Chấn địa · Sát thương diện rộng';}
   if(clock>=nextBarrier){player.shield=Math.max(player.shield,24);player.shieldTime=Math.max(player.shieldTime,5);barriers++;nextBarrier=clock+12;action='Vòng hộ mệnh · +24 lá chắn';const mesh=new T.Mesh(ring,material);mesh.rotation.x=-Math.PI/2;mesh.position.set(playerPosition[0],.1,playerPosition[2]);scene.add(mesh);waves.push({mesh,age:0});}
   for(let i=bolts.length-1;i>=0;i--){const bolt=bolts[i];bolt.age+=dt;const actor=actors.find(a=>a.id===bolt.target&&a.fighter.hp>0);if(!actor){bolt.mesh.removeFromParent();bolts.splice(i,1);continue;}bolt.mesh.position.copy(bolt.from).lerp(new T.Vector3(...actor.pos),Math.min(1,bolt.age/.7));bolt.mesh.rotation.y+=dt*5;if(bolt.age>=.7){strike(actor,22,'guardian-light',onHit);bolt.mesh.removeFromParent();bolts.splice(i,1);}}
   for(let i=waves.length-1;i>=0;i--){const wave=waves[i];wave.age+=dt;wave.mesh.scale.setScalar(1+wave.age*3);if(wave.age>.7){wave.mesh.removeFromParent();waves.splice(i,1);}}
  },
  state:()=>({active,visible:root.visible,clock,attacks,damage,barriers,projectiles:bolts.length,action,position:root.position.toArray(),name:'Vô Danh Thú'}),
  dispose(){clear();model?.dispose();geometry.dispose();ring.dispose();material.dispose();root.removeFromParent();}
 };
}
