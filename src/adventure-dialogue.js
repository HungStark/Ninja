import {gameLanguage} from './language.js';
import {gameAudio} from './game-audio.js';
import {villagerAppearance} from './villager-appearance.js';
import {portraitMarkup,mountModelPortrait,modelPortrait} from './model-portrait.js';
import {armorById,equipmentState} from './equipment.js';
import {HA_LY,HA_LY_MOTHER,currentVillageEvent} from './village-events.js';
import {ninjaProfile} from './ninja.js';
import {encounterAppearance} from './encounter-appearance.js';
export const speakerPortrait=portraitMarkup;

export function heroSpeaker(save){return {name:save.hero.name,role:'Người giữ ấn',coat:save.hero.coat,hair:save.hero.hair,armor:armorById(save.equipment?.armor),equipment:equipmentState(save),id:'hero'};}

export function dialogueCast(item,save,region,biome){
  if(!item||!['npc','lore','healer','mentor','expedition-giver','envoy','treaty','boss','quest','shop','intro-guardian','village-guard','village-event','companion','story-witness'].includes(item.kind))return null;
  const hero=heroSpeaker(save);
  if(['village-event','companion','story-witness'].includes(item.kind)){
    const e=currentVillageEvent(save),mother=item.id===HA_LY_MOTHER.id||(item.kind==='village-event'&&e?.speakerId===HA_LY_MOTHER.id);
    if(mother){const appearance={...villagerAppearance('fire',HA_LY_MOTHER),...HA_LY_MOTHER};return {hero,npc:{...HA_LY_MOTHER,appearance,elder:true}};}
    const girl=item.kind!=='village-event'||biome.id==='fire',appearance=girl?ninjaProfile(HA_LY):villagerAppearance(biome.id,{id:'story-guide-'+biome.id,kind:'lore'});
    return {hero,npc:{id:girl?HA_LY.id:'story-guide-'+biome.id,name:girl?HA_LY.name:e?.speaker||'Người làm chứng',role:girl?(save.story.companion.recruited?HA_LY.role:'Nữ ninja Làng Hỏa · Đang bị thương'):'Câu chuyện của '+biome.name,portraitPose:girl&&!save.story.companion.recruited?'wounded':'standing',appearance,coat:appearance.coat,hair:appearance.hair}};
  }
  const n=region.npcs.find(n=>n.id===(item.kind==='expedition-giver'?'fire-khoi':item.id)),index=region.npcs.indexOf(n);
  const npc=n?{name:n.name,role:n.role,coat:n.kind==='mentor'?biome.color:n.kind==='healer'?'#d0d9c0':'#8a7962',hair:index%2?'#ddd0b5':'#3c4243',elder:n.kind==='mentor',id:n.id}:{name:item.kind==='npc'?'Trưởng làng':item.kind==='envoy'?'Đại diện '+biome.name:item.kind==='boss'?region.boss.name:item.kind==='quest'?item.label:'Đại diện các làng',role:biome.name,coat:item.kind==='npc'?'#77725c':biome.color,hair:item.kind==='npc'?'#b2b9a9':'#30333c',elder:item.kind==='npc',id:item.kind};
  if(n||['npc','envoy','treaty'].includes(item.kind)){const appearance=villagerAppearance(biome.id,n||{kind:item.kind==='npc'?'chief':'envoy'});Object.assign(npc,{appearance,coat:appearance.coat,hair:appearance.hair,elder:appearance.age==='elder'});}
  else if(['quest','village-guard'].includes(item.kind))npc.appearance=ninjaProfile(encounterAppearance({kind:item.kind,village:biome.id}));
  else if(['intro-guardian','boss'].includes(item.kind))npc.appearance={kind:'creature',id:biome.id};
  return {hero,npc};
}

