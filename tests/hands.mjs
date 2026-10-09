import assert from "node:assert/strict";
import { createHands } from "../src/hands.js";

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
