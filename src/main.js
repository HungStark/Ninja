import * as T from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { createWorld } from "./scene.js";
import { createHands } from "./hands.js";
import { FireEffects } from "./effects.js";
import { sealNames as names, poses } from "./poses.js";
async function main() {
  const $ = (id) => document.getElementById(id), { keys, spells, GameRules } = globalThis.SealGameCore, rules = new GameRules();
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
  const scene = world.scene, targets = world.targets;
  for (const target of targets) target.pos = target.pos.toArray();
  const camera3d = new T.PerspectiveCamera(68, innerWidth / innerHeight, 0.05, 220), handCamera = new T.PerspectiveCamera(68, innerWidth / innerHeight, 0.02, 10);
  camera3d.rotation.order = "YXZ";
  const effects = new FireEffects(scene), shots = [], particles = [];
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
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), mix = (a, b, t) => a + (b - a) * t, vadd = (a, b) => a.map((x, i) => x + b[i]), vsub = (a, b) => a.map((x, i) => x - b[i]), vmul = (a, t) => a.map((x) => x * t), vlen = (a) => Math.hypot(...a), vnorm = (a) => vmul(a, 1 / (vlen(a) || 1)), dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  let randomSeed = 8491;
  function rand() {
    randomSeed = Math.imul(randomSeed, 1664525) + 1013904223 >>> 0;
    return randomSeed / 4294967296;
  }
  const range = (a, b) => a + (b - a) * rand();
  let activePose = -1, poseAge = 99, animationTime = 0, started = false, paused = false, won = false, round = 1, selected = 0, score = 0;
  let camera = { p: [0, 1.72, 7], yaw: 0, pitch: 0 }, pressed = /* @__PURE__ */ new Set(), drag = false, lastMouse = [0, 0], lastTime = 0, breathTime = 0, breathTick = 0, recoil = 0, hitTimer = 0, flashTimer = 0, messageTime = 0, muted = false, audio = null;
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
      c.projectionMatrix.elements[9] = -0.14;
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
  $("spellList").innerHTML = spells.map((s, i) => '<button class="spell ' + (i === 0 ? "selected" : "") + '" data-spell="' + i + '"><span class="spell-icon">' + ["\u706B", "\u708E", "\u7131"][i] + '</span><div><div class="spell-title">' + s.name + "<small>" + s.cost + " CHAKRA</small></div><p>" + s.subtitle + '</p><div class="spell-sequence">' + s.sequence.map((k) => '<kbd data-seq="' + k + '">' + k.toUpperCase() + "</kbd>").join("") + "</div></div></button>").join("");
  function selectSpell(i) {
    selected = i;
    document.querySelectorAll(".spell").forEach((el, j) => el.classList.toggle("selected", i === j));
    updateUI();
  }
  function announce(text, error = false) {
    $("message").textContent = text;
    $("message").style.color = error ? "#ffc28b" : "#c7d5bb";
    messageTime = 3.2;
  }
  function updateUI() {
    const seq = rules.sequence;
    const matching = spells.findIndex((s) => seq.length && s.sequence.slice(0, seq.length).join("") === seq.join(""));
    if (matching >= 0 && selected !== matching) {
      selected = matching;
      document.querySelectorAll(".spell").forEach((el, j) => el.classList.toggle("selected", j === selected));
    }
    const spell = spells[selected];
    $("comboSlots").innerHTML = spell.sequence.map((k, i) => '<span class="combo-slot ' + (seq[i] === k ? "done" : seq.length === i ? "next" : "") + '">' + k.toUpperCase() + "</span>").join("");
    $("comboLabel").textContent = rules.ready() ? "\u1EA4N HO\xC0N CH\u1EC8NH \u2022 " + rules.ready().name.toUpperCase() : spell.name.toUpperCase() + " \uFF0F " + seq.length + " / 4 \u1EA4N";
    $("castButton").disabled = !started || paused || won || !rules.ready() || rules.cooldown > 0 || rules.chakra < spell.cost;
    document.querySelectorAll(".seal").forEach((el) => {
      el.classList.toggle("active", el.dataset.key === keys[activePose]);
      el.classList.toggle("pending", seq.includes(el.dataset.key));
    });
    document.querySelectorAll(".spell").forEach((el, i) => el.querySelectorAll("kbd").forEach((k, j) => k.classList.toggle("done", i === selected && seq[j] === k.dataset.seq)));
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
    if (!started || paused || won) return;
    const result = rules.seal(key);
    hands.seal();
    activePose = keys.indexOf(key);
    poseAge = 0;
    $("currentSeal").textContent = key.toUpperCase() + " \uFF0F \u1EA4n " + String(activePose + 1).padStart(2, "0") + " \xB7 " + names[activePose];
    tone(290 + activePose * 28, 0.09, "triangle");
    if (!result.valid) announce("Sai chu\u1ED7i \u2014 b\u1EAFt \u0111\u1EA7u l\u1EA1i b\u1EB1ng " + spells[selected].sequence[0].toUpperCase(), true);
    else if (result.ready) {
      announce("Chakra \u0111\xE3 t\u1EE5. Ng\u1EAFm bia v\xE0 nh\u1EA5n SPACE.");
      tone(670, 0.23, "sine", 0.045);
    } else announce("\u1EA4n " + rules.sequence.length + " / 4 \u2014 ti\u1EBFp t\u1EE5c k\u1EBFt \u1EA5n");
    updateUI();
  }
  function aim() {
    const cp = Math.cos(camera.pitch);
    return [-Math.sin(camera.yaw) * cp, Math.sin(camera.pitch), -Math.cos(camera.yaw) * cp];
  }
  function fireShot(pos, dir, speed, size, damage, type) {
    shots.push({ p: [...pos], old: [...pos], v: vmul(dir, speed), size, damage, type, life: type === "breath" ? 0.8 : 3, trail: 0 });
  }
  function cast() {
    if (!started || paused || won) return;
    const result = rules.cast();
    if (!result.ok) {
      announce({ sequence: "Ch\u01B0a \u0111\u1EE7 \u1EA5n \u2014 k\u1EBFt \u0111\xFAng chu\u1ED7i tr\u01B0\u1EDBc khi thi tri\u1EC3n.", cooldown: "Ch\u1EDD m\u1ED9t nh\u1ECBp \u0111\u1EC3 thi tri\u1EC3n ti\u1EBFp.", chakra: "Chakra ch\u01B0a \u0111\u1EE7 \u2014 ch\u1EDD h\u1ED3i ph\u1EE5c." }[result.reason], true);
      tone(130, 0.1, "sine");
      return;
    }
    const d = aim(), p = vadd(camera.p, vmul(d, 0.8));
    activePose = -1;
    poseAge = 0;
    recoil = 0.22;
    flashTimer = 0.12;
    hands.cast();
    fireSound();
    announce(result.spell.name + "!");
    if (result.spell.id === "ball") fireShot(p, d, 22, 0.42, result.spell.damage, "ball");
    else if (result.spell.id === "phoenix") {
      const right = [Math.cos(camera.yaw), 0, -Math.sin(camera.yaw)];
      for (let i = -2; i <= 2; i++) fireShot(p, vnorm(vadd(d, vmul(right, i * 0.07))), 25, 0.21, 35, "phoenix");
    } else {
      breathTime = 1.5;
      breathTick = 0;
    }
    updateUI();
  }
  function hit(target, damage, pos) {
    if (target.dead) return;
    target.hp = Math.max(0, target.hp - damage);
    target.hit = 0.2;
    hitTimer = 0.14;
    burst(pos, 12, 0.75);
    tone(110, 0.07, "triangle", 0.04);
    if (target.hp === 0) {
      target.dead = true;
      score++;
      burst(target.pos, 34, 1.8);
      $("score").textContent = String(score).padStart(2, "0");
      announce("Bia " + (target.index + 1) + " \u0111\xE3 h\u1EA1!");
      if (score === 5) {
        won = true;
        pressed.clear();
        releasePointer();
        $("winStats").textContent = "B\u1EA1n \u0111\xE3 h\u1EA1 5 bia v\u1EDBi " + rules.casts + " l\u1EA7n thi tri\u1EC3n. Ti\u1EBFp t\u1EE5c \u0111\u1EC3 luy\u1EC7n ng\u1EAFm v\xE0 k\u1EBFt \u1EA5n.";
        setTimeout(() => {
          if (won) $("winScreen").classList.remove("hidden");
        }, 650);
      }
    }
  }
  function particle(p, v, size = 0.06, life = 0.7, color = 16753485) {
    if (particles.length > 420) return;
    particles.push({ p: [...p], v: [...v], size, life, max: life, color: rgb(color) });
  }
  function burst(pos, count, speed) {
    if (count >= 12) effects.explosion(pos, count > 20 ? 1.8 : 0.8);
    for (let i = 0; i < count; i++) particle(pos, [range(-speed, speed), range(0.2, speed * 1.2), range(-speed, speed)], range(0.025, 0.1), range(0.4, 0.95), i % 3 ? 16750915 : 16767878);
  }
  function updateShots(dt) {
    for (let i = shots.length - 1; i >= 0; i--) {
      const shot = shots[i];
      shot.old = [...shot.p];
      shot.p = vadd(shot.p, vmul(shot.v, dt));
      shot.life -= dt;
      shot.trail += dt;
      while (shot.trail > 0.025) {
        shot.trail -= 0.025;
        particle(shot.p, vmul(shot.v, -0.06), shot.size * 0.4, 0.3, 16756056);
      }
      let collided = false;
      for (const target of targets) {
        if (target.dead) continue;
        const delta = vsub(shot.p, shot.old), toTarget = vsub(target.pos, shot.old), t = clamp(dot(toTarget, delta) / (dot(delta, delta) || 1), 0, 1), closest = vadd(shot.old, vmul(delta, t));
        if (vlen(vsub(closest, target.pos)) < 0.74 + shot.size) {
          hit(target, shot.damage, closest);
          collided = true;
          break;
        }
      }
      if (collided || shot.life < 0 || shot.p[1] < 0.08 || Math.abs(shot.p[0]) > 30 || shot.p[2] < -45) {
        if (!collided && shot.life > 0) burst(shot.p, 10, 0.9);
        shots.splice(i, 1);
      }
    }
  }
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      p.p = vadd(p.p, vmul(p.v, dt));
      p.v[1] += dt * 0.35;
      p.v = vmul(p.v, 1 - dt * 0.8);
    }
  }
  function forwardMove(dt) {
    const speed = (pressed.has("Shift") ? 6 : 3.7) * dt;
    let f = (pressed.has("ArrowUp") ? 1 : 0) - (pressed.has("ArrowDown") ? 1 : 0), r = (pressed.has("ArrowRight") ? 1 : 0) - (pressed.has("ArrowLeft") ? 1 : 0);
    if (!f && !r) return;
    const length = Math.hypot(f, r);
    f /= length;
    r /= length;
    let nx = camera.p[0] + (-Math.sin(camera.yaw) * f + Math.cos(camera.yaw) * r) * speed, nz = camera.p[2] + (-Math.cos(camera.yaw) * f - Math.sin(camera.yaw) * r) * speed;
    nx = clamp(nx, -14.5, 14.5);
    nz = clamp(nz, -22, 14);
    if (targets.some((t) => !t.dead && Math.hypot(nx - t.pos[0], nz - t.pos[2]) < 1)) return;
    camera.p[0] = nx;
    camera.p[2] = nz;
  }
  function findAimTarget() {
    const d = aim();
    let best = null, bestDist = Infinity;
    for (const t of targets) {
      if (t.dead) continue;
      const delta = vsub(t.pos, camera.p), dist = dot(delta, d);
      if (dist < 0) continue;
      const offset = vlen(vsub(delta, vmul(d, dist)));
      if (offset < 0.77 && dist < bestDist) {
        best = t;
        bestDist = dist;
      }
    }
    return best;
  }
  function tick(dt) {
    const running = started && !paused && !won;
    if (!paused) animationTime += dt;
    if (running) {
      const expired = rules.tick(dt);
      if (expired) announce("Chu\u1ED7i \u1EA5n h\u1EBFt h\u1EA1n \u2014 k\u1EBFt l\u1EA1i t\u1EEB \u0111\u1EA7u.", true);
      forwardMove(dt);
      poseAge += dt;
      if (poseAge > 2.8 && rules.sequence.length === 0) activePose = -1;
      if (breathTime > 0) {
        breathTime -= dt;
        breathTick += dt;
        while (breathTick > 0.045) {
          breathTick -= 0.045;
          const d = aim(), right = [Math.cos(camera.yaw), 0, -Math.sin(camera.yaw)], dir = vnorm(vadd(vadd(d, vmul(right, range(-0.09, 0.09))), [0, range(-0.065, 0.065), 0]));
          fireShot(vadd(camera.p, vmul(d, 0.65)), dir, 13, range(0.15, 0.3), 18, "breath");
        }
      }
      updateShots(dt);
      messageTime -= dt;
      if (messageTime <= 0) {
        $("message").textContent = rules.ready() ? rules.chakra < rules.ready().cost ? "Ch\u1EDD chakra h\u1ED3i ph\u1EE5c..." : "Ng\u1EAFm bia v\xE0 nh\u1EA5n SPACE \u0111\u1EC3 thi tri\u1EC3n" : "Ch\u1ECDn m\u1ED9t chu\u1ED7i h\u1ECFa thu\u1EADt b\xEAn ph\u1EA3i";
        $("message").style.color = "#c7c5b6";
      }
      updateUI();
    }
    if (!paused) {
      recoil = Math.max(0, recoil - dt * 0.7);
      flashTimer = Math.max(0, flashTimer - dt);
      hitTimer = Math.max(0, hitTimer - dt);
      updateParticles(dt);
      world.update(animationTime, dt);
      hands.update(dt, animationTime, activePose, !!rules.ready(), pressed.size > 0, Math.min(1, shots.length * 0.2 + recoil * 3), reducedMotion);
    }
    if (running && rand() < dt * 9) particle([range(-15, 15), range(0.5, 5), range(-25, 6)], [0.15, 0.15, 0.06], 0.018, 3.2, 16758364);
    $("chakraNumber").textContent = Math.floor(rules.chakra) + " / 100";
    $("chakraFill").style.width = rules.chakra + "%";
    $("castCount").textContent = rules.casts + " thu\u1EADt";
    $("flash").style.opacity = flashTimer * 0.32;
    $("hitMarker").style.opacity = hitTimer > 0 ? 1 : 0;
    const target = findAimTarget();
    $("reticle").classList.toggle("on-target", !!target);
    $("targetInfo").style.opacity = target && running ? 1 : 0;
    if (target) {
      $("targetName").textContent = "BIA " + String(target.index + 1).padStart(2, "0");
      $("targetHP").style.width = target.hp + "%";
    }
    const shake = reducedMotion || paused ? 0 : recoil * 0.015;
    camera3d.position.set(camera.p[0] + Math.sin(animationTime * 60) * shake, camera.p[1] + Math.cos(animationTime * 70) * shake, camera.p[2]);
    camera3d.rotation.set(camera.pitch, camera.yaw, 0, "YXZ");
    effects.update(paused ? 0 : dt, animationTime, shots, particles, camera3d, quality);
  }
  function render() {
    renderer.info.reset();
    renderer.clear();
    composer.render();
  }
  function frame(now) {
    const dt = Math.min((now - lastTime) / 1e3 || 0.016, 0.1);
    lastTime = now;
    tick(dt);
    render();
    requestAnimationFrame(frame);
  }
  function requestPointer() {
    try {
      const promise = canvas.requestPointerLock?.();
      promise?.catch?.(() => announce("K\xE9o chu\u1ED9t trong s\xE2n t\u1EADp \u0111\u1EC3 ng\u1EAFm."));
    } catch {
      announce("K\xE9o chu\u1ED9t trong s\xE2n t\u1EADp \u0111\u1EC3 ng\u1EAFm.");
    }
  }
  function releasePointer() {
    if (document.pointerLockElement) document.exitPointerLock?.();
  }
  function start() {
    started = true;
    paused = false;
    won = false;
    document.body.classList.add("playing");
    document.body.classList.remove("paused");
    $("startScreen").classList.add("hidden");
    $("pauseScreen").classList.add("hidden");
    initAudio();
    audio?.resume();
    announce("H\u1ECFa c\u1EA7u: Q \u2192 W \u2192 E \u2192 R, r\u1ED3i SPACE.");
    requestPointer();
    updateUI();
  }
  function pause() {
    if (!started || won) return;
    paused = true;
    pressed.clear();
    drag = false;
    releasePointer();
    document.body.classList.add("paused");
    $("pauseScreen").classList.remove("hidden");
    updateUI();
  }
  function resume() {
    paused = false;
    document.body.classList.remove("paused");
    $("pauseScreen").classList.add("hidden");
    requestPointer();
    updateUI();
  }
  function reset(next = false) {
    if (next) round++;
    Object.assign(rules, new GameRules());
    score = 0;
    shots.length = 0;
    particles.length = 0;
    pressed.clear();
    breathTime = 0;
    effects.reset();
    recoil = 0;
    flashTimer = 0;
    hitTimer = 0;
    camera = { p: [0, 1.72, 7], yaw: 0, pitch: 0 };
    targets.forEach((t) => {
      t.hp = 100;
      t.dead = false;
      t.hit = 0;
      t.group.rotation.set(0, 0, 0);
      t.group.position.y = 0;
    });
    $("score").textContent = "00";
    $("roundText").textContent = "\u0110\u1EE3t luy\u1EC7n t\u1EADp " + String(round).padStart(2, "0");
    $("winScreen").classList.add("hidden");
    activePose = -1;
    selected = 0;
    selectSpell(0);
    start();
  }
  function toggleSound() {
    muted = !muted;
    $("soundButton").textContent = muted ? "\u266B\u0338" : "\u266A";
    $("soundButton").setAttribute("aria-pressed", String(muted));
  }
  $("startButton").onclick = start;
  $("resumeButton").onclick = resume;
  $("resetButton").onclick = () => reset(false);
  $("nextButton").onclick = () => reset(true);
  $("castButton").onclick = cast;
  $("soundButton").onclick = toggleSound;
  $("helpButton").onclick = () => {
    $("guide").classList.toggle("hidden");
  };
  document.querySelectorAll(".seal").forEach((el) => el.onclick = () => seal(el.dataset.key));
  document.querySelectorAll(".spell").forEach((el) => el.onclick = () => selectSpell(Number(el.dataset.spell)));
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if ([" ", "backspace", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) e.preventDefault();
    if (e.repeat) {
      if (e.key.startsWith("Arrow")) pressed.add(e.key);
      return;
    }
    if (key === "enter") {
      if (won) reset(true);
      else if (!started) start();
      else if (paused) resume();
      return;
    }
    if (key === "escape") {
      if (started && !won && !paused) pause();
      return;
    }
    if (key === "h") {
      $("guide").classList.toggle("hidden");
      return;
    }
    if (key === "m") {
      toggleSound();
      return;
    }
    if (!started || paused || won) return;
    if (keys.includes(key)) seal(key);
    else if (key === " ") cast();
    else if (key === "backspace") {
      rules.clear();
      activePose = -1;
      announce("\u0110\xE3 x\xF3a chu\u1ED7i \u1EA5n.");
      updateUI();
    } else if (["1", "2", "3"].includes(key)) selectSpell(Number(key) - 1);
    pressed.add(e.key);
  });
  window.addEventListener("keyup", (e) => pressed.delete(e.key));
  window.addEventListener("blur", () => {
    if (started && !paused && !won) pause();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && started && !paused && !won) pause();
  });
  canvas.addEventListener("mousedown", (e) => {
    if (!started || paused || won) return;
    drag = true;
    lastMouse = [e.clientX, e.clientY];
    if (e.button === 0 && document.pointerLockElement !== canvas) requestPointer();
  });
  window.addEventListener("mouseup", () => drag = false);
  window.addEventListener("mousemove", (e) => {
    if (!started || paused || won) return;
    const locked = document.pointerLockElement === canvas;
    if (!locked && !drag) return;
    const dx = locked ? e.movementX : e.clientX - lastMouse[0], dy = locked ? e.movementY : e.clientY - lastMouse[1];
    lastMouse = [e.clientX, e.clientY];
    camera.yaw -= dx * 25e-4;
    camera.pitch = clamp(camera.pitch - dy * 25e-4, -0.95, 0.95);
  });
  canvas.addEventListener("touchstart", (e) => {
    if (!started || paused || won) return;
    drag = true;
    lastMouse = [e.touches[0].clientX, e.touches[0].clientY];
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => {
    if (!drag || paused || won) return;
    const touch = e.touches[0];
    camera.yaw -= (touch.clientX - lastMouse[0]) * 4e-3;
    camera.pitch = clamp(camera.pitch - (touch.clientY - lastMouse[1]) * 4e-3, -0.95, 0.95);
    lastMouse = [touch.clientX, touch.clientY];
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener("touchend", () => drag = false);
  let pointerWasLocked = false;
  document.addEventListener("pointerlockchange", () => {
    const locked = document.pointerLockElement === canvas;
    if (pointerWasLocked && !locked && started && !paused && !won) pause();
    pointerWasLocked = locked;
  });
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    pause();
    $("errorScreen").classList.remove("hidden");
    $("errorScreen").textContent = "K\u1EBFt n\u1ED1i \u0111\u1ED3 h\u1ECDa b\u1ECB gi\xE1n \u0111o\u1EA1n. T\u1EA3i l\u1EA1i trang \u0111\u1EC3 ti\u1EBFp t\u1EE5c.";
  });
  const state = () => ({ ready: true, time: animationTime, handPose: hands.hands[0].wrapper.quaternion.toArray(), fingerPose: hands.hands[0].joints.index_0.quaternion.toArray(), score, round, casts: rules.casts, chakra: rules.chakra, sequence: [...rules.sequence], paused, won, started, activePose, position: [...camera.p], yaw: camera.yaw, pitch: camera.pitch, quality: qualities[quality].name, bones: hands.hands[0].joints ? Object.keys(hands.hands[0].joints).length : 0, triangles: renderer.info.render.triangles, shots: shots.length, smoke: effects.smoke.length, light: effects.lights.reduce((n, l) => n + l.intensity, 0) });
  window.__AN_HOA__ = { state };
  if (new URLSearchParams(location.search).get("test") === "1") window.__AN_HOA__.advance = (seconds) => {
    for (let t = 0; t < seconds; t += 1 / 60) tick(Math.min(1 / 60, seconds - t));
    render();
  };
  updateUI();
  $("loading").classList.add("hidden");
  document.body.dataset.ready = "true";
  tick(0.016);
  render();
  requestAnimationFrame(frame);
}
main().catch((error) => {
  console.error(error);
  document.getElementById("loading")?.classList.add("hidden");
  const el = document.getElementById("errorScreen");
  el.classList.remove("hidden");
  el.textContent = "Kh\xF4ng kh\u1EDFi t\u1EA1o \u0111\u01B0\u1EE3c \u0111\u1ED3 h\u1ECDa 3D. H\xE3y m\u1EDF b\u1EB1ng Chrome/Edge h\u1ED7 tr\u1EE3 WebGL 2 v\xE0 b\u1EADt t\u0103ng t\u1ED1c \u0111\u1ED3 h\u1ECDa.";
});
