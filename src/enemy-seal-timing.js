export const ENEMY_SEAL_SPEED=Object.freeze({boss:1.5,'guardian-guard':1.3,'village-guard':1.15});
export function arenaRound(save){const round=save.arena?.round;return Number.isSafeInteger(round)&&round>=1?round:1;}
export function enemySealTiming(rank,kind,round=1){
 const sealSpeedMultiplier=kind==='arena'?1+(Math.max(1,round)-1)*.1:ENEMY_SEAL_SPEED[kind]||1;
 // Arena contestants share one baseline so every later round is faster, regardless of village.
 const baseSealDelay=kind==='arena'?.9:Math.max(.43,.9-rank*.05);
 return {baseSealDelay,sealSpeedMultiplier,sealDelay:baseSealDelay/sealSpeedMultiplier};
}
