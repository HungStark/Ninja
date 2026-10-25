import {BOT_HEALTH_SCALE} from './enemy-balance.js';
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
export const GUARDIAN_ARTS={
  water:{color:'#50baff',beam:'Thủy tức',specials:[{name:'Thủy trụ nghịch lưu',type:'columns',count:3,delay:.32,damage:24},{name:'Hải triều phân lộ',type:'waves',damage:28}]},
  fire:{color:'#ff793f',beam:'Hỏa tức',specials:[{name:'Hỏa sơn liên bạo',type:'columns',count:3,delay:.45,damage:28},{name:'Vành đai tro nóng',type:'ring',damage:13}]},
  lightning:{color:'#c4a0ff',beam:'Lôi tức',specials:[{name:'Lôi trụ liên hoàn',type:'columns',count:4,delay:.24,damage:22},{name:'Điện võng luân chuyển',type:'sweep',damage:15}]},
  wind:{color:'#9fe9ce',beam:'Phong tức',specials:[{name:'Phong luân kẹp',type:'pincers',damage:25},{name:'Mắt bão nghịch lưu',type:'eye',damage:12}]},
  earth:{color:'#d9ae69',beam:'Thạch tức',specials:[{name:'Địa trụ xung kích',type:'columns',count:5,delay:.28,damage:23},{name:'Thạch trận khe hở',type:'lanes',damage:30}]},
  light:{color:'#fff2ad',beam:'Quang tức',specials:[{name:'Lăng kính hội tụ',type:'columns',count:3,delay:0,damage:25},{name:'Nhật luân quét ngang',type:'sweep',damage:16}]},
  ice:{color:'#b4e8ff',beam:'Băng tức',specials:[{name:'Băng trụ truy dấu',type:'tracking',count:3,delay:.65,damage:22},{name:'Vành sương kết tinh',type:'frost',damage:10}]},
  wood:{color:'#97cc70',beam:'Diệp tức',specials:[{name:'Rễ cổ thụ săn đuổi',type:'tracking',count:4,delay:.5,damage:20},{name:'Cổ mộc hồi sinh',type:'heal',damage:0}]},
  dark:{color:'#b78ae8',beam:'Ám tức',specials:[{name:'Nguyệt thực cấm vực',type:'ring',damage:15},{name:'Bóng ma đoạn mệnh',type:'pincers',damage:28}]},
  nameless:{color:'#dfc58c',beam:'Cổ thạch tức',specials:[{name:'Cổ thạch trồi dậy',type:'columns',count:3,delay:.3,damage:24},{name:'Thạch trận khe hở',type:'lanes',damage:28}]}
};
export function guardianPhaseHealth(total,village){const weights=village==='dark'?[.3,.35,.35]:[.45,.55],parts=weights.map(w=>Math.round(total/BOT_HEALTH_SCALE*w)*BOT_HEALTH_SCALE);parts[parts.length-1]+=total-parts.reduce((a,b)=>a+b,0);return parts;}
export function empowerDarkGuardian(spell){
  if(spell.element!=='dark')return spell;
  return {...spell,cost:0,cooldown:Math.max(1,spell.cooldown*.6),damage:spell.style==='shadowclone'?30:spell.damage*1.5,...(spell.style==='shadowclone'?{upgradeDamage:45}:{}),maxClones:4,cloneCount:2,duration:spell.style==='shadowdive'?4.5:spell.duration,fallTime:spell.style==='shadowbind'?.5:spell.fallTime};
}
