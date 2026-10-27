export const VOICE_SPEED=1.5;

// Character metadata is shared with the portraits; the hero can override it in audio settings.
export function characterVoice(speaker={},heroGender='male'){
 const gender=speaker.id==='hero'?heroGender:speaker.gender||((speaker.female??speaker.appearance?.female)?'female':'male');
 const elder=speaker.elder||speaker.appearance?.age==='elder';
 return {gender,rate:(elder?.9:1.02)*VOICE_SPEED,pitch:(gender==='female'?1.18:.9)*(elder?.92:1)};
}

// Speak each name in one utterance; keep two-word names slow from the start.
export function spellVoice(name,heroGender='male'){
 const words=String(name||'').trim().split(/\s+/).filter(Boolean),{pitch}=characterVoice({id:'hero'},heroGender);
 if(!words.length)return [];
 if(words.length<=2)return [{text:words.join(' ')+'.',rate:.78*VOICE_SPEED,pitch}];
 return [{text:words.join(' ')+'.',rate:VOICE_SPEED,pitch}];
}
