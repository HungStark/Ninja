import * as T from 'three';

// All solid spell surfaces share the approved four-band cel palette.
const bands = new T.DataTexture(new Uint8Array([80, 155, 218, 255]), 4, 1, T.RedFormat);
bands.minFilter = bands.magFilter = T.NearestFilter;
bands.generateMipmaps = false;
bands.needsUpdate = true;

export function vfxToon(color, options = {}) {
  return new T.MeshToonMaterial({ color, gradientMap: bands, ...options });
}
