import {WORLD_LIMIT,REGIONS,STARTER_SPELLS,ALL_ADVENTURE_SPELLS,regionMetrics} from './adventure-world.js';
import {newProgression,readProgression,regionElement,gainExperience,systemLevel,teachAvailable,canLearn,addBooks} from './progression.js';
export {STARTER_SPELLS,MENTOR_SPELLS} from './adventure-world.js';

// The atlas is also the source of truth for walking between village maps.
export const VILLAGES = [
  {id:'fire',name:'Làng Hỏa',glyph:'火',element:'fire',color:'#e47646',ground:'#635344',path:'#b19474',roof:'#813b32',sky:'#797f89',tree:'#ac593b',title:'Tro tàn dưới cổng đỏ',desc:'Mái ngói đỏ, đá núi lửa và những rặng phong giữa thung lũng khói.',x:25,y:22,polygon:'9,15 25,6 34,9 43,25 38,34 40,38 30,38 15,32 7,28',links:['water','nameless','wind','earth']},
  {id:'water',name:'Làng Thủy',glyph:'水',element:'water',color:'#62c5de',ground:'#506f73',path:'#a9b5a3',roof:'#365c76',sky:'#91bdce',tree:'#6b9c9b',title:'Bến sương và thủy lộ',desc:'Nhà sàn xanh lam, hồ nước lặng và những bến đá chìm trong sương.',x:51,y:15,polygon:'34,9 47,3 61,6 69,12 65,24 58,28 44,25',links:['fire','lightning','nameless']},
  {id:'lightning',name:'Làng Lôi',glyph:'雷',element:'lightning',color:'#bc9beb',ground:'#615c75',path:'#9995a3',roof:'#594070',sky:'#77768e',tree:'#79709c',title:'Lôi đài trên cao nguyên',desc:'Tháp dẫn sét, tinh thạch tím và vách đá trên cao nguyên giông.',x:79,y:24,polygon:'69,12 76,6 84,14 91,17 95,32 85,38 75,34 65,37 60,28 65,24',links:['water','nameless','light']},
  {id:'nameless',name:'Làng Vô Danh',glyph:'◉',element:'wind',color:'#dfc58c',ground:'#78765a',path:'#8e8064',roof:'#655b43',sky:'#a5ada5',tree:'#797a53',title:'Nơi bước chân bắt đầu',desc:'Những mái tranh rách, đường đất mòn và bia mộ vô danh còn lưu dấu chiến tranh giữa Thủy, Hỏa và Lôi.',x:50,y:32,polygon:'44,25 58,28 60,28 65,37 56,39 49,37 40,38 38,34 43,25',links:['fire','water','lightning','wind']},
  {id:'earth',name:'Làng Thổ',glyph:'土',element:'earth',color:'#d7ae72',ground:'#8b7051',path:'#c9aa7a',roof:'#6c4c38',sky:'#c2ad8e',tree:'#8b8153',title:'Thành đá giữa hẻm núi',desc:'Bậc đá sa thạch, nhà đất và những khối núi dựng đứng bảo vệ làng.',x:21,y:47,polygon:'7,28 15,32 30,38 34,48 33,56 27,59 9,59 3,43',links:['fire','wind','ice']},
  {id:'wind',name:'Làng Phong',glyph:'風',element:'wind',color:'#91d0b0',ground:'#69876a',path:'#bec4a0',roof:'#426d62',sky:'#a7ccc6',tree:'#72996c',title:'Đồng cỏ kể chuyện gió',desc:'Guồng gió, đồng cỏ rộng và những dải cờ bạc màu trên đồi.',x:51,y:49,polygon:'40,38 49,37 56,39 65,37 68,46 64,57 59,61 43,63 38,66 33,56 34,48 30,38',links:['nameless','fire','earth','ice','wood','light','dark']},
  {id:'light',name:'Làng Quang',glyph:'☀',element:'light',color:'#f4d57e',ground:'#a69a6a',path:'#ddd1a4',roof:'#9f8044',sky:'#d5ceb0',tree:'#b7ae70',title:'Thánh điện của bình minh',desc:'Đá trắng, tháp mặt trời và những cột pha lê hứng ánh sáng vàng.',x:82,y:49,polygon:'65,37 75,34 85,38 95,32 98,49 94,61 86,63 74,58 64,57 68,46',links:['lightning','wind','dark']},
  {id:'ice',name:'Làng Băng',glyph:'❄',element:'ice',color:'#a9dcec',ground:'#a4b9b9',path:'#d3dcd4',roof:'#506c82',sky:'#bacfd8',tree:'#7c9d9f',title:'Dấu chân trên tuyết cũ',desc:'Tùng phủ tuyết, mái nhà dốc và tinh thể băng giữa sườn núi lạnh.',x:24,y:73,polygon:'9,59 27,59 33,56 38,66 35,77 31,91 24,88 13,75',links:['earth','wind','wood']},
  {id:'wood',name:'Làng Mộc',glyph:'木',element:'wood',color:'#a6c97d',ground:'#49634b',path:'#9a9970',roof:'#455c3c',sky:'#7f9c88',tree:'#497449',title:'Lời thề dưới cổ thụ',desc:'Nhà gỗ, rễ cây cổ thụ và rừng sâu với ánh đom đóm xanh.',x:51,y:80,polygon:'43,63 59,61 64,67 68,79 69,91 51,97 39,92 31,91 35,77 38,66',links:['ice','wind','dark']},
  {id:'dark',name:'Làng Ám',glyph:'☾',element:'dark',color:'#b7a0d6',ground:'#494858',path:'#858394',roof:'#383346',sky:'#555469',tree:'#61536e',title:'Đèn lồng bên kia màn sương',desc:'Rừng tím, đèn lồng lạnh và đền cổ ẩn dưới bầu trời hoàng hôn.',x:80,y:75,polygon:'64,57 74,58 86,63 94,61 94,77 85,86 69,91 68,79 64,67 59,61',links:['wind','light','wood']}
];
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
for(const id of ['water','fire','lightning','wind','earth','ice','wood']){QUESTS[id].x*=2;QUESTS[id].z*=2;}QUESTS.water.x=82;QUESTS.water.z=38;
export const CAMPAIGN_REGIONS=Object.freeze(['earth','wind','light','ice','wood']);
const firstLeaders=['water','fire','lightning'];
const treatyDelivered=(save,id)=>save.campaign?.deliveries?.includes(id)===true;
const regionArtsLearned=(save,id)=>save.mentors?.[id]===true;
export function campaignStage(save) {
  if(!save.bosses?.water)return 'water';
  if(!save.bosses?.fire||!save.bosses?.lightning)return 'fire-lightning';
  if(!save.campaign?.treatySigned)return 'treaty';
  if(!CAMPAIGN_REGIONS.every(id=>treatyDelivered(save,id)&&save.bosses?.[id]))return 'envoy';
  return save.bosses?.dark?'complete':'dark';
}
export function canTravel(save,target) {
  if(!village(target))return {allowed:false,reason:'Miền đất này không tồn tại trên địa đồ.'};
  if(target==='dark'){
    const ready=save.campaign?.treatySigned&&CAMPAIGN_REGIONS.every(id=>treatyDelivered(save,id)&&save.bosses?.[id]);
    return {allowed:!!ready,reason:ready?'Hòa ước đã nối liền năm miền. Đã đến lúc đối mặt kẻ chủ mưu.':'Trao hòa ước và đánh bại thế lực canh giữ tại Thổ, Phong, Quang, Băng, Mộc trước khi tới Làng Ám.'};
  }
  if(target===save.village||target==='nameless'||target==='water'||save.visited?.includes(target))return {allowed:true,reason:''};
  if(!save.bosses?.water)return {allowed:false,reason:'Hãy tới Làng Thủy, học thủy thuật từ Lưu Thủy và đánh bại thủ lĩnh Hải Châu trước.'};
  if(target==='fire'||target==='lightning')return {allowed:true,reason:''};
  if(!save.campaign?.treatySigned)return {allowed:false,reason:'Thuyết phục thủ lĩnh Hỏa và Lôi, rồi trở về Làng Vô Danh để ba làng ký hòa ước.'};
  return {allowed:true,reason:''};
}
export function canSignTreaty(save) {
  return save.village==='nameless'&&!save.campaign?.treatySigned&&firstLeaders.every(id=>save.bosses?.[id]===true);
}
export function signTreaty(save) {
  if(!canSignTreaty(save))return false;
  save.campaign??={treatySigned:false,deliveries:[]};
  save.campaign.treatySigned=true;save.campaign.deliveries??=[];return true;
}
export function deliverTreaty(save,id) {
  if(!save.campaign?.treatySigned||save.village!==id||!CAMPAIGN_REGIONS.includes(id)||treatyDelivered(save,id))return false;
  save.campaign.deliveries??=[];save.campaign.deliveries.push(id);return true;
}
export function campaignObjective(save) {
  const stage=campaignStage(save);
  const lesson=id=>({title:`Học thuật tại ${village(id).name}`,description:REGIONS[id].mentor.clue,targetVillage:id,targetKind:'mentor'});
  const challenge=id=>({title:`Đối mặt ${REGIONS[id].boss.name}`,description:`Tìm ${REGIONS[id].boss.title} tại ${REGIONS[id].zones[3].name}. Chiến thắng để nhận bí thuật và tiếp tục hành trình.`,targetVillage:id,targetKind:'boss'});
  if(stage==='water')return regionArtsLearned(save,'water')?challenge('water'):lesson('water');
  if(stage==='fire-lightning'){
    const local=['fire','lightning'].includes(save.village)&&!save.bosses?.[save.village]?save.village:['fire','lightning'].find(id=>!save.bosses?.[id]);
    return regionArtsLearned(save,local)?challenge(local):lesson(local);
  }
  if(stage==='treaty')return {title:'Ba làng ký hòa ước',description:'Hải Châu, Xích Nham và Chấn Thiên đang chờ ở Làng Vô Danh. Trở về dự lễ ký kết và nhận hòa ước để mang tới năm miền.',targetVillage:'nameless',targetKind:'treaty'};
  if(stage==='envoy'){
    const unfinished=id=>!treatyDelivered(save,id)||!save.bosses?.[id];
    const id=CAMPAIGN_REGIONS.includes(save.village)&&unfinished(save.village)?save.village:CAMPAIGN_REGIONS.find(unfinished);
    if(!treatyDelivered(save,id))return {title:`Trao hòa ước cho ${village(id).name}`,description:'Mang bản hòa ước đã ký tới sứ giả thường trú, giúp người dân chống các thế lực phá ấn và học nghệ thuật của miền đất này.',targetVillage:id,targetKind:'envoy'};
    return regionArtsLearned(save,id)?challenge(id):lesson(id);
  }
  if(stage==='dark')return regionArtsLearned(save,'dark')?challenge('dark'):lesson('dark');
  return {title:'Hòa ước của chín miền',description:'Vô Nguyệt đã thất bại. Chín làng nối lại thủy lộ và đường núi; những người thầy vẫn chờ bạn trên hành trình tự do.',targetVillage:'nameless',targetKind:'complete'};
}

