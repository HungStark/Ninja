import {gameAudio} from './game-audio.js';
import {villagerAppearance} from './villager-appearance.js';
import {villagerPortrait} from './villager-portrait.js';
import {heroPortrait} from './hero-portrait.js';
import {armorById} from './equipment.js';
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function speakerPortrait(speaker){
  if(speaker.id==='hero')return heroPortrait(speaker);
  if(speaker.appearance)return villagerPortrait(speaker);
  const hair=escape(speaker.hair||'#3c4243'),coat=escape(speaker.coat||'#77725c'),name=escape(speaker.name),elder=speaker.elder;
  return `<svg viewBox="0 0 160 190" role="img" aria-label="Chân dung ${name}"><title>${name}</title><path fill="#13292e" d="M0 0h160v190H0z"/><path fill="${coat}" d="M7 190v-28l33-26 40-9 40 9 33 26v28z"/><path fill="#293534" d="m43 148 37 19 37-19-11 42H54z"/><path fill="#b79271" d="M63 119h34v34L80 165l-17-12z"/><path fill="${hair}" d="M29 86 24 42 43 20l16 3L76 6l14 15 29-5 16 28-6 65-25 25H53z"/><path fill="#c9a48a" d="m42 59 38-14 38 14v51l-15 26-23 12-23-12-15-26z"/><path fill="#b48d73" d="m42 74 14 14-2 31 26 29-23-12-15-26z"/><path fill="${hair}" d="m34 63 8-29 22-1 16-14 18 15 25 2 6 28-19-9-19 5-16-11-18 12z"/><path fill="${coat}" d="M35 63h90v22H35z"/><path fill="#aab3a7" d="M64 65h33v16H64z"/><path fill="none" stroke="#536564" stroke-width="3" d="m73 77 1-8 6 2 5-2 4 7-8-2z"/><path fill="#f3e6ce" d="m48 95 20 2-4 7-13-1zm45 2 20-2-3 8-13 1z"/><path stroke="#252d2a" stroke-width="4" d="m47 92 23 4m21 0 22-4"/><path fill="#4f6b56" d="M57 97h6v7h-6zm40 0h6v7h-6z"/><path fill="#273332" d="m44 109 36 7 36-7-6 24-30 16-30-16z"/>${elder?'<path fill="none" stroke="#967758" stroke-width="2" d="m43 105 9 3m56 0 9-3M49 87l17 2m29 0 17-2"/>':''}<path fill="${coat}" d="m32 75-15 32 19-9 6-19z"/></svg>`;
}

export function dialogueCast(item,save,region,biome){
  if(!item||!['npc','lore','healer','mentor','expedition-giver','envoy','treaty','boss','quest','shop','intro-guardian','village-guard'].includes(item.kind))return null;
  const hero={name:save.hero.name,role:'Người giữ ấn',coat:save.hero.coat,hair:save.hero.hair,armor:armorById(save.equipment?.armor),id:'hero'};
  const n=region.npcs.find(n=>n.id===(item.kind==='expedition-giver'?'fire-khoi':item.id)),index=region.npcs.indexOf(n);
  const npc=n?{name:n.name,role:n.role,coat:n.kind==='mentor'?biome.color:n.kind==='healer'?'#d0d9c0':'#8a7962',hair:index%2?'#ddd0b5':'#3c4243',elder:n.kind==='mentor',id:n.id}:{name:item.kind==='npc'?'Trưởng làng':item.kind==='envoy'?'Đại diện '+biome.name:item.kind==='boss'?region.boss.name:item.kind==='quest'?item.label:'Đại diện các làng',role:biome.name,coat:item.kind==='npc'?'#77725c':biome.color,hair:item.kind==='npc'?'#b2b9a9':'#30333c',elder:item.kind==='npc',id:item.kind};
  if(n||['npc','envoy','treaty'].includes(item.kind)){const appearance=villagerAppearance(biome.id,n||{kind:item.kind==='npc'?'chief':'envoy'});Object.assign(npc,{appearance,coat:appearance.coat,hair:appearance.hair,elder:appearance.age==='elder'});}
  return {hero,npc};
}

