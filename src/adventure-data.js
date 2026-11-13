import {PLOT,WAR_VILLAGES,ALLIANCE_VILLAGES,PLOT_ORDER,plotVillageComplete,nextPlotVillage,canProgressPlot,invasionAvailable} from './campaign-plot.js';
import {companionUnconscious} from './companion-health.js';
import {restoreCheckpoint,readCheckpoint} from './checkpoint-state.js';
import {isEarthDepartureTrial,earthDepartureTrialPending,EARTH_DEPARTURE_TRIAL} from './earth-departure-trial.js';
import {storeTreaty} from './peace-treaties.js';
import {confrontationObjective,guardianOrdered,nextGuardianGuard} from './village-confrontation.js';
import {newFlask,readFlask} from './healing-flask.js';
import {JOURNEY_ORDER,ATLAS_LAYOUT} from './village-travel.js';
import {newTournament,readTournament,resolveTournamentMatch} from './wood-tournament.js';
import {awardTournamentEquipment} from './equipment.js';
import {readMines} from './spirit-mines.js';
import {readInterior,INTERIORS} from './adventure-interiors.js';
import {combatExperienceRewards} from './combat-experience.js';
import {villageEventObjective,villageEventComplete,advanceVillageEvent} from './village-events.js';
import {newStory,readStory,HOME,openingObjective,FIRST_VILLAGES,completeSidequestTarget,villageSidequests,INTRO_SQUAD} from './journey-story.js';
import {newEquipment,readEquipment} from './equipment.js';
import {WORLD_LIMIT,REGIONS,STARTER_SPELLS,ALL_ADVENTURE_SPELLS,regionMetrics} from './adventure-world.js';
import {newProgression,readProgression,regionElement,gainExperience,systemLevel,learnFromBook,canLearn,addBooks,spellElement} from './progression.js';
export {STARTER_SPELLS,MENTOR_SPELLS} from './adventure-world.js';

