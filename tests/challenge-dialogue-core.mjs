import assert from 'node:assert/strict';
import {battleConversation} from '../src/battle-conversation.js';
import {newJourney,VILLAGES} from '../src/adventure-data.js';
import {INTRO_SQUAD} from '../src/journey-story.js';
import {createAdventureScene} from '../src/adventure-scene.js';

const save=newJourney('Người Lữ Hành');
for(const v of VILLAGES)for(const kind of ['boss','quest','random','village-guard','arena','village-event']){
 const lines=battleConversation({kind,village:v.id,element:v.id==='nameless'?'fire':v.id,name:'Đối thủ',guardRole:'guardian'},save);
 assert.ok(lines.length>=4);assert.ok(lines.some(l=>l.speaker.id==='hero'));assert.ok(lines.some(l=>l.speaker.id!=='hero'));assert.ok(lines.every(l=>l.text&&l.speaker.name));assert.ok(!lines.some(l=>/sinh lực|sát thương|phase|mana|Thưởng .*xu|chiêu hệ/.test(l.text)));
}
const trio=battleConversation({kind:'intro-trio',village:'nameless',name:'Ba ninja',squad:INTRO_SQUAD},save);assert.equal(new Set(trio.map(l=>l.speaker.id)).size,4);assert.ok(trio.some(l=>l.text.includes('hộ vệ thú')));assert.ok(trio[0].text.includes('dừng lại'));
globalThis.innerWidth=1440;globalThis.innerHeight=960;
const scene=createAdventureScene();scene.load('nameless',save);scene.update(0,false);assert.equal(scene.skirmishState().length,3);
const snapshots=[];for(let i=0;i<3;i++){scene.update(i?1.3:.55,false);const fighters=scene.skirmishState();snapshots.push(fighters);assert.equal(fighters.filter(f=>f.action==='strike').length,1);assert.equal(fighters.filter(f=>f.action==='block').length,1);for(const f of fighters){assert.ok(f.position.every(Number.isFinite));assert.ok(Math.abs(f.position[1]-scene.heightAt(f.position[0],f.position[2]))<1e-6);}}
assert.deepEqual(snapshots.map(s=>s.findIndex(f=>f.action==='strike')),[0,1,2]);assert.notDeepEqual(snapshots[0][0].arms,snapshots[1][0].arms);const paused=scene.skirmishState();scene.update(2,false,false,true);assert.deepEqual(scene.skirmishState(),paused,'paused staged combat holds its pose');assert.equal(save.story.guardianRestored,false);assert.equal(save.gold,0);
save.story.guardianRestored=true;scene.load('nameless',save);assert.equal(scene.skirmishState().length,0);scene.load('water',save);assert.equal(scene.skirmishState().length,0);
console.log('PASS: narrative challenges across every village and encounter kind; three distinct attackers speak; skirmish turns, terrain, pause, restoration and scene cleanup.');
