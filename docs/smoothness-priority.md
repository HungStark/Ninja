# Performance with the original graphics

The original presentation has been restored after feedback:

- Desktop starts on Medium; Android retains its original Low default.
- Antialiasing and the original composer/output pipeline are restored.
- Pixel density follows the original quality presets (1.7/1.25/1 maximum DPR).
  There is no automatic resolution reduction or additional 720p pixel cap.
- Fire projectiles retain their original outer glow, spiral ribbons and tails
  at every quality, following the original staged/flying visibility rules.

The optimizations that preserve the image remain:

- Practice fence posts/rails share one merged geometry per row. Dimensions,
  materials, divider positions and snow-receiving surfaces are unchanged.
- Unchanged seal slots and cooldown text/attributes are not rewritten.
- Identically shaped fire ribbons share geometry across casts. Each projectile
  retains its own transform and material. Despawning one does not dispose the
  geometry used by another. The runtime uses a fixed set of ribbon shapes.

Run `npm run test:low-graphics` for rendering/defaults/quality restoration,
exploration and spell compatibility, plus `node tests/fire-ribbon-cache-core.mjs`
for shared-geometry lifetime checks.

The earlier 35% draw-call improvement included reduced visual detail; it does
not describe this restored version. Device FPS has not been measured.

The restored eight-volley fixture retains 40 fewer draw calls than the original
unoptimized geometry, with all authored effect layers present. A 915×412 canvas
comparison against the original fire/fence code matched all pixels on Low;
Medium differed at 4 of 376,980 pixels (maximum channel difference 14/255).
Reports and comparison images are in `test-results/restored-graphics/`.
