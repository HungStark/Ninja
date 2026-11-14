// Only the 3D drawing buffer changes; DOM controls and gameplay keep their cadence.
export const RENDER_PIXEL_BUDGETS = [1920 * 1080, 1600 * 900, 1280 * 720];

export function renderPixelRatio(width, height, deviceRatio, quality, scale = 1) {
  const ratio = Math.min(deviceRatio || 1, [1.7, 1.25, 1][quality]);
  return Math.min(ratio, Math.sqrt(RENDER_PIXEL_BUDGETS[quality] / Math.max(1, width * height))) * scale;
}

export function createRenderBudget() {
  let scale = 1, elapsed = 0, frames = 0, recovery = 0, averageMs = 0;
  function reset() { elapsed = frames = recovery = 0; }
  return {
    reset,
    sample(ms, active = true) {
      // Loading, background tabs and pauses are not evidence of a GPU bottleneck.
      if (!active || !Number.isFinite(ms) || ms <= 0 || ms > 250) { reset(); return false; }
      elapsed += ms; frames++;
      if (elapsed < 1250) return false;
      averageMs = elapsed / frames;
      recovery = averageMs < 17.5 ? recovery + elapsed : 0;
      const previous = scale;
      if (averageMs > 22) { scale = Math.max(.6, Math.round((scale - .1) * 100) / 100); recovery = 0; }
      else if (recovery >= 5000) { scale = Math.min(1, Math.round((scale + .05) * 100) / 100); recovery = 0; }
      elapsed = frames = 0;
      return previous !== scale;
    },
    state: () => ({ scale, averageMs })
  };
}
