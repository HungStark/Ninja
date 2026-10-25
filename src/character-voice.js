// Character metadata is shared with the portraits; the hero can override it in audio settings.
export function characterVoice(speaker={},heroGender='male'){
 const gender=speaker.id==='hero'?heroGender:speaker.gender||((speaker.female??speaker.appearance?.female)?'female':'male');
 const elder=speaker.elder||speaker.appearance?.age==='elder';
 return {gender,rate:elder?.9:1.02,pitch:(gender==='female'?1.18:.9)*(elder?.92:1)};
}
