# Reference-inspired hero

The game loads `assets/hero-ninja-reference.glb`. This is a standalone GLB with
embedded textures, a skinned outfit and the existing 113-joint humanoid rig.
`hero-ninja.glb` and `hero-ninja-simple.glb` remain available as source assets.

The model uses a high ponytail, fitted face wrap, wider shoulders, crossed
harness, layered pauldrons, and a maple-print cape with a torn hem. The white
fox charm is fixed to the belt. The equipped pouch remains controlled by the
inventory. The original red eyes and eyelid morphs are preserved.

Regenerate the model and the editable studio scene with Blender:

```
blender --background --python tools/build-hero-reference.py
blender --background --factory-startup --python tools/preview-maple-blender.py
node tools/preview-hero-reference.cjs maple
node tools/build-portraits.mjs --hero
node tools/build-vercel.mjs
node tools/build-android.mjs
```

The generator writes the model size and geometry cost to
`assets/hero-reference-report.json`. Maple fabric has a 256 × 512 color and
emissive print, with 128 × 128 woven normals and packed occlusion, roughness,
and metallic channels. The studio scene `assets/hero-maple.blend` packs its
textures and includes front, rear, and portrait cameras.

`src/hero.js` hides the traveler harness, hip panels, pauldrons, bracers,
and greaves when village armor occupies those areas. The cape, scarf and fox
charm remain visible across equipment sets. The same model appears in
exploration, combat, equipment preview, and baked dialogue portraits.

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

The preview script captures front, side, back, portrait, sprint, jump, seal, and
equipped armor views under `test-results/hero-reference/`.
