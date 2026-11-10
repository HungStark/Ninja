const $=id=>document.getElementById(id),API=document.body.dataset.balanceApi||'/balance/api',KIND=document.body.dataset.balanceKind||'spells',UNIT=document.body.dataset.balanceUnit||'chiêu',DRAFT_KEY=KIND==='spells'?'cuu-an.balance-draft.v1':'cuu-an.guardian-draft.v1';
let data,values={},saved={},busy=false;
const copy=v=>JSON.parse(JSON.stringify(v)),equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fold=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
function status(message,error=false){$('status').textContent=message;$('status').classList.toggle('error',error);}
function effective(row,overrides){return {...row.defaults,...overrides[row.id]};}
function changed(row){return !equal(effective(row,values),effective(row,saved));}
function storeDraft(){try{localStorage.setItem(DRAFT_KEY,JSON.stringify({revision:data.revision,overrides:values}));}catch{status('Không lưu được bản nháp trên trình duyệt. Bạn vẫn có thể lưu vào dự án hoặc xuất JSON.',true);}}
function update(){
  const count=data.rows.filter(changed).length;
  $('changeCount').textContent=count?count+' / '+data.rows.length+' '+UNIT+' chưa lưu':'Đã đồng bộ với dự án';
  $('save').disabled=busy||!count||!!document.querySelector('input.numeric:invalid');
  $('discard').disabled=busy||!count;$('reset').disabled=busy;
  for(const control of document.querySelectorAll('.numeric,.row-reset,#import'))control.disabled=busy;
  for(const tr of $('rows').children)tr.classList.toggle('modified',changed(data.rows.find(r=>r.id===tr.dataset.id)));
  filter();
}
function filter(){
  const term=fold($('search').value.trim()),element=$('element').value;let count=0;
  for(const tr of $('rows').children){const row=data.rows.find(r=>r.id===tr.dataset.id);tr.hidden=(element!=='all'&&row.element!==element)||($('rowKind')&&$('rowKind').value!=='all'&&row.kind!==$('rowKind').value)||(term&&!fold(row.name+' '+row.id+' '+(row.beast||'')).includes(term))||($('changedOnly').checked&&!changed(row));if(!tr.hidden)count++;}
  $('visibleCount').textContent=count+' / '+data.rows.length+' '+UNIT;$('empty').hidden=count!==0;
}
function setValue(row,key,value){
  values[row.id]??={};
  if(equal(value,row.defaults[key]))delete values[row.id][key];else values[row.id][key]=value;
  if(!Object.keys(values[row.id]).length)delete values[row.id];
}
function makeField(row,field){
  const wrap=document.createElement('div');wrap.className='field';
  const isArray=Array.isArray(field.value),current=effective(row,values)[field.key];
  if(field.showLabel||isArray||['captureDamage','fallDamage','upgradeDamage','growthTime','snowTime'].includes(field.key)){
    const label=document.createElement('span');label.className='field-label';label.textContent=field.label;wrap.append(label);
  }
  const inputs=document.createElement('div');inputs.className=isArray?'array':'single';
  for(const [index,value]of (isArray?current:[current]).entries()){
    const label=document.createElement('label');
    if(isArray){const caption=document.createElement('span');caption.className='array-label';caption.textContent=(index+1)+' tầng';label.append(caption);}
    const input=document.createElement('input');input.type='number';input.className='numeric';input.min=field.min;input.max=field.max;input.step=field.step;input.required=true;input.value=value;
    input.dataset.key=field.key;input.dataset.index=index;input.setAttribute('aria-label',row.name+' — '+field.label+(isArray?' — '+(index+1)+' tầng':''));
    input.classList.toggle('changed',!equal(value,isArray?row.defaults[field.key][index]:row.defaults[field.key]));
    input.addEventListener('input',()=>{
      if(input.validity.valid){
        const next=Number(input.value);
        if(isArray){const array=[...effective(row,values)[field.key]];array[index]=next;setValue(row,field.key,array);}else setValue(row,field.key,next);
        input.classList.toggle('changed',!equal(next,isArray?row.defaults[field.key][index]:row.defaults[field.key]));storeDraft();
        status('Bản nháp đã giữ trên trình duyệt. Bấm “Lưu vào dự án” để áp dụng.');
      }else status('Có ô trống hoặc ngoài giới hạn. Sửa các ô viền đỏ trước khi lưu.',true);
      update();
    });label.append(input);inputs.append(label);
  }
  wrap.append(inputs);return wrap;
}
function render(){
  $('rows').replaceChildren();
  for(const row of data.rows){
    const tr=document.createElement('tr');tr.dataset.id=row.id;
    const name=document.createElement('td'),title=document.createElement('div');title.className='spell-name';title.textContent=row.name;
    const meta=document.createElement('div');meta.className='spell-meta';
    const element=document.createElement('span');element.className='element';element.style.setProperty('--element',row.color);element.textContent=row.elementName;
    const rank=document.createElement('span');rank.className='rank';rank.textContent=row.rank;
    const id=document.createElement('span');id.textContent=row.id;meta.append(element,rank,id);name.append(title,meta);tr.append(name);
    for(const fields of Object.values(row.columns)){
      const td=document.createElement('td');
      if(fields.length)for(const field of fields)td.append(makeField(row,field));
      else{const dash=document.createElement('span');dash.className='dash';dash.textContent='—';td.append(dash);}tr.append(td);
    }
    const note=document.createElement('td');note.className='note';
    if(row.note){const p=document.createElement('p');p.textContent=row.note;note.append(p);}
    const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent=row.extra.length?'Chi tiết & chỉ số bổ sung':'Mô tả gốc';details.append(summary);
    const original=document.createElement('p');original.textContent='Mô tả tại chỉ số gốc: '+row.description;details.append(original);
    if(row.extra.length){const extra=document.createElement('div');extra.className='extra';for(const field of row.extra){const label=document.createElement('div');label.textContent=field.showLabel?'':field.label;label.append(makeField(row,field));extra.append(label);}details.append(extra);}
    note.append(details);
    const reset=document.createElement('button');reset.className='row-reset';reset.textContent='Về chỉ số gốc';reset.setAttribute('aria-label','Khôi phục '+row.name);reset.onclick=()=>{delete values[row.id];storeDraft();render();status(row.name+': đã đưa về chỉ số gốc trong bản nháp.');};note.append(reset);tr.append(note);$('rows').append(tr);
  }
  update();
}
async function load(){
  const response=await fetch(API);if(!response.ok)throw Error('Không đọc được dữ liệu dự án.');data=await response.json();saved=copy(data.overrides);values=copy(saved);
  for(const el of data.elements){const option=document.createElement('option');option.value=el.id;option.textContent=el.name;$('element').append(option);}
  let draft;try{draft=JSON.parse(localStorage.getItem(DRAFT_KEY));}catch{}
  if(draft?.revision===data.revision&&draft.overrides){validateImport(draft.overrides);values=draft.overrides;status('Đã khôi phục bản nháp trên trình duyệt. Chưa lưu thay đổi vào dự án.');}
  else status(draft?'Dự án đã thay đổi; bảng đang dùng dữ liệu mới nhất. Bản nháp cũ chưa được áp dụng.':'Đã nạp đủ '+data.rows.length+' '+UNIT+'. Sửa các ô số để bắt đầu.');
  render();
}
function validateImport(overrides){
  if(!overrides||typeof overrides!=='object'||Array.isArray(overrides))throw Error('File JSON không đúng định dạng.');
  for(const [id,entry]of Object.entries(overrides)){
    const row=data.rows.find(r=>r.id===id);if(!row||!entry||typeof entry!=='object'||Array.isArray(entry))throw Error('Mã chiêu không hợp lệ: '+id);
    const fields=[...Object.values(row.columns).flat(),...row.extra];
    for(const [key,value]of Object.entries(entry)){
      const field=fields.find(f=>f.key===key),baseline=row.defaults[key];
      if(!field||Array.isArray(value)!==Array.isArray(baseline)||(Array.isArray(value)&&value.length!==baseline.length)||(Array.isArray(value)?value:[value]).some(n=>typeof n!=='number'||!Number.isFinite(n)||n<field.min||n>field.max||(field.step===1&&!Number.isInteger(n))))throw Error('Chỉ số không hợp lệ: '+id+'.'+key);
    }
  }
}
$('save').onclick=async()=>{
  if(document.querySelector('input.numeric:invalid'))return;busy=true;update();$('save').textContent='Đang lưu…';status('Đang lưu và đồng bộ bản tiếng Việt / tiếng Anh…');
  try{const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:data.revision,overrides:values})});const result=await response.json();if(!response.ok)throw Error(result.error);data=result;saved=copy(data.overrides);values=copy(saved);localStorage.removeItem(DRAFT_KEY);render();status('Đã lưu vào dự án. Tải lại tab game để thử; bản build tiếp theo sẽ dùng các chỉ số này.');}
  catch(error){status(error.message,true);}finally{busy=false;$('save').textContent='Lưu vào dự án';update();}
};
$('discard').onclick=()=>{values=copy(saved);localStorage.removeItem(DRAFT_KEY);render();status('Đã bỏ bản nháp, trở lại các chỉ số đang lưu trong dự án.');};
$('reset').onclick=()=>$('confirm').showModal();
$('confirm').addEventListener('close',()=>{if($('confirm').returnValue==='restore'){values={};storeDraft();render();status('Đã khôi phục chỉ số gốc trong bản nháp. Bấm “Lưu vào dự án” để áp dụng.');}});
for(const id of ['search','element','changedOnly'])$(id).addEventListener('input',filter);
if($('rowKind'))$('rowKind').addEventListener('input',filter);
$('export').onclick=()=>{const blob=new Blob([JSON.stringify({version:1,kind:KIND,overrides:values},null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=KIND==='spells'?'cuu-an-can-bang.json':'cuu-an-linh-thu.json';a.click();URL.revokeObjectURL(url);status('Đã xuất bản nháp ra JSON.');};
$('import').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>128000)throw Error('File quá lớn.');const imported=JSON.parse(await file.text());if(imported.version!==1)throw Error('Phiên bản file không được hỗ trợ.');if((KIND!=='spells'&&imported.kind!==KIND)||(imported.kind&&imported.kind!==KIND))throw Error('File JSON thuộc bảng cân bằng khác.');validateImport(imported.overrides);values=copy(imported.overrides);storeDraft();render();status('Đã nhập vào bản nháp. Bấm “Lưu vào dự án” để áp dụng.');}catch(error){status(error.message,true);}finally{event.target.value='';}};
window.addEventListener('beforeunload',event=>{if(data&&data.rows.some(changed)){event.preventDefault();event.returnValue='';}});
load().catch(error=>status(error.message,true));