// The atlas is also the source of truth for walking between village maps.
export const VILLAGES = [
  {id:'fire',name:'Làng Hỏa',glyph:'火',element:'fire',color:'#e47646',ground:'#635344',path:'#b19474',roof:'#813b32',sky:'#797f89',tree:'#ac593b',title:'Tro tàn dưới cổng đỏ',desc:'Mái ngói đỏ, đá núi lửa và những rặng phong giữa thung lũng khói.'},
  {id:'water',name:'Làng Thủy',glyph:'水',element:'water',color:'#62c5de',ground:'#506f73',path:'#a9b5a3',roof:'#365c76',sky:'#91bdce',tree:'#6b9c9b',title:'Bến sương và thủy lộ',desc:'Nhà sàn xanh lam, hồ nước lặng và những bến đá chìm trong sương.'},
  {id:'lightning',name:'Làng Lôi',glyph:'雷',element:'lightning',color:'#bc9beb',ground:'#615c75',path:'#9995a3',roof:'#594070',sky:'#77768e',tree:'#79709c',title:'Lôi đài trên cao nguyên',desc:'Tháp dẫn sét, tinh thạch tím và vách đá trên cao nguyên giông.'},
  {id:'nameless',name:'Làng Vô Danh',glyph:'◉',element:'wind',color:'#dfc58c',ground:'#78765a',path:'#8e8064',roof:'#655b43',sky:'#a5ada5',tree:'#797a53',title:'Nơi bước chân bắt đầu',desc:'Những mái tranh rách, đường đất mòn và bia mộ vô danh còn lưu dấu chiến tranh giữa Thủy, Hỏa và Lôi.'},
  {id:'earth',name:'Làng Thổ',glyph:'土',element:'earth',color:'#d7ae72',ground:'#8b7051',path:'#c9aa7a',roof:'#6c4c38',sky:'#c2ad8e',tree:'#8b8153',title:'Thành đá giữa hẻm núi',desc:'Bậc đá sa thạch, nhà đất và những khối núi dựng đứng bảo vệ làng.'},
  {id:'wind',name:'Làng Phong',glyph:'風',element:'wind',color:'#91d0b0',ground:'#69876a',path:'#bec4a0',roof:'#426d62',sky:'#a7ccc6',tree:'#72996c',title:'Đồng cỏ kể chuyện gió',desc:'Guồng gió, đồng cỏ rộng và những dải cờ bạc màu trên đồi.'},
  {id:'light',name:'Làng Quang',glyph:'☀',element:'light',color:'#f4d57e',ground:'#a69a6a',path:'#ddd1a4',roof:'#9f8044',sky:'#d5ceb0',tree:'#b7ae70',title:'Thánh điện của bình minh',desc:'Đá trắng, tháp mặt trời và những cột pha lê hứng ánh sáng vàng.'},
  {id:'ice',name:'Làng Băng',glyph:'❄',element:'ice',color:'#a9dcec',ground:'#a4b9b9',path:'#d3dcd4',roof:'#506c82',sky:'#bacfd8',tree:'#7c9d9f',title:'Dấu chân trên tuyết cũ',desc:'Tùng phủ tuyết, mái nhà dốc và tinh thể băng giữa sườn núi lạnh.'},
  {id:'wood',name:'Làng Mộc',glyph:'木',element:'wood',color:'#a6c97d',ground:'#49634b',path:'#9a9970',roof:'#455c3c',sky:'#7f9c88',tree:'#497449',title:'Lời thề dưới cổ thụ',desc:'Nhà gỗ, rễ cây cổ thụ và rừng sâu với ánh đom đóm xanh.'},
  {id:'dark',name:'Làng Ám',glyph:'☾',element:'dark',color:'#b7a0d6',ground:'#494858',path:'#858394',roof:'#383346',sky:'#555469',tree:'#61536e',title:'Đèn lồng bên kia màn sương',desc:'Rừng tím, đèn lồng lạnh và đền cổ ẩn dưới bầu trời hoàng hôn.'}
];
for(const v of VILLAGES)Object.assign(v,ATLAS_LAYOUT[v.id]);
VILLAGES.sort((a,b)=>['nameless',...JOURNEY_ORDER].indexOf(a.id)-['nameless',...JOURNEY_ORDER].indexOf(b.id));
export const village = id => VILLAGES.find(v=>v.id===id);
export const QUESTS={
  nameless:{title:'Ngọn ấn bên cầu cổ',enemy:'Kẻ Phá Cầu',x:-34,z:-25,location:'Cầu Đá Vọng Âm',story:'Một kẻ lạ đang lấy đá ấn khỏi Cầu Đá Vọng Âm, cắt đường những người hái trà trở về. Hãy theo đường tây lên cầu và ngăn hắn lại.'},
  fire:{title:'Than hồng của người thợ',enemy:'Nhẫn giả Tro Đỏ',x:-33,z:18,location:'Phố Lò Rèn',story:'Tro Đỏ cướp than hỏa ấn của các lò rèn phía tây. Trả lại ngọn lửa cho thợ trước khi vũ khí của cả làng hóa lạnh.'},
  water:{title:'Lời thề bên bến nước',enemy:'Thủy tặc Sương Mù',x:29,z:18,location:'Chợ Nổi Bạch Liên',story:'Thủy tặc đã chặn những thuyền thuốc ở Chợ Nổi Bạch Liên, phía đông làng. Mở lại bến để dược liệu tới được người bệnh.'},
  lightning:{title:'Nhịp sáng của cao nguyên',enemy:'Kẻ Trộm Tử Tinh',x:31,z:24,location:'Rừng Tử Tinh',story:'Một kẻ trộm giấu lôi thạch giữa Rừng Tử Tinh phía đông nam. Hãy lấy lại nó trước khi những ngọn đèn tiếp lôi tắt.'},
  earth:{title:'Đoàn thợ dưới lòng núi',enemy:'Thổ nhẫn Lưu Vong',x:32,z:23,location:'Mỏ Hoàng Thạch',story:'Thổ nhẫn lưu vong đã chiếm Mỏ Hoàng Thạch ở sườn núi phía đông. Đánh bại hắn để đưa đoàn thợ đang mắc kẹt trở về.'},
  wind:{title:'Cánh diều đứt dây',enemy:'Du nhẫn Cuồng Phong',x:31,z:24,location:'Đồng Diều Lục Sắc',story:'Cuồng Phong chém đứt những dây diều dẫn gió của làng. Tìm hắn giữa Đồng Diều Lục Sắc, nơi những đứa trẻ không còn dám chơi.'},
  light:{title:'Bình minh trong gương vỡ',enemy:'Kẻ Giữ Kính Vỡ',x:30,z:23,location:'Vườn Lăng Kính',story:'Những mảnh gương bị đánh cắp đang hút hết màu sắc của Vườn Lăng Kính. Hãy tới khu vườn phía đông và phá vòng vây của kẻ giữ kính.'},
  ice:{title:'Dấu chân trên hồ băng',enemy:'Băng nhẫn Vô Thanh',x:31,z:22,location:'Hồ Gương Băng',story:'Vô Thanh chặn đoàn lữ hành trên Hồ Gương Băng. Theo những dấu chân về phía đông, giải thoát họ trước khi cơn tuyết mới xóa hết lối về.'},
  wood:{title:'Lời khẩn của vườn thuốc',enemy:'Kẻ Săn Mộc Ấn',x:31,z:23,location:'Vườn Dược Linh Chi',story:'Kẻ săn Mộc Ấn đang hút sinh lực của Vườn Dược Linh Chi phía đông. Ngăn hắn để những cây thuốc có thể cứu dân làng.'},
  dark:{title:'Ngọn đèn cho người trở về',enemy:'Ảnh nhẫn Không Tên',x:-32,z:23,location:'Phố Đèn Lồng Tím',story:'Ảnh nhẫn Không Tên lần lượt dập đèn ở Phố Đèn Lồng Tím phía tây. Hãy giữ những ngọn đèn còn lại để khách đi muộn tìm được đường về.'}
};
for(const id of ['water','fire','lightning','wind','earth','ice','wood','light','dark']){QUESTS[id].x*=2;QUESTS[id].z*=2;}QUESTS.water.x=82;QUESTS.water.z=38;
export const CAMPAIGN_REGIONS=Object.freeze(['wind','earth','wood','ice','light']);
const treatyDelivered=(save,id)=>save.campaign?.deliveries?.includes(id)===true;
export function campaignStage(save) {
  if(save.story?.stage!=='infiltrate')return 'opening';
  if(!plotVillageComplete(save,'water'))return 'water';
  if(!WAR_VILLAGES.every(id=>plotVillageComplete(save,id)))return 'fire-lightning';
  if(!save.campaign?.treatySigned)return 'treaty';
  if(!save.story.homecomingDone)return 'homecoming';
  if(!ALLIANCE_VILLAGES.slice(0,-1).every(id=>plotVillageComplete(save,id)))return 'envoy';
  if(!plotVillageComplete(save,'dark'))return 'dark';
  return villageEventComplete(save,'nameless')?'complete':'invasion';
}
export function canTravel(save,target) {
  if(!village(target))return {allowed:false,reason:'Miền đất này không tồn tại trên địa đồ.'};
  if(target==='nameless'||target===save.village)return {allowed:true,reason:''};
  if(save.story?.stage!=='infiltrate')return {allowed:false,reason:'Gặp mẹ, học thuật từ trưởng làng, giải cứu hộ vệ rồi trở về báo cáo trước khi rời quê nhà.'};
  // Previously visited regions stay reachable so a migrated save can return to its next investigation.
  if(save.visited?.includes(target))return {allowed:true,reason:''};
  const index=PLOT_ORDER.indexOf(target),previous=PLOT_ORDER.slice(0,index).find(id=>!plotVillageComplete(save,id));
  if(index>PLOT_ORDER.indexOf('earth')&&earthDepartureTrialPending(save)&&villageEventComplete(save,'earth'))return {allowed:false,reason:'Vượt qua thử thách của trưởng làng Thổ và Sơn Quy trước khi ra khơi tới các đảo.'};
  if(previous)return {allowed:false,reason:'Hoàn thành câu chuyện tại '+village(previous).name+' trước khi tới '+village(target).name+'.'};
  if(!WAR_VILLAGES.includes(target)&&(!save.campaign?.treatySigned||!save.story.homecomingDone))return {allowed:false,reason:'Trở về Vô Danh ký đình chiến và gặp mẹ trước khi tiếp tục điều tra.'};
  return {allowed:true,reason:''};
}
export function canSignTreaty(save){return !companionUnconscious(save)&&save.village==='nameless'&&!save.campaign?.treatySigned&&WAR_VILLAGES.every(id=>plotVillageComplete(save,id));}
export function signTreaty(save,document){if(!canSignTreaty(save))return false;if(document&&!storeTreaty(save,'nameless',document))return false;save.campaign??={deliveries:[]};save.campaign.treatySigned=true;save.campaign.deliveries??=[];return true;}
export function deliverTreaty(save,id){
  // Copies can still be handed to envoys; alliance progress comes from each region's actual mission.
  if(!save.campaign?.treatySigned||save.village!==id||!CAMPAIGN_REGIONS.includes(id)||treatyDelivered(save,id))return false;
  save.campaign.deliveries??=[];save.campaign.deliveries.push(id);return true;
}
export function campaignObjective(save,{localOnly=false}={}){
  if(companionUnconscious(save))return {title:'Đưa Hạ Ly tới trạm y tế',description:'Hạ Ly đang bất tỉnh. Bế cô ấy tới trạm y tế và chữa trị đủ 60 giây trước khi tiếp tục tuyến truyện chính.',targetVillage:save.village,targetKind:'clinic'};
  const opening=openingObjective(save);if(opening&&!localOnly)return opening;
  const stage=campaignStage(save);
  if(!localOnly&&stage==='treaty')return {title:'Ba cường quốc đình chiến',description:'Đưa đại diện Thủy, Hỏa và Lôi trở về Vô Danh để ký cam kết rút quân.',targetVillage:'nameless',targetKind:'treaty'};
  if(!localOnly&&stage==='homecoming')return {title:'Lời hứa đầu tiên với mẹ',description:'Trở về nghĩa trang gặp mẹ cùng Hạ Ly. Từ đây, ký ức tương lai không còn chỉ sẵn đường đi.',targetVillage:'nameless',targetKind:'lore',targetId:'nameless-resident-war-cemetery'};
  if(!localOnly&&stage==='complete')return {title:'Chiến đấu cùng thế giới',description:'Liên quân đã giữ được phong ấn. Một tương lai khác được lựa chọn cùng nhau; bạn có thể tiếp tục khám phá.',targetVillage:'nameless',targetKind:'complete'};
  const id=localOnly?save.village:stage==='invasion'?'nameless':nextPlotVillage(save);
  const event=villageEventObjective(save,id);if(event)return event;
  if(id==='earth'&&earthDepartureTrialPending(save))return {title:EARTH_DEPARTURE_TRIAL.title,description:EARTH_DEPARTURE_TRIAL.description,targetVillage:id,targetKind:'npc'};
  if(WAR_VILLAGES.includes(id))return save.bosses[id]?{title:'Cam kết rút quân khỏi Vô Danh',description:'Gặp trưởng làng để thương lượng đình chiến sau cuộc thách đấu.',targetVillage:id,targetKind:'npc'}:confrontationObjective(save,id);
  if(ALLIANCE_VILLAGES.includes(id)&&!save.story.alliances?.includes(id))return {title:id==='dark'?'Sự thật từ Vô Nguyệt':'Vai trò của '+village(id).name+' trong liên minh',description:'Mang kết quả điều tra tới trưởng làng. Hợp tác bằng hành động thay cho một cuộc thách đấu.',targetVillage:id,targetKind:'npc'};
  return {title:'Tiếp tục hành trình',description:'Gặp cư dân, học thuật và khám phá những miền đất đã được giải phóng.',targetVillage:save.village,targetKind:'complete'};
}

