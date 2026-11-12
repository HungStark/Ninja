import '../game-core.js';
import {newJourney,resolveBattle,signTreaty} from '../src/adventure-data.js';
import {promiseMother,chooseStarter,reportGuardian,negotiatePeace} from '../src/journey-story.js';
import {currentVillageEvent,advanceVillageEvent,villageEventEncounter} from '../src/village-events.js';
import {PLOT_ORDER,WAR_VILLAGES,acceptAlliance} from '../src/campaign-plot.js';
export function campaignFixtures(){
  const saves={},save=newJourney();saves.opening=structuredClone(save);promiseMother(save);chooseStarter(save,'fire-volley');resolveBattle(save,{kind:'intro-trio',village:'nameless'},true);reportGuardian(save);
  for(const id of [...PLOT_ORDER,'nameless']){
    if(id==='wind'){save.village='nameless';signTreaty(save);saves.homecoming=structuredClone(save);save.story.homecomingDone=true;}
    save.village=id;save.visited.push(id);
    while(currentVillageEvent(save)){const e=currentVillageEvent(save);if(id==='fire'&&e.step===2)save.story.questItems.push('fire:lotus-medicine');saves[id+':'+e.step]=structuredClone(save);if(e.battle)resolveBattle(save,{kind:'village-event',...villageEventEncounter(id,e.step)},true);else advanceVillageEvent(save,id,e.step);}
    saves[id+':report']=structuredClone(save);
    if(WAR_VILLAGES.includes(id)){resolveBattle(save,{kind:'boss',village:id},true);negotiatePeace(save,id);}else if(id!=='nameless')acceptAlliance(save,id);
  }
  saves.complete=structuredClone(save);return saves;
}
