// Short camera reactions are layered over the normal and cinematic views.
// They never change the player's stored aiming direction.
const profiles = {
  flightBurst: { duration: .2, shake: .013, zoom: 3, kick: .025 },
  orb: { duration: .28, shake: .012, zoom: 5, kick: .045 },
  volley: { duration: .22, shake: .009, zoom: 3, kick: .025 },
  dragon: { duration: .4, shake: .025, zoom: 5, kick: .045 },
  dragonHit: { duration: .36, shake: .065, zoom: -3, kick: .025 },
  meteorHit: { duration: .85, shake: .11, zoom: 6, kick: .055 },
  thunderHit: { duration: .5, shake: .055, zoom: 4, kick: .03 },
  block: { duration: .24, shake: .025, zoom: 2, kick: .03 },
  reflect: { duration: .26, shake: .028, zoom: -3, kick: .025 },
  hit: { duration: .38, shake: .045, zoom: 3, kick: .035 },
  defense: { duration: .25, shake: .01, zoom: -2, kick: .01 }
};
export class CameraImpacts {
  constructor() { this.pulses = []; }
  trigger(type, power = 1, direction = [0, 0, 1]) {
    const profile = profiles[type];
    if (profile) this.pulses.push({ ...profile, type, age: 0, power, direction: [...direction] });
  }
  update(dt) {
    for (const p of this.pulses) p.age += dt;
    this.pulses = this.pulses.filter(p => p.age < p.duration);
  }
  sample(reducedMotion = false) {
    const out = { position: [0, 0, 0], rotation: [0, 0, 0], zoom: 0, strength: 0 };
    if (reducedMotion) return out;
    for (const p of this.pulses) {
      const t = p.age / p.duration, onset = Math.min(1, p.age / .035);
      const envelope = onset * (1 - t) * (1 - t) * p.power;
      const impulse = Math.sin(Math.PI * Math.min(1, p.age / .16)) * (1 - t) * p.power;
      const shake = p.shake * envelope;
      out.strength += shake;
      out.zoom += p.zoom * Math.sin(Math.PI * t) * (1 - t) * p.power;
      for (let i = 0; i < 3; i++) {
        out.position[i] += Math.sin(p.age * (93 + i * 17) + i * 2.1) * shake + p.direction[i] * p.kick * impulse;
        out.rotation[i] += Math.sin(p.age * (71 + i * 13) + i) * shake * .10;
      }
    }
    out.zoom = Math.max(-8, Math.min(8, out.zoom));
    out.position = out.position.map(v => Math.max(-.13, Math.min(.13, v)));
    out.rotation = out.rotation.map(v => Math.max(-.015, Math.min(.015, v)));
    return out;
  }
  reset() { this.pulses.length = 0; }
}
