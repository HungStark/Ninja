import assert from 'node:assert/strict';
import {
  VILLAGES,village,newJourney,readJourney,discoverZone,mentorReady,completeLesson,
  resolveBattle,canTravel,canSignTreaty,signTreaty,deliverTreaty,
  campaignStage,campaignObjective,CAMPAIGN_REGIONS
} from '../src/adventure-data.js';
import {REGIONS,STARTER_SPELLS,ALL_ADVENTURE_SPELLS} from '../src/adventure-world.js';
import '../game-core.js';
import {gainExperience,regionElement,canLearn,learnFromBook} from '../src/progression.js';

const read=save=>readJourney({getItem:()=>JSON.stringify(save)});
const validIds=new Set(SealGameCore.spells.map(spell=>spell.id));
assert.deepEqual(STARTER_SPELLS,['water-barrier']);
assert.equal(SealGameCore.spells.find(s=>s.id===STARTER_SPELLS[0]).style,'waterbubbles');
assert.equal(ALL_ADVENTURE_SPELLS.length,45);
assert.equal(new Set(ALL_ADVENTURE_SPELLS).size,45);
assert.ok(ALL_ADVENTURE_SPELLS.every(id=>validIds.has(id)));

// Use the actual world graph, rather than teleporting between campaign chapters.
function routeTo(save,target){
  const queue=[[save.village]],seen=new Set([save.village]);
  while(queue.length){
    const route=queue.shift(),last=route.at(-1);
    if(last===target)return route;
    for(const id of village(last).links){
      if(!seen.has(id)&&canTravel({...save,village:last},id).allowed){seen.add(id);queue.push([...route,id]);}
    }
  }
  return null;
}
function travel(save,target){
  const route=routeTo(save,target);assert.ok(route,`No legal route from ${save.village} to ${target}`);
  for(const id of route.slice(1)){
    assert.ok(village(save.village).links.includes(id));
    assert.equal(canTravel(save,id).allowed,true);
    save.village=id;if(!save.visited.includes(id))save.visited.push(id);
  }
}
function learn(save,id){
  assert.equal(save.village,id);
  const money=[save.gold,save.xp,save.wins],quests=JSON.stringify(save.quests);
  save.lessons[id]=1;
  for(const zoneId of REGIONS[id].mentor.zoneIds)discoverZone(save,id,zoneId);
  assert.equal(mentorReady(save,id),true);
  const reward=completeLesson(save,id);
  assert.equal(save.mentors[id],true);
  assert.ok(save.learnedSpells.some(spell=>spell.startsWith(regionElement(id)+'-')));
  assert.deepEqual([save.gold,save.xp,save.wins],money,'Learning must stay independent of fighting/rewards');
  assert.equal(JSON.stringify(save.quests),quests);
  const count=save.learnedSpells.length;assert.equal(completeLesson(save,id).learned,false);assert.equal(save.learnedSpells.length,count);
  return reward;
}
function defeat(save,id){
  assert.equal(save.village,id);assert.equal(save.mentors[id],true);
  if(CAMPAIGN_REGIONS.includes(id))assert.ok(save.campaign.deliveries.includes(id));
  const encounter={kind:'boss',village:id},before=[save.gold,save.xp,save.wins];
  resolveBattle(save,encounter,true);
  assert.deepEqual([save.gold,save.xp,save.wins],[before[0]+REGIONS[id].boss.rewardGold,before[1]+REGIONS[id].boss.rewardXp,before[2]+1]);
  assert.ok(REGIONS[id].boss.rewardSpells.every(spell=>save.learnedSpells.includes(spell)||save.progression.books.includes(spell)));
  const result=JSON.stringify(save);resolveBattle(save,encounter,true);assert.equal(JSON.stringify(save),result,'Repeated boss victory must not duplicate rewards');
  // Combat practice raises the system; owning a book alone never teaches it.
  gainExperience(save.progression,regionElement(id),420);
  for(const spell of [...save.progression.books])if(canLearn(save.progression,spell))learnFromBook(save,spell);
}

const start=newJourney();
assert.deepEqual(start.learnedSpells,['water-barrier']);
assert.equal(campaignStage(start),'water');
assert.equal(campaignObjective(start).targetVillage,'water');
assert.equal(campaignObjective(start).targetKind,'mentor');
assert.equal(canTravel(start,'water').allowed,true);
for(const id of VILLAGES.map(v=>v.id).filter(id=>!['nameless','water'].includes(id)))assert.equal(canTravel(start,id).allowed,false,id);
assert.equal(canTravel(start,'missing').allowed,false);
assert.equal(signTreaty(start),false);
for(const id of CAMPAIGN_REGIONS)assert.equal(deliverTreaty(start,id),false);

// A lesson must be accepted, and both correct districts must be explored.
travel(start,'water');
const waterZones=REGIONS.water.mentor.zoneIds;
assert.equal(discoverZone(start,'water','missing'),false);
assert.equal(discoverZone(start,'water',REGIONS.fire.zones[0].id),false);
assert.equal(discoverZone(start,'water',waterZones[0]),true);
assert.equal(discoverZone(start,'water',waterZones[0]),false);
assert.equal(completeLesson(start,'water').learned,false);
start.lessons.water=1;
assert.equal(mentorReady(start,'water'),false);
discoverZone(start,'water',waterZones[1]);
assert.equal(mentorReady(start,'water'),true);
const waterReward=completeLesson(start,'water');
assert.deepEqual(waterReward.spellIds,['water-lance']);
assert.equal(campaignObjective(start).targetKind,'boss');
assert.equal(start.gold,100000);assert.equal(start.xp,0);assert.equal(start.wins,0);assert.deepEqual(start.quests,{});
assert.equal(canTravel(start,'fire').allowed,false,'Learning alone must not unlock Hỏa/Lôi');
const namelessLesson=newJourney();namelessLesson.lessons.nameless=1;
for(const id of REGIONS.nameless.mentor.zoneIds)discoverZone(namelessLesson,'nameless',id);
assert.equal(mentorReady(namelessLesson,'nameless'),false,'The home mentor cannot bypass the opening water chapter');

