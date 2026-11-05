import {guardianPhaseHealth} from './guardian-arts.js';

export const opponentBalanceOverrides=/* opponent-balance:start */{}/* opponent-balance:end */;
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
