import {insidePlot} from './village-zoning.js';
import {villageEventComplete,villageEventObjective} from './village-events.js';

export function inCouncilCourtyard(layout,position){
  const court=layout?.campuses?.hall;
  return !!court&&insidePlot(court,position.x,position.z,-.4)&&(!Number.isFinite(position.y)||Math.abs(position.y-court.base)<3);
}
export const guardianGuardIds=id=>[id+'-guardian-sentry-1',id+'-guardian-sentry-2'];
export const guardianOrdered=(save,id=save.village)=>!!save.story.guardianOrders?.includes(id);
export const nextGuardianGuard=(save,id=save.village)=>guardianGuardIds(id).find(guard=>!save.story.defeatedGuards.includes(guard))||null;
export const guardianStoryPending=(save,id=save.village)=>id!=='nameless'&&!save.bosses[id]&&!villageEventComplete(save,id);
export function orderGuardianGuards(save,id=save.village){
  if(id==='nameless'||save.bosses[id]||guardianStoryPending(save,id)||guardianOrdered(save,id))return false;
  save.story.guardianOrders??=[];save.story.guardianOrders.push(id);return true;
}
export function confrontationObjective(save,id){
  if(id==='nameless'||save.bosses[id])return null;
  if(guardianStoryPending(save,id))return villageEventObjective(save,id);
  const guard=nextGuardianGuard(save,id);
  if(!guardianOrdered(save,id))return {title:'Linh thú chặn cổng sân phòng họp',description:'Đi qua cổng sân phòng họp và giải thích mục đích chuyến đi với linh thú.',targetVillage:id,targetKind:'boss'};
  if(guard)return {title:'Đối đầu hai hộ vệ',description:'Hai hộ vệ cùng được lệnh bắt bạn. Đánh bại cả hai trong một trận để tới phòng họp.',targetVillage:id,targetKind:'village-guard',targetId:guard};
  return {title:'Linh thú nhập vào trưởng làng',description:'Đi vào phòng họp và đối mặt trưởng làng đang bị linh thú chiếm hữu.',targetVillage:id,targetKind:'npc'};
}
