import {PORTRAIT_IMAGES} from './portrait-images.js';
import {portraitKey} from './portrait-key.js';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cached=new Map();
const WIDTH=256,HEIGHT=304;
function portraitKind(speaker){return portraitKey(speaker).split('/')[0]==='npc'?'villager':portraitKey(speaker).split('/')[0]==='ha-ly'?'ninja':portraitKey(speaker).split('/')[0];}
export function portraitURL(speaker){const key=portraitKey(speaker),village=speaker.appearance?.village||speaker.village||'nameless';const name=PORTRAIT_IMAGES[key]||PORTRAIT_IMAGES['npc/'+village+'/lore']||PORTRAIT_IMAGES['npc/nameless/lore'],path='assets/portraits/'+name;return typeof document==='undefined'?path:new URL(path,document.baseURI).href;}
export function modelPortrait(speaker){const url=portraitURL(speaker);if(!cached.has(url)){const image=new Image();image.src=url;const ready=image.decode().then(()=>url);cached.set(url,ready);ready.catch(()=>cached.delete(url));if(cached.size>64)cached.delete(cached.keys().next().value);}return cached.get(url);}

export function portraitMarkup(speaker){
  const kind=portraitKind(speaker),name=escape(speaker.name||''),initials=escape((speaker.name||'').trim().split(/\s+/).slice(-2).map(s=>Array.from(s)[0]).join(''));
  return `<div class="model-portrait" data-portrait-kind="${kind}" data-villager-job="${escape(speaker.appearance?.job||'')}" data-model-ready="false" aria-busy="true"><img src="${portraitURL(speaker)}" alt="${name}" width="${WIDTH}" height="${HEIGHT}"><span class="model-portrait-fallback" aria-hidden="true">${initials}</span></div>`;
}

export function mountModelPortrait(container,speaker){
  container.innerHTML=portraitMarkup(speaker);const host=container.firstElementChild,img=host.querySelector('img');
  return modelPortrait(speaker).then(async src=>{
    if(container.firstElementChild!==host)return false;img.src=src;await img.decode();
    if(container.firstElementChild!==host)return false;host.dataset.modelReady='true';host.setAttribute('aria-busy','false');return true;
  }).catch(()=>{if(container.firstElementChild===host){host.dataset.modelReady='error';host.setAttribute('aria-busy','false');}return false;});
}
