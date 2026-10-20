export const SHURIKEN_TYPES=[
  {id:'iron',name:'Phi tiêu sắt',damage:4,price:8,quantity:10,color:'#707983'},
  {id:'steel',name:'Phi tiêu bạc',damage:5,price:24,quantity:10,color:'#c3cbd5'},
  {id:'tempered',name:'Phi tiêu vàng',damage:7,price:55,quantity:10,color:'#e6b53f'},
  {id:'chakra',name:'Phi tiêu bạch kim',damage:10,price:100,quantity:10,color:'#e9faff',energy:true}
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
export const ARMORS=[{id:'traveler',name:'Áo nhẫn giả lữ hành',price:0,color:'#29252c',style:'wrap',resistances:{}},...regions.flatMap(([v,name,color,style,resistances])=>[
  {id:v+'-guard',village:v,name:'Giáp '+name,price:140,color,style,resistances},
  {id:v+'-elite',village:v,name:'Giáp '+name+' tinh anh',price:350,color,style,elite:true,resistances:Object.fromEntries(Object.entries(resistances).map(([e,r])=>[e,Math.min(.4,r+.1)]))}
])];
export const armorById=id=>ARMORS.find(a=>a.id===id);
export const bagById=id=>BAGS.find(b=>b.id===id);
export const shurikenById=id=>SHURIKEN_TYPES.find(s=>s.id===id);
export function newEquipment(){return {version:1,armor:'traveler',bag:'pouch-30',shuriken:'iron',ownedArmor:['traveler'],ownedBags:['pouch-30'],ammo:{iron:10,steel:0,tempered:0,chakra:0}};}
export function readEquipment(raw){
  if(!raw||raw.version!==1)return newEquipment();
  const clean=newEquipment();
  clean.ownedArmor=[...new Set(['traveler',...(Array.isArray(raw.ownedArmor)?raw.ownedArmor.filter(id=>armorById(id)):[])])];
  clean.ownedBags=[...new Set(['pouch-30',...(Array.isArray(raw.ownedBags)?raw.ownedBags.filter(id=>bagById(id)):[])])];
  clean.armor=clean.ownedArmor.includes(raw.armor)?raw.armor:'traveler';clean.bag=clean.ownedBags.includes(raw.bag)?raw.bag:'pouch-30';
  clean.shuriken=shurikenById(raw.shuriken)?raw.shuriken:'iron';let room=bagById(clean.bag).capacity;
  // Preserve the most valuable ammunition when an old save exceeds the new bag size.
  for(const s of [...SHURIKEN_TYPES].reverse()){const n=raw.ammo?.[s.id];clean.ammo[s.id]=Math.min(room,Number.isSafeInteger(n)&&n>=0?n:0);room-=clean.ammo[s.id];}
  selectAvailableShuriken(clean);return clean;
}
export function selectAvailableShuriken(e){if(e.ammo[e.shuriken]>0)return true;const next=SHURIKEN_TYPES.find(s=>e.ammo[s.id]>0);if(!next)return false;e.shuriken=next.id;return true;}
export function cycleShuriken(save){const e=save.equipment,available=SHURIKEN_TYPES.filter(s=>e.ammo[s.id]>0);if(!available.length)return false;const i=available.findIndex(s=>s.id===e.shuriken);e.shuriken=available[(i+1)%available.length].id;return true;}
export const ammoCount=equipment=>Object.values(equipment.ammo).reduce((a,b)=>a+b,0);
export function equipmentState(save){const e=save.equipment;return {hero:{...save.hero},armor:armorById(e.armor),bag:bagById(e.bag),shuriken:shurikenById(e.shuriken),ammo:{...e.ammo},count:ammoCount(e),available:e.ammo[e.shuriken]||0};}
export function shopStock(village){return [...SHURIKEN_TYPES.map(s=>({...s,kind:'shuriken'})),...ARMORS.filter(a=>a.village===village).map(a=>({...a,kind:'armor'})),...BAGS.filter(b=>b.price>0).map(b=>({...b,kind:'bag'}))];}
export function buyEquipment(save,id){
  const item=shopStock(save.village).find(item=>item.id===id),e=save.equipment;if(!item)return {ok:false,reason:'Món hàng không bán tại cửa hàng này.'};
  if(item.kind==='armor'&&e.ownedArmor.includes(id)||item.kind==='bag'&&e.ownedBags.includes(id))return {ok:false,reason:'Bạn đã sở hữu món này.'};
  if(save.gold<item.price)return {ok:false,reason:'Không đủ xu.'};
  if(item.kind==='shuriken'&&ammoCount(e)+item.quantity>bagById(e.bag).capacity)return {ok:false,reason:'Túi không đủ chỗ. Hãy mua hoặc đeo túi lớn hơn.'};
  if(item.kind==='bag'&&item.capacity<ammoCount(e))return {ok:false,reason:'Túi này không chứa hết số phi tiêu đang mang.'};
  save.gold-=item.price;
  if(item.kind==='armor'){e.ownedArmor.push(id);e.armor=id;}
  if(item.kind==='bag'){e.ownedBags.push(id);e.bag=id;}
  if(item.kind==='shuriken'){e.ammo[id]+=item.quantity;if(!e.ammo[e.shuriken])e.shuriken=id;}
  return {ok:true,item};
}
export function equipItem(save,kind,id){
  const e=save.equipment;
  if(kind==='armor'&&e.ownedArmor.includes(id))e.armor=id;
  else if(kind==='bag'&&e.ownedBags.includes(id)&&bagById(id).capacity>=ammoCount(e))e.bag=id;
  else if(kind==='shuriken'&&shurikenById(id))e.shuriken=id;
  else return false;return true;
}
export function takeShuriken(save){const e=save.equipment;if(!selectAvailableShuriken(e))return null;const item={...shurikenById(e.shuriken)};e.ammo[e.shuriken]--;selectAvailableShuriken(e);return item;}
export function emergencySupply(save){if(ammoCount(save.equipment)>0||save.gold>=SHURIKEN_TYPES[0].price)return false;save.equipment.ammo.iron=10;save.equipment.shuriken='iron';return true;}
