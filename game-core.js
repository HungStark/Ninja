/* Shared, deterministic seal, loadout and combat rules. */
(function (root) {
  const keys = ['q', 'w', 'e', 'r', 'a', 's', 'd', 'f', 'z', 'x', 'c', 'v'];
  const elements = [
    { id: 'fire', name: 'Hỏa', glyph: '火', color: '#ff844b', prefix: 'qw', speed: 20, power: 1.12 },
    { id: 'water', name: 'Thủy', glyph: '水', color: '#50baff', prefix: 'we', speed: 18, power: 1 },
    { id: 'lightning', name: 'Lôi', glyph: '雷', color: '#c6a2ff', prefix: 'er', speed: 29, power: .92 },
    { id: 'wind', name: 'Phong', glyph: '風', color: '#9fe9ce', prefix: 'ra', speed: 25, power: .95 },
    { id: 'earth', name: 'Thổ', glyph: '土', color: '#d9ae69', prefix: 'as', speed: 15, power: 1.2 },
    { id: 'light', name: 'Quang', glyph: '光', color: '#ffe6a0', prefix: 'sd', speed: 27, power: .94 },
    { id: 'dark', name: 'Ám', glyph: '闇', color: '#e284d3', prefix: 'df', speed: 20, power: 1.08 },
    { id: 'wood', name: 'Mộc', glyph: '木', color: '#9ed26c', prefix: 'fz', speed: 17, power: 1.02 },
    { id: 'ice', name: 'Băng', glyph: '氷', color: '#a6edff', prefix: 'zx', speed: 21, power: 1.04 }
  ];
  const titles = {
    lightning: ['Lôi cầu', 'Lôi thương', 'Lôi liên kích', 'Lôi giáp', 'Lôi phản'],
    wind: ['Phong đạn', 'Phong nhận', 'Phong liên kích', 'Phong bích', 'Phong hồi'],
    earth: ['Thổ đạn', 'Thổ thương', 'Thổ liên kích', 'Thổ thành', 'Thổ phản'],
    light: ['Quang cầu', 'Quang thương', 'Quang liên kích', 'Quang thuẫn', 'Quang kính'],
    dark: ['Ám cầu', 'Ám thương', 'Ám liên kích', 'Ám bích', 'Ám phản'],
    wood: ['Mộc đạn', 'Mộc thương', 'Mộc liên kích', 'Mộc thành', 'Mộc phản'],
    ice: ['Băng cầu', 'Băng thương', 'Băng liên kích', 'Băng bích', 'Băng kính']
  };
  const variants = [
    { kind: 'attack', style: 'orb', rank: 'D', suffix: '', cost: 28, damage: 38, size: .4, count: 1, subtitle: 'Đạn cơ bản • một mục tiêu' },
    { kind: 'attack', style: 'lance', rank: 'B', suffix: 'df', cost: 34, damage: 46, size: .22, count: 1, subtitle: 'Mũi xuyên nhanh • sát thương cao' },
    { kind: 'attack', style: 'volley', rank: 'S', suffix: 'cvzx', cost: 56, damage: 58, size: .25, count: 3, subtitle: 'Ba đạn mạnh xòe ngang • vùng sát thương lớn' },
    { kind: 'defense', style: 'barrier', rank: 'C', suffix: 'a', cost: 26, damage: 0, shield: 65, duration: 4.5, subtitle: 'Khiên hấp thụ • 4,5 giây' },
    { kind: 'defense', style: 'reflect', rank: 'A', suffix: 'zxc', cost: 32, damage: 0, shield: 25, duration: 2.8, subtitle: 'Phản lại một đạn • 2,8 giây' }
  ];
  // Keep the saved fire IDs while replacing their formulas and behavior.
  const fireSpells = [
    { id: 'fire-orb', name: 'Hỏa cầu', kind: 'attack', style: 'orb', rank: 'D', sequence: [...'qw'], cost: 28, damage: 43, size: .48, count: 1, speed: 20, subtitle: 'Cầu lửa xoáy • lõi nóng và đuôi tàn lửa' },
    { id: 'fire-volley', name: 'Hỏa liên đạn', kind: 'attack', style: 'volley', rank: 'B', sequence: [...'qwdf'], cost: 40, damage: 24, size: .075, count: 3, speed: 27, holdTime: .5, salvoInterval: .1, subtitle: 'Ba hỏa cầu nhỏ xếp ngang • giữ 0,5 giây rồi phóng lần lượt cách nhau 0,1 giây' },
    { id: 'fire-lance', name: 'Rồng lửa', kind: 'attack', style: 'dragon', rank: 'S', sequence: [...'qwcvzx'], cost: 56, damage: 104, size: .72, count: 1, speed: 23, subtitle: 'Rồng lửa khổng lồ • thân uốn lượn, sừng và nanh' },
    { id: 'fire-meteor', name: 'Thiên thạch', kind: 'attack', style: 'meteor', rank: 'SS', sequence: [...'qwcvzxer'], cost: 82, damage: 150, size: 1.5, count: 1, speed: 0, blastRadius: 5.5, fallTime: 1.6, subtitle: 'Thiên thạch từ trời • nổ lan bán kính 5,5 m' },
    { id: 'fire-barrier', name: 'Khiên lửa', kind: 'defense', style: 'barrier', rank: 'C', sequence: [...'qwa'], cost: 26, damage: 0, shield: 75, duration: 4.5, count: 0, subtitle: 'Vòm lửa bao quanh người • hấp thụ 75 sát thương' },
    { id: 'fire-reflect', name: 'Tường lửa', kind: 'defense', style: 'firewall', rank: 'A', sequence: [...'qwzxc'], cost: 36, damage: 0, shield: 120, duration: 5, count: 0, wallWidth: 7, wallHeight: 4.2, subtitle: 'Tường lửa phía trước • chặn đạn, tồn tại 5 giây' }
  ].map(s => ({ ...s, element: 'fire', glyph: '火', color: '#ff844b', heal: 0, shield: s.shield || 0 }));
  // Preserve saved water IDs; the former lance/volley/reflect now have water-specific behavior.
  const waterSpells = [
    { id: 'water-orb', name: 'Thủy đạn', kind: 'attack', style: 'orb', rank: 'D', sequence: [...'we'], cost: 28, damage: 38, size: .48, count: 1, speed: 18, subtitle: 'Ném một quả cầu nước vào mục tiêu' },
    { id: 'water-lance', name: 'Thủy ngục', kind: 'attack', style: 'prison', rank: 'A', sequence: [...'wezxc'], cost: 38, damage: 12, size: .55, count: 1, speed: 21, controlDuration: 3, subtitle: 'Giam đối thủ trong quả cầu nước • khóa di chuyển và thi triển 3 giây' },
    { id: 'water-volley', name: 'Ném thuyền', kind: 'attack', style: 'boat', rank: 'S', sequence: [...'wecvzx'], cost: 56, damage: 90, size: 1.7, count: 1, speed: 24, blastRadius: 3.5, subtitle: 'Triệu hồi thuyền hải tặc • ném thẳng tới điểm ngắm' },
    { id: 'water-tsunami', name: 'Sóng thần', kind: 'attack', style: 'tsunami', rank: 'SS', sequence: [...'wecvzxer'], cost: 72, damage: 30, size: 1, count: 1, speed: 12, waveWidth: 12, waveHeight: 5, subtitle: 'Sóng lớn cuốn chiêu thức trên đường đi • sát thương vừa phải' },
    { id: 'water-barrier', name: 'Khiên nước', kind: 'defense', style: 'barrier', rank: 'C', sequence: [...'wea'], cost: 26, damage: 0, shield: 65, duration: 4.5, count: 0, subtitle: 'Khiên nước bao quanh bản thân • hấp thụ 65 sát thương' },
    { id: 'water-reflect', name: 'Thủy thuẫn', kind: 'defense', style: 'waterwall', rank: 'B', sequence: [...'wedf'], cost: 32, damage: 0, shield: 95, duration: 5, count: 0, wallRadius: 2.2, subtitle: 'Khiên nước tròn trước mặt • chặn chiêu bay qua mặt chắn' }
  ].map(s => ({ ...s, element: 'water', glyph: '水', color: '#50baff', heal: 0, shield: s.shield || 0 }));
  const spells = elements.flatMap(el => el.id === 'fire' ? fireSpells : el.id === 'water' ? waterSpells : variants.map((v, i) => ({
    ...v, id: el.id + '-' + v.style, name: titles[el.id][i], element: el.id,
    glyph: el.glyph, color: el.color, speed: el.speed * (v.style === 'lance' ? 1.3 : 1),
    damage: Math.round(v.damage * el.power), sequence: [...el.prefix, ...v.suffix],
    shield: v.shield ? Math.round(v.shield * (el.id === 'earth' ? 1.2 : 1)) : 0,
    heal: v.kind === 'defense' && ['wood', 'light'].includes(el.id) ? 12 : 0
  })));
  const defaultLoadout = ['fire-orb', 'water-lance', 'lightning-volley', 'earth-barrier', 'ice-reflect'];
  function validateLoadout(ids) {
    if (!Array.isArray(ids) || ids.length < 1 || ids.length > 5) return { ok: false, reason: 'Chọn từ 1 đến 5 chiêu.' };
    if (new Set(ids).size !== ids.length || ids.some(id => !spells.some(s => s.id === id))) return { ok: false, reason: 'Bộ chiêu không hợp lệ hoặc bị trùng.' };
    const attack = ids.filter(id => spells.find(s => s.id === id).kind === 'attack').length, defense = ids.length - attack;
    if (attack > 3 || defense > 3 || (ids.length === 5 && ![2, 3].includes(attack))) return { ok: false, attack, defense, reason: 'Tối đa 3 chiêu mỗi loại. Bộ 5 chiêu: 3 công–2 thủ hoặc 2 công–3 thủ.' };
    return { ok: true, attack, defense };
  }
  class GameRules {
    constructor(ids = defaultLoadout) {
      this.sequence = []; this.chakra = 100; this.time = 0; this.lastSeal = -Infinity; this.cooldown = 0; this.casts = 0;
      const result = this.setLoadout(ids);
      if (!result.ok) throw new RangeError(result.reason);
    }
    setLoadout(ids) {
      const result = validateLoadout(ids);
      if (!result.ok) return result;
      this.loadout = [...ids]; this.spells = ids.map(id => spells.find(s => s.id === id)); this.clear(); return result;
    }
    tick(dt) {
      this.time += dt; this.chakra = Math.min(100, this.chakra + dt * 11); this.cooldown = Math.max(0, this.cooldown - dt);
      if (this.sequence.length && this.time - this.lastSeal > 7) { this.clear(); return 'expired'; }
    }
    ready() { return this.spells.find(s => s.sequence.join('') === this.sequence.join('')); }
    seal(key) {
      if (!keys.includes(key)) return null;
      this.lastSeal = this.time; this.sequence.push(key);
      const valid = this.spells.some(s => s.sequence.slice(0, this.sequence.length).join('') === this.sequence.join(''));
      if (!valid) this.sequence = this.spells.some(s => s.sequence[0] === key) ? [key] : [];
      return { valid, ready: this.ready() };
    }
    clear() { this.sequence = []; }
    cast() {
      const spell = this.ready();
      if (!spell) return { ok: false, reason: 'sequence' };
      if (this.cooldown > 0) return { ok: false, reason: 'cooldown' };
      if (this.chakra < spell.cost) return { ok: false, reason: 'chakra' };
      this.chakra -= spell.cost; this.cooldown = 1; this.casts++; this.clear(); return { ok: true, spell };
    }
  }
  class Fighter {
    constructor(maxHp = 220) { this.maxHp = maxHp; this.hp = maxHp; this.shield = 0; this.shieldTime = 0; this.reflect = 0; this.controlTime = 0; this.color = '#ffffff'; this.defenseElement = ''; }
    tick(dt) { this.controlTime = Math.max(0, this.controlTime - dt); this.shieldTime = Math.max(0, this.shieldTime - dt); if (!this.shieldTime) { this.shield = 0; this.reflect = 0; } }
    defend(spell) { this.shield = spell.shield; this.shieldTime = spell.duration; this.reflect = spell.style === 'reflect' ? 1 : 0; this.color = spell.color; this.defenseElement = spell.element; this.hp = Math.min(this.maxHp, this.hp + spell.heal); }
    receive(damage, reflected = false) {
      if (this.hp <= 0) return { damage: 0, reflected: false };
      if (this.reflect && !reflected) { this.reflect--; return { damage: 0, reflected: true }; }
      const absorbed = Math.min(this.shield, damage); this.shield -= absorbed;
      const actual = Math.min(this.hp, Math.max(0, damage - absorbed)); this.hp -= actual;
      return { damage: actual, absorbed, reflected: false };
    }
  }
  // Swept plane intersection prevents fast projectiles from passing through a wall.
  function intersectFireWall(start, end, wall) {
    const side = p => (p[0] - wall.p[0]) * wall.normal[0] + (p[2] - wall.p[2]) * wall.normal[2];
    const startSide = side(start), endSide = side(end);
    const a = Math.abs(startSide) < 1e-8 ? 0 : startSide, b = Math.abs(endSide) < 1e-8 ? 0 : endSide;
    if (a * b > 0 || Math.abs(a - b) < 1e-8) return null;
    const t = a / (a - b), point = start.map((v, i) => v + (end[i] - v) * t);
    const across = (point[0] - wall.p[0]) * -wall.normal[2] + (point[2] - wall.p[2]) * wall.normal[0];
    if (wall.radius) return Math.hypot(across, point[1] - wall.p[1]) <= wall.radius ? point : null;
    return Math.abs(across) <= wall.width / 2 && point[1] >= 0 && point[1] <= wall.height ? point : null;
  }
  // Sweep in the wave's frame to catch crossing projectiles, regardless of their speed or owner.
  function intersectsWave(start, end, waveStart, waveEnd, normal, width, height, padding = 0, depth = 2.4) {
    const local = (p, w) => [(p[0] - w[0]) * -normal[2] + (p[2] - w[2]) * normal[0], p[1], (p[0] - w[0]) * normal[0] + (p[2] - w[2]) * normal[2]];
    const a = local(start, waveStart), b = local(end, waveEnd);
    const low = [-width / 2 - padding, -padding, -depth / 2 - padding], high = [width / 2 + padding, height + padding, depth / 2 + padding];
    let enter = 0, leave = 1;
    for (let i = 0; i < 3; i++) {
      const d = b[i] - a[i];
      if (Math.abs(d) < 1e-8) { if (a[i] < low[i] || a[i] > high[i]) return false; continue; }
      const t1 = (low[i] - a[i]) / d, t2 = (high[i] - a[i]) / d;
      enter = Math.max(enter, Math.min(t1, t2)); leave = Math.min(leave, Math.max(t1, t2));
      if (enter > leave) return false;
    }
    return true;
  }
  function meteorTarget(pos, dir) {
    const distance = dir[1] < -.025 ? Math.min(55, Math.max(6, -pos[1] / dir[1])) : 31;
    return [pos[0] + dir[0] * distance, .08, pos[2] + dir[2] * distance];
  }
  root.SealGameCore = { keys, elements, spells, defaultLoadout, validateLoadout, GameRules, Fighter, intersectFireWall, intersectsWave, meteorTarget };
})(globalThis);
