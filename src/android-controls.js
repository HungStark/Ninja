import {SHURIKEN_TYPES} from './equipment.js';
import {setupMobileLayout} from './mobile-layout.js';
import {sprintTargetOffset,sprintTargetClearance} from './mobile-sprint.js';
export const androidInterface=()=>document.documentElement.dataset.android==='true'||(navigator.maxTouchPoints>0&&matchMedia('(pointer:coarse)').matches);
export function setupAndroidControls({canvas,getState,seal,cast,step,boost,look,pause,selectAmmo,toggleGuide,sprint,onAimRelease=()=>{}}){
  if(!androidInterface())return null;
  if(!document.querySelector('link[href$="android.css"]')){const css=document.createElement('link');css.rel='stylesheet';css.href='android.css';document.head.append(css);}
  document.body.classList.add('android-ui');
  const root=document.createElement('div');root.id='androidControls';root.innerHTML=`<div id="androidCombatControls"><nav class="android-seals android-seals-left" aria-label="Kết ấn tay trái">${[...'qweras'].map(k=>`<button data-touch-seal="${k}" aria-label="Kết ấn ${k.toUpperCase()}">${k.toUpperCase()}</button>`).join('')}</nav><nav class="android-seals android-seals-right" aria-label="Kết ấn tay phải">${[...'dfzxcv'].map(k=>`<button data-touch-seal="${k}" aria-label="Kết ấn ${k.toUpperCase()}">${k.toUpperCase()}</button>`).join('')}</nav><button id="androidSettings" class="android-action" aria-label="Tạm dừng và cài đặt">⚙</button><button id="androidStepLeft" class="android-action android-step" aria-label="Né hoặc lướt sang trái">‹</button><button id="androidStepRight" class="android-action android-step" aria-label="Né hoặc lướt sang phải">›</button><button id="androidClearSeals" aria-label="Xóa chuỗi kết ấn">⌫</button><details id="androidAmmo"><summary>Phi tiêu <span id="androidAmmoCurrent"></span></summary><div>${SHURIKEN_TYPES.map((s,i)=>`<button data-touch-ammo="${s.id}" style="--ammo:${s.color}"><b>${i+1}</b><span>${s.name.replace('Phi tiêu ','')}</span><small>0</small></button>`).join('')}</div></details></div><div id="androidExploreControls" hidden><div id="androidJoystick" aria-label="Giữ và kéo để di chuyển"><span class="android-sprint-hint">↑ Kéo lên để chạy</span><i></i></div><button id="androidSprintLock" hidden aria-label="Thả tay tại đây để khóa chạy nhanh" aria-pressed="false"><b>⇈</b><small>Chạy nhanh</small></button><div class="android-explore-actions"><button data-mobile-key="e">E<small>Tương tác</small></button><button data-mobile-key=" ">↑<small>Nhảy</small></button><button data-mobile-key="c">C<small>Tu luyện</small></button></div></div><div id="androidRotateNotice">↻<span>Xoay ngang điện thoại để chơi</span></div>`;
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
  let phase='',drag=null,joystick=null,sprintArmed=false,padBiasX=0,padBiasY=0,hudSampleAt=-Infinity;const held=new Set();
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
  const sprintButton=root.querySelector('#androidSprintLock');
  const cancelSprint=()=>{sprintArmed=false;sprint(false);root.querySelector('#androidJoystick').classList.remove('sprint-armed','sprint-locked');sprintButton.hidden=true;sprintButton.classList.remove('sprint-armed');sprintButton.setAttribute('aria-pressed','false');sprintButton.querySelector('small').textContent='Chạy nhanh';};
  const release=()=>{cancelSprint();resetFloating();for(const key of held)emit(key,false);held.clear();drag=null;joystick=null;root.querySelector('#androidJoystick i').style.transform='translate(0,0)';};
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
  function resetFloating(){const p=root.querySelector('#androidJoystick');p.style.removeProperty('--joystick-float-x');p.style.removeProperty('--joystick-float-y');p.classList.remove('floating-active');padBiasX=padBiasY=0;}
  function homePad(){const x=pad.style.getPropertyValue('--joystick-float-x'),y=pad.style.getPropertyValue('--joystick-float-y');pad.style.setProperty('--joystick-float-x','0px');pad.style.setProperty('--joystick-float-y','0px');const r=pad.getBoundingClientRect();pad.style.setProperty('--joystick-float-x',x||'0px');pad.style.setProperty('--joystick-float-y',y||'0px');return r;}
  function floatingZone(){const r=homePad(),s=mobileLayout.safeArea();return {left:Math.max(s.left,r.left-r.width*.8),right:Math.min(innerWidth-s.right,r.right+r.width*.8),top:Math.max(s.top+72,r.top-r.height*.5),bottom:innerHeight};}
  function syncSprintTarget(){const r=pad.getBoundingClientRect(),h=Math.max(44,Math.min(56,innerHeight*.13));sprintButton.style.left=(r.left+r.width/2)+'px';sprintButton.style.top=(r.top+r.height/2-sprintTargetOffset(r.height,h)-h/2)+'px';sprintButton.style.bottom='auto';}
  function startJoystick(e){
    if(getState().phase!=='explore'||joystick!==null||mobileLayout.editing)return;
    e.preventDefault();release();const r=homePad(),zone=floatingZone(),s=mobileLayout.safeArea(),cx=Math.max(r.width/2+s.left,Math.min(innerWidth-r.width/2-s.right,Math.max(zone.left+r.width/2,Math.min(zone.right-r.width/2,e.clientX)))),cy=Math.max(r.height/2+s.top+sprintTargetClearance(r.height,Math.max(44,Math.min(56,innerHeight*.13))),Math.min(innerHeight-r.height/2-s.bottom,e.clientY));
    padBiasX=e.clientX-cx;padBiasY=e.clientY-cy;
    pad.style.setProperty('--joystick-float-x',(cx-r.left-r.width/2)+'px');pad.style.setProperty('--joystick-float-y',(cy-r.top-r.height/2)+'px');pad.classList.add('floating-active');joystick=e.pointerId;pad.setPointerCapture(e.pointerId);syncSprintTarget();movePad(e);
  }
  const end=e=>{
    if(drag?.id===e.pointerId){drag=null;onAimRelease();}
    if(joystick!==e.pointerId)return;
    if(e.type==='pointerup')movePad(e);
    joystick=null;
    if(e.type==='pointerup'&&sprintArmed){sprint(true,true);pad.classList.add('sprint-locked');sprintButton.hidden=false;sprintButton.setAttribute('aria-pressed','true');sprintButton.querySelector('small').textContent='Đang chạy';}
    else{cancelSprint();resetFloating();}
    for(const key of held)emit(key,false);held.clear();knob.style.transform='translate(0,0)';
  };
  window.addEventListener('pointerup',end);window.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
  root.querySelectorAll('[data-mobile-key]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();if(getState().phase!=='explore')return;if(b.dataset.mobileKey!==' ')release();emit(b.dataset.mobileKey,true);emit(b.dataset.mobileKey,false);}));
  function movePad(e){
    syncSprintTarget();
    const r=pad.getBoundingClientRect(),rawX=(e.clientX-padBiasX-r.left-r.width/2)/(r.width*.35),rawY=(e.clientY-padBiasY-r.top-r.height/2)/(r.height*.35),x=Math.max(-1,Math.min(1,rawX)),y=Math.max(-1,Math.min(1,rawY)),wanted=new Set();
    const above=e.clientY<r.top&&Math.abs(e.clientX-r.left-r.width/2)<r.width*.6;
    sprintButton.hidden=!above;
    const target=sprintButton.getBoundingClientRect();
    // The forward lane extends beyond the target, so overshooting still locks running.
    sprintArmed=above&&e.clientY<=target.bottom;
    sprintButton.classList.toggle('sprint-armed',sprintArmed);pad.classList.toggle('sprint-armed',sprintArmed);
    if(x<-.27)wanted.add('a');if(x>.27)wanted.add('d');if(y<-.27)wanted.add('w');if(y>.27)wanted.add('s');
    for(const key of [...held])if(!wanted.has(key)){emit(key,false);held.delete(key);}
    for(const key of wanted)if(!held.has(key)){emit(key,true);held.add(key);}
    // Keydown may reset the keyboard sprint state, so apply the touch state last.
    sprint(sprintArmed);knob.style.transform=`translate(${x*r.width*.24}px,${y*r.height*.24}px)`;
  }
  sprintButton.addEventListener('pointerdown',e=>{e.preventDefault();if(joystick===null&&getState().phase==='explore')release();});
  pad.addEventListener('pointerdown',startJoystick);
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'||getState().phase!=='explore'||mobileLayout.editing)return;const z=floatingZone();if(e.clientX>=z.left&&e.clientX<=z.right&&e.clientY>=z.top&&e.clientY<=z.bottom){e.stopImmediatePropagation();startJoystick(e);}},true);
  pad.addEventListener('pointermove',e=>{if(joystick===e.pointerId)movePad(e);});pad.addEventListener('lostpointercapture',end);
  window.addEventListener('blur',release);document.addEventListener('visibilitychange',()=>{if(document.hidden)release();});
  window.addEventListener('resize',release);
  document.querySelector('.center-status').append(root.querySelector('#androidClearSeals'));
  const mobileLayout=setupMobileLayout({getState,pause,release});
  return {enabled:true,get aiming(){return drag!==null;},update(){const s=getState();if(phase!==s.phase){release();phase=s.phase;hudSampleAt=-Infinity;}combat.hidden=!s.started||s.won||s.paused||s.phase==='explore';explore.hidden=s.phase!=='explore';if(s.phase==='explore')clearCoveredLabels();
    root.querySelectorAll('[data-touch-ammo]').forEach(b=>{const n=s.equipment?.ammo[b.dataset.touchAmmo]??(b.dataset.touchAmmo==='iron'?Infinity:0);b.disabled=n<=0;b.querySelector('small').textContent=n===Infinity?'∞':n;b.classList.toggle('selected',s.equipment?s.equipment.shuriken.id===b.dataset.touchAmmo:b.dataset.touchAmmo==='iron');});
    root.querySelector('#androidAmmoCurrent').textContent=s.equipment?s.equipment.shuriken.name.replace('Phi tiêu ',''):'sắt';
  },release};
}
