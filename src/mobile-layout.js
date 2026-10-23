import {sprintTargetClearance} from './mobile-sprint.js';
export const MOBILE_LAYOUT_KEY='anhoa-mobile-layout-v1';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function readMobileLayout(value,ids){
  const result={};if(!value||typeof value!=='object'||Array.isArray(value))return result;
  for(const id of ids){const p=value[id];if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;result[id]={x:clamp(p.x,0,1),y:clamp(p.y,0,1),scale:clamp(Number.isFinite(p.scale)?p.scale:1,.65,1.6),opacity:clamp(Number.isFinite(p.opacity)?p.opacity:1,.4,1)};}
  return result;
}
export function fitMobileWidget(base,pref,width,height,safe={left:8,right:8,top:8,bottom:8}){
  const availableW=Math.max(1,width-safe.left-safe.right),availableH=Math.max(1,height-safe.top-safe.bottom),scale=Math.min(pref?.scale??1,availableW/base.width,availableH/base.height),w=base.width*scale,h=base.height*scale;
  return {x:clamp(pref?pref.x*width:base.x+base.width/2,safe.left+w/2,width-safe.right-w/2),y:clamp(pref?pref.y*height:base.y+base.height/2,safe.top+h/2,height-safe.bottom-h/2),width:w,height:h,scale,opacity:pref?.opacity??1};
}