export function conversationLines(item,save,cast,body){
  const {hero,npc}=cast,line=(speaker,text)=>({speaker,text});
  if(item.id==='nameless-resident-war-cemetery'&&save.story?.stage==='mother')return [line(hero,'Mẹ, con nhớ cha và em. Con muốn làm điều gì đó để cuộc chiến này chấm dứt.'),line(npc,body),line(hero,'Con hứa sẽ đem lại hòa bình cho thế giới này. Con sẽ trở về bên mẹ.')];
  if(item.kind==='npc')return [line(hero,save.quests[save.village]===2?'Tôi đã giải quyết xong việc được giao và trở về báo tin.':'Trưởng làng, có điều gì tôi có thể giúp không?'),line(npc,body)];
  if(item.kind==='expedition-giver')return [line(hero,save.expeditions.fire>=2?'Tôi đã trở lại. Những bông Hồng Liên này có giúp được người bị thương không?':'Tôi nghe nói có người cần thuốc chữa thương. Tôi có thể giúp gì?'),line(npc,body)];
  if(item.kind==='envoy')return [line(hero,'Tôi đến để chuyển lời từ ba làng Thủy, Hỏa và Lôi.'),line(npc,body)];
  if(['quest','boss'].includes(item.kind))return [line(hero,'Ta tới để chấm dứt chuyện này.'),line(npc,body)];
  return [line(npc,body),line(hero,item.kind==='mentor'?'Tôi sẽ ghi nhớ lời chỉ dạy.':'Cảm ơn đã chia sẻ. Tôi đã hiểu rồi.')];
}

export function createDialogueUI(root){
  const get=id=>root.querySelector('#'+id),card=root.querySelector('.journey-dialog-card'),portrait=get('dialogPortrait'),name=get('dialogSpeakerName'),role=get('dialogSpeakerRole'),body=get('dialogBody'),controls=get('dialogConversationControls'),next=get('dialogNext'),skip=get('dialogSkip'),counter=get('dialogLineCount');
  const segmenter=globalThis.Intl?.Segmenter?new Intl.Segmenter('vi',{granularity:'grapheme'}):null;
  let lines=[],index=0,letters=[],shown=0,budget=0,active=false;
  const ready=()=>{next.hidden=shown===letters.length&&index===lines.length-1;next.textContent=shown<letters.length?'Hiện đầy đủ':'Tiếp lời →';counter.textContent=`${index+1} / ${lines.length}`;body.dataset.typing=String(shown<letters.length);};
  function render(){const line=lines[index];gameAudio.dialogueLine(line);portrait.innerHTML=speakerPortrait(line.speaker);name.textContent=line.speaker.name;role.textContent=line.speaker.role;letters=segmenter?Array.from(segmenter.segment(line.text),s=>s.segment):Array.from(line.text);shown=0;budget=0;body.textContent='';body.scrollTop=0;body.setAttribute('aria-label',line.text);ready();}
  function advance(){if(!active)return;if(shown<letters.length){shown=letters.length;body.textContent=letters.join('');gameAudio.finishTyping();ready();}else if(index<lines.length-1){index++;render();}}
  next.onclick=advance;skip.onclick=()=>{if(!active)return;index=lines.length-1;render();advance();gameAudio.stopDialogue();skip.hidden=true;};
  return {get active(){return active;},show(script){lines=script;index=0;active=true;card.classList.add('is-conversation');portrait.parentElement.hidden=false;controls.hidden=false;skip.hidden=false;render();},reset(){gameAudio.stopDialogue();active=false;lines=[];card.classList.remove('is-conversation');portrait.parentElement.hidden=true;controls.hidden=true;body.scrollTop=0;body.removeAttribute('aria-label');delete body.dataset.typing;},advance,update(dt){if(!active||shown>=letters.length)return;budget+=dt;let changed=false;while(shown<letters.length){const delay=/[.!?…]/.test(letters[shown])?.12:/[,;:]/.test(letters[shown])?.065:.028;if(budget<delay)break;budget-=delay;shown++;changed=true;}if(changed){body.textContent=letters.slice(0,shown).join('');if(shown===letters.length)gameAudio.finishTyping();ready();}}};
}
