import assert from 'node:assert/strict';
import '../game-core.js';
import {newJourney} from '../src/adventure-data.js';
import {SYSTEMS,encounterProfile,newProgression,combatStats,spendPoint} from '../src/progression.js';
import {conversationLines,sidequestLines,sidequestThanks} from '../src/adventure-dialogue.js';
import {villageSidequests} from '../src/journey-story.js';
const {spells,GameRules}=SealGameCore;
const dependencies={requiresBurn:'fire-volley',requiresStatic:'lightning-lance',requiresAirborne:'wind-volley',requiresCrater:'earth-reflect',requiresGarden:'wood-reflect',requiresSnowFull:'ice-reflect',requiresDomain:'dark-domain',requiresClones:'dark-orb'};
for(const element of SYSTEMS){
  const profile=encounterProfile(newJourney(),'village-guard',element);assert.equal(new Set(profile.spellIds).size,3);
  const loadout=profile.spellIds.map(id=>spells.find(s=>s.id===id));assert.ok(loadout.every(Boolean));assert.ok(loadout.some(s=>s.kind==='attack'&&s.damage>0));
  for(const spell of loadout){for(const [flag,setup] of Object.entries(dependencies))if(spell[flag])assert.ok(profile.spellIds.includes(setup),`${spell.id} needs ${setup}`);if(spell.snowCost)assert.ok(profile.spellIds.includes('ice-reflect'));}
  assert.equal(encounterProfile(newJourney(),'guardian-guard',element).spellIds.length,5);
}
const p=newProgression();assert.equal(spendPoint(p,'mana'),true);const stats=combatStats(p);assert.equal(stats.maxChakra,101);assert.equal(stats.chakraRegen,5.1);
const rules=new GameRules(['fire-volley'],stats);rules.chakra=0;rules.tick(10);assert.equal(rules.chakra,51);rules.tick(100);assert.equal(rules.chakra,101);assert.equal(new GameRules(['fire-volley']).chakraRegen,5);
const save=newJourney(),cast={hero:{name:'Hero'},npc:{name:'NPC'}};
for(const type of ['combat','retrieve','survey']){
  const q=villageSidequests('nameless').find(q=>q.type===type);assert.ok(q);
  const thanks=sidequestThanks(q);assert.ok(thanks.includes('Cảm ơn'));
  const lines=sidequestLines(q,2,cast,thanks);assert.equal(lines[0].speaker,cast.npc);assert.equal(lines[0].text,thanks);assert.equal(lines.length,1);
  assert.equal(sidequestLines(q,0,cast,q.description)[1].speaker,cast.hero);
}
for(const kind of ['npc','lore','healer','mentor','companion','village-event']){
  const lines=conversationLines({kind,id:'test'},save,cast,'Authored conversation');assert.equal(lines[0].speaker,cast.npc);assert.ok(!lines.some(l=>/có điều gì tôi có thể giúp|Cảm ơn đã chia sẻ/.test(l.text)));
}
console.log('PASS: three complementary regular guard arts, five elite arts, conditional setups, +1 mana/+0.1 regen in actual rules, NPC-first quest thanks and contextual conversations.');
