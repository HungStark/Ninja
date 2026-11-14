import {revisionOf,readCore} from './spell-balance-data.mjs';
import {newJourney,VILLAGES} from '../src/adventure-data.js';
import {encounterProfile} from '../src/progression.js';
import {INTRO_SQUAD} from '../src/journey-story.js';
import {villageEventEncounter,VILLAGE_EVENTS} from '../src/village-events.js';
import {guardianPhaseHealth} from '../src/guardian-arts.js';
import {GUARDIAN_FORMS} from '../src/guardian-beasts.js';
import {PRACTICE_BOT_HP} from '../src/enemy-balance.js';
import {BOT_HEALTH_SCALE} from '../src/enemy-balance.js';
import {enemySealTiming} from '../src/enemy-seal-timing.js';
import {opponentBaseDamageMultiplier} from '../src/opponent-balance.js';
export const START='/* opponent-balance:start */',END='/* opponent-balance:end */';
export function parseOpponentOverrides(source){const start=source.indexOf(START),end=source.indexOf(END);if(start<0||end<start)throw Error('Không tìm thấy cấu hình đối thủ.');return JSON.parse(source.slice(start+START.length,end));}
export function opponentDocument(source,coreSource){
  const core=readCore(coreSource),overrides=parseOpponentOverrides(source),rows=[];
  const save=newJourney();save.story.stage='infiltrate';save.story.villageOrder=['water','fire','lightning','earth','wind','light','ice','wood','dark'];
  const add=(id,name,village,category,profile,phase=1)=>{
    if(rows.some(row=>row.id===id))return;
    const guardian=category==='guardian'||!!profile.storyBoss,beast=guardian&&phase===2,family=profile.guardianVillage||village;
    const hp=guardian?guardianPhaseHealth(profile.hp,family)[phase-1]:profile.hp;
    const baseDamagePercent=Number((opponentBaseDamageMultiplier({...profile,kind:guardian?'boss':profile.kind},phase)*100).toFixed(6));
    const defaults={hp,mana:100,infiniteMana:guardian,sealDelay:profile.sealDelay??.42,baseDamagePercent,spellIds:[...(guardian&&phase>1?profile.phaseSpellIds:profile.spellIds)]};
    const inherited=profile.storyBoss?overrides['guardian:'+family+':'+phase]:profile.legacyBalanceId?overrides[profile.legacyBalanceId]:null;
    if(inherited)Object.assign(defaults,inherited);
    rows.push({id,name,village,villageName:VILLAGES.find(v=>v.id===village)?.name||'Luyện tập',category,phase,storyBattle:profile.storyBattle||null,form:guardian?(phase===1?'Ninja':phase===2?'Linh thú':'Hợp nhất'):profile.storyBeast?'Linh thú':'Ninja',canEditSpells:!guardian||phase===1,usesMana:!beast,defaults,values:{...defaults,...overrides[id]}});
  };
  const kinds={random:'Ninja lang thang',quest:'Đối thủ việc làng',sidequest:'Ninja nhiệm vụ phụ','village-guard':'Cảnh vệ làng','guardian-guard':'Cận vệ linh thú',arena:'Ninja võ đường','village-event':'Đối thủ sự kiện · Mặc định'};
  for(const village of VILLAGES){
    for(const [kind,label]of Object.entries(kinds)){
      if(village.id==='nameless'&&['village-guard','guardian-guard'].includes(kind))continue;
      add('ninja:'+kind+':'+village.id,label,village.id,'ninja',encounterProfile(save,kind,village.id));
    }
    const profile=encounterProfile(save,'boss',village.id);
    for(let phase=1;phase<=(village.id==='dark'?3:2);phase++)add('guardian:'+village.id+':'+phase,GUARDIAN_FORMS[village.id].name+' · GĐ '+phase,village.id,'guardian',profile,phase);
  }
  for(const member of INTRO_SQUAD)add('intro:'+member.element,member.name,member.element,'intro',{...member,...enemySealTiming(0,'random')});
  for(const [village,chapter] of Object.entries(VILLAGE_EVENTS))chapter.stages.forEach((event,step)=>{
    if(!event.battle)return;
    if(event.storyBoss){
      const family=event.guardianVillage,profile={...encounterProfile(save,'boss',family),kind:'boss',storyBoss:true,storyBattle:event.battle,guardianVillage:family};
      for(let phase=1;phase<=(family==='dark'?3:2);phase++)add('story:'+event.battle+':'+phase,event.enemy+' · GĐ '+phase,village,'event',profile,phase);
      return;
    }
    const authored=villageEventEncounter(village,step,save);if(!authored)return;
    const base=encounterProfile(save,'village-event',village),scale=1+Math.max(0,base.rank-1)*.08;
    const members=authored.squad||[authored];
    members.forEach((member,i)=>{
      const legacy=authored.squad?'event:'+village+':'+i:'ninja:village-event:'+village;
      const profile={...base,...member,kind:'village-event',storyBattle:event.battle,legacyBalanceId:legacy,hp:Math.round(member.hp/BOT_HEALTH_SCALE*scale)*BOT_HEALTH_SCALE,damageMultiplier:member.damageMultiplier*scale,...enemySealTiming(base.rank,'random')};
      add('event:'+event.battle+':'+i,member.name,village,'event',profile);
      // Keep saved pre-campaign settings editable as inherited event defaults.
      if(authored.squad&&overrides[legacy])add(legacy,member.name+' · Mặc định sự kiện',village,'event',{...profile,legacyBalanceId:null});
    });
  });
  add('ninja:practice','Ninja tập luyện','practice','practice',{hp:PRACTICE_BOT_HP,spellIds:core.defaultLoadout,sealDelay:.42});
  return {revision:revisionOf(source),overrides,rows,villages:VILLAGES.map(v=>({id:v.id,name:v.name})),spells:core.spells.map(s=>({id:s.id,name:s.name,element:s.element,glyph:s.glyph,rank:s.rank})),elements:core.elements};
}
export function updateOpponentSource(source,coreSource,overrides){
  if(!overrides||typeof overrides!=='object'||Array.isArray(overrides))throw Error('Dữ liệu đối thủ không hợp lệ.');
  const document=opponentDocument(source,coreSource),rows=new Map(document.rows.map(r=>[r.id,r])),spells=new Set(document.spells.map(s=>s.id)),clean={};
  const limits={hp:[1,10000000],mana:[0,1000000],sealDelay:[.02,6],baseDamagePercent:[0,10000]};
  for(const [id,values]of Object.entries(overrides)){
    const row=rows.get(id);if(!row||!values||typeof values!=='object'||Array.isArray(values))throw Error('Đối thủ không hợp lệ: '+id);
    const result={};
    for(const [key,value]of Object.entries(values)){
      if(key==='spellIds'){
        if(!row.canEditSpells||!Array.isArray(value)||value.length<1||value.length>5||new Set(value).size!==value.length||value.some(id=>!spells.has(id)))throw Error('Bộ chiêu không hợp lệ: '+row.name);
      }else if(key==='infiniteMana'){
        if(!row.usesMana||typeof value!=='boolean')throw Error('Mana không hợp lệ: '+row.name);
      }else{
        const range=limits[key];if(!range||(!row.usesMana&&['mana','sealDelay'].includes(key))||typeof value!=='number'||!Number.isFinite(value)||value<range[0]||value>range[1])throw Error('Chỉ số không hợp lệ: '+row.name+' / '+key);
      }
      if(JSON.stringify(value)!==JSON.stringify(row.defaults[key]))result[key]=value;
    }
    if(Object.keys(result).length)clean[id]=result;
  }
  return source.slice(0,source.indexOf(START)+START.length)+JSON.stringify(clean,null,2)+source.slice(source.indexOf(END));
}
