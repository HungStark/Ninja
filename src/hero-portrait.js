const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function heroPortrait(hero){
  const hair=esc(hero.hair||'#161821'),coat=esc(hero.coat||'#211e25'),name=esc(hero.name),armor=esc(hero.armor?.color||'#29252c');
  return `<svg viewBox="0 0 160 190" role="img" aria-label="Chân dung ${name}" data-hero="crimson-masked"><title>${name}</title>
  <path fill="#18272c" d="M0 0h160v190H0z"/><path fill="${coat}" d="M6 190v-29l30-28 44-10 44 10 30 28v29z"/>
  <path fill="${armor}" d="m33 147 26-9 21 19 21-19 26 9-7 43H40z"/>
  <path fill="#762936" d="m17 139 30-18 62 1 36 21-21 3 11 24-19-12 2 32H38l-4-28-18 12 9-24z"/>
  <path fill="#201e25" d="m35 125 45 8 45-8 3 24-48 20-48-20z"/><path fill="#383039" d="m36 131 44 13 45-12-8 13-37 14-38-14z"/>
  <path fill="#deb499" d="m45 54 35-16 35 16v43l-13 28-22 11-22-11-13-28z"/>
  <path fill="#e9d4c7" d="m49 83 24 4-4 8-17-3zm38 4 24-4-3 9-17 3z"/>
  <path fill="#9f4b43" d="M60 87h6v8h-6zm34 0h6v8h-6z"/><path stroke="#15151c" stroke-width="3" d="m49 81 24 3m14 0 24-3"/>
  <path fill="#14151c" d="m44 97 36 6 36-6-8 31-28 17-28-17z"/><path fill="none" stroke="#37313a" stroke-width="2" d="m54 108 26 8 26-8m-48 12 22 9 22-9"/>
  <path fill="${hair}" d="m25 77 7-15-12-2 15-17-9-8 19-7-4-13 23 9L73 6l12 18 20-14-2 17 23-4-9 15 18 5-11 14 14 7-15 12 5 17-17-13 2-23-13 28-5-25-14 34-2-37-15 31-3-29-17 30 2-23-12 24z"/>
  <path fill="none" stroke="#373440" stroke-width="2" d="m41 52 22-20-8 20m21-30 10 17-12 24m28-28 11 11-13 18m-64 9 10-13"/>
  <path fill="#762936" d="m48 156 10-3 43 37H86z"/><path fill="#34282b" d="m109 151 6 6-41 33H61z"/>
  <path fill="none" stroke="#a59a99" stroke-width="3" d="m104 149 6-4 5 7-6 4z"/><circle cx="121" cy="139" r="5" fill="none" stroke="#a59a99" stroke-width="2"/>
  <path fill="#9b3846" d="m121 144-5 23h10z"/></svg>`;
}
