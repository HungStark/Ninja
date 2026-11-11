import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import '../game-core.js';
import {SPELL_ICON_ROWS,SPELL_ART_FILES} from '../src/spell-icon-manifest.js';
import {spellArtwork,spellImage} from '../src/spell-art.js';

const spells=globalThis.SealGameCore.spells;
assert.equal(SPELL_ICON_ROWS.length,9);
assert.ok(SPELL_ICON_ROWS.every(row=>row.length===5));
assert.deepEqual(SPELL_ICON_ROWS.flat(),spells.map(s=>s.id),'Reference row/column order matches the actual technique order');
assert.equal(Object.keys(SPELL_ART_FILES).length,45);
const hashes=new Set();
for(const spell of spells){
  const file=spellArtwork(spell),png=await fs.readFile(file);
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a',spell.id);
  assert.equal(png.readUInt32BE(16),256,spell.id);assert.equal(png.readUInt32BE(20),256,spell.id);
  hashes.add(createHash('sha256').update(png).digest('hex'));
  assert.ok(spellImage(spell).includes('src="'+file+'"'));
  for(const root of ['android-apk/www','dist'])assert.deepEqual(await fs.readFile(root+'/'+file),png,root+'/'+spell.id);
}
assert.equal(hashes.size,45,'No two techniques reuse the same image');
assert.throws(()=>spellArtwork({id:'not-a-technique'}),/Missing spell illustration/);
console.log('PASS: all 45 unique PNG icons, nine reference rows in exact technique order, valid 256px images and identical Android/web package assets.');
