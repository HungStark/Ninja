import assert from "node:assert/strict";
import { createHands } from "../src/hands.js";
import { sealShadowCells, sealShadowFacing, shadowDuration } from '../src/hand-vfx.js';

const hands = await createHands();
const advance = (pose, frames) => {
  for (let i = 0; i < frames; i++) hands.update(1 / 60, 0, pose, false, false, 0, false);
};
advance(-1, 1);
advance(2, 40);
const start = Math.abs(hands.hands[0].wrapper.position.x);
advance(6, 6);
const apart = Math.abs(hands.hands[0].wrapper.position.x);
assert.ok(apart > start + 0.07 && apart < start + 0.12, "Hands must separate briefly over a compact distance");
advance(6, 10);
assert.ok(Math.abs(hands.hands[0].wrapper.position.x) < 0.04, "Hands must close into D");
advance(0, 6);
const before = hands.hands[0].wrapper.position.clone();
advance(1, 1);
assert.ok(before.distanceTo(hands.hands[0].wrapper.position) < 0.02, "Rapid changes must keep movement continuous");
console.log("PASS: initial idle, separation, closing into D, interrupted transition continuity.");

assert.deepEqual(sealShadowCells, [0, 1, 2, 4, 5, 6, 7, 9, 10, 11, 13, 8]);
for (let pose = 0; pose < 12; pose++) {
  hands.seal(pose);
  assert.equal(hands.shadow.state().cell, sealShadowCells[pose]);
  assert.equal(hands.shadow.mesh.visible, true, 'Show a shadow immediately for every key');
  assert.equal(Math.sign(hands.shadow.mesh.scale.x), sealShadowFacing[pose]);
  hands.update(.15, 0, pose, false, false, 0, false);
  assert.equal(hands.shadow.mesh.visible, true);
  assert.ok(hands.shadow.mesh.position.z > hands.hands[0].wrapper.position.z, 'Shadow sits in front of the hands');
  hands.update(shadowDuration - .15, 0, pose, false, false, 0, false);
  assert.equal(hands.shadow.mesh.visible, false, 'Hide at exactly .2 seconds');
}
hands.seal(0); hands.update(.15, 0, 0, false, false, 0, false); hands.seal(1);
assert.equal(hands.shadow.state().age, 0, 'Rapid seals restart the shadow duration');
hands.setReady('fire'); hands.update(.01, 1, 1, true, false, 0, false);
assert.equal(hands.handFire.mesh.visible, true);
hands.cast(); assert.equal(hands.handFire.mesh.visible, false); assert.equal(hands.shadow.mesh.visible, false);
hands.setReady('water'); hands.update(.01, 1, 1, true, false, 0, false);
assert.equal(hands.handFire.mesh.visible, false, 'Other elements do not get fire');
hands.setReady('fire'); hands.clearEffects(); assert.equal(hands.handFire.mesh.visible, false);
console.log('PASS: twelve shadow mappings, immediate display, .2-second lifetime, repeated seals, placement, fire readiness and clearing.');
