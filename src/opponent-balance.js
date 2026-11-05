import {guardianPhaseHealth} from './guardian-arts.js';

export const opponentBalanceOverrides=/* opponent-balance:start */{
  "ninja:random:nameless": {
    "hp": 150,
    "baseDamagePercent": 100
  },
  "ninja:quest:nameless": {
    "hp": 150,
    "baseDamagePercent": 100
  },
  "ninja:sidequest:nameless": {
    "hp": 150,
    "baseDamagePercent": 100
  },
  "ninja:arena:nameless": {
    "hp": 150,
    "baseDamagePercent": 100
  },
  "guardian:nameless:1": {
    "hp": 200,
    "baseDamagePercent": 100,
    "spellIds": [
      "ice-reflect",
      "ice-barrier",
      "ice-orb",
      "wind-volley",
      "wind-lance"
    ]
  },
  "guardian:nameless:2": {
    "hp": 300,
    "baseDamagePercent": 100
  },
  "intro:fire": {
    "hp": 180,
    "baseDamagePercent": 100
  },
  "intro:water": {
    "hp": 180,
    "baseDamagePercent": 100
  },
  "intro:lightning": {
    "hp": 180,
    "baseDamagePercent": 100
  },
  "ninja:random:water": {
    "hp": 180,
    "baseDamagePercent": 102,
    "spellIds": [
      "water-barrier",
      "water-lance",
      "water-reflect"
    ]
  },
  "ninja:quest:water": {
    "hp": 180,
    "baseDamagePercent": 102,
    "spellIds": [
      "water-barrier",
      "water-lance",
      "water-reflect"
    ]
  },
  "ninja:sidequest:water": {
    "hp": 180,
    "baseDamagePercent": 102,
    "spellIds": [
      "water-barrier",
      "water-lance",
      "water-reflect"
    ]
  },
  "ninja:village-guard:water": {
    "hp": 200,
    "sealDelay": 0.8,
    "baseDamagePercent": 104,
    "spellIds": [
      "water-barrier",
      "water-lance",
      "water-reflect"
    ]
  },
  "ninja:guardian-guard:water": {
    "hp": 250,
    "sealDelay": 0.7,
    "baseDamagePercent": 107,
    "mana": 120,
    "infiniteMana": true
  },
  "ninja:arena:water": {
    "hp": 180,
    "baseDamagePercent": 102,
    "sealDelay": 0.8,
    "spellIds": [
      "water-barrier",
      "water-reflect",
      "water-lance"
    ]
  },
  "guardian:water:1": {
    "infiniteMana": false,
    "sealDelay": 0.6,
    "baseDamagePercent": 110,
    "hp": 250,
    "mana": 150
  },
  "guardian:water:2": {
    "hp": 360,
    "baseDamagePercent": 110
  },
  "ninja:random:fire": {
    "hp": 220,
    "baseDamagePercent": 104,
    "spellIds": [
      "fire-volley",
      "fire-barrier",
      "fire-reflect"
    ]
  },
  "ninja:quest:fire": {
    "hp": 220,
    "baseDamagePercent": 104,
    "spellIds": [
      "fire-volley",
      "fire-barrier",
      "fire-lance"
    ]
  },
  "ninja:sidequest:fire": {
    "hp": 220,
    "baseDamagePercent": 104,
    "spellIds": [
      "fire-volley",
      "fire-barrier",
      "fire-reflect"
    ]
  },
  "ninja:village-guard:fire": {
    "hp": 250,
    "baseDamagePercent": 106,
    "sealDelay": 0.7,
    "spellIds": [
      "fire-volley",
      "fire-barrier",
      "fire-reflect"
    ]
  },
  "ninja:arena:fire": {
    "hp": 220,
    "baseDamagePercent": 104,
    "sealDelay": 0.8,
    "spellIds": [
      "fire-volley",
      "fire-barrier",
      "fire-reflect"
    ]
  },
  "ninja:guardian-guard:fire": {
    "hp": 320,
    "baseDamagePercent": 108,
    "sealDelay": 0.6,
    "mana": 120
  },
  "guardian:fire:1": {
    "hp": 320,
    "infiniteMana": false,
    "sealDelay": 0.5,
    "baseDamagePercent": 112,
    "mana": 150
  },
  "guardian:fire:2": {
    "hp": 440,
    "baseDamagePercent": 112
  },
  "event:fire:0": {
    "hp": 250,
    "sealDelay": 0.7,
    "baseDamagePercent": 106,
    "spellIds": [
      "fire-volley",
      "fire-barrier",
      "fire-lance"
    ]
  },
  "event:fire:1": {
    "hp": 250,
    "sealDelay": 0.7,
    "baseDamagePercent": 106,
    "spellIds": [
      "lightning-lance",
      "lightning-volley",
      "lightning-reflect"
    ]
  },
  "guardian:lightning:1": {
    "infiniteMana": false,
    "mana": 150,
    "baseDamagePercent": 115,
    "hp": 360
  },
  "ninja:guardian-guard:lightning": {
    "mana": 120,
    "sealDelay": 0.58,
    "baseDamagePercent": 110,
    "hp": 360
  },
  "ninja:village-guard:lightning": {
    "sealDelay": 0.65,
    "baseDamagePercent": 108,
    "hp": 300
  },
  "ninja:arena:lightning": {
    "sealDelay": 0.75,
    "baseDamagePercent": 106,
    "hp": 260,
    "spellIds": [
      "lightning-lance",
      "lightning-barrier",
      "lightning-reflect"
    ]
  },
  "ninja:random:lightning": {
    "baseDamagePercent": 106,
    "hp": 260,
    "spellIds": [
      "lightning-lance",
      "lightning-barrier",
      "lightning-reflect"
    ]
  },
  "ninja:quest:lightning": {
    "baseDamagePercent": 106,
    "hp": 260,
    "spellIds": [
      "lightning-lance",
      "lightning-barrier",
      "lightning-volley"
    ]
  },
  "ninja:sidequest:lightning": {
    "baseDamagePercent": 106,
    "hp": 260,
    "spellIds": [
      "lightning-lance",
      "lightning-barrier",
      "lightning-volley"
    ]
  },
  "guardian:lightning:2": {
    "baseDamagePercent": 115,
    "hp": 520
  }
}/* opponent-balance:end */;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function opponentBalanceId(profile,phase=1){
  if(profile.balanceId)return profile.balanceId;
  if(profile.kind==='boss')return 'guardian:'+profile.village+':'+phase;
  if(profile.kind==='practice-ninja')return 'ninja:practice';
  if(profile.kind==='village-guard'&&profile.guardRole==='guardian')return 'ninja:guardian-guard:'+profile.village;
  return 'ninja:'+profile.kind+':'+(profile.village||profile.element);
}
function stageSettings(profile,phase,overrides){
  const id=opponentBalanceId(profile,phase),value=overrides[id]||{},beast=profile.kind==='boss'&&phase===2;
  return {id,...(value.baseDamagePercent!==undefined?{baseDamagePercent:value.baseDamagePercent}:{}),
    mana:value.mana??100,infiniteMana:value.infiniteMana??profile.kind==='boss',
    sealDelay:value.sealDelay??profile.sealDelay??.42,
    ...(value.hp!==undefined?{hp:value.hp}:{}),...(!beast&&value.spellIds?{spellIds:[...value.spellIds]}:{})};
}
export function configureOpponent(profile,overrides=opponentBalanceOverrides){
  if(profile.balanceApplied)return profile;
  const result={...profile,balanceApplied:true};
  const count=profile.kind==='boss'?(profile.village==='dark'?3:2):1;
  result.balanceStages=Array.from({length:count},(_,i)=>stageSettings(profile,i+1,overrides));
  result.sealDelay=result.balanceStages[0].sealDelay;
  if(profile.kind==='boss'){
    const original=guardianPhaseHealth(profile.hp,profile.village);
    result.phaseHealth=original.map((hp,i)=>result.balanceStages[i].hp??hp);
    result.hp=result.phaseHealth.reduce((a,b)=>a+b,0);
  }else result.hp=result.balanceStages[0].hp??profile.hp;
  if(result.balanceStages[0].spellIds)result.spellIds=[...result.balanceStages[0].spellIds];
  if(profile.squad){
    result.squad=profile.squad.map((member,i)=>configureOpponent({...member,kind:profile.kind,village:member.village||profile.village,balanceId:profile.kind==='intro-trio'?'intro:'+member.element:'event:'+profile.village+':'+i},overrides));
    const first=result.squad[0];
    Object.assign(result,{hp:first.hp,spellIds:first.spellIds,balanceStages:first.balanceStages});
  }
  return result;
}
export function opponentStage(profile,phase=1){return profile?.balanceStages?.[phase-1]||{mana:100,infiniteMana:profile?.kind==='boss',sealDelay:profile?.sealDelay??.42};}
export function opponentBaseDamageMultiplier(profile,phase=1){
  if(!profile)return 1;
  return profile.balancePractice?1:clamp((Number(profile.damageMultiplier)||1)+(profile.kind==='boss'?(phase-1)*.1:0),.1,2.5);
}
export function opponentDamageMultiplier(profile,phase=1){const percent=opponentStage(profile,phase).baseDamagePercent;return percent===undefined?opponentBaseDamageMultiplier(profile,phase):percent/100;}
export function createOpponentRules(GameRules,profile,phase=1){
  const settings=opponentStage(profile,phase),ids=settings.spellIds||(phase>1?profile.phaseSpellIds:profile.spellIds),rules=new GameRules(ids,{maxChakra:Math.max(100,settings.mana)});
  rules.maxChakra=settings.mana;rules.chakra=settings.mana;
  if(settings.infiniteMana)rules.spells=rules.spells.map(s=>({...s,cost:0}));
  return rules;
}
export function scaleEnemySpell(spell,multiplier){
  const next={...spell,enemyDamageScale:multiplier};for(const key of ['damage','baseDamage','upgradeDamage','captureDamage','fallDamage'])if(typeof next[key]==='number')next[key]*=multiplier;return next;
}
