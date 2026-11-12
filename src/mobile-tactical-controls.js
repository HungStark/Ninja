import {shurikenIcon} from './shuriken-icon.js';
import {spellImage} from './spell-art.js';
import {renderEnemySeals} from './battle-scroll.js';
import {SHURIKEN_TYPES} from './equipment.js';
import {spellDescription} from './spell-descriptions.js';

const sword='<img class="tactical-sword" src="assets/ui/attack-button.png" alt="" draggable="false">';
const dashFigure=`<svg class="tactical-dash-figure" viewBox="0 0 96 96" aria-hidden="true">
  <defs><radialGradient id="tacticalDashBack" cx="65%" cy="30%" r="85%"><stop stop-color="#32647c"/><stop offset="1" stop-color="#132d3d"/></radialGradient><linearGradient id="tacticalDashTrail"><stop stop-color="#23a9ed" stop-opacity="0"/><stop offset=".65" stop-color="#54c7ff"/><stop offset="1" stop-color="#cef4ff"/></linearGradient><filter id="tacticalDashGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2"/></filter></defs>
  <circle cx="48" cy="48" r="45" fill="url(#tacticalDashBack)" stroke="#8acfea" stroke-opacity=".65" stroke-width="2"/>
  <g fill="none" stroke="url(#tacticalDashTrail)" stroke-linecap="round"><path d="M3 61L39 43M7 77L44 55M2 42L37 26" stroke-width="7" opacity=".65" filter="url(#tacticalDashGlow)"/><path d="M5 60L41 42M10 76L46 54M3 41L39 25M16 85L36 73" stroke-width="2.6"/></g>
  <g fill="#bdeaff" filter="url(#tacticalDashGlow)" opacity=".7"><circle cx="72" cy="23" r="5.5"/><path d="M63 30L70 33L65 44L55 52L46 55L37 68L24 78L20 76L31 62L38 49L54 39Z"/></g>
  <g fill="#d8f4ff"><circle cx="72" cy="23" r="5.2"/><path d="M63 30Q67 28 70 33L65 44L55 52L46 55L37 68L24 78L20 76L31 62L38 49L54 39Z"/><path d="M64 32L76 39L84 31L88 33L79 46L65 42ZM61 32L45 35L31 46L28 44L41 30L57 27ZM52 48L67 55L68 61L55 69L46 81L41 79L49 64L58 59L46 55Z"/></g>
</svg>`;
const shuriken=shurikenIcon();
export function mobileSpellPosition(index,count){
  const angle=(165+(index+.5)*120/count)*Math.PI/180;
  return {x:Math.cos(angle)*.73,y:Math.sin(angle)*.73};
}
export function setupMobileTacticalControls({canvas,getState,move=()=>{},aim=()=>{},cast,dash,selectTarget,heal,selectAmmo,sealSpell,pause,resume}){
  const root=document.createElement('section');root.id='mobileTacticalHUD';root.hidden=true;
  root.innerHTML=`<button id="tacticalSettings" aria-label="Cài đặt">⚙</button>
    <section id="tacticalEnemy" class="tactical-panel"><strong></strong><div class="tactical-meter enemy"><i></i><span></span></div><div class="tactical-enemy-seals"></div></section>
    <section id="tacticalVitals" class="tactical-panel"><div class="tactical-meter health"><b>HP</b><i></i><span></span></div><div class="tactical-meter mana"><b>MANA</b><i></i><span></span></div><div class="tactical-status-row"><span id="tacticalSnow"></span><button id="tacticalPotion" aria-label="Dùng bình máu">＋<small></small></button></div></section>
    <div id="tacticalJoystick" role="group" aria-label="Di chuyển"><i></i></div>
    <div id="tacticalActions"><div id="tacticalSpells"></div><button id="tacticalCast" aria-label="Thi triển — giữ và kéo để ngắm">${sword}</button><button id="tacticalDash" aria-label="Lướt">${dashFigure}<small></small></button><button id="tacticalAmmo" aria-label="Chọn phi tiêu">${shuriken}</button><div id="tacticalAmmoMenu" hidden></div><div id="tacticalAimPad" hidden><i></i></div></div>
    <aside id="tacticalSpellInfo" role="tooltip" hidden><header><span class="tactical-info-art"></span><div><strong></strong><small></small></div></header><div class="tactical-info-seals"></div><p></p><small class="tactical-info-stats"></small></aside>`;
  document.body.append(root);
  const menu=document.createElement('section');menu.id='tacticalSettingsMenu';menu.hidden=true;menu.setAttribute('role','dialog');menu.setAttribute('aria-modal','true');menu.setAttribute('aria-label','Cài đặt');
  menu.innerHTML='<nav><button data-tactical-tab="scroll" aria-pressed="true">Quyển trục</button><button data-tactical-tab="general" aria-pressed="false">Cài đặt chung</button></nav><div class="tactical-settings-body"><div data-tactical-pane="scroll"></div><div data-tactical-pane="general" hidden></div></div><button id="tacticalCloseSettings" aria-label="Đóng cài đặt">×</button>';
  document.body.append(menu);
  const get=id=>document.getElementById(id),pad=get('tacticalJoystick'),knob=pad.querySelector('i'),attack=get('tacticalCast'),aimPad=get('tacticalAimPad'),spells=get('tacticalSpells');
  const guide=get('guide'),guideHome=guide.parentElement,pauseCard=document.querySelector('#pauseScreen .pause-card'),pauseHome=pauseCard.parentElement;
  const info=get('tacticalSpellInfo'),spellPointers=new Map();let infoPointer=null;
  let enabled=false,menuOpen=false,wasExpanded=false,spellKey='',movePointer=null,attackPointer=null,worldPointer=null,ammoOpen=false,lastState=null;
  const live=()=>{const s=getState();return s.tactical&&s.started&&!s.paused&&!s.won;};
  function tap(button,callback){button.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();e.stopPropagation();if(!button.disabled&&live())callback(e);});button.addEventListener('click',e=>{if(e.detail===0&&!button.disabled&&live())callback(e);});}
  function hideSpellInfo(){info.hidden=true;infoPointer=null;spells.querySelectorAll('[aria-describedby]').forEach(b=>b.removeAttribute('aria-describedby'));}
  function clearSpellPointers(){for(const p of spellPointers.values()){clearTimeout(p.timer);p.button.classList.remove('pressed');}spellPointers.clear();hideSpellInfo();}
  function release(){clearSpellPointers();movePointer=attackPointer=worldPointer=null;move([0,0]);aim(null);knob.style.transform='';aimPad.hidden=true;attack.classList.remove('pressed');}
  function showSpellInfo(p,id){
    if(!live()||p.cancelled)return;p.held=true;infoPointer=id;
    const spell=lastState.spells[p.index].spell;info.querySelector('.tactical-info-art').innerHTML=spellImage(spell);info.querySelector('strong').textContent=spell.name;info.querySelector('header small').textContent=spell.cost+' MANA · '+spell.cooldown+'s';
    info.querySelector('.tactical-info-seals').replaceChildren(...spell.sequence.map(key=>{const k=document.createElement('kbd');k.textContent=key.toUpperCase();return k;}));info.querySelector('p').textContent=spellDescription(spell);info.querySelector('.tactical-info-stats').textContent=spell.balanceSummary||'';info.hidden=false;
    p.button.setAttribute('aria-describedby',info.id);const r=p.button.getBoundingClientRect(),card=info.getBoundingClientRect();info.style.left=Math.max(12,Math.min(innerWidth-card.width-12,r.left-card.width-14))+'px';info.style.top=Math.max(12,Math.min(innerHeight-card.height-12,r.top+r.height/2-card.height/2))+'px';
  }
  function spellPress(button,index){
    // Resolve the gesture on release so holding for information never adds a seal.
    button.addEventListener('contextmenu',e=>e.preventDefault());
    button.addEventListener('pointerdown',e=>{if((e.pointerType==='mouse'&&e.button!==0)||!live()||spellPointers.has(e.pointerId))return;e.preventDefault();e.stopPropagation();const p={button,index,x:e.clientX,y:e.clientY,held:false,cancelled:false};spellPointers.set(e.pointerId,p);button.setPointerCapture(e.pointerId);button.classList.add('pressed');p.timer=setTimeout(()=>{if(spellPointers.get(e.pointerId)===p)showSpellInfo(p,e.pointerId);},450);});
    button.addEventListener('pointermove',e=>{const p=spellPointers.get(e.pointerId);if(p&&!p.held&&Math.hypot(e.clientX-p.x,e.clientY-p.y)>12){p.cancelled=true;clearTimeout(p.timer);}});
    button.addEventListener('click',e=>{e.preventDefault();if(e.detail===0&&live())sealSpell(index);});
  }
  function showTab(tab){menu.querySelectorAll('[data-tactical-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tacticalTab===tab)));menu.querySelectorAll('[data-tactical-pane]').forEach(p=>p.hidden=p.dataset.tacticalPane!==tab);}
  function openMenu(shouldPause=true){if(menuOpen)return;release();menuOpen=true;wasExpanded=guide.classList.contains('is-expanded');guide.classList.add('is-expanded');menu.querySelector('[data-tactical-pane="scroll"]').append(guide);menu.querySelector('[data-tactical-pane="general"]').append(pauseCard);menu.hidden=false;document.body.classList.add('mobile-tactical-menu-open');showTab('scroll');if(shouldPause)pause();get('tacticalCloseSettings').focus({preventScroll:true});}
  function closeMenu(shouldResume=true){if(!menuOpen)return;menuOpen=false;guideHome.append(guide);guide.classList.toggle('is-expanded',wasExpanded);pauseHome.append(pauseCard);menu.hidden=true;document.body.classList.remove('mobile-tactical-menu-open');if(shouldResume)resume();}
  menu.querySelectorAll('[data-tactical-tab]').forEach(b=>b.onclick=()=>showTab(b.dataset.tacticalTab));
  const closeButton=get('tacticalCloseSettings');
  closeButton.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();closeMenu();});
  closeButton.addEventListener('click',e=>{if(e.detail===0)closeMenu();});
  tap(get('tacticalSettings'),()=>openMenu());tap(get('tacticalDash'),dash);tap(get('tacticalPotion'),heal);
  const ammoMenu=get('tacticalAmmoMenu');ammoMenu.innerHTML=SHURIKEN_TYPES.map(s=>`<button data-tactical-ammo="${s.id}"><span style="color:${s.color}">✦</span><span>${s.name}</span><small></small></button>`).join('');
  tap(get('tacticalAmmo'),()=>{ammoOpen=!ammoOpen;ammoMenu.hidden=!ammoOpen;});ammoMenu.querySelectorAll('button').forEach(b=>tap(b,()=>{selectAmmo(b.dataset.tacticalAmmo);ammoOpen=false;ammoMenu.hidden=true;}));
  pad.addEventListener('pointerdown',e=>{if(!live()||movePointer!==null)return;e.preventDefault();e.stopPropagation();movePointer=e.pointerId;pad.setPointerCapture(e.pointerId);moveStick(e);});
  function moveStick(e){const r=pad.getBoundingClientRect(),dx=(e.clientX-r.left-r.width/2)/(r.width*.36),dy=(e.clientY-r.top-r.height/2)/(r.height*.36),length=Math.hypot(dx,dy),scale=length>1?1/length:1,x=dx*scale,y=dy*scale;knob.style.transform=`translate(${x*r.width*.27}px,${y*r.height*.27}px)`;move(length<.12?[0,0]:[x,y]);}
  pad.addEventListener('pointermove',e=>{if(e.pointerId===movePointer){e.preventDefault();moveStick(e);}});
  attack.addEventListener('pointerdown',e=>{if(!live()||attack.disabled||attackPointer)return;e.preventDefault();e.stopPropagation();aim(null);attackPointer={id:e.pointerId,x:e.clientX,y:e.clientY,manual:false};attack.setPointerCapture(e.pointerId);attack.classList.add('pressed');aimPad.hidden=false;aimPad.querySelector('i').style.transform='';});
  attack.addEventListener('pointermove',e=>{if(attackPointer?.id!==e.pointerId||!live())return;e.preventDefault();const dx=e.clientX-attackPointer.x,dy=e.clientY-attackPointer.y,length=Math.hypot(dx,dy);if(length<8&&!attackPointer.manual)return;attackPointer.manual=true;const scale=Math.min(1,55/(length||1));aimPad.querySelector('i').style.transform=`translate(${dx*scale}px,${dy*scale}px)`;aim([dx/55,dy/55]);});
  attack.addEventListener('click',e=>{if(e.detail===0&&live()&&!attack.disabled)cast();});
  function end(e){
    const spellPointer=spellPointers.get(e.pointerId);if(spellPointer){clearTimeout(spellPointer.timer);spellPointers.delete(e.pointerId);spellPointer.button.classList.remove('pressed');if(infoPointer===e.pointerId)hideSpellInfo();if(e.type==='pointerup'&&!spellPointer.held&&!spellPointer.cancelled&&live())sealSpell(spellPointer.index);}
    if(e.pointerId===movePointer){movePointer=null;move([0,0]);knob.style.transform='';}
    if(attackPointer?.id===e.pointerId){const cancel=e.type!=='pointerup';attackPointer=null;aimPad.hidden=true;attack.classList.remove('pressed');if(!cancel&&live()&&!attack.disabled)cast();else aim(null);}
    if(worldPointer?.id===e.pointerId){const p=worldPointer;worldPointer=null;if(e.type==='pointerup'&&live()&&Math.hypot(e.clientX-p.x,e.clientY-p.y)<10)selectTarget(e.clientX,e.clientY);}
  }
  for(const name of ['pointerup','pointercancel','lostpointercapture'])window.addEventListener(name,end);
  canvas.addEventListener('pointerdown',e=>{if(!live())return;worldPointer={id:e.pointerId,x:e.clientX,y:e.clientY};});
  window.addEventListener('blur',release);window.addEventListener('resize',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});
  function update(s=getState()){
    lastState=s;const next=!!s.tactical&&s.started;
    if(enabled!==next){release();enabled=next;document.body.classList.toggle('mobile-tactical',enabled);if(!enabled)closeMenu(false);}
    root.hidden=!enabled||s.won||s.paused;
    if(!enabled)return;
    if(s.paused&&!s.won&&!menuOpen)openMenu(false);else if(menuOpen&&(!s.paused||s.won))closeMenu(false);
    if((s.paused||s.won)&&(movePointer!==null||attackPointer||spellPointers.size))release();
    for(const [selector,value,max] of [['.health',s.health,s.maxHealth],['.mana',s.chakra,s.maxChakra]]){const meter=root.querySelector('#tacticalVitals '+selector);meter.querySelector('i').style.width=Math.max(0,Math.min(100,value/(max||1)*100))+'%';meter.querySelector('span').textContent=Math.ceil(value)+' / '+max;}
    get('tacticalSnow').textContent=Math.floor(s.snow||0)+' '+ 'tuyết';const potion=get('tacticalPotion');potion.disabled=!s.canHeal;potion.querySelector('small').textContent=s.flask?.charges||0;
    const target=s.target;get('tacticalEnemy').hidden=!target;if(target){get('tacticalEnemy').dataset.enemyId=target.id;get('tacticalEnemy').querySelector('strong').textContent=target.name;const meter=get('tacticalEnemy').querySelector('.tactical-meter');meter.querySelector('i').style.width=Math.max(0,Math.min(100,target.hp/target.maxHp*100))+'%';meter.querySelector('span').textContent=Math.ceil(target.hp)+' / '+target.maxHp;renderEnemySeals(root.querySelector('.tactical-enemy-seals'),target.sequence||[],target.casting);}
    const key=s.spells.map(x=>x.spell.id).join('|');if(key!==spellKey){clearSpellPointers();spellKey=key;spells.replaceChildren();s.spells.forEach(({spell},i)=>{
      const b=document.createElement('button'),position=mobileSpellPosition(i,s.spells.length);b.className='tactical-spell';b.dataset.tacticalSpell=i;b.setAttribute('aria-label',spell.name);b.style.setProperty('--dx',position.x);b.style.setProperty('--dy',position.y);
      b.innerHTML=`<span class="tactical-spell-icon">${spellImage(spell)}<b class="tactical-cooldown"></b></span><small class="tactical-cost"></small>`;
      const cost=b.querySelector('.tactical-cost');cost.textContent=spell.cost;cost.setAttribute('aria-label','MANA '+spell.cost);spellPress(b,i);spells.append(b);
    });}
    s.spells.forEach((entry,i)=>{const b=spells.children[i];b.classList.toggle('selected',i===s.selected);b.classList.toggle('unavailable',!entry.available);b.style.setProperty('--element',entry.spell.color);b.querySelector('.tactical-cooldown').textContent=entry.remaining>.01?entry.remaining.toFixed(entry.remaining<10?1:0):'';});
    attack.disabled=!s.canAttack;get('tacticalDash').disabled=!s.canDash;get('tacticalDash').querySelector('small').textContent=s.dashCooldown>.01?s.dashCooldown.toFixed(1):'';
    ammoMenu.querySelectorAll('button').forEach(b=>{const id=b.dataset.tacticalAmmo,n=s.equipment?.ammo[id]??(id==='iron'?Infinity:0);b.disabled=n<=0;b.classList.toggle('selected',(s.equipment?.shuriken.id||'iron')===id);b.querySelector('small').textContent=n===Infinity?'∞':n;});
  }
  return {update,release,get aiming(){return !!attackPointer;},state:()=>({enabled,menuOpen,selectedTarget:lastState?.target?.id||null,manualAim:!!attackPointer?.manual,moving:movePointer!==null})};
}
