import {SHURIKEN_TYPES} from './equipment.js';
export const androidInterface=()=>document.documentElement.dataset.android==='true'||(navigator.maxTouchPoints>0&&matchMedia('(pointer:coarse)').matches);
export function setupAndroidControls({canvas,getState,seal,cast,step,boost,look,pause,selectAmmo,toggleGuide,sprint}){
  if(!androidInterface())return null;
  if(!document.querySelector('link[href$="android.css"]')){const css=document.createElement('link');css.rel='stylesheet';css.href='android.css';document.head.append(css);}
  document.body.classList.add('android-ui');
  const root=document.createElement('div');root.id='androidControls';root.innerHTML=`<div id="androidCombatControls"><nav class="android-seals android-seals-left" aria-label="Kết ấn tay trái">${[...'qweras'].map(k=>`<button data-touch-seal="${k}" aria-label="Kết ấn ${k.toUpperCase()}">${k.toUpperCase()}</button>`).join('')}</nav><nav class="android-seals android-seals-right" aria-label="Kết ấn tay phải">${[...'dfzxcv'].map(k=>`<button data-touch-seal="${k}" aria-label="Kết ấn ${k.toUpperCase()}">${k.toUpperCase()}</button>`).join('')}</nav><button id="androidSettings" class="android-action" aria-label="Tạm dừng và cài đặt">⚙</button><button id="androidStepLeft" class="android-action android-step" aria-label="Né hoặc lướt sang trái">‹</button><button id="androidStepRight" class="android-action android-step" aria-label="Né hoặc lướt sang phải">›</button><button id="androidClearSeals" aria-label="Xóa chuỗi kết ấn">⌫</button><details id="androidAmmo"><summary>Phi tiêu <span id="androidAmmoCurrent"></span></summary><div>${SHURIKEN_TYPES.map((s,i)=>`<button data-touch-ammo="${s.id}" style="--ammo:${s.color}"><b>${i+1}</b><span>${s.name.replace('Phi tiêu ','')}</span><small>0</small></button>`).join('')}</div></details></div><div id="androidExploreControls" hidden><div id="androidJoystick" aria-label="Giữ và kéo để di chuyển"><span class="android-sprint-hint">↑ Kéo lên để chạy</span><i></i></div><div class="android-explore-actions"><button data-mobile-key="e">E<small>Tương tác</small></button><button data-mobile-key=" ">↑<small>Nhảy</small></button><button data-mobile-key="c">C<small>Tu luyện</small></button></div></div><div id="androidRotateNotice">↻<span>Xoay ngang điện thoại để chơi</span></div>`;
  document.body.append(root);const combat=root.querySelector('#androidCombatControls'),explore=root.querySelector('#androidExploreControls'),ammo=root.querySelector('#androidAmmo');
  const feedback=document.createElement('div');feedback.className='android-explore-messages';
  for(const id of ['journeyToast','waypointHint','journeyTravel'])feedback.append(document.getElementById(id));
  document.getElementById('journeyHud').append(feedback);
  for(const id of ['openJournal','openAtlas','journeyMenu']){const b=document.getElementById(id);b.setAttribute('aria-label',b.title.replace(/ \(.*?\)/,''));}
  const castButton=document.getElementById('castButton'),dashButton=document.getElementById('dashBoostButton');combat.append(castButton,dashButton);castButton.classList.add('android-cast');dashButton.classList.add('android-boost');
  const settings=document.createElement('div');settings.className='android-pause-settings';for(const id of ['qualityButton','soundButton'])settings.append(document.getElementById(id));document.querySelector('#pauseScreen .pause-card').append(settings);
  const guide=document.getElementById('guide'),initialExpanded=innerWidth>=700;guide.classList.toggle('is-expanded',initialExpanded);for(const id of ['guideToggle','helpButton'])document.getElementById(id).setAttribute('aria-expanded',String(initialExpanded));
  window.addEventListener('resize',()=>{if(innerWidth<700){guide.classList.remove('is-expanded');for(const id of ['guideToggle','helpButton'])document.getElementById(id).setAttribute('aria-expanded','false');}});
  const quest=document.querySelector('.journey-quest');document.querySelector('.journey-top nav').prepend(quest);
  // Start collapsed on every mobile session, keeping the underlying toggle state in sync.
  if(document.getElementById('campaignToggle').getAttribute('aria-expanded')==='true')document.getElementById('campaignToggle').click();
  let phase='',drag=null,joystick=null,sprintArmed=false,hudSampleAt=-Infinity;const held=new Set();
  // Hide an object's label while it passes under a fixed control or message.
  // Keep its dimensions so it can reappear without changing the projected position.
  function clearCoveredLabels(){
    if(performance.now()-hudSampleAt<100)return;hudSampleAt=performance.now();
    const occupied=[...document.querySelectorAll('.journey-top,.journey-checkpoint,.journey-left-rail,.journey-minimap,.android-explore-messages>[id],#nearbyAction,#androidJoystick,.android-explore-actions')].filter(el=>!el.hidden&&el.getClientRects().length).map(el=>el.getBoundingClientRect());
    const labels=[...document.querySelectorAll('#worldLabels button')].filter(el=>!el.hidden).map(el=>({el,rect:el.getBoundingClientRect()}));
    for(const {el,rect:r} of labels)el.classList.toggle('android-hud-covered',occupied.some(o=>r.left<o.right+4&&r.right>o.left-4&&r.top<o.bottom+4&&r.bottom>o.top-4));
  }
  window.addEventListener('resize',()=>{hudSampleAt=-Infinity;});document.getElementById('campaignToggle').addEventListener('click',()=>{hudSampleAt=-Infinity;});
  const emit=(key,down)=>{const code=key===' '?'Space':key==='backspace'?'Backspace':'Key'+key.toUpperCase();window.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{key,code,bubbles:true,cancelable:true}));};
  const cancelSprint=()=>{sprintArmed=false;sprint(false);root.querySelector('#androidJoystick').classList.remove('sprint-armed','sprint-locked');};
  const release=()=>{cancelSprint();for(const key of held)emit(key,false);held.clear();drag=null;joystick=null;root.querySelector('#androidJoystick i').style.transform='translate(0,0)';};
  const live=()=>{const s=getState();return s.started&&!s.paused&&!s.won;};
  function tap(button,action){button.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(!live())return;button.classList.add('pressed');button.setPointerCapture(e.pointerId);action();});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>button.classList.remove('pressed'));}
  root.querySelectorAll('[data-touch-seal]').forEach(b=>tap(b,()=>seal(b.dataset.touchSeal)));
  tap(root.querySelector('#androidStepLeft'),()=>step(-1));tap(root.querySelector('#androidStepRight'),()=>step(1));
  // Use pointerdown exactly once; the synthesized click must not cast twice.
  castButton.onclick=null;dashButton.onclick=null;tap(castButton,cast);tap(dashButton,boost);tap(root.querySelector('#androidSettings'),pause);tap(root.querySelector('#androidClearSeals'),()=>emit('backspace',true));
  root.querySelectorAll('[data-touch-ammo]').forEach(b=>b.onclick=()=>{if(live()&&!b.disabled)selectAmmo(b.dataset.touchAmmo);});
  canvas.addEventListener('pointerdown',e=>{if(!live()||drag)return;e.preventDefault();drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id||!live())return;look(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;});
  const pad=root.querySelector('#androidJoystick'),knob=pad.querySelector('i');
  const end=e=>{
    if(drag?.id===e.pointerId)drag=null;
    if(joystick!==e.pointerId)return;
    joystick=null;
    if(e.type==='pointerup'&&sprintArmed){sprint(true,true);pad.classList.add('sprint-locked');}
    else cancelSprint();
    for(const key of held)emit(key,false);held.clear();knob.style.transform='translate(0,0)';
  };
  window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
  root.querySelectorAll('[data-mobile-key]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();if(getState().phase!=='explore')return;release();emit(b.dataset.mobileKey,true);emit(b.dataset.mobileKey,false);}));
  function movePad(e){
    const r=pad.getBoundingClientRect(),rawX=(e.clientX-r.left-r.width/2)/(r.width*.35),rawY=(e.clientY-r.top-r.height/2)/(r.height*.35),x=Math.max(-1,Math.min(1,rawX)),y=Math.max(-1,Math.min(1,rawY)),wanted=new Set();
    sprintArmed=rawY<-1.5&&Math.abs(rawX)<.75;sprint(sprintArmed);pad.classList.toggle('sprint-armed',sprintArmed);
    if(x<-.27)wanted.add('a');if(x>.27)wanted.add('d');if(y<-.27)wanted.add('w');if(y>.27)wanted.add('s');
    for(const key of [...held])if(!wanted.has(key)){emit(key,false);held.delete(key);}
    for(const key of wanted)if(!held.has(key)){emit(key,true);held.add(key);}
    // Keydown may reset the keyboard sprint state, so apply the touch state last.
    sprint(sprintArmed);knob.style.transform=`translate(${x*r.width*.24}px,${y*r.height*.24}px)`;
  }
  pad.addEventListener('pointerdown',e=>{if(getState().phase!=='explore')return;e.preventDefault();release();joystick=e.pointerId;pad.setPointerCapture(e.pointerId);movePad(e);});
  pad.addEventListener('pointermove',e=>{if(joystick===e.pointerId)movePad(e);});pad.addEventListener('lostpointercapture',end);
  window.addEventListener('blur',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});
  document.querySelector('.center-status').append(root.querySelector('#androidClearSeals'));
  return {enabled:true,update(){const s=getState();if(phase!==s.phase){release();phase=s.phase;hudSampleAt=-Infinity;}combat.hidden=!s.started||s.won||s.paused||s.phase==='explore';explore.hidden=s.phase!=='explore';if(s.phase==='explore')clearCoveredLabels();
    root.querySelectorAll('[data-touch-ammo]').forEach(b=>{const n=s.equipment?.ammo[b.dataset.touchAmmo]??(b.dataset.touchAmmo==='iron'?Infinity:0);b.disabled=n<=0;b.querySelector('small').textContent=n===Infinity?'∞':n;b.classList.toggle('selected',s.equipment?s.equipment.shuriken.id===b.dataset.touchAmmo:b.dataset.touchAmmo==='iron');});
    root.querySelector('#androidAmmoCurrent').textContent=s.equipment?s.equipment.shuriken.name.replace('Phi tiêu ',''):'sắt';
  },release};
}
