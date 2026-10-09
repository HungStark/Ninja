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
    fire: ['Hỏa cầu', 'Hỏa long', 'Phượng hỏa', 'Hỏa bích', 'Hỏa kính'],
    water: ['Thủy đạn', 'Thủy long', 'Thủy liên kích', 'Thủy bích', 'Thủy kính'],
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
  const spells = elements.flatMap(el => variants.map((v, i) => ({
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
    constructor(maxHp = 220) { this.maxHp = maxHp; this.hp = maxHp; this.shield = 0; this.shieldTime = 0; this.reflect = 0; this.color = '#ffffff'; }
    tick(dt) { this.shieldTime = Math.max(0, this.shieldTime - dt); if (!this.shieldTime) { this.shield = 0; this.reflect = 0; } }
    defend(spell) { this.shield = spell.shield; this.shieldTime = spell.duration; this.reflect = spell.style === 'reflect' ? 1 : 0; this.color = spell.color; this.hp = Math.min(this.maxHp, this.hp + spell.heal); }
    receive(damage, reflected = false) {
      if (this.hp <= 0) return { damage: 0, reflected: false };
      if (this.reflect && !reflected) { this.reflect--; return { damage: 0, reflected: true }; }
      const absorbed = Math.min(this.shield, damage); this.shield -= absorbed;
      const actual = Math.min(this.hp, Math.max(0, damage - absorbed)); this.hp -= actual;
      return { damage: actual, absorbed, reflected: false };
    }
  }
  root.SealGameCore = { keys, elements, spells, defaultLoadout, validateLoadout, GameRules, Fighter };
})(globalThis);
