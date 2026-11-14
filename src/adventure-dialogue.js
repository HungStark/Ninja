import {gameLanguage} from './language.js';
import {gameAudio} from './game-audio.js';
import {villagerAppearance} from './villager-appearance.js';
import {portraitMarkup,mountModelPortrait,modelPortrait} from './model-portrait.js';
import {armorById,equipmentState} from './equipment.js';
import {HA_LY,HA_LY_MOTHER,currentVillageEvent} from './village-events.js';
import {ninjaProfile} from './ninja.js';
import {encounterAppearance} from './encounter-appearance.js';
import {questForNPC} from './journey-story.js';
import {PLOT} from './campaign-plot.js';
import {companionSacrificed} from './phoenix-blessing.js';
import {campaignSpeakers,defaultCampaignSpeaker} from './campaign-characters.js';
export const speakerPortrait=portraitMarkup;

export function heroSpeaker(save){return {name:save.hero.name,role:'Người giữ ấn',coat:save.hero.coat,hair:save.hero.hair,armor:armorById(save.equipment?.armor),equipment:equipmentState(save),id:'hero'};}

export function campaignLines(script,save,id=save.village){
  const hero=heroSpeaker(save),speakers={...campaignSpeakers(save,id),hero,
    narrator:{...hero,name:'Suy nghĩ nội tâm',role:hero.name,thought:true},
    memory:{...hero,role:'Suy nghĩ nội tâm',thought:true}};
  return (script||[]).filter(([key])=>key!=='haly'||!companionSacrificed(save)).map(([key,text])=>({speaker:speakers[key]||speakers.guide,text}));
}

export function dialogueCast(item,save,region,biome){
  if(!item||!['npc','lore','healer','mentor','expedition-giver','envoy','treaty','boss','quest','shop','intro-guardian','village-guard','village-event','companion','story-witness'].includes(item.kind))return null;
  const hero=heroSpeaker(save);
  if(['village-event','companion','story-witness'].includes(item.kind)){
    const e=currentVillageEvent(save),mother=item.id===HA_LY_MOTHER.id||(item.kind==='village-event'&&e?.speakerId===HA_LY_MOTHER.id);
    if(mother){const appearance={...villagerAppearance('fire',HA_LY_MOTHER),...HA_LY_MOTHER};return {hero,npc:{...HA_LY_MOTHER,appearance,elder:true}};}
    const speaker=item.kind==='village-event'?defaultCampaignSpeaker(save,biome.id,e):campaignSpeakers(save,biome.id).haly;
    return {hero,npc:{...(speaker.id==='hero'?hero:{}),...speaker,portraitPose:speaker.id===HA_LY.id&&!save.story.companion.recruited?'wounded':speaker.portraitPose||'standing'}};
  }
  const n=region.npcs.find(n=>n.id===(item.kind==='expedition-giver'?'fire-dan':item.id)),index=region.npcs.indexOf(n);
  const npc=n?{name:n.name,role:n.role,coat:n.kind==='mentor'?biome.color:n.kind==='healer'?'#d0d9c0':'#8a7962',hair:index%2?'#ddd0b5':'#3c4243',elder:n.kind==='mentor',id:n.id}:{name:item.kind==='npc'?'Trưởng làng':item.kind==='envoy'?'Đại diện '+biome.name:item.kind==='boss'?region.boss.name:item.kind==='quest'?item.label:'Đại diện các làng',role:biome.name,coat:item.kind==='npc'?'#77725c':biome.color,hair:item.kind==='npc'?'#b2b9a9':'#30333c',elder:item.kind==='npc',id:item.kind};
  if(n||['npc','envoy','treaty'].includes(item.kind)){const appearance=villagerAppearance(biome.id,n||{kind:item.kind==='npc'?'chief':'envoy'});Object.assign(npc,{appearance,coat:appearance.coat,hair:appearance.hair,elder:appearance.age==='elder'});}
  else if(item.kind==='shop')npc.appearance=villagerAppearance(biome.id,{id:'shopkeeper',kind:'envoy'});
  else if(['quest','village-guard'].includes(item.kind))npc.appearance=item.appearance||ninjaProfile(encounterAppearance({kind:item.kind,village:biome.id,element:item.element,occupation:!!item.occupation}));
  else if(['intro-guardian','boss'].includes(item.kind))npc.appearance={kind:'creature',id:biome.id};
  if(item.kind==='treaty'&&item.id)npc.appearance=villagerAppearance(item.id,{kind:'envoy'});
  return {hero,npc};
}

export function conversationLines(item,save,cast,body){
  const {hero,npc}=cast,line=(speaker,text)=>({speaker,text});
  if(['village-event','companion','story-witness'].includes(item.kind))return [line(npc,body)];
  if(item.id==='nameless-resident-war-cemetery'&&save.story?.stage==='mother')return campaignLines(PLOT.mother,save,'nameless');
  if(item.kind==='npc')return [line(npc,body)];
  if(item.kind==='expedition-giver')return [line(hero,save.expeditions.fire===3?'Thuốc Hồng Liên đã sẵn sàng để chữa thương cho Hạ Ly chưa?':save.story.questItems?.includes('fire:hong-lien')?'Tôi đã mang Hồng Liên về. Cô có thể điều chế thuốc cứu Hạ Ly không?':'Hạ Ly đang bị thương trong ngục. Tôi có thể tìm Hồng Liên trên đỉnh núi để cứu nàng không?'),line(npc,body)];
  if(item.kind==='envoy')return [line(hero,'Tôi đến để chuyển lời từ ba làng Thủy, Hỏa và Lôi.'),line(npc,body)];
  if(['quest','boss'].includes(item.kind))return [line(hero,'Ta tới để chấm dứt chuyện này.'),line(npc,body)];
  const quest=questForNPC(save.village,item);
  return quest&&save.story?.sidequests[quest.id]===3?[line(npc,sidequestThanks(quest)),line(npc,body)]:[line(npc,body)];
}

export function sidequestThanks(quest){
  if(quest.targetModel==='flowers')return 'Cảm ơn con đã mang hoa về. Có những người vẫn được nhớ tới, dù họ không còn ở bên chúng ta.';
  if(quest.type==='combat')return 'Cảm ơn bạn đã ngăn những kẻ phá hoại. Mọi người có thể yên tâm trở lại làm việc rồi.';
  if(quest.type==='survey')return 'Những ghi chép bạn mang về đã giúp tôi tìm ra chỗ cần sửa. Cảm ơn bạn đã cất công khảo sát.';
  return 'Đúng là thứ tôi đang tìm! Nhờ bạn mang về, công việc của tôi có thể tiếp tục. Cảm ơn bạn.';
}

export function sidequestLines(quest,status,{hero,npc},body,early=false){
  if(status>=2)return early&&status===2?[{speaker:hero,text:'Tôi đã vô tình hoàn thành việc này trên đường đi. Đây là những gì tôi mang về.'},{speaker:npc,text:body}]:[{speaker:npc,text:body}];
  if(early)return [{speaker:npc,text:body}];
  const reply=status===1?'Tôi đang theo dấu việc này. Khi có kết quả, tôi sẽ trở lại.':quest.type==='combat'?'Tôi sẽ tới đó xem xét. Nếu có kẻ đe dọa dân làng, tôi sẽ ngăn chúng.':quest.type==='survey'?'Tôi sẽ kiểm tra khu vực và ghi lại những gì tìm thấy.':'Tôi sẽ tìm quanh khu vực đó và mang đồ về cho bạn.';
  return [{speaker:npc,text:body},{speaker:hero,text:reply}];
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
