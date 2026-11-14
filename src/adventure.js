import {AUTO_SAVE_SECONDS,captureCheckpoint,restoreCheckpoint,checkpointSummary} from './checkpoint-state.js';
import {planSavePoints} from './save-points.js';
import {infiltratorEncounter,infiltrationLimit} from './crescent-infiltration.js';
import {challengeJailer,militaryIntrusion} from './military-jailer.js';
import {sacrificeForHero,companionSacrificed,storyEnding} from './phoenix-blessing.js';
import {islandCenterLocked,storyBossProfile} from './island-occupation.js';
import {ADVENTURE_WALK_SPEED,ADVENTURE_RUN_SPEED,ADVENTURE_BACKWARD_SPEED} from './game-pace.js';
import {companionUnconscious,carryingCompanion,companionMoveMultiplier,recordCompanionHealth as saveCompanionHealth,treatCompanion,healCompanion,COMPANION_TREATMENT_SECONDS} from './companion-health.js';
import {PLOT,WAR_VILLAGES,ALLIANCE_VILLAGES,canProgressPlot,acceptAlliance,plotHostile,campaignChapter,plotVillageComplete,companionPresent} from './campaign-plot.js';
import {waterMapMarkup,waterFerryMapMarkup} from './water-network.js';
import {createOpeningCinematic} from './opening-cinematic.js';
import {villageMapMarkup} from './village-map.js';
import {createVillageMapControls} from './village-map-controls.js';
import {inventoryItemDetails} from './inventory-details.js';
import {guardianGuardIds,guardianOrdered,nextGuardianGuard,orderGuardianGuards,guardianStoryPending,inCouncilCourtyard} from './village-confrontation.js';
import {planVillageExits} from './village-exits.js';
import {atlasMarkup} from './world-atlas.js';
import {travelKind} from './village-travel.js';
import {createPeaceCeremony} from './peace-ceremony.js';
import {battleConversation} from './battle-conversation.js';
import {BOT_HEALTH_SCALE} from './enemy-balance.js';
import {recordCampaignVisit} from './campaign-difficulty.js';
import {enemySealTiming} from './enemy-seal-timing.js';
import {isEarthDepartureTrial,earthDepartureTrialPending,EARTH_DEPARTURE_TRIAL} from './earth-departure-trial.js';
import {registerTournament,pendingTournamentMatch,TOURNAMENT_ROUNDS} from './wood-tournament.js';
import {createTournamentBoardUI,tournamentName} from './tournament-board.js';
import {flaskState,useFlask,refillFlask,upgradeFlask} from './healing-flask.js';
import {strikeOre,ORE_SWING_COOLDOWN} from './spirit-mines.js';
import {INTERIORS,enterInterior,leaveInterior,interiorForZone} from './adventure-interiors.js';
import {VILLAGE_EVENTS,HA_LY,HA_LY_MOTHER,currentVillageEvent,villageEventStep,villageEventComplete,advanceVillageEvent,villageEventEncounter,brewHongLienMedicine} from './village-events.js';
import {createAdminSession,adminOpponents} from './adventure-access.js';
import {gameAudio} from './game-audio.js';
import {combatExperienceElement,requiresGuardBattle} from './combat-experience.js';
import {questAction} from './quest-items.js';
import {MOTHER_ID,STARTER_CHOICES,INTRO_SQUAD,promiseMother,chooseStarter,reportGuardian,negotiatePeace,villageSidequests,questForNPC,acceptSidequest,claimSidequest,completeSidequestTarget,sidequestReward,sidequestDone} from './journey-story.js';
import {configureOpponent} from './opponent-balance.js';
import {SHURIKEN_TYPES,equipmentState,ammoCount,buyEquipment,equipItem,takeShuriken,cycleShuriken,emergencySupply,maxShurikenPurchase,shurikenPrice,shurikenById} from './equipment.js';
import {equipmentPanel,inventoryPanel,shopContent} from './equipment-ui.js';
import {fillGearIcons} from './gear-icons.js';
import {createHeroPreview} from './hero-preview.js';
import * as T from 'three';
import {VILLAGES,INTERACTION_RANGE,village,newJourney,readJourney,resolveBattle,findPath,SAVE_KEY,discoverZone,mentorReady,completeLesson,canTravel,canSignTreaty,signTreaty,campaignStage,campaignObjective} from './adventure-data.js';
import {REGIONS,regionMetrics,riverAt} from './adventure-world.js';
import {planExpedition,markerTraversal} from './adventure-biomes.js';
import {planVillageCivic,civicGatePosition} from './village-civic.js';
import {createAdventureScene} from './adventure-scene.js';
import {physicalKey,textInputTarget,releaseMovementKeys,setupGameFocus} from './game-input.js';
import {createDialogueUI,heroSpeaker,dialogueCast,conversationLines,sidequestThanks,sidequestLines,campaignLines} from './adventure-dialogue.js';
import {SYSTEMS,SKILL_LEVELS,LEVEL_XP,ATTRIBUTE_GAINS,systemLevel,requiredLevel,spellElement,regionElement,combatStats,remainingPoints,spendPoint,gainExperience,canLearn,learnFromBook,encounterProfile} from './progression.js';

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);
export function createAdventure({canvas,onBattle,onDuel,onReturn,onLearn=()=>{},onLoadJourney=()=>{},onAdminChange=()=>{}}){
  let stored;try{stored=readJourney(localStorage);}catch{}
  let intrusionCooldown=0,infiltrationClock=0;
  let save=stored||newJourney(),phase='home',path=[],action=null,encounter=null,time=0,saveTimer=0,distance=0,spawnAt=90+Math.random()*70,cooldown=45,toastTimer=0,atlasSelection='nameless',storageFailed=false,randomEnabled=true,waypoint=null,waypointSource='campaign';
  const admin=createAdminSession();let adminReturnHome=false,adminBattleVillage=save.village,adminObjectiveVillage=null;
  let loading=false,loadingPhase='explore',treatmentRemaining=0,companionTreatment=false;
  const world=createAdventureScene();world.load(save.village,save);const tournamentBoard=createTournamentBoardUI();
  const root=document.createElement('div');root.id='adventure';document.body.append(root);
  root.innerHTML=`
    <section id="journeyHome" class="journey-home">
      <div class="journey-intro"><div class="journey-kicker"><span></span> CỬU ẤN</div><h1>Mỗi dấu chân.<br>Một <em>huyền thoại.</em></h1><button id="duelMode" class="journey-secondary">Vào đấu trường luyện tập <span>→</span></button></div>
      <form id="heroForm" class="hero-form"><label for="heroName">DANH XƯNG</label><input id="heroName" maxlength="24" value="${esc(save.hero.name)}" autocomplete="off" required><div class="hero-home-actions"><button id="newJourney" class="journey-primary" type="submit">HÀNH TRÌNH MỚI <span>→</span></button><button id="continueJourney" class="journey-secondary" type="button" ${stored?'':'hidden'}>TIẾP TỤC HÀNH TRÌNH <span>↗</span></button></div><div class="hero-home-meta"><div class="journey-version">CỬU ẤN <b>／</b> ${esc(PLOT.chapters[0])}</div></div></form>
    </section>
    <dialog id="newJourneyDialog" class="new-journey-dialog" aria-labelledby="newJourneyTitle" aria-describedby="newJourneyWarning"><h2 id="newJourneyTitle">Bắt đầu hành trình mới?</h2><p id="newJourneyWarning">Bắt đầu hành trình mới sẽ xóa toàn bộ tiến trình đã lưu trước đó. Bạn có chắc chắn muốn tiếp tục không?</p><div class="new-journey-actions"><button id="cancelNewJourney" type="button" class="journey-secondary" autofocus>Hủy</button><button id="confirmNewJourney" type="button" class="journey-primary">Bắt đầu hành trình mới</button></div></dialog>
    <section id="journeyHud" class="journey-hud" hidden>
      <div class="journey-top"><a class="journey-brand" href="#" id="journeyHomeLink"><b>印</b><span>CỬU ẤN<small>KẺ LỮ HÀNH</small></span></a><div class="journey-location"><span id="villageGlyph"></span><div><small>VÙNG ĐẤT HIỆN TẠI</small><h2 id="villageName"></h2></div></div><nav><button id="openJournal" title="Nhật ký khám phá (B)" aria-keyshortcuts="B">▤ <span>Nhật ký khám phá</span><span id="discoveryCount" class="journey-discovery-count">0 / 4</span><kbd>B</kbd></button><button id="openAtlas" title="Bản đồ thế giới (M)">◎ <span>Bản đồ</span><kbd>M</kbd></button><button id="journeyMenu" title="Tạm dừng">Ⅱ <span>Tạm dừng</span></button></nav></div>
      <div class="journey-checkpoint"><i></i><span id="checkpointText"></span><small id="journeySaved">Đã lưu</small></div>
      <div class="journey-minimap"><div><span>BẢN ĐỒ KHU VỰC</span><b>N ↑</b></div><svg id="localMap" viewBox="-74 -74 148 148" role="img" aria-label="Bản đồ khu vực và vị trí nhân vật"></svg><p><i></i> Bạn <span>◇ Hồi sinh · ⚔ Thủ lĩnh</span></p></div>
      <aside class="journey-quest"><button id="campaignToggle" class="campaign-toggle" aria-expanded="true" aria-controls="campaignContent"><span><small>TUYẾN TRUYỆN CHÍNH <b id="campaignChapter"></b></small><strong id="campaignSummary"></strong></span><span id="campaignChevron" aria-hidden="true">⌃</span></button><div id="campaignContent" class="campaign-content"><h3 id="campaignTitle"></h3><p id="campaignDescription"></p><button id="campaignTrack">Đánh dấu mục tiêu <span>↗</span></button><div class="journey-sidequest"><small>VIỆC LÀNG <span id="questCount"></span></small><strong id="questTitle"></strong><p id="questDescription"></p><button id="questTrack">Đánh dấu việc làng <span>↗</span></button></div></div></aside>
      <div class="journey-character"><div class="journey-avatar">忍</div><div><strong id="journeyHeroName"></strong><small id="journeyHeroLevel"></small><small id="journeyCompanionHealth" hidden></small></div><span id="journeyGold"></span></div>
      <div class="journey-controls"><span><b>↖</b> Click mặt đất để di chuyển</span><span><kbd>E</kbd> Tương tác</span><span><kbd>M</kbd> Bản đồ</span></div>
      <div id="landmarkIntro" class="nearby-action landmark-intro" role="status" aria-live="polite" hidden></div><button id="nearbyAction" class="nearby-action" hidden></button><div id="waypointHint" class="journey-waypoint" role="status" hidden></div><div id="worldLabels"></div>
    </section>
    <section id="atlasScreen" class="journey-modal" hidden><div class="atlas-card"><div class="atlas-heading"><div><div class="journey-kicker">ĐỊA ĐỒ · MƯỜI MIỀN ĐẤT</div><h2>Thế giới Cửu Hệ</h2></div><button id="closeAtlas" class="journey-close" aria-label="Đóng bản đồ">×</button></div><div class="atlas-body"><div class="atlas-map"><svg id="worldAtlas" viewBox="0 0 100 100" aria-label="Bản đồ thế giới gồm mười làng">${atlasMarkup(VILLAGES)}</svg></div><aside id="atlasDetail"></aside></div><div class="atlas-foot"><span>◇ Ấn hồi sinh <b>·</b> ● Vị trí hiện tại</span><span>Cổng làng · Đường bộ | Nét đứt · Tuyến thuyền</span></div></div></section>
    <section id="journalScreen" class="journey-modal" hidden><div class="journal-card"><div class="atlas-heading"><div><h2 id="journalTitle">Nhật ký</h2></div><button id="closeJournal" class="journey-close" aria-label="Đóng nhật ký">×</button></div><div id="journalBody"></div></div></section>
    <section id="journeyDialog" class="journey-modal" role="dialog" aria-modal="true" aria-labelledby="dialogTitle" hidden><div class="journey-dialog-card"><div id="dialogKicker" class="journey-kicker"></div><h2 id="dialogTitle"></h2><div class="dialog-layout"><aside class="dialog-person" hidden><div id="dialogPortrait"></div><strong id="dialogSpeakerName"></strong><small id="dialogSpeakerRole"></small></aside><div class="dialog-copy"><p id="dialogBody"></p><div id="dialogConversationControls" hidden><span id="dialogLineCount"></span><button id="dialogNext" type="button">Tiếp lời →</button><button id="dialogSkip" type="button">Bỏ qua hội thoại</button></div></div></div><div id="dialogActions"></div></div></section>
    <div id="journeyToast" role="status" aria-live="polite" hidden></div><section id="companionTreatmentPanel" role="status" aria-live="polite" hidden><strong>Đang chữa trị Hạ Ly</strong><span id="companionTreatmentTime"></span><button id="cancelCompanionTreatment" class="journey-secondary">Tạm dừng chữa trị</button></section>`;
  const opening=createOpeningCinematic(root,world,()=>{setPhase('explore');persist();toast('Mẹ đang đợi ở nghĩa trang, gần ngôi nhà của bạn. Hãy tới gặp mẹ.');});
  let openingPending=false;
  const peaceCeremony=createPeaceCeremony();const dialogue=createDialogueUI(root);let dialogueItem=null,sidequestView=false;
  const heroPreview=createHeroPreview();let shopTab='shuriken';
  const focusGame=setupGameFocus(canvas),held=new Set();let cameraDrag=null,campaignCollapsed=true,journeyLegs=[],automaticJourney=false,waypointVia=null,minimapAt=-1;
  const momentum={x:0,z:0};let sprinting=false,mobileAutoRun=false,lastForwardTap=-Infinity;
  const travelAccess=(target,from=save)=>admin.active?{allowed:!!village(target),reason:''}:canTravel(from,target);
  function adminVisit(id,after=()=>{}){if(!admin.active||!village(id)||loading)return false;return runLoading('Đang tới '+village(id).name+'…',()=>{save.interior=null;save.village=id;save.position=[0,7];save.surface=null;save.elevation=null;encounter=null;enter();cooldown=45;distance=0;after();return true;});}
  root.insertAdjacentHTML('beforeend',`<section id="adminScreen" class="journey-modal" role="dialog" aria-modal="true" aria-labelledby="adminTitle" hidden><div class="access-card"><div class="atlas-heading"><div><div class="journey-kicker">PHIÊN THỬ NGHIỆM RIÊNG</div><h2 id="adminTitle">Chế độ admin</h2></div><button id="closeAdmin" class="journey-close" aria-label="Đóng admin">×</button></div><div class="access-body"><p>Vô hạn xu, dịch chuyển tới mọi làng và chọn đối thủ tự do. Khi thoát admin hoặc tải lại game, bạn trở về tiến trình trước khi bật.</p><button id="toggleAdmin" class="journey-primary"></button><div id="adminTools" hidden><button id="adminMap" class="journey-secondary">Dịch chuyển trên toàn bản đồ ↗</button><label class="access-select">Chọn làng của đối thủ<select id="adminBattleVillage">${VILLAGES.map(v=>`<option value="${v.id}">${v.name}</option>`).join('')}</select></label><div id="adminOpponents" class="access-list"></div></div></div></div></section>`);
  const homeAdmin=document.createElement('button');homeAdmin.id='homeAdmin';homeAdmin.className='journey-secondary';homeAdmin.textContent='Bật chế độ admin';$('duelMode').after(homeAdmin);homeAdmin.onclick=()=>admin.active?openAdmin():setAdminEnabled(true);
  const adminBadge=document.createElement('button');adminBadge.id='adminIndicator';adminBadge.type='button';adminBadge.textContent='ADMIN · Tiến trình tạm';adminBadge.hidden=true;$('journeyHud').append(adminBadge);adminBadge.onclick=openAdmin;
  $('closeAdmin').onclick=closeDialog;
  $('toggleAdmin').onclick=()=>setAdminEnabled(!admin.active);$('adminMap').onclick=()=>{setPhase('explore');openAtlas();};
  $('adminBattleVillage').onchange=e=>{adminBattleVillage=e.target.value;renderAdminOpponents();};
  function setAdminEnabled(enabled){
    if(enabled===admin.active||loading)return;
    const previous=phase;
    return runLoading(enabled?'Đang bật chế độ admin…':'Đang khôi phục tiến trình…',()=>{
    if(peaceCeremony.state().active)peaceCeremony.reset();
    if(enabled){adminReturnHome=['home','duel'].includes(previous);if(!adminReturnHome)persist();save=admin.enter(save);onAdminChange(true);encounter=null;world.clearEnemy();enter();openAdmin();}
    else{if(['combat','loadout','duel'].includes(previous))onReturn();save=admin.leave();encounter=null;world.clearEnemy();onAdminChange(false);enter(false);if(adminReturnHome){setPhase('home');$('continueJourney').hidden=!stored;}toast('Đã thoát admin · Tiến trình chơi được khôi phục');}
    adminBadge.hidden=!admin.active;homeAdmin.textContent=admin.active?'Công cụ admin':'Bật chế độ admin';$('heroForm').querySelector('button[type=submit]').disabled=admin.active;document.body.classList.toggle('admin-mode',admin.active);
    });
  }
  function openAdmin(){if(['combat','loadout'].includes(phase))return;dialogueItem=null;setPhase('admin');$('toggleAdmin').textContent=admin.active?'Thoát admin · Khôi phục tiến trình':'Bật admin';$('adminTools').hidden=!admin.active;adminBattleVillage=save.village;$('adminBattleVillage').value=adminBattleVillage;renderAdminOpponents();}
  function renderAdminOpponents(){
    const list=$('adminOpponents');list.replaceChildren();if(!admin.active)return;
    for(const foe of adminOpponents(adminBattleVillage)){const button=document.createElement('button');button.className='journey-secondary';button.dataset.adminOpponent=foe.id;button.textContent=foe.name;button.onclick=()=>{if(!admin.active)return;adminVisit(adminBattleVillage,()=>{dialogueItem=null;offerBattle(foe.kind,{...foe.details,name:foe.name});});};list.append(button);}
  }
  root.insertAdjacentHTML('beforeend','<div id="journeyTravel" class="journey-travel-hint" hidden></div>');
  const leftRail=document.createElement('div');leftRail.className='journey-left-rail';
  for(const selector of ['.journey-quest','.journey-character'])leftRail.append(root.querySelector(selector));$('journeyHud').append(leftRail);
  try{campaignCollapsed=localStorage.getItem('anhoa-campaign-collapsed-v1')!=='false';}catch{}
  function renderCampaignToggle(){const expanded=!campaignCollapsed;$('campaignToggle').setAttribute('aria-expanded',String(expanded));$('campaignToggle').setAttribute('aria-label',expanded?'Thu gọn tuyến truyện chính':'Mở rộng tuyến truyện chính');$('campaignContent').hidden=!expanded;$('campaignChevron').textContent=expanded?'⌃':'⌄';}
  $('campaignToggle').onclick=()=>{campaignCollapsed=!campaignCollapsed;renderCampaignToggle();try{localStorage.setItem('anhoa-campaign-collapsed-v1',String(campaignCollapsed));}catch{}};renderCampaignToggle();
  root.insertAdjacentHTML('beforeend',`<section id="progressionScreen" class="journey-modal" hidden><div class="progression-card"><div class="atlas-heading"><div><div class="journey-kicker">CHÍN HỆ · THUỘC TÍNH NHÂN VẬT DÙNG CHUNG</div><h2>Tu luyện & thuộc tính</h2></div><button id="closeProgression" class="journey-close" aria-label="Đóng tu luyện">×</button></div><div id="progressionBody"></div></div></section>`);
  root.insertAdjacentHTML('beforeend','<section id="shopScreen" class="journey-modal" role="dialog" aria-modal="true" aria-label="Thương hội" hidden><div class="shop-card"><div class="atlas-heading shop-heading"><div class="journey-kicker">TRANG BỊ · TIẾP TẾ</div><div class="shop-heading-actions"><button id="shopEquipment" class="journey-secondary" type="button">Trang bị · V</button><div class="shop-balance" aria-label="Số xu hiện có"><span aria-hidden="true">◈</span><strong id="shopGold"></strong></div><button id="closeShop" class="journey-close" aria-label="Đóng cửa hàng">×</button></div></div><div id="shopBody"></div></div></section>');
  root.insertAdjacentHTML('beforeend','<section id="equipmentScreen" class="journey-modal" role="dialog" aria-modal="true" aria-label="Trang bị" hidden><div class="equipment-card"><div class="atlas-heading"><div><div class="journey-kicker">NHÂN VẬT · HÀNH TRANG</div><h2>Trang bị</h2></div><button id="closeEquipment" class="journey-close" aria-label="Đóng trang bị">×</button></div><div id="equipmentBody" class="equipment-layout"></div></div></section><dialog id="shurikenPurchase" class="purchase-dialog" aria-labelledby="purchaseTitle"><h2 id="purchaseTitle"></h2><label for="purchaseQuantity">Số lượng <output id="purchaseCount"></output></label><input id="purchaseQuantity" type="range" min="1" max="50" step="1"><p id="purchaseLimit"></p><strong id="purchaseCost"></strong><div><button id="cancelPurchase" class="journey-secondary">Hủy</button><button id="confirmPurchase" class="journey-primary">Mua</button></div><p id="purchaseFeedback" role="status"></p></dialog>');
  root.insertAdjacentHTML('beforeend','<dialog id="inventoryItemDialog" class="inventory-item-dialog" aria-labelledby="inventoryItemTitle"><header><h2 id="inventoryItemTitle"></h2><button id="closeInventoryItem" class="journey-close" type="button" aria-label="Đóng thông tin vật phẩm" autofocus>×</button></header><div id="inventoryItemBody"></div><footer><button id="inventoryItemUse" class="journey-primary" type="button" hidden>Sử dụng</button><button id="inventoryItemBack" class="journey-secondary" type="button">Đóng</button></footer></dialog>');
  const inventoryPopup=$('inventoryItemDialog');let inventoryReturnFocus=null;
  $('closeInventoryItem').onclick=$('inventoryItemBack').onclick=()=>inventoryPopup.close();
  inventoryPopup.addEventListener('close',()=>{if(phase==='equipment'&&inventoryReturnFocus?.isConnected)inventoryReturnFocus.focus();});
  root.insertAdjacentHTML('beforeend','<dialog id="villageMapDialog" class="village-map-dialog" aria-label="Bản đồ làng"><div id="villageMapViewport" class="village-map-viewport"><div id="villageMapCanvas"></div></div><button id="closeVillageMap" class="journey-close" type="button" aria-label="Đóng bản đồ làng" autofocus>×</button></dialog>');
  const villageMapDialog=$('villageMapDialog'),mapControls=createVillageMapControls($('villageMapViewport'),$('villageMapCanvas'));
  $('closeVillageMap').onclick=()=>villageMapDialog.close();
  villageMapDialog.addEventListener('close',()=>{mapControls.reset();if(phase==='village-map')setPhase('explore');});
  const mapLaunch=document.createElement('button');mapLaunch.id='openVillageMap';mapLaunch.type='button';mapLaunch.textContent='BẢN ĐỒ KHU VỰC · N';mapLaunch.title='Mở bản đồ làng (N)';mapLaunch.onclick=openVillageMap;$('localMap').addEventListener('click',openVillageMap);root.querySelector('.journey-minimap>div>span').replaceWith(mapLaunch);
  $('closeEquipment').onclick=closeDialog;
  const equipmentButton=document.createElement('button');equipmentButton.id='openEquipment';equipmentButton.className='journey-equipment-launch';equipmentButton.innerHTML='Trang bị <kbd>V</kbd>';$('journeyHud').append(equipmentButton);equipmentButton.onclick=openEquipment;
  $('closeShop').onclick=closeDialog;$('shopEquipment').onclick=()=>{closeDialog();openEquipment();};
  const ammoHud=document.createElement('div');ammoHud.id='journeyAmmo';ammoHud.className='journey-ammo';root.querySelector('.journey-character>div:nth-child(2)').append(ammoHud);
  const progressButton=document.createElement('button');progressButton.id='openProgression';progressButton.className='journey-progression-launch';$('journeyHud').append(progressButton);progressButton.onclick=()=>openProgression();$('closeProgression').onclick=()=>closeDialog();
  root.querySelector('.journey-controls').innerHTML='<span><kbd>WASD</kbd> Đi · <kbd>W ×2 / ↑ ×2</kbd> Chạy</span><span><kbd>Space</kbd> Nhảy</span><span class="orbit-hint">Giữ chuột + kéo · Xoay camera</span><span><kbd>E</kbd> Tương tác</span><span><kbd>C</kbd> Tu luyện</span><span><kbd>V</kbd> Trang bị</span><span><kbd>N</kbd> Bản đồ làng</span>';
  function releaseLook(){const drag=cameraDrag;cameraDrag=null;canvas.classList.remove('camera-dragging');if(drag&&canvas.hasPointerCapture(drag.id))canvas.releasePointerCapture(drag.id);if(document.pointerLockElement===canvas)document.exitPointerLock?.();}
  function setPhase(next){if(loading&&next!=='transition'){loadingPhase=next;return;}if(next==='home'){$('heroName').value=save.hero.name;$('continueJourney').hidden=!stored;}if(next!=='dialog'){world.endDialogue();dialogue.reset();dialogueItem=null;}releaseLook();phase=next;if(next!=='explore'){$('landmarkIntro').hidden=true;$('nearbyAction').hidden=true;}held.clear();sprinting=false;mobileAutoRun=false;lastForwardTap=-Infinity;momentum.x=momentum.z=0;canvas.setAttribute('aria-label',['duel','combat'].includes(next)?'Đấu trường ninja 3D góc nhìn thứ nhất':'WASD di chuyển; nhấn giữ chuột trái hoặc phải rồi kéo để xoay camera; thả chuột để dừng xoay');document.body.dataset.journey=next;document.body.classList.toggle('adventure-view',!['duel','combat'].includes(next));$('journeyHome').hidden=next!=='home';$('journeyHud').hidden=!['explore','atlas','dialog','journal','progression','equipment','shop','admin','treatment'].includes(next);$('atlasScreen').hidden=next!=='atlas';$('adminScreen').hidden=next!=='admin';$('journeyDialog').hidden=next!=='dialog';$('journalScreen').hidden=next!=='journal';$('progressionScreen').hidden=next!=='progression';$('shopScreen').hidden=next!=='shop';$('equipmentScreen').hidden=next!=='equipment';if(next!=='village-map'&&villageMapDialog.open)villageMapDialog.close();if(next!=='equipment'&&inventoryPopup.open)inventoryPopup.close();if(next!=='shop'&&$('shurikenPurchase').open)$('shurikenPurchase').close();root.hidden=['duel','combat','loadout'].includes(next);const back=document.querySelector('.adventure-back');if(back){back.hidden=retreatLocked();back.style.display=retreatLocked()?'none':'';}if(next==='explore')focusGame();}
  function toast(message){$('journeyToast').textContent=message;$('journeyToast').hidden=false;toastTimer=4.5;}
  function updateCompanionTreatmentUI(){const label=Math.max(0,Math.ceil(treatmentRemaining-1e-7))+' giây';if($('companionTreatmentTime').textContent!==label)$('companionTreatmentTime').textContent=label;}
  function stopClinicTreatment(){world.stopTreatment();$('companionTreatmentPanel').hidden=true;setPhase('explore');persist();refresh();}
  $('cancelCompanionTreatment').onclick=stopClinicTreatment;
  let mapTransfer=null,mineCooldown=0;
  const transition=document.createElement('div');transition.id='journeyLoading';transition.className='journey-map-transition';transition.hidden=true;transition.tabIndex=-1;
  transition.innerHTML='<div class="journey-loading-card"><span class="journey-loading-spinner" aria-hidden="true"></span><div role="status" aria-live="polite"><strong id="journeyLoadingTitle"></strong><p>Đang chuẩn bị cảnh và nhân vật…</p></div><button class="journey-primary" hidden>Tải lại trò chơi</button></div>';
  document.body.append(transition);
  transition.querySelector('button').onclick=()=>location.reload();
  // Let the browser paint the overlay before synchronous scene construction starts.
  const paintLoading=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  async function runLoading(title,task){
    if(loading)return false;
    loading=true;loadingPhase='explore';setPhase('transition');
    root.inert=true;canvas.inert=true;root.setAttribute('aria-busy','true');
    $('journeyLoadingTitle').textContent=title;transition.hidden=false;transition.focus();
    const started=performance.now();
    try{
      await paintLoading();
      const result=await task();
      const [charactersReady]=await Promise.all([world.charactersReady(),gameAudio.preloadMusic(save.village)]);
      if(!charactersReady)throw new Error('Character model loading failed');
      // Render the destination behind the overlay, including its first GPU upload.
      await paintLoading();
      const remaining=180-(performance.now()-started);if(remaining>0)await new Promise(resolve=>setTimeout(resolve,remaining));
      loading=false;root.inert=false;canvas.inert=false;root.removeAttribute('aria-busy');
      setPhase(loadingPhase);transition.hidden=true;
      if(openingPending){openingPending=false;opening.start(heroSpeaker(save));}
      if(phase!=='explore'&&phase!=='boarding'&&phase!=='opening')root.querySelector('section:not([hidden]) button:not([hidden]):not(:disabled)')?.focus();
      return result;
    }catch(error){
      console.error('Journey loading failed',error);
      $('journeyLoadingTitle').textContent='Không thể tải khu vực. Hãy tải lại trò chơi.';
      transition.querySelector('p').hidden=true;transition.querySelector('.journey-loading-spinner').hidden=true;
      const retry=transition.querySelector('button');retry.hidden=false;retry.focus();
      root.removeAttribute('aria-busy');return false;
    }
  }
  // Block shortcuts as well as pointer input while the destination is incomplete.
  for(const type of ['keydown','keyup','pointerdown','pointerup','click','wheel'])window.addEventListener(type,event=>{
    if(phase==='boarding'){event.preventDefault();event.stopImmediatePropagation();return;}
    if(loading&&(!transition.contains(event.target)||type==='keydown'||type==='keyup')){if(event.target===transition.querySelector('button')&&!event.target.hidden&&['Enter',' '].includes(event.key)){event.preventDefault();event.stopImmediatePropagation();if(type==='keydown'&&!event.repeat)event.target.click();return;}event.preventDefault();event.stopImmediatePropagation();}
  },{capture:true,passive:false});
  function transferMap(item){
    if(phase!=='explore'||loading)return;
    const entering=item.kind==='interior-enter',title=entering?INTERIORS[item.id]?.title:village(save.village).name;if(!title)return;
    const standing=world.safeSave();mapTransfer={entering,id:item.id};
    return runLoading('Đang tới '+title+'…',()=>{
      const ok=entering?enterInterior(save,item.id,standing):leaveInterior(save);
      if(ok){enter();toast(world.interior?'Đã vào '+world.interior.title+' · Nhấn E tại lối ra để trở về':'Đã trở lại '+village(save.village).name);}
      else setPhase('explore');
      mapTransfer=null;return ok;
    });
  }
  function findJourneyItem(kind,id){if(kind==='boss'&&guardianOrdered(save))kind='npc';const direct=world.interactives.find(i=>i.kind===kind&&(!id||i.id===id));if(direct)return direct;if(world.interior)return world.interactives.find(i=>i.kind==='interior-exit');if(save.village==='wood'){const room=kind==='arena-host'||kind==='tournament-board'?'wood-tournament':kind==='npc'||id==='wood-chief'||kind==='village-event'&&currentVillageEvent(save)?.interior==='wood-arena'?'wood-arena':null;if(room)return world.interactives.find(i=>i.kind==='interior-enter'&&i.id===room);}if(kind==='village-event'&&currentVillageEvent(save)?.interior)return world.interactives.find(i=>i.kind==='interior-enter'&&i.id===currentVillageEvent(save).interior);if(kind==='npc'||id===save.village+'-chief')return world.interactives.find(i=>i.kind==='interior-enter'&&i.id===save.village+'-council-hall');const zone=REGIONS[save.village].zones.find(z=>z.id===id),person=REGIONS[save.village].npcs.find(p=>p.id===id),room=interiorForZone(save.village,zone?.id||person?.landmark);return room?world.interactives.find(i=>i.kind==='interior-enter'&&i.id===room):null;}
  function arenaDialog(){
    dialogueItem=null;const match=pendingTournamentMatch(save.arena);
    if(match){const opponent=match.a==='nameless'?match.b:match.a;dialog('TRỌNG TÀI · GIẢI ĐẤU TRƯỜNG HỌC',TOURNAMENT_ROUNDS[match.round],`Trận tiếp theo: ${save.hero.name} gặp ${tournamentName(opponent,save)}. Bắt đầu đầy máu, cấm bình thuốc. Thông số đối thủ ngang bằng bạn; lướt G hồi 10 giây.`,[['Vào trận',()=>offerBattle('arena',{...encounterProfile(save,'arena',opponent),village:opponent,element:opponent,name:'Đại diện '+tournamentName(opponent,save),tournamentRun:save.arena.run,tournamentMatch:match.id})],['Xem bảng thi đấu',()=>tournamentBoard.open(save),true],['Để lúc khác',closeDialog,true]]);return;}
    const ended=save.arena.status!=='idle';dialog('TRỌNG TÀI · GIẢI ĐẤU TRƯỜNG HỌC',ended?'Đăng ký lượt thi đấu mới':'Đăng ký thi đấu','Tám đại diện từ Vô Danh, Hỏa, Thủy, Lôi, Phong, Thổ, Mộc và Băng bốc thăm chia cặp. Hai người 2–0 vào bán kết; bốn người 1–1 tranh hai vé còn lại. Thắng bán kết sẽ vào chung kết. Mỗi trận bắt đầu đầy máu, cấm dùng bình thuốc.',[[ended?'Đăng ký lại · Bốc thăm từ đầu':'Đăng ký và bốc thăm',()=>{if(registerTournament(save)){refreshStory();arenaDialog();}}],['Xem bảng thi đấu',()=>tournamentBoard.open(save),true],['Để lúc khác',closeDialog,true]]);
  }
  function persist({checkpointPoint=null}={}){
    const safe=world.safeSave();save.position=safe.position;save.surface=safe.surface;save.elevation=safe.elevation;save.worldRevision=3;
    if(admin.active){$('journeySaved').textContent='Admin · Không lưu tiến trình';saveTimer=0;return false;}
    const output=checkpointPoint?{...save}:save;if(checkpointPoint)captureCheckpoint(output,checkpointPoint);
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(output));if(checkpointPoint){save.checkpoint=output.checkpoint;save.checkpointSave=output.checkpointSave;}stored=save;$('journeySaved').textContent='Đã lưu';storageFailed=false;}
    catch{storageFailed=true;$('journeySaved').textContent='Chưa lưu được';}
    saveTimer=0;return !storageFailed;
  }
  let landmarkNotices=[],landmarkNoticeTimer=0;
  function renderLandmarkIntroduction(){
    const intro=landmarkNotices[0],panel=$('landmarkIntro');panel.hidden=phase!=='explore'||!intro;
    if(intro&&panel.dataset.landmark!==intro.id){panel.dataset.landmark=intro.id;panel.innerHTML=`<button type="button" class="landmark-intro-close" aria-label="Đóng giới thiệu địa danh">×</button><strong>${esc(intro.name)}</strong><span>${esc(intro.description)}</span>`;}
  }
  $('landmarkIntro').onclick=e=>{
    if(!e.target.closest('.landmark-intro-close'))return;
    e.stopPropagation();landmarkNotices.shift();landmarkNoticeTimer=landmarkNotices.length?7:0;
    renderLandmarkIntroduction();$('nearbyAction').hidden=phase!=='explore'||!!landmarkNotices.length||!nearest();focusGame();
  };
  function enter(persistSave=true,{reuseWorld=false,preserveHero=true}={}){if(admin.active&&adminObjectiveVillage!==save.village)save.story.trackedQuest=null;adminObjectiveVillage=admin.active?save.village:null;landmarkNotices=[];landmarkNoticeTimer=0;$('landmarkIntro').hidden=true;recordCampaignVisit(save);path=[];journeyLegs=[];automaticJourney=false;action=null;waypoint=null;waypointSource='campaign';waypointVia=null;momentum.x=momentum.z=0;setPhase('explore');onLoadJourney(save.learnedSpells);if(!reuseWorld||!world.resume(save.village,save,{preserveHero}))world.load(save.village,save);refresh();if(persistSave)persist();}
  function refreshStory({rebuildWorld=false}={}){path=[];journeyLegs=[];automaticJourney=false;action=null;setPhase('explore');onLoadJourney(save.learnedSpells);if(rebuildWorld)world.load(save.village,save,{preserveHero:true});else world.syncSidequests(save);world.syncVillageEvents(save);refresh();persist();}
  function refresh(){const v=village(save.village);document.body.style.setProperty('--biome',v.color);$('villageName').textContent=world.interior?.title||v.name;$('villageGlyph').textContent=v.glyph;$('checkpointText').textContent='Hồi sinh · '+village(save.checkpoint).name;$('journeyHeroName').textContent=save.hero.name;$('journeyHeroLevel').textContent=`Bậc ${1+Math.floor(save.xp/150)} · ${save.xp} kinh nghiệm`;$('journeyGold').textContent=(admin.active?'∞':save.gold)+' xu';
    world.hero.setEquipment(equipmentState(save));refreshAmmunition();
    const objective=campaignObjective(save,{localOnly:admin.active});$('campaignTitle').textContent=objective.title;$('campaignSummary').textContent=objective.title;$('campaignDescription').textContent=objective.description;
    $('campaignChapter').textContent=campaignChapter(save)+(objective.storyStep?' · '+objective.storyStep+'/'+objective.storyTotal:'');$('campaignTrack').textContent=objective.targetKind==='complete'?'Xem hành trình đã đi qua ↗':'Đánh dấu mục tiêu ↗';
    const roles={'spirit-ore':'KHAI THÁC','interior-enter':'CỬA VÀO','interior-exit':'LỐI RA',military:'KHU QUÂN SỰ',school:'TRƯỜNG HỌC',clinic:'TRẠM Y TẾ','arena-host':'VÕ ĐƯỜNG','village-event':'SỰ KIỆN CHÍNH',companion:'BẠN ĐỒNG HÀNH','story-witness':'NGƯỜI CẦN GIÚP','intro-guardian':'HỘ VỆ BỊ PHÁ HỎNG','village-guard':'CẢNH VỆ','sidequest-target':'VIỆC CƯ DÂN',roamer:'TRĂNG KHUYẾT',home:'QUÊ NHÀ',shop:'THƯƠNG HỘI',dock:'BẾN THUYỀN',gate:'CỔNG LÀNG',save:'ĐIỂM HỒI SINH',quest:'NHIỆM VỤ',npc:'TRƯỞNG LÀNG',mentor:'CAO NHÂN · TRUYỀN THỤ',lore:'CƯ DÂN',healer:'Y SƯ',boss:'THỦ LĨNH KHU VỰC',landmark:'ĐỊA DANH',treaty:'HỘI NGHỊ BA LÀNG',envoy:'SỨ GIẢ HÒA BÌNH',traversal:'BẾN BÈ / ĐƯỜNG LEO','expedition-giver':'NHIỆM VỤ LEO NÚI','expedition-goal':'VẬT PHẨM NHIỆM VỤ'};
    $('worldLabels').innerHTML=world.interactives.filter(i=>!i.depleted&&i.id!=='fire-dan'&&(i.kind!=='boss'||admin.active||!save.bosses[v.id])).map(i=>`<button class="world-label ${i.kind}" data-world="${world.interactives.indexOf(i)}"><small>${i.guardRole==='guardian'?'HỘ VỆ LINH THÚ':roles[i.kind]||'KHÁM PHÁ'}</small><span>${i.kind==='dock'?'⚓':i.kind==='gate'?'↗':i.kind==='save'?'◇':i.kind==='quest'||i.kind==='boss'?'⚔':i.kind==='mentor'?'✧':i.kind==='landmark'?'⌖':i.kind==='clinic'?'+':'!'} ${esc(i.label)}</span></button>`).join('');
    const stats=combatStats(save.progression);$('journeyHeroLevel').textContent=`${Math.ceil(stats.maxHp*(save.healthFraction??1))} / ${stats.maxHp} máu · ${stats.maxChakra.toFixed(0)} mana`;
    $('journeyCompanionHealth').hidden=!companionPresent(save);$('journeyCompanionHealth').textContent=companionUnconscious(save)?'Hạ Ly · Bất tỉnh · Đang bế · Tốc độ −30%':'Hạ Ly · '+Math.ceil(save.story.companion.hp)+' / '+save.story.companion.maxHp+' máu';
    progressButton.innerHTML=`Tu luyện <kbd>C</kbd><span>${remainingPoints(save.progression)} điểm chung</span>`;
    root.querySelectorAll('[data-world]').forEach(b=>b.onclick=()=>{const item=world.interactives[Number(b.dataset.world)];if(item.kind==='tournament-board')tournamentBoard.open(save);else moveToItem(item);});updateSidequestHUD();updateDiscoveries();updateMinimap(true);if(waypointSource==='campaign'||waypointSource==='sidequest')refreshObjectiveMarker();
  }
  function retreatLocked(){return !admin.active&&requiresGuardBattle(save,encounter);}
  function awardCombatExperience(amount,victimId='primary'){const element=combatExperienceElement(encounter,victimId);return element?awardExperience(element,amount):null;}
  function awardExperience(element,amount){const reward=gainExperience(save.progression,element,amount);if(reward&&reward.level>reward.before){refresh();toast(`Hệ ${elementName(element)} đạt cấp ${reward.level} · +${reward.points} điểm thuộc tính chung`);}return reward;}
  const elementName=id=>globalThis.SealGameCore.elements.find(e=>e.id===id)?.name||id;
  function refreshAmmunition(){const s=equipmentState(save);$('journeyAmmo').textContent=s.shuriken.name+' · '+s.available+' chọn · '+s.count+' · Túi '+s.bag.capacity;}
  function openShop(){if(!['explore','shop'].includes(phase))return;path=[];action=null;world.destination.visible=false;setPhase('shop');renderShop();}
  function renderShop(){
    $('shopGold').textContent=(save.gold===Infinity?'∞':save.gold)+' xu';$('shopBody').innerHTML=shopContent(save,shopTab);$('shopBody').scrollTop=0;fillGearIcons($('shopBody'));
    root.querySelectorAll('[data-shop-tab]').forEach(b=>b.onclick=()=>{shopTab=b.dataset.shopTab;renderShop();});
    root.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{if(shurikenById(b.dataset.buy)){openShurikenPurchase(b.dataset.buy);return;}const result=buyEquipment(save,b.dataset.buy);if(result.ok){persist();refresh();renderShop();$('shopFeedback').textContent='Đã mua · '+result.item.name;}else $('shopFeedback').textContent=result.reason;});
    const upgrade=$('shopBody').querySelector('[data-upgrade-flask]');if(upgrade)upgrade.onclick=()=>{const r=upgradeFlask(save);if(r.ok){persist();refresh();renderShop();$('shopFeedback').textContent='Đã nâng cấp bình thuốc';}else $('shopFeedback').textContent=r.reason;};
    const supply=$('emergencySupply');if(supply)supply.onclick=()=>{if(emergencySupply(save)){persist();refresh();renderShop();$('shopFeedback').textContent='Đã nhận 10 phi tiêu sắt. Nhớ dùng Thủy Bộc Phá Không để tiết kiệm đạn.';}};
  }
  function openShurikenPurchase(id){
    const item=shurikenById(id),max=maxShurikenPurchase(save,id);if(!item||max<1)return;
    const popup=$('shurikenPurchase'),slider=$('purchaseQuantity');$('purchaseTitle').textContent=item.name;slider.max=max;slider.value=Math.min(10,max);$('purchaseFeedback').textContent='';
    const update=()=>{$('purchaseCount').textContent=slider.value+' / '+max;$('purchaseCost').textContent=shurikenPrice(item,Number(slider.value))+' xu';};
    $('purchaseLimit').textContent='Tối đa '+max+' chiếc theo số xu và chỗ trống trong túi (mỗi lần tối đa 50).';slider.oninput=update;update();
    $('cancelPurchase').onclick=()=>popup.close();$('confirmPurchase').onclick=()=>{const result=buyEquipment(save,id,Number(slider.value));if(!result.ok){$('purchaseFeedback').textContent=result.reason;return;}popup.close();persist();refresh();renderShop();$('shopFeedback').textContent='Đã mua '+result.quantity+' · '+item.name+' · '+result.price+' xu';};popup.showModal();
  }
  function openInventoryItem(kind,id,origin){
    const detail=inventoryItemDetails(save,kind,id);if(!detail)return;
    inventoryReturnFocus=origin;$('inventoryItemTitle').textContent=detail.title;$('inventoryItemBody').innerHTML=detail.html;fillGearIcons($('inventoryItemBody'));
    const use=$('inventoryItemUse');use.hidden=!detail.action;use.disabled=detail.equipped;use.textContent=detail.equipped?'Đang sử dụng':detail.action==='progression'?'Mở tu luyện':'Sử dụng';
    use.onclick=()=>{if(detail.action==='progression'){inventoryPopup.close();openProgression();return;}if(equipItem(save,kind,id)){inventoryPopup.close();persist();refresh();openEquipment();$('equipmentBody').querySelector('[data-slot="'+kind+'"]')?.focus();}};
    inventoryPopup.showModal();
  }
  function openEquipment(){
    if(!['explore','equipment','progression','shop'].includes(phase))return;path=[];action=null;world.destination.visible=false;setPhase('equipment');
    $('equipmentBody').innerHTML=equipmentPanel(save)+inventoryPanel(save);heroPreview.show($('heroPreview'),equipmentState(save));fillGearIcons($('equipmentBody'));
    $('equipmentBody').querySelectorAll('[data-wear]').forEach(tile=>tile.onclick=()=>openInventoryItem(tile.dataset.kind,tile.dataset.wear,tile));
    $('equipmentBody').querySelectorAll('[data-loot]').forEach(tile=>tile.onclick=()=>openInventoryItem('quest',tile.dataset.loot,tile));
    $('equipmentBody').querySelectorAll('[data-inventory-book]').forEach(tile=>tile.onclick=()=>openInventoryItem('book',tile.dataset.inventoryBook,tile));
    $('equipmentBody').querySelectorAll('[data-treaty]').forEach(tile=>tile.onclick=()=>{const treaty=save.story.treaties.find(t=>t.id===tile.dataset.treaty);if(treaty){resetMovement();setPhase('peace-ceremony');peaceCeremony.view(treaty,village(treaty.village),()=>{setPhase('equipment');openEquipment();$('equipmentBody').querySelector('[data-treaty="'+treaty.id+'"]').focus();});}});
    $('findVillageShop').onclick=()=>{closeDialog();moveToItem(world.interactives.find(i=>i.kind==='shop'));};
  }
  function trainingSystem(element,p,open){
    const level=systemLevel(p,element),xp=p.xp[element]||0,prev=LEVEL_XP[Math.max(0,level-1)],next=LEVEL_XP[level],arts=Object.keys(SKILL_LEVELS[element]).sort((a,b)=>requiredLevel(a)-requiredLevel(b));
    const available=arts.filter(id=>p.books.includes(id)&&canLearn(p,id)&&!save.learnedSpells.includes(id)).length;
    return `<details class="system-card" data-system="${element}" ${open?'open':''}><summary><span><b>${elementName(element)}</b> - Cấp ${level}/10 - Có thể học <strong>${available}</strong> chiêu.</span></summary><div class="system-content"><small>${level===0?'Tìm cao nhân để khai mở':level===10?'Đã đạt cấp tối đa':`${Math.floor(xp-prev)} / ${next-prev} kinh nghiệm tới cấp ${level+1}`}</small><div class="system-xp"><i style="width:${level===10?100:level?Math.min(100,(xp-prev)/(next-prev)*100):0}%"></i></div>${arts.map(id=>{const known=save.learnedSpells.includes(id),book=p.books.includes(id),eligible=canLearn(p,id);return `<div class="system-art"><span><b>${esc(spellName(id))}</b><small>Cần cấp ${requiredLevel(id)} · ${known?'Đã học':book?'Có sách':eligible?'Cần sách thưởng nhiệm vụ':'Chưa đủ cấp'}</small></span>${known?'<em>✓</em>':book?`<button data-book="${id}" ${eligible?'':'disabled'}>Học từ sách</button>`:'<em>○</em>'}</div>`;}).join('')}</div></details>`;
  }
  function openProgression(){if(!['explore','progression','equipment'].includes(phase))return;path=[];action=null;world.destination.visible=false;setPhase('progression');const p=save.progression,stats=combatStats(p),openSystems=new Set([...$('progressionBody').querySelectorAll('[data-system][open]')].map(el=>el.dataset.system));
    $('progressionBody').innerHTML=`<div class="attribute-heading">ĐIỂM THUỘC TÍNH CHUNG <strong id="attributePoints">${remainingPoints(p)}</strong></div><div class="attribute-grid">${[['health','Sinh lực',`${stats.maxHp} máu`,`+${ATTRIBUTE_GAINS.health} máu / điểm`],['strength','Sức mạnh',`+${p.attributes.strength*ATTRIBUTE_GAINS.strength}% sát thương`,`+${ATTRIBUTE_GAINS.strength}% sát thương gốc / điểm`],['mana','Mana',`${stats.maxChakra.toFixed(0)} mana · ${stats.chakraRegen.toFixed(1)} mana/giây`,`+${ATTRIBUTE_GAINS.mana} mana và +${ATTRIBUTE_GAINS.manaRegen} mana/giây / điểm`]].map(([id,name,value,desc])=>`<div class="attribute-card"><small>${name} · ${p.attributes[id]} lần nâng</small><strong>${value}</strong><p>${desc}</p><button data-upgrade="${id}" ${remainingPoints(p)?'':'disabled'}>Nâng cấp +</button></div>`).join('')}</div><p class="progression-formula">Máu = 300 + ${ATTRIBUTE_GAINS.health} × số lần nâng · Sát thương = gốc × (1 + ${ATTRIBUTE_GAINS.strength} × số lần nâng sức mạnh/100) · Mana = 100 + ${ATTRIBUTE_GAINS.mana} × số lần nâng mana; hồi mana = 5 + ${ATTRIBUTE_GAINS.manaRegen} × số lần nâng mana mỗi giây. Mỗi hệ tối đa cấp 10; mọi chiêu chỉ yêu cầu cấp 1–5.</p><div class="system-grid">${SYSTEMS.map(element=>trainingSystem(element,p,openSystems.has(element))).join('')}</div>`;
    $('progressionBody').innerHTML='<div class="training-stats">'+$('progressionBody').innerHTML+'</div>';
    root.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>{if(spendPoint(p,b.dataset.upgrade)){persist();refresh();openProgression();}});
    root.querySelectorAll('[data-book]').forEach(b=>b.onclick=()=>{if(learnFromBook(save,b.dataset.book)){onLearn(b.dataset.book);persist();refresh();openProgression();toast('Đã học từ sách · '+spellName(b.dataset.book));}});
  }
  const discovered=z=>save.discoveries.includes(`${save.village}:${z.id}`);
  const spellName=id=>globalThis.SealGameCore.spells.find(s=>s.id===id)?.name||id;
  function updateDiscoveries(){const r=REGIONS[save.village];
    $('discoveryCount').textContent=`${r.zones.filter(discovered).length} / ${r.zones.length}`;
  }
  function openVillageMap(){
    if(phase!=='explore'||loading||world.riding)return;resetMovement();path=[];journeyLegs=[];automaticJourney=false;action=null;world.destination.visible=false;
    const id=save.village,civic=planVillageCivic(id),position=world.interior?save.interior.returnPosition:[world.hero.root.position.x,world.hero.root.position.z],map=villageMapMarkup({id,region:REGIONS[id],limit:regionMetrics(id).limit,gates:world.interior?planVillageExits(village(id),village):world.gates,civic,clinics:world.clinics,routes:world.routes,hero:{x:position[0],z:position[1]}});
    villageMapDialog.setAttribute('aria-label',village(id).name);$('villageMapCanvas').innerHTML=map.svg;
    setPhase('village-map');villageMapDialog.showModal();mapControls.reset();
  }
  function updateMinimap(force=false){if(!force&&time<minimapAt)return;minimapAt=time+.12;const p=world.hero.root.position,r=REGIONS[save.village],limit=world.metrics.limit,scale=world.metrics.scale;
    if(world.interior){const room=world.interior,b=room.bounds;$('localMap').setAttribute('viewBox',(-b.x-3)+' '+(b.minZ-3)+' '+(b.x*2+6)+' '+(b.maxZ-b.minZ+6));$('localMap').innerHTML='<rect x="'+(-b.x)+'" y="'+b.minZ+'" width="'+(b.x*2)+'" height="'+(b.maxZ-b.minZ)+'" rx="2" fill="#52665a40" stroke="#c6b78b" stroke-width=".6"/>'+(room.id==='wood-tournament'?'<circle r="13" fill="#bda87850" stroke="#e1c584" stroke-width=".4"/>':'')+world.solids.filter(s=>s.name==='mine-partition').map(s=>'<rect x="'+(s.x-s.w/2)+'" y="'+(s.z-s.d/2)+'" width="'+s.w+'" height="'+s.d+'" fill="#abb18c80"/>').join('')+world.interactives.filter(i=>i.kind!=='companion'&&!i.depleted).map(i=>'<circle cx="'+i.x+'" cy="'+i.z+'" r="1" fill="'+(i.kind==='interior-exit'?'#9bddc5':'#ead9a2')+'"/>').join('')+'<circle cx="'+p.x+'" cy="'+p.z+'" r="1.4" fill="#f9e5b8"/>';return;}
    $('localMap').setAttribute('viewBox',`${-limit-4} ${-limit-4} ${limit*2+8} ${limit*2+8}`);
    const canals=save.village==='water'?waterMapMarkup((x,z)=>({x,y:z}))+waterFerryMapMarkup(world.routes,(x,z)=>({x,y:z})):'';
    $('localMap').innerHTML=`<rect x="${-limit}" y="${-limit}" width="${limit*2}" height="${limit*2}" rx="12" fill="#596d6020"/>${(save.village==='water'?[]:[0]).map(()=>{const points=[];for(let z=-limit;z<=limit;z+=4)points.push(`${riverAt(save.village,z).x},${z}`);return `<polyline points="${points.join(" ")}" fill="none" stroke="#7db5c5" stroke-opacity=".5" stroke-width="${riverAt(save.village,0).width*2}"/>`;}).join('')}${world.routes.filter(()=>save.village!=='water').map(route=>`<path d="M${route.from.join(" ")}L${route.to.join(" ")}" fill="none" stroke="#e9c98b" stroke-width="${1.2*scale}" stroke-dasharray="3 2"/><circle cx="${route.from[0]}" cy="${route.from[1]}" r="${2.3*scale}" fill="#dfc58c"/>`).join('')}${canals}${r.zones.filter(z=>z.platform!=='earth-cave').map(z=>`<circle cx="${z.x}" cy="${z.z}" r="${z.radius}" fill="${discovered(z)?'#a9d5ad22':'#98a8c010'}" stroke="${discovered(z)?'#a9d5ad77':'#98a8c033'}" stroke-width=".6"/><text x="${z.x}" y="${z.z+1}" text-anchor="middle" fill="#d8d9bf" font-size="4">${discovered(z)?'◇':'?'}</text>`).join('')}<circle r="9" fill="#c8b68b35"/>${world.gates.map(g=>`<g><title>${esc(g.label)}</title>${g.kind==='dock'?`<text x="${g.x}" y="${g.z+2}" text-anchor="middle" fill="#a9e4ef" font-size="7">⚓</text>`:`<circle cx="${g.x}" cy="${g.z}" r="2.7" fill="${village(g.id).color}"/>`}</g>`).join('')}${world.obstacles.map(o=>`<rect x="${o.x-o.w}" y="${o.z-o.d}" width="${o.w*2}" height="${o.d*2}" rx=".5" fill="#b9bfa73a"/>`).join('')}${world.interactives.filter(i=>['save','mentor','boss','npc','village-event','companion','interior-enter','school','clinic','military'].includes(i.kind)&&(i.kind!=='boss'||admin.active||!save.bosses[save.village])).map(i=>`<text x="${i.x}" y="${i.z}" fill="${i.kind==='boss'?'#ed9b86':i.kind==='mentor'?'#b7dcf4':'#e8cf96'}" font-size="5" text-anchor="middle">${i.kind==='boss'?'⚔':i.kind==='mentor'?'✧':i.kind==='village-event'?'★':i.kind==='companion'?'♥':'◇'}</text>`).join('')}${path.length?`<polyline points="${[[p.x,p.z],...path].map(p=>p.join(',')).join(' ')}" fill="none" stroke="#ead6a5" stroke-width=".8" stroke-dasharray="2 2"/>`:''}<circle cx="${p.x}" cy="${p.z}" r="3" fill="#f9e5b8" stroke="#263c40" stroke-width="1"/>`;
    const store=world.interactives.find(i=>i.kind==='shop'),size=world.metrics.scale*5;if(store)$('localMap').insertAdjacentHTML('beforeend','<g><title>'+esc(store.label)+'</title><rect x="'+(store.x-size/2)+'" y="'+(store.z-size/2)+'" width="'+size+'" height="'+size+'" fill="#e4a66b" stroke="#304d4c" stroke-width=".8"/></g>');
  }
  function openJournal(){if(phase!=='explore')return;path=[];action=null;world.destination.visible=false;setPhase('journal');const v=village(save.village),r=REGIONS[v.id],mentor=r.npcs.find(n=>n.kind==='mentor');
    const journalOpen=new Map([...$('journalBody').querySelectorAll('[data-journal-group]')].map(el=>[el.dataset.journalGroup,el.open]));
    $('journalTitle').textContent='Nhật ký';
    $('journalBody').innerHTML=`<div class="journal-zones">${r.zones.map(z=>`<button data-zone="${z.id}" class="journal-zone ${discovered(z)?'found':''}"><small>${discovered(z)?'◇ ĐÃ KHÁM PHÁ':'⌖ ĐỊA DANH CHƯA ĐẾN'}</small><strong>${esc(z.name)}</strong><p>${esc(z.description)}</p><span>Theo đường tới đây ↗</span></button>`).join('')}</div>${r.mentor&&mentor?`<div class="journal-story"><small>NHIỆM VỤ LÀNG · KỲ NGỘ · ${save.mentors[v.id]?'ĐÃ NHẬN THƯỞNG':mentorReady(save,v.id)?'TRỞ VỀ NHẬN THƯỞNG':save.lessons[v.id]?'ĐANG THỰC HIỆN':'CHƯA NHẬN'}</small><h3>${esc(spellName(r.mentor.spellId))}</h3><p>Phần thưởng: ${esc(spellName(r.mentor.spellId))} · Cần hệ cấp ${requiredLevel(r.mentor.spellId)} · ${save.learnedSpells.includes(r.mentor.spellId)?'Đã học':save.progression.books.includes(r.mentor.spellId)?'Sách trong hành trang':'Lĩnh hội hoặc nhận sách khi hoàn thành'}.</p><p>${esc(r.mentor.clue)} ${r.mentor.zoneIds.map(id=>{const z=r.zones.find(z=>z.id===id);return `${discovered(z)?'✓':'○'} ${z.name}`;}).join(' · ')}</p><button id="journalMentor" class="journey-secondary">Tìm ${esc(mentor.name)} ↗</button></div>`:""}`;
    const work=document.createElement('div');work.className='journal-zones';work.innerHTML=villageSidequests(v.id).map(q=>'<button class="journal-zone" data-sidequest="'+q.id+'"><small>'+(['CHƯA NHẬN','ĐANG LÀM','TRỞ VỀ NHẬN THƯỞNG','ĐÃ XONG'][save.story.sidequests[q.id]||0])+' · '+esc(q.giverName)+'</small><strong>'+esc(q.title)+'</strong><p>'+esc(q.description)+'</p><span>'+((reward)=>reward.scroll?'Cuộn giấy '+esc(spellName(reward.scroll)):reward.gold+' xu')(sidequestReward(save,q))+'</span></button>').join('');$('journalBody').prepend(work);work.querySelectorAll('[data-sidequest]').forEach(b=>b.onclick=()=>{const q=villageSidequests(v.id).find(q=>q.id===b.dataset.sidequest);if((save.story.sidequests[q.id]||0)===3){closeDialog();moveToItem(findQuestGiver(q));return;}markSidequest(q);closeDialog();});
    const chapter=campaignObjective(save,{localOnly:admin.active}),progress=document.createElement('div');progress.className='journal-campaign';progress.innerHTML=`<small>BIÊN NIÊN SỬ · ${esc(chapter.title)}</small><p>${esc(chapter.description)}</p><div class="campaign-milestones">${PLOT.chapters.map((name,i)=>{const done=i===0?save.campaign.treatySigned:i===1?['wind','earth','wood'].every(id=>plotVillageComplete(save,id)):i===2?['ice','light'].every(id=>plotVillageComplete(save,id)):i===3?plotVillageComplete(save,'dark'):villageEventComplete(save,'nameless');return `<span class="${done?'done':''}">${done?'\u2713':'\u25cb'} ${esc(name)}</span>`;}).join('')}</div><button id="journalCampaign" class="journey-secondary">Theo tuyến truyện chính ↗</button></div>`;$('journalBody').prepend(progress);
    const follow=i=>{closeDialog();moveToItem(i);};$('journalCampaign').onclick=()=>{closeDialog();followCampaign();};root.querySelectorAll('[data-zone]').forEach(b=>b.onclick=()=>follow(findJourneyItem('landmark',b.dataset.zone)));if($('journalMentor'))$('journalMentor').onclick=()=>follow(findJourneyItem('mentor'));
    const journal=$('journalBody'),zones=journal.querySelector('[data-zone]').parentElement,stories=[...journal.querySelectorAll('.journal-story')];
    const group=(key,label,count,nodes,defaultOpen=false)=>{
      const details=document.createElement('details');details.className='journal-group';details.dataset.journalGroup=key;details.open=journalOpen.get(key)??defaultOpen;
      const summary=document.createElement('summary');summary.innerHTML='<span>'+esc(label)+'</span><strong>'+esc(count)+'</strong>';details.append(summary);
      const content=document.createElement('div');content.className='journal-group-content';content.append(...nodes);details.append(content);return details;
    };
    const eventCards=Object.entries(VILLAGE_EVENTS).map(([id,event])=>{const card=document.createElement('article');card.className='journal-story';const step=villageEventStep(save,id);card.innerHTML='<small>'+esc(village(id).name)+' · '+(step===event.stages.length?'ĐÃ HOÀN THÀNH':step+'/'+event.stages.length)+'</small><h3>'+esc(event.title)+'</h3><ol>'+event.stages.map((s,i)=>'<li class="'+(i<step?'done':i===step?'current':'')+'">'+(i<step?'✓ ':'')+esc(s.title)+'</li>').join('')+'</ol>';if(id===save.village&&step<event.stages.length){const button=document.createElement('button');button.className='journey-secondary';button.textContent='Theo dấu câu chuyện trong làng ↗';button.onclick=()=>{closeDialog();moveToItem(findJourneyItem('village-event'));};card.append(button);}return group('event-'+id,village(id).name+' · '+event.title,step+'/'+event.stages.length,[card],id===save.village);});
    const tasks=[...work.querySelectorAll('[data-sidequest]')],taskGroups=[];
    for(const button of tasks){const status=save.story.sidequests[button.dataset.sidequest]||0;button.dataset.questStatus=status;button.classList.toggle('journal-quest-ready',status===2);button.classList.toggle('journal-quest-completed',status===3);}
    if(r.mentor&&mentor){const mentorTask=stories.shift();mentorTask.dataset.lesson=v.id;mentorTask.dataset.questStatus=save.mentors[v.id]?3:mentorReady(save,v.id)?2:save.lessons[v.id]?1:0;tasks.push(mentorTask);}
    for(const [status,label] of [[2,'Chờ báo lại · Nhận thưởng'],[1,'Đang làm'],[0,'Chưa nhận'],[3,'Đã hoàn thành']]){
      const buttons=tasks.filter(b=>Number(b.dataset.questStatus)===status);if(!buttons.length)continue;
      const list=document.createElement('div');list.className='journal-zones';list.append(...buttons);taskGroups.push(group('quests-'+status,label,buttons.length,[list],status===1||status===2));
    }
    work.className='journal-quest-groups';work.replaceChildren(...taskGroups);
    const villageChapters=group('village-events','Chuyện của các làng',Object.keys(VILLAGE_EVENTS).filter(id=>villageEventComplete(save,id)).length+'/'+Object.keys(VILLAGE_EVENTS).length,eventCards);
    journal.replaceChildren(group('campaign','Tuyến truyện chính',chapter.title,[progress,villageChapters],true),group('quests','Nhiệm vụ trong làng',tasks.length,[work],true),group('zones','Địa danh',r.zones.filter(discovered).length+'/'+r.zones.length+' đã khám phá',[zones]));

  }
  function sidequestById(id){for(const v of VILLAGES){const q=villageSidequests(v.id).find(q=>q.id===id);if(q)return q;}return null;}
  let boardingTarget=null;
  function departVillage(item){
    if(phase!=='explore'||loading||boardingTarget||!world.gates.includes(item))return false;
    if(item.kind==='dock'){
      persist();if(!world.beginBoarding(item))return false;
      boardingTarget=item.id;path=[];journeyLegs=[];action=null;automaticJourney=false;world.clearEnemy();
      setPhase('boarding');$('journeyTravel').hidden=false;$('journeyTravel').textContent='Đang lên thuyền · '+village(item.id).name;return true;
    }
    return arriveVillage(item.id);
  }
  function arriveVillage(target){
    $('journeyTravel').hidden=true;
    return runLoading('Đang tới '+village(target).name+'…',()=>{
      const old=save.village,from=village(old),next=village(target),a=Math.atan2(from.x-next.x,from.y-next.y),plan=planVillageCivic(target);
      const border=plan?civicGatePosition(plan,a):{x:Math.sin(a)*regionMetrics(target).arrivalRadius,z:Math.cos(a)*regionMetrics(target).arrivalRadius},byBoat=travelKind(old,target)==='dock',gate=byBoat?planVillageExits(next,village).find(g=>g.id===old):border;
      const length=Math.hypot(gate.x,gate.z),back=travelKind(old,target)==='dock'?0:6;
      save.village=target;save.interior=null;save.surface=null;save.elevation=null;save.position=[gate.x*(1-back/length),gate.z*(1-back/length)];
      if(!save.visited.includes(target))save.visited.push(target);
      world.clearEnemy();enter();cooldown=35;distance=0;
      if(byBoat){if(!world.beginHarborArrival(old))throw new Error('Destination harbor is missing');setPhase('boarding');$('journeyTravel').hidden=false;$('journeyTravel').textContent='Thuyền đang vào bến · '+next.name;}
      else toast(`Đã rời ${from.name} · ${next.title}`);return true;
    });
  }
  function gateToward(targetVillage){if(targetVillage===save.village)return null;const queue=[[save.village]],seen=new Set([save.village]);while(queue.length){const route=queue.shift(),last=route.at(-1);if(last===targetVillage)return world.gates.find(g=>g.id===route[1])||null;for(const id of village(last).links)if(!seen.has(id)&&travelAccess(id,{...save,village:last}).allowed){seen.add(id);queue.push([...route,id]);}}return null;}
  function campaignMarker(){
    const objective=campaignObjective(save,{localOnly:admin.active});
    if(world.interior)return (objective.targetVillage===save.village&&world.interactives.find(i=>i.kind===objective.targetKind&&(!objective.targetId||i.id===objective.targetId)))||world.interactives.find(i=>i.kind==='interior-exit')||null;if(objective.targetKind==='complete')return null;
    if(objective.targetVillage!==save.village)return gateToward(objective.targetVillage);
    if(objective.targetKind==='mentor'&&save.lessons[save.village]&&!mentorReady(save,save.village)&&!save.mentors[save.village]){const zone=REGIONS[save.village].mentor.zoneIds.find(id=>!save.discoveries.includes(`${save.village}:${id}`));return world.interactives.find(i=>i.kind==='landmark'&&i.id===zone)||null;}
    return findJourneyItem(objective.targetKind,objective.targetId)||null;
  }
  function setObjectiveMarker(item,source='campaign'){
    waypoint=item||null;waypointSource=source;waypointVia=null;if(!item){world.destination.visible=false;return;}
    // A marker is visual guidance, so it must never launch grid pathfinding.
    const ride=markerTraversal(world.hero.root.position,item,{id:save.village,surface:world.surface,routes:world.routes});if(ride)waypointVia=world.interactives.find(i=>i.kind==='traversal'&&i.routeId===ride.id&&i.side===ride.side)||null;
    const target=waypointVia||item;world.destination.position.set(target.x,(target.y??world.heightAt(target.x,target.z))+.12,target.z);
    const targetIsHaLy=item.id==='ha-ly-wounded'||(item.kind==='village-event'&&item.eventVillage==='fire'&&item.step!==0);world.destination.visible=!targetIsHaLy;
  }
  function refreshObjectiveMarker(){
    const id=save.story.trackedQuest,q=id&&sidequestById(id),status=q?save.story.sidequests[q.id]||0:0;
    if(q&&status<3){const target=world.interior?world.interactives.find(i=>i.kind==='interior-exit'):q.village!==save.village?gateToward(q.village):status===2?findQuestGiver(q):status===1?sidequestTarget(q):findQuestGiver(q);setObjectiveMarker(target,'sidequest');return;}
    if(id)save.story.trackedQuest=null;
    setObjectiveMarker(campaignMarker(),'campaign');
  }
  function markSidequest(q){if(!q||![0,1,2].includes(save.story.sidequests[q.id]||0))return false;save.story.trackedQuest=q.id;persist();updateSidequestHUD();refreshObjectiveMarker();return true;}
  function followCampaign(){if(phase!=='explore')return;const objective=campaignObjective(save,{localOnly:admin.active});save.story.trackedQuest=null;persist();if(world.interior&&!world.interactives.some(i=>i.kind===objective.targetKind)){moveToItem(findJourneyItem('interior-exit'),false,'campaign');toast('Ra ngoài để tiếp tục tuyến truyện chính');return;}if(objective.targetKind==='complete'){openJournal();return;}
    if(objective.targetVillage!==save.village){const gate=gateToward(objective.targetVillage);if(gate){moveToItem(gate,false,'campaign');return;}toast('Hãy hoàn thành chương hiện tại để mở con đường này.');return;}
    let kind=objective.targetKind;if(kind==='mentor'&&save.lessons[save.village]&&!mentorReady(save,save.village)&&!save.mentors[save.village]){const r=REGIONS[save.village],z=r.mentor.zoneIds.find(id=>!save.discoveries.includes(`${save.village}:${id}`));moveToItem(world.interactives.find(i=>i.kind==='landmark'&&i.id===z),false,'campaign');return;}moveToItem(findJourneyItem(kind,objective.targetId),false,'campaign');
  }
  function routeTo(point,item=null){const p=world.hero.root.position;if(world.interior){const path=findPath([p.x,p.z],point,world.blocked);return path.length?[{kind:'walk',path}]:Math.hypot(p.x-point[0],p.z-point[1])<.1?[]:null;}return planExpedition([p.x,p.z],point,{id:save.village,surface:world.surface,targetSurface:world.interior?null:item?.platform,routes:world.routes,walk:(a,b,key)=>findPath(a,b,world.navigationBlocked(key))});}
  function nextJourneyLeg(){if(path.length||world.riding||!world.physicsState().grounded)return;if(journeyLegs.length){const leg=journeyLegs.shift();if(leg.kind==='walk')path=leg.path;else if(!world.startTraversal(leg.id,leg.side)){journeyLegs=[];automaticJourney=false;action=null;}return;}if(automaticJourney){automaticJourney=false;world.destination.visible=false;const pending=action;action=null;if(pending&&itemDistance(pending)<2.3)interact(pending);else persist();}}
  function moveTo(point,item=null){if(phase!=='explore'||world.riding)return false;const legs=routeTo(point,item);if(!legs){toast('Địa hình chắn lối. Hãy tìm bến bè hoặc đường leo.');return false;}journeyLegs=legs;path=[];automaticJourney=true;action=item;nextJourneyLeg();world.destination.position.set(point[0],item?.y??world.heightAt(point[0],point[1])+.12,point[1]);world.destination.visible=true;return true;}
  function markWaypoint(item,source='manual'){waypoint=item;waypointSource=source;waypointVia=null;const plan=routeTo([item.x,item.z],item),ride=plan?.find(l=>l.kind==='traverse');if(ride)waypointVia=world.interactives.find(i=>i.kind==='traversal'&&i.routeId===ride.id&&i.side===ride.side);}
  function itemDistance(item){if(item.platform&&item.platform!==world.surface||!item.platform&&world.surface)return Infinity;const p=world.hero.root.position;if(item.kind==='shop'&&item.area){const a=item.area,x=Math.max(a.x1,Math.min(a.x2,p.x)),z=Math.max(a.z1,Math.min(a.z2,p.z));return Math.hypot(p.x-x,p.z-z,p.y-a.y);}return Math.hypot(p.x-item.x,p.z-item.z,p.y-(item.y??world.heightAt(item.x,item.z)));}
  function moveToItem(item,walk=false,source='manual'){if(phase!=='explore'||!item||world.riding)return;if(item.kind!=='landmark'&&itemDistance(item)<2){interact(item);return;}if(walk){moveTo([item.x,item.z],item);return;}path=[];journeyLegs=[];automaticJourney=false;action=null;markWaypoint(item,source);const target=waypointVia||item;world.destination.position.set(target.x,(target.y??world.heightAt(target.x,target.z))+.12,target.z);world.destination.visible=true;toast('Đã đánh dấu · '+item.label+(waypointVia?' · Tới '+waypointVia.label:item.kind==='landmark'?'':' · Dùng WASD để tới gần rồi nhấn E'));}
  function dialog(kicker,title,body,buttons,options={}){path=[];action=null;world.destination.visible=false;dialogue.reset();setPhase('dialog');$('dialogKicker').textContent=kicker;$('dialogTitle').textContent=title;$('dialogBody').textContent=body;$('dialogActions').replaceChildren();const gated=[];for(const [index,[label,fn,secondary]] of buttons.entries()){const locked=options.requireComplete&&!secondary,b=document.createElement('button');b.className=secondary?'journey-secondary':'journey-primary';b.textContent=label;b.disabled=!!locked;if(locked){gated.push(b);b.title='Hãy đọc hết cuộc đối thoại trước khi tiếp tục.';}b.onclick=()=>{if(locked&&!dialogue.complete)return;fn();};$('dialogActions').append(b);}const cast=dialogueCast(dialogueItem,save,REGIONS[save.village],village(save.village)),script=options.script||(cast&&conversationLines(dialogueItem,save,cast,body));if(script){world.stageDialogue(script.map(line=>line.speaker));dialogue.show(script,{allowSkip:!options.requireComplete,onComplete:()=>{for(const b of gated){b.disabled=false;b.removeAttribute('title');}}});}else{world.endDialogue();gameAudio.tone(350,.07,'sine',.025);}
    const q=dialogueItem&&questForNPC(save.village,dialogueItem);
    if(q&&!sidequestView){const b=document.createElement('button');b.className='journey-secondary';b.textContent=(save.story.sidequests[q.id]===2?'Nhận thưởng việc riêng':save.story.sidequests[q.id]===3?'Việc riêng đã hoàn thành':'Việc riêng · '+q.title);b.onclick=()=>sidequestDialog(q);$('dialogActions').append(b);}
  }
  function finishStoryStep(event,choiceIndex=0){
    if(event.sealTrace&&!admin.active&&!save.story.sealCore){toast('Hãy cứu Vô Danh Thú để nhận mảnh lõi ấn trước.');return;}
    if(event.sealTrace)world.senseSeal();
    const result=advanceVillageEvent(save,event.village,event.step,{choiceIndex});
    if(!result.ok){if(result.reason==='medicine'){toast(result.message);closeDialog();moveToItem(world.interactives.find(i=>i.kind==='expedition-giver'));}if(result.reason==='choice')dialog('DẤU VẾT CHƯA KHỚP',event.title,result.message,[['Xem lại tình hình',()=>storyEventDialog(world.interactives.find(i=>i.kind==='village-event'))]]);return;}
    refreshStory();toast(result.recruited?'Hạ Ly đã trở thành bạn đồng hành · Nàng sẽ đi cùng bạn qua các làng':result.completed?'Đã hoàn thành câu chuyện của làng · +45 xu':'Câu chuyện đã tiến triển · Theo dấu mục tiêu tiếp theo');
    if(result.recruited){dialogueItem=world.interactives.find(i=>i.kind==='companion');companionDialog(true);}
    if(result.separated)toast(event.village==='wood'?'Hạ Ly đi tìm cách cứu cây · Tới trường học đăng ký giải đấu':'Hạ Ly đã rời nhóm · Tiếp tục tới Làng Ám để tìm sự thật');
    if(result.reconciled)toast(event.village==='wood'?'Đã tụ họp với Hạ Ly · Trở xuống gốc cây để chữa trị':'Hạ Ly trở lại đồng hành · Quá khứ không bị xóa bỏ');
  }
  function guideMainPlot(){const objective=campaignObjective(save);dialogueItem=null;dialog('TUYẾN TRUYỆN CHÍNH',objective.title,objective.description,[['Theo tuyến truyện chính ↗',()=>{closeDialog();followCampaign();}],['Tiếp tục khám phá',closeDialog,true]]);}
  function reportAlliance(){const id=save.village;if(!canProgressPlot(save,id)||!villageEventComplete(save,id)){guideMainPlot();return;}if(id==='earth'&&earthDepartureTrialPending(save)){offerBattle('boss');return;}dialogueItem=null;dialog(PLOT.villages[id].title,'Hành động của liên minh','',[['Tiếp tục hành trình',()=>{acceptAlliance(save,id);refreshStory();followCampaign();}],['Để tôi chuẩn bị thêm',closeDialog,true]],{script:campaignLines(id==='earth'?EARTH_DEPARTURE_TRIAL.victory:PLOT.reports[id],save),requireComplete:true});}
  function chiefArmistice(){const id=save.village;dialogueItem=null;dialog('ĐÌNH CHIẾN',REGIONS[id].boss.name,'',[['Viết và ký hiệp ước',signVillagePeace],['Ký sau',closeDialog,true]],{script:campaignLines(PLOT.chiefAfter[id],save),requireComplete:true});}
  function storyEventDialog(item){
    const event=currentVillageEvent(save);if(!event||event.step!==item?.step)return;dialogueItem=item;
    if(!canProgressPlot(save,save.village)&&!admin.active){guideMainPlot();return;}
    if(event.village==='fire'&&event.step===2&&!save.story.questItems?.includes('fire:lotus-medicine')){interact(world.interactives.find(i=>i.kind==='expedition-giver'));return;}
    const buttons=event.battle?[[event.enemy,()=>offerBattle('village-event',villageEventEncounter(save.village,event.step,save))],['Chuẩn bị thêm',closeDialog,true]]:event.choices?event.choices.map((c,i)=>[c.label,()=>finishStoryStep(event,i)]):[[event.sealTrace?'Cảm nhận bằng mảnh lõi ấn':event.speakerId===HA_LY_MOTHER.id?'Nhận nhiệm vụ giải cứu Hạ Ly':event.recruit?'Băng bó và mời Hạ Ly cùng lên đường':event.style==='medicine'?'Mang thuốc về ngục':event.style==='rope'?'Kéo dây đưa người ra':event.style==='letter'?'Giữ lại chứng cứ':'Tiếp tục câu chuyện',()=>finishStoryStep(event)],['Để tôi chuẩn bị thêm',closeDialog,true]];
    dialog(event.chapter,event.title,event.body,buttons,{script:event.script?campaignLines(event.script,save):null,requireComplete:!!event.script});Array.from($('dialogActions').children).forEach((b,i)=>b.dataset.eventChoice=i);
  }
  function companionDialog(joined=false){
    const event=currentVillageEvent(save),body=joined?'Ngươi biết chiến đấu. Ta biết cách tìm ra những kẻ đang trốn trong bóng tối. Chúng ta sẽ cùng điều tra.':event?'Hạ Ly đối chiếu hồ sơ tình báo: '+event.body:'Hạ Ly: Ta sẽ nhìn vào những gì ngươi làm từ hôm nay. Những người đã mất cần một tương lai khác cho người còn sống.';
    dialogueItem=world.interactives.find(i=>i.kind==='companion');dialog(joined?'BẠN ĐỒNG HÀNH MỚI':'HẠ LY · BẠN ĐỒNG HÀNH',joined?'Một người cùng đường':'Dừng lại trò chuyện',body,[[joined?'Cùng lên đường':'Tiếp tục du hành',closeDialog],...(event?[['Cùng xem việc trong làng',()=>{closeDialog();moveToItem(findJourneyItem('village-event'));},true]]:[])]);
  }
  function updateSidequestHUD(){
    const quests=villageSidequests(save.village),tracked=save.story.trackedQuest&&sidequestById(save.story.trackedQuest),trackedStatus=tracked?save.story.sidequests[tracked.id]||0:0,q=tracked&&trackedStatus<3?tracked:quests.find(q=>[1,2].includes(save.story.sidequests[q.id]));
    $('questCount').textContent=Object.values(save.story.sidequests).filter(x=>x===3).length+' việc xong';
    if(!q){$('questTitle').textContent='Những người đang chờ giúp đỡ';$('questDescription').textContent='Mỗi cư dân có một việc riêng. Gặp họ tại các địa danh để nhận nhiệm vụ và cuộn giấy kỹ năng.';$('questTrack').textContent='Đánh dấu việc làng ↗';return;}
    $('questTitle').textContent=q.title;$('questDescription').textContent=(q.village!==save.village?village(q.village).name+' · ':'')+(save.story.sidequests[q.id]===2?'Trở lại '+q.giverName+' để nhận thưởng.':save.story.sidequests[q.id]===0?'Tới '+q.giverName+' để nhận việc.':q.description);$('questTrack').textContent=save.story.trackedQuest===q.id?'Đang đánh dấu việc làng ↗':'Đánh dấu việc làng ↗';
  }
  function findQuestGiver(q){return world.interactives.find(i=>questForNPC(save.village,i)?.id===q.id)||findJourneyItem(REGIONS[save.village].npcs.find(p=>p.id===q.giver)?.kind,q.giver);}
  function sidequestTarget(q){return save.story.sidequests[q.id]===2?findQuestGiver(q):findJourneyItem('sidequest-target',q.id);}
  function sidequestDialog(q){
    const early=!save.story.sidequests[q.id]&&sidequestDone(save,q),status=save.story.sidequests[q.id]||0,loot=sidequestReward(save,q),reward=loot.scroll?'Cuộn giấy '+spellName(loot.scroll)+' (cần hệ cấp '+requiredLevel(loot.scroll)+')':loot.gold+' xu';
    const go=()=>{closeDialog();markSidequest(q);};
    const body=status>=2?sidequestThanks(q)+(status===2?' Phần thưởng: '+reward+(q.rewardXp?' và '+q.rewardXp+' kinh nghiệm hệ.':'.'):''):q.description+' Phần thưởng: '+reward+(q.rewardXp?' và '+q.rewardXp+' kinh nghiệm hệ.':'.');
    const cast=dialogueCast(dialogueItem,save,REGIONS[save.village],village(save.village));
    sidequestView=true;
    dialog('VIỆC RIÊNG · '+q.giverName,q.title,body,status===3?[['Tạm biệt',closeDialog]]:status===2?[['Nhận thưởng',()=>{if(claimSidequest(save,q)){refreshStory();toast('Hoàn thành · '+q.title+' · '+reward+(loot.scroll?' · Mở C để học khi đủ cấp':''));}}]]:status===1?[['Theo dấu nhiệm vụ',go],['Để sau',closeDialog,true]]:early?[['Nhận thưởng',()=>{acceptSidequest(save,q);sidequestDialog(q);}]]:[['Nhận việc',()=>{if(acceptSidequest(save,q)){refreshStory();toast('Đã nhận · '+q.title);}}],['Hẹn lúc khác',closeDialog,true]],{script:cast&&sidequestLines(q,status,cast,body,early||save.story.earlyTargets?.includes(q.id))});
    sidequestView=false;
  }
  function openingChief(){
    const stage=save.story.stage;
    if(stage==='mother'){dialog('TRƯỞNG LÀNG','Trước khi lên đường','Mẹ con đang ở nghĩa trang. Hãy tới nói chuyện với bà trước; những người đã mất cần được nhớ bằng một lời hứa, chứ không phải một cuộc trả thù.',[['Tìm mẹ',()=>{closeDialog();moveToItem(world.interactives.find(i=>i.id===MOTHER_ID));}]]);return;}
    if(stage==='chief'){dialog('TRUYỀN THỤ · CHỌN MỘT THUẬT','Một con đường để bắt đầu','',STARTER_CHOICES.map(choice=>['Học '+choice.name,()=>{if(chooseStarter(save,choice.id)){onLearn(choice.id);refreshStory();toast('Đã học '+choice.name+' · Nhận túi, 10 phi tiêu sắt và bình thuốc cấp 1');}}]),{script:campaignLines(PLOT.chiefOpening,save,'nameless'),requireComplete:true});return;}
    if(stage==='guardian'){dialog('SỨ MỆNH ĐẦU TIÊN','Cứu hộ vệ quê nhà','Ba ninja Hỏa, Thủy, Lôi đã phá hỏng hộ vệ gần Đồi Chuông Gió. Mỗi tên chỉ biết một thuật cơ bản. Con phải đối đầu cả ba cùng lúc để lấy lại lõi ấn hồi sinh hộ vệ. Hãy nhìn nhịp kết ấn và né đòn; G giúp chuẩn bị một cú lướt.',[['Đánh dấu hộ vệ',()=>{closeDialog();moveToItem(world.interactives.find(i=>i.kind==='intro-guardian'));}],['Chuẩn bị thêm',closeDialog,true]]);return;}
    if(stage==='report'){
      const remaining=STARTER_CHOICES.filter(s=>!save.learnedSpells.includes(s.id)),names=remaining.map(s=>s.name).join(' và ');
      dialog('BÁO CÁO · HỘ VỆ ĐÃ HỒI SINH','Buộc ba cường quốc rút quân','Mảnh lõi Vô Danh sẽ giúp con phát hiện phong ấn bất thường. Hãy điều tra những gì xảy ra ở Thủy, Hỏa và Lôi, rồi thách đấu các thủ lĩnh để buộc họ ngừng dùng quê nhà làm chiến trường. Trở về khi ba làng đã cam kết rút quân.',[[`Nhận sứ mệnh · 100 xu${remaining.length?' + '+remaining.length+' thuật':''}`,()=>{if(reportGuardian(save)){refreshStory();toast(remaining.length?'Đã học '+names+' · Nhận 100 xu':'Nhận 100 xu · Ba con đường đã mở');}}]]);
    }
  }
  function signVillagePeace(){const id=save.village;if(!WAR_VILLAGES.includes(id))return;let signed=false;resetMovement();setPhase('peace-ceremony');peaceCeremony.begin({hero:{...save.hero,armor:equipmentState(save).armor},village:village(id),cancel:()=>{setPhase('explore');refresh();}},document=>{signed=negotiatePeace(save,id,document);if(signed)persist();},()=>runLoading('Đang cập nhật khu vực…',()=>{refreshStory({rebuildWorld:true});if(signed)toast('Đã ký cam kết rút quân · '+village(id).name);}));}
  function closeDialog(){if(retreatLocked()){toast('Đối thủ đã áp sát · Phải hoàn tất giao chiến');return;}setPhase('explore');if(waypointSource==='campaign'||waypointSource==='sidequest')refreshObjectiveMarker();}
  function interact(item){
    if(world.riding)return;
    dialogueItem=item;
    if(waypoint===item){waypoint=null;world.destination.visible=false;}
    const v=village(save.village);
    if(!admin.active&&item.id===MOTHER_ID&&campaignStage(save)==='homecoming'){dialogueItem=item;dialog(PLOT.chapters[1],'Lời hứa đầu tiên với mẹ','',[['Tiếp tục điều tra cùng Hạ Ly',()=>{save.story.homecomingDone=true;refreshStory();followCampaign();}]],{script:campaignLines(PLOT.homecoming,save,'nameless'),requireComplete:true});return;}
    if(item.kind==='spirit-ore'){if(mineCooldown>0)return;const result=strikeOre(save,item.id);if(result.ok){resetMovement();path=[];journeyLegs=[];automaticJourney=false;mineCooldown=ORE_SWING_COOLDOWN;world.miningStrike(item.id);world.syncMines(save);persist();refresh();gameAudio.tone(260,.08,'triangle',.05);toast(result.broken?'Linh thạch đã vỡ · +12 xu · Mỏ hồi lại sau 2 phút':'+2 xu · '+result.hits+'/5 lần gõ');}return;}
    if(item.kind==='interior-enter'&&item.id===save.village+'-council-hall'&&islandCenterLocked(save)){dialogueItem=null;dialog('PHONG ẤN TRĂNG KHUYẾT','Đường vào trung tâm đang bị khóa','Phải vượt qua các đội quân và phá những lớp phong ấn theo tuyến truyện trước khi tiến vào sở chỉ huy.',[['Theo dấu phong ấn',()=>{closeDialog();followCampaign();}],['Chuẩn bị thêm',closeDialog,true]]);return;}
    if(['interior-enter','interior-exit'].includes(item.kind)){transferMap(item);return;}
    if(item.kind==='arena-host'){arenaDialog();return;}
    if(item.kind==='tournament-board'){tournamentBoard.open(save);return;}
    if(item.kind==='school'){openProgression();return;}
    if(item.kind==='clinic'){resetMovement();path=[];journeyLegs=[];automaticJourney=false;action=null;companionTreatment=carryingCompanion(save);treatmentRemaining=companionTreatment?COMPANION_TREATMENT_SECONDS-(save.story.companion.treatmentSeconds||0):2;setPhase('treatment');world.startTreatment(treatmentRemaining);$('companionTreatmentPanel').hidden=!companionTreatment;updateCompanionTreatmentUI();if(companionTreatment)$('journeyToast').hidden=true;else toast('Đang trị thương…');return;}
    if(companionUnconscious(save)&&(['npc','envoy','treaty','village-event','intro-guardian','boss','companion'].includes(item.kind)||item.id===MOTHER_ID)){guideMainPlot();return;}
    if(item.kind==='military'){dialog('KHU QUÂN SỰ','Trại quân và nhà lao','Đây là khu đóng quân nằm ngoài tường nhà họp. Trại lính ở phía sau, nhà lao và cảnh ngục ở trong sân.',[['Tiếp tục',closeDialog]]);return;}
    if(item.kind==='village-event'){storyEventDialog(item);return;}
    if(item.kind==='companion'){companionDialog();return;}
    if(item.kind==='story-witness'){
      if(item.id==='ha-ly-treehouse'){dialog('HẠ LY · NHÀ TRÊN CÂY','Phương pháp cách ly độc tố','Ta và Linh Chi đã tìm được cách bảo toàn bộ rễ. Hãy hoàn thành lượt giải đấu tại trường học rồi trở lại; trưởng làng và ta sẽ chờ ngươi ở đây.',[['Theo dấu nhiệm vụ',()=>{closeDialog();followCampaign();}],['Ở lại một lát',closeDialog,true]]);return;}
      const mother=item.id===HA_LY_MOTHER.id,step=villageEventStep(save,'fire');
      const body=mother?(step>=4?'Bà Hồng cảm ơn bạn đã đưa con gái ra khỏi nhà lao. Bà dặn hai người giữ gìn sức khỏe trên đường đi.':'Xin hãy cứu Hạ Ly. Con bé bị thương trong nhà lao khu quân sự cạnh nhà họp. Y nữ Đan biết cách dùng hoa Hồng Liên trên đỉnh Vách Tro Hồng để chữa vết thương cho con bé.'):(step===0?'Hạ Ly đang bị trói và không thể đứng dậy. Hãy gặp mẹ nuôi của nàng, Bà Hồng, bên cổng Làng Hỏa để biết chuyện gì đã xảy ra.':'Hạ Ly ngồi ôm vết thương trong nhà lao đã mở cửa. Hãy hái Hồng Liên trên đỉnh Vách Tro Hồng, nhờ Y nữ Đan điều chế thuốc rồi trở lại băng bó cho nàng.');
      dialog(mother?'MẸ NUÔI CỦA HẠ LY':'HẠ LY · NHÀ LAO','Một lời hứa giữa tro tàn',body,[[step>=4?'Chào bà':'Theo dấu nhiệm vụ',()=>{closeDialog();if(step<4)moveToItem(findJourneyItem('village-event'));}],['Ở lại một lát',closeDialog,true]]);return;
    }
    if(item.kind==='home'){dialog('NGÔI NHÀ BÊN NGHĨA TRANG','Nơi lời hứa bắt đầu','Ngôi nhà vẫn còn đồ dùng của cha và em trai. Mẹ đang đặt hoa ngoài nghĩa trang. Từ nơi hoang tàn này, con đường hòa bình sẽ bắt đầu.',[['Tìm mẹ',()=>{closeDialog();moveToItem(world.interactives.find(i=>i.id===MOTHER_ID));}],['Tiếp tục',closeDialog,true]]);return;}
    if(item.id===MOTHER_ID&&save.story.stage==='mother'){
      dialog('MẸ · NGHĨA TRANG VÔ DANH','Lời hứa trước cha và em trai','Cha và em trai con đã mất trong cuộc chiến giữa ba làng Hỏa, Thủy và Lôi. Mẹ không muốn con sống với thù hận. Nếu con lên đường, hãy đem hòa bình về, để không còn người mẹ nào phải đứng trước hai nấm mộ như mẹ.',[['Con hứa sẽ đem lại hòa bình cho thế giới này',()=>{if(promiseMother(save)){refreshStory();toast('Đã lập lời hứa với mẹ · Tới gặp trưởng làng');}}],['Con muốn ở bên mẹ một lát',closeDialog,true]],{requireComplete:true});return;
    }
    const readyQuest=questForNPC(save.village,item);
    if(readyQuest&&save.story.sidequests[readyQuest.id]===2){sidequestDialog(readyQuest);return;}
    if(item.kind==='npc'&&v.id==='nameless'&&save.story.stage!=='infiltrate'){openingChief();return;}
    if(item.kind==='npc'&&ALLIANCE_VILLAGES.includes(v.id)&&!admin.active){reportAlliance();return;}
    if(item.kind==='npc'&&WAR_VILLAGES.includes(v.id)&&!admin.active&&(!canProgressPlot(save,v.id)||!villageEventComplete(save,v.id))){guideMainPlot();return;}
    if(item.kind==='npc'&&v.id!=='nameless'&&!save.bosses[v.id]){offerBattle('boss');return;}
    if(item.kind==='npc'&&v.id!=='nameless'&&save.bosses[v.id]&&!save.story.peaceSeals.includes(v.id)){
      chiefArmistice();return;
    }
    if(item.kind==='intro-guardian'){if(admin.active||save.story.stage==='guardian')offerBattle('intro-trio');else{dialog('HỘ VỆ ĐÃ HỎNG','Ba kẻ phá hoại','Hãy nói chuyện với mẹ và học một thuật từ trưởng làng trước khi giải cứu hộ vệ.',[['Trở lại',closeDialog]]);}return;}
    if(item.kind==='village-guard'){
      if(item.guardRole==='guardian'&&!item.occupation&&!admin.active){if(!guardianOrdered(save))guardianGateDialog();else startGuardianGuard();return;}
      if(item.guardRole==='jailer'){jailerDialog(item);return;}
      offerBattle('village-guard',{guardId:item.id,name:item.label,element:item.element,occupation:!!item.occupation});return;
    }
    if(item.kind==='roamer'){offerBattle('infiltrator',infiltratorEncounter(save,item));return;}
    if(item.kind==='sidequest-target'){
      const q=villageSidequests(v.id).find(q=>q.id===item.id);if(!q||sidequestDone(save,q))return;
      if(q.type==='combat'){offerBattle('sidequest',{questId:q.id,name:q.targetName});return;}
      if(completeSidequestTarget(save,q)){refreshStory();toast((q.type==='survey'?'Đã khảo sát · ':'Đã thu thập · ')+q.targetName+' · '+(save.story.sidequests[q.id]===2?'Trở lại '+q.giverName:'Đã cất vào hành trang'));}return;
    }
    if(item.kind==='healer'&&item.id==='fire-dan'){interact(world.interactives.find(i=>i.kind==='expedition-giver'));return;}
    if(item.kind==='gate'||item.kind==='dock'){const access=travelAccess(item.id);if(!access.allowed){dialog('CON ĐƯỜNG CHƯA MỞ',village(item.id).name,access.reason,[['Theo tuyến truyện chính',()=>{closeDialog();followCampaign();}],['Tiếp tục khám phá',closeDialog,true]]);return;}return departVillage(item);}
    if(item.kind==='traversal'){if(world.startTraversal(item.routeId,item.side)){world.clearEnemy();cooldown=90;path=[];journeyLegs=[];automaticJourney=false;toast(item.label+' · '+(world.traversalState().automatic?'Đang tự động leo thang · Không cần giữ phím di chuyển':world.traversalState().kind==='raft'?'Bè đang qua sông':world.traversalState().kind==='cave'?'Đang đi qua lối hang':world.traversalState().kind==='rock-climb'?'Space để nhảy qua từng gờ · E để bám hoặc leo tự do':world.traversalState().kind==='stairs'?'Giữ W để đi cầu thang, S để quay lại':'Giữ W để leo, S để quay lại'));}return;}
    if(item.kind==='expedition-giver'){
      const stage=save.expeditions.fire||0,hasFlower=save.story.questItems?.includes('fire:hong-lien');
      const claim=()=>{if(!brewHongLienMedicine(save))return;save.gold+=80;save.xp+=100;awardExperience('fire',100);if(villageEventStep(save,'fire')===2)advanceVillageEvent(save,'fire',2);refreshStory();dialog('VIỆC LÀNG · HOÀN THÀNH','Hồng liên cứu thương','Y nữ Đan đã điều chế thuốc Hồng Liên. Hãy mang thuốc về nhà lao để chữa thương cho Hạ Ly. Bạn nhận 80 xu và 100 kinh nghiệm.',[['Tiếp tục',closeDialog]]);};
      if(stage===3)dialog('Y NỮ ĐAN','Ngọn lửa biết cứu người','Hoa Hồng Liên đã được điều chế thành thuốc cứu Hạ Ly. Nếu chưa chữa thương cho nàng, hãy mang thuốc về nhà lao.',[['Tạm biệt',closeDialog]]);
      else if(stage===2||hasFlower){const cast=dialogueCast(item,save,REGIONS[save.village],village(save.village));dialog('NHIỆM VỤ LEO NÚI','Hồng liên trên Vách Tro','Hãy mang Hồng Liên trên đỉnh Vách Tro Hồng về để điều chế thuốc chữa thương cho Hạ Ly trong ngục.',[['Nhận thưởng',()=>{const body='Đúng là Hồng Liên ta cần. Cảm ơn bạn đã mang thuốc cứu người về!';dialog('HỒNG LIÊN · NHẬN THƯỞNG','Hồng liên cứu thương',body,[['Nhận 80 xu và 100 kinh nghiệm',claim]],{script:cast?[{speaker:cast.hero,text:stage===2?'Tôi đã mang Hồng Liên về.':'Tôi đã vô tình hái được Hồng Liên khi khám phá đỉnh núi.'},{speaker:cast.npc,text:body}]:null});}]]);}
      else dialog('NHIỆM VỤ LEO NÚI','Hồng liên trên Vách Tro','Hãy tới chân Vách Tro Hồng, nhấn E rồi giữ W đi theo các bậc thang khắc vào sườn núi. Space để nhảy và tự di chuyển. Hái hoa trên đỉnh và mang về cho Y nữ Đan điều chế thuốc cứu Hạ Ly trong ngục.',[[stage===1?'Đánh dấu chân vách':'Nhận nhiệm vụ',()=>{save.expeditions.fire=1;persist();closeDialog();moveToItem(world.interactives.find(i=>i.routeId==='red-cliff'&&i.side===0));}],['Để sau',closeDialog,true]]);return;
    }
    if(item.kind==='expedition-goal'){
      if((save.expeditions.fire||0)>=2||save.story.questItems?.includes('fire:hong-lien'))return;
      save.story.questItems??=[];save.story.questItems.push('fire:hong-lien');if(save.expeditions.fire===1)save.expeditions.fire=2;refreshStory();toast('Đã hái Hồng Liên · Cất vào hành trang');return;
    }
    if(item.kind==='shop'){openShop();return;}
    if(item.kind==='save'){if(admin.active){toast('Admin · Không lưu tiến trình');return;}const activated=save.activated.slice();if(!save.activated.includes(v.id))save.activated.push(v.id);const ok=persist({checkpointPoint:item});if(!ok)save.activated=activated;refresh();toast(ok?'Đã lưu toàn bộ tiến trình tại ấn':'Chưa lưu được');return;}
    if(item.kind==='npc'){dialog('TRƯỞNG LÀNG','Đường xa còn đợi','Những làng bên kia cổng vẫn đang cần bạn.',[['Tiếp tục hành trình',closeDialog]]);return;}
    if(item.kind==='boss'&&!save.bosses[v.id]){if(!admin.active&&!WAR_VILLAGES.includes(v.id)&&v.id!=='earth')guideMainPlot();else offerBattle('boss');return;}
    if(item.kind==='landmark')return;
    if(['lore','healer'].includes(item.kind)){const n=REGIONS[v.id].npcs.find(n=>n.id===item.id);if(n)dialog(n.role+' · '+v.name,n.name,n.dialogue,[...(item.kind==='healer'?[['Tới ấn hồi sinh',()=>{closeDialog();moveToItem(world.interactives.find(i=>i.kind==='save'));}]]:[]),['Tạm biệt',closeDialog,true]]);}
    if(item.kind==='mentor')mentorDialog();
    if(item.kind==='treaty'){
      if(save.campaign.treatySigned){dialog('HỘI NGHỊ HÒA BÌNH','Lời hứa của ba làng','Ba làng đã cam kết rút quân. Hãy báo tin cho mẹ rồi cùng Hạ Ly điều tra dấu trăng khuyết, tìm đồng minh để bảo vệ các phong ấn.',[['Theo dấu sứ mệnh',()=>{closeDialog();followCampaign();}],['Khép quyển trục',closeDialog,true]]);return;}
      if(!canSignTreaty(save)){dialog('HỘI NGHỊ CHƯA ĐỦ ĐẠI DIỆN','Ba ngôi làng còn chia cắt','Hãy học thuật tại Thủy, đánh bại người đứng đầu Thủy rồi giải quyết xung đột ở Hỏa và Lôi. Khi cả ba thủ lĩnh chấp nhận hòa bình, họ sẽ cùng bạn về đây.',[['Tiếp tục sứ mệnh',()=>{closeDialog();followCampaign();}]]);return;}
      dialog('HỘI NGHỊ THỦY · HỎA · LÔI','Hiệp ước bên chuông gió','Ba đại diện ký đình chiến và cam kết rút quân khỏi Làng Vô Danh. Hãy trở lại nghĩa trang báo tin cho mẹ. Sau đó, cùng Hạ Ly điều tra tổ chức trăng khuyết tại những miền đất ký ức kiếp trước chưa từng dẫn bạn tới.',[['Ký hiệp ước hòa bình',()=>{resetMovement();setPhase('peace-ceremony');peaceCeremony.begin({hero:{...save.hero,armor:equipmentState(save).armor},village:village('nameless'),cancel:()=>{setPhase('explore');refresh();}},document=>{if(signTreaty(save,document))persist();},()=>runLoading('Đang cập nhật khu vực…',()=>{refreshStory({rebuildWorld:true});toast('Hiệp ước đã lưu · Trở về báo tin cho mẹ');}));}],['Chưa khép hội nghị',closeDialog,true]]);
    }
    if(item.kind==='envoy'){
      dialogueItem=item;dialog(PLOT.villages[v.id].title,'Liên minh bằng hành động','Hãy giúp người dân điều tra biến cố tại đây, rồi mang kết quả tới trưởng làng.',[['Theo tuyến truyện chính ↗',()=>{closeDialog();followCampaign();}],['Tiếp tục khám phá',closeDialog,true]]);return;
    }
  }
  function mentorDialog(){const id=save.village,r=REGIONS[id],m=r.mentor;if(!m)return;const n=r.npcs.find(n=>n.id===m.npcId),name=spellName(m.spellId),targets=m.zoneIds.map(id=>r.zones.find(z=>z.id===id));
    if(!admin.active&&(save.story.stage!=='infiltrate'||(!['water','fire','lightning'].includes(id)&&!save.campaign.treatySigned))){dialog('LỜI HẸN TRÊN ĐƯỜNG XA',n.name,'Hãy giữ lời hứa với mẹ, giải cứu hộ vệ Vô Danh và nhận sứ mệnh từ trưởng làng. Các thầy ở Hỏa, Thủy và Lôi đều sẵn lòng chỉ dạy; những miền đất xa hơn sẽ đợi sau lễ ký hiệp ước.',[['Theo sứ mệnh đầu tiên',()=>{closeDialog();followCampaign();}],['Cảm tạ lời nhắn',closeDialog,true]]);return;}
    const element=regionElement(id),level=systemLevel(save.progression,element),eligible=save.progression.books.includes(m.spellId)&&canLearn(save.progression,m.spellId)&&!save.learnedSpells.includes(m.spellId);
    const learn=()=>{const reward=completeLesson(save,id);for(const spell of reward.spellIds)onLearn(spell);persist();refresh();closeDialog();toast(reward.spellIds.length?'✧ Đã học · '+name:reward.bookIds.length?'Đã nhận sách · '+name+' · Học khi hệ đạt cấp '+requiredLevel(m.spellId):'Đã hoàn thành kỳ ngộ · '+name);};
    if(save.mentors[id]){dialog('NHIỆM VỤ LÀNG · KỲ NGỘ ĐÃ HOÀN THÀNH',n.name,`Con đã nhận phần thưởng ${name}. ${save.learnedSpells.includes(m.spellId)?'Con đã lĩnh hội thuật này.':`Sách đang trong hành trang; cần hệ cấp ${requiredLevel(m.spellId)} để học (hiện tại cấp ${level}).`} Những thuật khác có sách thưởng ở các nhiệm vụ riêng.`,[...(eligible?[['Lĩnh hội · '+name,learn]]:[]),['Cảm tạ chỉ giáo',closeDialog,true]]);return;}
    if(!save.lessons[id]&&!mentorReady(save,id)){dialog('NHIỆM VỤ LÀNG · KỲ NGỘ',n.name,`${n.dialogue} ${m.clue} Hãy ghé ${targets.map(z=>z.name).join(' và ')} rồi trở lại. Phần thưởng duy nhất: ${name}, cần hệ cấp ${requiredLevel(m.spellId)}. Nếu chưa đủ cấp, con sẽ nhận sách để học sau.`,[['Xin nhận lời chỉ giáo',()=>{save.lessons[id]=1;persist();refresh();closeDialog();toast('Đã nhận nhiệm vụ kỳ ngộ · '+name);}],['Hẹn ngày tái ngộ',closeDialog,true]]);return;}
    if(mentorReady(save,id)){dialog('NHIỆM VỤ LÀNG · TRỞ VỀ NHẬN THƯỞNG',n.name,`${m.lesson} Phần thưởng: ${name}. Nếu chưa đủ hệ cấp ${requiredLevel(m.spellId)}, hãy giữ sách và tiếp tục tu luyện.`,[['Nhận thưởng · '+name,()=>{if(save.lessons[id]){learn();return;}save.lessons[id]=1;persist();const cast=dialogueCast(dialogueItem,save,r,village(id));dialog('KỲ NGỘ · ĐÃ HOÀN THÀNH',n.name,m.lesson,[['Nhận thưởng · '+name,learn]],{script:cast?[{speaker:cast.hero,text:'Tôi đã vô tình hoàn thành việc này trên đường khám phá.'},{speaker:cast.npc,text:m.lesson}]:null});}]]);return;}
    const missing=targets.filter(z=>!discovered(z));dialog('KỲ NGỘ · TRÊN ĐƯỜNG HỌC ĐẠO',n.name,`${m.clue} Còn ${missing.map(z=>z.name).join(' và ')} cần tự mình khám phá. Không cần giao chiến để nhận lời chỉ giáo.`,[['Theo dấu · '+missing[0].name,()=>{closeDialog();moveToItem(world.interactives.find(i=>i.kind==='landmark'&&i.id===missing[0].id));}],['Tiếp tục hành trình',closeDialog,true]]);
  }
  function guardianStoryDialog(){
    if(admin.active||!guardianStoryPending(save))return false;
    const e=currentVillageEvent(save);dialogueItem=null;
    dialog('CÂU CHUYỆN CỦA '+village(save.village).name,e.title,'Trước khi đối mặt hộ vệ, hãy giúp những người đang gặp nạn và làm rõ chuyện xảy ra trong làng. '+e.body,[['Theo tuyến truyện chính ↗',()=>{closeDialog();followCampaign();}],['Tiếp tục khám phá',closeDialog,true]]);return true;
  }
  function guardianGateDialog(){
    if(!admin.active&&(!WAR_VILLAGES.includes(save.village)||!canProgressPlot(save,save.village))){guideMainPlot();return true;}
    if(guardianStoryDialog())return true;
    if(save.village==='nameless'||save.bosses[save.village]||guardianOrdered(save)||world.interior||!inCouncilCourtyard(world.civic,world.hero.root.position))return false;
    dialogueItem=null;
    const id=save.village,r=REGIONS[id];
    dialog('LINH THÚ CHẶN CỔNG',r.boss.guardian,'',[['Ứng chiến',()=>{
      orderGuardianGuards(save);world.syncVillageEvents(save);refresh();persist();startGuardianGuard();
    }]],{script:battleConversation({kind:'guardian-order',village:id,name:r.boss.guardian},save),requireComplete:true});return true;
  }
  function startGuardianGuard(){
    if(!admin.active&&!WAR_VILLAGES.includes(save.village)){guideMainPlot();return true;}
    if(guardianStoryDialog())return true;
    const guardId=nextGuardianGuard(save);if(!guardId)return false;
    const ids=guardianGuardIds(save.village).filter(id=>!save.story.defeatedGuards.includes(id)),profile=encounterProfile(save,'guardian-guard',save.village);
    const squad=ids.map((id,i)=>({...profile,id,guardId:id,kind:'village-guard',village:save.village,name:id.endsWith('-1')?'Hộ vệ trái':'Hộ vệ phải',initialDelay:3+i*.6}));
    offerBattle('village-guard',{guardId,guardIds:ids,guardRole:'guardian',name:'Hai hộ vệ linh thú',squad,guardianChain:true});return true;
  }
  function jailerDialog(item){
    if(save.village==='fire'){
      let step=villageEventStep(save,'fire');if(step>=2)return;
      if(step===0){if(!canProgressPlot(save,'fire')){guideMainPlot();return;}advanceVillageEvent(save,'fire',0);refreshStory();}
      offerBattle('village-event',{...villageEventEncounter('fire',1,save),fireCaptors:true});return;
    }
    if(challengeJailer(save)==='warning'){
      intrusionCooldown=1.5;persist();dialogueItem=item;dialog('CAI NGỤC','Khu quân sự','Kẻ không phận sự miễn vào',[['Rời khỏi cổng',closeDialog]]);
    }else{persist();offerBattle('village-guard',{guardId:item.id,name:'Cai ngục',element:item.element,occupation:!!item.occupation,militaryIntrusion:true});}
  }
  function offerBattle(kind,details={}){if(kind==='quest'||phase==='boarding'||retreatLocked())return;if(!save.learnedSpells.length){toast('Hãy gặp mẹ và học một thuật từ trưởng làng trước.');return;}
    if(!admin.active&&(save.healthFraction??1)<=0){toast('Bạn cần tới trạm y tế để trị thương trước khi giao chiến.');return;}
    const r=REGIONS[save.village],id=save.village;
    const departureTrial=kind==='boss'&&id==='earth';
    if(!admin.active&&kind==='boss'&&(!WAR_VILLAGES.includes(id)&&!departureTrial||!canProgressPlot(save,id))){guideMainPlot();return;}
    if(!admin.active&&kind==='village-event'){const event=currentVillageEvent(save);if(!event?.battle||event.step!==details.eventStep||!canProgressPlot(save,id)){guideMainPlot();return;}}
    const guardPost=kind==='village-guard'?world.interactives.find(i=>i.kind==='village-guard'&&i.id===details.guardId):null,guardRole=guardPost?.guardRole||details.guardRole;
    if(guardPost?.occupation)details={...details,occupation:true,element:guardPost.element,name:guardPost.label};
    if((kind==='boss'||kind==='village-guard'&&guardRole==='guardian'&&!details.occupation)&&guardianStoryDialog())return;
    if(kind==='boss'){
    if(!admin.active&&save.bosses[id])return;
    if(departureTrial&&!admin.active&&world.interior?.id!=='earth-council-hall'){dialogueItem=null;dialog(EARTH_DEPARTURE_TRIAL.title,'Lời mời của trưởng làng Thổ',EARTH_DEPARTURE_TRIAL.description,[['Tới gặp trưởng làng',()=>{closeDialog();moveToItem(findJourneyItem('npc'));}],['Chuẩn bị thêm',closeDialog,true]]);return;}
    if(id!=='nameless'&&!admin.active&&!departureTrial){
      if(!guardianOrdered(save)){guardianGateDialog();return;}
      if(nextGuardianGuard(save)){startGuardianGuard();return;}
      if(world.interior?.kind!=='council'){dialogueItem=null;dialog('PHÒNG HỌP CỦA LÀNG','Buộc trưởng làng rút quân','Hai hộ vệ đã bị đánh bại. Lối vào phòng họp đã mở. Tiến tới gặp trưởng làng để buộc quân của làng rút khỏi Vô Danh.',[['Tới phòng họp',()=>{closeDialog();moveToItem(findJourneyItem('npc'));}],['Chuẩn bị thêm',closeDialog,true]]);return;}
    }

  }
    if(kind==='sidequest'){
      const q=villageSidequests(id).find(q=>q.id===details.questId);
      if(!q||q.type!=='combat'||save.story.sidequests[q.id]!==1||sidequestDone(save,q))return;
    }
    if(!admin.active&&kind==='intro-trio'&&save.story.stage!=='guardian')return;
    const profile=encounterProfile(save,kind==='infiltrator'?'village-guard':guardRole==='guardian'||details.occupation?'guardian-guard':kind,details.element||id);
    encounter={kind,village:id,name:kind==='boss'?r.boss.name:kind==='intro-trio'?'Ba ninja đột kích':'Ninja phá hoại',...profile,...details,...(guardRole?{guardRole}:{}),...(kind==='boss'?{bossId:r.boss.id,guardianName:r.boss.guardian}:{}),...(kind==='intro-trio'?{...INTRO_SQUAD[0],village:id,name:'Ba ninja Hỏa · Thủy · Lôi',squad:INTRO_SQUAD.map(n=>({...n}))}:{})};
    if(departureTrial){encounter.friendlyTrial=true;encounter.name='Trưởng làng Thổ';}
    // Authored event profiles may customize combat, but all enemies obey the same seal cadence.
    if(!encounter.storyBoss&&kind!=='infiltrator')for(const key of ['baseSealDelay','sealSpeedMultiplier','sealDelay'])encounter[key]=profile[key];
    if(encounter.squad)encounter.squad=encounter.squad.map(n=>({...n,...enemySealTiming(profile.rank,'random')}));
    if(kind==='arena'){
      const match=pendingTournamentMatch(save.arena);if(save.village!=='wood'||world.interior||!match||details.tournamentRun!==save.arena.run||details.tournamentMatch!==match.id){encounter=null;return;}
      encounter.tournamentStats={...combatStats(save.progression),elementBonuses:{...equipmentState(save).armguard.bonuses}};encounter.baseSealDelay=encounter.sealDelay=.9;encounter.sealSpeedMultiplier=1;encounter.tournamentRound=match.round;encounter.rewardAlreadyClaimed=save.arena.rewardClaimed;
    }
    if(kind==='village-event'&&!encounter.storyBoss){const scale=1+Math.max(0,(encounter.rank||1)-1)*.08;encounter.hp=Math.round(encounter.hp/BOT_HEALTH_SCALE*scale)*BOT_HEALTH_SCALE;encounter.damageMultiplier*=scale;if(encounter.squad)encounter.squad=encounter.squad.map(n=>({...n,hp:Math.round(n.hp/BOT_HEALTH_SCALE*scale)*BOT_HEALTH_SCALE,damageMultiplier:n.damageMultiplier*scale}));}
    encounter=encounter.storyBoss?{...configureOpponent(storyBossProfile(encounter)),kind:'village-event',village:id}:configureOpponent(encounter);encounter.admin=admin.active;encounter.forced=retreatLocked();
    if(details.immediate){persist();setPhase('loadout');onBattle(encounter);return;}
    dialogueItem=null;dialog(departureTrial?EARTH_DEPARTURE_TRIAL.title:'LỜI KHIÊU CHIẾN',encounter.name,'',[[departureTrial?'Bắt đầu thử thách':'Chuẩn bị giao chiến',()=>{persist();setPhase('loadout');onBattle(encounter);}],...(encounter.forced?[]:[['Lùi lại',()=>{if(encounter?.guardId)world.dismissGuard(encounter.guardId);encounter=null;world.clearEnemy();cooldown=90;distance=0;closeDialog();},true]])],{script:battleConversation(encounter,save),requireComplete:true});
  }
  function finishBattle(victory){if(!encounter||loading)return;return runLoading('Đang trở lại hành trình…',()=>{onReturn();const battle={...encounter};const rollback=!victory&&battle.kind!=='arena'&&!isEarthDepartureTrial(battle)&&!!save.checkpointSave;resolveBattle(save,encounter,victory);world.clearEnemy(battle.infiltrationId);cooldown=battle.kind==='infiltrator'?12:90;distance=0;encounter=null;enter(true,{reuseWorld:!rollback,preserveHero:!rollback&&(victory||battle.kind==='arena'||isEarthDepartureTrial(battle))});
    if(battle.kind==='arena'){
      const newlyRewarded=save.arena.rewardClaimed&&!battle.rewardAlreadyClaimed;
      if(save.arena.status==='champion'&&newlyRewarded){dialogueItem=null;dialog('TRAO GIẢI · QUÀ TẶNG BẤT NGỜ','Bộ Giáp Thần Ninja Cực Phẩm','Trọng tài trao cho nhà vô địch bộ giáp và giáp tay lục sẫm viền vàng: áo giảm 10% sát thương mọi hệ, giáp tay tăng 10% sát thương mọi hệ. Trang bị đã được thêm vào hành trang.',[['Nhận phần thưởng',closeDialog]]);return;}
      toast(save.arena.status==='active'?(victory?'Chiến thắng · Gặp trọng tài để đấu trận tiếp theo':'Thất bại · Bạn vẫn còn cơ hội trong vòng bảng'):save.arena.status==='champion'?'Bạn đã vô địch · Có thể đăng ký lượt mới':'Đã bị loại · Nhiệm vụ thi đấu hoàn thành · Có thể đăng ký lượt mới');return;
    }
    if(admin.active){toast('ADMIN · Kết quả giao chiến chỉ áp dụng trong phiên thử nghiệm');return;}
    if(companionUnconscious(save)){refresh();guideMainPlot();return;}
    if(isEarthDepartureTrial(battle)){
      dialogueItem=null;dialog(EARTH_DEPARTURE_TRIAL.title,victory?'Sẵn sàng ra khơi':'Hãy chuẩn bị rồi thử lại','',victory?[['Nhận bản thiết kế và tới bến thuyền',()=>{acceptAlliance(save,'earth');refreshStory();followCampaign();}],['Ở lại chuẩn bị',closeDialog,true]]:[['Thử lại',()=>offerBattle('boss')],['Chuẩn bị thêm',closeDialog,true]],{script:campaignLines(victory?EARTH_DEPARTURE_TRIAL.victory:EARTH_DEPARTURE_TRIAL.defeat,save,'earth'),requireComplete:true});return;
    }
    if(victory&&battle.kind==='village-guard'&&battle.guardianChain){
      if(nextGuardianGuard(save)){startGuardianGuard();return;}
      dialogueItem=null;dialog('HAI HỘ VỆ ĐÃ THẤT BẠI','Tới phòng họp','Hai hộ vệ đã bị đánh bại. Lối vào phòng họp đã mở. Tiến tới gặp trưởng làng để buộc quân của làng rút khỏi Vô Danh.',[['Đi tới phòng họp',()=>{closeDialog();moveToItem(findJourneyItem('npc'));}],['Chuẩn bị thêm',closeDialog,true]]);return;
    }
    if(victory&&battle.kind==='village-event'){const event=currentVillageEvent(save);dialogueItem=null;dialog(PLOT.villages[battle.village].title,event?.title||'Đã vượt qua cuộc tập kích',event?.body||'Mang kết quả điều tra tới trưởng làng.',[['Theo dấu câu chuyện',()=>{closeDialog();followCampaign();}],['Chuẩn bị thêm',closeDialog,true]]);return;}
    if(victory&&battle.kind==='intro-trio'){dialogueItem=null;dialog(PLOT.chapters[0],'Mảnh lõi của Vô Danh Thú','',[['Nhận mảnh lõi và trở về báo cáo',()=>{closeDialog();followCampaign();}]],{script:campaignLines(PLOT.guardianSaved,save,'nameless'),requireComplete:true});return;}
    if(victory&&battle.kind==='boss'&&WAR_VILLAGES.includes(battle.village)){chiefArmistice();return;}
    toast(victory?(battle.kind==='boss'?'Thủ lĩnh đã khuất phục · Nhận sách kỹ năng và kinh nghiệm hệ · Mở Tu luyện để học':'Chiến thắng · Đã nhận xu và kinh nghiệm hệ.'):`Bạn đã hồi sinh tại ${village(save.checkpoint).name}.`);
    });
  }
  function cancelBattle(){if(loading)return false;if(retreatLocked()){toast('Đối thủ đã áp sát · Phải hoàn tất giao chiến');return false;}return runLoading('Đang trở lại hành trình…',()=>{onReturn();const guardId=encounter?.guardId;encounter=null;cooldown=60;world.clearEnemy();if(guardId){world.dismissGuard(guardId);setPhase('explore');refresh();persist();}else enter(true,{reuseWorld:true});return true;});}
  function openAtlas(){if(phase!=='explore')return;path=[];action=null;world.destination.visible=false;atlasSelection=save.village;setPhase('atlas');renderAtlas();}
  function renderAtlas(){const v=village(atlasSelection),current=village(save.village),adjacent=current.links.includes(v.id),here=v.id===save.village,access=travelAccess(v.id);root.querySelectorAll('[data-region]').forEach(g=>{g.classList.toggle('selected',g.dataset.region===v.id);g.classList.toggle('visited',save.visited.includes(g.dataset.region));g.classList.toggle('locked',!travelAccess(g.dataset.region).allowed);});$('atlasPosition').innerHTML=`<circle cx="${current.x-6}" cy="${current.y-4}" r="1.25" fill="#fff2c9" stroke="#203c40" stroke-width=".5"/>`;
    $('atlasDetail').innerHTML=`<span class="atlas-detail-glyph" style="--biome:${v.color}">${v.glyph}</span><div class="journey-kicker">${here?'BẠN ĐANG Ở ĐÂY':save.visited.includes(v.id)?'ĐÃ KHÁM PHÁ':'CHƯA KHÁM PHÁ'}</div><h3>${v.name}</h3><h4>${v.title}</h4><p>${v.desc}</p><div class="atlas-save">◇ ${save.checkpoint===v.id?'Điểm hồi sinh hiện tại':save.activated.includes(v.id)?'Đã kích hoạt ấn hồi sinh':'Ấn hồi sinh chưa kích hoạt'}</div><button id="atlasGo" class="journey-primary" ${!here&&(admin.active||adjacent)?'':'disabled'}>${here?'Vùng đất hiện tại':admin.active?'Dịch chuyển tới làng này ↗':adjacent?(travelKind(current.id,v.id)==='dock'?'Đi tới bến thuyền ⚓':'Đi tới cổng làng ↗'):'Hãy đi qua làng liền kề'}</button><small>KẾT NỐI VỚI</small><div class="atlas-neighbors">${v.links.map(id=>`<button data-neighbor="${id}">${travelKind(v.id,id)==='dock'?'⚓ ':'↗ '}${village(id).name}</button>`).join('')}</div>`;
    if(!access.allowed){$('atlasGo').disabled=true;$('atlasGo').textContent='Chưa mở trong chương hiện tại';const reason=document.createElement('p');reason.className='atlas-lock-reason';reason.textContent=access.reason;$('atlasGo').after(reason);}
    $('atlasGo').onclick=()=>{if(!travelAccess(v.id).allowed)return;if(admin.active){adminVisit(v.id);return;}setPhase('explore');moveToItem(world.interior?findJourneyItem('interior-exit'):world.gates.find(g=>g.id===v.id));};root.querySelectorAll('[data-neighbor]').forEach(b=>b.onclick=()=>{atlasSelection=b.dataset.neighbor;renderAtlas();});
  }
  function enteredHeroName(){const input=$('heroName');input.value=input.value.trim();return input.reportValidity()?input.value:null;}
  const restartDialog=$('newJourneyDialog');let pendingHero=null;
  function startNewJourney(hero){if(admin.active||loading)return;return runLoading('Đang bắt đầu hành trình…',()=>{save=newJourney(hero.name);captureCheckpoint(save,planSavePoints('nameless')[0],{source:'initial'});encounter=null;distance=0;spawnAt=90+Math.random()*70;cooldown=45;enter();openingPending=true;setPhase('opening');});}
  $('heroForm').onsubmit=e=>{e.preventDefault();if(admin.active){toast('Thoát admin trước khi tạo hành trình mới.');return;}const name=enteredHeroName();if(!name)return;const hero={name};if(stored){pendingHero=hero;if(!restartDialog.open)restartDialog.showModal();return;}startNewJourney(hero);};
  $('cancelNewJourney').onclick=()=>restartDialog.close();
  restartDialog.addEventListener('close',()=>{pendingHero=null;});
  $('confirmNewJourney').onclick=()=>{if(!restartDialog.open||!pendingHero)return;const hero=pendingHero;pendingHero=null;restartDialog.close();startNewJourney(hero);};
  $('continueJourney').onclick=()=>{if(!stored&&!admin.active)return;const name=enteredHeroName();if(!name)return;return runLoading('Đang tải hành trình…',()=>{if(!admin.active)save=stored;save.hero.name=name;enter(true,{reuseWorld:true});});};$('duelMode').onclick=()=>{setPhase('duel');onDuel();};$('journeyHomeLink').onclick=e=>{e.preventDefault();menu();};
  $('openAtlas').onclick=openAtlas;$('closeAtlas').onclick=closeDialog;$('journeyMenu').onclick=menu;$('openJournal').onclick=openJournal;$('closeJournal').onclick=closeDialog;$('campaignTrack').onclick=followCampaign;
  function checkpointInfo(){const p=checkpointSummary(save);return p?.source==='manual'?{...p,canRestore:!admin.active&&!loading,description:village(p.village).name+' · '+p.label+' · '+new Date(p.savedAt).toLocaleString()}:null;}
  function restoreLastCheckpoint(){
    if(loading||admin.active||save.checkpointSave?.source!=='manual')return false;
    return runLoading('Đang khôi phục bản lưu tại ấn…',()=>{encounter=null;onReturn();restoreCheckpoint(save);world.clearEnemy();cooldown=45;distance=0;intrusionCooldown=0;infiltrationClock=0;enter(true,{reuseWorld:false,preserveHero:false});toast('Đã trở về trạng thái lưu tại ấn');return true;});
  }
  function menu(){if(phase!=='explore')return;dialog('HÀNH TRÌNH ĐÃ LƯU','Dừng chân một lát','Nếu mắc ở cửa hoặc góc đá, chọn Thoát kẹt để trở lại chỗ đứng an toàn gần nhất. Bạn không mất máu, xu hay tiến trình.',[['Tiếp tục',closeDialog],[admin.active?'Công cụ admin':'Bật chế độ admin',()=>admin.active?openAdmin():setAdminEnabled(true),true],['Trở về điểm lưu',()=>window.dispatchEvent(new Event('anhoa:checkpoint-settings')),true],['Cài đặt âm thanh',()=>window.dispatchEvent(new Event('anhoa:audio-settings')),true],...(document.body.classList.contains('android-ui')?[['Tùy chỉnh giao diện',()=>window.dispatchEvent(new Event('anhoa:mobile-layout')),true]]:[]),['Thoát kẹt',()=>{held.clear();sprinting=false;momentum.x=momentum.z=0;path=[];journeyLegs=[];automaticJourney=false;action=null;world.recoverHero();cooldown=60;closeDialog();persist();toast('Đã trở lại vị trí đứng an toàn.');},true],['Về màn hình chính',()=>{persist();setPhase('home');$('continueJourney').hidden=false;},true]]);}
  $('questTrack').onclick=()=>{const pinned=save.story.trackedQuest&&sidequestById(save.story.trackedQuest),q=pinned&&[0,1,2].includes(save.story.sidequests[pinned.id]||0)?pinned:villageSidequests(save.village).find(q=>[1,2].includes(save.story.sidequests[q.id]));if(q)markSidequest(q);else openJournal();};
  $('nearbyAction').onclick=()=>{const item=nearest();if(item)interact(item);};
  root.querySelectorAll('[data-region]').forEach(g=>{const select=()=>{atlasSelection=g.dataset.region;renderAtlas();};g.onclick=select;g.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();select();}};});
  function nearest(){
    if(world.riding)return null;
    const candidates=world.interactives.filter(i=>!i.depleted&&i.kind!=='landmark'&&(!['village-guard','roamer'].includes(i.kind)||i.revealed)&&(i.kind!=='boss'||admin.active||!save.bosses[save.village])).map(i=>({i,d:itemDistance(i)}));
    return candidates.filter(({d})=>d<=INTERACTION_RANGE).sort((a,b)=>Number(a.i.kind==='companion')-Number(b.i.kind==='companion')||a.d-b.d)[0]?.i;
  }
  canvas.addEventListener('pointerdown',e=>{if(phase!=='explore'||cameraDrag||![0,2].includes(e.button))return;focusGame();world.unlockAudio();e.preventDefault();cameraDrag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.classList.add('camera-dragging');});
  canvas.addEventListener('contextmenu',e=>{if(phase==='explore')e.preventDefault();});
  canvas.addEventListener('pointermove',e=>{if(!cameraDrag||phase!=='explore'||e.pointerId!==cameraDrag.id)return;if(e.pointerType!=='touch'&&!(e.buttons&3)){releaseLook();return;}world.orbit(e.clientX-cameraDrag.x,e.clientY-cameraDrag.y);cameraDrag.x=e.clientX;cameraDrag.y=e.clientY;});
  const endCameraDrag=e=>{if(cameraDrag&&e.pointerId===cameraDrag.id)releaseLook();};
  window.addEventListener('pointerup',endCameraDrag);window.addEventListener('pointercancel',endCameraDrag);canvas.addEventListener('lostpointercapture',endCameraDrag);
  canvas.addEventListener('wheel',e=>{if(phase==='explore'){e.preventDefault();world.zoom(e.deltaY);}},{passive:false});
  window.addEventListener('keydown',e=>{if($('shurikenPurchase').open||inventoryPopup.open||villageMapDialog.open||tournamentBoard.isOpen)return;const key=physicalKey(e);if(textInputTarget(e.target)||e.ctrlKey||e.metaKey||e.altKey)return;
    if(phase==='explore'&&['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].includes(key)){
      if(['w','arrowup'].includes(key)&&!e.repeat&&!held.has('w')&&!held.has('arrowup')){sprinting=time-lastForwardTap<=.3;lastForwardTap=time;}if(['s','arrowdown'].includes(key))sprinting=false;held.add(key);e.preventDefault();
    }
    if(phase==='explore'&&key===' '){e.preventDefault();if(!e.repeat){path=[];journeyLegs=[];automaticJourney=false;action=null;world.destination.visible=false;world.jump();}}
    if(key==='v'&&!e.repeat&&['explore','progression','equipment','shop'].includes(phase)){e.preventDefault();if(phase==='equipment')closeDialog();else openEquipment();}
    if(key==='c'&&!e.repeat&&['explore','progression','equipment','shop'].includes(phase)){e.preventDefault();if(phase==='progression')closeDialog();else{if(phase==='shop')closeDialog();openProgression();}}
  });
  window.addEventListener('keyup',e=>{releaseMovementKeys(held,e);if(!mobileAutoRun&&!held.has('w')&&!held.has('arrowup'))sprinting=false;});
  function resetMovement(){held.clear();sprinting=false;mobileAutoRun=false;lastForwardTap=-Infinity;momentum.x=momentum.z=0;}
  window.addEventListener('blur',()=>{resetMovement();releaseLook();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){resetMovement();releaseLook();}});
  document.addEventListener('focusin',e=>{if(textInputTarget(e.target))resetMovement();});
  window.addEventListener('beforeinput',e=>{if(phase==='explore'&&!textInputTarget(e.target))e.preventDefault();},{capture:true});
  window.addEventListener('keydown',e=>{if(villageMapDialog.open){if(!e.repeat&&physicalKey(e)==='n'&&!textInputTarget(e.target)){e.preventDefault();villageMapDialog.close();}return;}if(tournamentBoard.isOpen)return;if(restartDialog.open||$('shurikenPurchase').open||inventoryPopup.open)return;if(phase==='peace-ceremony'){if(!document.getElementById('peaceCeremony').contains(e.target))e.preventDefault();return;}if(phase==='opening'){opening.keydown(e);return;}if(phase==='treatment'){e.preventDefault();if(physicalKey(e)==='escape')stopClinicTreatment();return;}if(['transition','boarding'].includes(phase)){e.preventDefault();return;}if(['duel','combat','loadout'].includes(phase)||textInputTarget(e.target)||e.ctrlKey||e.metaKey||e.altKey)return;if(e.repeat)return;const k=physicalKey(e);if(phase==='dialog'&&dialogue.active&&['e','enter',' '].includes(k)&&!(k!=='e'&&$('journeyDialog').contains(e.target)&&e.target.closest('button'))){e.preventDefault();dialogue.advance();return;}if(k==='n'&&phase==='explore'){e.preventDefault();openVillageMap();return;}if(k==='m'){e.preventDefault();if(phase==='atlas')closeDialog();else openAtlas();}if(k==='b'){e.preventDefault();if(phase==='journal')closeDialog();else openJournal();}if(k==='escape'){e.preventDefault();if(retreatLocked()){toast('Đối thủ đã áp sát · Phải hoàn tất giao chiến');return;}if(['dialog','atlas','journal','progression','equipment','shop','admin'].includes(phase)){const retreat=!!encounter;if(encounter?.guardId)world.dismissGuard(encounter.guardId);encounter=null;if(retreat){world.clearEnemy();cooldown=90;distance=0;}closeDialog();}else menu();}if(k==='e'&&phase==='explore'){e.preventDefault();if(world.tryGrabLedge()||world.releaseCliff())return;const i=nearest();if(i)interact(i);}});
  window.addEventListener('resize',()=>{world.resize();if(phase==='equipment')heroPreview.show($('heroPreview'),equipmentState(save));});window.addEventListener('pagehide',()=>{if(!loading&&phase!=='boarding'&&phase!=='home'&&phase!=='duel')persist();});
  function update(dt){
    if(phase==='boarding'){
      const trip=world.advanceBoarding(dt);world.update(dt,!!trip?.walking,false,true);
      if(trip?.complete){
        if(trip.incoming){boardingTarget=null;setPhase('explore');$('journeyTravel').hidden=true;refresh();persist();cooldown=35;distance=0;toast('Đã cập bến · '+village(save.village).name);}
        else {const target=boardingTarget;boardingTarget=null;arriveVillage(target);}
      }else if(trip){$('journeyTravel').hidden=false;$('journeyTravel').textContent=(trip.stage==='boarding'?'Đang lên thuyền · ':trip.stage==='outbound'?'Thuyền đang rời bến · ':trip.stage==='inbound'?'Thuyền đang vào bến · ':'Đang xuống thuyền · ')+village(trip.incoming?save.village:boardingTarget).name;}
      return;
    }
    if(loading||['duel','combat'].includes(phase))return;
    if(phase==='opening'){world.update(dt,false,false,true);opening.update(dt);return;}
    peaceCeremony.update(dt);time+=dt;dialogue.update(dt);let moving=false;
    if(phase==='treatment'){treatmentRemaining=Math.max(0,treatmentRemaining-dt);if(companionTreatment){treatCompanion(save,dt);updateCompanionTreatmentUI();saveTimer+=dt;if(saveTimer>=5)persist();}world.update(dt,false,false,false);if(treatmentRemaining<=0){$('companionTreatmentPanel').hidden=true;save.healthFraction=1;refillFlask(save);healCompanion(save);world.syncVillageEvents(save);setPhase('explore');persist();refresh();toast(companionTreatment?'Hạ Ly đã tỉnh lại · Có thể tiếp tục tuyến truyện chính':'Đã trị thương và nạp đầy bình thuốc.');companionTreatment=false;}return;}
    if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)$('journeyToast').hidden=true;}
    if(phase==='explore'&&!tournamentBoard.isOpen){
      if(!admin.active&&(save.healthFraction??1)>0&&!guardianStoryPending(save)&&!world.interior&&!world.riding&&!world.surface&&save.story.stage==='infiltrate'&&WAR_VILLAGES.includes(save.village)&&canProgressPlot(save,save.village)&&!save.bosses[save.village]&&inCouncilCourtyard(world.civic,world.hero.root.position)){if(!guardianOrdered(save)){guardianGateDialog();return;}if(nextGuardianGuard(save)){startGuardianGuard();return;}}
      if(landmarkNotices.length){
        landmarkNoticeTimer-=dt;
        while(landmarkNotices.length&&landmarkNoticeTimer<=0){landmarkNotices.shift();landmarkNoticeTimer+=7;}
      }
      cooldown=Math.max(0,cooldown-dt);mineCooldown=Math.max(0,mineCooldown-dt);saveTimer+=dt;if(world.syncMines(save))refresh();
      const forward=Number(mobileAutoRun||held.has('w')||held.has('arrowup'))-Number(held.has('s')||held.has('arrowdown')),side=Number(held.has('d')||held.has('arrowright'))-Number(held.has('a')||held.has('arrowleft'));
      if(world.riding){const completed=world.advanceTraversal(dt*(world.traversalState().automatic?companionMoveMultiplier(save):1),forward,automaticJourney);if(completed){persist();if(waypoint)markWaypoint(waypoint,waypointSource);}}
      else {
        if(forward||side||save.village==='ice'&&Math.hypot(momentum.x,momentum.z)>.015){
          path=[];journeyLegs=[];automaticJourney=false;action=null;world.destination.visible=false;const axes=world.movementAxes(),dx=axes.forward[0]*forward+axes.right[0]*side,dz=axes.forward[1]*forward+axes.right[1]*side,length=Math.hypot(dx,dz)||1,speed=(forward<0?ADVENTURE_BACKWARD_SPEED:sprinting&&forward>0?ADVENTURE_RUN_SPEED:ADVENTURE_WALK_SPEED)*companionMoveMultiplier(save),blend=save.village==='ice'?1-Math.exp(-dt*(forward||side?9:5.5)):1;
          momentum.x+=(dx/length*speed-momentum.x)*blend;momentum.z+=(dz/length*speed-momentum.z)*blend;
          const delta=world.moveHero(momentum.x*dt,momentum.z*dt);if(Math.abs(delta.x)<.0001)momentum.x=0;if(Math.abs(delta.z)<.0001)momentum.z=0;moving=Math.hypot(delta.x,delta.z)>.001;if(moving){world.faceView();distance+=Math.hypot(delta.x,delta.z);}
        }
        nextJourneyLeg();
        if(path.length){const p=world.hero.root.position,target=path[0],dx=target[0]-p.x,dz=target[1]-p.z,d=Math.hypot(dx,dz),speed=ADVENTURE_WALK_SPEED*companionMoveMultiplier(save),step=Math.min(d,speed*dt);moving=d>.01;
          if(d>.001){const delta=world.moveHero(dx/d*step,dz/d*step),travelled=Math.hypot(delta.x,delta.z);world.hero.root.rotation.y=Math.atan2(dx,dz);world.followHeading(world.hero.root.rotation.y,dt);distance+=travelled;
            // A saved position used to conceal this riverbank/low-ledge stop by
            // teleporting the hero after dialogue. Follow the planned route physically.
            if(automaticJourney&&step>.01&&travelled<step*.1)world.jump();
          }if(Math.hypot(target[0]-p.x,target[1]-p.z)<=.015)path.shift();
          if(!path.length)nextJourneyLeg();
        }
      }
      if(phase==='boarding'||loading)return;
      const p=world.hero.root.position;
      $('waypointHint').hidden=!waypoint;if(waypoint){
        const target=waypointVia||waypoint,d=Math.hypot(target.x-p.x,target.z-p.z),angle=-(Math.atan2(target.x-p.x,target.z-p.z)-world.cameraState().yaw-Math.PI);
        const hint=target.kind==='landmark'?'':d<2.1?'Nhấn E':waypointVia?'Tới bến / chân đường leo':'';
        $('waypointHint').innerHTML=`<b style="transform:rotate(${angle}rad)">↑</b><span title="${esc(target.label)}">${esc(target.label)}<small>${Math.ceil(d)} m${hint?' · '+hint:''}</small></span>`;
      }
      let newDiscovery=false;
      if(!world.riding)for(const zone of REGIONS[save.village].zones){
        const sameArea=world.interior?world.interior.zones.includes(zone.id):!zone.platform?!world.surface:zone.platform===world.surface;
        if(!sameArea||Math.hypot(zone.x-p.x,zone.z-p.z)>zone.radius||!discoverZone(save,save.village,zone.id))continue;
        if(!landmarkNotices.length)landmarkNoticeTimer=7;
        landmarkNotices.push(zone);newDiscovery=true;
        if(waypoint?.kind==='landmark'&&waypoint.id===zone.id){waypoint=null;waypointVia=null;world.destination.visible=false;}
      }
      if(newDiscovery){persist();if(waypointSource==='campaign')refreshObjectiveMarker();}
      updateDiscoveries();
      infiltrationClock+=dt;intrusionCooldown=Math.max(0,intrusionCooldown-dt);
      if(randomEnabled&&!world.interior&&save.story.stage==='infiltrate'&&!world.riding&&!world.surface&&world.infiltrationState().length<infiltrationLimit(save.village)&&cooldown<=0&&(distance>=(['wind','earth'].includes(save.village)?35:70)||infiltrationClock>=20)){
        const zones=REGIONS[save.village].zones.filter(z=>!z.platform),zone=zones[Math.floor(Math.random()*zones.length)];
        for(let i=0;zone&&i<24;i++){const a=Math.random()*Math.PI*2,x=zone.x+Math.sin(a)*(4+Math.random()*8),z=zone.z+Math.cos(a)*(4+Math.random()*8);if(Math.hypot(x-p.x,z-p.z)>12&&!world.blocked(x,z)&&!world.infiltrationState().some(s=>Math.hypot(s.x-x,s.z-z)<10)&&findPath([x,z],[p.x,p.z],world.blocked).length){world.spawnEnemy(x,z,regionElement(save.village),Math.random()<.35?'ambush':Math.random()<.5?'tamper':'survey');refresh();distance=0;infiltrationClock=0;break;}}
      }
      if(!world.interior&&!world.riding&&!world.surface&&(save.healthFraction??1)>0&&intrusionCooldown<=0){
        const jailer=world.interactives.find(i=>i.kind==='village-guard'&&i.guardRole==='jailer');
        const fireContact=save.village==='fire'&&villageEventStep(save,'fire')<2&&jailer&&Math.hypot(jailer.x-p.x,jailer.z-p.z)<9;
        if(jailer&&(fireContact||militaryIntrusion(world.military,p))){
          intrusionCooldown=1.5;if(!jailer.occupation&&save.village!=='fire'){const gate=world.military.gate,dx=gate.x-world.military.x,dz=gate.z-world.military.z,l=Math.hypot(dx,dz)||1;p.set(gate.x+dx/l*3,gate.y??world.heightAt(gate.x,gate.z),gate.z+dz/l*3);}
          jailerDialog(jailer);return;
        }
        const infiltrator=world.caughtInfiltrator();if(infiltrator){offerBattle('infiltrator',infiltratorEncounter(save,infiltrator));return;}
      }
      const revealed=world.advanceGuards(dt,save.learnedSpells.length>0&&plotHostile(save));if(revealed.length)toast('Bụp! Cảnh vệ giải ngụy trang và đang chạy tới bạn');
      const sentry=world.caughtGuard();if(sentry&&!world.riding){if(sentry.guardRole==='jailer')jailerDialog(sentry);else offerBattle('village-guard',{guardId:sentry.id,name:sentry.label});}
      if(saveTimer>=AUTO_SAVE_SECONDS&&(moving||storageFailed))persist();
      const intro=landmarkNotices[0],near=nearest();renderLandmarkIntroduction();
      $('nearbyAction').hidden=phase!=='explore'||!!intro||!near;if(near)$('nearbyAction').innerHTML=`<kbd>E</kbd> ${questAction(near)||(near.kind==='spirit-ore'?'Gõ linh thạch · ':near.kind==='interior-enter'?'Đi vào · ':near.kind==='interior-exit'?'Đi ra · ':near.kind==='arena-host'?'Thi đấu · ':near.kind==='dock'?'Lên thuyền tới ':near.kind==='gate'?'Đi tới ':near.kind==='save'?'Lưu tiến trình · ':['quest','boss','roamer','village-guard','intro-guardian'].includes(near.kind)?'Đối mặt ':near.kind==='traversal'?'Sử dụng · ':near.kind==='expedition-goal'?'Thu thập · ':'Nói chuyện · ')}${esc(near.label)}`;
      updateMinimap();
    }
    const ride=world.traversalState();$('journeyTravel').hidden=phase!=='explore'||!ride;if(ride)$('journeyTravel').innerHTML=`<strong>${ride.automatic?'Đang tự động leo thang':ride.kind==='raft'?'Bè đang qua sông':ride.kind==='cave'?'Đang đi qua lối hang':ride.kind==='rock-climb'?(ride.mode==='hang'?'Đang bám · W / Space để trèo lên · S để buông':ride.mode==='jump'?'E: bám mép đá':'Space: nhảy gờ kế · S + Space: quay lại · E: leo tự do'):ride.kind==='stairs'?'Đang đi cầu thang · Giữ W để tiếp tục':'Đang leo · Giữ W để tiếp tục'}</strong><small>${ride.automatic?'Không cần giữ phím di chuyển': ['raft','cave'].includes(ride.kind)?'Tự cập bến / đến cửa ở cuối đường':'S để quay lại · thả phím để nghỉ'} · ${Math.round(ride.progress*100)}%</small>`;
    world.update(dt,moving,phase==='home',phase!=='explore',sprinting);
    root.querySelectorAll('[data-world]').forEach(b=>{const i=world.interactives[Number(b.dataset.world)];if(!i){b.hidden=true;return;}const offset=i.y===undefined?0:i.y-world.heightAt(i.x,i.z),p=world.project(i.x,i.z,offset+(i.kind==='gate'?5.2:i.kind==='save'?3.5:i.kind==='boss'?9:3.3)),distance=Math.hypot(i.x-world.hero.root.position.x,i.z-world.hero.root.position.z);b.style.left=p.left+'px';b.style.top=p.top+'px';b.hidden=i.depleted||['village-guard','roamer'].includes(i.kind)&&!i.revealed||!p.visible||!!world.surface&&i.platform!==world.surface||distance>(i.kind==='boss'?38:i.kind==='gate'?27:22);});
  }
  setPhase('home');
  const homeButton=document.createElement('button');homeButton.className='outline adventure-back';homeButton.textContent='← Thế giới khám phá';$('startScreen').querySelector('.scroll-heading>div').append(homeButton);homeButton.onclick=()=>{if(retreatLocked()){toast('Đối thủ đã áp sát · Phải hoàn tất giao chiến');return;}if(encounter)cancelBattle();else runLoading('Đang trở lại hành trình…',()=>{onReturn();setPhase('home');$('continueJourney').hidden=!stored;});};
  return {world,update,checkpointInfo,restoreLastCheckpoint,recordBattleOutcome(victory){if(!admin.active&&!victory&&encounter&&encounter.kind!=='arena'&&!isEarthDepartureTrial(encounter)&&save.checkpointSave){save.pendingCheckpointRestore=true;persist();}},sacrificeCompanion(){if(!sacrificeForHero(save,encounter))return false;persist();return true;},get companionHealth(){return {...save.story.companion};},recordCompanionHealth(hp){const was=companionUnconscious(save);saveCompanionHealth(save,hp);if(!was&&companionUnconscious(save))persist();},get healthFraction(){return encounter?.kind==='arena'||isEarthDepartureTrial(encounter)?1:save.healthFraction??1;},recordHealth(hp,maxHp){if(encounter?.kind==='arena'||isEarthDepartureTrial(encounter))return;save.healthFraction=Math.max(0,Math.min(1,hp/maxHp));persist();},awardExperience,awardCombatExperience,get adminEnabled(){return admin.active;},setAdminEnabled,openAdmin,get retreatLocked(){return retreatLocked();},get flask(){return flaskState(save);},useHealingFlask(hp,maxHp){if(encounter?.kind==='arena')return {ok:false,reason:'tournament'};const result=useFlask(save,hp,maxHp);if(result.ok)persist();return result;},get equipment(){return equipmentState(save);},cycleShuriken(){if(!cycleShuriken(save))return false;persist();refreshAmmunition();return true;},selectShuriken(id){if(save.equipment.ammo[id]>0&&equipItem(save,'shuriken',id)){persist();refreshAmmunition();return true;}return false;},get ammoAvailable(){return ammoCount(save.equipment)>0;},takeShuriken(){const item=takeShuriken(save);if(item){persist();refreshAmmunition();}return item;},get combatStats(){return {...combatStats(save.progression),resistances:{...equipmentState(save).armor.resistances},elementBonuses:{...equipmentState(save).armguard.bonuses}};},get trainingElement(){const e=regionElement(save.village);return systemLevel(save.progression,e)?e:spellElement(save.story.starter)||'water';},get activeView(){return !['duel','combat'].includes(phase);},get village(){return save.village;},get phase(){return phase;},get encounter(){return encounter;},get inBattle(){return phase==='combat'&&!!encounter;},beginCombat(){setPhase('combat');},finishBattle,cancelBattle,showLoadout(){setPhase('loadout');},state:()=>({tournament:JSON.parse(JSON.stringify(save.arena)),companionHealth:{...save.story.companion},carryingCompanion:carryingCompanion(save),companionMoveMultiplier:companionMoveMultiplier(save),treatment:{active:phase==='treatment',remaining:treatmentRemaining,companion:companionTreatment},opening:opening.state(),harborPassage:world.harborPassageState(),harbors:world.harborsState(),skirmish:world.skirmishState(),dialogue:dialogue.state(),peaceCeremony:peaceCeremony.state(),interior:world.interior?.id||null,mapTransition:!!mapTransfer,loading,villageStory:world.storyState(),retreatLocked:retreatLocked(),sacredTree:world.sacredTreeState(),presentation:world.presentationState(),guardSmoke:world.guardSmokeState(),guards:world.guardsState(),sabotage:world.sabotageState(),infiltrators:world.infiltrationState(),ending:storyEnding(save),sidequests:villageSidequests(save.village).map(q=>({...q,status:save.story.sidequests[q.id]||0})),residents:world.residentsState(),shops:world.interactives.filter(i=>i.kind==='shop').map(i=>({...i})),equipment:equipmentState(save),heroAppearance:{name:world.hero.root.name,...world.hero.root.userData.equipment},phase,adminEnabled:admin.active,sprinting,input:{held:[...held],focused:document.activeElement===canvas},physics:world.physicsState(),solids:world.solids.map(({name,x,z,w,d,yaw,bottom,top})=>({name,x,z,w,d,yaw,bottom,top})),metrics:world.metrics,surface:world.surface,height:world.hero.root.position.y,weather:world.weatherState(),traversal:world.traversalState(),routes:world.routes.map(r=>({id:r.id,kind:r.kind,name:r.name,from:r.from,to:r.to,fromY:r.fromY,toY:r.toY,platform:r.platform})),momentum:{...momentum},lookLocked:document.pointerLockElement===canvas,waypoint:waypoint?{kind:waypoint.kind,id:waypoint.id,label:waypoint.label}:null,encounters:{cooldown,distance,spawnAt},stats:combatStats(save.progression),camera:world.cameraState(),locomotion:world.hero.locomotionState(),save:{...JSON.parse(JSON.stringify(save)),gold:save.gold},position:[world.hero.root.position.x,world.hero.root.position.z],path:path.map(p=>[...p]),encounter:encounter?{...encounter}:null,randomEnemy:world.randomEnemy?[world.randomEnemy.root.position.x,world.randomEnemy.root.position.z]:null,obstacles:world.obstacles,gates:world.gates,storageFailed,manualSave:checkpointSummary(save)}),
    // Deterministic hooks are attached to the public API only by the test-mode caller.
    setMobileSprint(running,locked=false){mobileAutoRun=phase==='explore'&&running&&locked;sprinting=phase==='explore'&&running;},
    test:{moveTo,routeTo,interact:(kind,id)=>{const i=findJourneyItem(kind,id);if(i)moveToItem(i,true);},setRandom:enabled=>{randomEnabled=enabled;},spawn:()=>{cooldown=0;distance=999;spawnAt=0;},offerBattle,travel:id=>{const g=world.gates.find(g=>g.id===id);if(g)moveToItem(g,true);},project:(x,z)=>world.project(x,z,0),openAtlas,openJournal,openProgression,openEquipment,gainExperience:(element,amount)=>{awardExperience(element,amount);persist();refresh();}}};
}
