# Character performance and dialogue portraits

Dialogue portraits are **build-time model renders**, not a second WebGL scene
created while opening a conversation. `model-portrait.js` only loads WebP images.
The pre-battle VS screen reads the same catalog instead of constructing and
rendering another set of characters before each fight.
The pre-battle VS screen reads the same catalog instead of constructing and
rendering another set of characters before each fight.
`portrait-key.js` selects the correct village, named resident, Hạ Ly state or
hero armor/coat combination; changing a name or ammunition does not invalidate
the image. Pending loads cannot replace a newer speaker or a closed dialogue.

The browser character factories now start with controller groups only; they do
not build the old procedural body, hair, uniform or duplicate equipment while
waiting for GLB/VRM. NPC workstations and held tools are still created and attach
to the loaded rig. The old procedural geometry remains available for explicit
procedural/native validation. The initial loading screen waits for the current
character models and reports a model-loading error if an asset fails. Hero and
resident resting poses are applied before their ready promises resolve, avoiding
an initial A-pose. `test:character-loading` delays actual model requests and checks
zero legacy body meshes before/after loading, source reuse, cancellation and the
startup success/failure screens.

Regenerate images after changing model appearance:

```powershell
& '.tools/node-v24.21.0-win-x64/node.exe' tools/build-portraits.mjs
```

`portrait-presets.js` and `portrait-renderer.js` are builder-only modules. The
catalog contains 453 presets deduplicated into 293 WebP files (1,387,022 bytes),
at 256×304. The static server uses content-hashed filenames and immutable image
caching; Android and web packaging include the same assets. The game keeps a
neutral initials placeholder if an image fails rather than starting a costly
runtime 3D renderer. Guardians, ten village ninja styles, the wounded/standing
Hạ Ly, named residents, village chiefs and all 53 hero armor choices are covered.

`character-budget.js` schedules exploration visuals independently of gameplay:

- Near characters animate at 30 Hz; medium distance at 12 Hz; distant at 4 Hz.
- Character render ranges are 110/85/65 world units for high/medium/low quality.
- Ink passes are limited to 20 units; shadow casters to 28 units. Low quality
  disables these extra character passes. Contact shadows skip culled actors.
- Quest markers, collisions, guard detection/pathfinding, following, tools and
  hand-sign IK retain their existing logic. Combat rigs use their normal update.
- A late-loaded model joins the same visual budget. Hidden disguised guards
  keep their gameplay visibility; the budget controls a separate render group.

Repeated paused updates and background 3D draws stop during dialogue. Closing
the dialogue or resizing resumes/refreshes the view. Shared source textures
survive map changes; disposed residents cancel pending attachment and release
their own materials/skeleton textures.

Run the payload optimizer after rebuilding derived character assets:

```powershell
& '.tools/blender-4.5.9-windows-x64/blender.exe' --background --python tools/optimize-character-runtime.py
```

It removes unused morph targets, normal maps, matcaps and thumbnails, preserving
UVs, skin weights, bone transforms, bind matrices, used expression deltas and
author/license metadata. Original supplied models are untouched. The four
optimized runtime models total 19,647,300 bytes, previously 38,182,864 bytes.
NPC face targets decrease from 57 to 16; unused hero face morphs are removed.
Runtime build output omits five unused original models (52,566,976 bytes) while
keeping their source copies in `assets/`.

Measured in the Fire Village fixture (27 character roots, 915×412, medium
quality, headless Edge/SwiftShader; not an FPS guarantee for a user's device):

| Metric | Before | After |
| --- | ---: | ---: |
| First portrait | 4,787.9 ms | 70.6 ms |
| Average world update | 3.12 ms | 0.79 ms |
| p95 world update | 4.9 ms | 2.2 ms |
| Render calls including shadows | 928 | 588 |
| Rendered triangles including extra passes | 998,144 | 549,279 |
| Allocated renderer textures | 368 | 196 |

Validation: `npm run test:character-performance`, plus character style/motion,
resident activity, village ninja seals, guard ambush, village-event, interior,
presentation and server tests. Reports and captures are under
`test-results/character-performance` and `test-results/model-portraits`.
