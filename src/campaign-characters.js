import {REGIONS} from './adventure-world.js';
import {PLOT} from './campaign-plot.js';
import {currentVillageEvent,HA_LY,HA_LY_MOTHER} from './village-events.js';
import {villagerAppearance} from './villager-appearance.js';
import {ninjaProfile} from './ninja.js';
import {encounterAppearance} from './encounter-appearance.js';
import {companionSacrificed} from './phoenix-blessing.js';

// These profiles are shared by dialogue, scene actors and offline portraits.
const chiefNames={water:'Hải Châu',fire:'Xích Nham',lightning:'Chấn Thiên',dark:'Vô Nguyệt'};
export function campaignChief(id){return {id:'chief-'+id,name:chiefNames[id]||'Trưởng làng',role:id,appearance:villagerAppearance(id,{kind:'chief'}),sceneCharacter:true};}
const person=(id,name,village,kind='lore',appearance={})=>({id,name,role:village,sceneCharacter:true,appearance:villagerAppearance(village,{id,kind,appearance})});
const ninja=(id,name,village,look={},extra={})=>{
  const appearance=ninjaProfile({id,village,kind:'ninja',...look});
  return {id,name,role:village,sceneCharacter:true,appearance,portraitId:'story/ninja/'+id+'/'+appearance.id+(extra.portraitPose==='wounded'?'/wounded':''),...extra};
};
export function campaignSpeakers(save,id=save.village){
  const event=currentVillageEvent(save,id),family=event?.guardianVillage||id;
  const mother=REGIONS.nameless.npcs.find(p=>p.id==='nameless-resident-war-cemetery');
  let guide=person('story-guide-'+id,PLOT.villages[id]?.speaker||'Người làm chứng',id,'lore',
    id==='wood'?{female:true,job:'healer',hairStyle:'bun'}:id==='ice'?{female:true,hairStyle:'braid'}:id==='dark'?{female:true,hairStyle:'long',hat:'hood'}:{});
  if(id==='earth')guide={...guide,appearance:villagerAppearance(id,REGIONS.earth.npcs.find(p=>p.id==='earth-son'))};
  if(id==='nameless')guide={...HA_LY,appearance:ninjaProfile(HA_LY),sceneCharacter:true};
  const commanderLook=encounterAppearance(event?.storyBoss?{kind:'boss',village:family}:{kind:'village-event',village:id,element:id});
  const traitorFamily=event?.guardianVillage||'ice';
  return {
    chief:campaignChief(id),guide,
    haly:{...HA_LY,appearance:ninjaProfile(HA_LY),sceneCharacter:true},
    mother:{id:mother.id,name:mother.name,role:mother.role,appearance:villagerAppearance('nameless',mother),sceneCharacter:true},
    adoptiveMother:{...HA_LY_MOTHER,appearance:{...villagerAppearance('fire',HA_LY_MOTHER),...HA_LY_MOTHER},sceneCharacter:true},
    commander:ninja('crescent-commander-'+family,event?.enemy||'Phó đoàn Trăng Khuyết',family,commanderLook,{faction:'crescent'}),
    captor:ninja('crescent-captor','Nội gián Trăng Khuyết','fire',encounterAppearance({kind:'infiltrator',element:'fire'}),{faction:'crescent'}),
    traitor:ninja('crescent-traitor-'+traitorFamily,event?.storyBoss?event.enemy:'Kẻ phản bội Làng Băng',traitorFamily,encounterAppearance({kind:'boss',village:traitorFamily}),{faction:'crescent'}),
    gatekeeper:ninja('crescent-gatekeeper','Thủ lĩnh Trăng Khuyết','dark',encounterAppearance({kind:'boss',village:'dark'}),{faction:'crescent',portraitPose:id==='dark'&&event?.step===8?'wounded':'standing'}),
    mage:person('story-refugee-mage','Thiếu nữ bên kia cánh cổng','ice','healer',{female:true,hairStyle:'long',coat:'#6485ad'}),
    child:person('story-ice-child','Đứa trẻ được cứu','ice','lore',{height:1.8,width:.72,hairStyle:'short'}),
    traveler:{...person('story-ice-traveler','Người lữ hành bị thương','ice'),portraitPose:'wounded'},
    miner:person('story-earth-miner','Thợ mỏ được cứu','earth','lore',{job:'miner',hat:'helmet'}),
    beast:{id:'nameless-beast',name:'Vô Danh Thú',role:'Linh thú giữ phong ấn',appearance:{kind:'creature',id:'nameless'}},
    unknown:ninja('plot-unknown','Kẻ bí ẩn','dark',{coat:'#28212f'},{sceneCharacter:false}),
    illusion:ninja('plot-illusion','Ảo ảnh trong gương','dark',{}, {sceneCharacter:false}),
    water:campaignChief('water'),fire:campaignChief('fire'),lightning:campaignChief('lightning')
  };
}
export function defaultCampaignSpeaker(save,id=save.village,event=currentVillageEvent(save,id)){
  const cast=campaignSpeakers(save,id);
  if(id==='nameless'&&companionSacrificed(save))return {id:'hero',name:'Suy nghĩ nội tâm',thought:true};
  if(event?.speakerId===HA_LY_MOTHER.id)return cast.adoptiveMother;
  if(event?.storyBoss)return event.guardianVillage==='dark'?cast.gatekeeper:event.guardianVillage==='ice'||event.guardianVillage==='wood'?cast.traitor:cast.commander;
  if(event?.interior?.includes('council')&&event.style==='letter')return cast.chief;
  return id==='fire'?cast.haly:cast.guide;
}
export function campaignSceneCast(save,id=save.village,event=currentVillageEvent(save,id)){
  if(!event)return [];
  const cast=campaignSpeakers(save,id),speakers=(event.script||[]).map(([key])=>cast[key]).filter(s=>s?.sceneCharacter);
  if(!event.script)speakers.push(defaultCampaignSpeaker(save,id,event));
  if(id==='wood')speakers.push(cast.guide);
  if(id==='ice'&&event.step>=1&&event.step<=4)speakers.push(cast.mage,cast.child,cast.traveler);
  if(id==='earth'&&event.step===1)speakers.push(cast.miner);
  if(event.rally)for(const region of ['water','fire','lightning','wind','earth','wood','ice','light','dark'])speakers.push(campaignChief(region));
  return [...new Map(speakers.filter(s=>s.id!==HA_LY.id||!companionSacrificed(save)).map(s=>[s.id,s])).values()];
}
