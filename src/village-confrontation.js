export const guardianGuardIds=id=>[id+'-guardian-sentry-1',id+'-guardian-sentry-2'];
export const guardianOrdered=(save,id=save.village)=>!!save.story.guardianOrders?.includes(id);
export const nextGuardianGuard=(save,id=save.village)=>guardianGuardIds(id).find(guard=>!save.story.defeatedGuards.includes(guard))||null;
export function orderGuardianGuards(save,id=save.village){
  if(id==='nameless'||save.bosses[id]||guardianOrdered(save,id))return false;
  save.story.guardianOrders??=[];save.story.guardianOrders.push(id);return true;
}
export function confrontationObjective(save,id){
  if(id==='nameless'||save.bosses[id])return null;
  const guard=nextGuardianGuard(save,id);
  if(!guardianOrdered(save,id))return {title:'Linh thú chặn cổng',description:'Giải thích mục đích chuyến đi với linh thú đang trấn giữ làng.',targetVillage:id,targetKind:'boss'};
  if(guard)return {title:guard.endsWith('-1')?'Đối đầu hộ vệ trái':'Đối đầu hộ vệ phải',description:'Hai hộ vệ được lệnh bắt bạn. Vượt qua từng người để tới phòng họp.',targetVillage:id,targetKind:'village-guard',targetId:guard};
  return {title:'Linh thú nhập vào trưởng làng',description:'Đi vào phòng họp và đối mặt trưởng làng đang bị linh thú chiếm hữu.',targetVillage:id,targetKind:'npc'};
}
