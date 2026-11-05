import {JOURNEY_ORDER} from './village-travel.js';

export function atlasMarkup(villages){
  const seaPaths=['M63 65 Q74 58 78 63','M40 65 Q29 58 23 65','M28 69 Q50 73 73 69','M28 76 Q32 73 37 77','M73 77 Q68 72 62 77'];
  return `<defs><radialGradient id="atlasSea"><stop stop-color="#155475"/><stop offset="1" stop-color="#052b45"/></radialGradient><filter id="landShadow"><feDropShadow dx="0" dy=".6" stdDeviation=".8" flood-opacity=".4"/></filter>${villages.map(v=>`<clipPath id="atlasClip-${v.id}"><polygon points="${v.polygon}"/></clipPath><radialGradient id="atlasLand-${v.id}"><stop stop-color="${v.color}"/><stop offset="1" stop-color="${v.color}" stop-opacity=".7"/></radialGradient>`).join('')}</defs>
    <rect width="100" height="100" rx="3" fill="url(#atlasSea)"/>
    <g class="atlas-sea-routes" aria-hidden="true">${seaPaths.map(d=>`<path d="${d}"/>`).join('')}</g>
    ${villages.map(v=>{
      const details=Array.from({length:24},(_,i)=>{const x=12+(i*17+v.x*3)%78,y=4+(i*13+v.y*5)%92;return v.id==='wood'?`<path d="M${x} ${y}l-1.4 2h.7l-1 1.2h3.4l-1-1.2h.7z"/>`:`<path d="M${x-2} ${y+2}l2-2.5 2.5 2.5-1.5-.6-1-.7-.5 1z"/>`;}).join('');
      const order=JOURNEY_ORDER.indexOf(v.id)+1;
      return `<g class="atlas-region" data-region="${v.id}" tabindex="0" role="button" aria-label="${v.name}"><polygon points="${v.polygon}" fill="url(#atlasLand-${v.id})" stroke="#f5dda0" stroke-width=".55" stroke-linejoin="round" filter="url(#landShadow)"/><g clip-path="url(#atlasClip-${v.id})" fill="#102b33" opacity=".14" pointer-events="none">${details}</g><text x="${v.x}" y="${v.y-1}" class="atlas-glyph">${v.glyph}</text><text x="${v.x}" y="${v.y+2.6}" class="atlas-name">${v.name}</text>${order?`<g class="atlas-order" pointer-events="none"><circle cx="${v.x+6.5}" cy="${v.y-3.5}" r="1.3"/><text x="${v.x+6.5}" y="${v.y-3.05}">${order}</text></g>`:''}</g>`;
    }).join('')}
    <g id="atlasPosition"></g><text x="5" y="94" class="atlas-compass">N</text><path d="M6 90v-8m-2 3 2-3 2 3" stroke="#eed49a" stroke-width=".3" fill="none"/>`;
}
