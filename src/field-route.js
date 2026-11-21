import vietnamese from './locales/field-route.vi.json' with {type:'json'};
import english from './locales/field-route.en.json' with {type:'json'};
import {gameLanguage} from './language.js';

export const FIELD_ROUTE=gameLanguage()==='en'?english:vietnamese;
export const FIELD_ROUTE_REVISION=1;
const BRIDGE_KEY='nameless:road';
export function enableFieldRoute(save){
  for(const journey of [save,save.checkpointSave?.snapshot]){
    if(!journey?.story||journey.story.fieldRouteRevision===FIELD_ROUTE_REVISION)continue;
    journey.story.fieldRouteRevision=FIELD_ROUTE_REVISION;
    journey.story.fieldMissions={};
    if(journey.story.questItems?.includes('fire:lotus-medicine'))journey.story.fieldMissions['fire:2']={step:FIELD_ROUTE.events['fire:2'].steps.length};
  }
}
function missionProgress(save,key,definition){
  if(save.story?.fieldRouteRevision!==FIELD_ROUTE_REVISION||!definition)return null;
  const step=Math.min(definition.steps.length,Math.max(0,save.story.fieldMissions?.[key]?.step||0));
  return {...definition,key,step,task:definition.steps[step]||null,complete:step===definition.steps.length,bridge:key===BRIDGE_KEY};
}
export function fieldMission(save,event){
  if(!event)return null;
  const key=event.village+':'+event.step;
  return missionProgress(save,key,FIELD_ROUTE.events[key]);
}
export function bridgeMission(save){
  if(!['guardian','report','infiltrate'].includes(save.story?.stage))return null;
  return missionProgress(save,BRIDGE_KEY,FIELD_ROUTE.opening);
}
export function fireRescueMission(save){
  return save.story?.villageEvents?.fire===2?fieldMission(save,{village:'fire',step:2}):null;
}
export function completeFieldTask(save,key,expectedStep){
  const definition=key===BRIDGE_KEY?FIELD_ROUTE.opening:FIELD_ROUTE.events[key];
  if(save.story?.fieldRouteRevision!==FIELD_ROUTE_REVISION||!definition||!Number.isInteger(expectedStep))return null;
  save.story.fieldMissions??={};
  const before=save.story.fieldMissions[key]?.step||0;
  if(before!==expectedStep||before>=definition.steps.length)return null;
  if(key==='fire:2'){
    const item={grant:'fire:hong-lien',treat:'fire:lotus-medicine'}[definition.steps[before].action];
    if(item&&!save.story.questItems?.includes(item))return null;
  }
  save.story.fieldMissions[key]={step:before+1};
  const complete=before+1===definition.steps.length;
  if(complete&&key===BRIDGE_KEY){save.gold+=35;save.xp+=40;}
  return {complete,result:definition.steps[before].result,key,bridge:key===BRIDGE_KEY};
}
export function readFieldMissions(raw){
  return Object.fromEntries(Object.entries(raw||{}).flatMap(([key,value])=>{
    const d=key===BRIDGE_KEY?FIELD_ROUTE.opening:FIELD_ROUTE.events[key];
    return d&&Number.isInteger(value?.step)&&value.step>=0&&value.step<=d.steps.length?[[key,{step:value.step}]]:[];
  }));
}
export function fieldObjective(save,event){
  const mission=fieldMission(save,event);if(!mission||mission.complete)return null;
  const target=mission.task.target||{kind:'field-task',id:'field-'+mission.key+'-'+mission.step};
  return {title:mission.task.label,description:mission.task.description,targetVillage:event.village,targetKind:target.kind,targetId:target.id,storyStep:mission.step+1,storyTotal:mission.steps.length};
}
