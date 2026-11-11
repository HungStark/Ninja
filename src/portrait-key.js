export const HERO_PORTRAIT_COAT='#211e25';
export const HERO_PORTRAIT_HAIR='#161821';
export function portraitKey(speaker){
  if(speaker.id==='hero')return 'hero/'+(speaker.equipment?.armor?.id||speaker.armor?.id||'traveler');
  const p=speaker.appearance;
  if(p?.kind==='creature')return 'guardian/'+p.id;
  if(p?.job==='ninja')return p.id==='ha-ly'?'ha-ly/'+(speaker.portraitPose==='wounded'||speaker.portraitPose==='captive'?'wounded':'standing'):'ninja/'+p.village;
  return 'npc/'+(p?.village||speaker.village||'nameless')+'/'+(p?.id||speaker.id||'lore');
}

