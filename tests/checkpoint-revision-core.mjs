import assert from 'node:assert/strict';
import '../game-core.js';
import {newJourney,readJourney,resolveBattle} from '../src/adventure-data.js';
import {captureCheckpoint,restoreCheckpoint,AUTO_SAVE_SECONDS} from '../src/checkpoint-state.js';
import {planSavePoints} from '../src/save-points.js';
import {createAdventureScene} from '../src/adventure-scene.js';
import {campaignFixtures} from './campaign-fixtures.mjs';
import {sacrificeForHero} from '../src/phoenix-blessing.js';
import {villageEventEncounter} from '../src/village-events.js';
import {registerTournament,pendingTournamentMatch} from '../src/wood-tournament.js';
import {villageMapMarkup} from '../src/village-map.js';
import {REGIONS,regionMetrics} from '../src/adventure-world.js';
const fixtures=campaignFixtures(),save=structuredClone(fixtures['dark:6']),point=planSavePoints('dark')[2];
assert.equal(AUTO_SAVE_SECONDS,10);save.interior=null;save.position=[point.x,point.z];save.healthFraction=.73;save.story.companion.hp=123;save.flask.charges=0;save.equipment.ammo.iron=7;captureCheckpoint(save,point,{now:12345});const snapshot=structuredClone(save.checkpointSave.snapshot);assert.equal(snapshot.checkpointSave,undefined);
save.gold+=1000;save.equipment.ammo.iron=0;save.story.defeatedGuards.push('dark-jailer-1');save.position=[12,13];save.story.villageEvents.dark=10;save.story.ending='bad';save.story.companion.sacrificed=true;save.story.companion.hp=0;save.healthFraction=0;
const autosave=readJourney({getItem:()=>JSON.stringify(save)});assert.equal(autosave.gold,save.gold);assert.deepEqual(autosave.position,[12,13]);assert.ok(autosave.story.companion.sacrificed);assert.equal(autosave.checkpointSave.snapshot.story.companion.hp,123);assert.equal(autosave.checkpointSave.snapshot.gold,snapshot.gold);
const pending={...structuredClone(save),pendingCheckpointRestore:true},closedOnDefeat=readJourney({getItem:()=>JSON.stringify(pending)});assert.equal(closedOnDefeat.gold,snapshot.gold);assert.equal(closedOnDefeat.story.companion.hp,123);assert.equal(closedOnDefeat.story.companion.sacrificed,false);assert.equal(closedOnDefeat.pendingCheckpointRestore,undefined);
assert.ok(restoreCheckpoint(save));const {checkpointSave,...restored}=save;assert.deepEqual(restored,snapshot);assert.equal(save.story.companion.sacrificed,false);assert.equal(save.healthFraction,.73);assert.equal(save.flask.charges,0);assert.equal(save.equipment.ammo.iron,7);
save.story.companion.sacrificed=true;save.story.ending='bad';save.gold+=4;resolveBattle(save,villageEventEncounter('dark',6,save),false);const {checkpointSave:retained,...afterDeath}=save;assert.deepEqual(afterDeath,snapshot);assert.deepEqual(retained,checkpointSave);
for(let i=0;i<30;i++){save.gold++;captureCheckpoint(save,point,{now:12346+i});assert.equal(save.checkpointSave.snapshot.checkpointSave,undefined);}assert.ok(JSON.stringify(save).length<JSON.stringify(save.checkpointSave.snapshot).length*2.2);
const roundtrip=readJourney({getItem:()=>JSON.stringify(save)});assert.ok(roundtrip.checkpointSave);assert.equal(roundtrip.checkpointSave.savedAt,12375);assert.equal(roundtrip.checkpointSave.snapshot.checkpointSave,undefined);assert.ok(restoreCheckpoint(roundtrip));assert.equal(roundtrip.gold,save.gold);
const invalid=structuredClone(save);invalid.checkpointSave.snapshot.version=-1;assert.equal(readJourney({getItem:()=>JSON.stringify(invalid)}).checkpointSave,undefined);
const friendly=structuredClone(fixtures['earth:trial']);captureCheckpoint(friendly,planSavePoints('earth')[0]);friendly.gold+=70;const before=JSON.stringify(friendly);resolveBattle(friendly,{kind:'boss',village:'earth',friendlyTrial:true},false);assert.equal(JSON.stringify(friendly),before);
const arena=structuredClone(fixtures['wood:2']);registerTournament(arena,()=>.3);captureCheckpoint(arena,planSavePoints('wood')[0]);const match=pendingTournamentMatch(arena.arena);arena.gold+=77;resolveBattle(arena,{kind:'arena',tournamentRun:arena.arena.run,tournamentMatch:match.id},false);assert.equal(arena.gold,arena.checkpointSave.snapshot.gold+77);assert.ok(arena.arena.matches.find(m=>m.id===match.id).winner);
globalThis.innerWidth=1280;globalThis.innerHeight=900;const world=createAdventureScene();
for(const id of Object.keys(REGIONS)){
 const seed=structuredClone(fixtures[id+':0']||fixtures.opening);seed.village=id;seed.interior=null;world.load(id,seed);const saves=world.interactives.filter(i=>i.kind==='save');assert.equal(saves.length,id==='nameless'?1:4,id);assert.equal(new Set(saves.map(i=>i.id)).size,saves.length);
 for(const p of saves){assert.equal(world.blocked(p.x,p.z),false,id+' '+p.id+' must be accessible');assert.ok(Number.isFinite(world.heightAt(p.x,p.z)));assert.ok(world.scene.getObjectByName('checkpoint-shrine-'+p.id));}
 if(saves.length===4){const distances=saves.map((p,i)=>Math.hypot(p.x-saves[(i+1)%4].x,p.z-saves[(i+1)%4].z));assert.ok(Math.max(...distances)-Math.min(...distances)<1e-6,id+' equal spacing');}
 const map=villageMapMarkup({id,region:REGIONS[id],limit:regionMetrics(id).limit,gates:world.gates,civic:world.civic,hero:{x:0,z:7},clinics:world.clinics,routes:world.routes});assert.equal(map.markers.filter(i=>i.type==='save').length,saves.length);
}
console.log('PASS: 10s cadence, separate live/manual snapshots, full state and Ha Ly rollback on death, snapshot replacement/serialization without nesting, invalid snapshot rejection, friendly/tournament exceptions, one Nameless/four equally spaced accessible shrines per village and map markers.');
