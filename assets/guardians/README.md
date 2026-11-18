# Ten reference guardians

Rebuilt in Blender from the five supplied character sheets:

- `nameless.glb` — Vô Danh Thú: ivory/silver fur, antlers, ancient scales, gold seals and spirit ribbons.
- `fire.glb` — Cửu Viêm Hồ: nine independently articulated flame tails, white mane, red coat, gold ornaments and glowing sigils.
- `water.glb` — Thủy Long: serpentine scaled body, antlers, whiskers, pearls, claws and detached translucent water ribbons. **No wings or wing bones.**
- `lightning.glb` — Lôi Thần Lang: layered storm mane, purple eyes/claws, armor, seals and electric arcs.
- `wind.glb` — Phong Ưng: two articulated feathered wings, layered ivory/jade feathers, tail plumes, gold beak and talons.

The second Blender workshop is `last-five-guardians.blend`. Timeline markers select each creature's review camera.

- `earth.glb` — Sơn Quy with a layered rock shell, amber crystals, trees and waterfalls.
- `wood.glb` — Thanh Lộc with branching antlers, leaf ornaments, leg vines and a living mantle of moss, flowers and mushrooms.
- `ice.glb` — Băng Hổ with a feline muzzle, frost stripes, ice claws, crystal armor and snowflake seals.
- `light.glb` — Kim Ưng with layered ivory and gold flight feathers, articulated wings and a solar halo.
- `dark.glb` — U Minh Lang with a swept violet mane, translucent spectral trails and turquoise eyes that flare purple during its combat tell.

`first-five-guardians.blend` is the editable Blender workshop containing all five armatures, meshes, vertex colors, materials and studio lights. Each GLB is exported alone at the origin, with an armature and skin weights. The water dragon has thirteen additional deformation bones along its body.

These are stylized game models adapted to the existing game's rendering and geometry budgets. The supplied painted sheets remain the design references.

## Source and runtime

Run `tools/build-reference-guardians.py` inside Blender to regenerate the assets. `reference-guardians.json` embeds indexed, quantized mesh data in the offline game bundle. The game reconstructs the same anatomical hierarchy and animates it through `src/reference-guardian-animation.js`. Dragon scales and water ribbons follow the body's turn history; only Phong Ưng has wing joints. Existing guardian skills, combat timings, damage and campaign rules retain their data.

Geometry ranges from 7,214 to 25,986 triangles per guardian. Exact draw counts, joint counts and GLB sizes are in `report.json` and `later-report.json`. To regenerate the second workshop, run the builder with `SECOND_SET=True` in its execution globals. The game uses both `reference-guardians.json` and `later-guardians.json`.

## Validation

`npm run test:reference-guardians` checks indexed geometry, normalized normals, all five exported armatures, asset budgets, head/mouth recoil, walking and attack animation, disposal, nine fox tails, and the absence of wings on Thủy Long. The preview tool captures front/back/three-quarter and action views in the game's Three.js renderer.
