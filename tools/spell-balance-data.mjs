import vm from 'node:vm';
import {createHash} from 'node:crypto';

export const START='/* spell-balance:start */',END='/* spell-balance:end */';
export const revisionOf=source=>createHash('sha256').update(source).digest('hex');
export function readCore(source){const context={};vm.runInNewContext(source,context,{timeout:1000});return JSON.parse(JSON.stringify(context.SealGameCore));}
const field=(spell,key,label,options={})=>({key,label,value:spell[key],min:0,max:100000,step:'any',...options});

export function describeSpell(spell,elements){
  const f=(key,label,options)=>field(spell,key,label,options),columns={
    cooldown:[f('cooldown','Hồi chiêu (giây)',{max:3600})],
    mana:[f('cost','Mana tiêu hao')],control:[],damage:[],shield:[],duration:[]
  },extra=[];
  if(spell.ignitionDamages)columns.damage.push(f('ignitionDamages','Sát thương theo 1–5 tầng bỏng'));
  else if(spell.style==='earthgravity')columns.damage.push(f('captureDamage','Khi giam'),f('fallDamage','Khi rơi'));
  else if(spell.damage>0&&spell.style!=='shadowcommand')columns.damage.push(f('damage','Sát thương gốc'));
  if(spell.upgradeDamage)columns.damage.push(f('upgradeDamage','Bò bóng'));
  if(spell.stunDurations)columns.control.push(f('stunDurations','Choáng theo 1–3 tĩnh điện',{max:3600}));
  else if(spell.controlDuration!==undefined)columns.control.push(f('controlDuration','Khống chế (giây)',{max:3600}));
  else if(['aircombo','shadowbind'].includes(spell.style))columns.control.push(f('duration','Khống chế (giây)',{min:.05,max:3600}));
  else if(spell.style==='earthgravity')columns.control.push(f('holdTime','Giam giữ (giây)',{max:3600}));
  if(spell.shield>0)columns.shield.push(f('shield','Độ bền khiên / tường'));
  if(spell.duration!==undefined&&!['aircombo','shadowbind'].includes(spell.style))columns.duration.push(f('duration','Hiệu lực (giây)',{min:.05,max:3600}));
  if(spell.growthTime)columns.duration.push(f('growthTime','Cây trưởng thành (giây)',{min:3,max:3600}));
  if(spell.snowTime)extra.push(f('snowTime','Giới hạn tuyết tích lũy',{min:45,max:90}));
  if(spell.snowCost)extra.push(f('snowCost','Tuyết tiêu hao mỗi lần',{min:1,max:90}));
  if(spell.snowMultiplier)extra.push(f('snowMultiplier','Hệ số tốc độ tích tuyết',{min:1,max:10}));
  if(spell.slowPerSnow!==undefined)extra.push(f('slowPerSnow','Làm chậm mỗi tuyết (0,005 = 0,5%)',{max:.005}));
  if(spell.magneticDurations)extra.push(f('magneticDurations','Từ tính theo 1–3 tĩnh điện (giây)',{max:3600}));
  if(spell.amplification)extra.push(f('amplification','Hệ số khuếch đại laser',{max:100}));
  if(spell.slowFactor!==undefined)extra.push(f('slowFactor','Tốc độ đạn còn lại (0–1)',{max:1}));
  const notes={
    volley:'Mỗi viên gây sát thương đã nhập; bắn 3 viên.',
    ignite:'5 ô lần lượt ứng với 1 / 2 / 3 / 4 / 5 tầng bỏng. Không phải sát thương cộng thêm mỗi tầng.',
    waterbubbles:'Sát thương mỗi quả; 4 quả. Đổi hiệu lực sẽ đổi khoảng thời gian các quả nổ.',
    discharge:'3 ô lần lượt ứng với 1 / 2 / 3 tĩnh điện. Từ tính chỉnh ở mục chi tiết.',
    stormfield:'Chống chịu bằng làm chậm đạn, không có máu khiên. Chỉnh hệ số ở mục chi tiết.',
    aircombo:'Sát thương tổng của 8 nhát; thời gian giữ thêm sau lốc.',
    windspirit:'Phản chiêu từ phía trước; không có độ bền bằng máu.',
    earthquake:'Sát thương mỗi đợt; có 5 đợt.',
    earthgravity:'Tổng sát thương = khi giam + khi rơi. Khống chế là thời gian giam; còn các pha kéo và rơi.',
    lightray:'Sát thương laser thường; qua tinh cầu nhân với hệ số của Huyễn Quang Tinh Cầu.',
    lightsphere:'Không có máu khiên; khuếch đại laser. Chỉnh hệ số ở mục chi tiết.',
    lightdome:'Sát thương mỗi giây của mỗi laser nảy trong vòm; nhiều laser cộng dồn.',
    shadowclone:'Ô trên: chó bóng; ô dưới: bò bóng. Đòn U Ảnh Tuyệt Sát dùng các giá trị này.',
    shadowcommand:'Sát thương lấy từ chó / bò đã triệu hồi bằng U Minh Phân Ảnh.',
    shadowbind:'Chỉ khống chế trong lãnh địa. Vẫn gây sát thương khi ở ngoài.',
    shadowdive:'Chống chịu bằng miễn nhiễm trong thời gian hiệu lực, không có máu khiên.',
    domain:'Hiệu lực của lãnh địa; không trực tiếp gây sát thương.',
    flowerpoison:'Sát thương tổng gốc trong 6 giây (mỗi giây = giá trị / 6); tăng tới ×3 theo cây.',
    vinebind:'Cây trưởng thành: sát thương tới ×3, khống chế cộng tối đa 4 giây.',
    bamboostab:'Sát thương tổng của lá tre, không phải mỗi lá; cây trưởng thành tăng tới ×3.',
    walnutwall:'Cây trưởng thành: độ bền tới ×3, thời gian cộng tối đa 2 giây.',
    woodseed:'Một lần mỗi trận; thời gian tính từ lúc gieo tới khi cây trưởng thành.',
    snowball:'Tiêu hao 45 tuyết; gây sát thương một lần rồi vỡ khi chạm, không cuốn đối thủ. Tuyết vẫn rơi, chỉ gom một phần tuyết gần cầu.',
    blizzard:'Cần đã gọi tuyết. Tăng tốc độ tích tuyết ×2 trong thời gian hiệu lực; tuyết dày, nhanh và xiên hơn. Không tạo khiên hay tường.',
    snowstorm:'Một lần mỗi trận; tích tối đa 90 tuyết. Mỗi tuyết làm đối thủ chậm 0,5%, tối đa 45%. Tuyết tiếp tục tích sau khi dùng Tuyết táng.',
    icefog:'Chống chịu bằng ẩn thân và tạo ảo ảnh; không có máu khiên.'
  };
  return {id:spell.id,name:spell.name,element:spell.element,elementName:elements.find(e=>e.id===spell.element).name,color:spell.color,rank:spell.rank,columns,extra,note:notes[spell.style]||'',description:spell.subtitle};
}

