import vietnamese from './locales/field-route.vi.json' with {type:'json'};
import english from './locales/field-route.en.json' with {type:'json'};
import {gameLanguage} from './language.js';

export const FIELD_ROUTE=gameLanguage()==='en'?english:vietnamese;
export const FIELD_ROUTE_REVISION=1;
export function enableFieldRoute(save){
  for(const journey of [save,save.checkpointSave?.snapshot]){
    if(!journey?.story||journey.story.fieldRouteRevision===FIELD_ROUTE_REVISION)continue;
    journey.story.fieldRouteRevision=FIELD_ROUTE_REVISION;
    journey.story.fieldMissions={};
    if(journey.story.questItems?.includes('fire:lotus-medicine'))journey.story.fieldMissions['fire:2']={step:FIELD_ROUTE.events['fire:2'].steps.length};
  }
}
export function fieldMission(save,event=null){
  if(save.story?.fieldRouteRevision!==FIELD_ROUTE_REVISION)return null;
  const opening=save.story.stage==='guardian'&&!save.story.guardianRestored&&(!event||event.village==='nameless');
  const key=opening?'nameless:road':event?event.village+':'+event.step:null;
  const definition=key==='nameless:road'?FIELD_ROUTE.opening:FIELD_ROUTE.events[key];
  if(!definition)return null;
  const step=Math.min(definition.steps.length,Math.max(0,save.story.fieldMissions?.[key]?.step||0));
  return {...definition,key,step,task:definition.steps[step]||null,complete:step===definition.steps.length,opening};
}
export function completeFieldTask(save,key,expectedStep){
  const definition=key==='nameless:road'?FIELD_ROUTE.opening:FIELD_ROUTE.events[key];
  if(save.story?.fieldRouteRevision!==FIELD_ROUTE_REVISION||!definition||!Number.isInteger(expectedStep))return null;
  save.story.fieldMissions??={};
  const before=save.story.fieldMissions[key]?.step||0;
  if(before!==expectedStep||before>=definition.steps.length)return null;
  save.story.fieldMissions[key]={step:before+1};
  const complete=before+1===definition.steps.length;
  if(complete&&key==='nameless:road'){save.gold+=35;save.xp+=40;}
  if(complete&&key==='fire:2'){
    save.story.questItems=save.story.questItems.filter(id=>!['fire:hong-lien','fire:lotus-medicine'].includes(id));
    save.story.questItems.push('fire:lotus-medicine');save.expeditions.fire=3;
  }
  return {complete,result:definition.steps[before].result,key,opening:key==='nameless:road'};
}
export function readFieldMissions(raw){
  return Object.fromEntries(Object.entries(raw||{}).flatMap(([key,value])=>{
    const d=key==='nameless:road'?FIELD_ROUTE.opening:FIELD_ROUTE.events[key];
    return d&&Number.isInteger(value?.step)&&value.step>=0&&value.step<=d.steps.length?[[key,{step:value.step}]]:[];
  }));
}
export function fieldObjective(save,event=null){
  const mission=fieldMission(save,event);if(!mission||mission.complete)return null;
  return {title:mission.task.label,description:mission.task.description,targetVillage:mission.opening?'nameless':event.village,targetKind:'field-task',targetId:'field-'+mission.key+'-'+mission.step,storyStep:mission.step+1,storyTotal:mission.steps.length};
}
