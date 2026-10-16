import * as T from 'three';
import {VILLAGES,QUESTS,village,newJourney,readJourney,resolveBattle,findPath,SAVE_KEY} from './adventure-data.js';
import {createAdventureScene} from './adventure-scene.js';

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
export function createAdventure({canvas,onBattle,onDuel,onReturn}){
  let stored;try{stored=readJourney(localStorage);}catch{}
  let save=stored||newJourney(),phase='home',path=[],action=null,encounter=null,time=0,saveTimer=0,distance=0,spawnAt=14+Math.random()*14,cooldown=10,toastTimer=0,atlasSelection='nameless',storageFailed=false,randomEnabled=true;
  const world=createAdventureScene();world.load(save.village,save);
  const root=document.createElement('div');root.id='adventure';document.body.append(root);
  root.innerHTML=`
    <section id="journeyHome" class="journey-home">
      <div class="journey-intro"><div class="journey-kicker"><span></span> THẾ GIỚI CỬU HỆ</div><h1>Mỗi dấu chân.<br>Một <em>huyền thoại.</em></h1><p>Rời Làng Vô Danh. Đi qua những miền đất của chín hệ, kết ấn và tìm câu chuyện của chính mình.</p><div class="journey-tags"><span>10 miền đất</span><span>Khám phá 3D</span><span>Chiến đấu kết ấn</span></div><button id="continueJourney" class="journey-primary" ${stored?'':'hidden'}>TIẾP TỤC HÀNH TRÌNH <span>↗</span></button><button id="duelMode" class="journey-secondary">Vào đấu trường luyện tập <span>→</span></button><div class="journey-version">ẤN HỎA <b>／</b> CHƯƠNG I · KẺ LỮ HÀNH</div></div>
      <form id="heroForm" class="hero-form"><div class="journey-kicker">KHỞI TẠO NHÂN VẬT</div><h2>Người giữ ấn</h2><p>Một lữ khách. Chín con đường.</p><label for="heroName">DANH XƯNG</label><input id="heroName" maxlength="24" value="Lữ Khách" autocomplete="off" required><fieldset><legend>ÁO CHOÀNG</legend><div class="journey-swatches" id="coatChoices">${['#345c63','#693f40','#505060','#5a6344','#8b7046'].map((c,i)=>`<button type="button" data-coat="${c}" style="--swatch:${c}" aria-label="Màu áo ${i+1}" aria-pressed="${i===0}" class="${i===0?'selected':''}"></button>`).join('')}</div></fieldset><fieldset><legend>MÀU TÓC</legend><div class="journey-swatches" id="hairChoices">${['#252b32','#6f6254','#acb8ad'].map((c,i)=>`<button type="button" data-hair="${c}" style="--swatch:${c}" aria-label="Màu tóc ${i+1}" aria-pressed="${i===0}" class="${i===0?'selected':''}"></button>`).join('')}</div></fieldset><div class="hero-origin"><span>◉</span><div>Làng Vô Danh<small>Quê nhà · Điểm hồi sinh đầu tiên</small></div></div><button class="journey-primary" type="submit">BẮT ĐẦU HÀNH TRÌNH <span>→</span></button><small class="journey-save-note">Lưu tự động trên trình duyệt này.${stored?' Hành trình mới sẽ thay bản lưu hiện tại.':''}</small></form>
    </section>
    <section id="journeyHud" class="journey-hud" hidden>
      <div class="journey-top"><a class="journey-brand" href="#" id="journeyHomeLink"><b>印</b><span>ẤN HỎA<small>KẺ LỮ HÀNH</small></span></a><div class="journey-location"><span id="villageGlyph"></span><div><small>VÙNG ĐẤT HIỆN TẠI</small><h2 id="villageName"></h2></div></div><nav><button id="openAtlas" title="Bản đồ thế giới (M)">◎ <span>Bản đồ</span><kbd>M</kbd></button><button id="journeyMenu" title="Tạm dừng">Ⅱ <span>Tạm dừng</span></button></nav></div>
      <div class="journey-checkpoint"><i></i><span id="checkpointText"></span><small id="journeySaved">Đã lưu</small></div>
      <div class="journey-minimap"><div><span>BẢN ĐỒ KHU VỰC</span><b>N ↑</b></div><svg id="localMap" viewBox="-29 -29 58 58" role="img" aria-label="Bản đồ nhỏ; bấm để di chuyển"></svg><p><i></i> Bạn <span>◇ Điểm hồi sinh</span></p></div>
      <aside class="journey-quest"><div class="journey-kicker">QUYỂN TRỤC NHIỆM VỤ <span id="questCount"></span></div><h3 id="questTitle"></h3><p id="questDescription"></p><button id="questTrack">Theo dấu nhiệm vụ <span>↗</span></button></aside>
      <div class="journey-character"><div class="journey-avatar">忍</div><div><strong id="journeyHeroName"></strong><small id="journeyHeroLevel"></small></div><span id="journeyGold"></span></div>
      <div class="journey-controls"><span><b>↖</b> Click mặt đất để di chuyển</span><span><kbd>E</kbd> Tương tác</span><span><kbd>M</kbd> Bản đồ</span></div>
      <button id="nearbyAction" class="nearby-action" hidden></button><div id="worldLabels"></div>
    </section>
    <section id="atlasScreen" class="journey-modal" hidden><div class="atlas-card"><div class="atlas-heading"><div><div class="journey-kicker">ĐỊA ĐỒ · MƯỜI MIỀN ĐẤT</div><h2>Thế giới Cửu Hệ</h2></div><button id="closeAtlas" class="journey-close" aria-label="Đóng bản đồ">×</button></div><div class="atlas-body"><div class="atlas-map"><svg id="worldAtlas" viewBox="0 0 100 100" aria-label="Bản đồ thế giới gồm mười làng"><defs><radialGradient id="atlasSea"><stop stop-color="#315d67"/><stop offset="1" stop-color="#182e3d"/></radialGradient><filter id="landShadow"><feDropShadow dx="0" dy=".5" stdDeviation=".7" flood-opacity=".4"/></filter></defs><rect width="100" height="100" rx="3" fill="url(#atlasSea)"/>${VILLAGES.map(v=>`<g class="atlas-region" data-region="${v.id}" tabindex="0" role="button" aria-label="${v.name}"><polygon points="${v.polygon}" fill="${v.color}" stroke="#e4d6ae" stroke-width=".6" stroke-linejoin="round" filter="url(#landShadow)"/><text x="${v.x}" y="${v.y-1}" class="atlas-glyph">${v.glyph}</text><text x="${v.x}" y="${v.y+3}" class="atlas-name">${v.name}</text></g>`).join('')}<g id="atlasPosition"></g><text x="5" y="92" class="atlas-compass">N</text><path d="M6 88v-8m-2 3 2-3 2 3" stroke="#d8c79e" stroke-width=".3" fill="none"/></svg></div><aside id="atlasDetail"></aside></div><div class="atlas-foot"><span>◇ Ấn hồi sinh <b>·</b> ● Vị trí hiện tại</span><span>Đi qua cổng làng để sang vùng đất liền kề.</span></div></div></section>
    <section id="journeyDialog" class="journey-modal" hidden><div class="journey-dialog-card"><div id="dialogKicker" class="journey-kicker"></div><h2 id="dialogTitle"></h2><p id="dialogBody"></p><div id="dialogActions"></div></div></section>
    <div id="journeyToast" role="status" aria-live="polite" hidden></div>`;
  let coat='#345c63',hair='#252b32';
  function choose(type,value){if(type==='coat'){coat=value;world.hero.cloth.color.set(value);}else{hair=value;world.hero.hair.color.set(value);}root.querySelectorAll(`[data-${type}]`).forEach(b=>{const chosen=b.dataset[type]===value;b.classList.toggle('selected',chosen);b.setAttribute('aria-pressed',chosen);});}
  root.querySelectorAll('[data-coat]').forEach(b=>b.onclick=()=>choose('coat',b.dataset.coat));root.querySelectorAll('[data-hair]').forEach(b=>b.onclick=()=>choose('hair',b.dataset.hair));
  function setPhase(next){phase=next;canvas.setAttribute('aria-label',['duel','combat'].includes(next)?'Đấu trường ninja 3D góc nhìn thứ nhất':'Thế giới Cửu Hệ 3D góc nhìn thứ ba; click mặt đất để di chuyển');document.body.dataset.journey=next;document.body.classList.toggle('adventure-view',!['duel','combat'].includes(next));$('journeyHome').hidden=next!=='home';$('journeyHud').hidden=!['explore','atlas','dialog'].includes(next);$('atlasScreen').hidden=next!=='atlas';$('journeyDialog').hidden=next!=='dialog';root.hidden=['duel','combat','loadout'].includes(next);}
  function toast(message){$('journeyToast').textContent=message;$('journeyToast').hidden=false;toastTimer=4.5;}
  function persist(){save.position=[world.hero.root.position.x,world.hero.root.position.z];try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));stored=save;$('journeySaved').textContent='Đã lưu';storageFailed=false;}catch{storageFailed=true;$('journeySaved').textContent='Chưa lưu được';}saveTimer=0;}
  function enter(){path=[];action=null;setPhase('explore');world.load(save.village,save);refresh();persist();}
  function refresh(){const v=village(save.village),q=save.quests[v.id]||0;document.body.style.setProperty('--biome',v.color);$('villageName').textContent=v.name;$('villageGlyph').textContent=v.glyph;$('checkpointText').textContent='Hồi sinh · '+village(save.checkpoint).name;$('journeyHeroName').textContent=save.hero.name;$('journeyHeroLevel').textContent=`Bậc ${1+Math.floor(save.xp/150)} · ${save.xp} kinh nghiệm`;$('journeyGold').textContent=save.gold+' xu';$('questCount').textContent=Object.values(save.quests).filter(x=>x===3).length+' / 10';
    $('questTitle').textContent=q===3?'Ấn làng đã bình yên':q===2?'Trở về báo tin':q===1?QUESTS[v.id].title:'Lời nhắn của trưởng làng';
    $('questDescription').textContent=q===3?'Khám phá một miền đất khác qua cổng làng.':q===2?'Gặp trưởng làng để nhận thưởng và khép lại nhiệm vụ.':q===1?'Hạ kẻ phá ấn đang chiếm đường phía bắc. Thưởng: 60 xu + 90 kinh nghiệm.':'Gặp trưởng làng để nhận nhiệm vụ bảo vệ ấn hồi sinh.';
    world.guard.root.visible=q===1;
    world.interactives.find(i=>i.kind==='quest').label=QUESTS[v.id].enemy;
    $('worldLabels').innerHTML=world.interactives.filter(i=>i.kind!=='quest'||q===1).map(i=>`<button class="world-label ${i.kind}" data-world="${world.interactives.indexOf(i)}"><small>${i.kind==='gate'?'CỔNG LÀNG':i.kind==='save'?'ĐIỂM HỒI SINH':i.kind==='quest'?'NHIỆM VỤ':'NGƯỜI DẪN ĐƯỜNG'}</small><span>${i.kind==='gate'?'↗':i.kind==='save'?'◇':i.kind==='quest'?'⚔':'!'} ${esc(i.label)}</span></button>`).join('');
    root.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>moveToItem(world.interactives[Number(b.dataset.world)]));updateMinimap();
  }
  function updateMinimap(){const p=world.hero.root.position;
    $('localMap').innerHTML=`<circle r="27" fill="#596d6020"/><circle r="7" fill="#c8b68b35"/>${world.gates.map(g=>`<path d="M0 0L${g.x} ${g.z}" stroke="#bfb39155" stroke-width="2"/><circle cx="${g.x}" cy="${g.z}" r="1.3" fill="${village(g.id).color}"/>`).join('')}${world.obstacles.map(o=>`<rect x="${o.x-o.w}" y="${o.z-o.d}" width="${o.w*2}" height="${o.d*2}" rx=".5" fill="#b9bfa750"/>`).join('')}<path d="m0 3 1.3 1.3L0 5.6-1.3 4.3Z" fill="#a7e6ce"/><circle cx="-4" cy="4" r="1" fill="#e8cf96"/>${save.quests[save.village]===1?'<path d="M7-12l2 2m0-2-2 2" stroke="#e3a18e" stroke-width=".7"/>':''}${path.length?`<polyline points="${[[p.x,p.z],...path].map(p=>p.join(',')).join(' ')}" fill="none" stroke="#ead6a5" stroke-width=".35" stroke-dasharray="1 1"/>`:''}<circle cx="${p.x}" cy="${p.z}" r="1.5" fill="#f9e5b8" stroke="#263c40" stroke-width=".5"/>`;
  }
  function moveTo(point,item=null){if(phase!=='explore')return false;const p=world.hero.root.position,newPath=findPath([p.x,p.z],point,world.blocked);if(!newPath.length){toast('Địa hình chắn lối. Hãy chọn một điểm trên đường.');return false;}path=newPath;action=item;world.destination.position.set(...[point[0],.11,point[1]]);world.destination.visible=true;return true;}
  function moveToItem(item){if(phase!=='explore')return;if(Math.hypot(world.hero.root.position.x-item.x,world.hero.root.position.z-item.z)<2){interact(item);return;}moveTo([item.x,item.z],item);}
  function dialog(kicker,title,body,buttons){path=[];action=null;world.destination.visible=false;setPhase('dialog');$('dialogKicker').textContent=kicker;$('dialogTitle').textContent=title;$('dialogBody').textContent=body;$('dialogActions').replaceChildren();for(const [label,fn,secondary] of buttons){const b=document.createElement('button');b.className=secondary?'journey-secondary':'journey-primary';b.textContent=label;b.onclick=fn;$('dialogActions').append(b);}}
  function closeDialog(){setPhase('explore');}
  function interact(item){
    const v=village(save.village),q=save.quests[v.id]||0;
    if(item.kind==='gate'){const old=save.village,next=village(item.id),a=Math.atan2(v.x-next.x,v.y-next.y);save.village=item.id;save.position=[Math.sin(a)*19,Math.cos(a)*19];if(!save.visited.includes(item.id))save.visited.push(item.id);world.clearEnemy();enter();cooldown=3;distance=0;toast(`Đã rời ${village(old).name} · ${next.title}`);}
    if(item.kind==='save'){save.checkpoint=v.id;if(!save.activated.includes(v.id))save.activated.push(v.id);persist();refresh();toast('Đã kích hoạt ấn. Nếu thất bại, bạn sẽ hồi sinh tại '+v.name+'.');}
    if(item.kind==='npc'){
      if(!q)dialog('TRƯỞNG LÀNG · '+v.name,QUESTS[v.id].title,QUESTS[v.id].story+' Trước khi đi, nhớ kích hoạt ấn hồi sinh.',[['Nhận nhiệm vụ',()=>{save.quests[v.id]=1;persist();refresh();closeDialog();toast('Đã nhận nhiệm vụ · '+QUESTS[v.id].title);} ],['Để lúc khác',closeDialog,true]]);
      else if(q===1)dialog('NHIỆM VỤ ĐANG THỰC HIỆN','Con đường phía bắc','Kẻ phá ấn vẫn còn đó. Hãy chuẩn bị bộ chiêu rồi đối mặt với hắn.',[['Theo dấu kẻ phá ấn',()=>{closeDialog();moveToItem(world.interactives.find(i=>i.kind==='quest'));}],['Đóng',closeDialog,true]]);
      else if(q===2)dialog('NHIỆM VỤ HOÀN THÀNH','Ấn làng lại sáng','Bạn đã giữ lời. Hãy nhận thêm 40 xu và 60 kinh nghiệm từ dân làng, rồi tiếp tục hành trình.',[['Nhận thưởng',()=>{save.quests[v.id]=3;save.gold+=40;save.xp+=60;persist();refresh();closeDialog();toast('Hoàn thành nhiệm vụ · +40 xu · +60 kinh nghiệm');}]]);
      else dialog('TRƯỞNG LÀNG','Đường xa còn đợi','Cảm ơn người giữ ấn. Những làng bên kia cổng vẫn đang cần bạn.',[['Tiếp tục hành trình',closeDialog]]);
    }
    if(item.kind==='quest'&&q===1)offerBattle('quest');
  }
  function offerBattle(kind){encounter={kind,village:save.village,name:kind==='quest'?QUESTS[save.village].enemy:'Ninja lưu vong',element:village(save.village).element};
    dialog(kind==='quest'?'NHIỆM VỤ CỐ ĐỊNH':'CHẠM TRÁN TRÊN ĐƯỜNG',encounter.name,`Đối thủ sử dụng hệ ${globalThis.SealGameCore.elements.find(e=>e.id===encounter.element)?.name||'Phong'}. Chọn bộ chiêu rồi bước vào giao diện chiến đấu kết ấn. Nếu thất bại, bạn sẽ trở về ${village(save.checkpoint).name}.`,[['Chuẩn bị giao chiến',()=>{persist();setPhase('loadout');onBattle(encounter);}],['Lùi lại',()=>{encounter=null;world.clearEnemy();cooldown=12;closeDialog();},true]]);
  }
  function finishBattle(victory){if(!encounter)return;resolveBattle(save,encounter,victory);world.clearEnemy();cooldown=14;distance=0;encounter=null;enter();toast(victory?'Chiến thắng · Đã nhận xu và kinh nghiệm.':`Bạn đã hồi sinh tại ${village(save.checkpoint).name}.`);}
  function cancelBattle(){encounter=null;cooldown=12;world.clearEnemy();enter();}
  function openAtlas(){if(phase!=='explore')return;path=[];action=null;world.destination.visible=false;atlasSelection=save.village;setPhase('atlas');renderAtlas();}
  function renderAtlas(){const v=village(atlasSelection),current=village(save.village),adjacent=current.links.includes(v.id),here=v.id===save.village;root.querySelectorAll('[data-region]').forEach(g=>{g.classList.toggle('selected',g.dataset.region===v.id);g.classList.toggle('visited',save.visited.includes(g.dataset.region));});$('atlasPosition').innerHTML=`<circle cx="${current.x+6}" cy="${current.y-4}" r="1.25" fill="#fff2c9" stroke="#203c40" stroke-width=".5"/>`;
    $('atlasDetail').innerHTML=`<span class="atlas-detail-glyph" style="--biome:${v.color}">${v.glyph}</span><div class="journey-kicker">${here?'BẠN ĐANG Ở ĐÂY':save.visited.includes(v.id)?'ĐÃ KHÁM PHÁ':'CHƯA KHÁM PHÁ'}</div><h3>${v.name}</h3><h4>${v.title}</h4><p>${v.desc}</p><div class="atlas-save">◇ ${save.checkpoint===v.id?'Điểm hồi sinh hiện tại':save.activated.includes(v.id)?'Đã kích hoạt ấn hồi sinh':'Ấn hồi sinh chưa kích hoạt'}</div><button id="atlasGo" class="journey-primary" ${adjacent?'':'disabled'}>${here?'Vùng đất hiện tại':adjacent?'Đi tới cổng làng ↗':'Hãy đi qua làng liền kề'}</button><small>KẾT NỐI VỚI</small><div class="atlas-neighbors">${v.links.map(id=>`<button data-neighbor="${id}">${village(id).name}</button>`).join('')}</div>`;
    $('atlasGo').onclick=()=>{setPhase('explore');moveToItem(world.gates.find(g=>g.id===v.id));};root.querySelectorAll('[data-neighbor]').forEach(b=>b.onclick=()=>{atlasSelection=b.dataset.neighbor;renderAtlas();});
  }
  $('heroForm').onsubmit=e=>{e.preventDefault();save=newJourney($('heroName').value,coat,hair);encounter=null;distance=0;cooldown=10;enter();toast('Chào mừng đến Làng Vô Danh · Ấn hồi sinh đầu tiên đã được kích hoạt.');};
  $('continueJourney').onclick=()=>{save=stored;enter();};$('duelMode').onclick=()=>{setPhase('duel');onDuel();};$('journeyHomeLink').onclick=e=>{e.preventDefault();menu();};
  $('openAtlas').onclick=openAtlas;$('closeAtlas').onclick=closeDialog;$('journeyMenu').onclick=menu;
  function menu(){if(phase!=='explore')return;dialog('HÀNH TRÌNH ĐÃ LƯU','Dừng chân một lát','Tiến trình được lưu trên trình duyệt này. Tiếp tục khám phá hoặc trở về màn hình tạo nhân vật.',[['Tiếp tục',closeDialog],['Về màn hình chính',()=>{persist();setPhase('home');$('continueJourney').hidden=false;choose('coat',save.hero.coat);choose('hair',save.hero.hair);},true]]);}
  $('questTrack').onclick=()=>{const q=save.quests[save.village]||0;if(q===3){openAtlas();return;}moveToItem(world.interactives.find(i=>i.kind===(q===1?'quest':'npc')));};
  $('nearbyAction').onclick=()=>{const item=nearest();if(item)interact(item);};
  $('localMap').onclick=e=>{if(phase!=='explore')return;const r=e.currentTarget.getBoundingClientRect();moveTo([(e.clientX-r.left)/r.width*58-29,(e.clientY-r.top)/r.height*58-29]);};
  root.querySelectorAll('[data-region]').forEach(g=>{const select=()=>{atlasSelection=g.dataset.region;renderAtlas();};g.onclick=select;g.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();select();}};});
  function nearest(){const p=world.hero.root.position;return world.interactives.filter(i=>i.kind!=='quest'||save.quests[save.village]===1).find(i=>Math.hypot(p.x-i.x,p.z-i.z)<2.1);}
  canvas.addEventListener('pointerdown',e=>{if(phase!=='explore'||e.button!==0)return;const point=world.pick(e.clientX,e.clientY,canvas);if(point)moveTo(point);});
  window.addEventListener('keydown',e=>{if(['duel','combat','loadout'].includes(phase)||e.target.matches('input'))return;if(e.repeat)return;const k=e.key.toLowerCase();if(k==='m'){e.preventDefault();if(phase==='atlas')closeDialog();else openAtlas();}if(k==='escape'){e.preventDefault();if(['dialog','atlas'].includes(phase)){encounter=null;world.clearEnemy();cooldown=10;closeDialog();}else menu();}if(k==='e'&&phase==='explore'){const i=nearest();if(i)interact(i);}});
  window.addEventListener('resize',()=>world.resize());window.addEventListener('pagehide',()=>{if(phase!=='home'&&phase!=='duel')persist();});
  function update(dt){
    if(['duel','combat'].includes(phase))return;time+=dt;let moving=false;
    if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('journeyToast').hidden=true;}
    if(phase==='explore'){
      cooldown=Math.max(0,cooldown-dt);saveTimer+=dt;
      if(path.length){const p=world.hero.root.position,target=path[0],dx=target[0]-p.x,dz=target[1]-p.z,d=Math.hypot(dx,dz),step=Math.min(d,5.3*dt);moving=d>.01;
        if(d>.001){p.x+=dx/d*step;p.z+=dz/d*step;world.hero.root.rotation.y=Math.atan2(dx,dz);distance+=step;}if(d<=5.3*dt+.001)path.shift();
        if(!path.length){world.destination.visible=false;const pending=action;action=null;if(pending&&Math.hypot(p.x-pending.x,p.z-pending.z)<2.2)interact(pending);else persist();}
      }
      const p=world.hero.root.position;
      if(randomEnabled&&!world.randomEnemy&&cooldown<=0&&distance>=spawnAt&&Math.hypot(p.x,p.z)>9&&world.gates.every(g=>Math.hypot(g.x-p.x,g.z-p.z)>5)){
        for(let i=0;i<16;i++){const a=Math.random()*Math.PI*2,x=p.x+Math.sin(a)*5,z=p.z+Math.cos(a)*5;if(Math.hypot(x,z)>9&&!world.blocked(x,z)&&findPath([x,z],[p.x,p.z],world.blocked).length){world.spawnEnemy(x,z);toast('Một ninja lưu vong xuất hiện gần đây…');distance=0;spawnAt=14+Math.random()*14;break;}}
      }
      if(world.randomEnemy){const e=world.randomEnemy.root.position,d=Math.hypot(p.x-e.x,p.z-e.z);if(d<2){offerBattle('random');}else{const route=findPath([e.x,e.z],[p.x,p.z],world.blocked);if(route.length){const [x,z]=route[0],len=Math.hypot(x-e.x,z-e.z),step=Math.min(len,2.4*dt);if(len){e.x+=(x-e.x)/len*step;e.z+=(z-e.z)/len*step;world.randomEnemy.root.rotation.y=Math.atan2(p.x-e.x,p.z-e.z);}}}}
      if(saveTimer>3&&(moving||storageFailed))persist();
      const near=nearest();$('nearbyAction').hidden=!near;if(near)$('nearbyAction').innerHTML=`<kbd>E</kbd> ${near.kind==='gate'?'Đi tới ':near.kind==='save'?'Kích hoạt ':near.kind==='quest'?'Đối mặt ': 'Nói chuyện · '}${esc(near.label)}`;
      updateMinimap();
    }
    world.update(dt,moving,phase==='home');
    root.querySelectorAll('[data-world]').forEach(b=>{const i=world.interactives[Number(b.dataset.world)],p=world.project(i.x,i.z,i.kind==='gate'?5.2:i.kind==='save'?3.5:3.3);b.style.left=p.left+'px';b.style.top=p.top+'px';b.hidden=!p.visible;});
  }
  setPhase('home');
  const homeButton=document.createElement('button');homeButton.className='outline adventure-back';homeButton.textContent='← Thế giới khám phá';$('startScreen').querySelector('.scroll-heading>div').append(homeButton);homeButton.onclick=()=>{onReturn();if(encounter)cancelBattle();else{setPhase('home');$('continueJourney').hidden=!stored;}};
  return {world,update,get activeView(){return !['duel','combat'].includes(phase);},get phase(){return phase;},get encounter(){return encounter;},get inBattle(){return phase==='combat'&&!!encounter;},beginCombat(){setPhase('combat');},finishBattle,cancelBattle,showLoadout(){setPhase('loadout');},state:()=>({phase,save:JSON.parse(JSON.stringify(save)),position:[world.hero.root.position.x,world.hero.root.position.z],path:path.map(p=>[...p]),encounter:encounter?{...encounter}:null,randomEnemy:world.randomEnemy?[world.randomEnemy.root.position.x,world.randomEnemy.root.position.z]:null,obstacles:world.obstacles,gates:world.gates,storageFailed}),
    // Deterministic hooks are attached to the public API only by the test-mode caller.
    test:{moveTo,interact:kind=>{const i=world.interactives.find(i=>i.kind===kind);if(i)moveToItem(i);},setRandom:enabled=>{randomEnabled=enabled;},spawn:()=>{cooldown=0;distance=999;spawnAt=0;},offerBattle,travel:id=>{const g=world.gates.find(g=>g.id===id);if(g)moveToItem(g);},project:(x,z)=>world.project(x,z,0),openAtlas}};
}
