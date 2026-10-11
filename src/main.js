import * as T from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { createWorld } from "./scene.js";
import { createHands } from "./hands.js";
import { FireEffects } from "./effects.js";
import { sealNames as names } from "./poses.js";
import { createOpponent } from "./opponent.js";
import { CameraImpacts } from './camera-impact.js';
async function main() {
  const $ = id => document.getElementById(id), { keys, spells, elements, defaultLoadout, validateLoadout, GameRules, Fighter, intersectFireWall, intersectsWave, meteorTarget } = globalThis.SealGameCore;
  let rules = new GameRules(), player = new Fighter(), enemy = new Fighter(), aiRules = new GameRules();
  const testMode = new URLSearchParams(location.search).get("test") === "1";
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
  const scene = world.scene, opponent = await createOpponent(scene, world.gate.position);
  const baseFov = 68;
  const camera3d = new T.PerspectiveCamera(baseFov, innerWidth / innerHeight, 0.05, 220), handCamera = new T.PerspectiveCamera(baseFov, innerWidth / innerHeight, 0.02, 10);
  camera3d.rotation.order = "YXZ";
  const effects = new FireEffects(scene), shots = [], particles = [], salvos = [], walls = [];
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
  let spellVoice = null;
  const dragonFormation = 1.1, dragonUncoil = .32;
  let dragonView = null;
  const meteorSkyTime = 1.4, meteorReturnTime = .4;
  const meteorZoomInTime = .24, meteorZoomAmount = 14;
  let meteorView = null;
  let loadout = [...defaultLoadout], filterElement = 'all', filterKind = 'all', loadoutMessage = '';
  let enemyPose = -1, enemyHit = 0, aiTimer = 2.2, aiSpell = null, aiStep = 0, aiCycle = 0, aiCasts = 0, aiCastAge = 99, battleTime = 0;
  try { const saved = JSON.parse(localStorage.getItem('anhoa-loadout-v3')); if (validateLoadout(saved).ok) loadout = saved; } catch {}
  const playerShield = new T.Mesh(new T.SphereGeometry(1, 24, 16), new T.MeshBasicMaterial({ color: '#a6edff', transparent: true, opacity: .09, wireframe: true, depthWrite: false }));
  playerShield.scale.set(1.05, 1.5, 1.05); scene.add(playerShield);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let quality = 1;
  const qualities = [{ name: "Cao", ratio: 1.7, shadow: 2048, bloom: true, grass: 1700 }, { name: "C\xE2n b\u1EB1ng", ratio: 1.25, shadow: 1024, bloom: true, grass: 1200 }, { name: "Th\u1EA5p", ratio: 1, shadow: 512, bloom: false, grass: 650 }];
  function resize() {
    const preset = qualities[quality], dpr = Math.min(devicePixelRatio || 1, preset.ratio);
    renderer.setPixelRatio(dpr);
    renderer.setSize(innerWidth, innerHeight, false);
    composer.setPixelRatio(dpr);
    composer.setSize(innerWidth, innerHeight);
    effects.setPixelRatio(dpr);
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
    if (!preparation) return '<button class="spell ' + (i === selected ? 'selected' : '') + '" style="--element:' + spell.color + '" data-spell="' + i + '"><div class="spell-title">' + spell.name + '</div><div class="spell-sequence">' + spell.sequence.map(k => '<kbd data-seq="' + k + '">' + k.toUpperCase() + '</kbd>').join('') + '</div></button>';
    const taken = loadout.includes(spell.id), kind = spell.kind === 'attack' ? 'CÔNG' : 'THỦ';
    const stats = spell.kind === 'attack' ? spell.damage + (spell.count > 1 ? ' × ' + spell.count : '') + ' sát thương' : ['firewall', 'waterwall'].includes(spell.style) ? spell.shield + ' độ bền · chặn đạn' : spell.shield + ' khiên' + (spell.heal ? ' · hồi ' + spell.heal + ' máu' : '');
    return '<button class="spell ' + (preparation ? taken ? 'equipped' : '' : i === selected ? 'selected' : '') + '" style="--element:' + spell.color + '" data-' + (preparation ? 'equip="' + spell.id : 'spell="' + i) + '"' + (preparation ? ' aria-pressed="' + taken + '"' : '') + '><span class="spell-icon">' + spell.glyph + '</span><div><div class="spell-title">' + spell.name + '<small>' + kind + ' · CẤP ' + spell.rank + ' · ' + spell.sequence.length + ' ẤN · ' + spell.cost + ' CH</small></div><p>' + spell.subtitle + (preparation ? '<br>' + stats : '') + '</p><div class="spell-sequence">' + spell.sequence.map(k => '<kbd data-seq="' + k + '">' + k.toUpperCase() + '</kbd>').join('') + '</div></div>' + (preparation ? '<span class="equip-mark">' + (taken ? '✓' : '+') + '</span>' : '') + '</button>';
  }
  function renderLoadout() {
    const counts = { attack: 0, defense: 0 };
    loadout.forEach(id => counts[spells.find(s => s.id === id).kind]++);
    $('loadoutCount').textContent = loadout.length + ' / 5';
    $('loadoutBalance').textContent = counts.attack + ' công · ' + counts.defense + ' thủ';
    $('loadoutSlots').innerHTML = Array.from({ length: 5 }, (_, i) => {
      const s = spells.find(s => s.id === loadout[i]);
      return s ? '<button class="loadout-slot filled" data-remove="' + s.id + '" style="--element:' + s.color + '" title="Bỏ ' + s.name + '"><b>' + s.glyph + '</b><span>' + s.name + '<small>' + (s.kind === 'attack' ? 'Tấn công' : 'Phòng ngự') + '</small></span><i>×</i></button>' : '<div class="loadout-slot empty"><b>' + (i + 1) + '</b><span>Ô chiêu trống</span></div>';
    }).join('');
    const visible = spells.filter(s => (filterElement === 'all' || s.element === filterElement) && (filterKind === 'all' || s.kind === filterKind));
    $('spellCatalog').innerHTML = visible.map((s, i) => spellMarkup(s, i, true)).join('');
    const valid = validateLoadout(loadout);
    $('startButton').disabled = !valid.ok;
    $('loadoutNotice').textContent = loadoutMessage || (valid.ok ? 'Bộ chiêu sẵn sàng. Có thể phối hợp nhiều hệ trong một trận.' : valid.reason);
    document.querySelectorAll('[data-equip]').forEach(el => el.onclick = () => toggleEquip(el.dataset.equip));
    document.querySelectorAll('[data-remove]').forEach(el => el.onclick = () => toggleEquip(el.dataset.remove));
    document.querySelectorAll('[data-element]').forEach(el => el.classList.toggle('active', el.dataset.element === filterElement));
    document.querySelectorAll('[data-kind]').forEach(el => el.classList.toggle('active', el.dataset.kind === filterKind));
  }
  function toggleEquip(id) {
    if (started) return;
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
  document.querySelectorAll('[data-kind]').forEach(el => el.onclick = () => { filterKind = el.dataset.kind; renderLoadout(); });
  $('presetAttack').onclick = () => { loadout = [...defaultLoadout]; loadoutMessage = ''; renderLoadout(); };
  $('presetDefense').onclick = () => { loadout = ['fire-orb', 'wind-lance', 'earth-barrier', 'water-reflect', 'wood-barrier']; loadoutMessage = ''; renderLoadout(); };
  $('presetFire').onclick = () => { loadout = ['fire-volley', 'fire-lance', 'fire-meteor', 'fire-barrier', 'fire-reflect']; filterElement = 'fire'; filterKind = 'all'; loadoutMessage = ''; renderLoadout(); };
  $('clearLoadout').onclick = () => { loadout = []; loadoutMessage = ''; renderLoadout(); };
  function renderGuide() {
    $('spellList').innerHTML = rules.spells.map((s, i) => spellMarkup(s, i)).join('');
    document.querySelectorAll('[data-spell]').forEach(el => el.onclick = () => selectSpell(Number(el.dataset.spell)));
  }
  function selectSpell(i) { if (!rules.spells[i]) return; selected = i; updateUI(); }
  function announce(text, error = false) {
    $('message').textContent = text; $('message').style.color = error ? '#ffc28b' : '#c7d5bb'; messageTime = 3.2;
  }
  function updateUI() {
    const seq = rules.sequence;
    const matches = s => seq.length && s.sequence.slice(0, seq.length).join('') === seq.join('');
    const matching = rules.spells[selected] && matches(rules.spells[selected]) ? selected : rules.spells.findIndex(matches);
    if (matching >= 0) selected = matching;
    const spell = rules.spells[selected] || rules.spells[0];
    $('comboSlots').innerHTML = spell.sequence.map((k, i) => '<span class="combo-slot ' + (seq[i] === k ? 'done' : seq.length === i ? 'next' : '') + '">' + k.toUpperCase() + '</span>').join('');
    const ready = rules.ready();
    $('comboLabel').textContent = ready?.id === spell.id ? 'ẤN HOÀN CHỈNH · ' + spell.name.toUpperCase() : spell.name.toUpperCase() + ' / ' + seq.length + ' / ' + spell.sequence.length + ' ẤN';
    $('castButton').disabled = !started || paused || won || player.controlTime > 0 || !ready || rules.cooldown > 0 || rules.chakra < (ready?.cost || spell.cost);
    // The ready flames follow exactly the same gate as the Space button.
    hands.setReady($('castButton').disabled ? null : ready.element);
    document.querySelectorAll('.seal').forEach(el => { el.classList.toggle('active', el.dataset.key === keys[activePose]); el.classList.toggle('pending', seq.includes(el.dataset.key)); });
    document.querySelectorAll('[data-spell]').forEach((el, i) => { el.classList.toggle('selected', i === selected); el.querySelectorAll('kbd').forEach((k, j) => k.classList.toggle('done', i === selected && seq[j] === k.dataset.seq)); });
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
    if (!started || paused || won || player.controlTime > 0) return;
    const result = rules.seal(key); activePose = keys.indexOf(key); hands.seal(activePose); poseAge = 0;
    $('currentSeal').textContent = key.toUpperCase() + ' / Ấn ' + String(activePose + 1).padStart(2, '0') + ' · ' + names[activePose];
    tone(290 + activePose * 28, .09, 'triangle');
    if (!result.valid) announce('Sai chuỗi. Chỉ dùng các chiêu đã mang vào trận.', true);
    else if (result.ready) {
      const extendable = rules.spells.some(s => s.sequence.length > rules.sequence.length && s.sequence.slice(0, rules.sequence.length).join('') === rules.sequence.join(''));
      announce(result.ready.name + ' đủ ' + result.ready.sequence.length + ' ấn: SPACE thi triển' + (extendable ? ', hoặc kết tiếp để dùng chiêu mạnh hơn.' : '.'));
      tone(670, .23);
    } else {
      const candidate = rules.spells.find(s => s.sequence.slice(0, rules.sequence.length).join('') === rules.sequence.join(''));
      announce('Ấn ' + rules.sequence.length + ' / ' + (candidate?.sequence.length || rules.spells[selected].sequence.length) + ' — tiếp tục kết ấn');
    }
    updateUI();
  }
  function aim() { const cp = Math.cos(camera.pitch); return [-Math.sin(camera.yaw) * cp, Math.sin(camera.pitch), -Math.cos(camera.yaw) * cp]; }
  function enemyPos() { return [opponent.group.position.x, 1.72, opponent.group.position.z]; }
  function launch(spell, owner, pos, dir) {
    if (spell.kind === 'defense') {
      if (owner === 'player') cameraImpacts.trigger('defense');
      if (['firewall', 'waterwall'].includes(spell.style)) {
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
      const target = volleyTarget(owner, pos, dir), p = vadd(pos, vmul(dir, 3.5));
      const travelTime = Math.max(.2, vlen(vsub(target, p)) / spell.speed);
      shots.push({ p, old: [...p], origin: [...p], target, v: vmul(vsub(target, p), 1 / travelTime), travelTime,
        size: spell.size, damage: spell.damage, blastRadius: spell.blastRadius, style: spell.style, element: spell.element,
        color: spell.color, owner, unreflectable: true, reflected: false, life: travelTime + .1, trail: 0, age: 0 });
      if (owner === 'player') cameraImpacts.trigger('orb', 1.3);
      return;
    }
    if (spell.style === 'tsunami') {
      const normal = vnorm([dir[0], 0, dir[2]]), p = vadd(pos, vmul(normal, 3)); p[1] = 0;
      shots.push({ p, old: [...p], v: vmul(normal, spell.speed), normal, width: spell.waveWidth, height: spell.waveHeight,
        size: spell.size, damage: spell.damage, style: spell.style, element: spell.element, color: spell.color,
        owner, unreflectable: true, reflected: false, life: 5, trail: 0, age: 0, carried: [] });
      return;
    }
    if (spell.style === 'meteor') {
      const target = meteorTarget(pos, dir), skyStart = [target[0] + 38, 65, target[2] + 7];
      const totalTime = meteorSkyTime + meteorReturnTime + spell.fallTime;
      const velocity = vmul(vsub(target, skyStart), 1 / totalTime);
      const cloudBreakTime = (65 - 42) / -velocity[1];
      const cloudPoint = vadd(skyStart, vmul(velocity, cloudBreakTime));
      const shot = { p: [...skyStart], old: [...skyStart], v: velocity, target,
        skyStart, totalTime, cloudPoint, cloudBreakTime, phase: 'sky', preludeAge: 0,
        skyTime: meteorSkyTime, returnTime: meteorReturnTime, fallAge: 0, blastRadius: spell.blastRadius, unreflectable: true,
        size: spell.size, damage: spell.damage, style: spell.style, element: spell.element, color: spell.color, owner, reflected: false, life: totalTime + .5, fallTime: spell.fallTime, trail: 0, age: 0 };
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
    if (owner === 'player') cameraImpacts.trigger('orb');
    for (let i = 0; i < spell.count; i++) {
      const spread = (i - (spell.count - 1) / 2) * .12;
      const d = vnorm(vadd(dir, vmul(right, spread)));
      const p = vadd(pos, vmul(d, .85));
      shots.push({ p, old: [...p], v: vmul(d, spell.speed), size: spell.size, damage: spell.damage, controlDuration: spell.controlDuration, style: spell.style, element: spell.element, color: spell.color, owner, reflected: false, life: 4, trail: 0, age: 0 });
    }
  }
  function volleyTarget(owner, pos, dir) {
    const opponentPosition = owner === 'player' ? enemyPos() : camera.p;
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
      shot.p = vadd(camera.p, local.toArray());
    } else {
      const right = vnorm([-shot.castDirection[2], 0, shot.castDirection[0]]);
      shot.p = vadd(vadd(enemyPos(), vmul(shot.castDirection, 1.1)), vmul(right, x)); shot.p[1] += .15;
    }
  }
  function cast() {
    if (!started || paused || won) return;
    if (player.controlTime > 0) { announce('Đang bị giam trong Thủy ngục!', true); return; }
    const result = rules.cast();
    if (!result.ok) { announce({ sequence: 'Kết đủ chuỗi ấn của một chiêu đã mang theo.', cooldown: 'Chờ một nhịp để thi triển tiếp.', chakra: 'Chakra chưa đủ — chờ hồi phục.' }[result.reason], true); tone(130, .1); return; }
    const spell = result.spell;
    activePose = -1; poseAge = 0; recoil = .22; flashTimer = .12; hands.cast(); fireSound();
    launch(spell, 'player', camera.p, aim()); announce(spell.name + '!');
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
    $('winScreen').classList.remove('hidden'); updateUI();
  }
  function impact(shot, pos) {
    const fighter = shot.owner === 'enemy' ? player : enemy, result = fighter.receive(shot.damage, shot.reflected || shot.unreflectable);
    if (dragonView?.shot === shot && dragonView.phase === 'overhead') { dragonView.phase = 'impact'; dragonView.hold = 0; }
    const cleanVolleyHit = shot.element === 'fire' && shot.style === 'volley';
    if (shot.style !== 'meteor' && !cleanVolleyHit) burst(pos, 14, .9, shot.color);
    if (result.reflected) {
      if (shot.owner === 'enemy') cameraImpacts.trigger('reflect');
      shot.owner = shot.owner === 'enemy' ? 'player' : 'enemy'; shot.reflected = true;
      const destination = shot.owner === 'enemy' ? camera.p : enemyPos(), d = vnorm(vsub(destination, pos));
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
    if (enemy.hp <= 0 || player.hp <= 0) finish(player.hp > 0);
    return true;
  }
  function meteorImpact(shot) {
    const pos = [shot.p[0], .1, shot.p[2]];
    effects.arts.blast(pos, 'meteor', shot.blastRadius);
    for (let j = 0; j < 80; j++) particle(pos, [range(-7, 7), range(2, 12), range(-7, 7)], range(.025, .08), range(.6, 1.2), '#ffc56e');
    recoil = Math.max(recoil, .65); tone(48, .55, 'sawtooth', .09);
    cameraImpacts.trigger('meteorHit', clamp(1 - vlen(vsub(pos, camera.p)) / 65, .15, 1));
    for (const wall of walls) if (Math.hypot(pos[0] - wall.p[0], pos[2] - wall.p[2]) <= shot.blastRadius) wall.hp = Math.max(0, wall.hp - shot.damage);
    const target = shot.owner === 'enemy' ? camera.p : enemyPos();
    if (Math.hypot(target[0] - pos[0], target[2] - pos[2]) <= shot.blastRadius) impact(shot, pos);
  }
  function updateShots(dt) {
    for (let i = walls.length - 1; i >= 0; i--) { walls[i].life -= dt; if (walls[i].life <= 0 || walls[i].hp <= 0) walls.splice(i, 1); }
    const swept = new Set();
    for (const wave of shots.filter(s => s.style === 'tsunami')) {
      if (swept.has(wave)) continue;
      const end = vadd(wave.p, vmul(wave.v, dt));
      for (const other of shots) {
        if (other === wave || swept.has(other)) continue;
        const otherEnd = ['forming', 'staged'].includes(other.phase) ? other.p : vadd(other.p, vmul(other.v, dt));
        if (intersectsWave(other.p, otherEnd, wave.p, end, wave.normal, wave.width, wave.height, other.size)) {
          swept.add(other); wave.carried.push({ color: other.color, style: other.style, owner: other.owner, element: other.element });
          if (wave.carried.length > 24) wave.carried.shift();
        }
      }
      for (const wall of walls) {
        const across = [-wall.normal[2], 0, wall.normal[0]], radius = wall.radius || wall.width / 2;
        const left = vadd(wall.p, vmul(across, -radius)), right = vadd(wall.p, vmul(across, radius));
        if (intersectsWave(left, right, wave.p, end, wave.normal, wave.width, wave.height)) wall.hp = 0;
      }
    }
    for (let i = shots.length - 1; i >= 0; i--) {
      const shot = shots[i]; shot.old = [...shot.p];
      if (swept.has(shot)) { shots.splice(i, 1); continue; }
      let flightDt = dt;
      if (shot.style === 'tsunami') {
        shot.p = vadd(shot.p, vmul(shot.v, dt)); shot.age += dt; shot.life -= dt;
        const target = shot.owner === 'enemy' ? camera.p : enemyPos();
        if (!shot.hitTarget && intersectsWave(target, target, shot.old, shot.p, shot.normal, shot.width, shot.height, .54)) {
          shot.hitTarget = true; impact(shot, target);
        }
        if (shot.life <= 0 || Math.abs(shot.p[0]) > 65 || Math.abs(shot.p[2]) > 65) shots.splice(i, 1);
        if (won) break;
        continue;
      }
      if (shot.style === 'boat') {
        shot.age = Math.min(shot.travelTime, shot.age + dt);
        shot.p = vadd(shot.origin, vmul(shot.v, shot.age));
        const wall = walls.find(w => w.hp > 0 && w.owner !== shot.owner && intersectFireWall(shot.old, shot.p, w));
        if (wall) { wall.hp = Math.max(0, wall.hp - shot.damage); burst(shot.p, 24, 2, shot.color); shots.splice(i, 1); continue; }
        if (shot.age + 1e-6 >= shot.travelTime) {
          burst(shot.target, 36, 3, shot.color);
          const target = shot.owner === 'enemy' ? camera.p : enemyPos();
          if (vlen(vsub(target, shot.target)) <= shot.blastRadius) impact(shot, shot.target);
          shots.splice(i, 1);
        }
        if (won) break;
        continue;
      }
      if (shot.style === 'meteor') {
        // One fixed velocity from first appearance to impact: no bend or pause at a camera transition.
        shot.age = Math.min(shot.totalTime, shot.age + dt);
        const prelude = shot.skyTime + shot.returnTime;
        shot.preludeAge = Math.min(prelude, shot.age); shot.fallAge = Math.max(0, shot.age - prelude);
        shot.phase = shot.age < shot.skyTime ? 'sky' : shot.age + 1e-6 < prelude ? 'returning' : 'falling';
        shot.p = vadd(shot.skyStart, vmul(shot.v, shot.age));
        emitShotTrail(shot, dt);
        if (shot.age + 1e-6 >= shot.totalTime) { shot.p = [...shot.target]; meteorImpact(shot); shots.splice(i, 1); }
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
        burst(shot.p, 18, 1.8, '#ffc45e'); tone(85, .25, 'sawtooth', .045);
      }
      shot.p = vadd(shot.p, vmul(shot.v, flightDt));
      if (shot.gravity) { shot.p = vadd(shot.p, vmul(shot.gravity, .5 * flightDt * flightDt)); shot.v = vadd(shot.v, vmul(shot.gravity, flightDt)); }
      shot.life -= flightDt; shot.age += flightDt;
      if (shot.phase === 'flying') shot.flightAge += flightDt;
      emitShotTrail(shot, flightDt);
      const wall = walls.find(w => w.hp > 0 && w.owner !== shot.owner && intersectFireWall(shot.old, shot.p, w));
      if (wall) {
        const point = intersectFireWall(shot.old, shot.p, wall); wall.hp = Math.max(0, wall.hp - shot.damage);
        burst(point, 15, 1.6, wall.element === 'water' ? '#50baff' : '#ffc45e');
        if (wall.element !== 'water') effects.arts.blast(point, 'orb'); shots.splice(i, 1);
        if (wall.owner === 'player') announce(wall.element === 'water' ? 'Thủy thuẫn đã chặn chiêu!' : 'Tường lửa đã chặn đạn!');
        if (wall.owner === 'player') cameraImpacts.trigger('block', .8);
        continue;
      }
      const target = shot.owner === 'enemy' ? camera.p : enemyPos(), delta = vsub(shot.p, shot.old), t = clamp(dot(vsub(target, shot.old), delta) / (dot(delta, delta) || 1), 0, 1), closest = vadd(shot.old, vmul(delta, t));
      const collided = vlen(vsub(closest, target)) < .54 + shot.size;
      if (shot.element === 'fire' && shot.style === 'volley' && !collided && dot(vsub(shot.target, shot.old), vsub(shot.target, shot.p)) <= 0) { shots.splice(i, 1); continue; }
      if (collided && impact(shot, closest)) shots.splice(i, 1);
      else if (shot.life <= 0 || Math.abs(shot.p[0]) > 30 || Math.abs(shot.p[2]) > 45 || shot.p[1] < .08) shots.splice(i, 1);
      if (won) break;
    }
  }
  function emitShotTrail(shot, dt) {
    shot.trail += dt;
    while (shot.trail > .025) {
      shot.trail -= .025; particle(shot.p, vmul(shot.v, -.06), shot.size * .4, shot.style === 'meteor' ? .8 : .4, shot.color, shot);
      if (shot.element === 'fire') {
        const jitter = [range(-shot.size, shot.size), range(-shot.size, shot.size), range(-shot.size, shot.size)];
        particle(vadd(shot.p, jitter), [range(-.8, .8), range(.2, 1.2), range(-.8, .8)], .04, .6, '#ffc56f', shot);
      }
    }
  }
  function updateAI(dt) {
    aiRules.tick(dt); aiCastAge += dt;
    if (enemy.controlTime > 0) { $('enemyAction').textContent = 'Thủy ngục · ' + enemy.controlTime.toFixed(1) + 's'; return; }
    aiTimer -= dt;
    if (aiTimer > 0) return;
    if (!aiSpell) {
      const incoming = shots.some(s => s.owner === 'player' && vlen(vsub(s.p, enemyPos())) < 11);
      const defenses = aiRules.spells.filter(s => s.kind === 'defense' && s.cost <= aiRules.chakra), attacks = aiRules.spells.filter(s => s.kind === 'attack' && s.cost <= aiRules.chakra);
      const choices = incoming && enemy.shieldTime <= 0 && defenses.length && aiCycle % 3 === 2 ? defenses : attacks;
      aiSpell = choices[aiCycle % choices.length];
      if (!aiSpell) { aiTimer = .6; return; }
      aiRules.clear(); aiStep = 0; aiCycle++;
    }
    if (aiStep < aiSpell.sequence.length) {
      const key = aiSpell.sequence[aiStep++]; aiRules.seal(key); enemyPose = keys.indexOf(key); opponent.rig.seal();
      aiTimer = .42; $('enemyAction').textContent = 'Kết ấn ' + aiStep + '/' + aiSpell.sequence.length + ' · ' + aiSpell.name;
    } else {
      const result = aiRules.cast();
      if (result.ok) { launch(aiSpell, 'enemy', enemyPos(), vnorm(vsub(camera.p, enemyPos()))); opponent.rig.cast(); aiCasts++; aiCastAge = 0; $('enemyAction').textContent = 'Thi triển · ' + aiSpell.name; }
      enemyPose = -1; aiSpell = null; aiTimer = 1.65;
    }
  }
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.life -= dt; if (p.life <= 0) { particles.splice(i, 1); continue; } p.p = vadd(p.p, vmul(p.v, dt)); p.v[1] += dt * .35; p.v = vmul(p.v, 1 - dt * .8); }
  }
  function tick(dt) {
    const running = started && !paused && !won;
    if (!paused) animationTime += dt;
    if (running) {
      battleTime += dt;
      if (rules.tick(dt)) announce('Chuỗi ấn hết hạn — kết lại từ đầu.', true);
      player.tick(dt); enemy.tick(dt);
      const remaining = moveTargetX - camera.p[0];
      moveDirection = player.controlTime <= 0 && Math.abs(remaining) > .001 ? Math.sign(remaining) : 0;
      camera.p[0] += moveDirection * Math.min(Math.abs(remaining), 10 * dt);
      poseAge += dt; if (poseAge > 2.8 && !rules.sequence.length) activePose = -1;
      updateAI(dt); updateShots(dt);
      messageTime -= dt;
      if (messageTime <= 0) { $('message').textContent = rules.ready() ? 'SPACE thi triển · chuột trái/phải để né' : 'Kết ấn theo quyển trục mang theo'; $('message').style.color = '#c7c5b6'; }
      updateUI();
    }
    if (!paused) {
      recoil = Math.max(0, recoil - dt * .7); flashTimer = Math.max(0, flashTimer - dt); hitTimer = Math.max(0, hitTimer - dt); enemyHit = Math.max(0, enemyHit - dt);
      updateParticles(dt); world.update(animationTime, dt);
      hands.update(dt, animationTime, activePose, !$('castButton').disabled, !!moveDirection, Math.min(1, shots.filter(s => s.phase !== 'staged').length * .2 + recoil * 3), reducedMotion);
      opponent.update(dt, animationTime, enemyPose, !!aiRules.ready(), enemy, enemyHit, aiCastAge < .35);
    }
    $('chakraNumber').textContent = Math.floor(rules.chakra) + ' / 100'; $('chakraFill').style.width = rules.chakra + '%'; $('castCount').textContent = rules.casts + ' thuật';
    $('healthNumber').textContent = Math.ceil(player.hp) + ' / ' + player.maxHp; $('healthFill').style.width = player.hp / player.maxHp * 100 + '%';
    const playerWall = walls.find(w => w.owner === 'player' && w.hp > 0), shieldLabel = player.shieldTime > 0 && (player.shield || player.reflect) ? 'Khiên ' + player.shield + (player.reflect ? ' · phản đòn' : '') : '';
    $('shieldStatus').textContent = [player.controlTime > 0 ? 'Thủy ngục ' + player.controlTime.toFixed(1) + 's' : '', shieldLabel, playerWall ? (playerWall.element === 'water' ? 'Thủy thuẫn ' : 'Tường ') + playerWall.hp + ' · ' + playerWall.life.toFixed(1) + 's' : ''].filter(Boolean).join(' · ') || 'Chưa có khiên';
    $('enemyHP').style.width = enemy.hp / enemy.maxHp * 100 + '%'; $('enemyHealth').textContent = Math.ceil(enemy.hp) + ' / ' + enemy.maxHp;
    const enemyWall = walls.find(w => w.owner === 'enemy' && w.hp > 0);
    $('enemyChakra').textContent = Math.floor(aiRules.chakra) + ' CH'; $('enemyShield').textContent = [enemy.shieldTime > 0 && (enemy.shield || enemy.reflect) ? 'Khiên ' + enemy.shield + (enemy.reflect ? ' · phản đòn' : '') : '', enemyWall ? (enemyWall.element === 'water' ? 'Thủy thuẫn ' : 'Tường lửa ') + enemyWall.hp : ''].filter(Boolean).join(' · ');
    $('battleClock').textContent = Math.floor(battleTime / 60).toString().padStart(2, '0') + ':' + Math.floor(battleTime % 60).toString().padStart(2, '0');
    $('moveHint').textContent = moveDirection ? (moveDirection < 0 ? '← ĐANG NÉ TRÁI' : 'ĐANG NÉ PHẢI →') : 'CHUỘT TRÁI: NÉ TRÁI · CHUỘT PHẢI: NÉ PHẢI';
    $('flash').style.opacity = flashTimer * .32; $('hitMarker').style.opacity = hitTimer > 0 ? 1 : 0;
    const delta = vsub(enemyPos(), camera.p), d = aim(), onTarget = vlen(vsub(delta, vmul(d, dot(delta, d)))) < .7;
    $('reticle').classList.toggle('on-target', onTarget && enemy.hp > 0);
    $('targetInfo').style.opacity = onTarget && running ? 1 : 0; $('targetName').textContent = 'ĐỐI THỦ'; $('targetHP').style.width = enemy.hp / enemy.maxHp * 100 + '%';
    playerShield.visible = !['fire', 'water'].includes(player.defenseElement) && player.shieldTime > 0 && (player.shield > 0 || player.reflect > 0); playerShield.position.set(camera.p[0], 1.45, camera.p[2]); playerShield.material.color.set(player.color); playerShield.rotation.y = animationTime * .4;
    document.body.classList.toggle('dragon-active', started && !won && (!!dragonView || shots.some(s => s.owner === 'player' && s.phase === 'forming')));
    camera3d.position.fromArray(camera.p); camera3d.rotation.set(camera.pitch, camera.yaw, 0, 'YXZ');
    updateDragonView(running ? dt : 0);
    updateMeteorView(running ? dt : 0);
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
    if (meteorView) setWorldFov(camera3d.fov + cameraReaction.zoom);
    else setWorldFov(reducedMotion ? baseFov : T.MathUtils.damp(camera3d.fov, baseFov + chargeZoom + cameraReaction.zoom, 20, paused ? 0 : dt));
    reactionPosition.fromArray(cameraReaction.position).applyQuaternion(camera3d.quaternion);
    camera3d.position.add(reactionPosition);
    reactionEuler.set(...cameraReaction.rotation); reactionRotation.setFromEuler(reactionEuler);
    camera3d.quaternion.multiply(reactionRotation);
    effects.update(paused ? 0 : dt, animationTime, shots, particles, camera3d, quality, walls,
      [{ owner: 'player', fighter: player, pos: camera.p }, { owner: 'enemy', fighter: enemy, pos: enemyPos() }]);
  }
  function render() { renderer.info.reset(); renderer.clear(); composer.render(); }
  function clearDragonView() {
    dragonView = null; handsPass.enabled = !meteorView;
    document.body.classList.remove('dragon-camera', 'dragon-active');
  }
  function beginDragonView(shot) {
    clearMeteorView();
    dragonView = { shot, phase: 'overhead', age: 0, hold: 0,
      from: camera3d.position.clone(), rotation: camera3d.quaternion.clone() };
    handsPass.enabled = false; document.body.classList.add('dragon-camera');
  }
  function clearMeteorView() {
    if (meteorView) setWorldFov(baseFov);
    meteorView = null; handsPass.enabled = !dragonView;
    document.body.classList.remove('meteor-camera');
  }
  function beginMeteorView(shot) {
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
  function updateMeteorView(dt) {
    if (!meteorView) return;
    const view = meteorView, shot = view.shot, base = camera3d.quaternion.clone();
    if (!dt && view.renderedRotation) { camera3d.position.copy(view.renderedPosition); camera3d.quaternion.copy(view.renderedRotation); setWorldFov(view.renderedFov); return; }
    if (!shots.includes(shot) || shot.phase === 'falling') { clearMeteorView(); return; }
    if (shot.phase === 'sky') {
      const zoomedFov = view.fromFov - meteorZoomAmount;
      const zoomingIn = shot.preludeAge <= meteorZoomInTime;
      const zoomT = zoomingIn ? clamp(shot.preludeAge / meteorZoomInTime, 0, 1)
        : clamp((shot.preludeAge - meteorZoomInTime) / (shot.skyTime - meteorZoomInTime), 0, 1);
      const zoomEase = zoomT * zoomT * (3 - 2 * zoomT);
      setWorldFov(reducedMotion ? view.fromFov : T.MathUtils.lerp(zoomingIn ? view.fromFov : zoomedFov, zoomingIn ? zoomedFov : view.fromFov, zoomEase));
      camera3d.lookAt(new T.Vector3(...(reducedMotion ? shot.cloudPoint : shot.p)));
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
    moveTargetX = clamp(moveTargetX + direction * 1.8, -6, 6);
  }
  function look(dx, dy) {
    if (dragonView || meteorView) return;
    camera.yaw -= dx * .0025;
    camera.pitch = clamp(camera.pitch - dy * .0025, -.65, .65);
  }
  function start(event) {
    if (started) return;
    const valid = validateLoadout(loadout); if (!valid.ok) { loadoutMessage = valid.reason; renderLoadout(); return; }
    stopSpellVoice();
    clearDragonView();
    clearMeteorView();
    rules = new GameRules(loadout); player = new Fighter(); enemy = new Fighter();
    cameraImpacts.reset(); cameraReaction = cameraImpacts.sample(); setWorldFov(baseFov);
    const el = elements[(round - 1) % elements.length], support = elements[(round + 1) % elements.length];
    aiRules = new GameRules([el.id + '-orb', el.id + '-lance', el.id + (el.id === 'fire' ? '-meteor' : '-volley'), support.id + '-barrier', support.id + '-reflect']);
    $('enemyElement').textContent = el.glyph + ' ' + el.name + ' / ' + support.name; $('enemyAction').textContent = 'Đang quan sát…';
    try { localStorage.setItem('anhoa-loadout-v3', JSON.stringify(loadout)); } catch {}
    started = true; paused = false; won = false; selected = 0; score = 0; battleTime = 0; aiTimer = 2.2; aiSpell = null; aiStep = 0; aiCycle = 0; aiCasts = 0; aiCastAge = 99; enemyPose = -1; enemyHit = 0;
    shots.length = 0; particles.length = 0; salvos.length = 0; walls.length = 0; effects.reset(); hands.clearEffects(); recoil = flashTimer = hitTimer = 0; activePose = -1; poseAge = 99; moveTargetX = 0; moveDirection = 0; touchPoint = null;
    camera = { p: [0, 1.72, 7], yaw: 0, pitch: 0 }; opponent.group.position.copy(world.gate.position); opponent.group.rotation.set(0, 0, 0);
    $('score').textContent = '00'; $('roundText').textContent = 'Trận đấu ' + String(round).padStart(2, '0'); $('currentSeal').textContent = 'Sẵn sàng kết ấn';
    document.body.classList.add('playing'); document.body.classList.remove('paused');
    ['startScreen', 'pauseScreen', 'winScreen'].forEach(id => $(id).classList.add('hidden'));
    initAudio(); audio?.resume(); renderGuide(); announce('Lia chuột để ngắm. Bấm trái né trái, bấm phải né phải.'); updateUI(); tick(0); requestAimLock(event);
  }
  function pause() { if (!started || won) return; paused = true; if (spellVoice) { try { window.speechSynthesis.pause(); } catch {} } moveTargetX = camera.p[0]; moveDirection = 0; releaseAimLock(); document.body.classList.add('paused'); $('pauseScreen').classList.remove('hidden'); updateUI(); }
  function resume(event) { paused = false; if (spellVoice) { try { window.speechSynthesis.resume(); } catch {} } moveTargetX = camera.p[0]; moveDirection = 0; document.body.classList.remove('paused'); $('pauseScreen').classList.add('hidden'); updateUI(); requestAimLock(event); }
  function prepare(next = false) {
    stopSpellVoice();
    clearDragonView();
    clearMeteorView();
    if (next) round++;
    cameraImpacts.reset(); cameraReaction = cameraImpacts.sample(); setWorldFov(baseFov);
    started = false; paused = false; won = false; moveTargetX = 0; moveDirection = 0; aiSpell = null; enemyPose = -1; releaseAimLock();
    shots.length = 0; particles.length = 0; salvos.length = 0; walls.length = 0; effects.reset(); hands.clearEffects(); player = new Fighter(); enemy = new Fighter(); activePose = -1;
    opponent.group.rotation.set(0, 0, 0); camera = { p: [0, 1.72, 7], yaw: 0, pitch: 0 };
    document.body.classList.remove('playing', 'paused'); ['pauseScreen', 'winScreen'].forEach(id => $(id).classList.add('hidden')); $('startScreen').classList.remove('hidden'); loadoutMessage = ''; renderLoadout();
  }
  function toggleSound() { muted = !muted; if (muted) stopSpellVoice(); $('soundButton').textContent = muted ? '♫̸' : '♪'; $('soundButton').setAttribute('aria-pressed', String(muted)); }
  $('startButton').onclick = start; $('resumeButton').onclick = resume; $('resetButton').onclick = e => { started = false; start(e); }; $('changeLoadout').onclick = () => prepare(); $('nextButton').onclick = () => prepare(true); $('castButton').onclick = cast; $('soundButton').onclick = toggleSound;
  $('helpButton').onclick = () => $('guide').classList.toggle('hidden');
  document.querySelectorAll('.seal').forEach(el => el.onclick = () => seal(el.dataset.key));
  window.addEventListener('keydown', e => {
    const key = e.key.toLowerCase();
    if (e.target instanceof HTMLButtonElement && (!started || paused || won) && key === ' ') return;
    if ([' ', 'backspace', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault();
    if (e.repeat) return;
    if (key === 'enter') { e.preventDefault(); if (won) prepare(true); else if (!started) start(e); else if (paused) resume(e); return; }
    if (key === 'escape') { if (started && !won && !paused) pause(); return; }
    if (key === 'h') { $('guide').classList.toggle('hidden'); return; }
    if (key === 'm') { toggleSound(); return; }
    if (!started || paused || won) return;
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
  const state = () => ({ cameraView: meteorView ? 'meteor-' + meteorView.phase : dragonView?.phase || 'first-person', viewFov: camera3d.fov, cameraReaction: { ...cameraReaction, pulses: cameraImpacts.pulses.length }, viewPosition: camera3d.position.toArray(), viewRotation: camera3d.quaternion.toArray(), handsVisible: handsPass.enabled, sealShadow: hands.shadow.state(), handFlames: hands.handFire.mesh.visible, handFlamePosition: hands.handFire.mesh.position.toArray(), ready: true, time: animationTime, handPose: hands.hands[0].wrapper.quaternion.toArray(), fingerPose: hands.hands[0].joints.index_0.quaternion.toArray(), score, round, casting: null, castElapsed: 0, casts: rules.casts, chakra: rules.chakra, sequence: [...rules.sequence], paused, won, victory: won && player.hp > 0, started, activePose, position: [...camera.p], yaw: camera.yaw, pitch: camera.pitch, quality: qualities[quality].name, bones: Object.keys(hands.hands[0].joints).length, triangles: renderer.info.render.triangles, shots: shots.length, smoke: effects.smoke.length, light: effects.lights.reduce((n, l) => n + l.intensity, 0), loadout: [...loadout], equipped: [...rules.loadout], controlTime: player.controlTime, enemyControlTime: enemy.controlTime, waterArt: { projectiles: effects.waterArts.shots.size, walls: effects.waterArts.walls.size, shields: [...effects.waterArts.shields.values()].filter(g => g.visible).length, prisons: [...effects.waterArts.prisons.values()].filter(g => g.visible).length }, health: player.hp, shield: player.shield, shieldTime: player.shieldTime, reflect: player.reflect, enemyHealth: enemy.hp, enemyPosition: enemyPos(), gatePosition: world.gate.position.toArray(), enemyShield: enemy.shield, enemyChakra: aiRules.chakra, enemyPose, aiCasts, battleTime, moveDirection, moveTargetX, aimLocked: document.pointerLockElement === canvas, enemySequence: [...aiRules.sequence], salvos: salvos.length, walls: walls.map(w => ({ owner: w.owner, element: w.element, radius: w.radius || 0, hp: w.hp, life: w.life, position: [...w.p] })), fireArt: { projectiles: effects.arts.shots.size, walls: effects.arts.walls.size, shields: [...effects.arts.shields.values()].filter(g => g.visible).length, bursts: effects.arts.bursts.length, meteorImpacts: effects.arts.bursts.filter(b => b.meteor).map(b => ({ age: b.age, rocks: b.debris.filter(d => d.mesh.visible).map(d => d.mesh.position.toArray()), dust: b.dust.filter(d => d.mesh.visible).length })), clouds: [...effects.arts.shots.values()].filter(a => a.cloud?.g.visible).length }, projectiles: shots.map(s => ({ owner: s.owner, element: s.element, style: s.style, carried: s.carried ? s.carried.map(c => ({ ...c })) : [], hitTarget: !!s.hitTarget, phase: s.phase || 'flying', age: s.age, flightAge: s.flightAge || 0, fallAge: s.fallAge || 0, preludeAge: s.preludeAge || 0, color: s.color, reflected: s.reflected, position: [...s.p], velocity: [...s.v], size: s.size, rowIndex: s.rowIndex ?? null, holdTime: s.holdTime || 0, target: s.target ? [...s.target] : null })) });
  window.__AN_HOA__ = { state };
  if (testMode) window.__AN_HOA__.launchEnemy = (id, pos = enemyPos(), dir = vnorm(vsub(camera.p, pos))) => {
    if (!started || paused || won) return;
    const spell = spells.find(s => s.id === id); if (!spell) throw new Error('Unknown spell');
    launch(spell, 'enemy', pos, dir);
  };
  if (testMode) window.__AN_HOA__.advance = seconds => { for (let t = 0; t < seconds; t += 1 / 60) tick(Math.min(1 / 60, seconds - t)); render(); };
  renderLoadout(); renderGuide(); updateUI(); $('loading').classList.add('hidden'); document.body.dataset.ready = 'true'; tick(.016); render(); if (!testMode) requestAnimationFrame(frame);
}
main().catch(error => { console.error(error); document.getElementById('loading')?.classList.add('hidden'); const el = document.getElementById('errorScreen'); el.classList.remove('hidden'); el.textContent = 'Không khởi tạo được đồ họa 3D. Hãy mở bằng Chrome/Edge hỗ trợ WebGL 2 và bật tăng tốc đồ họa.'; });
