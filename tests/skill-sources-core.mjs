import assert from 'node:assert/strict';
import '../game-core.js';
import {REGIONS} from '../src/adventure-world.js';
import {newJourney,readJourney,completeLesson,resolveBattle} from '../src/adventure-data.js';
import {STARTER_CHOICES,villageSidequests,acceptSidequest,completeSidequestTarget,claimSidequest,sidequestReward} from '../src/journey-story.js';
import {SYSTEMS,learnFromBook} from '../src/progression.js';
const starters=STARTER_CHOICES.map(s=>s.id),sources=[];
for(const [v,r] of Object.entries(REGIONS)){
 sources.push([r.mentor.spellId,v+':lesson']);
 for(const id of r.boss.rewardSpells)sources.push([id,v+':boss']);
 for(const q of villageSidequests(v))if(q.rewardScroll)sources.push([q.rewardScroll,q.id]);
}
assert.equal(sources.length,42);assert.equal(new Set(sources.map(s=>s[0])).size,42,'each skill has one source');
assert.deepEqual(sources.map(s=>s[0]).sort(),SealGameCore.spells.map(s=>s.id).filter(id=>!starters.includes(id)).sort());
for(const reverse of [false,true]){
 const s=newJourney();s.learnedSpells=[...starters];s.campaign.treatySigned=true;s.story.stage='infiltrate';s.progression.xp=Object.fromEntries(SYSTEMS.map(e=>[e,2100]));
 const villages=Object.keys(REGIONS);if(reverse)villages.reverse();
 for(const v of villages){const r=REGIONS[v];s.village=v;s.lessons[v]=1;s.discoveries.push(...r.mentor.zoneIds.map(z=>v+':'+z));
  const before=[...s.learnedSpells],reward=completeLesson(s,v);assert.deepEqual(reward.spellIds,[r.mentor.spellId]);assert.deepEqual(s.learnedSpells,[...before,r.mentor.spellId]);
  const xp=JSON.stringify(s.progression.xp);assert.deepEqual(completeLesson(s,v).spellIds,[]);assert.equal(JSON.stringify(s.progression.xp),xp);
  resolveBattle(s,{kind:'boss',village:v},true);
  const quests=villageSidequests(v);if(reverse)quests.reverse();for(const q of quests){assert.ok(acceptSidequest(s,q));assert.ok(completeSidequestTarget(s,q));assert.ok(claimSidequest(s,q));assert.equal(claimSidequest(s,q),false);}
 }
 for(const id of [...s.progression.books])assert.ok(learnFromBook(s,id));assert.equal(s.learnedSpells.length,45);assert.equal(s.progression.books.length,0);
 const loaded=readJourney({getItem:()=>JSON.stringify(s)});assert.deepEqual(loaded.learnedSpells,s.learnedSpells);assert.deepEqual(loaded.progression.books,[]);
}
// An owned reward becomes gold; it never substitutes another quest's skill.
const q=villageSidequests('water').find(q=>q.rewardScroll),s=newJourney();s.learnedSpells.push(q.rewardScroll);assert.deepEqual(sidequestReward(s,q),{gold:100,scroll:null});
// Old completed sources receive missing books on load without removing learned arts.
s.mentors.water=true;s.bosses.water=true;s.story.sidequests[q.id]=3;
const loaded=readJourney({getItem:()=>JSON.stringify(s)});assert.ok(loaded.progression.books.includes('water-volley'));assert.ok(loaded.progression.books.includes(REGIONS.water.boss.rewardSpells[0]));
console.log('PASS: 42 unique sources + 3 starters cover all 45 skills, exact single-art lessons, both quest orders, one-time rewards, no substituted books and old-save recovery.');
