import {SPELL_ART_FILES} from './spell-icon-manifest.js';
export {SPELL_ART_FILES} from './spell-icon-manifest.js';

export function spellArtwork(spell){
  const url=SPELL_ART_FILES[spell.id];
  if(!url)throw new Error('Missing spell illustration: '+spell.id);
  return url;
}
export function spellImage(spell){return `<img class="spell-art" src="${spellArtwork(spell)}" alt="" draggable="false">`;}
