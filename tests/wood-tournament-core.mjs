import assert from 'node:assert/strict';
import {newJourney,readJourney,resolveBattle,campaignObjective} from '../src/adventure-data.js';
import {registerTournament,pendingTournamentMatch,tournamentRecord,TOURNAMENT_VILLAGES} from '../src/wood-tournament.js';
import {TOURNAMENT_ARMOR,TOURNAMENT_ARMGUARD,armorById,armguardById,shopStock,equipItem} from '../src/equipment.js';
import {configureOpponent,createOpponentRules,opponentDamageMultiplier} from '../src/opponent-balance.js';
import {createEnemyMovement} from '../src/enemy-movement.js';
import {campaignFixtures} from './campaign-fixtures.mjs';
import {advanceVillageEvent} from '../src/village-events.js';
import {companionPresent} from '../src/campaign-plot.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {INTERIORS,enterInterior} from '../src/adventure-interiors.js';
import '../game-core.js';
let seed=7;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const next=s=>{const m=pendingTournamentMatch(s.arena);return m&&{kind:'arena',tournamentRun:s.arena.run,tournamentMatch:m.id};};
const result=(s,victory)=>{const battle=next(s);assert.ok(battle);resolveBattle(s,battle,victory);};
assert.deepEqual(TOURNAMENT_VILLAGES.filter(id=>['light','dark'].includes(id)),[]);
for(const outcomes of [[false,false],[true,false,false],[false,true,false],[true,true,false],[true,true,true,false],[false,true,true,true,false],[true,true,true,true],[false,true,true,true,true]]){
  for(let run=0;run<20;run++){
    let s=newJourney();s.healthFraction=.21;s.flask.owned=true;s.flask.charges=0;assert.ok(registerTournament(s,random));assert.equal(registerTournament(s,random),false);const original=structuredClone(s);
    assert.equal(s.arena.matches.length,4);assert.equal(s.arena.matches.filter(m=>m.winner).length,3);
    let index=0;while(next(s)){const m=pendingTournamentMatch(s.arena);if(m.round===3){const a=tournamentRecord(s.arena,m.a),b=tournamentRecord(s.arena,m.b);assert.deepEqual([a.losses,b.losses].sort(),[0,1]);assert.equal(a.wins,2);assert.equal(b.wins,2);}
      result(s,outcomes[index++]??true);s=readJourney({getItem:()=>JSON.stringify(s)});assert.ok(index<=5);
      if(index===1&&!outcomes[0]){assert.equal(s.arena.status,'active','first group loss never eliminates');assert.equal(s.arena.completedRuns,0);}
    }
    const losses=s.arena.matches.filter(m=>m.round<3&&(m.a==='nameless'||m.b==='nameless')&&m.winner!=='nameless').length;
    if(losses===2)assert.equal(s.arena.status,'eliminated');else assert.ok(s.arena.matches.some(m=>m.round>=3&&(m.a==='nameless'||m.b==='nameless')));
    assert.equal(s.arena.matches.length,13);assert.ok(s.arena.matches.every(m=>m.winner));assert.equal(s.arena.completedRuns,1);assert.equal(s.healthFraction,.21);assert.equal(s.flask.charges,0);
    const reward=s.arena.status==='champion';assert.equal(s.equipment.ownedArmor.includes(TOURNAMENT_ARMOR),reward);assert.equal(s.equipment.ownedArmguards.includes(TOURNAMENT_ARMGUARD),reward);
    const completed=s.arena.completedRuns;assert.ok(registerTournament(s,random));assert.equal(s.arena.completedRuns,completed);assert.notDeepEqual(s.arena.matches.map(m=>[m.a,m.b]),original.arena.matches.map(m=>[m.a,m.b]));
  }
}
const fixtures=campaignFixtures(),story=structuredClone(fixtures['wood:2']);assert.equal(companionPresent(story),false);assert.equal(campaignObjective(story).targetKind,'arena-host');assert.equal(advanceVillageEvent(story,'wood',2).reason,'tournament');registerTournament(story,random);result(story,false);assert.equal(campaignObjective(story).targetKind,'arena-host');result(story,false);assert.equal(campaignObjective(story).targetKind,'village-event');assert.ok(advanceVillageEvent(story,'wood',2).ok);assert.ok(companionPresent(story));assert.ok(advanceVillageEvent(story,'wood',3).ok);
const repeated=newJourney();for(let i=0;i<2;i++){registerTournament(repeated,random);let stale;while(next(repeated)){stale=next(repeated);result(repeated,true);}const before=JSON.stringify(repeated);resolveBattle(repeated,stale,true);assert.equal(JSON.stringify(repeated),before);}assert.equal(repeated.arena.championships,2);assert.equal(repeated.equipment.ownedArmor.filter(id=>id===TOURNAMENT_ARMOR).length,1);assert.equal(repeated.equipment.ownedArmguards.filter(id=>id===TOURNAMENT_ARMGUARD).length,1);
for(const id of TOURNAMENT_VILLAGES)assert.equal(shopStock(id).some(i=>i.mythic),false,'hidden equipment is not sold or advertised');
assert.ok(Object.values(armorById(TOURNAMENT_ARMOR).resistances).every(n=>n===.1));assert.equal(Object.keys(armorById(TOURNAMENT_ARMOR).resistances).length,9);assert.equal(Object.keys(armguardById(TOURNAMENT_ARMGUARD).bonuses).length,9);
const stats={maxHp:570,maxChakra:190,chakraRegen:8.3,damageMultiplier:1.6,moveSpeed:5},profile=configureOpponent({kind:'arena',village:'fire',hp:1,spellIds:['fire-volley'],tournamentStats:stats});assert.equal(profile.hp,570);assert.equal(opponentDamageMultiplier(profile),1.6);const rules=createOpponentRules(SealGameCore.GameRules,profile);assert.equal(rules.maxChakra,190);assert.equal(rules.chakraRegen,8.3);assert.equal(rules.spells[0].cost,SealGameCore.spells.find(s=>s.id==='fire-volley').cost);
const movement=createEnemyMovement(()=>.9),p=[0,1.72,0],q=movement.update(.2,{position:p,bounds:{minX:-20,maxX:20,minZ:-20,maxZ:20},moveSpeed:5,moveMultiplier:1});assert.ok(Math.abs(Math.hypot(q[0],q[2])-1)<1e-6);
globalThis.innerWidth=1280;globalThis.innerHeight=900;const world=createAdventureScene(),save=fixtures['wood:2'];world.load('wood',save);const door=world.interactives.find(i=>i.id==='wood-tournament');assert.ok(door);assert.equal(world.blocked(door.x,door.z),false);enterInterior(save,'wood-tournament',{position:[door.x,door.z],surface:null,elevation:door.y});world.load('wood',save);assert.ok(world.interactives.some(i=>i.kind==='arena-host'));assert.ok(world.scene.getObjectByName('school-tournament-noticeboard'));assert.equal(world.storyState().recruited,false);save.interior=null;enterInterior(save,'wood-arena',{position:[1,2.25],surface:'heart-tree',elevation:17});world.load('wood',save);assert.equal(INTERIORS['wood-arena'].bounds.x,6);assert.ok(world.scene.getObjectByName('wood-chief'));assert.ok(world.scene.getObjectByName('ha-ly-waiting-treehouse'));assert.ok(world.solids.some(s=>s.name==='treehouse-meeting-table'));assert.equal(world.interactives.some(i=>i.kind==='arena-host'),false);assert.equal(world.interactives.some(i=>i.kind==='village-event'),false,'reunion waits for tournament completion');
console.log('PASS: 160 tournaments: two group losses / semifinal or final loss eliminates, 2-0 vs 2-1 semis, NPC auto-results, replay/save, concealed unique rewards, full stat parity, school entry/referee/board, small treehouse/chief/waiting Ha Ly and gated reunion.');
