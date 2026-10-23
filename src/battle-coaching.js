export const BALANCE_VERSION='tiered-cooldowns-v2';
export function introductoryCooldowns(learned,inJourney){
  const starters=['fire-volley','water-barrier','lightning-lance'];
  return inJourney&&learned?.length===1&&starters.includes(learned[0])?{[learned[0]]:4}:{};
}

// These are opportunities in the equipped kit, never automatic casts or bonuses.
export function battleOpportunities(spells,context){
  const result=[],add=(spell,priority,reason)=>result.push({id:spell.id,priority,reason,text:`${reason} → ${spell.name} · ${spell.sequence.join(' ').toUpperCase()}`});
  const available=spells.filter(s=>context.canCast(s));
  for(const spell of available){
    if(spell.style==='aircombo'&&context.airborne)add(spell,100,'Địch đang trên không');
    if(context.incoming&&['lightmirror','firewall','waterwall','windwall','earthwall','icewall','walnutwall'].includes(spell.style))add(spell,90,'Đòn đang tới · có thể phòng thủ');
    if(spell.style==='ignite'&&context.burnStacks>0)add(spell,80,`Địch có ${context.burnStacks} tầng bỏng`);
    if(spell.style==='discharge'&&context.staticStacks>0)add(spell,80,`Địch có ${context.staticStacks} tĩnh điện`);
    if(spell.style==='lightray'&&context.sphere)add(spell,70,'Ngắm xuyên cầu thủy tinh để tăng sát thương');
    if(spell.style==='lightray'&&context.dome)add(spell,65,'Bắn vào mái vòm để giữ laser');
  }
  if(context.wall){
    const long=available.filter(s=>s.kind==='attack'&&!s.oncePerMatch&&s.sequence.length>=4).sort((a,b)=>b.sequence.length-a.sequence.length)[0];
    if(long)add(long,40,'Đang có tường · chuẩn bị đòn mạnh');
  }
  if(!result.length&&context.lastSpell&&context.lastCooling){
    const next=available.find(s=>s.id!==context.lastSpell.id&&!s.oncePerMatch);
    if(next)add(next,10,`${context.lastSpell.name} đang hồi`);
  }
  return result.sort((a,b)=>b.priority-a.priority);
}
