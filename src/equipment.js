export const SHURIKEN_TYPES=[
  {id:'iron',name:'Phi tiêu sắt',damage:2,price:8,quantity:10,color:'#707983',energy:true},
  {id:'steel',name:'Phi tiêu bạc',damage:2.5,price:24,quantity:10,color:'#c3cbd5',energy:true},
  {id:'tempered',name:'Phi tiêu vàng',damage:3.5,price:55,quantity:10,color:'#e6b53f',energy:true},
  {id:'chakra',name:'Phi tiêu bạch kim',damage:5,price:100,quantity:10,color:'#e9faff',energy:true}
];
export const BAGS=[
  {id:'pouch-30',name:'Túi hành trang',capacity:10,price:0},
  {id:'pouch-60',name:'Túi phi tiêu vừa',capacity:20,price:80},
  {id:'pouch-120',name:'Túi phi tiêu lớn',capacity:30,price:220},
  {id:'pouch-240',name:'Túi nhẫn cụ đại',capacity:50,price:400}
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
const standardGearPrice=140;
function gearVariants(v,legacy){
  // Keep old IDs readable so owned equipment survives, but only sell the two regional tiers.
  const primary=Object.keys(legacy)[0],rates=high=>v==='nameless'?{fire:.02,water:.02,lightning:.02}:{[primary]:high?.1:.05};
  const variants=[{suffix:'guard',intro:v==='nameless',label:'',price:standardGearPrice},{suffix:'elite',label:' tinh anh',price:390,elite:true},{suffix:'guard-focus',label:' chuyên hệ',price:160,legacy:true},{suffix:'elite-focus',label:' tinh anh chuyên hệ',price:430,elite:true,legacy:true},{suffix:'elite-triad',label:' tinh anh tam hệ',price:350,elite:true,legacy:true}];
  if(v==='nameless')variants.push({suffix:'water-lightning',label:' Thủy – Lôi',price:standardGearPrice,legacy:true},{suffix:'lightning-fire',label:' Lôi – Hỏa',price:standardGearPrice,legacy:true});
  return variants.map(g=>({...g,legacy:!!g.legacy||v==='nameless'&&g.suffix!=='guard',rates:rates(g.elite)}));
}
export const ARMORS=[{id:'traveler',name:'Áo nhẫn giả lữ hành',price:0,color:'#29252c',style:'wrap',resistances:{}},...regions.flatMap(([v,name,color,style,resistances])=>gearVariants(v,resistances).map(g=>({id:v+'-'+g.suffix,village:v,name:'Giáp '+name+g.label,description:ARMOR_DESIGNS[v],price:g.price,color,style,intro:!!g.intro,elite:!!g.elite,legacy:g.legacy,resistances:g.rates})))];
export const ARM_GUARDS=[{id:'bare-wrists',name:'Băng tay lữ hành',price:0,color:'#403640',style:'wrap',bonuses:{},gloves:false},...regions.flatMap(([v,name,color,style,resistances])=>gearVariants(v,resistances).map(g=>({id:v+'-bracers'+(g.suffix==='guard'?'':g.suffix==='guard-focus'?'-focus':'-'+g.suffix),village:v,name:'Giáp tay '+name+g.label,description:g.elite?'Giáp tay kèm găng phủ bàn tay, khớp ngón vẫn linh hoạt.':'Giáp cổ tay và cẳng tay, để hở các ngón kết ấn.',price:g.price-40,color,style,intro:!!g.intro,elite:!!g.elite,legacy:g.legacy,bonuses:g.rates,gloves:!!g.elite})))];
export const armorById=id=>ARMORS.find(a=>a.id===id);
export const armguardById=id=>ARM_GUARDS.find(a=>a.id===id);
export const TOURNAMENT_ARMOR='divine-ninja-armor',TOURNAMENT_ARMGUARD='divine-ninja-bracers';
const allElements=Object.fromEntries(['fire','water','lightning','wind','earth','wood','ice','light','dark'].map(id=>[id,.1]));
ARMORS.push({id:TOURNAMENT_ARMOR,name:'Giáp Thần Ninja Cực Phẩm',description:'Giáp lục sẫm viền vàng, vai cong, ấn xoắn và dây tua đỏ. Giảm 10% sát thương mọi hệ.',price:0,color:'#49503a',style:'mythic',elite:true,mythic:true,resistances:{...allElements}});
ARM_GUARDS.push({id:TOURNAMENT_ARMGUARD,name:'Giáp Tay Thần Ninja Cực Phẩm',description:'Giáp tay lục sẫm khảm vàng, hoa văn mây, sóng và ấn xoắn. Tăng 10% sát thương mọi hệ.',price:0,color:'#49503a',style:'mythic',elite:true,mythic:true,gloves:false,bonuses:{...allElements}});
export function awardTournamentEquipment(save){
  if(save.arena.rewardClaimed||save.arena.status!=='champion')return false;
  const e=save.equipment;if(!e.ownedArmor.includes(TOURNAMENT_ARMOR))e.ownedArmor.push(TOURNAMENT_ARMOR);if(!e.ownedArmguards.includes(TOURNAMENT_ARMGUARD))e.ownedArmguards.push(TOURNAMENT_ARMGUARD);
  save.arena.rewardClaimed=true;return true;
}
export const bagById=id=>BAGS.find(b=>b.id===id);
export const bestOwnedBag=e=>(e.ownedBags||[]).map(bagById).filter(Boolean).reduce((best,bag)=>bag.capacity>best.capacity?bag:best,BAGS[0]);
export const shurikenById=id=>SHURIKEN_TYPES.find(s=>s.id===id);
export function newEquipment(){return {version:1,armor:'traveler',armguard:'bare-wrists',bag:'pouch-30',shuriken:'iron',ownedArmor:['traveler'],ownedArmguards:['bare-wrists'],ownedBags:['pouch-30'],ammo:{iron:10,steel:0,tempered:0,chakra:0}};}
export function readEquipment(raw){
  if(!raw||raw.version!==1)return newEquipment();
  const clean=newEquipment();
  clean.ownedArmor=[...new Set(['traveler',...(Array.isArray(raw.ownedArmor)?raw.ownedArmor.filter(id=>armorById(id)):[])])];
  clean.ownedArmguards=[...new Set(['bare-wrists',...(Array.isArray(raw.ownedArmguards)?raw.ownedArmguards.filter(id=>armguardById(id)):[])])];
  clean.ownedBags=[...new Set(['pouch-30',...(Array.isArray(raw.ownedBags)?raw.ownedBags.filter(id=>bagById(id)):[])])];
  clean.armor=clean.ownedArmor.includes(raw.armor)?raw.armor:'traveler';clean.bag=bestOwnedBag(clean).id;
  clean.armguard=clean.ownedArmguards.includes(raw.armguard)?raw.armguard:'bare-wrists';
  clean.shuriken=shurikenById(raw.shuriken)?raw.shuriken:'iron';let room=bagById(clean.bag).capacity;
  // Preserve the most valuable ammunition when an old save exceeds the new bag size.
  for(const s of [...SHURIKEN_TYPES].reverse()){const n=raw.ammo?.[s.id];clean.ammo[s.id]=Math.min(room,Number.isSafeInteger(n)&&n>=0?n:0);room-=clean.ammo[s.id];}
  selectAvailableShuriken(clean);return clean;
}
export function selectAvailableShuriken(e){if(e.ammo[e.shuriken]>0)return true;const next=SHURIKEN_TYPES.find(s=>e.ammo[s.id]>0);if(!next)return false;e.shuriken=next.id;return true;}
export function cycleShuriken(save){const e=save.equipment,available=SHURIKEN_TYPES.filter(s=>e.ammo[s.id]>0);if(!available.length)return false;const i=available.findIndex(s=>s.id===e.shuriken);e.shuriken=available[(i+1)%available.length].id;return true;}
export const ammoCount=equipment=>Object.values(equipment.ammo).reduce((a,b)=>a+b,0);
export function equipmentState(save){const e=save.equipment;e.bag=bestOwnedBag(e).id;return {hero:{...save.hero},armor:armorById(e.armor),armguard:armguardById(e.armguard)||ARM_GUARDS[0],bag:bagById(e.bag),shuriken:shurikenById(e.shuriken),ammo:{...e.ammo},count:ammoCount(e),available:e.ammo[e.shuriken]||0};}
export function damageMultiplierFor(stats,element){return (stats.damageMultiplier||1)+(element==='weapon'?0:stats.elementBonuses?.[element]||0);}
export function shopStock(village){return [...SHURIKEN_TYPES.filter(s=>village!=='nameless'||s.id!=='chakra').map(s=>({...s,kind:'shuriken'})),...ARMORS.filter(a=>a.village===village&&!a.legacy).map(a=>({...a,kind:'armor'})),...ARM_GUARDS.filter(a=>a.village===village&&!a.legacy).map(a=>({...a,kind:'armguard'})),...BAGS.filter(b=>b.price>0&&(village!=='nameless'||b.capacity<=20)).map(b=>({...b,kind:'bag'}))];}
// Keep the former ten-piece price, rounded up once for the selected quantity.
export const shurikenPrice=(item,quantity)=>Math.ceil(item.price*quantity/item.quantity);
export function maxShurikenPurchase(save,id){
  const item=shopStock(save.village).find(i=>i.kind==='shuriken'&&i.id===id);if(!item)return 0;
  return Math.max(0,Math.min(50,bestOwnedBag(save.equipment).capacity-ammoCount(save.equipment),Math.floor(save.gold*item.quantity/item.price)));
}
export function buyEquipment(save,id,quantity=10){
  const item=shopStock(save.village).find(item=>item.id===id),e=save.equipment;if(!item)return {ok:false,reason:'Món hàng không bán tại cửa hàng này.'};
  e.bag=bestOwnedBag(e).id;
  if(item.kind==='armor'&&e.ownedArmor.includes(id)||item.kind==='armguard'&&e.ownedArmguards.includes(id)||item.kind==='bag'&&e.ownedBags.includes(id))return {ok:false,reason:'Bạn đã sở hữu món này.'};
  if(item.kind==='bag'&&item.capacity<=bestOwnedBag(e).capacity)return {ok:false,reason:'Túi hiện tại đã có sức chứa bằng hoặc lớn hơn.'};
  if(item.kind==='shuriken'&&(!Number.isSafeInteger(quantity)||quantity<1||quantity>50))return {ok:false,reason:'Chọn từ 1 đến 50 phi tiêu.'};
  const price=item.kind==='shuriken'?shurikenPrice(item,quantity):item.price;
  if(save.gold<price)return {ok:false,reason:'Không đủ xu.'};
  if(item.kind==='shuriken'&&ammoCount(e)+quantity>bagById(e.bag).capacity)return {ok:false,reason:'Túi không đủ chỗ. Hãy mua hoặc đeo túi lớn hơn.'};
  if(item.kind==='bag'&&item.capacity<ammoCount(e))return {ok:false,reason:'Túi này không chứa hết số phi tiêu đang mang.'};
  save.gold-=price;
  if(item.kind==='armor'){e.ownedArmor.push(id);e.armor=id;}
  if(item.kind==='armguard'){e.ownedArmguards.push(id);e.armguard=id;}
  if(item.kind==='bag'){e.ownedBags.push(id);e.bag=id;}
  if(item.kind==='shuriken'){e.ammo[id]+=quantity;if(!e.ammo[e.shuriken])e.shuriken=id;}
  return {ok:true,item,quantity:item.kind==='shuriken'?quantity:1,price};
}
export function equipItem(save,kind,id){
  const e=save.equipment;
  if(kind==='armor'&&e.ownedArmor.includes(id))e.armor=id;
  else if(kind==='armguard'&&e.ownedArmguards.includes(id))e.armguard=id;
  else if(kind==='bag'&&id===bestOwnedBag(e).id)e.bag=id;
  else if(kind==='shuriken'&&shurikenById(id))e.shuriken=id;
  else return false;return true;
}
export function takeShuriken(save){const e=save.equipment;if(!selectAvailableShuriken(e))return null;const item={...shurikenById(e.shuriken)};e.ammo[e.shuriken]--;selectAvailableShuriken(e);return item;}
export function emergencySupply(save){if(ammoCount(save.equipment)>0||save.gold>=SHURIKEN_TYPES[0].price)return false;save.equipment.ammo.iron=10;save.equipment.shuriken='iron';return true;}