// Both choices of second village must lead back to a physically reachable treaty.
for(const order of [['fire','lightning'],['lightning','fire']]){
  let save=read(start);
  defeat(save,'water');assert.equal(campaignStage(save),'fire-lightning');
  for(const id of order){
    assert.equal(canTravel(save,id).allowed,true);
    travel(save,id);assert.equal(campaignObjective(save).targetVillage,id,'An unfinished local chapter should take priority');
    assert.equal(campaignObjective(save).targetKind,'mentor');learn(save,id);defeat(save,id);
    save=read(save);assert.ok(save);
    if(id===order[0]){assert.equal(campaignStage(save),'fire-lightning');assert.equal(signTreaty(save),false);}
  }
  assert.equal(campaignStage(save),'treaty');
  assert.equal(campaignObjective(save).targetKind,'treaty');assert.equal(campaignObjective(save).targetVillage,'nameless');
  assert.equal(canSignTreaty(save),false,'Treaty cannot be signed away from Vô Danh');
  assert.equal(canTravel(save,'earth').allowed,false);
  travel(save,'nameless');assert.equal(canSignTreaty(save),true);assert.equal(signTreaty(save),true);assert.equal(signTreaty(save),false);
  assert.equal(campaignStage(save),'envoy');save=read(save);assert.equal(save.campaign.treatySigned,true);
  for(const id of CAMPAIGN_REGIONS)assert.equal(canTravel(save,id).allowed,true);
  for(const id of ['wood','ice','earth','light','wind']){
    travel(save,id);
    assert.equal(campaignObjective(save).targetKind,'envoy');assert.equal(campaignObjective(save).targetVillage,id);
    assert.equal(deliverTreaty(save,'dark'),false);assert.equal(deliverTreaty(save,CAMPAIGN_REGIONS.find(other=>other!==id)),false,'Cannot deliver remotely');
    assert.equal(deliverTreaty(save,id),true);assert.equal(deliverTreaty(save,id),false);
    assert.equal(campaignObjective(save).targetKind,'mentor');learn(save,id);assert.equal(campaignObjective(save).targetKind,'boss');
    assert.equal(canTravel(save,'dark').allowed,false,'Every regional victory is required, including the last one');
    defeat(save,id);save=read(save);
  }
  assert.equal(campaignStage(save),'dark');assert.equal(canTravel(save,'dark').allowed,true);
  const missingDelivery=structuredClone(save);missingDelivery.campaign.deliveries.pop();missingDelivery.visited.push('dark');assert.equal(canTravel(missingDelivery,'dark').allowed,false,'A prior visit cannot bypass the final gate');
  const missingVictory=structuredClone(save);delete missingVictory.bosses.wood;assert.equal(canTravel(missingVictory,'dark').allowed,false);
  travel(save,'dark');assert.equal(campaignObjective(save).targetKind,'mentor');learn(save,'dark');defeat(save,'dark');
  assert.equal(campaignStage(save),'complete');assert.equal(campaignObjective(save).targetKind,'complete');
  assert.deepEqual(new Set(save.learnedSpells),new Set(ALL_ADVENTURE_SPELLS),'All 45 arts must have an attainable progression path');
  assert.equal(read(save).campaign.deliveries.length,5);
  const finalProgress=JSON.stringify({bosses:save.bosses,campaign:save.campaign,arts:save.learnedSpells,gold:save.gold});
  save.checkpoint='water';resolveBattle(save,{kind:'random',village:'dark'},false);
  assert.equal(save.village,'water');assert.deepEqual(save.position,[0,7]);
  assert.equal(JSON.stringify({bosses:save.bosses,campaign:save.campaign,arts:save.learnedSpells,gold:save.gold}),finalProgress,'Defeat must preserve campaign and learned arts');
}

// Previous saves keep all 45 arts, while the mentor encounter can still progress.
const old=newJourney();delete old.learnedSpells;delete old.progression;delete old.campaign;delete old.lessons;delete old.mentors;delete old.discoveries;delete old.bosses;
const legacy=read(old);assert.equal(legacy.learnedSpells.length,45);travel(legacy,'water');
assert.equal(campaignObjective(legacy).targetKind,'mentor');
const oldReward=learn(legacy,'water');assert.equal(oldReward.learned,false);assert.deepEqual(oldReward.spellIds,[]);
assert.equal(campaignObjective(legacy).targetKind,'boss','A completed legacy lesson must not loop back to the mentor');
const corrupt=read({...newJourney(),learnedSpells:['bad','water-barrier','water-barrier'],discoveries:['water:lotus','water:lotus','bad'],lessons:{water:1,fire:2,missing:1},mentors:{water:'true',missing:true},bosses:{dark:1},campaign:{treatySigned:false,deliveries:['earth','missing','earth']}});
assert.deepEqual(corrupt.learnedSpells,['water-barrier']);assert.deepEqual(corrupt.discoveries,['water:lotus']);assert.deepEqual(corrupt.lessons,{water:1});assert.deepEqual(corrupt.mentors,{});assert.deepEqual(corrupt.bosses,{});assert.deepEqual(corrupt.campaign.deliveries,[]);
console.log('PASS: one water-bubble starter, actual graph routes, both leader orders, peaceful mentor prerequisites, treaty ceremony, five local deliveries/victories, final gate, all45 arts, idempotent rewards, defeats, and legacy/sanitized saves.');
