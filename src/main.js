import {createEnemyMovement} from './enemy-movement.js';
import * as T from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { createWorld } from "./scene.js";
import { createHands } from "./hands.js";
import { FireEffects } from "./effects.js";
import { sealNames as names } from "./poses.js";
import { createOpponent, createPlayerAvatar } from "./opponent.js";
import { CameraImpacts } from './camera-impact.js';
import { DarkDomain } from './dark-domain.js';
import { WindArts } from './wind-arts.js';
import { LightArts } from './light-arts.js';
import { EarthArts } from './earth-arts.js';
import { NatureArts } from './nature-arts.js';
import { crossWalls } from './combat.js';
import { sweepTsunami } from './tsunami.js';
import { WaterBubbles } from './water-bubbles.js';
import { createAdventure } from './adventure.js';
import { physicalKey, textInputTarget } from './game-input.js';
import { projectileMotionStep, flightTimeAt, FLIGHT_PROFILE } from './projectile-motion.js';
import { aimMagneticShots } from './elemental-combat.js';
import { setupScrollOpening } from './scroll-ui.js';
import { readLearnedSpells } from './spell-learning.js';
async function main() {
  const $ = id => document.getElementById(id), { keys, spells, elements, defaultLoadout, validateLoadout, GameRules, Fighter, intersectFireWall, intersectsWave, meteorTarget, projectileTimeStep } = globalThis.SealGameCore;
  let rules = new GameRules(), player = new Fighter(), enemy = new Fighter(), aiRules = new GameRules();
  const testMode = new URLSearchParams(location.search).get("test") === "1";
  let testAIDisabled=false;
  let adventure=null, adventureVictory=false;
  const canvas = $("world");
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.03;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.autoClear = false;
  renderer.info.autoReset = false;
  const world = createWorld(), hands = await createHands();
  const scene = world.scene, opponent = await createOpponent(scene, world.opponentSpawn);
  const playerAvatar = await createPlayerAvatar(scene);
  playerAvatar.group.visible = false;
  const windAim = new T.Group(); scene.add(windAim); windAim.visible = false;
  const aimMaterial = new T.MeshBasicMaterial({color:'#b8f6df',transparent:true,opacity:.75,depthWrite:false});
  const aimRing = new T.Mesh(new T.TorusGeometry(.72,.018,5,48),aimMaterial); aimRing.rotation.x=-Math.PI/2; windAim.add(aimRing);
  const aimArrow = new T.Mesh(new T.ConeGeometry(.16,.48,3),aimMaterial); aimArrow.rotation.x=Math.PI/2; aimArrow.position.z=1.12; windAim.add(aimArrow);
  // Render the player's cel-lit hand surfaces after world tonemapping. Their
  // local lights reveal volume; spell auras still use the bloom pass below.
  hands.root.traverse(o => { if (o.isMesh) o.layers.set(1); });
  const baseFov = 68;
  const camera3d = new T.PerspectiveCamera(baseFov, innerWidth / innerHeight, 0.05, 220), handCamera = new T.PerspectiveCamera(baseFov, innerWidth / innerHeight, 0.02, 10);
  camera3d.rotation.order = "YXZ";
  const effects = new FireEffects(scene), shots = [], particles = [], salvos = [], walls = [], fields = [];
  const cameraImpacts = new CameraImpacts();
  let cameraReaction = cameraImpacts.sample();
  const reactionPosition = new T.Vector3(), reactionRotation = new T.Quaternion(), reactionEuler = new T.Euler();
  const renderTarget = new T.WebGLRenderTarget(innerWidth, innerHeight, { type: T.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, renderTarget);
  composer.addPass(new RenderPass(scene, camera3d));
  const handsPass = new RenderPass(hands.scene, handCamera);
  handsPass.clear = false;
  handsPass.clearDepth = true;
  composer.addPass(handsPass);
  const bloom = new UnrealBloomPass(new T.Vector2(innerWidth, innerHeight), 0.27, 0.38, 1.45);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const rgb = (hex) => new T.Color(hex).toArray();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), vadd = (a, b) => a.map((x, i) => x + b[i]), vsub = (a, b) => a.map((x, i) => x - b[i]), vmul = (a, t) => a.map((x) => x * t), vlen = (a) => Math.hypot(...a), vnorm = (a) => vmul(a, 1 / (vlen(a) || 1)), dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  let randomSeed = 8491;
  function rand() {
    randomSeed = Math.imul(randomSeed, 1664525) + 1013904223 >>> 0;
    return randomSeed / 4294967296;
  }
  const range = (a, b) => a + (b - a) * rand();
  let activePose = -1, poseAge = 99, animationTime = 0, started = false, paused = false, won = false, round = 1, selected = 0, score = 0;
  let camera = { p: [0, 1.72, 7], yaw: 0, pitch: 0 }, lastTime = 0, recoil = 0, hitTimer = 0, flashTimer = 0, messageTime = 0, muted = false, audio = null;
  let moveDirection = 0, moveTargetX = 0, touchPoint = null;
  const sidestepDistance = 0.2, sidestepDuration = .2;
  const sidestepSpeed = sidestepDistance / sidestepDuration;
  let spellVoice = null;
  const dragonFormation = 1.1, dragonUncoil = .32;
  let dragonView = null;
  const meteorSkyTime = 1.4, meteorReturnTime = .4;
  const meteorZoomInTime = .24, meteorZoomAmount = 14;
  let meteorView = null;
  let waveView = null;
  let earthView = null;
  const boatRiseTime = 1.2, waveGrowthTime = 1.8;
  let loadout = [...defaultLoadout], filterElement = 'all', filterLearning = 'all', loadoutMessage = '';
  const learnedSpells=readLearnedSpells(spells);
  let journeyLearning=false,duelLoadout=null,bossEnraged=false;
  let battlePlayerStats={maxHp:200,maxChakra:100,damageMultiplier:1},aiWeaponTimer=4;
  let enemyPose = -1, enemyHit = 0, aiTimer = 2.2, aiSpell = null, aiStep = 0, aiCycle = 0, aiCasts = 0, aiCastAge = 99, battleTime = 0;
  try { const saved = JSON.parse(localStorage.getItem('anhoa-loadout-v3'));const replacements={'dark-barrier':'dark-orb','fire-orb':'fire-volley','water-orb':'water-lance','lightning-orb':'lightning-lance'};const migrated=Array.isArray(saved)?[...new Set(saved.map(id=>replacements[id]||id))]:saved;if (validateLoadout(migrated).ok) loadout = migrated; } catch {}
  duelLoadout=[...loadout];
  const activeBoss=()=>adventure?.inBattle&&adventure.encounter?.kind==='boss'?adventure.encounter:null;
  const bossDamageMultiplier=()=>adventure?.inBattle?clamp(Number(adventure.encounter.damageMultiplier)||1,.1,2.5):1;
  function availableLoadout(ids){return journeyLearning?ids.filter(id=>learnedSpells.has(id)):ids;}
  function loadJourneySpells(ids){
    if(!Array.isArray(ids))return;
    if(!journeyLearning)duelLoadout=[...loadout];
    journeyLearning=true;learnedSpells.clear();
    for(const id of ids)if(spells.some(s=>s.id===id))learnedSpells.add(id);
    loadout=availableLoadout(loadout);
    if(!loadout.length)loadout=[...learnedSpells].slice(0,5);
    filterElement='all';filterLearning='learned';loadoutMessage='';renderLoadout();
  }
  function restoreDuelSpells(){
    journeyLearning=false;learnedSpells.clear();
    for(const id of readLearnedSpells(spells))learnedSpells.add(id);
    loadout=[...duelLoadout];filterLearning='all';
  }
  const playerShield = new T.Mesh(new T.SphereGeometry(1, 24, 16), new T.MeshBasicMaterial({ color: '#a6edff', transparent: true, opacity: .09, wireframe: true, depthWrite: false }));
  playerShield.scale.set(1.05, 1.5, 1.05); scene.add(playerShield);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const darkDomain = new DarkDomain(world,reducedMotion);
  const windArts = new WindArts(scene);
  const waterBubbles = new WaterBubbles(scene);
  const earthArts = new EarthArts(scene);
  const lightArts = new LightArts(scene,intersectFireWall,(a,b)=>earthArts.intersectTerrain(a,b));
  const natureArts=new NatureArts(scene,(x,z)=>earthArts.heightAt(x,z),{player:playerAvatar.group,enemy:opponent.group},intersectFireWall,world.plantReferenceHeight);
  // Retain the overhead camera/avatar for later use; normal gameplay stays in FPS.
  let windCameraEnabled=false,windView=null;
  let quality = 1;
  const qualities = [{ name: "Cao", ratio: 1.7, shadow: 2048, bloom: true, grass: 1700 }, { name: "C\xE2n b\u1EB1ng", ratio: 1.25, shadow: 1024, bloom: true, grass: 1200 }, { name: "Th\u1EA5p", ratio: 1, shadow: 512, bloom: false, grass: 650 }];
  function resize() {
    const preset = qualities[quality], dpr = Math.min(devicePixelRatio || 1, preset.ratio);
    renderer.setPixelRatio(dpr);
    renderer.setSize(innerWidth, innerHeight, false);
    composer.setPixelRatio(dpr);
    composer.setSize(innerWidth, innerHeight);
    effects.setPixelRatio(dpr);
    world.setInkViewport(innerWidth,innerHeight);
    hands.setInkViewport(innerWidth,innerHeight);
    opponent.setInkViewport(innerWidth,innerHeight);
    playerAvatar.setInkViewport(innerWidth,innerHeight);
    windArts.setInkViewport(innerWidth,innerHeight);
    for (const c of [camera3d, handCamera]) {
      c.aspect = innerWidth / innerHeight;
      c.updateProjectionMatrix();
      // The world aiming ray and locked mouse share the exact viewport center.
      // Keep the existing lower framing of the first-person hands.
      c.projectionMatrix.elements[9] = c === handCamera ? -0.14 : 0;
      c.projectionMatrixInverse.copy(c.projectionMatrix).invert();
    }
  }
  function setQuality(index) {
    quality = index;
    const q = qualities[index];
    world.sun.shadow.mapSize.set(q.shadow, q.shadow);
    world.sun.shadow.map?.dispose();
    world.sun.shadow.map = null;
    world.grass.count = q.grass;
    renderer.shadowMap.enabled = index !== 2;
    world.sun.castShadow = index !== 2;
    for (const s of [scene, hands.scene]) s.traverse((o) => {
      if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) m.needsUpdate = true;
    });
    bloom.enabled = q.bloom;
    $("qualityLabel").textContent = q.name;
    $("qualityButton").title = "Ch\u1EA5t l\u01B0\u1EE3ng: " + q.name;
    composer.renderTarget1.samples = composer.renderTarget2.samples = index === 0 ? 4 : index === 1 ? 2 : 0;
    composer.renderTarget1.dispose();
    composer.renderTarget2.dispose();
    resize();
  }
  window.addEventListener("resize", resize);
  $("qualityButton").onclick = () => setQuality((quality + 1) % qualities.length);
  setQuality(quality);
  $("sealKeys").innerHTML = keys.map((key, i) => '<button class="seal" data-key="' + key + '" title="' + key.toUpperCase() + " \u2014 \u1EA4n " + String(i + 1).padStart(2, "0") + ": " + names[i] + '" aria-label="\u1EA4n ' + (i + 1) + ", ph\xEDm " + key + '"><span class="thumb" style="background-position:' + i % 3 * 50 + "% " + Math.floor(i / 3) * 25 + '%"></span><span class="seal-key">' + key.toUpperCase() + "</span><small>" + String(i + 1).padStart(2, "0") + "</small></button>").join("");
  function spellMarkup(spell, i, preparation = false) {
    const activationStats={waterbubbles:'4 bong bóng · nổ lần lượt mỗi giây · 12 sát thương/quả · hồi 6 giây',ignite:'Bỏng 1–5 tầng → 10 / 20 / 30 / 45 / 60 sát thương',discharge:'Tĩnh điện 1–3 → choáng 0,5 / 1 / 2s → từ tính 3 / 5 / 7s'};
    if (!preparation) return '<button class="spell ' + (i === selected ? 'selected' : '') + (spell.sequence.length>8?' long-chain':'') + '" style="--element:' + spell.color + '" data-spell="' + i + '"><div class="spell-title">' + spell.name + '<span class="spell-cooldown" data-cooldown></span></div><div class="spell-sequence">' + spell.sequence.map(k => '<kbd data-seq="' + k + '">' + k.toUpperCase() + '</kbd>').join('') + '</div></button>';
    const taken = loadout.includes(spell.id), kind = activationStats[spell.style] ? (spell.style==='waterbubbles'?'BẪY':'KÍCH HOẠT') : spell.oncePerMatch?'KHỞI TẠO':spell.kind === 'attack' ? 'CÔNG' : 'THỦ';
    const stats = activationStats[spell.style] || (spell.oncePerMatch?'Không gây sát thương · 1 lần mỗi trận':spell.element==='wood'?({flowerpoison:'Khói tím 6 giây · vùng 2–5 m · 5–15 sát thương/giây trong vùng',vinebind:'18–54 sát thương · trói 2–6 giây',bamboostab:'Lá tre bay tới điểm ngắm · 1–3 đợt, tổng 75–225 sát thương',walnutwall:'Quả rơi và hóa lớn · chắn phía trước, 5–7 giây'})[spell.style]:spell.style==='snowball'?'Đủ 90 tuyết · tự tìm địch · kết liễu':spell.style==='icewall'?'Tường băng trồi lên · 120 độ bền · 5 giây':spell.style==='icefog'?'Sương phủ người · nhìn xuyên từ bên trong · ảo ảnh lệch vị trí':spell.style==='icebind'?'Gom tuyết rồi bắn · đóng băng 3 giây':spell.element==='earth'?({earthspikes:'Chạy ngầm · bật gai khi tới địch · 40 sát thương',earthcraterspikes:'50 sát thương · chông trong hố Địa Bộc Thiên Tinh',earthquake:'5 × 30 sát thương · địa hình gồ ghề thêm 5 giây',earthwall:'180 độ bền · tường cong 6 giây · chặn đường',earthgravity:'80 khi giam + 100 khi rơi · giam 3 giây · hố 1,5 giây sau cú rơi'})[spell.style]:spell.element==='light'?({lightray:'Laser thẳng · 40 / 70 sát thương',lightsphere:'8 giây · laser thành 7 sắc · +75% sát thương',lightdome:'Gương rơi ghép vòm · 3 ô né · 10 giây · laser cộng dồn',lightmirror:'2,5 giây · 120 độ bền · gương phản đòn phía trước',jacob:'Cột sáng từ trời · 160 sát thương · bán kính 3,5 m'})[spell.style]:spell.style==='aircombo'?'70 sát thương tổng · nối thêm 2 giây':spell.style==='tornado'?'70 sát thương · hất tung 2 giây':spell.style==='windspirit'?'Tinh linh 5 giây · phản chiêu từ phía trước':spell.style==='domain' ? 'Lãnh địa 30 giây · mở khóa voi bóng và lặn' : spell.style==='shadowclone'?'Tối đa 3 bóng · chó 38, nâng thành bò 57':spell.style==='shadowcommand'?'Chó 38 / bò 57 sát thương · ánh đỏ nhẹ':spell.style==='shadowbind'?'90 sát thương · nhấn chìm 2 giây':spell.style==='shadowdive'?'Lặn 3 giây · nhìn qua bóng đen mờ, vẫn thi triển':spell.kind === 'attack' ? spell.damage + (spell.count > 1 ? ' × ' + spell.count : '') + ' sát thương' : ['firewall', 'waterwall','windwall'].includes(spell.style) ? spell.shield + ' độ bền · chặn đạn' : spell.shield + ' khiên' + (spell.heal ? ' · hồi ' + spell.heal + ' máu' : ''));
    return '<button class="spell ' + (preparation ? taken ? 'equipped' : '' : i === selected ? 'selected' : '') + '" style="--element:' + spell.color + '" data-' + (preparation ? 'equip="' + spell.id : 'spell="' + i) + '"' + (preparation ? ' aria-pressed="' + taken + '"' : '') + '><span class="spell-icon">' + spell.glyph + '</span><div><div class="spell-title">' + spell.name + '<small>' + kind + ' · ' + spell.cost + ' CH · HỒI CHIÊU ' + spell.cooldown + 's' + (spell.snowCost ? ' · ' + spell.snowCost + ' TUYẾT' : '') + '</small></div><p>' + spell.subtitle + (preparation ? '<br>' + stats : '') + '</p><div class="spell-sequence">' + spell.sequence.map(k => '<kbd data-seq="' + k + '">' + k.toUpperCase() + '</kbd>').join('') + '</div></div>' + (preparation ? '<span class="equip-mark">' + (taken ? '✓' : '+') + '</span>' : '') + '</button>';
  }
  function renderLoadout() {
    loadout=availableLoadout(loadout);
    $('loadoutCount').textContent = loadout.length + ' / 5';
    $('loadoutSlots').innerHTML = Array.from({ length: 5 }, (_, i) => {
      const s = spells.find(s => s.id === loadout[i]);
      return s ? '<button class="loadout-slot filled" data-remove="' + s.id + '" style="--element:' + s.color + '" title="Bỏ ' + s.name + '"><b>' + s.glyph + '</b><span>' + s.name + '<small>' + (s.kind === 'attack' ? 'Tấn công' : 'Phòng ngự') + '</small></span><i>×</i></button>' : '<div class="loadout-slot empty"><b>' + (i + 1) + '</b><span>Ô chiêu trống</span></div>';
    }).join('');
    const visible = spells.filter(s => (filterElement === 'all' || s.element === filterElement) && (filterLearning === 'all' || learnedSpells.has(s.id)===(filterLearning==='learned')));
    $('spellCatalog').innerHTML = visible.length?visible.map((s, i) => spellMarkup(s, i, true)).join(''):'<p class="catalog-empty" role="status">'+(filterLearning==='unlearned'?'Không có chiêu chưa học.':'Chưa có chiêu đã học.')+'</p>';
    $('selectElementLoadout').hidden=filterElement==='all';
    $('clearLoadout').disabled=loadout.length===0;
    const valid = validateLoadout(loadout);
    $('startButton').disabled = !valid.ok;
    $('loadoutNotice').textContent = loadoutMessage || (valid.ok ? '' : valid.reason);
    document.querySelectorAll('[data-equip]').forEach(el => {
      const locked=journeyLearning&&!learnedSpells.has(el.dataset.equip);
      el.disabled=locked;el.classList.toggle('unlearned',locked);
      if(locked){el.title='Chưa học · Tìm cao nhân trong hành trình để được truyền dạy.';el.querySelector('.equip-mark').textContent='◇';}
      el.onclick=()=>toggleEquip(el.dataset.equip);
    });
    document.querySelectorAll('[data-remove]').forEach(el => el.onclick = () => toggleEquip(el.dataset.remove));
    document.querySelectorAll('[data-element]').forEach(el => el.classList.toggle('active', el.dataset.element === filterElement));
    document.querySelectorAll('[data-kind]').forEach(el => el.classList.toggle('active', el.dataset.kind === filterLearning));
  }
  function toggleEquip(id) {
    if (started) return;
    if(journeyLearning&&!learnedSpells.has(id)){loadoutMessage='Chưa học chiêu này. Hãy tìm cao nhân để được truyền dạy.';renderLoadout();return;}
    if (loadout.includes(id)) { loadout = loadout.filter(x => x !== id); loadoutMessage = ''; }
    else {
      const candidate = [...loadout, id], valid = validateLoadout(candidate);
      if (!valid.ok) loadoutMessage = valid.reason + ' Bỏ một chiêu đã chọn để thay thế.';
      else { loadout = candidate; loadoutMessage = ''; }
    }
    renderLoadout();
  }
  $('elementFilters').innerHTML = '<button data-element="all">Tất cả</button>' + elements.map(el => '<button data-element="' + el.id + '" style="--element:' + el.color + '"><b>' + el.glyph + '</b> ' + el.name + '</button>').join('');
  document.querySelectorAll('[data-element]').forEach(el => el.onclick = () => { filterElement = el.dataset.element; renderLoadout(); });
  document.querySelectorAll('[data-kind]').forEach(el => el.onclick = () => { filterLearning = el.dataset.kind; renderLoadout(); });
  $('presetAttack').onclick = () => { loadout = [...defaultLoadout]; loadoutMessage = ''; renderLoadout(); };
  $('presetDefense').onclick = () => { loadout = ['fire-volley', 'wind-lance', 'earth-barrier', 'water-reflect', 'ice-barrier']; loadoutMessage = ''; renderLoadout(); };
  $('presetFire').onclick = () => { loadout = ['fire-volley', 'fire-lance', 'fire-meteor', 'fire-barrier', 'fire-reflect']; filterElement = 'fire'; filterLearning = 'all'; loadoutMessage = ''; renderLoadout(); };
  $('clearLoadout').onclick = () => { loadout = []; loadoutMessage = ''; renderLoadout(); };
  $('selectElementLoadout').onclick=()=>{
    if(started||filterElement==='all')return;
    loadout=availableLoadout(spells.filter(s=>s.element===filterElement).map(s=>s.id)).slice(0,5);
    filterLearning='all';loadoutMessage='';renderLoadout();
  };
  function renderGuide() {
    $('spellList').innerHTML = rules.spells.map((s, i) => spellMarkup(s, i)).join('');
    document.querySelectorAll('[data-spell]').forEach(el => el.onclick = () => selectSpell(Number(el.dataset.spell)));
  }
  function selectSpell(i) { if (!rules.spells[i]) return; selected = i; updateUI(); }
  function announce(text, error = false) {
    $('message').textContent = text; $('message').style.color = error ? '#ffc28b' : '#c7d5bb'; messageTime = 3.2;
  }
  function updateUI() {
    const supply=$('carriedAmmo');supply.hidden=!adventure?.inBattle;$('cycleAmmo').hidden=supply.hidden;if(!supply.hidden){const e=adventure.equipment;supply.textContent=e.shuriken.name+' · '+e.available+' còn lại · '+e.shuriken.damage+' ST';}
    const seq = rules.sequence;
    const matches = s => seq.length && s.sequence.slice(0, seq.length).join('') === seq.join('');
    const matching = rules.spells[selected] && matches(rules.spells[selected]) ? selected : rules.spells.findIndex(matches);
    if (matching >= 0) selected = matching;
    const spell = rules.spells[selected] || rules.spells[0];
    $('comboSlots').innerHTML = spell.sequence.map((k, i) => '<span class="combo-slot ' + (seq[i] === k ? 'done' : seq.length === i ? 'next' : '') + '">' + k.toUpperCase() + '</span>').join('');
    $('comboSlots').classList.toggle('long-chain',spell.sequence.length>8);
    $('comboSlots').parentElement.classList.toggle('long-chain',spell.sequence.length>8);
    const ready = rules.ready();
    $('comboLabel').textContent = ready?.id === spell.id ? 'ẤN HOÀN CHỈNH · ' + spell.name.toUpperCase() : spell.name.toUpperCase() + ' / ' + seq.length + ' / ' + spell.sequence.length + ' ẤN';
    $('castButton').disabled = (adventure?.inBattle&&!rules.ready()&&!adventure.ammoAvailable)||!started || paused || won || !!darkDomain.transition || player.controlTime > 0 || (ready ? !natureArts.canCast('player',ready) || (ready.requiresBurn&&!enemy.burns.length) || (ready.requiresStatic&&!enemy.staticStacks) || (ready.requiresDomain&&!darkDomain.usable) || (ready.requiresAirborne&&!windArts.canCombo('player')) || (ready.requiresCrater&&!earthArts.crater('player')) || (ready.requiresClones&&!darkDomain.commandable('player').length) || (ready.style==='shadowclone'&&!darkDomain.canSummon('player',ready.maxClones)) || rules.cooldown > 0 || rules.remaining(ready.id)>0 || rules.chakra<ready.cost : rules.shurikenCooldown>0);
    $('castButton').querySelector('span').textContent=ready?(rules.remaining(ready.id)>0?'HỒI '+rules.remaining(ready.id).toFixed(1)+'s':'THI TRIỂN'):'NÉM PHI TIÊU';
    // Hand readiness effects follow exactly the same gate as the Space button.
    hands.setReady($('castButton').disabled ? null : ready?.element);
    document.querySelectorAll('.seal').forEach(el => { el.classList.toggle('active', el.dataset.key === keys[activePose]); el.classList.toggle('pending', seq.includes(el.dataset.key)); });
    document.querySelectorAll('[data-spell]').forEach((el, i) => { el.classList.toggle('selected', i === selected);const remaining=rules.remaining(rules.spells[i].id),badge=el.querySelector('[data-cooldown]');if(badge)badge.textContent=remaining>0?remaining.toFixed(1)+'s':'';el.classList.toggle('on-cooldown',remaining>0);el.classList.toggle('nature-locked',!natureArts.canCast('player',rules.spells[i]));el.title=!natureArts.canCast('player',rules.spells[i])?(rules.spells[i].oncePerMatch?'Đã dùng một lần trong trận':rules.spells[i].requiresGarden?'Cần gieo vườn bằng chiêu 10 ấn và chờ cây trồi lên':rules.spells[i].snowCost?'Cần gọi mưa tuyết và tích đủ '+rules.spells[i].snowCost+' tuyết':'Cần tích đủ 90 tuyết'):''; el.classList.toggle('domain-locked',!!rules.spells[i].requiresDomain&&!darkDomain.usable); el.classList.toggle('combo-locked',!!rules.spells[i].requiresAirborne&&!windArts.canCombo('player')); el.classList.toggle('crater-locked',!!rules.spells[i].requiresCrater&&!earthArts.crater('player')); el.querySelectorAll('kbd').forEach((k, j) => k.classList.toggle('done', i === selected && seq[j] === k.dataset.seq)); });
  }
  function initAudio() {
    if (audio) return;
    try {
      audio = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      muted = true;
    }
  }
  function tone(freq = 260, duration = 0.08, type = "sine", volume = 0.06) {
    if (muted || !audio) return;
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(freq * 0.65, audio.currentTime + duration);
    g.gain.setValueAtTime(volume, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(1e-4, audio.currentTime + duration);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + duration);
  }
  function fireSound() {
    if (muted || !audio) return;
    const size = audio.sampleRate * 0.65, buffer = audio.createBuffer(1, size, audio.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
    const src = audio.createBufferSource(), filter = audio.createBiquadFilter(), gain = audio.createGain();
    src.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1500, audio.currentTime);
    filter.frequency.exponentialRampToValueAtTime(180, audio.currentTime + 0.6);
    gain.gain.value = 0.26;
    src.connect(filter).connect(gain).connect(audio.destination);
    src.start();
  }
  function seal(key) {
    if (!started || paused || won || darkDomain.transition || player.controlTime > 0) return;
    const result = rules.seal(key); activePose = keys.indexOf(key); hands.seal(activePose); poseAge = 0;
    $('currentSeal').textContent = key.toUpperCase() + ' / Ấn ' + String(activePose + 1).padStart(2, '0') + ' · ' + names[activePose];
    tone(290 + activePose * 28, .09, 'triangle');
    if (!result.valid) announce('Sai chuỗi. Chỉ dùng các chiêu đã mang vào trận.', true);
    else if (result.ready) {
      if((result.ready.requiresBurn&&!enemy.burns.length)||(result.ready.requiresStatic&&!enemy.staticStacks)){
        announce(result.ready.requiresBurn?'Cần gây bỏng lên đối thủ trước khi dùng Phóng hỏa.':'Cần tích tĩnh điện lên đối thủ trước khi dùng Điện giật.',true);updateUI();return;
      }
      const extendable = rules.spells.some(s => s.sequence.length > rules.sequence.length && s.sequence.slice(0, rules.sequence.length).join('') === rules.sequence.join(''));
      announce(result.ready.snowCost&&!natureArts.canCast('player',result.ready)?'Cần gọi mưa tuyết và tích đủ '+result.ready.snowCost+' tuyết để thi triển.':result.ready.requiresGarden&&!natureArts.wood.ready('player')?'Cần gieo vườn bằng chiêu 10 ấn và chờ cây trồi lên.':result.ready.oncePerMatch&&!natureArts.canCast('player',result.ready)?'Chiêu này đã dùng một lần trong trận.':result.ready.requiresSnowFull&&!natureArts.snowReady('player')?'Cần tích đủ 90 tuyết để dùng Tuyết Táng.':result.ready.requiresCrater&&!earthArts.crater('player') ? 'Cần tạo hố bằng Địa Bộc Thiên Tinh trước.' : result.ready.requiresDomain&&!darkDomain.usable ? 'Cần mở Hắc lãnh địa trước khi dùng '+result.ready.name+'.' : result.ready.name + ' đủ ' + result.ready.sequence.length + ' ấn: SPACE thi triển' + (extendable ? ', hoặc kết tiếp để dùng chiêu mạnh hơn.' : '.'));
      tone(670, .23);
    } else {
      const candidate = rules.spells.find(s => s.sequence.slice(0, rules.sequence.length).join('') === rules.sequence.join(''));
      announce('Ấn ' + rules.sequence.length + ' / ' + (candidate?.sequence.length || rules.spells[selected].sequence.length) + ' — tiếp tục kết ấn');
    }
    updateUI();
  }
  function aim() { const cp = Math.cos(camera.pitch); return [-Math.sin(camera.yaw) * cp, Math.sin(camera.pitch), -Math.cos(camera.yaw) * cp]; }
  function earthFloor(owner,x,z){return earthArts.floor(owner,x,z)+(earthArts.captured(owner)?0:windArts.height(owner));}
  function enemyPos() { const p=opponent.group.position;return [p.x,1.72+earthFloor('enemy',p.x,p.z),p.z]; }
  function playerPos(){return [camera.p[0],camera.p[1]+earthFloor('player',camera.p[0],camera.p[2]),camera.p[2]];}

  function windActors(){return [{owner:'player',pos:playerPos(),height:playerAvatar.group.userData.height,dir:aim(),fighter:player},{owner:'enemy',pos:enemyPos(),height:opponent.group.userData.height,dir:vnorm(vsub(playerPos(),enemyPos())),fighter:enemy}];}
  function reflectWind(shot){
    if(!windArts.redirect(shot,windActors()))return false;
    if(dragonView?.shot===shot)clearDragonView();if(meteorView?.shot===shot)clearMeteorView();if(waveView?.shot===shot)clearWaveView();
    if(shot.owner==='player'){announce('Tiên linh gió đã thổi chiêu ngược lại!');cameraImpacts.trigger('reflect',.65);}
    return true;
  }
  function launch(spell, owner, pos, dir) {
    if(!natureArts.canCast(owner,spell))return false;
    spell=natureArts.empower(owner,spell);
    if(spell.style==='waterbubbles'){
      waterBubbles.cast(owner,spell,natureArts.perceivedPosition(owner,windActors()));
      if(owner==='player')announce('Thủy bộc cầu · 4 bong bóng nổ lần lượt ở giây 1, 2, 3, 4.');
      return true;
    }
    if(['ignite','discharge'].includes(spell.style)){
      const victim=owner==='player'?enemy:player,target=owner==='player'?enemyPos():playerPos();
      if(spell.style==='ignite'){
        const ignition=victim.ignite();if(!ignition)return false;
        impact({owner,element:'fire',style:'ignite',damage:ignition.damage,v:vnorm(vsub(target,pos)),color:spell.color,unreflectable:true},target);
      }else{
        const discharge=victim.discharge();if(!discharge)return false;
        interruptActor(owner==='player'?'enemy':'player');
        effects.lightningArts.blast(target,.45+discharge.stacks*.22);
        if(owner==='player')announce('Điện giật · choáng '+discharge.stun+'s, từ tính '+discharge.magnetic+'s');
      }
      return true;
    }
    if(['wood','ice'].includes(spell.element)){
      const art=natureArts.cast(owner,spell,pos,dir,windActors(),walls,shots,['bamboostab','icebind'].includes(spell.style)?volleyTarget(owner,pos,dir):undefined);
      if(art!==null)return art;
    }
    if(owner==='player')clearEarthView();
    if(spell.element==='earth'){
      const art=earthArts.cast(owner,spell,pos,dir,windActors(),walls);if(!art)return false;
      if(owner==='player'){
        clearWindView();clearDragonView();clearMeteorView();clearWaveView();cameraImpacts.trigger('defense',.6);
        if(spell.style==='earthgravity')beginEarthView(art);
      }
      return true;
    }
    if(spell.element==='light'&&spell.style!=='jacob'){
      if(owner==='player'){clearWindView();clearDragonView();clearMeteorView();clearWaveView();cameraImpacts.reset();}
      if(['lightsphere','lightdome','lightmirror'].includes(spell.style))lightArts.place(owner,spell,pos,dir,windActors());
      else{
        const origin=vadd(vadd(pos,vmul(dir,.6)),vmul(vnorm([-dir[2],0,dir[0]]),.24));origin[1]-=.16;
        lightArts.fire(owner,spell,origin,vnorm(vsub(volleyTarget(owner,pos,dir),origin)));
      }
      return true;
    }
    if(spell.style==='domain'){
      if(!usesWindCamera())clearWindView();
      clearDragonView();clearMeteorView();setWorldFov(baseFov);hands.clearEffects();
      return darkDomain.begin(owner,spell.duration,camera.p,aim());
    }
    if(spell.element==='dark'){
      // The falling elephant applies its hit inside DarkDomain, outside impact().
      if(spell.style==='shadowbind')spell={...spell,damage:spell.damage*(owner==='player'?battlePlayerStats.damageMultiplier:bossDamageMultiplier())};
      const victim={owner:owner==='player'?'enemy':'player',pos:owner==='player'?enemyPos():camera.p,fighter:owner==='player'?enemy:player};
      const result=darkDomain.cast(spell,owner,pos,dir,volleyTarget(owner,pos,dir),owner==='player'?player:enemy,victim);
      if(result&&spell.style==='shadowdive'&&owner==='player'){
        if(!usesWindCamera())clearWindView();
        clearDragonView();clearMeteorView();clearWaveView();setWorldFov(baseFov);cameraImpacts.reset();
      }
      return result;
    }
    if(spell.style==='aircombo')return windArts.combo(owner,spell);
    if(spell.style==='windspirit'){
      const spirit=windArts.summon(owner,spell,pos,dir);
      if(owner==='player'&&windCameraEnabled){
        clearWindView();clearDragonView();clearMeteorView();clearWaveView();cameraImpacts.reset();setWorldFov(baseFov);
        windView={spirit,from:camera3d.quaternion.clone(),fromPosition:camera3d.position.clone(),phase:'summoning'};handsPass.enabled=false;document.body.classList.add('wind-camera');
      }
      return true;
    }
    if (spell.kind === 'defense') {
      if (owner === 'player') cameraImpacts.trigger('defense');
      if(spell.style==='stormfield') {
        for(let i=fields.length-1;i>=0;i--)if(fields[i].owner===owner)fields.splice(i,1);
        const normal=vnorm([dir[0],0,dir[2]]),p=vadd(pos,vmul(normal,4));p[1]=.08;
        fields.push({owner,p,radius:spell.fieldRadius,height:spell.fieldHeight,slowFactor:spell.slowFactor,life:spell.duration,age:0});
        return;
      }
      if (['firewall', 'waterwall','windwall'].includes(spell.style)) {
        const normal = vnorm([dir[0], 0, dir[2]]);
        // Casting another wall replaces this owner's previous wall.
        for (let i = walls.length - 1; i >= 0; i--) if (walls[i].owner === owner) walls.splice(i, 1);
        const p = vadd(pos, vmul(normal, 3)); p[1] = spell.style === 'waterwall' ? pos[1] : 0;
        walls.push({ owner, element: spell.element, p, normal, radius: spell.wallRadius, width: spell.wallWidth, height: spell.wallHeight, hp: spell.shield, life: spell.duration });
        burst([p[0], .15, p[2]], 24, 1.5, spell.color); return;
      }
      (owner === 'player' ? player : enemy).defend(spell); burst(pos, 20, .9, spell.color); return;
    }
    if (spell.style === 'boat') {
      const target = volleyTarget(owner, pos, dir), origin = vadd(pos, vmul(vnorm([dir[0], 0, dir[2]]), 6));
      const p = [...origin]; p[1] = -5.5;
      const travelTime = Math.max(.2, vlen(vsub(target, origin)) / spell.speed);
      shots.push({ p, old: [...p], origin, target, v: vmul(vsub(target, origin), 1 / travelTime), travelTime,
        phase: 'emerging', riseTime: boatRiseTime, flightAge: 0,
        size: spell.size, damage: spell.damage, controlDuration:spell.controlDuration, blastRadius: spell.blastRadius, style: spell.style, element: spell.element,
        color: spell.color, owner, unreflectable: true, reflected: false, life: flightTimeAt(travelTime*spell.speed,spell.speed) + .1, trail: 0, age: 0 });
      if (owner === 'player') cameraImpacts.trigger('orb', 1.3);
      return;
    }
    if (spell.style === 'tsunami') {
      const normal = vnorm([dir[0], 0, dir[2]]), p = [pos[0], .03, pos[2]];
      const shot = { p, old: [...p], origin: [...p], v: vmul(normal, spell.speed), normal, width: spell.waveWidth, height: spell.waveHeight, depth: 7,
        phase: 'gathering', introStage: 'pool', growthTime: waveGrowthTime, growth: 0, flightAge: 0,
        size: spell.size, damage: spell.damage, style: spell.style, element: spell.element, color: spell.color,
        owner, unreflectable: true, reflected: false, life: 5, trail: 0, age: 0, carried: [] };
      shots.push(shot);
      if (owner === 'player') beginWaveView(shot);
      return;
    }
    if(['thunder','jacob'].includes(spell.style)) {
      const target=spell.style==='jacob'?volleyTarget(owner,pos,dir):meteorTarget(pos,dir);target[1]=.08;
      const cloudPoint=[target[0],44,target[2]],returnTime=spell.style==='jacob'?.55:meteorReturnTime;
      const strikeTime=spell.style==='jacob'?spell.chargeTime:spell.chargeTime+returnTime+.12;
      const impactTime=spell.style==='jacob'?strikeTime+returnTime:strikeTime;
      const shot={p:[...cloudPoint],old:[...cloudPoint],v:[0,0,0],target,cloudPoint,
        chargeTime:spell.chargeTime,skyTime:spell.chargeTime,returnTime,strikeTime,impactTime,totalTime:impactTime+(spell.style==='jacob'?1.1:.85),
        preludeAge:0,phase:'charging',age:0,life:3,damage:spell.damage,blastRadius:spell.blastRadius,size:spell.size,
        style:spell.style,element:spell.element,color:spell.color,owner,unreflectable:true,reflected:false,trail:0};
      shots.push(shot);if(owner==='player')beginMeteorView(shot);tone(65,.45,'sawtooth',.05);return;
    }
    if (spell.style === 'meteor') {
      const target = meteorTarget(pos, dir), skyStart = [target[0] + 38, 65, target[2] + 7];
      const totalTime = vlen(vsub(target, skyStart)) / spell.speed;
      const velocity = vmul(vsub(target, skyStart), 1 / totalTime);
      const cloudParamTime = (65 - 42) / -velocity[1];
      const cloudBreakTime = flightTimeAt(cloudParamTime*spell.speed,spell.speed);
      const cloudPoint = vadd(skyStart, vmul(velocity, cloudParamTime));
      const shot = { p: [...skyStart], old: [...skyStart], v: velocity, target,
        skyStart, totalTime, cloudPoint, cloudBreakTime, phase: 'sky', preludeAge: 0,
        skyTime: meteorSkyTime, returnTime: meteorReturnTime, fallAge: 0, blastRadius: spell.blastRadius, unreflectable: true,
        size: spell.size, damage: spell.damage, style: spell.style, element: spell.element, color: spell.color, owner, reflected: false, life: flightTimeAt(totalTime*spell.speed,spell.speed) + .5, fallTime: Math.max(0,flightTimeAt(totalTime*spell.speed,spell.speed)-meteorSkyTime-meteorReturnTime), trail: 0, age: 0 };
      shots.push(shot);
      if (owner === 'player') beginMeteorView(shot);
      tone(72, .6, 'sawtooth', .055); return;
    }
    if (spell.style === 'dragon') {
      // Formation is part of the spell itself; speech and chakra consumption start immediately.
      const p = vadd(pos, vmul(dir, 5));
      shots.push({ p, old: [...p], origin: [...p], v: vmul(dir, spell.speed),
        phase: 'forming', formation: dragonFormation, uncoil: dragonUncoil, flightAge: 0,
        size: spell.size, damage: spell.damage, style: spell.style, element: spell.element,
        color: spell.color, owner, reflected: false, life: 4, trail: 0, age: 0 });
      return;
    }
    if (spell.element === 'fire' && spell.style === 'volley') {
      const target = volleyTarget(owner, pos, dir);
      for (let i = 0; i < spell.count; i++) {
        const shot = { p: [...pos], old: [...pos], v: [0, 0, 0], target: [...target], rowIndex: i,
          castDirection: [...dir], phase: 'staged', holdTime: spell.holdTime,
          releaseAt: spell.holdTime + i * spell.salvoInterval, flightAge: 0,
          size: spell.size, speed: spell.speed, damage: spell.damage, style: spell.style, element: spell.element, color: spell.color,
          owner, reflected: false, life: 4, trail: 0, age: 0 };
        positionVolley(shot); shot.old = [...shot.p]; shots.push(shot);
      }
      return;
    }
    const right = vnorm([-dir[2], 0, dir[0]]);
    if(spell.element==='lightning'&&['lance','bird'].includes(spell.style)) {
      const target=volleyTarget(owner,pos,dir),p=vadd(vadd(pos,vmul(dir,spell.style==='bird'?5:.85)),vmul(right,spell.style==='lance'?.85:0));
      p[1]+=spell.style==='bird'?.3:-.1;
      shots.push({p,old:[...p],v:vmul(vnorm(vsub(target,p)),spell.speed),target,size:spell.size,damage:spell.damage,style:spell.style,
        origin:[...p],phase:spell.style==='bird'?'forming':'flying',formation:dragonFormation,flightAge:0,
        element:spell.element,color:spell.color,owner,reflected:false,life:4,trail:0,age:0});
      if(owner==='player')cameraImpacts.trigger('orb');return;
    }
    if (owner === 'player') cameraImpacts.trigger('orb');
    for (let i = 0; i < spell.count; i++) {
      const spread = (i - (spell.count - 1) / 2) * .12;
      const d = vnorm(vadd(dir, vmul(right, spread)));
      const p = vadd(pos, vmul(d, .85));
      shots.push({ p, old: [...p], v: vmul(d, spell.speed), size: spell.size, damage: spell.damage, controlDuration: spell.controlDuration, style: spell.style, element: spell.element, color: spell.color, owner, reflected: false, life: 4, trail: 0, age: 0 });
    }
  }
  function launchShuriken(owner,weapon,pos,dir){
    const infused=weapon,target=volleyTarget(owner,pos,dir),side=vnorm([-dir[2],0,dir[0]]),p=vadd(vadd(pos,vmul(dir,.7)),vmul(side,.15));p[1]-=.12;
    shots.push({owner,element:'weapon',shurikenType:weapon.shurikenType||'iron',energy:!!weapon.energy,waterInfused:!!infused.waterInfused,style:'shuriken',phase:'flying',p,old:[...p],v:vmul(vnorm(vsub(target,p)),infused.speed),size:infused.size,damage:infused.damage,color:weapon.color||'#707983',life:4,age:0,flightAge:0,trail:0,reflected:false});
    return infused;
  }
  function volleyTarget(owner, pos, dir) {
    const opponentPosition = natureArts.perceivedPosition(owner,windActors());
    const delta = vsub(opponentPosition, pos), along = dot(delta, dir);
    if (along > 0 && vlen(vsub(delta, vmul(dir, along))) < .65) return vadd(pos, vmul(dir, along));
    const distance = dir[1] < -.025 ? clamp(-pos[1] / dir[1], 1, 55) : 31;
    return vadd(pos, vmul(dir, distance));
  }
  function positionVolley(shot) {
    const x = (shot.rowIndex - 1) * .28;
    if (shot.owner === 'player') {
      const local = new T.Vector3(x, -.06, -1.1);
      local.applyEuler(new T.Euler(camera.pitch, camera.yaw, 0, 'YXZ'));
      shot.p = vadd(playerPos(), local.toArray());
    } else {
      const right = vnorm([-shot.castDirection[2], 0, shot.castDirection[0]]);
      shot.p = vadd(vadd(enemyPos(), vmul(shot.castDirection, 1.1)), vmul(right, x)); shot.p[1] += .15;
    }
  }
  function cast() {
    if (!started || paused || won) return;
    if(darkDomain.transition){announce('Đang chuyển vào hoặc ra khỏi lãnh địa.',true);return;}
    if (player.controlTime > 0) { announce('Đang bị khóa bởi '+player.controlSource+'!', true); return; }
    if(!rules.ready()){
      if(adventure?.inBattle&&!adventure.ammoAvailable){announce('Hết phi tiêu · Rút lui về cửa hàng để tiếp tế.',true);return;}
      const result=rules.throwShuriken();if(!result.ok)return;
      if(adventure?.inBattle){const item=adventure.takeShuriken();result.weapon={...result.weapon,damage:item.damage,color:item.color,shurikenType:item.id,energy:!!item.energy};}
      const weapon=launchShuriken('player',result.weapon,playerPos(),aim());
      activePose=-1;poseAge=0;recoil=.08;hands.cast();playerAvatar.rig.cast();tone(720,.035,'triangle',.018);announce('Phi tiêu · '+weapon.damage+' sát thương · không tốn chakra');updateUI();return;
    }
    const result = rules.cast({burnStacks:enemy.burns.length,staticStacks:enemy.staticStacks,woodGarden:natureArts.wood.ready('player'),snowFull:natureArts.snowReady('player'),snowAmount:natureArts.snowAmount('player'),earthCrater:!!earthArts.crater('player'),windAirborne:windArts.canCombo('player'),darkDomain:darkDomain.usable,shadowClones:darkDomain.commandable('player').length,shadowCloneCount:darkDomain.cloneCount('player'),shadowUpgrades:darkDomain.upgradable('player').length});
    if (!result.ok) { announce({ burn:'Cần gây bỏng lên đối thủ trước.',static:'Cần tích tĩnh điện lên đối thủ trước.', spellCooldown:'Chiêu này đang hồi · còn '+(result.remaining||0).toFixed(1)+' giây.',snowCost:'Cần gọi mưa tuyết bằng chiêu 10 ấn và tích ít nhất 3 tuyết để thi triển.',garden:'Cần gieo hạt bằng chiêu 10 ấn và chờ cây trồi lên trước.',once:'Chiêu 10 ấn này chỉ dùng một lần mỗi trận.',snow:'Cần gọi tuyết và tích đủ 90 tuyết trước khi dùng Tuyết Táng.', crater: 'Cần hố Địa Bộc Thiên Tinh của bạn đã hình thành trước khi tạo chông.', sequence: 'Kết đủ chuỗi ấn của một chiêu đã mang theo.',airborne:'Cần địch đang bị lốc của bạn hất tung và chưa nối liên trảm.', domain:'Cần mở Hắc lãnh địa trước khi dùng chiêu này.',clones:'Cần tạo phân thân trước khi ra lệnh tấn công.',cloneLimit:'Bên bạn đã đủ 3 bò bóng, không còn chó để nâng cấp.', cooldown: 'Chờ một nhịp để thi triển tiếp.', chakra: 'Chakra chưa đủ — chờ hồi phục.' }[result.reason], true); tone(130, .1); return; }
    const spell = result.spell;
    if(adventure?.inBattle)adventure.awardExperience(spell.element,2);
    activePose = -1; poseAge = 0; recoil = .22; flashTimer = .12; hands.cast(); playerAvatar.rig.cast(); fireSound();
    const upgrading=spell.style==='shadowclone'&&darkDomain.cloneCount('player')>=spell.maxClones;
    launch(spell, 'player', playerPos(), aim()); announce(upgrading?'Nâng thành bò bóng · 57 sát thương!':spell.name + '!');
    speakSpell(spell);
    updateUI();
  }
  function speakSpell(spell) {
    stopSpellVoice();
    if (!muted && window.speechSynthesis && window.SpeechSynthesisUtterance) {
      try {
        const utterance = new SpeechSynthesisUtterance(spell.name + '!');
        utterance.lang = 'vi-VN'; utterance.rate = .95; utterance.pitch = .85; utterance.volume = 1;
        const voice = window.speechSynthesis.getVoices().find(v => /^vi(?:-|$)/i.test(v.lang));
        if (voice) utterance.voice = voice;
        spellVoice = utterance;
        utterance.onend = utterance.onerror = () => { if (spellVoice === utterance) spellVoice = null; };
        window.speechSynthesis.cancel(); window.speechSynthesis.resume(); window.speechSynthesis.speak(utterance);
      } catch { stopSpellVoice(); }
    }
  }
  function stopSpellVoice() {
    if (!spellVoice) return;
    spellVoice.onend = spellVoice.onerror = null;
    spellVoice = null;
    try { window.speechSynthesis.cancel(); } catch {}
  }
  function particle(p, v, size = .06, life = .7, color = '#ff9756', source = null) {
    if (particles.length >= 650) return;
    particles.push({ p: [...p], v: [...v], size, life, max: life, color: rgb(color), source });
  }
  function burst(pos, count, speed, color = '#ff9756') {
    if (count >= 12) effects.explosion(pos, count > 20 ? 1.8 : .8, color);
    for (let i = 0; i < count; i++) particle(pos, [range(-speed, speed), range(.2, speed * 1.2), range(-speed, speed)], range(.025, .1), range(.4, .95), color);
  }
  function finish(victory) {
    hands.clearEffects();
    if (won) return;
    enemyMoving=false;enemyMovement.reset(opponent.group.position.x);
    darkDomain.reset();clearDarkArts();
    clearEarthView();earthArts.reset(walls);clearWindView();windArts.reset();lightArts.reset();natureArts.reset(walls);waterBubbles.reset();
    stopSpellVoice();
    clearDragonView();
    clearMeteorView();
    cameraImpacts.reset();
    setWorldFov(baseFov);
    won = true; moveTargetX = camera.p[0]; moveDirection = 0; enemyPose = -1; releaseAimLock();
    salvos.length = 0;
    score = victory ? 1 : 0; $('score').textContent = String(score).padStart(2, '0');
    $('resultLabel').textContent = victory ? 'CHIẾN THẮNG' : 'THẤT BẠI';
    $('resultTitle').textContent = victory ? 'Bạn đã làm chủ trận đấu.' : 'Một trận đấu. Một bài học.';
    $('winStats').textContent = (victory ? 'Đã hạ đối thủ' : 'Bạn đã hết máu') + ' sau ' + Math.floor(battleTime) + ' giây · ' + rules.casts + ' lần thi triển · còn ' + Math.ceil(player.hp) + ' máu.';
    adventureVictory=victory;
    $('nextButton').innerHTML=adventure?.inBattle?(victory?'TIẾP TỤC KHÁM PHÁ':'HỒI SINH TẠI ĐIỂM LƯU')+' <span>→</span>':'CHỌN CHIÊU · TRẬN TIẾP <span>→</span>';
    $('winScreen').classList.remove('hidden'); updateUI();
  }
  function interruptActor(owner){
    if(owner==='player'){rules.clear();activePose=-1;hands.clearEffects();moveTargetX=camera.p[0];moveDirection=0;}
    else{aiRules.clear();aiSpell=null;aiStep=0;enemyPose=-1;$('enemyAction').textContent=enemy.controlSource;}
  }
  function elementalStatus(f){
    return [f.burns.length?'Bỏng '+f.burns.length+'/5':'',f.staticStacks?'Tĩnh điện '+f.staticStacks+'/3':'',f.magneticTime>0?'Từ tính '+(f.magneticDelay>0?'sau choáng · ':'')+f.magneticTime.toFixed(1)+'s':''].filter(Boolean).join(' · ');
  }
  function impact(shot, pos) {
    const multiplier=shot.owner==='player'?battlePlayerStats.damageMultiplier:bossDamageMultiplier();
    const fighter = shot.owner === 'enemy' ? player : enemy, result = fighter.receive(shot.damage*multiplier, shot.reflected || shot.unreflectable,!!shot.ignoreShield,shot.waterInfused?'water':shot.element);
    if(adventure?.inBattle&&shot.owner==='player'&&result.damage>0)adventure.awardExperience(shot.element==='weapon'?(shot.waterInfused?'water':adventure.trainingElement):shot.element,result.damage*.5);
    shot.hitResult=result;
    if(result.immune)return true;
    fighter.applyElementHit(shot.element,result,shot.style);
    if(shot.style==='boat'&&result.damage>0){fighter.boatControlTime=Math.max(fighter.boatControlTime,shot.controlDuration||1);interruptActor(shot.owner==='player'?'enemy':'player');}
    if(shot.style==='poisontick'){
      if(result.restored)announce(shot.owner==='player'?'Đối thủ đã hồi đầy sinh lực!':'Bạn đã hồi đầy sinh lực!');
      return true;
    }
    if (dragonView?.shot === shot && dragonView.phase === 'overhead') { dragonView.phase = 'impact'; dragonView.hold = 0; }
    const cleanVolleyHit = shot.element === 'fire' && shot.style === 'volley';
    if(shot.element==='weapon'){
      burst(pos,4,.45,'#bdc9d7');
    }else if(shot.element==='light'){
      lightArts.flash(pos);
    }else if(shot.element==='earth'){
      earthArts.burst(vadd(pos,[0,-1.2,0]),.6);
    }else if(shot.element==='wind'){
      if(shot.style!=='aircut')windArts.cut(pos);
    }else if(shot.element==='dark') {
      darkDomain.splash(pos);
    } else if(shot.element==='lightning') {
      if(shot.style!=='thunder')effects.lightningArts.blast(pos,shot.style==='bird'?1.8:.7);
      for(let i=0;i<18;i++)particle(pos,[range(-2,2),range(-.5,2),range(-2,2)],.04,.45,shot.color);
    } else if (shot.style !== 'meteor' && !cleanVolleyHit) burst(pos, 14, .9, shot.color);
    if (result.reflected) {
      if (shot.owner === 'enemy') cameraImpacts.trigger('reflect');
      shot.owner = shot.owner === 'enemy' ? 'player' : 'enemy'; shot.reflected = true;
      const destination = shot.owner === 'enemy' ? playerPos() : enemyPos(), d = vnorm(vsub(destination, pos));
      if (cleanVolleyHit) shot.target = [...destination];
      shot.v = vmul(d, vlen(shot.v)); shot.p = vadd(pos, vmul(d, .9)); shot.old = [...shot.p]; shot.life = 4;
      announce('Phản đòn!'); return false;
    }
    if (shot.style === 'prison' && result.damage > 0) {
      fighter.controlTime = shot.controlDuration;
      if (shot.owner === 'player') {
        aiRules.clear(); aiSpell = null; aiStep = 0; enemyPose = -1;
        $('enemyAction').textContent = 'Thủy ngục · bị giam 3 giây';
      } else {
        rules.clear(); activePose = -1; hands.clearEffects(); moveTargetX = camera.p[0]; moveDirection = 0;
      }
    }
    if(shot.style==='icebind'){
      const victimOwner=shot.owner==='enemy'?'player':'enemy';natureArts.freeze(shot.owner,{owner:victimOwner,fighter},shot.controlDuration||3);
      if(victimOwner==='player'){rules.clear();hands.clearEffects();activePose=-1;moveTargetX=camera.p[0];moveDirection=0;announce('Băng Phược · bị đóng băng 3 giây!',true);}
      else{aiRules.clear();aiSpell=null;aiStep=0;enemyPose=-1;}
    }
    if(shot.style==='vinehit'){
      const victimOwner=shot.owner==='enemy'?'player':'enemy';natureArts.wood.bind({owner:victimOwner,fighter},shot.controlDuration);
      if(victimOwner==='player'){rules.clear();hands.clearEffects();activePose=-1;moveTargetX=camera.p[0];moveDirection=0;announce('Dây leo · bị trói '+shot.controlDuration.toFixed(1)+' giây!',true);}
      else{aiRules.clear();aiSpell=null;aiStep=0;enemyPose=-1;}
    }
    if(shot.style==='tornado'&&result.damage>0){
      const victim={owner:shot.owner==='player'?'enemy':'player',fighter};windArts.lift(shot.owner,victim,shot.controlDuration||2);
      if(victim.owner==='player'){
        rules.clear();activePose=-1;hands.clearEffects();moveTargetX=camera.p[0];moveDirection=0;if(!usesWindCamera())clearWindView();clearDragonView();clearMeteorView();
        if(aiRules.spells.some(s=>s.style==='aircombo')){aiRules.clear();aiSpell=null;aiStep=0;aiTimer=.12;}
      }
      else{
        aiRules.clear();aiSpell=null;aiStep=0;enemyPose=-1;$('enemyAction').textContent='Phong lốc · hất tung 2 giây';
        if(rules.spells.some(s=>s.style==='aircombo'))announce('Địch bị hất tung · R A D rồi SPACE để nối Phong liên trảm!');
      }
    }
    if (cleanVolleyHit) {
      for (let i = particles.length - 1; i >= 0; i--) if (particles[i].source === shot) particles.splice(i, 1);
    } else if (shot.element === 'fire' && shot.style !== 'meteor') effects.arts.blast(pos, shot.style);
    if (shot.owner === 'player' && shot.style === 'dragon') cameraImpacts.trigger('dragonHit');
    if (shot.owner === 'enemy') {
      const right = [Math.cos(camera.yaw), 0, -Math.sin(camera.yaw)];
      const incoming = vnorm(shot.v);
      const side = dot(incoming, right);
      cameraImpacts.trigger(result.damage ? 'hit' : 'block', result.damage ? Math.min(1.5, .6 + result.damage / 100) : .7, [side, -.15, .5]);
    }
    if (shot.owner === 'player') { enemyHit = .3; hitTimer = .14; tone(110, .07, 'triangle', .04); }
    else { flashTimer = .8; recoil = .3; $('flash').style.background = '#e54955'; announce(result.damage ? 'Trúng đòn! Bấm chuột trái/phải để né hoặc kết ấn phòng ngự.' : 'Khiên đã chặn đòn!', !!result.damage); }
    if (result.restored) announce(shot.owner === 'player' ? 'Đối thủ đã hồi đầy sinh lực!' : 'Bạn đã hồi đầy sinh lực!');
    return true;
  }
  function shadowCrushImpact(binding,victim,result) {
    if(adventure?.inBattle&&binding.owner==='player'&&result.damage>0)adventure.awardExperience('dark',result.damage*.5);
    if(victim.owner==='enemy'){
      aiRules.clear();aiSpell=null;aiStep=0;enemyPose=-1;enemyHit=.3;hitTimer=.14;
      $('enemyAction').textContent='Ảnh tượng · bị nhấn chìm 2 giây';tone(80,.15,'triangle',.06);
    }else{
      rules.clear();activePose=-1;hands.clearEffects();moveTargetX=camera.p[0];moveDirection=0;
      flashTimer=.8;recoil=.3;$('flash').style.background='#e54955';
      cameraImpacts.trigger('hit',1.5,[0,-.4,.7]);announce('Voi bóng nhấn chìm bạn · khóa thao tác 2 giây!',true);
    }
    if(result.restored)announce(victim.owner==='enemy'?'Đối thủ đã hồi đầy sinh lực!':'Bạn đã hồi đầy sinh lực!');
  }
  function meteorImpact(shot) {
    const pos = [shot.p[0], .1, shot.p[2]];
    effects.arts.blast(pos, 'meteor', shot.blastRadius);
    for (let j = 0; j < 80; j++) particle(pos, [range(-7, 7), range(2, 12), range(-7, 7)], range(.025, .08), range(.6, 1.2), '#ffc56e');
    recoil = Math.max(recoil, .65); tone(48, .55, 'sawtooth', .09);
    cameraImpacts.trigger('meteorHit', clamp(1 - vlen(vsub(pos, camera.p)) / 65, .15, 1));
    for (const wall of walls) if (Math.hypot(pos[0] - wall.p[0], pos[2] - wall.p[2]) <= shot.blastRadius) wall.hp = Math.max(0, wall.hp - shot.damage);
    const target = shot.owner === 'enemy' ? playerPos() : enemyPos();
    if (Math.hypot(target[0] - pos[0], target[2] - pos[2]) <= shot.blastRadius) impact(shot, pos);
  }
  function thunderImpact(shot) {
    const pos=shot.target;
    if(shot.style==='jacob')lightArts.flash([pos[0],1.72,pos[2]],2);
    else effects.lightningArts.blast(pos,shot.blastRadius);
    cameraImpacts.trigger('thunderHit',clamp(1-vlen(vsub(pos,camera.p))/65,.2,1));tone(45,.45,'sawtooth',.085);
    for(const wall of walls)if(Math.hypot(pos[0]-wall.p[0],pos[2]-wall.p[2])<=shot.blastRadius)wall.hp=Math.max(0,wall.hp-shot.damage);
    const target=shot.owner==='enemy'?playerPos():enemyPos();
    if(Math.hypot(target[0]-pos[0],target[2]-pos[2])<=shot.blastRadius)impact(shot,pos);
  }
  function commitMotion(shot,step,dt,motionStart=shot.p,motionVelocity=shot.v){
    const before=shot.motionDistance||0;
    shot.motionTime=step.motionTime;shot.motionDistance=(shot.motionDistance||0)+step.distance;
    shot.slowFactor=step.slowFactor;shot.flightSpeedRatio=step.speedRatio;shot.motionSpeed=dt>0?step.distance/dt:0;
    if(shot.element!=='weapon'&&!shot.flightBurstStarted&&before<=FLIGHT_PROFILE.launchDistance&&shot.motionDistance>FLIGHT_PROFILE.launchDistance){
      shot.flightBurstStarted=true;
      const direction=vnorm(motionVelocity),origin=vadd(motionStart,vmul(direction,Math.max(0,FLIGHT_PROFILE.launchDistance-before)));
      effects.flightBursts.trigger(shot,origin);
      // Coalesce nearby bursts into one camera pulse; every shot keeps its wind tear.
      if(shot.owner==='player'&&!cameraImpacts.pulses.some(p=>p.type==='flightBurst'))cameraImpacts.trigger('flightBurst');
    }
  }
  function travelStep(shot,dt,commit=false) {
    const step=projectileMotionStep(shot,dt,fields,projectileTimeStep);
    if(commit)commitMotion(shot,step,dt);
    return step.travelTime;
  }
  function wallImpact(wall,point,result,shot){
    burst(point,shot.style==='shuriken'?4:15,shot.style==='shuriken'?.45:1.6,shot.style==='shuriken'?'#bdc9d7':wall.element==='ice'?'#b8efff':wall.element==='water'?'#50baff':'#ffc45e');
    if(shot.style!=='shuriken'){if(wall.element==='earth')earthArts.burst(point,1);else if(wall.element==='wind')windArts.cut(point);else if(!['water','ice'].includes(wall.element))effects.arts.blast(point,'orb');}
    if(wall.owner==='player'){announce(result.broken?'Lớp chắn đã vỡ!'+(result.remaining>0?' Đòn đánh còn '+Math.round(result.remaining*10)/10+' sát thương.':''):'Lớp chắn đã chặn đòn!');cameraImpacts.trigger('block',.8);}
  }
  function updateShots(dt) {
    aimMagneticShots(shots,windActors());
    for(let i=fields.length-1;i>=0;i--){fields[i].life-=dt;fields[i].age+=dt;if(fields[i].life<=1e-6)fields.splice(i,1);}
    for (let i = walls.length - 1; i >= 0; i--) { if(!walls[i].earthEffect)walls[i].life -= dt; if (walls[i].life <= 0 || walls[i].hp <= 0) walls.splice(i, 1); }
    // Let the continuous forward gust catch swept projectiles before walls or waves resolve them.
    const reflectedByGuard=new Set();
    if(dt>0)for(const shot of shots){
      if(shot.phase==='blooming')continue;
      const start=[...shot.p],velocity=[...shot.v],step=projectileMotionStep(shot,dt,fields,projectileTimeStep);shot.old=[...start];shot.p=vadd(start,vmul(shot.v,step.travelTime));
      if(lightArts.redirect(shot,windActors(),walls)){
        commitMotion(shot,step,dt,start,velocity);reflectedByGuard.add(shot);
        if(dragonView?.shot===shot)clearDragonView();if(meteorView?.shot===shot)clearMeteorView();if(waveView?.shot===shot)clearWaveView();
      }else if(reflectWind(shot)){commitMotion(shot,step,dt,start,velocity);reflectedByGuard.add(shot);}
      else shot.p=start;
    }
    const swept = new Set();
    for (const wave of shots.filter(s => s.style === 'tsunami' && s.phase === 'flying'&&!reflectedByGuard.has(s))) {
      if (swept.has(wave)) continue;
      const end = vadd(wave.p, vmul(wave.v, travelStep(wave,dt)));
      sweepTsunami(wave,wave.p,end,{actors:windActors(),walls,fields,dark:darkDomain,wind:windArts,light:lightArts,earth:earthArts,nature:natureArts,intersectsWave});
      for (const other of shots) {
        if (other === wave || swept.has(other)) continue;
        const otherEnd = ['forming', 'staged', 'emerging', 'gathering','blooming'].includes(other.phase) ? other.p : vadd(other.p, vmul(other.v, travelStep(other,dt)));
        if (intersectsWave(other.p, otherEnd, wave.p, end, wave.normal, wave.width, wave.height, other.size, wave.depth)) {
          swept.add(other); wave.carried.push({ color: other.color, style: other.style, owner: other.owner, element: other.element });
          if (wave.carried.length > 24) wave.carried.shift();
        }
      }
    }
    waterBubbles.advance(dt,windActors(),impact);
    for (let i = shots.length - 1; i >= 0; i--) {
      const shot = shots[i];
      if(shot.consumedByDefense){shots.splice(i,1);continue;}
      if(shot.windTimeLeft!==undefined){shot.windTimeLeft-=dt;if(shot.windTimeLeft<=0){shots.splice(i,1);continue;}}
      if (swept.has(shot)) { shots.splice(i, 1); continue; }
      if(reflectedByGuard.has(shot))continue;
      shot.old = [...shot.p];
      let flightDt = dt;
      if(shot.phase==='blooming'){
        shot.releaseAge+=dt;if(shot.releaseAge+1e-6<shot.releaseAt)continue;
        flightDt=Math.max(0,shot.releaseAge-shot.releaseAt);shot.phase='flying';
      }

      if(['thunder','jacob'].includes(shot.style)) {
        shot.age+=dt;shot.preludeAge=Math.min(shot.skyTime+shot.returnTime,shot.age);
        shot.phase=shot.age<shot.skyTime?'charging':shot.age+1e-6<shot.skyTime+shot.returnTime?(shot.style==='jacob'?'descending':'returning'):shot.age+1e-6<shot.strikeTime?'ready':shot.age<shot.impactTime+.3?'striking':'fading';
        if(!shot.hitTarget&&shot.age+1e-6>=shot.impactTime){shot.hitTarget=true;thunderImpact(shot);}
        if(shot.age>=shot.totalTime)shots.splice(i,1);if(won)break;continue;
      }
      if (shot.style === 'tsunami') {
        if (shot.phase === 'gathering') {
          shot.age += dt;
          shot.introStage = shot.age < .35 ? 'pool' : shot.age < .7 ? 'foam' : 'rising';
          const t = clamp((shot.age - .7) / (shot.growthTime - .7), 0, 1);
          shot.growth = t * t * (3 - 2 * t);
          shot.p = vadd(shot.origin, vmul(shot.normal, shot.growth * 4.5));
          if (shot.age + 1e-6 < shot.growthTime) continue;
          flightDt = Math.max(0, shot.age - shot.growthTime);
          shot.age = shot.growthTime; shot.phase = 'flying'; shot.introStage = 'flying'; shot.growth = 1;
        }
        const travelDt=travelStep(shot,flightDt,true);
        shot.motionSpeed=dt>0?vlen(shot.v)*travelDt/dt:0;
        shot.p = vadd(shot.p, vmul(shot.v, travelDt)); shot.age += flightDt; shot.life -= flightDt; shot.flightAge += travelDt;
        sweepTsunami(shot,shot.old,shot.p,{actors:windActors(),walls,fields,dark:darkDomain,wind:windArts,light:lightArts,earth:earthArts,nature:natureArts,intersectsWave});
        const target = shot.owner === 'enemy' ? playerPos() : enemyPos();
        if (!shot.hitTarget && intersectsWave(target, target, shot.old, shot.p, shot.normal, shot.width, shot.height, .54, shot.depth)) {
          shot.hitTarget = true; impact(shot, target);
        }
        if (shot.life <= 0 || Math.abs(shot.p[0]) > 65 || Math.abs(shot.p[2]) > 65) shots.splice(i, 1);
        if (won) break;
        continue;
      }
      if (shot.style === 'boat') {
        if (shot.phase === 'emerging') {
          shot.age += dt;
          const t = clamp(shot.age / shot.riseTime, 0, 1), ease = t * t * (3 - 2 * t);
          shot.p[1] = T.MathUtils.lerp(-5.5, shot.origin[1], ease);
          if (shot.age + 1e-6 < shot.riseTime) continue;
          flightDt = Math.max(0, shot.age - shot.riseTime);
          shot.age = shot.riseTime; shot.p = [...shot.origin]; shot.old = [...shot.p]; shot.phase = 'flying';
          if (shot.owner === 'player') { beginDragonView(shot); cameraImpacts.trigger('orb', 1.3); }
        }
        shot.flightAge = Math.min(shot.travelTime, shot.flightAge + travelStep(shot,flightDt,true)); shot.age += flightDt;
        shot.p = vadd(shot.origin, vmul(shot.v, shot.flightAge));
        if(crossWalls(shot,walls,intersectFireWall,(w,p,r)=>wallImpact(w,p,r,shot))){shots.splice(i,1);continue;}
        if (shot.flightAge + 1e-6 >= shot.travelTime) {
          burst(shot.target, 36, 3, shot.color);
          const target = shot.owner === 'enemy' ? playerPos() : enemyPos();
          if (vlen(vsub(target, shot.target)) <= shot.blastRadius) impact(shot, shot.target);
          shots.splice(i, 1);
        }
        if (won) break;
        continue;
      }
      if (shot.style === 'meteor') {
        // Keep the straight trajectory; the launch and burst profile changes travel speed only.
        shot.age += dt;shot.travelAge=Math.min(shot.totalTime,(shot.travelAge||0)+travelStep(shot,dt,true));
        const prelude = shot.skyTime + shot.returnTime;
        shot.preludeAge = Math.min(prelude, shot.age); shot.fallAge = Math.max(0, shot.age - prelude);
        shot.phase = shot.age < shot.skyTime ? 'sky' : shot.age + 1e-6 < prelude ? 'returning' : 'falling';
        shot.p = vadd(shot.skyStart, vmul(shot.v, shot.travelAge));
        emitShotTrail(shot, dt);
        if (shot.travelAge + 1e-6 >= shot.totalTime) { shot.p = [...shot.target]; meteorImpact(shot); shots.splice(i, 1); }
        if (won) break;
        continue;
      }
      if (shot.phase === 'staged') {
        shot.age += dt; positionVolley(shot); shot.old = [...shot.p];
        if (shot.age + 1e-6 < shot.releaseAt) continue;
        flightDt = Math.max(0, shot.age - shot.releaseAt); shot.age = shot.releaseAt;
        shot.phase = 'flying'; shot.v = vmul(vnorm(vsub(shot.target, shot.p)), shot.speed);
        if (shot.owner === 'player') cameraImpacts.trigger('volley');
        tone(190 + shot.rowIndex * 55, .09, 'triangle', .035);
      }
      if (shot.phase === 'forming') {
        shot.age += dt;
        if (shot.age + 1e-6 < shot.formation) continue;
        flightDt = Math.max(0, shot.age - shot.formation);
        shot.age = shot.formation; shot.phase = 'flying';
        if (shot.owner === 'player') { beginDragonView(shot); cameraImpacts.trigger('dragon'); }
        burst(shot.p, 18, 1.8, shot.color); tone(85, .25, 'sawtooth', .045);
      }
      const travelDt=travelStep(shot,flightDt,true);
      shot.p = vadd(shot.p, vmul(shot.v, travelDt));
      if (shot.gravity) { shot.p = vadd(shot.p, vmul(shot.gravity, .5 * travelDt * travelDt)); shot.v = vadd(shot.v, vmul(shot.gravity, travelDt)); }
      shot.life -= flightDt; shot.age += flightDt;
      if (shot.phase === 'flying') shot.flightAge += flightDt;
      emitShotTrail(shot, flightDt);
      const groundHit=earthArts.intersectTerrain(shot.old,shot.p,Math.min(.15,shot.size||.04));
      if(groundHit){if(shot.style==='shuriken')burst(groundHit,4,.4,'#bdc9d7');else earthArts.burst(groundHit,.8);shots.splice(i,1);continue;}
      if(crossWalls(shot,walls,intersectFireWall,(w,p,r)=>wallImpact(w,p,r,shot))){shots.splice(i,1);continue;}
      const target = shot.owner === 'enemy' ? playerPos() : enemyPos(), delta = vsub(shot.p, shot.old), t = clamp(dot(vsub(target, shot.old), delta) / (dot(delta, delta) || 1), 0, 1), closest = vadd(shot.old, vmul(delta, t));
      const collided = (shot.owner==='enemy'?player:enemy).invulnerableTime<=0&&vlen(vsub(closest, target)) < .54 + shot.size;
      if (shot.element === 'fire' && shot.style === 'volley' && !collided && dot(vsub(shot.target, shot.old), vsub(shot.target, shot.p)) <= 0) { shots.splice(i, 1); continue; }
      if (collided && impact(shot, closest)) shots.splice(i, 1);
      else if (shot.life <= 0 || Math.abs(shot.p[0]) > 30 || Math.abs(shot.p[2]) > 45 || shot.p[1] < earthArts.heightAt(shot.p[0],shot.p[2])+.08) shots.splice(i, 1);
      if (won) break;
    }
  }
  function emitShotTrail(shot, dt) {
    if(shot.style==='shuriken')return;
    shot.trail += dt;
    while (shot.trail > .025) {
      shot.trail -= .025; particle(shot.p, vmul(shot.v, -.06*(shot.flightSpeedRatio??1)), shot.size * .4, shot.style === 'meteor' ? .8 : .4, shot.color, shot);
      if (shot.element === 'fire') {
        const jitter = [range(-shot.size, shot.size), range(-shot.size, shot.size), range(-shot.size, shot.size)];
        particle(vadd(shot.p, jitter), [range(-.8, .8), range(.2, 1.2), range(-.8, .8)], .04, .6, '#ffc56f', shot);
      }
    }
  }
  function enemyCastDirection(spell){return vnorm(vsub(natureArts.perceivedPosition('enemy',windActors()),enemyPos()));}
  const enemyMovement=createEnemyMovement(rand);
  let enemyMoving=false;
  function updateAI(dt) {
    enemyMoving=false;
    if(testAIDisabled)return;
    const old=enemyPos(),next=enemyMovement.update(dt,{position:old,shots,beginner:!!adventure?.inBattle&&adventure.encounter.hp<=100,heavy:!!activeBoss()&&['earth','wood','nameless','dark'].includes(adventure.encounter.village),casting:!!aiSpell,blocked:enemy.hp<=0||enemy.controlTime>0||natureArts.buried('enemy')||windArts.airborne.some(a=>a.victim==='enemy')||darkDomain.depth('enemy')<-.1,slow:earthArts.slowAt(old[0],old[2]),constrain:goal=>lightArts.constrainMovement('enemy',old,earthArts.move(old,goal))});
    opponent.group.position.x=next[0];enemyMoving=Math.abs(next[0]-old[0])>.0001;
    aiRules.tick(dt); aiCastAge += dt;aiWeaponTimer=Math.max(0,aiWeaponTimer-dt);
    const boss=activeBoss();
    if(boss){
      aiRules.chakra=Math.min(aiRules.maxChakra,aiRules.chakra+dt*(bossEnraged?4:2));
      if(!bossEnraged&&enemy.hp<=enemy.maxHp*.5){
        bossEnraged=true;aiTimer=Math.min(aiTimer,.2);
        $('enemyElement').textContent='THỦ LĨNH · '+boss.name+' · CUỒNG NỘ';
        announce(boss.name+' nổi giận! Nhịp kết ấn nhanh hơn.',true);
        burst(enemyPos(),22,1.8,elements.find(e=>e.id===boss.element)?.color||'#e8a368');
      }
    }
    if (enemy.controlTime > 0) { $('enemyAction').textContent = enemy.controlSource+' · ' + enemy.controlTime.toFixed(1) + 's'; return; }
    if(adventure?.inBattle&&!aiSpell&&aiWeaponTimer<=0){const thrown=aiRules.throwShuriken();if(thrown.ok){launchShuriken('enemy',thrown.weapon,enemyPos(),enemyCastDirection());opponent.rig.cast();aiWeaponTimer=adventure?.inBattle?adventure.encounter.weaponInterval:SealGameCore.shuriken.interval;}}
    aiTimer -= dt;
    if (aiTimer > 0) return;
    if (!aiSpell) {
      const incoming = shots.some(s => s.owner === 'player' && vlen(vsub(s.p, enemyPos())) < 11);
      const available=s=>aiRules.remaining(s.id)<=1e-7&&s.cost<=aiRules.chakra&&(!boss||!s.oncePerMatch||!aiRules.usedOnce.has(s.id))&&natureArts.canCast('enemy',s)&&(!s.requiresBurn||player.burns.length)&&(!s.requiresStatic||player.staticStacks)&&(!s.requiresCrater||!!earthArts.crater('enemy'))&&(!s.requiresAirborne||windArts.canCombo('enemy'))&&(!s.requiresDomain||darkDomain.usable)&&(!s.requiresClones||darkDomain.commandable('enemy').length)&&(s.style!=='shadowclone'||darkDomain.canSummon('enemy',s.maxClones));
      const defenses = aiRules.spells.filter(s => s.kind === 'defense' && available(s)), attacks = aiRules.spells.filter(s => s.kind === 'attack' && available(s));
      const choices = incoming && enemy.shieldTime <= 0 && defenses.length && aiCycle % 3 === 2 ? defenses : attacks.length?attacks:defenses;
      const activation=aiRules.spells.find(s=>available(s)&&((s.style==='ignite'&&player.burns.length>=3)||(s.style==='discharge'&&player.staticStacks>=2)));
      if(activation){aiSpell=activation;
      }else if(aiRules.spells.some(s=>s.element==='ice'&&s.style==='snowstorm')){
        const desired=!natureArts.weather('enemy')?'snowstorm':natureArts.snowReady('enemy')?'snowball':['icefog','icebind','icewall'][aiCycle%3];
        aiSpell=aiRules.spells.find(s=>s.element==='ice'&&s.style===desired&&available(s))||[...defenses,...attacks].find(available);
      }else if(aiRules.spells.some(s=>s.style==='woodseed')){
        const desired=!natureArts.tree('enemy')?'woodseed':incoming?'walnutwall':['flowerpoison','vinebind','bamboostab'][aiCycle%3];aiSpell=aiRules.spells.find(s=>s.element==='wood'&&s.style===desired&&available(s))||choices[aiCycle%choices.length];
      }else if(aiRules.spells.some(s=>s.style==='shadowclone')){
        const hasClones=darkDomain.commandable('enemy').length>0;
        const desired=!darkDomain.usable?'domain':!hasClones?'shadowclone':['shadowcommand','shadowbind','shadowcommand','shadowdive'][Math.max(0,aiCycle-2)%4];
        aiSpell=aiRules.spells.find(s=>s.style===desired&&available(s))||choices.find(s=>hasClones?['shadowcommand','shadowbind','shadowdive'].includes(s.style):s.style==='shadowclone');
      }else if(aiRules.spells.some(s=>s.style==='tornado')){
        aiSpell=windArts.canCombo('enemy')?aiRules.spells.find(s=>s.style==='aircombo'&&available(s)):incoming&&defenses.length?defenses[aiCycle%defenses.length]:aiRules.spells.find(s=>s.style===['tornado','windslash','windspirit','tornado'][aiCycle%4]&&available(s))||choices[aiCycle%choices.length];
      }else if(aiRules.spells.some(s=>s.element==='light')){
        const own=lightArts.optics.filter(o=>o.owner==='enemy');
        const desired=incoming&&!own.some(o=>o.kind==='mirror')?'lightmirror':own.some(o=>o.kind==='dome'&&!o.rays.length)?'lightray':['lightsphere','lightray','lightdome','lightray','jacob'][aiCycle%5];
        aiSpell=aiRules.spells.find(s=>s.style===desired&&available(s))||choices[aiCycle%choices.length];
      }else if(aiRules.spells.some(s=>s.element==='earth')){
        const crater=earthArts.crater('enemy'),hasSpikes=earthArts.effects.some(e=>e.owner==='enemy'&&e.kind==='craterspikes');
        const desired=incoming?'earthwall':crater&&!hasSpikes?'earthcraterspikes':['earthspikes','earthquake','earthgravity'][aiCycle%3];
        aiSpell=aiRules.spells.find(s=>s.style===desired&&available(s))||choices[aiCycle%choices.length];
      }else aiSpell=choices[aiCycle%choices.length];
      if (!aiSpell) { aiTimer = .6; return; }
      aiRules.clear(); aiStep = 0; aiCycle++;
    }
    if (aiStep < aiSpell.sequence.length) {
      const key = aiSpell.sequence[aiStep++]; aiRules.seal(key); enemyPose = keys.indexOf(key); opponent.rig.seal();
      aiTimer = adventure?.inBattle?adventure.encounter.sealDelay*(bossEnraged ? .85 : 1):.42; $('enemyAction').textContent = 'Kết ấn ' + aiStep + '/' + aiSpell.sequence.length + ' · ' + aiSpell.name;
    } else {
      const result = darkDomain.transition ? {ok:false} : aiRules.cast({burnStacks:player.burns.length,staticStacks:player.staticStacks,woodGarden:natureArts.wood.ready('enemy'),snowFull:natureArts.snowReady('enemy'),snowAmount:natureArts.snowAmount('enemy'),earthCrater:!!earthArts.crater('enemy'),windAirborne:windArts.canCombo('enemy'),darkDomain:darkDomain.usable,shadowClones:darkDomain.commandable('enemy').length,shadowCloneCount:darkDomain.cloneCount('enemy'),shadowUpgrades:darkDomain.upgradable('enemy').length});
      if (result.ok) { launch(aiSpell, 'enemy', enemyPos(), enemyCastDirection(aiSpell)); opponent.rig.cast(); aiCasts++; aiCastAge = 0; $('enemyAction').textContent = 'Thi triển · ' + aiSpell.name; }
      enemyPose = -1; aiSpell = null; aiTimer = adventure?.inBattle?adventure.encounter.restTime*(bossEnraged ? .85 : 1):1.65;
    }
  }
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.life -= dt; if (p.life <= 0) { particles.splice(i, 1); continue; } p.p = vadd(p.p, vmul(p.v, dt)); p.v[1] += dt * .35; p.v = vmul(p.v, 1 - dt * .8); }
  }
  function clearDarkArts(){
    for(let i=shots.length-1;i>=0;i--)if(shots[i].element==='dark')shots.splice(i,1);
    for(const f of [player,enemy])if(f.defenseElement==='dark'){f.shield=0;f.shieldTime=0;f.reflect=0;}
  }
  function tick(dt) {
    if(adventure?.activeView){adventure.update(dt);return;}
    const running = started && !paused && !won;
    if (!paused) animationTime += dt;
    if (running) {
      battleTime += dt;
      const wasDark=darkDomain.active;darkDomain.advance(dt,animationTime);
      if(wasDark&&!darkDomain.active)clearDarkArts();
      if (rules.tick(dt)) announce('Chuỗi ấn hết hạn — kết lại từ đầu.', true);
      player.tick(dt); enemy.tick(dt);
      windArts.advance(dt,windActors(),impact);
      earthArts.advance(dt,windActors(),walls,impact,setEarthActorPosition,earthEvent);
      const wasSnowReady=natureArts.snowReady('player');
      const natureWinner=natureArts.advance(dt,windActors(),(owner,p)=>{if(owner==='player'){camera.p[0]=p[0];camera.p[2]=p[2];moveTargetX=p[0];}else{opponent.group.position.x=p[0];opponent.group.position.z=p[2];}},walls,impact);
      if(!wasSnowReady&&natureArts.snowReady('player'))announce('Đã tích đủ 90 tuyết · Z X rồi SPACE để dùng Tuyết Táng!');
      if(natureWinner){(natureWinner==='player'?enemy:player).hp=0;finish(natureWinner==='player');return;}
      const remaining = moveTargetX - camera.p[0];
      moveDirection = player.controlTime <= 0 && Math.abs(remaining) > .001 ? Math.sign(remaining) : 0;
      const goal=[camera.p[0]+moveDirection*Math.min(Math.abs(remaining),sidestepSpeed*dt*earthArts.slowAt(camera.p[0],camera.p[2])),playerPos()[1],camera.p[2]];
      if(!natureArts.buried('player'))camera.p[0]=lightArts.constrainMovement('player',playerPos(),earthArts.move(playerPos(),goal))[0];
      poseAge += dt; if (poseAge > 2.8 && !rules.sequence.length) activePose = -1;
      lightArts.advance(dt,windActors(),walls,(shot,p)=>{impact(shot,p);return shot.hitResult;});
      updateAI(dt); updateShots(dt);
      if(!won)darkDomain.updateClones(dt,animationTime,[{owner:'player',pos:camera.p,fighter:player},{owner:'enemy',pos:enemyPos(),fighter:enemy}],
        (clone,pos)=>impact({owner:clone.owner,element:'dark',style:'shadowstrike',damage:clone.damage,v:vnorm(vsub(pos,clone.p)),unreflectable:true},pos),shadowCrushImpact);
      if(adventure?.inBattle&&!won&&(player.hp<=0||enemy.hp<=0)){finish(player.hp>0);return;}
      messageTime -= dt;
      if (messageTime <= 0) { $('message').textContent = rules.ready() ? 'SPACE thi triển · chuột trái/phải để né' : 'SPACE ném phi tiêu · kết ấn theo quyển trục'; $('message').style.color = '#c7c5b6'; }
      updateUI();
    }
    if (!paused) {
      recoil = Math.max(0, recoil - dt * .7); flashTimer = Math.max(0, flashTimer - dt); hitTimer = Math.max(0, hitTimer - dt); enemyHit = Math.max(0, enemyHit - dt);
      updateParticles(dt); world.update(animationTime, dt);
      hands.update(dt, animationTime, activePose, !!rules.ready()&&!$('castButton').disabled, !!moveDirection, Math.min(1, shots.filter(s => s.phase !== 'staged').length * .2 + recoil * 3), reducedMotion);
      opponent.update(dt, animationTime, enemyPose, !!aiRules.ready(), enemy, enemyHit, aiCastAge < .35, enemyMoving, reducedMotion, enemyMovement.state().velocity);
      opponent.group.position.y=darkDomain.depth('enemy')+earthFloor('enemy',opponent.group.position.x,opponent.group.position.z);
      playerAvatar.group.position.set(camera.p[0],darkDomain.depth('player')+earthFloor('player',camera.p[0],camera.p[2]),camera.p[2]);
      playerAvatar.group.rotation.set(0,Math.PI+camera.yaw,0);
      playerAvatar.update(dt,animationTime,activePose,!!rules.ready()&&!$('castButton').disabled,player,flashTimer,recoil>.05,!!moveDirection,reducedMotion);
      const air=windArts.airborne.find(a=>a.victim==='enemy');opponent.group.rotation.z=air?Math.sin(air.age*8)*.10:0;opponent.group.rotation.x=air?-.12:0;
    }
    const shadowDepth=Math.max(0,-darkDomain.depth('player')/3);
    $('shadowSubmerge').style.setProperty('--sink',shadowDepth);
    $('chakraNumber').textContent = Math.floor(rules.chakra) + ' / '+Math.round(rules.maxChakra); $('chakraFill').style.width = rules.chakra/rules.maxChakra*100 + '%'; $('castCount').textContent = rules.casts + ' thuật';
    $('healthNumber').textContent = Math.ceil(player.hp) + ' / ' + player.maxHp; $('healthFill').style.width = player.hp / player.maxHp * 100 + '%';
    const playerWall = walls.find(w => w.owner === 'player' && w.hp > 0 && !['earth','wood'].includes(w.element)), shieldLabel = player.shieldTime > 0 && (player.shield || player.reflect) ? 'Khiên ' + player.shield + (player.reflect ? ' · phản đòn' : '') : '';
    const playerSpirit=windArts.spirits.find(s=>s.owner==='player'),enemySpirit=windArts.spirits.find(s=>s.owner==='enemy');
    const playerField=fields.find(f=>f.owner==='player'),enemyField=fields.find(f=>f.owner==='enemy');
    $('shieldStatus').textContent = [elementalStatus(player),natureArts.status('player'),earthArts.status('player'),lightArts.status('player'),player.controlTime > 0 ? player.controlSource+' ' + player.controlTime.toFixed(1) + 's' : '',player.invulnerableTime>0?(darkDomain.dives.some(d=>d.owner==='player')?'Ảnh độn':'Miễn nhiễm')+' · miễn nhiễm '+player.invulnerableTime.toFixed(1)+'s':'', shieldLabel,playerSpirit?'Tiên linh '+Math.max(0,playerSpirit.life-(playerSpirit.age<playerSpirit.formation?playerSpirit.formation-playerSpirit.age:0)).toFixed(1)+'s':'',playerField?'Lôi trận '+playerField.life.toFixed(1)+'s':'', playerWall ? (playerWall.element === 'ice' ? 'Băng Bích ' : playerWall.element === 'water' ? 'Thủy thuẫn ' : 'Tường ') + playerWall.hp + ' · ' + playerWall.life.toFixed(1) + 's' : ''].filter(Boolean).join(' · ') || 'Chưa có khiên';
    $('enemyHP').style.width = enemy.hp / enemy.maxHp * 100 + '%'; $('enemyHealth').textContent = Math.ceil(enemy.hp) + ' / ' + enemy.maxHp;
    const enemyWall = walls.find(w => w.owner === 'enemy' && w.hp > 0 && !['earth','wood'].includes(w.element));
    $('enemyChakra').textContent = Math.floor(aiRules.chakra) + ' CH'; $('enemyShield').textContent = [elementalStatus(enemy),enemy.controlTime>0?enemy.controlSource+' '+enemy.controlTime.toFixed(1)+'s':'',natureArts.status('enemy'),earthArts.status('enemy'),lightArts.status('enemy'),enemy.invulnerableTime>0?(darkDomain.dives.some(d=>d.owner==='enemy')?'Ảnh độn':'Miễn nhiễm')+' '+enemy.invulnerableTime.toFixed(1)+'s':'',enemy.shieldTime > 0 && (enemy.shield || enemy.reflect) ? 'Khiên ' + enemy.shield + (enemy.reflect ? ' · phản đòn' : '') : '',enemySpirit?'Tiên linh '+Math.max(0,enemySpirit.life-(enemySpirit.age<enemySpirit.formation?enemySpirit.formation-enemySpirit.age:0)).toFixed(1)+'s':'',enemyField?'Lôi trận '+enemyField.life.toFixed(1)+'s':'', enemyWall ? (enemyWall.element === 'ice'?'Băng Bích ':enemyWall.element === 'wind'?'Tường gió ':enemyWall.element === 'water' ? 'Thủy thuẫn ' : 'Tường lửa ') + enemyWall.hp : ''].filter(Boolean).join(' · ');
    $('battleClock').textContent = Math.floor(battleTime / 60).toString().padStart(2, '0') + ':' + Math.floor(battleTime % 60).toString().padStart(2, '0');
    $('moveHint').textContent = moveDirection ? (moveDirection < 0 ? '← ĐANG NÉ TRÁI' : 'ĐANG NÉ PHẢI →') : 'CHUỘT TRÁI: NÉ TRÁI · CHUỘT PHẢI: NÉ PHẢI';
    $('flash').style.opacity = flashTimer * .32; $('hitMarker').style.opacity = hitTimer > 0 ? 1 : 0;
    const delta = vsub(natureArts.perceivedPosition('player',windActors()), playerPos()), d = aim(), onTarget = vlen(vsub(delta, vmul(d, dot(delta, d)))) < .7;
    $('reticle').classList.toggle('on-target', onTarget && enemy.hp > 0 && !waveView);
    $('targetInfo').style.opacity = onTarget && running && !waveView ? 1 : 0; $('targetName').textContent = adventure?.inBattle?adventure.encounter.name:'ĐỐI THỦ'; $('targetHP').style.width = enemy.hp / enemy.maxHp * 100 + '%';
    playerShield.visible = !['fire', 'water', 'lightning', 'dark','wood','ice'].includes(player.defenseElement) && player.shieldTime > 0 && (player.shield > 0 || player.reflect > 0); playerShield.position.set(camera.p[0], 1.45+earthFloor('player',camera.p[0],camera.p[2]), camera.p[2]); playerShield.material.color.set(player.color); playerShield.rotation.y = animationTime * .4;
    document.body.classList.toggle('dragon-active', started && !won && (!!dragonView || shots.some(s => s.owner === 'player' && s.phase === 'forming')));
    camera3d.position.fromArray(playerPos()); camera3d.rotation.set(camera.pitch, camera.yaw, 0, 'YXZ');
    const diveDepth=darkDomain.diveDepth('player');
    if(diveDepth<0){
      camera3d.position.y+=diveDepth;
      // Preserve the aimed point outside the ink while the eyes descend beneath its surface.
      const direction=aim();camera3d.lookAt(new T.Vector3(...vadd(camera.p,vmul(direction,31))));
    }
    updateDragonView(running ? dt : 0);
    updateMeteorView(running ? dt : 0);
    updateWaveView(running ? dt : 0);
    updateWindView(running?dt:0);
    updateEarthView(running?dt:0);
    const buriedPlayer=natureArts.buried('player');if(buriedPlayer){camera3d.position.set(buriedPlayer.p[0]+9,buriedPlayer.p[1]+4,buriedPlayer.p[2]+7);camera3d.lookAt(new T.Vector3(...buriedPlayer.p));handsPass.enabled=false;}
    if (dragonView) { dragonView.renderedPosition = camera3d.position.clone(); dragonView.renderedRotation = camera3d.quaternion.clone(); }
    cameraImpacts.update(running ? dt : 0);
    cameraReaction = cameraImpacts.sample(reducedMotion);
    let chargeZoom = 0;
    if (running && !reducedMotion) {
      const charge = shots.find(s => s.owner === 'player' && (s.phase === 'forming' || s.phase === 'staged'));
      if (charge?.phase === 'forming') {
        const t = clamp(charge.age / charge.formation, 0, 1); chargeZoom = -6 * t * t * (3 - 2 * t);
      } else if (charge) chargeZoom = -3 * Math.sin(Math.PI * clamp(charge.age / charge.holdTime, 0, 1));
    }
    if (windView) setWorldFov(baseFov);
    else if (meteorView) setWorldFov(camera3d.fov + cameraReaction.zoom);
    else setWorldFov(reducedMotion ? baseFov : T.MathUtils.damp(camera3d.fov, baseFov + chargeZoom + cameraReaction.zoom, 20, paused ? 0 : dt));
    reactionPosition.fromArray(cameraReaction.position).applyQuaternion(camera3d.quaternion);
    if(!windView)camera3d.position.add(reactionPosition);
    darkDomain.updateSubmergeView(diveDepth,camera3d.position.y);
    reactionEuler.set(...cameraReaction.rotation); reactionRotation.setFromEuler(reactionEuler);
    if(!windView)camera3d.quaternion.multiply(reactionRotation);
    effects.update(paused ? 0 : dt, animationTime, shots, particles, camera3d, quality, walls,
      [{ owner: 'player', fighter: player, pos: playerPos() }, { owner: 'enemy', fighter: enemy, pos: enemyPos() }],fields,reducedMotion);
    darkDomain.visuals(running?dt:0,animationTime,shots);
    windArts.visuals(running?dt:0,animationTime,shots,walls);
    lightArts.visuals(animationTime,shots,windActors(),walls);
    hands.lightFinger.visible=started&&!won&&!paused&&rules.ready()?.style==='lightray';
    const readyLightStyle=running?rules.ready()?.style:null;
    if(readyLightStyle==='lightray'&&lightArts.optics.some(o=>o.owner==='player'&&o.kind==='dome'&&!o.rays.length))$('message').textContent='Bắn laser vào mái vòm để tia nảy và gây sát thương mỗi giây';
    const opticalHint={lightsphere:'SPACE tạo cầu thủy tinh trước mặt · 8 giây · laser xuyên qua thành 7 sắc',lightdome:'SPACE gọi gương rơi ghép vòm · đủ 3 ô né · chặn thoát · vòm kín 10 giây',lightmirror:'SPACE tạo gương trước mặt · phản đòn phía trước trong 2,5 giây'}[readyLightStyle];
    if(opticalHint)$('message').textContent=opticalHint;
  }
  function render() {
    if(adventure?.activeView){renderer.info.reset();renderer.clear();renderer.render(adventure.world.scene,adventure.world.camera);return;}
    natureArts.visuals(shots,windActors(),camera3d,quality,reducedMotion);
    opponent.group.visible=!natureArts.hidden('enemy');if(natureArts.hidden('player'))playerAvatar.group.visible=false;
    if(['wood','ice'].includes(enemy.defenseElement))opponent.shield.visible=false;
    earthArts.visuals(animationTime,reducedMotion);
    world.terrain.deform((x,z)=>earthArts.heightAt(x,z),earthArts.revision);
    if(!windView)darkDomain.intro.updateCamera(camera3d);
    renderer.info.reset(); renderer.clear(); composer.render();
    if (handsPass.enabled) {
      renderer.clearDepth();
      handCamera.layers.set(1);
      renderer.render(hands.scene, handCamera);
      handCamera.layers.set(0);
    }
  }
  function setEarthActorPosition(owner,p){
    p=lightArts.constrainMovement(owner,owner==='player'?playerPos():enemyPos(),p);
    if(owner==='player'){camera.p[0]=p[0];camera.p[2]=p[2];moveTargetX=p[0];}
    else{opponent.group.position.x=p[0];opponent.group.position.z=p[2];}
  }
  function earthEvent(type,art,victim){
    if(type==='capture'&&victim){
      for(const air of [...windArts.airborne])if(air.victim===victim.owner)windArts.release(air,false);
      if(victim.owner==='player'){
        rules.clear();activePose=-1;hands.clearEffects();moveTargetX=camera.p[0];moveDirection=0;
        clearEarthView();clearWindView();clearDragonView();clearMeteorView();clearWaveView();
        announce('Địa Bộc Thiên Tinh đang hút bạn lên!',true);
      }else{aiRules.clear();aiSpell=null;aiStep=0;enemyPose=-1;$('enemyAction').textContent='Bị Địa Bộc Thiên Tinh hút lên';}
    }
    if(type==='quake')cameraImpacts.trigger('meteorHit',.18*clamp(1-vlen(vsub(art.center,playerPos()))/45,.2,1));
    if(type==='fall')cameraImpacts.trigger('meteorHit',.6);
    if(type==='wallbreak')cameraImpacts.trigger('block',.35);
  }
  function clearEarthView(){earthView=null;handsPass.enabled=!dragonView&&!meteorView&&!windView;}
  function beginEarthView(art){
    if(usesWindCamera()||player.invulnerableTime>0||darkDomain.diveDepth('player')<0)return;
    earthView={art,phase:'sky',from:camera3d.quaternion.clone()};handsPass.enabled=false;
  }
  function updateEarthView(dt){
    if(!earthView)return;const view=earthView,e=view.art;
    if(!earthArts.effects.includes(e)){clearEarthView();return;}
    if(!dt&&view.renderedRotation){camera3d.quaternion.copy(view.renderedRotation);camera3d.position.copy(view.renderedPosition);return;}
    if(e.age>=e.pullEnd+.45){clearEarthView();return;}
    const base=camera3d.quaternion.clone();
    const basePosition=camera3d.position.clone();
    if(e.age<e.pullEnd){
      if(!reducedMotion){const reveal=easeWind((e.age-e.throwEnd)/.3),approach=Math.min(5,Math.max(0,Math.hypot(e.center[0]-basePosition.x,e.center[2]-basePosition.z)-8));camera3d.position.add(new T.Vector3(e.axis[0]*approach,2.6,e.axis[2]*approach).multiplyScalar(reveal));}
      const target=reducedMotion?vadd(e.center,[0,8,0]):earthArts.viewTarget(e);
      camera3d.lookAt(new T.Vector3(...target));const goal=camera3d.quaternion.clone();
      camera3d.quaternion.slerpQuaternions(view.from,goal,reducedMotion?1:easeWind(e.age/.3));view.lastSky=camera3d.quaternion.clone();view.lastSkyPosition=camera3d.position.clone();view.phase='sky';
    }else{view.phase='returning';const t=reducedMotion?1:easeWind((e.age-e.pullEnd)/.45);camera3d.quaternion.copy(view.lastSky||view.from).slerp(base,t);camera3d.position.copy(view.lastSkyPosition||basePosition).lerp(basePosition,t);}
    view.renderedRotation=camera3d.quaternion.clone();view.renderedPosition=camera3d.position.clone();
  }
  function usesWindCamera(){return windCameraEnabled&&windArts.spirits.some(s=>s.owner==='player');}
  function clearWindView(){
    windView=null;handsPass.enabled=!dragonView&&!meteorView&&!earthView;
    playerAvatar.group.visible=false;windAim.visible=false;
    document.body.classList.remove('wind-camera');
  }
  function updateWindView(dt){
    if(!windView)return;const view=windView,s=view.spirit;
    if(!windArts.spirits.includes(s)){clearWindView();return;}
    handsPass.enabled=false;
    if(!dt&&view.renderedRotation){camera3d.position.copy(view.renderedPosition);camera3d.quaternion.copy(view.renderedRotation);return;}
    const down=new T.Quaternion().setFromEuler(new T.Euler(-Math.PI/2,0,0,'YXZ'));
    const p=playerPos(),e=enemyPos(),tan=Math.tan(baseFov*Math.PI/360);
    // Leave extra space below the taller opponent HUD on portrait screens.
    const margin=camera3d.aspect<1?18:11;
    const height=Math.max(26,Math.max(p[1],e[1])+(Math.abs(p[2]-e[2])*.5+margin)/tan,(Math.abs(p[0]-e[0])*.5+7)/(tan*camera3d.aspect));
    const above=new T.Vector3((p[0]+e[0])*.5,height,(p[2]+e[2])*.5);
    if(s.age<1.35){
      const goal=new T.Object3D();goal.position.copy(camera3d.position);goal.lookAt(s.root.position);goal.rotateY(Math.PI);
      camera3d.quaternion.slerpQuaternions(view.from,goal.quaternion,reducedMotion?1:easeWind(s.age/.32));
      view.lastUp=camera3d.quaternion.clone();view.lastEye=camera3d.position.clone();view.phase='summoning';
    }else{
      const t=reducedMotion?1:easeWind((s.age-1.35)/.45);
      camera3d.position.copy(view.lastEye||view.fromPosition).lerp(above,t);
      camera3d.quaternion.copy(view.lastUp||view.from).slerp(down,t);
      view.phase=s.age+1e-6<s.formation?'rising':'overhead';
      playerAvatar.group.visible=started;
      windAim.visible=started&&s.age+1e-6>=s.formation;
      windAim.position.set(p[0],.06+windArts.height('player'),p[2]);windAim.rotation.y=Math.PI+camera.yaw;
    }
    view.renderedPosition=camera3d.position.clone();view.renderedRotation=camera3d.quaternion.clone();
  }
  function easeWind(t){t=clamp(t,0,1);return t*t*(3-2*t);}
  function clearDragonView() {
    clearWaveView();
    dragonView = null; handsPass.enabled = !meteorView&&!windView&&!earthView;
    document.body.classList.remove('dragon-camera', 'dragon-active');
  }
  function beginDragonView(shot) {
    if(usesWindCamera()||player.invulnerableTime>0||darkDomain.diveDepth('player')<0)return;
    clearWindView();
    clearWaveView();
    clearMeteorView();
    dragonView = { shot, phase: 'overhead', age: 0, hold: 0,
      from: camera3d.position.clone(), rotation: camera3d.quaternion.clone(),
      lastPosition: camera3d.position.clone(), lastRotation: camera3d.quaternion.clone() };
    handsPass.enabled = false; document.body.classList.add('dragon-camera');
  }
  function clearMeteorView() {
    if (meteorView) setWorldFov(baseFov);
    meteorView = null; handsPass.enabled = !dragonView&&!windView&&!earthView;
    document.body.classList.remove('meteor-camera');
  }
  function beginMeteorView(shot) {
    if(usesWindCamera()||player.invulnerableTime>0||darkDomain.diveDepth('player')<0)return;
    clearWindView();
    clearDragonView();
    cameraImpacts.reset(); setWorldFov(baseFov);
    meteorView = { shot, phase: 'sky', from: camera3d.quaternion.clone(), fromFov: baseFov };
    handsPass.enabled = false; document.body.classList.add('meteor-camera');
  }
  function setWorldFov(fov) {
    if (Math.abs(camera3d.fov - fov) < 1e-8) return;
    camera3d.fov = fov;
    camera3d.updateProjectionMatrix();
  }
  function clearWaveView() { waveView = null; }
  function beginWaveView(shot) {
    if(usesWindCamera()||player.invulnerableTime>0||darkDomain.diveDepth('player')<0)return;
    clearWindView();
    clearDragonView(); clearMeteorView(); cameraImpacts.reset();
    waveView = { shot, phase: 'feet', from: new T.Quaternion().setFromEuler(new T.Euler(camera.pitch, camera.yaw, 0, 'YXZ')) };
  }
  function updateWaveView(dt) {
    if (!waveView) return;
    const view = waveView, shot = view.shot;
    if (!dt && view.renderedRotation) { camera3d.position.copy(view.renderedPosition); camera3d.quaternion.copy(view.renderedRotation); return; }
    if (!shots.includes(shot) || shot.phase === 'flying') { clearWaveView(); return; }
    // Rotate from the player's eyes, without altering the saved aiming direction.
    const down = new T.Quaternion().setFromEuler(new T.Euler(-1.24, camera.yaw, 0, 'YXZ'));
    const t = shot.age < .8 ? clamp(shot.age / .25, 0, 1) : 1 - clamp((shot.age - .8) / (shot.growthTime - .8), 0, 1);
    const ease = t * t * (3 - 2 * t);
    camera3d.quaternion.slerpQuaternions(view.from, down, ease);
    view.phase = shot.age < .8 ? 'feet' : 'rising';
    view.renderedPosition = camera3d.position.clone(); view.renderedRotation = camera3d.quaternion.clone();
  }
  function updateMeteorView(dt) {
    if (!meteorView) return;
    const view = meteorView, shot = view.shot, base = camera3d.quaternion.clone();
    if (!dt && view.renderedRotation) { camera3d.position.copy(view.renderedPosition); camera3d.quaternion.copy(view.renderedRotation); setWorldFov(view.renderedFov); return; }
    if (!shots.includes(shot) || ['falling','ready','striking','fading'].includes(shot.phase)) { clearMeteorView(); return; }
    if (shot.phase === 'sky' || shot.phase==='charging') {
      const zoomedFov = view.fromFov - meteorZoomAmount;
      const zoomingIn = shot.preludeAge <= meteorZoomInTime;
      const zoomT = zoomingIn ? clamp(shot.preludeAge / meteorZoomInTime, 0, 1)
        : clamp((shot.preludeAge - meteorZoomInTime) / (shot.skyTime - meteorZoomInTime), 0, 1);
      const zoomEase = zoomT * zoomT * (3 - 2 * zoomT);
      setWorldFov(reducedMotion ? view.fromFov : T.MathUtils.lerp(zoomingIn ? view.fromFov : zoomedFov, zoomingIn ? zoomedFov : view.fromFov, zoomEase));
      camera3d.lookAt(new T.Vector3(...(reducedMotion || ['thunder','jacob'].includes(shot.style) ? shot.cloudPoint : shot.p)));
      const t = reducedMotion ? 1 : clamp(shot.preludeAge / .28, 0, 1);
      camera3d.quaternion.slerpQuaternions(view.from, camera3d.quaternion.clone(), t * t * (3 - 2 * t));
      view.lastSkyRotation = camera3d.quaternion.clone();
    } else {
      setWorldFov(view.fromFov);
      view.phase = 'returning';
      const t = reducedMotion ? 1 : clamp((shot.preludeAge - shot.skyTime) / shot.returnTime, 0, 1);
      camera3d.quaternion.copy(view.lastSkyRotation || view.from).slerp(base, t * t * (3 - 2 * t));
    }
    view.renderedRotation = camera3d.quaternion.clone(); view.renderedPosition = camera3d.position.clone();
    view.renderedFov = camera3d.fov;
  }
  function updateDragonView(dt) {
    if (!dragonView) return;
    const view = dragonView, shot = view.shot;
    if (!dt && view.renderedPosition) {
      camera3d.position.copy(view.renderedPosition); camera3d.quaternion.copy(view.renderedRotation); return;
    }
    const basePosition = camera3d.position.clone(), baseRotation = camera3d.quaternion.clone();
    view.age += dt;
    if (view.phase === 'overhead' && !shots.includes(shot)) {
      view.phase = 'impact'; view.hold = 0;
    }
    if (view.phase === 'impact') {
      view.hold += dt;
      if (view.hold >= .3) { view.phase = 'returning'; view.hold = 0; }
    }
    if (view.phase === 'returning') {
      view.hold += dt;
      const t = reducedMotion ? 1 : clamp(view.hold / .35, 0, 1), smooth = t * t * (3 - 2 * t);
      camera3d.position.copy(view.lastPosition).lerp(basePosition, smooth);
      camera3d.quaternion.copy(view.lastRotation).slerp(baseRotation, smooth);
      if (t >= 1) { clearDragonView(); camera3d.position.copy(basePosition); camera3d.quaternion.copy(baseRotation); }
      return;
    }
    if (view.phase === 'impact') {
      camera3d.position.copy(view.lastPosition); camera3d.quaternion.copy(view.lastRotation);
      return;
    }
    const direction = vnorm(shot.v), right = vnorm([-direction[2], 0, direction[0]]);
    const travel = vsub(shot.p, shot.origin);
    const position = vadd(vadd(vadd(shot.origin, vmul(right, -9)), vmul(direction, -9)), vmul(travel, .45));
    position[1] = Math.max(10, shot.origin[1] + 12);
    camera3d.position.fromArray(position);
    camera3d.lookAt(new T.Vector3(...vadd(shot.p, vmul(direction, 4))));
    const t = reducedMotion ? 1 : clamp(view.age / .24, 0, 1), smooth = t * t * (3 - 2 * t);
    camera3d.position.lerpVectors(view.from, camera3d.position.clone(), smooth);
    camera3d.quaternion.slerpQuaternions(view.rotation, camera3d.quaternion.clone(), smooth);
    view.lastPosition = camera3d.position.clone(); view.lastRotation = camera3d.quaternion.clone();
  }
  function frame(now) { const dt = Math.min((now - lastTime) / 1000 || .016, .1); lastTime = now; if (!testMode) tick(dt); render(); requestAnimationFrame(frame); }
  function requestAimLock(event) {
    if (!event?.isTrusted || document.pointerLockElement === canvas) return;
    try { canvas.requestPointerLock?.()?.catch?.(() => {}); } catch {}
  }
  function releaseAimLock() {
    touchPoint = null;
    document.body.classList.remove('aim-locked');
    if (document.pointerLockElement === canvas) document.exitPointerLock?.();
  }
  function sidestep(direction) {
    if (player.controlTime > 0) return;
    moveTargetX = clamp(moveTargetX + direction * sidestepDistance, -6, 6);
  }
  function look(dx, dy) {
    if (dragonView || meteorView || waveView || earthView || darkDomain.transition || player.controlTime>0) return;
    camera.yaw -= dx * .0025;
    camera.pitch = clamp(camera.pitch - dy * .0025, -.65, .65);
  }
  function start(event) {
    if (started) return;
    loadout=availableLoadout(loadout);
    const valid = validateLoadout(loadout); if (!valid.ok) { loadoutMessage = valid.reason; renderLoadout(); return; }
    stopSpellVoice();
    clearEarthView();earthArts.reset(walls);clearWindView();windArts.reset();lightArts.reset();natureArts.reset(walls);waterBubbles.reset();
    clearDragonView();
    clearMeteorView();
    battlePlayerStats=adventure?.encounter?{...adventure.combatStats}:{maxHp:200,maxChakra:100,damageMultiplier:1};
    rules = new GameRules(loadout,{maxChakra:battlePlayerStats.maxChakra}); player = new Fighter(battlePlayerStats.maxHp); enemy = new Fighter(adventure?.encounter?.hp||200);player.resistances={...(battlePlayerStats.resistances||{})};playerAvatar.setEquipment(adventure?.encounter?adventure.equipment:null);bossEnraged=false;aiWeaponTimer=4;
    if(adventure?.encounter){adventure.beginCombat();player.autoRestore=false;enemy.autoRestore=false;}
    darkDomain.reset();
    cameraImpacts.reset(); cameraReaction = cameraImpacts.sample(); setWorldFov(baseFov);
    const el = adventure?.inBattle?elements.find(e=>e.id===adventure.encounter.element):elements[(round - 1) % elements.length], support = elements[(round + 1) % elements.length];
    aiRules = new GameRules(['wood','ice'].includes(el.id)?spells.filter(s=>s.element===el.id).map(s=>s.id):el.id==='earth'?['earth-orb','earth-lance','earth-volley','earth-barrier','earth-reflect']:el.id==='dark'?['dark-domain','dark-orb','dark-lance','dark-volley','dark-reflect']:el.id==='light'?['light-orb','light-barrier','light-reflect','light-lance','light-volley']:el.id==='wind'?['wind-orb','wind-lance','wind-volley','wind-barrier','wind-reflect']:[el.id+(el.id==='fire'?'-volley':el.id==='water'?'-tsunami':'-thunder'),el.id+'-lance',el.id+(el.id==='fire'?'-meteor':'-volley'),['fire','water','lightning'].includes(el.id)?el.id+'-barrier':support.id==='dark'?'dark-reflect':support.id+'-barrier',support.id+'-reflect'].filter((id,i,list)=>list.indexOf(id)===i));
    if(adventure?.inBattle)aiRules=new GameRules(adventure.encounter.spellIds);
    $('enemyElement').textContent = el.glyph + ' ' + el.name + ' / ' + support.name; $('enemyAction').textContent = 'Đang quan sát…';
    if(adventure?.inBattle)$('enemyElement').textContent=adventure.encounter.name+' · '+el.name;
    if(activeBoss())$('enemyElement').textContent='THỦ LĨNH · '+adventure.encounter.name+' · '+el.name;
    if(!journeyLearning){duelLoadout=[...loadout];try { localStorage.setItem('anhoa-loadout-v3', JSON.stringify(loadout)); } catch {}}
    started = true; paused = false; won = false; selected = 0; score = 0; battleTime = 0; aiTimer = 2.2; aiSpell = null; aiStep = 0; aiCycle = 0; aiCasts = 0; aiCastAge = 99; enemyPose = -1; enemyHit = 0;
    shots.length = 0; particles.length = 0; salvos.length = 0; walls.length = 0; fields.length = 0; effects.reset(); hands.clearEffects(); recoil = flashTimer = hitTimer = 0; activePose = -1; poseAge = 99; moveTargetX = 0; moveDirection = 0; touchPoint = null;
    camera = { p: [0, 1.72, 7], yaw: 0, pitch: 0 }; opponent.group.position.copy(world.opponentSpawn); opponent.group.rotation.set(0, 0, 0);
    opponent.group.scale.setScalar(1);opponent.setAppearance(adventure?.encounter||null);enemyMovement.reset();enemyMoving=false;
    if(adventure?.inBattle)aiTimer=4;
    $('score').textContent = '00'; $('roundText').textContent = 'Trận đấu ' + String(round).padStart(2, '0'); $('currentSeal').textContent = 'Sẵn sàng kết ấn';
    document.body.classList.add('playing'); document.body.classList.remove('paused');
    ['startScreen', 'pauseScreen', 'winScreen'].forEach(id => $(id).classList.add('hidden'));
    initAudio(); audio?.resume(); renderGuide(); announce('Lia chuột để ngắm. Bấm trái né trái, bấm phải né phải.'); updateUI(); tick(0); requestAimLock(event);
  }
  function pause() { if (!started || won) return; paused = true; if (spellVoice) { try { window.speechSynthesis.pause(); } catch {} } moveTargetX = camera.p[0]; moveDirection = 0; releaseAimLock(); document.body.classList.add('paused'); $('pauseScreen').classList.remove('hidden'); updateUI(); }
  function resume(event) { paused = false; if (spellVoice) { try { window.speechSynthesis.resume(); } catch {} } moveTargetX = camera.p[0]; moveDirection = 0; document.body.classList.remove('paused'); $('pauseScreen').classList.add('hidden'); updateUI(); requestAimLock(event); }
  function prepare(next = false) {
    clearEarthView();earthArts.reset(walls);clearWindView();windArts.reset();lightArts.reset();natureArts.reset(walls);waterBubbles.reset();
    darkDomain.reset();
    stopSpellVoice();
    clearDragonView();
    clearMeteorView();
    if (next) round++;
    cameraImpacts.reset(); cameraReaction = cameraImpacts.sample(); setWorldFov(baseFov);
    started = false; paused = false; won = false; moveTargetX = 0; moveDirection = 0; aiSpell = null; enemyPose = -1; releaseAimLock();
    shots.length = 0; particles.length = 0; salvos.length = 0; walls.length = 0; fields.length = 0; effects.reset(); hands.clearEffects(); player = new Fighter(); enemy = new Fighter(); activePose = -1;
    bossEnraged=false;opponent.group.scale.setScalar(1);opponent.setAppearance(null);enemyMovement.reset();enemyMoving=false;
    opponent.group.rotation.set(0, 0, 0); camera = { p: [0, 1.72, 7], yaw: 0, pitch: 0 };
    document.body.classList.remove('playing', 'paused'); ['pauseScreen', 'winScreen'].forEach(id => $(id).classList.add('hidden')); $('startScreen').classList.remove('hidden'); loadoutMessage = ''; renderLoadout();
  }
  function toggleSound() { muted = !muted; if (muted) stopSpellVoice(); $('soundButton').textContent = muted ? '♫̸' : '♪'; $('soundButton').setAttribute('aria-pressed', String(muted)); }
  function nextBattle(){if(adventure?.inBattle){const victory=adventureVictory;prepare();adventure.finishBattle(victory);}else prepare(true);}
  $('cycleAmmo').onclick=()=>{if(started&&!paused&&!won&&adventure?.inBattle){adventure.cycleShuriken();updateUI();}};
  $('startButton').onclick = start; $('resumeButton').onclick = resume; $('resetButton').onclick = e => { started = false; start(e); }; $('changeLoadout').onclick = () => {if(adventure?.inBattle){prepare();adventure.finishBattle(false);}else prepare();}; $('nextButton').onclick = nextBattle; $('castButton').onclick = cast; $('soundButton').onclick = toggleSound;
  $('helpButton').onclick = () => $('guide').classList.toggle('hidden');
  document.querySelectorAll('.seal').forEach(el => el.onclick = () => seal(el.dataset.key));
  window.addEventListener('keydown', e => {
    if(adventure?.activeView&&adventure.phase!=='loadout')return;
    if(textInputTarget(e.target)||e.ctrlKey||e.metaKey||e.altKey)return;
    const key = physicalKey(e);
    if(keys.includes(key)||['h','m','1','2','3','4','5'].includes(key))e.preventDefault();
    if (e.target instanceof HTMLButtonElement && (!started || paused || won) && key === ' ') return;
    if ([' ', 'backspace', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault();
    if (e.repeat) return;
    if (key === 'escape'&&adventure?.phase==='loadout'){e.stopImmediatePropagation();prepare();adventure.cancelBattle();return;}
    if (key === 'enter') { e.preventDefault(); if (won) nextBattle(); else if (!started) start(e); else if (paused) resume(e); return; }
    if (key === 'escape') { if (started && !won && !paused) pause(); return; }
    if (key === 'h') { $('guide').classList.toggle('hidden'); return; }
    if (key === 'm') { toggleSound(); return; }
    if (!started || paused || won) return;
    if(key==='t'&&adventure?.inBattle){e.preventDefault();adventure.cycleShuriken();updateUI();return;}
    if (keys.includes(key)) seal(key); else if (key === ' ') cast(); else if (key === 'backspace') { rules.clear(); hands.clearEffects(); activePose = -1; announce('Đã xóa chuỗi ấn.'); updateUI(); } else if (['1', '2', '3', '4', '5'].includes(key)) selectSpell(Number(key) - 1);
  });
  window.addEventListener('blur', () => { if (started && !paused && !won) pause(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && started && !paused && !won) pause(); });
  window.addEventListener('contextmenu', e => { if (started && !paused && !won) e.preventDefault(); });
  canvas.addEventListener('mousedown', e => {
    if (!started || paused || won || ![0, 2].includes(e.button)) return;
    e.preventDefault(); sidestep(e.button === 0 ? -1 : 1); requestAimLock(e);
  });
  window.addEventListener('mousemove', e => {
    if (!started || paused || won || (document.pointerLockElement !== canvas && e.target !== canvas)) return;
    look(e.movementX, e.movementY);
  });
  document.addEventListener('pointerlockchange', () => {
    const locked = document.pointerLockElement === canvas;
    const wasLocked = document.body.classList.contains('aim-locked');
    document.body.classList.toggle('aim-locked', locked);
    if (wasLocked && !locked && started && !paused && !won) pause();
  });
  canvas.addEventListener('touchstart', e => { if (!started || paused || won) return; const t = e.touches[0]; touchPoint = { x: t.clientX, y: t.clientY }; }, { passive: true });
  canvas.addEventListener('touchmove', e => { if (!touchPoint || paused || won) return; const t = e.touches[0]; look(t.clientX - touchPoint.x, t.clientY - touchPoint.y); touchPoint = { x: t.clientX, y: t.clientY }; e.preventDefault(); }, { passive: false });
  canvas.addEventListener('touchend', () => { touchPoint = null; });
  canvas.addEventListener('touchcancel', () => { touchPoint = null; });
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); pause(); $('errorScreen').classList.remove('hidden'); $('errorScreen').textContent = 'Kết nối đồ họa bị gián đoạn. Tải lại trang để tiếp tục.'; });
  const state = () => ({ waterBubbles:waterBubbles.state(),enemyAppearance:{...opponent.group.userData.appearance},enemyMovement:{...enemyMovement.state(),moving:enemyMoving},playerResistance:{...player.resistances},playerEquipment:adventure?.equipment||null,playerMaxHealth:player.maxHp,maxChakra:rules.maxChakra,playerDamageMultiplier:battlePlayerStats.damageMultiplier,journeyLearning,boss:activeBoss()?{name:activeBoss().name,phase:bossEnraged?'enraged':'guarding',damageMultiplier:bossDamageMultiplier()}:null,enemyMaxHealth:enemy.maxHp,enemyLoadout:[...aiRules.loadout], learnedSpells:[...learnedSpells], elemental:{player:player.elementalState(),enemy:enemy.elementalState(),visuals:effects.elemental.state()}, flightBurst:effects.flightBursts.state(), natureArt:natureArts.state(),usedOnce:[...rules.usedOnce],enemyVisible:opponent.group.visible,enemyPerceivedPosition:natureArts.perceivedPosition('player',windActors()),aiPerceivedTarget:natureArts.perceivedPosition('enemy',windActors()),earthArt:{...earthArts.state(),terrainVertices:world.terrain.changedVertices,playerHeight:earthFloor('player',camera.p[0],camera.p[2]),enemyHeight:earthFloor('enemy',opponent.group.position.x,opponent.group.position.z)},playerPosition:playerPos(),lightArt:lightArts.state(),playerAvatar:{visible:playerAvatar.group.visible,position:playerAvatar.group.position.toArray(),yaw:playerAvatar.group.rotation.y,pose:activePose,handPose:playerAvatar.rig.hands[0].wrapper.quaternion.toArray(),legs:playerAvatar.legs.map(l=>l.pivot.rotation.x),aimVisible:windAim.visible},windArt:windArts.state(), cooldown:rules.cooldown,cooldowns:{...rules.cooldowns},enemyCooldowns:{...aiRules.cooldowns},chakraRegen:SealGameCore.chakraRegen,shurikenCooldown:rules.shurikenCooldown,shurikenThrows:rules.shurikenThrows,invulnerableTime:player.invulnerableTime,enemyInvulnerableTime:enemy.invulnerableTime,enemyRenderPosition:opponent.group.position.toArray(),darkDomain: darkDomain.state(), lightningArt: { projectiles: effects.lightningArts.shots.size, fields: fields.map(f=>({owner:f.owner,position:[...f.p],radius:f.radius,height:f.height,life:f.life,slowFactor:f.slowFactor})), shields: [...effects.lightningArts.shields.values()].filter(g=>g.visible).length, bolts: [...effects.lightningArts.shots.values()].filter(g=>g.userData.bolt?.visible).length, clouds: [...effects.lightningArts.shots.values()].filter(g=>g.userData.cloud).length, bursts: effects.lightningArts.bursts.length }, cameraView: natureArts.buried('player')?'snow-burial':earthView?'earth-'+earthView.phase:windView?'wind-'+windView.phase:waveView ? 'wave-' + waveView.phase : meteorView ? (meteorView.shot.style==='thunder'?'thunder-':meteorView.shot.style==='jacob'?'jacob-':'meteor-') + meteorView.phase : dragonView ? (dragonView.shot.style === 'boat' ? 'boat-' : dragonView.shot.style === 'bird' ? 'bird-' : '') + dragonView.phase : 'first-person', viewFov: camera3d.fov, cameraReaction: { ...cameraReaction, pulses: cameraImpacts.pulses.length }, viewPosition: camera3d.position.toArray(), viewRotation: camera3d.quaternion.toArray(), handsVisible: handsPass.enabled, sealShadow: hands.shadow.state(), handWind:hands.handWind.mesh.visible,handDark:hands.handDark.mesh.visible,handLight:hands.handLight.mesh.visible,handElementRings:Object.fromEntries(['Wind','Dark','Light','Earth','Wood','Ice'].map(name=>{const r=hands['hand'+name];return [name.toLowerCase(),{visible:r.mesh.visible,motes:r.motes.visible,stones:r.stones.visible,stoneCount:r.stones.children.length,position:r.mesh.position.toArray(),time:r.mesh.material.uniforms.uTime.value,reducedMotion:r.mesh.material.uniforms.uReducedMotion.value}];})), handLightning: hands.handLightning.mesh.visible, handLightningPosition: hands.handLightning.mesh.position.toArray(), handLightningTime: hands.handLightning.mesh.material.uniforms.uTime.value, handWater: hands.handWater.mesh.visible, handWaterPosition: hands.handWater.mesh.position.toArray(), handFlames: hands.handFire.mesh.visible, handFlamePosition: hands.handFire.mesh.position.toArray(), ready: true, time: animationTime, handPose: hands.hands[0].wrapper.quaternion.toArray(), fingerPose: hands.hands[0].joints.index_0.quaternion.toArray(), score, round, casting: null, castElapsed: 0, casts: rules.casts, chakra: rules.chakra, sequence: [...rules.sequence], paused, won, victory: won && player.hp > 0, started, activePose, position: [...camera.p], yaw: camera.yaw, pitch: camera.pitch, quality: qualities[quality].name, bones: Object.keys(hands.hands[0].joints).length, triangles: renderer.info.render.triangles, shots: shots.length, smoke: effects.smoke.length, light: effects.lights.reduce((n, l) => n + l.intensity, 0), loadout: [...loadout], equipped: [...rules.loadout], controlTime: player.controlTime, enemyControlTime: enemy.controlTime, waterArt: { projectiles: effects.waterArts.shots.size, walls: effects.waterArts.walls.size, shields: [...effects.waterArts.shields.values()].filter(g => g.visible).length, prisons: [...effects.waterArts.prisons.values()].filter(g => g.visible).length }, health: player.hp, shield: player.shield, shieldTime: player.shieldTime, reflect: player.reflect, enemyHealth: enemy.hp, enemyPosition: enemyPos(), gatePosition: world.opponentSpawn.toArray(), enemyShield: enemy.shield, enemyChakra: aiRules.chakra, enemyPose, aiCasts, battleTime, moveDirection, moveTargetX, aimLocked: document.pointerLockElement === canvas, enemySequence: [...aiRules.sequence], salvos: salvos.length, walls: walls.map(w => ({ owner: w.owner, element: w.element, radius: w.radius || 0, hp: w.hp, life: w.life, position: [...w.p] })), fireArt: { projectiles: effects.arts.shots.size, walls: effects.arts.walls.size, shields: [...effects.arts.shields.values()].filter(g => g.visible).length, bursts: effects.arts.bursts.length, meteorImpacts: effects.arts.bursts.filter(b => b.meteor).map(b => ({ age: b.age, rocks: b.debris.filter(d => d.mesh.visible).map(d => d.mesh.position.toArray()), dust: b.dust.filter(d => d.mesh.visible).length })), clouds: [...effects.arts.shots.values()].filter(a => a.cloud?.g.visible).length }, projectiles: shots.map(s => ({ owner: s.owner, element: s.element, waterInfused:!!s.waterInfused,shurikenType:s.shurikenType||null,energy:!!s.energy, style: s.style, introStage: s.introStage || null, visual: s.element==='weapon'?effects.shurikens.visualState(s):s.element==='wind'?{style:s.style,volume:s.style==='tornado'?'3d-spiral':'3d-crescent'}:s.element==='lightning'?effects.lightningArts.visualState(s):effects.waterArts.visualState(s), growth: s.growth ?? null, depth: s.depth || 0, riseTime: s.riseTime || 0, growthTime: s.growthTime || 0, carried: s.carried ? s.carried.map(c => ({ ...c })) : [], hitTarget: !!s.hitTarget, phase: s.phase || 'flying', age: s.age, flightAge: s.flightAge || 0, fallAge: s.fallAge || 0, preludeAge: s.preludeAge || 0, slowFactor: s.slowFactor ?? 1, color: s.color, reflected: s.reflected, position: [...s.p], velocity: [...s.v], motionTime:s.motionTime||0, motionDistance:s.motionDistance||0, speedRatio:s.flightSpeedRatio??(s.element==='weapon'?1:FLIGHT_PROFILE.launchSpeedRatio), actualSpeed:s.motionSpeed||0, size: s.size, damage:s.damage, lightBends:s.lightBends||0,rowIndex: s.rowIndex ?? null, holdTime: s.holdTime || 0, target: s.target ? [...s.target] : null })) });
  window.__AN_HOA__ = { state, flightProfile:{...FLIGHT_PROFILE} };
  adventure=createAdventure({canvas,onLoadJourney:loadJourneySpells,onLearn:id=>{if(spells.some(s=>s.id===id)){learnedSpells.add(id);renderLoadout();}},onBattle:()=>{prepare();adventure.showLoadout();$('startButton').innerHTML='GIAO CHIẾN <span>→</span>';$('changeLoadout').textContent='Rút lui · hồi sinh tại điểm lưu';},onDuel:()=>{restoreDuelSpells();prepare();$('startButton').innerHTML='VÀO TRẬN <span>→</span>';$('changeLoadout').textContent='Về quyển trục chọn chiêu';},onReturn:()=>prepare()});
  window.__AN_HOA__.adventure=()=>adventure.state();
  if(testMode){window.__AN_HOA__.explore=adventure.test;window.__AN_HOA__.setHealth=(owner,hp)=>{(owner==='player'?player:enemy).hp=hp;};}
  const viewParams=new URLSearchParams(location.search);
  if(viewParams.get('mode')==='duel'||(testMode&&viewParams.get('adventure')!=='1'))document.getElementById('duelMode').click();
  if(testMode)window.__AN_HOA__.setWindCameraEnabled=enabled=>{windCameraEnabled=!!enabled;if(!enabled)clearWindView();};
  if(testMode)window.__AN_HOA__.setAIEnabled=enabled=>{testAIDisabled=!enabled;};
  if (testMode) window.__AN_HOA__.launchEnemy = (id, pos = enemyPos(), dir = vnorm(vsub(playerPos(), pos))) => {
    if (!started || paused || won) return;
    const spell = spells.find(s => s.id === id); if (!spell) throw new Error('Unknown spell');
    launch(spell, 'enemy', pos, dir);
  };
  if (testMode) window.__AN_HOA__.advance = seconds => { for (let t = 0; t < seconds; t += 1 / 60) tick(Math.min(1 / 60, seconds - t)); render(); };
  setupScrollOpening();
  renderLoadout(); renderGuide(); updateUI(); $('loading').classList.add('hidden'); document.body.dataset.ready = 'true'; tick(.016); render(); if (!testMode) requestAnimationFrame(frame);
}
main().catch(error => { console.error(error); document.getElementById('loading')?.classList.add('hidden'); const el = document.getElementById('errorScreen'); el.classList.remove('hidden'); el.textContent = 'Không khởi tạo được đồ họa 3D. Hãy mở bằng Chrome/Edge hỗ trợ WebGL 2 và bật tăng tốc đồ họa.'; });
