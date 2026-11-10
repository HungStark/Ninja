import {armorById,armguardById,shurikenById,equipmentState} from './equipment.js';
import {flaskState} from './healing-flask.js';
import {requiredLevel,spellElement,systemLevel} from './progression.js';
import {villageSidequests} from './journey-story.js';
import {REGIONS} from './adventure-world.js';
import {resistanceText,bonusText,itemGlyph} from './equipment-ui.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function inventoryItemDetails(save,kind,id){
  const equipment=equipmentState(save),e=save.equipment;let title='',description='',stats=[],visual='',action=null,equipped=false,current=null;
  if(kind==='armor'||kind==='armguard'){
    const item=(kind==='armor'?armorById:armguardById)(id),owned=kind==='armor'?e.ownedArmor:e.ownedArmguards;
    if(!item||!owned.includes(id))return null;
    title=item.name;description=item.description||'';stats=[kind==='armor'?resistanceText(item):bonusText(item)];
    visual=`<img data-gear-icon="${esc(id)}" data-kind="${kind}" alt="${esc(title)}" width="160" height="160">`;
    equipped=e[kind]===id;action='equip';current=equipped?null:equipment[kind];
  }else if(kind==='shuriken'){
    const item=shurikenById(id);if(!item||!(e.ammo[id]>0))return null;
    title=item.name;stats=[item.damage+' sát thương','Đang có: '+e.ammo[id]+' chiếc'];description='Được sử dụng khi tấn công mà chưa kết đủ ấn. Không tiêu hao mana.';
    visual=`<span class="inventory-item-symbol" style="color:${item.color}">✦</span>`;action='equip';equipped=e.shuriken===id;
  }else if(kind==='bag'){
    title=equipment.bag.name;stats=[equipment.bag.capacity+' chỗ đựng phi tiêu','Đang mang: '+equipment.count+' / '+equipment.bag.capacity];
    description='Tự động sử dụng túi tốt nhất đã sở hữu. Túi là nâng cấp sức chứa, không chiếm ô hành trang và không thể đổi xuống cấp thấp hơn.';visual=itemGlyph('bag');
  }else if(kind==='flask'){
    const f=flaskState(save);title=f.owned?'Bình thuốc cấp '+f.level:'Chưa có bình thuốc';
    stats=f.owned?[f.charges+' / '+f.maxCharges+' lượt','Hồi '+(f.fraction*100)+'% máu tối đa']:[];
    description=f.owned?'Nhấn T trong giao chiến để dùng. Nạp lại bình tại ấn hồi sinh hoặc trạm y tế.':'Nhận bình thuốc khi chọn thuật đầu tiên tại trưởng làng Vô Danh.';visual=itemGlyph('flask');
  }else if(kind==='book'){
    if(!save.progression.books.includes(id))return null;
    const spell=globalThis.SealGameCore?.spells.find(s=>s.id===id);title=spell?.name||id;description=spell?.subtitle||'Sách truyền thụ nhẫn thuật.';
    stats=['Cần cấp '+requiredLevel(id),'Cấp hệ hiện tại: '+systemLevel(save.progression,spellElement(id))];visual='<span class="inventory-item-symbol">▤</span>';action='progression';
  }else if(kind==='quest'){
    if(!save.story.questItems.includes(id))return null;
    const q=Object.keys(REGIONS).flatMap(v=>villageSidequests(v)).find(q=>q.id===id);
    title=id==='fire:hong-lien'?'Hồng Liên':id==='fire:lotus-medicine'?'Thuốc Hồng Liên':q?.targetName||id;
    description=id==='fire:hong-lien'?'Mang Hồng Liên tới Y nữ Đan để điều chế thuốc cứu Hạ Ly.':id==='fire:lotus-medicine'?'Thuốc đã điều chế. Mang tới chữa thương cho Hạ Ly trong nhà lao.':q?.description||'Vật phẩm nhiệm vụ. Mang về cho người nhờ giúp để nhận thưởng.';
    stats=q?['Người giao việc: '+q.giverName]:[];visual='<span class="inventory-item-symbol">'+(id==='fire:hong-lien'?'✿':id==='fire:lotus-medicine'?'⚱':'▣')+'</span>';
  }else return null;
  const compare=current?`<aside class="inventory-item-current"><small>Đang sử dụng</small><strong>${esc(current.name)}</strong><p>${esc(kind==='armor'?resistanceText(current):bonusText(current))}</p></aside>`:'';
  return {title,kind,id,action,equipped,html:`<div class="inventory-item-visual">${visual}</div><div class="inventory-item-copy"><div class="inventory-item-stats">${stats.map(s=>`<span>${esc(s)}</span>`).join('')}</div><p>${esc(description)}</p>${compare}</div>`};
}
