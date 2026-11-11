import {BOT_HEALTH_SCALE} from './enemy-balance.js';
import {GUARDIAN_BOSS_DESIGNS} from './guardian-legacy-designs.js';
export const GUARDIAN_BASIC_TIMING=Object.freeze({charge:1.5,breathRecoil:.28,breathDuration:3.3,slamWindup:1,slamAscent:.45,slamDescent:.16,slamFlight:.61,armor:6});
export function guardianLeap(age){
 const t=age-GUARDIAN_BASIC_TIMING.slamWindup,{slamAscent:up,slamDescent:down}=GUARDIAN_BASIC_TIMING;
 if(t<=0)return {progress:0,height:0,lean:.25,stage:'windup'};
 if(t<up){const q=t/up,p=q*.5;return {progress:p*p*(3-2*p),height:8*Math.sin(q*Math.PI/2),lean:-.2,stage:'ascent'};}
 if(t<up+down){const q=(t-up)/down;return {progress:.5+.5*q,height:8*(1-q*q),lean:.3,stage:'descent'};}
 return {progress:1,height:0,lean:.18,stage:'landed'};
}
export function guardianBreath(age){
 const {charge,breathRecoil:recoil}=GUARDIAN_BASIC_TIMING;
 if(age<charge)return {stage:'charge',headPull:0,headTilt:0,orbScale:.12+1.35*age/charge,firing:false};
 if(age<charge+recoil){const q=(age-charge)/recoil,pull=Math.sin(q*Math.PI);return {stage:'recoil',headPull:.35*pull,headTilt:-.16*pull,orbScale:1.47,firing:false};}
 return {stage:'firing',headPull:-.08,headTilt:.06,orbScale:.85+Math.sin(age*35)*.07,firing:true};
}
export const GUARDIAN_ARTS={...GUARDIAN_BOSS_DESIGNS,
  nameless:{color:'#dfc58c',beam:'Cổ thạch tức',specials:[{name:'Cổ thạch trồi dậy',type:'columns',count:3,delay:.3,damage:24},{name:'Thạch trận khe hở',type:'lanes',damage:28}]}
};
export function guardianPhaseHealth(total,village){const weights=village==='dark'?[.3,.35,.35]:[.45,.55],parts=weights.map(w=>Math.round(total/BOT_HEALTH_SCALE*w)*BOT_HEALTH_SCALE);parts[parts.length-1]+=total-parts.reduce((a,b)=>a+b,0);return parts;}
export function empowerDarkGuardian(spell){
  if(spell.element!=='dark')return spell;
  return {...spell,cost:0,cooldown:Math.max(1,spell.cooldown*.6),damage:spell.style==='shadowclone'?30:spell.damage*1.5,...(spell.style==='shadowclone'?{upgradeDamage:45}:{}),maxClones:4,cloneCount:2,duration:spell.style==='shadowdive'?4.5:spell.duration,fallTime:spell.style==='shadowbind'?.5:spell.fallTime};
}
