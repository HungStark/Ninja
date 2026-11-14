import {spellImage} from './spell-art.js';

export function carriedSpellMarkup(spell,index,selected){
  return `<button class="spell${index===selected?' selected':''}${spell.sequence.length>8?' long-chain':''}" style="--element:${spell.color}" data-spell="${index}" aria-label="${spell.name}" title="${spell.name}"><span class="spell-picture">${spellImage(spell)}<span class="cooldown-sweep" aria-hidden="true"></span><span class="chakra-cover unavailable-cover" aria-hidden="true"></span><span class="spell-cooldown" data-cooldown></span><small class="spell-number">${index+1}</small></span><span class="spell-details"><span class="spell-title">${spell.name}</span><span class="spell-sequence">${spell.sequence.map(k=>`<kbd data-seq="${k}">${k.toUpperCase()}</kbd>`).join('')}</span></span></button>`;
}
export function updateSpellAvailability(button,spell,remaining,chakra,available=true){
  const cooling=remaining>.001,missing=chakra+1e-7<spell.cost,elapsed=1-Math.min(1,remaining/Math.max(.001,spell.cooldown,remaining));
  const sweep=(elapsed*360).toFixed(2)+'deg';
  if(button.style.getPropertyValue('--cooldown-sweep')!==sweep)button.style.setProperty('--cooldown-sweep',sweep);
  button.classList.toggle('on-cooldown',cooling);button.classList.toggle('chakra-missing',missing);
  button.classList.toggle('spell-unavailable',!available||cooling||missing);
  const counter=button.querySelector('[data-cooldown]'),text=cooling?String(remaining>=10?Math.ceil(remaining):remaining.toFixed(1)):'';
  if(counter.textContent!==text)counter.textContent=text;
  if(button.dataset.chakraMissing!==String(missing))button.dataset.chakraMissing=String(missing);
  const label=spell.name+(cooling?' · hồi '+remaining.toFixed(1)+' giây':'')+(missing?' · không đủ mana':'');
  if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
}
export function renderEnemySeals(element,sequence,cast=false){
  const keys=sequence.filter(k=>/^[a-z]$/i.test(k)).map(k=>k.toUpperCase());
  const html=keys.map(k=>`<kbd>${k}</kbd>`).join('')+(cast?'<kbd class="cast-seal" aria-label="Đã thi triển">␣</kbd>':'');if(element.innerHTML!==html)element.innerHTML=html;
  element.dataset.casting=String(cast);element.setAttribute('aria-label',keys.join(' ')+(cast?' · Đã thi triển':''));
}