export function conversationLines(item,save,cast,body){
  const {hero,npc}=cast,line=(speaker,text)=>({speaker,text});
  if(['village-event','companion','story-witness'].includes(item.kind))return [line(npc,body),line(hero,item.kind==='companion'?'Chúng ta cùng đi tiếp. Có bạn đồng hành, con đường này đã khác trước rồi.':'Tôi sẽ giúp. Hãy cùng làm rõ chuyện này trước khi có thêm ai gặp nạn.')];
  if(item.id==='nameless-resident-war-cemetery'&&save.story?.stage==='mother')return [line(hero,'Mẹ, con nhớ cha và em. Con muốn làm điều gì đó để cuộc chiến này chấm dứt.'),line(npc,body),line(npc,'Mẹ chỉ mong con trở về bình an. Nếu con quyết tâm lên đường, hãy hứa với mẹ: đừng để lòng thù hận dẫn lối. Hãy đem hòa bình về cho những người còn sống.')];
  if(item.kind==='npc')return [line(hero,save.quests[save.village]===2?'Tôi đã giải quyết xong việc được giao và trở về báo tin.':'Trưởng làng, có điều gì tôi có thể giúp không?'),line(npc,body)];
  if(item.kind==='expedition-giver')return [line(hero,save.expeditions.fire>=2?'Tôi đã trở lại. Những bông Hồng Liên này có giúp được người bị thương không?':'Tôi nghe nói có người cần thuốc chữa thương. Tôi có thể giúp gì?'),line(npc,body)];
  if(item.kind==='envoy')return [line(hero,'Tôi đến để chuyển lời từ ba làng Thủy, Hỏa và Lôi.'),line(npc,body)];
  if(['quest','boss'].includes(item.kind))return [line(hero,'Ta tới để chấm dứt chuyện này.'),line(npc,body)];
  return [line(npc,body),line(hero,item.kind==='mentor'?'Tôi sẽ ghi nhớ lời chỉ dạy.':'Cảm ơn đã chia sẻ. Tôi đã hiểu rồi.')];
}

export function createDialogueUI(root){
  const get=id=>root.querySelector('#'+id),card=root.querySelector('.journey-dialog-card'),portrait=get('dialogPortrait'),name=get('dialogSpeakerName'),role=get('dialogSpeakerRole'),body=get('dialogBody'),controls=get('dialogConversationControls'),next=get('dialogNext'),skip=get('dialogSkip'),counter=get('dialogLineCount');
  const segmenter=globalThis.Intl?.Segmenter?new Intl.Segmenter(gameLanguage(),{granularity:'grapheme'}):null;
  let lines=[],index=0,letters=[],shown=0,budget=0,active=false,complete=false,allowSkip=true,onComplete=()=>{};
  const ready=()=>{const typing=shown<letters.length,last=index===lines.length-1;next.hidden=!typing&&last;next.disabled=false;next.textContent=typing?'Hiện đầy đủ':'Tiếp lời →';counter.textContent=`${index+1} / ${lines.length}`;body.dataset.typing=String(typing);if(last&&!typing&&!complete){complete=true;onComplete();}};
  function render(){const line=lines[index];gameAudio.dialogueLine(line);mountModelPortrait(portrait,line.speaker);name.textContent=line.speaker.name;role.textContent=line.speaker.role;letters=segmenter?Array.from(segmenter.segment(line.text),s=>s.segment):Array.from(line.text);shown=0;budget=0;body.textContent='';body.scrollTop=0;body.setAttribute('aria-label',line.text);ready();}
  function advance(){if(!active)return;if(shown<letters.length){shown=letters.length;body.textContent=letters.join('');gameAudio.finishTyping();ready();}else if(index<lines.length-1){index++;render();}}
  next.onclick=advance;skip.onclick=()=>{if(!active||!allowSkip)return;index=lines.length-1;render();advance();gameAudio.stopDialogue();skip.hidden=true;ready();};
  return {get active(){return active;},get complete(){return active&&complete;},state:()=>({active,index,count:lines.length,typing:shown<letters.length,complete:active&&complete}),show(script,options={}){lines=script;for(const line of lines)modelPortrait(line.speaker).catch(()=>{});index=0;active=true;complete=false;allowSkip=options.allowSkip!==false;onComplete=options.onComplete||(()=>{});card.classList.add('is-conversation');portrait.parentElement.hidden=false;controls.hidden=false;skip.hidden=!allowSkip;render();},reset(){gameAudio.stopDialogue();portrait.replaceChildren();active=false;complete=false;lines=[];onComplete=()=>{};card.classList.remove('is-conversation');portrait.parentElement.hidden=true;controls.hidden=true;body.scrollTop=0;body.removeAttribute('aria-label');delete body.dataset.typing;},advance,update(dt){if(!active)return;if(shown>=letters.length){ready();return;}budget+=dt;let changed=false;while(shown<letters.length){const delay=/[.!?…]/.test(letters[shown])?.12:/[,;:]/.test(letters[shown])?.065:.028;if(budget<delay)break;budget-=delay;shown++;changed=true;}if(changed){body.textContent=letters.slice(0,shown).join('');if(shown===letters.length)gameAudio.finishTyping();ready();}}};
}
