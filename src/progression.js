import {GUARDIAN_HEALTH} from './adventure-world.js';
import {botHealth} from './enemy-balance.js';
// Journey progression is independent for each element; all bonuses use base values.
export const SYSTEMS=['fire','water','lightning','wind','earth','light','dark','wood','ice'];
export const LEVEL_POINTS=[1,1,1,1,2,2,2,3,3,4];
export const LEVEL_XP=[0,60,150,270,420,620,880,1200,1600,2100];
export const BASE_STATS={health:200,chakra:100};
export const ATTRIBUTE_GAINS={health:5,strength:1.5,mana:2};
export const SKILL_LEVELS={
  water:{'water-barrier':1,'water-lance':2,'water-reflect':3,'water-volley':4,'water-tsunami':5},
  fire:{'fire-volley':1,'fire-barrier':2,'fire-reflect':3,'fire-lance':4,'fire-meteor':5},
  lightning:{'lightning-lance':1,'lightning-barrier':2,'lightning-reflect':3,'lightning-volley':4,'lightning-thunder':5},
  wind:{'wind-orb':1,'wind-volley':2,'wind-lance':3,'wind-barrier':4,'wind-reflect':5},
  earth:{'earth-orb':1,'earth-barrier':2,'earth-volley':3,'earth-reflect':4,'earth-lance':5},
  light:{'light-orb':1,'light-barrier':2,'light-reflect':3,'light-lance':4,'light-volley':5},
  dark:{'dark-orb':1,'dark-lance':2,'dark-domain':3,'dark-reflect':4,'dark-volley':5},
  wood:{'wood-reflect':1,'wood-orb':2,'wood-lance':3,'wood-barrier':4,'wood-volley':5},
  ice:{'ice-reflect':1,'ice-lance':2,'ice-barrier':3,'ice-volley':4,'ice-orb':5}
};
export const spellElement=id=>SYSTEMS.find(element=>Object.hasOwn(SKILL_LEVELS[element],id));
export const requiredLevel=id=>SKILL_LEVELS[spellElement(id)]?.[id]||1;
export const regionElement=id=>id==='nameless'?'wind':id;
export function newProgression(){return {xp:{water:0},attributes:{health:0,strength:0,mana:0},books:[]};}
export function systemLevel(progression,element){
  const xp=progression?.xp?.[element];if(!Number.isFinite(xp))return 0;
  let level=1;while(level<10&&xp>=LEVEL_XP[level])level++;return level;
}
export function earnedPoints(progression){return SYSTEMS.reduce((total,element)=>total+LEVEL_POINTS.slice(0,systemLevel(progression,element)).reduce((a,b)=>a+b,0),0);}
export function remainingPoints(progression){return Math.max(0,earnedPoints(progression)-Object.values(progression.attributes).reduce((a,b)=>a+b,0));}
export function combatStats(progression){const a=progression.attributes;return {maxHp:BASE_STATS.health+ATTRIBUTE_GAINS.health*a.health,maxChakra:BASE_STATS.chakra+BASE_STATS.chakra*ATTRIBUTE_GAINS.mana*a.mana/100,damageMultiplier:1+a.strength*ATTRIBUTE_GAINS.strength/100,points:remainingPoints(progression)};}
export function readProgression(raw,learned=[]){
  const p=newProgression();
  if(raw&&typeof raw==='object'){
    for(const element of SYSTEMS)if(Number.isFinite(raw.xp?.[element])&&raw.xp[element]>=0)p.xp[element]=Math.min(LEVEL_XP[9],Math.round(raw.xp[element]*1000)/1000);
    p.books=[...new Set(Array.isArray(raw.books)?raw.books.filter(id=>spellElement(id)):[])];
  }else{
    // Old saves keep their techniques and receive the minimum level to own them.
    for(const id of learned){const element=spellElement(id);if(element)p.xp[element]=Math.max(p.xp[element]||0,LEVEL_XP[requiredLevel(id)-1]);}
  }
  let budget=earnedPoints(p);
  for(const key of ['health','strength','mana']){const n=raw?.attributes?.[key];p.attributes[key]=Number.isSafeInteger(n)&&n>0?Math.min(n,budget):0;budget-=p.attributes[key];}
  return p;
}
export function gainExperience(progression,element,amount){
  if(!SYSTEMS.includes(element)||!Number.isFinite(amount)||amount<=0)return null;
  const before=systemLevel(progression,element),points=earnedPoints(progression);
  progression.xp[element]=Math.min(LEVEL_XP[9],Math.round(((progression.xp[element]||0)+amount)*1000)/1000);
  return {element,before,level:systemLevel(progression,element),points:earnedPoints(progression)-points};
}
export function spendPoint(progression,attribute){
  if(!Object.hasOwn(progression.attributes,attribute)||remainingPoints(progression)<1)return false;
  progression.attributes[attribute]++;return true;
}
export function canLearn(progression,spellId){return !!spellElement(spellId)&&systemLevel(progression,spellElement(spellId))>=requiredLevel(spellId);}
export function learnFromBook(save,spellId){
  if(!save.progression.books.includes(spellId)||save.learnedSpells.includes(spellId)||!canLearn(save.progression,spellId))return false;
  save.learnedSpells.push(spellId);save.progression.books=save.progression.books.filter(id=>id!==spellId);return true;
}
export function addBooks(save,ids){const added=ids.filter(id=>spellElement(id)&&!save.learnedSpells.includes(id)&&!save.progression.books.includes(id));save.progression.books.push(...new Set(added));return [...new Set(added)];}
export function teachAvailable(save,element){
  const ids=Object.keys(SKILL_LEVELS[element]||{}).filter(id=>canLearn(save.progression,id)&&!save.learnedSpells.includes(id));
  save.learnedSpells.push(...ids);save.progression.books=save.progression.books.filter(id=>!ids.includes(id));return ids;
}
// Explicit arsenals and encounter strength; opening trio is authored separately.
export function encounterProfile(save,kind,region){
  const element=regionElement(region),stage=Object.keys(save.bosses).filter(id=>id!=='nameless').length;
  const ordered=Object.keys(SKILL_LEVELS[element]).sort((a,b)=>requiredLevel(a)-requiredLevel(b));
  if(kind==='boss'){
    const hp=GUARDIAN_HEALTH[region];
    return {element,hp,spellIds:ordered,phaseSpellIds:ordered,phases:region==='dark'?3:2,damageMultiplier:['water','fire','lightning'].includes(region)?.75:.95,sealDelay:.43,restTime:2.1,weaponInterval:1.9};
  }
  const elite=kind==='guardian-guard',guard=kind==='village-guard'||elite,early=['fire','water','lightning'].includes(region),count=guard?(elite?(early?3:4):early?2:3):Math.min(3,1+Math.floor(stage/2));
  return {element,hp:botHealth(elite?(early?260:390+stage*15):guard?(early?155:240+stage*12):110+stage*15),spellIds:ordered.slice(0,count),damageMultiplier:elite?.85:guard?.65:.55,sealDelay:elite?.52:guard?.62:.75,restTime:elite?2.3:guard?2.9:3.8,weaponInterval:elite?1.8:guard?2.3:3.2};
}
