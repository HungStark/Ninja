import {villageSidequests} from './journey-story.js';
import {REGIONS} from './adventure-world.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Resolve both the grid and detail view from the same world-item definition.
export function questInventoryItem(id){
  const quest=Object.keys(REGIONS).flatMap(v=>villageSidequests(v)).find(q=>q.id===id);
  if(id==='nameless:seal-core')return {name:'Mảnh lõi ấn Vô Danh',model:'seal-core',quest};
  if(id==='fire:hong-lien')return {name:'Hồng Liên',model:'lotus',quest};
  if(id==='fire:lotus-medicine')return {name:'Thuốc Hồng Liên',model:'medicine',quest};
  return {name:quest?.targetName||'Vật phẩm nhiệm vụ',model:quest?.type==='combat'?'notes':quest?.targetModel||'satchel',quest};
}
export const worldItemIcon=(model,name)=>`<img data-item-model="${esc(model)}" alt="${esc(name)}" width="160" height="160">`;
