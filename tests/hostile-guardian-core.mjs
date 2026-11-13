import assert from 'node:assert/strict';
import {newJourney} from '../src/adventure-data.js';
import {PLOT,WAR_VILLAGES} from '../src/campaign-plot.js';
import {battleConversation} from '../src/battle-conversation.js';
import {confrontationObjective,orderGuardianGuards,guardianGuardIds} from '../src/village-confrontation.js';
import {REGIONS} from '../src/adventure-world.js';

for(const id of WAR_VILLAGES){
 const save=newJourney();save.village=id;save.story.villageEvents[id]=PLOT.villages[id].stages.length;
 const script=battleConversation({kind:'guardian-order',village:id,name:REGIONS[id].boss.guardian},save);
 assert.equal(script.length,4);assert.deepEqual(script.map(l=>l.speaker.id==='hero'),[false,true,false,true]);
 assert.ok(script[0].speaker.appearance.kind==='creature');assert.equal(script[0].speaker.appearance.id,id);
 assert.ok(script[2].text.includes('Tả vệ, hữu vệ!'));assert.match(script[2].text,/khống chế|Bắt giữ|bắt giữ/);
 assert.ok(!script.some(l=>/kiểm tra bản lĩnh|so tài|dừng tay|nhận thua|công nhận bản lĩnh/.test(l.text)));
 const guard=battleConversation({kind:'village-guard',village:id,name:'Hai hộ vệ linh thú',guardRole:'guardian',guardianChain:true},save);
 assert.deepEqual(guard.map(l=>l.text),['Tôi tới đây','Tới đi']);assert.notEqual(guard[0].speaker.id,'hero');assert.equal(guard[1].speaker.id,'hero');
 if(id==='water')assert.match(script[0].text,/cứu người.*Hải Châu/);
 if(id==='fire')assert.match(script[1].text,/vạch trần nội gián/);
 if(id==='lightning')assert.match(script[0].text,/hai trưởng làng/);
 assert.match(confrontationObjective(save,id).title,/rút quân/);assert.equal(orderGuardianGuards(save,id),true);
 assert.equal(confrontationObjective(save,id).targetId,guardianGuardIds(id)[0]);
 save.story.defeatedGuards.push(...guardianGuardIds(id));const objective=confrontationObjective(save,id);
 assert.equal(objective.targetKind,'npc');assert.match(objective.description,/bị đánh bại.*rút khỏi Vô Danh/);assert.doesNotMatch(objective.description,/công nhận|thử thách|so tài/);
}
console.log('PASS: approved hostile dialogue for Water/Fire/Lightning, correct beast portraits and speakers, capture orders, story context, two sentries and withdrawal objectives.');
