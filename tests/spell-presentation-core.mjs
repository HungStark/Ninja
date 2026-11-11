import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import '../game-core.js';
import {SPELL_ART_FILES,spellArtwork} from '../src/spell-art.js';
import {createQuestItem,questAction} from '../src/quest-items.js';
import {villageSidequests} from '../src/journey-story.js';
import {REGIONS} from '../src/adventure-world.js';
import {carriedSpellMarkup,renderEnemySeals,updateSpellAvailability} from '../src/battle-scroll.js';

assert.deepEqual(new Set(Object.keys(SPELL_ART_FILES)),new Set(SealGameCore.spells.map(s=>s.id)));
const illustrations=SealGameCore.spells.map(spellArtwork);assert.equal(new Set(illustrations).size,45);
for(const spell of SealGameCore.spells){const png=await fs.readFile(spellArtwork(spell));assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),256);assert.equal(png.readUInt32BE(20),256);assert.ok(carriedSpellMarkup(spell,0,0).includes('chakra-cover'));}
const models=new Set();for(const id of Object.keys(REGIONS))for(const q of villageSidequests(id))if(q.type!=='combat'){
 const root=createQuestItem({model:q.targetModel,name:q.targetName});models.add(q.targetModel);let triangles=0;root.updateMatrixWorld(true);root.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.isMesh)triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;});assert.ok(triangles>0&&triangles<2500,q.targetName+' item geometry budget');
 assert.equal(questAction({kind:'sidequest-target',questType:q.type}),q.type==='survey'?'Khảo sát · ':'Thu thập · ');
}
assert.ok(models.size>=10);assert.equal(villageSidequests('nameless').find(q=>q.giver.endsWith('war-cemetery')).targetModel,'flowers');
const fake={innerHTML:'',dataset:{},setAttribute(){}};renderEnemySeals(fake,['q','w','c','v']);assert.equal((fake.innerHTML.match(/<kbd>/g)||[]).length,4);assert.ok(!fake.innerHTML.includes('␣'));renderEnemySeals(fake,['q','w','c','v'],true);assert.ok(fake.innerHTML.includes('␣'));renderEnemySeals(fake,['e']);assert.ok(!fake.innerHTML.includes('␣'));assert.equal((fake.innerHTML.match(/<kbd>/g)||[]).length,1);
const classes=new Set(),style=new Map(),counter={textContent:''},button={style:{setProperty:(k,v)=>style.set(k,v)},classList:{toggle:(k,v)=>v?classes.add(k):classes.delete(k)},dataset:{},setAttribute(){},querySelector:()=>counter},spell=SealGameCore.spells.find(s=>s.id==='water-barrier');
updateSpellAvailability(button,spell,6,10);assert.ok(classes.has('on-cooldown')&&classes.has('chakra-missing'));assert.equal(style.get('--cooldown-sweep'),'0.00deg');
updateSpellAvailability(button,spell,spell.cooldown/2,40);assert.equal(style.get('--cooldown-sweep'),'180.00deg');assert.ok(!classes.has('chakra-missing'));updateSpellAvailability(button,spell,0,10);assert.ok(classes.has('chakra-missing'));assert.ok(!classes.has('on-cooldown'));assert.equal(counter.textContent,'');
console.log('PASS: 45 distinct technique illustrations, quest-specific collectible models/actions, cooldown progress and chakra availability, exact opponent seals/cast marker/reset.');
