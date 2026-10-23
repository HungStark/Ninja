import {BALANCE_VERSION} from './battle-coaching.js';
export const BATTLE_HISTORY_KEY='anhoa-battle-history-v1';
const round=n=>Math.round(n*100)/100;
export function createBattleMetrics(){
  let active=false,ended=false,time=0,inputTime=0,start=null,lastSeal=null,seals=0,errors=0,waitCooldown=0,waitChakra=0,casts=[],totalCasts=0,distinct=new Set(),repeat=0,lastId=null,blocked=0,expired=0,unused=0,platform='desktop',wallRefs=new Map();
  const api={
    reset(device='desktop'){active=true;ended=false;time=inputTime=seals=errors=waitCooldown=waitChakra=repeat=blocked=expired=unused=totalCasts=0;start=lastSeal=lastId=null;casts=[];distinct=new Set();wallRefs=new Map();platform=device;},
    advance(dt,{controlled=false,cooldown=false,chakra=false}={}){if(!active||ended)return;time+=dt;if(!controlled){inputTime+=dt;if(cooldown)waitCooldown+=dt;if(chakra)waitChakra+=dt;}},
    seal(valid,length){if(!active||ended)return;seals++;if(!valid){errors++;start=length?inputTime:null;}else if(start===null)start=inputTime;lastSeal=inputTime;},
    clear(){start=lastSeal=null;},
    cast(spell){
      if(!active||ended)return;
      if(lastId===spell.id)repeat++;lastId=spell.id;
      totalCasts++;distinct.add(spell.id);
      casts.push({id:spell.id,seals:spell.sequence.length,at:round(time),inputSeconds:round(start===null||lastSeal===null?0:lastSeal-start),waitAfterSeals:round(lastSeal===null?0:inputTime-lastSeal)});
      if(casts.length>256)casts.shift();api.clear();
    },
    block(amount){if(active&&!ended)blocked+=Math.max(0,amount);},
    observeWalls(walls){
      if(!active||ended)return;
      const live=new Map(walls.filter(w=>w.owner==='player').map(w=>[w.earthEffect||w,w]));
      for(const [key,wall] of wallRefs)if(!live.has(key)&&wall.life<=1e-6&&wall.hp>0){expired++;unused+=wall.hp;}
      wallRefs=live;
    },
    snapshot(){
      const groups={};for(const c of casts){const g=groups[c.seals]||(groups[c.seals]={samples:0,seconds:0});g.samples++;g.seconds+=c.inputSeconds;}
      return {version:BALANCE_VERSION,platform,active:active&&!ended,duration:round(time),seals,errors,totalCasts,casts:casts.map(c=>({...c})),distinctSpells:distinct.size,repeatRate:totalCasts>1?round(repeat/(totalCasts-1)):0,waitCooldown:round(waitCooldown),waitChakra:round(waitChakra),sealTimes:Object.fromEntries(Object.entries(groups).map(([n,g])=>[n,{samples:g.samples,meanSeconds:round(g.seconds/g.samples),meanInterval:round(g.seconds/g.samples/(Number(n)-1))}])),blockedDamage:round(blocked),wallsExpiredWithDurability:expired,unusedDurability:round(unused)};
    },
    finish(outcome,storage){
      if(!active||ended)return null;ended=true;const report={...api.snapshot(),outcome,recordedAt:new Date().toISOString()};
      if(seals||casts.length)try{const old=JSON.parse(storage?.getItem(BATTLE_HISTORY_KEY)||'[]');storage?.setItem(BATTLE_HISTORY_KEY,JSON.stringify([...(Array.isArray(old)?old:[]).slice(-19),report]));}catch{}
      return report;
    }
  };return api;
}

export function battleMetricsMarkup(report){
  const samples=Object.entries(report.sealTimes).map(([n,g])=>`${n} ấn: ${g.meanSeconds.toFixed(1)} giây (${g.samples} lần)`).join(' · ')||'Chưa có chuỗi hoàn chỉnh';
  return `<summary>Thống kê trận · ${report.distinctSpells} chiêu khác nhau</summary><div><p>${report.totalCasts} lần thi triển · lặp liên tiếp ${Math.round(report.repeatRate*100)}% · ${report.errors} lần sai ấn</p><p>Kết ấn: ${samples}</p><p>Chờ khi đã đủ ấn: hồi chiêu ${report.waitCooldown.toFixed(1)} giây · mana ${report.waitChakra.toFixed(1)} giây</p><p>Tường đã chặn ${report.blockedDamage} sát thương · ${report.wallsExpiredWithDurability} tường hết hạn còn độ bền</p><small>Thời gian từ ấn đầu đến ấn cuối, gồm lúc suy nghĩ; không tính tạm dừng hoặc khống chế. Lưu 20 trận gần nhất trên thiết bị.</small></div>`;
}
