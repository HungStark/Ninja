// Small vector illustrations stay sharp in both the catalog and combat HUD.
// Every technique has its own silhouette, rather than an elemental character.
const path=(d,fill='url(#energy)',stroke='#f8e9c4',width=1.2)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`;
const line=(d,color='#e8f6ee',width=2)=>path(d,'none',color,width);
const circle=(x,y,r,fill='url(#energy)',stroke='#e8f6ee')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.3"/>`;
const flame=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${path('M0 18C-23 6-11-8-8-15C-6-4 0-6 0-25C18-9 24 10 0 18Z','#f16b37','#ffcb70')}${path('M0 13C-11 5-4-3 0-8C-1 0 10 4 0 13Z','#ffe6a0','none')}</g>`;
const bolt=(x=0,y=0,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${path('M44 8L23 43H37L31 70L59 33H44L54 8Z','#e7d6ff','#fff0b1',1.5)}</g>`;
const wave=()=>path('M8 57C18 55 22 50 27 40C33 25 51 23 58 35C43 29 40 38 44 43C52 50 60 49 72 43V66H8Z','#62b8d1','#c6f6ed',2);
const spikes=(floor=65)=>[0,1,2,3,4].map(i=>path(`M${10+i*12} ${floor}L${16+i*12} ${floor-18-(i%2)*14}L${24+i*12} ${floor}Z`,'#bb9867','#f6ddb1')).join('');
const leaf=(x,y,angle=0,color='#98c76c')=>`<g transform="translate(${x} ${y}) rotate(${angle})">${path('M0 13C-17 1-8-12 0-19C11-8 17 3 0 13Z',color,'#d9efac')}${line('M0 11V-14','#e6f0bd',1)}</g>`;
const flower=(x,y,color='#cd8ae3')=>`<g transform="translate(${x} ${y})">${[0,1,2,3,4,5].map(i=>`<ellipse rx="6" ry="13" cy="-9" transform="rotate(${i*60})" fill="${color}" stroke="#f8dbf5" stroke-width="1"/>`).join('')}${circle(0,0,5,'#edc977','#fff3c6')}</g>`;
const snowflake=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="#e2f8ff" stroke-width="2">${[0,60,120].map(a=>`<path transform="rotate(${a})" d="M0-20V20M-6-14L0-8L6-14M-6 14L0 8L6 14"/>`).join('')}</g>`;
const shadowPerson=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${circle(0,-15,6,'#222438','#b3a4d8')}${path('M-10 15L-8-5L0-9L8-5L12 15L5 18L3 33H-2L-5 17Z','#27293d','#ae9bcf')}${line('M-8-2L-17 11M7-2L16 6','#c59bf0',2)}</g>`;

