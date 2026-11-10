export const PRACTICE_CHARACTER_SCALE=2;
export function actorHitRadius(actor,base=.54){return base*(actor?.hitboxScale??1);}
export function actorHitPadding(actor){return actorHitRadius(actor)-.54;}
