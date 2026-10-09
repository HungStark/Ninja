import * as T from 'three';
import { toon } from './materials.js';
import { createHands } from './hands.js';

// The opponent uses the same articulated hands and twelve poses as the player.
export async function createOpponent(scene, spawnPosition) {
  const group = new T.Group();
  group.position.copy(spawnPosition);
  scene.add(group);
  const cloth = toon('#33495f'), dark = toon('#182b3d'), skin = toon('#e7bb97'), metal = toon('#b6c9ca'), belt = toon('#b67863');
  function mesh(geo, mat, pos, scale = [1, 1, 1]) {
    const m = new T.Mesh(geo, mat); m.position.set(...pos); m.scale.set(...scale); m.castShadow = true; m.receiveShadow = true; group.add(m); return m;
  }
  const sphere = new T.SphereGeometry(1, 18, 14), box = new T.BoxGeometry(1, 1, 1);
  mesh(sphere, cloth, [0, 1.72, 0], [.48, .66, .27]);
  mesh(box, dark, [0, 1.12, 0], [.65, .22, .36]);
  mesh(box, belt, [0, 1.32, .02], [.81, .12, .48]);
  mesh(sphere, skin, [0, 2.58, 0], [.29, .34, .27]);
  mesh(sphere, dark, [0, 2.38, .14], [.3, .16, .18]);
  mesh(sphere, dark, [0, 2.78, -.02], [.31, .23, .28]);
  mesh(box, metal, [0, 2.7, .263], [.48, .105, .03]);
  mesh(box, belt, [0, 2.7, .286], [.08, .064, .009]);
  for (const side of [-1, 1]) {
    mesh(box, dark, [side * .125, 2.58, .27], [.1, .026, .02]);
    mesh(sphere, cloth, [side * .23, .68, 0], [.2, .57, .22]);
    mesh(box, metal, [side * .23, .36, .12], [.28, .25, .12]);
    mesh(sphere, dark, [side * .23, .13, .1], [.22, .13, .35]);
  }
  const rig = await createHands();
  rig.scene.remove(rig.root); group.add(rig.root);
  rig.root.position.set(0, 2, .02); rig.root.rotation.y = Math.PI; rig.root.scale.setScalar(.9);
  // Sleeve segments follow the animated wrists rather than floating next to the body.
  const arms = [-1, 1].map(side => ({ side, upper: mesh(new T.CylinderGeometry(.14, .16, 1, 12), cloth, [0, 0, 0]), lower: mesh(new T.CylinderGeometry(.105, .13, 1, 12), dark, [0, 0, 0]) }));
  const aura = new T.Mesh(new T.TorusGeometry(.47, .024, 8, 64), new T.MeshBasicMaterial({ color: '#ffc783', transparent: true, opacity: .7, blending: T.AdditiveBlending, depthWrite: false }));
  aura.position.set(0, 1.85, .8); group.add(aura);
  const shield = new T.Mesh(new T.SphereGeometry(1, 20, 14), new T.MeshBasicMaterial({ color: '#a6edff', transparent: true, opacity: .17, wireframe: true, depthWrite: false }));
  shield.position.set(0, 1.55, 0); shield.scale.set(1.03, 1.55, .85); group.add(shield);
  const up = new T.Vector3(0, 1, 0);
  function segment(m, a, b) { const delta = b.clone().sub(a); m.position.copy(a).add(b).multiplyScalar(.5); m.scale.y = delta.length(); m.quaternion.setFromUnitVectors(up, delta.normalize()); }
  function update(dt, time, pose, ready, fighter, hit = 0, casting = false) {
    rig.update(dt, time, pose, ready, false, casting ? .8 : 0, false);
    group.rotation.z = fighter.hp <= 0 ? T.MathUtils.damp(group.rotation.z, -1.4, 4, dt) : Math.sin(hit * 45) * hit * .15;
    group.updateMatrixWorld(true);
    for (let i = 0; i < arms.length; i++) {
      const a = arms[i], wrist = group.worldToLocal(rig.hands[i].wrapper.getWorldPosition(new T.Vector3()));
      const shoulder = new T.Vector3(-a.side * .45, 2.1, 0), elbow = new T.Vector3(-a.side * .52, 1.65, .36);
      segment(a.upper, shoulder, elbow); segment(a.lower, elbow, wrist);
    }
    aura.visible = pose >= 0 && fighter.hp > 0; aura.rotation.z = time * 2;
    shield.visible = fighter.shieldTime > 0 && (fighter.shield > 0 || fighter.reflect > 0); shield.material.color.set(fighter.color); shield.rotation.y = time * .4;
  }
  return { group, rig, update, shield, aura };
}
