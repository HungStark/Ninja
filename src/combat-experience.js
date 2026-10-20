import {SYSTEMS,regionElement} from './progression.js';

// The victim determines combat XP, regardless of the attacker's art or equipment.
export function combatExperienceElement(encounter,victimId='primary'){
  if(!encounter)return null;
  const index=victimId==='primary'?0:Number(/^squad-(\d+)$/.exec(victimId)?.[1]);
  const element=encounter.squad?.[Number.isInteger(index)?index:0]?.element||encounter.element||regionElement(encounter.village);
  return SYSTEMS.includes(element)?element:null;
}
export function combatExperienceRewards(encounter,amount){
  const opponents=encounter.squad?.length?encounter.squad:[encounter],totals=new Map();
  for(const opponent of opponents){const element=combatExperienceElement(opponent);if(element)totals.set(element,(totals.get(element)||0)+amount/opponents.length);}
  return [...totals].map(([element,xp])=>({element,xp}));
}
export function requiresGuardBattle(save,encounter){return encounter?.kind==='village-guard'&&save.village!=='nameless'&&!save.story?.peaceSeals?.includes(encounter.village);}
