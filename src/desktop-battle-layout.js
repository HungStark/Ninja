export function setupDesktopBattleLayout(){
  const hud=document.getElementById('hud'),status=hud.querySelector(':scope > .status'),combo=hud.querySelector('.center-status'),hands=document.getElementById('practiceHandInset');
  const stack=document.createElement('div');stack.className='desktop-battle-stack';hud.prepend(stack);stack.append(status,hands,combo);
  return stack;
}
