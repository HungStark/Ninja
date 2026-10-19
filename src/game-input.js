// Gameplay follows physical keys, even when an IME reports Process, Dead or a
// Vietnamese character as event.key. Text fields retain normal native typing.
export function physicalKey(event){
  const code=event.code||'';
  // Windows VK_PACKET is a Unicode insertion from an input method, not a
  // physical key press. Never turn its text into a movement or seal key.
  if(event.keyCode===231)return '';
  if(/^Key[A-Z]$/.test(code))return code.slice(3).toLowerCase();
  if(/^(Digit|Numpad)[0-9]$/.test(code))return code.at(-1);
  if(code==='Space')return ' ';
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Escape','Enter','NumpadEnter','Backspace','Tab'].includes(code))return code==='NumpadEnter'?'enter':code.toLowerCase();
  const key=String(event.key||'').toLowerCase();
  // Unikey may replace text with code-less letter events. In particular an
  // injected "a" must never latch left movement until an unrelated keyup.
  return ['arrowup','arrowdown','arrowleft','arrowright','escape','enter','backspace','tab',' '].includes(key)&&!event.isComposing&&event.keyCode!==229?key:'';
}
export function textInputTarget(target){return !!(target?.isContentEditable||target?.closest?.('input,textarea,select,[contenteditable="true"],[contenteditable=""]'));}

const movementKeys=new Set(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright']);
const releaseCodes={87:'w',65:'a',83:'s',68:'d',38:'arrowup',37:'arrowleft',40:'arrowdown',39:'arrowright'};
export function releaseMovementKeys(held,event){
  if(event.keyCode===231)return;
  const physical=physicalKey(event),key=movementKeys.has(physical)?physical:!event.code||event.code==='Unidentified'?releaseCodes[event.keyCode]:null;
  if(key)held.delete(key);
  // If the OS omits both physical code and usable virtual key on release,
  // fail closed instead of leaving the previous movement held indefinitely.
  else if((!event.code||event.code==='Unidentified')&&(event.isComposing||event.keyCode===229||event.key==='Process'))held.clear();
}

export function setupGameFocus(canvas){
  canvas.tabIndex=0;canvas.setAttribute('inputmode','none');canvas.setAttribute('autocapitalize','off');canvas.setAttribute('autocomplete','off');canvas.setAttribute('spellcheck','false');
  return ()=>canvas.focus({preventScroll:true});
}
