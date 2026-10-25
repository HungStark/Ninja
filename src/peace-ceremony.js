import {heroPortrait} from './hero-portrait.js';
import {villagerPortrait} from './villager-portrait.js';
import {villagerAppearance} from './villager-appearance.js';
import {gameAudio} from './game-audio.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createPeaceCeremony(){
 const root=document.createElement('section');root.id='peaceCeremony';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Ký kết cam kết hòa bình');document.body.append(root);let active=false,age=0,sealed=false,region=null,onSeal=null,onFinish=null;
 const pen='<svg viewBox="0 0 80 60" aria-hidden="true"><path d="m15 34 18-14 12 3 20 16-8 15-27-3z" fill="#d9b58e"/><path d="m21 46 33-43 4 3-32 44-8 6z" fill="#3c3f37"/><path d="m18 56 3-10 5 4z" fill="#caa35f"/></svg>';
 function seal(){if(sealed)return;sealed=true;onSeal?.();gameAudio.tone(130,.15,'triangle',.055);}
 function finish(){if(!active)return;seal();active=false;onFinish?.();root.hidden=true;}
 return {
  begin({hero,village},commit,complete){if(active)return false;active=true;age=0;sealed=false;region=village.id;onSeal=commit;onFinish=complete;root.hidden=false;root.dataset.stage='opening';root.style.setProperty('--hero-ink',0);root.style.setProperty('--chief-ink',0);root.style.setProperty('--stamp',0);const chief={name:'Trưởng '+village.name,appearance:villagerAppearance(village.id,{kind:'chief'})};
   root.innerHTML=`<div class="peace-card"><div class="peace-heading"><small>BÁO CÁO CHIẾN THẮNG · ${esc(village.name)}</small><h2>Cam kết hòa bình</h2></div><div class="peace-body"><aside class="peace-person">${heroPortrait(hero)}<strong>${esc(hero.name)}</strong><small>Người giữ ấn</small></aside><article class="peace-paper"><h3>ƯỚC HẸN KHÔNG CHIẾN TRANH</h3><p>Không xâm phạm lẫn nhau. Bảo vệ dân thường.<br>Cùng giữ hòa bình giữa các làng.</p><div class="peace-signatures"><div><svg viewBox="0 0 180 65" aria-label="Chữ ký người chơi"><path class="peace-hero-ink" pathLength="1" d="m13 46 25-30-12 38 33-27-9 22 24-31-7 33 24-20-4 16 26-23-3 23 37-12"/></svg><strong>${esc(hero.name)}</strong></div><div><svg viewBox="0 0 180 65" aria-label="Chữ ký trưởng làng"><path class="peace-chief-ink" pathLength="1" d="m12 48 22-33-4 38 26-27-2 19 22-29-8 38 28-25 9 17 21-23-3 28 39-17"/></svg><strong>Trưởng ${esc(village.name)}</strong></div></div><div class="peace-hand peace-hero-hand">${pen}</div><div class="peace-hand peace-chief-hand">${pen}</div><div class="peace-stamp-tool"><i></i><b>印</b></div><div class="peace-seal"><b>ẤN HÒA</b><span>✓</span><small>${esc(village.glyph)}</small></div></article><aside class="peace-person">${villagerPortrait(chief)}<strong>${esc(chief.name)}</strong><small>Đại diện dân làng</small></aside></div><footer><span id="peaceCeremonyStatus" role="status">Hai bên cùng đặt bút cam kết</span><button id="peaceCeremonySkip" type="button">Hoàn tất nhanh →</button></footer></div>`;
   root.querySelector('#peaceCeremonySkip').onclick=finish;gameAudio.tone(440,.15,'sine',.025);return true;
  },
  update(dt){if(!active)return;age+=dt;const h=Math.max(0,Math.min(1,(age-.6)/1.15)),c=Math.max(0,Math.min(1,(age-1.85)/1.15)),stamp=Math.max(0,Math.min(1,(age-3.15)/.45));root.style.setProperty('--hero-ink',h);root.style.setProperty('--chief-ink',c);root.style.setProperty('--stamp',stamp);const stage=age<.6?'opening':age<1.85?'hero':age<3.15?'chief':age<3.6?'stamp':'sealed';root.dataset.stage=stage;root.querySelector('#peaceCeremonyStatus').textContent=stage==='hero'?'Bạn ký lời cam kết':stage==='chief'?'Trưởng làng ký xác nhận':stage==='stamp'?'Đóng dấu hòa bình':stage==='sealed'?'Dấu ấn hòa bình đã được ghi nhận':'Hai bên cùng đặt bút cam kết';if(age>=3.6)seal();if(age>=5.2)finish();},
  reset(){active=false;root.hidden=true;onSeal=onFinish=null;},
  state:()=>({active,age,sealed,village:region,stage:active?root.dataset.stage:'idle'})
 };
}
