import assert from 'node:assert/strict';
import {newJourney,readJourney,canTravel,VILLAGES,resolveBattle,campaignObjective} from '../src/adventure-data.js';
import {VILLAGE_EVENTS,advanceVillageEvent} from '../src/village-events.js';
import {createAdminSession,checkpointAccess,adminOpponents} from '../src/adventure-access.js';
import {buyEquipment,shopStock} from '../src/equipment.js';
import {gainExperience} from '../src/progression.js';
const normal=newJourney();assert.equal(normal.gold,0);assert.equal(canTravel(normal,'fire').allowed,false);assert.equal(checkpointAccess(normal,'water').allowed,false);
normal.story.stage='infiltrate';normal.visited.push('water');assert.equal(canTravel(normal,'water').allowed,true);assert.equal(checkpointAccess(normal,'water').allowed,false,'visiting does not activate a teleport point');normal.activated.push('water');assert.equal(checkpointAccess(normal,'water').allowed,true);assert.equal(checkpointAccess(normal,'wood').allowed,false);assert.equal(checkpointAccess(normal,'missing',true).allowed,false);
normal.gold=83;normal.bosses.dark=true;const before=structuredClone(normal),session=createAdminSession(),draft=session.enter(normal);assert.ok(session.active);assert.notEqual(draft,normal);assert.equal(draft.gold,Infinity);assert.equal(draft.learnedSpells.length,45);
for(const v of VILLAGES){assert.equal(checkpointAccess(draft,v.id,true).allowed,true);const enemies=adminOpponents(v.id);assert.ok(enemies.some(e=>e.kind==='boss'));assert.ok(enemies.some(e=>e.kind==='quest'));assert.equal(new Set(enemies.map(e=>e.id)).size,enemies.length);}
assert.equal(adminOpponents('missing').length,0);assert.ok(adminOpponents('nameless').some(e=>e.kind==='intro-trio'));assert.ok(adminOpponents('dark').some(e=>e.details?.guardRole==='guardian'));
const purchase=shopStock('nameless').find(item=>item.kind==='bag'&&!draft.equipment.ownedBags.includes(item.id));assert.ok(buyEquipment(draft,purchase.id).ok);assert.equal(draft.gold,Infinity);draft.village='water';draft.activated.push('wood');gainExperience(draft.progression,'wood',500);resolveBattle(draft,{kind:'boss',village:'water'},true);draft.hero.name='Admin copy';draft.story.sidequests['test']=3;assert.deepEqual(normal,before,'purchases, rewards, XP, quests, equipment, position and identity are isolated');const restored=session.leave();assert.deepEqual(restored,before);assert.equal(session.active,false);assert.equal(session.leave(),null);
const second=session.enter(restored);assert.equal(second.bosses.water,undefined);assert.equal(second.gold,Infinity);assert.deepEqual(session.leave(),before,'each admin run starts from normal progress');assert.equal(readJourney({getItem:()=>JSON.stringify(before)}).gold,83,'earned money in existing saves is retained');
const fresh=newJourney(),original=structuredClone(fresh),local=session.enter(fresh);
for(const v of VILLAGES){
 local.village=v.id;const objective=campaignObjective(local,{localOnly:true});assert.equal(objective.targetVillage,v.id,'admin never routes the main quest back to another village');
 if(v.id==='nameless'){assert.equal(objective.targetKind,'lore');continue;}
 assert.equal(objective.targetKind,'village-event');assert.equal(objective.targetId,`story-${v.id}-0`);assert.equal(campaignObjective(local).targetVillage,'nameless','normal opening prerequisites remain intact');
 for(let step=0;step<VILLAGE_EVENTS[v.id].stages.length;step++)assert.ok(advanceVillageEvent(local,v.id,step,{victory:true}).ok);
 assert.equal(campaignObjective(local,{localOnly:true}).targetKind,'boss');resolveBattle(local,{kind:'boss',village:v.id},true);assert.equal(campaignObjective(local,{localOnly:true}).targetKind,'npc');
 local.story.peaceSeals.push(v.id);assert.equal(campaignObjective(local,{localOnly:true}).targetKind,'mentor');local.mentors[v.id]=true;assert.equal(campaignObjective(local,{localOnly:true}).targetKind,'complete');assert.equal(campaignObjective(local,{localOnly:true}).targetVillage,v.id);
}
assert.deepEqual(fresh,original);assert.deepEqual(session.leave(),original,'local admin chapters, rescue and boss progress roll back together');
console.log('PASS: zero starting coins, campaign and activated-point locks, admin-only infinite wallet and complete opponent catalog, deeply isolated purchases/rewards/XP/quests/equipment, exact rollback and clean repeated admin runs.');
