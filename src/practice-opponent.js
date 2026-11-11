import {GUARDIAN_FORMS} from './guardian-beasts.js';
import {REGIONS} from './adventure-world.js';
import {botHealth,PRACTICE_BOT_HP} from './enemy-balance.js';
import {spellImage} from './spell-art.js';
import {configureOpponent} from './opponent-balance.js';
import {GUARDIAN_BOSS_DESIGNS} from './guardian-boss-designs.js';
import {GUARDIAN_BOSS_DESIGNS as LEGACY_DESIGNS} from './guardian-legacy-designs.js';

export const PRACTICE_GUARDIANS=['fire','water','lightning','wind','earth','light','dark','wood','ice'];
export function validPracticeOpponent(value,spells){
  return value?.type==='guardian'?PRACTICE_GUARDIANS.includes(value.guardian):value?.type==='ninja'&&Array.isArray(value.spells)&&value.spells.length===5&&new Set(value.spells).size===5&&value.spells.every(id=>spells.some(s=>s.id===id));
}
export function practiceOpponentEncounter(value,spells){
  if(!validPracticeOpponent(value,spells))throw new RangeError('Chọn đúng 5 chiêu hoặc một linh thú hộ vệ.');
  if(value.type==='ninja')return configureOpponent({kind:'practice-ninja',name:'Ninja tập luyện',hp:PRACTICE_BOT_HP,element:spells.find(s=>s.id===value.spells[0]).element,spellIds:[...value.spells],balancePractice:true});
  const id=value.guardian,spellIds=spells.filter(s=>s.element===id).map(s=>s.id);
  return configureOpponent({kind:'boss',beastOnly:true,guardianForm:'beast',village:id,element:id,name:GUARDIAN_FORMS[id].name,guardianName:GUARDIAN_FORMS[id].name,hp:botHealth(REGIONS[id].boss.hp),phases:id==='dark'?3:2,spellIds,phaseSpellIds:spellIds,damageMultiplier:1,balancePractice:true});
}