export const SPELL_ILLUSTRATIONS={
 'fire-volley':[[-21,0],[0,-9],[21,0]].map(([x,y])=>flame(40+x,42+y,.55)).join('')+line('M11 66H29M35 63H49M56 66H70','#e99b54'),
 'fire-lance':path('M12 59C55 74 65 45 40 40C21 36 23 17 42 17L60 26L53 35L43 30C35 22 31 31 43 33C76 40 64 76 12 65Z','#df6539','#ffcb7e',2)+path('M47 18L46 8L54 17L68 20L61 27L70 31L57 34L51 26Z','#fba949')+circle(58,23,2,'#fff7d1','none'),
 'fire-meteor':line('M49 10L21 51M63 14L32 57M71 27L42 63','#ffc776',4)+flame(36,49,.95)+circle(35,53,13,'#6b4033','#f8ae61')+path('M24 52L33 44L45 48L42 62L29 63Z','#a75c3b','none'),
 'fire-barrier':flame(40,40,1.1)+line('M13 52C17 73 62 74 67 52M13 52L11 64M67 52L69 64','#ffe0a2',2.5)+circle(41,49,5,'#fff1b0','none'),
 'fire-reflect':path('M13 66L17 35L26 43L31 18L42 34L50 14L57 38L68 26L70 66Z','#d75734','#ffa851',2)+flame(30,49,.44)+flame(55,51,.5)+line('M12 68H71','#ffe6aa',3),
 'water-lance':circle(40,40,26,'#428da880','#a8ecf4')+shadowPerson(40,43,.53)+line('M22 21Q9 40 22 59M32 16Q20 40 32 64M48 16Q60 40 48 64M58 21Q71 40 58 59','#bbf0ed',2)+line('M17 38H64','#6bc6e8',1),
 'water-volley':path('M11 47L67 47L57 61L25 64Z','#876c45','#e8d7a5',2)+path('M39 17L40 44H62Z','#eee3b9','#9fd8db')+line('M38 15V49','#e5c986',2)+line('M8 68Q20 59 33 66T69 64M8 33L26 29M14 21L30 19','#b4eced',2.5),
 'water-tsunami':wave()+path('M18 53C30 46 27 16 48 17C66 17 73 31 65 40C65 29 53 27 48 33C52 16 31 21 35 45Z','#8fdef0','#e0ffff',1.5)+line('M13 62Q28 53 42 61T69 57','#d0ffff',2),
 'water-barrier':[[24,23,11],[55,26,12],[24,55,13],[56,55,10]].map(([x,y,r])=>circle(x,y,r,'url(#energy)','#c5f8ff')+line(`M${x-r*.6} ${y-1}Q${x-r*.6} ${y-r*.6} ${x} ${y-r*.65}`,'#f0ffff',2.2)).join('')+circle(40,40,2,'#efffff','none'),
 'water-reflect':path('M40 10L65 21L62 49Q57 64 40 71Q22 62 18 48L15 21Z','#397d9a','#c7f5ef',2)+path('M40 22C37 34 28 36 28 45A12 12 0 0 0 52 45C52 36 43 31 40 22Z','#90d6e6','#e8fffb')+line('M40 15V19M23 26L26 48','#e8fffb',2),
 'lightning-lance':line('M12 66L60 18','#c9b1ff',9)+line('M12 66L60 18','#f9f1ff',3)+path('M46 18L70 9L61 34L57 23Z','#ede1ff','#f6c97e')+line('M29 50L19 43L33 38L29 29L43 27','#a696ef',2),
 'lightning-volley':path('M40 34L11 15L19 39L32 47L23 63L40 55L58 65L49 47L65 39L71 15L42 34Z','#ac9bdd','#eee5ff',2)+path('M34 35L42 24L50 34L44 40Z','#f6e7bb')+line('M14 55L26 54L20 67M62 50L55 59L67 57','#d7b9ff',2),
 'lightning-thunder':path('M13 35C2 24 15 14 25 20C25 5 48 8 49 19C64 12 77 25 67 36Z','#737d9c','#cfccf4',2)+bolt(9,14,.75)+line('M9 68L23 66M57 67H72','#e5c8ff',2),
 'lightning-barrier':circle(40,40,23,'#9882bd33','#c8b8ff')+bolt(10,9,.72)+line('M13 25L23 30M57 21L64 15M62 52L72 55M17 60L25 55','#ecd9ff',3)+circle(40,40,33,'none','#9b88c2'),
 'lightning-reflect':path('M12 57L40 42L70 57L41 71Z','#73639966','#c9b6f2')+line('M15 57V25M40 43V13M68 57V26M15 25L40 13L68 26M15 25L42 39L68 26M42 39V69','#b6a7ed',1.5)+bolt(19,19,.5),
 'wind-orb':path('M19 15C75 23 73 58 16 68C45 53 53 35 19 15Z','#94decc','#e3fff2',2)+line('M10 29Q29 29 38 36M8 44H29M12 57L32 52','#c5f3df',2),
 'wind-volley':line('M14 20C58 4 79 26 44 31C5 36 6 48 44 46C68 45 66 57 38 59C20 60 31 72 44 70','#b9f0d7',6)+line('M16 14C41 6 67 14 65 25M21 40Q38 34 60 39M30 53L50 52','#f1ffec',1.5),
 'wind-lance':[-12,0,12].map((x,i)=>`<g transform="translate(${x} ${i*9-8})">${path('M25 18C72 30 64 50 24 60C45 43 47 33 25 18Z','#96d7c8','#eaffde')}</g>`).join('')+line('M8 46L20 43M7 57L24 53','#eaffde',2),
 'wind-barrier':path('M17 64V22Q40 7 63 22V64Z','#7fcebc55','#c8f7df',2)+line('M22 29Q41 18 59 29M22 42Q43 31 59 43M22 54Q43 44 59 55','#e0fff0',3)+line('M12 64H69','#8bc4b9',2),
 'wind-reflect':path('M37 26C4 5 2 53 30 48C6 75 39 71 42 52C60 78 79 58 54 46C80 38 74 8 45 25Z','#9ddcc288','#cfefc5',1.5)+circle(41,30,7,'#d9e8b1','#f0f3ce')+path('M40 37Q20 61 41 68Q61 56 45 37Z','#a9dab5','#ebffe0')+line('M37 28H39M44 28H46','#4c8176',2),
 'earth-orb':spikes(62)+line('M10 67L28 63L35 70L45 62L65 68','#efc58d',2)+path('M12 38L24 33L32 38L48 31L66 36','none','#b89774',2),
 'earth-lance':path('M9 34L19 21L35 18L52 20L72 35L65 64L41 72L16 63Z','#65503e','#c5a276',2)+spikes(58)+path('M8 34L20 39L13 49M72 35L62 41L69 49','none','#f0ce96',2),
 'earth-volley':path('M8 63L22 28L38 41L49 17L72 64Z','#a68964','#e0c292',2)+path('M8 66L28 58L37 67L46 53L57 64L73 57','none','#ffe2a6',3)+line('M17 19L18 11M60 19L69 15M64 43L74 41','#f0cd97',2),
 'earth-barrier':path('M12 63V26L22 19L39 15L58 19L69 27V63Z','#9b825f','#e1cda4',2)+line('M12 39L33 37L50 39L69 42M15 53L34 51L51 53L67 55M31 18L33 37L28 51L29 64M51 18L50 39L55 53L53 64','#594d40',2),
 'earth-reflect':circle(40,37,22,'#5d5143','#d9bd8d')+circle(40,37,7,'#1e2529','#f8d6a0')+[0,1,2,3,4,5].map(i=>{const a=i*Math.PI/3,x=40+Math.sin(a)*30,y=37+Math.cos(a)*29;return path(`M${x-6} ${y-3}L${x} ${y-8}L${x+7} ${y}L${x+2} ${y+6}L${x-6} ${y+4}Z`,'#a68b66','#ecd2a2');}).join(''),
 'light-orb':line('M7 63L65 15','#f5dc8b',12)+line('M7 63L65 15','#ffffe9',4)+path('M62 7L64 16L74 19L64 22L62 33L59 22L50 19L59 16Z','#fff5bf','none'),
 'light-barrier':circle(40,40,24,'#dbf6f033','#f8eabd')+line('M7 51L35 40','#fff6c6',4)+['#f19794','#efc481','#f6ec9b','#b0d396','#9ed8ec','#adace5','#d5a5d4'].map((c,i)=>line(`M41 40L74 ${20+i*7}`,c,2)).join('')+line('M29 22Q18 33 21 45','#f3fff3',2),
 'light-lance':path('M10 63Q10 12 40 12Q70 12 70 63Z','#f6e6b622','#e9f7ed',2)+line('M13 42L29 36L24 19M29 36L41 23L52 35L66 40M41 23V13M29 36L28 62M52 35L55 63','#c5e0db',1.6)+line('M15 58L52 27L47 59L21 29L66 55','#ffefaf',2),
 'light-reflect':path('M28 11L63 23L54 66L19 55Z','#dcf2ee55','#f7de92',3)+path('M32 18L56 26L49 57L26 50Z','#a1cbce66','#f1ffff')+line('M8 39L33 37L16 14M33 37L66 56','#fff7c7',3)+line('M34 25L45 29M30 34L48 40','#eaffff',1.5),
 'light-volley':path('M24 70L31 11H49L57 70Z','#f3dd8a66','none')+line('M40 9V70','#ffffd4',7)+[0,1,2,3,4].map(i=>line(`M${20+i*3} ${63-i*10}H${60-i*3}`,'#fff2b6',2)).join('')+path('M40 3L44 12L55 15L44 18L40 27L36 18L26 15L36 12Z','#fff7d5','none'),
 'dark-orb':shadowPerson(20,38,.72)+shadowPerson(60,38,.72)+shadowPerson(40,34,.86)+line('M10 70Q40 60 70 70','#b9a0d9',2),
 'dark-lance':path('M10 54L18 30L25 19L39 24L49 16L57 29L69 34L56 40L53 58L44 63L41 45L28 43L24 63L17 63Z','#26263a','#c4b0e5',2)+circle(50,29,2,'#eb9ba2','none')+line('M6 43L14 42M5 54L13 52M5 64L12 61','#b394db',2),
 'dark-volley':path('M13 55L12 28L22 17L43 16L58 26L64 43L71 50L66 62L58 63L56 52L50 41L50 65H39L36 48H25L24 65H14Z','#383046','#d0b7e8',2)+path('M40 26C15 15 17 48 36 39L37 32Z','#82748f','#d5bddf')+circle(52,29,2,'#e8aea7','none'),
 'dark-domain':circle(40,40,29,'#211f35','#bba1d2')+circle(40,40,20,'#3b304f','#776088')+path('M16 60Q40 43 65 60Q39 78 16 60Z','#171a2b','#b58cc7')+line('M40 15V27M19 38L29 40M61 38L51 40','#cfb5df',2)+circle(40,40,5,'#d8b5db','none'),
 'dark-reflect':path('M10 58Q39 45 70 58Q43 74 10 58Z','#26223b','#c4a3dd',2)+shadowPerson(40,37,.8)+path('M20 50Q40 43 61 51L58 61H22Z','#392d4f','#b38acb')+line('M10 68Q40 58 69 68','#9376b3',2),
 'wood-orb':flower(40,35)+line('M40 39V69','#9ac778',3)+leaf(29,57,-55)+path('M13 49Q2 60 21 65Q18 52 32 50M56 47Q80 54 64 68Q65 56 49 60','#b19bc377','#d7b4ec'),
 'wood-lance':shadowPerson(40,38,.85)+line('M17 63C55 59 16 44 55 40C73 36 49 19 35 14M30 68C69 60 23 53 57 49','#8fbd68',5)+leaf(20,51,-55)+leaf(57,28,65),
 'wood-volley':line('M12 70L17 19M23 70L28 12','#b4cf80',4)+line('M13 55H18M15 36H20M24 48H29M26 28H31','#ecedb2',2)+leaf(46,29,50)+leaf(60,46,70)+leaf(41,58,85)+line('M44 20L31 30M60 57L49 66','#c7dfa0',1.5),
 'wood-barrier':path('M40 14C17 10 12 32 15 47C17 70 34 69 40 65C50 71 66 66 66 44C69 24 56 9 40 14Z','#a27f52','#e5ca91',2)+line('M40 17C29 25 46 29 35 39S45 56 39 64M26 23Q16 35 25 42M55 25Q64 38 54 47M24 52L31 56M48 56L56 52','#674f38',2),
 'wood-reflect':path('M8 61Q40 45 73 61L65 72H15Z','#596f43','#c3d596')+leaf(21,45,-25)+leaf(56,44,30)+line('M39 63V24','#c3d596',3)+leaf(39,25,0)+flower(20,58,'#d3aaa5')+flower(61,58,'#e4cf8d'),
 'ice-orb':circle(40,43,23,'#c5e8ef','#f0ffff')+snowflake(40,43,.8)+line('M16 19L21 27M59 14L56 25M35 9V19','#daf5ff',2)+path('M13 65Q38 55 68 65L62 72H20Z','#adcbd6','#e9fbff'),
 'ice-lance':shadowPerson(40,40,.85)+line('M22 22L55 49L26 57L57 24M18 39L58 60','#b7e2ef',5)+path('M17 14L31 18L23 32ZM60 48L69 67L52 60Z','#b6dce7','#edffff')+snowflake(61,18,.37),
 'ice-volley':shadowPerson(30,37,.8)+shadowPerson(57,34,.66)+line('M9 43C29 31 45 52 70 39M9 54C27 45 44 65 71 52M14 65C34 54 52 71 66 63','#d0e7ef',5)+line('M14 23Q39 8 65 24','#a9cddc',2),
 'ice-barrier':path('M12 65L12 31L22 17L32 26L43 10L54 26L64 19L70 34V65Z','#91bfce','#e6fcff',2)+line('M22 20L25 64M43 14L40 66M61 25L57 64M26 42L40 36L57 44','#dffbff',1.7)+snowflake(42,48,.44),
 'ice-reflect':path('M11 29C5 18 18 10 29 17C38 5 53 10 55 19C68 12 76 23 69 33Z','#819dad','#daeaf0')+snowflake(22,49,.37)+snowflake(51,44,.5)+snowflake(64,61,.3)+path('M7 67Q22 55 39 66Q58 57 74 68V74H7Z','#d2e9ed','#edfaff')
};
const urls=new Map();
export function spellArtwork(spell){
  if(!SPELL_ILLUSTRATIONS[spell.id])throw new Error('Missing spell illustration: '+spell.id);
  if(!urls.has(spell.id)){
    const color=spell.color||'#c2d7cb',svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><defs><radialGradient id="back" cx="35%" cy="25%" r="95%"><stop stop-color="${color}" stop-opacity=".38"/><stop offset="1" stop-color="#101d29"/></radialGradient><radialGradient id="energy" cx="30%" cy="25%"><stop stop-color="#f1ffff" stop-opacity=".8"/><stop offset=".48" stop-color="${color}" stop-opacity=".8"/><stop offset="1" stop-color="${color}" stop-opacity=".3"/></radialGradient></defs><rect width="80" height="80" rx="9" fill="#172530"/><rect x="1" y="1" width="78" height="78" rx="8" fill="url(#back)" stroke="${color}" stroke-opacity=".6"/><circle cx="41" cy="40" r="31" fill="none" stroke="${color}" stroke-opacity=".1"/><g stroke-linecap="round" stroke-linejoin="round">${SPELL_ILLUSTRATIONS[spell.id]}</g><path d="M6 18V6H18M62 74H74V62" fill="none" stroke="${color}" stroke-opacity=".5"/></svg>`;
    urls.set(spell.id,'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg));
  }
  return urls.get(spell.id);
}
export function spellImage(spell){return `<img class="spell-art" src="${spellArtwork(spell)}" alt="" draggable="false">`;}