export const SAVE_KEY = 'anhoa-adventure-v1';
export function newJourney(name='Lữ Khách',coat='#345c63',hair='#252b32') {
  return {version:1,worldRevision:2,surface:null,elevation:null,expeditions:{},hero:{name:name.trim().slice(0,24)||'Lữ Khách',coat,hair},village:'nameless',position:[0,7],checkpoint:'nameless',visited:['nameless'],activated:['nameless'],quests:{},discoveries:[],lessons:{},mentors:{},bosses:{},learnedSpells:[...STARTER_SPELLS],progression:newProgression(),campaign:{treatySigned:false,deliveries:[]},gold:0,xp:0,wins:0};
}
export function readJourney(storage) {
  try {
    const s=JSON.parse(storage.getItem(SAVE_KEY));
    if(s?.version!==1||!village(s.village)||!village(s.checkpoint)||typeof s.hero?.name!=='string')return null;
    const hex=c=>/^#[\da-f]{6}$/i.test(c);
    const clean=newJourney(s.hero.name,hex(s.hero.coat)?s.hero.coat:'#345c63',hex(s.hero.hair)?s.hero.hair:'#252b32');
    clean.village=s.village;clean.checkpoint=s.checkpoint;
    const limit=s.worldRevision===2?regionMetrics(s.village).limit:70;
    clean.position=Array.isArray(s.position)&&s.position.length===2&&s.position.every(n=>Number.isFinite(n)&&Math.abs(n)<=limit)?[...s.position]:[0,7];
    if(s.worldRevision!==2&&regionMetrics(s.village).scale===2)clean.position=clean.position.map(n=>n*2);
    clean.elevation=s.worldRevision===2&&Number.isFinite(s.elevation)&&s.elevation>=-100&&s.elevation<=200?s.elevation:null;
    clean.expeditions={};if([1,2,3].includes(s.expeditions?.fire))clean.expeditions.fire=s.expeditions.fire;
    clean.surface=(s.village==='wind'&&['sky-west','sky-east','sky-north'].includes(s.surface)||s.village==='earth'&&s.surface==='earth-cave'||s.village==='wood'&&s.surface==='heart-tree')?s.surface:null;
    for(const key of ['visited','activated'])clean[key]=[...new Set(['nameless',...(Array.isArray(s[key])?s[key].filter(id=>village(id)):[])])];
    clean.activated=[...new Set([...clean.activated,s.checkpoint])];
    for(const v of VILLAGES){
      if([1,2,3].includes(s.quests?.[v.id]))clean.quests[v.id]=s.quests[v.id];
      if(s.lessons?.[v.id]===1)clean.lessons[v.id]=1;
      if(s.mentors?.[v.id]===true)clean.mentors[v.id]=true;
      if(s.bosses?.[v.id]===true)clean.bosses[v.id]=true;
    }
    const zones=new Set(Object.entries(REGIONS).flatMap(([id,r])=>r.zones.map(zone=>`${id}:${zone.id}`)));
    clean.discoveries=[...new Set(Array.isArray(s.discoveries)?s.discoveries.filter(key=>zones.has(key)):[])];
    clean.campaign.treatySigned=s.campaign?.treatySigned===true;
    clean.campaign.deliveries=clean.campaign.treatySigned?[...new Set(Array.isArray(s.campaign?.deliveries)?s.campaign.deliveries.filter(id=>CAMPAIGN_REGIONS.includes(id)):[])]:[];
    // Saves made before the exploration update already owned every art. Keep that progress.
    const known=Array.isArray(s.learnedSpells)?s.learnedSpells.filter(id=>ALL_ADVENTURE_SPELLS.includes(id)):ALL_ADVENTURE_SPELLS;
    clean.learnedSpells=[...new Set([...STARTER_SPELLS,...known])];
    if(!s.progression)for(const v of VILLAGES){
      if(clean.mentors[v.id])clean.learnedSpells.push(...REGIONS[v.id].mentor.spellIds);
      if(clean.bosses[v.id])clean.learnedSpells.push(...bossRewardSpells(v.id));
    }
    clean.learnedSpells=[...new Set(clean.learnedSpells)];
    clean.progression=readProgression(s.progression,clean.learnedSpells);
    clean.learnedSpells=clean.learnedSpells.filter(id=>canLearn(clean.progression,id));
    for(const key of ['gold','xp','wins'])clean[key]=Number.isSafeInteger(s[key])&&s[key]>=0?s[key]:0;
    return clean;
  }catch{return null;}
}
export function discoverZone(save,id,zoneId) {
  if(!REGIONS[id]?.zones.some(zone=>zone.id===zoneId))return false;
  const key=`${id}:${zoneId}`;
  save.discoveries??=[];
  if(save.discoveries.includes(key))return false;
  save.discoveries.push(key);
  const element=id==='nameless'&&!save.bosses.water?'water':regionElement(id);
  if(systemLevel(save.progression,element)>0)gainExperience(save.progression,element,30);
  return true;
}
export function mentorReady(save,id) {
  const mentor=REGIONS[id]?.mentor;
  return !!mentor&&(id!=='nameless'||save.campaign?.treatySigned===true)&&save.lessons?.[id]===1&&!save.mentors?.[id]&&mentor.zoneIds.every(zoneId=>save.discoveries?.includes(`${id}:${zoneId}`));
}
export function completeLesson(save,id) {
  const mentor=REGIONS[id]?.mentor;
  if(!save.mentors?.[id]&&!mentorReady(save,id))return {learned:false,spellId:mentor?.spellId||null,spellIds:[]};
  const element=regionElement(id);
  if(!save.mentors?.[id]){
    const practice=systemLevel(save.progression,element)?60:120;
    gainExperience(save.progression,element,practice);
    save.mentors??={};save.mentors[id]=true;
  }
  save.learnedSpells??=[...STARTER_SPELLS];
  const spellIds=teachAvailable(save,element);
  return {learned:spellIds.length>0,spellId:mentor.spellId,spellIds};
}
export function bossRewardSpells(id){return [...(REGIONS[id]?.boss.rewardSpells||[])];}
export function resolveBattle(save,encounter,victory) {
  if(victory&&encounter.kind==='boss'){
    const boss=REGIONS[encounter.village]?.boss;
    save.bosses??={};
    if(boss&&!save.bosses[encounter.village]){
      save.bosses[encounter.village]=true;save.gold+=boss.rewardGold;save.xp+=boss.rewardXp;save.wins++;
      gainExperience(save.progression,regionElement(encounter.village),180);
      addBooks(save,bossRewardSpells(encounter.village));
    }
  }
  else if(victory){save.gold+=encounter.kind==='quest'?60:20;save.xp+=encounter.kind==='quest'?90:35;save.wins++;gainExperience(save.progression,encounter.element||(encounter.village==='nameless'?'water':regionElement(encounter.village)),encounter.kind==='quest'?65:45);if(encounter.kind==='quest'&&save.quests[encounter.village]===1)save.quests[encounter.village]=2;}
  else{save.village=save.checkpoint;save.position=[0,7];}
  return save;
}

// A* over a one-unit grid. Diagonal moves cannot cut across solid corners.
export function findPath(from,to,blocked) {
  if(!Array.isArray(from)||!Array.isArray(to)||from.length!==2||to.length!==2||![...from,...to].every(Number.isFinite))return [];
  const grid=blocked.limit||WORLD_LIMIT,key=(x,z)=>`${x},${z}`,snap=p=>p.map(Math.round);
  const start=snap(from),end=snap(to),valid=(x,z)=>Math.abs(x)<=grid&&Math.abs(z)<=grid&&!blocked(x,z);
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
