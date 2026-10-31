export const PORTRAIT_COATS=['#211e25','#693f40','#505060','#5a6344','#8b7046'];
const color=value=>{const s=(value||PORTRAIT_COATS[0]).toLowerCase();return PORTRAIT_COATS.includes(s)?s:PORTRAIT_COATS[0];};
export function portraitKey(speaker){
  if(speaker.id==='hero')return 'hero/'+(speaker.equipment?.armor?.id||speaker.armor?.id||'traveler')+'/'+color(speaker.coat||speaker.equipment?.hero?.coat);
  const p=speaker.appearance;
  if(p?.kind==='creature')return 'guardian/'+p.id;
  if(p?.job==='ninja')return p.id==='ha-ly'?'ha-ly/'+(speaker.portraitPose==='wounded'||speaker.portraitPose==='captive'?'wounded':'standing'):'ninja/'+p.village;
  return 'npc/'+(p?.village||speaker.village||'nameless')+'/'+(p?.id||speaker.id||'lore');
}

