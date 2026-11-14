# Performance changes preserving the original presentation

This revision keeps the existing quality presets, pixel density, materials,
lighting, spell layers, damage and AI timing.

## 1. Spatial rendering

The village terrain retains every original vertex, normal, UV, color and
triangle. Indexed cell meshes share the original vertex attributes, with bounds
computed from each cell's actual indices. The original terrain mesh remains
available to terrain tools; its render layers are disabled.

Only large opaque scenery batches are split into spatial cells. Small batches
and transparent material ordering stay as before. River gravel is packed by
visible spatial cells into its existing single draw call. This applies only to
static opaque decoration without instance colors or shadow casting. Source
matrices are retained and restored exactly when the camera turns back.
Off-screen shadow casters are not removed by this camera-only optimization.

At 915×412, nine reference views across Fire, Water and Wood matched all pixels.
Submitted triangles decreased by roughly 12–31%, depending on view. Cell meshes
add 5–11 draw calls in those scenes, so this trades a small submission overhead
for less vertex processing. It is not a universal FPS guarantee.

## 2. Combat submission

Opaque fire-orb cores now share an InstancedMesh and their original shader,
including the same local flame deformation. Transparent shells, ribbons,
sprites and tails keep their original meshes, order and blending.

The 24-projectile fixture decreased from 814 to 791 draw calls on Medium and
640 to 617 on Low. Low matched all pixels; Medium differed at one of 376,980
pixels (maximum channel delta 22/255), consistent with instanced edge arithmetic.

## 3. Reuse and transient allocations

Fire-orb groups are reused with a maximum retained pool of 32. Normal 24-orb
waves allocate 24 groups once and reuse them in the next wave. Excess peak
groups are released rather than retained. Reset disposes the instance buffer.
Live-shot/wall sets and vectors/quaternions/matrices used for dragon animation
are reused. Sprite geometry shared by Three.js is no longer disposed with each
individual projectile; its individual sprite material is still released.

## 4. CPU collision and navigation

Static obstacle tests now query a spatial index after scene construction.
Building placement still uses the original full scan while the map is built.
The index rebuilds if obstacle count changes. Its exact half-extent predicate
and order are unchanged. Character collision grids and the existing A* heap
and per-search cache remain intact; no AI reactions are throttled.

Ten thousand deterministic index queries matched the full scan. Thirty actual
Fire-village pathfinding requests returned identical routes. An initial Node
comparison measured approximately 279→260 ms total for those requests; this
timing is environment-dependent.

## 5. GPU resource lifetime

Scene cleanup now disposes InstancedMesh resources, shadow-only materials and
owned material/uniform textures, while preserving tagged shared character
textures. Shared geometries/materials/textures are disposed once per cleanup.

Before this change, Fire/Water/Fire/Water revisits retained about 70 additional
live WebGL buffers per two-map cycle. After the change, repeated visits stayed
at 2,009 buffers for Fire and 1,075 for Water; texture counts also plateaued.
These are instrumented WebGL handles, not measured device RAM usage.

## Verification

- npm run test:performance-five
- node tests/fire-ribbon-cache-core.mjs
- node tests/enemy-movement-core.mjs
- node tests/combat-scene-revision-browser.cjs

Reports/images are in test-results/five-directions/, including views/report.json,
combat/report.json, navigation-before.json, navigation-after.json, and repeated-map
resource snapshots. Renderer timings collected under concurrent headless
SwiftShader runs are noisy; use geometry/submission/lifetime counts here, then
profile CPU/GPU frame times on the intended device.

Three older tests also fail against the source baseline: adventure-core.mjs
expects removed mentor NPCs, landscape-core.mjs lacks the current solidMesh
fixture helper, and scenery-collision-core.mjs asserts an outdated Water depth.
Their baseline failures are recorded in legacy-baseline.json; they were not
treated as passing checks for this revision.