export function setupMobileLayout({getState,pause,release}){
  const specs=[
    ['joystick','explore','#androidJoystick','Cần di chuyển','◎'],
    ['jump','explore','[data-mobile-key=" "]','Nhảy','↑'],['interact','explore','[data-mobile-key="e"]','Tương tác','E'],['training','explore','[data-mobile-key="c"]','Tu luyện','C'],
    ['story','explore','.journey-quest','Tuyến truyện chính','▤'],['map','explore','.journey-minimap','Bản đồ khu vực','◎'],
    ['journal','explore','#openJournal','Nhật ký','▤'],['atlas','explore','#openAtlas','Bản đồ thế giới','◎'],['menu','explore','#journeyMenu','Tạm dừng','Ⅱ'],
    ['location','explore','.journey-location','Tên vùng đất','◇'],['messages','explore','.android-explore-messages','Thông báo khám phá','!'],['nearby','explore','#nearbyAction','Gợi ý tương tác','E'],
    ...[...'qwerasdfzxcv'].map(k=>['seal-'+k,'combat','[data-touch-seal="'+k+'"]','Kết ấn '+k.toUpperCase(),k.toUpperCase()]),
    ['health','combat','#hud>.status','Máu và mana','♥'],['guide','combat','#guide','Quyển trục mang theo','▤'],['combo','combat','.center-status','Chuỗi kết ấn','印'],
    ['cast','combat','#castButton','Thi triển / Phi tiêu','SPACE'],['boost','combat','#dashBoostButton','Tăng lực','G'],
    ['dodge-left','combat','#androidStepLeft','Né trái','‹'],['dodge-right','combat','#androidStepRight','Né phải','›'],
    ['ammo','combat','#androidAmmo','Chọn phi tiêu','✦'],['settings','combat','#androidSettings','Tạm dừng / Cài đặt','⚙']
  ].map(([id,mode,selector,label,glyph])=>({id,mode,selector,label,glyph,el:document.querySelector(selector)})).filter(s=>s.el);
  const ids=specs.map(s=>s.id);let saved={};try{saved=readMobileLayout(JSON.parse(localStorage.getItem(MOBILE_LAYOUT_KEY)),ids);}catch{}
  let draft={},mode='explore',selected='',drag=null,open=false,scheduled=0,boardScale=1,bases=new Map();
  for(const s of specs)s.el.dataset.mobileWidget=s.id;
  const safeProbe=document.createElement('div');safeProbe.className='mobile-safe-probe';document.body.append(safeProbe);
  const safe=()=>{const c=getComputedStyle(safeProbe);return {left:8+parseFloat(c.paddingLeft),right:8+parseFloat(c.paddingRight),top:8+parseFloat(c.paddingTop),bottom:8+parseFloat(c.paddingBottom)};};
  const widgetSafe=(s,pref)=>{const bounds=safe();if(s.id==='joystick'){
    const h=Math.max(44,Math.min(56,innerHeight*.13)),maxPadHeight=Math.max(1,(innerHeight-bounds.top-bounds.bottom-21-h*1.25)/1.25),padHeight=Math.min(measure(s).height*(pref?.scale??1),maxPadHeight);
    bounds.top+=sprintTargetClearance(padHeight,h);
  }return bounds;};
  function measure(s){
    const changes=[];for(let el=s.el;el&&el!==document.body;el=el.parentElement){changes.push([el,el.style.cssText,el.hidden]);if(el.hidden)el.hidden=false;if(getComputedStyle(el).display==='none')el.style.setProperty('display','block','important');el.style.setProperty('visibility','hidden','important');}
    const el=s.el;for(const name of ['--mobile-layout-x','--mobile-layout-y','--joystick-float-x','--joystick-float-y'])el.style.setProperty(name,'0px');el.style.setProperty('--mobile-layout-scale','1');
    const r=el.getBoundingClientRect(),base={x:r.x,y:r.y,width:r.width,height:r.height};
    for(const [node,style,hidden] of changes.reverse()){node.style.cssText=style;node.hidden=hidden;}
    if(base.width<20||base.height<16)return {x:innerWidth*.35,y:innerHeight*.75,width:Math.min(180,innerWidth*.4),height:44};return base;
  }
  function apply(){
    const insets=safe();for(const s of specs){const p=saved[s.id];if(!p){for(const n of ['--mobile-layout-x','--mobile-layout-y','--mobile-layout-scale','--mobile-layout-opacity'])s.el.style.removeProperty(n);continue;}
      if(s.id==='joystick'&&s.el.classList.contains('floating-active'))continue;
      const base=measure(s),fit=fitMobileWidget(base,p,innerWidth,innerHeight,widgetSafe(s,p)),el=s.el;
      el.style.setProperty('--mobile-layout-x','0px');el.style.setProperty('--mobile-layout-y','0px');el.style.setProperty('--mobile-layout-scale',String(fit.scale));el.style.setProperty('--mobile-layout-opacity',String(fit.opacity));
      const r=el.getBoundingClientRect();if(r.width&&r.height){el.style.setProperty('--mobile-layout-x',(fit.x-r.x-r.width/2)+'px');el.style.setProperty('--mobile-layout-y',(fit.y-r.y-r.height/2)+'px');}
      else{el.style.setProperty('--mobile-layout-x',(fit.x-base.x-base.width/2)+'px');el.style.setProperty('--mobile-layout-y',(fit.y-base.y-base.height/2)+'px');}
    }
    const panel=document.getElementById('campaignContent');if(!panel.hidden){
      const parent=document.querySelector('.journey-quest'),p=parent.getBoundingClientRect(),scale=Number(parent.style.getPropertyValue('--mobile-layout-scale'))||1,below=innerHeight-insets.bottom-p.bottom-4*scale,above=p.top-insets.top-4*scale,up=below<Math.min(160,above)&&above>below;
      panel.style.translate='';panel.style.top=up?'auto':'';panel.style.bottom=up?'calc(100% + 4px)':'';panel.style.maxHeight=Math.max(20,(up?above:below)/scale)+'px';panel.style.maxWidth=(innerWidth-insets.left-insets.right)/scale+'px';
      const r=panel.getBoundingClientRect(),dx=r.left<insets.left?insets.left-r.left:r.right>innerWidth-insets.right?innerWidth-insets.right-r.right:0;panel.style.translate=(dx/scale)+'px 0';
    }
  }
  function schedule(){if(scheduled)return;scheduled=requestAnimationFrame(()=>{scheduled=0;apply();});}
  const observer=new ResizeObserver(schedule);for(const s of specs)observer.observe(s.el);
  for(const id of ['guideToggle','campaignToggle'])document.getElementById(id).addEventListener('click',schedule);
  window.addEventListener('resize',()=>{schedule();if(open){for(const s of specs)bases.set(s.id,measure(s));draw();}});

  const editor=document.createElement('section');editor.id='mobileLayoutEditor';editor.hidden=true;editor.setAttribute('role','dialog');editor.setAttribute('aria-modal','true');editor.setAttribute('aria-labelledby','mobileLayoutTitle');
  editor.innerHTML=`<header><div><small>CÀI ĐẶT ĐIỆN THOẠI</small><h2 id="mobileLayoutTitle">Tùy chỉnh giao diện</h2></div><nav><button data-layout-mode="explore">Khám phá</button><button data-layout-mode="combat">Chiến đấu</button></nav></header><div class="mobile-layout-workspace"><div class="mobile-layout-preview"><div id="mobileLayoutBoard"></div><p>Kéo nút hoặc bảng để đổi vị trí.</p></div><aside><label>Thành phần<select id="mobileLayoutSelection"></select></label><label>Ngang <output id="mobileLayoutXValue"></output><input id="mobileLayoutX" type="range" min="0" max="100" step="1"></label><label>Dọc <output id="mobileLayoutYValue"></output><input id="mobileLayoutY" type="range" min="0" max="100" step="1"></label><label>Kích thước <output id="mobileLayoutScaleValue"></output><input id="mobileLayoutScale" type="range" min="65" max="160" step="5"></label><label>Độ rõ <output id="mobileLayoutOpacityValue"></output><input id="mobileLayoutOpacity" type="range" min="40" max="100" step="5"></label><p>Cần di chuyển tự dịch trong vùng gần vị trí đã đặt.</p><button id="mobileLayoutResetItem">Đặt lại thành phần</button></aside></div><footer><button id="mobileLayoutReset">Mặc định tất cả</button><span id="mobileLayoutNotice" role="status"></span><button id="mobileLayoutCancel">Hủy</button><button id="mobileLayoutSave">Lưu bố cục</button></footer>`;
  document.body.append(editor);const get=id=>document.getElementById(id),board=get('mobileLayoutBoard'),select=get('mobileLayoutSelection');
  function current(){const s=specs.find(s=>s.id===selected),base=bases.get(selected),fit=fitMobileWidget(base,draft[selected],innerWidth,innerHeight,widgetSafe(s,draft[s.id]));return {s,fit,p:draft[selected]||{x:fit.x/innerWidth,y:fit.y/innerHeight,scale:1,opacity:1}};}
  function fields(){const {p}=current();for(const [name,value] of [['X',p.x*100],['Y',p.y*100],['Scale',p.scale*100],['Opacity',p.opacity*100]]){get('mobileLayout'+name).value=Math.round(value);get('mobileLayout'+name+'Value').textContent=Math.round(value)+'%';}select.value=selected;}
  function draw(){
    if(!open)return;const parent=board.parentElement,availableW=parent.clientWidth-16,availableH=parent.clientHeight-34;boardScale=Math.max(.1,Math.min(availableW/innerWidth,availableH/innerHeight));board.style.width=innerWidth*boardScale+'px';board.style.height=innerHeight*boardScale+'px';board.replaceChildren();
    editor.querySelectorAll('[data-layout-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layoutMode===mode)));
    for(const s of specs.filter(s=>s.mode===mode)){
      const fit=fitMobileWidget(bases.get(s.id),draft[s.id],innerWidth,innerHeight,widgetSafe(s,draft[s.id])),box=document.createElement('button');box.type='button';box.dataset.layoutWidget=s.id;box.className='mobile-layout-proxy'+(selected===s.id?' selected':'')+(s.id==='joystick'?' joystick-proxy':'');box.setAttribute('aria-label',s.label);box.style.cssText=`left:${(fit.x-fit.width/2)*boardScale}px;top:${(fit.y-fit.height/2)*boardScale}px;width:${fit.width*boardScale}px;height:${fit.height*boardScale}px;opacity:${fit.opacity}`;
      const glyph=document.createElement('b');glyph.textContent=s.glyph;const label=document.createElement('small');label.textContent=s.label;box.append(glyph,label);
      if(s.id==='guide'){const rows=document.createElement('span');rows.className='layout-guide-rows';rows.textContent='①　②　③　④　⑤';box.append(rows);}
      box.addEventListener('pointerdown',e=>{e.preventDefault();selected=s.id;fields();board.querySelector('.selected')?.classList.remove('selected');box.classList.add('selected');drag={id:e.pointerId,x:e.clientX,y:e.clientY,p:{...current().p},box};box.setPointerCapture(e.pointerId);});
      box.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;const p={...drag.p,x:clamp(drag.p.x+(e.clientX-drag.x)/boardScale/innerWidth,0,1),y:clamp(drag.p.y+(e.clientY-drag.y)/boardScale/innerHeight,0,1)};draft[s.id]=p;const f=fitMobileWidget(bases.get(s.id),p,innerWidth,innerHeight,widgetSafe(s,draft[s.id]));box.style.left=(f.x-f.width/2)*boardScale+'px';box.style.top=(f.y-f.height/2)*boardScale+'px';fields();});
      const finish=e=>{if(drag?.id!==e.pointerId)return;drag=null;draw();};for(const name of ['pointerup','pointercancel','lostpointercapture'])box.addEventListener(name,finish);board.append(box);
    }
    fields();
  }
  function chooseMode(next){mode=next;const list=specs.filter(s=>s.mode===mode);select.replaceChildren(...list.map(s=>{const option=document.createElement('option');option.value=s.id;option.textContent=s.label;return option;}));if(!list.some(s=>s.id===selected))selected=list[0].id;draw();}
  function close(){open=false;drag=null;editor.hidden=true;document.body.classList.remove('mobile-layout-editing');schedule();}
  function show(){if(open)return;release();const state=getState();if(state.started&&!state.paused&&!state.won&&!['home','explore','dialog','progression','journal','shop','atlas'].includes(state.phase))pause();draft=structuredClone(saved);for(const s of specs)bases.set(s.id,measure(s));open=true;editor.hidden=false;document.body.classList.add('mobile-layout-editing');get('mobileLayoutNotice').textContent='';chooseMode(['combat','duel'].includes(state.phase)?'combat':'explore');}
  editor.querySelectorAll('[data-layout-mode]').forEach(b=>b.onclick=()=>chooseMode(b.dataset.layoutMode));select.onchange=()=>{selected=select.value;draw();};
  for(const [name,key,multiplier] of [['X','x',.01],['Y','y',.01],['Scale','scale',.01],['Opacity','opacity',.01]])get('mobileLayout'+name).oninput=e=>{draft[selected]={...current().p,[key]:Number(e.target.value)*multiplier};draw();};
  get('mobileLayoutResetItem').onclick=()=>{delete draft[selected];draw();};get('mobileLayoutReset').onclick=()=>{draft={};draw();get('mobileLayoutNotice').textContent='Đã khôi phục mặc định. Bấm Lưu để áp dụng.';};get('mobileLayoutCancel').onclick=close;
  get('mobileLayoutSave').onclick=()=>{const next=readMobileLayout(draft,ids);try{localStorage.setItem(MOBILE_LAYOUT_KEY,JSON.stringify(next));saved=next;close();apply();}catch{get('mobileLayoutNotice').textContent='Chưa lưu được. Hãy thử lại.';}};
  window.addEventListener('keydown',e=>{if(!open)return;e.stopImmediatePropagation();if(e.key==='Escape'){e.preventDefault();close();}},true);
  window.addEventListener('anhoa:mobile-layout',show);
  const button=document.createElement('button');button.id='androidLayoutSettings';button.className='outline';button.textContent='Tùy chỉnh giao diện';button.onclick=show;document.querySelector('.android-pause-settings').append(button);
  const home=button.cloneNode(true);home.id='androidHomeLayoutSettings';home.className='journey-secondary';home.onclick=show;document.querySelector('.journey-intro').append(home);
  if(document.querySelector('link[href$="android.css"]')?.sheet)schedule();else document.querySelector('link[href$="android.css"]')?.addEventListener('load',schedule);
  return {open:show,get editing(){return open;},refresh:schedule,safeArea:safe};
}
