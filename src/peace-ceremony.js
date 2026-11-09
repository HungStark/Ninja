import {heroPortrait} from './hero-portrait.js';
import {villagerPortrait} from './villager-portrait.js';
import {villagerAppearance} from './villager-appearance.js';
import {signaturePaths} from './peace-treaties.js';
import {gameAudio} from './game-audio.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createPeaceCeremony(){
 const root=document.createElement('section');root.id='peaceCeremony';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Ký kết hiệp ước hòa bình');document.body.append(root);
 let active=false,age=0,sealed=false,region=null,onSeal=null,onFinish=null,editing=false,draft=null,returnFocus=null;
 function seal(){if(sealed)return;sealed=true;onSeal?.(draft);gameAudio.tone(130,.15,'triangle',.055);}
 function finish(){if(!active||editing)return;seal();active=false;root.hidden=true;onFinish?.();}
 function focusTrap(event){if(!active||event.key!=='Tab')return;const buttons=[...root.querySelectorAll('button:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter(e=>!e.hidden);if(!buttons.length)return;const first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
 root.addEventListener('keydown',focusTrap);
 return {
  begin({hero,village,cancel},commit,complete){
   if(active)return false;returnFocus=document.activeElement;active=true;age=0;sealed=false;editing=true;region=village.id;onSeal=commit;onFinish=complete;draft={content:'',signature:[]};root.hidden=false;root.dataset.stage='editing';root.style.setProperty('--hero-ink',1);root.style.setProperty('--chief-ink',0);root.style.setProperty('--stamp',0);
   const chief={name:village.id==='nameless'?'Đại diện Thủy · Hỏa · Lôi':'Trưởng '+village.name,appearance:villagerAppearance(village.id,{kind:'chief'})};
   root.innerHTML=`<div class="peace-card"><div class="peace-heading"><small>KÝ KẾT HÒA BÌNH · ${esc(village.name)}</small><h2>Hiệp ước hòa bình</h2></div><div class="peace-body"><aside class="peace-person">${heroPortrait(hero)}<strong>${esc(hero.name)}</strong><small>Người giữ ấn</small></aside><article class="peace-paper"><h3>HIỆP ƯỚC HÒA BÌNH</h3><label for="peaceContent">Tự viết nội dung hiệp ước</label><textarea id="peaceContent" rows="6" maxlength="4000" placeholder="Viết những điều hai bên cam kết thực hiện…"></textarea><p id="peaceWrittenContent" class="peace-written-content" hidden></p><div class="peace-signatures"><div><label for="peaceSignature">Chữ ký của bạn · vẽ bằng chuột hoặc ngón tay</label><svg id="peaceSignature" viewBox="0 0 360 120" role="img" aria-label="Ô tự ký tên"><path id="peaceSignatureInk"/></svg><button id="peaceClearSignature" type="button">Ký lại</button><strong>${esc(hero.name)}</strong></div><div><svg viewBox="0 0 180 65" aria-label="Chữ ký đại diện làng"><path class="peace-chief-ink" pathLength="1" d="m12 48 22-33-4 38 26-27-2 19 22-29-8 38 28-25 9 17 21-23-3 28 39-17"/></svg><strong>${esc(chief.name)}</strong></div></div><div class="peace-stamp-tool"><i></i><b>印</b></div><div class="peace-seal"><b>ẤN HÒA</b><span>✓</span><small>${esc(village.glyph)}</small></div></article><aside class="peace-person">${villagerPortrait(chief)}<strong>${esc(chief.name)}</strong><small>Đại diện dân làng</small></aside></div><footer><span id="peaceCeremonyStatus" role="status">Viết nội dung rồi tự ký vào ô bên dưới.</span><div class="peace-actions"><button id="peaceCeremonyCancel" type="button">Để sau</button><button id="peaceCeremonySign" type="button">Ký và đóng dấu</button><button id="peaceCeremonySkip" type="button" hidden>Hoàn tất →</button></div></footer></div>`;
   const svg=root.querySelector('#peaceSignature'),ink=root.querySelector('#peaceSignatureInk');let stroke=null,pointer=null;
   const point=e=>{const b=svg.getBoundingClientRect();return [Math.max(0,Math.min(360,(e.clientX-b.left)/b.width*360)),Math.max(0,Math.min(120,(e.clientY-b.top)/b.height*120))];};
   svg.onpointerdown=e=>{if(!editing||pointer!==null||draft.signature.length>=80)return;e.preventDefault();pointer=e.pointerId;svg.setPointerCapture(pointer);stroke=[point(e)];draft.signature.push(stroke);};
   svg.onpointermove=e=>{if(!editing||e.pointerId!==pointer||!stroke||stroke.length>=600)return;e.preventDefault();stroke.push(point(e));ink.setAttribute('d',signaturePaths(draft.signature));};
   const end=e=>{if(e.pointerId!==pointer)return;pointer=null;stroke=null;};svg.onpointerup=end;svg.onpointercancel=end;svg.onlostpointercapture=end;
   root.querySelector('#peaceClearSignature').onclick=()=>{if(!editing)return;draft.signature=[];ink.setAttribute('d','');};
   root.querySelector('#peaceCeremonyCancel').onclick=()=>{active=false;root.hidden=true;cancel?.();returnFocus?.focus?.();};
   root.querySelector('#peaceCeremonySign').onclick=()=>{
    draft.content=root.querySelector('#peaceContent').value.trim();draft.signature=draft.signature.filter(p=>p.length>1);
    if(!draft.content||!draft.signature.length){root.querySelector('#peaceCeremonyStatus').textContent=!draft.content?'Hãy viết nội dung hiệp ước trước khi ký.':'Hãy tự ký vào ô chữ ký trước khi đóng dấu.';if(!draft.content)root.querySelector('#peaceContent').focus();return;}
    editing=false;age=0;root.dataset.stage='opening';root.querySelector('#peaceContent').hidden=true;const content=root.querySelector('#peaceWrittenContent');content.textContent=draft.content;content.hidden=false;for(const id of ['peaceClearSignature','peaceCeremonySign','peaceCeremonyCancel'])root.querySelector('#'+id).hidden=true;root.querySelector('#peaceCeremonySkip').hidden=false;root.querySelector('#peaceCeremonySkip').focus();
   };
   root.querySelector('#peaceCeremonySkip').onclick=finish;root.querySelector('#peaceContent').focus();return true;
  },
  view(treaty,village,complete){
   if(active)return false;active=true;editing=true;region=treaty.village;root.hidden=false;root.dataset.stage='viewing';
   root.innerHTML=`<div class="peace-card treaty-viewer"><div class="peace-heading"><small>${esc(village.name)} · ĐÃ KÝ</small><h2>Hiệp ước hòa bình</h2></div><article class="peace-paper"><h3>HIỆP ƯỚC HÒA BÌNH</h3><p class="peace-written-content">${esc(treaty.content)}</p><div class="treaty-saved-signature"><svg viewBox="0 0 360 120" role="img" aria-label="Chữ ký đã lưu"><path d="${signaturePaths(treaty.signature)}"/></svg><strong>${esc(treaty.signer)}</strong></div><p>Đã có chữ ký và dấu xác nhận của ${esc(treaty.village==='nameless'?'đại diện Thủy · Hỏa · Lôi':'trưởng '+village.name)}.</p></article><footer><button id="peaceViewerClose" type="button">Trở lại túi đồ</button></footer></div>`;
   root.querySelector('#peaceViewerClose').onclick=()=>{active=false;root.hidden=true;complete?.();};root.querySelector('#peaceViewerClose').focus();return true;
  },
  update(dt){if(!active||editing)return;age+=dt;const c=Math.max(0,Math.min(1,(age-1.85)/1.15)),stamp=Math.max(0,Math.min(1,(age-3.15)/.45));root.style.setProperty('--chief-ink',c);root.style.setProperty('--stamp',stamp);const stage=age<.6?'opening':age<1.85?'hero':age<3.15?'chief':age<3.6?'stamp':'sealed';root.dataset.stage=stage;root.querySelector('#peaceCeremonyStatus').textContent=stage==='hero'?'Chữ ký của bạn đã được ghi':stage==='chief'?'Đại diện làng ký xác nhận':stage==='stamp'?'Đóng dấu hòa bình':stage==='sealed'?'Hiệp ước đã được cất vào túi đồ':'Hai bên xác nhận nội dung hiệp ước';if(age>=3.6)seal();if(age>=5.2)finish();},
  reset(){active=false;root.hidden=true;onSeal=onFinish=null;},
  state:()=>({active,age,sealed,village:region,stage:active?root.dataset.stage:'idle'})
 };
}
