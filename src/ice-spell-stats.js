export function iceSpellStats(spell){
  if(spell.style==='snowball')return 'Tiêu hao '+spell.snowCost+' tuyết · '+spell.damage+' sát thương · lăn theo hướng chỉ định · vỡ khi chạm, không cuốn đối thủ';
  if(spell.style==='blizzard')return 'Tích tuyết ×'+spell.snowMultiplier+' trong '+spell.duration+' giây · tuyết dày, nhanh và xiên hơn';
  if(spell.style==='snowstorm')return 'Tối đa '+spell.snowTime+' tuyết · mỗi tuyết làm chậm '+Math.round(spell.slowPerSnow*10000)/100+'% · tuyết tiếp tục rơi sau Tuyết táng';
  return null;
}
