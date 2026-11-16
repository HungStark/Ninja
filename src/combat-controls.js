export const COMBAT_CONTROLS_KEY='anhoa-combat-controls-v1';
export function readCombatControls(storage=globalThis.localStorage){
  let s={};try{s=JSON.parse(storage?.getItem(COMBAT_CONTROLS_KEY))||{};}catch{}
  return {aimAssist:s.aimAssist!==false,predictionLines:s.predictionLines!==false,view:s.view==='first-person'?'first-person':'overhead',movement:'mouse'};
}
export function arrowMovement(held){const x=Number(held.has('arrowright'))-Number(held.has('arrowleft')),y=Number(held.has('arrowdown'))-Number(held.has('arrowup')),n=Math.hypot(x,y)||1;return [x/n,y/n];}
export function cursorMovement(x,y,width,height){const dx=(x-width/2)/(width*.35),dy=(y-height/2)/(height*.35),n=Math.hypot(dx,dy);return n<.12?[0,0]:[dx/Math.max(1,n),dy/Math.max(1,n)];}
export function setupCombatControls(options,onChange,{onOpen=()=>false,onClose=()=>{},canChangeView=()=>true,getView=()=>null}={}){
  const dialog=document.createElement('section');dialog.id='combatSettingsDialog';dialog.className='overlay hidden';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','combatSettingsTitle');
  const panel=document.createElement('div');panel.id='combatSettingsPanel';panel.className='pause-card panel';
  panel.innerHTML='<h2 id="combatSettingsTitle">Tùy chỉnh chiến đấu</h2><label class="combat-setting"><input type="checkbox" id="beginnerAimAssist"><span>Hỗ trợ tự ngắm</span></label><label class="combat-setting"><span>Góc nhìn</span><select id="combatView"><option value="first-person">Góc nhìn thứ nhất</option><option value="overhead">Góc nhìn thứ ba</option></select></label><p class="combat-view-help">Chọn góc nhìn trước trận; giữ nguyên đến khi trận kết thúc.</p><label class="combat-setting"><input type="checkbox" id="combatPredictionLines"><span>Đường dự đoán chiêu</span></label><button id="closeCombatSettings" class="outline">Đóng</button>';
  dialog.append(panel);document.body.append(dialog);
  const get=id=>panel.querySelector('#'+id);let resume=false,previous=null;
  function sync(){get('beginnerAimAssist').checked=options.aimAssist;get('combatPredictionLines').checked=options.predictionLines;get('combatView').value=getView()||options.view;get('combatView').disabled=!canChangeView();}
  function update(next){if(!canChangeView()&&next.view!==undefined)next={...next,view:options.view};options={...options,...next};try{localStorage.setItem(COMBAT_CONTROLS_KEY,JSON.stringify(options));}catch{}sync();onChange(options);}
  get('beginnerAimAssist').onchange=e=>update({aimAssist:e.target.checked});get('combatPredictionLines').onchange=e=>update({predictionLines:e.target.checked});get('combatView').onchange=e=>update({view:e.target.value});
  function close(){if(dialog.classList.contains('hidden'))return;dialog.classList.add('hidden');onClose(resume);previous?.focus?.({preventScroll:true});}
  function open(){previous=document.activeElement;resume=onOpen();dialog.append(panel);dialog.classList.remove('hidden');get('beginnerAimAssist').focus({preventScroll:true});}
  for(const [id,parent] of [['combatSettingsButton',document.querySelector('header')],['pauseCombatSettingsButton',document.querySelector('.android-pause-settings')||document.querySelector('#pauseScreen .pause-card')]]){const button=document.createElement('button');button.id=id;button.className='outline';button.textContent='Tùy chỉnh chiến đấu';button.onclick=open;parent.append(button);}
  const pane=document.querySelector('[data-tactical-pane="combat"]');if(pane)pane.append(panel);
  get('closeCombatSettings').onclick=close;
  window.addEventListener('keydown',e=>{if(dialog.classList.contains('hidden'))return;e.stopImmediatePropagation();if(e.key==='Escape'){e.preventDefault();close();}},true);
  sync();return {update,sync};
}
