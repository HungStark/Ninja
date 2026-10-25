export const SHURIKEN_TYPES=[
  {id:'iron',name:'Phi tiêu sắt',damage:2,price:8,quantity:10,color:'#707983'},
  {id:'steel',name:'Phi tiêu bạc',damage:2.5,price:24,quantity:10,color:'#c3cbd5'},
  {id:'tempered',name:'Phi tiêu vàng',damage:3.5,price:55,quantity:10,color:'#e6b53f'},
  {id:'chakra',name:'Phi tiêu bạch kim',damage:5,price:100,quantity:10,color:'#e9faff',energy:true}
];
export const BAGS=[
  {id:'pouch-30',name:'Túi hành trang',capacity:10,price:0},
  {id:'pouch-60',name:'Túi phi tiêu vừa',capacity:20,price:80},
  {id:'pouch-120',name:'Túi phi tiêu lớn',capacity:30,price:220},
  {id:'pouch-240',name:'Túi nhẫn cụ đại',capacity:50,price:600}
];
const regions=[
  ['nameless','Biên Địa','#65715a','vest',{water:.15,fire:.15,lightning:.1}],
  ['water','Thủy Triều','#477f91','vest',{water:.25,ice:.12}],
  ['fire','Hỏa Nham','#8e4c3b','lamellar',{fire:.25,earth:.12}],
  ['lightning','Lôi Vệ','#655680','plate',{lightning:.25,light:.12}],
  ['earth','Thạch Giáp','#9a8156','plate',{earth:.25,wood:.12}],
  ['wind','Phong Hành','#548677','mantle',{wind:.25,lightning:.12}],
  ['light','Nhật Luân','#c5aa62','lamellar',{light:.25,dark:.12}],
  ['ice','Băng Tuyết','#99b6c5','fur',{ice:.25,water:.12}],
  ['wood','Mộc Linh','#668457','wrap',{wood:.25,earth:.12}],
  ['dark','Nguyệt Ảnh','#655573','mantle',{dark:.25,fire:.12}]
];
export const ARMOR_DESIGNS={
  nameless:'Giáp da vá, đường khâu thủ công và đai khóa đồng',
  water:'Vảy giáp xếp lớp, viền bạc và huy hiệu giọt nước',
  fire:'Giáp phiến sơn đỏ, dây buộc và huy hiệu than hồng',
  lightning:'Mảng giáp góc cạnh với tia sét khảm trên ngực',
  earth:'Giáp đá nhiều mặt, vai nặng và ấn thạch ở ngực',
  wind:'Vai lông vũ, đai lụa chéo và giáp nhẹ ôm tay',
  light:'Giáp nghi lễ với đĩa mặt trời và đá sáng',
  ice:'Cổ lông thú, giáp băng và tinh thể trên vai',
  wood:'Lá giáp xếp chồng, vỏ cây đan và đai sợi',
  dark:'Giáp lệch vai, áo quấn bất đối xứng và khóa trăng'
};
const elements=['water','fire','lightning','earth','wind','light','ice','wood','dark'];
function gearVariants(v,legacy){
  const keys=Object.keys(legacy),primary=keys[0],pair=keys.slice(0,2),triad=[...new Set([...keys,...elements])].slice(0,3),rates=(ids,values)=>Object.fromEntries(ids.map((id,i)=>[id,values[i]]));
  if(v==='nameless')return [{suffix:'guard',intro:true,label:' Hỏa – Thủy',price:100,rates:{fire:.05,water:.05}},{suffix:'water-lightning',intro:true,label:' Thủy – Lôi',price:100,rates:{water:.05,lightning:.05}},{suffix:'lightning-fire',intro:true,label:' Lôi – Hỏa',price:100,rates:{lightning:.05,fire:.05}},{suffix:'guard-focus',label:' chuyên hệ',price:160,rates:{water:.08}},{suffix:'elite',label:' tinh anh',price:390,elite:true,rates:{water:.11,fire:.08}},{suffix:'elite-focus',label:' tinh anh chuyên hệ',price:430,elite:true,rates:{water:.14}},{suffix:'elite-triad',label:' tinh anh tam hệ',price:350,elite:true,rates:{water:.08,fire:.08,lightning:.08}}];
  return [
    {suffix:'guard',label:'',price:140,rates:rates(pair,[.05,.05])},
    {suffix:'guard-focus',label:' chuyên hệ',price:160,rates:{[primary]:.08}},
    {suffix:'elite',label:' tinh anh',price:390,elite:true,rates:rates(pair,[.11,.08])},
    {suffix:'elite-focus',label:' tinh anh chuyên hệ',price:430,elite:true,rates:{[primary]:.14}},
    {suffix:'elite-triad',label:' tinh anh tam hệ',price:350,elite:true,rates:rates(triad,[.08,.08,.08])}
  ];
}
export const ARMORS=[{id:'traveler',name:'Áo nhẫn giả lữ hành',price:0,color:'#29252c',style:'wrap',resistances:{}},...regions.flatMap(([v,name,color,style,resistances])=>gearVariants(v,resistances).map(g=>({id:v+'-'+g.suffix,village:v,name:'Giáp '+name+g.label,description:ARMOR_DESIGNS[v],price:g.price*(v==='nameless'?2:1),color,style,intro:!!g.intro,elite:!!g.elite,resistances:g.rates})))];
export const ARM_GUARDS=[{id:'bare-wrists',name:'Băng tay lữ hành',price:0,color:'#403640',style:'wrap',bonuses:{},gloves:false},...regions.flatMap(([v,name,color,style,resistances])=>gearVariants(v,resistances).map(g=>({id:v+'-bracers'+(g.suffix==='guard'?'':g.suffix==='guard-focus'?'-focus':'-'+g.suffix),village:v,name:'Giáp tay '+name+g.label,description:g.elite?'Giáp tay kèm găng phủ bàn tay, khớp ngón vẫn linh hoạt.':'Giáp cổ tay và cẳng tay, để hở các ngón kết ấn.',price:(g.price-40)*(v==='nameless'?2:1),color,style,intro:!!g.intro,elite:!!g.elite,bonuses:g.rates,gloves:!!g.elite})))];
export const armorById=id=>ARMORS.find(a=>a.id===id);
export const armguardById=id=>ARM_GUARDS.find(a=>a.id===id);
export const bagById=id=>BAGS.find(b=>b.id===id);
export const shurikenById=id=>SHURIKEN_TYPES.find(s=>s.id===id);
export function newEquipment(){return {version:1,armor:'traveler',armguard:'bare-wrists',bag:'pouch-30',shuriken:'iron',ownedArmor:['traveler'],ownedArmguards:['bare-wrists'],ownedBags:['pouch-30'],ammo:{iron:10,steel:0,tempered:0,chakra:0}};}
export function readEquipment(raw){
  if(!raw||raw.version!==1)return newEquipment();
  const clean=newEquipment();
  clean.ownedArmor=[...new Set(['traveler',...(Array.isArray(raw.ownedArmor)?raw.ownedArmor.filter(id=>armorById(id)):[])])];
  clean.ownedArmguards=[...new Set(['bare-wrists',...(Array.isArray(raw.ownedArmguards)?raw.ownedArmguards.filter(id=>armguardById(id)):[])])];
  clean.ownedBags=[...new Set(['pouch-30',...(Array.isArray(raw.ownedBags)?raw.ownedBags.filter(id=>bagById(id)):[])])];
  clean.armor=clean.ownedArmor.includes(raw.armor)?raw.armor:'traveler';clean.bag=clean.ownedBags.includes(raw.bag)?raw.bag:'pouch-30';
  clean.armguard=clean.ownedArmguards.includes(raw.armguard)?raw.armguard:'bare-wrists';
  clean.shuriken=shurikenById(raw.shuriken)?raw.shuriken:'iron';let room=bagById(clean.bag).capacity;
  // Preserve the most valuable ammunition when an old save exceeds the new bag size.
  for(const s of [...SHURIKEN_TYPES].reverse()){const n=raw.ammo?.[s.id];clean.ammo[s.id]=Math.min(room,Number.isSafeInteger(n)&&n>=0?n:0);room-=clean.ammo[s.id];}
  selectAvailableShuriken(clean);return clean;
}
export function selectAvailableShuriken(e){if(e.ammo[e.shuriken]>0)return true;const next=SHURIKEN_TYPES.find(s=>e.ammo[s.id]>0);if(!next)return false;e.shuriken=next.id;return true;}
export function cycleShuriken(save){const e=save.equipment,available=SHURIKEN_TYPES.filter(s=>e.ammo[s.id]>0);if(!available.length)return false;const i=available.findIndex(s=>s.id===e.shuriken);e.shuriken=available[(i+1)%available.length].id;return true;}
export const ammoCount=equipment=>Object.values(equipment.ammo).reduce((a,b)=>a+b,0);
export function equipmentState(save){const e=save.equipment;return {hero:{...save.hero},armor:armorById(e.armor),armguard:armguardById(e.armguard)||ARM_GUARDS[0],bag:bagById(e.bag),shuriken:shurikenById(e.shuriken),ammo:{...e.ammo},count:ammoCount(e),available:e.ammo[e.shuriken]||0};}
export function damageMultiplierFor(stats,element){return (stats.damageMultiplier||1)+(element==='weapon'?0:stats.elementBonuses?.[element]||0);}
export function shopStock(village){return [...SHURIKEN_TYPES.filter(s=>village!=='nameless'||s.id!=='chakra').map(s=>({...s,kind:'shuriken'})),...ARMORS.filter(a=>a.village===village&&(village!=='nameless'||a.intro)).map(a=>({...a,kind:'armor'})),...ARM_GUARDS.filter(a=>a.village===village&&(village!=='nameless'||a.intro)).map(a=>({...a,kind:'armguard'})),...BAGS.filter(b=>b.price>0&&(village!=='nameless'||b.capacity<=20)).map(b=>({...b,kind:'bag'}))];}
export function buyEquipment(save,id){
  const item=shopStock(save.village).find(item=>item.id===id),e=save.equipment;if(!item)return {ok:false,reason:'Món hàng không bán tại cửa hàng này.'};
  if(item.kind==='armor'&&e.ownedArmor.includes(id)||item.kind==='armguard'&&e.ownedArmguards.includes(id)||item.kind==='bag'&&e.ownedBags.includes(id))return {ok:false,reason:'Bạn đã sở hữu món này.'};
  if(save.gold<item.price)return {ok:false,reason:'Không đủ xu.'};
  if(item.kind==='shuriken'&&ammoCount(e)+item.quantity>bagById(e.bag).capacity)return {ok:false,reason:'Túi không đủ chỗ. Hãy mua hoặc đeo túi lớn hơn.'};
  if(item.kind==='bag'&&item.capacity<ammoCount(e))return {ok:false,reason:'Túi này không chứa hết số phi tiêu đang mang.'};
  save.gold-=item.price;
  if(item.kind==='armor'){e.ownedArmor.push(id);e.armor=id;}
  if(item.kind==='armguard'){e.ownedArmguards.push(id);e.armguard=id;}
  if(item.kind==='bag'){e.ownedBags.push(id);e.bag=id;}
  if(item.kind==='shuriken'){e.ammo[id]+=item.quantity;if(!e.ammo[e.shuriken])e.shuriken=id;}
  return {ok:true,item};
}
export function equipItem(save,kind,id){
  const e=save.equipment;
  if(kind==='armor'&&e.ownedArmor.includes(id))e.armor=id;
  else if(kind==='armguard'&&e.ownedArmguards.includes(id))e.armguard=id;
  else if(kind==='bag'&&e.ownedBags.includes(id)&&bagById(id).capacity>=ammoCount(e))e.bag=id;
  else if(kind==='shuriken'&&shurikenById(id))e.shuriken=id;
  else return false;return true;
}
export function takeShuriken(save){const e=save.equipment;if(!selectAvailableShuriken(e))return null;const item={...shurikenById(e.shuriken)};e.ammo[e.shuriken]--;selectAvailableShuriken(e);return item;}
export function emergencySupply(save){if(ammoCount(save.equipment)>0||save.gold>=SHURIKEN_TYPES[0].price)return false;save.equipment.ammo.iron=10;save.equipment.shuriken='iron';return true;}