export const INTERACTION_RANGE = 3;
export const SAVE_KEY = 'anhoa-adventure-v1';
export function newJourney(name='Lữ Khách',coat='#211e25',hair='#161821') {
  return {version:1,worldRevision:3,healthFraction:1,flask:newFlask(),mines:{},interior:null,surface:null,elevation:null,expeditions:{},arena:newTournament(),equipment:{...newEquipment(),ammo:{iron:0,steel:0,tempered:0,chakra:0}},hero:{look:'crimson-wanderer-v2',name:name.trim().slice(0,24)||'Lữ Khách',coat,hair},village:'nameless',position:[...HOME.spawn],checkpoint:'nameless',visited:['nameless'],activated:['nameless'],quests:{},discoveries:[],lessons:{},mentors:{},bosses:{},learnedSpells:[],progression:{...newProgression(),xp:{}},story:newStory(),campaign:{treatySigned:false,deliveries:[]},gold:0,xp:0,wins:0};
}
export function readJourney(storage,{includeCheckpoint=true}={}) {
  try {
    const s=JSON.parse(storage.getItem(SAVE_KEY));
    if(s?.version!==1||!village(s.village)||!village(s.checkpoint)||typeof s.hero?.name!=='string')return null;
    const hex=c=>/^#[\da-f]{6}$/i.test(c);
    const clean=newJourney(s.hero.name,hex(s.hero.coat)?s.hero.coat:'#211e25',hex(s.hero.hair)?s.hero.hair:'#161821');
    clean.healthFraction=Number.isFinite(s.healthFraction)?Math.max(0,Math.min(1,s.healthFraction)):1;
    clean.equipment=readEquipment(s.equipment);if(s.hero.look!=='crimson-wanderer-v2'){clean.hero.hair='#161821';clean.hero.coat='#211e25';}
    clean.village=s.village;clean.checkpoint=s.checkpoint;
    const limit=s.worldRevision>=2?regionMetrics(s.village).limit:70;
    clean.position=Array.isArray(s.position)&&s.position.length===2&&s.position.every(n=>Number.isFinite(n)&&Math.abs(n)<=limit)?[...s.position]:[0,7];
    if((s.worldRevision<2||!s.worldRevision||s.worldRevision===2&&['light','dark'].includes(s.village))&&regionMetrics(s.village).scale===2)clean.position=clean.position.map(n=>n*2);
    clean.elevation=s.worldRevision>=2&&Number.isFinite(s.elevation)&&s.elevation>=-100&&s.elevation<=200?s.elevation:null;
    clean.expeditions={};if([1,2,3].includes(s.expeditions?.fire))clean.expeditions.fire=s.expeditions.fire;
    clean.arena=readTournament(s.arena);
    clean.surface=(s.village==='wind'&&['sky-west','sky-east','sky-north'].includes(s.surface)||s.village==='earth'&&s.surface==='earth-cave'||s.village==='wood'&&s.surface==='heart-tree')?s.surface:null;
    clean.interior=readInterior(s.interior,s.village);
    if(clean.interior){clean.surface=null;clean.elevation=0;}
    else if(s.village==='earth'&&s.surface==='earth-cave'){
      clean.interior={id:'earth-cave',returnPosition:[...INTERIORS['earth-cave'].exterior],returnSurface:null,returnElevation:null};clean.surface=null;clean.elevation=0;
    }
    for(const key of ['visited','activated'])clean[key]=[...new Set(['nameless',...(Array.isArray(s[key])?s[key].filter(id=>village(id)):[])])];
    clean.activated=[...new Set([...clean.activated,s.checkpoint])];
    for(const v of VILLAGES){
      if([1,2,3].includes(s.quests?.[v.id]))clean.quests[v.id]=s.quests[v.id];
      if(REGIONS[v.id].mentor&&s.lessons?.[v.id]===1)clean.lessons[v.id]=1;
      if(REGIONS[v.id].mentor&&s.mentors?.[v.id]===true)clean.mentors[v.id]=true;
      if(s.bosses?.[v.id]===true)clean.bosses[v.id]=true;
    }
    const zones=new Set(Object.entries(REGIONS).flatMap(([id,r])=>r.zones.map(zone=>`${id}:${zone.id}`)));
    clean.discoveries=[...new Set(Array.isArray(s.discoveries)?s.discoveries.filter(key=>zones.has(key)):[])];
    clean.campaign.treatySigned=s.campaign?.treatySigned===true;
    clean.campaign.deliveries=clean.campaign.treatySigned?[...new Set(Array.isArray(s.campaign?.deliveries)?s.campaign.deliveries.filter(id=>CAMPAIGN_REGIONS.includes(id)):[])]:[];
    // Saves made before the exploration update already owned every art. Keep that progress.
    const known=Array.isArray(s.learnedSpells)?s.learnedSpells.filter(id=>ALL_ADVENTURE_SPELLS.includes(id)):ALL_ADVENTURE_SPELLS;
    clean.learnedSpells=[...new Set([...(s.story?.revision===1?[]:STARTER_SPELLS),...known])];
    if(!s.progression)for(const v of VILLAGES){
      if(clean.mentors[v.id])clean.learnedSpells.push(...REGIONS[v.id].mentor.spellIds);
      if(clean.bosses[v.id])clean.learnedSpells.push(...bossRewardSpells(v.id));
    }
    clean.learnedSpells=[...new Set(clean.learnedSpells)];
    clean.progression=readProgression(s.progression,clean.learnedSpells);
    if(s.story?.revision===1&&s.progression&&!Object.hasOwn(s.progression.xp||{},'water'))delete clean.progression.xp.water;
    clean.learnedSpells=clean.learnedSpells.filter(id=>canLearn(clean.progression,id));
    clean.story=readStory(s.story,clean);clean.flask=readFlask(s.flask,!!clean.story.starter);clean.mines=readMines(s.mines);
    // Keep rewards already earned from the retired Vô Danh lesson.
    if(s.mentors?.nameless)addBooks(clean,['wind-barrier']);
    // Backfill missing rewards when an older journey already completed a source.
    for(const v of VILLAGES){
      if(clean.mentors[v.id])addBooks(clean,[REGIONS[v.id].mentor.spellId]);
      if(clean.bosses[v.id])addBooks(clean,bossRewardSpells(v.id));
      for(const q of villageSidequests(v.id))if(clean.story.sidequests[q.id]===3&&q.rewardScroll)addBooks(clean,[q.rewardScroll]);
      for(const q of villageSidequests(v.id,true))if(s.story?.sidequests?.[q.id]===3&&q.rewardScroll)addBooks(clean,[q.rewardScroll]);
    }
    for(const key of ['gold','xp','wins'])clean[key]=Number.isSafeInteger(s[key])&&s[key]>=0?s[key]:0;
    if(includeCheckpoint){const point=readCheckpoint(s.checkpointSave,snapshot=>readJourney({getItem:()=>JSON.stringify(snapshot)},{includeCheckpoint:false}));if(point)clean.checkpointSave=point;}
    if(s.pendingCheckpointRestore===true&&clean.checkpointSave)restoreCheckpoint(clean);
    return clean;
  }catch{return null;}
}
export function discoverZone(save,id,zoneId) {
  if(!REGIONS[id]?.zones.some(zone=>zone.id===zoneId))return false;
  const key=`${id}:${zoneId}`;
  save.discoveries??=[];
  if(save.discoveries.includes(key))return false;
  save.discoveries.push(key);
  const element=id==='nameless'?spellElement(save.story?.starter)||'water':regionElement(id);
  if(systemLevel(save.progression,element)>0)gainExperience(save.progression,element,30);
  return true;
}
export function mentorReady(save,id) {
  const mentor=REGIONS[id]?.mentor;
  return !!mentor&&(id!=='nameless'||save.campaign?.treatySigned===true)&&!save.mentors?.[id]&&mentor.zoneIds.every(zoneId=>save.discoveries?.includes(`${id}:${zoneId}`));
}
export function completeLesson(save,id) {
  const mentor=REGIONS[id]?.mentor;
  if(!mentor||(!save.mentors?.[id]&&!mentorReady(save,id)))return {learned:false,spellId:mentor?.spellId||null,spellIds:[],bookIds:[]};
  const element=regionElement(id);
  let bookIds=[];
  if(!save.mentors?.[id]){
    const practice=systemLevel(save.progression,element)?60:120;
    gainExperience(save.progression,element,practice);
    save.mentors??={};save.mentors[id]=true;
    bookIds=addBooks(save,[mentor.spellId]);
  }
  save.learnedSpells??=[...STARTER_SPELLS];
  const spellIds=learnFromBook(save,mentor.spellId)?[mentor.spellId]:[];
  return {completed:true,learned:spellIds.length>0,spellId:mentor.spellId,spellIds,bookIds:bookIds.filter(id=>!spellIds.includes(id))};
}
export function bossRewardSpells(id){return [...(REGIONS[id]?.boss.rewardSpells||[])];}
export function resolveBattle(save,encounter,victory) {
  if(isEarthDepartureTrial(encounter)&&!victory)return save;
  if(encounter.kind==='arena'){
    if(resolveTournamentMatch(save,encounter,victory))awardTournamentEquipment(save);
    return save;
  }
  if(victory&&encounter.kind==='village-event'){
    if(advanceVillageEvent(save,encounter.village,encounter.eventStep,{victory:true}).ok)save.wins++;
  }
  else if(victory&&encounter.kind==='intro-trio'){
    if(save.story.stage==='guardian'){save.story.stage='report';save.story.guardianRestored=true;save.story.sealCore=true;if(!save.story.questItems.includes('nameless:seal-core'))save.story.questItems.push('nameless:seal-core');save.bosses.nameless=true;save.gold+=120;save.xp+=140;save.wins++;for(const reward of combatExperienceRewards({...encounter,squad:encounter.squad||INTRO_SQUAD},120))gainExperience(save.progression,reward.element,reward.xp);}
  }
  else if(victory&&encounter.kind==='village-guard'){
    const guards=encounter.guardIds||[encounter.guardId],fresh=guards.filter(id=>!save.story.defeatedGuards.includes(id));
    if(fresh.length){save.story.defeatedGuards.push(...fresh);save.gold+=35*fresh.length;save.xp+=75*fresh.length;save.wins++;for(const reward of combatExperienceRewards(encounter,75*fresh.length))gainExperience(save.progression,reward.element,reward.xp);}
  }
  else if(victory&&encounter.kind==='sidequest'){
    const q=villageSidequests(encounter.village).find(q=>q.id===encounter.questId);if(q&&completeSidequestTarget(save,q)){save.wins++;for(const reward of combatExperienceRewards(encounter,35))gainExperience(save.progression,reward.element,reward.xp);}
  }
  else if(victory&&encounter.kind==='boss'){
    const boss=REGIONS[encounter.village]?.boss;
    save.bosses??={};
    if(boss&&!save.bosses[encounter.village]){
      save.bosses[encounter.village]=true;save.gold+=boss.rewardGold;save.xp+=boss.rewardXp;save.wins++;
      for(const reward of combatExperienceRewards(encounter,180))gainExperience(save.progression,reward.element,reward.xp);
      addBooks(save,bossRewardSpells(encounter.village));
    }
  }
  else if(victory){save.gold+=encounter.kind==='quest'?60:20;save.xp+=encounter.kind==='quest'?90:35;save.wins++;for(const reward of combatExperienceRewards(encounter,encounter.kind==='quest'?65:45))gainExperience(save.progression,reward.element,reward.xp);if(encounter.kind==='quest'&&(save.quests[encounter.village]||0)<2){if(!save.quests[encounter.village]){save.story.earlyVillageQuests??=[];save.story.earlyVillageQuests.push(encounter.village);}save.quests[encounter.village]=2;}}
  else if(!restoreCheckpoint(save)){save.interior=null;save.village=save.checkpoint;save.surface=null;save.elevation=null;save.position=save.village==='nameless'&&save.story?.stage==='mother'?[...HOME.spawn]:[0,7];}
  return save;
}

