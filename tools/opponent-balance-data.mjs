import {revisionOf,readCore} from './spell-balance-data.mjs';
import {newJourney,VILLAGES} from '../src/adventure-data.js';
import {encounterProfile} from '../src/progression.js';
import {INTRO_SQUAD} from '../src/journey-story.js';
import {villageEventEncounter} from '../src/village-events.js';
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
    const guardian=category==='guardian',beast=guardian&&phase===2;
    const hp=guardian?guardianPhaseHealth(profile.hp,village)[phase-1]:profile.hp;
    const baseDamagePercent=Number((opponentBaseDamageMultiplier({...profile,kind:guardian?'boss':profile.kind},phase)*100).toFixed(6));
    const defaults={hp,mana:100,infiniteMana:guardian,sealDelay:profile.sealDelay??.42,baseDamagePercent,spellIds:[...(guardian&&phase>1?profile.phaseSpellIds:profile.spellIds)]};
    rows.push({id,name,village,villageName:VILLAGES.find(v=>v.id===village)?.name||'Luyện tập',category,phase,form:guardian?(phase===1?'Ninja':phase===2?'Linh thú':'Hợp nhất'):'Ninja',canEditSpells:!guardian||phase===1,usesMana:!beast,defaults,values:{...defaults,...overrides[id]}});
  };
  const kinds={random:'Ninja lang thang',quest:'Đối thủ việc làng',sidequest:'Ninja nhiệm vụ phụ','village-guard':'Cảnh vệ làng','guardian-guard':'Cận vệ linh thú',arena:'Ninja võ đường'};
  for(const village of VILLAGES){
    for(const [kind,label]of Object.entries(kinds)){
      if(village.id==='nameless'&&['village-guard','guardian-guard'].includes(kind))continue;
      add('ninja:'+kind+':'+village.id,label,village.id,'ninja',encounterProfile(save,kind,village.id));
    }
    const profile=encounterProfile(save,'boss',village.id);
    for(let phase=1;phase<=(village.id==='dark'?3:2);phase++)add('guardian:'+village.id+':'+phase,GUARDIAN_FORMS[village.id].name+' · GĐ '+phase,village.id,'guardian',profile,phase);
  }
  for(const member of INTRO_SQUAD)add('intro:'+member.element,member.name,member.element,'intro',{...member,...enemySealTiming(0,'random')});
  for(const village of ['fire','dark']){
    const authored=villageEventEncounter(village),base=encounterProfile(save,'village-event',village),scale=1+Math.max(0,base.rank-1)*.08;
    const prepare=member=>({...member,hp:Math.round(member.hp/BOT_HEALTH_SCALE*scale)*BOT_HEALTH_SCALE,damageMultiplier:member.damageMultiplier*scale,...enemySealTiming(base.rank,'random')});
    if(authored.squad)authored.squad.forEach((member,i)=>add('event:'+village+':'+i,member.name,village,'event',prepare(member)));
    else add('ninja:village-event:dark','Kẻ giữ màn sương','dark','event',prepare(authored));
  }
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
