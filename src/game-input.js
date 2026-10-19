// Gameplay follows physical keys, even when an IME reports Process, Dead or a
// Vietnamese character as event.key. Text fields retain normal native typing.
export function physicalKey(event){
  const code=event.code||'';
  if(/^Key[A-Z]$/.test(code))return code.slice(3).toLowerCase();
  if(/^(Digit|Numpad)[0-9]$/.test(code))return code.at(-1);
  if(code==='Space')return ' ';
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Escape','Enter','NumpadEnter','Backspace','Tab'].includes(code))return code==='NumpadEnter'?'enter':code.toLowerCase();
  return String(event.key||'').toLowerCase();
}
export function textInputTarget(target){return !!(target?.isContentEditable||target?.closest?.('input,textarea,select,[contenteditable="true"],[contenteditable=""]'));}
