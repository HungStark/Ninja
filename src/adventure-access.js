import {QUESTS,village,canTravel} from './adventure-data.js';
import {ALL_ADVENTURE_SPELLS,REGIONS} from './adventure-world.js';
import {INTRO_SQUAD,villageGuards,villageSidequests} from './journey-story.js';

export function checkpointAccess(save,target,admin=false){
  if(admin)return {allowed:!!village(target),reason:''};
  const access=canTravel(save,target);if(!access.allowed)return access;
  return save.activated.includes(target)?{allowed:true,reason:''}:{allowed:false,reason:'Hãy đến làng và kích hoạt ấn hồi sinh trước.'};
}

// Admin owns a disposable deep copy. Neither rewards nor purchases touch the original.
export function createAdminSession(){
  let baseline=null;
  return {
    get active(){return baseline!==null;},
    enter(save){if(baseline)return save;baseline=structuredClone(save);const draft=structuredClone(save);draft.gold=Infinity;draft.learnedSpells=[...ALL_ADVENTURE_SPELLS];return draft;},
    leave(){if(!baseline)return null;const restored=baseline;baseline=null;return restored;}
  };
}

export function adminOpponents(id){
  if(!village(id))return [];
  const region=REGIONS[id],list=[
    {id:'boss',kind:'boss',name:region.boss.name},
    {id:'random',kind:'random',name:'Ninja phá hoại · '+village(id).name},
    {id:'quest',kind:'quest',name:QUESTS[id].enemy},
    ...villageGuards(id).map(g=>({id:g.id,kind:'village-guard',name:g.label,details:{guardId:g.id,guardRole:g.guardRole}})),
    ...villageSidequests(id).filter(q=>q.type==='combat').map(q=>({id:q.id,kind:'sidequest',name:q.targetName,details:{questId:q.id}}))
  ];
  if(id==='nameless')list.push({id:'intro-trio',kind:'intro-trio',name:'Bộ ba ninja Hỏa · Thủy · Lôi'},...INTRO_SQUAD.map((n,i)=>({id:'intro-'+i,kind:'random',name:n.name,details:{...n}})));
  return list;
}
