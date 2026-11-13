import {companionSacrificed} from './phoenix-blessing.js';
export const COMPANION_BASE_HP=300,COMPANION_VILLAGE_HP=30,COMPANION_TREATMENT_SECONDS=60;
export const COMPANION_GROWTH_VILLAGES=Object.freeze(['lightning','wind','earth','wood','ice','light','dark']);
export const companionUnconscious=save=>!!save.story?.companion?.recruited&&!companionSacrificed(save)&&save.story.companion.hp===0;
export const carryingCompanion=save=>companionUnconscious(save)&&save.story.companion.phase!=='separated';
export const companionMoveMultiplier=save=>carryingCompanion(save)?0.7:1;
export function readCompanionHealth(raw={},visited=[]){
  raw=raw&&typeof raw==='object'?raw:{};visited=Array.isArray(visited)?visited:[];
  const growthVillages=COMPANION_GROWTH_VILLAGES.filter(id=>visited.includes(id)),maxHp=COMPANION_BASE_HP+growthVillages.length*COMPANION_VILLAGE_HP;
  const hp=Number.isFinite(raw.hp)?Math.max(0,Math.min(maxHp,raw.hp)):maxHp;
  return {hp:raw.sacrificed?0:hp,maxHp,growthVillages,sacrificed:raw.sacrificed===true,treatmentSeconds:!raw.sacrificed&&hp===0&&Number.isFinite(raw.treatmentSeconds)?Math.max(0,Math.min(59.999,raw.treatmentSeconds)):0};
}
export function syncCompanionGrowth(save){
  const c=save.story?.companion;if(!c?.recruited)return false;
  const next=readCompanionHealth(c,save.visited||[]),before=c.maxHp||COMPANION_BASE_HP;
  if(next.maxHp>before&&next.hp>0)next.hp=Math.min(next.maxHp,next.hp+next.maxHp-before);
  const changed=next.maxHp!==c.maxHp||next.hp!==c.hp;Object.assign(c,next);return changed;
}
export function recordCompanionHealth(save,hp){
  const c=save.story?.companion;if(!c?.recruited||c.sacrificed||!Number.isFinite(hp))return false;
  const before=c.hp;c.hp=Math.max(0,Math.min(c.maxHp||COMPANION_BASE_HP,hp));if(before>0&&c.hp===0)c.treatmentSeconds=0;return before!==c.hp;
}
export function treatCompanion(save,dt){
  const c=save.story?.companion;if(!companionUnconscious(save)||!Number.isFinite(dt)||dt<=0)return false;
  c.treatmentSeconds=Math.min(COMPANION_TREATMENT_SECONDS,(c.treatmentSeconds||0)+dt);
  if(c.treatmentSeconds+1e-7<COMPANION_TREATMENT_SECONDS)return false;
  c.hp=c.maxHp;c.treatmentSeconds=0;return true;
}
export function healCompanion(save){const c=save.story?.companion;if(c?.recruited&&!c.sacrificed&&c.phase!=='separated'&&!companionUnconscious(save)){c.hp=c.maxHp;c.treatmentSeconds=0;}}
