import assert from 'node:assert/strict';
import {VILLAGES,village,newJourney,readJourney,canTravel,CAMPAIGN_REGIONS,campaignStage} from '../src/adventure-data.js';
import {JOURNEY_ORDER,SEA_ROUTES,travelKind} from '../src/village-travel.js';
import {checkpointAccess} from '../src/adventure-access.js';

assert.deepEqual(JOURNEY_ORDER,['water','fire','lightning','wind','earth','wood','ice','light','dark']);
assert.deepEqual(CAMPAIGN_REGIONS,JOURNEY_ORDER.slice(3,-1));
assert.deepEqual(village('dark').links,['light']);
assert.deepEqual(village('earth').links,['wind','wood','ice']);
for(const v of VILLAGES)for(const to of v.links){
  assert.ok(village(to).links.includes(v.id),`${v.id} ↔ ${to}`);
  assert.equal(travelKind(v.id,to),travelKind(to,v.id));
}
for(const [a,b] of SEA_ROUTES){assert.ok(village(a).links.includes(b));assert.equal(travelKind(a,b),'dock');}
for(const a of ['wood','ice','light'])for(const b of ['wood','ice','light'])if(a!==b)assert.equal(travelKind(a,b),'dock');
assert.equal(travelKind('light','dark'),'gate');
const save=newJourney();assert.equal(canTravel(save,'water').allowed,false);save.story.stage='infiltrate';
for(const [index,id] of JOURNEY_ORDER.entries()){
  if(index===3)save.campaign.treatySigned=true;
  assert.equal(canTravel(save,id).allowed,true,`${id} opens after the preceding mission`);
  assert.equal(checkpointAccess(save,id).allowed,false,'a locked or inactive checkpoint cannot skip a first visit');
  for(const later of JOURNEY_ORDER.slice(index+1))assert.equal(canTravel(save,later).allowed,false,`${later} cannot bypass ${id}`);
  const queue=[save.village],seen=new Set(queue);while(queue.length){const at=queue.shift();for(const next of village(at).links)if(!seen.has(next)&&canTravel({...save,village:at},next).allowed){seen.add(next);queue.push(next);}}
  assert.ok(seen.has(id),`the next chapter ${id} is reachable across real exits`);
  save.village=id;save.visited.push(id);save.story.peaceSeals.push(id);save.bosses[id]=true;
  if(CAMPAIGN_REGIONS.includes(id))save.campaign.deliveries.push(id);
  const loaded=readJourney({getItem:()=>JSON.stringify(save)});assert.ok(loaded);assert.deepEqual(loaded.story.peaceSeals,save.story.peaceSeals);
}
assert.equal(canTravel(save,'missing').allowed,false);
assert.equal(campaignStage(save),'complete');
const legacy=newJourney();legacy.story.stage='infiltrate';legacy.visited.push('wood');legacy.campaign.treatySigned=true;
assert.equal(canTravel(legacy,'wood').allowed,true,'existing journeys retain access to villages already visited');
console.log('PASS: required nine-village progression, bidirectional land/boat graph, no island gates, Quang–Ám only, checkpoint locks, reachable chapters and saved progress.');
