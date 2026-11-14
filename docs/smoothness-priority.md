# Smoothness priority

The game starts on Low on desktop and Android. Medium and High remain available.

- Low combat renders straight to the canvas, bypassing the HDR/composer/output
  passes. Unused postprocessing buffers stay at 1×1, including after resizing or
  returning from another quality setting. Default-framebuffer MSAA is disabled;
  Medium/High retain their postprocessing MSAA.
- 3D pixel ceilings are 1280×720 (Low), 1600×900 (Medium), and 1920×1080 (High).
  Smaller viewports retain their existing pixel density. DOM text, menus and
  touch targets retain their CSS resolution and dimensions.
- Real frame intervals are sampled in 1.25-second windows during active play.
  A mean above 22 ms reduces the rendering scale by 0.1, to a minimum of 0.6.
  Five seconds of windows below 17.5 ms restores 0.05 at a time. Pauses, menus,
  hidden tabs and stalls above 250 ms reset the sampling window. Tests using
  deterministic simulation steps do not trigger automatic adaptation.
- Practice fence posts/rails share one merged geometry per row. Divider
  positions, movement boundaries and ordinary snow-receiving geometry remain.
- Low fire projectiles retain the solid core, glow sprite and two flame tails,
  omitting the outer shell and spiral ribbons. Switching quality restores the
  existing detail. Projectile counts, flight, collisions and damage are unchanged.
- Unchanged seal slots and cooldown text/attributes are no longer rewritten.
  Input and aiming still update on their original cadence.

Validation: `npm run test:low-graphics`, practice-overhead and snowfall core
checks, and desktop/touch combat-scene regression tests.

The existing eight-volley Low fixture measured 670→437 draw calls on desktop
and 674→441 on mobile (about 35% fewer). These are deterministic test-scene draw
counts from headless Edge/SwiftShader, not device FPS measurements. Reports and
screenshots are in `test-results/low-graphics/`.

The separate `practice-guardian-zones-browser.cjs` test currently fails its
two-axis idle-patrol assertion. The same assertion also fails with the original
`HEAD:game.js` bundle; this is a pre-existing failure, outside the renderer change.
