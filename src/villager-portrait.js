const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function villagerPortrait(speaker){
  const p=speaker.appearance,coat=esc(p.coat),accent=esc(p.accent),hair=esc(p.hair),skin=esc(p.skin),name=esc(speaker.name);
  const long=['long','braid','ponytail'].includes(p.hairStyle),bald=p.hairStyle==='bald';
  const headwear=['conical','straw'].includes(p.hat)?`<path fill="#a18a56" stroke="#cebc90" stroke-width="2" d="M8 61 80 15l72 46z"/><path stroke="#76623e" d="m80 18-46 42m46-42 46 42"/>`:
    p.hat==='helmet'?`<path fill="#8b9290" d="M31 60q0-43 49-43t49 43z"/><path fill="${accent}" d="M28 56h104v11H28z"/><circle fill="#efe0ac" stroke="#625846" stroke-width="5" cx="80" cy="47" r="12"/>`:
    p.hat==='fur'?`<path fill="${coat}" d="M26 64V40q7-33 54-30 47-3 54 30v25z"/><path fill="#d8cbb0" d="M25 51h110v22H25zM27 63h17v43H27zm89 0h17v43h-17z"/>`:
    p.hat==='goggles'?`<path stroke="#604936" stroke-width="8" d="M33 58h94"/><g fill="#91aeb1" stroke="#604936" stroke-width="6"><ellipse cx="61" cy="54" rx="15" ry="11"/><ellipse cx="99" cy="54" rx="15" ry="11"/></g>`:
    p.hat==='band'?`<path fill="${accent}" d="M32 53h96v15H32z"/>`:'';
  const beard=p.beard?`<path fill="${hair}" d="m47 105 15 13 18 4 18-4 15-13-6 31-27 ${p.beard==='long'?33:9}-27-${p.beard==='long'?33:9}z"/><path fill="${hair}" d="m57 107 23-4 23 4-5 7-18-4-18 4z"/>`:'';
  const hairShape=bald?`<path fill="${hair}" d="M33 64h12v35H33zm82 0h12v35h-12z"/>`:`<path fill="${hair}" d="M31 77V45q8-31 49-30 39-2 49 30v35l-17-18-15-9-17 9-19-9-16 11z"/>`;
  const clothing=['smith','miner'].includes(p.job)?`<path fill="#604936" d="m45 143 35 13 35-13 11 47H34z"/><path stroke="#bd9c73" stroke-width="5" d="m51 139 5 51m53-51-5 51"/>`:
    ['healer','tailor'].includes(p.job)?`<path fill="${accent}" d="m50 142 30 17 30-17 16 48H34z"/>${p.job==='healer'?'<path fill="#ece3cc" d="M76 160h8v24h-8zm-8 8h24v8H68z"/>':''}`:
    `<path fill="${accent}" d="m38 139 42 19 42-19-11 28-31-1-31 1z"/>`;
  return `<svg viewBox="0 0 160 190" role="img" aria-label="Chân dung ${name}" data-villager-job="${esc(p.job)}"><title>${name}</title><path fill="#152c31" d="M0 0h160v190H0z"/>${long?`<path fill="${hair}" d="M32 62h96l8 102H24z"/>`:''}${p.hat==='hood'?`<path fill="${coat}" d="M17 146V49Q20 5 80 5t63 44v98z"/>`:''}<path fill="${coat}" d="M4 190v-24l35-29 41-11 41 11 35 29v24z"/>${clothing}<path fill="${skin}" d="M64 119h32v26l-16 15-16-15z"/><path fill="${skin}" d="m42 57 17-19h42l17 19v46l-15 28-23 13-23-13-15-28z"/><path fill="#68482e" opacity=".17" d="m42 65 12 18-2 26 28 35-23-13-15-28z"/>${hairShape}${p.hairStyle==='bun'?`<circle fill="${hair}" cx="80" cy="20" r="14"/><path stroke="${accent}" stroke-width="5" d="M67 21h26"/>`:''}${headwear}<path stroke="${hair}" stroke-width="4" d="m51 81 19-3m21 0 18 3"/><path fill="#f1dfc6" d="m51 88 18-1-3 7H54zm40-1 18 1-3 6H94z"/><path fill="#343c34" d="M59 87h6v7h-6zm36 0h6v7h-6z"/><path fill="none" stroke="#9b7256" stroke-width="2" d="m79 91-5 15 9 2"/><path stroke="#875e4c" stroke-width="2" d="M68 119h24"/>${p.age==='elder'?'<path fill="none" stroke="#9e7b60" stroke-width="2" d="m43 94 9 3m56 0 9-3m-60 13-3 8m52-8 3 8M59 69h40"/>':''}${beard}</svg>`;
}
