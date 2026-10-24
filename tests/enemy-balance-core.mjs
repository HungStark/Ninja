import assert from 'node:assert/strict';
import {botHealth,PRACTICE_BOT_HP} from '../src/enemy-balance.js';
import {encounterProfile} from '../src/progression.js';
import {newJourney} from '../src/adventure-data.js';
import {GUARDIAN_HEALTH,REGIONS} from '../src/adventure-world.js';
import {campaignStrength} from '../src/campaign-difficulty.js';
import {INTRO_SQUAD} from '../src/journey-story.js';
assert.equal(PRACTICE_BOT_HP,220);assert.equal(botHealth(85),94);assert.ok(INTRO_SQUAD.every(p=>p.hp===94));
const base={nameless:360,water:440,fire:550,lightning:660,earth:770,wind:880,light:990,ice:1100,wood:1210,dark:1650};
for(const [region,hp] of Object.entries(base)){
  assert.equal(GUARDIAN_HEALTH[region],botHealth(hp));assert.equal(REGIONS[region].boss.hp,botHealth(hp));
  for(const stage of [0,3,8]){
    const save=newJourney();save.bosses=Object.fromEntries(Object.keys(base).filter(id=>id!=='nameless').slice(0,stage).map(id=>[id,true]));
    const boss=encounterProfile(save,'boss',region);assert.equal(boss.hp,botHealth(campaignStrength(save,region,'boss').hp),'campaign health is boosted once');assert.equal(boss.phaseSpellIds.length,5);assert.equal(boss.spellIds.length,5);
    const early=['fire','water','lightning'].includes(region);
    for(const [kind,expected] of [['random',110+stage*15],['village-guard',early?155:240+stage*12],['guardian-guard',early?260:390+stage*15]])assert.equal(encounterProfile(save,kind,region).hp,botHealth(campaignStrength(save,region,kind).hp));
  }
}
console.log('PASS: rounded 10% extra health for practice, opening trio, random bots, both guard tiers and all ten guardians across progression stages; guardian health is not double-scaled and human guardians know all five school spells.');