// A* over a one-unit grid. Diagonal moves cannot cut across solid corners.
export function findPath(from,to,blocked) {
  if(!Array.isArray(from)||!Array.isArray(to)||from.length!==2||to.length!==2||![...from,...to].every(Number.isFinite))return [];
  const grid=blocked.limit||WORLD_LIMIT,key=(x,z)=>`${x},${z}`,snap=p=>p.map(Math.round),walkable=new Map();
  // A search evaluates each grid cell many times from neighboring nodes.
  // Collision state is fixed for this call; keep the cache local to the search.
  const start=snap(from),end=snap(to),valid=(x,z)=>{if(Math.abs(x)>grid||Math.abs(z)>grid)return false;const k=key(x,z);if(!walkable.has(k))walkable.set(k,!blocked(x,z));return walkable.get(k);};
  if(!valid(...end)||Math.abs(to[0])>grid||Math.abs(to[1])>grid||blocked(...to))return [];
  if(start.some(n=>Math.abs(n)>grid))return [];
  const open=[],cost=new Map([[key(...start),0]]),parent=new Map(),closed=new Set();
  // A binary heap keeps long routes across the expanded villages responsive.
  let serial=0;const earlier=(a,b)=>a.f<b.f||(a.f===b.f&&a.order<b.order);
  const push=node=>{node.order=serial++;let i=open.length;open.push(node);while(i){const p=(i-1)>>1;if(!earlier(node,open[p]))break;open[i]=open[p];i=p;}open[i]=node;};
  const pop=()=>{const first=open[0],last=open.pop();if(open.length){let i=0;while(true){const l=i*2+1,r=l+1;if(l>=open.length)break;const child=r<open.length&&earlier(open[r],open[l])?r:l;if(!earlier(open[child],last))break;open[i]=open[child];i=child;}open[i]=last;}return first;};
  push({x:start[0],z:start[1],g:0,f:Math.hypot(start[0]-end[0],start[1]-end[1])});
  while(open.length){
    const c=pop(),k=key(c.x,c.z);if(closed.has(k))continue;closed.add(k);
    if(c.x===end[0]&&c.z===end[1]){const path=[[...to]];let at=k;while(parent.has(at)){const prev=parent.get(at);path.push(prev.split(',').map(Number));at=prev;}path.reverse();path.shift();return path;}
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const x=c.x+dx,z=c.z+dz;if(!valid(x,z)||(dx&&dz&&(!valid(c.x+dx,c.z)||!valid(c.x,c.z+dz))))continue;
      const nk=key(x,z),g=c.g+Math.hypot(dx,dz);if(g>=(cost.get(nk)??Infinity))continue;
      cost.set(nk,g);parent.set(nk,k);push({x,z,g,f:g+Math.hypot(x-end[0],z-end[1])});
    }
  }return [];
}
