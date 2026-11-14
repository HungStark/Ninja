import {GUARDIAN_ARSENAL_STATS} from '../src/guardian-arsenal-data.js';
import {guardianMobaLabels,guardianMobaNotes} from './guardian-moba-metadata.mjs';
import vm from 'node:vm';
import {GUARDIAN_BOSS_DESIGNS} from '../src/guardian-boss-designs.js';
import {GUARDIAN_FORMS} from '../src/guardian-beasts.js';
import {revisionOf} from './spell-balance-data.mjs';

const START='/* guardian-balance:start */',END='/* guardian-balance:end */';
export function readGuardianBalance(source){
  const context={GUARDIAN_ARSENAL_STATS};vm.runInNewContext(source.replace(/^import .*$/gm,'').replace(/^export /gm,'')+'\nglobalThis.result={skills:{...GUARDIAN_SKILL_DEFAULTS,...GUARDIAN_ARSENAL_STATS},passives:GUARDIAN_PASSIVE_DEFAULTS,overrides:guardianBalanceOverrides};',context,{timeout:1000});
  return JSON.parse(JSON.stringify(context.result));
}
const labels={
  duration:'Thời gian thi triển (giây)',cooldown:'Nghỉ sau chiêu (giây)',damage:'Sát thương mỗi đòn / mỗi lần trúng',damagePerSecond:'Sát thương mỗi giây',boltDamage:'Sát thương mỗi tia sét',
  count:'Số đợt / số vật thể',windup:'Chuẩn bị trước khi đánh (giây)',interval:'Khoảng cách giữa các đợt (giây)',speed:'Tốc độ di chuyển (m/giây)',homing:'Độ bám mục tiêu (lớn hơn = bám nhanh hơn)',life:'Thời gian tồn tại (giây)',radius:'Bán kính trúng đòn (m)',
  cloneHp:'Máu ảnh giả (HP)',warning:'Báo trước mỗi đòn (giây)',beamDuration:'Thời gian phun tia (giây)',tickInterval:'Nhịp gây sát thương (giây)',hp:'Máu vật thể có thể phá (HP)',gapWidth:'Bề rộng hành lang an toàn (m)',
  rushDuration:'Thời gian lao tới (giây)',returnDuration:'Thời gian quay về (giây)',boltStart:'Bắt đầu gọi sét (giây)',boltRadius:'Bán kính sét (m)',exposedDuration:'Thời gian lộ điểm yếu (giây)',returnStart:'Bắt đầu quay về (giây)',
  orbitSpeed:'Tốc độ vòng lốc (radian/giây)',travelAmplitude:'Biên độ di chuyển ngang của lốc (m)',damageReduction:'Tỉ lệ giảm sát thương (0–1)',reflection:'Tỉ lệ phản sát thương (0–1)',feathersPerLane:'Số lông mỗi làn mỗi đợt',sideOffset:'Độ lệch ngang mỗi đao (m)',
  warningStart:'Bắt đầu cảnh báo phía sau (giây)',reappearAt:'Thời điểm hiện hình (giây)',retreatAt:'Kết thúc tập kích tại chỗ (giây)',strikeAt:'Thời điểm đánh (giây)',controlDuration:'Thời gian khống chế (giây)',
  healRate:'Hồi mỗi giây / máu tối đa (0,01 = 1%)',rootCount:'Số đợt gọi rễ',waveCount:'Số đợt cây tấn công',detonateAfter:'Tinh thể nổ sau (giây)',shelterRadius:'Bán kính chỗ trú khi phá băng (m)',shelterDuration:'Chỗ trú khi phá băng tồn tại (giây)',freezeAt:'Thời điểm đóng băng toàn vùng (giây)',fixedShelterRadius:'Bán kính hai chỗ trú sẵn (m)',fixedShelterDuration:'Hai chỗ trú sẵn tồn tại (giây)',
  healthThreshold:'Mất bao nhiêu máu tối đa để tăng một đuôi (0–1)',tailCap:'Số đuôi bùng cháy tối đa',damagePerTail:'Tăng sát thương mỗi đuôi (0–1)',tideMin:'Mực nước thấp nhất (m)',tideAmplitude:'Biên độ thủy triều (m)',tideFrequency:'Tốc độ thủy triều (radian/giây)',slowPerLevel:'Làm chậm theo mỗi mét nước (0–1)',
  stackCount:'Số tầng cần để khống chế',stackDuration:'Thời gian giữ tầng (giây)',airborneReduction:'Giảm sát thương lúc bay (0–1)',vulnerability:'Hệ số sát thương khi lộ điểm yếu',shellReduction:'Giảm sát thương phần mai (0–1)',headMultiplier:'Hệ số sát thương đánh đầu',legMultiplier:'Hệ số sát thương đánh chân',toppleThreshold:'Sát thương vào chân / máu tối đa để làm ngã (0–1)',toppleDuration:'Thời gian ngã (giây)',toppleMultiplier:'Hệ số sát thương lúc ngã',hideCycle:'Chu kỳ ẩn thân (giây)',hideDuration:'Ẩn thân mỗi chu kỳ (giây)',lampRadius:'Bán kính đèn làm lộ boss (m)',healRadius:'Khoảng cách tới cỏ để hồi máu (m)'
};
Object.assign(labels,guardianMobaLabels);
const notes={
 'fox-homing':'Mỗi quả cầu gây một lần sát thương; có tự đuổi. Nội tại đuôi nhân thêm sát thương.',
 'fox-illusions':'Ba hình hồ gồm một bản thể và hai ảnh giả. Số đợt là số loạt bắn; chỉ hỏa cầu bản thể gây sát thương.',
 'fox-nine-pillars':'Mỗi cột nổ một lần; toàn bộ cột được báo từ đầu và nổ lần lượt. Chín cột là số gốc, có thể chỉnh.',
 'dragon-pressure':'Nhập sát thương mỗi giây, không phải mỗi nhịp. Nhịp chỉ chia nhỏ lượng sát thương.',
 'dragon-prison':'Sát thương mỗi nhịp khi bị nhốt. Người chơi vẫn có thể tấn công để phá lượng HP của bong bóng.',
 'dragon-tsunami':'Một lần sát thương khi sóng đi qua; né ngang vào hành lang xanh. Không có vùng đất cao.',
 'wolf-zigzag':'Sát thương một lần nếu đường lao ziczac chạm người chơi; số tầng tê liệt chỉnh ở nội tại.',
 'wolf-marks':'Mỗi dấu gọi một tia sét; thời gian báo trước tính riêng từ lúc mỗi dấu xuất hiện.',
 'wolf-tempest':'Sát thương lao tới và sát thương mỗi tia sét là hai ô riêng. Số đợt là số tia sét.',
 'eagle-crescents':'Mỗi đợt phóng ba lưỡi gió; sát thương nhập là cho một lưỡi trúng.',
 'eagle-dive':'Né cú bổ nhào mới làm boss choáng và lộ điểm yếu. Hệ số sát thương lúc yếu chỉnh ở nội tại.',
 'eagle-tornadoes':'Sát thương mỗi nhịp của từng lốc. Lốc có thể tồn tại sau khi boss hết thời gian thi triển.',
 'turtle-quake':'Sát thương mỗi vòng sóng đi qua; tốc độ là tốc độ lan bán kính sóng.',
 'turtle-rebound':'Tỉ lệ 0,35 = phản 35% sát thương gốc của đòn có thể phản; giảm sát thương là cơ chế khác.',
 'turtle-mountains':'Mỗi cột đá gây một lần sát thương; có khoảng trống giữa các cột.',
 'gold-feathers':'Sát thương mỗi lông; mỗi đợt bắn vào hai làn. Đòn xuyên khiên và kháng giáp.',
 'gold-hunt':'Một cú bổ nhào xuyên giáp. Sau khi đáp xuống luôn có khoảng lộ điểm yếu.',
 'gold-wingblades':'Hai đao; mỗi đao gây một lần sát thương và xuyên giáp. Ở giữa hai đao có khoảng trống để né.',
 'shadow-ambush':'Các mốc thời gian đều tính từ lúc bắt đầu chiêu. Có báo trước phía sau người chơi.',
 'shadow-pack':'Số đợt là số bóng sói; sát thương mỗi bóng khi chạm một lần.',
 'shadow-night':'Số đợt là số bóng sói trong màn đêm. Hai vòng đèn vẫn dùng để làm lộ boss.',
 'stag-vines':'Sát thương và thời gian trói của từng lần dây leo thực sự đánh trúng.',
 'stag-spirits':'Số vật thể là số mộc linh. Hồi máu tính trên máu tối đa mỗi giây của từng mộc linh; các nguồn cộng dồn.',
 'stag-forest':'Số vật thể gồm các mầm cây và một cỏ sinh mệnh ở cuối. Hồi máu trong dòng này áp dụng từng mầm; cỏ dùng tỉ lệ nội tại.',
 'tiger-claws':'Mỗi đợt là một cú vuốt. Ngưỡng và thời gian đóng băng do tích tầng chỉnh ở nội tại.',
 'tiger-crystals':'Sát thương mỗi tinh thể nổ. Phá đủ HP trước khi nổ sẽ đổi thành vùng trú ẩn.',
 'tiger-blizzard':'Sát thương mỗi nhịp ngoài nơi trú. Đóng băng toàn vùng có thời điểm và thời gian riêng; luôn có hai nơi trú sẵn.'
};
Object.assign(notes,guardianMobaNotes);
const integerKeys=new Set(['count','rootCount','waveCount','feathersPerLane','tailCap','stackCount']);
for(const key of ['maxCount','energyCap','chainCount','shardCount','seedCount','spiritCap','rageCap','speedCap','bounces'])integerKeys.add(key);
const damageLabels={'fox-homing':'Sát thương mỗi hỏa cầu','fox-illusions':'Sát thương hỏa cầu bản thể','fox-nine-pillars':'Sát thương mỗi cột lửa','dragon-prison':'Sát thương mỗi nhịp giam','dragon-tsunami':'Sát thương một lần sóng trúng','wolf-tempest':'Sát thương cú lao trong bão','eagle-crescents':'Sát thương mỗi lưỡi gió','eagle-tornadoes':'Sát thương mỗi nhịp / mỗi lốc','turtle-quake':'Sát thương mỗi vòng sóng','turtle-mountains':'Sát thương mỗi cột đá','gold-feathers':'Sát thương mỗi lông vũ','gold-wingblades':'Sát thương mỗi đao','shadow-pack':'Sát thương mỗi bóng sói','shadow-night':'Sát thương mỗi bóng sói','stag-spirits':'Sát thương mỗi lần rễ trúng','stag-forest':'Sát thương mỗi mầm / mỗi đợt','tiger-claws':'Sát thương mỗi cú vuốt','tiger-crystals':'Sát thương mỗi tinh thể nổ','tiger-blizzard':'Sát thương mỗi nhịp ngoài chỗ trú'};
const ratioKeys=new Set(['damageReduction','reflection','airborneReduction','shellReduction','healthThreshold','damagePerTail','slowPerLevel','toppleThreshold','healRate']);
for(const key of ['armorFraction','armorReduction','cooldownReduction','firstHitBonus','ragePerSpirit','slow','slowPerStack','speedPerCast','healFraction'])ratioKeys.add(key);
function limits(key){
 let min=0,max=3600,step='any';
 if(integerKeys.has(key)){min=1;max=30;step=1;}
 if(ratioKeys.has(key))max=1;
 if(['hp','cloneHp','radius','boltRadius','shelterRadius','fixedShelterRadius','lampRadius','healRadius'].includes(key)){min=.1;max=key.toLowerCase().includes('hp')?100000:12;}
 if(['duration','life','interval','tickInterval','rushDuration','returnDuration','beamDuration','stackDuration','hideCycle'].includes(key))min=.05;
 if(['healthThreshold','toppleThreshold'].includes(key))min=.001;
 if(['damage','boltDamage','damagePerSecond'].includes(key))max=100000;
 if(['speed','homing','orbitSpeed'].includes(key))max=100;
 if(['vulnerability','headMultiplier','legMultiplier','toppleMultiplier'].includes(key))max=10;
 if(key==='gapWidth'){min=1;max=5;}
 if(key==='sideOffset'){min=.5;max=5;}
 if(key==='tailCap')max=9;
 if(key==='feathersPerLane')max=15;
 if(key==='travelAmplitude')max=5.5;
 if(/Damage$|Dps$/.test(key))max=100000;
 if(['moveSpeed','returnSpeed','gustSpeed','pullSpeed','pushSpeed','windSpeed'].includes(key))max=100;
 if(['growth','lifeBoost','speedBoost','linkMultiplier'].includes(key))max=10;
 if(/Radius$|Range$|Width$/.test(key))max=key==='waveWidth'?80:40;
 if(['energyDistance','puddleInterval','spiritInterval','windInterval','rootInterval','stationaryTime','hideAfter','freezeImmunity'].includes(key))min=.05;
 if(key==='gapWidth'){min=1;max=5;}
 return {min,max,step};
}
export function guardianBalanceDocument(source){
 const {skills,passives,overrides}=readGuardianBalance(source),rows=[],elements=[];
 for(const [id,design] of Object.entries(GUARDIAN_BOSS_DESIGNS)){
  const beast=GUARDIAN_FORMS[id].name;elements.push({id,name:beast,color:design.color});
  for(const [key,name,defaults,kind] of [...design.skills.map(s=>[s.type,s.name,skills[s.type],'skill']),['passive:'+id,design.passive,passives[id],'passive']]){
   const columns={cooldown:[],mana:[],control:[],damage:[],shield:[],duration:[]},extra=[];
   for(const [field,value] of Object.entries(defaults)){
    if(!labels[field])throw Error('Chưa mô tả chỉ số '+field);
    const f={key:field,label:field==='damage'?(damageLabels[key]||labels[field]):labels[field],value:overrides[key]?.[field]??value,showLabel:true,...limits(field)};
    const column=field==='cooldown'?'cooldown':field==='controlDuration'?'control':['damage','damagePerSecond','boltDamage'].includes(field)?'damage':['hp','cloneHp'].includes(field)?'shield':field==='duration'?'duration':null;
    if(column)columns[column].push(f);else extra.push(f);
   }
   rows.push({id:key,name,beast,element:id,elementName:beast,color:design.color,rank:kind==='passive'?'Nội tại':'Kỹ năng',kind,columns,extra,defaults,
    note:design.skills.find(s=>s.type===key)?.description||notes[key]||'Nội tại và thông số di chuyển trong góc nhìn thứ ba.',description:kind==='passive'?design.counter:design.skills.find(s=>s.type===key)?.description||notes[key]});
  }
 }
 return {version:1,kind:'guardian-skills',revision:revisionOf(source),elements,overrides,rows};
}
function validateRelations(id,s){
 const require=(ok,message)=>{if(!ok)throw Error(id+': '+message);};
 if(Object.hasOwn(GUARDIAN_ARSENAL_STATS,id))require(s.windup<s.duration,'thời gian thi triển phải đủ động tác chuẩn bị.');
 if(s.beamDuration!==undefined)require(s.windup+s.beamDuration<=s.duration+1e-8,'thời gian thi triển phải đủ chuẩn bị và phun tia.');
 if(['wolf-dashes','shadow-dashes'].includes(id))require(s.windup+(s.count-1)*s.interval+s.rushDuration<=s.duration+1e-8,'phải đủ thời gian cho tất cả lần lao.');
 if(id==='eagle-dive')require(s.windup+s.rushDuration<=s.duration,'phải đủ thời gian bay và đáp.');
 if(id==='wolf-clones')require(s.returnAt<s.life,'phân thân phải còn thời gian quay về.');
 if(id==='shadow-clones')require(s.attackAt+s.warning<s.life,'phân thân phải kịp chuẩn bị và tấn công.');
 if(id==='gold-swords')require(s.windup+s.life<=s.duration,'phải đủ thời gian khép vòng kiếm.');
 if(id==='tiger-blizzard')require(s.windup+s.life<=s.duration,'phải đủ thời gian bão tuyết và vụ nổ cuối.');
 if(id==='fox-pillars')require(s.count<=s.maxCount,'số cột cơ bản không vượt số tối đa.');
 if(id==='turtle-ram')require(s.windup<s.duration,'phải còn thời gian lao sau chuẩn bị.');
 if(['eagle-blades','gold-feathers','gold-arcs','tiger-claws','dragon-tsunami','fox-firestorm'].includes(id))require((s.windup||0)+(s.count-1)*s.interval<s.duration+1e-8,'phải đủ thời gian phát tất cả các đợt.');
}
export function updateGuardianSource(source,overrides){
 if(!overrides||typeof overrides!=='object'||Array.isArray(overrides))throw Error('Dữ liệu bảng không hợp lệ.');
 const doc=guardianBalanceDocument(source),allowed=new Map(doc.rows.map(r=>[r.id,r])),clean={};
 for(const [id,values] of Object.entries(overrides)){
  const row=allowed.get(id);if(!row||!values||typeof values!=='object'||Array.isArray(values))throw Error('Kỹ năng không hợp lệ: '+id);
  const fields=new Map([...Object.values(row.columns).flat(),...row.extra].map(f=>[f.key,f])),result={};
  for(const [key,value] of Object.entries(values)){
   const field=fields.get(key);
   if(!field||typeof value!=='number'||!Number.isFinite(value)||value<field.min||value>field.max||(field.step===1&&!Number.isInteger(value)))throw Error('Giá trị không hợp lệ: '+row.name+' / '+(field?.label||key));
   if(value!==row.defaults[key])result[key]=value;
  }
  validateRelations(id,{...row.defaults,...result});if(Object.keys(result).length)clean[id]=result;
 }
 const start=source.indexOf(START),end=source.indexOf(END);if(start<0||end<start)throw Error('Không tìm thấy vùng dữ liệu cân bằng linh thú.');
 return source.slice(0,start+START.length)+JSON.stringify(clean,null,2)+source.slice(end);
}
