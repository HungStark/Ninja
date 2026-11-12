import assert from 'node:assert/strict';
import {newJourney,readJourney,resolveBattle,signTreaty} from '../src/adventure-data.js';
import {negotiatePeace,villageSidequests} from '../src/journey-story.js';
import {guardianOrdered,orderGuardianGuards,nextGuardianGuard,confrontationObjective,inCouncilCourtyard} from '../src/village-confrontation.js';
import {civicPoint} from '../src/village-civic.js';
import {readTreaties} from '../src/peace-treaties.js';
import {createEnemyMovement,defensivePosition} from '../src/enemy-movement.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {REGIONS} from '../src/adventure-world.js';
import {MIN_QUEST_ITEM_SPACING} from '../src/quest-placement.js';
import {battleConversation} from '../src/battle-conversation.js';
import {VILLAGE_EVENTS} from '../src/village-events.js';

const save=newJourney('Người giữ lời');save.village='fire';save.story.stage='infiltrate';
assert.equal(orderGuardianGuards(save),false);assert.equal(confrontationObjective(save,'fire').targetKind,'village-event');
save.story.villageEvents.fire=VILLAGE_EVENTS.fire.stages.length;
assert.equal(guardianOrdered(save),false);assert.ok(orderGuardianGuards(save));assert.equal(orderGuardianGuards(save),false);
assert.equal(nextGuardianGuard(save),'fire-guardian-sentry-1');
resolveBattle(save,{kind:'village-guard',village:'fire',element:'fire',guardId:nextGuardianGuard(save)},true);
assert.equal(nextGuardianGuard(save),'fire-guardian-sentry-2');
const reloaded=readJourney({getItem:()=>JSON.stringify(save)});assert.ok(guardianOrdered(reloaded));assert.equal(nextGuardianGuard(reloaded),'fire-guardian-sentry-2');
resolveBattle(save,{kind:'village-guard',village:'fire',element:'fire',guardId:nextGuardianGuard(save)},true);
assert.equal(nextGuardianGuard(save),null);assert.equal(confrontationObjective(save,'fire').targetKind,'npc');
assert.ok(battleConversation({kind:'guardian-order',village:'fire',name:'Linh thú'},save).some(l=>l.text.includes('nhập vào trưởng làng')));
assert.ok(battleConversation({kind:'boss',village:'fire',possessedChief:true},save)[0].text.includes('tinh nhuệ'));

save.bosses.fire=true;
const draft={content:'Không xâm lấn.\nBảo vệ mọi người. <script>không thực thi</script>',signature:[[[10,90],[40,20],[90,70],[140,35]]]};
assert.equal(negotiatePeace(save,'fire',{content:'',signature:[]}),false);
assert.ok(negotiatePeace(save,'fire',draft));const gold=save.gold;
assert.equal(negotiatePeace(save,'fire',draft),false);assert.equal(save.gold,gold);
const loaded=readJourney({getItem:()=>JSON.stringify(save)});
assert.deepEqual(loaded.story.treaties[0].signature,draft.signature);assert.equal(loaded.story.treaties[0].content,draft.content);assert.equal(loaded.story.treaties[0].signer,save.hero.name);
assert.deepEqual(readTreaties([{village:'bad',content:'x',signer:'x',signature:draft.signature},{village:'fire',content:'x',signer:'x',signature:[[[Infinity,0],[3,4]]]}]),[]);
save.village='nameless';save.story.peaceSeals=['water','fire','lightning'];assert.ok(signTreaty(save,draft));assert.equal(save.story.treaties.length,2);

const bot=createEnemyMovement(()=>.75),position=[0,1.72,-24],wall={owner:'enemy',p:[0,0,-21],normal:[0,0,1],width:8,hp:100,life:6};
let pos=bot.update(.8,{position,walls:[wall]});assert.deepEqual(pos,position);assert.equal(bot.state().mode,'sheltering');
pos=bot.update(.5,{position:[2,1.72,-24],walls:[wall]});assert.ok(pos[0]<2);assert.equal(bot.state().mode,'sheltering');
assert.deepEqual(bot.update(2,{position,frontGuard:true}),position);assert.equal(bot.state().mode,'sheltering');
assert.equal(defensivePosition(position,[{...wall,hp:0}]),null);assert.equal(defensivePosition(position,[wall],[],[0,1.72,-30]),null);
pos=bot.update(.5,{position,walls:[wall],shots:[{owner:'player',style:'meteor',target:[0,0,-24],p:[0,20,-24],blastRadius:3.5,life:5}]});assert.equal(bot.state().mode,'evading');assert.ok(Math.abs(pos[0])>2);
const sphere={owner:'enemy',kind:'sphere',center:[1,1.72,-21],normal:[0,0,1],radius:.8,life:8};assert.ok(defensivePosition(position,[],[sphere]));

globalThis.innerWidth=1000;globalThis.innerHeight=700;const world=createAdventureScene();
for(const id of Object.keys(REGIONS)){
  const state=newJourney();state.village=id;world.load(id,state);
  for(const q of villageSidequests(id))state.story.sidequests[q.id]=1;
  world.syncSidequests(state);
  const items=world.interactives.filter(i=>i.kind==='sidequest-target');
  for(let i=0;i<items.length;i++){
    assert.ok(!world.blocked(items[i].x,items[i].z),id+' reachable item '+items[i].id);
    for(let j=0;j<i;j++)assert.ok(Math.hypot(items[i].x-items[j].x,items[i].z-items[j].z)>=MIN_QUEST_ITEM_SPACING-.001,id+' item spacing');
  }
  if(id!=='nameless'){
    const court=world.civic.campuses.hall,inside=civicPoint(court,0,court.d/2-1),outside=civicPoint(court,0,court.d/2+1);
    assert.ok(inCouncilCourtyard(world.civic,{...inside,y:court.base}),id+' entering council courtyard');
    assert.equal(inCouncilCourtyard(world.civic,{...outside,y:court.base}),false,id+' outside council gate');
    assert.equal(inCouncilCourtyard(world.civic,{...inside,y:court.base+10}),false,id+' above courtyard');
    for(const gate of world.gates){const length=Math.hypot(gate.x,gate.z);assert.equal(inCouncilCourtyard(world.civic,{x:gate.x*(1-6/length),z:gate.z*(1-6/length)}),false,id+' village arrival stays outside council courtyard');}
    const guards=world.guardsState().filter(g=>g.guardRole==='guardian'),center=world.civic.guardian;
    assert.equal(guards.length,2);assert.ok(guards.every(g=>Math.hypot(g.x-center.x,g.z-center.z)<18),id+' guards directly ahead');
    state.story.villageEvents[id]=VILLAGE_EVENTS[id].stages.length;
    orderGuardianGuards(state);world.load(id,state);assert.equal(world.boss,null,id+' guardian has entered the chief');
  }
}
console.log('PASS: all ten maps keep quest targets at least 12m apart; guards, possession, sequential progress, save/load, handwritten treaties and defensive positioning.');
