import {enemySealTiming,arenaRound} from './enemy-seal-timing.js';
const first=['water','fire','lightning'],later=['earth','wind','light','ice','wood'];
export function recordCampaignVisit(save,id=save.village){if(save.story?.stage!=='infiltrate'||id==='nameless')return;save.story.villageOrder??=[];if(!save.story.villageOrder.includes(id))save.story.villageOrder.push(id);}
export function campaignRank(save,id){if(id==='nameless')return 0;if(id==='dark')return 9;const group=first.includes(id)?first:later,offset=group===first?1:4,order=(save.story?.villageOrder||[]).filter(v=>group.includes(v)),at=order.indexOf(id);return offset+(at>=0?at:Math.min(group.length-1,group.filter(v=>save.bosses?.[v]).length));}
export function campaignStrength(save,id,kind){
 const rank=campaignRank(save,id),a=save.progression?.attributes||{},growth=1+Math.min(.12,(a.strength||0)*.0015+(a.health||0)*.001),elite=kind==='guardian-guard',guard=kind==='village-guard',boss=kind==='boss';
 const hp=boss?(rank===9?1650:rank===0?360:330+rank*110):elite?130+rank*32:guard?65+rank*25:65+rank*19;
 return {rank,hp:Math.round(hp*growth),damageMultiplier:(boss?.55:elite?.48:guard?.34:.3)+rank*(boss?.06:.035),...enemySealTiming(rank,kind,arenaRound(save)),restTime:Math.max(2.1,4-rank*.18-(elite?.25:0)),weaponInterval:Math.max(1.9,3.8-rank*.18)};
}
