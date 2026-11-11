# Reference-inspired hero

The game loads `assets/hero-ninja-reference.glb`. This is a standalone GLB with
embedded textures, a skinned outfit and the existing 113-joint humanoid rig.
`hero-ninja.glb` and `hero-ninja-simple.glb` remain available as source assets.

The new model adds layered black hair, a cloth mask, a high collar with two
closures, a short asymmetric mantle with crimson piping and a shoulder mark,
crossed chest straps, a waist belt, split hip panels, fingerless glove guards,
and laced boots with shaped soles. Native red eyes and the blink morph survive.
The equipped shuriken pouch remains controlled by the inventory.

Regenerate with Blender 4.5:

```
blender --background --python tools/build-hero-reference.py
node tools/preview-hero-reference.cjs after
node tools/build-portraits.mjs --hero
node tools/build-vercel.mjs
node tools/build-android.mjs
```

The generator reads the optimized source, writes the derived GLB, and records
its size and geometry cost in `assets/hero-reference-report.json`. It batches
small details by material and joint family. Eyelid topology, skin joint order,
and inverse bind matrices are preserved. The red ankle cuffs reuse source cuff
weights to follow the trousers during movement.

`src/hero.js` loads the new asset and hides the traveler mantle, chest harness
and hip panels while another armor is equipped. This leaves space for the
existing armor geometry. The integrated GLB mask replaces the old runtime mask.
The same model appears in exploration, combat, equipment preview and baked
dialogue portraits. Web and Android build lists include the new runtime asset.

Hero portraits use only the fixed black outfit and hair colors, with one preset
per armor. Portrait keys ignore old saved color selections. The portrait builder
and web/Android packagers remove generated WebP files outside the active catalog.

Validation:

```
node tests/hero-reference-core.mjs
node tests/hero-equipment-motion-browser.cjs
node tests/character-loading-browser.cjs
node tests/hero-combat-motion-browser.cjs
node tests/model-portraits-core.mjs
```

Preview captures are written to `test-results/hero-reference/after/`, including
front, side, back, close portrait, sprint, jump, seal and equipped armor views.
The design follows the supplied reference; it does not reproduce the original
illustration's high-detail sculpt or add its full set of facial expressions.
