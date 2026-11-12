import {guardianPhaseHealth} from './guardian-arts.js';

export const opponentBalanceOverrides=/* opponent-balance:start */{
  "ninja:random:nameless": {
    "hp": 150,
    "baseDamagePercent": 90
  },
  "ninja:quest:nameless": {
    "hp": 150,
    "baseDamagePercent": 90
  },
  "ninja:sidequest:nameless": {
    "hp": 150,
    "baseDamagePercent": 90
  },
  "ninja:arena:nameless": {
    "hp": 150,
    "baseDamagePercent": 90
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
    "baseDamagePercent": 90,
    "spellIds": [
      "water-barrier",
      "water-lance",
      "water-reflect"
    ]
  },
  "ninja:quest:water": {
    "hp": 180,
    "baseDamagePercent": 90,
    "spellIds": [
      "water-barrier",
      "water-lance",
      "water-reflect"
    ]
  },
  "ninja:sidequest:water": {
    "hp": 180,
    "baseDamagePercent": 90,
    "spellIds": [
      "water-barrier",
      "water-lance",
      "water-reflect"
    ]
  },
  "ninja:village-guard:water": {
    "hp": 210,
    "sealDelay": 0.8,
    "baseDamagePercent": 95,
    "spellIds": [
      "water-barrier",
      "water-lance",
      "water-reflect"
    ]
  },
  "ninja:guardian-guard:water": {
    "hp": 240,
    "sealDelay": 0.7,
    "baseDamagePercent": 100,
    "mana": 120
  },
  "ninja:arena:water": {
    "hp": 180,
    "baseDamagePercent": 90,
    "sealDelay": 0.8,
    "spellIds": [
      "water-barrier",
      "water-reflect",
      "water-lance"
    ]
  },
  "guardian:water:1": {
    "infiniteMana": false,
    "sealDelay": 0.65,
    "baseDamagePercent": 100,
    "hp": 240,
    "mana": 150
  },
  "guardian:water:2": {
    "hp": 300,
    "baseDamagePercent": 100
  },
  "ninja:random:fire": {
    "hp": 210,
    "baseDamagePercent": 9,
    "spellIds": [
      "fire-volley",
      "fire-barrier",
      "fire-reflect"
    ]
  },
  "ninja:quest:fire": {
    "hp": 210,
    "baseDamagePercent": 94,
    "spellIds": [
      "fire-volley",
      "fire-barrier",
      "fire-lance"
    ]
  },
  "ninja:sidequest:fire": {
    "hp": 210,
    "baseDamagePercent": 94,
    "spellIds": [
      "fire-volley",
      "fire-barrier",
      "fire-reflect"
    ]
  },
  "ninja:village-guard:fire": {
    "hp": 240,
    "baseDamagePercent": 99,
    "sealDelay": 0.75,
    "spellIds": [
      "fire-volley",
      "fire-barrier",
      "fire-reflect"
    ]
  },
  "ninja:arena:fire": {
    "hp": 210,
    "baseDamagePercent": 94,
    "sealDelay": 0.8,
    "spellIds": [
      "fire-volley",
      "fire-barrier",
      "fire-reflect"
    ]
  },
  "ninja:guardian-guard:fire": {
    "hp": 280,
    "baseDamagePercent": 104,
    "sealDelay": 0.65,
    "mana": 120
  },
  "guardian:fire:1": {
    "hp": 280,
    "infiniteMana": false,
    "sealDelay": 0.6,
    "baseDamagePercent": 104,
    "mana": 150
  },
  "guardian:fire:2": {
    "hp": 350,
    "baseDamagePercent": 104
  },
  "event:fire:0": {
    "hp": 260,
    "sealDelay": 0.7,
    "baseDamagePercent": 99,
    "spellIds": [
      "fire-volley",
      "fire-barrier",
      "fire-lance"
    ],
    "mana": 120
  },
  "event:fire:1": {
    "hp": 260,
    "sealDelay": 0.7,
    "baseDamagePercent": 99,
    "spellIds": [
      "lightning-lance",
      "lightning-volley",
      "lightning-reflect"
    ],
    "mana": 120
  },
  "guardian:lightning:1": {
    "infiniteMana": false,
    "mana": 150,
    "baseDamagePercent": 108,
    "hp": 320,
    "sealDelay": 0.55
  },
  "ninja:guardian-guard:lightning": {
    "mana": 120,
    "sealDelay": 0.6,
    "baseDamagePercent": 108,
    "hp": 320
  },
  "ninja:village-guard:lightning": {
    "sealDelay": 0.7,
    "baseDamagePercent": 103,
    "hp": 270
  },
  "ninja:arena:lightning": {
    "sealDelay": 0.75,
    "baseDamagePercent": 98,
    "hp": 240,
    "spellIds": [
      "lightning-lance",
      "lightning-barrier",
      "lightning-reflect"
    ]
  },
  "ninja:random:lightning": {
    "baseDamagePercent": 98,
    "hp": 240,
    "spellIds": [
      "lightning-lance",
      "lightning-barrier",
      "lightning-reflect"
    ]
  },
  "ninja:quest:lightning": {
    "baseDamagePercent": 98,
    "hp": 240,
    "spellIds": [
      "lightning-lance",
      "lightning-barrier",
      "lightning-volley"
    ]
  },
  "ninja:sidequest:lightning": {
    "baseDamagePercent": 98,
    "hp": 240,
    "spellIds": [
      "lightning-lance",
      "lightning-barrier",
      "lightning-volley"
    ]
  },
  "guardian:lightning:2": {
    "baseDamagePercent": 108,
    "hp": 400
  },
  "ninja:practice": {
    "hp": 300,
    "sealDelay": 0.5
  },
  "ninja:random:wind": {
    "baseDamagePercent": 102,
    "sealDelay": 0.7,
    "hp": 270,
    "spellIds": [
      "wind-orb",
      "wind-volley",
      "wind-lance"
    ]
  },
  "ninja:quest:wind": {
    "baseDamagePercent": 102,
    "sealDelay": 0.7,
    "hp": 270,
    "spellIds": [
      "wind-orb",
      "wind-volley",
      "wind-barrier"
    ]
  },
  "ninja:sidequest:wind": {
    "baseDamagePercent": 102,
    "sealDelay": 0.7,
    "hp": 270,
    "spellIds": [
      "wind-orb",
      "wind-volley",
      "wind-lance"
    ]
  },
  "ninja:village-guard:wind": {
    "baseDamagePercent": 107,
    "sealDelay": 0.65,
    "hp": 300
  },
  "ninja:guardian-guard:wind": {
    "baseDamagePercent": 112,
    "hp": 360,
    "mana": 120,
    "sealDelay": 0.55
  },
  "ninja:arena:wind": {
    "baseDamagePercent": 102,
    "sealDelay": 0.7,
    "hp": 270,
    "spellIds": [
      "wind-orb",
      "wind-volley",
      "wind-lance"
    ]
  },
  "guardian:wind:1": {
    "baseDamagePercent": 112,
    "sealDelay": 0.5,
    "hp": 360,
    "infiniteMana": false,
    "mana": 150
  },
  "guardian:wind:2": {
    "baseDamagePercent": 112,
    "hp": 450
  },
  "ninja:random:earth": {
    "sealDelay": 0.65,
    "hp": 300,
    "baseDamagePercent": 106,
    "spellIds": [
      "earth-orb",
      "earth-barrier",
      "earth-volley"
    ]
  },
  "ninja:quest:earth": {
    "sealDelay": 0.65,
    "hp": 300,
    "baseDamagePercent": 106,
    "spellIds": [
      "earth-orb",
      "earth-barrier",
      "earth-volley"
    ]
  },
  "ninja:sidequest:earth": {
    "sealDelay": 0.65,
    "hp": 300,
    "baseDamagePercent": 106,
    "spellIds": [
      "earth-orb",
      "earth-barrier",
      "earth-volley"
    ]
  },
  "ninja:village-guard:earth": {
    "sealDelay": 0.6,
    "hp": 330,
    "baseDamagePercent": 111
  },
  "ninja:guardian-guard:earth": {
    "sealDelay": 0.5,
    "mana": 120,
    "hp": 400,
    "baseDamagePercent": 116
  },
  "ninja:arena:earth": {
    "sealDelay": 0.65,
    "hp": 300,
    "baseDamagePercent": 106,
    "spellIds": [
      "earth-orb",
      "earth-barrier",
      "earth-volley"
    ]
  },
  "guardian:earth:1": {
    "sealDelay": 0.45,
    "infiniteMana": false,
    "mana": 150,
    "hp": 400,
    "baseDamagePercent": 116
  },
  "guardian:earth:2": {
    "hp": 500,
    "baseDamagePercent": 116
  },
  "ninja:random:wood": {
    "hp": 360,
    "sealDelay": 0.6,
    "baseDamagePercent": 110,
    "spellIds": [
      "wood-reflect",
      "wood-orb",
      "wood-lance",
      "wood-barrier"
    ]
  },
  "ninja:quest:wood": {
    "hp": 360,
    "sealDelay": 0.6,
    "baseDamagePercent": 110,
    "spellIds": [
      "wood-reflect",
      "wood-orb",
      "wood-lance",
      "wood-barrier"
    ]
  },
  "ninja:sidequest:wood": {
    "hp": 360,
    "sealDelay": 0.6,
    "baseDamagePercent": 110
  },
  "ninja:village-guard:wood": {
    "hp": 390,
    "sealDelay": 0.55,
    "baseDamagePercent": 115,
    "spellIds": [
      "wood-reflect",
      "wood-orb",
      "wood-lance",
      "wood-barrier"
    ]
  },
  "ninja:guardian-guard:wood": {
    "hp": 480,
    "mana": 130,
    "sealDelay": 0.45,
    "baseDamagePercent": 120
  },
  "guardian:wood:1": {
    "hp": 480,
    "infiniteMana": false,
    "mana": 160,
    "sealDelay": 0.4,
    "baseDamagePercent": 120
  },
  "ninja:arena:wood": {
    "hp": 360,
    "sealDelay": 0.6,
    "baseDamagePercent": 110,
    "spellIds": [
      "wood-reflect",
      "wood-orb",
      "wood-lance",
      "wood-barrier"
    ]
  },
  "guardian:wood:2": {
    "hp": 600,
    "baseDamagePercent": 120
  },
  "ninja:random:ice": {
    "hp": 360,
    "sealDelay": 0.6,
    "baseDamagePercent": 110,
    "spellIds": [
      "ice-reflect",
      "ice-lance",
      "ice-barrier",
      "ice-orb"
    ]
  },
  "ninja:quest:ice": {
    "hp": 360,
    "sealDelay": 0.6,
    "baseDamagePercent": 110,
    "spellIds": [
      "ice-reflect",
      "ice-barrier",
      "ice-orb",
      "ice-volley"
    ]
  },
  "ninja:sidequest:ice": {
    "hp": 360,
    "sealDelay": 0.6,
    "baseDamagePercent": 110,
    "spellIds": [
      "ice-reflect",
      "ice-lance",
      "ice-barrier",
      "ice-orb"
    ]
  },
  "ninja:village-guard:ice": {
    "hp": 390,
    "sealDelay": 0.55,
    "baseDamagePercent": 115,
    "spellIds": [
      "ice-reflect",
      "ice-orb",
      "ice-barrier",
      "water-lance"
    ]
  },
  "ninja:guardian-guard:ice": {
    "hp": 480,
    "mana": 130,
    "sealDelay": 0.45,
    "baseDamagePercent": 120
  },
  "ninja:arena:ice": {
    "hp": 360,
    "sealDelay": 0.6,
    "baseDamagePercent": 110,
    "spellIds": [
      "ice-reflect",
      "ice-lance",
      "ice-barrier",
      "ice-orb"
    ]
  },
  "guardian:ice:1": {
    "hp": 480,
    "infiniteMana": false,
    "mana": 160,
    "sealDelay": 0.4,
    "baseDamagePercent": 120
  },
  "guardian:ice:2": {
    "hp": 600,
    "baseDamagePercent": 120
  },
  "ninja:random:light": {
    "hp": 390,
    "baseDamagePercent": 115,
    "sealDelay": 0.55,
    "spellIds": [
      "light-orb",
      "light-barrier",
      "light-reflect",
      "light-lance"
    ]
  },
  "ninja:quest:light": {
    "hp": 390,
    "baseDamagePercent": 115,
    "sealDelay": 0.55,
    "spellIds": [
      "light-orb",
      "light-barrier",
      "light-reflect",
      "light-lance"
    ]
  },
  "ninja:sidequest:light": {
    "hp": 390,
    "baseDamagePercent": 115,
    "sealDelay": 0.55,
    "spellIds": [
      "light-orb",
      "light-barrier",
      "light-reflect",
      "light-lance"
    ]
  },
  "ninja:village-guard:light": {
    "hp": 420,
    "baseDamagePercent": 120,
    "spellIds": [
      "light-orb",
      "light-lance",
      "light-barrier",
      "light-reflect"
    ]
  },
  "ninja:guardian-guard:light": {
    "hp": 520,
    "mana": 130,
    "baseDamagePercent": 125,
    "sealDelay": 0.4
  },
  "guardian:light:1": {
    "hp": 520,
    "infiniteMana": false,
    "mana": 160,
    "baseDamagePercent": 125,
    "sealDelay": 0.35
  },
  "ninja:arena:light": {
    "hp": 390,
    "baseDamagePercent": 115,
    "sealDelay": 0.55,
    "spellIds": [
      "light-orb",
      "light-barrier",
      "light-reflect",
      "light-lance"
    ]
  },
  "guardian:light:2": {
    "hp": 650,
    "baseDamagePercent": 125
  },
  "ninja:random:dark": {
    "hp": 420,
    "sealDelay": 0.5,
    "baseDamagePercent": 120
  },
  "ninja:quest:dark": {
    "hp": 420,
    "sealDelay": 0.5,
    "baseDamagePercent": 120
  },
  "ninja:sidequest:dark": {
    "hp": 420,
    "sealDelay": 0.5,
    "baseDamagePercent": 120
  },
  "ninja:village-guard:dark": {
    "hp": 450,
    "sealDelay": 0.45,
    "baseDamagePercent": 125,
    "spellIds": [
      "dark-orb",
      "dark-lance",
      "dark-reflect",
      "dark-domain"
    ]
  },
  "ninja:guardian-guard:dark": {
    "hp": 560,
    "mana": 130,
    "sealDelay": 0.4,
    "baseDamagePercent": 130
  },
  "guardian:dark:1": {
    "hp": 560,
    "infiniteMana": false,
    "mana": 160,
    "sealDelay": 0.35,
    "baseDamagePercent": 130
  },
  "ninja:arena:dark": {
    "hp": 420,
    "sealDelay": 0.5,
    "baseDamagePercent": 120
  },
  "guardian:dark:3": {
    "mana": 160,
    "hp": 560,
    "sealDelay": 0.35,
    "baseDamagePercent": 130
  },
  "guardian:dark:2": {
    "hp": 700,
    "baseDamagePercent": 130
  },
  "ninja:village-event:dark": {
    "hp": 600,
    "mana": 160,
    "sealDelay": 0.35,
    "baseDamagePercent": 130,
    "spellIds": [
      "dark-orb",
      "dark-lance",
      "dark-domain",
      "dark-volley",
      "dark-reflect"
    ]
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
  if(profile.tournamentStats){const s=profile.tournamentStats;return {...profile,balanceApplied:true,hp:s.maxHp,damageMultiplier:s.damageMultiplier,moveSpeed:s.moveSpeed,balanceStages:[{id:'school-tournament',mana:s.maxChakra,chakraRegen:s.chakraRegen,infiniteMana:false,sealDelay:profile.sealDelay??.9,baseDamagePercent:s.damageMultiplier*100}]};}
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
    result.squad=profile.squad.map((member,i)=>configureOpponent({...member,kind:profile.kind,village:member.village||profile.village,guardRole:member.guardRole||profile.guardRole,balanceId:profile.kind==='intro-trio'?'intro:'+member.element:profile.guardRole==='guardian'?'ninja:guardian-guard:'+profile.village:'event:'+profile.village+':'+i},overrides));
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
  const settings=opponentStage(profile,phase),ids=settings.spellIds||(phase>1?profile.phaseSpellIds:profile.spellIds),rules=new GameRules(ids,{maxChakra:Math.max(100,settings.mana),chakraRegen:settings.chakraRegen});
  rules.maxChakra=settings.mana;rules.chakra=settings.mana;
  if(settings.infiniteMana)rules.spells=rules.spells.map(s=>({...s,cost:0}));
  return rules;
}
export function scaleEnemySpell(spell,multiplier){
  const next={...spell,enemyDamageScale:multiplier};for(const key of ['damage','baseDamage','upgradeDamage','captureDamage','fallDamage'])if(typeof next[key]==='number')next[key]*=multiplier;return next;
}