export function createPracticeOpponentPicker({spells,elements,defaultLoadout,getLearnedSpells,renderSpell,onConfirm,onBack,getThirdPerson=()=>true}){
  let value={type:'ninja',spells:[...defaultLoadout],guardian:'fire'},filter='all',learning='all',open=false;
  const root=document.createElement('section');root.id='practiceOpponentScreen';root.className='overlay hidden';root.tabIndex=-1;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','TẬP LUYỆN · CHỌN ĐỐI THỦ');
  root.innerHTML=`<div class="scroll-book"><div class="scroll-roller scroll-roller-left" aria-hidden="true"></div><div class="scroll-roller scroll-roller-right" aria-hidden="true"></div><div class="scroll-paper">
    <div class="scroll-heading"><button id="practiceOpponentBack" type="button" class="adventure-back">← Trở lại</button><nav class="practice-opponent-types" role="tablist" aria-label="TẬP LUYỆN · CHỌN ĐỐI THỦ"><button id="practiceNinjaTab" type="button" role="tab" data-practice-type="ninja" aria-controls="practiceNinjaSetup">Ninja</button><button id="practiceGuardianTab" type="button" role="tab" data-practice-type="guardian" aria-controls="practiceGuardianSetup">Linh thú</button></nav></div>
    <div class="scroll-body"><div id="practiceNinjaSetup" class="catalog-pane" role="tabpanel" aria-labelledby="practiceNinjaTab"><nav id="practiceEnemyFilters" aria-label="Lọc hệ chiêu của đối thủ"></nav><div class="kind-filters"><button type="button" data-practice-kind="all">Tất cả chiêu</button><button type="button" data-practice-kind="learned">Đã học</button><button type="button" data-practice-kind="unlearned">Chưa học</button><button id="practiceEnemySelectElement" type="button" hidden>Chọn hết</button></div><div id="practiceEnemySpells"></div></div>
    <div id="practiceGuardianSetup" class="catalog-pane" role="tabpanel" aria-labelledby="practiceGuardianTab" hidden><div id="practiceGuardianChoices"></div></div>
    <aside class="loadout-pane"><div id="practiceNinjaLoadout"><div class="eyebrow">BỘ CHIÊU CỦA ĐỐI THỦ <span id="practiceEnemyCount"></span></div><div class="loadout-actions"><button id="practiceEnemyClear" type="button">Bỏ hết</button></div><div id="practiceEnemySlots"></div></div><div id="practiceGuardianLoadout" hidden><div class="eyebrow">HỆ LINH THÚ</div><div id="practiceGuardianSelected"></div></div><p id="practiceEnemyNotice" role="status" aria-live="polite"></p><button id="practiceOpponentConfirm" type="button" class="primary">VÀO TRẬN <span>→</span></button></aside></div>
  </div></div>`;
  document.body.append(root);const $=id=>root.querySelector('#'+id);
  function close(){open=false;root.classList.add('hidden');root.querySelector('.scroll-book').classList.remove('is-open');document.getElementById('startScreen').inert=false;}
  function render(){
    const ninja=value.type==='ninja';
    for(const button of root.querySelectorAll('[data-practice-type]')){const active=button.dataset.practiceType===value.type;button.setAttribute('aria-selected',String(active));button.classList.toggle('active',active);button.tabIndex=active?0:-1;}
    $('practiceNinjaSetup').hidden=$('practiceNinjaLoadout').hidden=!ninja;$('practiceGuardianSetup').hidden=$('practiceGuardianLoadout').hidden=ninja;
    $('practiceEnemyCount').textContent=value.spells.length+' / 5';$('practiceOpponentConfirm').disabled=!validPracticeOpponent(value,spells);$('practiceEnemyClear').disabled=!value.spells.length;
    $('practiceEnemyNotice').textContent=ninja&&value.spells.length!==5?'Chọn đúng 5 chiêu cho đối thủ.':'';
    $('practiceEnemySlots').innerHTML=Array.from({length:5},(_,i)=>{const s=spells.find(s=>s.id===value.spells[i]);return s?'<button type="button" class="loadout-slot filled" data-practice-remove="'+s.id+'" style="--element:'+s.color+'" title="Bỏ '+s.name+'"><b>'+spellImage(s)+'</b><span>'+s.name+'<small>'+(s.kind==='attack'?'Tấn công':'Phòng ngự')+'</small></span><i>×</i></button>':'<div class="loadout-slot empty"><b>'+(i+1)+'</b><span>Ô chiêu trống</span></div>';}).join('');
    $('practiceEnemyFilters').innerHTML=[{id:'all',name:'Tất cả'},...elements].map(e=>'<button type="button" data-practice-filter="'+e.id+'" class="'+(filter===e.id?'active':'')+'" aria-pressed="'+(filter===e.id)+'">'+(e.glyph?'<b>'+e.glyph+'</b> ':'')+e.name+'</button>').join('');
    for(const button of root.querySelectorAll('[data-practice-kind]'))button.classList.toggle('active',button.dataset.practiceKind===learning);
    $('practiceEnemySelectElement').hidden=filter==='all';
    const learned=getLearnedSpells(),visible=spells.filter(s=>(filter==='all'||s.element===filter)&&(learning==='all'||learned.has(s.id)===(learning==='learned')));
    $('practiceEnemySpells').innerHTML=visible.length?visible.map((s,i)=>renderSpell(s,i,value.spells).replace('data-equip=','data-practice-spell=')).join(''):'<p class="catalog-empty" role="status">'+(learning==='unlearned'?'Không có chiêu chưa học.':'Chưa có chiêu đã học.')+'</p>';
    $('practiceGuardianChoices').innerHTML=PRACTICE_GUARDIANS.map(id=>{const e=elements.find(e=>e.id===id);return '<button type="button" data-practice-guardian="'+id+'" aria-pressed="'+(value.guardian===id)+'" style="--element:'+e.color+'"><b>'+e.glyph+'</b><strong>'+e.name+'</strong><span class="equip-mark" aria-hidden="true">'+(value.guardian===id?'✓':'+')+'</span></button>';}).join('');
    const e=elements.find(e=>e.id===value.guardian),design=(getThirdPerson()?GUARDIAN_BOSS_DESIGNS:LEGACY_DESIGNS)[value.guardian];
    $('practiceGuardianSelected').innerHTML='<div class="practice-guardian-selected" style="--element:'+e.color+'"><b>'+e.glyph+'</b><strong>'+GUARDIAN_FORMS[value.guardian].name+'</strong></div><div class="guardian-tactics">'+(design.title?'<p>'+design.title+' · '+design.role+'</p>':'')+'<p>'+('★'.repeat(design.difficulty)+'☆'.repeat(5-design.difficulty))+' · '+design.passive+'</p><ol>'+design.skills.map(s=>'<li>'+s.name+'</li>').join('')+'</ol><p>'+design.counter+'</p></div>';
  }
  root.addEventListener('click',event=>{
    if(!open)return;
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.practiceType){value.type=button.dataset.practiceType;render();}
    else if(button.dataset.practiceFilter){filter=button.dataset.practiceFilter;render();}
    else if(button.dataset.practiceKind){learning=button.dataset.practiceKind;render();}
    else if(button.dataset.practiceGuardian){value.guardian=button.dataset.practiceGuardian;render();}
    else if(button.dataset.practiceRemove){value.spells=value.spells.filter(id=>id!==button.dataset.practiceRemove);render();}
    else if(button.dataset.practiceSpell){const id=button.dataset.practiceSpell;if(value.spells.includes(id))value.spells=value.spells.filter(s=>s!==id);else if(value.spells.length<5)value.spells.push(id);render();}
  });
  root.querySelector('.practice-opponent-types').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();value.type=event.key==='Home'?'ninja':event.key==='End'?'guardian':value.type==='ninja'?'guardian':'ninja';render();root.querySelector('[data-practice-type="'+value.type+'"]').focus();});
  $('practiceEnemySelectElement').onclick=()=>{if(open&&filter!=='all'){value.spells=spells.filter(s=>s.element===filter).slice(0,5).map(s=>s.id);learning='all';render();}};
  $('practiceEnemyClear').onclick=()=>{if(open){value.spells=[];render();}};
  $('practiceOpponentBack').onclick=()=>{if(open){close();onBack();}};
  $('practiceOpponentConfirm').onclick=event=>{if(!open||!validPracticeOpponent(value,spells))return;close();onConfirm(event);};
  return {get open(){return open;},value:()=>({...value,spells:[...value.spells]}),close,show(){render();open=true;document.getElementById('startScreen').inert=true;root.classList.remove('hidden');requestAnimationFrame(()=>{if(open){root.querySelector('.scroll-book').classList.add('is-open');root.focus({preventScroll:true});}});}};
}
