import {createTacticalSpellButton} from './mobile-tactical-controls.js';

// A separate document preserves the game's ID-based CSS without duplicate IDs
// or game input handlers in the editor. It uses the same viewport as the game.
export async function createMobileLayoutPreview(frame,mode,specs,{handsImage,isCurrent=()=>true}={}){
  const base=new URL('.',location.href).href;
  frame.srcdoc=`<!doctype html><html><head><base href="${base}"><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="adventure.css"><link rel="stylesheet" href="android.css"><style>html,body{margin:0;overflow:hidden;background:transparent!important}body{pointer-events:none}#hud,#journeyHud{visibility:visible!important}#adventure{display:block!important;background:none!important}#practiceHandInset{display:block!important}.layout-hands-image{width:100%;height:100%;object-fit:contain}#worldLabels,#landmarkIntro,.journey-brand,.journey-character,#adminIndicator,#androidRotateNotice{display:none!important}</style></head><body></body></html>`;
  await new Promise(resolve=>frame.addEventListener('load',resolve,{once:true}));
  if(!isCurrent())return null;
  const doc=frame.contentDocument,body=doc.body;
  body.className=mode==='combat'?'android-ui mobile-tactical playing practice-overhead':'android-ui adventure-view';body.dataset.journey=mode==='combat'?'combat':'explore';
  const clone=selector=>document.querySelector(selector)?.cloneNode(true);
  if(mode==='combat'){
    const hud=clone('#mobileTacticalHUD');hud.hidden=false;body.append(hud);
    const gameHUD=doc.createElement('main');gameHUD.id='hud';gameHUD.append(clone('.center-status'));body.append(gameHUD);
    body.append(clone('#practiceHandInset'));doc.getElementById('practiceHandInset').hidden=false;
    const fire=globalThis.SealGameCore.spells.filter(s=>s.element==='fire').slice(0,5);
    doc.getElementById('tacticalSpells').replaceChildren(...fire.map((s,i)=>createTacticalSpellButton(s,i,fire.length,doc)));
    doc.getElementById('tacticalEnemy').hidden=false;doc.querySelector('#tacticalEnemy strong').textContent='Ninja tập luyện';
    doc.querySelector('#tacticalEnemy .tactical-meter span').textContent='300 / 300';
    doc.querySelectorAll('.tactical-meter i').forEach(el=>el.style.width='100%');
    doc.querySelector('.tactical-enemy-seals').innerHTML='<kbd>R</kbd><kbd>A</kbd><kbd>X</kbd><kbd>V</kbd>';
    for(const selector of ['.health','.mana'])doc.querySelector('#tacticalVitals '+selector+' span').textContent=selector==='.health'?'300 / 300':'100 / 100';
    doc.getElementById('tacticalSnow').textContent='0 tuyết';doc.querySelector('#tacticalPotion small').textContent='3';
    doc.getElementById('comboSlots').innerHTML=fire[0].sequence.map(k=>'<span class="combo-slot">'+k.toUpperCase()+'</span>').join('');
    doc.querySelector('#practiceHandInset .practice-hand-trace')?.replaceChildren();
    const image=handsImage?.();if(image){const img=doc.createElement('img');img.src=image;img.className='layout-hands-image';doc.getElementById('practiceHandViewport').append(img);}
  }else{
    const adventure=doc.createElement('div');adventure.id='adventure';const hud=clone('#journeyHud');hud.hidden=false;adventure.append(hud);body.append(adventure);
    const controls=clone('#androidControls');controls.querySelector('#androidExploreControls').hidden=false;controls.querySelector('#androidCombatControls').remove();body.append(controls);
    doc.getElementById('villageName').textContent||='Làng Vô Danh';doc.getElementById('villageGlyph').textContent||='印';
    doc.getElementById('checkpointText').textContent||='Điểm hồi sinh';
    const nearby=doc.getElementById('nearbyAction');nearby.hidden=false;nearby.textContent||='E · Tương tác';
    const message=doc.getElementById('journeyToast');message.hidden=false;message.textContent||='Khám phá vùng đất';
  }
  for(const s of specs.filter(s=>s.mode===mode)){
    const el=doc.querySelector(s.selector);if(!el)continue;el.hidden=false;
    for(const name of ['--mobile-layout-x','--mobile-layout-y','--mobile-layout-scale','--mobile-layout-opacity','--joystick-float-x','--joystick-float-y'])el.style.removeProperty(name);
    el.classList.remove('floating-active','pressed','unavailable');
  }
  doc.querySelectorAll('button').forEach(b=>{b.disabled=false;b.removeAttribute('aria-describedby');});
  doc.querySelectorAll('#tacticalAmmoMenu,#tacticalAimPad,#tacticalSpellInfo,#campaignContent,#androidSprintLock').forEach(el=>el.hidden=true);
  await Promise.all([...doc.images].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=img.onerror=resolve;})));
  return doc;
}
