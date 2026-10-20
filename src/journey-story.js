import {REGIONS,regionMetrics} from './adventure-world.js';
import {SKILL_LEVELS,spellElement,gainExperience,addBooks} from './progression.js';

export const MOTHER_ID='nameless-resident-war-cemetery';
export const HOME={x:-33,z:58,spawn:[-33,63]};
export const STARTER_CHOICES=[{id:'fire-volley',name:'Hỏa liên đạn',element:'fire'},{id:'water-barrier',name:'Thủy bộc cầu',element:'water'},{id:'lightning-lance',name:'Lôi thương',element:'lightning'}];
export const INTRO_SQUAD=STARTER_CHOICES.map((s,i)=>({name:['Hỏa nhẫn đột kích','Thủy nhẫn đột kích','Lôi nhẫn đột kích'][i],element:s.element,village:s.element,hp:85,spellIds:[s.id],damageMultiplier:.32,sealDelay:.85,restTime:5+i*.7,weaponInterval:4,initialDelay:2+i*2}));
export const FIRST_VILLAGES=['water','fire','lightning'];
const STAGES=['mother','chief','guardian','report','infiltrate'];
export function newStory(){return {revision:1,stage:'mother',starter:null,guardianRestored:false,peaceSeals:[],defeatedGuards:[],sidequests:{},trackedQuest:null};}
export function readStory(raw,save){
  const s=newStory();
  if(raw?.revision!==1){
    // Existing journeys keep their unlocked campaign and all learned techniques.
    s.stage='infiltrate';s.guardianRestored=true;s.starter=save.learnedSpells.find(id=>STARTER_CHOICES.some(c=>c.id===id))||'water-barrier';
    s.peaceSeals=Object.keys(save.bosses).filter(id=>id!=='nameless');return s;
  }
  s.stage=STAGES.includes(raw.stage)?raw.stage:'mother';
  s.starter=STARTER_CHOICES.some(c=>c.id===raw.starter)?raw.starter:null;
  s.guardianRestored=raw.guardianRestored===true;
  s.peaceSeals=[...new Set(Array.isArray(raw.peaceSeals)?raw.peaceSeals.filter(id=>REGIONS[id]&&id!=='nameless'):[])];
  const validGuards=new Set(Object.keys(REGIONS).flatMap(id=>villageGuards(id).map(g=>g.id)));
  s.defeatedGuards=[...new Set(Array.isArray(raw.defeatedGuards)?raw.defeatedGuards.filter(id=>validGuards.has(id)):[])];
  const validQuests=new Set(Object.keys(REGIONS).flatMap(id=>villageSidequests(id).map(q=>q.id)));
  for(const [id,status] of Object.entries(raw.sidequests||{}))if(validQuests.has(id)&&[1,2,3].includes(status))s.sidequests[id]=status;
  s.trackedQuest=validQuests.has(raw.trackedQuest)?raw.trackedQuest:null;return s;
}
export function promiseMother(save){if(save.story.stage!=='mother')return false;save.story.stage='chief';return true;}
export function chooseStarter(save,id){
  if(save.story.stage!=='chief'||save.story.starter||!STARTER_CHOICES.some(s=>s.id===id))return false;
  save.story.starter=id;save.story.stage='guardian';
  save.progression.xp[spellElement(id)]??=0;
  if(!save.learnedSpells.includes(id))save.learnedSpells.push(id);
  const e=save.equipment;e.ownedBags=[...new Set([...e.ownedBags,'pouch-30'])];e.bag='pouch-30';e.ammo={iron:10,steel:0,tempered:0,chakra:0};e.shuriken='iron';return true;
}
export function reportGuardian(save){if(save.story.stage!=='report')return false;save.story.stage='infiltrate';save.gold+=100;return true;}
export function negotiatePeace(save,id){
  if(id==='nameless'||id==='dark'||save.village!==id||!save.bosses[id]||save.story.peaceSeals.includes(id))return false;
  save.story.peaceSeals.push(id);save.gold+=100;return true;
}
export function openingObjective(save){
  const s=save.story;if(!s||s.stage==='infiltrate')return null;
  return {...{
    mother:{title:'Lời hứa trước hai nấm mộ',description:'Tìm mẹ ở nghĩa trang. Cha và em trai đã mất trong cuộc chiến giữa Hỏa, Thủy và Lôi. Hãy lập lời hứa hòa bình với mẹ.',targetKind:'lore',targetId:MOTHER_ID},
    chief:{title:'Chọn con đường nhẫn thuật',description:'Gặp trưởng làng để chọn một trong ba thuật cơ bản, nhận túi đựng và 10 phi tiêu.',targetKind:'npc'},
    guardian:{title:'Giải cứu hộ vệ Vô Danh',description:'Tới Đồi Chuông Gió. Đánh bại cùng lúc ba ninja Hỏa, Thủy, Lôi để hồi sinh hộ vệ đã bị phá hỏng.',targetKind:'intro-guardian'},
    report:{title:'Báo tin cho trưởng làng',description:'Hộ vệ đã sống lại. Trở lại trưởng làng để nhận sứ mệnh lấy dấu ấn hòa bình từ ba làng.',targetKind:'npc'}
  }[s.stage],targetVillage:'nameless'};
}
export function villageGuards(id){
  if(!REGIONS[id]||id==='nameless')return [];
  const r=REGIONS[id],scale=regionMetrics(id).scale,zone=r.zones.find(z=>!z.platform);
  return [0,1,2].map(i=>({id:`${id}-sentry-${i+1}`,village:id,element:id,name:`Cảnh vệ ${['tiền trạm','đường làng','hộ vệ'][i]}`,x:(i===0?-13:i===1?12:zone.x*.68)*scale/(i===2?scale:1),z:i===0?18*scale:i===1?-20*scale:zone.z*.68,kind:'village-guard',label:'Cảnh vệ · '+['Tiền trạm','Đường làng','Trạm gác'][i]}));
}
const taskByActivity={
  mourning:['Hoa cho người nằm lại','Tìm bó bạch cúc bị gió cuốn để đặt trước mộ những người đã mất.','Bạch cúc'],
  forging:['Than lửa cuối lò','Thu hồi túi quặng bị thất lạc để lò rèn có thể làm dụng cụ cho dân làng.','Túi quặng'],
  fishing:['Lưới về bến cũ','Tìm chiếc lưới mắc lại gần đường làng để ngư dân có thể ra khơi.','Cuộn lưới'],
  mending:['Đường chỉ nối nhà','Tìm cuộn chỉ và tấm buồm để vá lại đồ dùng cho các gia đình.','Vải buồm'],
  farming:['Hạt giống sau chiến tranh','Mang về hạt giống còn sót lại để khôi phục mùa vụ.','Túi hạt giống'],
  watering:['Mạch sống của vườn','Tìm bình thuốc dưỡng rễ để cứu những luống cây bị tổn thương.','Bình dưỡng rễ'],
  mining:['Mẫu đá của thợ mỏ','Thu thập mẫu khoáng để kiểm tra an toàn cho đường hầm.','Mẫu khoáng'],
  repair:['Dựng lại mái nhà','Lấy lại hộp đinh và dụng cụ để sửa nhà cho người dân.','Hộp dụng cụ'],
  repairing:['Giữ cánh quạt quay','Tìm trục máy dự phòng trước khi cối xay ngừng chạy.','Trục máy'],
  reading:['Trang sách lạc đường','Tìm trang thư tịch bị thất lạc để chép lại thuật cổ.','Trang thư tịch'],
  observing:['Dấu hiệu trên bầu trời','Khảo sát một địa danh khác rồi mang ghi chép về cho người quan trắc.','Bản ghi quan trắc'],
  market:['Chuyến hàng bình yên','Tìm kiện hàng cứu trợ bị bỏ lại ngoài khu dân cư.','Kiện cứu trợ'],
  pottery:['Men gốm quê nhà','Tìm túi đất men cho mẻ gốm mới của người thợ.','Túi đất men'],
  lookout:['Đường gác yên bình','Hạ kẻ phá hoại đang rình rập để người dân an tâm đi qua.','Kẻ phá hoại'],
  offering:['Đèn cho người trở về','Tìm chiếc đèn nghi lễ để thắp sáng lối về cho người xa quê.','Đèn nghi lễ']
};
export function villageSidequests(id){
  const r=REGIONS[id];if(!r)return [];
  const people=[...r.npcs,{id:`${id}-chief`,name:'Trưởng làng',activity:'lookout'},{id:`${id}-merchant`,name:'Chủ thương hội',activity:'market'},...(['earth','wind','light','ice','wood'].includes(id)?[{id:`${id}-envoy`,name:'Đại diện làng',activity:'reading'}]:[])];
  return people.map((person,i)=>{
    const zones=r.zones.filter(z=>!z.platform&&z.id!=='summit-lotus'),zone=zones[(i+1)%zones.length],template=taskByActivity[person.activity]||['Dấu vết cuộc sống','Tìm vật dụng thất lạc tại địa danh gần làng rồi mang trở về.','Vật dụng thất lạc'];
    const type=person.activity==='mourning'?'retrieve':i%3===1||person.activity==='lookout'?'combat':i%4===3?'survey':'retrieve',element=id==='nameless'?'wind':id;
    const arts=Object.keys(SKILL_LEVELS[element]),scroll=i%2===1?arts[1+i%Math.max(1,arts.length-1)]:null;
    return {id:`${id}:npc:${person.id}`,giver:person.id,giverName:person.name,village:id,type,element,zone:zone.id,
      title:type==='combat'?`Bảo vệ ${zone.name}`:template[0],description:type==='combat'?`${person.name} nhờ bạn đánh bại kẻ phá hoại tại ${zone.name}, rồi trở lại báo tin.`:`${person.name}: ${template[1]} Tới ${zone.name}, sau đó trở lại gặp tôi.`,
      targetName:type==='combat'?'Kẻ phá hoại · '+zone.name:template[2],x:zone.x+(i%2?2.5:-2.5),z:zone.z+3.5,
      rewardGold:scroll?0:65+i*9,rewardScroll:scroll,rewardXp:45+i*3};
  });
}
export function questForNPC(id,item){const giver=item.kind==='npc'?`${id}-chief`:item.kind==='shop'?`${id}-merchant`:item.kind==='envoy'?`${id}-envoy`:item.kind==='expedition-giver'?'fire-khoi':item.id;return villageSidequests(id).find(q=>q.giver===giver);}
export function acceptSidequest(save,q){if(save.story.sidequests[q.id])return false;save.story.sidequests[q.id]=1;save.story.trackedQuest=q.id;return true;}
export function completeSidequestTarget(save,q){if(save.story.sidequests[q.id]!==1)return false;save.story.sidequests[q.id]=2;return true;}
export function sidequestReward(save,q){
  if(!q.rewardScroll)return {gold:q.rewardGold,scroll:null};
  const owned=id=>save.learnedSpells.includes(id)||save.progression.books.includes(id);
  const scroll=[q.rewardScroll,...Object.keys(SKILL_LEVELS[q.element])].find(id=>!owned(id));
  return scroll?{gold:0,scroll}:{gold:100,scroll:null};
}
export function claimSidequest(save,q){if(save.story.sidequests[q.id]!==2)return false;const reward=sidequestReward(save,q);save.story.sidequests[q.id]=3;save.gold+=reward.gold;save.xp+=q.rewardXp;gainExperience(save.progression,q.element,q.rewardXp);if(reward.scroll)addBooks(save,[reward.scroll]);if(save.story.trackedQuest===q.id)save.story.trackedQuest=null;return true;}
