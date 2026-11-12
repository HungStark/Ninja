import data from './locales/campaign.vi.json' with {type:'json'};
import translation from './locales/campaign.en.json' with {type:'json'};
import english from './locales/en.json' with {type:'json'};
import {gameLanguage} from './language.js';
import {REGIONS} from './adventure-world.js';
import {addBooks} from './progression.js';
import {companionUnconscious} from './companion-health.js';
import {earthDepartureTrialPending} from './earth-departure-trial.js';

const translate=(value,patch)=>Array.isArray(value)?value.map((v,i)=>Array.isArray(v)&&v.length===2&&typeof patch?.[i]==='string'?[v[0],patch[i]]:translate(v,patch?.[i])):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,translate(v,patch?.[k])])):typeof value==='string'?(typeof patch==='string'?patch:english[value]||value):value;
export const PLOT=gameLanguage()==='en'?translate(data,translation):data;
export const PLOT_VERSION=2;
export const WAR_VILLAGES=Object.freeze(['water','fire','lightning']);
export const ALLIANCE_VILLAGES=Object.freeze(['wind','earth','wood','ice','light','dark']);
export const PLOT_ORDER=Object.freeze([...WAR_VILLAGES,...ALLIANCE_VILLAGES]);
export const plotEventComplete=(save,id)=>(save.story?.villageEvents?.[id]||0)>=(PLOT.villages[id]?.stages.length||Infinity);
export const plotVillageComplete=(save,id)=>plotEventComplete(save,id)&&(WAR_VILLAGES.includes(id)?!!save.bosses?.[id]&&save.story?.peaceSeals?.includes(id):save.story?.alliances?.includes(id))&&(id!=='earth'||!earthDepartureTrialPending(save));
export const nextPlotVillage=save=>PLOT_ORDER.find(id=>!plotVillageComplete(save,id))||null;
export const companionPresent=save=>!!save.story?.companion?.recruited&&save.story?.companion?.phase!=='separated';
export const invasionAvailable=save=>!!save.story?.homecomingDone&&ALLIANCE_VILLAGES.every(id=>plotVillageComplete(save,id));
export const plotHostile=(save,id=save.village)=>WAR_VILLAGES.includes(id)&&!save.story?.peaceSeals?.includes(id);
export function canProgressPlot(save,id,{battleResult=false}={}){
  if(companionUnconscious(save)&&!battleResult)return false;
  if(save.story?.plotPreview)return true;
  if(save.story?.stage!=='infiltrate')return false;
  if(id==='nameless')return invasionAvailable(save);
  const index=PLOT_ORDER.indexOf(id);if(index<0)return false;
  if(!PLOT_ORDER.slice(0,index).every(key=>plotVillageComplete(save,key)))return false;
  return WAR_VILLAGES.includes(id)||!!save.campaign?.treatySigned&&!!save.story?.homecomingDone;
}
export function campaignChapter(save){
  if(save.story?.stage!=='infiltrate')return PLOT.chapters[0];
  const next=nextPlotVillage(save);return PLOT.chapters[next?PLOT.villages[next].chapter:4];
}
export function acceptAlliance(save,id){
  if(!ALLIANCE_VILLAGES.includes(id)||save.village!==id||!canProgressPlot(save,id)||!plotEventComplete(save,id)||save.story.alliances?.includes(id))return false;
  if(id==='earth'&&earthDepartureTrialPending(save))return false;
  save.story.alliances??=[];save.story.alliances.push(id);save.gold+=100;
  addBooks(save,REGIONS[id].boss.rewardSpells||[]);
  if(id==='wind')save.story.freedWindGuardian=true;
  return true;
}
