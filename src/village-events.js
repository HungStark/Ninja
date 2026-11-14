import {PLOT,canProgressPlot,invasionAvailable} from './campaign-plot.js';
import {REGIONS} from './adventure-world.js';
import {gainExperience,regionElement,GUARD_ARSENALS,encounterProfile} from './progression.js';
import {planVillageCivic} from './village-civic.js';
import {configureOpponent} from './opponent-balance.js';
import {FIRE_PRISON_SITE,FIRE_MOTHER_SITE} from './village-zoning.js';
import {botHealth} from './enemy-balance.js';
import {readCompanionHealth} from './companion-health.js';
import {WOOD_SACRED_TREE} from './sacred-tree.js';
import {endingEvent} from './phoenix-blessing.js';

export const HA_LY={id:'ha-ly',name:'Hạ Ly',role:'Nữ ninja Làng Hỏa · Bạn đồng hành',village:'fire',kind:'ninja',female:true,coat:'#922638',hair:'#28160f',hairStyle:'long'};
export const HA_LY_MOTHER={id:'fire-ha-ly-mother',name:'Bà Hồng',role:'Mẹ nuôi của Hạ Ly',kind:'healer',female:true,age:'elder',hair:'#bdb5a2',hairStyle:'bun',coat:'#7c594d',accent:'#b79e75',height:2.7,width:.94,shawl:true};
export const FIRE_PRISON=FIRE_PRISON_SITE;
export const VILLAGE_EVENTS=PLOT.villages;

