import assert from 'node:assert/strict';
import {physicalKey,releaseMovementKeys} from '../src/game-input.js';

for(const key of ['Process','Dead','Unidentified','ư','Ư'])assert.equal(physicalKey({code:'KeyW',key,keyCode:229,isComposing:true}),'w');
for(const e of [
  {key:'a',code:'',keyCode:231},
  {key:'a',code:'KeyA',keyCode:231},
  {key:'a',code:'',keyCode:229,isComposing:true},
  {key:'a',code:'Unidentified',keyCode:65},
  {key:'a',code:'',keyCode:65},
  {key:'w',code:''},
  {key:'b',code:'',keyCode:231}
])assert.equal(physicalKey(e),'','text insertion never becomes a physical game key');
const held=new Set(['w','a']);
releaseMovementKeys(held,{code:'KeyW',key:'ư',keyCode:229,isComposing:true});assert.deepEqual([...held],['a']);
held.add('w');releaseMovementKeys(held,{code:'',key:'Unidentified',keyCode:65});assert.deepEqual([...held],['w'],'missing scan code on keyup can still release its virtual key');
releaseMovementKeys(held,{code:'',key:'a',keyCode:231});assert.deepEqual([...held],['w'],'inserted Unicode does not interrupt a held physical W');
releaseMovementKeys(held,{code:'',key:'Process',keyCode:229,isComposing:true});assert.equal(held.size,0,'an ambiguous release cannot leave a ghost movement');
assert.equal(physicalKey({code:'KeyB',key:'Process',keyCode:229,isComposing:true}),'b');
console.log('PASS: physical W under IME, rejection of packet/code-less letter insertion, interrupted/missing-code key releases, B shortcut.');
