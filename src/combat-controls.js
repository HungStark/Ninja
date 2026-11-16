export const COMBAT_CONTROLS_KEY='anhoa-combat-controls-v1';
export function readCombatControls(storage=globalThis.localStorage){
  let s={};try{s=JSON.parse(storage?.getItem(COMBAT_CONTROLS_KEY))||{};}catch{}
  return {aimAssist:s.aimAssist!==false,movement:'mouse'};
}
export function arrowMovement(held){const x=Number(held.has('arrowright'))-Number(held.has('arrowleft')),y=Number(held.has('arrowdown'))-Number(held.has('arrowup')),n=Math.hypot(x,y)||1;return [x/n,y/n];}
export function cursorMovement(x,y,width,height){const dx=(x-width/2)/(width*.35),dy=(y-height/2)/(height*.35),n=Math.hypot(dx,dy);return n<.12?[0,0]:[dx/Math.max(1,n),dy/Math.max(1,n)];}
export function setupCombatControls(options,onChange){
  const inputs=[];
  function toggle(id,inputId){
    const label=document.createElement('label');label.id=id;label.className='outline combat-aim-toggle';
    const input=document.createElement('input');input.type='checkbox';input.id=inputId;input.checked=options.aimAssist;
    const text=document.createElement('span');text.textContent='Hỗ trợ tự ngắm';label.append(input,text);inputs.push(input);
    let pointerAction=false;label.addEventListener('pointerdown',()=>{pointerAction=true;});label.addEventListener('pointercancel',()=>{pointerAction=false;});
    input.addEventListener('change',()=>{
      const value={aimAssist:input.checked,movement:'mouse'};for(const other of inputs)other.checked=value.aimAssist;
      try{localStorage.setItem(COMBAT_CONTROLS_KEY,JSON.stringify(value));}catch{}
      onChange(value);if(pointerAction){input.blur();pointerAction=false;}
    });return label;
  }
  const header=document.querySelector('header'),quality=document.getElementById('qualityButton'),control=toggle('aimAssistToggle','beginnerAimAssist');
  if(quality.parentElement===header)quality.before(control);else header.append(control);
  (document.querySelector('.android-pause-settings')||document.querySelector('#pauseScreen .pause-card')).append(toggle('pauseAimAssistToggle','pauseAimAssist'));
}