export function balanceDocument(source){
  const core=readCore(source);
  return {revision:revisionOf(source),elements:core.elements,overrides:core.spellBalanceOverrides,
    rows:core.spells.map((spell,i)=>{
      const row=describeSpell(spell,core.elements),baseline=describeSpell(core.balanceDefaults[i],core.elements);
      // Which cells can be edited always follows the original mechanics, even at zero.
      for(const column of Object.keys(baseline.columns))row.columns[column]=baseline.columns[column].map(f=>({...f,value:spell[f.key]}));
      row.extra=baseline.extra.map(f=>({...f,value:spell[f.key]}));row.defaults=Object.fromEntries([...Object.values(baseline.columns).flat(),...baseline.extra].map(f=>[f.key,f.value]));row.description=core.balanceDefaults[i].subtitle;
      return row;
    })};
}

export function updatedSource(source,overrides){
  if(!overrides||typeof overrides!=='object'||Array.isArray(overrides))throw Error('Dữ liệu bảng không hợp lệ.');
  const document=balanceDocument(source),allowed=new Map(document.rows.map(row=>[row.id,row])),clean={};
  for(const [id,values]of Object.entries(overrides)){
    const row=allowed.get(id);if(!row||!values||typeof values!=='object'||Array.isArray(values))throw Error('Chiêu không hợp lệ: '+id);
    const fields=new Map([...Object.values(row.columns).flat(),...row.extra].map(f=>[f.key,f])),result={};
    for(const [key,value]of Object.entries(values)){
      const f=fields.get(key);if(!f)throw Error('Chỉ số không được phép: '+id+'.'+key);
      const expected=row.defaults[key],numbers=Array.isArray(value)?value:[value];
      if(Array.isArray(expected)!==Array.isArray(value)||(Array.isArray(expected)&&expected.length!==value.length)||numbers.some(n=>typeof n!=='number'||!Number.isFinite(n)||n<f.min||n>f.max))throw Error('Giá trị không hợp lệ: '+row.name+' / '+f.label);
      if(JSON.stringify(value)!==JSON.stringify(expected))result[key]=value;
    }
    if(Object.keys(result).length)clean[id]=result;
  }
  const start=source.indexOf(START),end=source.indexOf(END);
  if(start<0||end<start)throw Error('Không tìm thấy vùng dữ liệu cân bằng trong game-core.js.');
  return source.slice(0,start+START.length)+JSON.stringify(clean,null,2)+source.slice(end);
}