export function villageEventStep(save,id){return Math.max(0,Math.min(VILLAGE_EVENTS[id]?.stages.length||0,save.story?.villageEvents?.[id]||0));}
export function villageEventComplete(save,id){return !VILLAGE_EVENTS[id]||villageEventStep(save,id)>=VILLAGE_EVENTS[id].stages.length;}
export function currentVillageEvent(save,id=save.village){const chapter=id==='nameless'&&!invasionAvailable(save)&&!save.story?.plotPreview?null:VILLAGE_EVENTS[id],step=villageEventStep(save,id),event=endingEvent(save,chapter?.stages[step]);return event?{...event,step,village:id,chapter:chapter.title,speaker:event.speaker||chapter.speaker}:null;}
export function villageEventObjective(save,id=save.village){const e=currentVillageEvent(save,id);if(id==='wood'&&e?.requiresTournament&&!(save.arena?.completedRuns>0))return {title:'Tham gia giải đấu tại trường học',description:'Hạ Ly đang tìm phương pháp chữa cây. Gặp trọng tài ở trường học để đăng ký và thi đấu tới khi vô địch hoặc bị loại, rồi gặp lại cô trong nhà trên cây.',targetVillage:id,targetKind:'arena-host',targetId:'wood-arena-host',storyStep:e.step+1,storyTotal:VILLAGE_EVENTS[id].stages.length};return e?{title:e.title,description:e.body,targetVillage:id,targetKind:'village-event',targetId:`story-${id}-${e.step}`,interior:e.interior,storyStep:e.step+1,storyTotal:VILLAGE_EVENTS[id].stages.length} : null;}
export function advanceVillageEvent(save,id,expectedStep,{choiceIndex=0,victory=false}={}){
  const e=currentVillageEvent(save,id);if(!e||!canProgressPlot(save,id,{battleResult:victory&&!!e.battle})||save.village!==id||e.step!==expectedStep)return {ok:false,reason:'stage'};
  if(e.sealTrace&&!save.story.sealCore&&!save.story.plotPreview)return {ok:false,reason:'seal-core'};
  if(e.requiresTournament&&!(save.arena?.completedRuns>0))return {ok:false,reason:'tournament',message:'Hãy hoàn thành một lượt giải đấu tại trường học trước khi gặp lại Hạ Ly.'};
  if(id==='fire'&&[2,3].includes(e.step)&&!save.story.questItems?.includes('fire:lotus-medicine'))return {ok:false,reason:'medicine',message:'Hãy mang Hồng Liên trên đỉnh Vách Tro Hồng về cho Y nữ Đan điều chế thuốc cứu Hạ Ly.'};
  if(id==='fire'&&e.step===3)save.story.questItems=save.story.questItems.filter(item=>item!=='fire:lotus-medicine');
  if(e.battle&&!victory)return {ok:false,reason:'battle'};
  if(e.choices&&!e.choices[choiceIndex]?.correct)return {ok:false,reason:'choice',message:e.choices[choiceIndex]?.feedback||'Hãy xem lại những dấu vết vừa tìm được.'};
  save.story.villageEvents??={};save.story.villageEvents[id]=e.step+1;
  if(e.recruit)save.story.companion={recruited:true,phase:'with-party',...readCompanionHealth({},save.visited)};
  if(e.separate)save.story.companion={...save.story.companion,phase:'separated'};
  if(e.reconcile)save.story.companion={...save.story.companion,recruited:true,phase:'with-party'};
  if(e.sealTrace){save.story.sealTraces??=[];const trace=id+':'+e.step;if(!save.story.sealTraces.includes(trace))save.story.sealTraces.push(trace);}
  const completed=villageEventComplete(save,id);
  if(id==='dark'&&e.step===5)save.story.phoenixRevealed=true;
  if(id==='nameless'&&completed)save.story.ending=save.story.companion?.sacrificed?'bad':'true';
  if(completed){save.gold+=45;save.xp+=40;gainExperience(save.progression,regionElement(id),40);}
  return {ok:true,completed,recruited:!!e.recruit,separated:!!e.separate,reconciled:!!e.reconcile};
}
export function eventSpot(id,event){
  if(event.interior&&event.interior!=='wood-arena')return {x:0,z:-10};
  if(event.spot==='prison'){const p=planVillageCivic(id).military.prison;return {x:p.x,z:p.z+8};}
  if(event.spot==='coast')return {x:110,z:70};
  if(id==='wood'&&event.interior==='wood-arena')return {x:-2.8,z:-3.8};
  if(id==='wood')return {...WOOD_SACRED_TREE.eventSite};
  if(id==='nameless')return {x:REGIONS.nameless.boss.x+8,z:REGIONS.nameless.boss.z+7};
  if(id==='fire'&&event.spot==='prison-gate')return {x:FIRE_PRISON.x,z:FIRE_PRISON.z+3.25};
  if(id==='fire'&&event.spot==='prison')return {x:FIRE_PRISON.x,z:FIRE_PRISON.z+.65};
  if(id==='fire'&&event.spot==='entrance')return {...FIRE_MOTHER_SITE};
  if(id==='fire'&&event.style==='medicine'){const nurse=REGIONS.fire.npcs.find(n=>n.id==='fire-dan');return {x:nurse.x,z:nurse.z};}
  if(event.spot==='entrance')return {x:2.4,z:17};
  const zones=REGIONS[id].zones.filter(z=>!z.platform&&!['summit-lotus','red-cliff'].includes(z.id)),zone=zones[(Number(event.spot)||0)%zones.length];
  // Use the district approach, already connected to the village road network.
  const distance=Math.max(6,Math.hypot(zone.x,zone.z)-Math.min(zone.radius*.7,9));const a=Math.atan2(zone.x,zone.z);
  return {x:Math.sin(a)*distance,z:Math.cos(a)*distance};
}
export function villageEventEncounter(id,step=1,save){
  const event=VILLAGE_EVENTS[id]?.stages[step];if(!event?.battle)return null;
  if(event.storyBoss){
    const family=event.guardianVillage,context=save||{story:{villageOrder:[]},visited:[]};
    const base=encounterProfile(context,'boss',family),boss=configureOpponent({...base,kind:'boss',village:family,name:event.enemy,storyBoss:true,storyBattle:event.battle,guardianVillage:family});
    return {...boss,kind:'village-event',village:id,guardianVillage:family,storyBoss:true,eventStep:step,storyBattle:event.battle,guardianName:REGIONS[family].boss.guardian};
  }
  const profile=(name,element,hp)=>({name,element,village:element,hp:botHealth(hp),spellIds:[...GUARD_ARSENALS[element]],damageMultiplier:.55,restTime:3.8,weaponInterval:4,initialDelay:2});
  let squad;
  if(event.battle==='fire-jail')squad=[profile('Nội gián Trăng Khuyết · Giữ chìa khóa','fire',100),profile('Nội gián Trăng Khuyết · Chặn đường lui','lightning',95)];
  else if(event.battle==='fire-general')squad=[profile(event.enemy,'fire',180),profile('Cận vệ quân lệnh giả','fire',110)];
  else if(event.battle==='water-base')squad=[profile('Lính canh thiết bị chakra','water',140),profile('Kẻ vận hành tinh thể ma lực','lightning',120)];
  else if(event.battle==='earth-base')squad=[profile('Đội trưởng khai thác','earth',180),profile('Kẻ vận chuyển ma thạch','dark',130)];
  else if(event.battle==='ice-coast')squad=[profile('Đội bắt linh thú Trăng Khuyết','dark',180),profile('Thuật sư phong ấn ven biển','ice',160)];
  else if(event.battle==='light-battalion')squad=[profile('Quân chiếm đóng Trăng Khuyết','light',220),profile('Cận vệ Trăng Khuyết','dark',200)];
  else if(event.battle==='dark-battalion')squad=[profile('Tinh binh Trăng Khuyết','dark',260),profile('Tinh binh khóa phong ấn','light',240),profile('Tinh binh giữ nhà ngục','ice',220)];
  else if(event.battle==='wind-eagle')return {...profile(event.enemy,'wind',260),name:event.enemy,guardianForm:'beast',storyBeast:true,eventStep:step,storyBattle:event.battle};
  else if(event.battle==='invasion-vanguard')squad=[{...profile('Chỉ huy tiên phong ngoại giới','dark',450),spellIds:['dark-orb','dark-lance','dark-domain','light-orb','fire-lance'],damageMultiplier:.85},profile('Đội tiên phong ngoại giới','light',200)];
  else squad=[profile(event.enemy,id,150)];
  return {...squad[0],village:id,name:event.enemy,...(squad.length>1?{squad}:{}),eventStep:step,storyBattle:event.battle,coalition:!!event.coalition};
}

// Flowers collected before accepting the rescue are equally usable, once only.
export function brewHongLienMedicine(save){
  if(save.expeditions.fire===3||!save.story.questItems?.includes('fire:hong-lien'))return false;
  save.story.questItems=save.story.questItems.filter(id=>id!=='fire:hong-lien');
  save.story.questItems.push('fire:lotus-medicine');save.expeditions.fire=3;return true;
}
